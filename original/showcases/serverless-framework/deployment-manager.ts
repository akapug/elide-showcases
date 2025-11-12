/**
 * Deployment Manager
 *
 * Manages serverless function deployments, versioning, and rollbacks.
 * Handles function marketplace and templates.
 */

import { FunctionDefinition } from "./function-runtime.ts";

// =============================================================================
// Type Definitions
// =============================================================================

export interface DeploymentRequest {
  name: string;
  runtime: "typescript" | "python" | "ruby";
  handler: string;
  code: string;
  environment?: Record<string, string>;
  secrets?: string[];
  memory?: number;
  timeout?: number;
  triggers?: FunctionTrigger[];
  customDomain?: string;
  rateLimit?: RateLimitConfig;
}

export interface FunctionTrigger {
  type: "http" | "websocket" | "cron" | "event";
  config: any;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface ServerlessFunction extends FunctionDefinition {
  version: number;
  tags?: string[];
  customDomain?: string;
  rateLimit?: RateLimitConfig;
  triggers: FunctionTrigger[];
  deployedAt?: string;
  lastInvoked?: string;
  stats?: {
    invocations: number;
    errors: number;
    avgDuration: number;
    totalCost: number;
  };
}

export interface FunctionVersion {
  version: number;
  functionId: string;
  code: string;
  environment: Record<string, string>;
  deployedAt: string;
  deployedBy?: string;
}

export interface MarketplaceFunction {
  id: string;
  name: string;
  description: string;
  runtime: "typescript" | "python" | "ruby";
  category: string;
  author: string;
  downloads: number;
  rating: number;
  code: string;
  tags: string[];
  readme: string;
}

// =============================================================================
// Deployment Manager
// =============================================================================

export class DeploymentManager {
  private functions = new Map<string, ServerlessFunction>();
  private versions = new Map<string, FunctionVersion[]>();
  private marketplace = new Map<string, MarketplaceFunction>();
  private functionCounter = 0;

  constructor() {
    console.log("[DEPLOYMENT] Initializing Deployment Manager...");
    this.initializeMarketplace();
  }

  // ==========================================================================
  // Function Deployment
  // ==========================================================================

  async deployFunction(request: DeploymentRequest): Promise<ServerlessFunction> {
    console.log(`[DEPLOYMENT] Deploying function: ${request.name}`);

    // Validate request
    this.validateDeploymentRequest(request);

    // Create function definition
    const functionId = `fn-${Date.now()}-${this.functionCounter++}`;
    const func: ServerlessFunction = {
      id: functionId,
      name: request.name,
      runtime: request.runtime,
      handler: request.handler || "handler",
      code: request.code,
      environment: request.environment || {},
      secrets: request.secrets || [],
      memory: request.memory || 256,
      timeout: request.timeout || 30000,
      triggers: request.triggers || [],
      customDomain: request.customDomain,
      rateLimit: request.rateLimit,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deployedAt: new Date().toISOString(),
      stats: {
        invocations: 0,
        errors: 0,
        avgDuration: 0,
        totalCost: 0,
      },
    };

    // Store function
    this.functions.set(functionId, func);

    // Create initial version
    this.createVersion(func);

    console.log(`[DEPLOYMENT] Function deployed: ${func.name} (${functionId})`);

    return func;
  }

  async updateFunction(
    functionId: string,
    updates: Partial<DeploymentRequest>
  ): Promise<ServerlessFunction> {
    const func = this.functions.get(functionId);

    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    console.log(`[DEPLOYMENT] Updating function: ${func.name}`);

    // Update function
    const updated: ServerlessFunction = {
      ...func,
      ...updates,
      id: func.id,
      version: func.version + 1,
      updatedAt: new Date().toISOString(),
      deployedAt: new Date().toISOString(),
    };

    this.functions.set(functionId, updated);

    // Create new version
    this.createVersion(updated);

    console.log(`[DEPLOYMENT] Function updated: ${updated.name} (v${updated.version})`);

    return updated;
  }

  deleteFunction(functionId: string): boolean {
    const func = this.functions.get(functionId);

    if (!func) {
      return false;
    }

    console.log(`[DEPLOYMENT] Deleting function: ${func.name} (${functionId})`);

    this.functions.delete(functionId);
    this.versions.delete(functionId);

    return true;
  }

  // ==========================================================================
  // Function Queries
  // ==========================================================================

  getFunction(functionId: string): ServerlessFunction | undefined {
    return this.functions.get(functionId);
  }

  listFunctions(): ServerlessFunction[] {
    return Array.from(this.functions.values());
  }

  findFunctionsByTag(tag: string): ServerlessFunction[] {
    return this.listFunctions().filter((func) => func.tags?.includes(tag));
  }

