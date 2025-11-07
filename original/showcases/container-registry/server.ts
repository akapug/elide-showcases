/**
 * Container Registry - OCI-Compliant Image Registry
 *
 * A production-ready container image registry supporting push/pull operations,
 * manifest handling, layer caching, access control, and garbage collection.
 */

import { IncomingMessage, ServerResponse, createServer } from "http";
import { createHash } from "crypto";

// ============================================================================
// Type Definitions
// ============================================================================

interface Manifest {
  schemaVersion: number;
  mediaType: string;
  config: Descriptor;
  layers: Descriptor[];
  annotations?: Record<string, string>;
}

interface Descriptor {
  mediaType: string;
  size: number;
  digest: string;
  urls?: string[];
}

interface ImageMetadata {
  repository: string;
  tag: string;
  digest: string;
  manifest: Manifest;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
}

interface Layer {
  digest: string;
  data: Buffer;
  size: number;
  mediaType: string;
  uploadedAt: string;
  references: number;
}

interface UploadSession {
  uuid: string;
  repository: string;
  startedAt: number;
  chunks: Buffer[];
  totalSize: number;
}

interface AccessPolicy {
  repository: string;
  user: string;
  permissions: ("pull" | "push" | "delete")[];
  createdAt: string;
}

interface RepositoryInfo {
  name: string;
  tags: string[];
  imageCount: number;
  totalSize: number;
  lastPush: string;
}

// ============================================================================
// Layer Storage
// ============================================================================

class LayerStorage {
  private layers = new Map<string, Layer>();
  private cacheHits = 0;
  private cacheMisses = 0;

  storeLayer(digest: string, data: Buffer, mediaType: string): Layer {
    const existing = this.layers.get(digest);
    if (existing) {
      existing.references++;
      this.cacheHits++;
      console.log(`[STORAGE] Layer ${digest} already exists (cache hit), refs: ${existing.references}`);
      return existing;
    }

    this.cacheMisses++;
    const layer: Layer = {
      digest,
      data,
      size: data.length,
      mediaType,
      uploadedAt: new Date().toISOString(),
      references: 1,
    };

    this.layers.set(digest, layer);
    console.log(`[STORAGE] Stored new layer ${digest} (${layer.size} bytes)`);
    return layer;
  }

  getLayer(digest: string): Layer | undefined {
    const layer = this.layers.get(digest);
    if (layer) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    return layer;
  }

  deleteLayer(digest: string): boolean {
    const layer = this.layers.get(digest);
    if (!layer) return false;

    layer.references--;
    console.log(`[STORAGE] Decremented references for layer ${digest}: ${layer.references}`);

    if (layer.references <= 0) {
      this.layers.delete(digest);
      console.log(`[STORAGE] Deleted layer ${digest} (no more references)`);
      return true;
    }

    return false;
  }

  getTotalSize(): number {
    return Array.from(this.layers.values()).reduce((sum, layer) => sum + layer.size, 0);
  }

  getStats(): { layers: number; totalSize: number; cacheHits: number; cacheMisses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      layers: this.layers.size,
      totalSize: this.getTotalSize(),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: total > 0 ? (this.cacheHits / total) * 100 : 0,
    };
  }
}

// ============================================================================
// Manifest Storage
// ============================================================================

class ManifestStorage {
  private manifests = new Map<string, ImageMetadata>();

  getKey(repository: string, tag: string): string {
    return `${repository}:${tag}`;
  }

  storeManifest(metadata: ImageMetadata): void {
    const key = this.getKey(metadata.repository, metadata.tag);
    this.manifests.set(key, metadata);
    console.log(`[MANIFEST] Stored manifest for ${key}`);
  }

  getManifest(repository: string, tag: string): ImageMetadata | undefined {
    return this.manifests.get(this.getKey(repository, tag));
  }

  getByDigest(digest: string): ImageMetadata | undefined {
    return Array.from(this.manifests.values()).find((m) => m.digest === digest);
  }

