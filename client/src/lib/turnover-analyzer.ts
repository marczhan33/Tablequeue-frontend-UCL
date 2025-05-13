import { TableType, WaitlistEntry } from "@shared/schema";

interface TurnoverAnalysis {
  tableTypeId: number;
  tableName: string;
  actualTurnoverTime: number;  // In minutes
  sampleSize: number;          // Number of data points used
  confidence: 'low' | 'medium' | 'high';
  recommendation?: {
    suggestedTime: number;
    percentDifference: number;
  };
}

/**
 * Analyze turnover times based on historical waitlist data
 * @param tableTypes Table types to analyze
 * @param waitlistHistory Historical waitlist entries (must include seatedAt timestamps)
 * @returns Analysis of actual turnover times by table type
 */
export function analyzeTurnoverTimes(
  tableTypes: TableType[],
  waitlistHistory: WaitlistEntry[]
): TurnoverAnalysis[] {
  const results: TurnoverAnalysis[] = [];
  
  // Group waitlist entries by table type
  const entriesByTableType = new Map<number, WaitlistEntry[]>();
  
  // Only consider entries that have been seated and have valid timestamps
  const validEntries = waitlistHistory.filter(
    entry => entry.seatedAt && entry.status === 'seated'
  );
  
  // Group entries by table type
  validEntries.forEach(entry => {
    if (entry.tableTypeId) {
      const entries = entriesByTableType.get(entry.tableTypeId) || [];
      entries.push(entry);
      entriesByTableType.set(entry.tableTypeId, entries);
    }
  });
  
  // Analyze each table type
  tableTypes.forEach(tableType => {
    const entries = entriesByTableType.get(tableType.id) || [];
    if (entries.length === 0) {
      return; // Skip table types with no data
    }
    
    // Calculate actual turnover times
    const turnoverTimes: number[] = [];
    
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i];
      const next = entries[i + 1];
      
      // Find sequential uses of the same table type
      if (current.seatedAt && next.seatedAt) {
        const currentSeatedAt = new Date(current.seatedAt);
        const nextSeatedAt = new Date(next.seatedAt);
        
        // Calculate minutes between seatings
        const minutesBetween = (nextSeatedAt.getTime() - currentSeatedAt.getTime()) / (1000 * 60);
        
        // Only consider reasonable times (filter out overnight gaps, etc.)
        if (minutesBetween > 10 && minutesBetween < 300) {
          turnoverTimes.push(minutesBetween);
        }
      }
    }
    
    if (turnoverTimes.length === 0) {
      return; // Skip if no valid turnover times calculated
    }
    
    // Calculate average turnover time
    const averageTurnoverTime = turnoverTimes.reduce((sum, time) => sum + time, 0) / turnoverTimes.length;
    
    // Determine confidence level based on sample size
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (turnoverTimes.length >= 50) {
      confidence = 'high';
    } else if (turnoverTimes.length >= 15) {
      confidence = 'medium';
    }
    
    // Create recommendation if actual differs significantly from estimate
    let recommendation;
    const percentDifference = ((averageTurnoverTime - tableType.estimatedTurnoverTime) / tableType.estimatedTurnoverTime) * 100;
    
    // If the difference is more than 15%, suggest an update
    if (Math.abs(percentDifference) > 15 && confidence !== 'low') {
      recommendation = {
        suggestedTime: Math.round(averageTurnoverTime),
        percentDifference: Math.round(percentDifference)
      };
    }
    
    results.push({
      tableTypeId: tableType.id,
      tableName: tableType.name,
      actualTurnoverTime: Math.round(averageTurnoverTime),
      sampleSize: turnoverTimes.length,
      confidence,
      recommendation
    });
  });
  
  return results;
}

/**
 * Get a plain language description of turnover analysis
 * @param analysis The turnover analysis result
 * @returns Human-readable explanation
 */
export function getTurnoverAnalysisDescription(analysis: TurnoverAnalysis): string {
  const { tableName, actualTurnoverTime, sampleSize, confidence, recommendation } = analysis;
  
  let description = `${tableName}: Based on ${sampleSize} table seatings, the actual average turnover time is approximately ${actualTurnoverTime} minutes`;
  
  if (recommendation) {
    const direction = recommendation.percentDifference > 0 ? 'longer' : 'shorter';
    description += `. This is ${Math.abs(Math.round(recommendation.percentDifference))}% ${direction} than your estimate.`;
    description += ` We recommend updating to ${recommendation.suggestedTime} minutes for more accurate wait times.`;
  } else {
    description += ". This appears to match your current estimate.";
  }
  
  // Add confidence qualifier
  if (confidence === 'low') {
    description += " (Note: This analysis is based on limited data and may not be fully representative.)";
  }
  
  return description;
}

/**
 * Generate aggregate turnover analytics for the restaurant dashboard
 * @param analyses Individual table type analyses
 * @returns Dashboard-friendly summary statistics
 */
export function generateTurnoverSummary(analyses: TurnoverAnalysis[]) {
  if (analyses.length === 0) {
    return null;
  }
  
  const totalTables = analyses.reduce((sum, analysis) => sum + 1, 0);
  const tablesNeedingAdjustment = analyses.filter(a => a.recommendation).length;
  
  const averageActualTime = Math.round(
    analyses.reduce((sum, a) => sum + a.actualTurnoverTime, 0) / analyses.length
  );
  
  return {
    totalTablesAnalyzed: totalTables,
    tablesNeedingAdjustment,
    averageTurnoverTime: averageActualTime,
    confidence: analyses.some(a => a.confidence === 'high') ? 'high' : 
               (analyses.some(a => a.confidence === 'medium') ? 'medium' : 'low')
  };
}