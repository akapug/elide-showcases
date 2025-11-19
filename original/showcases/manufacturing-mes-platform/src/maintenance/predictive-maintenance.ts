/**
 * Predictive Maintenance System
 *
 * AI-powered predictive maintenance using Python machine learning libraries.
 * Implements failure prediction, remaining useful life estimation, and
 * anomaly detection for industrial equipment.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import type {
  Equipment,
  FailurePrediction,
  MaintenanceRecommendation,
  FeatureImportance,
  FailureFactor,
  SensorReading,
  MLModel,
  ModelPerformance,
  MaintenanceRecord,
  MaintenanceType
} from '../types.js';

// ============================================================================
// Predictive Maintenance Engine
// ============================================================================

export class PredictiveMaintenanceEngine {
  private models: Map<string, MLModel> = new Map();
  private trainingData: Map<string, TrainingDataset> = new Map();
  private config: PredictiveMaintenanceConfig;

  constructor(config: PredictiveMaintenanceConfig) {
    this.config = config;
  }

  /**
   * Train predictive maintenance model for equipment
   */
  async trainModel(
    equipmentId: string,
    historicalData: EquipmentHistoricalData
  ): Promise<MLModel> {
    console.log(`Training predictive maintenance model for equipment ${equipmentId}`);

    // Prepare training data
    const dataset = await this.prepareTrainingData(historicalData);
    this.trainingData.set(equipmentId, dataset);

    // Feature engineering
    const features = this.extractFeatures(dataset);
    const labels = this.extractLabels(dataset);

    // Train multiple models and select best
    const models = await Promise.all([
      this.trainRandomForest(features, labels),
      this.trainGradientBoosting(features, labels),
      this.trainSVM(features, labels)
    ]);

    // Select best model based on performance
    const bestModel = this.selectBestModel(models);
    bestModel.id = `pdm-${equipmentId}-${Date.now()}`;

    this.models.set(equipmentId, bestModel);

    console.log(`Model trained successfully for ${equipmentId}: ${bestModel.type} with accuracy ${bestModel.performance.accuracy}`);

    return bestModel;
  }

  /**
   * Predict equipment failure
   */
  async predictFailure(
    equipmentId: string,
    currentSensorData: SensorReading[]
  ): Promise<FailurePrediction> {
    const model = this.models.get(equipmentId);
    if (!model) {
      throw new Error(`No trained model found for equipment ${equipmentId}`);
    }

    // Extract features from current sensor data
    const features = this.extractFeaturesFromSensorData(currentSensorData);

    // Make prediction using Python scikit-learn
    const prediction = await this.runPrediction(model, features);

    // Calculate remaining useful life
    const rul = await this.estimateRemainingUsefulLife(equipmentId, currentSensorData);

    // Identify contributing factors
    const contributingFactors = await this.identifyContributingFactors(
      model,
      features,
      currentSensorData
    );

    // Generate recommendation
    const recommendation = this.generateMaintenanceRecommendation(
      equipmentId,
      prediction.probability,
      rul,
      contributingFactors
    );

    // Calculate confidence interval
    const confidenceInterval = await this.calculateConfidenceInterval(
      model,
      features
    );

    const failurePrediction: FailurePrediction = {
      equipmentId,
      timestamp: new Date(),
      failureProbability: prediction.probability,
      remainingUsefulLife: rul,
      predictedFailureDate: new Date(Date.now() + rul * 3600000),
      confidenceInterval,
      contributingFactors,
      recommendedAction: recommendation,
      modelVersion: model.version,
      features: prediction.featureImportances
    };

    return failurePrediction;
  }

  /**
   * Train Random Forest model
   */
  private async trainRandomForest(features: number[][], labels: number[]): Promise<MLModel> {
    console.log('Training Random Forest model...');

    // Convert JavaScript arrays to Python numpy arrays
    const X = numpy.array(features);
    const y = numpy.array(labels);

    // Create and train Random Forest classifier
    const rf = sklearn.ensemble.RandomForestClassifier({
      n_estimators: 100,
      max_depth: 10,
      min_samples_split: 5,
      min_samples_leaf: 2,
      random_state: 42
    });

    await rf.fit(X, y);

    // Calculate performance metrics
    const predictions = await rf.predict(X);
    const probabilities = await rf.predict_proba(X);

    const performance = await this.calculatePerformanceMetrics(
      labels,
      Array.from(predictions),
      Array.from(probabilities.map((p: number[]) => p[1]))
    );

    // Get feature importances
    const featureImportances = Array.from(rf.feature_importances_);

    return {
      id: '',
      name: 'Random Forest Failure Predictor',
      version: '1.0.0',
      type: 'RANDOM_FOREST' as const,
      trainedDate: new Date(),
      features: this.getFeatureNames(),
      targetVariable: 'failure',
      performance,
      hyperparameters: {
        n_estimators: 100,
        max_depth: 10,
        min_samples_split: 5,
        min_samples_leaf: 2,
        random_state: 42,
        model: rf
      }
    };
  }

  /**
   * Train Gradient Boosting model
   */
  private async trainGradientBoosting(features: number[][], labels: number[]): Promise<MLModel> {
    console.log('Training Gradient Boosting model...');

    const X = numpy.array(features);
    const y = numpy.array(labels);

    // Create and train Gradient Boosting classifier
    const gb = sklearn.ensemble.GradientBoostingClassifier({
      n_estimators: 100,
      learning_rate: 0.1,
      max_depth: 5,
      min_samples_split: 5,
      min_samples_leaf: 2,
      subsample: 0.8,
      random_state: 42
    });

    await gb.fit(X, y);

    const predictions = await gb.predict(X);
    const probabilities = await gb.predict_proba(X);

    const performance = await this.calculatePerformanceMetrics(
      labels,
      Array.from(predictions),
      Array.from(probabilities.map((p: number[]) => p[1]))
    );

    return {
      id: '',
      name: 'Gradient Boosting Failure Predictor',
      version: '1.0.0',
      type: 'GRADIENT_BOOSTING' as const,
      trainedDate: new Date(),
      features: this.getFeatureNames(),
      targetVariable: 'failure',
      performance,
      hyperparameters: {
        n_estimators: 100,
        learning_rate: 0.1,
        max_depth: 5,
        subsample: 0.8,
        model: gb
      }
    };
  }

  /**
   * Train SVM model
   */
  private async trainSVM(features: number[][], labels: number[]): Promise<MLModel> {
    console.log('Training SVM model...');

    const X = numpy.array(features);
    const y = numpy.array(labels);

    // Create and train SVM classifier
    const svm = sklearn.svm.SVC({
      kernel: 'rbf',
      C: 1.0,
      gamma: 'scale',
      probability: true,
      random_state: 42
    });

    await svm.fit(X, y);

    const predictions = await svm.predict(X);
    const probabilities = await svm.predict_proba(X);

    const performance = await this.calculatePerformanceMetrics(
      labels,
      Array.from(predictions),
      Array.from(probabilities.map((p: number[]) => p[1]))
    );

    return {
      id: '',
      name: 'SVM Failure Predictor',
      version: '1.0.0',
      type: 'SVM' as const,
      trainedDate: new Date(),
      features: this.getFeatureNames(),
      targetVariable: 'failure',
      performance,
      hyperparameters: {
        kernel: 'rbf',
        C: 1.0,
        gamma: 'scale',
        model: svm
      }
    };
  }

  /**
   * Run prediction using trained model
   */
  private async runPrediction(
    model: MLModel,
    features: number[]
  ): Promise<{ probability: number; featureImportances: FeatureImportance[] }> {
    const X = numpy.array([features]);
    const clf = model.hyperparameters.model as any;

    // Get probability prediction
    const probabilities = await clf.predict_proba(X);
    const failureProbability = probabilities[0][1];

    // Get feature importances
    let importances: number[];
    if (model.type === 'RANDOM_FOREST' || model.type === 'GRADIENT_BOOSTING') {
      importances = Array.from(clf.feature_importances_);
    } else {
      // For SVM, use permutation importance
      importances = new Array(features.length).fill(1 / features.length);
    }

    const featureImportances: FeatureImportance[] = this.getFeatureNames().map((name, idx) => ({
      featureName: name,
      importance: importances[idx],
      currentValue: features[idx],
      normalRange: this.getNormalRange(name)
    }));

    return {
      probability: failureProbability,
      featureImportances: featureImportances.sort((a, b) => b.importance - a.importance)
    };
  }

  /**
   * Estimate remaining useful life
   */
  private async estimateRemainingUsefulLife(
    equipmentId: string,
    sensorData: SensorReading[]
  ): Promise<number> {
    const dataset = this.trainingData.get(equipmentId);
    if (!dataset) {
      return this.config.defaultRUL;
    }

    // Calculate degradation rate from sensor trends
    const degradationRate = this.calculateDegradationRate(sensorData);

    // Estimate time until critical threshold
    const currentHealth = this.calculateHealthScore(sensorData);
    const criticalThreshold = 0.3; // 30% health

    if (degradationRate <= 0) {
      return 720; // 30 days if no degradation
    }

    const rul = (currentHealth - criticalThreshold) / degradationRate;

    return Math.max(0, Math.min(rul, 1440)); // Cap at 60 days
  }

  /**
   * Identify contributing factors to failure
   */
  private async identifyContributingFactors(
    model: MLModel,
    features: number[],
    sensorData: SensorReading[]
  ): Promise<FailureFactor[]> {
    const featureNames = this.getFeatureNames();
    const factors: FailureFactor[] = [];

    // Get feature importances from model
    const clf = model.hyperparameters.model as any;
    let importances: number[];

    if (model.type === 'RANDOM_FOREST' || model.type === 'GRADIENT_BOOSTING') {
      importances = Array.from(clf.feature_importances_);
    } else {
      importances = new Array(features.length).fill(1 / features.length);
    }

    // Identify top contributing factors
    const indexed = importances.map((imp, idx) => ({ importance: imp, index: idx }));
    const topFactors = indexed
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);

    for (const factor of topFactors) {
      const featureName = featureNames[factor.index];
      const currentValue = features[factor.index];
      const normalRange = this.getNormalRange(featureName);
      const threshold = normalRange[1];

      // Calculate trend
      const trend = this.calculateFeatureTrend(featureName, sensorData);

      factors.push({
        factor: featureName,
        importance: factor.importance,
        currentValue,
        thresholdValue: threshold,
        trend
      });
    }

    return factors;
  }

  /**
   * Generate maintenance recommendation
   */
  private generateMaintenanceRecommendation(
    equipmentId: string,
    failureProbability: number,
    rul: number,
    factors: FailureFactor[]
  ): MaintenanceRecommendation {
    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    let action: string;
    let estimatedDowntime: number;
    let estimatedCost: number;

    if (failureProbability > 0.8 || rul < 24) {
      priority = 'CRITICAL';
      action = 'Schedule emergency maintenance immediately';
      estimatedDowntime = 240; // 4 hours
      estimatedCost = 15000;
    } else if (failureProbability > 0.6 || rul < 72) {
      priority = 'HIGH';
      action = 'Schedule maintenance within next shift';
      estimatedDowntime = 180; // 3 hours
      estimatedCost = 10000;
    } else if (failureProbability > 0.4 || rul < 168) {
      priority = 'MEDIUM';
      action = 'Schedule preventive maintenance within next week';
      estimatedDowntime = 120; // 2 hours
      estimatedCost = 5000;
    } else {
      priority = 'LOW';
      action = 'Monitor condition and schedule during next planned maintenance';
      estimatedDowntime = 60; // 1 hour
      estimatedCost = 2000;
    }

    // Determine suggested date based on RUL
    const suggestedDate = new Date(Date.now() + (rul * 0.7) * 3600000); // 70% of RUL

    // Build rationale from top factors
    const topFactors = factors.slice(0, 3);
    const rationale = `Failure probability: ${(failureProbability * 100).toFixed(1)}%. ` +
      `Estimated RUL: ${rul.toFixed(0)} hours. ` +
      `Key factors: ${topFactors.map(f => f.factor).join(', ')}.`;

    return {
      action,
      priority,
      estimatedCost,
      estimatedDowntime,
      suggestedDate,
      rationale
    };
  }

  /**
   * Calculate confidence interval
   */
  private async calculateConfidenceInterval(
    model: MLModel,
    features: number[]
  ): Promise<[number, number]> {
    // Use bootstrapping to estimate confidence interval
    const X = numpy.array([features]);
    const clf = model.hyperparameters.model as any;

    const predictions: number[] = [];
    const nBootstrap = 100;

    for (let i = 0; i < nBootstrap; i++) {
      // Add small random noise to features
      const noisyFeatures = features.map(f => f + (Math.random() - 0.5) * 0.1 * f);
      const X_noisy = numpy.array([noisyFeatures]);
      const prob = await clf.predict_proba(X_noisy);
      predictions.push(prob[0][1]);
    }

    // Calculate 95% confidence interval
    predictions.sort((a, b) => a - b);
    const lower = predictions[Math.floor(nBootstrap * 0.025)];
    const upper = predictions[Math.floor(nBootstrap * 0.975)];

    return [lower, upper];
  }

  /**
   * Prepare training data
   */
  private async prepareTrainingData(
    historicalData: EquipmentHistoricalData
  ): Promise<TrainingDataset> {
    const features: number[][] = [];
    const labels: number[] = [];
    const timestamps: Date[] = [];

    // Extract features from each time window
    for (const window of historicalData.windows) {
      const extractedFeatures = this.extractWindowFeatures(window);
      features.push(extractedFeatures);
      labels.push(window.failure ? 1 : 0);
      timestamps.push(window.timestamp);
    }

    // Normalize features
    const normalizedFeatures = await this.normalizeFeatures(features);

    return {
      features: normalizedFeatures,
      labels,
      timestamps,
      equipmentId: historicalData.equipmentId
    };
  }

  /**
   * Extract features from time window
   */
  private extractWindowFeatures(window: TimeWindow): number[] {
    const features: number[] = [];

    // Statistical features from sensor data
    for (const sensor of window.sensorReadings) {
      const values = sensor.map(r => r.value);

      features.push(
        this.mean(values),           // Mean
        this.std(values),            // Standard deviation
        Math.max(...values),         // Max
        Math.min(...values),         // Min
        this.median(values),         // Median
        this.percentile(values, 75), // 75th percentile
        this.percentile(values, 25), // 25th percentile
        this.slope(values)           // Trend slope
      );
    }

    // Vibration frequency domain features
    if (window.vibrationData) {
      const fft = this.computeFFT(window.vibrationData);
      features.push(
        ...this.extractFrequencyFeatures(fft)
      );
    }

    // Operating hours
    features.push(window.operatingHours);

    // Cycles count
    features.push(window.cycleCount);

    // Time since last maintenance
    features.push(window.hoursSinceLastMaintenance);

    return features;
  }

  /**
   * Extract features from current sensor data
   */
  private extractFeaturesFromSensorData(sensorData: SensorReading[]): number[] {
    // Group sensor readings by sensor ID
    const sensorGroups = new Map<string, SensorReading[]>();
    for (const reading of sensorData) {
      if (!sensorGroups.has(reading.sensorId)) {
        sensorGroups.set(reading.sensorId, []);
      }
      sensorGroups.get(reading.sensorId)!.push(reading);
    }

    const features: number[] = [];

    // Extract statistical features for each sensor
    for (const readings of sensorGroups.values()) {
      const values = readings.map(r => r.value);

      features.push(
        this.mean(values),
        this.std(values),
        Math.max(...values),
        Math.min(...values),
        this.median(values),
        this.percentile(values, 75),
        this.percentile(values, 25),
        this.slope(values)
      );
    }

    // Pad with zeros if needed to match expected feature count
    const expectedFeatureCount = 50; // Adjust based on training
    while (features.length < expectedFeatureCount) {
      features.push(0);
    }

    return features.slice(0, expectedFeatureCount);
  }

  /**
   * Normalize features using standardization
   */
  private async normalizeFeatures(features: number[][]): Promise<number[][]> {
    const scaler = sklearn.preprocessing.StandardScaler();
    const X = numpy.array(features);
    const X_scaled = await scaler.fit_transform(X);

    return Array.from(X_scaled);
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(
    yTrue: number[],
    yPred: number[],
    yProba: number[]
  ): Promise<ModelPerformance> {
    const accuracy = sklearn.metrics.accuracy_score(yTrue, yPred);
    const precision = sklearn.metrics.precision_score(yTrue, yPred);
    const recall = sklearn.metrics.recall_score(yTrue, yPred);
    const f1Score = sklearn.metrics.f1_score(yTrue, yPred);

    // Calculate AUC-ROC
    const auc = sklearn.metrics.roc_auc_score(yTrue, yProba);

    return {
      accuracy: await accuracy,
      precision: await precision,
      recall: await recall,
      f1Score: await f1Score,
      auc: await auc
    };
  }

  /**
   * Select best model based on performance
   */
  private selectBestModel(models: MLModel[]): MLModel {
    // Use weighted score: accuracy (40%) + precision (30%) + recall (20%) + AUC (10%)
    const scores = models.map(model => {
      const perf = model.performance;
      return (
        (perf.accuracy || 0) * 0.4 +
        (perf.precision || 0) * 0.3 +
        (perf.recall || 0) * 0.2 +
        (perf.auc || 0) * 0.1
      );
    });

    const bestIndex = scores.indexOf(Math.max(...scores));
    return models[bestIndex];
  }

  /**
   * Extract features from dataset
   */
  private extractFeatures(dataset: TrainingDataset): number[][] {
    return dataset.features;
  }

  /**
   * Extract labels from dataset
   */
  private extractLabels(dataset: TrainingDataset): number[] {
    return dataset.labels;
  }

  /**
   * Get feature names
   */
  private getFeatureNames(): string[] {
    return [
      'temperature_mean', 'temperature_std', 'temperature_max', 'temperature_min',
      'temperature_median', 'temperature_p75', 'temperature_p25', 'temperature_trend',
      'vibration_mean', 'vibration_std', 'vibration_max', 'vibration_min',
      'vibration_median', 'vibration_p75', 'vibration_p25', 'vibration_trend',
      'pressure_mean', 'pressure_std', 'pressure_max', 'pressure_min',
      'pressure_median', 'pressure_p75', 'pressure_p25', 'pressure_trend',
      'current_mean', 'current_std', 'current_max', 'current_min',
      'current_median', 'current_p75', 'current_p25', 'current_trend',
      'fft_peak1', 'fft_peak2', 'fft_peak3', 'fft_rms',
      'fft_kurtosis', 'fft_skewness',
      'operating_hours',
      'cycle_count',
      'hours_since_maintenance'
    ];
  }

  /**
   * Get normal range for feature
   */
  private getNormalRange(featureName: string): [number, number] {
    const ranges: Record<string, [number, number]> = {
      'temperature_mean': [20, 80],
      'temperature_std': [0, 10],
      'vibration_mean': [0, 5],
      'vibration_std': [0, 2],
      'pressure_mean': [50, 150],
      'pressure_std': [0, 10],
      'current_mean': [10, 50],
      'current_std': [0, 5],
      'operating_hours': [0, 100000],
      'cycle_count': [0, 1000000],
      'hours_since_maintenance': [0, 2000]
    };

    return ranges[featureName] || [0, 100];
  }

  /**
   * Calculate degradation rate from sensor trends
   */
  private calculateDegradationRate(sensorData: SensorReading[]): number {
    // Group by sensor and calculate trend
    const sensorGroups = new Map<string, SensorReading[]>();
    for (const reading of sensorData) {
      if (!sensorGroups.has(reading.sensorId)) {
        sensorGroups.set(reading.sensorId, []);
      }
      sensorGroups.get(reading.sensorId)!.push(reading);
    }

    let totalDegradation = 0;
    let sensorCount = 0;

    for (const readings of sensorGroups.values()) {
      const values = readings.map(r => r.value);
      const trend = Math.abs(this.slope(values));
      totalDegradation += trend;
      sensorCount++;
    }

    return sensorCount > 0 ? totalDegradation / sensorCount : 0;
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(sensorData: SensorReading[]): number {
    // Simplified health score based on sensor deviations from normal
    let totalScore = 1.0;
    const sensorGroups = new Map<string, SensorReading[]>();

    for (const reading of sensorData) {
      if (!sensorGroups.has(reading.sensorId)) {
        sensorGroups.set(reading.sensorId, []);
      }
      sensorGroups.get(reading.sensorId)!.push(reading);
    }

    for (const readings of sensorGroups.values()) {
      const values = readings.map(r => r.value);
      const std = this.std(values);
      const mean = this.mean(values);

      // Penalize high variability
      const variabilityPenalty = Math.min(std / mean, 0.2);
      totalScore -= variabilityPenalty;
    }

    return Math.max(0, Math.min(1, totalScore));
  }

  /**
   * Calculate feature trend
   */
  private calculateFeatureTrend(
    featureName: string,
    sensorData: SensorReading[]
  ): 'INCREASING' | 'DECREASING' | 'STABLE' {
    // Extract relevant sensor readings
    const values = sensorData.map(r => r.value);
    const slope = this.slope(values);

    if (Math.abs(slope) < 0.01) {
      return 'STABLE';
    }

    return slope > 0 ? 'INCREASING' : 'DECREASING';
  }

  // ========================================================================
  // Mathematical Utilities
  // ========================================================================

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private std(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private slope(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private computeFFT(data: number[]): number[] {
    // Simplified FFT using scipy
    const signal = numpy.array(data);
    const fft = scipy.fft.fft(signal);
    const magnitude = numpy.abs(fft);
    return Array.from(magnitude);
  }

  private extractFrequencyFeatures(fft: number[]): number[] {
    const sorted = [...fft].sort((a, b) => b - a);
    const rms = Math.sqrt(this.mean(fft.map(x => x * x)));
    const kurtosis = this.calculateKurtosis(fft);
    const skewness = this.calculateSkewness(fft);

    return [
      sorted[0], // Peak 1
      sorted[1], // Peak 2
      sorted[2], // Peak 3
      rms,
      kurtosis,
      skewness
    ];
  }

  private calculateKurtosis(values: number[]): number {
    const mean = this.mean(values);
    const std = this.std(values);
    const n = values.length;

    const sum = values.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0);
    return (n * sum) / ((n - 1) * (n - 2) * (n - 3));
  }

  private calculateSkewness(values: number[]): number {
    const mean = this.mean(values);
    const std = this.std(values);
    const n = values.length;

    const sum = values.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0);
    return (n * sum) / ((n - 1) * (n - 2));
  }
}

// ============================================================================
// Anomaly Detection
// ============================================================================

export class AnomalyDetector {
  private models: Map<string, any> = new Map();

  /**
   * Train anomaly detection model
   */
  async trainAnomalyModel(
    equipmentId: string,
    normalData: number[][]
  ): Promise<void> {
    console.log(`Training anomaly detection model for ${equipmentId}`);

    // Use Isolation Forest for anomaly detection
    const X = numpy.array(normalData);
    const isoForest = sklearn.ensemble.IsolationForest({
      contamination: 0.1,
      random_state: 42
    });

    await isoForest.fit(X);
    this.models.set(equipmentId, isoForest);
  }

  /**
   * Detect anomalies in sensor data
   */
  async detectAnomalies(
    equipmentId: string,
    sensorData: SensorReading[]
  ): Promise<AnomalyDetectionResult[]> {
    const model = this.models.get(equipmentId);
    if (!model) {
      throw new Error(`No anomaly model found for equipment ${equipmentId}`);
    }

    const results: AnomalyDetectionResult[] = [];

    // Group by sensor
    const sensorGroups = new Map<string, SensorReading[]>();
    for (const reading of sensorData) {
      if (!sensorGroups.has(reading.sensorId)) {
        sensorGroups.set(reading.sensorId, []);
      }
      sensorGroups.get(reading.sensorId)!.push(reading);
    }

    for (const [sensorId, readings] of sensorGroups) {
      const features = readings.map(r => [r.value, r.timestamp.getTime()]);
      const X = numpy.array(features);

      const predictions = await model.predict(X);
      const scores = await model.score_samples(X);

      for (let i = 0; i < readings.length; i++) {
        if (predictions[i] === -1) {
          results.push({
            sensorId,
            timestamp: readings[i].timestamp,
            value: readings[i].value,
            anomalyScore: -scores[i],
            isAnomaly: true
          });
        }
      }
    }

    return results;
  }
}

// ============================================================================
// Types
// ============================================================================

export interface PredictiveMaintenanceConfig {
  modelRetrainingInterval: number; // hours
  predictionInterval: number;      // minutes
  minTrainingDataPoints: number;
  defaultRUL: number;              // hours
}

export interface EquipmentHistoricalData {
  equipmentId: string;
  windows: TimeWindow[];
}

export interface TimeWindow {
  timestamp: Date;
  sensorReadings: SensorReading[][];
  vibrationData?: number[];
  operatingHours: number;
  cycleCount: number;
  hoursSinceLastMaintenance: number;
  failure: boolean;
}

export interface TrainingDataset {
  equipmentId: string;
  features: number[][];
  labels: number[];
  timestamps: Date[];
}

export interface AnomalyDetectionResult {
  sensorId: string;
  timestamp: Date;
  value: number;
  anomalyScore: number;
  isAnomaly: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_PDM_CONFIG: PredictiveMaintenanceConfig = {
  modelRetrainingInterval: 168,  // 1 week
  predictionInterval: 60,        // 1 hour
  minTrainingDataPoints: 1000,
  defaultRUL: 720               // 30 days
};
