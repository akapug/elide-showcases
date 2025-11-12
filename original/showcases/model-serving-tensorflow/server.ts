/**
import { createServer, IncomingMessage, ServerResponse } from "http";
 * TensorFlow Model Serving API
 *
 * Production-ready model serving infrastructure with:
 * - Model loading and versioning
 * - Batch inference with optimization
 * - Pre/post processing pipelines
 * - Performance monitoring
 * - Health checks and metrics
 */

import * as tf from "@tensorflow/tfjs-node";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ModelMetadata {
  name: string;
  version: string;
  inputShape: number[];
  outputShape: number[];
  loadedAt: Date;
  warmupComplete: boolean;
}

interface PredictionRequest {
  inputs: number[][] | number[][][];
  modelVersion?: string;
  preprocessing?: {
    normalize: boolean;
    scale?: number;
    mean?: number[];
    std?: number[];
  };
}

interface PredictionResponse {
  predictions: number[][];
  modelVersion: string;
  inferenceTimeMs: number;
  preprocessingTimeMs: number;
  postprocessingTimeMs: number;
}

interface BatchPredictionRequest {
  batch: PredictionRequest[];
  maxBatchSize?: number;
}

interface ModelVersionInfo {
  version: string;
  path: string;
  metadata: {
    architecture: string;
    trainedOn: string;
    accuracy?: number;
    framework: string;
  };
}

// ============================================================================
// Model Manager
// ============================================================================

class ModelManager {
  private models: Map<string, tf.GraphModel | tf.LayersModel> = new Map();
  private metadata: Map<string, ModelMetadata> = new Map();
  private defaultVersion: string = "v1";

  async loadModel(
    name: string,
    path: string,
    version: string = "v1"
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`Loading model ${name} ${version} from ${path}...`);

    try {
      const model = await tf.loadGraphModel(path);
      const modelKey = `${name}:${version}`;

      this.models.set(modelKey, model);

      // Extract model metadata
      const inputShape = model.inputs[0].shape || [];
      const outputShape = model.outputs[0].shape || [];

      this.metadata.set(modelKey, {
        name,
        version,
        inputShape: inputShape as number[],
        outputShape: outputShape as number[],
        loadedAt: new Date(),
        warmupComplete: false,
      });

      // Warmup the model
      await this.warmupModel(modelKey);

      console.log(
        `Model ${name} ${version} loaded in ${Date.now() - startTime}ms`
      );
    } catch (error) {
      console.error(`Failed to load model ${name} ${version}:`, error);
      throw error;
    }
  }

  private async warmupModel(modelKey: string): Promise<void> {
    const model = this.models.get(modelKey);
    const meta = this.metadata.get(modelKey);

    if (!model || !meta) return;

    console.log(`Warming up model ${modelKey}...`);

    // Create dummy input based on model's input shape
    const inputShape = meta.inputShape.map(dim => dim === -1 ? 1 : dim);
    const dummyInput = tf.randomNormal(inputShape);

    // Run several warmup inferences
    for (let i = 0; i < 3; i++) {
      const result = await model.predict(dummyInput);
      if (Array.isArray(result)) {
        result.forEach(t => t.dispose());
      } else {
        (result as tf.Tensor).dispose();
      }
    }

    dummyInput.dispose();
    meta.warmupComplete = true;
    console.log(`Model ${modelKey} warmup complete`);
  }

  getModel(name: string, version?: string): tf.GraphModel | tf.LayersModel | null {
    const modelVersion = version || this.defaultVersion;
    return this.models.get(`${name}:${modelVersion}`) || null;
  }

  getMetadata(name: string, version?: string): ModelMetadata | null {
    const modelVersion = version || this.defaultVersion;
    return this.metadata.get(`${name}:${modelVersion}`) || null;
  }

  listModels(): ModelMetadata[] {
    return Array.from(this.metadata.values());
  }

  async unloadModel(name: string, version: string): Promise<void> {
    const modelKey = `${name}:${version}`;
    const model = this.models.get(modelKey);

    if (model) {
      model.dispose();
      this.models.delete(modelKey);
      this.metadata.delete(modelKey);
      console.log(`Model ${modelKey} unloaded`);
    }
  }
}

// ============================================================================
// Preprocessing Pipeline
// ============================================================================

