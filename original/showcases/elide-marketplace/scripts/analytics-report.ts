#!/usr/bin/env elide

/**
 * Analytics Reporting Script
 *
 * Generates analytics reports for the marketplace
 */

import { Database } from "@elide/db";

const db = new Database("marketplace.db");

interface ReportOptions {
  startDate?: string;
  endDate?: string;
  format?: "text" | "json" | "csv";
}

class AnalyticsReporter {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Generate package analytics report
   */
  generatePackageReport(options: ReportOptions = {}): any {
    const { startDate, endDate } = options;

    // Total packages
    const totalPackages = this.db.prepare("SELECT COUNT(*) as count FROM packages").get();

    // Most downloaded packages
    const topPackages = this.db.prepare(`
      SELECT name, downloads
      FROM packages
      ORDER BY downloads DESC
      LIMIT 10
    `).all();

    // Package growth
    const packageGrowth = this.db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM packages
      WHERE created_at >= date('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    // Total downloads
    const totalDownloads = this.db.prepare(`
      SELECT SUM(downloads) as total FROM packages
    `).get();

    // New versions published
    const newVersions = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM package_versions
      WHERE published_at >= date('now', '-30 days')
    `).get();

    return {
      overview: {
        totalPackages: totalPackages.count,
        totalDownloads: totalDownloads.total,
        newVersionsLast30Days: newVersions.count
      },
      topPackages,
      packageGrowth
    };
  }

  /**
   * Generate service analytics report
   */
  generateServiceReport(options: ReportOptions = {}): any {
    // Total services
    const totalServices = this.db.prepare("SELECT COUNT(*) as count FROM services").get();

    // Active deployments
    const activeDeployments = this.db.prepare(`
      SELECT COUNT(*) as count FROM deployments WHERE status = 'running'
    `).get();

    // Top services by deployments
    const topServices = this.db.prepare(`
      SELECT s.name, COUNT(d.id) as deployments
      FROM services s
      LEFT JOIN deployments d ON s.id = d.service_id
      GROUP BY s.id
      ORDER BY deployments DESC
      LIMIT 10
    `).all();

    // Deployment status distribution
    const statusDistribution = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM deployments
      GROUP BY status
    `).all();

    // Revenue (simulated)
    const revenue = this.db.prepare(`
      SELECT SUM(current_cost) as total
      FROM billing
    `).get();

    return {
      overview: {
        totalServices: totalServices.count,
        activeDeployments: activeDeployments.count,
        totalRevenue: revenue.total || 0
      },
      topServices,
      statusDistribution
    };
  }

  /**
   * Generate user analytics report
   */
  generateUserReport(options: ReportOptions = {}): any {
    // Total users
    const totalUsers = this.db.prepare("SELECT COUNT(*) as count FROM users").get();

    // User growth
    const userGrowth = this.db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= date('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    // User roles distribution
    const roleDistribution = this.db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `).all();

    // Active users (users with API tokens)
    const activeUsers = this.db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM api_tokens
    `).get();

    return {
      overview: {
        totalUsers: totalUsers.count,
        activeUsers: activeUsers.count
      },
      userGrowth,
      roleDistribution
    };
  }

  /**
   * Generate complete marketplace report
   */
  generateCompleteReport(options: ReportOptions = {}): any {
    return {
      generatedAt: new Date().toISOString(),
      packages: this.generatePackageReport(options),
      services: this.generateServiceReport(options),
      users: this.generateUserReport(options)
    };
  }

  /**
   * Format report for output
   */
  formatReport(report: any, format: "text" | "json" | "csv" = "text"): string {
    switch (format) {
      case "json":
        return JSON.stringify(report, null, 2);

      case "csv":
        // Simple CSV conversion (would need more sophistication in production)
        return this.convertToCSV(report);

      case "text":
      default:
        return this.formatTextReport(report);
    }
  }

  private formatTextReport(report: any): string {
    let output = "";

    output += "╔══════════════════════════════════════════════════════════╗\n";
    output += "║         ELIDE MARKETPLACE ANALYTICS REPORT               ║\n";
    output += "╚══════════════════════════════════════════════════════════╝\n\n";

    output += `Generated: ${report.generatedAt}\n\n`;

    // Packages
    output += "📦 PACKAGES\n";
    output += "═══════════\n";
    output += `Total Packages: ${report.packages.overview.totalPackages.toLocaleString()}\n`;
    output += `Total Downloads: ${report.packages.overview.totalDownloads.toLocaleString()}\n`;
    output += `New Versions (30d): ${report.packages.overview.newVersionsLast30Days.toLocaleString()}\n\n`;

    output += "Top Packages by Downloads:\n";
    report.packages.topPackages.forEach((pkg: any, index: number) => {
      output += `  ${index + 1}. ${pkg.name} - ${pkg.downloads.toLocaleString()} downloads\n`;
    });
    output += "\n";

    // Services
    output += "🛍️  SERVICES\n";
    output += "═══════════\n";
    output += `Total Services: ${report.services.overview.totalServices.toLocaleString()}\n`;
    output += `Active Deployments: ${report.services.overview.activeDeployments.toLocaleString()}\n`;
    output += `Total Revenue: $${report.services.overview.totalRevenue.toLocaleString()}\n\n`;

    output += "Top Services by Deployments:\n";
    report.services.topServices.forEach((service: any, index: number) => {
      output += `  ${index + 1}. ${service.name} - ${service.deployments.toLocaleString()} deployments\n`;
    });
    output += "\n";

    output += "Deployment Status:\n";
    report.services.statusDistribution.forEach((status: any) => {
      output += `  ${status.status}: ${status.count.toLocaleString()}\n`;
    });
    output += "\n";

    // Users
    output += "👥 USERS\n";
    output += "════════\n";
    output += `Total Users: ${report.users.overview.totalUsers.toLocaleString()}\n`;
    output += `Active Users: ${report.users.overview.activeUsers.toLocaleString()}\n\n`;

    output += "User Roles:\n";
    report.users.roleDistribution.forEach((role: any) => {
      output += `  ${role.role}: ${role.count.toLocaleString()}\n`;
    });
    output += "\n";

    return output;
  }

  private convertToCSV(report: any): string {
    // Simplified CSV conversion
    let csv = "Category,Metric,Value\n";

    csv += `Packages,Total,${report.packages.overview.totalPackages}\n`;
    csv += `Packages,Total Downloads,${report.packages.overview.totalDownloads}\n`;
    csv += `Services,Total,${report.services.overview.totalServices}\n`;
    csv += `Services,Active Deployments,${report.services.overview.activeDeployments}\n`;
    csv += `Services,Revenue,${report.services.overview.totalRevenue}\n`;
    csv += `Users,Total,${report.users.overview.totalUsers}\n`;
    csv += `Users,Active,${report.users.overview.activeUsers}\n`;

    return csv;
  }
}

// CLI
if (import.meta.main) {
  const reporter = new AnalyticsReporter(db);

  const format = (Deno.args[0] || "text") as "text" | "json" | "csv";

  const report = reporter.generateCompleteReport();
  const formatted = reporter.formatReport(report, format);

  console.log(formatted);

  // Optionally save to file
  if (Deno.args[1]) {
    Deno.writeTextFileSync(Deno.args[1], formatted);
    console.log(`\nReport saved to ${Deno.args[1]}`);
  }
}
