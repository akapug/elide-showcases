/**
 * Backup & Restore Service
 *
 * A production-ready backup and restore service with incremental backups,
 * point-in-time recovery, compression, encryption, and restore validation.
 */

import { IncomingMessage, ServerResponse, createServer } from "http";
import { createGzip, createGunzip } from "zlib";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { pipeline } from "stream/promises";

// ============================================================================
// Type Definitions
// ============================================================================

interface Backup {
  id: string;
  resourceId: string;
  resourceType: string;
  type: "full" | "incremental" | "differential";
  status: "in_progress" | "completed" | "failed" | "deleted";
  size: number;
  compressedSize: number;
  compressionRatio: number;
  encrypted: boolean;
  checksum: string;
  baseBackupId?: string;
  data: Buffer;
  metadata: BackupMetadata;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

interface BackupMetadata {
  version: string;
  source: string;
  tags: Record<string, string>;
  retentionDays: number;
  customFields?: Record<string, any>;
}

interface RestoreOperation {
  id: string;
  backupId: string;
  targetResourceId: string;
  type: "full" | "point_in_time";
  status: "queued" | "in_progress" | "validating" | "completed" | "failed";
  pointInTime?: string;
  validated: boolean;
  validationErrors: string[];
  progress: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  resourceId: string;
  resourceType: string;
  cronExpression: string;
  type: "full" | "incremental";
  retentionDays: number;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
}

interface ResourceSnapshot {
  resourceId: string;
  timestamp: string;
  data: any;
  checksum: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checksumValid: boolean;
  structureValid: boolean;
  dataIntegrity: boolean;
}

// ============================================================================
// Compression Service
// ============================================================================

class CompressionService {
  async compress(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const gzip = createGzip({ level: 6 });

      gzip.on("data", (chunk) => chunks.push(chunk));
      gzip.on("end", () => resolve(Buffer.concat(chunks)));
      gzip.on("error", reject);

      gzip.write(data);
      gzip.end();
    });
  }

  async decompress(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const gunzip = createGunzip();

      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks)));
      gunzip.on("error", reject);

      gunzip.write(data);
      gunzip.end();
    });
  }

  calculateRatio(original: number, compressed: number): number {
    return Math.round((1 - compressed / original) * 100);
  }
}

// ============================================================================
// Encryption Service
// ============================================================================

class BackupEncryptionService {
  private readonly algorithm = "aes-256-cbc";
  private readonly key: Buffer;

  constructor() {
    // In production, use KMS or secure key management
    this.key = randomBytes(32);
  }

  encrypt(data: Buffer): { encrypted: Buffer; iv: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    return {
      encrypted,
      iv: iv.toString("hex"),
    };
  }

