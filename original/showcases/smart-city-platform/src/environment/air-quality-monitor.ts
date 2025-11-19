/**
 * Smart City Platform - Air Quality Monitoring System
 *
 * Real-time air quality monitoring and prediction using TypeScript + Python ML.
 * Implements time series forecasting, anomaly detection, and health impact assessment.
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
  EnvironmentalNetwork,
  AirQualitySensor,
  AirQualityMeasurement,
  AirQualityCategory,
  WeatherCondition,
  GeoCoordinates,
  SensorStatus,
  AlertSeverity
} from '../types.ts';

/**
 * Air Quality Monitoring and Prediction System
 */
export class AirQualityMonitor {
  private network: EnvironmentalNetwork;
  private measurements: Map<string, AirQualityMeasurement[]> = new Map();
  private predictionModels: Map<string, any> = new Map();
  private alerts: AirQualityAlert[] = [];

  constructor(network: EnvironmentalNetwork) {
    this.network = network;
    this.initializeModels();
  }

  /**
   * Initialize ML models for air quality prediction
   */
  private async initializeModels(): Promise<void> {
    console.log('Initializing air quality prediction models...');

    // Random Forest for PM2.5 prediction
    const RandomForestRegressor = sklearn.ensemble.RandomForestRegressor;
    const pm25Model = new RandomForestRegressor({
      n_estimators: 100,
      max_depth: 20,
      random_state: 42
    });

    this.predictionModels.set('pm25', pm25Model);

    // Gradient Boosting for AQI prediction
    const GradientBoostingRegressor = sklearn.ensemble.GradientBoostingRegressor;
    const aqiModel = new GradientBoostingRegressor({
      n_estimators: 100,
      learning_rate: 0.1,
      max_depth: 5,
      random_state: 42
    });

    this.predictionModels.set('aqi', aqiModel);

    console.log('Air quality models initialized');
  }

  /**
   * Collect air quality measurements from all sensors
   */
  async collectMeasurements(): Promise<Map<string, AirQualityMeasurement>> {
    const currentMeasurements = new Map<string, AirQualityMeasurement>();

    for (const sensor of this.network.airQualitySensors) {
      if (sensor.status !== 'active') {
        console.warn(`Sensor ${sensor.sensorId} is ${sensor.status}, skipping`);
        continue;
      }

      try {
        const measurement = await this.readSensor(sensor);
        currentMeasurements.set(sensor.sensorId, measurement);

        // Store historical data
        const history = this.measurements.get(sensor.sensorId) || [];
        history.push(measurement);

        // Keep last 30 days of data
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000;
        const filtered = history.filter(m => m.timestamp.getTime() > thirtyDaysAgo);
        this.measurements.set(sensor.sensorId, filtered);

        // Update sensor
        sensor.measurements = measurement;
      } catch (error) {
        console.error(`Error reading sensor ${sensor.sensorId}:`, error);
      }
    }

    return currentMeasurements;
  }

  /**
   * Read measurement from sensor
   */
  private async readSensor(sensor: AirQualitySensor): Promise<AirQualityMeasurement> {
    // In production, this would interface with actual sensor hardware
    // For demo, generate realistic measurements with some variation

    const basePM25 = 25 + Math.random() * 30;
    const basePM10 = basePM25 * 2 + Math.random() * 20;

    const measurement: AirQualityMeasurement = {
      timestamp: new Date(),
      pm25: basePM25,
      pm10: basePM10,
      no2: 20 + Math.random() * 30,
      so2: 5 + Math.random() * 10,
      co: 0.5 + Math.random() * 1.0,
      o3: 30 + Math.random() * 40,
      voc: 100 + Math.random() * 200,
      temperature: 15 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      pressure: 1010 + Math.random() * 20,
      aqi: 0,
      category: 'good'
    };

    // Calculate AQI
    measurement.aqi = this.calculateAQI(measurement);
    measurement.category = this.categorizeAQI(measurement.aqi);

    return measurement;
  }

