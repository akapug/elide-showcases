/**
 * HTML Test Reporter
 *
 * Generates beautiful, interactive HTML reports for test results
 * with detailed visualizations, coverage metrics, and drill-down capabilities.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TestResults, TestResult, Language } from '../test-runner';
import { MergedCoverage } from '../coverage/coverage-tracker';

export interface HTMLReporterConfig {
  outputDir: string;
  title?: string;
  showCoverage?: boolean;
  showTimeline?: boolean;
  showCharts?: boolean;
  darkMode?: boolean;
}

export class HTMLReporter {
  private config: HTMLReporterConfig;

  constructor(config: Partial<HTMLReporterConfig>) {
    this.config = {
      outputDir: config.outputDir || './reports',
      title: config.title || 'Test Report',
      showCoverage: config.showCoverage ?? true,
      showTimeline: config.showTimeline ?? true,
      showCharts: config.showCharts ?? true,
      darkMode: config.darkMode ?? false
    };
  }

  /**
   * Generate HTML report
   */
  async generate(results: TestResults, coverage?: MergedCoverage): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });

    const html = this.generateHTML(results, coverage);
    const outputPath = path.join(this.config.outputDir, 'index.html');

    await fs.writeFile(outputPath, html);

    // Generate additional assets
    await this.generateCSS();
    await this.generateJS();
  }

  /**
   * Generate main HTML content
   */
  private generateHTML(results: TestResults, coverage?: MergedCoverage): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.title}</title>
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
</head>
<body class="${this.config.darkMode ? 'dark-mode' : ''}">
  <div class="container">
    ${this.generateHeader(results)}
    ${this.generateSummary(results)}
    ${this.config.showCharts ? this.generateCharts(results) : ''}
    ${this.config.showCoverage && coverage ? this.generateCoverage(coverage) : ''}
    ${this.config.showTimeline ? this.generateTimeline(results) : ''}
    ${this.generateTestResults(results)}
    ${this.generateFooter()}
  </div>

  <script src="report.js"></script>
</body>
</html>
    `.trim();
  }

  /**
   * Generate header section
   */
  private generateHeader(results: TestResults): string {
    const statusClass = results.failed === 0 ? 'success' : 'failure';
    const statusIcon = results.failed === 0 ? '✓' : '✗';

    return `
<header class="header">
  <div class="header-content">
    <h1>
      <span class="status-icon ${statusClass}">${statusIcon}</span>
      ${this.config.title}
    </h1>
    <div class="header-meta">
      <span class="timestamp">${new Date(results.startTime).toLocaleString()}</span>
      <span class="duration">${(results.duration / 1000).toFixed(2)}s</span>
    </div>
  </div>
</header>
    `.trim();
  }

  /**
   * Generate summary section
   */
  private generateSummary(results: TestResults): string {
    const passRate = ((results.passed / results.total) * 100).toFixed(1);

    return `
