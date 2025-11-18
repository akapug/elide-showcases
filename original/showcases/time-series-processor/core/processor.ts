/**
 * Time-Series Processor - TypeScript ingestion layer
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import pino from 'pino';

const logger = pino();

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface Statistics {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  count: number;
  skewness: number;
  kurtosis: number;
}

export class TimeSeriesProcessor extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private buffer: Map<string, TimeSeriesDataPoint[]> = new Map();

  async initialize(): Promise<void> {
    this.pythonProcess = spawn('python3', ['python/analytics.py'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (!this.pythonProcess.stdout || !this.pythonProcess.stdin) {
      throw new Error('Failed to initialize Python process');
    }

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

    logger.info('Time-series processor initialized');
  }

  async callPython<T = any>(command: string, params: any): Promise<T> {
    if (!this.pythonProcess || !this.pythonProcess.stdin) {
      throw new Error('Python process not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Python call timeout'));
      }, 10000);

      const handler = (response: any) => {
        clearTimeout(timeout);
        if (response.status === 'success') {
          resolve(response.result);
        } else {
          reject(new Error(response.error));
        }
        this.off('python-response', handler);
      };

      this.once('python-response', handler);

      const request = JSON.stringify({ command, ...params }) + '\n';
      this.pythonProcess!.stdin!.write(request);
    });
  }

  async ingest(sensorId: string, dataPoints: TimeSeriesDataPoint[]): Promise<void> {
    // Buffer in TypeScript
    if (!this.buffer.has(sensorId)) {
      this.buffer.set(sensorId, []);
    }
    this.buffer.get(sensorId)!.push(...dataPoints);

    // Send to Python for analytics
    const timestamps = dataPoints.map(d => d.timestamp);
    const values = dataPoints.map(d => d.value);

    await this.callPython('add_datapoints', {
      sensor_id: sensorId,
      timestamps,
      values,
    });
  }

  async getStatistics(sensorId: string): Promise<Statistics> {
    return this.callPython<Statistics>('statistics', { sensor_id: sensorId });
  }

  async detectAnomalies(sensorId: string, threshold: number = 3.0): Promise<any> {
    return this.callPython('detect_anomalies', { sensor_id: sensorId, threshold });
  }

  async getTrends(sensorId: string, window: number = 20): Promise<any> {
    return this.callPython('trends', { sensor_id: sensorId, window });
  }

  async resample(sensorId: string, frequency: string = '1H'): Promise<any> {
    return this.callPython('resample', { sensor_id: sensorId, freq: frequency });
  }

  getBufferSize(sensorId: string): number {
    return this.buffer.get(sensorId)?.length || 0;
  }

  async shutdown(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
}
