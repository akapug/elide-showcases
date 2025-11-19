/**
 * Smart City Platform - Smart Lighting System
 *
 * Adaptive street lighting control using TypeScript + Python optimization.
 * Energy-efficient scheduling, motion detection, and predictive maintenance.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sklearn from 'python:sklearn';

import type {
  SmartLightingSystem,
  StreetLight,
  LightingZone,
  LightingSchedule,
  LightingMode,
  LightStatus,
  ZonePriority,
  DimSchedule,
  DimCondition,
  ConditionType,
  DimAction,
  GeoCoordinates,
  EnergyMetrics,
  WeatherCondition
} from '../types.ts';

/**
 * Smart Lighting Control and Optimization System
 */
export class SmartLightingController {
  private system: SmartLightingSystem;
  private lightingHistory: Map<string, LightingRecord[]> = new Map();
  private energyHistory: EnergyMetrics[] = [];

  constructor(system: SmartLightingSystem) {
    this.system = system;
  }

  /**
   * Update all street lights based on schedule and conditions
   */
  async updateLighting(
    currentTime: Date = new Date(),
    weather: WeatherCondition | null = null,
    trafficDensity: Map<string, number> = new Map()
  ): Promise<void> {
    console.log('Updating street lighting...');

    for (const zone of this.system.zones) {
      const lightIds = zone.lights;
      const schedule = zone.schedule;

      for (const lightId of lightIds) {
        const light = this.system.streetLights.find(l => l.lightId === lightId);
        if (!light || light.status === 'faulty') continue;

        // Determine target brightness
        const targetBrightness = await this.calculateTargetBrightness(
          light,
          zone,
          currentTime,
          weather,
          trafficDensity.get(lightId) || 0
        );

        // Update light
        await this.setLightBrightness(light, targetBrightness);

        // Record state
        this.recordLightingState(light);
      }
    }

    // Calculate and record energy usage
    const energyMetrics = this.calculateEnergyMetrics();
    this.energyHistory.push(energyMetrics);
    this.system.energyUsage = energyMetrics;
  }

  /**
   * Calculate target brightness for a light
   */
  private async calculateTargetBrightness(
    light: StreetLight,
    zone: LightingZone,
    currentTime: Date,
    weather: WeatherCondition | null,
    trafficDensity: number
  ): Promise<number> {
    const schedule = zone.schedule;
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    // Check if light should be on based on schedule
    const [onHour, onMinute] = schedule.onTime.split(':').map(Number);
    const [offHour, offMinute] = schedule.offTime.split(':').map(Number);

    const currentMinutes = hour * 60 + minute;
    const onMinutes = onHour * 60 + onMinute;
    const offMinutes = offHour * 60 + offMinute;

    let shouldBeOn = false;
    if (onMinutes < offMinutes) {
      shouldBeOn = currentMinutes >= onMinutes && currentMinutes < offMinutes;
    } else {
      shouldBeOn = currentMinutes >= onMinutes || currentMinutes < offMinutes;
    }

    if (!shouldBeOn && schedule.mode !== 'emergency') {
      return 0; // Off
    }

    // Base brightness based on schedule mode
    let brightness = 100;

    if (schedule.mode === 'scheduled') {
      // Check dim schedule
      for (const dimSchedule of schedule.dimSchedule) {
        if (this.isTimeInSchedule(currentTime, dimSchedule)) {
          brightness = dimSchedule.brightness;
          break;
        }
      }
    }

    // Adaptive adjustments
    if (schedule.mode === 'adaptive' || zone.adaptiveLighting) {
      // Weather-based adjustment
      if (schedule.weatherAdaptive && weather) {
        brightness = this.adjustForWeather(brightness, weather);
      }

      // Traffic-based adjustment
      if (schedule.trafficAdaptive) {
        brightness = this.adjustForTraffic(brightness, trafficDensity);
      }

      // Motion detection
      if (light.motionDetected) {
        brightness = Math.max(brightness, 80); // Minimum 80% on motion
      }

      // Zone priority adjustment
      brightness = this.adjustForPriority(brightness, zone.priority);
    }

    return Math.max(0, Math.min(100, brightness));
  }

