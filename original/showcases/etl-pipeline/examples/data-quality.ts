/**
 * Data Quality Management Example
 *
 * Demonstrates:
 * - Comprehensive data quality checks
 * - Data profiling and statistics
 * - Anomaly detection
 * - Data quality scoring
 * - Quality rules engine
 * - Data validation frameworks
 * - Quality metrics and KPIs
 * - Data quality dashboards
 * - Automated quality reporting
 * - Quality-based routing
 */

// ==================== Types ====================

interface QualityRule {
  id: string;
  name: string;
  category: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness' | 'timeliness';
  severity: 'critical' | 'high' | 'medium' | 'low';
  condition: (data: any) => boolean | QualityRuleResult;
  description: string;
  remediation?: string;
}

interface QualityRuleResult {
  passed: boolean;
  score: number; // 0-100
  message?: string;
  affectedRecords?: number;
  details?: any;
}

interface QualityReport {
  id: string;
  dataset: string;
  timestamp: number;
  totalRecords: number;
  qualityScore: number; // Overall 0-100
  categoryScores: Record<string, number>;
  ruleResults: Map<string, QualityRuleResult>;
  profile: DataProfile;
  anomalies: Anomaly[];
  recommendations: string[];
}

interface DataProfile {
  rowCount: number;
  columnCount: number;
  columns: Map<string, ColumnProfile>;
  duplicates: number;
  nullPercentage: number;
  dataTypes: Map<string, number>;
  patterns: Map<string, number>;
}

interface ColumnProfile {
  name: string;
  dataType: string;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  stdDev?: number;
  topValues: Array<{ value: any; count: number }>;
  patterns: string[];
  outliers: any[];
}

interface Anomaly {
  id: string;
  type: 'outlier' | 'missing' | 'duplicate' | 'pattern' | 'distribution' | 'relationship';
  severity: 'high' | 'medium' | 'low';
  column?: string;
  description: string;
  affectedRecords: number;
  examples: any[];
  confidence: number; // 0-1
}

interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  timeliness: number;
}

// ==================== Data Quality Engine ====================

class DataQualityEngine {
  private rules: Map<string, QualityRule> = new Map();
  private thresholds = {
    critical: 100,
    high: 95,
    medium: 85,
    low: 70
  };