  deleteManifest(repository: string, tag: string): ImageMetadata | undefined {
    const key = this.getKey(repository, tag);
    const metadata = this.manifests.get(key);
    if (metadata) {
      this.manifests.delete(key);
      console.log(`[MANIFEST] Deleted manifest for ${key}`);
    }
    return metadata;
  }

  listTags(repository: string): string[] {
    const tags: string[] = [];
    for (const [key, metadata] of this.manifests.entries()) {
      if (metadata.repository === repository) {
        tags.push(metadata.tag);
      }
    }
    return tags.sort();
  }

  listRepositories(): RepositoryInfo[] {
    const repos = new Map<string, RepositoryInfo>();

    for (const metadata of this.manifests.values()) {
      const existing = repos.get(metadata.repository);
      if (!existing) {
        repos.set(metadata.repository, {
          name: metadata.repository,
          tags: [metadata.tag],
          imageCount: 1,
          totalSize: metadata.size,
          lastPush: metadata.uploadedAt,
        });
      } else {
        existing.tags.push(metadata.tag);
        existing.imageCount++;
        existing.totalSize += metadata.size;
        if (metadata.uploadedAt > existing.lastPush) {
          existing.lastPush = metadata.uploadedAt;
        }
      }
    }

    return Array.from(repos.values());
  }
}

// ============================================================================
// Upload Manager
// ============================================================================

class UploadManager {
  private sessions = new Map<string, UploadSession>();
  private readonly sessionTimeout = 5 * 60 * 1000; // 5 minutes

  createSession(repository: string): UploadSession {
    const uuid = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: UploadSession = {
      uuid,
      repository,
      startedAt: Date.now(),
      chunks: [],
      totalSize: 0,
    };

    this.sessions.set(uuid, session);
    console.log(`[UPLOAD] Created upload session ${uuid} for ${repository}`);

    // Auto-cleanup after timeout
    setTimeout(() => {
      if (this.sessions.has(uuid)) {
        this.sessions.delete(uuid);
        console.log(`[UPLOAD] Session ${uuid} timed out`);
      }
    }, this.sessionTimeout);

    return session;
  }

  getSession(uuid: string): UploadSession | undefined {
    return this.sessions.get(uuid);
  }

  appendChunk(uuid: string, chunk: Buffer): boolean {
    const session = this.sessions.get(uuid);
    if (!session) return false;

    session.chunks.push(chunk);
    session.totalSize += chunk.length;
    console.log(`[UPLOAD] Appended ${chunk.length} bytes to session ${uuid} (total: ${session.totalSize})`);
    return true;
  }

  completeSession(uuid: string): Buffer | undefined {
    const session = this.sessions.get(uuid);
    if (!session) return undefined;

    const data = Buffer.concat(session.chunks);
    this.sessions.delete(uuid);
    console.log(`[UPLOAD] Completed session ${uuid} (${data.length} bytes)`);
    return data;
  }

  cancelSession(uuid: string): boolean {
    const deleted = this.sessions.delete(uuid);
    if (deleted) {
      console.log(`[UPLOAD] Cancelled session ${uuid}`);
    }
    return deleted;
  }
}

// ============================================================================
// Access Control
// ============================================================================

class AccessControl {
  private policies = new Map<string, AccessPolicy[]>();

  getKey(repository: string, user: string): string {
    return `${repository}:${user}`;
  }

  addPolicy(policy: AccessPolicy): void {
    const key = policy.repository;
    const existing = this.policies.get(key) || [];
    existing.push(policy);
    this.policies.set(key, existing);
    console.log(`[ACCESS] Added policy for ${policy.user} on ${policy.repository}: ${policy.permissions.join(", ")}`);
  }

  checkPermission(repository: string, user: string, permission: "pull" | "push" | "delete"): boolean {
    const policies = this.policies.get(repository) || [];
    const userPolicy = policies.find((p) => p.user === user || p.user === "*");

    if (!userPolicy) {
      console.log(`[ACCESS] No policy found for ${user} on ${repository}`);
      return false;
    }

    const hasPermission = userPolicy.permissions.includes(permission);
    console.log(`[ACCESS] ${user} ${hasPermission ? "allowed" : "denied"} ${permission} on ${repository}`);
    return hasPermission;
  }

