/**
 * Deployment Service - Handles function deployment and lifecycle
 *
 * Manages deployment process, validation, and coordination with other services.
 */

import FunctionManager, { FunctionMetadata, DeploymentOptions } from './function-manager';
import { EventEmitter } from 'events';

export interface DeploymentRequest {
  name: string;
  code: string;
  runtime: 'typescript' | 'python' | 'ruby';
  env?: Record<string, string>;
  memory?: number;
  timeout?: number;
  description?: string;
  tags?: string[];
  routes?: string[];
  config?: Record<string, any>;
  options?: DeploymentOptions;
}

export interface DeploymentResult {
  success: boolean;
  functionId: string;
  version: string;
  metadata: FunctionMetadata;
  deploymentId: string;
  timestamp: Date;
  duration: number;
  errors?: string[];
  warnings?: string[];
}

export interface DeploymentStatus {
  deploymentId: string;
  status: 'pending' | 'building' | 'deploying' | 'active' | 'failed' | 'rolled-back';
  functionId: string;
  version: string;
  progress: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
}

export class DeploymentService extends EventEmitter {
  private functionManager: FunctionManager;
  private deployments: Map<string, DeploymentStatus>;
  private deploymentHistory: DeploymentResult[];

  constructor(functionManager: FunctionManager) {
    super();
    this.functionManager = functionManager;
    this.deployments = new Map();
    this.deploymentHistory = [];
  }

  /**
   * Deploy a function
   */
  async deploy(request: DeploymentRequest): Promise<DeploymentResult> {
    const startTime = Date.now();
    const deploymentId = this.generateDeploymentId();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Create deployment status
      const status: DeploymentStatus = {
        deploymentId,
        status: 'pending',
        functionId: '', // Will be set after creation
        version: request.options?.version || '1.0.0',
        progress: 0,
        message: 'Deployment started',
        startedAt: new Date(),
      };
      this.deployments.set(deploymentId, status);
      this.emit('deployment:started', status);

      // Validate request
      this.updateDeploymentStatus(deploymentId, 'building', 10, 'Validating deployment');
      await this.validateRequest(request);

      // Pre-process code
      this.updateDeploymentStatus(deploymentId, 'building', 30, 'Processing function code');
      const processedCode = await this.preprocessCode(request.code, request.runtime);

      // Deploy function
      this.updateDeploymentStatus(deploymentId, 'deploying', 50, 'Deploying function');
      const metadata = await this.functionManager.deploy(
        request.name,
        processedCode,
        request.runtime,
        {
          ...request.options,
          validateCode: true,
          activateImmediately: request.options?.activateImmediately !== false,
        }
      );

      // Update function configuration
      this.updateDeploymentStatus(deploymentId, 'deploying', 70, 'Updating configuration');
      await this.functionManager.update(metadata.id, {
        env: request.env,
        memory: request.memory,
        timeout: request.timeout,
        description: request.description,
        tags: request.tags,
        routes: request.routes,
        config: request.config,
      });

      // Finalize deployment
      this.updateDeploymentStatus(deploymentId, 'active', 100, 'Deployment completed');

      const result: DeploymentResult = {
        success: true,
        functionId: metadata.id,
        version: metadata.version,
        metadata,
        deploymentId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      // Store in history
      this.deploymentHistory.push(result);
      this.emit('deployment:completed', result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);

      this.updateDeploymentStatus(deploymentId, 'failed', 0, `Deployment failed: ${errorMessage}`);

      const result: DeploymentResult = {
        success: false,
        functionId: '',
        version: request.options?.version || '1.0.0',
        metadata: {} as FunctionMetadata,
        deploymentId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors,
      };

      this.deploymentHistory.push(result);
      this.emit('deployment:failed', result);

      throw error;
    }
  }

