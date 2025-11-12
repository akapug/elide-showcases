/**
 * Package Scoring System
 *
 * Calculates quality, popularity, and maintenance scores for packages
 * Similar to npms.io scoring algorithm
 */

import { Database } from "@elide/db";

export interface PackageScoreComponents {
  quality: {
    carefulness: number;      // Has tests, linting, code coverage
    tests: number;            // Test quality
    health: number;           // No vulnerabilities, dependencies up to date
    branding: number;         // README, badges, documentation
  };
  popularity: {
    communityInterest: number; // Stars, forks, watchers
    downloadsCount: number;    // Download statistics
    downloadsAcceleration: number; // Download growth
    dependentsCount: number;   // Number of packages depending on this
  };
  maintenance: {
    releasesFrequency: number;  // Regular releases
    commitsFrequency: number;   // Active development
    openIssues: number;         // Issue management
    issuesDistribution: number; // Issue age distribution
  };
}

export interface PackageScore {
  final: number;
  detail: PackageScoreComponents;
  analyzedAt: Date;
}

export class PackageScorer {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Calculate comprehensive package score
   */
  async calculateScore(packageId: string): Promise<PackageScore> {
    const pkg = this.db.prepare("SELECT * FROM registry_packages WHERE id = ?").get(packageId);

    if (!pkg) {
      throw new Error("Package not found");
    }

    // Get quality metrics
    const quality = await this.calculateQualityScore(packageId);
    const popularity = await this.calculatePopularityScore(packageId);
    const maintenance = await this.calculateMaintenanceScore(packageId);

    // Weighted average (similar to npms.io)
    const final = (
      quality.total * 0.30 +
      popularity.total * 0.40 +
      maintenance.total * 0.30
    );

    return {
      final: Math.round(final * 100) / 100,
      detail: {
        quality: quality.components,
        popularity: popularity.components,
        maintenance: maintenance.components
      },
      analyzedAt: new Date()
    };
  }

  /**
   * Calculate quality score based on package metadata and analysis
   */
  private async calculateQualityScore(packageId: string): Promise<{
    total: number;
    components: PackageScoreComponents["quality"];
  }> {
    const metrics = this.db.prepare(`
      SELECT * FROM package_quality_metrics WHERE package_id = ?
    `).get(packageId);

    // Carefulness: Tests, linting, code quality
    const carefulness = this.calculateCarefulness(metrics);

    // Tests: Test coverage and quality
    const tests = this.calculateTestScore(metrics);

    // Health: Security and dependency freshness
    const health = await this.calculateHealthScore(packageId);

    // Branding: Documentation quality
    const branding = this.calculateBrandingScore(metrics);

    const components = {
      carefulness,
      tests,
      health,
      branding
    };

    const total = (carefulness + tests + health + branding) / 4;

    return { total, components };
  }

  private calculateCarefulness(metrics: any): number {
    if (!metrics) return 0.5;

    let score = 0;

    // Has linting/code quality tools
    if (metrics.has_tests) score += 0.3;

    // Has CI/CD setup
    score += 0.2; // Assume CI if has tests

    // Code quality indicators
    if (metrics.dependencies_up_to_date) score += 0.3;

    // Type safety
    if (metrics.has_types) score += 0.2;

    return Math.min(1, score);
  }

  private calculateTestScore(metrics: any): number {
    if (!metrics || !metrics.has_tests) return 0;

    let score = 0.3; // Base score for having tests

    // Code coverage
    if (metrics.code_coverage) {
      score += metrics.code_coverage * 0.7;
    }

    return Math.min(1, score);
  }

  private async calculateHealthScore(packageId: string): Promise<number> {
    const versions = this.db.prepare(`
      SELECT rv.*, ss.score as security_score
      FROM registry_versions rv
      LEFT JOIN security_scans ss ON rv.id = ss.version_id
      WHERE rv.package_id = ?
      ORDER BY rv.published_at DESC
      LIMIT 1
    `).get(packageId);

    if (!versions) return 0.5;

    let score = 0;

    // Security score (no vulnerabilities)
    const securityScore = versions.security_score || 100;
    score += (securityScore / 100) * 0.5;

    // Dependencies up to date (checked in metrics)
    const metrics = this.db.prepare(
      "SELECT dependencies_up_to_date FROM package_quality_metrics WHERE package_id = ?"
    ).get(packageId);

    if (metrics?.dependencies_up_to_date) {
      score += 0.5;
    } else {
      score += 0.2; // Partial credit
    }

    return Math.min(1, score);
  }

  private calculateBrandingScore(metrics: any): number {
    if (!metrics) return 0.3;

    let score = 0;

    // Has README
    if (metrics.has_readme) score += 0.4;

    // Has LICENSE
    if (metrics.has_license) score += 0.2;

    // Has documentation/homepage
    score += 0.2; // Assume some docs

    // Has badges/branding
    score += 0.2;

    return Math.min(1, score);
  }

  /**
   * Calculate popularity score based on community metrics
   */
  private async calculatePopularityScore(packageId: string): Promise<{
    total: number;
    components: PackageScoreComponents["popularity"];
  }> {
    const pkg = this.db.prepare(`
      SELECT * FROM registry_packages WHERE id = ?
    `).get(packageId);

    // Community interest (stars, github metrics)
    const communityInterest = this.calculateCommunityInterest(pkg);

    // Download counts
    const downloadsCount = this.calculateDownloadsScore(pkg);

    // Download growth
    const downloadsAcceleration = await this.calculateDownloadGrowth(packageId);

    // Dependents count
    const dependentsCount = await this.calculateDependentsScore(packageId);

    const components = {
      communityInterest,
      downloadsCount,
      downloadsAcceleration,
      dependentsCount
    };

    const total = (
      communityInterest * 0.25 +
      downloadsCount * 0.35 +
      downloadsAcceleration * 0.15 +
      dependentsCount * 0.25
    );

    return { total, components };
  }

