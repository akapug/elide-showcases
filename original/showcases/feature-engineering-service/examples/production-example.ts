/**
 * Production Example - Real-world usage patterns
 *
 * Demonstrates how to integrate the feature engineering service
 * in production ML systems
 */

import * as http from 'http';

const FEATURE_STORE_URL = process.env.FEATURE_STORE_URL || 'http://localhost:3000';

interface Features {
  [key: string]: number | boolean;
}

/**
 * Example 1: Real-time ML Inference
 *
 * Get features for immediate prediction
 */
async function realtimeInference(userId: string): Promise<number> {
  console.log(`\n🔮 Real-time Inference for user: ${userId}`);

  const startTime = Date.now();

  // Step 1: Get features from feature store
  const features = await getFeatures(userId, [
    'value_mean',
    'trend_7d',
    'trend_30d',
    'z_score',
    'percentile_rank',
    'volatility',
  ]);

  const featureLatency = Date.now() - startTime;
  console.log(`   Features retrieved in ${featureLatency}ms`);

  // Step 2: Run ML model prediction (simulated)
  const prediction = runModel(features);

  const totalLatency = Date.now() - startTime;
  console.log(`   Prediction: ${prediction.toFixed(4)}`);
  console.log(`   Total latency: ${totalLatency}ms`);

  return prediction;
}

/**
 * Example 2: Batch Training Data Generation
 *
 * Generate features for model training
 */
