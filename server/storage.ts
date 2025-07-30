import { 
  users, type User, type InsertUser, 
  restaurants, type Restaurant, type InsertRestaurant,
  waitlistEntries, type WaitlistEntry, type InsertWaitlistEntry,
  tableTypes, type TableType, type InsertTableType,
  timeSlotPromotions,
  partySizeWaitTimes, type PartySizeWaitTime, type InsertPartySizeWaitTime,
  dailyAnalytics, type DailyAnalytics, type InsertDailyAnalytics,
  hourlyAnalytics, type HourlyAnalytics, type InsertHourlyAnalytics,
  tableAnalytics, type TableAnalytics, type InsertTableAnalytics,
  type WaitStatus, type WaitlistStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, gte, lte, and, sql } from "drizzle-orm";

// Define the storage interface
// Define TimeSlotPromotion type from schema
type TimeSlotPromotion = typeof timeSlotPromotions.$inferSelect;
type InsertTimeSlotPromotion = typeof timeSlotPromotions.$inferInsert;

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser & { 
    isVerified?: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
  }): Promise<User>;
  updateUserVerification(
    id: number, 
    isVerified: boolean, 
    verificationToken?: string | null,
    verificationExpires?: Date | null
  ): Promise<User | undefined>;
  updateUserProfile(
    id: number,
    data: { username: string; phone: string }
  ): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserResetToken(
    userId: number, 
    token: string | null, 
    expires: Date | null, 
    method: string | null
  ): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  
  // Replit Auth specific operations
  getUserByReplitId(replitUserId: string): Promise<User | undefined>;
  upsertUserByReplit(replitUser: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }): Promise<User>;
  
  // Time slot promotion operations
  getTimeSlotPromotions(restaurantId: number): Promise<TimeSlotPromotion[]>;
  updateTimeSlotPromotion(restaurantId: number, timeSlot: string, discount: number): Promise<TimeSlotPromotion>;
  createTimeSlotPromotions(restaurantId: number, promotions: {timeSlot: string, discount: number}[]): Promise<TimeSlotPromotion[]>;
  
  // Party size wait times operations
  getPartySizeWaitTimes(restaurantId: number): Promise<PartySizeWaitTime[]>;
  updatePartySizeWaitTime(restaurantId: number, partySize: string, waitTimeMinutes: number): Promise<PartySizeWaitTime>;
  createPartySizeWaitTime(waitTime: InsertPartySizeWaitTime): Promise<PartySizeWaitTime>;
  
  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurantsByOwnerId(userId: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined>;
  updateWaitTime(id: number, status: WaitStatus, customTime?: number): Promise<Restaurant | undefined>;
  searchRestaurants(query: string): Promise<Restaurant[]>;
  
  // Table type operations
  getTableTypes(restaurantId: number): Promise<TableType[]>;
  getTableType(id: number): Promise<TableType | undefined>;
  createTableType(tableType: InsertTableType): Promise<TableType>;
  updateTableType(id: number, data: Partial<TableType>): Promise<TableType | undefined>;
  deleteTableType(id: number): Promise<boolean>;
  
  // Waitlist operations
  getWaitlistEntries(restaurantId: number): Promise<WaitlistEntry[]>;
  getWaitlistEntry(id: number): Promise<WaitlistEntry | undefined>;
  getWaitlistEntryByConfirmationCode(code: string): Promise<WaitlistEntry | undefined>;
  createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  updateWaitlistEntry(id: number, data: Partial<WaitlistEntry>): Promise<WaitlistEntry | undefined>;
  createRemoteWaitlistEntry(entry: InsertWaitlistEntry & { isRemote: true, expectedArrivalTime: Date }): Promise<WaitlistEntry>;
  confirmRemoteArrival(confirmationCode: string): Promise<WaitlistEntry | undefined>;
  
  // QR code operations
  generateRestaurantQrCode(restaurantId: number): Promise<string>;
  getRestaurantByQrCodeId(qrCodeId: string): Promise<Restaurant | undefined>;
  
  // Analytics operations
  getDailyAnalytics(restaurantId: number, startDate?: Date, endDate?: Date): Promise<DailyAnalytics[]>;
  getHourlyAnalytics(restaurantId: number, date: Date): Promise<HourlyAnalytics[]>;
  getTableAnalytics(restaurantId: number, startDate?: Date, endDate?: Date): Promise<TableAnalytics[]>;
  createDailyAnalytics(data: InsertDailyAnalytics): Promise<DailyAnalytics>;
  createHourlyAnalytics(data: InsertHourlyAnalytics): Promise<HourlyAnalytics>;
  createTableAnalytics(data: InsertTableAnalytics): Promise<TableAnalytics>;
  generateAnalyticsFromWaitlist(restaurantId: number, date: Date): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Time slot promotion operations
  async getTimeSlotPromotions(restaurantId: number): Promise<TimeSlotPromotion[]> {
    return await db
      .select()
      .from(timeSlotPromotions)
      .where(eq(timeSlotPromotions.restaurantId, restaurantId));
  }
  
  async updateTimeSlotPromotion(restaurantId: number, timeSlot: string, discount: number): Promise<TimeSlotPromotion> {
    // First check if it exists
    const [existing] = await db
      .select()
      .from(timeSlotPromotions)
      .where(
        and(
          eq(timeSlotPromotions.restaurantId, restaurantId),
          eq(timeSlotPromotions.timeSlot, timeSlot)
        )
      );
    
    if (existing) {
      // Update existing promotion
      const [updated] = await db
        .update(timeSlotPromotions)
        .set({ discount })
        .where(
          and(
            eq(timeSlotPromotions.restaurantId, restaurantId),
            eq(timeSlotPromotions.timeSlot, timeSlot)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new promotion
      const [created] = await db
        .insert(timeSlotPromotions)
        .values({
          restaurantId,
          timeSlot,
          discount
        })
        .returning();
      return created;
    }
  }
  
  async createTimeSlotPromotions(restaurantId: number, promotions: {timeSlot: string, discount: number}[]): Promise<TimeSlotPromotion[]> {
    const createdPromotions: TimeSlotPromotion[] = [];
    
    // Process each promotion
    for (const { timeSlot, discount } of promotions) {
      const promotion = await this.updateTimeSlotPromotion(restaurantId, timeSlot, discount);
      createdPromotions.push(promotion);
    }
    
    return createdPromotions;
  }

  // Party size wait times operations
  async getPartySizeWaitTimes(restaurantId: number): Promise<PartySizeWaitTime[]> {
    return db
      .select()
      .from(partySizeWaitTimes)
      .where(eq(partySizeWaitTimes.restaurantId, restaurantId));
  }

  async updatePartySizeWaitTime(restaurantId: number, partySize: string, waitTimeMinutes: number): Promise<PartySizeWaitTime> {
    // First check if it exists
    const [existing] = await db
      .select()
      .from(partySizeWaitTimes)
      .where(
        and(
          eq(partySizeWaitTimes.restaurantId, restaurantId),
          eq(partySizeWaitTimes.partySize, partySize)
        )
      );
    
    if (existing) {
      // Update existing wait time
      const [updated] = await db
        .update(partySizeWaitTimes)
        .set({ 
          waitTimeMinutes,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(partySizeWaitTimes.restaurantId, restaurantId),
            eq(partySizeWaitTimes.partySize, partySize)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new wait time
      const [created] = await db
        .insert(partySizeWaitTimes)
        .values({
          restaurantId,
          partySize,
          waitTimeMinutes
        })
        .returning();
      return created;
    }
  }

  async createPartySizeWaitTime(waitTime: InsertPartySizeWaitTime): Promise<PartySizeWaitTime> {
    const [created] = await db
      .insert(partySizeWaitTimes)
      .values(waitTime)
      .returning();
    return created;
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone));
    
    // If multiple users have the same phone, return the one with the most recent reset token activity
    if (result.length > 1) {
      const usersWithResetTokens = result.filter(user => user.resetPasswordToken && user.resetPasswordExpires);
      if (usersWithResetTokens.length > 0) {
        // Return the user with the most recent reset token
        return usersWithResetTokens.sort((a, b) => 
          (b.resetPasswordExpires?.getTime() || 0) - (a.resetPasswordExpires?.getTime() || 0)
        )[0];
      }
    }
    
    return result[0];
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.verificationToken, token));
    return result[0];
  }

  async createUser(insertUser: InsertUser & { 
    isVerified?: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
  }): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUserVerification(
    id: number, 
    isVerified: boolean, 
    verificationToken?: string | null,
    verificationExpires?: Date | null
  ): Promise<User | undefined> {
    const updateData: any = { isVerified };
    
    if (verificationToken !== undefined) {
      updateData.verificationToken = verificationToken;
    }
    
    if (verificationExpires !== undefined) {
      updateData.verificationExpires = verificationExpires;
    }
    
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return result[0];
  }

  async updateUserProfile(
    id: number,
    data: { username: string; phone: string }
  ): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ 
        username: data.username, 
        phone: data.phone 
      })
      .where(eq(users.id, id))
      .returning();
      
    return result[0];
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return result[0];
  }

  async updateUserResetToken(
    userId: number, 
    token: string | null, 
    expires: Date | null, 
    method: string | null
  ): Promise<void> {
    await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
        resetPasswordMethod: method,
      })
      .where(eq(users.id, userId))
      .execute();
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        resetPasswordMethod: null,
      })
      .where(eq(users.id, userId))
      .execute();
  }

  // Replit Auth specific operations
  async getUserByReplitId(replitUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitUserId, replitUserId));
    return user;
  }

  async upsertUserByReplit(replitUser: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByReplitId(replitUser.id);
    
    if (existingUser) {
      // Update existing user with latest Replit data
      const [updatedUser] = await db
        .update(users)
        .set({
          email: replitUser.email || existingUser.email,
          firstName: replitUser.firstName || existingUser.firstName,
          lastName: replitUser.lastName || existingUser.lastName,
          profileImageUrl: replitUser.profileImageUrl || existingUser.profileImageUrl,
          isVerified: true, // Replit users are automatically verified
        })
        .where(eq(users.replitUserId, replitUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user from Replit data
      const [newUser] = await db
        .insert(users)
        .values({
          replitUserId: replitUser.id,
          username: replitUser.email?.split('@')[0] || `replit_user_${replitUser.id.slice(-8)}`,
          password: '', // No password needed for Replit auth
          email: replitUser.email || `${replitUser.id}@replit.local`,
          firstName: replitUser.firstName,
          lastName: replitUser.lastName,
          profileImageUrl: replitUser.profileImageUrl,
          isVerified: true, // Replit users are automatically verified
          role: 'customer'
        })
        .returning();
      return newUser;
    }
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const result = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return result[0];
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants);
  }

  async getRestaurantsByOwnerId(userId: number): Promise<Restaurant[]> {
    return db.select().from(restaurants).where(eq(restaurants.userId, userId));
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const result = await db.insert(restaurants).values(insertRestaurant).returning();
    return result[0];
  }

  async updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const result = await db
      .update(restaurants)
      .set(data)
      .where(eq(restaurants.id, id))
      .returning();
    
    return result[0];
  }

  async updateWaitTime(id: number, status: WaitStatus, customTime?: number): Promise<Restaurant | undefined> {
    const result = await db
      .update(restaurants)
      .set({
        currentWaitStatus: status,
        customWaitTime: customTime || 0
      })
      .where(eq(restaurants.id, id))
      .returning();
    
    return result[0];
  }

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return db
      .select()
      .from(restaurants)
      .where(
        or(
          like(restaurants.name, searchQuery),
          like(restaurants.cuisine, searchQuery),
          like(restaurants.address, searchQuery)
        )
      );
  }
  
  // Table type operations
  async getTableTypes(restaurantId: number): Promise<TableType[]> {
    return db
      .select()
      .from(tableTypes)
      .where(eq(tableTypes.restaurantId, restaurantId));
  }
  
  async getTableType(id: number): Promise<TableType | undefined> {
    const result = await db
      .select()
      .from(tableTypes)
      .where(eq(tableTypes.id, id));
    return result[0];
  }
  
  async createTableType(tableType: InsertTableType): Promise<TableType> {
    const result = await db
      .insert(tableTypes)
      .values(tableType)
      .returning();
    return result[0];
  }
  
  async updateTableType(id: number, data: Partial<TableType>): Promise<TableType | undefined> {
    const result = await db
      .update(tableTypes)
      .set(data)
      .where(eq(tableTypes.id, id))
      .returning();
    return result[0];
  }
  
  async deleteTableType(id: number): Promise<boolean> {
    const result = await db
      .delete(tableTypes)
      .where(eq(tableTypes.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Waitlist operations
  async getWaitlistEntries(restaurantId: number): Promise<WaitlistEntry[]> {
    return db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.restaurantId, restaurantId));
  }
  
  async getWaitlistEntriesByRestaurantId(restaurantId: number): Promise<WaitlistEntry[]> {
    return db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.restaurantId, restaurantId));
  }
  
  async getWaitlistEntry(id: number): Promise<WaitlistEntry | undefined> {
    const result = await db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.id, id));
    return result[0];
  }
  
  async getWaitlistEntryByConfirmationCode(code: string): Promise<WaitlistEntry | undefined> {
    const result = await db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.confirmationCode, code));
    return result[0];
  }
  
  async createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    // Ensure required fields are present
    if (!entry.queuePosition) {
      // Get current queue position if not provided
      const entries = await this.getWaitlistEntriesByRestaurantId(entry.restaurantId);
      entry.queuePosition = entries.length + 1;
    }
    
    // Calculate estimated wait time if not provided
    if (!entry.estimatedWaitTime) {
      const restaurant = await this.getRestaurant(entry.restaurantId);
      if (restaurant) {
        // Base wait time of 15 minutes per position ahead
        entry.estimatedWaitTime = Math.max(5, (entry.queuePosition - 1) * 15);
        
        // Apply custom wait time if restaurant has one set
        if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
          entry.estimatedWaitTime = restaurant.customWaitTime;
        }
      } else {
        entry.estimatedWaitTime = 15; // Default fallback
      }
    }
    
    const result = await db
      .insert(waitlistEntries)
      .values(entry)
      .returning();
    return result[0];
  }
  
  async updateWaitlistEntry(id: number, data: Partial<WaitlistEntry>): Promise<WaitlistEntry | undefined> {
    const result = await db
      .update(waitlistEntries)
      .set(data)
      .where(eq(waitlistEntries.id, id))
      .returning();
    return result[0];
  }
  
  async createRemoteWaitlistEntry(entry: InsertWaitlistEntry & { isRemote: true, expectedArrivalTime: Date }): Promise<WaitlistEntry> {
    // Ensure required fields are present
    if (!entry.queuePosition) {
      // Get current queue position if not provided
      const entries = await this.getWaitlistEntriesByRestaurantId(entry.restaurantId);
      entry.queuePosition = entries.length + 1;
    }
    
    // Calculate estimated wait time if not provided
    if (!entry.estimatedWaitTime) {
      const restaurant = await this.getRestaurant(entry.restaurantId);
      if (restaurant) {
        // Base wait time of 15 minutes per position ahead
        entry.estimatedWaitTime = Math.max(5, (entry.queuePosition - 1) * 15);
        
        // Apply custom wait time if restaurant has one set
        if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
          entry.estimatedWaitTime = restaurant.customWaitTime;
        }
      } else {
        entry.estimatedWaitTime = 15; // Default fallback
      }
    }
    
    // Generate a confirmation code for all remote entries
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create the entry with all required fields
    const waitlistData = {
      ...entry,
      status: entry.status || 'remote_pending',
      confirmationCode,
      // Ensure other required fields are present
      arrivedAt: null
    };
    
    const result = await db
      .insert(waitlistEntries)
      .values(waitlistData)
      .returning();
    return result[0];
  }
  
  async confirmRemoteArrival(confirmationCode: string): Promise<WaitlistEntry | undefined> {
    const entry = await this.getWaitlistEntryByConfirmationCode(confirmationCode);
    
    if (!entry) {
      return undefined;
    }
    
    return this.updateWaitlistEntry(entry.id, {
      status: 'remote_confirmed',
      arrivedAt: new Date()
    });
  }
  
  // QR code operations
  async generateRestaurantQrCode(restaurantId: number): Promise<string> {
    // Generate a unique QR code ID for this restaurant
    const qrCodeId = `r-${restaurantId}-${Date.now()}`;
    
    // Update the restaurant with this QR code ID
    await db
      .update(restaurants)
      .set({ qrCodeId })
      .where(eq(restaurants.id, restaurantId));
    
    return qrCodeId;
  }
  
  async getRestaurantByQrCodeId(qrCodeId: string): Promise<Restaurant | undefined> {
    const result = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.qrCodeId, qrCodeId));
    return result[0];
  }
  
  // Analytics operations
  async getDailyAnalytics(restaurantId: number, startDate?: Date, endDate?: Date): Promise<DailyAnalytics[]> {
    let conditions = [eq(dailyAnalytics.restaurantId, restaurantId)];
    
    if (startDate) {
      conditions.push(gte(dailyAnalytics.date, startDate.toISOString().split('T')[0]));
    }
    
    if (endDate) {
      conditions.push(lte(dailyAnalytics.date, endDate.toISOString().split('T')[0]));
    }
    
    return db
      .select()
      .from(dailyAnalytics)
      .where(and(...conditions));
  }
  
  async getHourlyAnalytics(restaurantId: number, date: Date): Promise<HourlyAnalytics[]> {
    const formattedDate = date.toISOString().split('T')[0];
    
    return db
      .select()
      .from(hourlyAnalytics)
      .where(and(
        eq(hourlyAnalytics.restaurantId, restaurantId),
        eq(hourlyAnalytics.date, formattedDate)
      ));
  }
  
  async getTableAnalytics(restaurantId: number, startDate?: Date, endDate?: Date): Promise<TableAnalytics[]> {
    let conditions = [eq(tableAnalytics.restaurantId, restaurantId)];
    
    if (startDate) {
      conditions.push(gte(tableAnalytics.date, startDate.toISOString().split('T')[0]));
    }
    
    if (endDate) {
      conditions.push(lte(tableAnalytics.date, endDate.toISOString().split('T')[0]));
    }
    
    return db
      .select()
      .from(tableAnalytics)
      .where(and(...conditions));
  }
  
  async createDailyAnalytics(data: InsertDailyAnalytics): Promise<DailyAnalytics> {
    const result = await db
      .insert(dailyAnalytics)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }
  
  async createHourlyAnalytics(data: InsertHourlyAnalytics): Promise<HourlyAnalytics> {
    const result = await db
      .insert(hourlyAnalytics)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }
  
  async createTableAnalytics(data: InsertTableAnalytics): Promise<TableAnalytics> {
    const result = await db
      .insert(tableAnalytics)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }
  
  async generateAnalyticsFromWaitlist(restaurantId: number, date: Date): Promise<boolean> {
    // Get all waitlist entries for this restaurant on this date
    const formattedDate = date.toISOString().split('T')[0];
    const startOfDay = new Date(formattedDate);
    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const entries = await db
      .select()
      .from(waitlistEntries)
      .where(and(
        eq(waitlistEntries.restaurantId, restaurantId),
        gte(sql`${waitlistEntries.createdAt}`, startOfDay),
        lte(sql`${waitlistEntries.createdAt}`, endOfDay)
      ));
    
    if (entries.length === 0) {
      return false;
    }
    
    // Process data for daily analytics
    const totalCustomers = entries.reduce((sum: number, entry: WaitlistEntry) => sum + entry.partySize, 0);
    const totalParties = entries.length;
    const averagePartySize = totalParties > 0 ? totalCustomers / totalParties : 0;
    const waitTimes = entries.map((entry: WaitlistEntry) => entry.estimatedWaitTime);
    const averageWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((sum: number, time: number) => sum + time, 0) / waitTimes.length 
      : 0;
    const peakWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const cancelledWaitlist = entries.filter((entry: WaitlistEntry) => entry.status === 'cancelled').length;
    
    // Create daily analytics record
    await this.createDailyAnalytics({
      restaurantId,
      date: formattedDate,
      totalCustomers,
      averageWaitTime,
      peakWaitTime,
      totalParties,
      averagePartySize: averagePartySize.toFixed(2),
      cancelledWaitlist,
      turnoverRate: totalParties > 0 ? (totalParties / 12).toFixed(2) : null, // Assuming 12 hours of operation
      revenue: null // Revenue data would come from POS system integration
    });
    
    // Process data for hourly analytics
    const hourCounts = new Array(24).fill(0);
    const hourlyWaitTimes = Array(24).fill(0).map(() => []);
    const hourlySeated = Array(24).fill(0);
    
    entries.forEach(entry => {
      if (entry.createdAt) {
        const hour = new Date(entry.createdAt).getHours();
        hourCounts[hour] += entry.partySize;
        hourlyWaitTimes[hour].push(entry.estimatedWaitTime);
        
        if (entry.status === 'seated' && entry.seatedAt) {
          const seatedHour = new Date(entry.seatedAt).getHours();
          hourlySeated[seatedHour]++;
        }
      }
    });
    
    // Create hourly analytics records
    for (let hour = 0; hour < 24; hour++) {
      if (hourCounts[hour] > 0) {
        const avgWaitTime = hourlyWaitTimes[hour].length > 0
          ? hourlyWaitTimes[hour].reduce((sum, time) => sum + time, 0) / hourlyWaitTimes[hour].length
          : 0;
          
        await this.createHourlyAnalytics({
          restaurantId,
          date: formattedDate,
          hour,
          customers: hourCounts[hour],
          averageWaitTime: Math.round(avgWaitTime),
          partiesSeated: hourlySeated[hour]
        });
      }
    }
    
    // Process data for table analytics
    const tableTypeUsage = new Map<number, number>();
    const tableTurnoverTimes = new Map<number, number[]>();
    
    entries.forEach(entry => {
      if (entry.tableTypeId && entry.status === 'seated') {
        // Count usage of this table type
        const currentCount = tableTypeUsage.get(entry.tableTypeId) || 0;
        tableTypeUsage.set(entry.tableTypeId, currentCount + 1);
        
        // Calculate turnover time if we have both arrival and seating times
        if (entry.arrivedAt && entry.seatedAt) {
          const turnoverMinutes = Math.round(
            (new Date(entry.seatedAt).getTime() - new Date(entry.arrivedAt).getTime()) / 60000
          );
          
          const times = tableTurnoverTimes.get(entry.tableTypeId) || [];
          times.push(turnoverMinutes);
          tableTurnoverTimes.set(entry.tableTypeId, times);
        }
      }
    });
    
    // Get all table types for this restaurant
    const tableTypesData = await this.getTableTypes(restaurantId);
    
    // Create table analytics records for each table type
    for (const type of tableTypesData) {
      const usage = tableTypeUsage.get(type.id) || 0;
      const turnoverTimes = tableTurnoverTimes.get(type.id) || [];
      const avgTurnover = turnoverTimes.length > 0
        ? turnoverTimes.reduce((sum, time) => sum + time, 0) / turnoverTimes.length
        : type.estimatedTurnoverTime; // Use default if no data
      
      // Calculate utilization as percentage of time tables were occupied
      // Assuming 12-hour operating day
      const totalTablesMinutes = type.count * 12 * 60; // total available minutes
      const usedMinutes = usage * avgTurnover; // minutes tables were in use
      const utilization = totalTablesMinutes > 0 
        ? (usedMinutes / totalTablesMinutes) * 100
        : 0;
      
      await this.createTableAnalytics({
        restaurantId,
        tableTypeId: type.id,
        date: formattedDate,
        totalUsage: usage,
        averageTurnoverTime: Math.round(avgTurnover),
        utilization: utilization.toFixed(2)
      });
    }
    
    return true;
  }

  // Initialize database with sample data if needed
  async initSampleData() {
    // First check if there are any users
    const userCount = await db.select({ count: users.id }).from(users);
    
    // If no users exist, create sample data
    if (userCount.length === 0 || userCount[0].count === 0) {
      // Create sample restaurant owner
      const [restaurantOwner] = await db.insert(users).values({
        username: 'restaurant_owner',
        password: 'password123',
        email: 'owner@tablequeue.com',
        role: 'restaurant'
      }).returning();

      // Create sample restaurants
      const sampleRestaurants = [
        {
          userId: restaurantOwner.id,
          name: "The Italian Place",
          address: "123 Main Street, San Francisco, CA 94101",
          description: "Authentic Italian cuisine with homemade pasta and wood-fired pizza.",
          cuisine: "Italian",
          priceRange: "$$$",
          phoneNumber: "(415) 555-1234",
          latitude: "37.7749",
          longitude: "-122.4194",
          currentWaitStatus: "available",
          customWaitTime: 0,
          operatingHours: {
            monday: { open: "11:00 AM", close: "10:00 PM" },
            tuesday: { open: "11:00 AM", close: "10:00 PM" },
            wednesday: { open: "11:00 AM", close: "10:00 PM" },
            thursday: { open: "11:00 AM", close: "10:00 PM" },
            friday: { open: "11:00 AM", close: "11:00 PM" },
            saturday: { open: "10:00 AM", close: "11:00 PM" },
            sunday: { open: "10:00 AM", close: "9:00 PM" }
          },
          features: ["Outdoor Seating", "Full Bar", "Takeout", "Delivery"],
          rating: "4.7",
          reviewCount: 324,
          useAdvancedQueue: true
        },
        {
          userId: restaurantOwner.id,
          name: "Burger & Co.",
          address: "456 Market Street, San Francisco, CA 94102",
          description: "Gourmet burgers made with locally sourced ingredients and craft beers.",
          cuisine: "American",
          priceRange: "$$",
          phoneNumber: "(415) 555-5678",
          latitude: "37.7942",
          longitude: "-122.3952",
          currentWaitStatus: "short",
          customWaitTime: 15,
          operatingHours: {
            monday: { open: "11:00 AM", close: "9:00 PM" },
            tuesday: { open: "11:00 AM", close: "9:00 PM" },
            wednesday: { open: "11:00 AM", close: "9:00 PM" },
            thursday: { open: "11:00 AM", close: "9:00 PM" },
            friday: { open: "11:00 AM", close: "10:00 PM" },
            saturday: { open: "11:00 AM", close: "10:00 PM" },
            sunday: { open: "11:00 AM", close: "8:00 PM" }
          },
          features: ["Kid Friendly", "Full Bar", "Takeout"],
          rating: "4.2",
          reviewCount: 187,
          useAdvancedQueue: false
        },
        {
          userId: restaurantOwner.id,
          name: "Sushi Master",
          address: "789 Howard Street, San Francisco, CA 94103",
          description: "Premium sushi and Japanese cuisine prepared by master chefs.",
          cuisine: "Japanese",
          priceRange: "$$$$",
          phoneNumber: "(415) 555-9012",
          latitude: "37.7832",
          longitude: "-122.4069",
          currentWaitStatus: "long",
          customWaitTime: 45,
          operatingHours: {
            monday: { open: "5:00 PM", close: "10:00 PM" },
            tuesday: { open: "5:00 PM", close: "10:00 PM" },
            wednesday: { open: "5:00 PM", close: "10:00 PM" },
            thursday: { open: "5:00 PM", close: "10:00 PM" },
            friday: { open: "5:00 PM", close: "11:00 PM" },
            saturday: { open: "5:00 PM", close: "11:00 PM" },
            sunday: { open: "5:00 PM", close: "9:00 PM" }
          },
          features: ["Omakase", "Full Bar", "Reservations Recommended"],
          rating: "4.9",
          reviewCount: 512,
          useAdvancedQueue: true
        },
        {
          userId: restaurantOwner.id,
          name: "Harbor Seafood",
          address: "101 Embarcadero, San Francisco, CA 94111",
          description: "Award-winning seafood restaurant with ocean views. Specializing in locally sourced sustainable seafood and seasonal ingredients.",
          cuisine: "Seafood",
          priceRange: "$$$$",
          phoneNumber: "(415) 555-3456",
          latitude: "37.7956",
          longitude: "-122.3933",
          currentWaitStatus: "short",
          customWaitTime: 20,
          operatingHours: {
            monday: { open: "4:00 PM", close: "10:00 PM" },
            tuesday: { open: "4:00 PM", close: "10:00 PM" },
            wednesday: { open: "4:00 PM", close: "10:00 PM" },
            thursday: { open: "4:00 PM", close: "10:00 PM" },
            friday: { open: "4:00 PM", close: "11:00 PM" },
            saturday: { open: "12:00 PM", close: "11:00 PM" },
            sunday: { open: "12:00 PM", close: "9:00 PM" }
          },
          features: ["Outdoor Seating", "Full Bar", "Dinner", "Waterfront"],
          rating: "4.8",
          reviewCount: 746,
          useAdvancedQueue: true
        }
      ];
      
      // Insert all sample restaurants
      await db.insert(restaurants).values(sampleRestaurants);
    }
  }
}