  /**
   * Check if current time is in schedule
   */
  private isTimeInSchedule(currentTime: Date, dimSchedule: DimSchedule): boolean {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const currentMinutes = hour * 60 + minute;

    const [startHour, startMinute] = dimSchedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = dimSchedule.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Adjust brightness for weather conditions
   */
  private adjustForWeather(brightness: number, weather: WeatherCondition): number {
    // Increase brightness in poor visibility conditions
    if (weather.visibility < 1) {
      return Math.min(100, brightness * 1.5);
    } else if (weather.visibility < 5) {
      return Math.min(100, brightness * 1.2);
    }

    // Increase for rain/snow
    if (weather.condition === 'rain' || weather.condition === 'snow' || weather.condition === 'fog') {
      return Math.min(100, brightness * 1.3);
    }

    // Decrease in clear conditions
    if (weather.condition === 'clear' && weather.cloudCover < 20) {
      return Math.max(30, brightness * 0.8);
    }

    return brightness;
  }

  /**
   * Adjust brightness for traffic density
   */
  private adjustForTraffic(brightness: number, trafficDensity: number): number {
    // trafficDensity: 0-1 (low to high)
    if (trafficDensity > 0.7) {
      return Math.min(100, brightness * 1.2);
    } else if (trafficDensity < 0.2) {
      return Math.max(30, brightness * 0.6);
    }

    return brightness;
  }

  /**
   * Adjust brightness based on zone priority
   */
  private adjustForPriority(brightness: number, priority: ZonePriority): number {
    const priorityMultipliers: Record<ZonePriority, number> = {
      'critical': 1.0,  // Always full brightness
      'high': 0.9,
      'medium': 0.8,
      'low': 0.6
    };

    return brightness * priorityMultipliers[priority];
  }

  /**
   * Set light brightness
   */
  private async setLightBrightness(light: StreetLight, brightness: number): Promise<void> {
    light.brightness = brightness;

    if (brightness === 0) {
      light.status = 'off';
    } else if (brightness < 100) {
      light.status = 'dimmed';
    } else {
      light.status = 'on';
    }

    // Update energy consumption based on brightness
    // Typical LED street light: 50-150W, linear with brightness
    const maxPower = light.type === 'led' ? 100 : 150;
    light.energyConsumption = (brightness / 100) * maxPower;
  }

  /**
   * Record lighting state for analytics
   */
  private recordLightingState(light: StreetLight): void {
    const history = this.lightingHistory.get(light.lightId) || [];
    history.push({
      timestamp: new Date(),
      status: light.status,
      brightness: light.brightness,
      energyConsumption: light.energyConsumption,
      motionDetected: light.motionDetected
    });

    // Keep last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600000;
    const filtered = history.filter(r => r.timestamp.getTime() > sevenDaysAgo);
    this.lightingHistory.set(light.lightId, filtered);
  }

  /**
   * Calculate current energy metrics
   */
  private calculateEnergyMetrics(): EnergyMetrics {
    const activeLights = this.system.streetLights.filter(l => l.status !== 'faulty');
    const totalConsumption = activeLights.reduce((sum, l) => sum + l.energyConsumption, 0);
    const peakDemand = Math.max(...activeLights.map(l => l.energyConsumption));

    // Calculate efficiency (actual vs. maximum possible consumption)
    const maxPossibleConsumption = activeLights.length * 150; // Assuming max 150W per light
    const efficiency = maxPossibleConsumption > 0 ?
      (1 - totalConsumption / maxPossibleConsumption) * 100 : 0;

    // Estimate cost (assuming $0.12 per kWh)
    const cost = (totalConsumption / 1000) * 0.12;

    // Carbon footprint (assuming 0.5 kg CO2 per kWh)
    const carbonFootprint = (totalConsumption / 1000) * 0.5;

    // Renewable percentage (placeholder - would come from grid data)
    const renewablePercentage = 30;

    return {
      totalConsumption,
      peakDemand,
      efficiency,
      cost,
      carbonFootprint,
      renewablePercentage
    };
  }

  /**
   * Optimize lighting schedule using machine learning
   */
  async optimizeSchedule(zone: LightingZone): Promise<LightingSchedule> {
    console.log(`Optimizing schedule for zone ${zone.zoneId}...`);

    // Collect historical data
    const zoneHistory = this.collectZoneHistory(zone);

    if (zoneHistory.length < 100) {
      console.warn('Insufficient data for optimization');
      return zone.schedule;
    }

    // Prepare features: hour, day of week, weather, traffic
    const features: number[][] = [];
    const energyUsage: number[] = [];

    for (const record of zoneHistory) {
      const hour = record.timestamp.getHours();
      const dayOfWeek = record.timestamp.getDay();

      features.push([
        hour,
        dayOfWeek,
        Math.sin(2 * Math.PI * hour / 24), // Cyclical encoding
        Math.cos(2 * Math.PI * hour / 24),
        Math.sin(2 * Math.PI * dayOfWeek / 7),
        Math.cos(2 * Math.PI * dayOfWeek / 7)
      ]);

      energyUsage.push(record.energyConsumption);
    }

    // Train Random Forest model to predict optimal brightness
    const RandomForestRegressor = sklearn.ensemble.RandomForestRegressor;
    const model = new RandomForestRegressor({
      n_estimators: 50,
      max_depth: 10,
      random_state: 42
    });

    const X = numpy.array(features);
    const y = numpy.array(energyUsage);

    model.fit(X, y);

    // Generate optimized dim schedule
    const dimSchedule: DimSchedule[] = [];

    // Predict for each hour
    const hourlyPredictions = new Map<number, number>();

    for (let hour = 0; hour < 24; hour++) {
      const testFeatures = [
        hour,
        3, // Wednesday (average day)
        Math.sin(2 * Math.PI * hour / 24),
        Math.cos(2 * Math.PI * hour / 24),
        Math.sin(2 * Math.PI * 3 / 7),
        Math.cos(2 * Math.PI * 3 / 7)
      ];

      const X_test = numpy.array([testFeatures]);
      const prediction = model.predict(X_test)[0];

      hourlyPredictions.set(hour, prediction);
    }

    // Create schedule segments
    let currentBrightness = 0;
    let segmentStart = 0;

    for (let hour = 0; hour < 24; hour++) {
      const predictedEnergy = hourlyPredictions.get(hour) || 0;
      const brightness = Math.round((predictedEnergy / 150) * 100);

      if (brightness !== currentBrightness) {
        if (currentBrightness > 0) {
          dimSchedule.push({
            startTime: `${segmentStart.toString().padStart(2, '0')}:00`,
            endTime: `${hour.toString().padStart(2, '0')}:00`,
            brightness: currentBrightness,
            conditions: []
          });
        }

        currentBrightness = brightness;
        segmentStart = hour;
      }
    }

    // Add final segment
    if (currentBrightness > 0) {
      dimSchedule.push({
        startTime: `${segmentStart.toString().padStart(2, '0')}:00`,
        endTime: '00:00',
        brightness: currentBrightness,
        conditions: []
      });
    }

    const optimizedSchedule: LightingSchedule = {
      ...zone.schedule,
      mode: 'adaptive',
      dimSchedule
    };

    console.log(`Optimized schedule created with ${dimSchedule.length} segments`);

    return optimizedSchedule;
  }

  /**
   * Collect historical data for a zone
   */
  private collectZoneHistory(zone: LightingZone): LightingRecord[] {
    const allRecords: LightingRecord[] = [];

    for (const lightId of zone.lights) {
      const history = this.lightingHistory.get(lightId);
      if (history) {
        allRecords.push(...history);
      }
    }

    return allRecords;
  }

  /**
   * Predict maintenance needs using ML
   */
  async predictMaintenance(): Promise<MaintenancePrediction[]> {
    console.log('Predicting maintenance needs...');

    const predictions: MaintenancePrediction[] = [];

    for (const light of this.system.streetLights) {
      const history = this.lightingHistory.get(light.lightId);

      if (!history || history.length < 30) continue;

      // Calculate operational hours
      const onTime = history.filter(r => r.status !== 'off').length;
      const totalHours = onTime; // Simplified

      // LED lifespan: typically 50,000-100,000 hours
      const expectedLifespan = 75000;
      const remainingLife = expectedLifespan - light.lifespan;
      const remainingPercentage = (remainingLife / expectedLifespan) * 100;

      if (remainingPercentage < 20) {
        predictions.push({
          lightId: light.lightId,
          location: light.location,
          type: 'replacement',
          urgency: remainingPercentage < 10 ? 'high' : 'medium',
          estimatedDate: new Date(Date.now() + remainingLife * 3600000),
          confidence: 0.85,
          reason: `${remainingPercentage.toFixed(1)}% lifespan remaining`
        });
      }

      // Check for anomalous energy consumption
      const avgEnergy = history.reduce((sum, r) => sum + r.energyConsumption, 0) / history.length;
      const recent = history.slice(-10);
      const recentAvg = recent.reduce((sum, r) => sum + r.energyConsumption, 0) / recent.length;

      if (recentAvg > avgEnergy * 1.5) {
        predictions.push({
          lightId: light.lightId,
          location: light.location,
          type: 'inspection',
          urgency: 'medium',
          estimatedDate: new Date(Date.now() + 7 * 24 * 3600000),
          confidence: 0.7,
          reason: 'Anomalous energy consumption detected'
        });
      }
    }

    return predictions;
  }

  /**
   * Detect lighting faults
   */
  async detectFaults(): Promise<LightingFault[]> {
    const faults: LightingFault[] = [];

    for (const light of this.system.streetLights) {
      if (light.status === 'faulty') continue;

      const history = this.lightingHistory.get(light.lightId);
      if (!history || history.length < 24) continue;

      // Check for flickering (rapid status changes)
      const recentHour = history.slice(-12); // Last hour (5-min intervals)
      const statusChanges = this.countStatusChanges(recentHour);

      if (statusChanges > 5) {
        faults.push({
          lightId: light.lightId,
          location: light.location,
          type: 'flickering',
          severity: 'medium',
          detectedAt: new Date(),
          description: `Light flickering detected (${statusChanges} status changes in last hour)`
        });
      }

      // Check for unexpected off state
      const shouldBeOn = this.shouldLightBeOn(light);
      if (shouldBeOn && light.status === 'off') {
        faults.push({
          lightId: light.lightId,
          location: light.location,
          type: 'not_responding',
          severity: 'high',
          detectedAt: new Date(),
          description: 'Light should be on but is off'
        });
      }

      // Check for energy consumption anomalies
      const avgEnergy = history.reduce((sum, r) => sum + r.energyConsumption, 0) / history.length;
      if (light.energyConsumption > avgEnergy * 2) {
        faults.push({
          lightId: light.lightId,
          location: light.location,
          type: 'energy_anomaly',
          severity: 'low',
          detectedAt: new Date(),
          description: `Energy consumption ${(light.energyConsumption / avgEnergy * 100).toFixed(0)}% above average`
        });
      }
    }

    return faults;
  }

  /**
   * Count status changes in history
   */
  private countStatusChanges(history: LightingRecord[]): number {
    let changes = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].status !== history[i - 1].status) {
        changes++;
      }
    }
    return changes;
  }

  /**
   * Check if light should be on based on current time
   */
  private shouldLightBeOn(light: StreetLight): boolean {
    const hour = new Date().getHours();
    // Simple check: lights should be on between 18:00 and 06:00
    return hour >= 18 || hour < 6;
  }

  /**
   * Calculate energy savings
   */
  calculateEnergySavings(): EnergySavingsReport {
    if (this.energyHistory.length < 2) {
      return {
        period: 'insufficient_data',
        baselineConsumption: 0,
        actualConsumption: 0,
        savings: 0,
        savingsPercentage: 0,
        costSavings: 0,
        carbonReduction: 0
      };
    }

    // Compare last week to baseline (traditional always-on lighting)
    const recentWeek = this.energyHistory.slice(-168); // Last 7 days (hourly)
    const actualConsumption = recentWeek.reduce((sum, m) => sum + m.totalConsumption, 0);

    // Baseline: all lights at 100% for 12 hours/day
    const totalLights = this.system.streetLights.length;
    const baselineConsumption = totalLights * 150 * 12 * 7; // 7 days

    const savings = baselineConsumption - actualConsumption;
    const savingsPercentage = (savings / baselineConsumption) * 100;

    const costSavings = (savings / 1000) * 0.12; // $0.12 per kWh
    const carbonReduction = (savings / 1000) * 0.5; // 0.5 kg CO2 per kWh

    return {
      period: 'last_7_days',
      baselineConsumption,
      actualConsumption,
      savings,
      savingsPercentage,
      costSavings,
      carbonReduction
    };
  }

  /**
   * Generate lighting system report
   */
  generateReport(): LightingReport {
    const totalLights = this.system.streetLights.length;
    const onLights = this.system.streetLights.filter(l => l.status === 'on').length;
    const dimmedLights = this.system.streetLights.filter(l => l.status === 'dimmed').length;
    const offLights = this.system.streetLights.filter(l => l.status === 'off').length;
    const faultyLights = this.system.streetLights.filter(l => l.status === 'faulty').length;

    const avgBrightness = this.system.streetLights
      .reduce((sum, l) => sum + l.brightness, 0) / totalLights;

    const energySavings = this.calculateEnergySavings();

    return {
      timestamp: new Date(),
      summary: {
        totalLights,
        onLights,
        dimmedLights,
        offLights,
        faultyLights,
        avgBrightness: Math.round(avgBrightness),
        totalZones: this.system.zones.length
      },
      energyMetrics: this.system.energyUsage,
      energySavings,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const faultyLights = this.system.streetLights.filter(l => l.status === 'faulty');
    if (faultyLights.length > 0) {
      recommendations.push(`${faultyLights.length} lights require immediate maintenance`);
    }

    const avgAge = this.system.streetLights.reduce((sum, l) => sum + l.lifespan, 0) /
      this.system.streetLights.length;

    if (avgAge > 50000) {
      recommendations.push('Average light age is high - plan for bulk replacement program');
    }

    const sodiumVaporLights = this.system.streetLights.filter(l => l.type === 'sodium_vapor');
    if (sodiumVaporLights.length > 0) {
      recommendations.push(
        `${sodiumVaporLights.length} old sodium vapor lights - upgrade to LED for 60% energy savings`
      );
    }

    const energySavings = this.calculateEnergySavings();
    if (energySavings.savingsPercentage < 30) {
      recommendations.push('Enable adaptive lighting in more zones to increase energy savings');
    }

    return recommendations;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface LightingRecord {
  timestamp: Date;
  status: LightStatus;
  brightness: number;
  energyConsumption: number;
  motionDetected: boolean;
}

interface MaintenancePrediction {
  lightId: string;
  location: GeoCoordinates;
  type: 'replacement' | 'inspection' | 'cleaning';
  urgency: 'low' | 'medium' | 'high';
  estimatedDate: Date;
  confidence: number;
  reason: string;
}

interface LightingFault {
  lightId: string;
  location: GeoCoordinates;
  type: 'flickering' | 'not_responding' | 'energy_anomaly' | 'physical_damage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  description: string;
}

interface EnergySavingsReport {
  period: string;
  baselineConsumption: number;
  actualConsumption: number;
  savings: number;
  savingsPercentage: number;
  costSavings: number;
  carbonReduction: number;
}

interface LightingReport {
  timestamp: Date;
  summary: {
    totalLights: number;
    onLights: number;
    dimmedLights: number;
    offLights: number;
    faultyLights: number;
    avgBrightness: number;
    totalZones: number;
  };
  energyMetrics: EnergyMetrics;
  energySavings: EnergySavingsReport;
  recommendations: string[];
}
