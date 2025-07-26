/**
 * AI-Powered Demand Prediction System
 * Predicts restaurant demand patterns and optimizes capacity planning
 */

interface DemandPrediction {
  timeSlot: string;
  predictedWaitTime: number;
  predictedPartySize: number;
  confidenceLevel: number;
  factors: string[];
}

interface CapacityRecommendation {
  recommendedAction: 'increase_staff' | 'prepare_combinations' | 'extend_hours' | 'optimize_turnover';
  reasoning: string;
  impact: number; // Expected improvement in minutes
  priority: 'high' | 'medium' | 'low';
}

export class AIDemandPredictor {
  /**
   * Predicts demand for the next few hours based on historical patterns
   */
  static predictUpcomingDemand(
    historicalData: any[],
    currentTime: Date = new Date(),
    weatherFactor: number = 1.0,
    specialEvents: string[] = []
  ): DemandPrediction[] {
    const predictions: DemandPrediction[] = [];
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    
    // Predict for next 4 hours
    for (let i = 0; i < 4; i++) {
      const targetHour = (hour + i) % 24;
      const prediction = this.predictDemandForHour(
        targetHour,
        dayOfWeek,
        historicalData,
        weatherFactor,
        specialEvents
      );
      predictions.push(prediction);
    }
    
    return predictions;
  }

  /**
   * Predicts demand for a specific hour
   */
  private static predictDemandForHour(
    hour: number,
    dayOfWeek: number,
    historicalData: any[],
    weatherFactor: number,
    specialEvents: string[]
  ): DemandPrediction {
    // Base prediction from historical patterns
    const historicalAverage = this.getHistoricalAverage(hour, dayOfWeek, historicalData);
    
    // Apply AI adjustments
    let adjustedWaitTime = historicalAverage.avgWaitTime;
    let adjustedPartySize = historicalAverage.avgPartySize;
    const factors: string[] = [];
    
    // Weather impact
    if (weatherFactor > 1.2) {
      adjustedWaitTime *= 1.15;
      factors.push('Bad weather increases indoor dining demand');
    } else if (weatherFactor < 0.8) {
      adjustedWaitTime *= 0.9;
      factors.push('Good weather may reduce demand');
    }
    
    // Rush hour patterns
    const rushMultiplier = this.getRushHourMultiplier(hour);
    if (rushMultiplier > 1.1) {
      adjustedWaitTime *= rushMultiplier;
      factors.push(`${this.getRushHourName(hour)} increases demand`);
    }
    
    // Weekend patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      adjustedWaitTime *= 1.2;
      adjustedPartySize *= 1.1;
      factors.push('Weekend dining typically busier');
    }
    
    // Special events impact
    if (specialEvents.length > 0) {
      adjustedWaitTime *= 1.3;
      factors.push(`Special events: ${specialEvents.join(', ')}`);
    }
    
    // Happy hour considerations
    if (hour >= 17 && hour <= 19 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      adjustedPartySize *= 0.85; // Smaller groups during happy hour
      factors.push('Happy hour typically attracts smaller groups');
    }
    
    const confidence = this.calculateConfidence(historicalData.length, factors.length);
    
