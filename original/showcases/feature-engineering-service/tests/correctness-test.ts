/**
 * Correctness Tests - Validate feature computation accuracy
 *
 * Ensures features are mathematically correct and consistent
 */

import * as http from 'http';

const BASE_URL = 'http://localhost:3000';

interface Features {
  value_mean?: number;
  value_std?: number;
  value_min?: number;
  value_max?: number;
  value_median?: number;
  z_score?: number;
  percentile_rank?: number;
  trend_7d?: number;
  volatility?: number;
}

async function getFeatures(entityId: string): Promise<Features> {
  return new Promise((resolve, reject) => {
    const url = new URL('/features', BASE_URL);
    const body = JSON.stringify({ entity_id: entityId });

    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        resolve(response.features);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runCorrectnessTests(): Promise<void> {
  console.log('🔬 Running Correctness Tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Statistical invariants
  console.log('Testing: Statistical Invariants');
  try {
    const features = await getFeatures('correctness_test_1');

    // Mean should be between min and max
    if (features.value_mean! < features.value_min! || features.value_mean! > features.value_max!) {
      throw new Error('Mean not between min and max');
    }

    // Median should be between min and max
    if (features.value_median! < features.value_min! || features.value_median! > features.value_max!) {
      throw new Error('Median not between min and max');
    }

    // Standard deviation should be non-negative
    if (features.value_std! < 0) {
      throw new Error('Standard deviation is negative');
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Test 2: Feature consistency across requests
  console.log('Testing: Feature Consistency');
  try {
    const entityId = 'consistency_test';

    const features1 = await getFeatures(entityId);
    const features2 = await getFeatures(entityId);

    // Features should be identical for same entity
    if (features1.value_mean !== features2.value_mean) {
      throw new Error('Features not consistent across requests');
    }

    if (features1.trend_7d !== features2.trend_7d) {
      throw new Error('Trend features not consistent');
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Test 3: Percentile rank bounds
  console.log('Testing: Percentile Rank Bounds');
  try {
    const features = await getFeatures('percentile_test');

    if (features.percentile_rank! < 0 || features.percentile_rank! > 1) {
      throw new Error(`Percentile rank out of bounds: ${features.percentile_rank}`);
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Test 4: Z-score reasonableness
  console.log('Testing: Z-Score Reasonableness');
  try {
    const features = await getFeatures('zscore_test');

    // Z-scores beyond ±10 are extremely unlikely
    if (Math.abs(features.z_score!) > 10) {
      throw new Error(`Z-score too extreme: ${features.z_score}`);
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Test 5: Volatility non-negativity
  console.log('Testing: Volatility Non-Negativity');
  try {
    const features = await getFeatures('volatility_test');

    if (features.volatility! < 0) {
      throw new Error(`Volatility is negative: ${features.volatility}`);
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Test 6: Feature determinism
  console.log('Testing: Feature Determinism');
  try {
    // Clear cache first
    await new Promise((resolve, reject) => {
      const url = new URL('/cache/clear', BASE_URL);
      const req = http.request(url, { method: 'POST' }, resolve);
      req.on('error', reject);
      req.end();
    });

    // Get features twice (both compute, no cache)
    const entityId = 'determinism_test';

    const features1 = await getFeatures(entityId);

    // Clear cache again
    await new Promise((resolve, reject) => {
      const url = new URL('/cache/clear', BASE_URL);
      const req = http.request(url, { method: 'POST' }, resolve);
      req.on('error', reject);
      req.end();
    });

    const features2 = await getFeatures(entityId);

    // All features should be identical
    const keys = Object.keys(features1) as Array<keyof Features>;
    for (const key of keys) {
      if (features1[key] !== features2[key]) {
        throw new Error(`Feature ${key} not deterministic: ${features1[key]} vs ${features2[key]}`);
      }
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Test 7: Batch consistency
  console.log('Testing: Batch vs Single Consistency');
  try {
    const entityIds = ['batch_single_1', 'batch_single_2', 'batch_single_3'];

    // Get single features
    const singleFeatures = await Promise.all(
      entityIds.map(id => getFeatures(id))
    );

    // Get batch features
    const batchResponse = await new Promise<any>((resolve, reject) => {
      const url = new URL('/features/batch', BASE_URL);
      const body = JSON.stringify({ entity_ids: entityIds });

      const req = http.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });

    // Compare features
    for (let i = 0; i < entityIds.length; i++) {
      const single = singleFeatures[i];
      const batch = batchResponse.features[i].features;

      if (single.value_mean !== batch.value_mean) {
        throw new Error('Batch and single features differ');
      }
    }

    console.log('✅ Pass\n');
    passed++;
  } catch (error) {
    console.log(`❌ Fail: ${error}\n`);
    failed++;
  }

  // Print summary
  console.log('📊 Correctness Test Summary:\n');
  console.log(`Total: ${passed + failed} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runCorrectnessTests().catch(error => {
  console.error('Correctness tests failed:', error);
  process.exit(1);
});
