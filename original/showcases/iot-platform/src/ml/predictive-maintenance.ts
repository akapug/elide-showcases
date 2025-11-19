/**
 * Elide IoT Platform - Predictive Maintenance
 *
 * Machine learning-based predictive maintenance using Python's scikit-learn.
 * Predicts equipment failures before they occur and optimizes maintenance scheduling.
 *
 * Demonstrates Elide polyglot: TypeScript + python:sklearn + python:numpy
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import {
  PredictiveMaintenanceResult,
  MaintenanceRecommendation,
  RiskFactor,
  MLModelType,
  DeviceId
} from '../types';

// ============================================================================
// Predictive Maintenance Configuration
// ============================================================================

export interface PredictiveMaintenanceConfig {
  features: string[];
  model: MLModelType;
  lookAhead: number; // Hours to predict ahead
  maintenanceThreshold: number; // Failure probability threshold
  warningThreshold: number;
  updateInterval: number; // Model retraining interval (ms)
  enableRUL: boolean; // Remaining Useful Life estimation
}

export interface MaintenanceTrainingData {
  features: number[][];
  labels: number[]; // 0 = normal, 1 = failure
  timestamps?: number[];
  rul?: number[]; // Remaining Useful Life (hours)
}

export interface MaintenancePrediction {
  probability: number;
  confidence: number;
  timeToFailure?: number;
  recommendation: MaintenanceRecommendation;
  featureImportance: Record<string, number>;
  riskFactors: RiskFactor[];
  maintenanceWindow?: [number, number];
}

// ============================================================================
// Predictive Maintenance Implementation
// ============================================================================

export class PredictiveMaintenance {
  private classifier: any;
  private regressor: any;
  private featureScaler: any;
  private featureImportances: number[] = [];
  private isTrained: boolean = false;
  private lastTrainingTime: number = 0;
  private predictionHistory: MaintenancePrediction[] = [];

  constructor(private config: PredictiveMaintenanceConfig) {}

  // ========================================================================
  // Model Training
  // ========================================================================

  async train(data: MaintenanceTrainingData): Promise<void> {
    if (data.features.length === 0) {
      throw new Error('No training data provided');
    }

    const npFeatures = numpy.array(data.features);
    const npLabels = numpy.array(data.labels);

    // Normalize features
    this.featureScaler = new sklearn.preprocessing.StandardScaler();
    const scaledFeatures = this.featureScaler.fit_transform(npFeatures);

    // Train failure classifier
    await this.trainClassifier(scaledFeatures, npLabels);

    // Train RUL regressor if enabled
    if (this.config.enableRUL && data.rul) {
      await this.trainRegressor(scaledFeatures, numpy.array(data.rul));
    }

    this.isTrained = true;
    this.lastTrainingTime = Date.now();
  }

  private async trainClassifier(features: any, labels: any): Promise<void> {
    switch (this.config.model) {
      case MLModelType.RANDOM_FOREST:
        this.classifier = new sklearn.ensemble.RandomForestClassifier({
          n_estimators: 100,
          max_depth: 10,
          min_samples_split: 2,
          min_samples_leaf: 1,
          max_features: 'sqrt',
          class_weight: 'balanced',
          random_state: 42,
          n_jobs: -1
        });
        break;

      case MLModelType.GRADIENT_BOOSTING:
        this.classifier = new sklearn.ensemble.GradientBoostingClassifier({
          n_estimators: 100,
          learning_rate: 0.1,
          max_depth: 5,
          min_samples_split: 2,
          min_samples_leaf: 1,
          subsample: 0.8,
          random_state: 42
        });
        break;

      case MLModelType.LOGISTIC_REGRESSION:
        this.classifier = new sklearn.linear_model.LogisticRegression({
          penalty: 'l2',
          C: 1.0,
          class_weight: 'balanced',
          max_iter: 1000,
          random_state: 42
        });
        break;

      case MLModelType.SVM:
        this.classifier = new sklearn.svm.SVC({
          kernel: 'rbf',
          C: 1.0,
          gamma: 'scale',
          class_weight: 'balanced',
          probability: true,
          random_state: 42
        });
        break;

      default:
        this.classifier = new sklearn.ensemble.RandomForestClassifier({
          n_estimators: 100,
          random_state: 42
        });
    }

    this.classifier.fit(features, labels);

    // Extract feature importances (if available)
    if (this.classifier.feature_importances_) {
      this.featureImportances = Array.from(this.classifier.feature_importances_);
    }
  }

  private async trainRegressor(features: any, rul: any): Promise<void> {
    // Train Random Forest Regressor for RUL estimation
    this.regressor = new sklearn.ensemble.RandomForestRegressor({
      n_estimators: 100,
      max_depth: 10,
      min_samples_split: 2,
      min_samples_leaf: 1,
      max_features: 'sqrt',
      random_state: 42,
      n_jobs: -1
    });

    this.regressor.fit(features, rul);
  }

  // ========================================================================
  // Failure Prediction
  // ========================================================================

  async predict(features: number[]): Promise<MaintenancePrediction> {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    const npFeatures = numpy.array([features]);
    const scaledFeatures = this.featureScaler.transform(npFeatures);

    // Predict failure probability
    const probabilities = this.classifier.predict_proba(scaledFeatures);
    const failureProbability = probabilities[0][1]; // Probability of class 1 (failure)

    // Predict time to failure (RUL)
    let timeToFailure: number | undefined;
    if (this.config.enableRUL && this.regressor) {
      const rulPrediction = this.regressor.predict(scaledFeatures);
      timeToFailure = Math.max(0, rulPrediction[0]);
    }

    // Calculate confidence
    const confidence = Math.max(...probabilities[0]);

    // Determine recommendation
    const recommendation = this.determineRecommendation(
      failureProbability,
      timeToFailure
    );

    // Calculate feature importance
    const featureImportance = this.calculateFeatureImportance(features);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(features, featureImportance);

    // Calculate maintenance window
    const maintenanceWindow = timeToFailure
      ? this.calculateMaintenanceWindow(timeToFailure, failureProbability)
      : undefined;

    const prediction: MaintenancePrediction = {
      probability: failureProbability,
      confidence,
      timeToFailure,
      recommendation,
      featureImportance,
      riskFactors,
      maintenanceWindow
    };

    // Store prediction history
    this.predictionHistory.push(prediction);
    if (this.predictionHistory.length > 1000) {
      this.predictionHistory.shift();
    }

    return prediction;
  }

  private determineRecommendation(
    probability: number,
    timeToFailure?: number
  ): MaintenanceRecommendation {
    if (probability >= this.config.maintenanceThreshold) {
      if (timeToFailure && timeToFailure < 24) {
        return MaintenanceRecommendation.IMMEDIATE;
      }
      return MaintenanceRecommendation.URGENT;
    }

    if (probability >= this.config.warningThreshold) {
      if (timeToFailure && timeToFailure < 72) {
        return MaintenanceRecommendation.URGENT;
      }
      return MaintenanceRecommendation.SCHEDULED;
    }

    if (probability >= this.config.warningThreshold * 0.5) {
      return MaintenanceRecommendation.MONITOR;
    }

    return MaintenanceRecommendation.NONE;
  }

  private calculateFeatureImportance(features: number[]): Record<string, number> {
    const importance: Record<string, number> = {};

    for (let i = 0; i < features.length; i++) {
      const featureName = this.config.features[i] || `feature_${i}`;
      const importanceValue = this.featureImportances[i] || 0;
      importance[featureName] = importanceValue;
    }

    return importance;
  }

  private identifyRiskFactors(
    features: number[],
    featureImportance: Record<string, number>
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Get top 5 most important features
    const sortedFeatures = Object.entries(featureImportance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [featureName, importance] of sortedFeatures) {
      const featureIndex = this.config.features.indexOf(featureName);
      const featureValue = features[featureIndex];

      // Determine severity based on feature value and importance
      const severity = this.calculateRiskSeverity(featureValue, importance);

      if (severity > 0.3) {
        riskFactors.push({
          factor: featureName,
          severity,
          description: this.generateRiskDescription(featureName, featureValue, severity)
        });
      }
    }

    return riskFactors.sort((a, b) => b.severity - a.severity);
  }

  private calculateRiskSeverity(value: number, importance: number): number {
    // Normalize value and combine with importance
    const normalizedValue = Math.min(1, Math.abs(value) / 10);
    return Math.min(1, normalizedValue * importance * 2);
  }

  private generateRiskDescription(
    featureName: string,
    value: number,
    severity: number
  ): string {
    const severityLevel = severity > 0.7 ? 'High' : severity > 0.4 ? 'Medium' : 'Low';
    return `${severityLevel} risk: ${featureName} = ${value.toFixed(2)}`;
  }

  private calculateMaintenanceWindow(
    timeToFailure: number,
    probability: number
  ): [number, number] {
    // Calculate optimal maintenance window
    // Start: 20-30% of time to failure (or 24-48h before predicted failure)
    // End: Just before predicted failure

    const bufferHours = Math.max(24, timeToFailure * 0.2);
    const windowStart = Math.max(0, timeToFailure - bufferHours);
    const windowEnd = timeToFailure;

    return [windowStart, windowEnd];
  }

  // ========================================================================
  // Batch Prediction
  // ========================================================================

  async predictBatch(featuresArray: number[][]): Promise<MaintenancePrediction[]> {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    const promises = featuresArray.map(features => this.predict(features));
    return Promise.all(promises);
  }

  // ========================================================================
  // Health Score Calculation
  // ========================================================================

  async calculateHealthScore(features: number[]): Promise<HealthScore> {
    const prediction = await this.predict(features);

    // Health score is inverse of failure probability
    const score = (1 - prediction.probability) * 100;

    // Categorize health
    let category: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (score >= 90) category = 'excellent';
    else if (score >= 75) category = 'good';
    else if (score >= 50) category = 'fair';
    else if (score >= 25) category = 'poor';
    else category = 'critical';

    return {
      score,
      category,
      trend: await this.calculateHealthTrend(),
      prediction
    };
  }

  private async calculateHealthTrend(): Promise<'improving' | 'stable' | 'degrading'> {
    if (this.predictionHistory.length < 10) return 'stable';

    const recent = this.predictionHistory.slice(-10);
    const probabilities = recent.map(p => p.probability);

    // Linear regression on probabilities
    const n = probabilities.length;
    const x = numpy.arange(n);
    const y = numpy.array(probabilities);

    const meanX = numpy.mean(x);
    const meanY = numpy.mean(y);

    const numerator = numpy.sum(
      numpy.multiply(
        numpy.subtract(x, meanX),
        numpy.subtract(y, meanY)
      )
    );

    const denominator = numpy.sum(
      numpy.power(numpy.subtract(x, meanX), 2)
    );

    const slope = numerator / denominator;

    if (slope < -0.01) return 'improving';
    if (slope > 0.01) return 'degrading';
    return 'stable';
  }

  // ========================================================================
  // Maintenance Scheduling
  // ========================================================================

  async optimizeMaintenanceSchedule(
    devices: Map<DeviceId, number[]>
  ): Promise<MaintenanceSchedule[]> {
    const predictions = new Map<DeviceId, MaintenancePrediction>();

    // Predict for all devices
    for (const [deviceId, features] of devices) {
      const prediction = await this.predict(features);
      predictions.set(deviceId, prediction);
    }

    // Sort by urgency
    const schedule: MaintenanceSchedule[] = [];

    for (const [deviceId, prediction] of predictions) {
      if (prediction.recommendation === MaintenanceRecommendation.NONE) {
        continue;
      }

      const priority = this.calculatePriority(prediction);

      schedule.push({
        deviceId,
        prediction,
        priority,
        scheduledTime: this.calculateScheduledTime(prediction),
        estimatedDuration: this.estimateMaintenanceDuration(prediction)
      });
    }

    // Sort by priority (highest first)
    return schedule.sort((a, b) => b.priority - a.priority);
  }

  private calculatePriority(prediction: MaintenancePrediction): number {
    let priority = prediction.probability * 100;

    // Adjust by time to failure
    if (prediction.timeToFailure) {
      if (prediction.timeToFailure < 24) priority += 50;
      else if (prediction.timeToFailure < 72) priority += 25;
      else if (prediction.timeToFailure < 168) priority += 10;
    }

    // Adjust by recommendation
    switch (prediction.recommendation) {
      case MaintenanceRecommendation.IMMEDIATE:
        priority += 100;
        break;
      case MaintenanceRecommendation.URGENT:
        priority += 50;
        break;
      case MaintenanceRecommendation.SCHEDULED:
        priority += 10;
        break;
    }

    return Math.min(200, priority);
  }

  private calculateScheduledTime(prediction: MaintenancePrediction): number {
    const now = Date.now();

    if (prediction.recommendation === MaintenanceRecommendation.IMMEDIATE) {
      return now;
    }

    if (prediction.timeToFailure && prediction.maintenanceWindow) {
      // Schedule at start of maintenance window
      const hoursToWindow = prediction.maintenanceWindow[0];
      return now + hoursToWindow * 3600000;
    }

    // Default: schedule in 24 hours
    return now + 24 * 3600000;
  }

  private estimateMaintenanceDuration(prediction: MaintenancePrediction): number {
    // Estimate based on number and severity of risk factors
    const baseDuration = 2; // 2 hours base
    const riskFactorTime = prediction.riskFactors.length * 0.5;
    const severityMultiplier = prediction.riskFactors.reduce(
      (sum, rf) => sum + rf.severity,
      0
    ) / prediction.riskFactors.length;

    return baseDuration + riskFactorTime * severityMultiplier;
  }

  // ========================================================================
  // Model Evaluation
  // ========================================================================

  async evaluate(testData: MaintenanceTrainingData): Promise<ModelMetrics> {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    const npFeatures = numpy.array(testData.features);
    const npLabels = numpy.array(testData.labels);
    const scaledFeatures = this.featureScaler.transform(npFeatures);

    // Get predictions
    const predictions = this.classifier.predict(scaledFeatures);
    const probabilities = this.classifier.predict_proba(scaledFeatures);

    // Calculate metrics
    const accuracy = sklearn.metrics.accuracy_score(npLabels, predictions);
    const precision = sklearn.metrics.precision_score(npLabels, predictions);
    const recall = sklearn.metrics.recall_score(npLabels, predictions);
    const f1 = sklearn.metrics.f1_score(npLabels, predictions);

    // Confusion matrix
    const cm = sklearn.metrics.confusion_matrix(npLabels, predictions);
    const confusionMatrix = [
      [cm[0][0], cm[0][1]],
      [cm[1][0], cm[1][1]]
    ];

    // AUC-ROC
    const auc = sklearn.metrics.roc_auc_score(
      npLabels,
      probabilities.map((p: any) => p[1])
    );

    return {
      accuracy,
      precision,
      recall,
      f1Score: f1,
      auc,
      confusionMatrix,
      trainingTime: Date.now() - this.lastTrainingTime,
      inferenceTime: 0 // Updated during prediction
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  getModelInfo(): ModelInfo {
    return {
      model: this.config.model,
      features: this.config.features,
      isTrained: this.isTrained,
      lastTrainingTime: this.lastTrainingTime,
      predictionCount: this.predictionHistory.length
    };
  }

  getPredictionHistory(): MaintenancePrediction[] {
    return [...this.predictionHistory];
  }

  async reset(): Promise<void> {
    this.classifier = null;
    this.regressor = null;
    this.featureScaler = null;
    this.featureImportances = [];
    this.isTrained = false;
    this.lastTrainingTime = 0;
    this.predictionHistory = [];
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface HealthScore {
  score: number;
  category: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
  prediction: MaintenancePrediction;
}

interface MaintenanceSchedule {
  deviceId: DeviceId;
  prediction: MaintenancePrediction;
  priority: number;
  scheduledTime: number;
  estimatedDuration: number;
}

interface ModelInfo {
  model: MLModelType;
  features: string[];
  isTrained: boolean;
  lastTrainingTime: number;
  predictionCount: number;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: number[][];
  trainingTime: number;
  inferenceTime: number;
}
