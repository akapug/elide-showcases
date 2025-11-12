/**
 * Security Scanner for Package Dependencies
 *
 * Scans packages for known vulnerabilities and security issues
 * Integrates with vulnerability databases
 */

import { Database } from "@elide/db";

export interface Vulnerability {
  id: string;
  cve?: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  affectedVersions: string[];
  patchedVersions: string[];
  references: string[];
  cvss?: {
    score: number;
    vector: string;
  };
  cwe?: string[];
  publishedAt: Date;
  updatedAt: Date;
}

export interface SecurityReport {
  packageId: string;
  packageName: string;
  version: string;
  scannedAt: Date;
  vulnerabilities: Vulnerability[];
  score: number;
  risk: "critical" | "high" | "medium" | "low" | "none";
  recommendations: string[];
}

export class SecurityScanner {
  private db: Database;
  private vulnerabilityDb: Map<string, Vulnerability[]>;

  constructor(database: Database) {
    this.db = database;
    this.vulnerabilityDb = new Map();
    this.loadVulnerabilityDatabase();
  }

  /**
   * Load known vulnerabilities from database
   */
  private loadVulnerabilityDatabase(): void {
    // In production, this would fetch from:
    // - npm audit / npm advisory database
    // - Snyk vulnerability DB
    // - GitHub Security Advisories
    // - CVE databases
    // - OSV (Open Source Vulnerabilities)

    // Example vulnerabilities for demo
    const exampleVulns: Vulnerability[] = [
      {
        id: "VULN-001",
        cve: "CVE-2021-23337",
        severity: "high",
        title: "Command Injection",
        description: "All versions of package lodash are vulnerable to Command Injection via template.",
        affectedVersions: ["<4.17.21"],
        patchedVersions: [">=4.17.21"],
        references: [
          "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
          "https://github.com/lodash/lodash/pull/5065"
        ],
        cvss: {
          score: 7.2,
          vector: "CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H"
        },
        cwe: ["CWE-77"],
        publishedAt: new Date("2021-02-15"),
        updatedAt: new Date("2021-02-15")
      },
      {
        id: "VULN-002",
        cve: "CVE-2022-25883",
        severity: "critical",
        title: "Prototype Pollution",
        description: "Versions of the package semver before 7.5.2 are vulnerable to Regular Expression Denial of Service (ReDoS).",
        affectedVersions: ["<7.5.2"],
        patchedVersions: [">=7.5.2"],
        references: [
          "https://nvd.nist.gov/vuln/detail/CVE-2022-25883"
        ],
        cvss: {
          score: 9.1,
          vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N"
        },
        cwe: ["CWE-1333"],
        publishedAt: new Date("2022-06-21"),
        updatedAt: new Date("2023-06-21")
      }
    ];

    // Index vulnerabilities by package name
    exampleVulns.forEach(vuln => {
      const packageNames = ["lodash", "semver"]; // Example
      packageNames.forEach(name => {
        if (!this.vulnerabilityDb.has(name)) {
          this.vulnerabilityDb.set(name, []);
        }
        this.vulnerabilityDb.get(name)!.push(vuln);
      });
    });
  }

  /**
   * Scan a package version for vulnerabilities
   */
  async scanPackage(packageId: string, version: string): Promise<SecurityReport> {
    const pkg = this.db.prepare(`
      SELECT rp.*, rv.id as version_id, rv.metadata
      FROM registry_packages rp
      JOIN registry_versions rv ON rp.id = rv.package_id
      WHERE rp.id = ? AND rv.version = ?
    `).get(packageId, version);

    if (!pkg) {
      throw new Error("Package version not found");
    }

    const vulnerabilities: Vulnerability[] = [];
    const metadata = JSON.parse(pkg.metadata);

    // 1. Scan direct dependencies
    const dependencies = metadata.dependencies || {};
    for (const [depName, depVersion] of Object.entries(dependencies)) {
      const depVulns = await this.scanDependency(depName, depVersion as string);
      vulnerabilities.push(...depVulns);
    }

    // 2. Scan for code-level vulnerabilities
    const codeVulns = await this.scanCode(pkg.version_id);
    vulnerabilities.push(...codeVulns);

    // 3. Check for malicious code patterns
    const maliciousPatterns = await this.scanForMaliciousPatterns(pkg.version_id);
    vulnerabilities.push(...maliciousPatterns);

    // Calculate security score
    const score = this.calculateSecurityScore(vulnerabilities);
    const risk = this.determineRiskLevel(vulnerabilities);
    const recommendations = this.generateRecommendations(vulnerabilities);

    // Store scan results
    this.db.prepare(`
      INSERT INTO security_scans (id, version_id, scan_date, vulnerabilities, score, status)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `).run(
      this.generateId(),
      pkg.version_id,
      JSON.stringify(vulnerabilities),
      score,
      risk === "none" ? "clean" : "vulnerable"
    );

    return {
      packageId,
      packageName: pkg.name,
      version,
      scannedAt: new Date(),
      vulnerabilities,
      score,
      risk,
      recommendations
    };
  }