<section class="summary">
  <div class="summary-card">
    <div class="summary-card-header">Test Summary</div>
    <div class="summary-stats">
      <div class="stat total">
        <div class="stat-value">${results.total}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat passed">
        <div class="stat-value">${results.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat failed">
        <div class="stat-value">${results.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat skipped">
        <div class="stat-value">${results.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat pass-rate">
        <div class="stat-value">${passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>
  </div>

  <div class="summary-card">
    <div class="summary-card-header">By Language</div>
    <div class="language-breakdown">
      ${this.generateLanguageBreakdown(results)}
    </div>
  </div>
</section>
    `.trim();
  }

  /**
   * Generate language breakdown
   */
  private generateLanguageBreakdown(results: TestResults): string {
    const byLanguage = this.groupByLanguage(results.results);

    return Array.from(byLanguage.entries())
      .map(([language, tests]) => {
        const passed = tests.filter(t => t.status === 'passed').length;
        const failed = tests.filter(t => t.status === 'failed').length;
        const total = tests.length;
        const passRate = ((passed / total) * 100).toFixed(1);

        return `
<div class="language-stat">
  <div class="language-name">${language}</div>
  <div class="language-bar">
    <div class="bar-passed" style="width: ${passRate}%"></div>
    <div class="bar-failed" style="width: ${((failed / total) * 100).toFixed(1)}%"></div>
  </div>
  <div class="language-numbers">${passed}/${total} passed</div>
</div>
        `.trim();
      })
      .join('\n');
  }

  /**
   * Generate charts section
   */
  private generateCharts(results: TestResults): string {
    return `
<section class="charts">
  <div class="chart-container">
    <canvas id="statusChart"></canvas>
  </div>
  <div class="chart-container">
    <canvas id="languageChart"></canvas>
  </div>
  <div class="chart-container">
    <canvas id="durationChart"></canvas>
  </div>
</section>

<script>
  const statusData = {
    labels: ['Passed', 'Failed', 'Skipped'],
    datasets: [{
      data: [${results.passed}, ${results.failed}, ${results.skipped}],
      backgroundColor: ['#4caf50', '#f44336', '#9e9e9e']
    }]
  };

  new Chart(document.getElementById('statusChart'), {
    type: 'doughnut',
    data: statusData,
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Test Status' },
        legend: { position: 'bottom' }
      }
    }
  });

  ${this.generateLanguageChartScript(results)}
  ${this.generateDurationChartScript(results)}
</script>
    `.trim();
  }

  /**
   * Generate language chart script
   */
  private generateLanguageChartScript(results: TestResults): string {
    const byLanguage = this.groupByLanguage(results.results);
    const languages = Array.from(byLanguage.keys());
    const counts = Array.from(byLanguage.values()).map(tests => tests.length);

    return `
const languageData = {
  labels: ${JSON.stringify(languages)},
  datasets: [{
    label: 'Tests per Language',
    data: ${JSON.stringify(counts)},
    backgroundColor: ['#2196f3', '#ff9800', '#9c27b0', '#4caf50']
  }]
};

new Chart(document.getElementById('languageChart'), {
  type: 'bar',
  data: languageData,
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Tests by Language' }
    }
  }
});
    `.trim();
  }

  /**
   * Generate duration chart script
   */
  private generateDurationChartScript(results: TestResults): string {
    const slowestTests = results.results
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return `
const durationData = {
  labels: ${JSON.stringify(slowestTests.map(t => t.test))},
  datasets: [{
    label: 'Duration (ms)',
    data: ${JSON.stringify(slowestTests.map(t => t.duration))},
    backgroundColor: '#ff5722'
  }]
};

new Chart(document.getElementById('durationChart'), {
  type: 'horizontalBar',
  data: durationData,
  options: {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      title: { display: true, text: 'Slowest Tests' }
    }
  }
});
    `.trim();
  }

  /**
   * Generate coverage section
   */
  private generateCoverage(coverage: MergedCoverage): string {
    return `
<section class="coverage">
  <h2>Code Coverage</h2>

  <div class="coverage-summary">
    <div class="coverage-metric">
      <div class="coverage-label">Lines</div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverage.overall.lines.percentage}%"></div>
      </div>
      <div class="coverage-value">${coverage.overall.lines.percentage.toFixed(2)}%</div>
      <div class="coverage-count">${coverage.overall.lines.covered}/${coverage.overall.lines.total}</div>
    </div>

    <div class="coverage-metric">
      <div class="coverage-label">Functions</div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverage.overall.functions.percentage}%"></div>
      </div>
      <div class="coverage-value">${coverage.overall.functions.percentage.toFixed(2)}%</div>
      <div class="coverage-count">${coverage.overall.functions.covered}/${coverage.overall.functions.total}</div>
    </div>

    <div class="coverage-metric">
      <div class="coverage-label">Branches</div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverage.overall.branches.percentage}%"></div>
      </div>
      <div class="coverage-value">${coverage.overall.branches.percentage.toFixed(2)}%</div>
      <div class="coverage-count">${coverage.overall.branches.covered}/${coverage.overall.branches.total}</div>
    </div>

    <div class="coverage-metric">
      <div class="coverage-label">Statements</div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverage.overall.statements.percentage}%"></div>
      </div>
      <div class="coverage-value">${coverage.overall.statements.percentage.toFixed(2)}%</div>
      <div class="coverage-count">${coverage.overall.statements.covered}/${coverage.overall.statements.total}</div>
    </div>
  </div>

  ${this.generateCoverageByLanguage(coverage)}
