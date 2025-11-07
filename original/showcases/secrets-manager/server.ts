/**
 * Secrets Manager - Secure Secrets Management Service
 *
 * A production-ready secrets management service with encryption at rest,
 * key rotation, access policies, audit logging, and version control.
 */

import { IncomingMessage, ServerResponse, createServer } from "http";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// ============================================================================
// Type Definitions
// ============================================================================

interface Secret {
  id: string;
  name: string;
  path: string;
  description?: string;
  encryptedValue: string;
  iv: string;
  keyVersion: number;
  version: number;
  metadata: Record<string, string>;
  tags: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  rotationPolicy?: RotationPolicy;
}

interface SecretVersion {
  version: number;
  encryptedValue: string;
  iv: string;
  keyVersion: number;
  createdAt: string;
  createdBy: string;
  deprecated: boolean;
}

interface RotationPolicy {
  enabled: boolean;
  intervalDays: number;
  lastRotation: string;
  nextRotation: string;
}

interface EncryptionKey {
  id: string;
  version: number;
  key: Buffer;
  algorithm: string;
  createdAt: string;
  deprecatedAt?: string;
  status: "active" | "deprecated" | "destroyed";
}

interface AccessPolicy {
  id: string;
  principal: string;
  resource: string;
  actions: Action[];
  effect: "allow" | "deny";
  conditions?: Record<string, any>;
  createdAt: string;
}

type Action = "read" | "write" | "delete" | "list" | "rotate";

interface AuditLog {
  id: string;
  timestamp: string;
  principal: string;
  action: string;
  resource: string;
  result: "success" | "denied" | "error";
  metadata: Record<string, any>;
  ip?: string;
}

// ============================================================================
// Encryption Service
// ============================================================================

class EncryptionService {
  private keys = new Map<number, EncryptionKey>();
  private currentKeyVersion = 1;
  private readonly algorithm = "aes-256-gcm";

  constructor() {
    this.generateKey();
  }

  generateKey(): EncryptionKey {
    const key: EncryptionKey = {
      id: `key-${this.currentKeyVersion}`,
      version: this.currentKeyVersion,
      key: randomBytes(32),
      algorithm: this.algorithm,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    // Deprecate old keys
    for (const oldKey of this.keys.values()) {
      if (oldKey.status === "active") {
        oldKey.status = "deprecated";
        oldKey.deprecatedAt = new Date().toISOString();
      }
    }

    this.keys.set(key.version, key);
    this.currentKeyVersion++;

    console.log(`[ENCRYPTION] Generated new key version ${key.version}`);
    return key;
  }

  encrypt(plaintext: string): { encrypted: string; iv: string; keyVersion: number } {
    const key = this.keys.get(this.currentKeyVersion - 1);
    if (!key || key.status !== "active") {
      throw new Error("No active encryption key available");
    }

    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key.key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      keyVersion: key.version,
    };
  }

