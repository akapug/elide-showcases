/**
 * Production Analytics Engine
 *
 * Advanced analytics for manufacturing data including trend analysis,
 * forecasting, and predictive insights using Python data science libraries.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  ProductionAnalytics,
  ProductionTrend,
  TrendDataPoint,
  ProductionIssue,
  TimePeriod,
  OEEMetrics,
  Equipment,
  ProductionJob,
  QualityInspectionResult
} from '../types.js';

// ============================================================================
// Production Analytics Engine
// ============================================================================

export class ProductionAnalyticsEngine {
  private analyticsHistory: Map<string, ProductionAnalytics[]> = new Map();
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * Generate comprehensive production analytics
   */
  async generateAnalytics(
    plantId: string,
    period: TimePeriod,
    data: AnalyticsInputData
  ): Promise<ProductionAnalytics> {
    console.log(`Generating analytics for plant ${plantId} from ${period.start} to ${period.end}`);

    // Calculate aggregate metrics
    const overallOEE = this.calculateAverageOEE(data.oeeMetrics);
    const totalProduction = this.calculateTotalProduction(data.productionJobs);
    const totalDowntime = this.calculateTotalDowntime(data.oeeMetrics);
    const equipmentUtilization = this.calculateEquipmentUtilization(data.equipment, data.productionJobs);
    const scrapRate = this.calculateScrapRate(data.qualityResults);

    // Analyze trends
    const trends = await this.analyzeTrends(data);

    // Identify top issues
    const topIssues = this.identifyTopIssues(data);

    const analytics: ProductionAnalytics = {
      plantId,
      period,
      overallOEE,
      totalProduction,
      totalDowntime,
      equipmentUtilization,
      scrapRate,
      trends,
      topIssues
    };

    // Store in history
    if (!this.analyticsHistory.has(plantId)) {
      this.analyticsHistory.set(plantId, []);
    }
    this.analyticsHistory.get(plantId)!.push(analytics);

    return analytics;
  }

  /**
   * Calculate average OEE across all equipment
   */
  private calculateAverageOEE(oeeMetrics: OEEMetrics[]): number {
    if (oeeMetrics.length === 0) return 0;

    const totalOEE = oeeMetrics.reduce((sum, metric) => sum + metric.oee, 0);
    return totalOEE / oeeMetrics.length;
  }

  /**
   * Calculate total production
   */
  private calculateTotalProduction(jobs: ProductionJob[]): number {
    return jobs.reduce((sum, job) => sum + job.quantityProduced, 0);
  }

  /**
   * Calculate total downtime
   */
  private calculateTotalDowntime(oeeMetrics: OEEMetrics[]): number {
    return oeeMetrics.reduce((sum, metric) =>
      sum + (metric.components.plannedProductionTime - metric.components.actualRunningTime), 0
    );
  }

  /**
   * Calculate equipment utilization
   */
  private calculateEquipmentUtilization(
    equipment: Equipment[],
    jobs: ProductionJob[]
  ): number {
    const totalCapacity = equipment.reduce((sum, eq) => sum + eq.capacity.unitsPerHour, 0);
    const totalProduction = jobs.reduce((sum, job) => sum + job.quantityProduced, 0);

    if (totalCapacity === 0) return 0;

    // Calculate based on time period
    const periodHours = jobs.length > 0
      ? (jobs[0].actualEnd!.getTime() - jobs[0].actualStart!.getTime()) / 3600000
      : 1;

    return (totalProduction / (totalCapacity * periodHours)) * 100;
  }

  /**
   * Calculate scrap rate
   */
  private calculateScrapRate(qualityResults: QualityInspectionResult[]): number {
    const totalInspected = qualityResults.length;
    if (totalInspected === 0) return 0;

    const rejected = qualityResults.filter(r => r.overallResult === 'FAIL').length;
    return (rejected / totalInspected) * 100;
  }

  /**
   * Analyze production trends
   */
  private async analyzeTrends(data: AnalyticsInputData): Promise<ProductionTrend[]> {
    const trends: ProductionTrend[] = [];

    // OEE trend
    trends.push(await this.analyzeOEETrend(data.oeeMetrics));

    // Production volume trend
    trends.push(await this.analyzeProductionVolumeTrend(data.productionJobs));

    // Quality trend
    trends.push(await this.analyzeQualityTrend(data.qualityResults));

    // Downtime trend
    trends.push(await this.analyzeDowntimeTrend(data.oeeMetrics));

    return trends;
  }

  /**
   * Analyze OEE trend
   */
  private async analyzeOEETrend(oeeMetrics: OEEMetrics[]): Promise<ProductionTrend> {
    const dataPoints: TrendDataPoint[] = oeeMetrics.map(metric => ({
      timestamp: metric.period.start,
      value: metric.oee
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const trend = await this.calculateTrendDirection(dataPoints);
    const changePercent = await this.calculateChangePercent(dataPoints);

    return {
      metric: 'OEE',
      trend,
      changePercent,
      dataPoints
    };
  }

  /**
   * Analyze production volume trend
   */
  private async analyzeProductionVolumeTrend(jobs: ProductionJob[]): Promise<ProductionTrend> {
    // Group jobs by day
    const dailyProduction = new Map<string, number>();

    for (const job of jobs) {
      if (!job.actualStart) continue;

      const dateKey = job.actualStart.toISOString().split('T')[0];
      dailyProduction.set(
        dateKey,
        (dailyProduction.get(dateKey) || 0) + job.quantityProduced
      );
    }

    const dataPoints: TrendDataPoint[] = Array.from(dailyProduction.entries()).map(([date, volume]) => ({
      timestamp: new Date(date),
      value: volume
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const trend = await this.calculateTrendDirection(dataPoints);
    const changePercent = await this.calculateChangePercent(dataPoints);

    return {
      metric: 'Production Volume',
      trend,
      changePercent,
      dataPoints
    };
  }

  /**
   * Analyze quality trend
   */
  private async analyzeQualityTrend(qualityResults: QualityInspectionResult[]): Promise<ProductionTrend> {
    // Group by day
    const dailyQuality = new Map<string, { total: number; passed: number }>();

    for (const result of qualityResults) {
      const dateKey = result.timestamp.toISOString().split('T')[0];
      const current = dailyQuality.get(dateKey) || { total: 0, passed: 0 };

      dailyQuality.set(dateKey, {
        total: current.total + 1,
        passed: current.passed + (result.overallResult === 'PASS' ? 1 : 0)
      });
    }

    const dataPoints: TrendDataPoint[] = Array.from(dailyQuality.entries()).map(([date, quality]) => ({
      timestamp: new Date(date),
      value: (quality.passed / quality.total) * 100
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const trend = await this.calculateTrendDirection(dataPoints);
    const changePercent = await this.calculateChangePercent(dataPoints);

    return {
      metric: 'Quality Rate',
      trend,
      changePercent,
      dataPoints
    };
  }

  /**
   * Analyze downtime trend
   */
  private async analyzeDowntimeTrend(oeeMetrics: OEEMetrics[]): Promise<ProductionTrend> {
    const dataPoints: TrendDataPoint[] = oeeMetrics.map(metric => ({
      timestamp: metric.period.start,
      value: metric.components.plannedProductionTime - metric.components.actualRunningTime
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const trend = await this.calculateTrendDirection(dataPoints);
    const changePercent = await this.calculateChangePercent(dataPoints);

    return {
      metric: 'Downtime',
      trend,
      changePercent,
      dataPoints
    };
  }

  /**
   * Calculate trend direction using linear regression
   */
  private async calculateTrendDirection(
    dataPoints: TrendDataPoint[]
  ): Promise<'IMPROVING' | 'DECLINING' | 'STABLE'> {
    if (dataPoints.length < 2) return 'STABLE';

    const values = dataPoints.map(dp => dp.value);
    const slope = await this.calculateLinearRegressionSlope(values);

    if (Math.abs(slope) < this.config.trendStabilityThreshold) {
      return 'STABLE';
    }

    // For metrics like OEE and Quality, positive slope is improving
    // For metrics like Downtime, negative slope is improving
    return slope > 0 ? 'IMPROVING' : 'DECLINING';
  }

  /**
   * Calculate change percentage
   */
  private async calculateChangePercent(dataPoints: TrendDataPoint[]): Promise<number> {
    if (dataPoints.length < 2) return 0;

    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;

    if (firstAvg === 0) return 0;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  /**
   * Calculate linear regression slope
   */
  private async calculateLinearRegressionSlope(values: number[]): Promise<number> {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Identify top production issues
   */
  private identifyTopIssues(data: AnalyticsInputData): ProductionIssue[] {
    const issues: ProductionIssue[] = [];

    // Analyze downtime issues
    const downtimeIssues = this.analyzeDowntimeIssues(data.oeeMetrics);
    issues.push(...downtimeIssues);

    // Analyze quality issues
    const qualityIssues = this.analyzeQualityIssues(data.qualityResults);
    issues.push(...qualityIssues);

    // Analyze performance issues
    const performanceIssues = this.analyzePerformanceIssues(data.oeeMetrics);
    issues.push(...performanceIssues);

    // Sort by impact and return top issues
    return issues
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, this.config.topIssuesCount);
  }

  /**
   * Analyze downtime issues
   */
  private analyzeDowntimeIssues(oeeMetrics: OEEMetrics[]): ProductionIssue[] {
    const issues: ProductionIssue[] = [];

    // Aggregate downtime by category
    const categoryImpact = new Map<string, { count: number; totalTime: number; equipmentIds: Set<string> }>();

    for (const metric of oeeMetrics) {
      const downtime = metric.components.downtime;

      this.addCategoryImpact(categoryImpact, 'Equipment Breakdowns', downtime.breakdowns, metric.equipmentId);
      this.addCategoryImpact(categoryImpact, 'Setup and Adjustments', downtime.setupAndAdjustments, metric.equipmentId);
      this.addCategoryImpact(categoryImpact, 'Small Stops', downtime.smallStops, metric.equipmentId);
      this.addCategoryImpact(categoryImpact, 'Reduced Speed', downtime.reducedSpeed, metric.equipmentId);
    }

    // Convert to issues
    for (const [category, impact] of categoryImpact) {
      if (impact.totalTime > this.config.minIssueImpactMinutes) {
        issues.push({
          category: 'Downtime',
          description: category,
          frequency: impact.count,
          totalImpact: impact.totalTime,
          equipmentIds: Array.from(impact.equipmentIds)
        });
      }
    }

    return issues;
  }

  /**
   * Add category impact
   */
  private addCategoryImpact(
    map: Map<string, { count: number; totalTime: number; equipmentIds: Set<string> }>,
    category: string,
    time: number,
    equipmentId: string
  ): void {
    if (time === 0) return;

    if (!map.has(category)) {
      map.set(category, { count: 0, totalTime: 0, equipmentIds: new Set() });
    }

    const current = map.get(category)!;
    current.count++;
    current.totalTime += time;
    current.equipmentIds.add(equipmentId);
  }

  /**
   * Analyze quality issues
   */
  private analyzeQualityIssues(qualityResults: QualityInspectionResult[]): ProductionIssue[] {
    const issues: ProductionIssue[] = [];

    // Group defects by type
    const defectsByType = new Map<string, number>();

    for (const result of qualityResults) {
      for (const defect of result.defects) {
        defectsByType.set(
          defect.type,
          (defectsByType.get(defect.type) || 0) + 1
        );
      }
    }

    // Convert to issues
    for (const [defectType, count] of defectsByType) {
      if (count >= this.config.minDefectFrequency) {
        issues.push({
          category: 'Quality',
          description: `${defectType} defects`,
          frequency: count,
          totalImpact: count * this.config.defectImpactWeight,
          equipmentIds: []
        });
      }
    }

    return issues;
  }

  /**
   * Analyze performance issues
   */
  private analyzePerformanceIssues(oeeMetrics: OEEMetrics[]): ProductionIssue[] {
    const issues: ProductionIssue[] = [];

    const lowPerformanceEquipment = oeeMetrics.filter(
      metric => metric.performance < this.config.lowPerformanceThreshold
    );

    if (lowPerformanceEquipment.length > 0) {
      const avgPerformance = lowPerformanceEquipment.reduce(
        (sum, m) => sum + m.performance, 0
      ) / lowPerformanceEquipment.length;

      issues.push({
        category: 'Performance',
        description: 'Equipment running below target speed',
        frequency: lowPerformanceEquipment.length,
        totalImpact: (100 - avgPerformance) * lowPerformanceEquipment.length,
        equipmentIds: lowPerformanceEquipment.map(m => m.equipmentId)
      });
    }

    return issues;
  }

  /**
   * Forecast production
   */
  async forecastProduction(
    plantId: string,
    historicalData: ProductionJob[],
    forecastDays: number
  ): Promise<ProductionForecast[]> {
    console.log(`Forecasting production for ${forecastDays} days`);

    // Prepare time series data
    const timeSeries = this.prepareTimeSeries(historicalData);

    // Use moving average for forecasting
    const forecast = await this.movingAverageForecast(timeSeries, forecastDays);

    return forecast;
  }

  /**
   * Prepare time series from production jobs
   */
  private prepareTimeSeries(jobs: ProductionJob[]): TimeSeriesData[] {
    const dailyProduction = new Map<string, number>();

    for (const job of jobs) {
      if (!job.actualStart) continue;

      const dateKey = job.actualStart.toISOString().split('T')[0];
      dailyProduction.set(
        dateKey,
        (dailyProduction.get(dateKey) || 0) + job.quantityProduced
      );
    }

    return Array.from(dailyProduction.entries())
      .map(([date, value]) => ({
        date: new Date(date),
        value
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Moving average forecast
   */
  private async movingAverageForecast(
    timeSeries: TimeSeriesData[],
    forecastDays: number
  ): Promise<ProductionForecast[]> {
    const windowSize = Math.min(7, timeSeries.length); // 7-day moving average
    const forecasts: ProductionForecast[] = [];

    // Calculate moving average
    const values = timeSeries.map(ts => ts.value);
    const recentAvg = values.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    const recentStd = this.calculateStd(values.slice(-windowSize));

    // Generate forecasts
    const lastDate = timeSeries[timeSeries.length - 1].date;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      forecasts.push({
        date: forecastDate,
        forecastedProduction: Math.round(recentAvg),
        lowerBound: Math.round(recentAvg - 2 * recentStd),
        upperBound: Math.round(recentAvg + 2 * recentStd),
        confidence: 0.95
      });
    }

    return forecasts;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStd(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Perform root cause analysis
   */
  async performRootCauseAnalysis(
    issue: ProductionIssue,
    data: AnalyticsInputData
  ): Promise<RootCauseAnalysis> {
    console.log(`Performing root cause analysis for: ${issue.description}`);

    const potentialCauses: Cause[] = [];

    // Analyze based on issue category
    switch (issue.category) {
      case 'Downtime':
        potentialCauses.push(...this.analyzeDowntimeCauses(issue, data));
        break;
      case 'Quality':
        potentialCauses.push(...this.analyzeQualityCauses(issue, data));
        break;
      case 'Performance':
        potentialCauses.push(...this.analyzePerformanceCauses(issue, data));
        break;
    }

    // Sort by likelihood
    potentialCauses.sort((a, b) => b.likelihood - a.likelihood);

    return {
      issue,
      potentialCauses: potentialCauses.slice(0, 5),
      recommendations: this.generateRecommendations(potentialCauses.slice(0, 3))
    };
  }

  /**
   * Analyze downtime causes
   */
  private analyzeDowntimeCauses(issue: ProductionIssue, data: AnalyticsInputData): Cause[] {
    const causes: Cause[] = [];

    causes.push({
      description: 'Equipment wear and tear',
      likelihood: 0.7,
      evidence: 'Frequent breakdowns on older equipment',
      category: 'Equipment'
    });

    causes.push({
      description: 'Insufficient preventive maintenance',
      likelihood: 0.6,
      evidence: 'Long intervals between maintenance',
      category: 'Maintenance'
    });

    causes.push({
      description: 'Operator training gaps',
      likelihood: 0.5,
      evidence: 'Setup time variability',
      category: 'Process'
    });

    return causes;
  }

  /**
   * Analyze quality causes
   */
  private analyzeQualityCauses(issue: ProductionIssue, data: AnalyticsInputData): Cause[] {
    const causes: Cause[] = [];

    causes.push({
      description: 'Process parameter drift',
      likelihood: 0.8,
      evidence: 'Increasing defect rate over time',
      category: 'Process'
    });

    causes.push({
      description: 'Material quality variation',
      likelihood: 0.6,
      evidence: 'Defects correlate with batch changes',
      category: 'Material'
    });

    causes.push({
      description: 'Tool wear',
      likelihood: 0.5,
      evidence: 'Dimensional defects increasing',
      category: 'Equipment'
    });

    return causes;
  }

  /**
   * Analyze performance causes
   */
  private analyzePerformanceCauses(issue: ProductionIssue, data: AnalyticsInputData): Cause[] {
    const causes: Cause[] = [];

    causes.push({
      description: 'Equipment degradation',
      likelihood: 0.7,
      evidence: 'Gradual speed reduction',
      category: 'Equipment'
    });

    causes.push({
      description: 'Material handling bottlenecks',
      likelihood: 0.6,
      evidence: 'Small stops for material loading',
      category: 'Process'
    });

    return causes;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(causes: Cause[]): string[] {
    return causes.map(cause => {
      switch (cause.category) {
        case 'Equipment':
          return `Inspect and service equipment: ${cause.description}`;
        case 'Maintenance':
          return `Review maintenance schedule: ${cause.description}`;
        case 'Process':
          return `Optimize process: ${cause.description}`;
        case 'Material':
          return `Review material quality: ${cause.description}`;
        default:
          return `Address: ${cause.description}`;
      }
    });
  }
}

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsConfig {
  trendStabilityThreshold: number;
  topIssuesCount: number;
  minIssueImpactMinutes: number;
  minDefectFrequency: number;
  defectImpactWeight: number;
  lowPerformanceThreshold: number;
}

export interface AnalyticsInputData {
  oeeMetrics: OEEMetrics[];
  productionJobs: ProductionJob[];
  qualityResults: QualityInspectionResult[];
  equipment: Equipment[];
}

export interface TimeSeriesData {
  date: Date;
  value: number;
}

export interface ProductionForecast {
  date: Date;
  forecastedProduction: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface RootCauseAnalysis {
  issue: ProductionIssue;
  potentialCauses: Cause[];
  recommendations: string[];
}

export interface Cause {
  description: string;
  likelihood: number;
  evidence: string;
  category: 'Equipment' | 'Process' | 'Material' | 'Maintenance' | 'Human';
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  trendStabilityThreshold: 0.5,
  topIssuesCount: 10,
  minIssueImpactMinutes: 30,
  minDefectFrequency: 5,
  defectImpactWeight: 10,
  lowPerformanceThreshold: 80
};