    return {
      timeSlot: `${hour}:00 - ${hour + 1}:00`,
      predictedWaitTime: Math.round(adjustedWaitTime),
      predictedPartySize: Math.round(adjustedPartySize * 10) / 10,
      confidenceLevel: confidence,
      factors
    };
  }

  /**
   * Gets historical average for specific time patterns
   */
  private static getHistoricalAverage(
    hour: number,
    dayOfWeek: number,
    historicalData: any[]
  ) {
    // Filter data for similar time patterns
    const relevantData = historicalData.filter(data => {
      const dataHour = new Date(data.date).getHours();
      const dataDayOfWeek = new Date(data.date).getDay();
      
      return Math.abs(dataHour - hour) <= 1 && dataDayOfWeek === dayOfWeek;
    });
    
    if (relevantData.length === 0) {
      return { avgWaitTime: 20, avgPartySize: 3.5 }; // Default values
    }
    
    const avgWaitTime = relevantData.reduce((sum, d) => sum + (d.averageWaitTime || 20), 0) / relevantData.length;
    const avgPartySize = relevantData.reduce((sum, d) => sum + (d.averagePartySize || 3.5), 0) / relevantData.length;
    
    return { avgWaitTime, avgPartySize };
  }

  /**
   * Generates capacity optimization recommendations
   */
  static generateCapacityRecommendations(
    predictions: DemandPrediction[],
    currentCapacity: any,
    tableTypes: any[]
  ): CapacityRecommendation[] {
    const recommendations: CapacityRecommendation[] = [];
    
    // Analyze predictions for capacity planning
    const highDemandPeriods = predictions.filter(p => p.predictedWaitTime > 30);
    const largepartyTrends = predictions.filter(p => p.predictedPartySize > 4.5);
    
    // High demand period recommendations
    if (highDemandPeriods.length > 0) {
      const avgHighDemandWait = highDemandPeriods.reduce((sum, p) => sum + p.predictedWaitTime, 0) / highDemandPeriods.length;
      
      recommendations.push({
        recommendedAction: 'increase_staff',
        reasoning: `Predicted high demand with ${Math.round(avgHighDemandWait)}min average wait times`,
        impact: Math.round(avgHighDemandWait * 0.4),
        priority: avgHighDemandWait > 45 ? 'high' : 'medium'
      });
    }
    
    // Large party optimization
    if (largepartyTrends.length > 0) {
      const hasLargeTables = tableTypes.some(t => t.capacity >= 8 && t.isActive);
      
      if (!hasLargeTables) {
        recommendations.push({
          recommendedAction: 'prepare_combinations',
          reasoning: 'Large party trend detected but limited large table capacity',
          impact: 25,
          priority: 'high'
        });
      }
    }
    
    // Turnover optimization during peak hours
    const peakHours = predictions.filter(p => p.predictedWaitTime > 20);
    if (peakHours.length >= 2) {
      recommendations.push({
        recommendedAction: 'optimize_turnover',
        reasoning: 'Extended peak period requires turnover optimization',
        impact: 15,
        priority: 'medium'
      });
    }
    
    // Off-peak hour extension opportunities
    const lightHours = predictions.filter(p => p.predictedWaitTime < 10);
    if (lightHours.length >= 3) {
      recommendations.push({
        recommendedAction: 'extend_hours',
        reasoning: 'Low demand periods could support extended hours',
        impact: 30,
        priority: 'low'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyzes party size trends and suggests table configuration changes
   */
  static analyzeTableConfigurationNeeds(
    historicalPartyData: any[],
    currentTableTypes: any[]
  ): any {
    const partySizeDistribution = this.calculatePartySizeDistribution(historicalPartyData);
    const currentCapacityDistribution = this.calculateCurrentCapacity(currentTableTypes);
    
    const mismatchAnalysis = this.findCapacityMismatches(
      partySizeDistribution,
      currentCapacityDistribution
    );
    
    return {
      partySizeDistribution,
      currentCapacityDistribution,
      recommendations: mismatchAnalysis,
      utilizationScore: this.calculateUtilizationScore(partySizeDistribution, currentCapacityDistribution)
    };
  }

  private static calculatePartySizeDistribution(historicalData: any[]) {
    const distribution: { [key: string]: number } = {
      '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9+': 0
    };
    
    historicalData.forEach(entry => {
      const size = entry.partySize;
      if (size <= 2) distribution['1-2']++;
      else if (size <= 4) distribution['3-4']++;
      else if (size <= 6) distribution['5-6']++;
      else if (size <= 8) distribution['7-8']++;
      else distribution['9+']++;
    });
    
    const total = historicalData.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = Math.round((distribution[key] / total) * 100);
    });
    
    return distribution;
  }

  private static calculateCurrentCapacity(tableTypes: any[]) {
    const capacity: { [key: string]: number } = {
      '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9+': 0
    };
    
    tableTypes.forEach(table => {
      const totalSeats = table.capacity * table.count;
      
      if (table.capacity <= 2) capacity['1-2'] += totalSeats;
      else if (table.capacity <= 4) capacity['3-4'] += totalSeats;
      else if (table.capacity <= 6) capacity['5-6'] += totalSeats;
      else if (table.capacity <= 8) capacity['7-8'] += totalSeats;
      else capacity['9+'] += totalSeats;
    });
    
    return capacity;
  }

  private static findCapacityMismatches(demand: any, supply: any) {
    const recommendations = [];
    
    Object.keys(demand).forEach(segment => {
      const demandPct = demand[segment];
      const supplyPct = supply[segment];
      const ratio = supplyPct / Math.max(demandPct, 1);
      
      if (ratio < 0.8) {
        recommendations.push({
          segment,
          issue: 'undersupplied',
          severity: ratio < 0.5 ? 'high' : 'medium',
          recommendation: `Increase ${segment}-person table capacity by ${Math.round((1 - ratio) * 100)}%`
        });
      } else if (ratio > 2.0) {
        recommendations.push({
          segment,
          issue: 'oversupplied',
          severity: 'low',
          recommendation: `Consider converting some ${segment}-person tables to other sizes`
        });
      }
    });
    
    return recommendations;
  }

  private static calculateUtilizationScore(demand: any, supply: any): number {
    let totalScore = 0;
    let segments = 0;
    
    Object.keys(demand).forEach(segment => {
      const demandPct = demand[segment];
      const supplyPct = supply[segment];
      
      if (demandPct > 0) {
        const efficiency = Math.min(supplyPct / demandPct, 2.0); // Cap at 2.0 to avoid over-weighting excess
        totalScore += efficiency;
        segments++;
      }
    });
    
    return segments > 0 ? Math.round((totalScore / segments) * 100) / 100 : 0;
  }

  private static getRushHourMultiplier(hour: number): number {
    if (hour >= 11 && hour <= 13) return 1.4; // Lunch rush
    if (hour >= 18 && hour <= 20) return 1.5; // Dinner rush
    if (hour >= 17 && hour <= 19) return 1.2; // Happy hour
    return 1.0;
  }

  private static getRushHourName(hour: number): string {
    if (hour >= 11 && hour <= 13) return 'Lunch rush';
    if (hour >= 18 && hour <= 20) return 'Dinner rush';
    if (hour >= 17 && hour <= 19) return 'Happy hour';
    return 'Regular hours';
  }

  private static calculateConfidence(dataPoints: number, factors: number): number {
    let confidence = 60; // Base confidence
    
    // More historical data = higher confidence
    if (dataPoints > 50) confidence += 20;
    else if (dataPoints > 20) confidence += 10;
    else if (dataPoints > 10) confidence += 5;
    
    // More factors considered = higher confidence
    confidence += factors * 5;
    
    return Math.min(confidence, 95); // Cap at 95%
  }
}