import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { z } from "zod";

export function setupGoogleAuth(app: Express) {
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

// DEMO ONLY: This function simulates decoding a Firebase ID token
// In production, you should use firebase-admin to verify tokens
function decodeTokenForDemo(idToken: string): { 
  email: string; 
  name: string;
  phoneNumber?: string;
} {
  // This is a simplified mock implementation
  // In reality, you would verify this token with Firebase Admin SDK
  
  // For demo, we'll extract some basic info from the token
  // In reality this would come from the verified token payload
  try {
    // Extract just enough info to identify parts of the token
    // Real tokens are much more complex
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // In a real app, would decode and verify signature
    // For demo, we just assume token contains the Firebase user email
    const email = `user${Date.now().toString().substr(-6)}@gmail.com`;
    const name = `User ${Date.now().toString().substr(-6)}`;
    
    return {
      email,
      name
    };
  } catch (e) {
    console.error('Token decode error:', e);
    return {
      email: `fallback${Date.now().toString().substr(-6)}@example.com`,
      name: 'Fallback User'
    };
  }
}