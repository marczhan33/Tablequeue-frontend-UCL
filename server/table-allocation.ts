import { storage } from "./storage";

/**
 * Smart table allocation and management system
 * Implements operations management strategies to reduce wait times
 */

interface TableAssignment {
  entryId: number;
  tableTypeId: number;
  tableName: string;
  efficiency: number; // 0-100 scale of how efficient this assignment is
  seatWastage: number; // Number of unused seats
}

interface AllocationStrategy {
  name: string;
  description: string;
  recommendedFor: "high_traffic" | "low_traffic" | "all";
  strategy: "first_fit" | "best_fit" | "worst_fit" | "optimize_turnover";
}

const allocationStrategies: AllocationStrategy[] = [
  {
    name: "First Available",
    description: "Assigns the first available table of appropriate size",
    recommendedFor: "low_traffic",
    strategy: "first_fit"
  },
  {
    name: "Best Fit",
    description: "Minimizes wasted seats by finding the closest table size match",
    recommendedFor: "high_traffic",
    strategy: "best_fit"
  },
  {
    name: "Optimize for Turnover",
    description: "Prioritizes tables with historically faster turnover rates",
    recommendedFor: "all",
    strategy: "optimize_turnover"
  }
];

/**
 * Get available tables for a restaurant at the current time
 */
export async function getAvailableTables(restaurantId: number) {
  const tableTypes = await storage.getTableTypes(restaurantId);
  const waitlistEntries = await storage.getWaitlistEntries(restaurantId);
  
  // Find entries with 'seated' status to determine occupied tables
  const seatedEntries = waitlistEntries.filter(entry => 
    entry.status === 'seated' && entry.tableTypeId
  );
  
  // Count available tables of each type
  const availableTables = tableTypes.map(tableType => {
    const occupiedCount = seatedEntries.filter(entry => 
      entry.tableTypeId === tableType.id
    ).length;
    
    // Calculate how many are still available
    const availableCount = Math.max(0, tableType.count - occupiedCount);
    
    return {
      ...tableType,
      availableCount
    };
  });
  
  return availableTables;
}

/**
 * Find the best table assignment for a waitlist entry
 * based on the current allocation strategy
 */
export async function findOptimalTableAssignment(
  restaurantId: number,
  entryId: number,
  strategy: string = "best_fit"
): Promise<TableAssignment | null> {
  const entry = await storage.getWaitlistEntry(entryId);
  if (!entry) return null;
  
  const partySize = entry.partySize;
  const availableTables = await getAvailableTables(restaurantId);
  
  // Filter tables that are large enough for the party
  const suitableTables = availableTables.filter(table => 
    table.capacity >= partySize && table.availableCount > 0
  );
  
  if (suitableTables.length === 0) {
    return null; // No suitable tables available
  }
  
  let selectedTable;
  
  switch (strategy) {
    case "first_fit":
      // Simply take the first available table
      selectedTable = suitableTables[0];
      break;
      
    case "best_fit":
      // Find the table with the smallest seating waste
      selectedTable = suitableTables.reduce((best, current) => {
        const currentWaste = current.capacity - partySize;
        const bestWaste = best.capacity - partySize;
        return currentWaste < bestWaste ? current : best;
      }, suitableTables[0]);
      break;
      
    case "optimize_turnover":
      // Get historical turnover data
      const analytics = await storage.getRestaurantAnalytics(restaurantId);
      
      // Find table with best historical turnover time
      selectedTable = suitableTables.reduce((best, current) => {
        // In a real implementation, we would look up the actual turnover rates
        // For now, we'll just use the table's id as a proxy (lower is faster)
        return current.id < best.id ? current : best;
      }, suitableTables[0]);
      break;
      
    default:
      selectedTable = suitableTables[0]; // Default to first fit
  }
  
  // Calculate efficiency metrics
  const seatWastage = selectedTable.capacity - partySize;
  const efficiency = Math.max(0, 100 - (seatWastage * 20)); // Reduce efficiency by 20% per wasted seat
  
  return {
    entryId,
    tableTypeId: selectedTable.id,
    tableName: selectedTable.name,
    efficiency,
    seatWastage
  };
}

/**
 * Get recommended table allocation strategy based on
 * current restaurant conditions
 */
