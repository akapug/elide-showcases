/**
 * Feature Store - Core feature computation and retrieval
 *
 * Orchestrates feature generation using Python pandas/NumPy
 * with intelligent caching for <1ms latency
 */

import { spawn } from 'child_process';
import { FeatureCache } from './feature-cache';
import * as path from 'path';

export interface Features {
  // Statistical features
  value_mean?: number;
  value_std?: number;
  value_min?: number;
  value_max?: number;
  value_median?: number;
  value_q25?: number;
  value_q75?: number;
  value_iqr?: number;

  // Time-based features
  day_of_week?: number;
  hour_of_day?: number;
  is_weekend?: boolean;
  is_business_hours?: boolean;

  // Trend features
  trend_7d?: number;
  trend_30d?: number;
  momentum?: number;
  volatility?: number;

  // Categorical features
  category_encoded?: number;
  frequency?: number;
  recency_days?: number;

  // Engineered features
  ratio_to_mean?: number;
  z_score?: number;
  percentile_rank?: number;

  // Hash features
  entity_hash?: number;
  interaction_hash?: number;
}

export class FeatureStore {
  private cache: FeatureCache;
  private pythonPath: string;
  private featureScript: string;
  private computeCount = 0;
  private cacheHits = 0;
  private totalLatency = 0;

  constructor(cache: FeatureCache) {
    this.cache = cache;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.featureScript = path.join(__dirname, '../features/compute_features.py');
  }

  /**
   * Get features for a single entity with caching
   */
  async getFeatures(
    entityId: string,
    requestedFeatures?: string[],
    version: string = 'v1'
  ): Promise<Features> {
    const cacheKey = `${version}:${entityId}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cacheHits++;
      return this.filterFeatures(cached, requestedFeatures);
    }

    // Compute features using Python
    const startTime = Date.now();
    const features = await this.computeFeatures(entityId);
    const latency = Date.now() - startTime;

    this.computeCount++;
    this.totalLatency += latency;

    // Cache the result
    this.cache.set(cacheKey, features);

    return this.filterFeatures(features, requestedFeatures);
  }

  /**
   * Get features for multiple entities in batch
   */
  async getBatchFeatures(
    entityIds: string[],
    requestedFeatures?: string[]
  ): Promise<Array<{ entity_id: string; features: Features }>> {
    // Check which entities are in cache
    const results: Array<{ entity_id: string; features: Features }> = [];
    const uncachedIds: string[] = [];

    for (const entityId of entityIds) {
      const cached = this.cache.get(`v1:${entityId}`);
      if (cached) {
        this.cacheHits++;
        results.push({
          entity_id: entityId,
          features: this.filterFeatures(cached, requestedFeatures),
        });
      } else {
        uncachedIds.push(entityId);
      }
    }

    // Compute features for uncached entities
    if (uncachedIds.length > 0) {
      const computed = await this.computeBatchFeatures(uncachedIds);
      for (let i = 0; i < uncachedIds.length; i++) {
        const entityId = uncachedIds[i];
        const features = computed[i];

        this.cache.set(`v1:${entityId}`, features);
        results.push({
          entity_id: entityId,
          features: this.filterFeatures(features, requestedFeatures),
        });
      }
      this.computeCount += uncachedIds.length;
    }

    return results;
  }

  /**
   * Compute features for a single entity using Python
   */
  private async computeFeatures(entityId: string): Promise<Features> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [
        this.featureScript,
        'single',
        entityId,
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result.features);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Compute features for multiple entities in batch
   */
  private async computeBatchFeatures(entityIds: string[]): Promise<Features[]> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, [
        this.featureScript,
        'batch',
        JSON.stringify(entityIds),
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result.features);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Filter features based on requested feature names
   */
  private filterFeatures(features: Features, requestedFeatures?: string[]): Features {
    if (!requestedFeatures || requestedFeatures.length === 0) {
      return features;
    }

    const filtered: Features = {};
    for (const key of requestedFeatures) {
      if (key in features) {
        (filtered as any)[key] = (features as any)[key];
      }
    }
    return filtered;
  }

  /**
   * Get feature computation statistics
   */
  getFeatureStats() {
    return {
      total_computes: this.computeCount,
      cache_hits: this.cacheHits,
      cache_hit_rate: this.computeCount > 0
        ? this.cacheHits / (this.computeCount + this.cacheHits)
        : 0,
      avg_compute_latency_ms: this.computeCount > 0
        ? this.totalLatency / this.computeCount
        : 0,
      cache_stats: this.cache.getStats(),
    };
  }

  /**
   * Clear all cached features
   */
  clearCache() {
    this.cache.clear();
  }
}
