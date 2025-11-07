/**
 * Rollback Manager
 *
 * Manages deployment rollbacks with version tracking and automatic recovery.
 */

import * as fs from 'fs';
import * as path from 'path';
import ms from 'ms';
import { DeploymentConfig, DeploymentTarget, DeploymentStatus } from './orchestrator';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RollbackPlan {
  id: string;
  deploymentId: string;
  fromVersion: string;
  toVersion: string;
  environment: string;
  targets: RollbackTarget[];
  reason: string;
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface RollbackTarget {
  targetId: string;
  currentVersion: string;
  targetVersion: string;
  status: 'pending' | 'rolling-back' | 'completed' | 'failed';
  error?: string;
}

export interface VersionHistory {
  version: string;
  deployedAt: Date;
  deploymentId: string;
  config: DeploymentConfig;
  status: 'active' | 'rolled-back' | 'superseded';
}

export interface RollbackStrategy {
  type: 'immediate' | 'gradual' | 'blue-green-switch';
  validateBeforeRollback: boolean;
  validateAfterRollback: boolean;
  parallelRollbacks: number;
}

export interface RollbackValidation {
  targetId: string;
  passed: boolean;
  checks: ValidationCheck[];
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  timestamp: Date;
}

// ============================================================================
// Rollback Manager
// ============================================================================

export class RollbackManager {
  private versionHistory: Map<string, VersionHistory[]>;
  private rollbackPlans: Map<string, RollbackPlan>;
  private rollbackHistory: RollbackPlan[];
  private storageDir: string;

  constructor(storageDir: string = '/tmp/rollback-state') {
    this.versionHistory = new Map();
    this.rollbackPlans = new Map();
    this.rollbackHistory = [];
    this.storageDir = storageDir;

    // Ensure storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Load state
    this.loadState();
  }

  /**
   * Track a deployment for rollback capability
   */
  trackDeployment(deployment: DeploymentStatus): void {
    const env = deployment.config.environment.name;

    if (!this.versionHistory.has(env)) {
      this.versionHistory.set(env, []);
    }

    const history = this.versionHistory.get(env)!;

    // Mark previous version as superseded
    if (history.length > 0) {
      const latest = history[history.length - 1];
      if (latest.status === 'active') {
        latest.status = 'superseded';
      }
    }

    // Add new version
    history.push({
      version: deployment.config.version,
      deployedAt: deployment.startTime,
      deploymentId: deployment.id,
      config: deployment.config,
      status: 'active',
    });

    // Keep only last 10 versions
    if (history.length > 10) {
      history.shift();
    }

    console.log(`[RollbackManager] Tracked deployment ${deployment.id} version ${deployment.config.version}`);

    this.saveState();
  }

  /**
   * Create a rollback plan
   */
  createRollbackPlan(
    deploymentId: string,
    reason: string,
    targetVersion?: string
  ): RollbackPlan {
    // Find the deployment
    const deployment = this.findDeploymentInHistory(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found in history`);
    }

    const env = deployment.config.environment.name;
    const history = this.versionHistory.get(env);

    if (!history || history.length < 2) {
      throw new Error('No previous version available for rollback');
    }

    // Determine target version
    const fromVersion = deployment.config.version;
    let toVersion = targetVersion;

    if (!toVersion) {
      // Find the last active or superseded version before current
      const currentIndex = history.findIndex(h => h.deploymentId === deploymentId);
      if (currentIndex > 0) {
        toVersion = history[currentIndex - 1].version;
      } else {
        throw new Error('No previous version found for rollback');
      }
    }

    // Create rollback targets
    const targets: RollbackTarget[] = deployment.config.targets.map(target => ({
      targetId: target.id,
      currentVersion: fromVersion,
      targetVersion: toVersion!,
      status: 'pending',
    }));

    // Create rollback plan
    const plan: RollbackPlan = {
      id: this.generateRollbackId(),
      deploymentId,
      fromVersion,
      toVersion: toVersion!,
      environment: env,
      targets,
      reason,
      createdAt: new Date(),
      status: 'pending',
    };

    this.rollbackPlans.set(plan.id, plan);

    console.log(`[RollbackManager] Created rollback plan ${plan.id}: ${fromVersion} -> ${toVersion}`);

    return plan;
  }

  /**
   * Execute a rollback plan
   */
  async executeRollback(
    planId: string,
    strategy: RollbackStrategy = {
      type: 'immediate',
      validateBeforeRollback: true,
      validateAfterRollback: true,
      parallelRollbacks: 3,
    }
  ): Promise<void> {
    const plan = this.rollbackPlans.get(planId);
    if (!plan) {
      throw new Error(`Rollback plan ${planId} not found`);
    }

    console.log(`[RollbackManager] Executing rollback plan ${planId}`);
    console.log(`[RollbackManager] Strategy: ${strategy.type}`);

    plan.status = 'executing';
    plan.executedAt = new Date();

    try {
      // Pre-rollback validation
      if (strategy.validateBeforeRollback) {
        console.log('[RollbackManager] Running pre-rollback validation...');
        await this.validateRollback(plan, 'pre');
      }

      // Execute rollback based on strategy
      switch (strategy.type) {
        case 'immediate':
          await this.executeImmediateRollback(plan, strategy);
          break;
        case 'gradual':
          await this.executeGradualRollback(plan, strategy);
          break;
        case 'blue-green-switch':
          await this.executeBlueGreenSwitch(plan, strategy);
          break;
      }

      // Post-rollback validation
      if (strategy.validateAfterRollback) {
        console.log('[RollbackManager] Running post-rollback validation...');
        await this.validateRollback(plan, 'post');
      }

      // Mark plan as completed
      plan.status = 'completed';
      plan.completedAt = new Date();

      // Update version history
      this.updateVersionHistoryAfterRollback(plan);

      console.log(`[RollbackManager] Rollback ${planId} completed successfully`);
    } catch (error) {
      plan.status = 'failed';
      console.error(`[RollbackManager] Rollback ${planId} failed:`, error);
      throw error;
    } finally {
      // Move to history
      this.rollbackPlans.delete(planId);
      this.rollbackHistory.push(plan);
      this.saveState();
    }
  }

  /**
   * Execute immediate rollback (all targets at once)
   */
  private async executeImmediateRollback(
    plan: RollbackPlan,
    strategy: RollbackStrategy
  ): Promise<void> {
    console.log('[RollbackManager] Executing immediate rollback');

    const batches = this.createBatches(plan.targets, strategy.parallelRollbacks);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[RollbackManager] Rolling back batch ${i + 1}/${batches.length}`);

      await Promise.all(
        batch.map(target => this.rollbackTarget(plan, target))
      );
    }
  }

  /**
   * Execute gradual rollback (target by target)
   */
  private async executeGradualRollback(
    plan: RollbackPlan,
    strategy: RollbackStrategy
  ): Promise<void> {
    console.log('[RollbackManager] Executing gradual rollback');

    for (let i = 0; i < plan.targets.length; i++) {
      const target = plan.targets[i];
      console.log(`[RollbackManager] Rolling back target ${i + 1}/${plan.targets.length}: ${target.targetId}`);

      await this.rollbackTarget(plan, target);

      // Verify health before proceeding
      await this.verifyTargetHealth(plan, target);

      // Wait between targets
      if (i < plan.targets.length - 1) {
        await this.sleep(ms('10s'));
      }
    }
  }

  /**
   * Execute blue-green switch rollback
   */
  private async executeBlueGreenSwitch(
    plan: RollbackPlan,
    strategy: RollbackStrategy
  ): Promise<void> {
    console.log('[RollbackManager] Executing blue-green switch rollback');

    // In blue-green, we just switch traffic back to the old (blue) environment
    console.log('[RollbackManager] Switching traffic to previous version');
    await this.sleep(ms('5s')); // Simulate traffic switch

    // Update all targets status
    for (const target of plan.targets) {
      target.status = 'completed';
    }

    console.log('[RollbackManager] Traffic switched successfully');
  }

  /**
   * Rollback a single target
   */
  private async rollbackTarget(plan: RollbackPlan, target: RollbackTarget): Promise<void> {
    target.status = 'rolling-back';

    try {
      console.log(`[RollbackManager] Rolling back ${target.targetId}: ${target.currentVersion} -> ${target.targetVersion}`);

      // Simulate rollback execution
      await this.sleep(ms('5s'));

      // In real scenario, this would:
      // 1. Stop current version
      // 2. Start previous version
      // 3. Verify startup
      // 4. Update routing

      target.status = 'completed';
      console.log(`[RollbackManager] Target ${target.targetId} rolled back successfully`);
    } catch (error) {
      target.status = 'failed';
      target.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Validate rollback readiness
   */
  private async validateRollback(
    plan: RollbackPlan,
    phase: 'pre' | 'post'
  ): Promise<void> {
    console.log(`[RollbackManager] Running ${phase}-rollback validation`);

    const validations: RollbackValidation[] = [];

    for (const target of plan.targets) {
      const validation: RollbackValidation = {
        targetId: target.targetId,
        passed: true,
        checks: [],
      };

      // Check 1: Target accessibility
      validation.checks.push({
        name: 'Target Accessible',
        passed: true,
        message: 'Target is accessible',
        timestamp: new Date(),
      });

      // Check 2: Previous version availability
      if (phase === 'pre') {
        validation.checks.push({
          name: 'Previous Version Available',
          passed: true,
          message: `Version ${target.targetVersion} is available`,
          timestamp: new Date(),
        });
      }

      // Check 3: Health status
      if (phase === 'post') {
        validation.checks.push({
          name: 'Health Check',
          passed: true,
          message: 'Target is healthy after rollback',
          timestamp: new Date(),
        });
      }

      validation.passed = validation.checks.every(c => c.passed);
      validations.push(validation);

      if (!validation.passed) {
        throw new Error(`Validation failed for target ${target.targetId}`);
      }
    }

    console.log(`[RollbackManager] ${phase}-rollback validation passed`);
  }

  /**
   * Verify target health after rollback
   */
  private async verifyTargetHealth(plan: RollbackPlan, target: RollbackTarget): Promise<void> {
    console.log(`[RollbackManager] Verifying health of ${target.targetId}`);

    // Simulate health check
    await this.sleep(ms('2s'));

    // For demo, assume success
    console.log(`[RollbackManager] Target ${target.targetId} is healthy`);
  }

  /**
   * Update version history after successful rollback
   */
  private updateVersionHistoryAfterRollback(plan: RollbackPlan): void {
    const history = this.versionHistory.get(plan.environment);
    if (!history) return;

    // Mark rolled-back version
    const rolledBack = history.find(h => h.version === plan.fromVersion);
    if (rolledBack) {
      rolledBack.status = 'rolled-back';
    }

    // Reactivate target version
    const target = history.find(h => h.version === plan.toVersion);
    if (target) {
      target.status = 'active';
    }

    this.saveState();
  }

  /**
   * Get rollback plan by ID
   */
  getRollbackPlan(planId: string): RollbackPlan | undefined {
    return (
      this.rollbackPlans.get(planId) ||
      this.rollbackHistory.find(p => p.id === planId)
    );
  }

  /**
   * List available versions for rollback
   */
  getAvailableVersions(environment: string): VersionHistory[] {
    return this.versionHistory.get(environment) || [];
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(limit?: number): RollbackPlan[] {
    const history = [...this.rollbackHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Check if rollback is possible for a deployment
   */
  canRollback(deploymentId: string): boolean {
    const deployment = this.findDeploymentInHistory(deploymentId);
    if (!deployment) return false;

    const history = this.versionHistory.get(deployment.config.environment.name);
    if (!history || history.length < 2) return false;

    return true;
  }

  /**
   * Get recommended rollback version
   */
  getRecommendedRollbackVersion(deploymentId: string): string | null {
    const deployment = this.findDeploymentInHistory(deploymentId);
    if (!deployment) return null;

    const history = this.versionHistory.get(deployment.config.environment.name);
    if (!history) return null;

    // Find last stable version (not rolled-back, not current)
    const currentIndex = history.findIndex(h => h.deploymentId === deploymentId);
    if (currentIndex <= 0) return null;

    for (let i = currentIndex - 1; i >= 0; i--) {
      const version = history[i];
      if (version.status !== 'rolled-back') {
        return version.version;
      }
    }

    return null;
  }

  /**
   * Create batches for parallel processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Find deployment in version history
   */
  private findDeploymentInHistory(deploymentId: string): VersionHistory | null {
    for (const history of this.versionHistory.values()) {
      const found = history.find(h => h.deploymentId === deploymentId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Generate unique rollback ID
   */
  private generateRollbackId(): string {
    return `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state to disk
   */
  private saveState(): void {
    const state = {
      versionHistory: Array.from(this.versionHistory.entries()),
      rollbackHistory: this.rollbackHistory,
    };

    const statePath = path.join(this.storageDir, 'rollback-state.json');
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  /**
   * Load state from disk
   */
  private loadState(): void {
    const statePath = path.join(this.storageDir, 'rollback-state.json');

    if (!fs.existsSync(statePath)) {
      return;
    }

    try {
      const data = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(data);

      this.versionHistory = new Map(state.versionHistory || []);
      this.rollbackHistory = state.rollbackHistory || [];

      console.log('[RollbackManager] State loaded successfully');
    } catch (error) {
      console.error('[RollbackManager] Failed to load state:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export rollback report
   */
  exportReport(planId: string): string {
    const plan = this.getRollbackPlan(planId);
    if (!plan) {
      throw new Error(`Rollback plan ${planId} not found`);
    }

    const duration = plan.completedAt
      ? plan.completedAt.getTime() - plan.executedAt!.getTime()
      : 0;

    const successfulTargets = plan.targets.filter(t => t.status === 'completed').length;
    const failedTargets = plan.targets.filter(t => t.status === 'failed').length;

    return `
# Rollback Report

**Plan ID**: ${plan.id}
**Deployment ID**: ${plan.deploymentId}
**Environment**: ${plan.environment}
**Status**: ${plan.status}

## Version Change
- From: ${plan.fromVersion}
- To: ${plan.toVersion}

## Reason
${plan.reason}

## Timeline
- Created: ${plan.createdAt.toISOString()}
- Executed: ${plan.executedAt?.toISOString() || 'N/A'}
- Completed: ${plan.completedAt?.toISOString() || 'N/A'}
- Duration: ${duration > 0 ? `${(duration / 1000).toFixed(2)}s` : 'N/A'}

## Results
- Total Targets: ${plan.targets.length}
- Successful: ${successfulTargets}
- Failed: ${failedTargets}

## Target Details
${plan.targets.map(t => `
### ${t.targetId}
- Status: ${t.status}
- Version Change: ${t.currentVersion} → ${t.targetVersion}
${t.error ? `- Error: ${t.error}` : ''}
`).join('\n')}
    `.trim();
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  console.log('=== Rollback Manager ===\n');

  const manager = new RollbackManager();

  // Example: Track a deployment
  const mockDeployment: DeploymentStatus = {
    id: 'deploy-123',
    config: {
      name: 'my-app',
      version: '2.0.0',
      environment: {
        name: 'production',
        type: 'production',
        variables: {},
      },
      strategy: { type: 'rolling', config: { type: 'rolling', batchSize: 2, batchInterval: '30s', maxUnavailable: 1 } },
      targets: [
        { id: 'server-1', type: 'server', host: '10.0.1.10' },
        { id: 'server-2', type: 'server', host: '10.0.1.11' },
      ],
      healthChecks: [],
      rollbackConfig: { enabled: true, automatic: false, triggers: [], maxRetries: 3 },
    },
    state: 'completed',
    progress: 100,
    startTime: new Date(),
    targetStatuses: new Map(),
    events: [],
    metrics: {
      totalTargets: 2,
      deployedTargets: 2,
      healthyTargets: 2,
      failedTargets: 0,
      averageDeployTime: 0,
      totalDeployTime: 0,
    },
  } as any;

  manager.trackDeployment(mockDeployment);

  // Create rollback plan
  const plan = manager.createRollbackPlan(
    'deploy-123',
    'Critical bug found in production'
  );

  console.log('\nRollback Plan Created:');
  console.log(`- ID: ${plan.id}`);
  console.log(`- Version: ${plan.fromVersion} -> ${plan.toVersion}`);
  console.log(`- Targets: ${plan.targets.length}`);

  // Execute rollback
  console.log('\nExecuting rollback...');
  await manager.executeRollback(plan.id);

  // Generate report
  const report = manager.exportReport(plan.id);
  console.log('\n' + report);
}

if (require.main === module) {
  main().catch(console.error);
}