  findFunctionsByRuntime(runtime: "typescript" | "python" | "ruby"): ServerlessFunction[] {
    return this.listFunctions().filter((func) => func.runtime === runtime);
  }

  // ==========================================================================
  // Versioning
  // ==========================================================================

  private createVersion(func: ServerlessFunction): void {
    const version: FunctionVersion = {
      version: func.version,
      functionId: func.id,
      code: func.code,
      environment: func.environment || {},
      deployedAt: func.deployedAt || new Date().toISOString(),
    };

    const versions = this.versions.get(func.id) || [];
    versions.push(version);
    this.versions.set(func.id, versions);

    console.log(`[DEPLOYMENT] Created version ${version.version} for ${func.id}`);
  }

  getVersions(functionId: string): FunctionVersion[] {
    return this.versions.get(functionId) || [];
  }

  getVersion(functionId: string, version: number): FunctionVersion | undefined {
    const versions = this.versions.get(functionId) || [];
    return versions.find((v) => v.version === version);
  }

  async rollbackToVersion(functionId: string, version: number): Promise<ServerlessFunction> {
    const func = this.functions.get(functionId);
    const targetVersion = this.getVersion(functionId, version);

    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    if (!targetVersion) {
      throw new Error(`Version ${version} not found for function ${functionId}`);
    }

    console.log(`[DEPLOYMENT] Rolling back ${func.name} to version ${version}`);

    // Restore function to target version
    const rolledBack: ServerlessFunction = {
      ...func,
      code: targetVersion.code,
      environment: targetVersion.environment,
      version: func.version + 1, // New version for the rollback
      updatedAt: new Date().toISOString(),
      deployedAt: new Date().toISOString(),
    };

    this.functions.set(functionId, rolledBack);
    this.createVersion(rolledBack);

    console.log(`[DEPLOYMENT] Rollback complete: ${rolledBack.name} (v${rolledBack.version})`);

    return rolledBack;
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  private validateDeploymentRequest(request: DeploymentRequest): void {
    if (!request.name || request.name.trim() === "") {
      throw new Error("Function name is required");
    }

    if (!request.runtime) {
      throw new Error("Runtime is required");
    }

    if (!["typescript", "python", "ruby"].includes(request.runtime)) {
      throw new Error(`Unsupported runtime: ${request.runtime}`);
    }

    if (!request.code || request.code.trim() === "") {
      throw new Error("Function code is required");
    }

    if (request.memory && (request.memory < 128 || request.memory > 10240)) {
      throw new Error("Memory must be between 128 MB and 10240 MB");
    }

    if (request.timeout && (request.timeout < 1000 || request.timeout > 900000)) {
      throw new Error("Timeout must be between 1 second and 15 minutes");
    }
  }

  // ==========================================================================
  // Marketplace
  // ==========================================================================

  private initializeMarketplace(): void {
    // Add some example marketplace functions
    this.addMarketplaceFunction({
      id: "mp-hello-world",
      name: "Hello World",
      description: "Simple hello world function",
      runtime: "typescript",
      category: "examples",
      author: "Serverless Team",
      downloads: 1000,
      rating: 4.8,
      code: `export const handler = async (event: any) => {
  return {
    statusCode: 200,
    body: { message: "Hello, World!", event }
  };
};`,
      tags: ["example", "starter", "hello-world"],
      readme: "# Hello World\n\nA simple hello world function to get you started.",
    });

    this.addMarketplaceFunction({
      id: "mp-api-proxy",
      name: "API Proxy",
      description: "Proxy requests to external APIs",
      runtime: "typescript",
      category: "utilities",
      author: "Serverless Team",
      downloads: 500,
      rating: 4.5,
      code: `export const handler = async (event: any) => {
  const { url, method = 'GET', headers = {}, body } = event;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return {
    statusCode: response.status,
    body: await response.json()
  };
};`,
      tags: ["proxy", "api", "utility"],
      readme: "# API Proxy\n\nProxy requests to external APIs with custom headers and methods.",
    });

    this.addMarketplaceFunction({
      id: "mp-image-resize",
      name: "Image Resizer",
      description: "Resize images on-the-fly",
      runtime: "typescript",
      category: "media",
      author: "Media Tools",
      downloads: 750,
      rating: 4.7,
      code: `export const handler = async (event: any) => {
  const { imageUrl, width, height } = event;

  // Simulate image processing
  return {
    statusCode: 200,
    body: {
      message: "Image resized successfully",
      url: imageUrl,
      dimensions: { width, height }
    }
  };
};`,
      tags: ["image", "resize", "media"],
      readme: "# Image Resizer\n\nResize images on-the-fly with caching support.",
    });

    this.addMarketplaceFunction({
      id: "mp-email-sender",
      name: "Email Sender",
      description: "Send transactional emails",
      runtime: "typescript",
      category: "communication",
      author: "Email Tools",
      downloads: 850,
      rating: 4.6,
      code: `export const handler = async (event: any) => {
  const { to, subject, body, from } = event;

  console.log(\`Sending email to \${to}: \${subject}\`);

  return {
    statusCode: 200,
    body: {
      message: "Email sent successfully",
      messageId: \`msg-\${Date.now()}\`
    }
  };
};`,
      tags: ["email", "transactional", "communication"],
      readme: "# Email Sender\n\nSend transactional emails with template support.",
    });

    this.addMarketplaceFunction({
      id: "mp-webhook-handler",
      name: "Webhook Handler",
      description: "Handle incoming webhooks with validation",
      runtime: "typescript",
      category: "webhooks",
      author: "Integration Team",
      downloads: 600,
      rating: 4.9,
      code: `export const handler = async (event: any) => {
  const { headers, body, signature } = event;

  // Validate webhook signature
  const isValid = true; // Implement validation logic

  if (!isValid) {
    return {
      statusCode: 401,
      body: { error: "Invalid signature" }
    };
  }

  // Process webhook
  console.log("Processing webhook:", body);

  return {
    statusCode: 200,
    body: { message: "Webhook processed successfully" }
  };
};`,
      tags: ["webhook", "integration", "validation"],
      readme: "# Webhook Handler\n\nHandle and validate incoming webhooks from various services.",
    });

    this.addMarketplaceFunction({
      id: "mp-data-transformer",
      name: "Data Transformer",
      description: "Transform data between formats (JSON, CSV, XML)",
      runtime: "typescript",
      category: "data",
      author: "Data Tools",
      downloads: 450,
      rating: 4.4,
      code: `export const handler = async (event: any) => {
  const { data, from, to } = event;

  // Simulate data transformation
  return {
    statusCode: 200,
    body: {
      message: "Data transformed successfully",
      from,
      to,
      result: data
    }
  };
};`,
      tags: ["data", "transform", "json", "csv"],
      readme: "# Data Transformer\n\nTransform data between JSON, CSV, and XML formats.",
    });

    console.log(`[DEPLOYMENT] Initialized marketplace with ${this.marketplace.size} functions`);
  }

  private addMarketplaceFunction(func: MarketplaceFunction): void {
    this.marketplace.set(func.id, func);
  }

  getMarketplaceFunctions(): MarketplaceFunction[] {
    return Array.from(this.marketplace.values());
  }

  getMarketplaceFunction(id: string): MarketplaceFunction | undefined {
    return this.marketplace.get(id);
  }

  searchMarketplace(query: string): MarketplaceFunction[] {
    const lowerQuery = query.toLowerCase();
    return this.getMarketplaceFunctions().filter(
      (func) =>
        func.name.toLowerCase().includes(lowerQuery) ||
        func.description.toLowerCase().includes(lowerQuery) ||
        func.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async deployFromMarketplace(marketplaceId: string, name: string): Promise<ServerlessFunction> {
    const template = this.marketplace.get(marketplaceId);

    if (!template) {
      throw new Error(`Marketplace function not found: ${marketplaceId}`);
    }

    console.log(`[DEPLOYMENT] Deploying from marketplace: ${template.name}`);

    return await this.deployFunction({
      name,
      runtime: template.runtime,
      handler: "handler",
      code: template.code,
      triggers: [{ type: "http", config: { methods: ["GET", "POST"], path: "/" } }],
    });
  }

  // ==========================================================================
  // Environment & Secrets
  // ==========================================================================

  async updateEnvironment(
    functionId: string,
    environment: Record<string, string>
  ): Promise<ServerlessFunction> {
    const func = this.functions.get(functionId);

    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    func.environment = { ...func.environment, ...environment };
    func.updatedAt = new Date().toISOString();

    console.log(`[DEPLOYMENT] Updated environment for ${func.name}`);

    return func;
  }

  async updateSecrets(functionId: string, secrets: string[]): Promise<ServerlessFunction> {
    const func = this.functions.get(functionId);

    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    func.secrets = secrets;
    func.updatedAt = new Date().toISOString();

    console.log(`[DEPLOYMENT] Updated secrets for ${func.name}`);

    return func;
  }

  // ==========================================================================
  // Stats
  // ==========================================================================

  updateStats(functionId: string, stats: Partial<ServerlessFunction["stats"]>): void {
    const func = this.functions.get(functionId);

    if (!func || !func.stats) {
      return;
    }

    func.stats = { ...func.stats, ...stats };
    func.lastInvoked = new Date().toISOString();
  }
}