</section>
    `.trim();
  }

  /**
   * Generate coverage by language
   */
  private generateCoverageByLanguage(coverage: MergedCoverage): string {
    const html = Array.from(coverage.perLanguage.entries())
      .map(([language, langCoverage]) => `
<div class="language-coverage">
  <h3>${language}</h3>
  <div class="mini-coverage">
    <span>Lines: ${langCoverage.overall.lines.percentage.toFixed(1)}%</span>
    <span>Functions: ${langCoverage.overall.functions.percentage.toFixed(1)}%</span>
    <span>Branches: ${langCoverage.overall.branches.percentage.toFixed(1)}%</span>
  </div>
</div>
      `.trim())
      .join('\n');

    return `<div class="coverage-by-language">${html}</div>`;
  }

  /**
   * Generate timeline section
   */
  private generateTimeline(results: TestResults): string {
    return `
<section class="timeline">
  <h2>Execution Timeline</h2>
  <div class="timeline-container">
    ${this.generateTimelineItems(results)}
  </div>
</section>
    `.trim();
  }

  /**
   * Generate timeline items
   */
  private generateTimelineItems(results: TestResults): string {
    const sortedResults = [...results.results].sort((a, b) => a.startTime - b.startTime);

    return sortedResults
      .map((result, index) => {
        const statusClass = result.status === 'passed' ? 'success' : 'failure';
        const offset = ((result.startTime - results.startTime) / results.duration) * 100;

        return `
<div class="timeline-item ${statusClass}" style="left: ${offset}%">
  <div class="timeline-marker"></div>
  <div class="timeline-tooltip">
    <div class="tooltip-title">${result.test}</div>
    <div class="tooltip-meta">
      <span>${result.language}</span>
      <span>${result.duration}ms</span>
    </div>
  </div>
</div>
        `.trim();
      })
      .join('\n');
  }

  /**
   * Generate test results section
   */
  private generateTestResults(results: TestResults): string {
    const bySuite = this.groupBySuite(results.results);

    return `
<section class="test-results">
  <h2>Test Results</h2>

  <div class="filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="passed">Passed</button>
    <button class="filter-btn" data-filter="failed">Failed</button>
    <button class="filter-btn" data-filter="skipped">Skipped</button>
  </div>

  <div class="test-suites">
    ${Array.from(bySuite.entries())
      .map(([suite, tests]) => this.generateSuiteHTML(suite, tests))
      .join('\n')}
  </div>
</section>
    `.trim();
  }

  /**
   * Generate suite HTML
   */
  private generateSuiteHTML(suite: string, tests: TestResult[]): string {
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const statusClass = failed === 0 ? 'success' : 'failure';

    return `
<div class="test-suite ${statusClass}">
  <div class="suite-header">
    <h3>${suite}</h3>
    <div class="suite-stats">
      <span class="passed">${passed} passed</span>
      <span class="failed">${failed} failed</span>
    </div>
  </div>
  <div class="suite-tests">
    ${tests.map(test => this.generateTestHTML(test)).join('\n')}
  </div>
</div>
    `.trim();
  }

  /**
   * Generate individual test HTML
   */
  private generateTestHTML(test: TestResult): string {
    const statusIcon = test.status === 'passed' ? '✓' : '✗';

    return `
