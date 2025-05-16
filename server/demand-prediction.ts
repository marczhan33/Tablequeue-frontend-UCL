import { storage } from "./storage";

/**
 * Demand prediction service that implements customer behavior modeling
 * for optimizing restaurant wait times
 */

interface TimeSlot {
  hour: number;
  day: number;
  demand: number; // 0-10 scale of expected demand
}

interface DemandForecast {
  date: Date;
  hourlyDemand: {
    hour: number;
    demand: number; // 0-10 scale
    isHighDemand: boolean; // true if demand > 7
    suggestedDiscount?: number; // percentage discount to offer
  }[];
  peakHours: number[];
  lowDemandHours: number[];
  demandShiftingRecommendations: {
    fromHour: number;
    toHour: number;
    potentialReduction: number; // percentage
  }[];
}

/**
 * Calculate historical demand patterns based on
 * past waitlist data and capacity utilization
 */
export async function analyzeHistoricalDemand(restaurantId: number): Promise<TimeSlot[]> {
  const waitlistEntries = await storage.getWaitlistEntries(restaurantId);
  const analytics = await storage.getRestaurantAnalytics(restaurantId);
  
  // Group entries by day of week and hour
  const demandByTimeSlot = new Map<string, number>();
  
  // Initialize all days/hours with zero demand
  for (let day = 0; day < 7; day++) {
    for (let hour = 10; hour < 22; hour++) { // Assuming 10am-10pm operations
      const key = `${day}-${hour}`;
      demandByTimeSlot.set(key, 0);
    }
  }
  
  // Analyze historical data
  waitlistEntries.forEach(entry => {
    if (!entry.createdAt) return;
    
    const day = entry.createdAt.getDay();
    const hour = entry.createdAt.getHours();
    const key = `${day}-${hour}`;
    
    const currentDemand = demandByTimeSlot.get(key) || 0;
    demandByTimeSlot.set(key, currentDemand + 1);
  });
  
  // Normalize to 0-10 scale
  let maxDemand = 0;
  demandByTimeSlot.forEach(value => {
    maxDemand = Math.max(maxDemand, value);
  });
  
  const result: TimeSlot[] = [];
  demandByTimeSlot.forEach((value, key) => {
    const [day, hour] = key.split('-').map(Number);
    const normalizedDemand = maxDemand > 0 ? Math.round((value / maxDemand) * 10) : 0;
    
    result.push({
      day,
      hour,
      demand: normalizedDemand
    });
  });
  
  return result;
}

/**
 * Generate demand forecast for specific date
 * Use historical patterns plus current reservations
 */
export async function generateDemandForecast(
  restaurantId: number, 
  date: Date
): Promise<DemandForecast> {
  const historicalDemand = await analyzeHistoricalDemand(restaurantId);
  const day = date.getDay();
  
  // Get reservations for the specified date
  const reservations = []; // In a real system, this would come from a reservation table
  
  // Generate hourly forecast
  const hourlyDemand = [];
  for (let hour = 10; hour < 22; hour++) {
    const historicalSlot = historicalDemand.find(slot => slot.day === day && slot.hour === hour);
    const baselineDemand = historicalSlot?.demand || 0;
    
    // Count reservations for this hour
    const reservationsThisHour = reservations.filter(r => r.hour === hour).length;
    
    // Adjust demand based on reservations and day-specific factors
    let adjustedDemand = baselineDemand;
    
    // Weekend adjustment
    if (day === 5 || day === 6) { // Friday or Saturday
      adjustedDemand = Math.min(10, adjustedDemand * 1.2); // 20% higher demand on weekends
    }
    
    // Holiday adjustment would go here
    
    // Add hourly forecast
    const isHighDemand = adjustedDemand > 7;
    hourlyDemand.push({
      hour,
      demand: adjustedDemand,
      isHighDemand,
      suggestedDiscount: isHighDemand ? 0 : (7 - adjustedDemand) * 5 // 5-35% discount based on demand gap
    });
  }
  
  // Identify peak and low demand hours
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
    lowDemandHours.forEach(lowHour => {
      // Only recommend shifts that are within 2 hours
      if (Math.abs(peakHour - lowHour) <= 2) {
        demandShiftingRecommendations.push({
          fromHour: peakHour,
          toHour: lowHour,
          potentialReduction: 15 // Estimated 15% reduction in peak demand
        });
      }
    });
  });
  
  return {
    date,
    hourlyDemand,
    peakHours,
    lowDemandHours,
    demandShiftingRecommendations
  };
}

