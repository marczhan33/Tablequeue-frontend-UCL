import { 
  users, type User, type InsertUser, 
  restaurants, type Restaurant, type InsertRestaurant,
  waitlistEntries, type WaitlistEntry, type InsertWaitlistEntry,
  tableTypes, type TableType, type InsertTableType,
  dailyAnalytics, type DailyAnalytics, type InsertDailyAnalytics,
  hourlyAnalytics, type HourlyAnalytics, type InsertHourlyAnalytics,
  tableAnalytics, type TableAnalytics, type InsertTableAnalytics,
  type WaitStatus, type WaitlistStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or } from "drizzle-orm";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

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
          reviewCount: 324
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
          reviewCount: 187
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
          reviewCount: 512
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
          reviewCount: 746
        }
      ];
      
      // Insert all sample restaurants
      await db.insert(restaurants).values(sampleRestaurants);
    }
  }
}

// Initialize database storage and seed if needed
const dbStorage = new DatabaseStorage();

// For compatibility, we'll keep using the in-memory storage for now
// until we have a proper database setup
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private tableTypes: Map<number, TableType>;
  private waitlistEntries: Map<number, WaitlistEntry>;
  private restaurantQrCodes: Map<string, number>; // Maps QR code IDs to restaurant IDs
  private confirmationCodes: Map<string, number>; // Maps confirmation codes to waitlist entry IDs
  private dailyAnalyticsData: Map<number, DailyAnalytics>;
  private hourlyAnalyticsData: Map<number, HourlyAnalytics>;
  private tableAnalyticsData: Map<number, TableAnalytics>;
  
  private userCurrentId: number;
  private restaurantCurrentId: number;
  private tableTypeCurrentId: number;
  private waitlistEntryCurrentId: number;
  private dailyAnalyticsCurrentId: number;
  private hourlyAnalyticsCurrentId: number;
  private tableAnalyticsCurrentId: number;

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
    
    this.userCurrentId = 1;
    this.restaurantCurrentId = 1;
    this.tableTypeCurrentId = 1;
    this.waitlistEntryCurrentId = 1;
    this.dailyAnalyticsCurrentId = 1;
    this.hourlyAnalyticsCurrentId = 1;
    this.tableAnalyticsCurrentId = 1;
    
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
    
    // Update status to mark arrival
    const updatedEntry = { 
      ...entry, 
      status: 'waiting',
      arrivedAt: new Date()
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
export const storage = new MemStorage();
