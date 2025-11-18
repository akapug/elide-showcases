/**
 * Model management: loading, versioning, and hot-swapping.
 * Supports multiple algorithms and model versions.
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

export type Algorithm = 'isolation_forest' | 'lof' | 'one_class_svm' | 'timeseries' | 'ensemble';

export interface ModelMetadata {
  algorithm: Algorithm;
  version: string;
  trainedAt: number;
  nSamples: number;
  nFeatures: number;
  contamination: number;
  performance?: {
    trainingTime: number;
    anomalyRate: number;
    scoreStats?: Record<string, number>;
  };
}

export interface ModelInfo {
  path: string;
  metadata: ModelMetadata;
  loaded: boolean;
  lastUsed?: number;
}

export interface PredictionResult {
  status: 'success' | 'error';
  algorithm?: Algorithm;
  results?: Array<{
    index: number;
    is_anomaly: boolean;
    anomaly_score: number;
    confidence: number;
  }>;
  summary?: {
    total_anomalies: number;
    anomaly_rate: number;
    mean_score: number;
  };
  scoring_time_ms?: number;
  message?: string;
}

export class ModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private modelsDir: string;
  private currentModel?: string;
  private pythonPath: string;

  constructor(
    modelsDir: string = './models',
    pythonPath: string = 'python3'
  ) {
    this.modelsDir = modelsDir;
    this.pythonPath = pythonPath;
  }

  /**
   * Initialize the model manager and scan for models.
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
      await this.scanModels();
    } catch (error) {
      console.error('Failed to initialize ModelManager:', error);
      throw error;
    }
  }

  /**
   * Scan the models directory for available models.
   */
  async scanModels(): Promise<ModelInfo[]> {
    try {
      const files = await fs.readdir(this.modelsDir);
      const modelFiles = files.filter(f => f.endsWith('.joblib'));

      for (const file of modelFiles) {
        const modelPath = path.join(this.modelsDir, file);
        const modelName = path.basename(file, '.joblib');

        // Try to load metadata
        const metadataPath = path.join(this.modelsDir, `${modelName}.meta.json`);
        let metadata: ModelMetadata | undefined;

        try {
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          metadata = JSON.parse(metaContent);
        } catch {
          // Generate default metadata
          metadata = {
            algorithm: this.inferAlgorithm(modelName),
            version: '1.0.0',
            trainedAt: Date.now(),
            nSamples: 0,
            nFeatures: 0,
            contamination: 0.1
          };
        }

        this.models.set(modelName, {
          path: modelPath,
          metadata,
          loaded: false
        });
      }

      return Array.from(this.models.values());
    } catch (error) {
      console.error('Failed to scan models:', error);
      return [];
    }
  }

  /**
   * Load a specific model.
   */
  async loadModel(modelName: string): Promise<boolean> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    try {
      // Verify model file exists
      await fs.access(model.path);
      model.loaded = true;
      this.currentModel = modelName;
      return true;
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Predict anomalies using the current model.
   */
  async predict(
    data: number[][],
    algorithm?: Algorithm,
    timeout: number = 5000
  ): Promise<PredictionResult> {
    const modelName = algorithm || this.currentModel;
    if (!modelName) {
      return {
        status: 'error',
        message: 'No model loaded'
      };
    }

    const model = this.models.get(modelName);
    if (!model) {
      return {
        status: 'error',
        message: `Model not found: ${modelName}`
      };
    }

    try {
      const result = await this.runPythonPredict(
        model.metadata.algorithm,
        model.path,
        data,
        timeout
      );

      model.lastUsed = Date.now();
      return result;
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Prediction failed'
      };
    }
  }

  /**
   * Train a new model.
   */
  async trainModel(
    algorithm: Algorithm,
    data: number[][],
    config: Record<string, any> = {}
  ): Promise<ModelMetadata> {
    const modelName = `${algorithm}_${Date.now()}`;
    const modelPath = path.join(this.modelsDir, `${modelName}.joblib`);

    const inputData = {
      data,
      model_path: modelPath,
      ...config
    };

    const result = await this.runPythonTrain(algorithm, inputData);

    if (result.status === 'success') {
      const metadata: ModelMetadata = {
        algorithm,
        version: '1.0.0',
        trainedAt: Date.now(),
        nSamples: result.n_samples || data.length,
        nFeatures: result.n_features || data[0].length,
        contamination: config.contamination || 0.1,
        performance: {
          trainingTime: result.training_time_ms || 0,
          anomalyRate: result.anomalies_detected / data.length || 0,
          scoreStats: result.score_stats
        }
      };

      // Save metadata
      const metadataPath = path.join(this.modelsDir, `${modelName}.meta.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Register model
      this.models.set(modelName, {
        path: modelPath,
        metadata,
        loaded: true
      });

      return metadata;
    } else {
      throw new Error(result.message || 'Training failed');
    }
  }

  /**
   * Run Python script for prediction.
   */
  private async runPythonPredict(
    algorithm: Algorithm,
    modelPath: string,
    data: number[][],
    timeout: number
  ): Promise<PredictionResult> {
    const scriptPath = path.join(__dirname, '..', 'ml', `${algorithm}.py`);
    const inputData = JSON.stringify({ data, model_path: modelPath });

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonPath, [scriptPath, 'predict'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      const timeoutId = setTimeout(() => {
        proc.kill();
        reject(new Error(`Prediction timeout after ${timeout}ms`));
      }, timeout);

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);

        if (code !== 0) {
          reject(new Error(`Python process failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse result: ${stdout}`));
        }
      });

      proc.stdin.write(inputData);
      proc.stdin.end();
    });
  }

  /**
   * Run Python script for training.
   */
  private async runPythonTrain(
    algorithm: Algorithm,
    inputData: Record<string, any>
  ): Promise<any> {
    const scriptPath = path.join(__dirname, '..', 'ml', `${algorithm}.py`);

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonPath, [scriptPath, 'train'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Training failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse result: ${stdout}`));
        }
      });

      proc.stdin.write(JSON.stringify(inputData));
      proc.stdin.end();
    });
  }

  /**
   * Infer algorithm from model name.
   */
  private inferAlgorithm(modelName: string): Algorithm {
    if (modelName.includes('isolation_forest')) return 'isolation_forest';
    if (modelName.includes('lof')) return 'lof';
    if (modelName.includes('svm')) return 'one_class_svm';
    if (modelName.includes('timeseries')) return 'timeseries';
    return 'isolation_forest';
  }

  /**
   * Get all available models.
   */
  getModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  /**
   * Get current model info.
   */
  getCurrentModel(): ModelInfo | undefined {
    if (!this.currentModel) return undefined;
    return this.models.get(this.currentModel);
  }

  /**
   * Delete a model.
   */
  async deleteModel(modelName: string): Promise<boolean> {
    const model = this.models.get(modelName);
    if (!model) return false;

    try {
      await fs.unlink(model.path);
      const metadataPath = model.path.replace('.joblib', '.meta.json');
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file might not exist
      }

      this.models.delete(modelName);
      if (this.currentModel === modelName) {
        this.currentModel = undefined;
      }

      return true;
    } catch (error) {
      console.error(`Failed to delete model ${modelName}:`, error);
      return false;
    }
  }
}