  /**
   * Calculate Air Quality Index (US EPA standard)
   */
  private calculateAQI(measurement: AirQualityMeasurement): number {
    // Calculate sub-indices for each pollutant
    const pm25AQI = this.calculateSubIndex(measurement.pm25, [
      [0, 12.0], [12.1, 35.4], [35.5, 55.4], [55.5, 150.4], [150.5, 250.4], [250.5, 500.4]
    ], [0, 50, 100, 150, 200, 300, 500]);

    const pm10AQI = this.calculateSubIndex(measurement.pm10, [
      [0, 54], [55, 154], [155, 254], [255, 354], [355, 424], [425, 604]
    ], [0, 50, 100, 150, 200, 300, 500]);

    const no2AQI = this.calculateSubIndex(measurement.no2, [
      [0, 53], [54, 100], [101, 360], [361, 649], [650, 1249], [1250, 2049]
    ], [0, 50, 100, 150, 200, 300, 500]);

    const o3AQI = this.calculateSubIndex(measurement.o3, [
      [0, 54], [55, 70], [71, 85], [86, 105], [106, 200], [201, 504]
    ], [0, 50, 100, 150, 200, 300, 500]);

    // Return maximum sub-index
    return Math.max(pm25AQI, pm10AQI, no2AQI, o3AQI);
  }

  /**
   * Calculate sub-index for a pollutant
   */
  private calculateSubIndex(
    concentration: number,
    breakpoints: number[][],
    indexBreakpoints: number[]
  ): number {
    for (let i = 0; i < breakpoints.length; i++) {
      const [bpLo, bpHi] = breakpoints[i];
      if (concentration >= bpLo && concentration <= bpHi) {
        const iLo = indexBreakpoints[i];
        const iHi = indexBreakpoints[i + 1];
        return Math.round(
          ((iHi - iLo) / (bpHi - bpLo)) * (concentration - bpLo) + iLo
        );
      }
    }
    return 500; // Maximum AQI
  }