  decrypt(encrypted: string, iv: string, keyVersion: number): string {
    const key = this.keys.get(keyVersion);
    if (!key) {
      throw new Error(`Encryption key version ${keyVersion} not found`);
    }

    if (key.status === "destroyed") {
      throw new Error(`Key version ${keyVersion} has been destroyed`);
    }

    const decipher = createDecipheriv(this.algorithm, key.key, Buffer.from(iv, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  rotateKeys(): void {
    console.log(`[ENCRYPTION] Starting key rotation`);
    this.generateKey();
  }

  getKeyInfo(): { version: number; status: string; createdAt: string }[] {
    return Array.from(this.keys.values()).map((k) => ({
      version: k.version,
      status: k.status,
      createdAt: k.createdAt,
    }));
  }
}

// ============================================================================
// Version Control
// ============================================================================

class VersionControl {
  private versions = new Map<string, SecretVersion[]>();
  private readonly maxVersions = 10;

  addVersion(secretId: string, version: SecretVersion): void {
    const history = this.versions.get(secretId) || [];
    history.push(version);

    // Keep only last N versions
    if (history.length > this.maxVersions) {
      const removed = history.shift();
      console.log(`[VERSION] Removed old version ${removed?.version} of secret ${secretId}`);
    }

    this.versions.set(secretId, history);
    console.log(`[VERSION] Added version ${version.version} for secret ${secretId}`);
  }

  getVersion(secretId: string, version: number): SecretVersion | undefined {
    const history = this.versions.get(secretId) || [];
    return history.find((v) => v.version === version);
  }

  listVersions(secretId: string): SecretVersion[] {
    return this.versions.get(secretId) || [];
  }

  deprecateVersion(secretId: string, version: number): boolean {
    const history = this.versions.get(secretId) || [];
    const v = history.find((v) => v.version === version);
    if (v) {
      v.deprecated = true;
      console.log(`[VERSION] Deprecated version ${version} of secret ${secretId}`);
      return true;
    }
    return false;
  }
}

// ============================================================================
// Access Control
// ============================================================================

class AccessControl {
  private policies = new Map<string, AccessPolicy>();
  private policyIdCounter = 1;

  addPolicy(policy: Omit<AccessPolicy, "id" | "createdAt">): AccessPolicy {
    const fullPolicy: AccessPolicy = {
      ...policy,
      id: `policy-${this.policyIdCounter++}`,
      createdAt: new Date().toISOString(),
    };

    this.policies.set(fullPolicy.id, fullPolicy);
    console.log(`[ACCESS] Added policy ${fullPolicy.id} for ${fullPolicy.principal}`);
    return fullPolicy;
  }

  checkAccess(principal: string, resource: string, action: Action): boolean {
    const matchingPolicies = Array.from(this.policies.values()).filter((p) => {
      const principalMatch = p.principal === principal || p.principal === "*";
      const resourceMatch = this.matchResource(p.resource, resource);
      return principalMatch && resourceMatch;
    });

    // Explicit deny takes precedence
    const denied = matchingPolicies.some(
      (p) => p.effect === "deny" && p.actions.includes(action)
    );

    if (denied) {
      console.log(`[ACCESS] Denied ${principal} ${action} on ${resource}`);
      return false;
    }

    // Check for allow
    const allowed = matchingPolicies.some(
      (p) => p.effect === "allow" && p.actions.includes(action)
    );

    console.log(`[ACCESS] ${allowed ? "Allowed" : "Denied"} ${principal} ${action} on ${resource}`);
    return allowed;
  }

  private matchResource(pattern: string, resource: string): boolean {
    if (pattern === "*") return true;
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      return resource.startsWith(prefix);
    }
    return pattern === resource;
  }

  listPolicies(principal?: string): AccessPolicy[] {
    const policies = Array.from(this.policies.values());
    if (principal) {
      return policies.filter((p) => p.principal === principal);
    }
    return policies;
  }

  deletePolicy(policyId: string): boolean {
    const deleted = this.policies.delete(policyId);
    if (deleted) {
      console.log(`[ACCESS] Deleted policy ${policyId}`);
    }
    return deleted;
  }
}

// ============================================================================
// Audit Logger
// ============================================================================

class AuditLogger {
  private logs: AuditLog[] = [];
  private readonly maxLogs = 10000;
  private logIdCounter = 1;

  log(
    principal: string,
    action: string,
    resource: string,
    result: AuditLog["result"],
    metadata: Record<string, any> = {},
    ip?: string
  ): void {
    const log: AuditLog = {
      id: `log-${this.logIdCounter++}`,
      timestamp: new Date().toISOString(),
      principal,
      action,
      resource,
      result,
      metadata,
      ip,
    };

    this.logs.push(log);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.log(`[AUDIT] ${result.toUpperCase()} ${principal} ${action} ${resource}`);
  }

  query(filters: {
    principal?: string;
    action?: string;
    resource?: string;
    result?: AuditLog["result"];
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): AuditLog[] {
    let filtered = this.logs;

    if (filters.principal) {
      filtered = filtered.filter((l) => l.principal === filters.principal);
    }
    if (filters.action) {
      filtered = filtered.filter((l) => l.action === filters.action);
    }
    if (filters.resource) {
      filtered = filtered.filter((l) => l.resource === filters.resource);
    }
    if (filters.result) {
      filtered = filtered.filter((l) => l.result === filters.result);
    }
    if (filters.startTime) {
      filtered = filtered.filter((l) => l.timestamp >= filters.startTime!);
    }
    if (filters.endTime) {
      filtered = filtered.filter((l) => l.timestamp <= filters.endTime!);
    }

    const limit = filters.limit || 100;
    return filtered.slice(-limit);
  }
}

// ============================================================================
// Secret Storage
// ============================================================================

class SecretStorage {
  private secrets = new Map<string, Secret>();
  private pathIndex = new Map<string, string>(); // path -> secret id

  store(secret: Secret): void {
    this.secrets.set(secret.id, secret);
    this.pathIndex.set(secret.path, secret.id);
    console.log(`[STORAGE] Stored secret ${secret.path}`);
  }

  get(id: string): Secret | undefined {
    return this.secrets.get(id);
  }

  getByPath(path: string): Secret | undefined {
    const id = this.pathIndex.get(path);
    return id ? this.secrets.get(id) : undefined;
  }

  delete(id: string): boolean {
    const secret = this.secrets.get(id);
    if (!secret) return false;

    this.secrets.delete(id);
    this.pathIndex.delete(secret.path);
    console.log(`[STORAGE] Deleted secret ${secret.path}`);
    return true;
  }

  list(prefix?: string): Secret[] {
    let secrets = Array.from(this.secrets.values());
    if (prefix) {
      secrets = secrets.filter((s) => s.path.startsWith(prefix));
    }
    return secrets;
  }
}

// ============================================================================
// Rotation Manager
// ============================================================================

class RotationManager {
  private storage: SecretStorage;
  private versionControl: VersionControl;
  private encryptionService: EncryptionService;

  constructor(
    storage: SecretStorage,
    versionControl: VersionControl,
    encryptionService: EncryptionService
  ) {
    this.storage = storage;
    this.versionControl = versionControl;
    this.encryptionService = encryptionService;
    this.startRotationScheduler();
  }

  private startRotationScheduler(): void {
    setInterval(() => {
      this.checkRotations();
    }, 60000); // Check every minute
  }

  private checkRotations(): void {
    const now = new Date();
    const secrets = this.storage.list();

    for (const secret of secrets) {
      if (
        secret.rotationPolicy?.enabled &&
        new Date(secret.rotationPolicy.nextRotation) <= now
      ) {
        console.log(`[ROTATION] Auto-rotating secret ${secret.path}`);
        this.rotateSecret(secret.id, "system");
      }
    }
  }

  rotateSecret(secretId: string, principal: string): boolean {
    const secret = this.storage.get(secretId);
    if (!secret) return false;

    // Re-encrypt with latest key
    const decrypted = this.encryptionService.decrypt(
      secret.encryptedValue,
      secret.iv,
      secret.keyVersion
    );

    const { encrypted, iv, keyVersion } = this.encryptionService.encrypt(decrypted);

    // Save current version to history
    this.versionControl.addVersion(secretId, {
      version: secret.version,
      encryptedValue: secret.encryptedValue,
      iv: secret.iv,
      keyVersion: secret.keyVersion,
      createdAt: secret.updatedAt,
      createdBy: secret.updatedBy,
      deprecated: false,
    });

    // Update secret
    secret.encryptedValue = encrypted;
    secret.iv = iv;
    secret.keyVersion = keyVersion;
    secret.version++;
    secret.updatedAt = new Date().toISOString();
    secret.updatedBy = principal;

    if (secret.rotationPolicy) {
      secret.rotationPolicy.lastRotation = new Date().toISOString();
      const next = new Date();
      next.setDate(next.getDate() + secret.rotationPolicy.intervalDays);
      secret.rotationPolicy.nextRotation = next.toISOString();
    }

    this.storage.store(secret);
    console.log(`[ROTATION] Rotated secret ${secret.path} to version ${secret.version}`);
    return true;
  }
}

// ============================================================================
// Secrets Manager
// ============================================================================

class SecretsManager {
  private storage: SecretStorage;
  private versionControl: VersionControl;
  private encryptionService: EncryptionService;
  private accessControl: AccessControl;
  private auditLogger: AuditLogger;
  private rotationManager: RotationManager;
  private secretIdCounter = 1;

  constructor() {
    this.storage = new SecretStorage();
    this.versionControl = new VersionControl();
    this.encryptionService = new EncryptionService();
    this.accessControl = new AccessControl();
    this.auditLogger = new AuditLogger();
    this.rotationManager = new RotationManager(
      this.storage,
      this.versionControl,
      this.encryptionService
    );

    // Add default policy
    this.accessControl.addPolicy({
      principal: "*",
      resource: "*",
      actions: ["read", "write", "delete", "list", "rotate"],
      effect: "allow",
    });
  }

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const path = url.pathname;
    const principal = req.headers["x-principal"] as string || "anonymous";
    const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress;

    if (path === "/" && req.method === "GET") {
      this.handleRoot(res);
    } else if (path === "/health" && req.method === "GET") {
      this.handleHealth(res);
    } else if (path === "/secrets" && req.method === "POST") {
      this.handleCreateSecret(req, principal, ip!, res);
    } else if (path === "/secrets" && req.method === "GET") {
      this.handleListSecrets(principal, url.searchParams.get("prefix") || undefined, ip!, res);
    } else if (path.match(/^\/secrets\/[^\/]+$/) && req.method === "GET") {
      const id = path.split("/")[2];
      this.handleGetSecret(id, principal, ip!, res);
    } else if (path.match(/^\/secrets\/[^\/]+$/) && req.method === "PUT") {
      const id = path.split("/")[2];
      this.handleUpdateSecret(req, id, principal, ip!, res);
    } else if (path.match(/^\/secrets\/[^\/]+$/) && req.method === "DELETE") {
      const id = path.split("/")[2];
      this.handleDeleteSecret(id, principal, ip!, res);
    } else if (path.match(/^\/secrets\/[^\/]+\/versions$/) && req.method === "GET") {
      const id = path.split("/")[2];
      this.handleListVersions(id, principal, ip!, res);
    } else if (path.match(/^\/secrets\/[^\/]+\/versions\/\d+$/) && req.method === "GET") {
      const match = path.match(/^\/secrets\/([^\/]+)\/versions\/(\d+)$/);
      this.handleGetVersion(match![1], Number(match![2]), principal, ip!, res);
    } else if (path.match(/^\/secrets\/[^\/]+\/rotate$/) && req.method === "POST") {
      const id = path.split("/")[2];
      this.handleRotateSecret(id, principal, ip!, res);
    } else if (path === "/policies" && req.method === "POST") {
      this.handleCreatePolicy(req, res);
    } else if (path === "/policies" && req.method === "GET") {
      this.handleListPolicies(url.searchParams.get("principal") || undefined, res);
    } else if (path === "/audit" && req.method === "GET") {
      this.handleQueryAudit(url.searchParams, res);
    } else if (path === "/keys/rotate" && req.method === "POST") {
      this.handleRotateKeys(res);
    } else if (path === "/keys" && req.method === "GET") {
      this.handleListKeys(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  private handleRoot(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Secrets Manager",
      version: "1.0.0",
      features: ["encryption", "versioning", "rotation", "access-control", "audit-logging"],
      endpoints: {
        secrets: "/secrets",
        versions: "/secrets/{id}/versions",
        rotate: "/secrets/{id}/rotate",
        policies: "/policies",
        audit: "/audit",
        keys: "/keys",
      },
    }));
  }

  private handleHealth(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy" }));
  }

  private handleCreateSecret(req: IncomingMessage, principal: string, ip: string, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!this.accessControl.checkAccess(principal, data.path, "write")) {
          this.auditLogger.log(principal, "create_secret", data.path, "denied", {}, ip);
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Access denied" }));
          return;
        }

        const { encrypted, iv, keyVersion } = this.encryptionService.encrypt(data.value);

        const secret: Secret = {
          id: `secret-${this.secretIdCounter++}`,
          name: data.name,
          path: data.path,
          description: data.description,
          encryptedValue: encrypted,
          iv,
          keyVersion,
          version: 1,
          metadata: data.metadata || {},
          tags: data.tags || [],
          createdAt: new Date().toISOString(),
          createdBy: principal,
          updatedAt: new Date().toISOString(),
          updatedBy: principal,
          rotationPolicy: data.rotationPolicy,
        };

        this.storage.store(secret);
        this.auditLogger.log(principal, "create_secret", secret.path, "success", { id: secret.id }, ip);

        const response = { ...secret, encryptedValue: "[REDACTED]" };
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        this.auditLogger.log(principal, "create_secret", "unknown", "error", { error: String(error) }, ip);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  }

  private handleGetSecret(id: string, principal: string, ip: string, res: ServerResponse): void {
    const secret = this.storage.get(id);
    if (!secret) {
      this.auditLogger.log(principal, "read_secret", id, "error", { reason: "not_found" }, ip);
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Secret not found" }));
      return;
    }

    if (!this.accessControl.checkAccess(principal, secret.path, "read")) {
      this.auditLogger.log(principal, "read_secret", secret.path, "denied", {}, ip);
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    const decrypted = this.encryptionService.decrypt(secret.encryptedValue, secret.iv, secret.keyVersion);
    this.auditLogger.log(principal, "read_secret", secret.path, "success", { version: secret.version }, ip);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...secret, value: decrypted, encryptedValue: "[REDACTED]" }, null, 2));
  }

  private handleUpdateSecret(req: IncomingMessage, id: string, principal: string, ip: string, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const secret = this.storage.get(id);
        if (!secret) {
          this.auditLogger.log(principal, "update_secret", id, "error", { reason: "not_found" }, ip);
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Secret not found" }));
          return;
        }

        if (!this.accessControl.checkAccess(principal, secret.path, "write")) {
          this.auditLogger.log(principal, "update_secret", secret.path, "denied", {}, ip);
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Access denied" }));
          return;
        }

        const data = JSON.parse(body);

        // Save current version
        this.versionControl.addVersion(id, {
          version: secret.version,
          encryptedValue: secret.encryptedValue,
          iv: secret.iv,
          keyVersion: secret.keyVersion,
          createdAt: secret.updatedAt,
          createdBy: secret.updatedBy,
          deprecated: false,
        });

        // Encrypt new value
        const { encrypted, iv, keyVersion } = this.encryptionService.encrypt(data.value);

        secret.encryptedValue = encrypted;
        secret.iv = iv;
        secret.keyVersion = keyVersion;
        secret.version++;
        secret.updatedAt = new Date().toISOString();
        secret.updatedBy = principal;

        if (data.metadata) secret.metadata = data.metadata;
        if (data.tags) secret.tags = data.tags;

        this.storage.store(secret);
        this.auditLogger.log(principal, "update_secret", secret.path, "success", { version: secret.version }, ip);

        const response = { ...secret, encryptedValue: "[REDACTED]" };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        this.auditLogger.log(principal, "update_secret", id, "error", { error: String(error) }, ip);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  }

  private handleDeleteSecret(id: string, principal: string, ip: string, res: ServerResponse): void {
    const secret = this.storage.get(id);
    if (!secret) {
      this.auditLogger.log(principal, "delete_secret", id, "error", { reason: "not_found" }, ip);
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Secret not found" }));
      return;
    }

    if (!this.accessControl.checkAccess(principal, secret.path, "delete")) {
      this.auditLogger.log(principal, "delete_secret", secret.path, "denied", {}, ip);
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    this.storage.delete(id);
    this.auditLogger.log(principal, "delete_secret", secret.path, "success", {}, ip);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "deleted" }));
  }

  private handleListSecrets(principal: string, prefix: string | undefined, ip: string, res: ServerResponse): void {
    if (!this.accessControl.checkAccess(principal, prefix || "*", "list")) {
      this.auditLogger.log(principal, "list_secrets", prefix || "*", "denied", {}, ip);
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    const secrets = this.storage.list(prefix).map((s) => ({
      id: s.id,
      name: s.name,
      path: s.path,
      version: s.version,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    this.auditLogger.log(principal, "list_secrets", prefix || "*", "success", { count: secrets.length }, ip);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ secrets }, null, 2));
  }

  private handleListVersions(id: string, principal: string, ip: string, res: ServerResponse): void {
    const secret = this.storage.get(id);
    if (!secret) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Secret not found" }));
      return;
    }

    const versions = this.versionControl.listVersions(id);
    this.auditLogger.log(principal, "list_versions", secret.path, "success", { count: versions.length }, ip);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ versions }, null, 2));
  }

  private handleGetVersion(id: string, versionNum: number, principal: string, ip: string, res: ServerResponse): void {
    const secret = this.storage.get(id);
    if (!secret) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Secret not found" }));
      return;
    }

    if (!this.accessControl.checkAccess(principal, secret.path, "read")) {
      this.auditLogger.log(principal, "read_version", secret.path, "denied", {}, ip);
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    const version = this.versionControl.getVersion(id, versionNum);
    if (!version) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Version not found" }));
      return;
    }

    const decrypted = this.encryptionService.decrypt(version.encryptedValue, version.iv, version.keyVersion);
    this.auditLogger.log(principal, "read_version", secret.path, "success", { version: versionNum }, ip);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...version, value: decrypted }, null, 2));
  }

  private handleRotateSecret(id: string, principal: string, ip: string, res: ServerResponse): void {
    const secret = this.storage.get(id);
    if (!secret) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Secret not found" }));
      return;
    }

    if (!this.accessControl.checkAccess(principal, secret.path, "rotate")) {
      this.auditLogger.log(principal, "rotate_secret", secret.path, "denied", {}, ip);
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Access denied" }));
      return;
    }

    this.rotationManager.rotateSecret(id, principal);
    this.auditLogger.log(principal, "rotate_secret", secret.path, "success", {}, ip);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "rotated" }));
  }

  private handleCreatePolicy(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const policy = this.accessControl.addPolicy(data);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(policy, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  }

  private handleListPolicies(principal: string | undefined, res: ServerResponse): void {
    const policies = this.accessControl.listPolicies(principal);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ policies }, null, 2));
  }

  private handleQueryAudit(params: URLSearchParams, res: ServerResponse): void {
    const filters = {
      principal: params.get("principal") || undefined,
      action: params.get("action") || undefined,
      resource: params.get("resource") || undefined,
      result: params.get("result") as AuditLog["result"] || undefined,
      startTime: params.get("startTime") || undefined,
      endTime: params.get("endTime") || undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    };

    const logs = this.auditLogger.query(filters);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ logs, count: logs.length }, null, 2));
  }

  private handleRotateKeys(res: ServerResponse): void {
    this.encryptionService.rotateKeys();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "rotated" }));
  }

  private handleListKeys(res: ServerResponse): void {
    const keys = this.encryptionService.getKeyInfo();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ keys }, null, 2));
  }
}

// ============================================================================
// Server
// ============================================================================

const manager = new SecretsManager();
const server = createServer((req, res) => manager.handleRequest(req, res));

const PORT = Number(process.env.PORT) || 3003;
server.listen(PORT, () => {
  console.log(`Secrets Manager listening on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/secrets`);
});