/**
 * Calculate optimal table capacity for normal operations
 * @param restaurantId Restaurant ID
 * @returns Optimal number of tables by size
 */
export async function calculateOptimalCapacity(restaurantId: number): Promise<{
  tableType: string;
  currentCount: number;
  recommendedCount: number;
  rationale: string;
}[]> {
  const tableTypes = await storage.getTableTypes(restaurantId);
  const historicalDemand = await analyzeHistoricalDemand(restaurantId);
  const analytics = await storage.getRestaurantAnalytics(restaurantId);
  
  // Get average party size
  const waitlistEntries = await storage.getWaitlistEntries(restaurantId);
  const partySizeDistribution = new Map<number, number>();
  
  waitlistEntries.forEach(entry => {
    const size = entry.partySize;
    partySizeDistribution.set(size, (partySizeDistribution.get(size) || 0) + 1);
  });
  
  const recommendations = [];
  
  for (const tableType of tableTypes) {
    const capacity = tableType.capacity;
    const currentCount = tableType.count;
    
    // Calculate optimal table count based on historical demand
    // and party size distribution
    let usage = 0;
    partySizeDistribution.forEach((count, size) => {
      if (size <= capacity && size > (capacity - 2)) {
        // Perfect or near-perfect fit
        usage += count;
      } else if (size <= capacity) {
        // Suboptimal fit (wasted seats)
        usage += count * 0.5; // Count these with 50% weight
      }
    });
    
    // Normalize usage
    const totalEntries = waitlistEntries.length || 1;
    const usageRatio = usage / totalEntries;
    
    // Calculate recommended tables
    let recommendedCount = currentCount;
    let rationale = "Current table count is optimal.";
    
    if (usageRatio > 0.3 && currentCount < 6) {
      // High usage, recommend more tables
      recommendedCount = currentCount + 1;
      rationale = `High demand for this table size (${Math.round(usageRatio * 100)}% of parties).`;
    } else if (usageRatio < 0.1 && currentCount > 1) {
      // Low usage, recommend fewer tables
      recommendedCount = currentCount - 1;
      rationale = `Low demand for this table size (only ${Math.round(usageRatio * 100)}% of parties).`;
    }
    
    recommendations.push({
      tableType: tableType.name,
      currentCount,
      recommendedCount,
      rationale
    });
  }
  
  return recommendations;
}

/**
 * Generate incentives to shift demand from peak to low-demand periods
 * @param restaurantId Restaurant ID
 * @param date Date to analyze
 * @returns Recommended incentives for demand shifting
 */
export async function generateDemandShiftingIncentives(
  restaurantId: number,
  date: Date
): Promise<{
  hour: number;
  incentive: string;
  discountPercentage: number;
  message: string;
}[]> {
  const forecast = await generateDemandForecast(restaurantId, date);
  const incentives = [];
  
  // Generate incentives for low-demand hours
  for (const hourData of forecast.hourlyDemand) {
    if (hourData.demand < 5) { // Low demand
      const discountPercentage = hourData.suggestedDiscount || 0;
      
      if (discountPercentage >= 10) {
        incentives.push({
          hour: hourData.hour,
          incentive: "discount",
          discountPercentage,
          message: `Enjoy ${discountPercentage}% off your meal when you dine at ${hourData.hour}:00 today!`
        });
      }
    }
  }
  
  // Check for potential demand-shifting from peak to low hours
  forecast.demandShiftingRecommendations.forEach(shift => {
    const fromHourStr = shift.fromHour.toString().padStart(2, '0');
    const toHourStr = shift.toHour.toString().padStart(2, '0');
    
    incentives.push({
      hour: shift.toHour,
      incentive: "shift",
      discountPercentage: 20,
      message: `Beat the rush at ${fromHourStr}:00! Come at ${toHourStr}:00 instead and enjoy 20% off your entire meal.`
    });
  });
  
  return incentives;
}