  /**
   * Categorize AQI value
   */
  private categorizeAQI(aqi: number): AirQualityCategory {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_for_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  /**
   * Predict air quality for next 24 hours
   */
  async predictAirQuality(hours: number = 24): Promise<Map<string, AirQualityPrediction[]>> {
    console.log(`Predicting air quality for next ${hours} hours`);

    const predictions = new Map<string, AirQualityPrediction[]>();

    for (const sensor of this.network.airQualitySensors) {
      const history = this.measurements.get(sensor.sensorId);

      if (!history || history.length < 48) {
        console.warn(`Insufficient data for sensor ${sensor.sensorId}`);
        continue;
      }

      // Prepare features for prediction
      const features = this.extractFeatures(history);
      const targets = history.map(m => m.aqi);

      // Train model if not already trained
      if (!this.predictionModels.has(`aqi_${sensor.sensorId}`)) {
        await this.trainPredictionModel(sensor.sensorId, features, targets);
      }

      // Generate predictions
      const sensorPredictions: AirQualityPrediction[] = [];
      const model = this.predictionModels.get(`aqi_${sensor.sensorId}`);

      for (let h = 1; h <= hours; h++) {
        const futureFeatures = this.generateFutureFeatures(sensor, h);
        const X = numpy.array([futureFeatures]);
        const prediction = model.predict(X)[0];

        sensorPredictions.push({
          timestamp: new Date(Date.now() + h * 3600000),
          predictedAQI: Math.round(prediction),
          category: this.categorizeAQI(prediction),
          confidence: this.calculatePredictionConfidence(h),
          pollutants: this.predictPollutantLevels(sensor, h)
        });
      }

      predictions.set(sensor.sensorId, sensorPredictions);
    }

    return predictions;
  }

  /**
   * Extract features from historical measurements
   */
  private extractFeatures(measurements: AirQualityMeasurement[]): number[][] {
    return measurements.map(m => [
      m.pm25,
      m.pm10,
      m.no2,
      m.so2,
      m.co,
      m.o3,
      m.temperature,
      m.humidity,
      m.pressure,
      m.timestamp.getHours(), // Hour of day
      m.timestamp.getDay(),   // Day of week
      Math.sin(2 * Math.PI * m.timestamp.getHours() / 24), // Cyclical hour
      Math.cos(2 * Math.PI * m.timestamp.getHours() / 24)
    ]);
  }

  /**
   * Train prediction model for a sensor
   */
  private async trainPredictionModel(
    sensorId: string,
    features: number[][],
    targets: number[]
  ): Promise<void> {
    const X = numpy.array(features);
    const y = numpy.array(targets);

    const model = this.predictionModels.get('aqi');
    model.fit(X, y);

    this.predictionModels.set(`aqi_${sensorId}`, model);
    console.log(`Trained model for sensor ${sensorId}`);
  }

  /**
   * Generate future features for prediction
   */
  private generateFutureFeatures(sensor: AirQualitySensor, hoursAhead: number): number[] {
    const futureTime = new Date(Date.now() + hoursAhead * 3600000);
    const current = sensor.measurements;

    // Use current values as base with some decay
    const decay = Math.exp(-hoursAhead / 24);

    return [
      current.pm25 * decay,
      current.pm10 * decay,
      current.no2 * decay,
      current.so2 * decay,
      current.co * decay,
      current.o3 * decay,
      current.temperature + Math.random() * 5 - 2.5, // Temperature variation
      current.humidity + Math.random() * 10 - 5,     // Humidity variation
      current.pressure,
      futureTime.getHours(),
      futureTime.getDay(),
      Math.sin(2 * Math.PI * futureTime.getHours() / 24),
      Math.cos(2 * Math.PI * futureTime.getHours() / 24)
    ];
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(hoursAhead: number): number {
    // Confidence decreases with prediction horizon
    const baseConfidence = 0.95;
    const decayRate = 0.03;
    return Math.max(0.5, baseConfidence * Math.exp(-decayRate * hoursAhead));
  }

  /**
   * Predict individual pollutant levels
   */
  private predictPollutantLevels(
    sensor: AirQualitySensor,
    hoursAhead: number
  ): PollutantPrediction {
    const current = sensor.measurements;
    const decay = Math.exp(-hoursAhead / 24);
    const variation = 1 + (Math.random() - 0.5) * 0.2;

    return {
      pm25: current.pm25 * decay * variation,
      pm10: current.pm10 * decay * variation,
      no2: current.no2 * decay * variation,
      so2: current.so2 * decay * variation,
      co: current.co * decay * variation,
      o3: current.o3 * decay * variation
    };
  }

  /**
   * Detect air quality anomalies
   */
  async detectAnomalies(): Promise<AirQualityAnomaly[]> {
    console.log('Detecting air quality anomalies...');

    const anomalies: AirQualityAnomaly[] = [];

    // Prepare data for anomaly detection
    const allMeasurements: number[][] = [];
    const sensorIds: string[] = [];
    const timestamps: Date[] = [];

    for (const sensor of this.network.airQualitySensors) {
      const history = this.measurements.get(sensor.sensorId);
      if (!history) continue;

      for (const measurement of history.slice(-100)) { // Last 100 readings
        allMeasurements.push([
          measurement.pm25,
          measurement.pm10,
          measurement.no2,
          measurement.aqi,
          measurement.temperature,
          measurement.humidity
        ]);
        sensorIds.push(sensor.sensorId);
        timestamps.push(measurement.timestamp);
      }
    }

    if (allMeasurements.length === 0) {
      return anomalies;
    }

    // Use Isolation Forest for anomaly detection
    const IsolationForest = sklearn.ensemble.IsolationForest;
    const detector = new IsolationForest({
      contamination: 0.05,
      random_state: 42
    });

    const X = numpy.array(allMeasurements);
    const predictions = detector.fit_predict(X);

    // Extract anomalies
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === -1) {
        const sensor = this.network.airQualitySensors.find(
          s => s.sensorId === sensorIds[i]
        );

        if (sensor) {
          anomalies.push({
            sensorId: sensorIds[i],
            location: sensor.location,
            timestamp: timestamps[i],
            type: this.classifyAnomalyType(allMeasurements[i]),
            severity: this.calculateAnomalySeverity(allMeasurements[i]),
            values: {
              pm25: allMeasurements[i][0],
              pm10: allMeasurements[i][1],
              no2: allMeasurements[i][2],
              aqi: allMeasurements[i][3]
            },
            confidence: 0.85
          });
        }
      }
    }

    console.log(`Detected ${anomalies.length} air quality anomalies`);
    return anomalies;
  }

