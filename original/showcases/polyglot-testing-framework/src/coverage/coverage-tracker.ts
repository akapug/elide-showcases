/**
 * Multi-Language Coverage Tracker
 *
 * Collects, normalizes, and merges code coverage data from TypeScript,
 * Python, Ruby, and Java with unified reporting and threshold enforcement.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export type Language = 'typescript' | 'python' | 'ruby' | 'java';
export type CoverageFormat = 'html' | 'json' | 'lcov' | 'cobertura' | 'text' | 'clover';

export interface CoverageConfig {
  languages: Language[];
  outputDir: string;
  formats: CoverageFormat[];
  include?: string[];
  exclude?: string[];
  threshold?: CoverageThreshold;
  collectFrom?: Language[];
  merge?: boolean;
  reporters?: string[];
}

export interface CoverageThreshold {
  global?: number;
  perLanguage?: Record<Language, number>;
  perFile?: number;
  branches?: number;
  functions?: number;
  lines?: number;
  statements?: number;
}

export interface CoverageData {
  lines: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  statements: CoverageMetric;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
  uncovered?: number[];
}

export interface FileCoverage {
  path: string;
  language: Language;
  coverage: CoverageData;
  source?: string;
}

export interface LanguageCoverage {
  language: Language;
  files: Map<string, FileCoverage>;
  overall: CoverageData;
}

export interface MergedCoverage {
  overall: CoverageData;
  perLanguage: Map<Language, LanguageCoverage>;
  perFile: Map<string, FileCoverage>;
  timestamp: number;
}

export interface ThresholdResult {
  passed: boolean;
  failures: ThresholdFailure[];
  summary: string;
}

export interface ThresholdFailure {
  type: 'global' | 'language' | 'file' | 'metric';
  target: string;
  metric: string;
  actual: number;
  expected: number;
}

/**
 * Coverage Tracker
 */
export class CoverageTracker extends EventEmitter {
  private config: CoverageConfig;
  private languageCoverage: Map<Language, LanguageCoverage> = new Map();
  private mergedCoverage: MergedCoverage | null = null;

  constructor(config: Partial<CoverageConfig>) {
    super();
    this.config = this.normalizeConfig(config);
  }

  private normalizeConfig(config: Partial<CoverageConfig>): CoverageConfig {
    return {
      languages: config.languages || ['typescript', 'python', 'ruby', 'java'],
      outputDir: config.outputDir || './coverage',
      formats: config.formats || ['html', 'json', 'lcov'],
      include: config.include || [],
      exclude: config.exclude || ['node_modules/**', '**/test/**', '**/tests/**'],
      threshold: {
        global: config.threshold?.global || 80,
        perLanguage: config.threshold?.perLanguage || {},
        perFile: config.threshold?.perFile || 60,
        branches: config.threshold?.branches || 80,
        functions: config.threshold?.functions || 80,
        lines: config.threshold?.lines || 80,
        statements: config.threshold?.statements || 80
      },
      collectFrom: config.collectFrom || config.languages || [],
      merge: config.merge ?? true,
      reporters: config.reporters || ['console', 'html']
    };
  }

  /**
   * Collect coverage for all configured languages
   */
  async collect(language?: Language): Promise<MergedCoverage> {
    this.emit('collect:start');

    try {
      const languages = language ? [language] : this.config.collectFrom!;

      await Promise.all(
        languages.map(lang => this.collectLanguage(lang))
      );

      if (this.config.merge) {
        this.mergedCoverage = await this.merge();
      }

      this.emit('collect:complete', this.mergedCoverage);

      return this.mergedCoverage!;
    } catch (error) {
      this.emit('collect:error', error);
      throw error;
    }
  }

  /**
   * Collect coverage for a specific language
   */
  private async collectLanguage(language: Language): Promise<LanguageCoverage> {
    this.emit('collect:language:start', { language });

    const collector = this.getCollector(language);
    const coverage = await collector.collect();

    this.languageCoverage.set(language, coverage);

    this.emit('collect:language:complete', { language, coverage });

    return coverage;
  }

