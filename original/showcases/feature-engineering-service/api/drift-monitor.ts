/**
 * Drift Monitor - Tracks feature drift over time
 *
 * Detects distribution changes in features to identify model degradation
 */

import { FeatureStore, Features } from './feature-store';

interface FeatureStats {
  count: number;
  sum: number;
  sumSquared: number;
  min: number;
  max: number;
  mean: number;
  variance: number;
  stdDev: number;
}

interface DriftMetrics {
  feature: string;
  baseline: FeatureStats;
  current: FeatureStats;
  drift_score: number;
  is_drifting: boolean;
}

export class DriftMonitor {
  private featureStore: FeatureStore;
  private baseline: Map<string, FeatureStats> = new Map();
  private current: Map<string, FeatureStats> = new Map();
  private trackingStartTime: number;
  private lastCheckTime: number;
  private driftThreshold: number;
  private checkInterval: number;
  private totalTracked = 0;

  constructor(featureStore: FeatureStore) {
    this.featureStore = featureStore;
    this.trackingStartTime = Date.now();
    this.lastCheckTime = Date.now();
    this.driftThreshold = parseFloat(process.env.DRIFT_THRESHOLD || '0.15');
    this.checkInterval = parseInt(process.env.DRIFT_CHECK_INTERVAL_MS || '60000', 10);

    // Initialize baseline from feature store (simulated for demo)
    this.initializeBaseline();
  }

  /**
   * Track features for drift detection
   */
  track(entityId: string, features: Features): void {
    this.totalTracked++;

    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number' && !isNaN(value)) {
        this.updateStats(this.current, key, value);
      }
    }

    // Periodic drift check
    if (Date.now() - this.lastCheckTime > this.checkInterval) {
      this.checkDrift();
      this.lastCheckTime = Date.now();
    }
  }

  /**
   * Update running statistics for a feature
   */
  private updateStats(map: Map<string, FeatureStats>, feature: string, value: number): void {
    const existing = map.get(feature);

    if (!existing) {
      map.set(feature, {
        count: 1,
        sum: value,
        sumSquared: value * value,
        min: value,
        max: value,
        mean: value,
        variance: 0,
        stdDev: 0,
      });
    } else {
      const count = existing.count + 1;
      const sum = existing.sum + value;
      const sumSquared = existing.sumSquared + value * value;
      const mean = sum / count;
      const variance = (sumSquared / count) - (mean * mean);
      const stdDev = Math.sqrt(Math.max(0, variance));

      map.set(feature, {
        count,
        sum,
        sumSquared,
        min: Math.min(existing.min, value),
        max: Math.max(existing.max, value),
        mean,
        variance,
        stdDev,
      });
    }
  }

  /**
   * Calculate drift between baseline and current distributions
   */
  private checkDrift(): void {
    const driftMetrics: DriftMetrics[] = [];

    for (const [feature, currentStats] of this.current.entries()) {
      const baselineStats = this.baseline.get(feature);
      if (!baselineStats || currentStats.count < 30) {
        continue; // Need enough samples for statistical significance
      }

      // Calculate Population Stability Index (PSI) approximation
      const driftScore = this.calculateDrift(baselineStats, currentStats);
      const isDrifting = driftScore > this.driftThreshold;

      driftMetrics.push({
        feature,
        baseline: baselineStats,
        current: currentStats,
        drift_score: driftScore,
        is_drifting: isDrifting,
      });

      if (isDrifting) {
        console.warn(`⚠️  Drift detected in feature '${feature}': score=${driftScore.toFixed(4)}`);
      }
    }

    // Reset current window for next period
    this.current.clear();
  }

  /**
   * Calculate drift score using statistical distance
   */
  private calculateDrift(baseline: FeatureStats, current: FeatureStats): number {
    // Normalized difference in means
    const baselineRange = Math.max(baseline.max - baseline.min, 0.0001);
    const meanDiff = Math.abs(baseline.mean - current.mean) / baselineRange;

    // Coefficient of variation difference
    const baselineCV = baseline.stdDev / Math.max(Math.abs(baseline.mean), 0.0001);
    const currentCV = current.stdDev / Math.max(Math.abs(current.mean), 0.0001);
    const cvDiff = Math.abs(baselineCV - currentCV);

    // Combined drift score (weighted average)
    return 0.7 * meanDiff + 0.3 * cvDiff;
  }

  /**
   * Initialize baseline statistics (simulated for demo)
   */
  private initializeBaseline(): void {
    // Simulate baseline statistics for common features
    const baselineData = {
      value_mean: { mean: 50, stdDev: 15, min: 0, max: 100 },
      value_std: { mean: 10, stdDev: 3, min: 0, max: 30 },
      trend_7d: { mean: 0.02, stdDev: 0.5, min: -2, max: 2 },
      trend_30d: { mean: 0.05, stdDev: 0.3, min: -1, max: 1 },
      volatility: { mean: 0.15, stdDev: 0.08, min: 0, max: 1 },
      z_score: { mean: 0, stdDev: 1, min: -4, max: 4 },
      percentile_rank: { mean: 0.5, stdDev: 0.29, min: 0, max: 1 },
    };

    for (const [feature, stats] of Object.entries(baselineData)) {
      this.baseline.set(feature, {
        count: 1000,
        sum: stats.mean * 1000,
        sumSquared: (stats.stdDev * stats.stdDev + stats.mean * stats.mean) * 1000,
        min: stats.min,
        max: stats.max,
        mean: stats.mean,
        variance: stats.stdDev * stats.stdDev,
        stdDev: stats.stdDev,
      });
    }
  }

  /**
   * Get drift monitoring report
   */
  getReport() {
    const driftingFeatures: DriftMetrics[] = [];

    for (const [feature, currentStats] of this.current.entries()) {
      const baselineStats = this.baseline.get(feature);
      if (!baselineStats) continue;

      const driftScore = this.calculateDrift(baselineStats, currentStats);
      const isDrifting = driftScore > this.driftThreshold;

      if (isDrifting) {
        driftingFeatures.push({
          feature,
          baseline: baselineStats,
          current: currentStats,
          drift_score: driftScore,
          is_drifting: isDrifting,
        });
      }
    }

    return {
      monitoring_since: new Date(this.trackingStartTime).toISOString(),
      total_tracked: this.totalTracked,
      drift_threshold: this.driftThreshold,
      features_monitored: this.baseline.size,
      drifting_features: driftingFeatures.length,
      drift_details: driftingFeatures,
      status: driftingFeatures.length === 0 ? 'healthy' : 'drift_detected',
    };
  }

  /**
   * Get drift monitoring statistics
   */
  getStats() {
    return {
      total_tracked: this.totalTracked,
      baseline_features: this.baseline.size,
      current_window_size: this.current.size,
      drift_threshold: this.driftThreshold,
      check_interval_ms: this.checkInterval,
      monitoring_duration_s: (Date.now() - this.trackingStartTime) / 1000,
    };
  }
}