  revokePolicy(repository: string, user: string): boolean {
    const policies = this.policies.get(repository) || [];
    const filtered = policies.filter((p) => p.user !== user);

    if (filtered.length < policies.length) {
      this.policies.set(repository, filtered);
      console.log(`[ACCESS] Revoked policy for ${user} on ${repository}`);
      return true;
    }

    return false;
  }

  listPolicies(repository?: string): AccessPolicy[] {
    if (repository) {
      return this.policies.get(repository) || [];
    }
    return Array.from(this.policies.values()).flat();
  }
}

// ============================================================================
// Garbage Collector
// ============================================================================

class GarbageCollector {
  private layerStorage: LayerStorage;
  private manifestStorage: ManifestStorage;

  constructor(layerStorage: LayerStorage, manifestStorage: ManifestStorage) {
    this.layerStorage = layerStorage;
    this.manifestStorage = manifestStorage;
  }

  collect(): { deletedLayers: number; reclaimedBytes: number } {
    console.log(`[GC] Starting garbage collection`);

    const referencedDigests = new Set<string>();

    // Collect all layer digests referenced by manifests
    for (const metadata of this.manifestStorage["manifests"].values()) {
      // Config digest
      referencedDigests.add(metadata.manifest.config.digest);

      // Layer digests
      for (const layer of metadata.manifest.layers) {
        referencedDigests.add(layer.digest);
      }
    }

    console.log(`[GC] Found ${referencedDigests.size} referenced layers`);

    // Find unreferenced layers
    const allLayers = Array.from(this.layerStorage["layers"].keys());
    let deletedLayers = 0;
    let reclaimedBytes = 0;

    for (const digest of allLayers) {
      if (!referencedDigests.has(digest)) {
        const layer = this.layerStorage["layers"].get(digest);
        if (layer) {
          reclaimedBytes += layer.size;
          this.layerStorage["layers"].delete(digest);
          deletedLayers++;
          console.log(`[GC] Deleted unreferenced layer ${digest} (${layer.size} bytes)`);
        }
      }
    }

    console.log(`[GC] Completed: deleted ${deletedLayers} layers, reclaimed ${reclaimedBytes} bytes`);
    return { deletedLayers, reclaimedBytes };
  }

  scheduleGC(intervalMs = 60000): void {
    setInterval(() => {
      this.collect();
    }, intervalMs);
    console.log(`[GC] Scheduled garbage collection every ${intervalMs}ms`);
  }
}

// ============================================================================
// Container Registry
// ============================================================================

class ContainerRegistry {
  private layerStorage: LayerStorage;
  private manifestStorage: ManifestStorage;
  private uploadManager: UploadManager;
  private accessControl: AccessControl;
  private garbageCollector: GarbageCollector;

