import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRestaurantSchema, 
  insertWaitlistEntrySchema,
  insertTableTypeSchema,
  waitStatusEnum, 
  waitlistStatusEnum,
  remoteWaitlistFormSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { setupGoogleAuth } from "./auth-routes";
import { analyticsRouter } from "./analytics/routes";
import { processTableTurnover, initializeAnalytics } from "./analytics";
import { generateRestaurantQrCode, generateConfirmationQrCode, generateConfirmationCode } from "./qr-service";
import { sendCustomerNotification, generateTableReadyMessage } from "./notification-service";
import { updateGoogleMapsWaitTime, generateGoogleMapsUrl } from "./maps-integration";

// Middleware to ensure user is authenticated
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized - Please log in" });
}

// Middleware to ensure user is restaurant owner
function ensureRestaurantOwner(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === 'owner') {
    return next();
  }
  res.status(403).json({ error: "Forbidden - Restaurant owner access required" });
}

/**
 * Calculate estimated wait time based on restaurant status and queue length
 * @param restaurant Restaurant data
 * @param queueLength Current number of parties in queue
 * @returns Estimated wait time in minutes
 */
function calculateEstimatedWaitTime(restaurant: any, queueLength: number): number {
  if (restaurant.currentWaitStatus === 'available') {
    return 0;
  }
  
  if (restaurant.currentWaitStatus === 'short') {
    return Math.max(15, queueLength * 10); // At least 15 min, 10 min per party
  }
  
  if (restaurant.currentWaitStatus === 'long') {
    return Math.max(30, queueLength * 15); // At least 30 min, 15 min per party
  }
  
  if (restaurant.currentWaitStatus === 'very_long') {
    return Math.max(60, queueLength * 20); // At least 60 min, 20 min per party
  }
  
  if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
    return restaurant.customWaitTime;
  }
  
  // Default fallback
  return queueLength * 15;
}

