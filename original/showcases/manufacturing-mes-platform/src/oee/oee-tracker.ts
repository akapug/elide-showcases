/**
 * OEE (Overall Equipment Effectiveness) Tracker
 *
 * Real-time tracking and calculation of OEE metrics including
 * availability, performance, and quality components.
 */

import type {
  OEEMetrics,
  OEEComponents,
  OEETarget,
  DowntimeBreakdown,
  ProductionLosses,
  LossCategory,
  SixBigLoss,
  TimePeriod,
  Equipment,
  ProductionJob,
  QualityInspectionResult
} from '../types.js';

// ============================================================================
// OEE Tracker Class
// ============================================================================

export class OEETracker {
  private oeeHistory: Map<string, OEEMetrics[]> = new Map();
  private downtimeRecords: Map<string, DowntimeRecord[]> = new Map();
  private qualityRecords: Map<string, QualityRecord[]> = new Map();
  private config: OEEConfig;

  constructor(config: OEEConfig) {
    this.config = config;
  }

  /**
   * Calculate OEE for equipment in given period
   */
  async calculateOEE(
    equipment: Equipment,
    period: TimePeriod,
    productionData: ProductionData
  ): Promise<OEEMetrics> {
    console.log(`Calculating OEE for equipment ${equipment.id} from ${period.start} to ${period.end}`);

    // Calculate OEE components
    const components = this.calculateOEEComponents(
      equipment,
      period,
      productionData
    );

    // Calculate availability
    const availability = this.calculateAvailability(components);

    // Calculate performance
    const performance = this.calculatePerformance(components);

    // Calculate quality
    const quality = this.calculateQuality(components);

    // Calculate overall OEE
    const oee = (availability * performance * quality) / 10000; // Convert from percentage

    // Calculate production losses
    const losses = this.calculateProductionLosses(components);

    const oeeMetrics: OEEMetrics = {
      equipmentId: equipment.id,
      period,
      availability,
      performance,
      quality,
      oee,
      components,
      losses
    };

    // Store in history
    if (!this.oeeHistory.has(equipment.id)) {
      this.oeeHistory.set(equipment.id, []);
    }
    this.oeeHistory.get(equipment.id)!.push(oeeMetrics);

    return oeeMetrics;
  }

  /**
   * Calculate OEE components
   */
  private calculateOEEComponents(
    equipment: Equipment,
    period: TimePeriod,
    data: ProductionData
  ): OEEComponents {
    // Calculate time components
    const periodDuration = (period.end.getTime() - period.start.getTime()) / 60000; // minutes

    // Planned production time = total time - planned downtime
    const plannedDowntime = this.calculatePlannedDowntime(equipment.id, period);
    const plannedProductionTime = periodDuration - plannedDowntime;

    // Actual running time = planned production time - unplanned downtime
    const unplannedDowntime = this.calculateUnplannedDowntime(equipment.id, period);
    const actualRunningTime = plannedProductionTime - unplannedDowntime;

    // Get production counts
    const totalPieces = data.totalPieces;
    const goodPieces = data.goodPieces;

    // Get ideal cycle time
    const idealCycleTime = equipment.capacity.unitsPerHour > 0
      ? 3600 / equipment.capacity.unitsPerHour // seconds
      : 60;

    // Calculate downtime breakdown
    const downtime = this.getDowntimeBreakdown(equipment.id, period);

    return {
      plannedProductionTime,
      actualRunningTime,
      idealCycleTime,
      totalPieces,
      goodPieces,
      downtime
    };
  }

  /**
   * Calculate availability percentage
   */
  private calculateAvailability(components: OEEComponents): number {
    if (components.plannedProductionTime === 0) {
      return 0;
    }

    const availability = (components.actualRunningTime / components.plannedProductionTime) * 100;
    return Math.min(100, Math.max(0, availability));
  }

  /**
   * Calculate performance percentage
   */
  private calculatePerformance(components: OEEComponents): number {
    if (components.actualRunningTime === 0) {
      return 0;
    }

    // Ideal production time = pieces * ideal cycle time (in minutes)
    const idealProductionTime = (components.totalPieces * components.idealCycleTime) / 60;

    // Performance = (Ideal production time / Actual running time) * 100
    const performance = (idealProductionTime / components.actualRunningTime) * 100;

    return Math.min(100, Math.max(0, performance));
  }