// Initialize database storage and seed if needed
const dbStorage = new DatabaseStorage();

// Keeping the in-memory storage implementation for reference
// We're now using the database implementation
export class MemStorage implements IStorage {
  // Time slot promotion operations
  async getTimeSlotPromotions(restaurantId: number): Promise<TimeSlotPromotion[]> {
    const promotions: TimeSlotPromotion[] = [];
    
    for (const promo of this.timeSlotPromotionsData.values()) {
      if (promo.restaurantId === restaurantId) {
        promotions.push(promo);
      }
    }
    
    return promotions;
  }
  
  async updateTimeSlotPromotion(restaurantId: number, timeSlot: string, discount: number): Promise<TimeSlotPromotion> {
    // Try to find existing promotion
    let existingPromo: TimeSlotPromotion | undefined;
    
    for (const promo of this.timeSlotPromotionsData.values()) {
      if (promo.restaurantId === restaurantId && promo.timeSlot === timeSlot) {
        existingPromo = promo;
        break;
      }
    }
    
    if (existingPromo) {
      // Update existing promotion
      const updatedPromo = {
        ...existingPromo,
        discount
      };
      this.timeSlotPromotionsData.set(existingPromo.id, updatedPromo);
      return updatedPromo;
    } else {
      // Create new promotion
      const id = this.timeSlotPromotionCurrentId++;
      const newPromo: TimeSlotPromotion = {
        id,
        restaurantId,
        timeSlot,
        discount,
        isActive: true,
        createdAt: new Date()
      };
      this.timeSlotPromotionsData.set(id, newPromo);
      return newPromo;
    }
  }
  
