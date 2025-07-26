/**
 * AI-Powered Table Management System
 * Uses intelligent algorithms to optimize table assignments and waitlist management
 */

interface TableAssignment {
  tableTypeId: number;
  tableCount: number;
  confidence: number;
  reasoning: string;
}

interface OptimizationSuggestion {
  action: 'seat_immediately' | 'combine_tables' | 'wait_for_optimal' | 'notify_early';
  partyId?: number;
  tableAssignment?: TableAssignment;
  estimatedWaitReduction?: number;
  reasoning: string;
  confidence: number;
}

export class AITableOptimizer {
  /**
   * Analyzes current waitlist and suggests optimal seating arrangements
   */
  static analyzeWaitlistOptimization(
    waitlistEntries: any[],
    tableTypes: any[],
    currentTime: Date = new Date()
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const activeEntries = waitlistEntries.filter(e => e.status === 'waiting' || e.status === 'notified');
    
    // AI Algorithm 1: Early Seating Opportunities
    suggestions.push(...this.findEarlySeatings(activeEntries, tableTypes));
    
    // AI Algorithm 2: Optimal Table Combinations
    suggestions.push(...this.optimizeTableCombinations(activeEntries, tableTypes));
    
    // AI Algorithm 3: Strategic Wait Time Optimization
    suggestions.push(...this.optimizeWaitSequence(activeEntries, tableTypes));
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * AI Algorithm 1: Identifies parties that can be seated earlier than expected
   */
  private static findEarlySeatings(
    waitlistEntries: any[],
    tableTypes: any[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    for (const entry of waitlistEntries) {
      // Check if smaller parties can use larger tables during low-demand periods
      const oversizedTables = tableTypes.filter(table => 
        table.capacity > entry.partySize && 
        table.capacity <= entry.partySize * 1.5 && // Not too oversized
        table.isActive &&
        table.count > 0
      );
      
      if (oversizedTables.length > 0) {
        const bestTable = oversizedTables.sort((a, b) => a.capacity - b.capacity)[0];
        const efficiencyScore = entry.partySize / bestTable.capacity;
        
        if (efficiencyScore > 0.6) { // 60% efficiency threshold
          suggestions.push({
            action: 'seat_immediately',
            partyId: entry.id,
            tableAssignment: {
              tableTypeId: bestTable.id,
              tableCount: 1,
              confidence: efficiencyScore * 100,
              reasoning: `Party of ${entry.partySize} can efficiently use ${bestTable.name} (${Math.round(efficiencyScore * 100)}% capacity utilization)`
            },
            estimatedWaitReduction: this.calculateWaitReduction(entry, bestTable),
            reasoning: `Efficient table utilization during low-demand period`,
            confidence: Math.round(efficiencyScore * 85)
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * AI Algorithm 2: Optimizes table combinations for maximum efficiency
   */
  private static optimizeTableCombinations(
    waitlistEntries: any[],
    tableTypes: any[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Group parties by optimal table combination potential
    const largeParties = waitlistEntries.filter(e => e.partySize >= 7);
    
    for (const party of largeParties) {
      const combinations = this.findOptimalCombinations(party.partySize, tableTypes);
      
      if (combinations.length > 0) {
        const bestCombination = combinations[0];
        
        suggestions.push({
          action: 'combine_tables',
          partyId: party.id,
          tableAssignment: bestCombination,
          estimatedWaitReduction: this.calculateCombinationBenefit(party, bestCombination),
          reasoning: `Optimal table combination reduces wait time significantly`,
          confidence: bestCombination.confidence
        });
      }
    }
    
    return suggestions;
  }

  /**
   * AI Algorithm 3: Optimizes the sequence of seating to minimize overall wait times
   */
  private static optimizeWaitSequence(
    waitlistEntries: any[],
    tableTypes: any[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Analyze if reordering the queue would benefit overall efficiency
    const sortedByOptimalTable = waitlistEntries.sort((a, b) => {
      const aOptimal = this.getOptimalTableType(a.partySize, tableTypes);
      const bOptimal = this.getOptimalTableType(b.partySize, tableTypes);
      
      if (!aOptimal || !bOptimal) return 0;
      
      // Prioritize parties that use tables more efficiently
      const aEfficiency = a.partySize / aOptimal.capacity;
      const bEfficiency = b.partySize / bOptimal.capacity;
      
      return bEfficiency - aEfficiency;
    });

    // Check for early notification opportunities
    for (let i = 0; i < Math.min(3, sortedByOptimalTable.length); i++) {
      const party = sortedByOptimalTable[i];
      const optimalTable = this.getOptimalTableType(party.partySize, tableTypes);
      
      if (optimalTable && this.shouldNotifyEarly(party, optimalTable)) {
        suggestions.push({
          action: 'notify_early',
          partyId: party.id,
          reasoning: `Early notification can reduce perceived wait time and improve table turnover`,
          confidence: 75
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Finds optimal table combinations for a given party size
   */
  private static findOptimalCombinations(
    partySize: number,
    tableTypes: any[]
  ): TableAssignment[] {
    const combinations: TableAssignment[] = [];
    const activeTableTypes = tableTypes.filter(t => t.isActive);
    
    for (const tableType of activeTableTypes) {
      const tablesNeeded = Math.ceil(partySize / tableType.capacity);
      
      if (tablesNeeded <= tableType.count && tablesNeeded <= 3) {
        const efficiency = partySize / (tableType.capacity * tablesNeeded);
        const availabilityScore = (tableType.count - tablesNeeded + 1) / tableType.count;
        const confidence = Math.round((efficiency * 0.7 + availabilityScore * 0.3) * 100);
        
        combinations.push({
          tableTypeId: tableType.id,
          tableCount: tablesNeeded,
          confidence,
          reasoning: `${tablesNeeded}x ${tableType.name} provides ${Math.round(efficiency * 100)}% efficiency`
        });
      }
    }
    
    return combinations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Gets the optimal table type for a party size
   */
  private static getOptimalTableType(partySize: number, tableTypes: any[]) {
    return tableTypes
      .filter(table => table.capacity >= partySize && table.isActive)
      .sort((a, b) => a.capacity - b.capacity)[0];
  }

  /**
   * Calculates wait time reduction from immediate seating
   */
  private static calculateWaitReduction(entry: any, table: any): number {
    const averageWaitTime = 25; // Average wait time in minutes
    const urgencyFactor = this.calculateUrgencyFactor(entry);
    return Math.round(averageWaitTime * urgencyFactor);
  }

  /**
   * Calculates benefit of table combination
   */
  private static calculateCombinationBenefit(party: any, combination: TableAssignment): number {
    const baseBenefit = 30; // Base time reduction in minutes
    const efficiencyBonus = (combination.confidence / 100) * 20;
    return Math.round(baseBenefit + efficiencyBonus);
  }

  /**
   * Determines if a party should be notified early
   */
  private static shouldNotifyEarly(party: any, optimalTable: any): boolean {
    const waitTime = new Date().getTime() - new Date(party.joinedAt).getTime();
    const waitTimeMinutes = waitTime / (1000 * 60);
    
    // Notify early if they've been waiting more than 15 minutes and table utilization is good
    return waitTimeMinutes > 15 && party.partySize / optimalTable.capacity > 0.7;
  }

  /**
   * Calculates urgency factor based on wait time and party characteristics
   */
  private static calculateUrgencyFactor(entry: any): number {
    const waitTime = new Date().getTime() - new Date(entry.joinedAt).getTime();
    const waitTimeMinutes = waitTime / (1000 * 60);
    
    let urgencyFactor = 0.5; // Base urgency
    
    // Increase urgency for longer waits
    if (waitTimeMinutes > 30) urgencyFactor += 0.3;
    if (waitTimeMinutes > 60) urgencyFactor += 0.2;
    
    // Increase urgency for larger parties (harder to accommodate)
    if (entry.partySize >= 6) urgencyFactor += 0.2;
    if (entry.partySize >= 8) urgencyFactor += 0.1;
    
    return Math.min(urgencyFactor, 1.0);
  }

  /**
   * Predicts optimal table turnover times using AI analysis
   */
  static predictOptimalTurnover(
    tableType: any,
    currentOccupancy: number,
    timeOfDay: number,
    dayOfWeek: number
  ): number {
    let baseTurnover = tableType.estimatedTurnoverTime;
    
    // AI adjustments based on patterns
    const rushHourMultiplier = this.getRushHourMultiplier(timeOfDay);
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.15 : 1.0;
    const occupancyMultiplier = this.getOccupancyMultiplier(currentOccupancy);
    
    const predictedTurnover = baseTurnover * rushHourMultiplier * weekendMultiplier * occupancyMultiplier;
    
    return Math.round(predictedTurnover);
  }

  private static getRushHourMultiplier(hour: number): number {
    // Lunch rush: 11:30 AM - 1:30 PM
    if (hour >= 11.5 && hour <= 13.5) return 1.25;
    
    // Dinner rush: 6:00 PM - 8:30 PM
    if (hour >= 18 && hour <= 20.5) return 1.3;
    
    // Off-peak hours
    if (hour < 11 || hour > 21) return 0.85;
    
    return 1.0;
  }

  private static getOccupancyMultiplier(occupancyRate: number): number {
    // Higher occupancy = longer turnover times
    if (occupancyRate > 0.9) return 1.2;
    if (occupancyRate > 0.7) return 1.1;
    if (occupancyRate < 0.3) return 0.9;
    
    return 1.0;
  }
}