  decrypt(encrypted: Buffer, iv: string): Buffer {
    const decipher = createDecipheriv(this.algorithm, this.key, Buffer.from(iv, "hex"));
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

// ============================================================================
// Checksum Service
// ============================================================================

class ChecksumService {
  calculate(data: Buffer): string {
    return createHash("sha256").update(data).digest("hex");
  }

  verify(data: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = this.calculate(data);
    return actualChecksum === expectedChecksum;
  }
}

// ============================================================================
// Delta Engine
// ============================================================================

class DeltaEngine {
  calculateDelta(baseData: any, currentData: any): any {
    const delta: any = {
      changes: [],
      additions: [],
      deletions: [],
    };

    // Simple delta calculation (can be enhanced with better diffing algorithms)
    const baseKeys = Object.keys(baseData);
    const currentKeys = Object.keys(currentData);

    // Find additions
    for (const key of currentKeys) {
      if (!baseKeys.includes(key)) {
        delta.additions.push({ key, value: currentData[key] });
      } else if (JSON.stringify(baseData[key]) !== JSON.stringify(currentData[key])) {
        delta.changes.push({ key, oldValue: baseData[key], newValue: currentData[key] });
      }
    }

    // Find deletions
    for (const key of baseKeys) {
      if (!currentKeys.includes(key)) {
        delta.deletions.push({ key, value: baseData[key] });
      }
    }

    return delta;
  }

  applyDelta(baseData: any, delta: any): any {
    const result = { ...baseData };

    // Apply deletions
    for (const deletion of delta.deletions || []) {
      delete result[deletion.key];
    }

    // Apply changes
    for (const change of delta.changes || []) {
      result[change.key] = change.newValue;
    }

    // Apply additions
    for (const addition of delta.additions || []) {
      result[addition.key] = addition.value;
    }

    return result;
  }
}

// ============================================================================
// Backup Storage
// ============================================================================

class BackupStorage {
  private backups = new Map<string, Backup>();
  private snapshots = new Map<string, ResourceSnapshot[]>();

  store(backup: Backup): void {
    this.backups.set(backup.id, backup);
    console.log(`[STORAGE] Stored backup ${backup.id} (${backup.compressedSize} bytes, ${backup.compressionRatio}% compressed)`);
  }

  get(id: string): Backup | undefined {
    return this.backups.get(id);
  }

  list(resourceId?: string, type?: Backup["type"]): Backup[] {
    let backups = Array.from(this.backups.values());

    if (resourceId) {
      backups = backups.filter((b) => b.resourceId === resourceId);
    }

    if (type) {
      backups = backups.filter((b) => b.type === type);
    }

    return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  delete(id: string): boolean {
    const backup = this.backups.get(id);
    if (!backup) return false;

    backup.status = "deleted";
    console.log(`[STORAGE] Marked backup ${id} as deleted`);
    return true;
  }

  storeSnapshot(resourceId: string, snapshot: ResourceSnapshot): void {
    const snapshots = this.snapshots.get(resourceId) || [];
    snapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (snapshots.length > 100) {
      snapshots.shift();
    }

    this.snapshots.set(resourceId, snapshots);
  }

  getSnapshotAtTime(resourceId: string, timestamp: string): ResourceSnapshot | undefined {
    const snapshots = this.snapshots.get(resourceId) || [];
    return snapshots
      .filter((s) => s.timestamp <= timestamp)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  }

  getLatestSnapshot(resourceId: string): ResourceSnapshot | undefined {
    const snapshots = this.snapshots.get(resourceId) || [];
    return snapshots[snapshots.length - 1];
  }
}

// ============================================================================
// Restore Manager
// ============================================================================

class RestoreManager {
  private operations = new Map<string, RestoreOperation>();
  private operationIdCounter = 1;

  createOperation(
    backupId: string,
    targetResourceId: string,
    type: RestoreOperation["type"],
    createdBy: string,
    pointInTime?: string
  ): RestoreOperation {
    const operation: RestoreOperation = {
      id: `restore-${this.operationIdCounter++}`,
      backupId,
      targetResourceId,
      type,
      status: "queued",
      pointInTime,
      validated: false,
      validationErrors: [],
      progress: 0,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    this.operations.set(operation.id, operation);
    console.log(`[RESTORE] Created restore operation ${operation.id}`);
    return operation;
  }

  updateStatus(
    operationId: string,
    status: RestoreOperation["status"],
    progress?: number
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.status = status;
    if (progress !== undefined) {
      operation.progress = progress;
    }

    if (status === "completed" || status === "failed") {
      operation.completedAt = new Date().toISOString();
    }

    console.log(`[RESTORE] Operation ${operationId} status: ${status} (${operation.progress}%)`);
  }

  get(id: string): RestoreOperation | undefined {
    return this.operations.get(id);
  }

  list(targetResourceId?: string): RestoreOperation[] {
    let operations = Array.from(this.operations.values());

    if (targetResourceId) {
      operations = operations.filter((o) => o.targetResourceId === targetResourceId);
    }

    return operations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// ============================================================================
// Validator
// ============================================================================

class BackupValidator {
  private checksumService: ChecksumService;

  constructor(checksumService: ChecksumService) {
    this.checksumService = checksumService;
  }

  validate(backup: Backup, decryptedData: Buffer): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      checksumValid: false,
      structureValid: false,
      dataIntegrity: false,
    };

    // Validate checksum
    try {
      result.checksumValid = this.checksumService.verify(decryptedData, backup.checksum);
      if (!result.checksumValid) {
        result.errors.push("Checksum mismatch - data may be corrupted");
        result.valid = false;
      }
    } catch (error) {
      result.errors.push(`Checksum validation failed: ${error}`);
      result.valid = false;
    }

    // Validate structure
    try {
      JSON.parse(decryptedData.toString());
      result.structureValid = true;
    } catch (error) {
      result.errors.push("Invalid JSON structure");
      result.valid = false;
    }

    // Validate data integrity
    if (backup.size > 0 && decryptedData.length === 0) {
      result.errors.push("Backup data is empty");
      result.valid = false;
    } else {
      result.dataIntegrity = true;
    }

    // Warnings
    if (backup.metadata.retentionDays && backup.expiresAt) {
      const expiryDate = new Date(backup.expiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 7) {
        result.warnings.push(`Backup expires in ${daysUntilExpiry} days`);
      }
    }

    return result;
  }
}

// ============================================================================
// Backup & Restore Service
// ============================================================================

class BackupRestoreService {
  private storage: BackupStorage;
  private compressionService: CompressionService;
  private encryptionService: BackupEncryptionService;
  private checksumService: ChecksumService;
  private deltaEngine: DeltaEngine;
  private restoreManager: RestoreManager;
  private validator: BackupValidator;
  private backupIdCounter = 1;

  constructor() {
    this.storage = new BackupStorage();
    this.compressionService = new CompressionService();
    this.encryptionService = new BackupEncryptionService();
    this.checksumService = new ChecksumService();
    this.deltaEngine = new DeltaEngine();
    this.restoreManager = new RestoreManager();
    this.validator = new BackupValidator(this.checksumService);
  }

  async createBackup(
    resourceId: string,
    resourceType: string,
    data: any,
    type: Backup["type"],
    metadata: BackupMetadata,
    encrypt = true
  ): Promise<Backup> {
    console.log(`[BACKUP] Creating ${type} backup for ${resourceId}`);

    const dataBuffer = Buffer.from(JSON.stringify(data));
    let processedData = dataBuffer;
    let baseBackupId: string | undefined;

    // For incremental backups, calculate delta
    if (type === "incremental") {
      const latestSnapshot = this.storage.getLatestSnapshot(resourceId);
      if (latestSnapshot) {
        const delta = this.deltaEngine.calculateDelta(latestSnapshot.data, data);
        processedData = Buffer.from(JSON.stringify(delta));
        baseBackupId = this.storage
          .list(resourceId, "full")
          .filter((b) => b.status === "completed")[0]?.id;

        console.log(`[BACKUP] Calculated incremental delta (${processedData.length} bytes)`);
      } else {
        console.log(`[BACKUP] No base snapshot found, creating full backup instead`);
        type = "full";
      }
    }

    // Compress
    const compressed = await this.compressionService.compress(processedData);
    const compressionRatio = this.compressionService.calculateRatio(
      processedData.length,
      compressed.length
    );

    // Encrypt
    let finalData = compressed;
    let encryptionIv: string | undefined;

    if (encrypt) {
      const { encrypted, iv } = this.encryptionService.encrypt(compressed);
      finalData = encrypted;
      encryptionIv = iv;
    }

    // Calculate checksum (of uncompressed, unencrypted data)
    const checksum = this.checksumService.calculate(processedData);

    // Create backup record
    const backup: Backup = {
      id: `backup-${this.backupIdCounter++}`,
      resourceId,
      resourceType,
      type,
      status: "completed",
      size: dataBuffer.length,
      compressedSize: finalData.length,
      compressionRatio,
      encrypted: encrypt,
      checksum,
      baseBackupId,
      data: finalData,
      metadata: {
        ...metadata,
        ...(encryptionIv && { encryptionIv }),
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      expiresAt: this.calculateExpiry(metadata.retentionDays),
    };

    this.storage.store(backup);

    // Store snapshot for incremental backups
    this.storage.storeSnapshot(resourceId, {
      resourceId,
      timestamp: backup.createdAt,
      data,
      checksum,
    });

    console.log(`[BACKUP] Completed backup ${backup.id}`);
    return backup;
  }

  async restoreBackup(
    backupId: string,
    targetResourceId: string,
    createdBy: string,
    validate = true
  ): Promise<{ operation: RestoreOperation; data: any }> {
    console.log(`[RESTORE] Starting restore from backup ${backupId}`);

    const operation = this.restoreManager.createOperation(
      backupId,
      targetResourceId,
      "full",
      createdBy
    );

    try {
      this.restoreManager.updateStatus(operation.id, "in_progress", 10);

      // Get backup
      const backup = this.storage.get(backupId);
      if (!backup || backup.status !== "completed") {
        throw new Error("Backup not found or not completed");
      }

      this.restoreManager.updateStatus(operation.id, "in_progress", 30);

      // Decrypt
      let processedData = backup.data;
      if (backup.encrypted) {
        const iv = backup.metadata.customFields?.encryptionIv || backup.metadata.encryptionIv;
        processedData = this.encryptionService.decrypt(processedData, iv);
      }

      this.restoreManager.updateStatus(operation.id, "in_progress", 50);

      // Decompress
      const decompressed = await this.compressionService.decompress(processedData);

      this.restoreManager.updateStatus(operation.id, "in_progress", 70);

      // Validate
      if (validate) {
        this.restoreManager.updateStatus(operation.id, "validating", 80);
        const validationResult = this.validator.validate(backup, decompressed);

        operation.validated = true;
        operation.validationErrors = validationResult.errors;

        if (!validationResult.valid) {
          this.restoreManager.updateStatus(operation.id, "failed", 100);
          throw new Error(`Validation failed: ${validationResult.errors.join(", ")}`);
        }
      }

      // Parse data
      let data = JSON.parse(decompressed.toString());

      // If incremental, reconstruct from base
      if (backup.type === "incremental" && backup.baseBackupId) {
        console.log(`[RESTORE] Applying incremental delta from base ${backup.baseBackupId}`);
        const baseBackup = this.storage.get(backup.baseBackupId);
        if (baseBackup) {
          const baseRestoreResult = await this.restoreBackup(
            backup.baseBackupId,
            targetResourceId,
            createdBy,
            false
          );
          data = this.deltaEngine.applyDelta(baseRestoreResult.data, data);
        }
      }

      this.restoreManager.updateStatus(operation.id, "completed", 100);
      console.log(`[RESTORE] Completed restore operation ${operation.id}`);

      return { operation, data };
    } catch (error) {
      this.restoreManager.updateStatus(operation.id, "failed", 100);
      console.error(`[RESTORE] Failed: ${error}`);
      throw error;
    }
  }

  async pointInTimeRestore(
    resourceId: string,
    timestamp: string,
    targetResourceId: string,
    createdBy: string
  ): Promise<{ operation: RestoreOperation; data: any }> {
    console.log(`[RESTORE] Point-in-time restore for ${resourceId} at ${timestamp}`);

    const snapshot = this.storage.getSnapshotAtTime(resourceId, timestamp);
    if (!snapshot) {
      throw new Error("No snapshot available for specified time");
    }

    const operation = this.restoreManager.createOperation(
      snapshot.resourceId,
      targetResourceId,
      "point_in_time",
      createdBy,
      timestamp
    );

    this.restoreManager.updateStatus(operation.id, "completed", 100);

    return {
      operation,
      data: snapshot.data,
    };
  }

  private calculateExpiry(retentionDays: number): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + retentionDays);
    return expiry.toISOString();
  }

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === "/" && req.method === "GET") {
      this.handleRoot(res);
    } else if (path === "/health" && req.method === "GET") {
      this.handleHealth(res);
    } else if (path === "/backups" && req.method === "POST") {
      this.handleCreateBackup(req, res);
    } else if (path === "/backups" && req.method === "GET") {
      this.handleListBackups(url.searchParams, res);
    } else if (path.match(/^\/backups\/[^\/]+$/) && req.method === "GET") {
      const id = path.split("/")[2];
      this.handleGetBackup(id, res);
    } else if (path.match(/^\/backups\/[^\/]+$/) && req.method === "DELETE") {
      const id = path.split("/")[2];
      this.handleDeleteBackup(id, res);
    } else if (path === "/restore" && req.method === "POST") {
      this.handleRestore(req, res);
    } else if (path === "/restore/point-in-time" && req.method === "POST") {
      this.handlePointInTimeRestore(req, res);
    } else if (path === "/restore/operations" && req.method === "GET") {
      this.handleListRestoreOperations(res);
    } else if (path.match(/^\/restore\/operations\/[^\/]+$/) && req.method === "GET") {
      const id = path.split("/")[3];
      this.handleGetRestoreOperation(id, res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  private handleRoot(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Backup & Restore Service",
      version: "1.0.0",
      features: ["incremental-backups", "point-in-time-recovery", "compression", "encryption", "validation"],
      endpoints: {
        backups: "/backups",
        restore: "/restore",
        pointInTime: "/restore/point-in-time",
        operations: "/restore/operations",
      },
    }));
  }

  private handleHealth(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy" }));
  }

  private handleCreateBackup(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const request = JSON.parse(body);
        const backup = await this.createBackup(
          request.resourceId,
          request.resourceType,
          request.data,
          request.type || "full",
          request.metadata || { version: "1.0", source: "api", tags: {}, retentionDays: 30 },
          request.encrypt !== false
        );

        const response = { ...backup, data: "[REDACTED]" };
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  }

  private handleListBackups(params: URLSearchParams, res: ServerResponse): void {
    const resourceId = params.get("resourceId") || undefined;
    const type = params.get("type") as Backup["type"] | undefined;

    const backups = this.storage.list(resourceId, type).map((b) => ({
      ...b,
      data: "[REDACTED]",
    }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ backups, count: backups.length }, null, 2));
  }

