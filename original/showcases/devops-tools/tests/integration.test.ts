/**
 * Integration Tests for DevOps Tools Suite
 *
 * Tests the integration between different components:
 * - Log collection and analysis
 * - Deployment orchestration
 * - Monitoring and alerting
 */

import * as assert from 'assert';
import { LogCollector, LogParser, LogEntry } from '../log-aggregator/collector';
import { LogAnalyzer } from '../log-aggregator/analyzer';
import { DeploymentOrchestrator, DeploymentConfig } from '../deployment/orchestrator';
import { RollbackManager } from '../deployment/rollback';
import { MonitoringAgent, createSystemCollector } from '../monitoring/agent';
import { AlertManager, createDefaultRules } from '../monitoring/alerts';

// ============================================================================
// Test Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateTestLogs(count: number): LogEntry[] {
  const logs: LogEntry[] = [];
  const levels: LogEntry['level'][] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  const sources = ['app', 'database', 'api', 'worker'];

  for (let i = 0; i < count; i++) {
    logs.push({
      timestamp: new Date(Date.now() - (count - i) * 1000),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: `Test log message ${i}`,
      rawMessage: `Test log message ${i}`,
    });
  }

  return logs;
}

// ============================================================================
// Log Aggregator Tests
// ============================================================================

async function testLogParser(): Promise<void> {
  console.log('Testing Log Parser...');

  const parser = new LogParser();

  // Test standard format
  const standardLog = '2024-01-01T12:00:00Z [INFO] Application started';
  const parsed = parser.parse(standardLog, 'test');

  assert.ok(parsed, 'Should parse standard log format');
  assert.strictEqual(parsed!.level, 'INFO', 'Should extract log level');
  assert.strictEqual(parsed!.message, 'Application started', 'Should extract message');

  // Test JSON format
  const jsonLog = '{"timestamp":"2024-01-01T12:00:00Z","level":"ERROR","message":"Test error"}';
  const parsedJson = parser.parse(jsonLog, 'test');

  assert.ok(parsedJson, 'Should parse JSON log format');
  assert.strictEqual(parsedJson!.level, 'ERROR', 'Should extract JSON log level');

  console.log('✓ Log Parser tests passed');
}

async function testLogAnalyzer(): Promise<void> {
  console.log('Testing Log Analyzer...');

  const analyzer = new LogAnalyzer();
  const testLogs = generateTestLogs(100);

  const results = await analyzer.analyze(testLogs);

  assert.ok(results, 'Should return analysis results');
  assert.ok(results.summary, 'Should include summary');
  assert.strictEqual(results.summary.totalEntries, 100, 'Should count all entries');
  assert.ok(results.statistics, 'Should include statistics');
  assert.ok(results.recommendations, 'Should include recommendations');

  console.log('✓ Log Analyzer tests passed');
}

// ============================================================================
// Deployment Tests
// ============================================================================

async function testDeploymentOrchestrator(): Promise<void> {
  console.log('Testing Deployment Orchestrator...');

  const orchestrator = new DeploymentOrchestrator();

  const config: DeploymentConfig = {
    name: 'test-app',
    version: '1.0.0',
    environment: {
      name: 'test',
      type: 'development',
      variables: {},
    },
    strategy: {
      type: 'recreate',
      config: { type: 'recreate' },
    },
    targets: [
      {
        id: 'test-server',
        type: 'server',
        host: 'localhost',
      },
    ],
    healthChecks: [],
    rollbackConfig: {
      enabled: false,
      automatic: false,
      triggers: [],
      maxRetries: 0,
    },
  };

  const deployment = await orchestrator.deploy(config);

  assert.ok(deployment, 'Should create deployment');
  assert.strictEqual(deployment.config.name, 'test-app', 'Should match config name');
  assert.strictEqual(deployment.state, 'pending', 'Should start in pending state');

  // Wait a bit and check status
  await sleep(1000);

  const status = orchestrator.getDeployment(deployment.id);
  assert.ok(status, 'Should be able to retrieve deployment status');

  console.log('✓ Deployment Orchestrator tests passed');
}

async function testRollbackManager(): Promise<void> {
  console.log('Testing Rollback Manager...');

  const manager = new RollbackManager('/tmp/test-rollback-state');

  // Mock deployment status
  const mockDeployment: any = {
    id: 'test-deploy-123',
    config: {
      name: 'test-app',
      version: '2.0.0',
      environment: {
        name: 'test',
        type: 'development',
        variables: {},
      },
      targets: [
        { id: 'server-1', type: 'server', host: 'localhost' },
      ],
    },
    state: 'completed',
    progress: 100,
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    targetStatuses: new Map(),
    events: [],
    metrics: {
      totalTargets: 1,
      deployedTargets: 1,
      healthyTargets: 1,
      failedTargets: 0,
      averageDeployTime: 0,
      totalDeployTime: 0,
    },
  };

  // Track deployment
  manager.trackDeployment(mockDeployment);

  // Add another version
  const mockDeployment2 = {
    ...mockDeployment,
    id: 'test-deploy-456',
    config: {
      ...mockDeployment.config,
      version: '2.1.0',
    },
    startTime: new Date(),
  };

  manager.trackDeployment(mockDeployment2);

  // Check if rollback is possible
  const canRollback = manager.canRollback('test-deploy-456');
  assert.strictEqual(canRollback, true, 'Should be able to rollback');

  // Get available versions
  const versions = manager.getAvailableVersions('test');
  assert.strictEqual(versions.length, 2, 'Should have 2 versions');

  console.log('✓ Rollback Manager tests passed');
}

