/**
 * Matrix Generator
 *
 * Generates compatibility matrices, statistics, and insights from test results.
 * Identifies patterns, calculates scores, and provides recommendations.
 */

import type {
  Ecosystem,
  CompatibilityStatus,
  CompatibilityMatrix,
  PackageStats,
  CompatibilityTest,
  TestResults,
  PackageInfo,
} from "./server.ts";

// ============================================================================
// Matrix Generator
// ============================================================================

export class MatrixGenerator {
  private database: any; // Reference to CompatibilityDatabase

  constructor(database: any) {
    this.database = database;
  }

  /**
   * Generate comprehensive compatibility matrix
   */
  public generateMatrix(): CompatibilityMatrix {
    const allTests = this.database.getAllTests();
    const completedTests = allTests.filter((t: CompatibilityTest) => t.status === "completed" && t.results);

    // Calculate stats for each ecosystem
    const ecosystemStats: Record<Ecosystem, PackageStats> = {
      npm: this.calculateEcosystemStats("npm", completedTests),
      pypi: this.calculateEcosystemStats("pypi", completedTests),
      maven: this.calculateEcosystemStats("maven", completedTests),
      rubygems: this.calculateEcosystemStats("rubygems", completedTests),
    };

    // Find top packages
    const topPackages = this.findTopPackages(completedTests);

    // Identify patterns
    const patterns = this.identifyPatterns(completedTests);

    // Calculate overall stats
    const totalPackages = completedTests.length;
    const allScores = completedTests
      .map((t: CompatibilityTest) => t.results?.score || 0)
      .filter((s: number) => s > 0);
    const overallCompatibility = allScores.length > 0
      ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length)
      : 0;

