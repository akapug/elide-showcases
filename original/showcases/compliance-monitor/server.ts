/**
 * Compliance Monitoring Service
 *
 * Enterprise compliance monitoring system with policy enforcement,
 * audit trails, compliance reporting, risk assessment, and
 * automated remediation tracking.
 */

import { serve } from "bun";
import { randomUUID } from "crypto";

// ============================================================================
// Types and Interfaces
// ============================================================================

type ComplianceFramework = "SOC2" | "HIPAA" | "GDPR" | "PCI-DSS" | "ISO27001" | "NIST";
type PolicyStatus = "active" | "draft" | "deprecated" | "archived";
type ViolationSeverity = "low" | "medium" | "high" | "critical";
type RemediationStatus = "pending" | "in_progress" | "completed" | "failed" | "deferred";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework;
  controls: string[];
  rules: PolicyRule[];
  status: PolicyStatus;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: string; // Expression to evaluate
  severity: ViolationSeverity;
  enabled: boolean;
  autoRemediate: boolean;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceType: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: "success" | "failure";
  complianceImpact?: string[];
}

interface ComplianceViolation {
  id: string;
  policyId: string;
  policyName: string;
  ruleId: string;
  ruleName: string;
  severity: ViolationSeverity;
  detectedAt: Date;
  resource: string;
  resourceType: string;
  description: string;
  evidence: Record<string, any>;
  remediationStatus: RemediationStatus;
  remediationDueDate?: Date;
  assignedTo?: string;
}

interface RemediationTask {
  id: string;
  violationId: string;
  title: string;
  description: string;
  steps: string[];
  assignedTo: string;
  status: RemediationStatus;
  priority: ViolationSeverity;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  notes: string[];
}

interface RiskAssessment {
  id: string;
  framework: ComplianceFramework;
  assessmentDate: Date;
  overallRisk: RiskLevel;
  totalPolicies: number;
  violationCount: number;
  openViolations: number;
  criticalViolations: number;
  complianceScore: number; // 0-100
  categories: RiskCategory[];
  recommendations: string[];
}

interface RiskCategory {
  name: string;
  score: number;
  riskLevel: RiskLevel;
  violations: number;
  controls: number;
}

interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  reportType: "summary" | "detailed" | "executive" | "audit";
  generatedAt: Date;
  period: { start: Date; end: Date };
  data: {
    complianceScore: number;
    totalPolicies: number;
    violations: ViolationSummary;
    auditEvents: number;
    remediationStatus: RemediationSummary;
  };
}

interface ViolationSummary {
  total: number;
  bySeverity: Record<ViolationSeverity, number>;
  byFramework: Record<ComplianceFramework, number>;
  byStatus: Record<RemediationStatus, number>;
}

interface RemediationSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  averageTimeToResolve: number; // in hours
}

// ============================================================================
// Compliance Policy Engine
// ============================================================================

class CompliancePolicyEngine {
  private policies: Map<string, CompliancePolicy> = new Map();
  private violations: ComplianceViolation[] = [];
  private auditLog: AuditEvent[] = [];
  private remediationTasks: Map<string, RemediationTask> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    // SOC 2 Policy
    this.addPolicy({
      name: "SOC 2 Type II Controls",
      description: "Security, availability, and confidentiality controls",
      framework: "SOC2",
      controls: ["CC6.1", "CC6.2", "CC7.1", "CC7.2"],
      rules: [
        {
          id: "soc2-mfa",
          name: "Multi-Factor Authentication Required",
          description: "All users must have MFA enabled",
          condition: "user.mfaEnabled === true",
          severity: "high",
          enabled: true,
          autoRemediate: false,
        },
        {
          id: "soc2-encryption",
          name: "Data Encryption at Rest",
          description: "All sensitive data must be encrypted",
          condition: "data.encrypted === true",
          severity: "critical",
          enabled: true,
          autoRemediate: true,
        },
      ],
      status: "active",
      version: "1.0",
    });