  /**
   * Scan a single dependency
   */
  private async scanDependency(name: string, versionRange: string): Promise<Vulnerability[]> {
    const knownVulns = this.vulnerabilityDb.get(name) || [];

    return knownVulns.filter(vuln => {
      // Check if version range is affected
      return this.isVersionAffected(versionRange, vuln.affectedVersions);
    });
  }

  /**
   * Scan code for vulnerabilities
   */
  private async scanCode(versionId: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // In production, this would:
    // - Extract and analyze the package tarball
    // - Look for dangerous patterns (eval, Function constructor, etc.)
    // - Check for hardcoded secrets
    // - Analyze for SQL injection, XSS, etc.

    // Simulate code scanning
    if (Math.random() > 0.9) {
      vulnerabilities.push({
        id: `CODE-${this.generateId()}`,
        severity: "medium",
        title: "Potential Code Injection",
        description: "Code uses eval() or Function() constructor which may be vulnerable to code injection",
        affectedVersions: ["*"],
        patchedVersions: [],
        references: [],
        publishedAt: new Date(),
        updatedAt: new Date()
      });
    }

    return vulnerabilities;
  }

  /**
   * Scan for malicious patterns
   */
  private async scanForMaliciousPatterns(versionId: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Patterns that indicate potential malicious code:
    // - Network requests to suspicious domains
    // - File system access beyond normal scope
    // - Process execution
    // - Cryptocurrency mining code
    // - Data exfiltration patterns

    // Simulate malicious pattern detection
    if (Math.random() > 0.98) {
      vulnerabilities.push({
        id: `MAL-${this.generateId()}`,
        severity: "critical",
        title: "Suspicious Network Activity",
        description: "Package makes network requests to unknown domains",
        affectedVersions: ["*"],
        patchedVersions: [],
        references: [],
        publishedAt: new Date(),
        updatedAt: new Date()
      });
    }

    return vulnerabilities;
  }

  /**
   * Check if a version is affected by a vulnerability
   */
  private isVersionAffected(version: string, affectedVersions: string[]): boolean {
    // Simplified version matching
    // In production, use semver package for proper version range matching

    for (const affectedRange of affectedVersions) {
      if (affectedRange === "*") return true;

      // Handle range operators: <, <=, >, >=, ^, ~
      const match = affectedRange.match(/^([<>=^~]+)?(.+)$/);
      if (!match) continue;

      const operator = match[1] || "=";
      const targetVersion = match[2];

      // Simplified comparison
      if (operator === "<" && version < targetVersion) return true;
      if (operator === "=" && version === targetVersion) return true;
    }

    return false;
  }

  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
    let score = 100;

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case "critical":
          score -= 30;
          break;
        case "high":
          score -= 20;
          break;
        case "medium":
          score -= 10;
          break;
        case "low":
          score -= 5;
          break;
        case "info":
          score -= 2;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(vulnerabilities: Vulnerability[]): SecurityReport["risk"] {
    if (vulnerabilities.length === 0) return "none";

    const hasCritical = vulnerabilities.some(v => v.severity === "critical");
    const hasHigh = vulnerabilities.some(v => v.severity === "high");
    const hasMedium = vulnerabilities.some(v => v.severity === "medium");

    if (hasCritical) return "critical";
    if (hasHigh) return "high";
    if (hasMedium) return "medium";
    return "low";
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
    const recommendations: string[] = [];

    if (vulnerabilities.length === 0) {
      recommendations.push("No known vulnerabilities found");
      return recommendations;
    }

    // Group by package
    const vulnsByPackage = new Map<string, Vulnerability[]>();
    vulnerabilities.forEach(vuln => {
      const key = vuln.title;
      if (!vulnsByPackage.has(key)) {
        vulnsByPackage.set(key, []);
      }
      vulnsByPackage.get(key)!.push(vuln);
    });

    // Generate recommendations for each vulnerability
    vulnerabilities.forEach(vuln => {
      if (vuln.patchedVersions.length > 0) {
        recommendations.push(
          `Update to ${vuln.patchedVersions[0]} to fix ${vuln.title}`
        );
      } else {
        recommendations.push(
          `Review ${vuln.title} - no patch available yet`
        );
      }
    });

    // General recommendations
    if (vulnerabilities.some(v => v.severity === "critical" || v.severity === "high")) {
      recommendations.push("Consider alternative packages if patches are not available");
    }

    return recommendations;
  }

