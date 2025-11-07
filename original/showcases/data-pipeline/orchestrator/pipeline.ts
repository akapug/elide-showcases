/**
 * ETL Pipeline Orchestrator
 *
 * Main orchestration logic for the ETL data pipeline.
 * Coordinates extraction, transformation, and loading phases.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PipelineMonitor, PipelineMetrics } from './monitor';

// Pipeline configuration interface
export interface PipelineConfig {
  name: string;
  description?: string;
  extractors: ExtractorConfig[];
  transformers: TransformerConfig[];
  loaders: LoaderConfig[];
  options: PipelineOptions;
}

export interface ExtractorConfig {
  type: 'api' | 'csv' | 'json' | 'database';
  name: string;
  config: Record<string, any>;
  enabled?: boolean;
}

export interface TransformerConfig {
  type: 'validator' | 'normalizer' | 'enricher' | 'custom';
  name: string;
  config: Record<string, any>;
  enabled?: boolean;
}

export interface LoaderConfig {
  type: 'database' | 'file' | 'api' | 'stream';
  name: string;
  config: Record<string, any>;
  enabled?: boolean;
}

export interface PipelineOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  continueOnError?: boolean;
  retryConfig?: RetryConfig;
  timeout?: number;
  validateSchema?: boolean;
  archiveData?: boolean;
  archivePath?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}

// Pipeline execution context
export interface PipelineContext {
  pipelineId: string;
  runId: string;
  startTime: Date;
  config: PipelineConfig;
  metadata: Record<string, any>;
}

// Pipeline stage result
export interface StageResult {
  stage: 'extract' | 'transform' | 'load';
  success: boolean;
  data?: any;
  error?: Error;
  metrics: {
    recordsProcessed: number;
    recordsFailed: number;
    durationMs: number;
  };
}

// Pipeline result
export interface PipelineResult {
  pipelineId: string;
  runId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  stages: StageResult[];
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  error?: Error;
}

/**
 * ETL Pipeline Orchestrator
 */
export class ETLPipeline extends EventEmitter {
  private config: PipelineConfig;
  private monitor: PipelineMonitor;
  private extractorRegistry: Map<string, any> = new Map();
  private transformerRegistry: Map<string, any> = new Map();
  private loaderRegistry: Map<string, any> = new Map();
  private isRunning: boolean = false;
  private currentContext?: PipelineContext;

  constructor(config: PipelineConfig) {
    super();
    this.config = config;
    this.monitor = new PipelineMonitor();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.on('stage:start', (stage: string, context: PipelineContext) => {
      this.monitor.recordStageStart(context.runId, stage);
      console.log(`[${context.runId}] Stage ${stage} started`);
    });

    this.on('stage:complete', (stage: string, result: StageResult, context: PipelineContext) => {
      this.monitor.recordStageComplete(context.runId, stage, result);
      console.log(`[${context.runId}] Stage ${stage} completed: ${result.metrics.recordsProcessed} records`);
    });

    this.on('stage:error', (stage: string, error: Error, context: PipelineContext) => {
      this.monitor.recordStageError(context.runId, stage, error);
      console.error(`[${context.runId}] Stage ${stage} error:`, error.message);
    });

    this.on('pipeline:complete', (result: PipelineResult) => {
      this.monitor.recordPipelineComplete(result);
      console.log(`[${result.runId}] Pipeline completed: ${result.successfulRecords}/${result.totalRecords} records`);
    });
  }

  /**
   * Register an extractor
   */
  registerExtractor(type: string, extractor: any): void {
    this.extractorRegistry.set(type, extractor);
  }

  /**
   * Register a transformer
   */
  registerTransformer(type: string, transformer: any): void {
    this.transformerRegistry.set(type, transformer);
  }

  /**
   * Register a loader
   */
  registerLoader(type: string, loader: any): void {
    this.loaderRegistry.set(type, loader);
  }

  /**
   * Execute the pipeline
   */
  async execute(): Promise<PipelineResult> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    const runId = this.generateRunId();
    const context: PipelineContext = {
      pipelineId: this.config.name,
      runId,
      startTime: new Date(),
      config: this.config,
      metadata: {}
    };

    this.currentContext = context;
    this.isRunning = true;

    const result: PipelineResult = {
      pipelineId: context.pipelineId,
      runId,
      success: false,
      startTime: context.startTime,
      endTime: new Date(),
      durationMs: 0,
      stages: [],
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0
    };

