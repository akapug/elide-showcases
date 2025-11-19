/**
 * Smart City Platform - City Analytics Dashboard
 *
 * Comprehensive city-wide analytics and insights using TypeScript + Python data science.
 * Real-time KPIs, predictive analytics, and data visualization.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import matplotlib from 'python:matplotlib';

import type {
  CityAnalytics,
  TrafficAnalytics,
  EnvironmentalAnalytics,
  UtilityAnalytics,
  SafetyAnalytics,
  CitizenAnalytics,
  CityConfig,
  GeoCoordinates
} from '../types.ts';

import { TrafficNetworkOptimizer } from '../traffic/traffic-optimizer.ts';
import { AirQualityMonitor } from '../environment/air-quality-monitor.ts';
import { WasteManagementOptimizer } from '../environment/waste-management.ts';
import { SmartLightingController } from '../utilities/smart-lighting.ts';
import { WaterManagementController } from '../utilities/water-management.ts';
import { EmergencyResponseCoordinator } from '../safety/emergency-response.ts';
import { CitizenServicesManager } from '../citizen/citizen-services.ts';

/**
 * City-Wide Analytics and Intelligence System
 */
export class CityAnalyticsDashboard {
  private cityConfig: CityConfig;
  private analyticsHistory: CityAnalytics[] = [];
  private kpiHistory: Map<string, KPIRecord[]> = new Map();

  // System components
  private trafficOptimizer?: TrafficNetworkOptimizer;
  private airQualityMonitor?: AirQualityMonitor;
  private wasteManager?: WasteManagementOptimizer;
  private lightingController?: SmartLightingController;
  private waterManager?: WaterManagementController;
  private emergencyCoordinator?: EmergencyResponseCoordinator;
  private citizenServices?: CitizenServicesManager;

  constructor(cityConfig: CityConfig) {
    this.cityConfig = cityConfig;
  }

  /**
   * Register system components
   */
  registerComponents(components: {
    traffic?: TrafficNetworkOptimizer;
    airQuality?: AirQualityMonitor;
    waste?: WasteManagementOptimizer;
    lighting?: SmartLightingController;
    water?: WaterManagementController;
    emergency?: EmergencyResponseCoordinator;
    citizen?: CitizenServicesManager;
  }): void {
    this.trafficOptimizer = components.traffic;
    this.airQualityMonitor = components.airQuality;
    this.wasteManager = components.waste;
    this.lightingController = components.lighting;
    this.waterManager = components.water;
    this.emergencyCoordinator = components.emergency;
    this.citizenServices = components.citizen;

    console.log('City analytics components registered');
  }

  /**
   * Collect real-time city analytics
   */
  async collectCityAnalytics(): Promise<CityAnalytics> {
    console.log('Collecting city-wide analytics...');

    const timestamp = new Date();

    // Collect from all subsystems
    const traffic = await this.collectTrafficAnalytics();
    const environment = await this.collectEnvironmentalAnalytics();
    const utilities = await this.collectUtilityAnalytics();
    const safety = await this.collectSafetyAnalytics();
    const citizen = await this.collectCitizenAnalytics();

    const analytics: CityAnalytics = {
      timestamp,
      traffic,
      environment,
      utilities,
      safety,
      citizen
    };

    this.analyticsHistory.push(analytics);

    // Keep last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000;
    this.analyticsHistory = this.analyticsHistory.filter(a =>
      a.timestamp.getTime() > thirtyDaysAgo
    );

    // Update KPIs
    await this.updateKPIs(analytics);

    return analytics;
  }

  /**
   * Collect traffic analytics
   */
  private async collectTrafficAnalytics(): Promise<TrafficAnalytics> {
    if (!this.trafficOptimizer) {
      return {
        totalVehicles: 0,
        averageSpeed: 0,
        congestionIndex: 0,
        incidentCount: 0,
        publicTransitUsage: 0,
        emissions: 0
      };
    }

    const report = this.trafficOptimizer.generateReport();

    // Calculate congestion index (0-100, higher = worse)
    const congestionIndex = report.summary.avgCongestionLevel * 20;

    // Estimate emissions based on vehicles and congestion
    const emissions = report.summary.totalVehicles * congestionIndex * 0.01; // kg CO2

    return {
      totalVehicles: report.summary.totalVehicles,
      averageSpeed: report.summary.avgSpeed,
      congestionIndex,
      incidentCount: report.congestionHotspots.length,
      publicTransitUsage: 0, // Would come from citizen services
      emissions
    };
  }

