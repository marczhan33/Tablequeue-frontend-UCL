import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRestaurantSchema, 
  insertWaitlistEntrySchema,
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
  
  // Register all routes with /api prefix
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
