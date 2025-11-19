/**
 * Runtime System for Elide Cloud
 *
 * Container orchestration, process management, and auto-scaling
 */

import { Logger, generateId } from '../core/utils.ts';
import type {
  Application,
  Dyno,
  Process,
  ProcessType,
  DynoSize,
  ScalingPolicy,
  Metric,
} from '../core/types.ts';
import { db } from '../database/database.ts';

const logger = new Logger('Runtime');

// =============================================================================
// Runtime Configuration
// =============================================================================

interface DynoResources {
  cpu: number; // CPU cores
  memory: number; // Memory in MB
  disk: number; // Disk in GB
}

const DYNO_RESOURCES: Record<DynoSize, DynoResources> = {
  'free': { cpu: 0.1, memory: 512, disk: 1 },
  'hobby': { cpu: 0.5, memory: 512, disk: 1 },
  'standard-1x': { cpu: 1, memory: 512, disk: 1 },
  'standard-2x': { cpu: 2, memory: 1024, disk: 1 },
  'performance-m': { cpu: 2.5, memory: 2560, disk: 2 },
  'performance-l': { cpu: 12, memory: 14336, disk: 5 },
};

// =============================================================================
// Dyno Manager
// =============================================================================

export class DynoManager {
  private dynos: Map<string, Dyno> = new Map();

  /**
   * Create and start a new dyno
   */
  async createDyno(
    application: Application,
    processType: string,
    size: DynoSize,
    command: string,
    releaseVersion: number
  ): Promise<Dyno> {
    const dyno = db.createDyno({
      applicationId: application.id,
      processType,
      size,
      command,
      status: 'starting',
      releaseVersion,
      state: {
        uptime: 0,
        cpu: 0,
        memory: 0,
        requests: 0,
      },
    });

    logger.info(`Created dyno: ${dyno.id} for ${application.name} (${processType})`);

    // Start the dyno
    await this.startDyno(dyno.id);

    return dyno;
  }

  /**
   * Start a dyno
   */
  async startDyno(dynoId: string): Promise<void> {
    const dyno = db.getDynoById(dynoId);
    if (!dyno) {
      throw new Error(`Dyno ${dynoId} not found`);
    }

    logger.info(`Starting dyno: ${dynoId}`);

    // Simulate dyno startup
    db.updateDyno(dynoId, {
      status: 'running',
      attachedAt: new Date(),
    });

    // Start monitoring
    this.monitorDyno(dynoId);
  }

  /**
   * Stop a dyno
   */
  async stopDyno(dynoId: string): Promise<void> {
    const dyno = db.getDynoById(dynoId);
    if (!dyno) {
      throw new Error(`Dyno ${dynoId} not found`);
    }

    logger.info(`Stopping dyno: ${dynoId}`);

    db.updateDyno(dynoId, { status: 'stopping' });

    // Simulate graceful shutdown
    setTimeout(() => {
      db.updateDyno(dynoId, { status: 'stopped' });
    }, 1000);
  }

  /**
   * Restart a dyno
   */
  async restartDyno(dynoId: string): Promise<void> {
    const dyno = db.getDynoById(dynoId);
    if (!dyno) {
      throw new Error(`Dyno ${dynoId} not found`);
    }

    logger.info(`Restarting dyno: ${dynoId}`);

    await this.stopDyno(dynoId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startDyno(dynoId);
  }

  /**
   * Scale dynos for a process
   */
  async scaleDynos(
    application: Application,
    processType: string,
    targetCount: number,
    size: DynoSize,
    releaseVersion: number
  ): Promise<Dyno[]> {
    logger.info(`Scaling ${application.name} ${processType} to ${targetCount}x ${size}`);

    const existingDynos = db.getDynosByApplication(application.id)
      .filter(d => d.processType === processType);

    const currentCount = existingDynos.length;
    const command = this.getProcessCommand(application, processType);

    // Scale up
    if (targetCount > currentCount) {
      const toCreate = targetCount - currentCount;
      for (let i = 0; i < toCreate; i++) {
        await this.createDyno(application, processType, size, command, releaseVersion);
      }
    }
    // Scale down
    else if (targetCount < currentCount) {
      const toRemove = currentCount - targetCount;
      const dynosToStop = existingDynos.slice(0, toRemove);

      for (const dyno of dynosToStop) {
        await this.stopDyno(dyno.id);
      }
    }

    return db.getDynosByApplication(application.id)
      .filter(d => d.processType === processType && d.status === 'running');
  }

  /**
   * Monitor dyno health and metrics
   */
  private monitorDyno(dynoId: string): void {
    const interval = setInterval(() => {
      const dyno = db.getDynoById(dynoId);
      if (!dyno || dyno.status !== 'running') {
        clearInterval(interval);
        return;
      }

      // Simulate resource usage
      const cpu = Math.random() * 100;
      const memory = Math.random() * DYNO_RESOURCES[dyno.size].memory;

      db.updateDyno(dynoId, {
        state: {
          ...dyno.state,
          uptime: dyno.state.uptime + 10,
          cpu,
          memory,
        },
      });

      // Record metrics
      db.addMetric({
        applicationId: dyno.applicationId,
        timestamp: new Date(),
        type: 'cpu',
        value: cpu,
        unit: 'percent',
        dimensions: { dyno: dynoId, processType: dyno.processType },
      });

      db.addMetric({
        applicationId: dyno.applicationId,
        timestamp: new Date(),
        type: 'memory',
        value: memory,
        unit: 'mb',
        dimensions: { dyno: dynoId, processType: dyno.processType },
      });
    }, 10000);
  }

  /**
   * Get default command for a process type
   */
  private getProcessCommand(application: Application, processType: string): string {
    // In real implementation, this would come from Procfile or release config
    const commands: Record<string, string> = {
      web: 'npm start',
      worker: 'npm run worker',
      clock: 'npm run clock',
    };

    return commands[processType] || '';
  }
}

// =============================================================================
// Auto-Scaler
// =============================================================================

export class AutoScaler {
  private dynoManager: DynoManager;
  private scalingIntervals: Map<string, any> = new Map();