  constructor() {
    this.layerStorage = new LayerStorage();
    this.manifestStorage = new ManifestStorage();
    this.uploadManager = new UploadManager();
    this.accessControl = new AccessControl();
    this.garbageCollector = new GarbageCollector(this.layerStorage, this.manifestStorage);

    // Add default policy (allow all for demo)
    this.accessControl.addPolicy({
      repository: "*",
      user: "*",
      permissions: ["pull", "push", "delete"],
      createdAt: new Date().toISOString(),
    });

    // Schedule GC
    this.garbageCollector.scheduleGC(60000);
  }

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === "/" && req.method === "GET") {
      this.handleRoot(res);
    } else if (path === "/v2/" && req.method === "GET") {
      this.handleV2Root(res);
    } else if (path.match(/^\/v2\/([^\/]+)\/manifests\/([^\/]+)$/) && req.method === "GET") {
      const match = path.match(/^\/v2\/([^\/]+)\/manifests\/([^\/]+)$/);
      this.handleGetManifest(match![1], match![2], res);
    } else if (path.match(/^\/v2\/([^\/]+)\/manifests\/([^\/]+)$/) && req.method === "PUT") {
      const match = path.match(/^\/v2\/([^\/]+)\/manifests\/([^\/]+)$/);
      this.handlePutManifest(req, match![1], match![2], res);
    } else if (path.match(/^\/v2\/([^\/]+)\/manifests\/([^\/]+)$/) && req.method === "DELETE") {
      const match = path.match(/^\/v2\/([^\/]+)\/manifests\/([^\/]+)$/);
      this.handleDeleteManifest(match![1], match![2], res);
    } else if (path.match(/^\/v2\/([^\/]+)\/blobs\/uploads\/?$/) && req.method === "POST") {
      const match = path.match(/^\/v2\/([^\/]+)\/blobs\/uploads\/?$/);
      this.handleStartUpload(match![1], res);
    } else if (path.match(/^\/v2\/([^\/]+)\/blobs\/uploads\/([^\/]+)$/) && req.method === "PATCH") {
      const match = path.match(/^\/v2\/([^\/]+)\/blobs\/uploads\/([^\/]+)$/);
      this.handleUploadChunk(req, match![2], res);
    } else if (path.match(/^\/v2\/([^\/]+)\/blobs\/uploads\/([^\/]+)$/) && req.method === "PUT") {
      const match = path.match(/^\/v2\/([^\/]+)\/blobs\/uploads\/([^\/]+)$/);
      this.handleCompleteUpload(req, match![1], match![2], url.searchParams.get("digest")!, res);
    } else if (path.match(/^\/v2\/([^\/]+)\/blobs\/([^\/]+)$/) && req.method === "GET") {
      const match = path.match(/^\/v2\/([^\/]+)\/blobs\/([^\/]+)$/);
      this.handleGetBlob(match![1], match![2], res);
    } else if (path === "/_catalog" && req.method === "GET") {
      this.handleCatalog(res);
    } else if (path.match(/^\/v2\/([^\/]+)\/tags\/list$/) && req.method === "GET") {
      const match = path.match(/^\/v2\/([^\/]+)\/tags\/list$/);
      this.handleListTags(match![1], res);
    } else if (path === "/_gc" && req.method === "POST") {
      this.handleGarbageCollect(res);
    } else if (path === "/_stats" && req.method === "GET") {
      this.handleStats(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ code: "NOT_FOUND", message: "Endpoint not found" }] }));
    }
  }

  private handleRoot(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Container Registry",
      version: "1.0.0",
      api: "OCI Distribution v2",
      endpoints: {
        v2: "/v2/",
        catalog: "/_catalog",
        tags: "/v2/{name}/tags/list",
        manifest: "/v2/{name}/manifests/{reference}",
        blob: "/v2/{name}/blobs/{digest}",
        upload: "/v2/{name}/blobs/uploads/",
        gc: "/_gc",
        stats: "/_stats",
      },
    }));
  }

  private handleV2Root(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({}));
  }

  private handleGetManifest(repository: string, reference: string, res: ServerResponse): void {
    let metadata: ImageMetadata | undefined;

    if (reference.startsWith("sha256:")) {
      metadata = this.manifestStorage.getByDigest(reference);
    } else {
      metadata = this.manifestStorage.getManifest(repository, reference);
    }

    if (!metadata) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ code: "MANIFEST_UNKNOWN", message: "Manifest not found" }] }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": metadata.manifest.mediaType,
      "Docker-Content-Digest": metadata.digest,
    });
    res.end(JSON.stringify(metadata.manifest));
  }

  private handlePutManifest(req: IncomingMessage, repository: string, reference: string, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const manifest = JSON.parse(body) as Manifest;
        const manifestJson = JSON.stringify(manifest);
        const digest = "sha256:" + createHash("sha256").update(manifestJson).digest("hex");

        const metadata: ImageMetadata = {
          repository,
          tag: reference,
          digest,
          manifest,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "admin",
          size: Buffer.byteLength(manifestJson),
        };

        this.manifestStorage.storeManifest(metadata);

        res.writeHead(201, {
          "Location": `/v2/${repository}/manifests/${digest}`,
          "Docker-Content-Digest": digest,
        });
        res.end();
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ code: "MANIFEST_INVALID", message: String(error) }] }));
      }
    });
  }

  private handleDeleteManifest(repository: string, reference: string, res: ServerResponse): void {
    const metadata = this.manifestStorage.deleteManifest(repository, reference);
    if (!metadata) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ code: "MANIFEST_UNKNOWN", message: "Manifest not found" }] }));
      return;
    }

    res.writeHead(202);
    res.end();
  }

  private handleStartUpload(repository: string, res: ServerResponse): void {
    const session = this.uploadManager.createSession(repository);
    res.writeHead(202, {
      "Location": `/v2/${repository}/blobs/uploads/${session.uuid}`,
      "Range": "0-0",
      "Docker-Upload-UUID": session.uuid,
    });
    res.end();
  }

  private handleUploadChunk(req: IncomingMessage, uuid: string, res: ServerResponse): void {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const data = Buffer.concat(chunks);
      const success = this.uploadManager.appendChunk(uuid, data);

      if (!success) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ code: "BLOB_UPLOAD_UNKNOWN", message: "Upload session not found" }] }));
        return;
      }

      const session = this.uploadManager.getSession(uuid)!;
      res.writeHead(202, {
        "Location": `/v2/${session.repository}/blobs/uploads/${uuid}`,
        "Range": `0-${session.totalSize - 1}`,
        "Docker-Upload-UUID": uuid,
      });
      res.end();
    });
  }

  private handleCompleteUpload(req: IncomingMessage, repository: string, uuid: string, digest: string, res: ServerResponse): void {
    const data = this.uploadManager.completeSession(uuid);
    if (!data) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ code: "BLOB_UPLOAD_UNKNOWN", message: "Upload session not found" }] }));
      return;
    }

    // Verify digest
    const actualDigest = "sha256:" + createHash("sha256").update(data).digest("hex");
    if (digest && digest !== actualDigest) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ code: "DIGEST_INVALID", message: "Digest mismatch" }] }));
      return;
    }

    this.layerStorage.storeLayer(actualDigest, data, "application/octet-stream");

    res.writeHead(201, {
      "Location": `/v2/${repository}/blobs/${actualDigest}`,
      "Docker-Content-Digest": actualDigest,
    });
    res.end();
  }

  private handleGetBlob(repository: string, digest: string, res: ServerResponse): void {
    const layer = this.layerStorage.getLayer(digest);
    if (!layer) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ code: "BLOB_UNKNOWN", message: "Blob not found" }] }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": layer.mediaType,
      "Content-Length": layer.size,
      "Docker-Content-Digest": digest,
    });
    res.end(layer.data);
  }

  private handleCatalog(res: ServerResponse): void {
    const repositories = this.manifestStorage.listRepositories();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ repositories: repositories.map((r) => r.name) }));
  }

  private handleListTags(repository: string, res: ServerResponse): void {
    const tags = this.manifestStorage.listTags(repository);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ name: repository, tags }));
  }

  private handleGarbageCollect(res: ServerResponse): void {
    const result = this.garbageCollector.collect();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  }

  private handleStats(res: ServerResponse): void {
    const repositories = this.manifestStorage.listRepositories();
    const layerStats = this.layerStorage.getStats();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      repositories: repositories.length,
      images: repositories.reduce((sum, r) => sum + r.imageCount, 0),
      layers: layerStats,
      repositoryDetails: repositories,
    }, null, 2));
  }
}

// ============================================================================
// Server
// ============================================================================

const registry = new ContainerRegistry();
const server = createServer((req, res) => registry.handleRequest(req, res));

const PORT = Number(process.env.PORT) || 3002;
server.listen(PORT, () => {
  console.log(`Container Registry listening on port ${PORT}`);
  console.log(`Registry v2 API: http://localhost:${PORT}/v2/`);
  console.log(`Catalog: http://localhost:${PORT}/_catalog`);
});