  /**
   * Calculate quality percentage
   */
  private calculateQuality(components: OEEComponents): number {
    if (components.totalPieces === 0) {
      return 100; // No production = no quality issues
    }

    const quality = (components.goodPieces / components.totalPieces) * 100;
    return Math.min(100, Math.max(0, quality));
  }

  /**
   * Calculate production losses (Six Big Losses)
   */
  private calculateProductionLosses(components: OEEComponents): ProductionLosses {
    const downtime = components.downtime;

    // Availability losses
    const availabilityLoss = downtime.breakdowns + downtime.setupAndAdjustments;

    // Performance losses
    const performanceLoss = downtime.smallStops + downtime.reducedSpeed;

    // Quality losses (in units)
    const qualityLoss = components.totalPieces - components.goodPieces;

    // Total loss time
    const totalLossTime = components.plannedProductionTime - components.actualRunningTime;

    // Categorize losses
    const lossCategories: LossCategory[] = [
      {
        category: 'BREAKDOWNS',
        duration: downtime.breakdowns,
        frequency: this.getDowntimeFrequency('BREAKDOWNS'),
        impact: (downtime.breakdowns / totalLossTime) * 100
      },
      {
        category: 'SETUP_ADJUSTMENTS',
        duration: downtime.setupAndAdjustments,
        frequency: this.getDowntimeFrequency('SETUP_ADJUSTMENTS'),
        impact: (downtime.setupAndAdjustments / totalLossTime) * 100
      },
      {
        category: 'SMALL_STOPS',
        duration: downtime.smallStops,
        frequency: this.getDowntimeFrequency('SMALL_STOPS'),
        impact: (downtime.smallStops / totalLossTime) * 100
      },
      {
        category: 'REDUCED_SPEED',
        duration: downtime.reducedSpeed,
        frequency: this.getDowntimeFrequency('REDUCED_SPEED'),
        impact: (downtime.reducedSpeed / totalLossTime) * 100
      },
      {
        category: 'STARTUP_REJECTS',
        duration: qualityLoss,
        frequency: this.getDefectFrequency('STARTUP_REJECTS'),
        impact: (qualityLoss / components.totalPieces) * 100
      },
      {
        category: 'PRODUCTION_REJECTS',
        duration: qualityLoss,
        frequency: this.getDefectFrequency('PRODUCTION_REJECTS'),
        impact: (qualityLoss / components.totalPieces) * 100
      }
    ].sort((a, b) => b.impact - a.impact);

    return {
      availabilityLoss,
      performanceLoss,
      qualityLoss,
      totalLossTime,
      lossCategories
    };
  }

  /**
   * Get downtime breakdown for period
   */
  private getDowntimeBreakdown(equipmentId: string, period: TimePeriod): DowntimeBreakdown {
    const records = this.downtimeRecords.get(equipmentId) || [];
    const periodRecords = records.filter(
      r => r.timestamp >= period.start && r.timestamp <= period.end
    );

    const breakdown: DowntimeBreakdown = {
      plannedDowntime: 0,
      unplannedDowntime: 0,
      breakdowns: 0,
      setupAndAdjustments: 0,
      smallStops: 0,
      reducedSpeed: 0
    };

    for (const record of periodRecords) {
      if (record.planned) {
        breakdown.plannedDowntime += record.duration;
      } else {
        breakdown.unplannedDowntime += record.duration;
      }

      switch (record.reason) {
        case 'BREAKDOWN':
          breakdown.breakdowns += record.duration;
          break;
        case 'SETUP':
        case 'ADJUSTMENT':
          breakdown.setupAndAdjustments += record.duration;
          break;
        case 'SMALL_STOP':
          breakdown.smallStops += record.duration;
          break;
        case 'REDUCED_SPEED':
          breakdown.reducedSpeed += record.duration;
          break;
      }
    }

    return breakdown;
  }

  /**
   * Calculate planned downtime for period
   */
  private calculatePlannedDowntime(equipmentId: string, period: TimePeriod): number {
    const records = this.downtimeRecords.get(equipmentId) || [];
    return records
      .filter(r => r.planned && r.timestamp >= period.start && r.timestamp <= period.end)
      .reduce((sum, r) => sum + r.duration, 0);
  }

