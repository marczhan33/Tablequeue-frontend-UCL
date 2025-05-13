import { Router, Request, Response } from 'express';
import { turnoverDataService } from './turnover-data-service';

const analyticsRouter = Router();

/**
 * Get turnover analytics for a restaurant
 */
analyticsRouter.get('/restaurants/:id/turnover-analytics', async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id);
    if (isNaN(restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant ID" });
    }
    
    // Get date range from query params
    let startDate = new Date();
    let endDate = new Date();
    
    // Default to last 30 days if not specified
    startDate.setDate(startDate.getDate() - 30);
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    // Get industry comparison
    const comparison = await turnoverDataService.getIndustryComparison(
      restaurantId,
      startDate,
      endDate
    );
    
    // Get seasonal trends
    const trends = await turnoverDataService.getSeasonalTrends(restaurantId);
    
    return res.status(200).json({
      industryComparison: comparison,
      seasonalTrends: trends,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error("Error getting turnover analytics:", error);
    return res.status(500).json({ message: "Failed to get turnover analytics" });
  }
});

/**
 * Export anonymized turnover data (admin only endpoint)
 */
analyticsRouter.get('/analytics/export-turnover-data', async (req: Request, res: Response) => {
  try {
    // Check if user is admin - would use proper auth in production
    if (req.query.key !== 'admin-export-key') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    // Get date range from query params
    let startDate = new Date();
    let endDate = new Date();
    
    // Default to last 90 days if not specified
    startDate.setDate(startDate.getDate() - 90);
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    // Get format
    const format = (req.query.format as string || 'json') as 'json' | 'csv';
    
    // Export data
    const data = await turnoverDataService.exportAnonymizedTurnoverData(
      startDate,
      endDate,
      format
    );
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="turnover-data.csv"');
      return res.status(200).send(data);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error exporting turnover data:", error);
    return res.status(500).json({ message: "Failed to export turnover data" });
  }
});

export { analyticsRouter };