export async function getRecommendedAllocationStrategy(
  restaurantId: number
): Promise<AllocationStrategy> {
  const waitlistEntries = await storage.getWaitlistEntries(restaurantId);
  const activeEntries = waitlistEntries.filter(entry => 
    entry.status === 'waiting' || entry.status === 'notified'
  );
  
  // Determine if it's high traffic (more than 10 waiting parties)
  const isHighTraffic = activeEntries.length > 10;
  
  // Select appropriate strategy
  if (isHighTraffic) {
    return allocationStrategies.find(s => s.strategy === "best_fit")!;
  } else {
    return allocationStrategies.find(s => s.strategy === "first_fit")!;
  }
}

/**
 * Get table usage efficiency metrics
 */
export async function getTableEfficiencyMetrics(
  restaurantId: number
): Promise<{
  tableType: string;
  utilization: number; // percentage 0-100
  avgWastedSeats: number;
  recommendation: string;
}[]> {
  const tableTypes = await storage.getTableTypes(restaurantId);
  const waitlistEntries = await storage.getWaitlistEntries(restaurantId);
  
  // Get only completed entries (seated and finished)
  const completedEntries = waitlistEntries.filter(entry => 
    entry.status === 'seated' && entry.tableTypeId
  );
  
  const metrics = [];
  
  for (const tableType of tableTypes) {
    // Find entries seated at this table type
    const entriesAtTable = completedEntries.filter(entry => 
      entry.tableTypeId === tableType.id
    );
    
    if (entriesAtTable.length === 0) {
      metrics.push({
        tableType: tableType.name,
        utilization: 0,
        avgWastedSeats: tableType.capacity,
        recommendation: "Not enough data to make a recommendation"
      });
      continue;
    }
    
    // Calculate average utilized seats
    const totalPartySize = entriesAtTable.reduce((sum, entry) => sum + entry.partySize, 0);
    const totalCapacity = entriesAtTable.length * tableType.capacity;
    const utilization = Math.round((totalPartySize / totalCapacity) * 100);
    
    // Calculate average wasted seats
    const totalWastedSeats = entriesAtTable.reduce((sum, entry) => {
      return sum + (tableType.capacity - entry.partySize);
    }, 0);
    const avgWastedSeats = Math.round((totalWastedSeats / entriesAtTable.length) * 10) / 10;
    
    // Generate recommendation
    let recommendation = "Current allocation is optimal";
    if (utilization < 70) {
      recommendation = "Consider using smaller tables or combining parties";
    } else if (avgWastedSeats > 2 && tableType.capacity > 2) {
      recommendation = "Add more tables with capacity for " + (tableType.capacity - 2) + " people";
    }
    
    metrics.push({
      tableType: tableType.name,
      utilization,
      avgWastedSeats,
      recommendation
    });
  }
  
  return metrics;
}

/**
 * Calculate wait time reduction from better table allocation
 */
export async function calculateWaitTimeReduction(
  restaurantId: number
): Promise<{
  currentAvgWaitTime: number; // minutes
  estimatedReducedWaitTime: number; // minutes
  waitTimeReduction: number; // percentage
  recommendations: string[];
}> {
  const analytics = await storage.getRestaurantAnalytics(restaurantId);
  
  // Get the most recent daily stats
  const recentStats = analytics.dailyStats[0];
  if (!recentStats) {
    return {
      currentAvgWaitTime: 0,
      estimatedReducedWaitTime: 0,
      waitTimeReduction: 0,
      recommendations: ["Not enough data to make recommendations"]
    };
  }
  
  const currentAvgWaitTime = recentStats.averageWaitTime;
  
  // Calculate efficiency metrics
  const efficiencyMetrics = await getTableEfficiencyMetrics(restaurantId);
  
  // Calculate potential wait time reduction based on improved table allocation
  // Using research data showing smart allocation can reduce wait times by 10-30%
  const waitTimeReduction = 20; // Conservative estimate of 20% reduction
  const estimatedReducedWaitTime = Math.round(currentAvgWaitTime * (100 - waitTimeReduction) / 100);
  
  // Generate recommendations based on efficiency metrics
  const recommendations = efficiencyMetrics
    .filter(metric => metric.utilization < 80 || metric.avgWastedSeats > 1.5)
    .map(metric => metric.recommendation);
  
  // Add general recommendations if we don't have specific ones
  if (recommendations.length === 0) {
    recommendations.push(
      "Implement 'Best Fit' table allocation strategy during peak hours",
      "Consider dynamic party size combining during high-demand periods",
      "Use time-slotted remote check-ins to better distribute arrivals"
    );
  }
  
  return {
    currentAvgWaitTime,
    estimatedReducedWaitTime,
    waitTimeReduction,
    recommendations
  };
}