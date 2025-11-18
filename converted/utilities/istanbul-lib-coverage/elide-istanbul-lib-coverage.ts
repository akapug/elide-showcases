/**
 * istanbul-lib-coverage - Code Coverage Data
 *
 * Core features:
 * - Coverage data management
 * - Line/branch/function coverage
 * - Merge coverage data
 * - Coverage summary
 * - JSON serialization
 * - Istanbul format support
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

interface Location {
  line: number;
  column: number;
}

interface Range {
  start: Location;
  end: Location;
}

interface FunctionCoverage {
  name: string;
  decl: Range;
  loc: Range;
  line: number;
}

interface StatementCoverage {
  start: Location;
  end: Location;
}

interface BranchCoverage {
  loc: Range;
  type: string;
  locations: Range[];
}

interface FileCoverage {
  path: string;
  statementMap: Record<string, StatementCoverage>;
  fnMap: Record<string, FunctionCoverage>;
  branchMap: Record<string, BranchCoverage>;
  s: Record<string, number>; // statement counts
  f: Record<string, number>; // function counts
  b: Record<string, number[]>; // branch counts
}

interface CoverageMap {
  files(): string[];
  fileCoverageFor(filename: string): FileCoverage;
  addFileCoverage(coverage: FileCoverage): void;
  merge(other: CoverageMap): void;
  toJSON(): Record<string, FileCoverage>;
}

interface CoverageSummary {
  lines: { total: number; covered: number; skipped: number; pct: number };
  statements: { total: number; covered: number; skipped: number; pct: number };
  functions: { total: number; covered: number; skipped: number; pct: number };
  branches: { total: number; covered: number; skipped: number; pct: number };
  merge(other: CoverageSummary): void;
  toJSON(): any;
}

export class CoverageMapImpl implements CoverageMap {
  private data: Map<string, FileCoverage>;

  constructor(data?: Record<string, FileCoverage>) {
    this.data = new Map();
    if (data) {
      Object.entries(data).forEach(([path, coverage]) => {
        this.data.set(path, coverage);
      });
    }
  }

  files(): string[] {
    return Array.from(this.data.keys());
  }

  fileCoverageFor(filename: string): FileCoverage {
    const coverage = this.data.get(filename);
    if (!coverage) {
      throw new Error(`No coverage for file: ${filename}`);
    }
    return coverage;
  }

  addFileCoverage(coverage: FileCoverage): void {
    this.data.set(coverage.path, coverage);
  }

  merge(other: CoverageMap): void {
    other.files().forEach(file => {
      const coverage = other.fileCoverageFor(file);
      if (this.data.has(file)) {
        // Merge coverage counts
        const existing = this.data.get(file)!;
        Object.keys(coverage.s).forEach(key => {
          existing.s[key] = (existing.s[key] || 0) + coverage.s[key];
        });
      } else {
        this.data.set(file, coverage);
      }
    });
  }

  toJSON(): Record<string, FileCoverage> {
    const result: Record<string, FileCoverage> = {};
    this.data.forEach((coverage, path) => {
      result[path] = coverage;
    });
    return result;
  }
}

export class CoverageSummaryImpl implements CoverageSummary {
  lines = { total: 0, covered: 0, skipped: 0, pct: 0 };
  statements = { total: 0, covered: 0, skipped: 0, pct: 0 };
  functions = { total: 0, covered: 0, skipped: 0, pct: 0 };
  branches = { total: 0, covered: 0, skipped: 0, pct: 0 };

  constructor(data?: Partial<CoverageSummary>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  merge(other: CoverageSummary): void {
    ['lines', 'statements', 'functions', 'branches'].forEach((key) => {
      const k = key as keyof Pick<CoverageSummary, 'lines' | 'statements' | 'functions' | 'branches'>;
      this[k].total += other[k].total;
      this[k].covered += other[k].covered;
      this[k].skipped += other[k].skipped;
      this[k].pct = this[k].total > 0 ? (this[k].covered / this[k].total) * 100 : 0;
    });
  }

  toJSON(): any {
    return {
      lines: { ...this.lines },
      statements: { ...this.statements },
      functions: { ...this.functions },
      branches: { ...this.branches },
    };
  }
}

export function createCoverageMap(data?: Record<string, FileCoverage>): CoverageMap {
  return new CoverageMapImpl(data);
}

export function createCoverageSummary(data?: Partial<CoverageSummary>): CoverageSummary {
  return new CoverageSummaryImpl(data);
}

export function createFileCoverage(path: string): FileCoverage {
  return {
    path,
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
  };
}

if (import.meta.url.includes("elide-istanbul-lib-coverage")) {
  console.log("📊 istanbul-lib-coverage for Elide\n");

  console.log("=== Creating Coverage Map ===");
  const map = createCoverageMap();

  const fileCov = createFileCoverage('/src/app.ts');
  fileCov.s['1'] = 10;
  fileCov.s['2'] = 5;
  fileCov.f['1'] = 3;

  map.addFileCoverage(fileCov);

  console.log("Files:", map.files());
  console.log("Coverage:", map.fileCoverageFor('/src/app.ts'));

  console.log("\n=== Creating Coverage Summary ===");
  const summary = createCoverageSummary({
    lines: { total: 100, covered: 85, skipped: 0, pct: 85 },
    statements: { total: 120, covered: 100, skipped: 0, pct: 83.33 },
    functions: { total: 15, covered: 12, skipped: 0, pct: 80 },
    branches: { total: 30, covered: 20, skipped: 0, pct: 66.67 },
  });

  console.log("Summary:", JSON.stringify(summary.toJSON(), null, 2));

  console.log();
  console.log("✅ Use Cases: Code coverage, Testing, CI/CD");
  console.log("🚀 80M+ npm downloads/week - Istanbul coverage core");
}

export default {
  createCoverageMap,
  createCoverageSummary,
  createFileCoverage,
};
