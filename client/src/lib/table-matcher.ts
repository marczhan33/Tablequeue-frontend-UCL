import { TableType, WaitlistEntry } from "@shared/schema";

/**
 * Interface for the result of a table matching operation
 */
interface TableMatchResult {
  tableTypeId: number;
  tableName: string;
  estimatedWaitTime: number;
  isOptimalMatch: boolean;
  reason?: string;
}

/**
 * Algorithm to match a party with the appropriate table type
 * @param tableTypes Available table types
 * @param partySize Number of people in the party
 * @param currentWaitlist Current waitlist entries
 * @returns The best matching table type ID or null if no match
 */
export function findBestTableMatch(
  tableTypes: TableType[],
  partySize: number,
  currentWaitlist?: WaitlistEntry[],
  preferredTableType?: string
): TableMatchResult | null {
  if (!tableTypes || tableTypes.length === 0) {
    return null;
  }

  // Filter out inactive table types
  const activeTableTypes = tableTypes.filter(table => table.isActive);
  if (activeTableTypes.length === 0) {
    return null;
  }
  
  // If there's a preferred table type name, try to match it first
  if (preferredTableType) {
    const preferredMatch = activeTableTypes.find(
      table => table.name.toLowerCase() === preferredTableType.toLowerCase() && 
               table.capacity >= partySize
    );
    
    if (preferredMatch) {
      return {
        tableTypeId: preferredMatch.id,
        tableName: preferredMatch.name,
        estimatedWaitTime: calculateWaitTimeForTableType(preferredMatch, currentWaitlist),
        isOptimalMatch: true,
        reason: "Matching preferred table type"
      };
    }
  }

  // Find all table types that can accommodate the party size
  const suitableTables = activeTableTypes.filter(
    table => table.capacity >= partySize
  );

  if (suitableTables.length === 0) {
    // Find the largest table type if no suitable table found
    const largestTable = activeTableTypes.reduce(
      (max, table) => (table.capacity > max.capacity ? table : max),
      activeTableTypes[0]
    );

    return {
      tableTypeId: largestTable.id,
      tableName: largestTable.name,
      estimatedWaitTime: calculateWaitTimeForTableType(largestTable, currentWaitlist),
      isOptimalMatch: false,
      reason: "Party size exceeds our largest table capacity, may require multiple tables"
    };
  }

  // Sort by best fit (minimize unused seats)
  suitableTables.sort((a, b) => {
    // Calculate wasted capacity
    const aWasted = a.capacity - partySize;
    const bWasted = b.capacity - partySize;
    
    if (aWasted === bWasted) {
      // If equal fit, shorter wait time wins
      return calculateWaitTimeForTableType(a, currentWaitlist) - 
             calculateWaitTimeForTableType(b, currentWaitlist);
    }
    
    return aWasted - bWasted;
  });

  // Return the best fit
  const bestTable = suitableTables[0];
  return {
    tableTypeId: bestTable.id,
    tableName: bestTable.name,
    estimatedWaitTime: calculateWaitTimeForTableType(bestTable, currentWaitlist),
    isOptimalMatch: bestTable.capacity - partySize <= 2, // Consider it optimal if 2 or fewer unused seats
    reason: bestTable.capacity === partySize 
      ? "Perfect size match" 
      : `Best available table for your party size of ${partySize}`
  };
}

/**
 * Calculate the estimated wait time for a specific table type
 * @param tableType The table type
 * @param currentWaitlist Current waitlist entries
 * @returns Estimated wait time in minutes
 */
function calculateWaitTimeForTableType(
  tableType: TableType,
  currentWaitlist?: WaitlistEntry[]
): number {
  if (!currentWaitlist || currentWaitlist.length === 0) {
    return 0; // No wait if no one is in line
  }

  // Count parties waiting for this table type
  const partiesWaiting = currentWaitlist.filter(
    entry => 
      // Either explicitly requesting this table type
      entry.tableTypeId === tableType.id ||
      // Or could use this table type based on party size (if table type not specified)
      (!entry.tableTypeId && entry.partySize <= tableType.capacity)
  ).length;

  // Basic wait time calculation
  const availableTables = tableType.count || 1;
  const estimatedTurnoverTime = tableType.estimatedTurnoverTime || 45; // Default 45 minutes
  
  // If parties waiting is less than available tables, no wait
  if (partiesWaiting < availableTables) {
    return 0;
  }
  
  // Calculate how many "rounds" of seating will occur before this party
  const waitingRounds = Math.ceil(partiesWaiting / availableTables);
  
  // Estimate wait time based on turnover time and waiting rounds
  return waitingRounds * estimatedTurnoverTime;
}

/**
 * Generate a plain language explanation of the wait time
 * @param waitTimeMinutes Estimated wait time in minutes
 * @returns Human-readable description
 */
export function formatWaitTimeDescription(waitTimeMinutes: number): string {
  if (waitTimeMinutes <= 0) {
    return "No wait, immediate seating";
  } else if (waitTimeMinutes <= 15) {
    return "Very short wait (under 15 minutes)";
  } else if (waitTimeMinutes <= 30) {
    return "Short wait (15-30 minutes)";
  } else if (waitTimeMinutes <= 60) {
    return "Moderate wait (30-60 minutes)";
  } else if (waitTimeMinutes <= 90) {
    return "Long wait (60-90 minutes)";
  } else {
    return `Very long wait (${Math.round(waitTimeMinutes / 60)} hours or more)`;
  }
}