    try {
      this.emit('pipeline:start', context);

      // Extract phase
      const extractResult = await this.executeExtract(context);
      result.stages.push(extractResult);

      if (!extractResult.success && !this.config.options.continueOnError) {
        throw extractResult.error || new Error('Extract phase failed');
      }

      // Transform phase
      const transformResult = await this.executeTransform(context, extractResult.data);
      result.stages.push(transformResult);

      if (!transformResult.success && !this.config.options.continueOnError) {
        throw transformResult.error || new Error('Transform phase failed');
      }

      // Load phase
      const loadResult = await this.executeLoad(context, transformResult.data);
      result.stages.push(loadResult);

      if (!loadResult.success && !this.config.options.continueOnError) {
        throw loadResult.error || new Error('Load phase failed');
      }

      // Calculate totals
      result.totalRecords = extractResult.metrics.recordsProcessed;
      result.successfulRecords = loadResult.metrics.recordsProcessed;
      result.failedRecords = result.totalRecords - result.successfulRecords;
      result.success = true;

      // Archive data if enabled
      if (this.config.options.archiveData) {
        await this.archiveData(context, extractResult.data, transformResult.data);
      }

    } catch (error) {
      result.error = error as Error;
      result.success = false;
      this.emit('pipeline:error', error, context);
    } finally {
      result.endTime = new Date();
      result.durationMs = result.endTime.getTime() - result.startTime.getTime();
      this.isRunning = false;
      this.currentContext = undefined;
      this.emit('pipeline:complete', result);
    }

