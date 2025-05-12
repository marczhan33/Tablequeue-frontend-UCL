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
});

// Wait time status options
export const waitStatusEnum = z.enum([
  'available',  // No wait time
  'short',      // Short wait (15-30 minutes)
  'long'        // Long wait (30+ minutes)
]);

export type WaitStatus = z.infer<typeof waitStatusEnum>;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

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
