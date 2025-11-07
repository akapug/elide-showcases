/**
 * Encryption Service
 *
 * Enterprise encryption-as-a-service with key management (KMS),
 * data encryption/decryption, automated key rotation, HSM integration,
 * and comprehensive audit trails.
 */

import { serve } from "bun";
import { randomUUID, randomBytes, createCipheriv, createDecipheriv, createHmac } from "crypto";

// ============================================================================
// Types and Interfaces
// ============================================================================

type KeyType = "AES-256-GCM" | "AES-128-GCM" | "RSA-2048" | "RSA-4096" | "ED25519";
type KeyState = "enabled" | "disabled" | "pending_deletion" | "rotated";
type KeyUsage = "encrypt" | "decrypt" | "sign" | "verify" | "wrap" | "unwrap";

interface EncryptionKey {
  id: string;
  alias: string;
  type: KeyType;
  state: KeyState;
  usage: KeyUsage[];
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
  keyMaterial: Buffer; // In production, store in HSM
  version: number;
}

interface EncryptionRequest {
  keyId: string;
  plaintext: string;
  context?: Record<string, string>;
}

interface EncryptionResponse {
  ciphertext: string;
  keyId: string;
  keyVersion: number;
  algorithm: string;
  iv: string;
  authTag: string;
}

interface DecryptionRequest {
  ciphertext: string;
  keyId: string;
  iv: string;
  authTag: string;
  context?: Record<string, string>;
}

interface DecryptionResponse {
  plaintext: string;
  keyId: string;
  keyVersion: number;
}

interface KeyRotationPolicy {
  keyId: string;
  enabled: boolean;
  rotationIntervalDays: number;
  autoRotate: boolean;
  retainOldVersions: number;
  lastRotation?: Date;
  nextRotation?: Date;
}

interface AuditRecord {
  id: string;
  timestamp: Date;
  operation: string;
  keyId: string;
  keyAlias: string;
  userId?: string;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

interface DataKey {
  id: string;
  plaintext: Buffer;
  ciphertext: string;
  keyId: string; // Master key used to encrypt this data key
  createdAt: Date;
  expiresAt: Date;
}

interface HSMConfig {
  enabled: boolean;
  provider: "AWS-CloudHSM" | "Azure-KeyVault" | "Google-CloudKMS" | "Thales" | "Mock";
  endpoint?: string;
  credentials?: Record<string, any>;
}

// ============================================================================
// Key Management System
// ============================================================================

class KeyManagementSystem {
  private keys: Map<string, EncryptionKey> = new Map();
  private keyAliases: Map<string, string> = new Map(); // alias -> keyId
  private rotationPolicies: Map<string, KeyRotationPolicy> = new Map();
  private auditLog: AuditRecord[] = [];
  private dataKeys: Map<string, DataKey> = new Map();
  private hsmConfig: HSMConfig;

  constructor(hsmConfig?: HSMConfig) {
    this.hsmConfig = hsmConfig || { enabled: false, provider: "Mock" };
    this.initializeDefaultKeys();
    this.startRotationScheduler();
  }

  private initializeDefaultKeys(): void {
    // Create default master key
    this.createKey({
      alias: "master-key",
      type: "AES-256-GCM",
      usage: ["encrypt", "decrypt", "wrap", "unwrap"],
      metadata: { purpose: "Master encryption key" },
    });

    // Create data encryption key
    this.createKey({
      alias: "data-key",
      type: "AES-256-GCM",
      usage: ["encrypt", "decrypt"],
      metadata: { purpose: "Data encryption" },
    });

    // Create signing key
    this.createKey({
      alias: "signing-key",
      type: "ED25519",
      usage: ["sign", "verify"],
      metadata: { purpose: "Digital signatures" },
    });
  }

