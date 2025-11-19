/**
 * AI-Powered Defect Detection System
 *
 * Computer vision and machine learning for automated defect detection
 * in manufacturing processes using Python ML libraries.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import pandas from 'python:pandas';

import type {
  Defect,
  DefectType,
  DefectSeverity,
  MLModel,
  ModelPerformance
} from '../types.js';

// ============================================================================
// Defect Detection Engine
// ============================================================================

export class DefectDetectionEngine {
  private models: Map<DefectType, MLModel> = new Map();
  private config: DefectDetectionConfig;
  private detectionHistory: DefectDetectionResult[] = [];

  constructor(config: DefectDetectionConfig) {
    this.config = config;
  }

  /**
   * Train defect detection model
   */
  async trainDefectModel(
    defectType: DefectType,
    trainingData: DefectTrainingData
  ): Promise<MLModel> {
    console.log(`Training defect detection model for ${defectType}`);

    // Prepare features and labels
    const features = await this.extractDefectFeatures(trainingData.samples);
    const labels = trainingData.labels;

    // Balance dataset if needed
    const balancedData = await this.balanceDataset(features, labels);

    // Train ensemble of models
    const models = await Promise.all([
      this.trainRandomForestClassifier(balancedData),
      this.trainGradientBoostingClassifier(balancedData),
      this.trainSVMClassifier(balancedData)
    ]);

    // Select best model
    const bestModel = this.selectBestDefectModel(models);
    bestModel.id = `defect-${defectType}-${Date.now()}`;
    bestModel.name = `${defectType} Defect Detector`;

    this.models.set(defectType, bestModel);

    console.log(`Defect model trained: ${bestModel.type} with accuracy ${bestModel.performance.accuracy}`);

    return bestModel;
  }

  /**
   * Detect defects in product image/scan
   */
  async detectDefects(
    imageData: ImageData,
    productId: string
  ): Promise<DefectDetectionResult> {
    console.log(`Detecting defects in product ${productId}`);

    // Extract features from image
    const features = await this.extractImageFeatures(imageData);

    // Run detection for each defect type
    const detectedDefects: DetectedDefect[] = [];

    for (const [defectType, model] of this.models) {
      const prediction = await this.predictDefect(model, features);

      if (prediction.hasDefect) {
        detectedDefects.push({
          type: defectType,
          confidence: prediction.confidence,
          severity: this.calculateDefectSeverity(prediction),
          location: prediction.location,
          boundingBox: prediction.boundingBox,
          description: this.generateDefectDescription(defectType, prediction),
          imageUrl: this.saveDefectImage(imageData, prediction)
        });
      }
    }

    // Classify overall quality
    const qualityClassification = this.classifyOverallQuality(detectedDefects);

    const result: DefectDetectionResult = {
      id: this.generateResultId(),
      productId,
      timestamp: new Date(),
      detectedDefects,
      totalDefects: detectedDefects.length,
      qualityClassification,
      confidence: this.calculateOverallConfidence(detectedDefects),
      processingTimeMs: 0
    };

    this.detectionHistory.push(result);

    return result;
  }

  /**
   * Train Random Forest classifier for defect detection
   */
  private async trainRandomForestClassifier(
    data: BalancedDataset
  ): Promise<MLModel> {
    const X = numpy.array(data.features);
    const y = numpy.array(data.labels);

    const clf = sklearn.ensemble.RandomForestClassifier({
      n_estimators: 200,
      max_depth: 15,
      min_samples_split: 10,
      min_samples_leaf: 4,
      max_features: 'sqrt',
      class_weight: 'balanced',
      random_state: 42
    });

    await clf.fit(X, y);

    const predictions = await clf.predict(X);
    const probabilities = await clf.predict_proba(X);

    const performance = await this.calculateModelPerformance(
      data.labels,
      Array.from(predictions),
      Array.from(probabilities)
    );

    return {
      id: '',
      name: 'Random Forest Defect Detector',
      version: '1.0.0',
      type: 'RANDOM_FOREST',
      trainedDate: new Date(),
      features: this.getDefectFeatureNames(),
      targetVariable: 'defect_present',
      performance,
      hyperparameters: {
        n_estimators: 200,
        max_depth: 15,
        model: clf
      }
    };
  }

  /**
   * Train Gradient Boosting classifier
   */
  private async trainGradientBoostingClassifier(
    data: BalancedDataset
  ): Promise<MLModel> {
    const X = numpy.array(data.features);
    const y = numpy.array(data.labels);

    const clf = sklearn.ensemble.GradientBoostingClassifier({
      n_estimators: 150,
      learning_rate: 0.1,
      max_depth: 7,
      min_samples_split: 10,
      min_samples_leaf: 4,
      subsample: 0.8,
      random_state: 42
    });

    await clf.fit(X, y);

    const predictions = await clf.predict(X);
    const probabilities = await clf.predict_proba(X);

    const performance = await this.calculateModelPerformance(
      data.labels,
      Array.from(predictions),
      Array.from(probabilities)
    );

    return {
      id: '',
      name: 'Gradient Boosting Defect Detector',
      version: '1.0.0',
      type: 'GRADIENT_BOOSTING',
      trainedDate: new Date(),
      features: this.getDefectFeatureNames(),
      targetVariable: 'defect_present',
      performance,
      hyperparameters: {
        n_estimators: 150,
        learning_rate: 0.1,
        model: clf
      }
    };
  }

  /**
   * Train SVM classifier
   */
  private async trainSVMClassifier(
    data: BalancedDataset
  ): Promise<MLModel> {
    const X = numpy.array(data.features);
    const y = numpy.array(data.labels);

    const clf = sklearn.svm.SVC({
      kernel: 'rbf',
      C: 10.0,
      gamma: 'scale',
      class_weight: 'balanced',
      probability: true,
      random_state: 42
    });

    await clf.fit(X, y);

    const predictions = await clf.predict(X);
    const probabilities = await clf.predict_proba(X);

    const performance = await this.calculateModelPerformance(
      data.labels,
      Array.from(predictions),
      Array.from(probabilities)
    );

    return {
      id: '',
      name: 'SVM Defect Detector',
      version: '1.0.0',
      type: 'SVM',
      trainedDate: new Date(),
      features: this.getDefectFeatureNames(),
      targetVariable: 'defect_present',
      performance,
      hyperparameters: {
        kernel: 'rbf',
        C: 10.0,
        model: clf
      }
    };
  }

  /**
   * Extract features from defect samples
   */
  private async extractDefectFeatures(
    samples: DefectSample[]
  ): Promise<number[][]> {
    const features: number[][] = [];

    for (const sample of samples) {
      const imageFeatures = await this.extractImageFeatures(sample.imageData);
      features.push(imageFeatures);
    }

    return features;
  }

  /**
   * Extract features from image data
   */
  private async extractImageFeatures(imageData: ImageData): Promise<number[]> {
    const features: number[] = [];

    // Convert image to grayscale intensity values
    const grayScale = this.convertToGrayscale(imageData);

    // Statistical features
    features.push(
      this.mean(grayScale),
      this.std(grayScale),
      this.median(grayScale),
      this.percentile(grayScale, 25),
      this.percentile(grayScale, 75),
      this.skewness(grayScale),
      this.kurtosis(grayScale)
    );

    // Texture features (GLCM - Gray Level Co-occurrence Matrix)
    const glcmFeatures = this.calculateGLCMFeatures(grayScale, imageData.width);
    features.push(...glcmFeatures);

    // Edge detection features
    const edges = this.detectEdges(grayScale, imageData.width, imageData.height);
    features.push(
      this.mean(edges),
      this.std(edges),
      this.countNonZero(edges) / edges.length
    );

    // Gradient features
    const gradients = this.calculateGradients(grayScale, imageData.width, imageData.height);
    features.push(
      this.mean(gradients.magnitude),
      this.std(gradients.magnitude),
      this.mean(gradients.orientation)
    );

    // Frequency domain features (FFT)
    const fftFeatures = await this.calculateFFTFeatures(grayScale);
    features.push(...fftFeatures);

    // Local Binary Pattern features
    const lbpFeatures = this.calculateLBPFeatures(grayScale, imageData.width, imageData.height);
    features.push(...lbpFeatures);

    // Histogram features
    const histogramFeatures = this.calculateHistogramFeatures(grayScale);
    features.push(...histogramFeatures);

    return features;
  }

  /**
   * Convert image to grayscale
   */
  private convertToGrayscale(imageData: ImageData): number[] {
    const grayscale: number[] = [];
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Standard grayscale conversion
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayscale.push(gray);
    }

    return grayscale;
  }

  /**
   * Calculate GLCM (Gray Level Co-occurrence Matrix) features
   */
  private calculateGLCMFeatures(grayscale: number[], width: number): number[] {
    // Simplified GLCM calculation
    const levels = 256;
    const glcm = Array(levels).fill(0).map(() => Array(levels).fill(0));

    // Calculate co-occurrence matrix (horizontal)
    for (let i = 0; i < grayscale.length - 1; i++) {
      if ((i + 1) % width !== 0) {
        const val1 = Math.floor(grayscale[i]);
        const val2 = Math.floor(grayscale[i + 1]);
        glcm[val1][val2]++;
      }
    }

    // Normalize
    const total = glcm.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0);
    const normalizedGLCM = glcm.map(row => row.map(v => v / total));

    // Calculate Haralick features
    let contrast = 0;
    let dissimilarity = 0;
    let homogeneity = 0;
    let energy = 0;
    let correlation = 0;

    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        const p = normalizedGLCM[i][j];
        contrast += p * Math.pow(i - j, 2);
        dissimilarity += p * Math.abs(i - j);
        homogeneity += p / (1 + Math.abs(i - j));
        energy += p * p;
      }
    }

    return [contrast, dissimilarity, homogeneity, energy, correlation];
  }

  /**
   * Detect edges using Sobel operator
   */
  private detectEdges(grayscale: number[], width: number, height: number): number[] {
    const edges: number[] = [];

    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            gx += grayscale[idx] * sobelX[ky + 1][kx + 1];
            gy += grayscale[idx] * sobelY[ky + 1][kx + 1];
          }
        }

        edges.push(Math.sqrt(gx * gx + gy * gy));
      }
    }

    return edges;
  }

  /**
   * Calculate image gradients
   */
  private calculateGradients(
    grayscale: number[],
    width: number,
    height: number
  ): { magnitude: number[]; orientation: number[] } {
    const magnitude: number[] = [];
    const orientation: number[] = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const gx = grayscale[idx + 1] - grayscale[idx - 1];
        const gy = grayscale[idx + width] - grayscale[idx - width];

        magnitude.push(Math.sqrt(gx * gx + gy * gy));
        orientation.push(Math.atan2(gy, gx));
      }
    }

    return { magnitude, orientation };
  }

  /**
   * Calculate FFT features
   */
  private async calculateFFTFeatures(grayscale: number[]): Promise<number[]> {
    const signal = numpy.array(grayscale);
    const fft = scipy.fft.fft(signal);
    const magnitude = numpy.abs(fft);

    const magnitudeArray = Array.from(magnitude);

    return [
      this.mean(magnitudeArray),
      this.std(magnitudeArray),
      Math.max(...magnitudeArray),
      this.percentile(magnitudeArray, 90)
    ];
  }

  /**
   * Calculate Local Binary Pattern features
   */
  private calculateLBPFeatures(
    grayscale: number[],
    width: number,
    height: number
  ): number[] {
    const lbp: number[] = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = grayscale[y * width + x];
        let pattern = 0;

        // 8-neighbor LBP
        const neighbors = [
          grayscale[(y - 1) * width + (x - 1)],
          grayscale[(y - 1) * width + x],
          grayscale[(y - 1) * width + (x + 1)],
          grayscale[y * width + (x + 1)],
          grayscale[(y + 1) * width + (x + 1)],
          grayscale[(y + 1) * width + x],
          grayscale[(y + 1) * width + (x - 1)],
          grayscale[y * width + (x - 1)]
        ];

        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) {
            pattern |= (1 << i);
          }
        }

        lbp.push(pattern);
      }
    }

    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (const val of lbp) {
      histogram[val]++;
    }

    // Normalize and return top bins
    const total = lbp.length;
    return histogram.slice(0, 20).map(v => v / total);
  }

  /**
   * Calculate histogram features
   */
  private calculateHistogramFeatures(grayscale: number[]): number[] {
    const bins = 32;
    const histogram = new Array(bins).fill(0);

    for (const val of grayscale) {
      const bin = Math.min(Math.floor(val / (256 / bins)), bins - 1);
      histogram[bin]++;
    }

    // Normalize
    const total = grayscale.length;
    const normalizedHist = histogram.map(v => v / total);

    return [
      ...normalizedHist.slice(0, 10),
      this.entropy(normalizedHist)
    ];
  }

  /**
   * Balance dataset using SMOTE or undersampling
   */
  private async balanceDataset(
    features: number[][],
    labels: number[]
  ): Promise<BalancedDataset> {
    // Count class distribution
    const classCount = { 0: 0, 1: 0 };
    labels.forEach(label => classCount[label as 0 | 1]++);

    // If balanced enough, return as is
    const ratio = Math.min(classCount[0], classCount[1]) / Math.max(classCount[0], classCount[1]);
    if (ratio > 0.7) {
      return { features, labels };
    }

    // Apply SMOTE (Synthetic Minority Over-sampling Technique)
    const X = numpy.array(features);
    const y = numpy.array(labels);

    const smote = sklearn.over_sampling.SMOTE({
      sampling_strategy: 'auto',
      k_neighbors: 5,
      random_state: 42
    });

    const [X_resampled, y_resampled] = await smote.fit_resample(X, y);

    return {
      features: Array.from(X_resampled),
      labels: Array.from(y_resampled)
    };
  }

  /**
   * Predict defect presence
   */
  private async predictDefect(
    model: MLModel,
    features: number[]
  ): Promise<DefectPrediction> {
    const X = numpy.array([features]);
    const clf = model.hyperparameters.model as any;

    const prediction = await clf.predict(X);
    const probabilities = await clf.predict_proba(X);

    const hasDefect = prediction[0] === 1;
    const confidence = probabilities[0][1];

    // Simplified location detection (would use CNN for actual implementation)
    const location = this.estimateDefectLocation(features);
    const boundingBox = this.estimateBoundingBox(location);

    return {
      hasDefect,
      confidence,
      location,
      boundingBox
    };
  }

  /**
   * Estimate defect location from features
   */
  private estimateDefectLocation(features: number[]): DefectLocation {
    // Simplified location estimation
    return {
      x: Math.random() * 100,
      y: Math.random() * 100,
      area: Math.random() * 50
    };
  }

  /**
   * Estimate bounding box for defect
   */
  private estimateBoundingBox(location: DefectLocation): BoundingBox {
    const size = Math.sqrt(location.area);
    return {
      x: location.x - size / 2,
      y: location.y - size / 2,
      width: size,
      height: size
    };
  }

  /**
   * Calculate defect severity
   */
  private calculateDefectSeverity(prediction: DefectPrediction): DefectSeverity {
    if (prediction.confidence > 0.9) {
      return 'CRITICAL';
    } else if (prediction.confidence > 0.7) {
      return 'MAJOR';
    } else {
      return 'MINOR';
    }
  }

  /**
   * Generate defect description
   */
  private generateDefectDescription(
    defectType: DefectType,
    prediction: DefectPrediction
  ): string {
    return `${defectType} defect detected at location (${prediction.location.x.toFixed(1)}, ${prediction.location.y.toFixed(1)}) with ${(prediction.confidence * 100).toFixed(1)}% confidence`;
  }

  /**
   * Save defect image
   */
  private saveDefectImage(imageData: ImageData, prediction: DefectPrediction): string {
    // In real implementation, would save annotated image to storage
    return `/defect-images/${Date.now()}.png`;
  }

  /**
   * Classify overall quality
   */
  private classifyOverallQuality(defects: DetectedDefect[]): QualityClassification {
    if (defects.length === 0) {
      return 'EXCELLENT';
    }

    const criticalDefects = defects.filter(d => d.severity === 'CRITICAL').length;
    const majorDefects = defects.filter(d => d.severity === 'MAJOR').length;

    if (criticalDefects > 0) {
      return 'REJECT';
    } else if (majorDefects > 2) {
      return 'POOR';
    } else if (majorDefects > 0) {
      return 'FAIR';
    } else {
      return 'GOOD';
    }
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(defects: DetectedDefect[]): number {
    if (defects.length === 0) {
      return 1.0;
    }

    const avgConfidence = defects.reduce((sum, d) => sum + d.confidence, 0) / defects.length;
    return avgConfidence;
  }

  /**
   * Calculate model performance metrics
   */
  private async calculateModelPerformance(
    yTrue: number[],
    yPred: number[],
    yProba: number[][]
  ): Promise<ModelPerformance> {
    const accuracy = sklearn.metrics.accuracy_score(yTrue, yPred);
    const precision = sklearn.metrics.precision_score(yTrue, yPred, { average: 'binary' });
    const recall = sklearn.metrics.recall_score(yTrue, yPred, { average: 'binary' });
    const f1Score = sklearn.metrics.f1_score(yTrue, yPred, { average: 'binary' });

    // Extract positive class probabilities
    const yProbaPositive = yProba.map(p => p[1]);
    const auc = sklearn.metrics.roc_auc_score(yTrue, yProbaPositive);

    return {
      accuracy: await accuracy,
      precision: await precision,
      recall: await recall,
      f1Score: await f1Score,
      auc: await auc
    };
  }

  /**
   * Select best defect detection model
   */
  private selectBestDefectModel(models: MLModel[]): MLModel {
    // Prioritize recall (catching all defects) over precision
    const scores = models.map(model => {
      const perf = model.performance;
      return (
        (perf.recall || 0) * 0.5 +
        (perf.precision || 0) * 0.2 +
        (perf.accuracy || 0) * 0.2 +
        (perf.auc || 0) * 0.1
      );
    });

    const bestIndex = scores.indexOf(Math.max(...scores));
    return models[bestIndex];
  }

  /**
   * Get defect feature names
   */
  private getDefectFeatureNames(): string[] {
    return [
      'intensity_mean', 'intensity_std', 'intensity_median',
      'intensity_p25', 'intensity_p75', 'skewness', 'kurtosis',
      'glcm_contrast', 'glcm_dissimilarity', 'glcm_homogeneity',
      'glcm_energy', 'glcm_correlation',
      'edge_mean', 'edge_std', 'edge_density',
      'gradient_magnitude_mean', 'gradient_magnitude_std', 'gradient_orientation_mean',
      'fft_mean', 'fft_std', 'fft_max', 'fft_p90',
      ...Array.from({ length: 20 }, (_, i) => `lbp_bin${i}`),
      ...Array.from({ length: 10 }, (_, i) => `hist_bin${i}`),
      'histogram_entropy'
    ];
  }

  /**
   * Get detection statistics
   */
  getDetectionStatistics(period: { start: Date; end: Date }): DefectStatistics {
    const results = this.detectionHistory.filter(
      r => r.timestamp >= period.start && r.timestamp <= period.end
    );

    const totalInspections = results.length;
    const totalDefects = results.reduce((sum, r) => sum + r.totalDefects, 0);
    const avgDefectsPerProduct = totalDefects / totalInspections;

    const byType = new Map<DefectType, number>();
    const bySeverity = new Map<DefectSeverity, number>();

    results.forEach(result => {
      result.detectedDefects.forEach(defect => {
        byType.set(defect.type, (byType.get(defect.type) || 0) + 1);
        bySeverity.set(defect.severity, (bySeverity.get(defect.severity) || 0) + 1);
      });
    });

    return {
      totalInspections,
      totalDefects,
      avgDefectsPerProduct,
      defectsByType: Object.fromEntries(byType),
      defectsBySeverity: Object.fromEntries(bySeverity),
      detectionRate: (totalDefects / totalInspections) * 100
    };
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

  private skewness(values: number[]): number {
    const mean = this.mean(values);
    const std = this.std(values);
    const n = values.length;
    const sum = values.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0);
    return (n * sum) / ((n - 1) * (n - 2));
  }

  private kurtosis(values: number[]): number {
    const mean = this.mean(values);
    const std = this.std(values);
    const n = values.length;
    const sum = values.reduce((acc, v) => acc + Math.pow((v - mean) / std, 4), 0);
    return (n * sum) / ((n - 1) * (n - 2) * (n - 3));
  }

  private entropy(distribution: number[]): number {
    return -distribution.reduce((sum, p) => {
      if (p === 0) return sum;
      return sum + p * Math.log2(p);
    }, 0);
  }

  private countNonZero(values: number[]): number {
    return values.filter(v => v !== 0).length;
  }

  private generateResultId(): string {
    return `DDR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Types
// ============================================================================

export interface DefectDetectionConfig {
  confidenceThreshold: number;
  modelRetrainingInterval: number; // hours
  imageSizeLimit: number; // pixels
}

export interface DefectTrainingData {
  samples: DefectSample[];
  labels: number[]; // 0 = no defect, 1 = defect
}

export interface DefectSample {
  imageData: ImageData;
  hasDefect: boolean;
  defectType?: DefectType;
  location?: DefectLocation;
}

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface DefectLocation {
  x: number;
  y: number;
  area: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DefectPrediction {
  hasDefect: boolean;
  confidence: number;
  location: DefectLocation;
  boundingBox: BoundingBox;
}

export interface DetectedDefect {
  type: DefectType;
  confidence: number;
  severity: DefectSeverity;
  location: DefectLocation;
  boundingBox: BoundingBox;
  description: string;
  imageUrl: string;
}

export interface DefectDetectionResult {
  id: string;
  productId: string;
  timestamp: Date;
  detectedDefects: DetectedDefect[];
  totalDefects: number;
  qualityClassification: QualityClassification;
  confidence: number;
  processingTimeMs: number;
}

export type QualityClassification = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'REJECT';

interface BalancedDataset {
  features: number[][];
  labels: number[];
}

export interface DefectStatistics {
  totalInspections: number;
  totalDefects: number;
  avgDefectsPerProduct: number;
  defectsByType: Record<string, number>;
  defectsBySeverity: Record<string, number>;
  detectionRate: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_DEFECT_DETECTION_CONFIG: DefectDetectionConfig = {
  confidenceThreshold: 0.7,
  modelRetrainingInterval: 168, // 1 week
  imageSizeLimit: 1024 * 1024   // 1MP
};