<div class="test ${test.status}" data-status="${test.status}">
  <div class="test-header">
    <span class="test-icon">${statusIcon}</span>
    <span class="test-name">${test.test}</span>
    <span class="test-language">${test.language}</span>
    <span class="test-duration">${test.duration}ms</span>
  </div>
  ${test.error ? this.generateErrorHTML(test.error) : ''}
  ${test.stdout ? `<div class="test-stdout"><pre>${test.stdout}</pre></div>` : ''}
  ${test.stderr ? `<div class="test-stderr"><pre>${test.stderr}</pre></div>` : ''}
</div>
    `.trim();
  }

  /**
   * Generate error HTML
   */
  private generateErrorHTML(error: any): string {
    return `
<div class="test-error">
  <div class="error-message">${error.message}</div>
  ${error.diff ? `<div class="error-diff"><pre>${error.diff}</pre></div>` : ''}
  ${error.stack ? `<div class="error-stack"><pre>${error.stack}</pre></div>` : ''}
</div>
    `.trim();
  }

  /**
   * Generate footer
   */
  private generateFooter(): string {
    return `
<footer class="footer">
  <div class="footer-content">
    <span>Generated by Polyglot Testing Framework</span>
    <span>${new Date().toLocaleString()}</span>
  </div>
</footer>
    `.trim();
  }

  /**
   * Generate CSS file
   */
  private async generateCSS(): Promise<void> {
    const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.container { max-width: 1400px; margin: 0 auto; padding: 20px; }

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.header h1 { font-size: 2.5rem; margin-bottom: 10px; }
.status-icon { font-size: 3rem; margin-right: 15px; }
.status-icon.success { color: #4caf50; }
.status-icon.failure { color: #f44336; }

.summary { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
.summary-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.summary-stats { display: flex; justify-content: space-around; margin-top: 20px; }
.stat { text-align: center; }
.stat-value { font-size: 2rem; font-weight: bold; }
.stat.passed .stat-value { color: #4caf50; }
.stat.failed .stat-value { color: #f44336; }

.charts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
.chart-container { background: white; padding: 20px; border-radius: 10px; }

.test-results { background: white; padding: 30px; border-radius: 10px; }
.test-suite { margin-bottom: 20px; border-left: 4px solid #2196f3; padding-left: 20px; }
.test { padding: 15px; margin: 10px 0; border-radius: 5px; background: #f9f9f9; }
.test.passed { border-left: 4px solid #4caf50; }
.test.failed { border-left: 4px solid #f44336; background: #ffebee; }

.footer { text-align: center; padding: 20px; color: #666; }
    `.trim();

    await fs.writeFile(path.join(this.config.outputDir, 'styles.css'), css);
  }

  /**
   * Generate JavaScript file
   */
  private async generateJS(): Promise<void> {
    const js = `
document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tests = document.querySelectorAll('.test');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      tests.forEach(test => {
        if (filter === 'all' || test.dataset.status === filter) {
          test.style.display = 'block';
        } else {
          test.style.display = 'none';
        }
      });
    });
  });
});
    `.trim();

    await fs.writeFile(path.join(this.config.outputDir, 'report.js'), js);
  }

  /**
   * Group results by language
   */
  private groupByLanguage(results: TestResult[]): Map<Language, TestResult[]> {
    const grouped = new Map<Language, TestResult[]>();

    for (const result of results) {
      if (!grouped.has(result.language)) {
        grouped.set(result.language, []);
      }
      grouped.get(result.language)!.push(result);
    }

    return grouped;
  }

  /**
   * Group results by suite
   */
  private groupBySuite(results: TestResult[]): Map<string, TestResult[]> {
    const grouped = new Map<string, TestResult[]>();

    for (const result of results) {
      if (!grouped.has(result.suite)) {
        grouped.set(result.suite, []);
      }
      grouped.get(result.suite)!.push(result);
    }

    return grouped;
  }
}

export default HTMLReporter;
    `.trim();

    await fs.writeFile(path.join(this.config.outputDir, 'report.js'), '');
  }
}
