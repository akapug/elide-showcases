/**
 * Data Quality Checker
 *
 * Production-grade data quality monitoring:
 * - Completeness checks
 * - Accuracy validation
 * - Consistency verification
 * - Timeliness checks
 * - Uniqueness validation
 * - Data anomaly detection
 * - Quality score calculation
 * - Quality reports and alerts
 */

export interface QualityRule {
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'uniqueness' | 'timeliness' | 'validity' | 'custom';
  field?: string;
  threshold?: number;
  condition?: (record: any, dataset: any[]) => boolean;
  severity: 'critical' | 'warning' | 'info';
}

export interface QualityCheckResult {
  ruleName: string;
  passed: boolean;
  score: number;
  severity: string;
  failedRecords: number;
  totalRecords: number;
  details: string;
  failures: any[];
}

export interface QualityReport {
  timestamp: number;
  totalRecords: number;
  overallScore: number;
  passedChecks: number;
  failedChecks: number;
  checks: QualityCheckResult[];
  recommendations: string[];
}

// ==================== Quality Checker ====================

export class DataQualityChecker {
  private rules: QualityRule[];
  private thresholds: Map<string, number>;

  constructor(rules: QualityRule[] = []) {
    this.rules = rules;
    this.thresholds = new Map([
      ['completeness', 0.95],
      ['accuracy', 0.98],
      ['consistency', 0.99],
      ['uniqueness', 0.95],
      ['validity', 0.95]
    ]);
  }

  addRule(rule: QualityRule): void {
    this.rules.push(rule);
  }

  setThreshold(type: string, threshold: number): void {
    this.thresholds.set(type, threshold);
  }

  check(data: any[]): QualityReport {
    const results: QualityCheckResult[] = [];
    const startTime = Date.now();

    for (const rule of this.rules) {
      const result = this.checkRule(data, rule);
      results.push(result);
    }

    // Calculate overall metrics
    const passedChecks = results.filter(r => r.passed).length;
    const failedChecks = results.length - passedChecks;
    const overallScore = this.calculateOverallScore(results);
    const recommendations = this.generateRecommendations(results);

    return {
      timestamp: startTime,
      totalRecords: data.length,
      overallScore,
      passedChecks,
      failedChecks,
      checks: results,
      recommendations
    };
  }

  private checkRule(data: any[], rule: QualityRule): QualityCheckResult {
    let passed = false;
    let score = 0;
    let failedRecords = 0;
    let details = '';
    const failures: any[] = [];

    switch (rule.type) {
      case 'completeness':
        ({ passed, score, failedRecords, details, failures } = this.checkCompleteness(data, rule));
        break;
      case 'accuracy':
        ({ passed, score, failedRecords, details, failures } = this.checkAccuracy(data, rule));
        break;
      case 'consistency':
        ({ passed, score, failedRecords, details, failures } = this.checkConsistency(data, rule));
        break;
      case 'uniqueness':
        ({ passed, score, failedRecords, details, failures } = this.checkUniqueness(data, rule));
        break;
      case 'timeliness':
        ({ passed, score, failedRecords, details, failures } = this.checkTimeliness(data, rule));
        break;
      case 'validity':
        ({ passed, score, failedRecords, details, failures } = this.checkValidity(data, rule));
        break;
      case 'custom':
        ({ passed, score, failedRecords, details, failures } = this.checkCustom(data, rule));
        break;
    }

    return {
      ruleName: rule.name,
      passed,
      score,
      severity: rule.severity,
      failedRecords,
      totalRecords: data.length,
      details,
      failures: failures.slice(0, 10) // Limit to first 10 failures
    };
  }