  /**
   * Collect environmental analytics
   */
  private async collectEnvironmentalAnalytics(): Promise<EnvironmentalAnalytics> {
    if (!this.airQualityMonitor || !this.wasteManager) {
      return {
        averageAQI: 0,
        noiseLevel: 0,
        greenSpaceUsage: 0,
        wasteCollected: 0,
        recyclingRate: 0
      };
    }

    const airReport = this.airQualityMonitor.generateReport();
    const wasteReport = this.wasteManager.generateReport();

    return {
      averageAQI: airReport.summary.averageAQI,
      noiseLevel: 55, // Placeholder - would come from noise sensors
      greenSpaceUsage: 60, // Placeholder - would come from park sensors
      wasteCollected: wasteReport.summary.currentWaste / 1000, // Convert to tons
      recyclingRate: 0 // Would be calculated from waste types
    };
  }

  /**
   * Collect utility analytics
   */
  private async collectUtilityAnalytics(): Promise<UtilityAnalytics> {
    if (!this.lightingController || !this.waterManager) {
      return {
        waterConsumption: 0,
        energyConsumption: 0,
        streetLightEfficiency: 0,
        leakDetection: 0
      };
    }

    const lightingReport = this.lightingController.generateReport();
    const waterReport = this.waterManager.generateReport();

    return {
      waterConsumption: waterReport.consumption.totalConsumption,
      energyConsumption: lightingReport.energyMetrics.totalConsumption,
      streetLightEfficiency: lightingReport.energyMetrics.efficiency,
      leakDetection: waterReport.leaks.activeLeaks
    };
  }

  /**
   * Collect safety analytics
   */
  private async collectSafetyAnalytics(): Promise<SafetyAnalytics> {
    if (!this.emergencyCoordinator) {
      return {
        emergencyCount: 0,
        averageResponseTime: 0,
        crimeIncidents: 0,
        resolutionRate: 0
      };
    }

    const emergencyReport = this.emergencyCoordinator.generateReport();

    return {
      emergencyCount: emergencyReport.summary.last24Hours,
      averageResponseTime: emergencyReport.performance.avgResponseTime,
      crimeIncidents: 0, // Would come from police data
      resolutionRate: emergencyReport.performance.resolutionRate
    };
  }

  /**
   * Collect citizen analytics
   */
  private async collectCitizenAnalytics(): Promise<CitizenAnalytics> {
    if (!this.citizenServices) {
      return {
        serviceRequests: 0,
        satisfactionScore: 0,
        appUsage: 0,
        feedbackCount: 0
      };
    }

    const citizenReport = this.citizenServices.generateReport();
    const metrics = citizenReport.serviceRequests.metrics;

    return {
      serviceRequests: citizenReport.serviceRequests.total,
      satisfactionScore: metrics.avgSatisfaction,
      appUsage: 0, // Would come from app analytics
      feedbackCount: 0 // Would come from feedback system
    };
  }

  /**
   * Update Key Performance Indicators
   */
  private async updateKPIs(analytics: CityAnalytics): Promise<void> {
    const kpis = [
      { name: 'traffic_congestion', value: analytics.traffic.congestionIndex },
      { name: 'air_quality', value: analytics.environment.averageAQI },
      { name: 'emergency_response', value: analytics.safety.averageResponseTime },
      { name: 'citizen_satisfaction', value: analytics.citizen.satisfactionScore },
      { name: 'energy_efficiency', value: analytics.utilities.streetLightEfficiency },
      { name: 'water_leaks', value: analytics.utilities.leakDetection }
    ];

    for (const kpi of kpis) {
      const history = this.kpiHistory.get(kpi.name) || [];
      history.push({
        timestamp: analytics.timestamp,
        value: kpi.value
      });

      // Keep last 90 days
      const ninetyDaysAgo = Date.now() - 90 * 24 * 3600000;
      this.kpiHistory.set(
        kpi.name,
        history.filter(r => r.timestamp.getTime() > ninetyDaysAgo)
      );
    }
  }

