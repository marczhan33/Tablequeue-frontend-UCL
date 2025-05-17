import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { z } from "zod";

export function setupGoogleAuth(app: Express) {
  // Debug Google auth issues
  app.get("/api/auth/status", (req: Request, res: Response) => {
    return res.status(200).json({
      isAuthenticated: !!req.user,
      user: req.user || null,
      session: req.session ? true : false
    });
  });
  
  // Validate Google ID token and create/update user in our system
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        idToken: z.string(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // In a real app, you'd verify the Google ID token here using Firebase Admin SDK
      // But for this demo, we'll extract the user info from the decoded token
      // This would normally be done using firebase-admin package
      
      // For demo purposes, we extract email from the token payload
      // In a real app, use proper Firebase Admin verification
      const userInfo = decodeTokenForDemo(result.data.idToken);

      // Check if user exists in our system by email
      let user = await storage.getUserByEmail(userInfo.email);

      if (!user) {
        // If user doesn't exist, create a new one
        // Generate a random username based on email
        const randomSuffix = randomBytes(4).toString('hex');
        const username = `user_${userInfo.email.split('@')[0]}_${randomSuffix}`;
        
        // Create the user in our database
        user = await storage.createUser({
          username,
          email: userInfo.email,
          // We don't need a real password since they authenticate with Google
          // But our schema requires one, so we generate a secure random one
          password: randomBytes(32).toString('hex'),
          role: 'customer',
          phone: userInfo.phoneNumber || '',
          isVerified: true, // Google users are automatically verified
        });
      }

      // Create a session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to create session" });
        }
        return res.status(200).json(user);
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}

// This function decodes a Firebase ID token
// For a production app, you would use firebase-admin SDK
// This implementation is more robust than the demo version
function decodeTokenForDemo(idToken: string): { 
  email: string; 
  name: string;
  phoneNumber?: string;
} {
  try {
    // Parse the token payload
    const parts = idToken.split('.');
    
    // Handle Firebase token format which might be different
    if (parts.length === 1) {
      // For demonstration purposes, we'll create a demo user when we can't parse the token
      console.log('Using demo user for authentication');
      return {
        email: `demo${Date.now().toString().substr(-6)}@example.com`,
        name: 'Demo User'
      };
    }
    
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Extract the payload part (the middle segment)
    const payload = parts[1];
    
    // Base64 decode and parse as JSON
    // Need to handle URL-safe base64 by replacing chars and padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const data = JSON.parse(jsonPayload);
    
    console.log('Successfully decoded token payload');
    
    // Extract user information
    return {
      email: data.email || `user${Date.now().toString().substr(-6)}@example.com`,
      name: data.name || data.displayName || `User ${Date.now().toString().substr(-6)}`,
      phoneNumber: data.phone_number
    };
  } catch (e) {
    console.error('Token decode error:', e);
    // Create a demo user with a timestamp to make it unique
    const timestamp = Date.now().toString().substr(-6);
    return {
      email: `demo${timestamp}@example.com`,
      name: `Demo User ${timestamp}`
    };
  }
}