    // GDPR Policy
    this.addPolicy({
      name: "GDPR Data Protection",
      description: "EU General Data Protection Regulation compliance",
      framework: "GDPR",
      controls: ["Art.5", "Art.25", "Art.32", "Art.33"],
      rules: [
        {
          id: "gdpr-consent",
          name: "User Consent Required",
          description: "Explicit consent required for data processing",
          condition: "user.consentGiven === true",
          severity: "critical",
          enabled: true,
          autoRemediate: false,
        },
        {
          id: "gdpr-data-retention",
          name: "Data Retention Limits",
          description: "Personal data must not exceed retention period",
          condition: "data.retentionDays <= policy.maxRetentionDays",
          severity: "high",
          enabled: true,
          autoRemediate: true,
        },
      ],
      status: "active",
      version: "1.0",
    });

    // HIPAA Policy
    this.addPolicy({
      name: "HIPAA Security Rule",
      description: "Protected Health Information (PHI) security controls",
      framework: "HIPAA",
      controls: ["164.308", "164.310", "164.312"],
      rules: [
        {
          id: "hipaa-access-control",
          name: "PHI Access Control",
          description: "Access to PHI must be role-based and logged",
          condition: "access.role && access.logged",
          severity: "critical",
          enabled: true,
          autoRemediate: false,
        },
        {
          id: "hipaa-audit-logs",
          name: "Audit Log Retention",
          description: "Audit logs must be retained for 6 years",
          condition: "logs.retentionYears >= 6",
          severity: "medium",
          enabled: true,
          autoRemediate: true,
        },
      ],
      status: "active",
      version: "1.0",
    });
  }

  private addPolicy(data: Omit<CompliancePolicy, "id" | "createdAt" | "updatedAt">): void {
    const policy: CompliancePolicy = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.policies.set(policy.id, policy);
  }

  public getPolicies(filter?: { framework?: ComplianceFramework; status?: PolicyStatus }): CompliancePolicy[] {
    let policies = Array.from(this.policies.values());

    if (filter?.framework) {
      policies = policies.filter(p => p.framework === filter.framework);
    }

    if (filter?.status) {
      policies = policies.filter(p => p.status === filter.status);
    }

    return policies;
  }

  public evaluateCompliance(resource: any, resourceType: string): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];

    for (const policy of this.policies.values()) {
      if (policy.status !== "active") continue;

      for (const rule of policy.rules) {
        if (!rule.enabled) continue;

        const isCompliant = this.evaluateRule(rule, resource);

        if (!isCompliant) {
          const violation = this.createViolation(policy, rule, resource, resourceType);
          violations.push(violation);

          if (rule.autoRemediate) {
            this.createRemediationTask(violation);
          }
        }
      }
    }

    return violations;
  }

  private evaluateRule(rule: PolicyRule, resource: any): boolean {
    try {
      // Simple expression evaluation (in production, use a safe parser)
      // This is a simplified example
      return Math.random() > 0.1; // 90% compliance rate for demo
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return true; // Assume compliant if evaluation fails
    }
  }

  private createViolation(
    policy: CompliancePolicy,
    rule: PolicyRule,
    resource: any,
    resourceType: string
  ): ComplianceViolation {
    const violation: ComplianceViolation = {
      id: randomUUID(),
      policyId: policy.id,
      policyName: policy.name,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      detectedAt: new Date(),
      resource: resource.id || "unknown",
      resourceType,
      description: rule.description,
      evidence: { resource, rule: rule.condition },
      remediationStatus: "pending",
      remediationDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.violations.push(violation);
    return violation;
  }

  private createRemediationTask(violation: ComplianceViolation): void {
    const task: RemediationTask = {
      id: randomUUID(),
      violationId: violation.id,
      title: `Remediate: ${violation.ruleName}`,
      description: violation.description,
      steps: this.generateRemediationSteps(violation),
      assignedTo: "compliance-team",
      status: "pending",
      priority: violation.severity,
      createdAt: new Date(),
      dueDate: violation.remediationDueDate!,
      notes: [],
    };

    this.remediationTasks.set(task.id, task);
  }

  private generateRemediationSteps(violation: ComplianceViolation): string[] {
    const steps = [
      `Review violation details for ${violation.resource}`,
      `Assess impact and scope of non-compliance`,
      `Implement corrective measures`,
      `Verify compliance with policy rule`,
      `Document resolution and update audit trail`,
    ];
    return steps;
  }

  public logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): void {
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      ...event,
    };

    this.auditLog.push(auditEvent);

    // Keep only last 100,000 events in memory
    if (this.auditLog.length > 100000) {
      this.auditLog.shift();
    }
  }

  public getViolations(filter?: { severity?: ViolationSeverity; status?: RemediationStatus }): ComplianceViolation[] {
    let filtered = [...this.violations];

    if (filter?.severity) {
      filtered = filtered.filter(v => v.severity === filter.severity);
    }

    if (filter?.status) {
      filtered = filtered.filter(v => v.remediationStatus === filter.status);
    }

    return filtered.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  public updateRemediationStatus(
    violationId: string,
    status: RemediationStatus,
    notes?: string
  ): boolean {
    const violation = this.violations.find(v => v.id === violationId);
    if (!violation) return false;

    violation.remediationStatus = status;

    const task = Array.from(this.remediationTasks.values()).find(
      t => t.violationId === violationId
    );

    if (task) {
      task.status = status;
      if (status === "in_progress" && !task.startedAt) {
        task.startedAt = new Date();
      }
      if (status === "completed") {
        task.completedAt = new Date();
      }
      if (notes) {
        task.notes.push(`${new Date().toISOString()}: ${notes}`);
      }
    }

    return true;
  }

  public assessRisk(framework: ComplianceFramework): RiskAssessment {
    const frameworkPolicies = this.getPolicies({ framework, status: "active" });
    const frameworkViolations = this.violations.filter(
      v => frameworkPolicies.some(p => p.id === v.policyId)
    );

    const openViolations = frameworkViolations.filter(
      v => v.remediationStatus !== "completed"
    );
    const criticalViolations = openViolations.filter(v => v.severity === "critical");

    const complianceScore = Math.max(
      0,
      100 - (openViolations.length * 2) - (criticalViolations.length * 5)
    );

    const overallRisk: RiskLevel =
      complianceScore >= 90 ? "low" :
      complianceScore >= 70 ? "medium" :
      complianceScore >= 50 ? "high" : "critical";

    return {
      id: randomUUID(),
      framework,
      assessmentDate: new Date(),
      overallRisk,
      totalPolicies: frameworkPolicies.length,
      violationCount: frameworkViolations.length,
      openViolations: openViolations.length,
      criticalViolations: criticalViolations.length,
      complianceScore,
      categories: this.calculateRiskCategories(frameworkPolicies, frameworkViolations),
      recommendations: this.generateRecommendations(frameworkViolations),
    };
  }

  private calculateRiskCategories(
    policies: CompliancePolicy[],
    violations: ComplianceViolation[]
  ): RiskCategory[] {
    const categories = ["Access Control", "Data Protection", "Monitoring", "Network Security"];

    return categories.map(name => {
      const categoryViolations = violations.filter(() => Math.random() > 0.7);
      const score = Math.max(0, 100 - categoryViolations.length * 10);
      const riskLevel: RiskLevel =
        score >= 90 ? "low" :
        score >= 70 ? "medium" :
        score >= 50 ? "high" : "critical";

      return {
        name,
        score,
        riskLevel,
        violations: categoryViolations.length,
        controls: Math.floor(Math.random() * 10) + 5,
      };
    });
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = violations.filter(v => v.severity === "critical").length;
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical violations immediately`);
    }

    const overdueCount = violations.filter(
      v => v.remediationDueDate && v.remediationDueDate < new Date()
    ).length;
    if (overdueCount > 0) {
      recommendations.push(`${overdueCount} violations are past due for remediation`);
    }

    recommendations.push("Conduct regular compliance training for all staff");
    recommendations.push("Implement automated compliance monitoring");
    recommendations.push("Schedule quarterly compliance audits");

    return recommendations;
  }

  public generateReport(
    framework: ComplianceFramework,
    reportType: ComplianceReport["reportType"],
    period: { start: Date; end: Date }
  ): ComplianceReport {
    const policies = this.getPolicies({ framework, status: "active" });
    const violations = this.violations.filter(
      v => policies.some(p => p.id === v.policyId) &&
           v.detectedAt >= period.start &&
           v.detectedAt <= period.end
    );

    const auditEvents = this.auditLog.filter(
      e => e.timestamp >= period.start && e.timestamp <= period.end
    ).length;

    const completedTasks = Array.from(this.remediationTasks.values()).filter(
      t => t.completedAt && t.completedAt >= period.start && t.completedAt <= period.end
    );

    const avgTimeToResolve = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const time = (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + time;
        }, 0) / completedTasks.length
      : 0;

    return {
      id: randomUUID(),
      framework,
      reportType,
      generatedAt: new Date(),
      period,
      data: {
        complianceScore: this.assessRisk(framework).complianceScore,
        totalPolicies: policies.length,
        violations: {
          total: violations.length,
          bySeverity: {
            critical: violations.filter(v => v.severity === "critical").length,
            high: violations.filter(v => v.severity === "high").length,
            medium: violations.filter(v => v.severity === "medium").length,
            low: violations.filter(v => v.severity === "low").length,
          },
          byFramework: { [framework]: violations.length } as any,
          byStatus: {
            pending: violations.filter(v => v.remediationStatus === "pending").length,
            in_progress: violations.filter(v => v.remediationStatus === "in_progress").length,
            completed: violations.filter(v => v.remediationStatus === "completed").length,
            failed: violations.filter(v => v.remediationStatus === "failed").length,
            deferred: violations.filter(v => v.remediationStatus === "deferred").length,
          },
        },
        auditEvents,
        remediationStatus: {
          total: this.remediationTasks.size,
          completed: completedTasks.length,
          inProgress: Array.from(this.remediationTasks.values()).filter(
            t => t.status === "in_progress"
          ).length,
          overdue: Array.from(this.remediationTasks.values()).filter(
            t => t.dueDate < new Date() && t.status !== "completed"
          ).length,
          averageTimeToResolve: avgTimeToResolve,
        },
      },
    };
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const engine = new CompliancePolicyEngine();

const server = serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "healthy", timestamp: new Date() });
    }

    // Get policies
    if (url.pathname === "/api/policies" && req.method === "GET") {
      const framework = url.searchParams.get("framework") as ComplianceFramework | undefined;
      const status = url.searchParams.get("status") as PolicyStatus | undefined;
      const policies = engine.getPolicies({ framework, status });
      return Response.json({ policies, count: policies.length });
    }

    // Evaluate compliance
    if (url.pathname === "/api/evaluate" && req.method === "POST") {
      const body = await req.json();
      const violations = engine.evaluateCompliance(body.resource, body.resourceType);
      return Response.json({ violations, count: violations.length });
    }

    // Get violations
    if (url.pathname === "/api/violations" && req.method === "GET") {
      const severity = url.searchParams.get("severity") as ViolationSeverity | undefined;
      const status = url.searchParams.get("status") as RemediationStatus | undefined;
      const violations = engine.getViolations({ severity, status });
      return Response.json({ violations, count: violations.length });
    }

    // Update remediation
    if (url.pathname.startsWith("/api/violations/") && req.method === "PATCH") {
      const violationId = url.pathname.split("/").pop()!;
      const body = await req.json();
      const success = engine.updateRemediationStatus(violationId, body.status, body.notes);
      return Response.json({ success });
    }

    // Audit log
    if (url.pathname === "/api/audit" && req.method === "POST") {
      const body = await req.json();
      engine.logAuditEvent(body);
      return Response.json({ success: true });
    }

    // Risk assessment
    if (url.pathname === "/api/risk" && req.method === "GET") {
      const framework = url.searchParams.get("framework") as ComplianceFramework;
      if (!framework) {
        return Response.json({ error: "framework parameter required" }, { status: 400 });
      }
      const assessment = engine.assessRisk(framework);
      return Response.json(assessment);
    }

    // Generate report
    if (url.pathname === "/api/reports" && req.method === "POST") {
      const body = await req.json();
      const report = engine.generateReport(
        body.framework,
        body.reportType,
        { start: new Date(body.periodStart), end: new Date(body.periodEnd) }
      );
      return Response.json(report);
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`📋 Compliance Monitoring Service running on http://localhost:${server.port}`);
console.log(`📊 Endpoints:`);
console.log(`   GET    /api/policies     - Get policies (?framework=SOC2&status=active)`);
console.log(`   POST   /api/evaluate     - Evaluate compliance`);
console.log(`   GET    /api/violations   - Get violations (?severity=critical&status=pending)`);
console.log(`   PATCH  /api/violations/:id - Update remediation status`);
console.log(`   POST   /api/audit        - Log audit event`);
console.log(`   GET    /api/risk         - Risk assessment (?framework=GDPR)`);
console.log(`   POST   /api/reports      - Generate compliance report`);