  /**
   * Calculate city-wide KPIs
   */
  calculateKPIs(): Map<string, KPIMetrics> {
    const kpis = new Map<string, KPIMetrics>();

    for (const [name, history] of this.kpiHistory.entries()) {
      if (history.length === 0) continue;

      const values = history.map(r => r.value);
      const current = values[values.length - 1];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      // Calculate trend
      const trend = this.calculateTrend(values);

      // Calculate target achievement (example targets)
      const targets: Record<string, number> = {
        'traffic_congestion': 30,
        'air_quality': 50,
        'emergency_response': 8,
        'citizen_satisfaction': 4.0,
        'energy_efficiency': 80,
        'water_leaks': 5
      };

      const target = targets[name] || 0;
      const achievement = target > 0 ? Math.min(100, (current / target) * 100) : 0;

      kpis.set(name, {
        current,
        average: avg,
        min,
        max,
        trend,
        target,
        achievement
      });
    }

    return kpis;
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const recentCount = Math.min(7, values.length);
    const recent = values.slice(-recentCount);
    const previous = values.slice(-recentCount * 2, -recentCount);

    if (previous.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change < 0 ? 'improving' : 'declining';
  }

  /**
   * Generate predictive insights using ML
   */
  async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
    console.log('Generating predictive insights...');

    const insights: PredictiveInsight[] = [];

    // Analyze each KPI for predictions
    for (const [name, history] of this.kpiHistory.entries()) {
      if (history.length < 30) continue; // Need sufficient data

      // Prepare time series data
      const values = history.map(r => r.value);
      const X = Array.from({ length: values.length }, (_, i) => [i]);
      const y = values;

      // Use Linear Regression for simple trend prediction
      const LinearRegression = sklearn.linear_model.LinearRegression;
      const model = new LinearRegression();

      const X_train = numpy.array(X);
      const y_train = numpy.array(y);

      model.fit(X_train, y_train);

      // Predict next 7 days
      const futureX = Array.from({ length: 7 }, (_, i) => [values.length + i]);
      const X_future = numpy.array(futureX);
      const predictions = model.predict(X_future);

      // Analyze predictions
      const currentValue = values[values.length - 1];
      const futureValue = predictions[6]; // 7 days ahead

      const changePercent = ((futureValue - currentValue) / currentValue) * 100;

      if (Math.abs(changePercent) > 10) {
        insights.push({
          kpi: name,
          currentValue,
          predictedValue: futureValue,
          changePercent,
          confidence: 0.75,
          timeframe: '7 days',
          severity: Math.abs(changePercent) > 25 ? 'high' : 'medium',
          recommendation: this.generatePredictionRecommendation(name, changePercent)
        });
      }
    }

    return insights.sort((a, b) =>
      (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)
    );
  }

  /**
   * Generate prediction recommendation
   */
  private generatePredictionRecommendation(kpi: string, changePercent: number): string {
    const direction = changePercent > 0 ? 'increase' : 'decrease';
    const abs = Math.abs(changePercent).toFixed(1);

    const recommendations: Record<string, string> = {
      'traffic_congestion': `Traffic congestion expected to ${direction} by ${abs}% - adjust signal timing`,
      'air_quality': `Air quality expected to ${direction} by ${abs}% - ${changePercent > 0 ? 'activate pollution controls' : 'maintain current measures'}`,
      'emergency_response': `Response time expected to ${direction} by ${abs}% - ${changePercent > 0 ? 'allocate more responders' : 'current allocation adequate'}`,
      'citizen_satisfaction': `Satisfaction expected to ${direction} by ${abs}% - ${changePercent < 0 ? 'review service quality' : 'maintain standards'}`,
      'energy_efficiency': `Energy efficiency expected to ${direction} by ${abs}% - ${changePercent < 0 ? 'audit systems' : 'continue optimization'}`,
      'water_leaks': `Water leaks expected to ${direction} by ${abs}% - ${changePercent > 0 ? 'increase inspections' : 'continue monitoring'}`
    };

    return recommendations[kpi] || `${kpi} expected to ${direction} by ${abs}%`;
  }

