import { Restaurant, TableType, WaitlistEntry, WaitStatus } from '@shared/schema';

// Interface for historical capacity data
interface HistoricalData {
  dayOfWeek: number;  // 0-6 (Sunday to Saturday)
  hour: number;       // 0-23
  averageWaitTime: number; // in minutes
  averagePartySize: number;
  totalCustomers: number;
}

// Interface for restaurant capacity analytics
export interface CapacityAnalytics {
  estimatedWaitTime: number; // in minutes
  confidence: 'high' | 'medium' | 'low';
  availableTables: number;
  busyLevel: number; // 0-100%
  nextAvailableTime: Date;
  recommendedArrivalTime?: Date;
}

/**
 * Calculate the estimated wait time for a party
 * @param restaurant The restaurant data
 * @param partySize Number of people in the party
 * @param tableTypes Available table types at the restaurant
 * @param currentWaitlist Current waitlist entries
 * @param historicalData Optional historical data for improved predictions
 */
export function calculateWaitTime(
  restaurant: Restaurant,
  partySize: number,
  tableTypes: TableType[],
  currentWaitlist: WaitlistEntry[],
  historicalData?: HistoricalData[]
): CapacityAnalytics {
  // Base wait time from restaurant's status
  let baseWaitTime = getBaseWaitTime(restaurant.currentWaitStatus);
  
  // Adjust for custom wait time if set
  if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
    baseWaitTime = restaurant.customWaitTime;
  }
  
  // Count active waitlist entries (those still waiting)
  const activeWaitlist = currentWaitlist.filter(
    entry => entry.status === 'waiting' || entry.status === 'notified'
  );
  
  // Find appropriate table types for this party size
  const suitableTables = tableTypes.filter(
    table => table.capacity >= partySize && table.isActive
  );
  
  // Count available tables of suitable sizes
  const availableTables = suitableTables.reduce(
    (total, table) => total + table.count, 
    0
  );
  
  // If no suitable tables exist, return high wait time
  if (suitableTables.length === 0) {
    return {
      estimatedWaitTime: 120, // Default to 2 hours for impossible seating
      confidence: 'high',
      availableTables: 0,
      busyLevel: 100,
      nextAvailableTime: new Date(Date.now() + 120 * 60 * 1000)
    };
  }
  
  // Calculate wait time based on party size and table availability
  let estimatedWaitTime = baseWaitTime;
  
  // Factor in people ahead in the queue with similar party sizes
  const similarPartySizeEntries = activeWaitlist.filter(
    entry => Math.abs(entry.partySize - partySize) <= 2
  );
  
  if (similarPartySizeEntries.length > 0) {
    // Add wait time for each person ahead with similar party size
    const additionalWait = similarPartySizeEntries.length * getAverageTableTurnoverTime(suitableTables);
    estimatedWaitTime += additionalWait;
  }
  
  // Adjust based on total active waitlist pressure
  const waitlistPressure = calculateWaitlistPressure(activeWaitlist, suitableTables);
  estimatedWaitTime = Math.round(estimatedWaitTime * waitlistPressure);
  
  // If historical data is available, adjust prediction
  if (historicalData && historicalData.length > 0) {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentHour = now.getHours();
    
    // Find historical data for current day and hour
    const relevantData = historicalData.find(
      data => data.dayOfWeek === currentDayOfWeek && data.hour === currentHour
    );
    
    if (relevantData) {
      // Adjust wait time based on historical averages
      const historicalAdjustment = relevantData.averageWaitTime / baseWaitTime;
      estimatedWaitTime = Math.round(estimatedWaitTime * historicalAdjustment);
    }
  }
  
  // Calculate next available time
  const nextAvailableTime = new Date(Date.now() + estimatedWaitTime * 60 * 1000);
  
  // Calculate busy level (0-100%)
  const busyLevel = Math.min(
    100, 
    Math.round((activeWaitlist.length / (availableTables || 1)) * 100)
  );
  
  // Determine confidence level
  const confidence = determineConfidenceLevel(
    historicalData !== undefined,
    suitableTables.length,
    activeWaitlist.length
  );
  
  // Calculate recommended arrival time (15 minutes before estimated seating)
  const recommendedArrivalTime = new Date(nextAvailableTime.getTime() - 15 * 60 * 1000);
  
  return {
    estimatedWaitTime,
    confidence,
    availableTables,
    busyLevel,
    nextAvailableTime,
    recommendedArrivalTime
  };
}

/**
 * Get the base wait time in minutes from a wait status
 */
function getBaseWaitTime(status: WaitStatus): number {
  switch (status) {
    case 'available': return 0;
    case 'short': return 15;
    case 'long': return 30;
    case 'very_long': return 60;
    case 'closed': return 0;
    default: return 15;
  }
}

/**
 * Calculate the average table turnover time from available table types
 */
function getAverageTableTurnoverTime(tables: TableType[]): number {
  if (tables.length === 0) return 30; // Default 30 minutes
  
  const totalTurnoverTime = tables.reduce(
    (sum, table) => sum + table.estimatedTurnoverTime, 
    0
  );
  
  return Math.round(totalTurnoverTime / tables.length);
}

/**
 * Calculate waitlist pressure (multiplier for wait time)
 * Higher values mean more pressure on available tables
 */
function calculateWaitlistPressure(
  waitlist: WaitlistEntry[],
  availableTables: TableType[]
): number {
  if (waitlist.length === 0) return 1;
  if (availableTables.length === 0) return 2;
  
  // Calculate total table capacity
  const totalTableCapacity = availableTables.reduce(
    (total, table) => total + (table.count * table.capacity), 
    0
  );
  
  // Calculate total people waiting
  const totalPeopleWaiting = waitlist.reduce(
    (total, entry) => total + entry.partySize, 
    0
  );
  
  // Calculate pressure ratio
  const pressureRatio = totalPeopleWaiting / (totalTableCapacity || 1);
  
  // Return value between 1.0 (low pressure) and 2.0 (high pressure)
  return Math.max(1, Math.min(2, 1 + pressureRatio));
}

/**
 * Determine confidence level of the wait time prediction
 */
function determineConfidenceLevel(
  hasHistoricalData: boolean,
  suitableTableCount: number,
  activeWaitlistCount: number
): 'high' | 'medium' | 'low' {
  if (hasHistoricalData && suitableTableCount > 0) {
    return 'high';
  } else if (suitableTableCount > 0) {
    return activeWaitlistCount > 10 ? 'medium' : 'high';
  } else {
    return 'low';
  }
}

/**
 * Format wait time for display
 * @param minutes Minutes to wait
 */
export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) {
    return 'No Wait';
  } else if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${remainingMinutes} min`;
    }
  }
}

/**
 * Format time for display
 * @param date Date object
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}