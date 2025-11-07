/**
 * Deployment Tests
 *
 * Tests function deployment and versioning.
 */

import FunctionManager from '../control-plane/function-manager';
import DeploymentService from '../control-plane/deployment-service';
import * as fs from 'fs';

async function testDeployment() {
  console.log('=== Deployment Tests ===\n');

  // Setup
  const storageDir = './test-deploy-functions';
  if (fs.existsSync(storageDir)) {
    fs.rmSync(storageDir, { recursive: true });
  }

  const manager = new FunctionManager(storageDir);
  const service = new DeploymentService(manager);

  // Test 1: Deploy a new function
  console.log('Test 1: Deploy new function');
  try {
    const result = await service.deploy({
      name: 'test-func',
      code: 'export function handler() { return { ok: true }; }',
      runtime: 'typescript',
      env: { NODE_ENV: 'test' },
      memory: 128,
      timeout: 30,
      routes: ['/test'],
      tags: ['test'],
    });

    console.log('✓ Deployment successful');
    console.log(`  Function ID: ${result.functionId}`);
    console.log(`  Version: ${result.version}`);
    console.log(`  Duration: ${result.duration}ms\n`);
  } catch (error: any) {
    console.error('✗ Deployment failed:', error.message);
  }

  // Test 2: Update function
  console.log('Test 2: Update function');
  try {
    const result = await service.deploy({
      name: 'test-func',
      code: 'export function handler() { return { ok: true, updated: true }; }',
      runtime: 'typescript',
    });

    console.log('✓ Update successful');
    console.log(`  Version: ${result.version}`);
    console.log(`  Duration: ${result.duration}ms\n`);
  } catch (error: any) {
    console.error('✗ Update failed:', error.message);
  }

  // Test 3: List versions
  console.log('Test 3: List versions');
  try {
    const func = manager.get('test-func');
    if (func) {
      const versions = manager.listVersions(func.id);
      console.log('✓ Versions listed');
      console.log(`  Total versions: ${versions.length}`);
      versions.forEach((v) => {
        console.log(`  - ${v.version} (${v.active ? 'active' : 'inactive'})`);
      });
      console.log();
    }
  } catch (error: any) {
    console.error('✗ List versions failed:', error.message);
  }

  // Test 4: Rollback
  console.log('Test 4: Rollback to previous version');
  try {
    const func = manager.get('test-func');
    if (func) {
      const versions = manager.listVersions(func.id);
      if (versions.length >= 2) {
        const targetVersion = versions[0].version;
        const result = await service.rollback(func.id, targetVersion);

        console.log('✓ Rollback successful');
        console.log(`  Rolled back to: ${targetVersion}`);
        console.log(`  Duration: ${result.duration}ms\n`);
      }
    }
  } catch (error: any) {
    console.error('✗ Rollback failed:', error.message);
  }

  // Test 5: Deployment history
  console.log('Test 5: Deployment history');
  try {
    const history = service.getDeploymentHistory({ limit: 10 });

    console.log('✓ History retrieved');
    console.log(`  Total deployments: ${history.length}`);
    history.forEach((d) => {
      const status = d.success ? '✓' : '✗';
      console.log(`  ${status} ${d.functionId} v${d.version} (${d.duration}ms)`);
    });
    console.log();
  } catch (error: any) {
    console.error('✗ History retrieval failed:', error.message);
  }

  // Test 6: Deployment statistics
  console.log('Test 6: Deployment statistics');
  try {
    const stats = service.getStats();

    console.log('✓ Stats retrieved');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Successful: ${stats.successful}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Avg duration: ${stats.averageDuration.toFixed(2)}ms\n`);
  } catch (error: any) {
    console.error('✗ Stats retrieval failed:', error.message);
  }

  // Cleanup
  if (fs.existsSync(storageDir)) {
    fs.rmSync(storageDir, { recursive: true });
  }

  console.log('=== All deployment tests completed ===');
}

// Run tests
if (require.main === module) {
  testDeployment()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default testDeployment;
