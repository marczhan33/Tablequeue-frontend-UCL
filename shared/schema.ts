import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (could be restaurant owners or regular users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default('customer'),
  phone: text("phone"), // For SMS notifications
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Restaurant table
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  cuisine: text("cuisine").notNull(),
  priceRange: text("price_range").notNull(),
  phoneNumber: text("phone_number"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  currentWaitStatus: text("current_wait_status").notNull().default('available'),
  customWaitTime: integer("custom_wait_time").default(0),
  operatingHours: jsonb("operating_hours"),
  features: text("features").array(),
  rating: text("rating"),
  reviewCount: integer("review_count"),
  qrCodeId: text("qr_code_id"), // Unique ID for QR code generation
  tableCapacity: integer("table_capacity"), // Total number of tables
  avgSeatingTime: integer("avg_seating_time"), // Average time to seat customers (minutes)
  hasFoodDelivery: text("has_food_delivery").array(), // Which delivery platforms (Uber Eats, etc.)
  hasReservationSystem: text("has_reservation_system"), // Name of reservation system if any
  reservationUrl: text("reservation_url"), // URL to reservation system
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for wait list entries
export const waitlistEntries = pgTable("waitlist_entries", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  customerName: text("customer_name").notNull(),
  partySize: integer("party_size").notNull(),
  phoneNumber: text("phone_number"), // For SMS notifications
  dietaryRequirements: text("dietary_requirements"),
  estimatedWaitTime: integer("estimated_wait_time").notNull(), // In minutes
  queuePosition: integer("queue_position").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, seated, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  notifiedAt: timestamp("notified_at"), // When SMS was sent
  seatedAt: timestamp("seated_at"),
  notes: text("notes"),
});

// Wait time status options
export const waitStatusEnum = z.enum([
  'available',  // No wait time
  'short',      // Short wait (15-30 minutes)
  'long',       // Long wait (30+ minutes)
  'very_long',  // Very long wait (60+ minutes)
  'closed'      // Restaurant is closed
]);

export const waitlistStatusEnum = z.enum([
  "waiting",   // Customer is waiting
  "notified",  // Customer has been notified their table is ready
  "seated",    // Customer has been seated
  "cancelled", // Customer cancelled or no-show
]);

export type WaitStatus = z.infer<typeof waitStatusEnum>;
export type WaitlistStatus = z.infer<typeof waitlistStatusEnum>;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  phone: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({
  id: true,
  createdAt: true,
  notifiedAt: true,
  seatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;

// Sample operating hours schema for TypeScript type checking
export const operatingHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }),
  tuesday: z.object({ open: z.string(), close: z.string() }),
  wednesday: z.object({ open: z.string(), close: z.string() }),
  thursday: z.object({ open: z.string(), close: z.string() }),
  friday: z.object({ open: z.string(), close: z.string() }),
  saturday: z.object({ open: z.string(), close: z.string() }),
  sunday: z.object({ open: z.string(), close: z.string() }),
});

export type OperatingHours = z.infer<typeof operatingHoursSchema>;

// Form schema for QR code customer inputs
export const qrCodeCustomerFormSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  partySize: z.number().min(1, "Party size must be at least 1"),
  phoneNumber: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialRequests: z.string().optional(),
});

export type QrCodeCustomerForm = z.infer<typeof qrCodeCustomerFormSchema>;