  public createKey(params: {
    alias: string;
    type: KeyType;
    usage: KeyUsage[];
    metadata?: Record<string, any>;
    expiresInDays?: number;
  }): EncryptionKey {
    const keyMaterial = this.generateKeyMaterial(params.type);

    const key: EncryptionKey = {
      id: randomUUID(),
      alias: params.alias,
      type: params.type,
      state: "enabled",
      usage: params.usage,
      createdAt: new Date(),
      expiresAt: params.expiresInDays
        ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      metadata: params.metadata || {},
      keyMaterial,
      version: 1,
    };

    this.keys.set(key.id, key);
    this.keyAliases.set(key.alias, key.id);

    this.audit({
      operation: "create_key",
      keyId: key.id,
      keyAlias: key.alias,
      success: true,
      metadata: { type: params.type, usage: params.usage },
    });

    return key;
  }

  private generateKeyMaterial(type: KeyType): Buffer {
    // In production, generate keys in HSM
    if (this.hsmConfig.enabled) {
      return this.generateKeyInHSM(type);
    }

    switch (type) {
      case "AES-256-GCM":
        return randomBytes(32); // 256 bits
      case "AES-128-GCM":
        return randomBytes(16); // 128 bits
      case "RSA-2048":
      case "RSA-4096":
      case "ED25519":
        // For demo, return random bytes. In production, use proper key generation
        return randomBytes(32);
      default:
        throw new Error(`Unsupported key type: ${type}`);
    }
  }

  private generateKeyInHSM(type: KeyType): Buffer {
    // Mock HSM key generation
    console.log(`Generating ${type} key in HSM (${this.hsmConfig.provider})`);
    return randomBytes(32);
  }

  public getKey(keyIdOrAlias: string): EncryptionKey | undefined {
    // Try as key ID first
    let key = this.keys.get(keyIdOrAlias);

    // Try as alias
    if (!key) {
      const keyId = this.keyAliases.get(keyIdOrAlias);
      if (keyId) {
        key = this.keys.get(keyId);
      }
    }

    return key;
  }