  async createTimeSlotPromotions(restaurantId: number, promotions: {timeSlot: string, discount: number}[]): Promise<TimeSlotPromotion[]> {
    const result: TimeSlotPromotion[] = [];
    
    for (const { timeSlot, discount } of promotions) {
      const promo = await this.updateTimeSlotPromotion(restaurantId, timeSlot, discount);
      result.push(promo);
    }
    
    return result;
  }
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private tableTypes: Map<number, TableType>;
  private waitlistEntries: Map<number, WaitlistEntry>;
  private restaurantQrCodes: Map<string, number>; // Maps QR code IDs to restaurant IDs
  private confirmationCodes: Map<string, number>; // Maps confirmation codes to waitlist entry IDs
  private dailyAnalyticsData: Map<number, DailyAnalytics>;
  private hourlyAnalyticsData: Map<number, HourlyAnalytics>;
  private tableAnalyticsData: Map<number, TableAnalytics>;
  private timeSlotPromotionsData: Map<number, TimeSlotPromotion>; // Store time slot promotions
  
  private userCurrentId: number;
  private restaurantCurrentId: number;
  private tableTypeCurrentId: number;
  private waitlistEntryCurrentId: number;
  private dailyAnalyticsCurrentId: number;
  private hourlyAnalyticsCurrentId: number;
  private tableAnalyticsCurrentId: number;
  private timeSlotPromotionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.tableTypes = new Map();
    this.waitlistEntries = new Map();
    this.restaurantQrCodes = new Map();
    this.confirmationCodes = new Map();
    this.dailyAnalyticsData = new Map();
    this.hourlyAnalyticsData = new Map();
    this.tableAnalyticsData = new Map();
    this.timeSlotPromotionsData = new Map();
    