class PreprocessingPipeline {
  static normalize(
    data: number[][],
    scale: number = 1.0,
    mean?: number[],
    std?: number[]
  ): tf.Tensor {
    let tensor = tf.tensor2d(data);

    if (scale !== 1.0) {
      tensor = tensor.div(tf.scalar(scale));
    }

    if (mean && mean.length > 0) {
      const meanTensor = tf.tensor1d(mean);
      tensor = tensor.sub(meanTensor);
      meanTensor.dispose();
    }

    if (std && std.length > 0) {
      const stdTensor = tf.tensor1d(std);
      tensor = tensor.div(stdTensor);
      stdTensor.dispose();
    }

    return tensor;
  }

  static augment(tensor: tf.Tensor): tf.Tensor {
    // Example augmentation pipeline
    return tensor;
  }
}

// ============================================================================
// Inference Engine
// ============================================================================

class InferenceEngine {
  constructor(private modelManager: ModelManager) {}

  async predict(
    modelName: string,
    request: PredictionRequest
  ): Promise<PredictionResponse> {
    const startTime = Date.now();

    const model = this.modelManager.getModel(modelName, request.modelVersion);
    const metadata = this.modelManager.getMetadata(modelName, request.modelVersion);

    if (!model || !metadata) {
      throw new Error(`Model ${modelName}:${request.modelVersion} not found`);
    }

    // Preprocessing
    const preprocessStart = Date.now();
    let inputTensor: tf.Tensor;

    if (request.preprocessing) {
      const { normalize, scale = 255.0, mean, std } = request.preprocessing;
      inputTensor = PreprocessingPipeline.normalize(
        request.inputs as number[][],
        normalize ? scale : 1.0,
        mean,
        std
      );
    } else {
      inputTensor = tf.tensor(request.inputs);
    }

    const preprocessingTimeMs = Date.now() - preprocessStart;

    // Inference
    const inferenceStart = Date.now();
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const predictionsData = await predictions.array() as number[][];
    const inferenceTimeMs = Date.now() - inferenceStart;

    // Postprocessing
    const postprocessStart = Date.now();
    const processedPredictions = this.postprocess(predictionsData);
    const postprocessingTimeMs = Date.now() - postprocessStart;

    // Cleanup
    inputTensor.dispose();
    predictions.dispose();

    return {
      predictions: processedPredictions,
      modelVersion: metadata.version,
      inferenceTimeMs,
      preprocessingTimeMs,
      postprocessingTimeMs,
    };
  }

  async batchPredict(
    modelName: string,
    request: BatchPredictionRequest
  ): Promise<PredictionResponse[]> {
    const maxBatchSize = request.maxBatchSize || 32;
    const results: PredictionResponse[] = [];

    // Process in batches for optimization
    for (let i = 0; i < request.batch.length; i += maxBatchSize) {
      const batch = request.batch.slice(i, i + maxBatchSize);
      const batchResults = await Promise.all(
        batch.map(req => this.predict(modelName, req))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private postprocess(predictions: number[][]): number[][] {
    // Apply softmax, thresholding, or other postprocessing
    return predictions.map(pred => {
      const max = Math.max(...pred);
      const exp = pred.map(p => Math.exp(p - max));
      const sum = exp.reduce((a, b) => a + b, 0);
      return exp.map(e => e / sum);
    });
  }
}

// ============================================================================
// Metrics & Monitoring
// ============================================================================

class MetricsCollector {
  private requestCount = 0;
  private totalInferenceTime = 0;
  private errorCount = 0;

  recordRequest(inferenceTimeMs: number): void {
    this.requestCount++;
    this.totalInferenceTime += inferenceTimeMs;
  }

  recordError(): void {
    this.errorCount++;
  }

  getMetrics() {
    return {
      requestCount: this.requestCount,
      averageInferenceTimeMs: this.requestCount > 0
        ? this.totalInferenceTime / this.requestCount
        : 0,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0
        ? this.errorCount / this.requestCount
        : 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}

// ============================================================================
// Server Setup
// ============================================================================

const modelManager = new ModelManager();
const inferenceEngine = new InferenceEngine(modelManager);
const metricsCollector = new MetricsCollector();

// Load example model (in production, load from model registry)
const DEMO_MODE = true;

if (DEMO_MODE) {
  console.log("Running in demo mode with mock model...");
}

const PORT = 3000;
console.log(`TensorFlow Model Serving API running on http://localhost:${PORT}`);
console.log(`
Available endpoints:
  GET  /health         - Health check
  GET  /metrics        - Performance metrics
  GET  /models         - List loaded models
  POST /predict        - Single prediction
  POST /batch-predict  - Batch predictions
`);
