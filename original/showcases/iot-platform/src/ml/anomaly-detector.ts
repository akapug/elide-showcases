/**
 * Elide IoT Platform - Anomaly Detector
 *
 * Machine learning-based anomaly detection using Python's scikit-learn.
 * Supports multiple algorithms: Isolation Forest, One-Class SVM, LOF, and ensemble methods.
 *
 * Demonstrates Elide polyglot: TypeScript + python:sklearn + python:numpy
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import {
  AnomalyDetectionResult,
  AnomalyDetectorConfig,
  AnomalyDetectionAlgorithm,
  SensorReading,
  DeviceId
} from '../types';

// ============================================================================
// Anomaly Detector Configuration
// ============================================================================

export interface AnomalyDetectorOptions {
  algorithm: AnomalyDetectionAlgorithm;
  contamination: number;
  sensitivity: number;
  trainingSize: number;
  updateInterval: number;
  features: string[];
  enableOnlineLearning: boolean;
  ensembleVoting: 'hard' | 'soft';
}

export interface TrainingData {
  features: number[][];
  timestamps?: number[];
  labels?: number[]; // Optional for semi-supervised learning
}

export interface DetectionResult {
  isAnomaly: boolean;
  score: number;
  confidence: number;
  timestamp: number;
  features: number[];
  explanation?: string;
  contributingFactors?: Record<string, number>;
}

// ============================================================================
// Anomaly Detector Implementation
// ============================================================================

export class AnomalyDetector {
  private models: Map<AnomalyDetectionAlgorithm, any> = new Map();
  private trainingData: number[][] = [];
  private featureScaler: any;
  private isTrained: boolean = false;
  private lastTrainingTime: number = 0;
  private detectionCount: number = 0;

  constructor(private config: AnomalyDetectorOptions) {}

  // ========================================================================
  // Model Training
  // ========================================================================

  async train(data: TrainingData): Promise<void> {
    if (data.features.length < this.config.trainingSize) {
      throw new Error(
        `Insufficient training data: ${data.features.length} < ${this.config.trainingSize}`
      );
    }

    this.trainingData = data.features;
    const npData = numpy.array(data.features);

    // Normalize features
    this.featureScaler = new sklearn.preprocessing.StandardScaler();
    const scaledData = this.featureScaler.fit_transform(npData);

    // Train models based on algorithm
    if (
      this.config.algorithm === AnomalyDetectionAlgorithm.ENSEMBLE ||
      this.config.algorithm === AnomalyDetectionAlgorithm.ISOLATION_FOREST
    ) {
      await this.trainIsolationForest(scaledData);
    }

    if (
      this.config.algorithm === AnomalyDetectionAlgorithm.ENSEMBLE ||
      this.config.algorithm === AnomalyDetectionAlgorithm.ONE_CLASS_SVM
    ) {
      await this.trainOneClassSVM(scaledData);
    }

    if (
      this.config.algorithm === AnomalyDetectionAlgorithm.ENSEMBLE ||
      this.config.algorithm === AnomalyDetectionAlgorithm.LOCAL_OUTLIER_FACTOR
    ) {
      await this.trainLOF(scaledData);
    }

    if (this.config.algorithm === AnomalyDetectionAlgorithm.GAUSSIAN_MIXTURE) {
      await this.trainGaussianMixture(scaledData);
    }

    if (this.config.algorithm === AnomalyDetectionAlgorithm.AUTOENCODER) {
      await this.trainAutoencoder(scaledData);
    }

    this.isTrained = true;
    this.lastTrainingTime = Date.now();
  }

  private async trainIsolationForest(data: any): Promise<void> {
    const model = new sklearn.ensemble.IsolationForest({
      contamination: this.config.contamination,
      n_estimators: 100,
      max_samples: 'auto',
      max_features: 1.0,
      bootstrap: false,
      n_jobs: -1,
      random_state: 42
    });

    model.fit(data);
    this.models.set(AnomalyDetectionAlgorithm.ISOLATION_FOREST, model);
  }

  private async trainOneClassSVM(data: any): Promise<void> {
    const model = new sklearn.svm.OneClassSVM({
      kernel: 'rbf',
      gamma: 'auto',
      nu: this.config.contamination,
      cache_size: 200
    });

    model.fit(data);
    this.models.set(AnomalyDetectionAlgorithm.ONE_CLASS_SVM, model);
  }

  private async trainLOF(data: any): Promise<void> {
    const model = new sklearn.neighbors.LocalOutlierFactor({
      n_neighbors: 20,
      contamination: this.config.contamination,
      novelty: true, // Enable predict() method
      metric: 'minkowski',
      p: 2
    });

    model.fit(data);
    this.models.set(AnomalyDetectionAlgorithm.LOCAL_OUTLIER_FACTOR, model);
  }

  private async trainGaussianMixture(data: any): Promise<void> {
    const model = new sklearn.mixture.GaussianMixture({
      n_components: 3,
      covariance_type: 'full',
      max_iter: 100,
      random_state: 42
    });

    model.fit(data);
    this.models.set(AnomalyDetectionAlgorithm.GAUSSIAN_MIXTURE, model);
  }

  private async trainAutoencoder(data: any): Promise<void> {
    // Simplified autoencoder using PCA as proxy
    const model = new sklearn.decomposition.PCA({
      n_components: Math.floor(data.shape[1] * 0.7),
      random_state: 42
    });

    model.fit(data);
    this.models.set(AnomalyDetectionAlgorithm.AUTOENCODER, model);
  }

  // ========================================================================
  // Anomaly Detection
  // ========================================================================

  async detect(features: number[]): Promise<DetectionResult> {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    this.detectionCount++;

    // Check if retraining is needed
    if (
      this.config.enableOnlineLearning &&
      Date.now() - this.lastTrainingTime > this.config.updateInterval
    ) {
      await this.updateModel(features);
    }

    const npFeatures = numpy.array([features]);
    const scaledFeatures = this.featureScaler.transform(npFeatures);

    let isAnomaly: boolean;
    let score: number;
    let confidence: number;

    if (this.config.algorithm === AnomalyDetectionAlgorithm.ENSEMBLE) {
      const result = await this.detectEnsemble(scaledFeatures);
      isAnomaly = result.isAnomaly;
      score = result.score;
      confidence = result.confidence;
    } else {
      const model = this.models.get(this.config.algorithm);
      if (!model) {
        throw new Error(`Model not found for algorithm: ${this.config.algorithm}`);
      }

      const prediction = model.predict(scaledFeatures);
      isAnomaly = prediction[0] === -1;

      // Get anomaly score
      score = await this.calculateAnomalyScore(model, scaledFeatures);
      confidence = this.calculateConfidence(score);
    }

    // Calculate feature contributions
    const contributingFactors = await this.explainAnomaly(features, scaledFeatures);

    return {
      isAnomaly,
      score,
      confidence,
      timestamp: Date.now(),
      features,
      explanation: isAnomaly ? this.generateExplanation(contributingFactors) : undefined,
      contributingFactors
    };
  }

  private async detectEnsemble(scaledFeatures: any): Promise<DetectionResult> {
    const predictions: number[] = [];
    const scores: number[] = [];

    for (const [algorithm, model] of this.models) {
      const prediction = model.predict(scaledFeatures);
      predictions.push(prediction[0]);

      const score = await this.calculateAnomalyScore(model, scaledFeatures);
      scores.push(score);
    }

    let isAnomaly: boolean;
    let finalScore: number;

    if (this.config.ensembleVoting === 'hard') {
      // Majority voting
      const anomalyCount = predictions.filter(p => p === -1).length;
      isAnomaly = anomalyCount > predictions.length / 2;
      finalScore = numpy.mean(numpy.array(scores));
    } else {
      // Soft voting (weighted by scores)
      finalScore = numpy.mean(numpy.array(scores));
      isAnomaly = finalScore > this.config.sensitivity;
    }

    const confidence = this.calculateConfidence(finalScore);

    return {
      isAnomaly,
      score: finalScore,
      confidence,
      timestamp: Date.now(),
      features: Array.from(scaledFeatures[0])
    };
  }

  private async calculateAnomalyScore(model: any, scaledFeatures: any): Promise<number> {
    // Try to get decision function or score
    try {
      if (model.decision_function) {
        const score = model.decision_function(scaledFeatures);
        return Math.abs(score[0]);
      } else if (model.score_samples) {
        const score = model.score_samples(scaledFeatures);
        return -score[0]; // Negative log-likelihood
      } else {
        // Fallback: use reconstruction error for autoencoder-like models
        const transformed = model.transform(scaledFeatures);
        const reconstructed = model.inverse_transform(transformed);
        const error = numpy.sum(numpy.square(numpy.subtract(scaledFeatures, reconstructed)));
        return error;
      }
    } catch (error) {
      return 0;
    }
  }

  private calculateConfidence(score: number): number {
    // Map anomaly score to confidence (0-1)
    // Higher score = higher confidence in anomaly detection
    return Math.min(1, Math.max(0, score / 10));
  }

  // ========================================================================
  // Explainability
  // ========================================================================

  private async explainAnomaly(
    features: number[],
    scaledFeatures: any
  ): Promise<Record<string, number>> {
    const contributingFactors: Record<string, number> = {};

    // Calculate feature importance based on deviation from training data
    const trainingMean = numpy.mean(numpy.array(this.trainingData), { axis: 0 });
    const trainingStd = numpy.std(numpy.array(this.trainingData), { axis: 0 });

    for (let i = 0; i < features.length; i++) {
      const featureName = this.config.features[i] || `feature_${i}`;
      const deviation = Math.abs((features[i] - trainingMean[i]) / trainingStd[i]);
      contributingFactors[featureName] = deviation;
    }

    return contributingFactors;
  }

  private generateExplanation(contributingFactors: Record<string, number>): string {
    // Find top contributing factors
    const sorted = Object.entries(contributingFactors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sorted.length === 0) return 'Anomaly detected';

    const factors = sorted.map(([name, value]) =>
      `${name} (deviation: ${value.toFixed(2)})`
    );

    return `Anomaly detected. Top factors: ${factors.join(', ')}`;
  }

  // ========================================================================
  // Online Learning
  // ========================================================================

  private async updateModel(newFeatures: number[]): Promise<void> {
    // Add new data to training set
    this.trainingData.push(newFeatures);

    // Limit training data size
    const maxTrainingSize = this.config.trainingSize * 2;
    if (this.trainingData.length > maxTrainingSize) {
      this.trainingData = this.trainingData.slice(-maxTrainingSize);
    }

    // Retrain model
    await this.train({ features: this.trainingData });
  }

  // ========================================================================
  // Batch Detection
  // ========================================================================

  async detectBatch(featuresArray: number[][]): Promise<DetectionResult[]> {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    const results: DetectionResult[] = [];

    // Process in parallel for better throughput
    const promises = featuresArray.map(features => this.detect(features));
    return Promise.all(promises);
  }

  // ========================================================================
  // Statistical Anomaly Detection (Fallback)
  // ========================================================================

  async detectStatistical(
    features: number[],
    threshold: number = 3
  ): Promise<DetectionResult> {
    if (this.trainingData.length === 0) {
      throw new Error('No training data available');
    }

    const npTraining = numpy.array(this.trainingData);
    const mean = numpy.mean(npTraining, { axis: 0 });
    const std = numpy.std(npTraining, { axis: 0 });

    // Calculate Z-scores
    const zscores = features.map((value, i) =>
      Math.abs((value - mean[i]) / std[i])
    );

    const maxZscore = Math.max(...zscores);
    const isAnomaly = maxZscore > threshold;
    const confidence = Math.min(1, maxZscore / (threshold * 2));

    const contributingFactors: Record<string, number> = {};
    features.forEach((_, i) => {
      const featureName = this.config.features[i] || `feature_${i}`;
      contributingFactors[featureName] = zscores[i];
    });

    return {
      isAnomaly,
      score: maxZscore,
      confidence,
      timestamp: Date.now(),
      features,
      explanation: isAnomaly ? `Statistical anomaly: max z-score ${maxZscore.toFixed(2)}` : undefined,
      contributingFactors
    };
  }

  // ========================================================================
  // Model Evaluation
  // ========================================================================

  async evaluate(testData: TrainingData): Promise<EvaluationMetrics> {
    if (!this.isTrained) {
      throw new Error('Model not trained. Call train() first.');
    }

    const predictions: number[] = [];
    const scores: number[] = [];

    for (const features of testData.features) {
      const result = await this.detect(features);
      predictions.push(result.isAnomaly ? -1 : 1);
      scores.push(result.score);
    }

    // Calculate metrics
    const npScores = numpy.array(scores);

    return {
      averageScore: numpy.mean(npScores),
      scoreStd: numpy.std(npScores),
      anomalyRate: predictions.filter(p => p === -1).length / predictions.length,
      totalPredictions: predictions.length,
      detectionCount: this.detectionCount
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  async getModelInfo(): Promise<ModelInfo> {
    return {
      algorithm: this.config.algorithm,
      isTrained: this.isTrained,
      trainingSize: this.trainingData.length,
      lastTrainingTime: this.lastTrainingTime,
      detectionCount: this.detectionCount,
      features: this.config.features,
      contamination: this.config.contamination
    };
  }

  async reset(): Promise<void> {
    this.models.clear();
    this.trainingData = [];
    this.isTrained = false;
    this.lastTrainingTime = 0;
    this.detectionCount = 0;
  }

  async save(): Promise<SerializedModel> {
    // Serialize model for persistence
    return {
      config: this.config,
      trainingData: this.trainingData,
      isTrained: this.isTrained,
      lastTrainingTime: this.lastTrainingTime,
      detectionCount: this.detectionCount
    };
  }

  async load(serialized: SerializedModel): Promise<void> {
    this.config = serialized.config;
    this.trainingData = serialized.trainingData;
    this.isTrained = serialized.isTrained;
    this.lastTrainingTime = serialized.lastTrainingTime;
    this.detectionCount = serialized.detectionCount;

    // Retrain models
    if (this.isTrained && this.trainingData.length > 0) {
      await this.train({ features: this.trainingData });
    }
  }
}

// ============================================================================
// Multi-Sensor Anomaly Detector
// ============================================================================

export class MultiSensorAnomalyDetector {
  private detectors: Map<DeviceId, AnomalyDetector> = new Map();
  private globalDetector: AnomalyDetector;

  constructor(private config: AnomalyDetectorOptions) {
    this.globalDetector = new AnomalyDetector(config);
  }

  async registerDevice(deviceId: DeviceId): Promise<void> {
    const detector = new AnomalyDetector(this.config);
    this.detectors.set(deviceId, detector);
  }

  async trainDevice(deviceId: DeviceId, data: TrainingData): Promise<void> {
    const detector = this.detectors.get(deviceId);
    if (!detector) {
      throw new Error(`Device not registered: ${deviceId}`);
    }

    await detector.train(data);
  }

  async detectDevice(deviceId: DeviceId, features: number[]): Promise<DetectionResult> {
    const detector = this.detectors.get(deviceId);
    if (!detector) {
      // Fallback to global detector
      return await this.globalDetector.detect(features);
    }

    return await detector.detect(features);
  }

  async trainGlobal(data: TrainingData): Promise<void> {
    await this.globalDetector.train(data);
  }

  async detectGlobal(features: number[]): Promise<DetectionResult> {
    return await this.globalDetector.detect(features);
  }

  async detectAll(
    readings: Map<DeviceId, number[]>
  ): Promise<Map<DeviceId, DetectionResult>> {
    const results = new Map<DeviceId, DetectionResult>();

    const promises = Array.from(readings.entries()).map(async ([deviceId, features]) => {
      const result = await this.detectDevice(deviceId, features);
      results.set(deviceId, result);
    });

    await Promise.all(promises);
    return results;
  }

  getDeviceDetector(deviceId: DeviceId): AnomalyDetector | undefined {
    return this.detectors.get(deviceId);
  }

  getGlobalDetector(): AnomalyDetector {
    return this.globalDetector;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface EvaluationMetrics {
  averageScore: number;
  scoreStd: number;
  anomalyRate: number;
  totalPredictions: number;
  detectionCount: number;
}

interface ModelInfo {
  algorithm: AnomalyDetectionAlgorithm;
  isTrained: boolean;
  trainingSize: number;
  lastTrainingTime: number;
  detectionCount: number;
  features: string[];
  contamination: number;
}

interface SerializedModel {
  config: AnomalyDetectorOptions;
  trainingData: number[][];
  isTrained: boolean;
  lastTrainingTime: number;
  detectionCount: number;
}