  /**
   * Detect anomalies across all city systems
   */
  async detectSystemAnomalies(): Promise<SystemAnomaly[]> {
    console.log('Detecting system-wide anomalies...');

    const anomalies: SystemAnomaly[] = [];

    // Check each subsystem
    if (this.trafficOptimizer) {
      const trafficAnomalies = await this.trafficOptimizer.detectAnomalies();
      for (const anomaly of trafficAnomalies) {
        anomalies.push({
          system: 'traffic',
          type: anomaly.type,
          severity: anomaly.severity,
          location: { latitude: 0, longitude: 0 }, // Would use actual location
          detectedAt: anomaly.timestamp,
          description: anomaly.description,
          confidence: anomaly.confidence
        });
      }
    }

    if (this.airQualityMonitor) {
      const airAnomalies = await this.airQualityMonitor.detectAnomalies();
      for (const anomaly of airAnomalies) {
        anomalies.push({
          system: 'air_quality',
          type: 'air_quality_anomaly',
          severity: anomaly.severity,
          location: anomaly.location,
          detectedAt: anomaly.timestamp,
          description: `Anomalous air quality at sensor ${anomaly.sensorId}`,
          confidence: anomaly.confidence
        });
      }
    }

    if (this.waterManager) {
      const leaks = await this.waterManager.detectLeaks();
      for (const leak of leaks) {
        anomalies.push({
          system: 'water',
          type: 'leak_detected',
          severity: leak.severity,
          location: leak.location,
          detectedAt: leak.detectedAt,
          description: `Water leak detected in pipe ${leak.pipeId}`,
          confidence: leak.confidence
        });
      }
    }

    if (this.lightingController) {
      const faults = await this.lightingController.detectFaults();
      for (const fault of faults) {
        anomalies.push({
          system: 'lighting',
          type: fault.type,
          severity: fault.severity,
          location: fault.location,
          detectedAt: fault.detectedAt,
          description: fault.description,
          confidence: 0.8
        });
      }
    }

    return anomalies.sort((a, b) =>
      this.severityToNumber(b.severity) - this.severityToNumber(a.severity)
    );
  }

  /**
   * Convert severity to number for sorting
   */
  private severityToNumber(severity: string): number {
    const mapping: Record<string, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return mapping[severity] || 0;
  }

  /**
   * Generate correlation analysis between city systems
   */
  async analyzeCorrelations(): Promise<CorrelationAnalysis[]> {
    console.log('Analyzing system correlations...');

    if (this.analyticsHistory.length < 30) {
      console.warn('Insufficient data for correlation analysis');
      return [];
    }

    const correlations: CorrelationAnalysis[] = [];

    // Prepare data for correlation
    const data: Record<string, number[]> = {
      traffic_congestion: [],
      air_quality: [],
      energy_consumption: [],
      emergency_count: [],
      satisfaction: []
    };

    for (const analytics of this.analyticsHistory) {
      data.traffic_congestion.push(analytics.traffic.congestionIndex);
      data.air_quality.push(analytics.environment.averageAQI);
      data.energy_consumption.push(analytics.utilities.energyConsumption);
      data.emergency_count.push(analytics.safety.emergencyCount);
      data.satisfaction.push(analytics.citizen.satisfactionScore);
    }

    // Calculate pairwise correlations
    const metrics = Object.keys(data);
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i];
        const metric2 = metrics[j];

        const correlation = this.calculateCorrelation(data[metric1], data[metric2]);

