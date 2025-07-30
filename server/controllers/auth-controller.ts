import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage.js";
import { hashPassword, comparePasswords } from "../auth.js";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.errors });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set up session
      req.session.userId = user.id;
      req.session.authMethod = "standard";

      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        message: "Login successful", 
        user: userWithoutPassword,
        authMethod: "standard"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.errors });
      }

      const { username, password, phone } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email: "", // Will be updated when user adds email
        phone,
      });

      // Set up session
      req.session.userId = newUser.id;
      req.session.authMethod = "standard";

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ 
        message: "Registration successful", 
        user: userWithoutPassword,
        authMethod: "standard"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const result = googleAuthSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.errors });
      }

      const { idToken } = result.data;
      
      // Note: Firebase Admin integration will be implemented when needed
      // For now, return a placeholder response
      res.status(501).json({ error: "Google authentication not yet implemented" });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ error: "Google authentication failed" });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getStatus(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.json({
          isAuthenticated: false,
          user: null,
          session: {
            exists: !!req.session,
            authMethod: null
          }
        });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Session exists but user not found - clear session
        req.session.destroy(() => {});
        return res.json({
          isAuthenticated: false,
          user: null,
          session: {
            exists: false,
            authMethod: null
          }
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        isAuthenticated: true,
        user: userWithoutPassword,
        session: {
          exists: true,
          authMethod: req.session.authMethod || "standard"
        }
      });
    } catch (error) {
      console.error("Auth status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}