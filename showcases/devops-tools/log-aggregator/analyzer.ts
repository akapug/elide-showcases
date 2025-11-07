/**
 * Log Analyzer
 *
 * Analyzes collected logs for insights, trends, and actionable intelligence.
 * Integrates with Python parser for advanced analytics.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { LogEntry } from './collector';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AnalysisResult {
  summary: AnalysisSummary;
  statistics: Statistics;
  anomalies: Anomaly[];
  patterns: PatternAnalysis;
  sources: SourceAnalysis;
  recommendations: Recommendation[];
}

export interface AnalysisSummary {
  totalEntries: number;
  anomaliesDetected: number;
  entropy: number;
  healthScore: number;
  timeRange: {
    start: Date;
    end: Date;
    durationMs: number;
  };
}

export interface Statistics {
  totalEntries: number;
  timeSpanSeconds: number;
  ratePerSecond: number;
  levelDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  errorRate: number;
  errorCount: number;
  messageLength: {
    avg: number;
    min: number;
    max: number;
  };
  patternsFound: Record<string, number>;
}

export interface Anomaly {
  entry: LogEntry;
  anomaly: {
    score: number;
    reasons: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface PatternAnalysis {
  [pattern: string]: {
    total: number;
    unique: number;
    top5: Array<[string, number]>;
  };
}

export interface SourceAnalysis {
  [source: string]: {
    count: number;
    levels: Record<string, number>;
    errorCount: number;
    errorRate: number;
  };
}

export interface Recommendation {
  type: 'error' | 'performance' | 'security' | 'optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedSources?: string[];
  suggestedAction: string;
}

export interface TrendData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface TimeSeriesAnalysis {
  source: string;
  metric: 'count' | 'errorRate' | 'avgDuration';
  data: TrendData[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  prediction?: number;
}

// ============================================================================
// Log Analyzer
// ============================================================================

export class LogAnalyzer {
  private pythonParserPath: string;

  constructor(pythonParserPath?: string) {
    this.pythonParserPath = pythonParserPath || path.join(__dirname, 'parser.py');
  }

  /**
   * Analyze a batch of log entries
   */
  async analyze(entries: LogEntry[]): Promise<AnalysisResult> {
    console.log(`[LogAnalyzer] Analyzing ${entries.length} entries`);

    if (entries.length === 0) {
      return this.emptyResult();
    }

    // Run Python analysis
    const pythonResults = await this.runPythonAnalysis(entries);

    // Generate recommendations
    const recommendations = this.generateRecommendations(pythonResults, entries);

    // Combine results
    const result: AnalysisResult = {
      summary: {
        ...pythonResults.summary,
        timeRange: this.getTimeRange(entries),
      },
      statistics: pythonResults.statistics,
      anomalies: pythonResults.anomalies,
      patterns: pythonResults.patterns,
      sources: pythonResults.sources,
      recommendations,
    };

    return result;
  }

  /**
   * Run Python analysis script
   */
  private async runPythonAnalysis(entries: LogEntry[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.pythonParserPath)) {
        console.warn('[LogAnalyzer] Python parser not found, using basic analysis');
        resolve(this.basicAnalysis(entries));
        return;
      }

      const python = spawn('python3', [this.pythonParserPath]);

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('[LogAnalyzer] Python error:', errorOutput);
          resolve(this.basicAnalysis(entries));
          return;
        }

        try {
          const results = JSON.parse(output);
          resolve(results);
        } catch (e) {
          console.error('[LogAnalyzer] Failed to parse Python output:', e);
          resolve(this.basicAnalysis(entries));
        }
      });

      // Send entries to Python
      python.stdin.write(JSON.stringify(entries));
      python.stdin.end();
    });
  }

  /**
   * Basic analysis fallback (when Python is not available)
   */
  private basicAnalysis(entries: LogEntry[]): any {
    const levelCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let errorCount = 0;

    for (const entry of entries) {
      levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
      sourceCounts[entry.source] = (sourceCounts[entry.source] || 0) + 1;

      if (entry.level === 'ERROR' || entry.level === 'FATAL') {
        errorCount++;
      }
    }

    const timestamps = entries.map(e => new Date(e.timestamp).getTime());
    const timeSpan = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;

    return {
      summary: {
        totalEntries: entries.length,
        anomaliesDetected: 0,
        entropy: 0,
        healthScore: 100 - (errorCount / entries.length) * 100,
      },
      statistics: {
        totalEntries: entries.length,
        timeSpanSeconds: timeSpan,
        ratePerSecond: entries.length / Math.max(timeSpan, 1),
        levelDistribution: levelCounts,
        sourceDistribution: sourceCounts,
        errorRate: errorCount / entries.length,
        errorCount,
        messageLength: {
          avg: entries.reduce((sum, e) => sum + e.message.length, 0) / entries.length,
          min: Math.min(...entries.map(e => e.message.length)),
          max: Math.max(...entries.map(e => e.message.length)),
        },
        patternsFound: {},
      },
      anomalies: [],
      patterns: {},
      sources: {},
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    pythonResults: any,
    entries: LogEntry[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check error rate
    if (pythonResults.statistics.errorRate > 0.1) {
      recommendations.push({
        type: 'error',
        severity: 'high',
        title: 'High Error Rate Detected',
        description: `Error rate is ${(pythonResults.statistics.errorRate * 100).toFixed(2)}%, which is above the 10% threshold.`,
        suggestedAction: 'Review error logs and investigate root causes. Consider implementing better error handling.',
      });
    }

    // Check for anomalies
    if (pythonResults.anomalies.length > 0) {
      const criticalAnomalies = pythonResults.anomalies.filter(
        (a: any) => a.anomaly.severity === 'critical'
      );

      if (criticalAnomalies.length > 0) {
        recommendations.push({
          type: 'error',
          severity: 'critical',
          title: 'Critical Anomalies Detected',
          description: `Found ${criticalAnomalies.length} critical anomalies in the logs.`,
          suggestedAction: 'Investigate critical anomalies immediately. Check system health and recent deployments.',
        });
      }
    }

    // Check health score
    if (pythonResults.summary.healthScore < 50) {
      recommendations.push({
        type: 'error',
        severity: 'critical',
        title: 'Low Health Score',
        description: `System health score is ${pythonResults.summary.healthScore.toFixed(2)}/100, indicating significant issues.`,
        suggestedAction: 'Perform immediate system health check. Review all error logs and address critical issues.',
      });
    } else if (pythonResults.summary.healthScore < 80) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        title: 'Degraded System Health',
        description: `System health score is ${pythonResults.summary.healthScore.toFixed(2)}/100.`,
        suggestedAction: 'Monitor system closely and address error sources.',
      });
    }

    // Check log rate
    if (pythonResults.statistics.ratePerSecond > 1000) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        title: 'High Log Volume',
        description: `Logging rate is ${pythonResults.statistics.ratePerSecond.toFixed(2)} logs/sec, which may impact performance.`,
        suggestedAction: 'Review logging configuration. Consider reducing log verbosity or implementing sampling.',
      });
    }

    // Check for security patterns
    const securityKeywords = ['authentication failed', 'access denied', 'unauthorized', 'forbidden'];
    const securityIssues = entries.filter(e =>
      securityKeywords.some(keyword => e.message.toLowerCase().includes(keyword))
    );

    if (securityIssues.length > 10) {
      recommendations.push({
        type: 'security',
        severity: 'high',
        title: 'Multiple Security Events',
        description: `Detected ${securityIssues.length} potential security-related log entries.`,
        suggestedAction: 'Review security logs for potential attacks or misconfigurations. Check authentication systems.',
      });
    }

    // Source-specific recommendations
    for (const [source, data] of Object.entries(pythonResults.sources as any)) {
      if (data.errorRate > 0.2) {
        recommendations.push({
          type: 'error',
          severity: 'high',
          title: `High Error Rate in ${source}`,
          description: `Source "${source}" has an error rate of ${(data.errorRate * 100).toFixed(2)}%.`,
          affectedSources: [source],
          suggestedAction: `Investigate errors in ${source}. Check for service issues or misconfigurations.`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Analyze time series trends
   */
  async analyzeTrends(
    entries: LogEntry[],
    bucketSize: number = 60000 // 1 minute buckets
  ): Promise<TimeSeriesAnalysis[]> {
    const sourceData = new Map<string, LogEntry[]>();

    // Group by source
    for (const entry of entries) {
      if (!sourceData.has(entry.source)) {
        sourceData.set(entry.source, []);
      }
      sourceData.get(entry.source)!.push(entry);
    }

    const analyses: TimeSeriesAnalysis[] = [];

    // Analyze each source
    for (const [source, sourceEntries] of sourceData) {
      // Sort by timestamp
      sourceEntries.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Create time buckets
      const buckets = this.createTimeBuckets(sourceEntries, bucketSize);

      // Analyze count trend
      const countData = buckets.map(bucket => ({
        timestamp: new Date(bucket.start),
        value: bucket.entries.length,
      }));

      analyses.push({
        source,
        metric: 'count',
        data: countData,
        trend: this.detectTrend(countData.map(d => d.value)),
        prediction: this.predictNext(countData.map(d => d.value)),
      });

      // Analyze error rate trend
      const errorRateData = buckets.map(bucket => {
        const errors = bucket.entries.filter(e =>
          e.level === 'ERROR' || e.level === 'FATAL'
        ).length;
        return {
          timestamp: new Date(bucket.start),
          value: bucket.entries.length > 0 ? errors / bucket.entries.length : 0,
        };
      });

      analyses.push({
        source,
        metric: 'errorRate',
        data: errorRateData,
        trend: this.detectTrend(errorRateData.map(d => d.value)),
      });
    }

    return analyses;
  }

  /**
   * Create time buckets for time series analysis
   */
  private createTimeBuckets(
    entries: LogEntry[],
    bucketSize: number
  ): Array<{ start: number; end: number; entries: LogEntry[] }> {
    if (entries.length === 0) {
      return [];
    }

    const firstTimestamp = new Date(entries[0].timestamp).getTime();
    const lastTimestamp = new Date(entries[entries.length - 1].timestamp).getTime();

    const buckets: Array<{ start: number; end: number; entries: LogEntry[] }> = [];
    let currentStart = firstTimestamp;

    while (currentStart <= lastTimestamp) {
      const currentEnd = currentStart + bucketSize;
      const bucketEntries = entries.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= currentStart && t < currentEnd;
      });

      buckets.push({
        start: currentStart,
        end: currentEnd,
        entries: bucketEntries,
      });

      currentStart = currentEnd;
    }

    return buckets;
  }

  /**
   * Detect trend in time series data
   */
  private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (values.length < 3) {
      return 'stable';
    }

    // Calculate linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate variance for volatility
    const mean = sumY / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const coeffVar = mean !== 0 ? stdDev / mean : 0;

    // Determine trend
    if (coeffVar > 0.5) {
      return 'volatile';
    } else if (Math.abs(slope) < 0.01) {
      return 'stable';
    } else if (slope > 0) {
      return 'increasing';
    } else {
      return 'decreasing';
    }
  }

  /**
   * Simple prediction using moving average
   */
  private predictNext(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    // Use last 5 values for prediction
    const window = Math.min(5, values.length);
    const recent = values.slice(-window);
    return recent.reduce((a, b) => a + b, 0) / window;
  }

  /**
   * Get time range from entries
   */
  private getTimeRange(entries: LogEntry[]): AnalysisSummary['timeRange'] {
    const timestamps = entries.map(e => new Date(e.timestamp));
    const start = new Date(Math.min(...timestamps.map(t => t.getTime())));
    const end = new Date(Math.max(...timestamps.map(t => t.getTime())));

    return {
      start,
      end,
      durationMs: end.getTime() - start.getTime(),
    };
  }

  /**
   * Empty result for when no entries are provided
   */
  private emptyResult(): AnalysisResult {
    return {
      summary: {
        totalEntries: 0,
        anomaliesDetected: 0,
        entropy: 0,
        healthScore: 100,
        timeRange: {
          start: new Date(),
          end: new Date(),
          durationMs: 0,
        },
      },
      statistics: {
        totalEntries: 0,
        timeSpanSeconds: 0,
        ratePerSecond: 0,
        levelDistribution: {},
        sourceDistribution: {},
        errorRate: 0,
        errorCount: 0,
        messageLength: { avg: 0, min: 0, max: 0 },
        patternsFound: {},
      },
      anomalies: [],
      patterns: {},
      sources: {},
      recommendations: [],
    };
  }

  /**
   * Export analysis results to file
   */
  async exportResults(result: AnalysisResult, outputPath: string): Promise<void> {
    const data = JSON.stringify(result, null, 2);
    await fs.promises.writeFile(outputPath, data, 'utf8');
    console.log(`[LogAnalyzer] Results exported to ${outputPath}`);
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(result: AnalysisResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Log Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; margin-top: 5px; }
    .health-score { font-size: 36px; color: ${result.summary.healthScore > 80 ? '#28a745' : result.summary.healthScore > 50 ? '#ffc107' : '#dc3545'}; }
    .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
    .recommendation.critical { background: #f8d7da; border-left-color: #dc3545; }
    .recommendation.high { background: #f8d7da; border-left-color: #dc3545; }
    .anomaly { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 3px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Log Analysis Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>

    <h2>Summary</h2>
    <div class="summary">
      <div class="metric">
        <div class="metric-label">Total Entries</div>
        <div class="metric-value">${result.summary.totalEntries.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Health Score</div>
        <div class="metric-value health-score">${result.summary.healthScore.toFixed(1)}/100</div>
      </div>
      <div class="metric">
        <div class="metric-label">Anomalies</div>
        <div class="metric-value">${result.summary.anomaliesDetected}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Error Rate</div>
        <div class="metric-value">${(result.statistics.errorRate * 100).toFixed(2)}%</div>
      </div>
    </div>

    <h2>Recommendations</h2>
    ${result.recommendations.map(r => `
      <div class="recommendation ${r.severity}">
        <strong>${r.title}</strong> [${r.severity.toUpperCase()}]
        <p>${r.description}</p>
        <p><em>Action: ${r.suggestedAction}</em></p>
      </div>
    `).join('')}

    <h2>Statistics</h2>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Time Span</td><td>${result.statistics.timeSpanSeconds.toFixed(2)}s</td></tr>
      <tr><td>Rate</td><td>${result.statistics.ratePerSecond.toFixed(2)} logs/s</td></tr>
      <tr><td>Error Count</td><td>${result.statistics.errorCount}</td></tr>
      <tr><td>Avg Message Length</td><td>${result.statistics.messageLength.avg.toFixed(2)} chars</td></tr>
    </table>

    <h2>Level Distribution</h2>
    <table>
      <tr><th>Level</th><th>Count</th><th>Percentage</th></tr>
      ${Object.entries(result.statistics.levelDistribution).map(([level, count]) => `
        <tr>
          <td>${level}</td>
          <td>${count}</td>
          <td>${((count / result.summary.totalEntries) * 100).toFixed(2)}%</td>
        </tr>
      `).join('')}
    </table>

    ${result.anomalies.length > 0 ? `
      <h2>Top Anomalies</h2>
      ${result.anomalies.slice(0, 10).map(a => `
        <div class="anomaly">
          <strong>[${a.anomaly.severity.toUpperCase()}] Score: ${a.anomaly.score.toFixed(2)}</strong>
          <p>${a.entry.message}</p>
          <p><em>Reasons: ${a.anomaly.reasons.join(', ')}</em></p>
        </div>
      `).join('')}
    ` : ''}
  </div>
</body>
</html>
    `;
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  console.log('=== Log Analyzer ===\n');

  // Example usage
  const analyzer = new LogAnalyzer();

  // Read sample logs
  const sampleLogs: LogEntry[] = [
    {
      timestamp: new Date(),
      level: 'INFO',
      source: 'app',
      message: 'Application started',
      rawMessage: 'Application started',
    },
    {
      timestamp: new Date(),
      level: 'ERROR',
      source: 'database',
      message: 'Connection timeout',
      rawMessage: 'Connection timeout',
    },
  ];

  const results = await analyzer.analyze(sampleLogs);

  console.log('Analysis Results:');
  console.log(JSON.stringify(results, null, 2));

  // Generate HTML report
  const html = analyzer.generateHtmlReport(results);
  await fs.promises.writeFile('/tmp/log-analysis.html', html);
  console.log('\nHTML report saved to /tmp/log-analysis.html');
}

if (require.main === module) {
  main().catch(console.error);
}