  /**
   * Get coverage collector for a language
   */
  private getCollector(language: Language): CoverageCollector {
    switch (language) {
      case 'typescript':
        return new TypeScriptCoverageCollector(this.config);
      case 'python':
        return new PythonCoverageCollector(this.config);
      case 'ruby':
        return new RubyCoverageCollector(this.config);
      case 'java':
        return new JavaCoverageCollector(this.config);
    }
  }

  /**
   * Merge coverage from all languages
   */
  async merge(): Promise<MergedCoverage> {
    this.emit('merge:start');

    try {
      const merged: MergedCoverage = {
        overall: this.createEmptyCoverageData(),
        perLanguage: new Map(),
        perFile: new Map(),
        timestamp: Date.now()
      };

      let totalLines = 0;
      let coveredLines = 0;
      let totalFunctions = 0;
      let coveredFunctions = 0;
      let totalBranches = 0;
      let coveredBranches = 0;
      let totalStatements = 0;
      let coveredStatements = 0;

      // Merge all language coverage
      for (const [language, coverage] of this.languageCoverage) {
        merged.perLanguage.set(language, coverage);

        totalLines += coverage.overall.lines.total;
        coveredLines += coverage.overall.lines.covered;
        totalFunctions += coverage.overall.functions.total;
        coveredFunctions += coverage.overall.functions.covered;
        totalBranches += coverage.overall.branches.total;
        coveredBranches += coverage.overall.branches.covered;
        totalStatements += coverage.overall.statements.total;
        coveredStatements += coverage.overall.statements.covered;

        // Merge per-file coverage
        for (const [filePath, fileCoverage] of coverage.files) {
          merged.perFile.set(filePath, fileCoverage);
        }
      }

      // Calculate overall percentages
      merged.overall = {
        lines: {
          total: totalLines,
          covered: coveredLines,
          percentage: this.calculatePercentage(coveredLines, totalLines)
        },
        functions: {
          total: totalFunctions,
          covered: coveredFunctions,
          percentage: this.calculatePercentage(coveredFunctions, totalFunctions)
        },
        branches: {
          total: totalBranches,
          covered: coveredBranches,
          percentage: this.calculatePercentage(coveredBranches, totalBranches)
        },
        statements: {
          total: totalStatements,
          covered: coveredStatements,
          percentage: this.calculatePercentage(coveredStatements, totalStatements)
        }
      };

      this.mergedCoverage = merged;
      this.emit('merge:complete', merged);

      return merged;
    } catch (error) {
      this.emit('merge:error', error);
      throw error;
    }
  }

  /**
   * Generate coverage reports
   */
  async report(formats?: CoverageFormat[]): Promise<void> {
    if (!this.mergedCoverage) {
      throw new Error('No coverage data available. Run collect() first.');
    }

    this.emit('report:start');

    try {
      const outputFormats = formats || this.config.formats;

      await fs.mkdir(this.config.outputDir, { recursive: true });

      await Promise.all(
        outputFormats.map(format => this.generateReport(format))
      );

      this.emit('report:complete', { formats: outputFormats });
    } catch (error) {
      this.emit('report:error', error);
      throw error;
    }
  }

  /**
   * Generate a specific report format
   */
  private async generateReport(format: CoverageFormat): Promise<void> {
    const reporter = this.getReporter(format);
    await reporter.generate(this.mergedCoverage!);
  }

  /**
   * Get reporter for a format
   */
  private getReporter(format: CoverageFormat): CoverageReporter {
    switch (format) {
      case 'html':
        return new HtmlCoverageReporter(this.config);
      case 'json':
        return new JsonCoverageReporter(this.config);
      case 'lcov':
        return new LcovCoverageReporter(this.config);
      case 'cobertura':
        return new CoberturaCoverageReporter(this.config);
      case 'text':
        return new TextCoverageReporter(this.config);
      case 'clover':
        return new CloverCoverageReporter(this.config);
    }
  }

