/**
 * Pipeline Monitor
 *
 * Monitors and collects metrics for ETL pipeline execution.
 */

import { EventEmitter } from 'events';
import { PipelineResult, StageResult } from './pipeline';

// Pipeline metrics
export interface PipelineMetrics {
  runId: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: 'running' | 'completed' | 'failed';
  stages: StageMetrics[];
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  throughputRecordsPerSec?: number;
}

// Stage metrics
export interface StageMetrics {
  stage: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsFailed: number;
  throughputRecordsPerSec?: number;
  error?: string;
}

// Aggregated metrics
export interface AggregatedMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  averageDurationMs: number;
  totalRecordsProcessed: number;
  averageThroughput: number;
  lastRun?: Date;
  stageDurations: Record<string, number>;
}

/**
 * Pipeline Monitor
 */
export class PipelineMonitor extends EventEmitter {
  private metrics: Map<string, PipelineMetrics> = new Map();
  private maxRetainedRuns: number = 100;

  constructor(maxRetainedRuns: number = 100) {
    super();
    this.maxRetainedRuns = maxRetainedRuns;
  }

  /**
   * Record pipeline start
   */
  recordPipelineStart(runId: string): void {
    const metrics: PipelineMetrics = {
      runId,
      startTime: new Date(),
      status: 'running',
      stages: [],
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0
    };

    this.metrics.set(runId, metrics);
    this.emit('metrics:update', metrics);
  }

  /**
   * Record pipeline completion
   */
  recordPipelineComplete(result: PipelineResult): void {
    const metrics = this.metrics.get(result.runId);

    if (!metrics) {
      console.warn(`Metrics not found for run ${result.runId}`);
      return;
    }

    metrics.endTime = result.endTime;
    metrics.durationMs = result.durationMs;
    metrics.status = result.success ? 'completed' : 'failed';
    metrics.totalRecords = result.totalRecords;
    metrics.successfulRecords = result.successfulRecords;
    metrics.failedRecords = result.failedRecords;

    if (metrics.durationMs > 0) {
      metrics.throughputRecordsPerSec = (result.successfulRecords / metrics.durationMs) * 1000;
    }

    this.emit('metrics:update', metrics);
    this.pruneMetrics();
  }

  /**
   * Record stage start
   */
  recordStageStart(runId: string, stageName: string): void {
    const metrics = this.metrics.get(runId);

    if (!metrics) {
      console.warn(`Metrics not found for run ${runId}`);
      return;
    }

    const stageMetrics: StageMetrics = {
      stage: stageName,
      startTime: new Date(),
      status: 'running',
      recordsProcessed: 0,
      recordsFailed: 0
    };

    metrics.stages.push(stageMetrics);
    this.emit('metrics:update', metrics);
  }

  /**
   * Record stage completion
   */
  recordStageComplete(runId: string, stageName: string, result: StageResult): void {
    const metrics = this.metrics.get(runId);

    if (!metrics) {
      console.warn(`Metrics not found for run ${runId}`);
      return;
    }

    const stageMetrics = metrics.stages.find(s => s.stage === stageName);

    if (!stageMetrics) {
      console.warn(`Stage metrics not found for ${stageName} in run ${runId}`);
      return;
    }

    stageMetrics.endTime = new Date();
    stageMetrics.durationMs = result.metrics.durationMs;
    stageMetrics.status = result.success ? 'completed' : 'failed';
    stageMetrics.recordsProcessed = result.metrics.recordsProcessed;
    stageMetrics.recordsFailed = result.metrics.recordsFailed;

    if (stageMetrics.durationMs > 0) {
      stageMetrics.throughputRecordsPerSec =
        (result.metrics.recordsProcessed / stageMetrics.durationMs) * 1000;
    }

    this.emit('metrics:update', metrics);
  }

  /**
   * Record stage error
   */
  recordStageError(runId: string, stageName: string, error: Error): void {
    const metrics = this.metrics.get(runId);

    if (!metrics) {
      console.warn(`Metrics not found for run ${runId}`);
      return;
    }

    const stageMetrics = metrics.stages.find(s => s.stage === stageName);

    if (!stageMetrics) {
      console.warn(`Stage metrics not found for ${stageName} in run ${runId}`);
      return;
    }

    stageMetrics.status = 'failed';
    stageMetrics.error = error.message;

    this.emit('metrics:update', metrics);
  }