    return result;
  }

  /**
   * Execute extraction phase
   */
  private async executeExtract(context: PipelineContext): Promise<StageResult> {
    const stage = 'extract';
    this.emit('stage:start', stage, context);

    const result: StageResult = {
      stage,
      success: false,
      metrics: {
        recordsProcessed: 0,
        recordsFailed: 0,
        durationMs: 0
      }
    };

    const startTime = Date.now();

    try {
      const enabledExtractors = this.config.extractors.filter(e => e.enabled !== false);

      if (enabledExtractors.length === 0) {
        throw new Error('No extractors configured');
      }

      let allData: any[] = [];

      // Execute extractors (parallel or sequential)
      if (this.config.options.parallel) {
        const results = await this.executeExtractorsParallel(enabledExtractors, context);
        allData = results.flat();
      } else {
        for (const extractorConfig of enabledExtractors) {
          const data = await this.executeExtractor(extractorConfig, context);
          allData = allData.concat(data);
        }
      }

      result.data = allData;
      result.metrics.recordsProcessed = allData.length;
      result.success = true;

    } catch (error) {
      result.error = error as Error;
      this.emit('stage:error', stage, error, context);
    } finally {
      result.metrics.durationMs = Date.now() - startTime;
      this.emit('stage:complete', stage, result, context);
    }

    return result;
  }

  /**
   * Execute extractors in parallel
   */
  private async executeExtractorsParallel(
    extractors: ExtractorConfig[],
    context: PipelineContext
  ): Promise<any[][]> {
    const maxConcurrency = this.config.options.maxConcurrency || 5;
    const results: any[][] = [];

    for (let i = 0; i < extractors.length; i += maxConcurrency) {
      const batch = extractors.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(
        batch.map(config => this.executeExtractor(config, context))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Execute a single extractor
   */
  private async executeExtractor(
    config: ExtractorConfig,
    context: PipelineContext
  ): Promise<any[]> {
    const extractor = this.extractorRegistry.get(config.type);

    if (!extractor) {
      throw new Error(`Extractor not found: ${config.type}`);
    }

    return await this.executeWithRetry(
      () => extractor.extract(config.config, context),
      this.config.options.retryConfig
    );
  }

  /**
   * Execute transformation phase
   */
  private async executeTransform(context: PipelineContext, data: any[]): Promise<StageResult> {
    const stage = 'transform';
    this.emit('stage:start', stage, context);

    const result: StageResult = {
      stage,
      success: false,
      metrics: {
        recordsProcessed: 0,
        recordsFailed: 0,
        durationMs: 0
      }
    };

    const startTime = Date.now();

    try {
      const enabledTransformers = this.config.transformers.filter(t => t.enabled !== false);

      let transformedData = data;

      // Apply transformers sequentially
      for (const transformerConfig of enabledTransformers) {
        transformedData = await this.executeTransformer(transformerConfig, transformedData, context);
      }

      result.data = transformedData;
      result.metrics.recordsProcessed = transformedData.length;
      result.metrics.recordsFailed = data.length - transformedData.length;
      result.success = true;

    } catch (error) {
      result.error = error as Error;
      this.emit('stage:error', stage, error, context);
    } finally {
      result.metrics.durationMs = Date.now() - startTime;
      this.emit('stage:complete', stage, result, context);
    }

    return result;
  }

  /**
   * Execute a single transformer
   */
  private async executeTransformer(
    config: TransformerConfig,
    data: any[],
    context: PipelineContext
  ): Promise<any[]> {
    const transformer = this.transformerRegistry.get(config.type);

    if (!transformer) {
      throw new Error(`Transformer not found: ${config.type}`);
    }

    return await this.executeWithRetry(
      () => transformer.transform(data, config.config, context),
      this.config.options.retryConfig
    );
  }

  /**
   * Execute loading phase
   */
  private async executeLoad(context: PipelineContext, data: any[]): Promise<StageResult> {
    const stage = 'load';
    this.emit('stage:start', stage, context);

    const result: StageResult = {
      stage,
      success: false,
      metrics: {
        recordsProcessed: 0,
        recordsFailed: 0,
        durationMs: 0
      }
    };

    const startTime = Date.now();

    try {
      const enabledLoaders = this.config.loaders.filter(l => l.enabled !== false);

      if (enabledLoaders.length === 0) {
        throw new Error('No loaders configured');
      }

      // Execute loaders (parallel or sequential)
      if (this.config.options.parallel) {
        await this.executeLoadersParallel(enabledLoaders, data, context);
      } else {
        for (const loaderConfig of enabledLoaders) {
          await this.executeLoader(loaderConfig, data, context);
        }
      }

      result.metrics.recordsProcessed = data.length;
      result.success = true;

    } catch (error) {
      result.error = error as Error;
      this.emit('stage:error', stage, error, context);
    } finally {
      result.metrics.durationMs = Date.now() - startTime;
      this.emit('stage:complete', stage, result, context);
    }

    return result;
  }

  /**
   * Execute loaders in parallel
   */
  private async executeLoadersParallel(
    loaders: LoaderConfig[],
    data: any[],
    context: PipelineContext
  ): Promise<void> {
    const maxConcurrency = this.config.options.maxConcurrency || 5;

    for (let i = 0; i < loaders.length; i += maxConcurrency) {
      const batch = loaders.slice(i, i + maxConcurrency);
      await Promise.all(
        batch.map(config => this.executeLoader(config, data, context))
      );
    }
  }

  /**
   * Execute a single loader
   */
  private async executeLoader(
    config: LoaderConfig,
    data: any[],
    context: PipelineContext
  ): Promise<void> {
    const loader = this.loaderRegistry.get(config.type);

    if (!loader) {
      throw new Error(`Loader not found: ${config.type}`);
    }

    await this.executeWithRetry(
      () => loader.load(data, config.config, context),
      this.config.options.retryConfig
    );
  }

  /**
   * Execute a function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryConfig?: RetryConfig
  ): Promise<T> {
    if (!retryConfig) {
      return await fn();
    }

    const { maxAttempts, backoffMs, backoffMultiplier = 2, maxBackoffMs = 30000 } = retryConfig;

    let lastError: Error | undefined;
    let currentBackoff = backoffMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          break;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${currentBackoff}ms...`);
        await this.sleep(currentBackoff);

        currentBackoff = Math.min(currentBackoff * backoffMultiplier, maxBackoffMs);
      }
    }

    throw lastError || new Error('Max retry attempts reached');
  }

  /**
   * Archive data for audit purposes
   */
  private async archiveData(
    context: PipelineContext,
    extractedData: any[],
    transformedData: any[]
  ): Promise<void> {
    try {
      const archivePath = this.config.options.archivePath || './data/archive';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = path.join(archivePath, context.runId);

      await fs.mkdir(archiveDir, { recursive: true });

      // Archive extracted data
      await fs.writeFile(
        path.join(archiveDir, `extracted-${timestamp}.json`),
        JSON.stringify(extractedData, null, 2)
      );

      // Archive transformed data
      await fs.writeFile(
        path.join(archiveDir, `transformed-${timestamp}.json`),
        JSON.stringify(transformedData, null, 2)
      );

      // Archive metadata
      await fs.writeFile(
        path.join(archiveDir, `metadata-${timestamp}.json`),
        JSON.stringify({
          pipelineId: context.pipelineId,
          runId: context.runId,
          startTime: context.startTime,
          config: this.config
        }, null, 2)
      );

    } catch (error) {
      console.error('Failed to archive data:', error);
    }
  }

  /**
   * Generate a unique run ID
   */
  private generateRunId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${this.config.name}-${timestamp}-${random}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current pipeline status
   */
  getStatus(): {
    isRunning: boolean;
    currentContext?: PipelineContext;
    metrics: PipelineMetrics | null;
  } {
    return {
      isRunning: this.isRunning,
      currentContext: this.currentContext,
      metrics: this.currentContext
        ? this.monitor.getMetrics(this.currentContext.runId)
        : null
    };
  }

  /**
   * Stop the pipeline (graceful shutdown)
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping pipeline...');
    // Emit stop event for graceful shutdown
    this.emit('pipeline:stop', this.currentContext);

    // Wait for current operation to complete (with timeout)
    const timeout = this.config.options.timeout || 30000;
    const startTime = Date.now();

    while (this.isRunning && (Date.now() - startTime) < timeout) {
      await this.sleep(100);
    }

    if (this.isRunning) {
      console.warn('Pipeline did not stop gracefully, forcing shutdown');
      this.isRunning = false;
    }
  }
}
