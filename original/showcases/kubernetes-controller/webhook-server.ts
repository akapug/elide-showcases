/**
 * Webhook Server - Admission Control
 *
 * Implements Kubernetes admission webhooks for:
 * - Validating admission control
 * - Mutating admission control
 * - Custom validation rules
 * - Resource defaulting
 * - Policy enforcement
 */

import { IncomingMessage, ServerResponse } from "http";

// ============================================================================
// Type Definitions
// ============================================================================

export interface AdmissionReview {
  apiVersion: string;
  kind: string;
  request: AdmissionRequest;
  response?: AdmissionResponse;
}

export interface AdmissionRequest {
  uid: string;
  kind: GroupVersionKind;
  resource: GroupVersionResource;
  subResource?: string;
  requestKind?: GroupVersionKind;
  requestResource?: GroupVersionResource;
  requestSubResource?: string;
  name?: string;
  namespace?: string;
  operation: Operation;
  userInfo: UserInfo;
  object?: any;
  oldObject?: any;
  dryRun?: boolean;
  options?: any;
}

export interface AdmissionResponse {
  uid: string;
  allowed: boolean;
  status?: Status;
  patch?: string;
  patchType?: PatchType;
  auditAnnotations?: Record<string, string>;
  warnings?: string[];
}

export interface GroupVersionKind {
  group: string;
  version: string;
  kind: string;
}

export interface GroupVersionResource {
  group: string;
  version: string;
  resource: string;
}

export type Operation = "CREATE" | "UPDATE" | "DELETE" | "CONNECT";

export interface UserInfo {
  username: string;
  uid: string;
  groups: string[];
  extra?: Record<string, string[]>;
}

export interface Status {
  code: number;
  message: string;
  reason?: string;
  details?: any;
}

export type PatchType = "JSONPatch" | "MergePatch";

export interface JSONPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: any;
  from?: string;
}

// ============================================================================
// Webhook Handlers
// ============================================================================

export interface ValidatingWebhook {
  name: string;
  rules: WebhookRule[];
  validate(request: AdmissionRequest): Promise<ValidationResult>;
}

export interface MutatingWebhook {
  name: string;
  rules: WebhookRule[];
  mutate(request: AdmissionRequest): Promise<MutationResult>;
}

export interface WebhookRule {
  apiGroups: string[];
  apiVersions: string[];
  resources: string[];
  operations: Operation[];
  scope?: "Cluster" | "Namespaced" | "*";
}

export interface ValidationResult {
  allowed: boolean;
  message?: string;
  warnings?: string[];
}

export interface MutationResult {
  allowed: boolean;
  patch?: JSONPatch[];
  warnings?: string[];
}

// ============================================================================
// Webhook Server
// ============================================================================

export class WebhookServer {
  private validatingWebhooks = new Map<string, ValidatingWebhook>();
  private mutatingWebhooks = new Map<string, MutatingWebhook>();

  /**
   * Register a validating webhook
   */
  registerValidatingWebhook(webhook: ValidatingWebhook): void {
    this.validatingWebhooks.set(webhook.name, webhook);
    console.log(`[WEBHOOK] Registered validating webhook: ${webhook.name}`);
  }

  /**
   * Register a mutating webhook
   */
  registerMutatingWebhook(webhook: MutatingWebhook): void {
    this.mutatingWebhooks.set(webhook.name, webhook);
    console.log(`[WEBHOOK] Registered mutating webhook: ${webhook.name}`);
  }

  /**
   * Handle HTTP request
   */
  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/validate" && req.method === "POST") {
      await this.handleValidate(req, res);
    } else if (url.pathname === "/mutate" && req.method === "POST") {
      await this.handleMutate(req, res);
    } else if (url.pathname === "/healthz" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy" }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  /**
   * Handle validation request
   */
  private async handleValidate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const review: AdmissionReview = JSON.parse(body);

      console.log(
        `[WEBHOOK] Validating ${review.request.operation} ` +
        `${review.request.kind.kind} ${review.request.namespace}/${review.request.name}`
      );

      // Find matching webhooks
      const webhooks = this.findMatchingValidatingWebhooks(review.request);

      let allowed = true;
      let message = "";
      const warnings: string[] = [];

      // Execute all matching webhooks
      for (const webhook of webhooks) {
        const result = await webhook.validate(review.request);

        if (!result.allowed) {
          allowed = false;
          message = result.message || "Validation failed";
          break;
        }

        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }

      // Build response
      const response: AdmissionResponse = {
        uid: review.request.uid,
        allowed,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      if (!allowed) {
        response.status = {
          code: 403,
          message,
        };
      }

      review.response = response;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(review));
    } catch (error) {
      console.error("[WEBHOOK] Validation error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(error) }));
    }
  }

  /**
   * Handle mutation request
   */
  private async handleMutate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const review: AdmissionReview = JSON.parse(body);

      console.log(
        `[WEBHOOK] Mutating ${review.request.operation} ` +
        `${review.request.kind.kind} ${review.request.namespace}/${review.request.name}`
      );

      // Find matching webhooks
      const webhooks = this.findMatchingMutatingWebhooks(review.request);

      let allowed = true;
      const patches: JSONPatch[] = [];
      const warnings: string[] = [];

      // Execute all matching webhooks
      for (const webhook of webhooks) {
        const result = await webhook.mutate(review.request);

        if (!result.allowed) {
          allowed = false;
          break;
        }

        if (result.patch) {
          patches.push(...result.patch);
        }

        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }

      // Build response
      const response: AdmissionResponse = {
        uid: review.request.uid,
        allowed,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      if (patches.length > 0) {
        response.patchType = "JSONPatch";
        response.patch = Buffer.from(JSON.stringify(patches)).toString("base64");
      }

      review.response = response;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(review));
    } catch (error) {
      console.error("[WEBHOOK] Mutation error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(error) }));
    }
  }

  /**
   * Find matching validating webhooks
   */
  private findMatchingValidatingWebhooks(request: AdmissionRequest): ValidatingWebhook[] {
    return Array.from(this.validatingWebhooks.values()).filter(webhook =>
      this.matchesRules(webhook.rules, request)
    );
  }

  /**
   * Find matching mutating webhooks
   */
  private findMatchingMutatingWebhooks(request: AdmissionRequest): MutatingWebhook[] {
    return Array.from(this.mutatingWebhooks.values()).filter(webhook =>
      this.matchesRules(webhook.rules, request)
    );
  }

  /**
   * Check if request matches webhook rules
   */
  private matchesRules(rules: WebhookRule[], request: AdmissionRequest): boolean {
    return rules.some(rule => {
      // Check API group
      const groupMatch = rule.apiGroups.includes("*") ||
        rule.apiGroups.includes(request.kind.group);

      // Check API version
      const versionMatch = rule.apiVersions.includes("*") ||
        rule.apiVersions.includes(request.kind.version);

      // Check resource
      const resourceMatch = rule.resources.includes("*") ||
        rule.resources.includes(request.resource.resource);

      // Check operation
      const operationMatch = rule.operations.includes(request.operation);

      // Check scope
      const scopeMatch = !rule.scope ||
        rule.scope === "*" ||
        (rule.scope === "Namespaced" && request.namespace) ||
        (rule.scope === "Cluster" && !request.namespace);

      return groupMatch && versionMatch && resourceMatch && operationMatch && scopeMatch;
    });
  }

  /**
   * Read request body
   */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }
}