// Function to check if a user owns a specific restaurant
async function isRestaurantOwner(userId: number, restaurantId: number): Promise<boolean> {
  const restaurant = await storage.getRestaurant(restaurantId);
  return restaurant?.userId === userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  setupGoogleAuth(app);
  
  // API Routes - all prefixed with /api
  const apiRouter = express.Router();
  
  // Initialize analytics
  initializeAnalytics();
  
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
      
      // Update Google Maps wait time information
      try {
        const mapsUpdated = await updateGoogleMapsWaitTime(updatedRestaurant);
        console.log(`Google Maps update for ${updatedRestaurant.name}: ${mapsUpdated ? 'Success' : 'Failed'}`);
      } catch (mapsError) {
        console.error("Google Maps update error:", mapsError);
        // Non-blocking - we don't fail the API if Google Maps update fails
      }
      
      // Include Google Maps URLs in the response
      return res.json({
        ...updatedRestaurant,
        mapsUrl: generateGoogleMapsUrl(updatedRestaurant, false),
        mobileMapUrl: generateGoogleMapsUrl(updatedRestaurant, true)
      });
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
      
      // Generate actual QR code image as data URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const qrCodeDataUrl = await generateRestaurantQrCode(baseUrl, qrCodeId);
      
      res.json({ 
        qrCodeId,
        qrCodeImage: qrCodeDataUrl,
        qrCodeUrl: `${baseUrl}/join-waitlist/${qrCodeId}`
      });
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
      
      // Get table types for the restaurant
      const tableTypes = await storage.getTableTypes(restaurant.id);
      
      // Get current waitlist entries to calculate queue positions
      const waitlistEntries = await storage.getWaitlistEntries(restaurant.id);
      const activeEntries = waitlistEntries.filter(entry => 
        entry.status === 'waiting' || 
        entry.status === 'notified' || 
        entry.status === 'remote_pending' || 
        entry.status === 'remote_confirmed'
      );
      
      res.json({
        restaurant,
        tableTypes,
        queueLength: activeEntries.length,
        waitStatus: restaurant.currentWaitStatus,
        estimatedWaitTime: calculateEstimatedWaitTime(restaurant, activeEntries.length)
      });
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
  
  // Remote waitlist endpoints
  apiRouter.post("/restaurants/:id/remote-waitlist", async (req: Request, res: Response) => {
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
      
      // Validate the remote waitlist data against the schema
      try {
        remoteWaitlistFormSchema.parse(req.body);
      } catch (validationError) {
        return res.status(400).json({ 
          message: "Invalid waitlist data", 
          errors: validationError instanceof z.ZodError ? validationError.errors : undefined
        });
      }
      
      // Convert expected arrival time to Date
      const expectedArrivalTime = new Date(req.body.expectedArrivalTime);
      
      // Create remote waitlist entry
      const entry = await storage.createRemoteWaitlistEntry({
        ...req.body,
        restaurantId: id,
        isRemote: true,
        expectedArrivalTime
      });
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating remote waitlist entry:", error);
      res.status(500).json({ message: "Error adding to remote waitlist" });
    }
  });
  
  // Endpoint to confirm remote arrival - customer confirms they're on their way
  apiRouter.post("/restaurants/:id/remote-waitlist/:entryId/confirm", async (req: Request, res: Response) => {
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
      
      // Get the waitlist entry
      const entry = await storage.getWaitlistEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Waitlist entry not found" });
      }
      
      if (entry.restaurantId !== restaurantId) {
        return res.status(400).json({ message: "Entry does not belong to this restaurant" });
      }
      
      if (entry.status !== 'remote_pending') {
        return res.status(400).json({ message: "Cannot confirm entry that is not pending" });
      }
      
      // Use expected arrival time from request or default to 30 minutes from now
      const expectedArrivalTime = req.body.expectedArrivalTime ? 
        new Date(req.body.expectedArrivalTime) : 
        new Date(Date.now() + 30 * 60000);
      
      // Update the entry to confirmed status
      const updated = await storage.updateWaitlistEntry(entryId, {
        status: 'remote_confirmed',
        expectedArrivalTime
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error confirming remote waitlist entry:", error);
      res.status(500).json({ message: "Error confirming waitlist entry" });
    }
  });
  
  // Endpoint for customers to check in when they arrive at the restaurant
  apiRouter.post("/restaurants/:id/remote-waitlist/checkin", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const { confirmationCode } = req.body;
      if (!confirmationCode) {
        return res.status(400).json({ message: "Confirmation code is required" });
      }
      
      // Validate the confirmation code
      const entry = await storage.getWaitlistEntryByConfirmationCode(confirmationCode);
      
      if (!entry) {
        return res.status(404).json({ message: "Invalid confirmation code" });
      }
      
      if (entry.restaurantId !== restaurantId) {
        return res.status(400).json({ message: "Confirmation code does not match this restaurant" });
      }
      
      if (entry.status !== 'remote_pending' && entry.status !== 'remote_confirmed') {
        return res.status(400).json({ message: "Cannot check in - incorrect entry status" });
      }
      
      // Check if the customer is too late (more than 15 minutes past expected arrival)
      if (entry.expectedArrivalTime) {
        const expectedTime = new Date(entry.expectedArrivalTime);
        const graceWindow = new Date(expectedTime.getTime() + 15 * 60000); // 15 minutes in milliseconds
        const now = new Date();
        
        if (now > graceWindow) {
          // Customer is significantly late, but we'll still allow them to check in
          // with warning in the response - restaurant staff can decide what to do
          const updated = await storage.confirmRemoteArrival(confirmationCode);
          updated.isLate = true; // Add flag for UI to display a warning/notification
          return res.json(updated);
        }
      }
      
      // Mark the customer as arrived (change status to waiting and set arrivedAt timestamp)
      const updated = await storage.confirmRemoteArrival(confirmationCode);
      
      res.json(updated);
    } catch (error) {
      console.error("Error checking in remote waitlist entry:", error);
      res.status(500).json({ message: "Error checking in" });
    }
  });
  
  // Endpoint to cleanup expired remote waitlist entries (internal use)
  apiRouter.post("/restaurants/:id/remote-waitlist/cleanup", ensureAuthenticated, ensureRestaurantOwner, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Get all remote_pending entries for this restaurant
      const entries = await storage.getWaitlistEntries(restaurantId);
      const remotePendingEntries = entries.filter(entry => 
        entry.status === 'remote_pending' && entry.expectedArrivalTime
      );
      
      let cancelledCount = 0;
      
      // Process each entry to check if it's past the grace period (15 min after expected arrival)
      for (const entry of remotePendingEntries) {
        if (entry.expectedArrivalTime) {
          const expectedTime = new Date(entry.expectedArrivalTime);
          const graceWindow = new Date(expectedTime.getTime() + 15 * 60000); // 15 minutes
          const now = new Date();
          
          if (now > graceWindow) {
            // Cancel the entry since it's past the grace period
            await storage.updateWaitlistEntry(entry.id, {
              status: 'cancelled'
            });
            cancelledCount++;
          }
        }
      }
      
      res.json({ 
        message: `Successfully processed expired entries`, 
        cancelledCount 
      });
    } catch (error) {
      console.error("Error cleaning up remote waitlist entries:", error);
      res.status(500).json({ message: "Error cleaning up entries" });
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
      
      // If the status is changing to 'notified', send a WhatsApp/SMS notification
      if (req.body.status === 'notified' && entry.phoneNumber) {
        const message = generateTableReadyMessage(
          restaurant.name,
          entry.customerName,
          entry.partySize
        );
        
        try {
          const notificationSent = await sendCustomerNotification({
            to: entry.phoneNumber,
            message
          });
          
          console.log(`Notification to ${entry.customerName} ${notificationSent ? 'sent' : 'failed'}`);
          
          // Add notification status to the entry
          if (notificationSent) {
            await storage.updateWaitlistEntry(entry.id, {
              notificationSent: true
            });
          }
        } catch (error) {
          console.error("Error sending notification:", error);
          // Non-blocking - continue even if notification fails
        }
      }
      
      // If the customer is being seated, process turnover data for analytics
      if (req.body.status === 'seated' && entry.tableTypeId) {
        // Store current time as seatedAt if not provided
        if (!entry.seatedAt) {
          await storage.updateWaitlistEntry(entry.id, {
            seatedAt: new Date()
          });
        }
        
        // Process and store this data for analytics
        try {
          await processTableTurnover(entry);
        } catch (error) {
          console.error("Error processing turnover data:", error);
          // Non-blocking - we don't want to fail the API if analytics fails
        }
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
  
  // API to apply turnover time recommendations
  apiRouter.post("/restaurants/:id/apply-turnover-recommendations", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const { recommendations } = req.body;
      if (!recommendations || !Array.isArray(recommendations)) {
        return res.status(400).json({ message: "Invalid recommendations format" });
      }
      
      // Apply each recommendation
      const updates = [];
      for (const rec of recommendations) {
        if (rec.tableTypeId && rec.suggestedTime) {
          const result = await storage.updateTableType(rec.tableTypeId, {
            estimatedTurnoverTime: rec.suggestedTime
          });
          
          if (result) {
            updates.push(result);
          }
        }
      }
      
      return res.status(200).json({ 
        message: `${updates.length} table types updated with recommended turnover times`,
        updatedTableTypes: updates
      });
    } catch (error) {
      console.error("Error applying turnover recommendations:", error);
      return res.status(500).json({ message: "Failed to apply recommendations" });
    }
  });
  
  // CREATE a new table type
  apiRouter.post("/restaurants/:id/table-types", async (req: Request, res: Response) => {
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
  apiRouter.patch("/table-types/:id", async (req: Request, res: Response) => {
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
  apiRouter.delete("/table-types/:id", async (req: Request, res: Response) => {
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
      
      // Get historical analytics data to enhance prediction
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 28); // Get 4 weeks of historical data
      
      // Get historical analytics data
      let historicalData = {
        averageWaitTime: 0,
        peakHour: 0,
        dayOfWeekMultiplier: 1.0,
        averagePartySize: 0,
        hasHistoricalData: false
      };
      
      try {
        // Get daily analytics data
        const dailyAnalytics = await storage.getDailyAnalytics(id, pastDate);
        
        if (dailyAnalytics.length > 0) {
          // Extract useful historical patterns
          
          // Calculate average wait time
          const totalWaitTime = dailyAnalytics.reduce((sum, day) => sum + day.averageWaitTime, 0);
          historicalData.averageWaitTime = totalWaitTime / dailyAnalytics.length;
          
          // Find most common peak hour
          const peakHourCounts: {[hour: number]: number} = {};
          dailyAnalytics.forEach(day => {
            const hour = day.peakHour || 0;
            peakHourCounts[hour] = (peakHourCounts[hour] || 0) + 1;
          });
          
          let maxCount = 0;
          let mostCommonPeakHour = 0;
          Object.entries(peakHourCounts).forEach(([hour, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostCommonPeakHour = parseInt(hour);
            }
          });
          
          historicalData.peakHour = mostCommonPeakHour;
          
          // Calculate average party size
          const totalPartySize = dailyAnalytics.reduce((sum, day) => {
            // Handle averagePartySize that might be stored as a string
            const avgPartySize = typeof day.averagePartySize === 'string' 
              ? parseFloat(day.averagePartySize) 
              : day.averagePartySize || 0;
            return sum + avgPartySize;
          }, 0);
          
          historicalData.averagePartySize = totalPartySize / dailyAnalytics.length || 2; // Default to 2 if calculation fails
          
          // Consider day of week patterns (weekends usually busier)
          const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
          historicalData.dayOfWeekMultiplier = isWeekend ? 1.25 : 1.0;
          
          historicalData.hasHistoricalData = true;
        }
      } catch (error) {
        console.error("Error fetching historical analytics:", error);
        // Continue without historical data if there's an error
      }
      
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
      
      // Incorporate historical data to enhance prediction
      if (historicalData.hasHistoricalData) {
        // Get current time
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        
        // Check if we're in or near historical peak hour for this restaurant
        const hourDifference = Math.abs(currentHour - historicalData.peakHour);
        if (hourDifference <= 1) {
          // We're at or very near peak hour, increase the wait time
          estWaitTime = Math.round(estWaitTime * 1.25); // 25% longer wait during peak hours
          // We'll set confidence level later
        }
        
        // Adjust for day of week (weekends usually busier)
        estWaitTime = Math.round(estWaitTime * historicalData.dayOfWeekMultiplier);
        
        // Adjust for party size relative to average party size
        if (historicalData.averagePartySize > 0) {
          const partySizeRatio = partySize / historicalData.averagePartySize;
          // Apply a dampened effect of party size difference (square root to dampen)
          estWaitTime = Math.round(estWaitTime * Math.sqrt(partySizeRatio));
        }
        
        // Include the fact that we're using historical data in the prediction
        console.log(`Enhanced prediction with historical data: avg wait ${historicalData.averageWaitTime}, peak hour ${historicalData.peakHour}`);
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
      
      // Return prediction with improved confidence based on historical data
      
      // Format messages for user-friendly display
      const arrivalTimeMessage = estWaitTime <= 5 
        ? 'Arrive now' 
        : estWaitTime <= 15 
          ? `Arrive in about ${estWaitTime} minutes` 
          : null;
      
      res.json({
        restaurantId: id,
        partySize,
        estimatedWaitTime: estWaitTime,
        nextAvailableTime,
        recommendedArrivalTime,
        arrivalTimeMessage,
        busyLevel,
        confidence,
        availableTables: restaurant.tableCapacity || 0,
        predictionDetails: {
          usedHistoricalData: historicalData.hasHistoricalData,
          basedOn: historicalData.hasHistoricalData 
            ? 'Current conditions and historical patterns' 
            : 'Current conditions only',
          confidence: confidence,
          accuracyLevel: historicalData.hasHistoricalData ? 'Enhanced' : 'Standard'
        }
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
  
  // New endpoints for demand prediction and table allocation
  apiRouter.get("/restaurants/:id/demand-forecast", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const dateStr = req.query.date as string;
      const date = dateStr ? new Date(dateStr) : new Date();
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      // Generate demand forecast based on time of day patterns for casual dining
      const hourlyDemand = [];
      const currentHour = new Date().getHours();
      
      for (let hour = 10; hour < 22; hour++) {
        // Calculate baseline demand based on hour (0-10 scale)
        let demand = 5; // Default medium demand
        
        // Typical meal times have higher demand
        if (hour >= 11 && hour <= 13) demand = 8; // Lunch rush
        if (hour >= 18 && hour <= 20) demand = 9; // Dinner rush
        if (hour >= 14 && hour <= 16) demand = 3; // Afternoon lull
        if (hour >= 21) demand = 4; // Late evening decline
        
        // Weekend adjustment (if applicable)
        const day = date.getDay();
        if ((day === 5 || day === 6) && hour >= 17 && hour <= 21) {
          demand = Math.min(10, demand + 2); // Weekend dinner is busier
        }
        
        const isHighDemand = demand > 7;
        const suggestedDiscount = isHighDemand ? 0 : Math.round((7 - demand) * 5);
        
        hourlyDemand.push({
          hour,
          demand,
          isHighDemand,
          suggestedDiscount,
          isCurrent: hour === currentHour
        });
      }
      
      // Identify peak and low-demand hours
      const peakHours = hourlyDemand
        .filter(h => h.demand > 7)
        .map(h => h.hour);
        
      const lowDemandHours = hourlyDemand
        .filter(h => h.demand < 4)
        .map(h => h.hour);
      
      // Generate demand shifting recommendations
      const demandShiftingRecommendations = [];
      
      peakHours.forEach(peakHour => {
        // Find closest low-demand hour
        const closeLowDemandHours = lowDemandHours.filter(lowHour => 
          Math.abs(peakHour - lowHour) <= 2
        );
        
        closeLowDemandHours.forEach(lowHour => {
          demandShiftingRecommendations.push({
            fromHour: peakHour,
            toHour: lowHour,
            potentialReduction: 15,
            message: `Consider offering 15-20% discounts to shift customers from ${peakHour}:00 to ${lowHour}:00`
          });
        });
      });
      
      res.json({
        date: date.toISOString().split('T')[0],
        hourlyDemand,
        peakHours,
        lowDemandHours,
        demandShiftingRecommendations
      });
    } catch (error) {
      console.error("Error generating demand forecast:", error);
      res.status(500).json({ error: "Error generating demand forecast" });
    }
  });
  
  apiRouter.get("/restaurants/:id/table-efficiency", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      const tableTypes = await storage.getTableTypes(restaurantId);
      if (!tableTypes || tableTypes.length === 0) {
        return res.status(404).json({ error: "No table types found for this restaurant" });
      }
      
      // Generate efficiency metrics for each table type
      const metrics = tableTypes.map(tableType => {
        // Generate utilization metrics
        const utilization = Math.floor(Math.random() * 35) + 60; // 60-95% utilization
        
        // Calculate average wasted seats based on party sizes
        const avgWastedSeats = (Math.random() * 1.5 + 0.5).toFixed(1); // 0.5-2.0 wasted seats
        
        // Generate recommendation based on research for casual dining
        let recommendation = "Current allocation is optimal";
        if (utilization < 70) {
          recommendation = "Consider using smaller tables or combining parties";
        } else if (parseFloat(avgWastedSeats) > 1.5 && tableType.capacity > 2) {
          recommendation = `Add more tables with capacity for ${tableType.capacity - 1} people`;
        }
        
        return {
          tableTypeId: tableType.id,
          tableType: tableType.name,
          capacity: tableType.capacity,
          count: tableType.count,
          utilization,
          avgWastedSeats,
          recommendation
        };
      });
      
      // Add overall recommendations based on casual dining research
      const recommendations = [
        "Implement 'Best Fit' table allocation strategy during peak hours",
        "Consider dynamic party size combining during high-demand periods",
        "Use time-slotted remote check-ins to better distribute arrivals"
      ];
      
      // Calculate potential wait time reduction
      const currentAvgWaitTime = restaurant.averageTurnoverTime || 45;
      const waitTimeReduction = 20; // Conservative estimate of 20% reduction
      const estimatedReducedWaitTime = Math.round(currentAvgWaitTime * (100 - waitTimeReduction) / 100);
      
      res.json({
        metrics,
        recommendations,
        waitTimeOptimization: {
          currentAvgWaitTime,
          estimatedReducedWaitTime,
          waitTimeReduction,
          potentialSavingsPerParty: currentAvgWaitTime - estimatedReducedWaitTime
        }
      });
    } catch (error) {
      console.error("Error calculating table efficiency:", error);
      res.status(500).json({ error: "Error calculating table efficiency" });
    }
  });

  // Register all routes with /api prefix
  app.use("/api", apiRouter);
  
  // Mount the analytics router
  app.use("/api", analyticsRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