async function generateTrainingData(userIds: string[]): Promise<void> {
  console.log(`\n📚 Generating training data for ${userIds.length} users`);

  const startTime = Date.now();

  // Get features in batches for efficiency
  const batchSize = 100;
  const allFeatures: Array<{ userId: string; features: Features }> = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(userIds.length / batchSize)}...`);

    const batchFeatures = await getBatchFeatures(batch);
    allFeatures.push(...batchFeatures);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`   ✅ Generated ${allFeatures.length} feature sets in ${totalTime.toFixed(2)}s`);
  console.log(`   Throughput: ${(allFeatures.length / totalTime).toFixed(0)} users/sec`);

  // Export to training format (e.g., CSV, Parquet)
  exportForTraining(allFeatures);
}

/**
 * Example 3: Feature Monitoring
 *
 * Monitor feature drift and alert on anomalies
 */
async function monitorFeatures(): Promise<void> {
  console.log('\n📊 Monitoring Feature Health');

  // Get drift report
  const driftReport = await getDriftReport();

  console.log(`   Status: ${driftReport.status}`);
  console.log(`   Features monitored: ${driftReport.features_monitored}`);
  console.log(`   Drifting features: ${driftReport.drifting_features}`);

  if (driftReport.status === 'drift_detected') {
    console.log('\n   ⚠️  DRIFT ALERT:');

    for (const drift of driftReport.drift_details) {
      console.log(`   - ${drift.feature}`);
      console.log(`     Drift score: ${drift.drift_score.toFixed(4)}`);
      console.log(`     Baseline mean: ${drift.baseline.mean.toFixed(2)}`);
      console.log(`     Current mean: ${drift.current.mean.toFixed(2)}`);
      console.log(`     Change: ${((drift.current.mean / drift.baseline.mean - 1) * 100).toFixed(1)}%`);

      // Send alert (integrate with monitoring system)
      sendAlert('Feature Drift Detected', {
        feature: drift.feature,
        score: drift.drift_score,
      });
    }

    console.log('\n   📢 Recommendation: Consider model retraining');
  } else {
    console.log('   ✅ All features within normal range');
  }
}

/**
 * Example 4: A/B Test Feature Comparison
 *
 * Compare feature distributions between control and treatment groups
 */
async function compareABTestFeatures(
  controlUsers: string[],
  treatmentUsers: string[]
): Promise<void> {
  console.log('\n🧪 A/B Test Feature Comparison');

  // Get features for both groups
  const controlFeatures = await getBatchFeatures(controlUsers.slice(0, 100));
  const treatmentFeatures = await getBatchFeatures(treatmentUsers.slice(0, 100));

  // Analyze feature distributions
  const analysis = analyzeFeatureDistributions(controlFeatures, treatmentFeatures);

  console.log(`   Control group: ${controlUsers.length} users`);
  console.log(`   Treatment group: ${treatmentUsers.length} users`);
  console.log('');
  console.log('   Feature Statistics:');

  for (const [feature, stats] of Object.entries(analysis)) {
    console.log(`   ${feature}:`);
    console.log(`     Control mean: ${(stats as any).control.mean.toFixed(3)}`);
    console.log(`     Treatment mean: ${(stats as any).treatment.mean.toFixed(3)}`);
    console.log(`     Difference: ${((stats as any).difference * 100).toFixed(2)}%`);
    console.log(`     Statistical significance: ${(stats as any).significant ? 'Yes' : 'No'}`);
  }
}

/**
 * Example 5: Feature Validation Pipeline
 *
 * Validate feature quality before model deployment
 */
async function validateFeatureQuality(sampleUserIds: string[]): Promise<boolean> {
  console.log('\n✅ Validating Feature Quality');

  const features = await getBatchFeatures(sampleUserIds);
  let passed = true;

  // Check 1: No null/NaN values
  console.log('   Checking for null/NaN values...');
  const hasNulls = features.some(f =>
    Object.values(f.features).some(v => v === null || v === undefined || Number.isNaN(v))
  );

  if (hasNulls) {
    console.log('   ❌ Found null/NaN values');
    passed = false;
  } else {
    console.log('   ✅ No null/NaN values');
  }

  // Check 2: Feature ranges
  console.log('   Checking feature ranges...');
  const outOfRange = validateFeatureRanges(features);

  if (outOfRange.length > 0) {
    console.log(`   ❌ Features out of expected range: ${outOfRange.join(', ')}`);
    passed = false;
  } else {
    console.log('   ✅ All features within expected ranges');
  }

  // Check 3: Feature correlations
  console.log('   Checking feature correlations...');
  const highCorrelations = findHighCorrelations(features);

  if (highCorrelations.length > 0) {
    console.log(`   ⚠️  High correlations found: ${highCorrelations.length} pairs`);
    // Not a failure, but worth noting
  } else {
    console.log('   ✅ No problematic correlations');
  }

  console.log('');
  console.log(passed ? '   ✅ Feature validation PASSED' : '   ❌ Feature validation FAILED');

  return passed;
}

/**
 * Example 6: Feature Caching Strategy
 *
 * Optimize cache usage for different access patterns
 */
async function optimizeCacheStrategy(): Promise<void> {
  console.log('\n🚀 Optimizing Cache Strategy');

  // Get current cache statistics
  const stats = await getFeatureStats();

  console.log(`   Current cache hit rate: ${(stats.cache_hit_rate * 100).toFixed(1)}%`);
  console.log(`   Cache size: ${stats.cache_stats.size} / ${stats.cache_stats.max_size}`);
  console.log(`   Utilization: ${(stats.cache_stats.utilization * 100).toFixed(1)}%`);

  // Recommendations based on cache performance
  if (stats.cache_hit_rate < 0.7) {
    console.log('\n   ⚠️  Low cache hit rate (<70%)');
    console.log('   Recommendations:');
    console.log('   1. Increase CACHE_MAX_SIZE');
    console.log('   2. Increase CACHE_TTL_MS');
    console.log('   3. Pre-warm cache for common entities');
  } else if (stats.cache_hit_rate > 0.95 && stats.cache_stats.utilization < 0.5) {
    console.log('\n   ℹ️  Excellent hit rate with low utilization');
    console.log('   Recommendation: Consider reducing CACHE_MAX_SIZE to save memory');
  } else {
    console.log('\n   ✅ Cache performance is optimal');
  }
}

// Helper Functions

async function getFeatures(entityId: string, features?: string[]): Promise<Features> {
  return makeRequest('POST', '/features', {
    entity_id: entityId,
    features,
  }).then(res => res.features);
}

async function getBatchFeatures(
  entityIds: string[]
): Promise<Array<{ userId: string; features: Features }>> {
  return makeRequest('POST', '/features/batch', {
    entity_ids: entityIds,
  }).then(res =>
    res.features.map((f: any) => ({
      userId: f.entity_id,
      features: f.features,
    }))
  );
}

async function getDriftReport(): Promise<any> {
  return makeRequest('GET', '/drift/report');
}

async function getFeatureStats(): Promise<any> {
  return makeRequest('GET', '/features/stats');
}

function makeRequest(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, FEATURE_STORE_URL);

    const req = http.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function runModel(features: Features): number {
  // Simulated ML model
  // In production, this would call your actual ML model
  let score = 0.5;

  if (features.z_score > 2) score += 0.2;
  if (features.trend_7d > 0) score += 0.1;
  if (features.volatility < 0.1) score += 0.15;

  return Math.min(Math.max(score, 0), 1);
}

function exportForTraining(data: Array<{ userId: string; features: Features }>): void {
  console.log('\n   📦 Exporting training data...');
  // In production: write to S3, GCS, or data warehouse
  console.log(`   ✅ Exported ${data.length} records`);
}

function sendAlert(title: string, data: any): void {
  console.log(`\n   📢 ALERT: ${title}`);
  console.log(`   Data:`, JSON.stringify(data, null, 2));
  // In production: integrate with PagerDuty, Slack, etc.
}

function analyzeFeatureDistributions(
  control: Array<{ userId: string; features: Features }>,
  treatment: Array<{ userId: string; features: Features }>
): any {
  const analysis: any = {};

  // Sample analysis for first feature
  const featureKey = Object.keys(control[0].features)[0];

  const controlValues = control.map(u => (u.features as any)[featureKey]);
  const treatmentValues = treatment.map(u => (u.features as any)[featureKey]);

  const controlMean = controlValues.reduce((a, b) => a + b, 0) / controlValues.length;
  const treatmentMean = treatmentValues.reduce((a, b) => a + b, 0) / treatmentValues.length;

  analysis[featureKey] = {
    control: { mean: controlMean },
    treatment: { mean: treatmentMean },
    difference: (treatmentMean - controlMean) / controlMean,
    significant: Math.abs(treatmentMean - controlMean) > controlMean * 0.05,
  };

  return analysis;
}

function validateFeatureRanges(
  features: Array<{ userId: string; features: Features }>
): string[] {
  const outOfRange: string[] = [];

  // Example validation rules
  for (const f of features) {
    if (f.features.percentile_rank && (f.features.percentile_rank < 0 || f.features.percentile_rank > 1)) {
      outOfRange.push('percentile_rank');
    }
    if (f.features.volatility && f.features.volatility < 0) {
      outOfRange.push('volatility');
    }
  }

  return [...new Set(outOfRange)];
}

function findHighCorrelations(
  features: Array<{ userId: string; features: Features }>
): Array<[string, string]> {
  // Simplified correlation check
  // In production: use proper statistical correlation
  return [];
}

// Main execution
async function main(): Promise<void> {
  console.log('🚀 Feature Engineering Service - Production Examples\n');

  try {
    // Example 1: Real-time inference
    await realtimeInference('user_12345');

    // Example 2: Training data generation
    const trainingUsers = Array.from({ length: 500 }, (_, i) => `train_user_${i}`);
    await generateTrainingData(trainingUsers);

    // Example 3: Feature monitoring
    await monitorFeatures();

    // Example 4: A/B test comparison
    const controlUsers = Array.from({ length: 200 }, (_, i) => `control_${i}`);
    const treatmentUsers = Array.from({ length: 200 }, (_, i) => `treatment_${i}`);
    await compareABTestFeatures(controlUsers, treatmentUsers);

    // Example 5: Feature validation
    const sampleUsers = Array.from({ length: 100 }, (_, i) => `sample_${i}`);
    await validateFeatureQuality(sampleUsers);

    // Example 6: Cache optimization
    await optimizeCacheStrategy();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {
  realtimeInference,
  generateTrainingData,
  monitorFeatures,
  compareABTestFeatures,
  validateFeatureQuality,
  optimizeCacheStrategy,
};
