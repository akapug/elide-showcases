/**
 * Access Control Service
 *
 * Enterprise RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control)
 * service with role management, permission evaluation, policy engine, audit logging,
 * and access reviews.
 */

import { serve } from "bun";
import { randomUUID } from "crypto";

// ============================================================================
// Types and Interfaces
// ============================================================================

type ActionType = "read" | "write" | "delete" | "execute" | "admin" | "grant";
type ResourceType = "document" | "api" | "database" | "service" | "admin_panel" | "user_data";
type PolicyEffect = "allow" | "deny";
type AccessDecision = "allow" | "deny" | "not_applicable";

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  attributes: Record<string, any>;
  createdAt: Date;
  lastLoginAt?: Date;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inheritsFrom: string[]; // Role inheritance
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  resource: string;
  resourceType: ResourceType;
  actions: ActionType[];
  conditions?: Condition[];
  effect: PolicyEffect;
}

interface Condition {
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "in" | "greater_than" | "less_than";
  value: any;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  version: string;
  effect: PolicyEffect;
  subjects: string[]; // User IDs or role names
  resources: string[];
  actions: ActionType[];
  conditions: Condition[];
  priority: number;
  enabled: boolean;
  createdAt: Date;
}

interface AccessRequest {
  id: string;
  userId: string;
  resource: string;
  resourceType: ResourceType;
  action: ActionType;
  context: Record<string, any>;
  timestamp: Date;
}

interface AccessResponse {
  requestId: string;
  decision: AccessDecision;
  reason: string;
  matchedPolicies: string[];
  evaluationTime: number; // milliseconds
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceType: ResourceType;
  decision: AccessDecision;
  reason: string;
  context: Record<string, any>;
  ipAddress?: string;
}

interface AccessReview {
  id: string;
  userId: string;
  reviewerId: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  findings: ReviewFinding[];
  actions: ReviewAction[];
}

interface ReviewFinding {
  type: "excessive_permissions" | "unused_access" | "role_mismatch" | "policy_violation";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affectedPermissions: string[];
}

interface ReviewAction {
  type: "revoke" | "modify" | "approve" | "escalate";
  permission: string;
  reason: string;
  appliedAt?: Date;
}

// ============================================================================
// Policy Engine
// ============================================================================

class PolicyEngine {
  private policies: Map<string, Policy> = new Map();
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private accessReviews: Map<string, AccessReview> = new Map();

  constructor() {
    this.initializeDefaultRoles();
    this.initializeDefaultPolicies();
    this.initializeTestUsers();
  }

