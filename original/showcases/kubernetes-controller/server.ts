/**
 * Kubernetes Controller - Custom Resource Controller
 *
 * A production-ready Kubernetes operator that manages custom resources,
 * implements reconciliation loops, watches resources, and handles events.
 */

// Type definitions for HTTP handlers
interface IncomingMessage {
  url?: string;
  headers: { host?: string };
  method?: string;
  on(event: string, callback: (chunk: any) => void): void;
}

interface ServerResponse {
  setHeader(name: string, value: string): void;
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(data?: string): void;
  write(data: string): void;
  closed: boolean;
  on(event: string, callback: () => void): void;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface CustomResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    generation: number;
    creationTimestamp: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    replicas: number;
    image: string;
    strategy: "RollingUpdate" | "Recreate";
    config?: Record<string, string>;
  };
  status?: {
    observedGeneration: number;
    replicas: number;
    readyReplicas: number;
    conditions: Condition[];
    phase: "Pending" | "Running" | "Failed" | "Succeeded";
  };
}

interface Condition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastTransitionTime: string;
  reason: string;
  message: string;
}

interface WatchEvent {
  type: "ADDED" | "MODIFIED" | "DELETED" | "ERROR";
  object: CustomResource;
}

interface ReconcileRequest {
  name: string;
  namespace: string;
}

interface ReconcileResult {
  requeue: boolean;
  requeueAfter?: number;
  error?: string;
}

// ============================================================================
// Custom Resource Definition
// ============================================================================

const CustomResourceDefinition = {
  apiVersion: "apiextensions.k8s.io/v1",
  kind: "CustomResourceDefinition",
  metadata: {
    name: "applications.cloudnative.elide.dev",
  },
  spec: {
    group: "cloudnative.elide.dev",
    versions: [
      {
        name: "v1",
        served: true,
        storage: true,
        schema: {
          openAPIV3Schema: {
            type: "object",
            properties: {
              spec: {
                type: "object",
                properties: {
                  replicas: { type: "integer", minimum: 0 },
                  image: { type: "string" },
                  strategy: { type: "string", enum: ["RollingUpdate", "Recreate"] },
                  config: { type: "object", additionalProperties: { type: "string" } },
                },
                required: ["replicas", "image"],
              },
              status: {
                type: "object",
                properties: {
                  observedGeneration: { type: "integer" },
                  replicas: { type: "integer" },
                  readyReplicas: { type: "integer" },
                  phase: { type: "string", enum: ["Pending", "Running", "Failed", "Succeeded"] },
                },
              },
            },
          },
        },
      },
    ],
    scope: "Namespaced",
    names: {
      plural: "applications",
      singular: "application",
      kind: "Application",
      shortNames: ["app"],
    },
  },
};

// ============================================================================
// Resource Store & Cache
// ============================================================================

class ResourceCache {
  private resources = new Map<string, CustomResource>();

  getKey(namespace: string, name: string): string {
    return `${namespace}/${name}`;
  }

  set(resource: CustomResource): void {
    const key = this.getKey(resource.metadata.namespace, resource.metadata.name);
    this.resources.set(key, resource);
  }

  get(namespace: string, name: string): CustomResource | undefined {
    return this.resources.get(this.getKey(namespace, name));
  }

  delete(namespace: string, name: string): void {
    this.resources.delete(this.getKey(namespace, name));
  }

  list(namespace?: string): CustomResource[] {
    if (namespace) {
      return Array.from(this.resources.values()).filter(
        (r) => r.metadata.namespace === namespace
      );
    }
    return Array.from(this.resources.values());
  }
}

// ============================================================================
// Event Handler
// ============================================================================

class EventHandler {
  private events: WatchEvent[] = [];
  private maxEvents = 1000;

  record(event: WatchEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    console.log(`[EVENT] ${event.type} ${event.object.metadata.namespace}/${event.object.metadata.name}`);
  }

  getEvents(limit = 100): WatchEvent[] {
    return this.events.slice(-limit);
  }
}

// ============================================================================
// Reconciler
// ============================================================================