  public encrypt(request: EncryptionRequest): EncryptionResponse {
    const key = this.getKey(request.keyId);
    if (!key) {
      throw new Error("Key not found");
    }

    if (key.state !== "enabled") {
      throw new Error(`Key is ${key.state}`);
    }

    if (!key.usage.includes("encrypt")) {
      throw new Error("Key cannot be used for encryption");
    }

    try {
      const iv = randomBytes(12); // 96-bit IV for GCM
      const cipher = createCipheriv("aes-256-gcm", key.keyMaterial, iv);

      // Add additional authenticated data (AAD) from context
      if (request.context) {
        const aad = Buffer.from(JSON.stringify(request.context));
        cipher.setAAD(aad);
      }

      const encrypted = Buffer.concat([
        cipher.update(request.plaintext, "utf8"),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      const response: EncryptionResponse = {
        ciphertext: encrypted.toString("base64"),
        keyId: key.id,
        keyVersion: key.version,
        algorithm: key.type,
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
      };

      this.audit({
        operation: "encrypt",
        keyId: key.id,
        keyAlias: key.alias,
        success: true,
        metadata: { dataSize: request.plaintext.length },
      });

      return response;
    } catch (error) {
      this.audit({
        operation: "encrypt",
        keyId: key.id,
        keyAlias: key.alias,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {},
      });
      throw error;
    }
  }

  public decrypt(request: DecryptionRequest): DecryptionResponse {
    const key = this.getKey(request.keyId);
    if (!key) {
      throw new Error("Key not found");
    }

    if (key.state !== "enabled" && key.state !== "rotated") {
      throw new Error(`Key is ${key.state}`);
    }

    if (!key.usage.includes("decrypt")) {
      throw new Error("Key cannot be used for decryption");
    }

    try {
      const iv = Buffer.from(request.iv, "base64");
      const authTag = Buffer.from(request.authTag, "base64");
      const ciphertext = Buffer.from(request.ciphertext, "base64");

      const decipher = createDecipheriv("aes-256-gcm", key.keyMaterial, iv);
      decipher.setAuthTag(authTag);

      // Add additional authenticated data (AAD) from context
      if (request.context) {
        const aad = Buffer.from(JSON.stringify(request.context));
        decipher.setAAD(aad);
      }

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      const response: DecryptionResponse = {
        plaintext: decrypted.toString("utf8"),
        keyId: key.id,
        keyVersion: key.version,
      };

      this.audit({
        operation: "decrypt",
        keyId: key.id,
        keyAlias: key.alias,
        success: true,
        metadata: { dataSize: decrypted.length },
      });

      return response;
    } catch (error) {
      this.audit({
        operation: "decrypt",
        keyId: key.id,
        keyAlias: key.alias,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {},
      });
      throw error;
    }
  }

  public rotateKey(keyIdOrAlias: string): EncryptionKey {
    const oldKey = this.getKey(keyIdOrAlias);
    if (!oldKey) {
      throw new Error("Key not found");
    }

    // Generate new key material
    const newKeyMaterial = this.generateKeyMaterial(oldKey.type);

    // Create new version
    const newKey: EncryptionKey = {
      ...oldKey,
      id: randomUUID(),
      keyMaterial: newKeyMaterial,
      version: oldKey.version + 1,
      rotatedAt: new Date(),
    };

    // Mark old key as rotated
    oldKey.state = "rotated";

    // Store new key
    this.keys.set(newKey.id, newKey);
    this.keyAliases.set(newKey.alias, newKey.id);

    // Update rotation policy
    const policy = this.rotationPolicies.get(oldKey.id);
    if (policy) {
      policy.lastRotation = new Date();
      policy.nextRotation = new Date(
        Date.now() + policy.rotationIntervalDays * 24 * 60 * 60 * 1000
      );
      this.rotationPolicies.set(newKey.id, policy);
      this.rotationPolicies.delete(oldKey.id);
    }

    this.audit({
      operation: "rotate_key",
      keyId: newKey.id,
      keyAlias: newKey.alias,
      success: true,
      metadata: { oldVersion: oldKey.version, newVersion: newKey.version },
    });

    return newKey;
  }

  public setRotationPolicy(
    keyIdOrAlias: string,
    policy: Omit<KeyRotationPolicy, "keyId">
  ): void {
    const key = this.getKey(keyIdOrAlias);
    if (!key) {
      throw new Error("Key not found");
    }

    const rotationPolicy: KeyRotationPolicy = {
      keyId: key.id,
      ...policy,
      lastRotation: key.rotatedAt,
      nextRotation: policy.enabled
        ? new Date(Date.now() + policy.rotationIntervalDays * 24 * 60 * 60 * 1000)
        : undefined,
    };

    this.rotationPolicies.set(key.id, rotationPolicy);

    this.audit({
      operation: "set_rotation_policy",
      keyId: key.id,
      keyAlias: key.alias,
      success: true,
      metadata: policy,
    });
  }

  private startRotationScheduler(): void {
    // Check for keys needing rotation every hour
    setInterval(() => this.checkRotations(), 60 * 60 * 1000);
  }

  private checkRotations(): void {
    const now = new Date();

    for (const [keyId, policy] of this.rotationPolicies.entries()) {
      if (
        policy.enabled &&
        policy.autoRotate &&
        policy.nextRotation &&
        policy.nextRotation <= now
      ) {
        try {
          const key = this.keys.get(keyId);
          if (key) {
            console.log(`Auto-rotating key: ${key.alias}`);
            this.rotateKey(key.id);
          }
        } catch (error) {
          console.error(`Failed to rotate key ${keyId}:`, error);
        }
      }
    }
  }

  public generateDataKey(masterKeyId: string, expiresInHours: number = 24): DataKey {
    const masterKey = this.getKey(masterKeyId);
    if (!masterKey) {
      throw new Error("Master key not found");
    }

    if (!masterKey.usage.includes("wrap")) {
      throw new Error("Master key cannot be used for wrapping");
    }

    // Generate data key
    const plaintext = randomBytes(32);

    // Encrypt data key with master key
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", masterKey.keyMaterial, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const ciphertext = Buffer.concat([iv, authTag, encrypted]).toString("base64");

    const dataKey: DataKey = {
      id: randomUUID(),
      plaintext,
      ciphertext,
      keyId: masterKey.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    };

    this.dataKeys.set(dataKey.id, dataKey);

    this.audit({
      operation: "generate_data_key",
      keyId: masterKey.id,
      keyAlias: masterKey.alias,
      success: true,
      metadata: { dataKeyId: dataKey.id, expiresInHours },
    });

    return dataKey;
  }

  public sign(keyIdOrAlias: string, data: string): string {
    const key = this.getKey(keyIdOrAlias);
    if (!key) {
      throw new Error("Key not found");
    }

    if (!key.usage.includes("sign")) {
      throw new Error("Key cannot be used for signing");
    }

    // For demo, use HMAC (in production, use proper signing algorithms)
    const hmac = createHmac("sha256", key.keyMaterial);
    hmac.update(data);
    const signature = hmac.digest("base64");

    this.audit({
      operation: "sign",
      keyId: key.id,
      keyAlias: key.alias,
      success: true,
      metadata: { dataSize: data.length },
    });

    return signature;
  }

  public verify(keyIdOrAlias: string, data: string, signature: string): boolean {
    const key = this.getKey(keyIdOrAlias);
    if (!key) {
      throw new Error("Key not found");
    }

    if (!key.usage.includes("verify")) {
      throw new Error("Key cannot be used for verification");
    }

    // For demo, use HMAC
    const hmac = createHmac("sha256", key.keyMaterial);
    hmac.update(data);
    const expectedSignature = hmac.digest("base64");

    const isValid = signature === expectedSignature;

    this.audit({
      operation: "verify",
      keyId: key.id,
      keyAlias: key.alias,
      success: true,
      metadata: { valid: isValid },
    });

    return isValid;
  }

  public disableKey(keyIdOrAlias: string): void {
    const key = this.getKey(keyIdOrAlias);
    if (!key) {
      throw new Error("Key not found");
    }

    key.state = "disabled";

    this.audit({
      operation: "disable_key",
      keyId: key.id,
      keyAlias: key.alias,
      success: true,
      metadata: {},
    });
  }

  public scheduleKeyDeletion(keyIdOrAlias: string, deletionInDays: number = 30): void {
    const key = this.getKey(keyIdOrAlias);
    if (!key) {
      throw new Error("Key not found");
    }

    key.state = "pending_deletion";
    key.expiresAt = new Date(Date.now() + deletionInDays * 24 * 60 * 60 * 1000);

    this.audit({
      operation: "schedule_deletion",
      keyId: key.id,
      keyAlias: key.alias,
      success: true,
      metadata: { deletionInDays },
    });
  }

  private audit(data: Omit<AuditRecord, "id" | "timestamp">): void {
    const record: AuditRecord = {
      id: randomUUID(),
      timestamp: new Date(),
      ...data,
    };

    this.auditLog.push(record);

    // Keep only last 100,000 records
    if (this.auditLog.length > 100000) {
      this.auditLog.shift();
    }
  }

  public getKeys(): EncryptionKey[] {
    return Array.from(this.keys.values()).map(key => ({
      ...key,
      keyMaterial: Buffer.from("REDACTED"), // Never expose key material
    }));
  }

  public getAuditLog(filter?: {
    operation?: string;
    keyId?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): AuditRecord[] {
    let logs = [...this.auditLog];

    if (filter?.operation) {
      logs = logs.filter(l => l.operation === filter.operation);
    }

    if (filter?.keyId) {
      logs = logs.filter(l => l.keyId === filter.keyId);
    }

    if (filter?.success !== undefined) {
      logs = logs.filter(l => l.success === filter.success);
    }

    if (filter?.startDate) {
      logs = logs.filter(l => l.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      logs = logs.filter(l => l.timestamp <= filter.endDate!);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getRotationPolicies(): KeyRotationPolicy[] {
    return Array.from(this.rotationPolicies.values());
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const kms = new KeyManagementSystem();

const server = serve({
  port: 3004,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "healthy", timestamp: new Date() });
    }

    // Create key
    if (url.pathname === "/api/keys" && req.method === "POST") {
      const body = await req.json();
      const key = kms.createKey(body);
      return Response.json({ key: { ...key, keyMaterial: "REDACTED" } });
    }

    // List keys
    if (url.pathname === "/api/keys" && req.method === "GET") {
      const keys = kms.getKeys();
      return Response.json({ keys, count: keys.length });
    }

    // Encrypt
    if (url.pathname === "/api/encrypt" && req.method === "POST") {
      try {
        const body = await req.json();
        const response = kms.encrypt(body);
        return Response.json(response);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Encryption failed" },
          { status: 400 }
        );
      }
    }

    // Decrypt
    if (url.pathname === "/api/decrypt" && req.method === "POST") {
      try {
        const body = await req.json();
        const response = kms.decrypt(body);
        return Response.json(response);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Decryption failed" },
          { status: 400 }
        );
      }
    }

    // Rotate key
    if (url.pathname.startsWith("/api/keys/") && url.pathname.endsWith("/rotate") && req.method === "POST") {
      const keyId = url.pathname.split("/")[3];
      try {
        const key = kms.rotateKey(keyId);
        return Response.json({ key: { ...key, keyMaterial: "REDACTED" } });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Rotation failed" },
          { status: 400 }
        );
      }
    }

    // Set rotation policy
    if (url.pathname.startsWith("/api/keys/") && url.pathname.endsWith("/rotation-policy") && req.method === "PUT") {
      const keyId = url.pathname.split("/")[3];
      const body = await req.json();
      try {
        kms.setRotationPolicy(keyId, body);
        return Response.json({ success: true });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Failed to set policy" },
          { status: 400 }
        );
      }
    }

    // Generate data key
    if (url.pathname === "/api/data-keys" && req.method === "POST") {
      try {
        const body = await req.json();
        const dataKey = kms.generateDataKey(body.masterKeyId, body.expiresInHours);
        return Response.json({
          id: dataKey.id,
          plaintext: dataKey.plaintext.toString("base64"),
          ciphertext: dataKey.ciphertext,
          expiresAt: dataKey.expiresAt,
        });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Failed to generate data key" },
          { status: 400 }
        );
      }
    }

    // Sign
    if (url.pathname === "/api/sign" && req.method === "POST") {
      try {
        const body = await req.json();
        const signature = kms.sign(body.keyId, body.data);
        return Response.json({ signature });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Signing failed" },
          { status: 400 }
        );
      }
    }