  /**
   * Get metrics for a specific run
   */
  getMetrics(runId: string): PipelineMetrics | null {
    return this.metrics.get(runId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PipelineMetrics[] {
    return Array.from(this.metrics.values()).sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(): AggregatedMetrics {
    const allMetrics = Array.from(this.metrics.values());

    if (allMetrics.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        successRate: 0,
        averageDurationMs: 0,
        totalRecordsProcessed: 0,
        averageThroughput: 0,
        stageDurations: {}
      };
    }

    const completedRuns = allMetrics.filter(m => m.status !== 'running');
    const successfulRuns = completedRuns.filter(m => m.status === 'completed');
    const failedRuns = completedRuns.filter(m => m.status === 'failed');

    const totalDuration = completedRuns.reduce((sum, m) => sum + (m.durationMs || 0), 0);
    const totalRecords = completedRuns.reduce((sum, m) => sum + m.successfulRecords, 0);

    // Calculate average stage durations
    const stageDurations: Record<string, number[]> = {};

    for (const metrics of completedRuns) {
      for (const stage of metrics.stages) {
        if (stage.durationMs !== undefined) {
          if (!stageDurations[stage.stage]) {
            stageDurations[stage.stage] = [];
          }
          stageDurations[stage.stage].push(stage.durationMs);
        }
      }
    }

    const averageStageDurations: Record<string, number> = {};

    for (const [stage, durations] of Object.entries(stageDurations)) {
      const sum = durations.reduce((a, b) => a + b, 0);
      averageStageDurations[stage] = sum / durations.length;
    }

    // Calculate average throughput
    const throughputs = completedRuns
      .filter(m => m.throughputRecordsPerSec !== undefined)
      .map(m => m.throughputRecordsPerSec!);

    const averageThroughput = throughputs.length > 0
      ? throughputs.reduce((a, b) => a + b, 0) / throughputs.length
      : 0;

    return {
      totalRuns: allMetrics.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successRate: completedRuns.length > 0
        ? successfulRuns.length / completedRuns.length
        : 0,
      averageDurationMs: completedRuns.length > 0
        ? totalDuration / completedRuns.length
        : 0,
      totalRecordsProcessed: totalRecords,
      averageThroughput,
      lastRun: allMetrics[0]?.startTime,
      stageDurations: averageStageDurations
    };
  }

  /**
   * Get metrics summary for recent runs
   */
  getRecentMetrics(count: number = 10): PipelineMetrics[] {
    return this.getAllMetrics().slice(0, count);
  }

  /**
   * Get failed runs
   */
  getFailedRuns(): PipelineMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => m.status === 'failed')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Get running pipelines
   */
  getRunningPipelines(): PipelineMetrics[] {
    return Array.from(this.metrics.values()).filter(m => m.status === 'running');
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.emit('metrics:cleared');
  }

  /**
   * Prune old metrics to avoid memory issues
   */
  private pruneMetrics(): void {
    const allMetrics = this.getAllMetrics();

    if (allMetrics.length <= this.maxRetainedRuns) {
      return;
    }

    // Keep only the most recent runs
    const toKeep = allMetrics.slice(0, this.maxRetainedRuns);
    const toRemove = allMetrics.slice(this.maxRetainedRuns);

    this.metrics.clear();

    for (const metrics of toKeep) {
      this.metrics.set(metrics.runId, metrics);
    }

    console.log(`Pruned ${toRemove.length} old metric entries`);
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    const data = {
      metrics: this.getAllMetrics(),
      aggregated: this.getAggregatedMetrics(),
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate metrics report
   */
  generateReport(): string {
    const aggregated = this.getAggregatedMetrics();
    const recent = this.getRecentMetrics(5);
    const failed = this.getFailedRuns();

    let report = '=== Pipeline Metrics Report ===\n\n';

    report += '## Summary\n';
    report += `Total Runs: ${aggregated.totalRuns}\n`;
    report += `Successful Runs: ${aggregated.successfulRuns}\n`;
    report += `Failed Runs: ${aggregated.failedRuns}\n`;
    report += `Success Rate: ${(aggregated.successRate * 100).toFixed(2)}%\n`;
    report += `Average Duration: ${(aggregated.averageDurationMs / 1000).toFixed(2)}s\n`;
    report += `Total Records Processed: ${aggregated.totalRecordsProcessed}\n`;
    report += `Average Throughput: ${aggregated.averageThroughput.toFixed(2)} records/sec\n`;

    if (aggregated.lastRun) {
      report += `Last Run: ${aggregated.lastRun.toISOString()}\n`;
    }

    report += '\n## Average Stage Durations\n';
    for (const [stage, duration] of Object.entries(aggregated.stageDurations)) {
      report += `${stage}: ${(duration / 1000).toFixed(2)}s\n`;
    }

    report += '\n## Recent Runs\n';
    for (const metrics of recent) {
      report += `\nRun: ${metrics.runId}\n`;
      report += `  Status: ${metrics.status}\n`;
      report += `  Start: ${metrics.startTime.toISOString()}\n`;

      if (metrics.durationMs !== undefined) {
        report += `  Duration: ${(metrics.durationMs / 1000).toFixed(2)}s\n`;
      }

      report += `  Records: ${metrics.successfulRecords}/${metrics.totalRecords}\n`;

      if (metrics.throughputRecordsPerSec !== undefined) {
        report += `  Throughput: ${metrics.throughputRecordsPerSec.toFixed(2)} records/sec\n`;
      }

      for (const stage of metrics.stages) {
        report += `    Stage ${stage.stage}: ${stage.status}`;

        if (stage.durationMs !== undefined) {
          report += ` (${(stage.durationMs / 1000).toFixed(2)}s)`;
        }

        report += `\n`;
      }
    }

    if (failed.length > 0) {
      report += '\n## Failed Runs\n';
      for (const metrics of failed.slice(0, 5)) {
        report += `\nRun: ${metrics.runId}\n`;
        report += `  Start: ${metrics.startTime.toISOString()}\n`;

        const failedStage = metrics.stages.find(s => s.status === 'failed');
        if (failedStage?.error) {
          report += `  Error: ${failedStage.error}\n`;
        }
      }
    }

    report += '\n=== End of Report ===\n';

    return report;
  }
}