class Reconciler {
  private cache: ResourceCache;
  private eventHandler: EventHandler;
  private reconcileQueue: ReconcileRequest[] = [];
  private isReconciling = false;

  constructor(cache: ResourceCache, eventHandler: EventHandler) {
    this.cache = cache;
    this.eventHandler = eventHandler;
  }

  async reconcile(req: ReconcileRequest): Promise<ReconcileResult> {
    console.log(`[RECONCILE] Starting reconciliation for ${req.namespace}/${req.name}`);

    const resource = this.cache.get(req.namespace, req.name);
    if (!resource) {
      console.log(`[RECONCILE] Resource not found, skipping`);
      return { requeue: false };
    }

    try {
      // Check if spec has changed (generation mismatch)
      const needsUpdate = !resource.status ||
        resource.status.observedGeneration !== resource.metadata.generation;

      if (needsUpdate) {
        console.log(`[RECONCILE] Applying desired state...`);

        // Simulate resource reconciliation
        const updatedStatus = {
          observedGeneration: resource.metadata.generation,
          replicas: resource.spec.replicas,
          readyReplicas: resource.spec.replicas,
          conditions: [
            {
              type: "Ready",
              status: "True" as const,
              lastTransitionTime: new Date().toISOString(),
              reason: "ReconciliationSucceeded",
              message: "All replicas are ready",
            },
            {
              type: "Progressing",
              status: "False" as const,
              lastTransitionTime: new Date().toISOString(),
              reason: "ReplicaSetUpdated",
              message: "ReplicaSet is up to date",
            },
          ],
          phase: "Running" as const,
        };

        resource.status = updatedStatus;
        this.cache.set(resource);

        console.log(`[RECONCILE] Status updated successfully`);
      } else {
        console.log(`[RECONCILE] Resource is in sync, no action needed`);
      }

      return { requeue: false };
    } catch (error) {
      console.error(`[RECONCILE] Error:`, error);
      return { requeue: true, requeueAfter: 5000, error: String(error) };
    }
  }

  enqueue(req: ReconcileRequest): void {
    this.reconcileQueue.push(req);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isReconciling || this.reconcileQueue.length === 0) {
      return;
    }

    this.isReconciling = true;

    while (this.reconcileQueue.length > 0) {
      const req = this.reconcileQueue.shift()!;
      const result = await this.reconcile(req);

      if (result.requeue) {
        setTimeout(() => {
          this.enqueue(req);
        }, result.requeueAfter || 1000);
      }
    }

    this.isReconciling = false;
  }
}

// ============================================================================
// Resource Watcher
// ============================================================================

class ResourceWatcher {
  private cache: ResourceCache;
  private eventHandler: EventHandler;
  private reconciler: Reconciler;
  private watchers = new Set<ServerResponse>();

  constructor(cache: ResourceCache, eventHandler: EventHandler, reconciler: Reconciler) {
    this.cache = cache;
    this.eventHandler = eventHandler;
    this.reconciler = reconciler;
  }

  handleEvent(event: WatchEvent): void {
    this.eventHandler.record(event);

    switch (event.type) {
      case "ADDED":
      case "MODIFIED":
        this.cache.set(event.object);
        this.reconciler.enqueue({
          name: event.object.metadata.name,
          namespace: event.object.metadata.namespace,
        });
        break;
      case "DELETED":
        this.cache.delete(event.object.metadata.namespace, event.object.metadata.name);
        break;
    }

    // Notify all watchers
    this.notifyWatchers(event);
  }

  addWatcher(res: ServerResponse): void {
    this.watchers.add(res);
    res.on("close", () => {
      this.watchers.delete(res);
    });
  }

  private notifyWatchers(event: WatchEvent): void {
    const data = JSON.stringify(event);
    for (const watcher of this.watchers) {
      if (!watcher.closed) {
        watcher.write(`data: ${data}\n\n`);
      }
    }
  }
}

// ============================================================================
// Kubernetes Controller
// ============================================================================

class KubernetesController {
  private cache: ResourceCache;
  private eventHandler: EventHandler;
  private reconciler: Reconciler;
  private watcher: ResourceWatcher;

