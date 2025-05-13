import { 
  users, type User, type InsertUser, 
  restaurants, type Restaurant, type InsertRestaurant,
  waitlistEntries, type WaitlistEntry, type InsertWaitlistEntry,
  type WaitStatus, type WaitlistStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or } from "drizzle-orm";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurantsByOwnerId(userId: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant | undefined>;
  updateWaitTime(id: number, status: WaitStatus, customTime?: number): Promise<Restaurant | undefined>;
  searchRestaurants(query: string): Promise<Restaurant[]>;
  
  // Waitlist operations
  getWaitlistEntries(restaurantId: number): Promise<WaitlistEntry[]>;
  getWaitlistEntry(id: number): Promise<WaitlistEntry | undefined>;
  createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  updateWaitlistEntry(id: number, data: Partial<WaitlistEntry>): Promise<WaitlistEntry | undefined>;
  
  // QR code operations
  generateRestaurantQrCode(restaurantId: number): Promise<string>;
  getRestaurantByQrCodeId(qrCodeId: string): Promise<Restaurant | undefined>;
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
  private waitlistEntries: Map<number, WaitlistEntry>;
  private restaurantQrCodes: Map<string, number>; // Maps QR code IDs to restaurant IDs
  
  private userCurrentId: number;
  private restaurantCurrentId: number;
  private waitlistEntryCurrentId: number;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.waitlistEntries = new Map();
    this.restaurantQrCodes = new Map();
    
    this.userCurrentId = 1;
    this.restaurantCurrentId = 1;
    this.waitlistEntryCurrentId = 1;
    
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
      } else if (restaurant.customWaitTime > 0) {
        // Otherwise use custom wait time per party
        estimatedWaitTime = restaurant.customWaitTime;
      } else {
        // Use status-based estimate
        switch (restaurant.currentWaitStatus) {
          case 'available': estimatedWaitTime = 0; break;
          case 'short': estimatedWaitTime = 15; break;
          case 'long': estimatedWaitTime = 45; break;
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
    
    const updatedEntry = { ...entry, ...updatedData };
    this.waitlistEntries.set(id, updatedEntry);
    
    // If someone is seated or cancelled, update queue positions for others
    if ((data.status === 'seated' || data.status === 'cancelled') && 
        (entry.status === 'waiting' || entry.status === 'notified')) {
      
      // Update queue positions for all waiting entries at this restaurant
      const restaurantEntries = await this.getWaitlistEntries(entry.restaurantId);
      const waitingEntries = restaurantEntries.filter(
        e => (e.status === 'waiting' || e.status === 'notified') && e.id !== id
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
    
    // Add all sample restaurants to the storage
    sampleRestaurants.forEach(restaurant => {
      const id = this.restaurantCurrentId++;
      this.restaurants.set(id, { ...restaurant, id });
    });
  }
}

// Use in-memory storage for now since we don't have a proper database connection
// TODO: Switch to database storage when we have a proper database setup
export const storage = new MemStorage();