  /**
   * Classify anomaly type
   */
  private classifyAnomalyType(values: number[]): AnomalyType {
    const [pm25, pm10, no2, aqi] = values;

    if (pm25 > 150) return 'pm_spike';
    if (no2 > 200) return 'no2_spike';
    if (aqi > 200) return 'hazardous_air';
    if (pm25 < 5 && pm10 < 10) return 'sensor_fault';

    return 'unusual_pattern';
  }

  /**
   * Calculate anomaly severity
   */
  private calculateAnomalySeverity(values: number[]): AlertSeverity {
    const [pm25, pm10, no2, aqi] = values;

    if (aqi > 300 || pm25 > 250) return 'critical';
    if (aqi > 200 || pm25 > 150) return 'warning';
    if (aqi > 150 || pm25 > 100) return 'advisory';

    return 'info';
  }

  /**
   * Generate air quality alerts
   */
  async generateAlerts(): Promise<AirQualityAlert[]> {
    const newAlerts: AirQualityAlert[] = [];

    const measurements = await this.collectMeasurements();

    for (const [sensorId, measurement] of measurements.entries()) {
      const sensor = this.network.airQualitySensors.find(s => s.sensorId === sensorId);
      if (!sensor) continue;

      // Check for unhealthy air quality
      if (measurement.category !== 'good' && measurement.category !== 'moderate') {
        newAlerts.push({
          alertId: `alert-${Date.now()}-${sensorId}`,
          sensorId,
          location: sensor.location,
          timestamp: new Date(),
          category: measurement.category,
          aqi: measurement.aqi,
          severity: this.aqiCategoryToSeverity(measurement.category),
          message: this.generateAlertMessage(measurement),
          recommendations: this.generateRecommendations(measurement),
          affectedArea: this.estimateAffectedArea(sensor.location),
          estimatedPopulation: this.estimateAffectedPopulation(sensor.location)
        });
      }

      // Check for rapid deterioration
      const recentHistory = this.measurements.get(sensorId)?.slice(-6) || [];
      if (recentHistory.length >= 6) {
        const trend = this.calculateTrend(recentHistory.map(m => m.aqi));
        if (trend > 20) { // AQI increasing by >20 per hour
          newAlerts.push({
            alertId: `alert-trend-${Date.now()}-${sensorId}`,
            sensorId,
            location: sensor.location,
            timestamp: new Date(),
            category: measurement.category,
            aqi: measurement.aqi,
            severity: 'warning',
            message: `Rapid air quality deterioration detected. AQI increasing at ${trend.toFixed(1)} per hour.`,
            recommendations: [
              'Monitor air quality closely',
              'Prepare for potential outdoor activity restrictions',
              'Alert sensitive groups'
            ],
            affectedArea: this.estimateAffectedArea(sensor.location),
            estimatedPopulation: this.estimateAffectedPopulation(sensor.location)
          });
        }
      }
    }

    // Store new alerts
    this.alerts.push(...newAlerts);

    // Keep alerts from last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600000;
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > sevenDaysAgo);