  private initializeDefaultRoles(): void {
    // Admin Role
    this.roles.set("admin", {
      id: "admin",
      name: "Administrator",
      description: "Full system access",
      permissions: [
        {
          id: "perm-admin-all",
          resource: "*",
          resourceType: "admin_panel",
          actions: ["read", "write", "delete", "execute", "admin", "grant"],
          effect: "allow",
        },
      ],
      inheritsFrom: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Developer Role
    this.roles.set("developer", {
      id: "developer",
      name: "Developer",
      description: "Development and deployment access",
      permissions: [
        {
          id: "perm-dev-api",
          resource: "api/*",
          resourceType: "api",
          actions: ["read", "write", "execute"],
          effect: "allow",
        },
        {
          id: "perm-dev-db",
          resource: "database/dev",
          resourceType: "database",
          actions: ["read", "write"],
          effect: "allow",
          conditions: [
            {
              attribute: "environment",
              operator: "equals",
              value: "development",
            },
          ],
        },
      ],
      inheritsFrom: ["viewer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Viewer Role
    this.roles.set("viewer", {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access",
      permissions: [
        {
          id: "perm-viewer-docs",
          resource: "document/*",
          resourceType: "document",
          actions: ["read"],
          effect: "allow",
        },
      ],
      inheritsFrom: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Data Analyst Role
    this.roles.set("analyst", {
      id: "analyst",
      name: "Data Analyst",
      description: "Data access and analysis",
      permissions: [
        {
          id: "perm-analyst-db",
          resource: "database/analytics",
          resourceType: "database",
          actions: ["read"],
          effect: "allow",
        },
        {
          id: "perm-analyst-api",
          resource: "api/analytics/*",
          resourceType: "api",
          actions: ["read", "execute"],
          effect: "allow",
        },
      ],
      inheritsFrom: ["viewer"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private initializeDefaultPolicies(): void {
    // Time-based access policy
    this.addPolicy({
      name: "Business Hours Access",
      description: "Allow access only during business hours",
      version: "1.0",
      effect: "allow",
      subjects: ["*"],
      resources: ["api/production/*"],
      actions: ["write", "delete"],
      conditions: [
        {
          attribute: "time.hour",
          operator: "greater_than",
          value: 9,
        },
        {
          attribute: "time.hour",
          operator: "less_than",
          value: 17,
        },
      ],
      priority: 100,
      enabled: true,
    });

    // IP-based policy
    this.addPolicy({
      name: "Internal Network Only",
      description: "Sensitive operations from internal network only",
      version: "1.0",
      effect: "allow",
      subjects: ["*"],
      resources: ["database/production"],
      actions: ["write", "delete", "admin"],
      conditions: [
        {
          attribute: "ipAddress",
          operator: "contains",
          value: "10.0.0.",
        },
      ],
      priority: 200,
      enabled: true,
    });

    // Data classification policy
    this.addPolicy({
      name: "Confidential Data Access",
      description: "Require clearance for confidential data",
      version: "1.0",
      effect: "allow",
      subjects: ["*"],
      resources: ["document/confidential/*"],
      actions: ["read", "write"],
      conditions: [
        {
          attribute: "clearanceLevel",
          operator: "in",
          value: ["secret", "top-secret"],
        },
      ],
      priority: 300,
      enabled: true,
    });
  }

  private initializeTestUsers(): void {
    this.users.set("user1", {
      id: "user1",
      username: "alice",
      email: "alice@example.com",
      roles: ["admin"],
      attributes: {
        department: "engineering",
        clearanceLevel: "top-secret",
        employeeId: "E001",
      },
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });

    this.users.set("user2", {
      id: "user2",
      username: "bob",
      email: "bob@example.com",
      roles: ["developer"],
      attributes: {
        department: "engineering",
        clearanceLevel: "secret",
        employeeId: "E002",
      },
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });

    this.users.set("user3", {
      id: "user3",
      username: "charlie",
      email: "charlie@example.com",
      roles: ["viewer"],
      attributes: {
        department: "marketing",
        clearanceLevel: "public",
        employeeId: "E003",
      },
      createdAt: new Date(),
    });
  }

  private addPolicy(data: Omit<Policy, "id" | "createdAt">): void {
    const policy: Policy = {
      id: randomUUID(),
      createdAt: new Date(),
      ...data,
    };
    this.policies.set(policy.id, policy);
  }

  public evaluateAccess(request: AccessRequest): AccessResponse {
    const startTime = Date.now();
    const user = this.users.get(request.userId);

    if (!user) {
      return {
        requestId: request.id,
        decision: "deny",
        reason: "User not found",
        matchedPolicies: [],
        evaluationTime: Date.now() - startTime,
      };
    }

    // Collect all permissions from user's roles
    const permissions = this.collectPermissions(user);

    // Evaluate role-based permissions
    const rbacDecision = this.evaluateRBAC(request, permissions);

    // Evaluate attribute-based policies
    const abacDecision = this.evaluateABAC(request, user);

    // Combine decisions (deny takes precedence)
    let finalDecision: AccessDecision = "not_applicable";
    const matchedPolicies: string[] = [];
    let reason = "";

    if (rbacDecision.decision === "deny" || abacDecision.decision === "deny") {
      finalDecision = "deny";
      reason = rbacDecision.decision === "deny" ? rbacDecision.reason : abacDecision.reason;
      matchedPolicies.push(...rbacDecision.matchedPolicies, ...abacDecision.matchedPolicies);
    } else if (rbacDecision.decision === "allow" || abacDecision.decision === "allow") {
      finalDecision = "allow";
      reason = "Access granted by policies";
      matchedPolicies.push(...rbacDecision.matchedPolicies, ...abacDecision.matchedPolicies);
    } else {
      finalDecision = "deny";
      reason = "No matching policies found";
    }

    // Audit log
    this.logAccess({
      userId: request.userId,
      username: user.username,
      action: request.action,
      resource: request.resource,
      resourceType: request.resourceType,
      decision: finalDecision,
      reason,
      context: request.context,
      ipAddress: request.context.ipAddress,
    });

    return {
      requestId: request.id,
      decision: finalDecision,
      reason,
      matchedPolicies,
      evaluationTime: Date.now() - startTime,
    };
  }

  private collectPermissions(user: User): Permission[] {
    const permissions: Permission[] = [];
    const processedRoles = new Set<string>();

    const processRole = (roleName: string) => {
      if (processedRoles.has(roleName)) return;
      processedRoles.add(roleName);

      const role = this.roles.get(roleName);
      if (!role) return;

      permissions.push(...role.permissions);

      // Process inherited roles
      for (const inheritedRole of role.inheritsFrom) {
        processRole(inheritedRole);
      }
    };

    for (const roleName of user.roles) {
      processRole(roleName);
    }

    return permissions;
  }

  private evaluateRBAC(
    request: AccessRequest,
    permissions: Permission[]
  ): { decision: AccessDecision; reason: string; matchedPolicies: string[] } {
    for (const permission of permissions) {
      // Check if resource matches
      if (!this.matchResource(request.resource, permission.resource)) {
        continue;
      }

      // Check if action is allowed
      if (!permission.actions.includes(request.action)) {
        continue;
      }

      // Check conditions
      if (permission.conditions) {
        const conditionsMet = this.evaluateConditions(permission.conditions, request.context);
        if (!conditionsMet) {
          continue;
        }
      }

      if (permission.effect === "allow") {
        return {
          decision: "allow",
          reason: `Permission granted by ${permission.id}`,
          matchedPolicies: [permission.id],
        };
      } else {
        return {
          decision: "deny",
          reason: `Permission denied by ${permission.id}`,
          matchedPolicies: [permission.id],
        };
      }
    }

    return { decision: "not_applicable", reason: "No RBAC policies matched", matchedPolicies: [] };
  }

  private evaluateABAC(
    request: AccessRequest,
    user: User
  ): { decision: AccessDecision; reason: string; matchedPolicies: string[] } {
    const applicablePolicies = Array.from(this.policies.values())
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of applicablePolicies) {
      // Check if subject matches
      if (!policy.subjects.includes("*") && !policy.subjects.includes(user.id)) {
        const userRoles = user.roles;
        const hasMatchingRole = policy.subjects.some(s => userRoles.includes(s));
        if (!hasMatchingRole) continue;
      }

      // Check if resource matches
      const resourceMatches = policy.resources.some(r => this.matchResource(request.resource, r));
      if (!resourceMatches) continue;

      // Check if action matches
      if (!policy.actions.includes(request.action)) continue;

      // Evaluate conditions
      const context = { ...request.context, ...user.attributes };
      const conditionsMet = this.evaluateConditions(policy.conditions, context);
      if (!conditionsMet) continue;

      return {
        decision: policy.effect === "allow" ? "allow" : "deny",
        reason: `Policy ${policy.name} (${policy.effect})`,
        matchedPolicies: [policy.id],
      };
    }

    return { decision: "not_applicable", reason: "No ABAC policies matched", matchedPolicies: [] };
  }

  private matchResource(resource: string, pattern: string): boolean {
    if (pattern === "*") return true;

    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(resource);
  }

  private evaluateConditions(conditions: Condition[], context: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = this.getNestedValue(context, condition.attribute);

      switch (condition.operator) {
        case "equals":
          return value === condition.value;
        case "not_equals":
          return value !== condition.value;
        case "contains":
          return String(value).includes(String(condition.value));
        case "in":
          return Array.isArray(condition.value) && condition.value.includes(value);
        case "greater_than":
          return Number(value) > Number(condition.value);
        case "less_than":
          return Number(value) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private logAccess(data: Omit<AuditLog, "id" | "timestamp">): void {
    const log: AuditLog = {
      id: randomUUID(),
      timestamp: new Date(),
      ...data,
    };

    this.auditLogs.push(log);

    // Keep only last 100,000 logs
    if (this.auditLogs.length > 100000) {
      this.auditLogs.shift();
    }
  }

  public assignRole(userId: string, roleName: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const role = this.roles.get(roleName);
    if (!role) return false;

    if (!user.roles.includes(roleName)) {
      user.roles.push(roleName);
    }

    this.logAccess({
      userId: "system",
      username: "system",
      action: "grant",
      resource: `user/${userId}/role/${roleName}`,
      resourceType: "user_data",
      decision: "allow",
      reason: "Role assigned",
      context: {},
    });

    return true;
  }

  public revokeRole(userId: string, roleName: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.roles = user.roles.filter(r => r !== roleName);

    this.logAccess({
      userId: "system",
      username: "system",
      action: "delete",
      resource: `user/${userId}/role/${roleName}`,
      resourceType: "user_data",
      decision: "allow",
      reason: "Role revoked",
      context: {},
    });

    return true;
  }

  public createRole(data: Omit<Role, "id" | "createdAt" | "updatedAt">): Role {
    const role: Role = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    this.roles.set(role.id, role);
    return role;
  }

  public getAuditLogs(filter?: {
    userId?: string;
    decision?: AccessDecision;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filter?.userId) {
      logs = logs.filter(l => l.userId === filter.userId);
    }

    if (filter?.decision) {
      logs = logs.filter(l => l.decision === filter.decision);
    }

    if (filter?.startDate) {
      logs = logs.filter(l => l.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      logs = logs.filter(l => l.timestamp <= filter.endDate!);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public scheduleAccessReview(userId: string, reviewerId: string): AccessReview {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const permissions = this.collectPermissions(user);

    // Analyze for potential findings
    const findings: ReviewFinding[] = [];

    // Check for unused access (simplified)
    const recentLogs = this.auditLogs.filter(
      l => l.userId === userId && Date.now() - l.timestamp.getTime() < 90 * 24 * 60 * 60 * 1000
    );

    if (recentLogs.length === 0 && permissions.length > 0) {
      findings.push({
        type: "unused_access",
        severity: "medium",
        description: "User has permissions but no access in last 90 days",
        affectedPermissions: permissions.map(p => p.id),
      });
    }

    // Check for excessive permissions
    if (permissions.length > 20) {
      findings.push({
        type: "excessive_permissions",
        severity: "high",
        description: `User has ${permissions.length} permissions, which may be excessive`,
        affectedPermissions: permissions.slice(0, 10).map(p => p.id),
      });
    }

    const review: AccessReview = {
      id: randomUUID(),
      userId,
      reviewerId,
      scheduledDate: new Date(),
      status: "pending",
      findings,
      actions: [],
    };

    this.accessReviews.set(review.id, review);
    return review;
  }

  public getUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  public getPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  public getAccessReviews(filter?: { status?: string }): AccessReview[] {
    let reviews = Array.from(this.accessReviews.values());

    if (filter?.status) {
      reviews = reviews.filter(r => r.status === filter.status);
    }

    return reviews;
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const engine = new PolicyEngine();

const server = serve({
  port: 3003,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "healthy", timestamp: new Date() });
    }

    // Evaluate access
    if (url.pathname === "/api/access/evaluate" && req.method === "POST") {
      const body = await req.json();
      const request: AccessRequest = {
        id: randomUUID(),
        timestamp: new Date(),
        ...body,
      };

      const response = engine.evaluateAccess(request);
      return Response.json(response);
    }

    // Get users
    if (url.pathname === "/api/users" && req.method === "GET") {
      const users = engine.getUsers();
      return Response.json({ users, count: users.length });
    }

    // Get roles
    if (url.pathname === "/api/roles" && req.method === "GET") {
      const roles = engine.getRoles();
      return Response.json({ roles, count: roles.length });
    }

    // Create role
    if (url.pathname === "/api/roles" && req.method === "POST") {
      const body = await req.json();
      const role = engine.createRole(body);
      return Response.json({ role });
    }

    // Assign role
    if (url.pathname === "/api/users/roles" && req.method === "POST") {
      const body = await req.json();
      const success = engine.assignRole(body.userId, body.roleName);
      return Response.json({ success });
    }

    // Revoke role
    if (url.pathname === "/api/users/roles" && req.method === "DELETE") {
      const body = await req.json();
      const success = engine.revokeRole(body.userId, body.roleName);
      return Response.json({ success });
    }

    // Get policies
    if (url.pathname === "/api/policies" && req.method === "GET") {
      const policies = engine.getPolicies();
      return Response.json({ policies, count: policies.length });
    }

    // Get audit logs
    if (url.pathname === "/api/audit" && req.method === "GET") {
      const userId = url.searchParams.get("userId") || undefined;
      const decision = url.searchParams.get("decision") as AccessDecision | undefined;
      const logs = engine.getAuditLogs({ userId, decision });
      return Response.json({ logs, count: logs.length });
    }

    // Schedule access review
    if (url.pathname === "/api/reviews" && req.method === "POST") {
      const body = await req.json();
      const review = engine.scheduleAccessReview(body.userId, body.reviewerId);
      return Response.json({ review });
    }

    // Get access reviews
    if (url.pathname === "/api/reviews" && req.method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const reviews = engine.getAccessReviews({ status });
      return Response.json({ reviews, count: reviews.length });
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`🔐 Access Control Service running on http://localhost:${server.port}`);
console.log(`📊 Endpoints:`);
console.log(`   POST   /api/access/evaluate - Evaluate access request`);
console.log(`   GET    /api/users           - Get all users`);
console.log(`   GET    /api/roles           - Get all roles`);
console.log(`   POST   /api/roles           - Create new role`);
console.log(`   POST   /api/users/roles     - Assign role to user`);
console.log(`   DELETE /api/users/roles     - Revoke role from user`);
console.log(`   GET    /api/policies        - Get all policies`);
console.log(`   GET    /api/audit           - Get audit logs (?userId=user1&decision=deny)`);
console.log(`   POST   /api/reviews         - Schedule access review`);
console.log(`   GET    /api/reviews         - Get access reviews (?status=pending)`);