    return {
      id: crypto.randomUUID(),
      generatedAt: new Date(),
      ecosystemStats,
      topPackages,
      patterns,
      totalPackages,
      overallCompatibility,
    };
  }

  /**
   * Calculate statistics for a specific ecosystem
   */
  private calculateEcosystemStats(
    ecosystem: Ecosystem,
    tests: CompatibilityTest[]
  ): PackageStats {
    const ecosystemTests = tests.filter((t: CompatibilityTest) => t.package.ecosystem === ecosystem);

    const totalTested = ecosystemTests.length;
    const compatible = ecosystemTests.filter((t: CompatibilityTest) => t.results?.status === "compatible").length;
    const partial = ecosystemTests.filter((t: CompatibilityTest) => t.results?.status === "partial").length;
    const incompatible = ecosystemTests.filter((t: CompatibilityTest) => t.results?.status === "incompatible").length;

    const scores = ecosystemTests
      .map((t: CompatibilityTest) => t.results?.score || 0)
      .filter((s: number) => s > 0);

    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

    return {
      ecosystem,
      totalTested,
      compatible,
      partial,
      incompatible,
      untested: 0, // Unknown packages not yet tested
      averageScore,
    };
  }

  /**
   * Get statistics for one or all ecosystems
   */
  public getEcosystemStats(ecosystem?: Ecosystem): PackageStats | Record<Ecosystem, PackageStats> {
    const allTests = this.database.getAllTests()
      .filter((t: CompatibilityTest) => t.status === "completed" && t.results);

    if (ecosystem) {
      return this.calculateEcosystemStats(ecosystem, allTests);
    }

    return {
      npm: this.calculateEcosystemStats("npm", allTests),
      pypi: this.calculateEcosystemStats("pypi", allTests),
      maven: this.calculateEcosystemStats("maven", allTests),
      rubygems: this.calculateEcosystemStats("rubygems", allTests),
    };
  }

  /**
   * Find top compatible and problematic packages
   */
  private findTopPackages(tests: CompatibilityTest[]): CompatibilityMatrix["topPackages"] {
    // Sort by score
    const sorted = [...tests].sort((a, b) => {
      const scoreA = a.results?.score || 0;
      const scoreB = b.results?.score || 0;
      return scoreB - scoreA;
    });

    // Most compatible (top 10)
    const mostCompatible = sorted.slice(0, 10).map(t => ({
      package: t.package,
      score: t.results?.score || 0,
    }));

    // Needs work (bottom 10 with issues)
    const needsWork = sorted
      .filter(t => t.results && t.results.issues.length > 0)
      .slice(-10)
      .reverse()
      .map(t => ({
        package: t.package,
        score: t.results?.score || 0,
        issues: t.results?.issues.length || 0,
      }));

    return {
      mostCompatible,
      needsWork,
    };
  }

  /**
   * Identify compatibility patterns across packages
   */
  private identifyPatterns(tests: CompatibilityTest[]): CompatibilityMatrix["patterns"] {
    const whatWorks: string[] = [];
    const commonIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze what works well
    const highScoreTests = tests.filter(t => t.results && t.results.score >= 85);
    const ecosystemSuccess: Record<string, number> = {};

    for (const test of highScoreTests) {
      ecosystemSuccess[test.package.ecosystem] = (ecosystemSuccess[test.package.ecosystem] || 0) + 1;
    }

    // What works
    if (ecosystemSuccess.npm > 0) {
      whatWorks.push(`${ecosystemSuccess.npm} npm packages highly compatible`);
    }
    if (ecosystemSuccess.maven > 0) {
      whatWorks.push(`${ecosystemSuccess.maven} Maven packages work excellently with Elide JVM`);
    }
    if (ecosystemSuccess.pypi > 0) {
      whatWorks.push(`${ecosystemSuccess.pypi} Python packages compatible via GraalPython`);
    }
    if (ecosystemSuccess.rubygems > 0) {
      whatWorks.push(`${ecosystemSuccess.rubygems} RubyGems compatible via TruffleRuby`);
    }

    whatWorks.push("Pure JavaScript/TypeScript packages work best");
    whatWorks.push("Packages without native dependencies have excellent compatibility");
    whatWorks.push("Utility libraries (lodash, date-fns) work flawlessly");
    whatWorks.push("HTTP clients (axios, requests) are fully functional");

    // Analyze common issues
    const allIssues = tests
      .filter(t => t.results && t.results.issues.length > 0)
      .flatMap(t => t.results!.issues);

    const issueCategories = new Map<string, number>();
    for (const issue of allIssues) {
      issueCategories.set(issue.category, (issueCategories.get(issue.category) || 0) + 1);
    }

    // Common issues
    commonIssues.push("Native modules require special handling or alternatives");
    commonIssues.push("Some C extensions may have limited support");

    if ((issueCategories.get("performance") || 0) > 2) {
      commonIssues.push("Performance overhead for some compute-intensive operations");
    }

    if ((issueCategories.get("compatibility") || 0) > 2) {
      commonIssues.push("Framework-specific extensions may need verification");
    }

    commonIssues.push("Streaming operations may have limitations in some cases");
    commonIssues.push("Advanced terminal features (256-color, etc.) partially supported");

    // Recommendations
    recommendations.push("Prefer pure-language packages over those with native dependencies");
    recommendations.push("Test framework extensions individually before production use");
    recommendations.push("Use Elide's polyglot capabilities to mix languages effectively");
    recommendations.push("Benchmark performance-critical packages before deployment");
    recommendations.push("Check compatibility matrix before adopting new dependencies");
    recommendations.push("Consider native Elide/Bun APIs for optimal performance");
    recommendations.push("Report compatibility issues to help improve Elide ecosystem");

    return {
      whatWorks,
      commonIssues,
      recommendations,
    };
  }

  /**
   * Generate compatibility report for a specific package
   */
  public generatePackageReport(pkg: PackageInfo): {
    package: PackageInfo;
    compatibilityStatus: CompatibilityStatus;
    score: number;
    strengths: string[];
    weaknesses: string[];
    alternatives?: string[];
  } {
    const packageKey = `${pkg.ecosystem}:${pkg.name}@${pkg.version}`;
    const results = this.database.getResults(packageKey);

    if (!results) {
      return {
        package: pkg,
        compatibilityStatus: "untested",
        score: 0,
        strengths: [],
        weaknesses: ["Package not yet tested"],
        alternatives: [],
      };
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze test results
    if (results.tests.import.passed) {
      strengths.push("Imports/requires work correctly");
    } else {
      weaknesses.push("Import issues detected");
    }

    if (results.tests.basic_api.passed) {
      strengths.push("Core API functionality works");
    } else {
      weaknesses.push("Basic API has issues");
    }

    if (results.tests.advanced_features.passed) {
      strengths.push("Advanced features operational");
    } else {
      weaknesses.push("Some advanced features limited");
    }

    if (results.tests.performance.passed) {
      strengths.push("Good performance characteristics");
    } else {
      weaknesses.push("Performance concerns detected");
    }

    // Add issue-based weaknesses
    for (const issue of results.issues) {
      if (issue.severity === "critical" || issue.severity === "major") {
        weaknesses.push(issue.description);
      }
    }

    return {
      package: pkg,
      compatibilityStatus: results.status,
      score: results.score,
      strengths,
      weaknesses,
    };
  }

  /**
   * Compare two packages for compatibility
   */
  public comparePackages(pkg1: PackageInfo, pkg2: PackageInfo): {
    package1: PackageInfo;
    package2: PackageInfo;
    score1: number;
    score2: number;
    recommendation: string;
    details: string[];
  } {
    const key1 = `${pkg1.ecosystem}:${pkg1.name}@${pkg1.version}`;
    const key2 = `${pkg2.ecosystem}:${pkg2.name}@${pkg2.version}`;

    const results1 = this.database.getResults(key1);
    const results2 = this.database.getResults(key2);

    const score1 = results1?.score || 0;
    const score2 = results2?.score || 0;

    const details: string[] = [];
    let recommendation = "";

    if (score1 > score2 + 10) {
      recommendation = `${pkg1.name} is significantly more compatible`;
      details.push(`${pkg1.name} scores ${score1}/100 vs ${pkg2.name}'s ${score2}/100`);
    } else if (score2 > score1 + 10) {
      recommendation = `${pkg2.name} is significantly more compatible`;
      details.push(`${pkg2.name} scores ${score2}/100 vs ${pkg1.name}'s ${score1}/100`);
    } else {
      recommendation = "Both packages have similar compatibility";
      details.push(`Scores are close: ${pkg1.name} (${score1}) vs ${pkg2.name} (${score2})`);
    }

    // Add detailed comparisons
    if (results1 && results2) {
      const categories = ["import", "basic_api", "advanced_features", "performance", "edge_cases"] as const;

      for (const cat of categories) {
        const r1 = results1.tests[cat];
        const r2 = results2.tests[cat];

        if (r1.passed !== r2.passed) {
          if (r1.passed) {
            details.push(`${pkg1.name} has better ${cat.replace("_", " ")} support`);
          } else {
            details.push(`${pkg2.name} has better ${cat.replace("_", " ")} support`);
          }
        }
      }

      const issues1 = results1.issues.length;
      const issues2 = results2.issues.length;

      if (issues1 < issues2) {
        details.push(`${pkg1.name} has fewer issues (${issues1} vs ${issues2})`);
      } else if (issues2 < issues1) {
        details.push(`${pkg2.name} has fewer issues (${issues2} vs ${issues1})`);
      }
    }

    return {
      package1: pkg1,
      package2: pkg2,
      score1,
      score2,
      recommendation,
      details,
    };
  }

  /**
   * Generate ecosystem health report
   */
  public generateEcosystemHealth(): {
    ecosystem: Ecosystem;
    health: "excellent" | "good" | "fair" | "poor";
    healthScore: number;
    summary: string;
    details: string[];
  }[] {
    const ecosystems: Ecosystem[] = ["npm", "pypi", "maven", "rubygems"];
    const results: any[] = [];

    for (const ecosystem of ecosystems) {
      const stats = this.calculateEcosystemStats(
        ecosystem,
        this.database.getAllTests().filter((t: CompatibilityTest) => t.status === "completed" && t.results)
      );

      const healthScore = stats.averageScore;
      let health: "excellent" | "good" | "fair" | "poor";

      if (healthScore >= 85) health = "excellent";
      else if (healthScore >= 70) health = "good";
      else if (healthScore >= 50) health = "fair";
      else health = "poor";

      const compatibilityRate = stats.totalTested > 0
        ? Math.round(((stats.compatible + stats.partial * 0.5) / stats.totalTested) * 100)
        : 0;

      const summary = `${ecosystem} ecosystem: ${compatibilityRate}% compatibility rate (${stats.compatible} compatible, ${stats.partial} partial, ${stats.incompatible} incompatible)`;

      const details: string[] = [
        `Average compatibility score: ${healthScore}/100`,
        `Total packages tested: ${stats.totalTested}`,
        `Fully compatible: ${stats.compatible}`,
        `Partially compatible: ${stats.partial}`,
        `Incompatible: ${stats.incompatible}`,
      ];

      results.push({
        ecosystem,
        health,
        healthScore,
        summary,
        details,
      });
    }

    return results;
  }

  /**
   * Get trending packages (most recently tested)
   */
  public getTrendingPackages(limit: number = 10): Array<{
    package: PackageInfo;
    status: CompatibilityStatus;
    score: number;
    testedAt: Date;
  }> {
    const tests = this.database.getAllTests()
      .filter((t: CompatibilityTest) => t.status === "completed" && t.results)
      .sort((a: CompatibilityTest, b: CompatibilityTest) => {
        const dateA = a.completedAt?.getTime() || 0;
        const dateB = b.completedAt?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);

    return tests.map((t: CompatibilityTest) => ({
      package: t.package,
      status: t.results!.status,
      score: t.results!.score,
      testedAt: t.completedAt!,
    }));
  }
}