// ============================================================================
// Monitoring Tests
// ============================================================================

async function testMonitoringAgent(): Promise<void> {
  console.log('Testing Monitoring Agent...');

  const config = {
    agentId: 'test-agent',
    hostname: 'test-host',
    collectors: [createSystemCollector()],
    retentionPeriod: '1h',
    exportInterval: '60s',
    exportPath: '/tmp/test-metrics.jsonl',
  };

  const agent = new MonitoringAgent(config);

  // Start agent
  await agent.start();

  // Wait for some metrics to be collected
  await sleep(2000);

  // Get metrics
  const metrics = agent.getMetrics();
  assert.ok(metrics.length > 0, 'Should collect metrics');

  // Stop agent
  await agent.stop();

  console.log('✓ Monitoring Agent tests passed');
}

async function testAlertManager(): Promise<void> {
  console.log('Testing Alert Manager...');

  const manager = new AlertManager();

  // Register default rules
  const rules = createDefaultRules();
  for (const rule of rules) {
    manager.registerRule(rule);
  }

  // Create test alert
  const alert = manager.createAlert({
    severity: 'warning',
    title: 'Test Alert',
    message: 'This is a test alert',
    source: 'test',
  });

  assert.ok(alert, 'Should create alert');
  assert.strictEqual(alert.title, 'Test Alert', 'Should match title');

  // Get stats
  const stats = manager.getStats();
  assert.strictEqual(stats.totalAlerts, 1, 'Should have 1 alert');
  assert.strictEqual(stats.activeAlerts, 1, 'Should have 1 active alert');

  // Acknowledge alert
  manager.acknowledgeAlert(alert.id, 'test-user');
  const updatedStats = manager.getStats();
  assert.strictEqual(updatedStats.acknowledgedAlerts, 1, 'Should have 1 acknowledged alert');

  // Resolve alert
  manager.resolveAlert(alert.id);
  const finalStats = manager.getStats();
  assert.strictEqual(finalStats.activeAlerts, 0, 'Should have 0 active alerts');
  assert.strictEqual(finalStats.resolvedAlerts, 1, 'Should have 1 resolved alert');

  console.log('✓ Alert Manager tests passed');
}

// ============================================================================
// Integration Tests
// ============================================================================

async function testLogToAlert Integration(): Promise<void> {
  console.log('Testing Log-to-Alert integration...');

  // Create components
  const analyzer = new LogAnalyzer();
  const alertManager = new AlertManager();

  // Generate logs with errors
  const logs = generateTestLogs(50);
  logs.push({
    timestamp: new Date(),
    level: 'FATAL',
    source: 'critical-system',
    message: 'System crash detected',
    rawMessage: 'System crash detected',
  });

  // Analyze logs
  const analysis = await analyzer.analyze(logs);

  // Check for critical errors and create alerts
  const errors = logs.filter(l => l.level === 'ERROR' || l.level === 'FATAL');
  if (errors.length > 0) {
    alertManager.createAlert({
      severity: 'critical',
      title: 'Critical Errors in Logs',
      message: `Found ${errors.length} critical errors`,
      source: 'log-analyzer',
    });
  }

  // Verify alert was created
  const stats = alertManager.getStats();
  assert.ok(stats.totalAlerts > 0, 'Should create alert from log analysis');

  console.log('✓ Log-to-Alert integration test passed');
}

async function testDeploymentWithMonitoring(): Promise<void> {
  console.log('Testing Deployment with Monitoring integration...');

  // This test demonstrates how deployment would trigger monitoring
  const orchestrator = new DeploymentOrchestrator();
  const alertManager = new AlertManager();

  const config: DeploymentConfig = {
    name: 'monitored-app',
    version: '1.0.0',
    environment: {
      name: 'test',
      type: 'development',
      variables: {},
    },
    strategy: {
      type: 'recreate',
      config: { type: 'recreate' },
    },
    targets: [
      {
        id: 'test-server',
        type: 'server',
        host: 'localhost',
      },
    ],
    healthChecks: [],
    rollbackConfig: {
      enabled: true,
      automatic: true,
      triggers: [{ type: 'health-check-failed' }],
      maxRetries: 3,
    },
  };

  const deployment = await orchestrator.deploy(config);

  // Monitor deployment and create alerts if needed
  await sleep(1000);

  const status = orchestrator.getDeployment(deployment.id);
  if (status && status.state === 'failed') {
    alertManager.createAlert({
      severity: 'critical',
      title: 'Deployment Failed',
      message: `Deployment ${deployment.id} failed`,
      source: 'orchestrator',
    });
  }

  console.log('✓ Deployment-Monitoring integration test passed');
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests(): Promise<void> {
  console.log('=== DevOps Tools Suite - Integration Tests ===\n');

  const tests = [
    { name: 'Log Parser', fn: testLogParser },
    { name: 'Log Analyzer', fn: testLogAnalyzer },
    { name: 'Deployment Orchestrator', fn: testDeploymentOrchestrator },
    { name: 'Rollback Manager', fn: testRollbackManager },
    { name: 'Monitoring Agent', fn: testMonitoringAgent },
    { name: 'Alert Manager', fn: testAlertManager },
    { name: 'Log-to-Alert Integration', fn: testLogToAlertIntegration },
    { name: 'Deployment-Monitoring Integration', fn: testDeploymentWithMonitoring },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.error(`✗ ${test.name} failed:`, error);
      failed++;
    }
    console.log();
  }

  console.log('=== Test Summary ===');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log();

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}
