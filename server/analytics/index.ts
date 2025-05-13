import { turnoverDataService } from './turnover-data-service';
import { WaitlistEntry } from '@shared/schema';

/**
 * Process and store turnover data when a table becomes available
 * @param entry The waitlist entry being processed
 */
export async function processTableTurnover(entry: WaitlistEntry): Promise<void> {
  try {
    // Only process entries that have been seated
    if (entry.status !== 'seated' || !entry.seatedAt) {
      return;
    }
    
    // We need a table type ID to attribute the turnover data
    if (!entry.tableTypeId) {
      return;
    }
    
    // Calculate turnover time based on entry timing
    // We'll use the seated time and either the time when the status changed to 'seated'
    // or a fixed turnover time based on restaurant settings
    const seatedTime = new Date(entry.seatedAt);
    
    // If we have arrival data, we can calculate more accurately
    let turnoverTimeMinutes = 0;
    
    if (entry.arrivedAt) {
      // Calculate the time from arrival to being seated
      const arrivedTime = new Date(entry.arrivedAt);
      turnoverTimeMinutes = Math.round((seatedTime.getTime() - arrivedTime.getTime()) / (1000 * 60));
    } else {
      // Use the restaurant's estimated turnover time as a fallback
      turnoverTimeMinutes = entry.estimatedWaitTime || 45; // Default to 45 minutes
    }
    
    // Store the turnover data
    await turnoverDataService.storeTableTurnoverData(
      entry.restaurantId,
      entry.tableTypeId,
      turnoverTimeMinutes,
      seatedTime
    );
    
  } catch (error) {
    console.error("Error processing table turnover:", error);
  }
}

/**
 * Initialize analytics system
 */
export function initializeAnalytics(): void {
  console.log("Table turnover analytics initialized");
}

export {
  turnoverDataService
};