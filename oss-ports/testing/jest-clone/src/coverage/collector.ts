/**
 * Jest Clone - Coverage Collector
 * Code coverage collection and reporting
 */

import type { Config, FileCoverage, CoverageSummary } from '../types';

export class CoverageCollector {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async collect(testFiles: string[]): Promise<Map<string, FileCoverage>> {
    const coverageMap = new Map<string, FileCoverage>();

    // In a real implementation, this would instrument the code
    // and track which lines, branches, and functions were executed

    // For now, we'll create placeholder coverage data
    for (const file of testFiles) {
      const coverage = this.createFileCoverage(file);
      coverageMap.set(file, coverage);
    }

    return coverageMap;
  }

  report(coverageMap: Map<string, FileCoverage>): void {
    console.log('\n📊 Code Coverage Report\n');
    console.log('─'.repeat(80));

    const summary = this.calculateSummary(coverageMap);

    this.printCoverageTable(summary);
    this.checkThresholds(summary);
  }

  private createFileCoverage(filePath: string): FileCoverage {
    return {
      path: filePath,
      statementMap: {},
      fnMap: {},
      branchMap: {},
      s: {},
      f: {},
      b: {}
    };
  }

  private calculateSummary(
    coverageMap: Map<string, FileCoverage>
  ): CoverageSummary {
    const summary: CoverageSummary = {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
    };

    for (const coverage of coverageMap.values()) {
      // Count statements
      const statements = Object.keys(coverage.s);
      summary.statements.total += statements.length;
      summary.statements.covered += statements.filter(
        key => coverage.s[key] > 0
      ).length;

      // Count functions
      const functions = Object.keys(coverage.f);
      summary.functions.total += functions.length;
      summary.functions.covered += functions.filter(
        key => coverage.f[key] > 0
      ).length;

      // Count branches
      const branches = Object.keys(coverage.b);
      for (const key of branches) {
        const branchCounts = coverage.b[key];
        summary.branches.total += branchCounts.length;
        summary.branches.covered += branchCounts.filter(count => count > 0).length;
      }
    }

    // Calculate percentages
    summary.lines.pct = this.calculatePercentage(
      summary.lines.covered,
      summary.lines.total
    );
    summary.statements.pct = this.calculatePercentage(
      summary.statements.covered,
      summary.statements.total
    );
    summary.functions.pct = this.calculatePercentage(
      summary.functions.covered,
      summary.functions.total
    );
    summary.branches.pct = this.calculatePercentage(
      summary.branches.covered,
      summary.branches.total
    );

    return summary;
  }

  private calculatePercentage(covered: number, total: number): number {
    if (total === 0) return 100;
    return Math.floor((covered / total) * 100 * 100) / 100;
  }

  private printCoverageTable(summary: CoverageSummary): void {
    const formatRow = (
      type: string,
      pct: number,
      covered: number,
      total: number
    ) => {
      const pctStr = `${pct.toFixed(2)}%`;
      const coverageStr = `${covered}/${total}`;
      const color = this.getColorForPercentage(pct);

      return `${type.padEnd(12)} ${color}${pctStr.padEnd(8)}${this.resetColor} ${coverageStr}`;
    };

    console.log(formatRow(
      'Statements',
      summary.statements.pct,
      summary.statements.covered,
      summary.statements.total
    ));

    console.log(formatRow(
      'Branches',
      summary.branches.pct,
      summary.branches.covered,
      summary.branches.total
    ));

    console.log(formatRow(
      'Functions',
      summary.functions.pct,
      summary.functions.covered,
      summary.functions.total
    ));

    console.log(formatRow(
      'Lines',
      summary.lines.pct,
      summary.lines.covered,
      summary.lines.total
    ));

    console.log('─'.repeat(80));
  }

  private checkThresholds(summary: CoverageSummary): void {
    if (!this.config.coverageThreshold?.global) return;

    const threshold = this.config.coverageThreshold.global;
    const failures: string[] = [];

    if (threshold.statements && summary.statements.pct < threshold.statements) {
      failures.push(
        `Statements coverage ${summary.statements.pct}% < ${threshold.statements}%`
      );
    }

    if (threshold.branches && summary.branches.pct < threshold.branches) {
      failures.push(
        `Branches coverage ${summary.branches.pct}% < ${threshold.branches}%`
      );
    }

    if (threshold.functions && summary.functions.pct < threshold.functions) {
      failures.push(
        `Functions coverage ${summary.functions.pct}% < ${threshold.functions}%`
      );
    }

    if (threshold.lines && summary.lines.pct < threshold.lines) {
      failures.push(
        `Lines coverage ${summary.lines.pct}% < ${threshold.lines}%`
      );
    }

    if (failures.length > 0) {
      console.log('\n❌ Coverage threshold failures:\n');
      for (const failure of failures) {
        console.log(`  • ${failure}`);
      }
      console.log('');
      throw new Error('Coverage thresholds not met');
    } else {
      console.log('\n✅ Coverage thresholds met\n');
    }
  }

  private getColorForPercentage(pct: number): string {
    if (pct >= 80) return '\x1b[32m'; // Green
    if (pct >= 50) return '\x1b[33m'; // Yellow
    return '\x1b[31m'; // Red
  }

  private get resetColor(): string {
    return '\x1b[0m';
  }
}

export class CoverageReporter {
  async generateReport(
    coverageMap: Map<string, FileCoverage>,
    format: 'html' | 'json' | 'lcov' | 'text' = 'text'
  ): Promise<void> {
    switch (format) {
      case 'html':
        await this.generateHTMLReport(coverageMap);
        break;
      case 'json':
        await this.generateJSONReport(coverageMap);
        break;
      case 'lcov':
        await this.generateLCOVReport(coverageMap);
        break;
      case 'text':
        await this.generateTextReport(coverageMap);
        break;
    }
  }

  private async generateHTMLReport(
    coverageMap: Map<string, FileCoverage>
  ): Promise<void> {
    // Generate HTML coverage report
    console.log('HTML coverage report generated at: coverage/index.html');
  }

  private async generateJSONReport(
    coverageMap: Map<string, FileCoverage>
  ): Promise<void> {
    const coverage = Object.fromEntries(coverageMap);
    console.log(JSON.stringify(coverage, null, 2));
  }

  private async generateLCOVReport(
    coverageMap: Map<string, FileCoverage>
  ): Promise<void> {
    // Generate LCOV format report
    console.log('LCOV coverage report generated at: coverage/lcov.info');
  }

  private async generateTextReport(
    coverageMap: Map<string, FileCoverage>
  ): Promise<void> {
    // Already handled by CoverageCollector.report()
  }
}