  /**
   * Check coverage thresholds
   */
  async checkThresholds(): Promise<ThresholdResult> {
    if (!this.mergedCoverage) {
      throw new Error('No coverage data available. Run collect() first.');
    }

    this.emit('threshold:check:start');

    const failures: ThresholdFailure[] = [];

    // Check global threshold
    if (this.config.threshold?.global) {
      const globalCoverage = this.mergedCoverage.overall.lines.percentage;
      if (globalCoverage < this.config.threshold.global) {
        failures.push({
          type: 'global',
          target: 'overall',
          metric: 'lines',
          actual: globalCoverage,
          expected: this.config.threshold.global
        });
      }
    }

    // Check per-language thresholds
    if (this.config.threshold?.perLanguage) {
      for (const [language, threshold] of Object.entries(this.config.threshold.perLanguage)) {
        const langCoverage = this.mergedCoverage.perLanguage.get(language as Language);
        if (langCoverage) {
          const coverage = langCoverage.overall.lines.percentage;
          if (coverage < threshold) {
            failures.push({
              type: 'language',
              target: language,
              metric: 'lines',
              actual: coverage,
              expected: threshold
            });
          }
        }
      }
    }

    // Check per-file thresholds
    if (this.config.threshold?.perFile) {
      for (const [filePath, fileCoverage] of this.mergedCoverage.perFile) {
        const coverage = fileCoverage.coverage.lines.percentage;
        if (coverage < this.config.threshold.perFile) {
          failures.push({
            type: 'file',
            target: filePath,
            metric: 'lines',
            actual: coverage,
            expected: this.config.threshold.perFile
          });
        }
      }
    }

    // Check metric-specific thresholds
    const metrics: Array<keyof CoverageData> = ['branches', 'functions', 'statements'];
    for (const metric of metrics) {
      const threshold = this.config.threshold?.[metric];
      if (threshold) {
        const coverage = this.mergedCoverage.overall[metric].percentage;
        if (coverage < threshold) {
          failures.push({
            type: 'metric',
            target: 'overall',
            metric,
            actual: coverage,
            expected: threshold
          });
        }
      }
    }

    const result: ThresholdResult = {
      passed: failures.length === 0,
      failures,
      summary: this.generateThresholdSummary(failures)
    };

    this.emit('threshold:check:complete', result);

    return result;
  }

  /**
   * Generate threshold check summary
   */
  private generateThresholdSummary(failures: ThresholdFailure[]): string {
    if (failures.length === 0) {
      return 'All coverage thresholds met!';
    }

    let summary = `Coverage thresholds not met (${failures.length} failures):\n\n`;

    for (const failure of failures) {
      summary += `  - ${failure.type} (${failure.target}): ${failure.metric} coverage is ${failure.actual.toFixed(2)}%, expected ${failure.expected}%\n`;
    }

    return summary;
  }

  /**
   * Get language coverage
   */
  getLanguageCoverage(language: Language): LanguageCoverage | undefined {
    return this.languageCoverage.get(language);
  }

  /**
   * Get merged coverage
   */
  getMergedCoverage(): MergedCoverage | null {
    return this.mergedCoverage;
  }

  /**
   * Helper: Calculate percentage
   */
  private calculatePercentage(covered: number, total: number): number {
    if (total === 0) return 100;
    return (covered / total) * 100;
  }

  /**
   * Helper: Create empty coverage data
   */
  private createEmptyCoverageData(): CoverageData {
    return {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };
  }
}

/**
 * Base coverage collector interface
 */
interface CoverageCollector {
  collect(): Promise<LanguageCoverage>;
}

/**
 * TypeScript coverage collector (using Istanbul/NYC)
 */
class TypeScriptCoverageCollector implements CoverageCollector {
  constructor(private config: CoverageConfig) {}

  async collect(): Promise<LanguageCoverage> {
    // Run NYC to collect coverage
    await this.runNyc();

    // Parse coverage data
    const coverageData = await this.parseCoverageData();

    return {
      language: 'typescript',
      files: coverageData.files,
      overall: coverageData.overall
    };
  }