  /**
   * Rollback a function to a previous version
   */
  async rollback(functionId: string, targetVersion: string): Promise<DeploymentResult> {
    const startTime = Date.now();
    const deploymentId = this.generateDeploymentId();

    try {
      const status: DeploymentStatus = {
        deploymentId,
        status: 'deploying',
        functionId,
        version: targetVersion,
        progress: 0,
        message: 'Rolling back function',
        startedAt: new Date(),
      };
      this.deployments.set(deploymentId, status);
      this.emit('rollback:started', status);

      // Perform rollback
      this.updateDeploymentStatus(deploymentId, 'deploying', 50, 'Rolling back to previous version');
      const metadata = await this.functionManager.rollback(functionId, targetVersion);

      this.updateDeploymentStatus(deploymentId, 'rolled-back', 100, 'Rollback completed');

      const result: DeploymentResult = {
        success: true,
        functionId,
        version: targetVersion,
        metadata,
        deploymentId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };

      this.deploymentHistory.push(result);
      this.emit('rollback:completed', result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateDeploymentStatus(deploymentId, 'failed', 0, `Rollback failed: ${errorMessage}`);

      const result: DeploymentResult = {
        success: false,
        functionId,
        version: targetVersion,
        metadata: {} as FunctionMetadata,
        deploymentId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [errorMessage],
      };

      this.deploymentHistory.push(result);
      this.emit('rollback:failed', result);

      throw error;
    }
  }

  /**
   * Promote a version to active
   */
  async promote(functionId: string, version: string): Promise<void> {
    await this.functionManager.promote(functionId, version);
    this.emit('version:promoted', { functionId, version });
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory(
    filter?: { functionId?: string; limit?: number }
  ): DeploymentResult[] {
    let history = [...this.deploymentHistory];

    if (filter?.functionId) {
      history = history.filter((d) => d.functionId === filter.functionId);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history.reverse();
  }

  /**
   * Get deployment statistics
   */
  getStats(): {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    recentDeployments: DeploymentResult[];
  } {
    const total = this.deploymentHistory.length;
    const successful = this.deploymentHistory.filter((d) => d.success).length;
    const failed = total - successful;

    const totalDuration = this.deploymentHistory.reduce(
      (sum, d) => sum + d.duration,
      0
    );
    const averageDuration = total > 0 ? totalDuration / total : 0;

    return {
      total,
      successful,
      failed,
      averageDuration,
      recentDeployments: this.deploymentHistory.slice(-10).reverse(),
    };
  }

  // Private helper methods

  private generateDeploymentId(): string {
    return `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus['status'],
    progress: number,
    message: string
  ): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return;

    deployment.status = status;
    deployment.progress = progress;
    deployment.message = message;

    if (progress === 100 || status === 'failed') {
      deployment.completedAt = new Date();
    }

    this.emit('deployment:progress', deployment);
  }

  private async validateRequest(request: DeploymentRequest): Promise<void> {
    // Validate name
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Function name is required');
    }

    if (!/^[a-z0-9-_]+$/.test(request.name)) {
      throw new Error('Function name must contain only lowercase letters, numbers, hyphens, and underscores');
    }

    // Validate code
    if (!request.code || request.code.trim().length === 0) {
      throw new Error('Function code is required');
    }

    // Validate runtime
    if (!['typescript', 'python', 'ruby'].includes(request.runtime)) {
      throw new Error(`Unsupported runtime: ${request.runtime}`);
    }

    // Validate memory
    if (request.memory !== undefined && (request.memory < 128 || request.memory > 10240)) {
      throw new Error('Memory must be between 128 and 10240 MB');
    }

    // Validate timeout
    if (request.timeout !== undefined && (request.timeout < 1 || request.timeout > 900)) {
      throw new Error('Timeout must be between 1 and 900 seconds');
    }

    // Validate routes
    if (request.routes) {
      for (const route of request.routes) {
        if (!route.startsWith('/')) {
          throw new Error(`Route must start with /: ${route}`);
        }
      }
    }
  }

  private async preprocessCode(code: string, runtime: string): Promise<string> {
    // Add runtime-specific preprocessing
    switch (runtime) {
      case 'typescript':
        return this.preprocessTypeScript(code);
      case 'python':
        return this.preprocessPython(code);
      case 'ruby':
        return this.preprocessRuby(code);
      default:
        return code;
    }
  }

  private preprocessTypeScript(code: string): string {
    // Add default export if missing
    if (!code.includes('export default') && !code.includes('export {')) {
      const hasHandler = code.includes('function handler') || code.includes('const handler');
      if (hasHandler) {
        return code + '\n\nexport default handler;';
      }
    }
    return code;
  }

  private preprocessPython(code: string): string {
    // Add shebang if missing
    if (!code.startsWith('#!')) {
      return '#!/usr/bin/env python3\n\n' + code;
    }
    return code;
  }

  private preprocessRuby(code: string): string {
    // Add shebang if missing
    if (!code.startsWith('#!')) {
      return '#!/usr/bin/env ruby\n\n' + code;
    }
    return code;
  }
}

export default DeploymentService;
