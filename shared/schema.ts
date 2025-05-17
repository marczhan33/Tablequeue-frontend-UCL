import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, numeric, time, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Relations will be defined after all tables

// Table types for restaurants
export const tableTypes = pgTable("table_types", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(), // e.g., "Two-seater", "Four-seater", "Bar", "Booth", "Outdoor"
  capacity: integer("capacity").notNull(), // How many people this table can seat
  count: integer("count").notNull(), // How many tables of this type are available
  estimatedTurnoverTime: integer("estimated_turnover_time").notNull(), // Average time in minutes for a table to become available
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time slot promotion table for restaurants
export const timeSlotPromotions = pgTable("time_slot_promotions", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  timeSlot: text("time_slot").notNull(), // Format: "HH:MM"
  discount: integer("discount").notNull().default(0), // Percentage discount (0-100)
  isActive: boolean("is_active").notNull().default(true),
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
  useAdvancedQueue: boolean("use_advanced_queue").default(false), // Whether to use advanced queue management
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for wait list entries
export const waitlistEntries = pgTable("waitlist_entries", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  customerName: text("customer_name").notNull(),
  partySize: integer("party_size").notNull(),
  phoneNumber: text("phone_number"), // For SMS notifications
  email: text("email"), // For email notifications (optional)
  dietaryRequirements: text("dietary_requirements"),
  estimatedWaitTime: integer("estimated_wait_time").notNull(), // In minutes
  queuePosition: integer("queue_position").notNull(),
  status: text("status").notNull().default("waiting"), 
  tableTypeId: integer("table_type_id"), // Link to specific table type
  isRemote: boolean("is_remote").default(false), // Whether they joined remotely
  expectedArrivalTime: timestamp("expected_arrival_time"), // When they expect to arrive (for remote guests)
  confirmationCode: text("confirmation_code"), // Code for remote guests to confirm arrival
  createdAt: timestamp("created_at").defaultNow(),
  notifiedAt: timestamp("notified_at"), // When SMS was sent
  notificationSent: boolean("notification_sent").default(false), // Track if notification was successfully sent
  seatedAt: timestamp("seated_at"),
  arrivedAt: timestamp("arrived_at"), // When guest arrived at restaurant
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
  "waiting",           // Customer is waiting in-person
  "notified",          // Customer has been notified their table is ready
  "seated",            // Customer has been seated
  "cancelled",         // Customer cancelled or no-show
  "remote_pending",    // Customer joined the queue remotely but hasn't arrived yet
  "remote_confirmed",  // Customer joined remotely and confirmed they're on their way
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

export const insertTableTypeSchema = createInsertSchema(tableTypes).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({
  id: true,
  createdAt: true,
  notifiedAt: true,
  seatedAt: true,
  arrivedAt: true,
  confirmationCode: true, // This will be generated by the server
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

export type InsertTableType = z.infer<typeof insertTableTypeSchema>;
export type TableType = typeof tableTypes.$inferSelect;

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

// Form schema for QR code customer inputs (for in-person queue)
export const qrCodeCustomerFormSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  partySize: z.number().min(1, "Party size must be at least 1"),
  phoneNumber: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialRequests: z.string().optional(),
  tableTypeId: z.number().optional(), // Optional table type selection
  preferredTableType: z.string().optional(), // For user's preference when no specific ID
});

// Remote waitlist form schema (for joining the queue remotely)
export const remoteWaitlistFormSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  partySize: z.number().min(1, "Party size must be at least 1"),
  phoneNumber: z.string().min(10, "Valid phone number required for remote queue"),
  email: z.string().email("Valid email required for confirmation").optional(),
  dietaryRequirements: z.string().optional(),
  specialRequests: z.string().optional(),
  expectedArrivalTime: z.string(), // ISO string for expected arrival time
  tableTypeId: z.number().optional(), // Optional table type selection
  preferredTableType: z.string().optional(), // For user's preference when no specific ID
});

export type QrCodeCustomerForm = z.infer<typeof qrCodeCustomerFormSchema>;
export type RemoteWaitlistForm = z.infer<typeof remoteWaitlistFormSchema>;

// ----- Historical Data Analytics Schema -----

// Daily restaurant analytics data
export const dailyAnalytics = pgTable("daily_analytics", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  date: date("date").notNull(),
  totalCustomers: integer("total_customers").notNull(),
  averageWaitTime: integer("average_wait_time").notNull(), // In minutes
  peakWaitTime: integer("peak_wait_time").notNull(), // In minutes
  totalParties: integer("total_parties").notNull(),
  averagePartySize: numeric("average_party_size", { precision: 4, scale: 2 }).notNull(),
  cancelledWaitlist: integer("cancelled_waitlist").notNull(),
  turnoverRate: numeric("turnover_rate", { precision: 4, scale: 2 }), // Average parties seated per hour
  revenue: numeric("revenue", { precision: 10, scale: 2 }), // Optional revenue data if provided
  createdAt: timestamp("created_at").defaultNow(),
});