// ============================================================================
// Example Webhooks
// ============================================================================

/**
 * Application Validating Webhook
 */
export class ApplicationValidatingWebhook implements ValidatingWebhook {
  name = "application-validator";
  rules: WebhookRule[] = [
    {
      apiGroups: ["cloudnative.elide.dev"],
      apiVersions: ["v1"],
      resources: ["applications"],
      operations: ["CREATE", "UPDATE"],
      scope: "Namespaced",
    },
  ];

  async validate(request: AdmissionRequest): Promise<ValidationResult> {
    const obj = request.object;

    // Validate replicas
    if (obj.spec.replicas < 0) {
      return {
        allowed: false,
        message: "replicas must be >= 0",
      };
    }

    if (obj.spec.replicas > 100) {
      return {
        allowed: false,
        message: "replicas must be <= 100 (use HPA for higher scale)",
      };
    }

    // Validate image
    if (!obj.spec.image || obj.spec.image.trim() === "") {
      return {
        allowed: false,
        message: "image is required",
      };
    }

    // Warn about missing resource limits
    const warnings: string[] = [];
    if (!obj.spec.resources?.limits) {
      warnings.push("Resource limits are recommended for production workloads");
    }

    // Warn about latest tag
    if (obj.spec.image.endsWith(":latest")) {
      warnings.push("Using :latest tag is not recommended for production");
    }

    return {
      allowed: true,
      warnings,
    };
  }
}

/**
 * Application Mutating Webhook
 */
export class ApplicationMutatingWebhook implements MutatingWebhook {
  name = "application-defaulter";
  rules: WebhookRule[] = [
    {
      apiGroups: ["cloudnative.elide.dev"],
      apiVersions: ["v1"],
      resources: ["applications"],
      operations: ["CREATE", "UPDATE"],
      scope: "Namespaced",
    },
  ];

  async mutate(request: AdmissionRequest): Promise<MutationResult> {
    const patches: JSONPatch[] = [];

    // Set default strategy if not specified
    if (!request.object.spec.strategy) {
      patches.push({
        op: "add",
        path: "/spec/strategy",
        value: "RollingUpdate",
      });
    }

    // Add default labels
    if (!request.object.metadata.labels) {
      patches.push({
        op: "add",
        path: "/metadata/labels",
        value: {},
      });
    }

    patches.push({
      op: "add",
      path: "/metadata/labels/app.kubernetes.io~1managed-by",
      value: "elide-operator",
    });

    // Add default annotations
    if (!request.object.metadata.annotations) {
      patches.push({
        op: "add",
        path: "/metadata/annotations",
        value: {},
      });
    }

    patches.push({
      op: "add",
      path: "/metadata/annotations/elide.dev~1webhook-mutated",
      value: "true",
    });

    return {
      allowed: true,
      patch: patches,
    };
  }
}

/**
 * Security Policy Webhook
 */
export class SecurityPolicyWebhook implements ValidatingWebhook {
  name = "security-policy";
  rules: WebhookRule[] = [
    {
      apiGroups: ["cloudnative.elide.dev"],
      apiVersions: ["v1"],
      resources: ["applications"],
      operations: ["CREATE", "UPDATE"],
      scope: "Namespaced",
    },
  ];

  private blockedImages = ["ubuntu", "debian", "alpine"];

  async validate(request: AdmissionRequest): Promise<ValidationResult> {
    const obj = request.object;
    const image = obj.spec.image.toLowerCase();

    // Check for blocked base images
    for (const blocked of this.blockedImages) {
      if (image.startsWith(blocked + ":") || image === blocked) {
        return {
          allowed: false,
          message: `Base image '${blocked}' is not allowed. Use distroless or specific application images.`,
        };
      }
    }

    // Require specific registry
    if (!image.startsWith("gcr.io/") && !image.startsWith("docker.io/")) {
      return {
        allowed: false,
        message: "Images must be from gcr.io or docker.io registries",
      };
    }

    return { allowed: true };
  }
}