  /**
   * Calculate unplanned downtime for period
   */
  private calculateUnplannedDowntime(equipmentId: string, period: TimePeriod): number {
    const records = this.downtimeRecords.get(equipmentId) || [];
    return records
      .filter(r => !r.planned && r.timestamp >= period.start && r.timestamp <= period.end)
      .reduce((sum, r) => sum + r.duration, 0);
  }

  /**
   * Record downtime event
   */
  recordDowntime(
    equipmentId: string,
    downtime: DowntimeEvent
  ): void {
    if (!this.downtimeRecords.has(equipmentId)) {
      this.downtimeRecords.set(equipmentId, []);
    }

    const record: DowntimeRecord = {
      timestamp: downtime.timestamp,
      duration: downtime.duration,
      reason: downtime.reason,
      planned: downtime.planned,
      description: downtime.description
    };

    this.downtimeRecords.get(equipmentId)!.push(record);
  }

  /**
   * Record quality event
   */
  recordQuality(
    equipmentId: string,
    quality: QualityEvent
  ): void {
    if (!this.qualityRecords.has(equipmentId)) {
      this.qualityRecords.set(equipmentId, []);
    }

    const record: QualityRecord = {
      timestamp: quality.timestamp,
      totalPieces: quality.totalPieces,
      goodPieces: quality.goodPieces,
      rejectedPieces: quality.rejectedPieces,
      reason: quality.reason
    };

    this.qualityRecords.get(equipmentId)!.push(record);
  }

  /**
   * Get downtime frequency for loss category
   */
  private getDowntimeFrequency(category: SixBigLoss): number {
    // Simplified - would track actual frequency in real implementation
    return 5; // Default frequency
  }

  /**
   * Get defect frequency
   */
  private getDefectFrequency(category: SixBigLoss): number {
    // Simplified - would track actual frequency in real implementation
    return 3; // Default frequency
  }

  /**
   * Calculate OEE trend
   */
  calculateOEETrend(
    equipmentId: string,
    periods: TimePeriod[]
  ): OEETrend {
    const history = this.oeeHistory.get(equipmentId) || [];
    const metrics = periods.map(period => {
      return history.find(h =>
        h.period.start.getTime() === period.start.getTime() &&
        h.period.end.getTime() === period.end.getTime()
      );
    }).filter(m => m !== undefined) as OEEMetrics[];

    if (metrics.length === 0) {
      return {
        trend: 'STABLE',
        changePercent: 0,
        avgOEE: 0,
        bestOEE: 0,
        worstOEE: 0
      };
    }

    const oeeValues = metrics.map(m => m.oee);
    const avgOEE = oeeValues.reduce((a, b) => a + b, 0) / oeeValues.length;
    const bestOEE = Math.max(...oeeValues);
    const worstOEE = Math.min(...oeeValues);

    // Calculate trend
    const firstHalf = oeeValues.slice(0, Math.floor(oeeValues.length / 2));
    const secondHalf = oeeValues.slice(Math.floor(oeeValues.length / 2));

    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    if (changePercent > 5) {
      trend = 'IMPROVING';
    } else if (changePercent < -5) {
      trend = 'DECLINING';
    } else {
      trend = 'STABLE';
    }

    return {
      trend,
      changePercent,
      avgOEE,
      bestOEE,
      worstOEE
    };
  }

  /**
   * Compare OEE against target
   */
  compareToTarget(
    oeeMetrics: OEEMetrics,
    target: OEETarget
  ): OEEComparison {
    return {
      oeeGap: oeeMetrics.oee - target.targetOEE,
      availabilityGap: oeeMetrics.availability - target.targetAvailability,
      performanceGap: oeeMetrics.performance - target.targetPerformance,
      qualityGap: oeeMetrics.quality - target.targetQuality,
      meetsTarget: oeeMetrics.oee >= target.targetOEE,
      recommendations: this.generateOEERecommendations(oeeMetrics, target)
    };
  }

