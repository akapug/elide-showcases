/**
 * ETL Pipeline orchestration
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { validateBatch, getSchemaByName, type ValidationResult, type ETLJobConfig, type ETLResult } from './schemas.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class ETLPipeline extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private responseQueue: Map<string, (data: any) => void> = new Map();

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    // Start Python processor
    this.pythonProcess = spawn('python3', ['python/processors.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (!this.pythonProcess.stdout || !this.pythonProcess.stdin) {
      throw new Error('Failed to initialize Python process');
    }

    // Handle Python output
    this.pythonProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter((l: string) => l.trim());

      lines.forEach((line: string) => {
        try {
          const response = JSON.parse(line);
          this.emit('python-response', response);
        } catch (err) {
          logger.error({ err, line }, 'Failed to parse Python response');
        }
      });
    });

    this.pythonProcess.stderr?.on('data', (data) => {
      logger.error({ output: data.toString() }, 'Python error');
    });

    this.pythonProcess.on('exit', (code) => {
      logger.warn({ code }, 'Python process exited');
      this.pythonProcess = null;
    });

    logger.info('ETL Pipeline initialized');
  }

  async callPython<T = any>(command: string, data: any): Promise<T> {
    if (!this.pythonProcess || !this.pythonProcess.stdin) {
      throw new Error('Python process not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Python call timeout'));
      }, 30000);

      const handler = (response: any) => {
        clearTimeout(timeout);
        if (response.status === 'success') {
          resolve(response.result);
        } else {
          reject(new Error(response.error || 'Python processing failed'));
        }
        this.off('python-response', handler);
      };

      this.once('python-response', handler);

      const request = JSON.stringify({ command, ...data }) + '\n';
      this.pythonProcess!.stdin!.write(request);
    });
  }

  async runJob(config: ETLJobConfig): Promise<ETLResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      logger.info({ job_id: config.job_id }, 'Starting ETL job');

      // 1. Load data (simplified - would load from actual source)
      const sourceData = await this.loadData(config.source_path, config.source_type);

      // 2. Validate with TypeScript (Zod)
      logger.info('Running TypeScript validation');
      const schema = getSchemaByName(config.schema_name);
      const tsValidation = validateBatch(sourceData, schema);

      if (!tsValidation.valid && config.validation_mode === 'strict') {
        throw new Error(`Validation failed: ${tsValidation.errors.length} errors`);
      }

      // 3. Transform with Python (pandas)
      logger.info('Running Python transformations');
      const transformedData = await this.callPython<any[]>('transform_batch', {
        data: sourceData,
        transformations: config.transformations,
      });

      // 4. Validate transformed data with Python (Pydantic)
      // This would be done via another Python call in a real implementation

      // 5. Save data
      const outputPath = await this.saveData(
        transformedData,
        config.target_path,
        config.target_type
      );

      const duration = Date.now() - startTime;

      const result: ETLResult = {
        job_id: config.job_id,
        status: 'success',
        records_processed: sourceData.length,
        records_succeeded: transformedData.length,
        records_failed: sourceData.length - transformedData.length,
        duration_ms: duration,
        validation: tsValidation,
        transformations_applied: config.transformations,
        output_path: outputPath,
        errors,
      };

      logger.info({ result }, 'ETL job completed');
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      logger.error({ error, job_id: config.job_id }, 'ETL job failed');

      return {
        job_id: config.job_id,
        status: 'failed',
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0,
        duration_ms: duration,
        validation: {
          valid: false,
          total_records: 0,
          valid_records: 0,
          invalid_records: 0,
          errors: [],
          duration_ms: 0,
        },
        transformations_applied: [],
        errors,
      };
    }
  }

  private async loadData(path: string, type: string): Promise<any[]> {
    // Simplified loader - would integrate with actual file readers
    // For demo, return sample data
    return [
      {
        id: 1,
        email: 'user1@example.com',
        name: 'User One',
        age: 25,
        created_at: new Date().toISOString(),
        is_active: true,
        tags: ['premium'],
      },
      {
        id: 2,
        email: 'user2@example.com',
        name: 'User Two',
        age: 30,
        created_at: new Date().toISOString(),
        is_active: true,
        tags: ['basic'],
      },
    ];
  }

  private async saveData(data: any[], path: string, type: string): Promise<string> {
    // Simplified saver - would write to actual files
    logger.info({ path, type, count: data.length }, 'Saving data');
    return path;
  }

  async shutdown(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    logger.info('ETL Pipeline shutdown');
  }
}
