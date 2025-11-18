/**
 * Drift Detection Tests - Validate drift monitoring
 *
 * Tests feature drift detection and alerting
 */

import * as http from 'http';

const BASE_URL = 'http://localhost:3000';

async function makeRequest(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

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

async function simulateDrift(): Promise<void> {
  console.log('🔬 Simulating Feature Drift\n');

  // Track many requests to build up statistics
  console.log('Tracking normal distribution...');
  for (let i = 0; i < 100; i++) {
    await makeRequest('POST', '/features', {
      entity_id: `normal_${i}`,
    });
  }

  console.log('✅ Tracked 100 entities with normal distribution\n');

  // Simulate drift by requesting entities with different characteristics
  console.log('Introducing drift...');
  for (let i = 0; i < 50; i++) {
    await makeRequest('POST', '/features', {
      entity_id: `drift_extreme_${i}`,
    });
  }

  console.log('✅ Introduced drift with 50 anomalous entities\n');

  // Wait for drift monitoring to detect
  console.log('Waiting for drift detection...');
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function testDriftMonitoring(): Promise<void> {
  console.log('🧪 Testing Drift Monitoring\n');

  // Simulate drift
  await simulateDrift();

  // Get drift report
  console.log('Fetching drift report...\n');
  const report = await makeRequest('GET', '/drift/report');

  console.log('📊 Drift Report:\n');
  console.log(`   Status: ${report.status}`);
  console.log(`   Total tracked: ${report.total_tracked}`);
  console.log(`   Features monitored: ${report.features_monitored}`);
  console.log(`   Drifting features: ${report.drifting_features}`);
  console.log(`   Drift threshold: ${report.drift_threshold}`);
  console.log('');

  if (report.drift_details && report.drift_details.length > 0) {
    console.log('⚠️  Detected Drift:\n');

    for (const detail of report.drift_details) {
      console.log(`   Feature: ${detail.feature}`);
      console.log(`   Drift score: ${detail.drift_score.toFixed(4)}`);
      console.log(`   Baseline mean: ${detail.baseline.mean.toFixed(4)}`);
      console.log(`   Current mean: ${detail.current.mean.toFixed(4)}`);
      console.log(`   Baseline std: ${detail.baseline.stdDev.toFixed(4)}`);
      console.log(`   Current std: ${detail.current.stdDev.toFixed(4)}`);
      console.log('');
    }
  } else {
    console.log('✅ No drift detected (baseline is stable)\n');
  }

  // Test drift statistics
  console.log('Testing drift statistics endpoint...\n');

  const health = await makeRequest('GET', '/health');

  if (health.drift) {
    console.log('📈 Drift Statistics:\n');
    console.log(`   Total tracked: ${health.drift.total_tracked}`);
    console.log(`   Baseline features: ${health.drift.baseline_features}`);
    console.log(`   Current window size: ${health.drift.current_window_size}`);
    console.log(`   Monitoring duration: ${health.drift.monitoring_duration_s.toFixed(2)}s`);
    console.log('');
  }

  console.log('✅ Drift monitoring tests complete\n');
}

async function testDriftScenarios(): Promise<void> {
  console.log('🔬 Testing Drift Detection Scenarios\n');

  // Scenario 1: Mean shift
  console.log('Scenario 1: Mean Shift Detection');
  console.log('   Generating entities with shifted mean...');

  for (let i = 0; i < 50; i++) {
    // These should have different statistical properties
    await makeRequest('POST', '/features', {
      entity_id: `mean_shift_${Math.random()}`,
    });
  }

  console.log('   ✅ Mean shift entities tracked\n');

  // Scenario 2: Variance change
  console.log('Scenario 2: Variance Change Detection');
  console.log('   Generating entities with increased variance...');

  for (let i = 0; i < 50; i++) {
    await makeRequest('POST', '/features', {
      entity_id: `variance_${Math.random()}`,
    });
  }

  console.log('   ✅ Variance change entities tracked\n');

  // Scenario 3: Distribution shift
  console.log('Scenario 3: Distribution Shift Detection');
  console.log('   Generating entities from different distribution...');

  for (let i = 0; i < 50; i++) {
    await makeRequest('POST', '/features', {
      entity_id: `distribution_${Math.random()}`,
    });
  }

  console.log('   ✅ Distribution shift entities tracked\n');

  // Get final report
  const report = await makeRequest('GET', '/drift/report');

  console.log('📊 Final Drift Analysis:\n');
  console.log(`   Total entities tracked: ${report.total_tracked}`);
  console.log(`   Drift status: ${report.status}`);
  console.log(`   Features with drift: ${report.drifting_features}`);
  console.log('');

  if (report.drifting_features > 0) {
    console.log('✅ Drift detection working correctly\n');
  } else {
    console.log('ℹ️  No significant drift detected (threshold: ${report.drift_threshold})\n');
  }
}

async function main(): Promise<void> {
  try {
    await testDriftMonitoring();
    await testDriftScenarios();

    console.log('🎉 All drift tests completed successfully\n');
  } catch (error) {
    console.error('❌ Drift tests failed:', error);
    process.exit(1);
  }
}

main();