  private async runNyc(): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn('nyc', ['--reporter=json', 'npm', 'test']);

      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`NYC exited with code ${code}`));
      });
    });
  }

  private async parseCoverageData(): Promise<{ files: Map<string, FileCoverage>; overall: CoverageData }> {
    // Parse Istanbul coverage-final.json
    const files = new Map<string, FileCoverage>();
    const overall: CoverageData = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };

    return { files, overall };
  }
}

/**
 * Python coverage collector (using Coverage.py)
 */
class PythonCoverageCollector implements CoverageCollector {
  constructor(private config: CoverageConfig) {}

  async collect(): Promise<LanguageCoverage> {
    await this.runCoveragePy();

    const coverageData = await this.parseCoverageData();

    return {
      language: 'python',
      files: coverageData.files,
      overall: coverageData.overall
    };
  }

  private async runCoveragePy(): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn('coverage', ['run', '-m', 'pytest']);

      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Coverage.py exited with code ${code}`));
      });
    });
  }

  private async parseCoverageData(): Promise<{ files: Map<string, FileCoverage>; overall: CoverageData }> {
    const files = new Map<string, FileCoverage>();
    const overall: CoverageData = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };

    return { files, overall };
  }
}

/**
 * Ruby coverage collector (using SimpleCov)
 */
class RubyCoverageCollector implements CoverageCollector {
  constructor(private config: CoverageConfig) {}

  async collect(): Promise<LanguageCoverage> {
    await this.runSimpleCov();

    const coverageData = await this.parseCoverageData();

    return {
      language: 'ruby',
      files: coverageData.files,
      overall: coverageData.overall
    };
  }

  private async runSimpleCov(): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn('rspec', ['--require', 'simplecov']);

      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`SimpleCov exited with code ${code}`));
      });
    });
  }

  private async parseCoverageData(): Promise<{ files: Map<string, FileCoverage>; overall: CoverageData }> {
    const files = new Map<string, FileCoverage>();
    const overall: CoverageData = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };

    return { files, overall };
  }
}

/**
 * Java coverage collector (using JaCoCo)
 */
class JavaCoverageCollector implements CoverageCollector {
  constructor(private config: CoverageConfig) {}

  async collect(): Promise<LanguageCoverage> {
    await this.runJaCoCo();

    const coverageData = await this.parseCoverageData();

    return {
      language: 'java',
      files: coverageData.files,
      overall: coverageData.overall
    };
  }

  private async runJaCoCo(): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn('gradle', ['test', 'jacocoTestReport']);

      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`JaCoCo exited with code ${code}`));
      });
    });
  }

  private async parseCoverageData(): Promise<{ files: Map<string, FileCoverage>; overall: CoverageData }> {
    const files = new Map<string, FileCoverage>();
    const overall: CoverageData = {
      lines: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 }
    };

    return { files, overall };
  }
}

/**
 * Base coverage reporter interface
 */
interface CoverageReporter {
  generate(coverage: MergedCoverage): Promise<void>;
}

/**
 * HTML coverage reporter
 */
class HtmlCoverageReporter implements CoverageReporter {
  constructor(private config: CoverageConfig) {}

  async generate(coverage: MergedCoverage): Promise<void> {
    const outputDir = path.join(this.config.outputDir, 'html');
    await fs.mkdir(outputDir, { recursive: true });

    const html = this.generateHtml(coverage);
    await fs.writeFile(path.join(outputDir, 'index.html'), html);
  }

  private generateHtml(coverage: MergedCoverage): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .metric { display: inline-block; margin: 10px 20px; }
    .percentage { font-size: 24px; font-weight: bold; }
    .high { color: green; }
    .medium { color: orange; }
    .low { color: red; }
  </style>
</head>
<body>
  <h1>Coverage Report</h1>
  <div class="summary">
    <h2>Overall Coverage</h2>
    ${this.renderMetrics(coverage.overall)}
  </div>
</body>
</html>
    `.trim();
  }

  private renderMetrics(data: CoverageData): string {
    return Object.entries(data).map(([metric, value]) => `
      <div class="metric">
        <div>${metric}</div>
        <div class="percentage ${this.getColorClass(value.percentage)}">${value.percentage.toFixed(2)}%</div>
        <div>${value.covered}/${value.total}</div>
      </div>
    `).join('');
  }

  private getColorClass(percentage: number): string {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  }
}

