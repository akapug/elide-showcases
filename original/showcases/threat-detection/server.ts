/**
 * Threat Detection Service
 *
 * A comprehensive security threat detection system that analyzes logs,
 * detects patterns, identifies anomalies, integrates with SIEM systems,
 * and manages security alerts.
 */

import { serve } from "bun";

// ============================================================================
// Types and Interfaces
// ============================================================================

interface LogEntry {
  timestamp: Date;
  source: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metadata: Record<string, any>;
  ip?: string;
  userId?: string;
}

interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  regex: RegExp;
  severity: "low" | "medium" | "high" | "critical";
  tags: string[];
}

interface Anomaly {
  id: string;
  timestamp: Date;
  type: "statistical" | "behavioral" | "threshold";
  description: string;
  score: number;
  baseline: number;
  current: number;
  affectedEntities: string[];
}

interface Alert {
  id: string;
  timestamp: Date;
  type: "pattern_match" | "anomaly" | "correlation" | "manual";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  source: string;
  status: "new" | "investigating" | "resolved" | "false_positive";
  assignee?: string;
  metadata: Record<string, any>;
}

interface SIEMEvent {
  eventId: string;
  timestamp: Date;
  sourceSystem: string;
  eventType: string;
  payload: Record<string, any>;
}

// ============================================================================
// Threat Detection Engine
// ============================================================================

