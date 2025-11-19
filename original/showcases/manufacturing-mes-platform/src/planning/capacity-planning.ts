/**
 * Capacity Planning System
 *
 * Advanced capacity planning with demand forecasting, constraint analysis,
 * and optimization recommendations for manufacturing operations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  CapacityPlan,
  DemandForecast,
  CapacityAnalysis,
  CapacityGap,
  CapacityRecommendation,
  ConstraintAnalysis,
  TimePeriod,
  Equipment,
  ProductionJob
} from '../types.js';

// ============================================================================
// Capacity Planning Engine
// ============================================================================

export class CapacityPlanningEngine {
  private config: CapacityPlanningConfig;
  private historicalDemand: Map<string, DemandHistory[]> = new Map();

  constructor(config: CapacityPlanningConfig) {
    this.config = config;
  }

  /**
   * Generate capacity plan
   */
  async generateCapacityPlan(
    plantId: string,
    planningHorizon: TimePeriod,
    equipment: Equipment[],
    historicalJobs: ProductionJob[]
  ): Promise<CapacityPlan> {
    console.log(`Generating capacity plan for plant ${plantId}`);

    // Forecast demand
    const demand = await this.forecastDemand(plantId, planningHorizon, historicalJobs);

    // Analyze current capacity
    const capacity = this.analyzeCapacity(equipment, planningHorizon);

    // Identify gaps
    const gaps = this.identifyCapacityGaps(demand, capacity);

    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps, capacity);

    return {
      plantId,
      planningHorizon,
      demand,
      capacity,
      gaps,
      recommendations
    };
  }

  /**
   * Forecast demand
   */
  private async forecastDemand(
    plantId: string,
    horizon: TimePeriod,
    historicalJobs: ProductionJob[]
  ): Promise<DemandForecast[]> {
    console.log('Forecasting demand...');

    // Group historical data by product
    const productDemand = this.groupDemandByProduct(historicalJobs);

    const forecasts: DemandForecast[] = [];

    for (const [productId, history] of productDemand) {
      const forecast = await this.forecastProductDemand(
        productId,
        horizon,
        history
      );
      forecasts.push(...forecast);
    }

    return forecasts;
  }

  /**
   * Group demand by product
   */
  private groupDemandByProduct(jobs: ProductionJob[]): Map<string, DemandHistory[]> {
    const grouped = new Map<string, DemandHistory[]>();

    for (const job of jobs) {
      if (!grouped.has(job.productId)) {
        grouped.set(job.productId, []);
      }

      grouped.get(job.productId)!.push({
        date: job.scheduledStart,
        quantity: job.quantity
      });
    }

    return grouped;
  }

  /**
   * Forecast product demand
   */
  private async forecastProductDemand(
    productId: string,
    horizon: TimePeriod,
    history: DemandHistory[]
  ): Promise<DemandForecast[]> {
    // Convert to time series
    const timeSeries = this.prepareDemandTimeSeries(history);

    // Calculate trend and seasonality
    const trend = await this.calculateTrend(timeSeries);
    const seasonality = await this.calculateSeasonality(timeSeries);

    // Generate forecasts for planning horizon
    const forecasts: DemandForecast[] = [];
    const forecastDays = Math.ceil(
      (horizon.end.getTime() - horizon.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const weeklyAverage = this.calculateWeeklyAverage(timeSeries);
    const stdDev = this.calculateStdDev(timeSeries.map(ts => ts.value));

    for (let week = 0; week < Math.ceil(forecastDays / 7); week++) {
      const periodStart = new Date(horizon.start);
      periodStart.setDate(periodStart.getDate() + week * 7);

      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);

      // Apply trend and seasonality
      const baseForecast = weeklyAverage;
      const trendAdjustment = trend * week;
      const seasonalFactor = seasonality[week % seasonality.length] || 1;

      const forecastedDemand = Math.round(
        (baseForecast + trendAdjustment) * seasonalFactor
      );

      // Calculate confidence (decreases with forecast horizon)
      const confidence = Math.max(0.5, 0.95 - (week * 0.05));

      forecasts.push({
        productId,
        period: { start: periodStart, end: periodEnd },
        forecastedDemand,
        confidence,
        seasonalFactor
      });
    }

    return forecasts;
  }

  /**
   * Prepare demand time series
   */
  private prepareDemandTimeSeries(history: DemandHistory[]): TimeSeriesPoint[] {
    // Group by week
    const weeklyDemand = new Map<string, number>();

    for (const record of history) {
      const weekKey = this.getWeekKey(record.date);
      weeklyDemand.set(
        weekKey,
        (weeklyDemand.get(weekKey) || 0) + record.quantity
      );
    }

    return Array.from(weeklyDemand.entries())
      .map(([week, value]) => ({
        timestamp: new Date(week),
        value
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get week key (ISO week start)
   */
  private getWeekKey(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Calculate trend
   */
  private async calculateTrend(timeSeries: TimeSeriesPoint[]): Promise<number> {
    if (timeSeries.length < 2) return 0;

    const values = timeSeries.map(ts => ts.value);
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Calculate seasonality factors
   */
  private async calculateSeasonality(timeSeries: TimeSeriesPoint[]): Promise<number[]> {
    if (timeSeries.length < 4) {
      return [1, 1, 1, 1]; // No seasonality data
    }

    // Simple seasonal decomposition
    const average = timeSeries.reduce((sum, ts) => sum + ts.value, 0) / timeSeries.length;

    // Calculate seasonal factors for each quarter
    const quarters = [0, 0, 0, 0];
    const counts = [0, 0, 0, 0];

    for (const point of timeSeries) {
      const quarter = Math.floor(point.timestamp.getMonth() / 3);
      quarters[quarter] += point.value;
      counts[quarter]++;
    }

    return quarters.map((total, i) => {
      const avg = counts[i] > 0 ? total / counts[i] : average;
      return avg / average;
    });
  }

  /**
   * Calculate weekly average
   */
  private calculateWeeklyAverage(timeSeries: TimeSeriesPoint[]): number {
    if (timeSeries.length === 0) return 0;
    return timeSeries.reduce((sum, ts) => sum + ts.value, 0) / timeSeries.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Analyze capacity
   */
  private analyzeCapacity(
    equipment: Equipment[],
    period: TimePeriod
  ): CapacityAnalysis {
    const periodHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);

    // Calculate total capacity
    const totalCapacity = equipment.reduce((sum, eq) => {
      const equipmentCapacity = eq.capacity.unitsPerHour * periodHours * (eq.capacity.utilizationTarget / 100);
      return sum + equipmentCapacity;
    }, 0);

    // Assume current utilization (would come from historical data)
    const currentUtilization = 0.75; // 75% utilization
    const utilizedCapacity = totalCapacity * currentUtilization;
    const availableCapacity = totalCapacity - utilizedCapacity;

    // Identify bottlenecks
    const bottleneckEquipment = equipment
      .filter(eq => eq.capacity.utilizationTarget > 85)
      .map(eq => eq.id);

    // Constraint analysis
    const constraintAnalysis: ConstraintAnalysis[] = equipment.map(eq => {
      const capacity = eq.capacity.unitsPerHour * periodHours;
      const demand = capacity * 0.8; // Assumed demand
      const utilization = (demand / capacity) * 100;

      return {
        resource: eq.name,
        capacity,
        demand,
        utilization,
        isBottleneck: utilization > 85
      };
    }).sort((a, b) => b.utilization - a.utilization);

    return {
      totalCapacity: Math.round(totalCapacity),
      utilizedCapacity: Math.round(utilizedCapacity),
      availableCapacity: Math.round(availableCapacity),
      bottleneckEquipment,
      constraintAnalysis
    };
  }

  /**
   * Identify capacity gaps
   */
  private identifyCapacityGaps(
    demand: DemandForecast[],
    capacity: CapacityAnalysis
  ): CapacityGap[] {
    const gaps: CapacityGap[] = [];

    // Group demand by period
    const periodDemand = new Map<string, { period: TimePeriod; demand: number; products: Set<string> }>();

    for (const forecast of demand) {
      const key = `${forecast.period.start.toISOString()}_${forecast.period.end.toISOString()}`;
      if (!periodDemand.has(key)) {
        periodDemand.set(key, {
          period: forecast.period,
          demand: 0,
          products: new Set()
        });
      }

      const periodData = periodDemand.get(key)!;
      periodData.demand += forecast.forecastedDemand;
      periodData.products.add(forecast.productId);
    }

    // Check each period against capacity
    for (const [key, periodData] of periodDemand) {
      const periodHours = (periodData.period.end.getTime() - periodData.period.start.getTime()) / (1000 * 60 * 60);
      const periodCapacity = (capacity.totalCapacity / (30 * 24)) * periodHours; // Normalized to period

      const gap = periodData.demand - periodCapacity;

      if (gap > 0) {
        const severity = this.determineSeverity(gap, periodCapacity);

        // For each product in the period
        for (const productId of periodData.products) {
          gaps.push({
            period: periodData.period,
            productId,
            demand: periodData.demand,
            capacity: periodCapacity,
            gap,
            severity
          });
        }
      }
    }

    return gaps.sort((a, b) => b.gap - a.gap);
  }

  /**
   * Determine gap severity
   */
  private determineSeverity(gap: number, capacity: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const gapPercent = (gap / capacity) * 100;

    if (gapPercent > 50) return 'CRITICAL';
    if (gapPercent > 25) return 'HIGH';
    if (gapPercent > 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    gaps: CapacityGap[],
    capacity: CapacityAnalysis
  ): CapacityRecommendation[] {
    const recommendations: CapacityRecommendation[] = [];

    // Analyze bottlenecks
    if (capacity.bottleneckEquipment.length > 0) {
      recommendations.push({
        type: 'ADD_EQUIPMENT',
        description: `Add capacity for bottleneck equipment: ${capacity.bottleneckEquipment.join(', ')}`,
        estimatedCost: 500000,
        estimatedImpact: 25,
        implementationTime: 90,
        priority: 1
      });
    }

    // Analyze gaps
    const criticalGaps = gaps.filter(g => g.severity === 'CRITICAL');
    const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);

    if (criticalGaps.length > 0) {
      recommendations.push({
        type: 'ADD_SHIFT',
        description: 'Add additional shift to handle critical capacity gaps',
        estimatedCost: 200000,
        estimatedImpact: 30,
        implementationTime: 30,
        priority: 2
      });
    }

    if (totalGap > capacity.totalCapacity * 0.3) {
      recommendations.push({
        type: 'OUTSOURCE',
        description: 'Consider outsourcing excess demand to contract manufacturers',
        estimatedCost: totalGap * 10, // Cost per unit
        estimatedImpact: 40,
        implementationTime: 60,
        priority: 3
      });
    }

    // Optimization recommendations
    if (capacity.availableCapacity / capacity.totalCapacity < 0.2) {
      recommendations.push({
        type: 'OPTIMIZE_SCHEDULE',
        description: 'Optimize production scheduling to maximize throughput',
        estimatedCost: 50000,
        estimatedImpact: 15,
        implementationTime: 14,
        priority: 4
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Simulate capacity scenarios
   */
  async simulateScenario(
    basePlan: CapacityPlan,
    scenario: CapacityScenario
  ): Promise<ScenarioResult> {
    console.log(`Simulating scenario: ${scenario.name}`);

    let adjustedCapacity = basePlan.capacity.totalCapacity;
    let adjustedCost = 0;

    // Apply scenario changes
    for (const change of scenario.changes) {
      switch (change.type) {
        case 'ADD_EQUIPMENT':
          adjustedCapacity += change.capacityImpact;
          adjustedCost += change.cost;
          break;
        case 'ADD_SHIFT':
          adjustedCapacity *= 1.5; // 50% increase for additional shift
          adjustedCost += change.cost;
          break;
        case 'OPTIMIZE_SCHEDULE':
          adjustedCapacity *= 1.1; // 10% improvement
          adjustedCost += change.cost;
          break;
      }
    }

    // Calculate new gaps
    const totalDemand = basePlan.demand.reduce((sum, d) => sum + d.forecastedDemand, 0);
    const remainingGap = Math.max(0, totalDemand - adjustedCapacity);

    const gapReduction = basePlan.gaps.reduce((sum, g) => sum + g.gap, 0) - remainingGap;
    const utilizationRate = (totalDemand / adjustedCapacity) * 100;

    return {
      scenarioName: scenario.name,
      totalCapacity: adjustedCapacity,
      totalDemand,
      remainingGap,
      gapReduction,
      utilizationRate,
      totalCost: adjustedCost,
      roi: this.calculateROI(gapReduction, adjustedCost)
    };
  }

  /**
   * Calculate ROI
   */
  private calculateROI(additionalCapacity: number, cost: number): number {
    const revenuePerUnit = 100; // Assumed
    const margin = 0.3; // 30% margin
    const annualRevenue = additionalCapacity * revenuePerUnit * margin;

    if (cost === 0) return 0;
    return ((annualRevenue - cost) / cost) * 100;
  }

  /**
   * Optimize capacity allocation
   */
  async optimizeCapacityAllocation(
    demand: DemandForecast[],
    equipment: Equipment[]
  ): Promise<AllocationOptimization> {
    console.log('Optimizing capacity allocation...');

    const allocations: ProductAllocation[] = [];

    // Sort demand by priority (highest demand first)
    const sortedDemand = [...demand].sort((a, b) => b.forecastedDemand - a.forecastedDemand);

    // Available capacity per equipment
    const availableCapacity = new Map<string, number>();
    for (const eq of equipment) {
      availableCapacity.set(eq.id, eq.capacity.maxDailyCapacity);
    }

    // Allocate demand to equipment
    for (const demandItem of sortedDemand) {
      let remainingDemand = demandItem.forecastedDemand;

      for (const eq of equipment) {
        const available = availableCapacity.get(eq.id) || 0;
        if (available > 0 && remainingDemand > 0) {
          const allocated = Math.min(available, remainingDemand);

          allocations.push({
            productId: demandItem.productId,
            equipmentId: eq.id,
            quantity: allocated,
            period: demandItem.period
          });

          availableCapacity.set(eq.id, available - allocated);
          remainingDemand -= allocated;
        }
      }

      if (remainingDemand > 0) {
        console.warn(`Unmet demand for product ${demandItem.productId}: ${remainingDemand} units`);
      }
    }

    // Calculate utilization
    const totalAllocated = allocations.reduce((sum, a) => sum + a.quantity, 0);
    const totalCapacity = equipment.reduce((sum, eq) => sum + eq.capacity.maxDailyCapacity, 0);
    const utilizationRate = (totalAllocated / totalCapacity) * 100;

    return {
      allocations,
      utilizationRate,
      unmetDemand: sortedDemand.reduce((sum, d) => {
        const allocated = allocations
          .filter(a => a.productId === d.productId)
          .reduce((s, a) => s + a.quantity, 0);
        return sum + Math.max(0, d.forecastedDemand - allocated);
      }, 0)
    };
  }
}

// ============================================================================
// Types
// ============================================================================

export interface CapacityPlanningConfig {
  forecastHorizonDays: number;
  confidenceLevel: number;
  minUtilizationTarget: number;
  maxUtilizationTarget: number;
}

export interface DemandHistory {
  date: Date;
  quantity: number;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface CapacityScenario {
  name: string;
  changes: ScenarioChange[];
}

export interface ScenarioChange {
  type: 'ADD_EQUIPMENT' | 'ADD_SHIFT' | 'OPTIMIZE_SCHEDULE';
  capacityImpact: number;
  cost: number;
}

export interface ScenarioResult {
  scenarioName: string;
  totalCapacity: number;
  totalDemand: number;
  remainingGap: number;
  gapReduction: number;
  utilizationRate: number;
  totalCost: number;
  roi: number;
}

export interface AllocationOptimization {
  allocations: ProductAllocation[];
  utilizationRate: number;
  unmetDemand: number;
}

export interface ProductAllocation {
  productId: string;
  equipmentId: string;
  quantity: number;
  period: TimePeriod;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CAPACITY_PLANNING_CONFIG: CapacityPlanningConfig = {
  forecastHorizonDays: 90,
  confidenceLevel: 0.95,
  minUtilizationTarget: 70,
  maxUtilizationTarget: 85
};