  private handleGetBackup(id: string, res: ServerResponse): void {
    const backup = this.storage.get(id);
    if (!backup) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backup not found" }));
      return;
    }

    const response = { ...backup, data: "[REDACTED]" };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response, null, 2));
  }

  private handleDeleteBackup(id: string, res: ServerResponse): void {
    const deleted = this.storage.delete(id);
    if (!deleted) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backup not found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "deleted" }));
  }

  private handleRestore(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const request = JSON.parse(body);
        const result = await this.restoreBackup(
          request.backupId,
          request.targetResourceId,
          request.createdBy || "anonymous",
          request.validate !== false
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  }

  private handlePointInTimeRestore(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const request = JSON.parse(body);
        const result = await this.pointInTimeRestore(
          request.resourceId,
          request.timestamp,
          request.targetResourceId,
          request.createdBy || "anonymous"
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  }

  private handleListRestoreOperations(res: ServerResponse): void {
    const operations = this.restoreManager.list();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ operations, count: operations.length }, null, 2));
  }

  private handleGetRestoreOperation(id: string, res: ServerResponse): void {
    const operation = this.restoreManager.get(id);
    if (!operation) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Restore operation not found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(operation, null, 2));
  }
}

// ============================================================================
// Server
// ============================================================================

const service = new BackupRestoreService();
const server = createServer((req, res) => service.handleRequest(req, res));

const PORT = Number(process.env.PORT) || 3004;
server.listen(PORT, () => {
  console.log(`Backup & Restore Service listening on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Backups: http://localhost:${PORT}/backups`);
});