class ThreatDetectionEngine {
  private logs: LogEntry[] = [];
  private patterns: ThreatPattern[] = [];
  private alerts: Alert[] = [];
  private anomalies: Anomaly[] = [];
  private baselineMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.initializePatterns();
    this.startAnomalyDetection();
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        id: "sql-injection",
        name: "SQL Injection Attempt",
        description: "Detects potential SQL injection patterns",
        regex: /(union.*select|select.*from|drop.*table|exec.*sp_|xp_cmdshell)/i,
        severity: "critical",
        tags: ["injection", "database", "exploit"],
      },
      {
        id: "xss-attempt",
        name: "Cross-Site Scripting (XSS)",
        description: "Detects XSS attack patterns",
        regex: /(<script|javascript:|onerror=|onload=|eval\()/i,
        severity: "high",
        tags: ["injection", "web", "exploit"],
      },
      {
        id: "brute-force",
        name: "Brute Force Attack",
        description: "Multiple failed login attempts",
        regex: /(failed.*login|authentication.*failed|invalid.*credentials)/i,
        severity: "high",
        tags: ["authentication", "brute-force"],
      },
      {
        id: "path-traversal",
        name: "Path Traversal Attempt",
        description: "Directory traversal attack detection",
        regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f)/i,
        severity: "high",
        tags: ["traversal", "file-system", "exploit"],
      },
      {
        id: "privilege-escalation",
        name: "Privilege Escalation",
        description: "Unauthorized privilege elevation attempts",
        regex: /(sudo|admin.*access|elevated.*privileges|setuid)/i,
        severity: "critical",
        tags: ["privilege", "escalation", "access"],
      },
    ];
  }

  public ingestLog(log: LogEntry): void {
    this.logs.push(log);

    // Keep only last 10000 logs in memory
    if (this.logs.length > 10000) {
      this.logs.shift();
    }

    // Analyze log immediately
    this.analyzeLog(log);
    this.updateBaseline(log);
  }

  private analyzeLog(log: LogEntry): void {
    // Pattern matching
    for (const pattern of this.patterns) {
      if (pattern.regex.test(log.message)) {
        this.createAlert({
          type: "pattern_match",
          severity: pattern.severity,
          title: pattern.name,
          description: `${pattern.description}: ${log.message.substring(0, 100)}`,
          source: log.source,
          metadata: {
            pattern: pattern.id,
            log: log,
          },
        });
      }
    }

    // IP-based analysis
    if (log.ip) {
      this.analyzeIPBehavior(log.ip);
    }

    // User-based analysis
    if (log.userId) {
      this.analyzeUserBehavior(log.userId);
    }
  }

  private analyzeIPBehavior(ip: string): void {
    const recentLogs = this.logs
      .filter(l => l.ip === ip)
      .slice(-100);

    // Check for high request rate
    const recentCount = recentLogs.filter(
      l => Date.now() - l.timestamp.getTime() < 60000
    ).length;

    if (recentCount > 100) {
      this.createAnomaly({
        type: "threshold",
        description: `Unusual request rate from IP ${ip}`,
        score: 0.85,
        baseline: 20,
        current: recentCount,
        affectedEntities: [ip],
      });
    }
  }

  private analyzeUserBehavior(userId: string): void {
    const userLogs = this.logs
      .filter(l => l.userId === userId)
      .slice(-50);

    const failedLogins = userLogs.filter(
      l => l.message.toLowerCase().includes("failed")
    ).length;

    if (failedLogins > 5) {
      this.createAlert({
        type: "correlation",
        severity: "high",
        title: "Potential Account Compromise",
        description: `User ${userId} has ${failedLogins} failed attempts`,
        source: "behavior-analysis",
        metadata: { userId, failedLogins },
      });
    }
  }

  private updateBaseline(log: LogEntry): void {
    const key = `${log.source}:count`;
    const baseline = this.baselineMetrics.get(key) || [];
    baseline.push(1);

    // Keep rolling window of 1000 data points
    if (baseline.length > 1000) {
      baseline.shift();
    }

    this.baselineMetrics.set(key, baseline);
  }

  private startAnomalyDetection(): void {
    setInterval(() => this.detectAnomalies(), 30000); // Every 30 seconds
  }

  private detectAnomalies(): void {
    // Statistical anomaly detection using Z-score
    for (const [key, values] of this.baselineMetrics.entries()) {
      if (values.length < 30) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
      );

      const current = values[values.length - 1];
      const zScore = Math.abs((current - mean) / stdDev);

      if (zScore > 3) {
        this.createAnomaly({
          type: "statistical",
          description: `Statistical anomaly detected for ${key}`,
          score: Math.min(zScore / 5, 1),
          baseline: mean,
          current,
          affectedEntities: [key],
        });
      }
    }
  }

  private createAlert(data: Partial<Alert>): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: "new",
      ...data as any,
    };

    this.alerts.push(alert);
    console.log(`🚨 ALERT: ${alert.title} [${alert.severity}]`);
  }

  private createAnomaly(data: Partial<Anomaly>): void {
    const anomaly: Anomaly = {
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...data as any,
    };

    this.anomalies.push(anomaly);

    // Create alert for high-score anomalies
    if (anomaly.score > 0.7) {
      this.createAlert({
        type: "anomaly",
        severity: anomaly.score > 0.9 ? "critical" : "high",
        title: "Anomaly Detected",
        description: anomaly.description,
        source: "anomaly-detection",
        metadata: { anomaly },
      });
    }
  }

  public getAlerts(filter?: { status?: string; severity?: string }): Alert[] {
    let filtered = [...this.alerts];

    if (filter?.status) {
      filtered = filtered.filter(a => a.status === filter.status);
    }

    if (filter?.severity) {
      filtered = filtered.filter(a => a.severity === filter.severity);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public updateAlertStatus(alertId: string, status: Alert["status"], assignee?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = status;
    if (assignee) alert.assignee = assignee;

    return true;
  }

  public getAnomalies(): Anomaly[] {
    return [...this.anomalies].sort((a, b) => b.score - a.score);
  }

  public getStats() {
    return {
      totalLogs: this.logs.length,
      totalAlerts: this.alerts.length,
      totalAnomalies: this.anomalies.length,
      alertsByStatus: {
        new: this.alerts.filter(a => a.status === "new").length,
        investigating: this.alerts.filter(a => a.status === "investigating").length,
        resolved: this.alerts.filter(a => a.status === "resolved").length,
        false_positive: this.alerts.filter(a => a.status === "false_positive").length,
      },
      alertsBySeverity: {
        critical: this.alerts.filter(a => a.severity === "critical").length,
        high: this.alerts.filter(a => a.severity === "high").length,
        medium: this.alerts.filter(a => a.severity === "medium").length,
        low: this.alerts.filter(a => a.severity === "low").length,
      },
    };
  }
}

// ============================================================================
// SIEM Integration
// ============================================================================

class SIEMIntegration {
  private engine: ThreatDetectionEngine;

  constructor(engine: ThreatDetectionEngine) {
    this.engine = engine;
  }

  public sendEvent(event: SIEMEvent): void {
    console.log(`📤 Sending event to SIEM: ${event.eventType}`);
    // In production, this would integrate with Splunk, ELK, QRadar, etc.
  }

  public exportAlerts(format: "json" | "csv" | "syslog" = "json"): string {
    const alerts = this.engine.getAlerts();

    switch (format) {
      case "json":
        return JSON.stringify(alerts, null, 2);
      case "csv":
        return this.convertToCSV(alerts);
      case "syslog":
        return this.convertToSyslog(alerts);
      default:
        return JSON.stringify(alerts);
    }
  }

  private convertToCSV(alerts: Alert[]): string {
    const headers = ["ID", "Timestamp", "Type", "Severity", "Title", "Status"];
    const rows = alerts.map(a => [
      a.id,
      a.timestamp.toISOString(),
      a.type,
      a.severity,
      a.title,
      a.status,
    ]);

    return [headers, ...rows].map(row => row.join(",")).join("\n");
  }

  private convertToSyslog(alerts: Alert[]): string {
    return alerts
      .map(a => `<${this.getSyslogPriority(a.severity)}> ${a.timestamp.toISOString()} threat-detection: ${a.title}`)
      .join("\n");
  }

  private getSyslogPriority(severity: string): number {
    const map: Record<string, number> = {
      critical: 2,
      high: 3,
      medium: 4,
      low: 5,
    };
    return map[severity] || 5;
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const engine = new ThreatDetectionEngine();
const siem = new SIEMIntegration(engine);

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "healthy", timestamp: new Date() });
    }

    // Ingest logs
    if (url.pathname === "/api/logs" && req.method === "POST") {
      const body = await req.json() as Partial<LogEntry>;
      const log: LogEntry = {
        timestamp: new Date(),
        source: body.source || "unknown",
        severity: body.severity || "low",
        message: body.message || "",
        metadata: body.metadata || {},
        ip: body.ip,
        userId: body.userId,
      };

      engine.ingestLog(log);
      return Response.json({ success: true, message: "Log ingested" });
    }

    // Get alerts
    if (url.pathname === "/api/alerts" && req.method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const severity = url.searchParams.get("severity") || undefined;
      const alerts = engine.getAlerts({ status, severity });
      return Response.json({ alerts, count: alerts.length });
    }

    // Update alert
    if (url.pathname.startsWith("/api/alerts/") && req.method === "PATCH") {
      const alertId = url.pathname.split("/").pop()!;
      const body = await req.json() as { status: Alert["status"]; assignee?: string };
      const success = engine.updateAlertStatus(alertId, body.status, body.assignee);
      return Response.json({ success });
    }

    // Get anomalies
    if (url.pathname === "/api/anomalies" && req.method === "GET") {
      const anomalies = engine.getAnomalies();
      return Response.json({ anomalies, count: anomalies.length });
    }

    // Get statistics
    if (url.pathname === "/api/stats" && req.method === "GET") {
      const stats = engine.getStats();
      return Response.json(stats);
    }

    // Export alerts
    if (url.pathname === "/api/export" && req.method === "GET") {
      const format = (url.searchParams.get("format") || "json") as "json" | "csv" | "syslog";
      const data = siem.exportAlerts(format);
      const contentType = format === "json" ? "application/json" : "text/plain";
      return new Response(data, { headers: { "Content-Type": contentType } });
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`🔒 Threat Detection Service running on http://localhost:${server.port}`);
console.log(`📊 Endpoints:`);
console.log(`   POST   /api/logs       - Ingest logs`);
console.log(`   GET    /api/alerts     - Get alerts (filter: ?status=new&severity=high)`);
console.log(`   PATCH  /api/alerts/:id - Update alert status`);
console.log(`   GET    /api/anomalies  - Get detected anomalies`);
console.log(`   GET    /api/stats      - Get statistics`);
console.log(`   GET    /api/export     - Export alerts (?format=json|csv|syslog)`);