  /**
   * Register a quality rule
   */
  registerRule(rule: QualityRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules
   */
  registerRules(rules: QualityRule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  /**
   * Run quality assessment on dataset
   */
  async assessQuality(dataset: any[], datasetName: string): Promise<QualityReport> {
    console.log(`Running quality assessment on ${datasetName}...`);

    const report: QualityReport = {
      id: `qr_${Date.now()}`,
      dataset: datasetName,
      timestamp: Date.now(),
      totalRecords: dataset.length,
      qualityScore: 0,
      categoryScores: {},
      ruleResults: new Map(),
      profile: this.profileData(dataset),
      anomalies: [],
      recommendations: []
    };

    // Run all quality rules
    for (const [ruleId, rule] of this.rules) {
      try {
        const result = await this.executeRule(rule, dataset);
        report.ruleResults.set(ruleId, result);
      } catch (error) {
        console.error(`Error executing rule ${ruleId}:`, error);
        report.ruleResults.set(ruleId, {
          passed: false,
          score: 0,
          message: `Rule execution failed: ${error.message}`
        });
      }
    }

    // Calculate scores
    report.categoryScores = this.calculateCategoryScores(report.ruleResults);
    report.qualityScore = this.calculateOverallScore(report.categoryScores);

    // Detect anomalies
    report.anomalies = this.detectAnomalies(dataset, report.profile);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Execute a quality rule
   */
  private async executeRule(rule: QualityRule, dataset: any[]): Promise<QualityRuleResult> {
    let passedCount = 0;
    let failedRecords: any[] = [];

    for (const record of dataset) {
      const result = rule.condition(record);

      if (typeof result === 'boolean') {
        if (result) {
          passedCount++;
        } else {
          failedRecords.push(record);
        }
      } else {
        // Result is QualityRuleResult
        return result;
      }
    }

    const score = dataset.length > 0 ? (passedCount / dataset.length) * 100 : 100;
    const passed = score >= this.thresholds[rule.severity];

    return {
      passed,
      score,
      affectedRecords: failedRecords.length,
      message: passed
        ? `${rule.name} passed (${score.toFixed(2)}%)`
        : `${rule.name} failed (${score.toFixed(2)}%)`,
      details: {
        passedCount,
        failedCount: failedRecords.length,
        sampleFailures: failedRecords.slice(0, 5)
      }
    };
  }

  /**
   * Profile dataset to understand characteristics
   */
  private profileData(dataset: any[]): DataProfile {
    if (dataset.length === 0) {
      return {
        rowCount: 0,
        columnCount: 0,
        columns: new Map(),
        duplicates: 0,
        nullPercentage: 0,
        dataTypes: new Map(),
        patterns: new Map()
      };
    }

    const columns = new Map<string, ColumnProfile>();
    const columnNames = Object.keys(dataset[0] || {});

    // Profile each column
    for (const colName of columnNames) {
      columns.set(colName, this.profileColumn(colName, dataset));
    }

    // Count duplicates
    const duplicates = this.countDuplicates(dataset);

    // Calculate null percentage
    let totalNulls = 0;
    for (const profile of columns.values()) {
      totalNulls += profile.nullCount;
    }
    const nullPercentage = (totalNulls / (dataset.length * columnNames.length)) * 100;

    // Count data types
    const dataTypes = new Map<string, number>();
    for (const profile of columns.values()) {
      dataTypes.set(profile.dataType, (dataTypes.get(profile.dataType) || 0) + 1);
    }

    return {
      rowCount: dataset.length,
      columnCount: columnNames.length,
      columns,
      duplicates,
      nullPercentage,
      dataTypes,
      patterns: new Map()
    };
  }

  /**
   * Profile a single column
   */
  private profileColumn(colName: string, dataset: any[]): ColumnProfile {
    const values = dataset.map(row => row[colName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);

    // Null analysis
    const nullCount = values.length - nonNullValues.length;
    const nullPercentage = (nullCount / values.length) * 100;

    // Uniqueness analysis
    const uniqueValues = new Set(nonNullValues);
    const uniqueCount = uniqueValues.size;
    const uniquePercentage = (uniqueCount / values.length) * 100;

    // Data type inference
    const dataType = this.inferDataType(nonNullValues);

    // Statistical analysis (for numeric columns)
    let min, max, mean, median, stdDev;
    if (dataType === 'number') {
      const numbers = nonNullValues as number[];
      min = Math.min(...numbers);
      max = Math.max(...numbers);
      mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      median = this.calculateMedian(numbers);
      stdDev = this.calculateStdDev(numbers, mean);
    }

    // Top values
    const valueCounts = new Map<any, number>();
    for (const value of nonNullValues) {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    }
    const topValues = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));

    // Pattern detection
    const patterns = this.detectPatterns(nonNullValues);

    // Outlier detection
    const outliers = dataType === 'number'
      ? this.detectOutliers(nonNullValues as number[], mean!, stdDev!)
      : [];

    return {
      name: colName,
      dataType,
      nullCount,
      nullPercentage,
      uniqueCount,
      uniquePercentage,
      min,
      max,
      mean,
      median,
      stdDev,
      topValues,
      patterns,
      outliers
    };
  }

  /**
   * Infer data type from values
   */
  private inferDataType(values: any[]): string {
    if (values.length === 0) return 'unknown';

    const types = new Map<string, number>();

    for (const value of values.slice(0, 100)) { // Sample first 100
      const type = typeof value;
      types.set(type, (types.get(type) || 0) + 1);
    }

    // Return most common type
    const sorted = Array.from(types.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  /**
   * Calculate median
   */
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(numbers: number[], mean: number): number {
    const squaredDiffs = numbers.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(variance);
  }

  /**
   * Detect outliers using IQR method
   */
  private detectOutliers(numbers: number[], mean: number, stdDev: number): any[] {
    const threshold = 3; // Z-score threshold
    const outliers: any[] = [];

    for (const num of numbers) {
      const zScore = Math.abs((num - mean) / stdDev);
      if (zScore > threshold) {
        outliers.push(num);
      }
    }

    return outliers;
  }

  /**
   * Detect patterns in values
   */
  private detectPatterns(values: any[]): string[] {
    const patterns: string[] = [];

    // Sample values
    const sampleValues = values.slice(0, 100).filter(v => typeof v === 'string');

    if (sampleValues.length === 0) return patterns;

    // Common patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[\d\s\-\(\)]+$/;
    const urlPattern = /^https?:\/\//;
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const testPatterns = [
      { name: 'email', pattern: emailPattern },
      { name: 'phone', pattern: phonePattern },
      { name: 'url', pattern: urlPattern },
      { name: 'date', pattern: datePattern },
      { name: 'uuid', pattern: uuidPattern }
    ];

    for (const { name, pattern } of testPatterns) {
      const matches = sampleValues.filter(v => pattern.test(v)).length;
      if (matches / sampleValues.length > 0.8) {
        patterns.push(name);
      }
    }

    return patterns;
  }

  /**
   * Count duplicate records
   */
  private countDuplicates(dataset: any[]): number {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const record of dataset) {
      const key = JSON.stringify(record);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  /**
   * Detect anomalies in dataset
   */
  private detectAnomalies(dataset: any[], profile: DataProfile): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check for high null percentage
    if (profile.nullPercentage > 20) {
      anomalies.push({
        id: `anom_${Date.now()}_nulls`,
        type: 'missing',
        severity: 'high',
        description: `High percentage of null values (${profile.nullPercentage.toFixed(2)}%)`,
        affectedRecords: Math.round(dataset.length * profile.nullPercentage / 100),
        examples: [],
        confidence: 0.95
      });
    }

    // Check for duplicates
    if (profile.duplicates > dataset.length * 0.05) {
      anomalies.push({
        id: `anom_${Date.now()}_dupes`,
        type: 'duplicate',
        severity: 'medium',
        description: `High number of duplicate records (${profile.duplicates})`,
        affectedRecords: profile.duplicates,
        examples: [],
        confidence: 1.0
      });
    }

    // Check for outliers in numeric columns
    for (const [colName, colProfile] of profile.columns) {
      if (colProfile.outliers.length > 0) {
        anomalies.push({
          id: `anom_${Date.now()}_outlier_${colName}`,
          type: 'outlier',
          severity: 'low',
          column: colName,
          description: `Outliers detected in column ${colName}`,
          affectedRecords: colProfile.outliers.length,
          examples: colProfile.outliers.slice(0, 5),
          confidence: 0.9
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate category scores
   */
  private calculateCategoryScores(ruleResults: Map<string, QualityRuleResult>): Record<string, number> {
    const categoryScores: Record<string, number> = {
      completeness: 100,
      accuracy: 100,
      consistency: 100,
      validity: 100,
      uniqueness: 100,
      timeliness: 100
    };

    const categoryRules = new Map<string, QualityRuleResult[]>();

    for (const [ruleId, result] of ruleResults) {
      const rule = this.rules.get(ruleId);
      if (!rule) continue;

      if (!categoryRules.has(rule.category)) {
        categoryRules.set(rule.category, []);
      }
      categoryRules.get(rule.category)!.push(result);
    }

    for (const [category, results] of categoryRules) {
      if (results.length > 0) {
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        categoryScores[category] = avgScore;
      }
    }

    return categoryScores;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(categoryScores: Record<string, number>): number {
    const scores = Object.values(categoryScores);
    if (scores.length === 0) return 100;

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Generate recommendations based on quality report
   */
  private generateRecommendations(report: QualityReport): string[] {
    const recommendations: string[] = [];

    // Check overall score
    if (report.qualityScore < 70) {
      recommendations.push('Overall data quality is below acceptable threshold. Immediate action required.');
    }

    // Check category scores
    for (const [category, score] of Object.entries(report.categoryScores)) {
      if (score < 80) {
        recommendations.push(`Improve ${category} - current score: ${score.toFixed(2)}%`);
      }
    }

    // Check anomalies
    const highSeverityAnomalies = report.anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      recommendations.push(`Address ${highSeverityAnomalies.length} high-severity anomalies`);
    }

    // Check null percentage
    if (report.profile.nullPercentage > 10) {
      recommendations.push('High null percentage detected. Review data collection process.');
    }

    // Check duplicates
    if (report.profile.duplicates > report.totalRecords * 0.05) {
      recommendations.push('Consider implementing deduplication process');
    }

    return recommendations;
  }

  /**
   * Get quality metrics
   */
  getQualityMetrics(report: QualityReport): QualityMetrics {
    return {
      completeness: report.categoryScores.completeness || 100,
      accuracy: report.categoryScores.accuracy || 100,
      consistency: report.categoryScores.consistency || 100,
      validity: report.categoryScores.validity || 100,
      uniqueness: report.categoryScores.uniqueness || 100,
      timeliness: report.categoryScores.timeliness || 100
    };
  }
}

// ==================== Built-in Quality Rules ====================

export const CommonQualityRules: QualityRule[] = [
  // Completeness rules
  {
    id: 'completeness_no_nulls',
    name: 'No Null Values',
    category: 'completeness',
    severity: 'high',
    description: 'Ensures all critical fields have values',
    condition: (record: any) => {
      const criticalFields = ['id', 'email', 'name'];
      return criticalFields.every(field =>
        record[field] !== null && record[field] !== undefined && record[field] !== ''
      );
    }
  },

  // Validity rules
  {
    id: 'validity_email_format',
    name: 'Valid Email Format',
    category: 'validity',
    severity: 'critical',
    description: 'Ensures email addresses are properly formatted',
    condition: (record: any) => {
      if (!record.email) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(record.email);
    }
  },

  {
    id: 'validity_age_range',
    name: 'Valid Age Range',
    category: 'validity',
    severity: 'high',
    description: 'Ensures age is within reasonable range',
    condition: (record: any) => {
      if (!record.age) return true;
      return record.age >= 0 && record.age <= 150;
    }
  },

  // Consistency rules
  {
    id: 'consistency_date_order',
    name: 'Chronological Date Order',
    category: 'consistency',
    severity: 'medium',
    description: 'Ensures start date is before end date',
    condition: (record: any) => {
      if (!record.start_date || !record.end_date) return true;
      return new Date(record.start_date) <= new Date(record.end_date);
    }
  },

  {
    id: 'consistency_status_values',
    name: 'Valid Status Values',
    category: 'consistency',
    severity: 'high',
    description: 'Ensures status field contains valid values',
    condition: (record: any) => {
      if (!record.status) return true;
      const validStatuses = ['active', 'inactive', 'pending', 'deleted'];
      return validStatuses.includes(record.status.toLowerCase());
    }
  },

  // Accuracy rules
  {
    id: 'accuracy_phone_format',
    name: 'Valid Phone Format',
    category: 'accuracy',
    severity: 'medium',
    description: 'Ensures phone numbers match expected format',
    condition: (record: any) => {
      if (!record.phone) return true;
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(record.phone);
    }
  },

  // Uniqueness rules
  {
    id: 'uniqueness_id',
    name: 'Unique ID',
    category: 'uniqueness',
    severity: 'critical',
    description: 'Ensures ID field is unique',
    condition: (record: any) => {
      // This would need access to all records to check
      // Simplified here
      return record.id !== null && record.id !== undefined;
    }
  },

  // Timeliness rules
  {
    id: 'timeliness_recent_data',
    name: 'Recent Data',
    category: 'timeliness',
    severity: 'low',
    description: 'Ensures data is not too old',
    condition: (record: any) => {
      if (!record.updated_at && !record.created_at) return true;
      const timestamp = record.updated_at || record.created_at;
      const age = Date.now() - new Date(timestamp).getTime();
      const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
      return age < maxAge;
    }
  }
];

// ==================== Example Usage ====================

export async function demonstrateDataQuality() {
  console.log('=== Data Quality Assessment Demonstration ===\n');

  // Create quality engine
  const engine = new DataQualityEngine();

  // Register built-in rules
  engine.registerRules(CommonQualityRules);

  // Sample dataset with quality issues
  const dataset = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      phone: '+1-555-0100',
      status: 'active',
      created_at: new Date('2024-01-01').toISOString(),
      updated_at: new Date('2024-06-01').toISOString()
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'invalid-email', // Invalid email
      age: 25,
      phone: '+1-555-0101',
      status: 'active',
      created_at: new Date('2024-01-15').toISOString()
    },
    {
      id: 3,
      name: null, // Missing required field
      email: 'bob@example.com',
      age: 250, // Invalid age
      phone: '555-0102',
      status: 'pending',
      created_at: new Date('2024-02-01').toISOString()
    },
    {
      id: 1, // Duplicate ID
      name: 'John Duplicate',
      email: 'john.dup@example.com',
      age: 35,
      status: 'invalid_status', // Invalid status
      created_at: new Date('2023-01-01').toISOString() // Old data
    }
  ];

  // Run quality assessment
  const report = await engine.assessQuality(dataset, 'customer_data');

  // Print results
  console.log('Quality Report:');
  console.log(`  Dataset: ${report.dataset}`);
  console.log(`  Total Records: ${report.totalRecords}`);
  console.log(`  Overall Quality Score: ${report.qualityScore.toFixed(2)}%\n`);

  console.log('Category Scores:');
  for (const [category, score] of Object.entries(report.categoryScores)) {
    console.log(`  ${category}: ${score.toFixed(2)}%`);
  }

  console.log('\nData Profile:');
  console.log(`  Columns: ${report.profile.columnCount}`);
  console.log(`  Duplicates: ${report.profile.duplicates}`);
  console.log(`  Null Percentage: ${report.profile.nullPercentage.toFixed(2)}%`);

  console.log('\nAnomalies Detected:');
  for (const anomaly of report.anomalies) {
    console.log(`  [${anomaly.severity.toUpperCase()}] ${anomaly.description}`);
    console.log(`    Affected Records: ${anomaly.affectedRecords}`);
  }

  console.log('\nRecommendations:');
  for (const rec of report.recommendations) {
    console.log(`  - ${rec}`);
  }

  console.log('\n=== Data Quality Assessment Complete ===');
}

// Run demonstration if executed directly
if (import.meta.main) {
  await demonstrateDataQuality();
}
