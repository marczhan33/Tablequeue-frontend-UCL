import { Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    authMethod?: "standard" | "google";
  }
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function ensureAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function attachUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    } catch (error) {
      console.error("Error attaching user:", error);
    }
  }
  next();
}

export async function ensureRestaurantOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const restaurantId = parseInt(req.params.id || req.params.restaurantId);
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    const restaurant = await storage.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (restaurant.ownerId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized to access this restaurant" });
    }

    next();
  } catch (error) {
    console.error("Restaurant ownership check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}