  constructor(dynoManager: DynoManager) {
    this.dynoManager = dynoManager;
  }

  /**
   * Enable auto-scaling for an application
   */
  enableAutoScaling(policy: ScalingPolicy): void {
    logger.info(`Enabling auto-scaling for app ${policy.applicationId}`);

    // Clear existing interval if any
    this.disableAutoScaling(policy.id);

    // Start monitoring and scaling
    const interval = setInterval(() => {
      this.evaluateScaling(policy);
    }, 30000); // Check every 30 seconds

    this.scalingIntervals.set(policy.id, interval);
  }

  /**
   * Disable auto-scaling for an application
   */
  disableAutoScaling(policyId: string): void {
    const interval = this.scalingIntervals.get(policyId);
    if (interval) {
      clearInterval(interval);
      this.scalingIntervals.delete(policyId);
      logger.info(`Disabled auto-scaling for policy ${policyId}`);
    }
  }

  /**
   * Evaluate scaling policy and make scaling decisions
   */
  private async evaluateScaling(policy: ScalingPolicy): Promise<void> {
    if (!policy.enabled) return;

    const application = db.getApplicationById(policy.applicationId);
    if (!application) return;

    // Get current metrics
    const since = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
    const metrics = db.getMetrics(policy.applicationId, undefined, since);

    // Calculate average CPU and memory usage
    const cpuMetrics = metrics.filter(m =>
      m.type === 'cpu' && m.dimensions.processType === policy.processType
    );
    const avgCPU = cpuMetrics.length > 0
      ? cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length
      : 0;

    const memoryMetrics = metrics.filter(m =>
      m.type === 'memory' && m.dimensions.processType === policy.processType
    );
    const avgMemory = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : 0;

    // Get current dyno count
    const currentDynos = db.getDynosByApplication(policy.applicationId)
      .filter(d => d.processType === policy.processType && d.status === 'running');

    const currentCount = currentDynos.length;

    // Make scaling decision
    let targetCount = currentCount;

    // Scale up conditions
    if (policy.targetCPU && avgCPU > policy.targetCPU) {
      targetCount = Math.min(currentCount + 1, policy.maxDynos);
      logger.info(`Scaling up: CPU ${avgCPU.toFixed(2)}% > ${policy.targetCPU}%`);
    } else if (policy.targetMemory && avgMemory > policy.targetMemory) {
      targetCount = Math.min(currentCount + 1, policy.maxDynos);
      logger.info(`Scaling up: Memory ${avgMemory.toFixed(2)}MB > ${policy.targetMemory}MB`);
    }
    // Scale down conditions
    else if (policy.targetCPU && avgCPU < policy.targetCPU * 0.5 && currentCount > policy.minDynos) {
      targetCount = Math.max(currentCount - 1, policy.minDynos);
      logger.info(`Scaling down: CPU ${avgCPU.toFixed(2)}% < ${(policy.targetCPU * 0.5).toFixed(2)}%`);
    }

    // Apply scaling if needed
    if (targetCount !== currentCount) {
      logger.info(`Auto-scaling ${application.name} ${policy.processType}: ${currentCount} -> ${targetCount}`);

      const process = db.getProcessesByApplication(policy.applicationId)
        .find(p => p.type === policy.processType);

      if (process) {
        await this.dynoManager.scaleDynos(
          application,
          policy.processType,
          targetCount,
          process.size,
          0 // Would be actual release version
        );
      }
    }
  }
}

// =============================================================================
// Health Checker
// =============================================================================

export class HealthChecker {
  private dynoManager: DynoManager;