// Hourly restaurant analytics for more granular data
export const hourlyAnalytics = pgTable("hourly_analytics", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  date: date("date").notNull(),
  hour: integer("hour").notNull(), // 0-23 hour of day
  customers: integer("customers").notNull(), // Customers during this hour
  averageWaitTime: integer("average_wait_time").notNull(), // In minutes
  partiesSeated: integer("parties_seated").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table analytics for understanding table utilization
export const tableAnalytics = pgTable("table_analytics", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  tableTypeId: integer("table_type_id").notNull(),
  date: date("date").notNull(),
  totalUsage: integer("total_usage").notNull(), // How many times this table type was used
  averageTurnoverTime: integer("average_turnover_time").notNull(), // Average time in minutes
  utilization: numeric("utilization", { precision: 5, scale: 2 }).notNull(), // Percentage of time tables were occupied
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for analytics tables
export const insertDailyAnalyticsSchema = createInsertSchema(dailyAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertHourlyAnalyticsSchema = createInsertSchema(hourlyAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertTableAnalyticsSchema = createInsertSchema(tableAnalytics).omit({
  id: true,
  createdAt: true,
});

// Types for analytics tables
export type InsertDailyAnalytics = z.infer<typeof insertDailyAnalyticsSchema>;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;

export type InsertHourlyAnalytics = z.infer<typeof insertHourlyAnalyticsSchema>;
export type HourlyAnalytics = typeof hourlyAnalytics.$inferSelect;

export type InsertTableAnalytics = z.infer<typeof insertTableAnalyticsSchema>;
export type TableAnalytics = typeof tableAnalytics.$inferSelect;

// --------- Define Table Relationships ---------

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
}));

// Restaurant relations
export const timeSlotPromotionsRelations = relations(timeSlotPromotions, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [timeSlotPromotions.restaurantId],
    references: [restaurants.id]
  })
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.userId],
    references: [users.id]
  }),
  tableTypes: many(tableTypes),
  waitlistEntries: many(waitlistEntries),
  dailyAnalytics: many(dailyAnalytics),
  hourlyAnalytics: many(hourlyAnalytics),
  tableAnalytics: many(tableAnalytics),
  timeSlotPromotions: many(timeSlotPromotions),
}));

// Table type relations
export const tableTypesRelations = relations(tableTypes, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tableTypes.restaurantId],
    references: [restaurants.id]
  }),
  waitlistEntries: many(waitlistEntries),
  tableAnalytics: many(tableAnalytics),
}));

// Waitlist entry relations
export const waitlistEntriesRelations = relations(waitlistEntries, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [waitlistEntries.restaurantId],
    references: [restaurants.id]
  }),
  tableType: one(tableTypes, {
    fields: [waitlistEntries.tableTypeId],
    references: [tableTypes.id]
  }),
}));

// Analytics relations
export const dailyAnalyticsRelations = relations(dailyAnalytics, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [dailyAnalytics.restaurantId],
    references: [restaurants.id]
  }),
}));

export const hourlyAnalyticsRelations = relations(hourlyAnalytics, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [hourlyAnalytics.restaurantId],
    references: [restaurants.id]
  }),
}));

export const tableAnalyticsRelations = relations(tableAnalytics, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [tableAnalytics.restaurantId],
    references: [restaurants.id]
  }),
  tableType: one(tableTypes, {
    fields: [tableAnalytics.tableTypeId],
    references: [tableTypes.id]
  }),
}));