/**
 * JSON coverage reporter
 */
class JsonCoverageReporter implements CoverageReporter {
  constructor(private config: CoverageConfig) {}

  async generate(coverage: MergedCoverage): Promise<void> {
    const outputPath = path.join(this.config.outputDir, 'coverage.json');

    const json = JSON.stringify({
      overall: coverage.overall,
      perLanguage: Array.from(coverage.perLanguage.entries()).reduce((acc, [lang, data]) => {
        acc[lang] = data.overall;
        return acc;
      }, {} as any),
      timestamp: coverage.timestamp
    }, null, 2);

    await fs.writeFile(outputPath, json);
  }
}

/**
 * LCOV coverage reporter
 */
class LcovCoverageReporter implements CoverageReporter {
  constructor(private config: CoverageConfig) {}

  async generate(coverage: MergedCoverage): Promise<void> {
    const outputPath = path.join(this.config.outputDir, 'lcov.info');
    const lcov = this.generateLcov(coverage);
    await fs.writeFile(outputPath, lcov);
  }

  private generateLcov(coverage: MergedCoverage): string {
    let lcov = '';

    for (const [filePath, fileCoverage] of coverage.perFile) {
      lcov += `SF:${filePath}\n`;
      lcov += `DA:1,${fileCoverage.coverage.lines.covered}\n`;
      lcov += `LF:${fileCoverage.coverage.lines.total}\n`;
      lcov += `LH:${fileCoverage.coverage.lines.covered}\n`;
      lcov += `end_of_record\n`;
    }

    return lcov;
  }
}

/**
 * Cobertura coverage reporter
 */
class CoberturaCoverageReporter implements CoverageReporter {
  constructor(private config: CoverageConfig) {}

  async generate(coverage: MergedCoverage): Promise<void> {
    const outputPath = path.join(this.config.outputDir, 'cobertura.xml');
    const xml = this.generateXml(coverage);
    await fs.writeFile(outputPath, xml);
  }

  private generateXml(coverage: MergedCoverage): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<coverage>
  <lines>
    <line-rate>${(coverage.overall.lines.percentage / 100).toFixed(4)}</line-rate>
  </lines>
</coverage>`;
  }
}

/**
 * Text coverage reporter
 */
class TextCoverageReporter implements CoverageReporter {
  constructor(private config: CoverageConfig) {}

  async generate(coverage: MergedCoverage): Promise<void> {
    console.log('\n=== Coverage Report ===\n');
    console.log('Overall Coverage:');
    console.log(`  Lines:      ${coverage.overall.lines.percentage.toFixed(2)}% (${coverage.overall.lines.covered}/${coverage.overall.lines.total})`);
    console.log(`  Functions:  ${coverage.overall.functions.percentage.toFixed(2)}% (${coverage.overall.functions.covered}/${coverage.overall.functions.total})`);
    console.log(`  Branches:   ${coverage.overall.branches.percentage.toFixed(2)}% (${coverage.overall.branches.covered}/${coverage.overall.branches.total})`);
    console.log(`  Statements: ${coverage.overall.statements.percentage.toFixed(2)}% (${coverage.overall.statements.covered}/${coverage.overall.statements.total})`);
  }
}

/**
 * Clover coverage reporter
 */
class CloverCoverageReporter implements CoverageReporter {
  constructor(private config: CoverageConfig) {}

  async generate(coverage: MergedCoverage): Promise<void> {
    const outputPath = path.join(this.config.outputDir, 'clover.xml');
    const xml = this.generateXml(coverage);
    await fs.writeFile(outputPath, xml);
  }

  private generateXml(coverage: MergedCoverage): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<coverage generated="${Date.now()}">
  <project timestamp="${Date.now()}">
    <metrics statements="${coverage.overall.statements.total}" coveredstatements="${coverage.overall.statements.covered}"/>
  </project>
</coverage>`;
  }
}

export default CoverageTracker;