    this.userCurrentId = 1;
    this.restaurantCurrentId = 1;
    this.tableTypeCurrentId = 1;
    this.waitlistEntryCurrentId = 1;
    this.dailyAnalyticsCurrentId = 1;
    this.hourlyAnalyticsCurrentId = 1;
    this.tableAnalyticsCurrentId = 1;
    this.timeSlotPromotionCurrentId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token,
    );
  }

  async createUser(insertUser: InsertUser & { 
    isVerified?: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
  }): Promise<User> {
    const id = this.userCurrentId++;
    
    // Create user with verification fields
    const user: User = { 
      ...insertUser, 
      id,
      isVerified: insertUser.isVerified ?? false,
      verificationToken: insertUser.verificationToken ?? null,
      verificationExpires: insertUser.verificationExpires ?? null,
      createdAt: new Date() 
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUserVerification(
    id: number, 
    isVerified: boolean,
    verificationToken?: string | null,
    verificationExpires?: Date | null
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    
    if (!user) {
      return undefined;
    }
    
    // If setting to verified, clear the token and expiration
    if (isVerified) {
      verificationToken = null;
      verificationExpires = null;
    }
    
    // Update verification status
    const updatedUser = { 
      ...user, 
      isVerified,
      verificationToken: verificationToken !== undefined ? verificationToken : user.verificationToken, 
      verificationExpires: verificationExpires !== undefined ? verificationExpires : user.verificationExpires 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(
    id: number,
    data: { username: string; phone: string }
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser = { 
      ...user, 
      username: data.username,
      phone: data.phone
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async getRestaurantsByOwnerId(userId: number): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(
      (restaurant) => restaurant.userId === userId
    );
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.restaurantCurrentId++;
    const restaurant: Restaurant = { ...insertRestaurant, id };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;
    
    const updatedRestaurant = { ...restaurant, ...data };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }

  async updateWaitTime(id: number, status: WaitStatus, customTime?: number): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;
    
    const updatedRestaurant = { 
      ...restaurant, 
      currentWaitStatus: status,
      customWaitTime: customTime || 0
    };
    
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.restaurants.values()).filter(restaurant => 
      restaurant.name.toLowerCase().includes(lowercaseQuery) ||
      restaurant.cuisine.toLowerCase().includes(lowercaseQuery) ||
      restaurant.address.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Waitlist operations
  async getWaitlistEntries(restaurantId: number): Promise<WaitlistEntry[]> {
    return Array.from(this.waitlistEntries.values())
      .filter(entry => entry.restaurantId === restaurantId);
  }
  
  async getWaitlistEntry(id: number): Promise<WaitlistEntry | undefined> {
    return this.waitlistEntries.get(id);
  }
  
  async getWaitlistEntryByConfirmationCode(code: string): Promise<WaitlistEntry | undefined> {
    return Array.from(this.waitlistEntries.values())
      .find(entry => entry.confirmationCode === code);
  }
  
  async createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    const id = this.waitlistEntryCurrentId++;
    const createdAt = new Date();
    
    // Calculate queue position - count active entries for this restaurant
    const restaurantEntries = await this.getWaitlistEntries(entry.restaurantId);
    const activeEntries = restaurantEntries.filter(e => e.status === 'waiting' || e.status === 'notified');
    const queuePosition = activeEntries.length + 1;
    
    // Get restaurant to calculate estimated wait time
    const restaurant = await this.getRestaurant(entry.restaurantId);
    let estimatedWaitTime = 15; // Default 15 minutes wait
    
    if (restaurant) {
      if (restaurant.avgSeatingTime) {
        // If restaurant has average seating time, use that
        estimatedWaitTime = restaurant.avgSeatingTime * queuePosition;
      } else if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
        // Otherwise use custom wait time per party
        estimatedWaitTime = restaurant.customWaitTime;
      } else {
        // Use status-based estimate
        switch (restaurant.currentWaitStatus) {
          case 'available': estimatedWaitTime = 0; break;
          case 'short': estimatedWaitTime = 15; break;
          case 'long': estimatedWaitTime = 45; break;
          case 'very_long': estimatedWaitTime = 75; break;
          case 'closed': estimatedWaitTime = 0; break;
          default: estimatedWaitTime = 30;
        }
      }
    }
    
    const waitlistEntry: WaitlistEntry = {
      ...entry,
      id,
      queuePosition,
      estimatedWaitTime,
      createdAt,
      status: 'waiting',
      notifiedAt: null,
      seatedAt: null,
      notes: entry.notes || null,
      dietaryRequirements: entry.dietaryRequirements || null,
      phoneNumber: entry.phoneNumber || null
    };
    
    this.waitlistEntries.set(id, waitlistEntry);
    
    // Update restaurant wait time based on queue length
    if (restaurant) {
      let newStatus: WaitStatus = 'available';
      if (queuePosition >= 10) {
        newStatus = 'long';
      } else if (queuePosition >= 2) {
        newStatus = 'short';
      }
      
      // Only update if the new wait status indicates longer wait than current
      const statusPriority = {
        available: 0,
        short: 1,
        long: 2,
        very_long: 3,
        closed: 4
      };
      
      if (statusPriority[newStatus] > statusPriority[restaurant.currentWaitStatus as WaitStatus]) {
        this.updateWaitTime(restaurant.id, newStatus);
      }
    }
    
    return waitlistEntry;
  }
  
  async updateWaitlistEntry(id: number, data: Partial<WaitlistEntry>): Promise<WaitlistEntry | undefined> {
    const entry = this.waitlistEntries.get(id);
    if (!entry) {
      return undefined;
    }
    
    // If status is being updated, add timestamp
    let updatedData: Partial<WaitlistEntry> = { ...data };
    
    if (data.status === 'notified' && entry.status !== 'notified') {
      updatedData.notifiedAt = new Date();
    }
    
    if (data.status === 'seated' && entry.status !== 'seated') {
      updatedData.seatedAt = new Date();
    }
    
    if (data.status === 'remote_confirmed' && entry.status === 'remote_pending') {
      // Customer confirmed they're on their way
      updatedData.expectedArrivalTime = data.expectedArrivalTime || new Date(Date.now() + 30 * 60000); // Default 30 min
    }
    
    if (data.status === 'waiting' && (entry.status === 'remote_pending' || entry.status === 'remote_confirmed')) {
      // Remote customer has arrived at the restaurant
      updatedData.arrivedAt = new Date();
    }
    
    const updatedEntry = { ...entry, ...updatedData };
    this.waitlistEntries.set(id, updatedEntry);
    
    // If someone is seated or cancelled, update queue positions for others
    if ((data.status === 'seated' || data.status === 'cancelled') && 
        (entry.status === 'waiting' || entry.status === 'notified' || 
         entry.status === 'remote_pending' || entry.status === 'remote_confirmed')) {
      
      // Update queue positions for all waiting entries at this restaurant
      const restaurantEntries = await this.getWaitlistEntries(entry.restaurantId);
      const waitingEntries = restaurantEntries.filter(
        e => (e.status === 'waiting' || e.status === 'notified' || 
              e.status === 'remote_pending' || e.status === 'remote_confirmed') && e.id !== id
      );
      
      // Sort by created time to ensure proper queue position
      waitingEntries.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeA - timeB;
      });
      
      // Update queue positions
      for (let i = 0; i < waitingEntries.length; i++) {
        const waitingEntry = waitingEntries[i];
        const newPosition = i + 1;
        
        if (waitingEntry.queuePosition !== newPosition) {
          const updated = { ...waitingEntry, queuePosition: newPosition };
          this.waitlistEntries.set(waitingEntry.id, updated);
        }
      }
      
      // Update restaurant wait time based on remaining queue
      const restaurant = await this.getRestaurant(entry.restaurantId);
      if (restaurant) {
        let newStatus: WaitStatus = 'available';
        
        if (waitingEntries.length >= 10) {
          newStatus = 'long';
        } else if (waitingEntries.length >= 2) {
          newStatus = 'short';
        }
        
        if (waitingEntries.length === 0) {
          this.updateWaitTime(restaurant.id, 'available', 0);
        } else if (newStatus !== restaurant.currentWaitStatus) {
          this.updateWaitTime(restaurant.id, newStatus);
        }
      }
    }
    
    return updatedEntry;
  }
  
  async createRemoteWaitlistEntry(entry: InsertWaitlistEntry & { isRemote: true, expectedArrivalTime: Date }): Promise<WaitlistEntry> {
    const id = this.waitlistEntryCurrentId++;
    const createdAt = new Date();
    
    // Calculate queue position - count active entries for this restaurant
    const restaurantEntries = await this.getWaitlistEntries(entry.restaurantId);
    const activeEntries = restaurantEntries.filter(
      e => e.status === 'waiting' || e.status === 'notified' || 
           e.status === 'remote_pending' || e.status === 'remote_confirmed'
    );
    const queuePosition = activeEntries.length + 1;
    
    // Get restaurant to calculate estimated wait time
    const restaurant = await this.getRestaurant(entry.restaurantId);
    let estimatedWaitTime = 15; // Default 15 minutes wait
    
    if (restaurant) {
      if (restaurant.avgSeatingTime) {
        // If restaurant has average seating time, use that
        estimatedWaitTime = restaurant.avgSeatingTime * queuePosition;
      } else if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
        // Otherwise use custom wait time per party
        estimatedWaitTime = restaurant.customWaitTime;
      } else {
        // Use status-based estimate
        switch (restaurant.currentWaitStatus) {
          case 'available': estimatedWaitTime = 0; break;
          case 'short': estimatedWaitTime = 15; break;
          case 'long': estimatedWaitTime = 45; break;
          case 'very_long': estimatedWaitTime = 75; break;
          case 'closed': estimatedWaitTime = 0; break;
          default: estimatedWaitTime = 30;
        }
      }
    }
    
    // Generate a random 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const waitlistEntry: WaitlistEntry = {
      ...entry,
      id,
      queuePosition,
      estimatedWaitTime,
      createdAt,
      status: 'remote_pending',
      notifiedAt: null,
      seatedAt: null,
      arrivedAt: null,
      confirmationCode,
      notes: entry.notes || null,
      dietaryRequirements: entry.dietaryRequirements || null,
      phoneNumber: entry.phoneNumber || null,
      email: entry.email || null
    };
    
    this.waitlistEntries.set(id, waitlistEntry);
    this.confirmationCodes.set(confirmationCode, id);
    
    // Update restaurant wait time based on queue length
    if (restaurant) {
      let newStatus: WaitStatus = 'available';
      if (queuePosition >= 10) {
        newStatus = 'long';
      } else if (queuePosition >= 2) {
        newStatus = 'short';
      }
      
      // Only update if the new wait status indicates longer wait than current
      const statusPriority = {
        available: 0,
        short: 1,
        long: 2,
        very_long: 3,
        closed: 4
      };
      
      if (statusPriority[newStatus] > statusPriority[restaurant.currentWaitStatus as WaitStatus]) {
        this.updateWaitTime(restaurant.id, newStatus);
      }
    }
    
    return waitlistEntry;
  }
  
  async confirmRemoteArrival(confirmationCode: string): Promise<WaitlistEntry | undefined> {
    const entryId = this.confirmationCodes.get(confirmationCode);
    if (!entryId) {
      return undefined; // Invalid confirmation code
    }
    
    const entry = this.waitlistEntries.get(entryId);
    if (!entry || (entry.status !== 'remote_pending' && entry.status !== 'remote_confirmed')) {
      return undefined;
    }
    
    // Get restaurant to check if advanced queue is enabled
    const restaurant = this.restaurants.get(entry.restaurantId);
    if (!restaurant) {
      return undefined;
    }
    
    let newStatus = 'waiting';
    let seatedAt = null;
    
    // Check queue position and table availability to determine if customer can be seated
    if (restaurant.useAdvancedQueue) {
      const tableTypes = await this.getTableTypes(entry.restaurantId);
      const suitableTables = tableTypes.filter(
        table => table.capacity >= entry.partySize && table.isActive
      );
      
      if (suitableTables.length > 0) {
        // Check how many customers are ahead in the queue
        const waitingCustomers = Array.from(this.waitlistEntries.values()).filter(
          e => e.restaurantId === entry.restaurantId && 
          (e.status === 'waiting' || e.status === 'ready_to_seat') &&
          e.queuePosition < entry.queuePosition
        );
        
        // Check available tables
        const totalAvailableTables = suitableTables.reduce((sum, table) => sum + table.count, 0);
        const seatedEntries = Array.from(this.waitlistEntries.values()).filter(
          e => e.restaurantId === entry.restaurantId && e.status === 'seated' && e.seatedAt
        );
        const availableTables = totalAvailableTables - seatedEntries.length;
        
        // If there are available tables and no one ahead in queue, customer can be seated
        if (availableTables > 0 && waitingCustomers.length === 0) {
          newStatus = 'ready_to_seat'; // Ready to seat but not automatically seated
        } else {
          newStatus = 'waiting'; // Must wait for their turn
        }
      }
    }
    
    // Update status and preserve original queue position
    const updatedEntry = { 
      ...entry, 
      status: newStatus,
      arrivedAt: new Date(),
      seatedAt
    };
    
    this.waitlistEntries.set(entry.id, updatedEntry);
    return updatedEntry;
  }
  
  // QR code operations
  async generateRestaurantQrCode(restaurantId: number): Promise<string> {
    const restaurant = await this.getRestaurant(restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant with ID ${restaurantId} not found`);
    }
    
    // If restaurant already has a QR code, return it
    if (restaurant.qrCodeId) {
      return restaurant.qrCodeId;
    }
    
    // Otherwise generate a new one
    const qrCodeId = this.generateUniqueQrCodeId();
    await this.updateRestaurant(restaurantId, { qrCodeId });
    this.restaurantQrCodes.set(qrCodeId, restaurantId);
    
    return qrCodeId;
  }
  
  async getRestaurantByQrCodeId(qrCodeId: string): Promise<Restaurant | undefined> {
    const restaurantId = this.restaurantQrCodes.get(qrCodeId);
    if (!restaurantId) {
      return undefined;
    }
    
    return this.getRestaurant(restaurantId);
  }
  
  // Table type operations
  async getTableTypes(restaurantId: number): Promise<TableType[]> {
    return Array.from(this.tableTypes.values())
      .filter(tableType => tableType.restaurantId === restaurantId);
  }

  async getTableType(id: number): Promise<TableType | undefined> {
    return this.tableTypes.get(id);
  }

  async createTableType(tableType: InsertTableType): Promise<TableType> {
    const id = this.tableTypeCurrentId++;
    const newTableType: TableType = { 
      ...tableType, 
      id,
      createdAt: new Date() 
    };
    this.tableTypes.set(id, newTableType);
    return newTableType;
  }

  async updateTableType(id: number, data: Partial<TableType>): Promise<TableType | undefined> {
    const tableType = this.tableTypes.get(id);
    if (!tableType) return undefined;

    const updatedTableType = { ...tableType, ...data };
    this.tableTypes.set(id, updatedTableType);
    return updatedTableType;
  }

  async deleteTableType(id: number): Promise<boolean> {
    return this.tableTypes.delete(id);
  }
  
  // Helper methods
  private generateUniqueQrCodeId(): string {
    // Generate a random alphanumeric string
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if it's already in use
    if (this.restaurantQrCodes.has(result)) {
      // If it is, generate a new one recursively
      return this.generateUniqueQrCodeId();
    }
    
    return result;
  }

  // Initialize with sample data
  private initSampleData() {
    // Create sample users
    const restaurantOwner = {
      id: this.userCurrentId++,
      username: 'restaurant_owner',
      password: 'password123',
      email: 'owner@tablequeue.com',
      role: 'restaurant',
      phone: null,
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      createdAt: new Date()
    };
    
    this.users.set(restaurantOwner.id, restaurantOwner);
    
    // Generate QR code IDs
    const qrCode1 = this.generateUniqueQrCodeId();
    const qrCode2 = this.generateUniqueQrCodeId();
    const qrCode3 = this.generateUniqueQrCodeId();
    const qrCode4 = this.generateUniqueQrCodeId();
    
    // Create sample restaurants with realistic data
    const sampleRestaurants: Omit<Restaurant, 'id'>[] = [
      {
        userId: restaurantOwner.id,
        name: "The Italian Place",
        address: "123 Main Street, San Francisco, CA 94101",
        description: "Authentic Italian cuisine with homemade pasta and wood-fired pizza.",
        cuisine: "Italian",
        priceRange: "$$$",
        phoneNumber: "(415) 555-1234",
        latitude: "37.7749",
        longitude: "-122.4194",
        currentWaitStatus: "available",
        customWaitTime: 0,
        operatingHours: {
          monday: { open: "11:00 AM", close: "10:00 PM" },
          tuesday: { open: "11:00 AM", close: "10:00 PM" },
          wednesday: { open: "11:00 AM", close: "10:00 PM" },
          thursday: { open: "11:00 AM", close: "10:00 PM" },
          friday: { open: "11:00 AM", close: "11:00 PM" },
          saturday: { open: "10:00 AM", close: "11:00 PM" },
          sunday: { open: "10:00 AM", close: "9:00 PM" }
        },
        features: ["Outdoor Seating", "Full Bar", "Takeout", "Delivery"],
        rating: "4.7",
        reviewCount: 324,
        createdAt: new Date(),
        qrCodeId: qrCode1,
        tableCapacity: 25,
        avgSeatingTime: 45,
        hasFoodDelivery: ["UberEats", "DoorDash"],
        hasReservationSystem: "OpenTable",
        reservationUrl: "https://www.opentable.com/r/the-italian-place-san-francisco"
      },
      {
        userId: restaurantOwner.id,
        name: "Burger & Co.",
        address: "456 Market Street, San Francisco, CA 94102",
        description: "Gourmet burgers made with locally sourced ingredients and craft beers.",
        cuisine: "American",
        priceRange: "$$",
        phoneNumber: "(415) 555-5678",
        latitude: "37.7942",
        longitude: "-122.3952",
        currentWaitStatus: "short",
        customWaitTime: 15,
        operatingHours: {
          monday: { open: "11:00 AM", close: "9:00 PM" },
          tuesday: { open: "11:00 AM", close: "9:00 PM" },
          wednesday: { open: "11:00 AM", close: "9:00 PM" },
          thursday: { open: "11:00 AM", close: "9:00 PM" },
          friday: { open: "11:00 AM", close: "10:00 PM" },
          saturday: { open: "11:00 AM", close: "10:00 PM" },
          sunday: { open: "11:00 AM", close: "8:00 PM" }
        },
        features: ["Kid Friendly", "Full Bar", "Takeout"],
        rating: "4.2",
        reviewCount: 187,
        createdAt: new Date(),
        qrCodeId: qrCode2,
        tableCapacity: 20,
        avgSeatingTime: 30,
        hasFoodDelivery: ["UberEats", "GrubHub"],
        hasReservationSystem: null,
        reservationUrl: null
      },
      {
        userId: restaurantOwner.id,
        name: "Sushi Master",
        address: "789 Howard Street, San Francisco, CA 94103",
        description: "Premium sushi and Japanese cuisine prepared by master chefs.",
        cuisine: "Japanese",
        priceRange: "$$$$",
        phoneNumber: "(415) 555-9012",
        latitude: "37.7832",
        longitude: "-122.4069",
        currentWaitStatus: "long",
        customWaitTime: 45,
        operatingHours: {
          monday: { open: "5:00 PM", close: "10:00 PM" },
          tuesday: { open: "5:00 PM", close: "10:00 PM" },
          wednesday: { open: "5:00 PM", close: "10:00 PM" },
          thursday: { open: "5:00 PM", close: "10:00 PM" },
          friday: { open: "5:00 PM", close: "11:00 PM" },
          saturday: { open: "5:00 PM", close: "11:00 PM" },
          sunday: { open: "5:00 PM", close: "9:00 PM" }
        },
        features: ["Omakase", "Full Bar", "Reservations Recommended"],
        rating: "4.9",
        reviewCount: 512,
        createdAt: new Date(),
        qrCodeId: qrCode3,
        tableCapacity: 30,
        avgSeatingTime: 60,
        hasFoodDelivery: ["GrubHub"],
        hasReservationSystem: "Resy",
        reservationUrl: "https://resy.com/sushi-master-san-francisco"
      },
      {
        userId: restaurantOwner.id,
        name: "Harbor Seafood",
        address: "101 Embarcadero, San Francisco, CA 94111",
        description: "Award-winning seafood restaurant with ocean views. Specializing in locally sourced sustainable seafood and seasonal ingredients.",
        cuisine: "Seafood",
        priceRange: "$$$$",
        phoneNumber: "(415) 555-3456",
        latitude: "37.7956",
        longitude: "-122.3933",
        currentWaitStatus: "short",
        customWaitTime: 20,
        operatingHours: {
          monday: { open: "4:00 PM", close: "10:00 PM" },
          tuesday: { open: "4:00 PM", close: "10:00 PM" },
          wednesday: { open: "4:00 PM", close: "10:00 PM" },
          thursday: { open: "4:00 PM", close: "10:00 PM" },
          friday: { open: "4:00 PM", close: "11:00 PM" },
          saturday: { open: "12:00 PM", close: "11:00 PM" },
          sunday: { open: "12:00 PM", close: "9:00 PM" }
        },
        features: ["Outdoor Seating", "Full Bar", "Dinner", "Waterfront"],
        rating: "4.8",
        reviewCount: 746,
        createdAt: new Date(),
        qrCodeId: qrCode4,
        tableCapacity: 40,
        avgSeatingTime: 50,
        hasFoodDelivery: ["UberEats", "DoorDash", "GrubHub"],
        hasReservationSystem: "OpenTable",
        reservationUrl: "https://www.opentable.com/r/harbor-seafood-san-francisco"
      }
    ];
    
    // Add all sample restaurants to the storage
    sampleRestaurants.forEach(restaurant => {
      const id = this.restaurantCurrentId++;
      this.restaurants.set(id, { 
        ...restaurant, 
        id, 
        useAdvancedQueue: true // Enable advanced queue for sample restaurants
      });
      
      // Add sample table types for each restaurant
      const tableTypes = [
        {
          restaurantId: id,
          name: "Two-seater",
          capacity: 2,
          count: 8,
          estimatedTurnoverTime: 45,
          isActive: true
        },
        {
          restaurantId: id,
          name: "Four-seater",
          capacity: 4,
          count: 12,
          estimatedTurnoverTime: 60,
          isActive: true
        },
        {
          restaurantId: id,
          name: "Large Group",
          capacity: 8,
          count: 4,
          estimatedTurnoverTime: 90,
          isActive: true
        },
        {
          restaurantId: id,
          name: "Bar",
          capacity: 1,
          count: 10,
          estimatedTurnoverTime: 40,
          isActive: true
        },
        {
          restaurantId: id,
          name: "Outdoor",
          capacity: 4,
          count: 6,
          estimatedTurnoverTime: 75,
          isActive: restaurant.id % 2 === 0 // Only activate outdoor tables for some restaurants
        }
      ];
      
      // Add all sample table types to the storage
      tableTypes.forEach(tableType => {
        const tableTypeId = this.tableTypeCurrentId++;
        this.tableTypes.set(tableTypeId, {
          ...tableType,
          id: tableTypeId,
          createdAt: new Date()
        });
      });
    });
  }
  
  // Analytics operations
  async getDailyAnalytics(restaurantId: number, startDate?: Date, endDate?: Date): Promise<DailyAnalytics[]> {
    let analytics = Array.from(this.dailyAnalyticsData.values()).filter(
      analytics => analytics.restaurantId === restaurantId
    );
    
    if (startDate) {
      analytics = analytics.filter(a => a.date >= startDate);
    }
    
    if (endDate) {
      analytics = analytics.filter(a => a.date <= endDate);
    }
    
    return analytics.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async getHourlyAnalytics(restaurantId: number, date: Date): Promise<HourlyAnalytics[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const analytics = Array.from(this.hourlyAnalyticsData.values()).filter(
      analytics => analytics.restaurantId === restaurantId && 
                   analytics.hour >= startOfDay &&
                   analytics.hour <= endOfDay
    );
    
    return analytics.sort((a, b) => a.hour.getTime() - b.hour.getTime());
  }
  
  async getTableAnalytics(restaurantId: number, startDate?: Date, endDate?: Date): Promise<TableAnalytics[]> {
    let analytics = Array.from(this.tableAnalyticsData.values()).filter(
      analytics => analytics.restaurantId === restaurantId
    );
    
    if (startDate) {
      analytics = analytics.filter(a => a.date >= startDate);
    }
    
    if (endDate) {
      analytics = analytics.filter(a => a.date <= endDate);
    }
    
    return analytics.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async createDailyAnalytics(data: InsertDailyAnalytics): Promise<DailyAnalytics> {
    const id = this.dailyAnalyticsCurrentId++;
    const analytics: DailyAnalytics = { ...data, id };
    this.dailyAnalyticsData.set(id, analytics);
    return analytics;
  }
  
  async createHourlyAnalytics(data: InsertHourlyAnalytics): Promise<HourlyAnalytics> {
    const id = this.hourlyAnalyticsCurrentId++;
    const analytics: HourlyAnalytics = { ...data, id };
    this.hourlyAnalyticsData.set(id, analytics);
    return analytics;
  }
  
  async createTableAnalytics(data: InsertTableAnalytics): Promise<TableAnalytics> {
    const id = this.tableAnalyticsCurrentId++;
    const analytics: TableAnalytics = { ...data, id };
    this.tableAnalyticsData.set(id, analytics);
    return analytics;
  }
  
  async generateAnalyticsFromWaitlist(restaurantId: number, date: Date): Promise<boolean> {
    try {
      // Get all waitlist entries for the restaurant on the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const entries = Array.from(this.waitlistEntries.values()).filter(
        entry => entry.restaurantId === restaurantId && 
                 entry.createdAt >= startOfDay &&
                 entry.createdAt <= endOfDay
      );
      
      if (entries.length === 0) {
        return false;
      }
      
      // Generate daily analytics
      const totalWaitTime = entries.reduce((sum, entry) => sum + entry.estimatedWaitTime, 0);
      const averageWaitTime = entries.length > 0 ? totalWaitTime / entries.length : 0;
      
      const seatedEntries = entries.filter(entry => entry.status === 'seated');
      const canceledEntries = entries.filter(entry => entry.status === 'canceled');
      
      await this.createDailyAnalytics({
        restaurantId,
        date: new Date(date),
        totalCustomers: entries.length,
        averageWaitTime,
        seatedCustomers: seatedEntries.length,
        canceledCustomers: canceledEntries.length,
        peakHour: this.calculatePeakHour(entries),
        averagePartySize: this.calculateAveragePartySize(entries)
      });
      
      // Generate hourly analytics
      const hourlyData = this.groupEntriesByHour(entries);
      for (const [hour, hourEntries] of Object.entries(hourlyData)) {
        const hourDate = new Date(startOfDay);
        hourDate.setHours(parseInt(hour));
        
        await this.createHourlyAnalytics({
          restaurantId,
          hour: hourDate,
          customerCount: hourEntries.length,
          averageWaitTime: hourEntries.reduce((sum, entry) => sum + entry.estimatedWaitTime, 0) / hourEntries.length,
          seatedCount: hourEntries.filter(entry => entry.status === 'seated').length,
          canceledCount: hourEntries.filter(entry => entry.status === 'canceled').length
        });
      }
      
      // Generate table analytics
      const tableData = this.groupEntriesByTableType(entries);
      for (const [tableTypeId, tableEntries] of Object.entries(tableData)) {
        const typeId = parseInt(tableTypeId);
        if (isNaN(typeId)) continue;
        
        const tableType = await this.getTableType(typeId);
        if (!tableType) continue;
        
        await this.createTableAnalytics({
          restaurantId,
          date: new Date(date),
          tableTypeId: typeId,
          tableName: tableType.name,
          totalUsage: tableEntries.length,
          averageSeatingDuration: this.calculateAverageSeatingDuration(tableEntries),
          peakUsageHour: this.calculatePeakHourForTableType(tableEntries)
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error generating analytics:", error);
      return false;
    }
  }
  
  // Helper methods for analytics
  private calculatePeakHour(entries: WaitlistEntry[]): number {
    const hourCounts = new Map<number, number>();
    
    for (const entry of entries) {
      const hour = entry.createdAt.getHours();
      const currentCount = hourCounts.get(hour) || 0;
      hourCounts.set(hour, currentCount + 1);
    }
    
    let peakHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of hourCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }
    
    return peakHour;
  }
  
  private calculateAveragePartySize(entries: WaitlistEntry[]): number {
    if (entries.length === 0) return 0;
    const totalPartySize = entries.reduce((sum, entry) => sum + entry.partySize, 0);
    return totalPartySize / entries.length;
  }
  
  private calculateAverageSeatingDuration(entries: WaitlistEntry[]): number {
    const seatedEntries = entries.filter(entry => 
      entry.status === 'seated' && entry.seatedAt !== null && entry.completedAt !== null
    );
    
    if (seatedEntries.length === 0) return 0;
    
    const totalDuration = seatedEntries.reduce((sum, entry) => {
      if (entry.seatedAt && entry.completedAt) {
        return sum + (entry.completedAt.getTime() - entry.seatedAt.getTime()) / (1000 * 60); // in minutes
      }
      return sum;
    }, 0);
    
    return totalDuration / seatedEntries.length;
  }
  
  private calculatePeakHourForTableType(entries: WaitlistEntry[]): number {
    return this.calculatePeakHour(entries);
  }
  
  private groupEntriesByHour(entries: WaitlistEntry[]): Record<string, WaitlistEntry[]> {
    const hourlyData: Record<string, WaitlistEntry[]> = {};
    
    for (const entry of entries) {
      const hour = entry.createdAt.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(entry);
    }
    
    return hourlyData;
  }
  
  private groupEntriesByTableType(entries: WaitlistEntry[]): Record<string, WaitlistEntry[]> {
    const tableData: Record<string, WaitlistEntry[]> = {};
    
    for (const entry of entries) {
      if (entry.tableTypeId) {
        const typeId = entry.tableTypeId;
        if (!tableData[typeId]) {
          tableData[typeId] = [];
        }
        tableData[typeId].push(entry);
      }
    }
    
    return tableData;
  }
}

// Use in-memory storage for now since we don't have a proper database connection
// TODO: Switch to database storage when we have a proper database setup
export const storage = dbStorage;