  private calculateCommunityInterest(pkg: any): number {
    if (!pkg) return 0;

    // Normalize stars (logarithmic scale)
    const stars = pkg.stars || 0;
    const normalizedStars = Math.log10(stars + 1) / Math.log10(10000); // Max ~10k stars

    return Math.min(1, normalizedStars);
  }

  private calculateDownloadsScore(pkg: any): number {
    if (!pkg) return 0;

    // Weekly downloads (logarithmic scale)
    const weekly = pkg.weekly_downloads || 0;
    const normalizedDownloads = Math.log10(weekly + 1) / Math.log10(1000000); // Max ~1M weekly

    return Math.min(1, normalizedDownloads);
  }

  private async calculateDownloadGrowth(packageId: string): Promise<number> {
    const recentStats = this.db.prepare(`
      SELECT date, SUM(downloads) as downloads
      FROM download_stats
      WHERE package_id = ? AND date >= date('now', '-14 days')
      GROUP BY date
      ORDER BY date
    `).all(packageId);

    if (recentStats.length < 7) return 0.5; // Not enough data

    // Calculate week-over-week growth
    const firstWeek = recentStats.slice(0, 7).reduce((sum, day) => sum + day.downloads, 0);
    const secondWeek = recentStats.slice(7, 14).reduce((sum, day) => sum + day.downloads, 0);

    if (firstWeek === 0) return 0.5;

    const growth = (secondWeek - firstWeek) / firstWeek;

    // Normalize growth rate
    // Positive growth is good, negative is bad
    const normalized = Math.max(0, Math.min(1, 0.5 + growth));

    return normalized;
  }

  private async calculateDependentsScore(packageId: string): Promise<number> {
    const pkg = this.db.prepare("SELECT name FROM registry_packages WHERE id = ?").get(packageId);

    if (!pkg) return 0;

    // Count packages that depend on this package
    const dependents = this.db.prepare(`
      SELECT COUNT(DISTINCT version_id) as count
      FROM dependency_tree
      WHERE dependency_name = ?
    `).get(pkg.name);

    const count = dependents?.count || 0;

    // Normalize (logarithmic scale)
    const normalized = Math.log10(count + 1) / Math.log10(1000); // Max ~1000 dependents

    return Math.min(1, normalized);
  }

  /**
   * Calculate maintenance score based on activity metrics
   */
  private async calculateMaintenanceScore(packageId: string): Promise<{
    total: number;
    components: PackageScoreComponents["maintenance"];
  }> {
    // Release frequency
    const releasesFrequency = await this.calculateReleaseFrequency(packageId);

    // Commit frequency (from quality metrics)
    const metrics = this.db.prepare(
      "SELECT commit_frequency FROM package_quality_metrics WHERE package_id = ?"
    ).get(packageId);
    const commitsFrequency = metrics?.commit_frequency || 0.3;

    // Issue management (simulated)
    const openIssues = 0.7; // Assume good issue management
    const issuesDistribution = 0.8; // Assume issues are addressed quickly

    const components = {
      releasesFrequency,
      commitsFrequency,
      openIssues,
      issuesDistribution
    };

    const total = (
      releasesFrequency * 0.30 +
      commitsFrequency * 0.30 +
      openIssues * 0.20 +
      issuesDistribution * 0.20
    );

    return { total, components };
  }

  private async calculateReleaseFrequency(packageId: string): Promise<number> {
    const versions = this.db.prepare(`
      SELECT published_at
      FROM registry_versions
      WHERE package_id = ?
      ORDER BY published_at DESC
      LIMIT 10
    `).all(packageId);

    if (versions.length < 2) return 0.3; // New package

    // Calculate average time between releases
    let totalDays = 0;
    for (let i = 0; i < versions.length - 1; i++) {
      const date1 = new Date(versions[i].published_at);
      const date2 = new Date(versions[i + 1].published_at);
      const days = (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
      totalDays += days;
    }

    const avgDaysBetweenReleases = totalDays / (versions.length - 1);

    // Score based on release frequency
    // Ideal: 30-90 days between releases
    if (avgDaysBetweenReleases < 7) return 0.5; // Too frequent
    if (avgDaysBetweenReleases < 30) return 0.8;
    if (avgDaysBetweenReleases < 90) return 1.0;
    if (avgDaysBetweenReleases < 180) return 0.7;
    if (avgDaysBetweenReleases < 365) return 0.4;
    return 0.2; // Infrequent releases

  }

  /**
   * Batch score update for all packages
   */
  async updateAllScores(): Promise<void> {
    const packages = this.db.prepare("SELECT id FROM registry_packages").all();

    for (const pkg of packages) {
      try {
        const score = await this.calculateScore(pkg.id);

        // Update package scores table
        this.db.prepare(`
          INSERT OR REPLACE INTO package_scores (
            package_id, quality, popularity, maintenance, overall
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          pkg.id,
          score.detail.quality,
          score.detail.popularity,
          score.detail.maintenance,
          score.final
        );

        console.log(`Updated score for package ${pkg.id}: ${score.final}`);
      } catch (error) {
        console.error(`Error scoring package ${pkg.id}:`, error);
      }
    }
  }
}

// CLI for running score updates
if (import.meta.main) {
  const db = new Database("registry.db");
  const scorer = new PackageScorer(db);

  console.log("Starting package score update...");
  await scorer.updateAllScores();
  console.log("Score update complete!");
}