  constructor(dynoManager: DynoManager) {
    this.dynoManager = dynoManager;
  }

  /**
   * Start health checking for all dynos
   */
  startHealthChecking(): void {
    setInterval(() => {
      this.checkAllDynos();
    }, 60000); // Check every minute
  }

  /**
   * Check health of all dynos
   */
  private async checkAllDynos(): Promise<void> {
    const applications = Array.from(db.applications.values());

    for (const app of applications) {
      const dynos = db.getDynosByApplication(app.id);

      for (const dyno of dynos) {
        if (dyno.status === 'running') {
          const healthy = await this.checkDyno(dyno);

          if (!healthy) {
            logger.warn(`Dyno ${dyno.id} is unhealthy, restarting...`);
            await this.dynoManager.restartDyno(dyno.id);
          }
        }
      }
    }
  }

  /**
   * Check health of a specific dyno
   */
  private async checkDyno(dyno: Dyno): Promise<boolean> {
    // Simulate health check
    // In real implementation, this would make HTTP requests to the dyno

    // Random failure for demonstration
    return Math.random() > 0.01; // 1% failure rate
  }
}

// =============================================================================
// Runtime Manager
// =============================================================================

export class RuntimeManager {
  private dynoManager: DynoManager;
  private autoScaler: AutoScaler;
  private healthChecker: HealthChecker;

  constructor() {
    this.dynoManager = new DynoManager();
    this.autoScaler = new AutoScaler(this.dynoManager);
    this.healthChecker = new HealthChecker(this.dynoManager);

    // Start health checking
    this.healthChecker.startHealthChecking();

    logger.info('Runtime Manager initialized');
  }

  /**
   * Deploy a release
   */
  async deployRelease(
    application: Application,
    releaseVersion: number,
    processes: Record<string, string>
  ): Promise<void> {
    logger.info(`Deploying release v${releaseVersion} for ${application.name}`);

    for (const [processType, command] of Object.entries(processes)) {
      // Get or create process configuration
      let process = db.getProcessesByApplication(application.id)
        .find(p => p.type === processType);

      if (!process) {
        // Create default process
        process = db.createProcess({
          applicationId: application.id,
          deploymentId: '', // Would be set to actual deployment
          type: processType as ProcessType,
          command,
          status: 'starting',
          dynoId: '',
          size: 'standard-1x',
          quantity: processType === 'web' ? 1 : 0,
          restarts: 0,
          metadata: {},
        });
      }

      // Scale to desired quantity
      if (process.quantity > 0) {
        await this.dynoManager.scaleDynos(
          application,
          processType,
          process.quantity,
          process.size,
          releaseVersion
        );
      }
    }
  }

  /**
   * Scale an application
   */
  async scale(
    application: Application,
    processType: string,
    quantity: number,
    size: DynoSize
  ): Promise<void> {
    logger.info(`Scaling ${application.name} ${processType} to ${quantity}x ${size}`);

    // Update process configuration
    const process = db.getProcessesByApplication(application.id)
      .find(p => p.type === processType);

    if (process) {
      db.updateProcess(process.id, { quantity, size });
    }

    // Scale dynos
    await this.dynoManager.scaleDynos(
      application,
      processType,
      quantity,
      size,
      0 // Would be actual release version
    );
  }

  /**
   * Restart an application
   */
  async restart(application: Application): Promise<void> {
    logger.info(`Restarting ${application.name}`);

    const dynos = db.getDynosByApplication(application.id);

    for (const dyno of dynos) {
      await this.dynoManager.restartDyno(dyno.id);
    }
  }

  /**
   * Stop an application
   */
  async stop(application: Application): Promise<void> {
    logger.info(`Stopping ${application.name}`);

    const dynos = db.getDynosByApplication(application.id);

    for (const dyno of dynos) {
      await this.dynoManager.stopDyno(dyno.id);
    }
  }

  /**
   * Get runtime statistics
   */
  getRuntimeStats(application: Application): {
    totalDynos: number;
    runningDynos: number;
    totalCPU: number;
    totalMemory: number;
    processesByType: Record<string, number>;
  } {
    const dynos = db.getDynosByApplication(application.id);
    const runningDynos = dynos.filter(d => d.status === 'running');

    const totalCPU = runningDynos.reduce((sum, d) => sum + d.state.cpu, 0);
    const totalMemory = runningDynos.reduce((sum, d) => sum + d.state.memory, 0);

    const processesByType: Record<string, number> = {};
    for (const dyno of runningDynos) {
      processesByType[dyno.processType] = (processesByType[dyno.processType] || 0) + 1;
    }

    return {
      totalDynos: dynos.length,
      runningDynos: runningDynos.length,
      totalCPU,
      totalMemory,
      processesByType,
    };
  }
}