    return newAlerts;
  }

  /**
   * Convert AQI category to alert severity
   */
  private aqiCategoryToSeverity(category: AirQualityCategory): AlertSeverity {
    const mapping: Record<AirQualityCategory, AlertSeverity> = {
      'good': 'info',
      'moderate': 'info',
      'unhealthy_for_sensitive': 'advisory',
      'unhealthy': 'warning',
      'very_unhealthy': 'warning',
      'hazardous': 'critical'
    };
    return mapping[category];
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(measurement: AirQualityMeasurement): string {
    const category = measurement.category;
    const aqi = measurement.aqi;

    const messages: Record<AirQualityCategory, string> = {
      'good': `Air quality is satisfactory (AQI: ${aqi})`,
      'moderate': `Air quality is acceptable (AQI: ${aqi})`,
      'unhealthy_for_sensitive': `Sensitive groups should limit outdoor exposure (AQI: ${aqi})`,
      'unhealthy': `Everyone should limit prolonged outdoor exertion (AQI: ${aqi})`,
      'very_unhealthy': `Health alert: everyone may experience health effects (AQI: ${aqi})`,
      'hazardous': `Health warning: emergency conditions (AQI: ${aqi})`
    };

    return messages[category];
  }

  /**
   * Generate health recommendations
   */
  private generateRecommendations(measurement: AirQualityMeasurement): string[] {
    const recommendations: string[] = [];
    const category = measurement.category;

    if (category === 'unhealthy_for_sensitive' || category === 'unhealthy') {
      recommendations.push('Reduce prolonged or heavy outdoor exertion');
      recommendations.push('Sensitive groups should stay indoors');
      recommendations.push('Keep windows and doors closed');
      recommendations.push('Use air purifiers if available');
    }

    if (category === 'very_unhealthy' || category === 'hazardous') {
      recommendations.push('Avoid all outdoor activities');
      recommendations.push('Keep windows and doors closed');
      recommendations.push('Run air purifiers on high');
      recommendations.push('Wear N95 masks if you must go outside');
      recommendations.push('Seek medical attention if experiencing symptoms');
    }

    if (measurement.pm25 > 100) {
      recommendations.push('PM2.5 levels are elevated - especially harmful to respiratory health');
    }

    if (measurement.o3 > 100) {
      recommendations.push('Ozone levels are elevated - avoid outdoor exercise');
    }

    return recommendations;
  }

  /**
   * Calculate trend in measurements
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    // Linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }

  /**
   * Estimate affected area (km²)
   */
  private estimateAffectedArea(location: GeoCoordinates): number {
    // Simple assumption: 2km radius circle
    const radius = 2; // km
    return Math.PI * radius * radius;
  }

  /**
   * Estimate affected population
   */
  private estimateAffectedPopulation(location: GeoCoordinates): number {
    // Simplified: assume urban density of 2000 people/km²
    const area = this.estimateAffectedArea(location);
    const density = 2000;
    return Math.round(area * density);
  }

  /**
   * Analyze pollution sources
   */
  async analyzePollutionSources(): Promise<PollutionSourceAnalysis[]> {
    console.log('Analyzing pollution sources...');

    const analyses: PollutionSourceAnalysis[] = [];

    // Cluster sensors by pollution levels
    const features: number[][] = [];
    const sensorData: Array<{ sensor: AirQualitySensor; measurement: AirQualityMeasurement }> = [];

    for (const sensor of this.network.airQualitySensors) {
      const history = this.measurements.get(sensor.sensorId);
      if (!history || history.length === 0) continue;

      const recent = history[history.length - 1];
      features.push([
        sensor.location.latitude,
        sensor.location.longitude,
        recent.pm25,
        recent.no2,
        recent.aqi
      ]);
      sensorData.push({ sensor, measurement: recent });
    }

    if (features.length < 3) {
      return analyses;
    }

    // Use K-means clustering
    const KMeans = sklearn.cluster.KMeans;
    const kmeans = new KMeans({
      n_clusters: Math.min(5, Math.floor(features.length / 3)),
      random_state: 42
    });

    const X = numpy.array(features);
    const labels = kmeans.fit_predict(X);

    // Analyze each cluster
    const clusters = new Map<number, typeof sensorData>();
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      if (!clusters.has(label)) {
        clusters.set(label, []);
      }
      clusters.get(label)!.push(sensorData[i]);
    }

    for (const [clusterId, clusterSensors] of clusters.entries()) {
      const avgPM25 = clusterSensors.reduce((sum, s) => sum + s.measurement.pm25, 0) / clusterSensors.length;
      const avgNO2 = clusterSensors.reduce((sum, s) => sum + s.measurement.no2, 0) / clusterSensors.length;
      const avgAQI = clusterSensors.reduce((sum, s) => sum + s.measurement.aqi, 0) / clusterSensors.length;

      // Determine likely source type
      const sourceType = this.identifySourceType(avgPM25, avgNO2, avgAQI);

      // Calculate center of cluster
      const centerLat = clusterSensors.reduce((sum, s) => sum + s.sensor.location.latitude, 0) / clusterSensors.length;
      const centerLon = clusterSensors.reduce((sum, s) => sum + s.sensor.location.longitude, 0) / clusterSensors.length;

      analyses.push({
        clusterId,
        location: { latitude: centerLat, longitude: centerLon },
        sourceType,
        pollution Level: avgAQI,
        affectedSensors: clusterSensors.map(s => s.sensor.sensorId),
        dominantPollutants: this.identifyDominantPollutants(
          avgPM25,
          avgNO2,
          clusterSensors[0].measurement
        ),
        confidence: 0.7,
        recommendations: this.generateSourceRecommendations(sourceType)
      });
    }

    return analyses;
  }

  /**
   * Identify pollution source type
   */
  private identifySourceType(pm25: number, no2: number, aqi: number): SourceType {
    if (no2 > 80 && pm25 > 50) return 'traffic';
    if (pm25 > 100) return 'industrial';
    if (no2 > 100) return 'vehicular';
    if (pm25 < 20 && no2 < 30) return 'background';
    return 'mixed';
  }

  /**
   * Identify dominant pollutants
   */
  private identifyDominantPollutants(
    pm25: number,
    no2: number,
    measurement: AirQualityMeasurement
  ): string[] {
    const pollutants: string[] = [];

    if (pm25 > 35) pollutants.push('PM2.5');
    if (measurement.pm10 > 150) pollutants.push('PM10');
    if (no2 > 100) pollutants.push('NO2');
    if (measurement.o3 > 70) pollutants.push('O3');
    if (measurement.so2 > 35) pollutants.push('SO2');

    return pollutants.length > 0 ? pollutants : ['Multiple'];
  }

  /**
   * Generate source-specific recommendations
   */
  private generateSourceRecommendations(sourceType: SourceType): string[] {
    const recommendations: Record<SourceType, string[]> = {
      'traffic': [
        'Implement traffic reduction measures',
        'Promote public transportation',
        'Create low-emission zones',
        'Encourage electric vehicle adoption'
      ],
      'industrial': [
        'Inspect industrial facilities for compliance',
        'Require emission control upgrades',
        'Enforce stricter emission standards',
        'Monitor facility operations'
      ],
      'vehicular': [
        'Increase vehicle emission testing',
        'Restrict high-emission vehicles',
        'Improve traffic flow',
        'Add green barriers'
      ],
      'mixed': [
        'Conduct detailed source apportionment study',
        'Implement multi-pronged pollution control',
        'Increase monitoring density',
        'Engage multiple stakeholders'
      ],
      'background': [
        'Maintain current air quality',
        'Continue monitoring',
        'Prevent new pollution sources'
      ]
    };

    return recommendations[sourceType];
  }

  /**
   * Generate comprehensive air quality report
   */
  generateReport(): AirQualityReport {
    const allMeasurements = Array.from(this.measurements.values()).flat();

    if (allMeasurements.length === 0) {
      return this.createEmptyReport();
    }

    // Calculate statistics
    const currentAQIs = this.network.airQualitySensors
      .filter(s => s.measurements)
      .map(s => s.measurements.aqi);

    const avgAQI = currentAQIs.reduce((a, b) => a + b, 0) / currentAQIs.length;
    const maxAQI = Math.max(...currentAQIs);
    const minAQI = Math.min(...currentAQIs);

    // Calculate compliance rate
    const compliantSensors = this.network.airQualitySensors.filter(
      s => s.measurements && s.measurements.aqi <= 100
    ).length;
    const complianceRate = (compliantSensors / this.network.airQualitySensors.length) * 100;

    // Find worst locations
    const worstLocations = this.network.airQualitySensors
      .filter(s => s.measurements)
      .sort((a, b) => b.measurements.aqi - a.measurements.aqi)
      .slice(0, 5)
      .map(s => ({
        sensorId: s.sensorId,
        location: s.location,
        aqi: s.measurements.aqi,
        category: s.measurements.category
      }));

    // Calculate trends
    const weeklyTrend = this.calculateWeeklyTrend();

    return {
      timestamp: new Date(),
      summary: {
        totalSensors: this.network.airQualitySensors.length,
        activeSensors: this.network.airQualitySensors.filter(s => s.status === 'active').length,
        averageAQI: Math.round(avgAQI),
        maxAQI: Math.round(maxAQI),
        minAQI: Math.round(minAQI),
        complianceRate
      },
      worstLocations,
      alerts: this.alerts.slice(-10),
      trends: {
        weekly: weeklyTrend,
        improving: weeklyTrend < -5,
        deteriorating: weeklyTrend > 5
      },
      recommendations: this.generateSystemRecommendations(avgAQI)
    };
  }

  /**
   * Create empty report
   */
  private createEmptyReport(): AirQualityReport {
    return {
      timestamp: new Date(),
      summary: {
        totalSensors: this.network.airQualitySensors.length,
        activeSensors: 0,
        averageAQI: 0,
        maxAQI: 0,
        minAQI: 0,
        complianceRate: 0
      },
      worstLocations: [],
      alerts: [],
      trends: {
        weekly: 0,
        improving: false,
        deteriorating: false
      },
      recommendations: ['Insufficient data for analysis']
    };
  }

  /**
   * Calculate weekly trend
   */
  private calculateWeeklyTrend(): number {
    const allHistory = Array.from(this.measurements.values()).flat();
    const weekAgo = Date.now() - 7 * 24 * 3600000;

    const recentReadings = allHistory.filter(m => m.timestamp.getTime() > weekAgo);
    const oldReadings = allHistory.filter(m => m.timestamp.getTime() <= weekAgo);

    if (recentReadings.length === 0 || oldReadings.length === 0) return 0;

    const recentAvg = recentReadings.reduce((sum, m) => sum + m.aqi, 0) / recentReadings.length;
    const oldAvg = oldReadings.reduce((sum, m) => sum + m.aqi, 0) / oldReadings.length;

    return recentAvg - oldAvg;
  }

  /**
   * Generate system-wide recommendations
   */
  private generateSystemRecommendations(avgAQI: number): string[] {
    const recommendations: string[] = [];

    if (avgAQI > 150) {
      recommendations.push('URGENT: City-wide air quality alert - implement emergency measures');
      recommendations.push('Restrict industrial operations');
      recommendations.push('Limit vehicular traffic');
      recommendations.push('Issue public health advisory');
    } else if (avgAQI > 100) {
      recommendations.push('Activate pollution control measures');
      recommendations.push('Increase public awareness campaigns');
      recommendations.push('Monitor sensitive areas closely');
    } else {
      recommendations.push('Maintain current monitoring frequency');
      recommendations.push('Continue preventive measures');
    }

    // Check sensor health
    const inactiveSensors = this.network.airQualitySensors.filter(
      s => s.status !== 'active'
    ).length;

    if (inactiveSensors > 0) {
      recommendations.push(`${inactiveSensors} sensors require maintenance`);
    }

    return recommendations;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface AirQualityPrediction {
  timestamp: Date;
  predictedAQI: number;
  category: AirQualityCategory;
  confidence: number;
  pollutants: PollutantPrediction;
}

interface PollutantPrediction {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

interface AirQualityAnomaly {
  sensorId: string;
  location: GeoCoordinates;
  timestamp: Date;
  type: AnomalyType;
  severity: AlertSeverity;
  values: {
    pm25: number;
    pm10: number;
    no2: number;
    aqi: number;
  };
  confidence: number;
}

type AnomalyType = 'pm_spike' | 'no2_spike' | 'hazardous_air' | 'sensor_fault' | 'unusual_pattern';

interface AirQualityAlert {
  alertId: string;
  sensorId: string;
  location: GeoCoordinates;
  timestamp: Date;
  category: AirQualityCategory;
  aqi: number;
  severity: AlertSeverity;
  message: string;
  recommendations: string[];
  affectedArea: number; // km²
  estimatedPopulation: number;
}

interface PollutionSourceAnalysis {
  clusterId: number;
  location: GeoCoordinates;
  sourceType: SourceType;
  pollutionLevel: number;
  affectedSensors: string[];
  dominantPollutants: string[];
  confidence: number;
  recommendations: string[];
}

type SourceType = 'traffic' | 'industrial' | 'vehicular' | 'mixed' | 'background';

interface AirQualityReport {
  timestamp: Date;
  summary: {
    totalSensors: number;
    activeSensors: number;
    averageAQI: number;
    maxAQI: number;
    minAQI: number;
    complianceRate: number;
  };
  worstLocations: Array<{
    sensorId: string;
    location: GeoCoordinates;
    aqi: number;
    category: AirQualityCategory;
  }>;
  alerts: AirQualityAlert[];
  trends: {
    weekly: number;
    improving: boolean;
    deteriorating: boolean;
  };
  recommendations: string[];
}