  constructor() {
    this.cache = new ResourceCache();
    this.eventHandler = new EventHandler();
    this.reconciler = new Reconciler(this.cache, this.eventHandler);
    this.watcher = new ResourceWatcher(this.cache, this.eventHandler, this.reconciler);
  }

  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === "/" && req.method === "GET") {
      this.handleRoot(res);
    } else if (path === "/healthz" && req.method === "GET") {
      this.handleHealth(res);
    } else if (path === "/crd" && req.method === "GET") {
      this.handleGetCRD(res);
    } else if (path.startsWith("/apis/cloudnative.elide.dev/v1/namespaces/")) {
      const match = path.match(/\/namespaces\/([^\/]+)\/applications(?:\/([^\/]+))?/);
      if (match) {
        const namespace = match[1];
        const name = match[2];

        if (req.method === "GET" && name) {
          this.handleGetResource(namespace, name, res);
        } else if (req.method === "GET") {
          this.handleListResources(namespace, res);
        } else if (req.method === "POST") {
          this.handleCreateResource(req, namespace, res);
        } else if (req.method === "PUT" && name) {
          this.handleUpdateResource(req, namespace, name, res);
        } else if (req.method === "DELETE" && name) {
          this.handleDeleteResource(namespace, name, res);
        }
      }
    } else if (path === "/watch" && req.method === "GET") {
      this.handleWatch(res);
    } else if (path === "/events" && req.method === "GET") {
      this.handleGetEvents(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  private handleRoot(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Kubernetes Controller",
      version: "v1",
      resources: this.cache.list().length,
      endpoints: {
        health: "/healthz",
        crd: "/crd",
        resources: "/apis/cloudnative.elide.dev/v1/namespaces/{namespace}/applications",
        watch: "/watch",
        events: "/events",
      },
    }));
  }

  private handleHealth(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy" }));
  }

  private handleGetCRD(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(CustomResourceDefinition, null, 2));
  }

  private handleGetResource(namespace: string, name: string, res: ServerResponse): void {
    const resource = this.cache.get(namespace, name);
    if (!resource) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Resource not found" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resource, null, 2));
  }

  private handleListResources(namespace: string, res: ServerResponse): void {
    const resources = this.cache.list(namespace);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ items: resources }, null, 2));
  }

  private handleCreateResource(req: IncomingMessage, namespace: string, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const resource = JSON.parse(body) as CustomResource;
        resource.metadata.namespace = namespace;
        resource.metadata.uid = `uid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        resource.metadata.resourceVersion = "1";
        resource.metadata.generation = 1;
        resource.metadata.creationTimestamp = new Date().toISOString();

        this.watcher.handleEvent({ type: "ADDED", object: resource });

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(resource, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  private handleUpdateResource(req: IncomingMessage, namespace: string, name: string, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const existing = this.cache.get(namespace, name);
        if (!existing) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Resource not found" }));
          return;
        }

        const resource = JSON.parse(body) as CustomResource;
        resource.metadata.resourceVersion = String(Number(existing.metadata.resourceVersion) + 1);
        resource.metadata.generation = existing.metadata.generation + 1;

        this.watcher.handleEvent({ type: "MODIFIED", object: resource });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(resource, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  private handleDeleteResource(namespace: string, name: string, res: ServerResponse): void {
    const resource = this.cache.get(namespace, name);
    if (!resource) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Resource not found" }));
      return;
    }

    this.watcher.handleEvent({ type: "DELETED", object: resource });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "Success" }));
  }

  private handleWatch(res: ServerResponse): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    this.watcher.addWatcher(res);
  }

  private handleGetEvents(res: ServerResponse): void {
    const events = this.eventHandler.getEvents();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ events }, null, 2));
  }
}

// ============================================================================
// Server
// ============================================================================

const controller = new KubernetesController();
const PORT = Number(process.env.PORT) || 3000;

console.log(`Kubernetes Controller running on http://localhost:${PORT}`);
console.log(`Health: http://localhost:${PORT}/healthz`);
console.log(`CRD: http://localhost:${PORT}/crd`);