  /**
   * Scan entire dependency tree
   */
  async scanDependencyTree(packageId: string, version: string): Promise<Map<string, SecurityReport>> {
    const reports = new Map<string, SecurityReport>();

    // Get package metadata
    const pkg = this.db.prepare(`
      SELECT rp.*, rv.metadata
      FROM registry_packages rp
      JOIN registry_versions rv ON rp.id = rv.package_id
      WHERE rp.id = ? AND rv.version = ?
    `).get(packageId, version);

    if (!pkg) {
      throw new Error("Package not found");
    }

    // Scan main package
    const mainReport = await this.scanPackage(packageId, version);
    reports.set(`${pkg.name}@${version}`, mainReport);

    // Recursively scan dependencies
    const metadata = JSON.parse(pkg.metadata);
    const dependencies = metadata.dependencies || {};

    for (const [depName, depVersion] of Object.entries(dependencies)) {
      const depPkg = this.db.prepare(
        "SELECT * FROM registry_packages WHERE name = ?"
      ).get(depName);

      if (depPkg) {
        try {
          const depReport = await this.scanPackage(depPkg.id, depVersion as string);
          reports.set(`${depName}@${depVersion}`, depReport);
        } catch (error) {
          console.error(`Error scanning dependency ${depName}:`, error);
        }
      }
    }

    return reports;
  }

  /**
   * Get vulnerability statistics
   */
  getVulnerabilityStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byPackage: Map<string, number>;
  } {
    const stats = {
      total: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      byPackage: new Map<string, number>()
    };

    this.vulnerabilityDb.forEach((vulns, packageName) => {
      stats.total += vulns.length;
      stats.byPackage.set(packageName, vulns.length);

      vulns.forEach(vuln => {
        stats.bySeverity[vuln.severity]++;
      });
    });

    return stats;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// CLI for running security scans
if (import.meta.main) {
  const db = new Database("registry.db");
  const scanner = new SecurityScanner(db);

  const packageName = Deno.args[0];
  const version = Deno.args[1];

  if (!packageName || !version) {
    console.error("Usage: security-scanner.ts <package-name> <version>");
    Deno.exit(1);
  }

  const pkg = db.prepare("SELECT * FROM registry_packages WHERE name = ?").get(packageName);

  if (!pkg) {
    console.error(`Package ${packageName} not found`);
    Deno.exit(1);
  }

  console.log(`Scanning ${packageName}@${version}...`);
  const report = await scanner.scanPackage(pkg.id, version);

  console.log("\n=== Security Report ===");
  console.log(`Package: ${report.packageName}@${report.version}`);
  console.log(`Risk: ${report.risk.toUpperCase()}`);
  console.log(`Score: ${report.score}/100`);
  console.log(`Vulnerabilities: ${report.vulnerabilities.length}`);

  if (report.vulnerabilities.length > 0) {
    console.log("\n=== Vulnerabilities ===");
    report.vulnerabilities.forEach(vuln => {
      console.log(`\n[${vuln.severity.toUpperCase()}] ${vuln.title}`);
      console.log(`  ${vuln.description}`);
      if (vuln.cve) console.log(`  CVE: ${vuln.cve}`);
      if (vuln.patchedVersions.length > 0) {
        console.log(`  Fix: Update to ${vuln.patchedVersions.join(", ")}`);
      }
    });
  }

  console.log("\n=== Recommendations ===");
  report.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
}
