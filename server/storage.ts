import { 
  users, type User, type InsertUser, 
  restaurants, type Restaurant, type InsertRestaurant,
  type WaitStatus
} from "@shared/schema";

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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private userCurrentId: number;
  private restaurantCurrentId: number;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.userCurrentId = 1;
    this.restaurantCurrentId = 1;
    
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

  // Initialize with sample data
  private initSampleData() {
    // Create sample users
    const restaurantOwner = {
      id: this.userCurrentId++,
      username: 'restaurant_owner',
      password: 'password123',
      email: 'owner@tablequeue.com',
      role: 'restaurant'
    };
    
    this.users.set(restaurantOwner.id, restaurantOwner);
    
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

export const storage = new MemStorage();
