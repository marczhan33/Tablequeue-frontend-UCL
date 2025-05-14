import { Router, Request, Response } from 'express';
import { turnoverDataService } from './turnover-data-service';
import { storage } from '../storage';

// Create an express router for analytics endpoints
export const analyticsRouter = Router();

/**
 * Get turnover analytics for a restaurant
 */
analyticsRouter.get('/restaurants/:id/turnover-analytics', async (req: Request, res: Response) => {
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
    
    // Verify user has access to this restaurant
    if (req.user && req.user.id !== restaurant.userId) {
      // If the user is not the restaurant owner and not an admin, reject the request
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access to restaurant data" });
      }
    }
    
    // Get date range parameters with defaults (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    // Parse query parameters if provided
    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }
    
    // Get seasonal trends
    const seasonalTrends = await turnoverDataService.getSeasonalTrends(restaurantId);
    
    // Get industry comparison
    const industryComparison = await turnoverDataService.getIndustryComparison(
      restaurantId, 
      startDate,
      endDate
    );
    
    // Return combined analytics data
    res.json({
      seasonalTrends,
      industryComparison
    });
  } catch (error) {
    console.error("Error fetching turnover analytics:", error);
    res.status(500).json({ message: "Error fetching turnover analytics" });
  }
});

/**
 * Export anonymized turnover data (admin only endpoint)
 */
analyticsRouter.get('/analytics/export-turnover-data', async (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated and has admin privileges
    if (!req.user || !req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized access to export data" });
    }
    
    // Get date range parameters with defaults (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    
    // Parse query parameters if provided
    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }
    
    // Export data
    const data = await turnoverDataService.exportAnonymizedTurnoverData(
      startDate,
      endDate
    );
    
    res.json(data);
  } catch (error) {
    console.error("Error exporting turnover data:", error);
    res.status(500).json({ message: "Error exporting turnover data" });
  }
});