  /**
   * Generate OEE improvement recommendations
   */
  private generateOEERecommendations(
    metrics: OEEMetrics,
    target: OEETarget
  ): string[] {
    const recommendations: string[] = [];

    // Availability recommendations
    if (metrics.availability < target.targetAvailability) {
      const gap = target.targetAvailability - metrics.availability;
      if (metrics.components.downtime.breakdowns > 60) {
        recommendations.push(`Reduce breakdowns - currently ${metrics.components.downtime.breakdowns} minutes`);
      }
      if (metrics.components.downtime.setupAndAdjustments > 30) {
        recommendations.push(`Optimize setup procedures - currently ${metrics.components.downtime.setupAndAdjustments} minutes`);
      }
    }

    // Performance recommendations
    if (metrics.performance < target.targetPerformance) {
      const gap = target.targetPerformance - metrics.performance;
      if (metrics.components.downtime.smallStops > 20) {
        recommendations.push(`Address small stops - currently ${metrics.components.downtime.smallStops} minutes`);
      }
      if (metrics.components.downtime.reducedSpeed > 30) {
        recommendations.push(`Investigate speed losses - currently ${metrics.components.downtime.reducedSpeed} minutes`);
      }
    }

    // Quality recommendations
    if (metrics.quality < target.targetQuality) {
      const rejectRate = ((metrics.components.totalPieces - metrics.components.goodPieces) / metrics.components.totalPieces) * 100;
      recommendations.push(`Reduce reject rate - currently ${rejectRate.toFixed(1)}%`);
      recommendations.push('Implement quality control measures at critical process steps');
    }

    // Overall recommendations
    if (metrics.oee < target.targetOEE) {
      const biggestLoss = metrics.losses.lossCategories[0];
      recommendations.push(`Focus on ${biggestLoss.category} - highest impact loss at ${biggestLoss.impact.toFixed(1)}%`);
    }

    return recommendations;
  }

  /**
   * Calculate world-class OEE comparison
   */
  calculateWorldClassComparison(oeeMetrics: OEEMetrics): WorldClassComparison {
    const worldClassTargets = {
      oee: 85,
      availability: 90,
      performance: 95,
      quality: 99.9
    };

    const classification = this.classifyOEE(oeeMetrics.oee);

    return {
      classification,
      oeeVsWorldClass: oeeMetrics.oee - worldClassTargets.oee,
      availabilityVsWorldClass: oeeMetrics.availability - worldClassTargets.availability,
      performanceVsWorldClass: oeeMetrics.performance - worldClassTargets.performance,
      qualityVsWorldClass: oeeMetrics.quality - worldClassTargets.quality,
      percentileRank: this.calculatePercentileRank(oeeMetrics.oee)
    };
  }

  /**
   * Classify OEE performance
   */
  private classifyOEE(oee: number): OEEClassification {
    if (oee >= 85) {
      return 'WORLD_CLASS';
    } else if (oee >= 75) {
      return 'EXCELLENT';
    } else if (oee >= 65) {
      return 'GOOD';
    } else if (oee >= 55) {
      return 'FAIR';
    } else {
      return 'POOR';
    }
  }

  /**
   * Calculate percentile rank
   */
  private calculatePercentileRank(oee: number): number {
    // Simplified percentile calculation
    // In real implementation, would compare against industry database
    if (oee >= 85) return 95;
    if (oee >= 75) return 80;
    if (oee >= 65) return 60;
    if (oee >= 55) return 40;
    return 20;
  }

  /**
   * Generate OEE report
   */
  generateOEEReport(
    equipmentId: string,
    period: TimePeriod
  ): OEEReport {
    const history = this.oeeHistory.get(equipmentId) || [];
    const metrics = history.find(h =>
      h.period.start.getTime() === period.start.getTime() &&
      h.period.end.getTime() === period.end.getTime()
    );

    if (!metrics) {
      throw new Error(`No OEE data found for equipment ${equipmentId} in specified period`);
    }

    const downtimeRecords = this.downtimeRecords.get(equipmentId) || [];
    const qualityRecords = this.qualityRecords.get(equipmentId) || [];

    return {
      metrics,
      downtimeEvents: downtimeRecords.length,
      qualityEvents: qualityRecords.length,
      topLosses: metrics.losses.lossCategories.slice(0, 3),
      improvementPotential: this.calculateImprovementPotential(metrics),
      recommendations: this.generateOEERecommendations(
        metrics,
        {
          equipmentId,
          targetOEE: 85,
          targetAvailability: 90,
          targetPerformance: 95,
          targetQuality: 99.9
        }
      )
    };
  }

