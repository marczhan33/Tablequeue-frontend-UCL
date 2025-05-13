import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRestaurantSchema, 
  insertWaitlistEntrySchema,
  insertTableTypeSchema,
  waitStatusEnum, 
  waitlistStatusEnum 
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

// Middleware to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized - Please log in" });
}

// Middleware to ensure user is restaurant owner
function ensureRestaurantOwner(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'owner') {
    return next();
  }
  res.status(403).json({ error: "Forbidden - Restaurant owner access required" });
}

// Function to check if a user owns a specific restaurant
async function isRestaurantOwner(userId: number, restaurantId: number): Promise<boolean> {
  const restaurant = await storage.getRestaurant(restaurantId);
  return restaurant?.userId === userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // API Routes - all prefixed with /api
  const apiRouter = express.Router();
  
  // Resend verification email endpoint
  apiRouter.post("/resend-verification", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized - Please log in" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.isVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }
      
      // Generate new verification token
      const { generateVerificationToken, sendVerificationEmail } = await import('./email-service');
      const { token, expires } = generateVerificationToken();
      
      // Update user with new token
      await storage.updateUserVerification(userId, false, token, expires);
      
      if (process.env.SENDGRID_API_KEY) {
        // Send verification email
        const result = await sendVerificationEmail(user.email, token, user.username);
        
        if (result) {
          res.status(200).json({ success: true, message: "Verification email sent" });
        } else {
          res.status(500).json({ error: "Failed to send verification email" });
        }
      } else {
        // If SendGrid is not configured, return a notice
        res.status(200).json({ 
          success: true, 
          message: "Email verification is disabled in development mode" 
        });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });
  
  // Email verification endpoint
  apiRouter.get("/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Invalid verification token" });
      }
      
      // Find user with this token
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(404).json({ error: "Invalid or expired verification token" });
      }
      
      // Check if token has expired
      if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
        return res.status(400).json({ error: "Verification token has expired" });
      }
      
      // Update user verification status
      await storage.updateUserVerification(user.id, true);
      
      // Redirect to the verification success page
      res.redirect('/auth?verified=success');
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });
  
  // Test email endpoint
  apiRouter.post("/test-email", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Ensure we have a verified sender email
      if (!process.env.EMAIL_FROM) {
        console.warn("EMAIL_FROM environment variable not set, using default");
        process.env.EMAIL_FROM = 'noreply@tablequeue.com';
      }
      
      console.log(`Using sender email: ${process.env.EMAIL_FROM}`);
      
      // Import the email service
      const { sendTestEmail } = await import('./email-service');
      
      // Send a test email
      const result = await sendTestEmail(email);
      
      if (result) {
        res.status(200).json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ 
          error: "Failed to send test email", 
          message: process.env.SENDGRID_API_KEY ? 
            "Error sending email. Check server logs for details." : 
            "SendGrid API key not configured"
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });
  
  // GET all restaurants
  apiRouter.get("/restaurants", async (req: Request, res: Response) => {
    try {
      const restaurants = await storage.getRestaurants();
      return res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      return res.status(500).json({ message: "Error fetching restaurants" });
    }
  });
  
  // GET single restaurant by ID
  apiRouter.get("/restaurants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      return res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      return res.status(500).json({ message: "Error fetching restaurant" });
    }
  });
  
  // Search restaurants
  apiRouter.get("/restaurants/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const restaurants = await storage.searchRestaurants(query);
      return res.json(restaurants);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      return res.status(500).json({ message: "Error searching restaurants" });
    }
  });
  
  // Create a new restaurant
  apiRouter.post("/restaurants", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const newRestaurant = await storage.createRestaurant(validatedData);
      return res.status(201).json(newRestaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating restaurant:", error);
      return res.status(500).json({ message: "Error creating restaurant" });
    }
  });
  
  // Update restaurant information
  apiRouter.patch("/restaurants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const updatedRestaurant = await storage.updateRestaurant(id, req.body);
      return res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      return res.status(500).json({ message: "Error updating restaurant" });
    }
  });
  
  // Update restaurant wait time status
  apiRouter.post("/restaurants/:id/wait-time", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const waitStatusSchema = z.object({
        status: waitStatusEnum,
        customTime: z.number().min(0).optional()
      });
      
      const { status, customTime } = waitStatusSchema.parse(req.body);
      
      const updatedRestaurant = await storage.updateWaitTime(id, status, customTime);
      return res.json(updatedRestaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error updating wait time:", error);
      return res.status(500).json({ message: "Error updating wait time" });
    }
  });
  
  // User routes - authentication would be added in a real app
  apiRouter.post("/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });
  
  // Get restaurants by owner
  apiRouter.get("/users/:userId/restaurants", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const restaurants = await storage.getRestaurantsByOwnerId(userId);
      return res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants by owner:", error);
      return res.status(500).json({ message: "Error fetching restaurants by owner" });
    }
  });
  
  // QR code generation endpoint
  apiRouter.post("/restaurants/:id/qr-code", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Generate or get existing QR code
      const qrCodeId = await storage.generateRestaurantQrCode(id);
      
      res.json({ qrCodeId });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Error generating QR code" });
    }
  });
  
  // Get restaurant by QR code
  apiRouter.get("/restaurants/qr/:qrCodeId", async (req: Request, res: Response) => {
    try {
      const { qrCodeId } = req.params;
      
      const restaurant = await storage.getRestaurantByQrCodeId(qrCodeId);
      if (!restaurant) {
        return res.status(404).json({ message: "Invalid QR code" });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error getting restaurant by QR code:", error);
      res.status(500).json({ message: "Error retrieving restaurant information" });
    }
  });
  
  // Waitlist endpoints
  apiRouter.get("/restaurants/:id/waitlist", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const waitlistEntries = await storage.getWaitlistEntries(id);
      res.json(waitlistEntries);
    } catch (error) {
      console.error("Error getting waitlist entries:", error);
      res.status(500).json({ message: "Error retrieving waitlist entries" });
    }
  });
  
  apiRouter.post("/restaurants/:id/waitlist", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Create waitlist entry
      const entry = await storage.createWaitlistEntry({
        ...req.body,
        restaurantId: id,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating waitlist entry:", error);
      res.status(500).json({ message: "Error adding to waitlist" });
    }
  });
  
  apiRouter.patch("/restaurants/:id/waitlist/:entryId", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const entryId = parseInt(req.params.entryId);
      if (isNaN(restaurantId) || isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Update waitlist entry
      const entry = await storage.updateWaitlistEntry(entryId, req.body);
      if (!entry) {
        return res.status(404).json({ message: "Waitlist entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error updating waitlist entry:", error);
      res.status(500).json({ message: "Error updating waitlist entry" });
    }
  });
  
  // Table type endpoints
  
  // GET all table types for a restaurant
  apiRouter.get("/restaurants/:id/table-types", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const tableTypes = await storage.getTableTypes(id);
      res.json(tableTypes);
    } catch (error) {
      console.error("Error fetching table types:", error);
      res.status(500).json({ message: "Error fetching table types" });
    }
  });
  
  // GET a specific table type
  apiRouter.get("/table-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid table type ID" });
      }
      
      const tableType = await storage.getTableType(id);
      if (!tableType) {
        return res.status(404).json({ message: "Table type not found" });
      }
      
      res.json(tableType);
    } catch (error) {
      console.error("Error fetching table type:", error);
      res.status(500).json({ message: "Error fetching table type" });
    }
  });
  
  // CREATE a new table type
  apiRouter.post("/restaurants/:id/table-types", ensureAuthenticated, ensureRestaurantOwner, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Validate request data
      const validatedData = insertTableTypeSchema.parse({
        ...req.body,
        restaurantId
      });
      
      // Create table type
      const tableType = await storage.createTableType(validatedData);
      res.status(201).json(tableType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating table type:", error);
      res.status(500).json({ message: "Error creating table type" });
    }
  });
  
  // UPDATE a table type
  apiRouter.patch("/table-types/:id", ensureAuthenticated, ensureRestaurantOwner, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid table type ID" });
      }
      
      // Check if table type exists
      const tableType = await storage.getTableType(id);
      if (!tableType) {
        return res.status(404).json({ message: "Table type not found" });
      }
      
      // Ensure user is owner of the restaurant this table type belongs to
      const restaurant = await storage.getRestaurant(tableType.restaurantId);
      if (!restaurant || !req.user || restaurant.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized - You don't own this restaurant" });
      }
      
      // Update table type
      const updatedTableType = await storage.updateTableType(id, req.body);
      res.json(updatedTableType);
    } catch (error) {
      console.error("Error updating table type:", error);
      res.status(500).json({ message: "Error updating table type" });
    }
  });
  
  // DELETE a table type
  apiRouter.delete("/table-types/:id", ensureAuthenticated, ensureRestaurantOwner, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid table type ID" });
      }
      
      // Check if table type exists
      const tableType = await storage.getTableType(id);
      if (!tableType) {
        return res.status(404).json({ message: "Table type not found" });
      }
      
      // Ensure user is owner of the restaurant this table type belongs to
      const restaurant = await storage.getRestaurant(tableType.restaurantId);
      if (!restaurant || !req.user || restaurant.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized - You don't own this restaurant" });
      }
      
      // Delete table type
      const success = await storage.deleteTableType(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete table type" });
      }
    } catch (error) {
      console.error("Error deleting table type:", error);
      res.status(500).json({ message: "Error deleting table type" });
    }
  });
  
  // Get capacity prediction for a restaurant with a specific party size
  apiRouter.get("/restaurants/:id/capacity-prediction", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const partySize = parseInt(req.query.partySize as string);
      if (isNaN(partySize) || partySize < 1) {
        return res.status(400).json({ message: "Invalid party size. Must be a positive number." });
      }
      
      // Get restaurant
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Get table types for the restaurant
      const tableTypes = await storage.getTableTypes(id);
      
      // Get current waitlist entries
      const waitlistEntries = await storage.getWaitlistEntries(id);
      
      // Calculate the prediction
      // This would typically use a complex algorithm, but for now we'll use a simple approach
      let estWaitTime = 0;
      
      if (restaurant.useAdvancedQueue && tableTypes.length > 0) {
        // Get suitable tables for this party size
        const suitableTables = tableTypes.filter(
          table => table.capacity >= partySize && table.isActive
        );
        
        // Active waitlist entries (not seated or cancelled)
        const activeWaitlist = waitlistEntries.filter(
          entry => entry.status === 'waiting' || entry.status === 'notified'
        );
        
        // Count available tables of suitable sizes
        const availableTables = suitableTables.reduce(
          (total, table) => total + table.count, 
          0
        );
        
        // Calculate people ahead in queue with similar party sizes
        const similarPartySizeEntries = activeWaitlist.filter(
          entry => Math.abs(entry.partySize - partySize) <= 2
        );
        
        // Get average turnover time
        const avgTurnoverTime = suitableTables.length > 0
          ? suitableTables.reduce((sum, table) => sum + table.estimatedTurnoverTime, 0) / suitableTables.length
          : 45; // Default 45 minutes
        
        // Base wait time from restaurant status
        const baseWaitTime = (() => {
          switch (restaurant.currentWaitStatus) {
            case 'available': return 0;
            case 'short': return 15;
            case 'long': return 30;
            case 'very_long': return 60;
            case 'closed': return 0;
            default: return 15;
          }
        })();
        
        // Adjust for custom wait time if set
        estWaitTime = restaurant.customWaitTime && restaurant.customWaitTime > 0
          ? restaurant.customWaitTime
          : baseWaitTime;
          
        // Add wait time for each person ahead with similar party size
        if (similarPartySizeEntries.length > 0) {
          estWaitTime += similarPartySizeEntries.length * (avgTurnoverTime / Math.max(1, availableTables));
        }
        
        // If no suitable tables, give a high wait time
        if (suitableTables.length === 0) {
          estWaitTime = 120; // 2 hours
        }
      } else {
        // Fallback to basic wait time if advanced queue is not enabled
        switch (restaurant.currentWaitStatus) {
          case 'available': estWaitTime = 0; break;
          case 'short': estWaitTime = 15; break;
          case 'long': estWaitTime = 30; break;
          case 'very_long': estWaitTime = 60; break;
          case 'closed': estWaitTime = 0; break;
          default: estWaitTime = 15;
        }
        
        // Adjust for party size
        if (partySize > 4) {
          estWaitTime = Math.round(estWaitTime * 1.5); // 50% longer wait for large parties
        }
      }
      
      // Round to nearest 5 minutes
      estWaitTime = Math.ceil(estWaitTime / 5) * 5;
      
      // Calculate next available time
      const nextAvailableTime = new Date(Date.now() + estWaitTime * 60 * 1000).toISOString();
      
      // Calculate recommended arrival time (15 minutes before estimated seating)
      const recommendedArrivalTime = new Date(Date.now() + (estWaitTime - 15) * 60 * 1000).toISOString();
      
      // Busy level as percentage
      const busyLevel = Math.min(100, Math.round(
        (waitlistEntries.filter(e => e.status === 'waiting' || e.status === 'notified').length / 
        Math.max(1, restaurant.tableCapacity || 10)) * 100
      ));
      
      // Confidence level based on available data
      const confidence = restaurant.useAdvancedQueue && tableTypes.length > 0 
        ? 'high' 
        : ((restaurant.customWaitTime ?? 0) > 0 ? 'medium' : 'low');
      
      // Return prediction
      res.json({
        restaurantId: id,
        partySize,
        estimatedWaitTime: estWaitTime,
        nextAvailableTime,
        recommendedArrivalTime,
        busyLevel,
        confidence,
        availableTables: restaurant.tableCapacity || 0
      });
      
    } catch (error) {
      console.error("Error generating capacity prediction:", error);
      res.status(500).json({ message: "Error generating capacity prediction" });
    }
  });
  
  // Analytics endpoints
  apiRouter.get("/restaurants/:id/analytics/daily", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if user is authorized to access this restaurant's data
      if (req.user.role !== 'admin') {
        const isOwner = await isRestaurantOwner(req.user.id, id);
        if (!isOwner) {
          return res.status(403).json({ error: "Unauthorized to access this restaurant's analytics" });
        }
      }
      
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;
      
      if (req.query.startDate && typeof req.query.startDate === 'string') {
        startDateObj = new Date(req.query.startDate);
      }
      
      if (req.query.endDate && typeof req.query.endDate === 'string') {
        endDateObj = new Date(req.query.endDate);
      }
      
      const analytics = await storage.getDailyAnalytics(id, startDateObj, endDateObj);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error retrieving daily analytics:", error);
      res.status(500).json({ error: "Failed to retrieve daily analytics" });
    }
  });
  
  apiRouter.get("/restaurants/:id/analytics/hourly", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if user is authorized to access this restaurant's data
      if (req.user.role !== 'admin') {
        const isOwner = await isRestaurantOwner(req.user.id, id);
        if (!isOwner) {
          return res.status(403).json({ error: "Unauthorized to access this restaurant's analytics" });
        }
      }
      
      if (!req.query.date || typeof req.query.date !== 'string') {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      
      const dateObj = new Date(req.query.date);
      
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const analytics = await storage.getHourlyAnalytics(id, dateObj);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error retrieving hourly analytics:", error);
      res.status(500).json({ error: "Failed to retrieve hourly analytics" });
    }
  });
  
  apiRouter.get("/restaurants/:id/analytics/tables", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if user is authorized to access this restaurant's data
      if (req.user.role !== 'admin') {
        const isOwner = await isRestaurantOwner(req.user.id, id);
        if (!isOwner) {
          return res.status(403).json({ error: "Unauthorized to access this restaurant's analytics" });
        }
      }
      
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;
      
      if (req.query.startDate && typeof req.query.startDate === 'string') {
        startDateObj = new Date(req.query.startDate);
      }
      
      if (req.query.endDate && typeof req.query.endDate === 'string') {
        endDateObj = new Date(req.query.endDate);
      }
      
      const analytics = await storage.getTableAnalytics(id, startDateObj, endDateObj);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error retrieving table analytics:", error);
      res.status(500).json({ error: "Failed to retrieve table analytics" });
    }
  });
  
  apiRouter.post("/restaurants/:id/analytics/generate", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Check if user is authorized to access this restaurant's data
      if (req.user.role !== 'admin') {
        const isOwner = await isRestaurantOwner(req.user.id, id);
        if (!isOwner) {
          return res.status(403).json({ error: "Unauthorized to manage this restaurant's analytics" });
        }
      }
      
      if (!req.body.date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      
      const dateObj = new Date(req.body.date);
      
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const success = await storage.generateAnalyticsFromWaitlist(id, dateObj);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Analytics generated successfully" 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "No waitlist data available for the specified date" 
        });
      }
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to generate analytics" 
      });
    }
  });
  
  // Register all routes with /api prefix
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