    // Verify
    if (url.pathname === "/api/verify" && req.method === "POST") {
      try {
        const body = await req.json();
        const valid = kms.verify(body.keyId, body.data, body.signature);
        return Response.json({ valid });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Verification failed" },
          { status: 400 }
        );
      }
    }

    // Disable key
    if (url.pathname.startsWith("/api/keys/") && url.pathname.endsWith("/disable") && req.method === "POST") {
      const keyId = url.pathname.split("/")[3];
      try {
        kms.disableKey(keyId);
        return Response.json({ success: true });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Failed to disable key" },
          { status: 400 }
        );
      }
    }

    // Get audit log
    if (url.pathname === "/api/audit" && req.method === "GET") {
      const operation = url.searchParams.get("operation") || undefined;
      const keyId = url.searchParams.get("keyId") || undefined;
      const success = url.searchParams.get("success")
        ? url.searchParams.get("success") === "true"
        : undefined;

      const logs = kms.getAuditLog({ operation, keyId, success });
      return Response.json({ logs, count: logs.length });
    }

    // Get rotation policies
    if (url.pathname === "/api/rotation-policies" && req.method === "GET") {
      const policies = kms.getRotationPolicies();
      return Response.json({ policies, count: policies.length });
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`🔐 Encryption Service running on http://localhost:${server.port}`);
console.log(`📊 Endpoints:`);
console.log(`   POST   /api/keys                    - Create new encryption key`);
console.log(`   GET    /api/keys                    - List all keys`);
console.log(`   POST   /api/encrypt                 - Encrypt data`);
console.log(`   POST   /api/decrypt                 - Decrypt data`);
console.log(`   POST   /api/keys/:id/rotate         - Rotate key`);
console.log(`   PUT    /api/keys/:id/rotation-policy - Set rotation policy`);
console.log(`   POST   /api/data-keys               - Generate data encryption key`);
console.log(`   POST   /api/sign                    - Sign data`);
console.log(`   POST   /api/verify                  - Verify signature`);
console.log(`   POST   /api/keys/:id/disable        - Disable key`);
console.log(`   GET    /api/audit                   - Get audit logs`);
console.log(`   GET    /api/rotation-policies       - Get rotation policies`);