  /**
   * Calculate improvement potential
   */
  private calculateImprovementPotential(metrics: OEEMetrics): ImprovementPotential {
    const currentOEE = metrics.oee;
    const worldClassOEE = 85;

    // Calculate potential if each component was improved to world-class
    const potentialAvailability = Math.min(90, metrics.availability + 10);
    const potentialPerformance = Math.min(95, metrics.performance + 10);
    const potentialQuality = Math.min(99.9, metrics.quality + 5);

    const potentialOEE = (potentialAvailability * potentialPerformance * potentialQuality) / 10000;

    return {
      currentOEE,
      potentialOEE,
      improvementPoints: potentialOEE - currentOEE,
      improvementPercent: ((potentialOEE - currentOEE) / currentOEE) * 100,
      estimatedProductionGain: this.estimateProductionGain(metrics, potentialOEE)
    };
  }

  /**
   * Estimate production gain from OEE improvement
   */
  private estimateProductionGain(
    metrics: OEEMetrics,
    potentialOEE: number
  ): number {
    const currentProduction = metrics.components.goodPieces;
    const oeeRatio = potentialOEE / metrics.oee;
    const potentialProduction = currentProduction * oeeRatio;

    return potentialProduction - currentProduction;
  }

  /**
   * Get OEE history for equipment
   */
  getOEEHistory(equipmentId: string, limit?: number): OEEMetrics[] {
    const history = this.oeeHistory.get(equipmentId) || [];
    return limit ? history.slice(-limit) : history;
  }
}

// ============================================================================
// Types
// ============================================================================

export interface OEEConfig {
  defaultIdealCycleTime: number; // seconds
  minPlannedProductionTime: number; // minutes
}

export interface ProductionData {
  totalPieces: number;
  goodPieces: number;
  rejectedPieces: number;
}

export interface DowntimeEvent {
  timestamp: Date;
  duration: number; // minutes
  reason: DowntimeReason;
  planned: boolean;
  description: string;
}

export interface QualityEvent {
  timestamp: Date;
  totalPieces: number;
  goodPieces: number;
  rejectedPieces: number;
  reason?: string;
}

interface DowntimeRecord {
  timestamp: Date;
  duration: number;
  reason: DowntimeReason;
  planned: boolean;
  description: string;
}

interface QualityRecord {
  timestamp: Date;
  totalPieces: number;
  goodPieces: number;
  rejectedPieces: number;
  reason?: string;
}

export type DowntimeReason =
  | 'BREAKDOWN'
  | 'SETUP'
  | 'ADJUSTMENT'
  | 'SMALL_STOP'
  | 'REDUCED_SPEED'
  | 'PLANNED_MAINTENANCE'
  | 'MATERIAL_SHORTAGE'
  | 'OPERATOR_ABSENCE';

export interface OEETrend {
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  changePercent: number;
  avgOEE: number;
  bestOEE: number;
  worstOEE: number;
}

export interface OEEComparison {
  oeeGap: number;
  availabilityGap: number;
  performanceGap: number;
  qualityGap: number;
  meetsTarget: boolean;
  recommendations: string[];
}

export type OEEClassification =
  | 'WORLD_CLASS'
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR';

export interface WorldClassComparison {
  classification: OEEClassification;
  oeeVsWorldClass: number;
  availabilityVsWorldClass: number;
  performanceVsWorldClass: number;
  qualityVsWorldClass: number;
  percentileRank: number;
}

export interface OEEReport {
  metrics: OEEMetrics;
  downtimeEvents: number;
  qualityEvents: number;
  topLosses: LossCategory[];
  improvementPotential: ImprovementPotential;
  recommendations: string[];
}

export interface ImprovementPotential {
  currentOEE: number;
  potentialOEE: number;
  improvementPoints: number;
  improvementPercent: number;
  estimatedProductionGain: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_OEE_CONFIG: OEEConfig = {
  defaultIdealCycleTime: 60, // 1 minute
  minPlannedProductionTime: 480 // 8 hours
};