  private checkCompleteness(data: any[], rule: QualityRule): any {
    const field = rule.field!;
    const threshold = rule.threshold || this.thresholds.get('completeness') || 0.95;

    let nonNullCount = 0;
    const failures: any[] = [];

    for (const record of data) {
      const value = record[field];

      if (value !== null && value !== undefined && value !== '') {
        nonNullCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? nonNullCount / data.length : 0;
    const passed = score >= threshold;

    return {
      passed,
      score,
      failedRecords: data.length - nonNullCount,
      details: `${(score * 100).toFixed(2)}% complete (threshold: ${(threshold * 100).toFixed(2)}%)`,
      failures
    };
  }

  private checkAccuracy(data: any[], rule: QualityRule): any {
    const field = rule.field!;
    const threshold = rule.threshold || this.thresholds.get('accuracy') || 0.98;

    let accurateCount = 0;
    const failures: any[] = [];

    for (const record of data) {
      if (rule.condition && rule.condition(record, data)) {
        accurateCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? accurateCount / data.length : 0;
    const passed = score >= threshold;

    return {
      passed,
      score,
      failedRecords: data.length - accurateCount,
      details: `${(score * 100).toFixed(2)}% accurate (threshold: ${(threshold * 100).toFixed(2)}%)`,
      failures
    };
  }

  private checkConsistency(data: any[], rule: QualityRule): any {
    const field = rule.field!;
    const threshold = rule.threshold || this.thresholds.get('consistency') || 0.99;

    let consistentCount = 0;
    const failures: any[] = [];

    // Check for consistent data types
    const types = new Map<string, number>();

    for (const record of data) {
      const value = record[field];

      if (value === null || value === undefined) continue;

      const type = Array.isArray(value) ? 'array' : typeof value;
      types.set(type, (types.get(type) || 0) + 1);
    }

    const mostCommonType = Array.from(types.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    for (const record of data) {
      const value = record[field];

      if (value === null || value === undefined) continue;

      const type = Array.isArray(value) ? 'array' : typeof value;

      if (type === mostCommonType) {
        consistentCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? consistentCount / data.length : 0;
    const passed = score >= threshold;

    return {
      passed,
      score,
      failedRecords: data.length - consistentCount,
      details: `${(score * 100).toFixed(2)}% consistent (threshold: ${(threshold * 100).toFixed(2)}%)`,
      failures
    };
  }

  private checkUniqueness(data: any[], rule: QualityRule): any {
    const field = rule.field!;
    const threshold = rule.threshold || this.thresholds.get('uniqueness') || 0.95;

    const seen = new Set<any>();
    let uniqueCount = 0;
    const failures: any[] = [];

    for (const record of data) {
      const value = record[field];
      const key = JSON.stringify(value);

      if (!seen.has(key)) {
        seen.add(key);
        uniqueCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? uniqueCount / data.length : 0;
    const passed = score >= threshold;

    return {
      passed,
      score,
      failedRecords: data.length - uniqueCount,
      details: `${(score * 100).toFixed(2)}% unique (threshold: ${(threshold * 100).toFixed(2)}%)`,
      failures
    };
  }

  private checkTimeliness(data: any[], rule: QualityRule): any {
    const field = rule.field!;
    const threshold = rule.threshold || 86400000; // 24 hours in ms

    let timelyCount = 0;
    const failures: any[] = [];
    const now = Date.now();

    for (const record of data) {
      const value = record[field];
      const timestamp = new Date(value).getTime();

      if (!isNaN(timestamp) && now - timestamp <= threshold) {
        timelyCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? timelyCount / data.length : 0;
    const passed = score >= 0.95;

    return {
      passed,
      score,
      failedRecords: data.length - timelyCount,
      details: `${(score * 100).toFixed(2)}% timely (within ${threshold / 3600000}h)`,
      failures
    };
  }

  private checkValidity(data: any[], rule: QualityRule): any {
    const field = rule.field!;
    const threshold = rule.threshold || this.thresholds.get('validity') || 0.95;

    let validCount = 0;
    const failures: any[] = [];

    for (const record of data) {
      if (rule.condition && rule.condition(record, data)) {
        validCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? validCount / data.length : 0;
    const passed = score >= threshold;

    return {
      passed,
      score,
      failedRecords: data.length - validCount,
      details: `${(score * 100).toFixed(2)}% valid (threshold: ${(threshold * 100).toFixed(2)}%)`,
      failures
    };
  }

  private checkCustom(data: any[], rule: QualityRule): any {
    if (!rule.condition) {
      return {
        passed: true,
        score: 1.0,
        failedRecords: 0,
        details: 'No custom condition defined',
        failures: []
      };
    }

    let passedCount = 0;
    const failures: any[] = [];

    for (const record of data) {
      if (rule.condition(record, data)) {
        passedCount++;
      } else {
        failures.push(record);
      }
    }

    const score = data.length > 0 ? passedCount / data.length : 0;
    const threshold = rule.threshold || 0.95;
    const passed = score >= threshold;

    return {
      passed,
      score,
      failedRecords: data.length - passedCount,
      details: `${(score * 100).toFixed(2)}% passed custom check`,
      failures
    };
  }

  private calculateOverallScore(results: QualityCheckResult[]): number {
    if (results.length === 0) return 1.0;

    // Weight critical checks higher
    let totalWeight = 0;
    let weightedScore = 0;

    for (const result of results) {
      const weight = result.severity === 'critical' ? 3 :
                     result.severity === 'warning' ? 2 : 1;

      totalWeight += weight;
      weightedScore += result.score * weight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private generateRecommendations(results: QualityCheckResult[]): string[] {
    const recommendations: string[] = [];

    for (const result of results) {
      if (!result.passed) {
        if (result.failedRecords > 0) {
          recommendations.push(
            `Fix ${result.ruleName}: ${result.failedRecords} records failed (${((1 - result.score) * 100).toFixed(2)}% failure rate)`
          );
        }
      }
    }

    // Add general recommendations based on patterns
    const completenessChecks = results.filter(r => r.ruleName.includes('completeness'));
    const failedCompleteness = completenessChecks.filter(r => !r.passed);

    if (failedCompleteness.length > 0) {
      recommendations.push('Consider implementing data validation at the source to improve completeness');
    }

    const uniquenessChecks = results.filter(r => r.ruleName.includes('uniqueness'));
    const failedUniqueness = uniquenessChecks.filter(r => !r.passed);

    if (failedUniqueness.length > 0) {
      recommendations.push('Add deduplication step to remove duplicate records');
    }

    return recommendations;
  }

  printReport(report: QualityReport): void {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          DATA QUALITY REPORT                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    console.log(`Total Records: ${report.totalRecords}`);
    console.log(`Overall Score: ${(report.overallScore * 100).toFixed(2)}%`);
    console.log(`Passed Checks: ${report.passedChecks}/${report.passedChecks + report.failedChecks}`);
    console.log(`Failed Checks: ${report.failedChecks}\n`);

    console.log('Quality Checks:');
    console.log('─'.repeat(80));

    for (const check of report.checks) {
      const status = check.passed ? '✓' : '✗';
      const color = check.passed ? '' : '';

      console.log(`${status} ${check.ruleName}`);
      console.log(`  Score: ${(check.score * 100).toFixed(2)}% | Severity: ${check.severity}`);
      console.log(`  Failed: ${check.failedRecords}/${check.totalRecords} records`);
      console.log(`  Details: ${check.details}`);

      if (check.failures.length > 0) {
        console.log(`  Sample Failures: ${Math.min(3, check.failures.length)} shown`);
        check.failures.slice(0, 3).forEach((failure, idx) => {
          console.log(`    ${idx + 1}. ${JSON.stringify(failure).substring(0, 60)}...`);
        });
      }

      console.log();
    }

    if (report.recommendations.length > 0) {
      console.log('Recommendations:');
      console.log('─'.repeat(80));
      report.recommendations.forEach((rec, idx) => {
        console.log(`${idx + 1}. ${rec}`);
      });
      console.log();
    }

    console.log('═'.repeat(80) + '\n');
  }
}

// ==================== Anomaly Detector ====================

export class AnomalyDetector {
  private sensitivity: number;

  constructor(sensitivity = 2.0) {
    this.sensitivity = sensitivity;
  }

  detectOutliers(data: any[], field: string): any[] {
    const values = data
      .map(r => r[field])
      .filter(v => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return [];

    const { mean, stddev } = this.calculateStats(values);
    const threshold = this.sensitivity * stddev;

    const outliers: any[] = [];

    for (const record of data) {
      const value = record[field];

      if (typeof value === 'number' && Math.abs(value - mean) > threshold) {
        outliers.push({
          record,
          value,
          deviation: Math.abs(value - mean),
          zScore: (value - mean) / stddev
        });
      }
    }

    return outliers;
  }

  detectPatternBreaks(data: any[], field: string, windowSize = 10): any[] {
    const values = data.map(r => r[field]).filter(v => typeof v === 'number');

    if (values.length < windowSize * 2) return [];

    const anomalies: any[] = [];

    for (let i = windowSize; i < values.length; i++) {
      const window = values.slice(i - windowSize, i);
      const { mean, stddev } = this.calculateStats(window);

      const currentValue = values[i];
      const zScore = Math.abs((currentValue - mean) / stddev);

      if (zScore > this.sensitivity) {
        anomalies.push({
          index: i,
          record: data[i],
          value: currentValue,
          expectedRange: [mean - this.sensitivity * stddev, mean + this.sensitivity * stddev],
          zScore
        });
      }
    }

    return anomalies;
  }

  private calculateStats(values: number[]): { mean: number; stddev: number } {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    return { mean, stddev };
  }
}

// ==================== Quality Metrics Tracker ====================

export class QualityMetricsTracker {
  private history: QualityReport[] = [];
  private maxHistory = 100;

  addReport(report: QualityReport): void {
    this.history.push(report);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getScoreTrend(periods = 10): number[] {
    return this.history
      .slice(-periods)
      .map(r => r.overallScore);
  }

  getAverageScore(): number {
    if (this.history.length === 0) return 0;

    const sum = this.history.reduce((acc, r) => acc + r.overallScore, 0);
    return sum / this.history.length;
  }

  getWorstChecks(limit = 5): { name: string; avgScore: number }[] {
    const checkScores = new Map<string, number[]>();

    for (const report of this.history) {
      for (const check of report.checks) {
        if (!checkScores.has(check.ruleName)) {
          checkScores.set(check.ruleName, []);
        }
        checkScores.get(check.ruleName)!.push(check.score);
      }
    }

    const avgScores = Array.from(checkScores.entries()).map(([name, scores]) => ({
      name,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }));

    return avgScores.sort((a, b) => a.avgScore - b.avgScore).slice(0, limit);
  }

  detectDegradation(threshold = 0.1): boolean {
    if (this.history.length < 2) return false;

    const recent = this.history.slice(-5);
    const older = this.history.slice(-10, -5);

    if (older.length === 0) return false;

    const recentAvg = recent.reduce((acc, r) => acc + r.overallScore, 0) / recent.length;
    const olderAvg = older.reduce((acc, r) => acc + r.overallScore, 0) / older.length;

    return (olderAvg - recentAvg) > threshold;
  }
}

// ==================== Common Quality Rules ====================

export const CommonQualityRules = {
  notNull: (field: string): QualityRule => ({
    name: `${field} completeness`,
    type: 'completeness',
    field,
    threshold: 0.95,
    severity: 'critical'
  }),

  unique: (field: string): QualityRule => ({
    name: `${field} uniqueness`,
    type: 'uniqueness',
    field,
    threshold: 1.0,
    severity: 'critical'
  }),

  positiveNumber: (field: string): QualityRule => ({
    name: `${field} positive values`,
    type: 'validity',
    field,
    condition: (record) => typeof record[field] === 'number' && record[field] >= 0,
    threshold: 1.0,
    severity: 'warning'
  }),

  inRange: (field: string, min: number, max: number): QualityRule => ({
    name: `${field} in range [${min}, ${max}]`,
    type: 'validity',
    field,
    condition: (record) => {
      const value = record[field];
      return typeof value === 'number' && value >= min && value <= max;
    },
    threshold: 0.99,
    severity: 'warning'
  }),

  recentTimestamp: (field: string, maxAgeHours = 24): QualityRule => ({
    name: `${field} timeliness`,
    type: 'timeliness',
    field,
    threshold: maxAgeHours * 3600000,
    severity: 'warning'
  }),

  consistentType: (field: string): QualityRule => ({
    name: `${field} type consistency`,
    type: 'consistency',
    field,
    threshold: 0.99,
    severity: 'warning'
  }),

  referentialIntegrity: (field: string, referenceData: any[], referenceField: string): QualityRule => ({
    name: `${field} referential integrity`,
    type: 'accuracy',
    field,
    condition: (record) => {
      const value = record[field];
      return referenceData.some(ref => ref[referenceField] === value);
    },
    threshold: 0.99,
    severity: 'critical'
  })
};