        if (Math.abs(correlation) > 0.5) {
          correlations.push({
            metric1,
            metric2,
            correlation,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : 'moderate',
            insight: this.generateCorrelationInsight(metric1, metric2, correlation)
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Generate correlation insight
   */
  private generateCorrelationInsight(metric1: string, metric2: string, correlation: number): string {
    const relationship = correlation > 0 ? 'increases' : 'decreases';
    const strength = Math.abs(correlation) > 0.7 ? 'strongly' : 'moderately';

    return `${metric1} ${strength} ${relationship} with ${metric2} (r=${correlation.toFixed(2)})`;
  }

  /**
   * Generate comprehensive city analytics report
   */
  async generateComprehensiveReport(): Promise<ComprehensiveReport> {
    console.log('Generating comprehensive city analytics report...');

    const currentAnalytics = await this.collectCityAnalytics();
    const kpis = this.calculateKPIs();
    const insights = await this.generatePredictiveInsights();
    const anomalies = await this.detectSystemAnomalies();
    const correlations = await this.analyzeCorrelations();

    // Calculate overall city health score (0-100)
    const healthScore = this.calculateCityHealthScore(currentAnalytics, kpis);

    return {
      timestamp: new Date(),
      cityConfig: this.cityConfig,
      currentAnalytics,
      kpis: Object.fromEntries(kpis),
      healthScore,
      insights,
      anomalies,
      correlations,
      recommendations: this.generateStrategicRecommendations(healthScore, insights, anomalies)
    };
  }

  /**
   * Calculate overall city health score
   */
  private calculateCityHealthScore(analytics: CityAnalytics, kpis: Map<string, KPIMetrics>): number {
    let score = 100;

    // Deduct points for issues
    if (analytics.traffic.congestionIndex > 50) score -= 10;
    if (analytics.environment.averageAQI > 100) score -= 15;
    if (analytics.safety.averageResponseTime > 10) score -= 10;
    if (analytics.citizen.satisfactionScore < 3.5) score -= 15;
    if (analytics.utilities.leakDetection > 10) score -= 10;

    // Add points for good performance
    if (analytics.utilities.streetLightEfficiency > 80) score += 5;
    if (analytics.safety.resolutionRate > 90) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate strategic recommendations
   */
  private generateStrategicRecommendations(
    healthScore: number,
    insights: PredictiveInsight[],
    anomalies: SystemAnomaly[]
  ): string[] {
    const recommendations: string[] = [];

    if (healthScore < 70) {
      recommendations.push(`PRIORITY: City health score is ${healthScore}/100 - immediate action required`);
    }

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push(`${criticalAnomalies.length} critical anomalies detected - address immediately`);
    }

    const highSeverityInsights = insights.filter(i => i.severity === 'high');
    if (highSeverityInsights.length > 0) {
      recommendations.push(`${highSeverityInsights.length} high-impact trends predicted - plan preventive measures`);
    }

    recommendations.push('Continue routine monitoring and optimization');

    return recommendations;
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.analyticsHistory, null, 2);
    }

    // CSV export
    const df = pandas.DataFrame(this.analyticsHistory.map(a => ({
      timestamp: a.timestamp.toISOString(),
      totalVehicles: a.traffic.totalVehicles,
      congestionIndex: a.traffic.congestionIndex,
      averageAQI: a.environment.averageAQI,
      energyConsumption: a.utilities.energyConsumption,
      emergencyCount: a.safety.emergencyCount,
      satisfaction: a.citizen.satisfactionScore
    })));

    return df.to_csv();
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface KPIRecord {
  timestamp: Date;
  value: number;
}

interface KPIMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'stable' | 'declining';
  target: number;
  achievement: number;
}

interface PredictiveInsight {
  kpi: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  timeframe: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface SystemAnomaly {
  system: string;
  type: string;
  severity: string;
  location: GeoCoordinates;
  detectedAt: Date;
  description: string;
  confidence: number;
}

interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  insight: string;
}

interface ComprehensiveReport {
  timestamp: Date;
  cityConfig: CityConfig;
  currentAnalytics: CityAnalytics;
  kpis: Record<string, KPIMetrics>;
  healthScore: number;
  insights: PredictiveInsight[];
  anomalies: SystemAnomaly[];
  correlations: CorrelationAnalysis[];
  recommendations: string[];
}
