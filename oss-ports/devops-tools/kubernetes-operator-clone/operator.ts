#!/usr/bin/env elide

/**
 * Kubernetes Operator Clone - K8s Operator Framework for Elide
 *
 * A production-ready Kubernetes operator framework that implements
 * the controller pattern for custom resource management.
 *
 * @author Elide Team
 * @license MIT
 */

import { EventEmitter } from 'events';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface OperatorConfig {
  namespace?: string;
  leaderElection?: LeaderElectionConfig;
  metrics?: MetricsConfig;
  health?: HealthConfig;
  webhook?: WebhookConfig;
  logging?: LoggingConfig;
  kubeconfig?: string;
}

interface LeaderElectionConfig {
  enabled: boolean;
  namespace: string;
  name: string;
  leaseDuration?: number;
  renewDeadline?: number;
  retryPeriod?: number;
}

interface MetricsConfig {
  enabled: boolean;
  port: number;
  path: string;
}

interface HealthConfig {
  enabled: boolean;
  port: number;
  livenessPath: string;
  readinessPath: string;
}

interface WebhookConfig {
  enabled: boolean;
  port: number;
  certDir: string;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'text' | 'json';
}

interface ControllerConfig {
  group: string;
  version: string;
  kind: string;
  plural?: string;
  maxConcurrentReconciles?: number;
  reconcileTimeout?: number;
  retryBackoff?: BackoffConfig;
  predicates?: Predicate[];
}

interface BackoffConfig {
  initial: number;
  max: number;
  multiplier: number;
}

interface CustomResource<TSpec = any, TStatus = any> {
  apiVersion: string;
  kind: string;
  metadata: ResourceMetadata;
  spec: TSpec;
  status?: TStatus;
}

interface ResourceMetadata {
  name: string;
  namespace?: string;
  uid: string;
  resourceVersion: string;
  generation: number;
  creationTimestamp: string;
  deletionTimestamp?: string;
  finalizers?: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownerReferences?: OwnerReference[];
}

interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}

interface ReconcileResult {
  requeue: boolean;
  requeueAfter?: number;
}

interface WatchEvent<T = any> {
  type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK' | 'ERROR';
  object: T;
}

interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime: Date;
  observedGeneration?: number;
}

interface AdmissionRequest {
  uid: string;
  kind: { group: string; version: string; kind: string };
  resource: { group: string; version: string; resource: string };
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'CONNECT';
  object: any;
  oldObject?: any;
  namespace?: string;
  name?: string;
  userInfo: { username: string; uid: string; groups: string[] };
}

interface AdmissionResponse {
  uid?: string;
  allowed: boolean;
  status?: { code?: number; message?: string };
  patch?: string;
  patchType?: 'JSONPatch';
}

type Predicate = (event: WatchEvent) => boolean;

// ============================================================================
// Kubernetes Client
// ============================================================================

class KubernetesClient {
  private baseUrl: string;
  private token?: string;
  private ca?: Buffer;

  constructor(config?: string) {
    this.loadConfig(config);
  }

  private loadConfig(configPath?: string): void {
    // In-cluster configuration
    if (fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token')) {
      this.baseUrl = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`;
      this.token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf-8');
      this.ca = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt');
    } else {
      // Local development
      this.baseUrl = 'http://localhost:8080';
    }
  }

  async list(apiVersion: string, kind: string, namespace?: string): Promise<any> {
    const url = this.buildUrl(apiVersion, kind, namespace);
    return this.request('GET', url);
  }

  async get(apiVersion: string, kind: string, name: string, namespace?: string): Promise<any> {
    const url = this.buildUrl(apiVersion, kind, namespace, name);
    return this.request('GET', url);
  }

  async create(apiVersion: string, kind: string, resource: any): Promise<any> {
    const url = this.buildUrl(apiVersion, kind, resource.metadata.namespace);
    return this.request('POST', url, resource);
  }

  async update(apiVersion: string, kind: string, resource: any): Promise<any> {
    const url = this.buildUrl(
      apiVersion,
      kind,
      resource.metadata.namespace,
      resource.metadata.name
    );
    return this.request('PUT', url, resource);
  }

  async patch(apiVersion: string, kind: string, name: string, namespace: string, patch: any): Promise<any> {
    const url = this.buildUrl(apiVersion, kind, namespace, name);
    return this.request('PATCH', url, patch, {
      'Content-Type': 'application/strategic-merge-patch+json',
    });
  }

  async delete(apiVersion: string, kind: string, name: string, namespace?: string): Promise<any> {
    const url = this.buildUrl(apiVersion, kind, namespace, name);
    return this.request('DELETE', url);
  }

  async updateStatus(apiVersion: string, kind: string, resource: any): Promise<any> {
    const url = this.buildUrl(
      apiVersion,
      kind,
      resource.metadata.namespace,
      resource.metadata.name,
      '/status'
    );
    return this.request('PUT', url, resource);
  }

  watch(apiVersion: string, kind: string, namespace?: string, resourceVersion?: string): EventEmitter {
    const emitter = new EventEmitter();
    const url = this.buildUrl(apiVersion, kind, namespace);
    const params = new URLSearchParams({
      watch: 'true',
      ...(resourceVersion && { resourceVersion }),
    });

    const watchUrl = `${url}?${params}`;

    this.streamRequest(watchUrl, (line) => {
      try {
        const event = JSON.parse(line);
        emitter.emit('event', event);
      } catch (err) {
        emitter.emit('error', err);
      }
    });

    return emitter;
  }

  private buildUrl(
    apiVersion: string,
    kind: string,
    namespace?: string,
    name?: string,
    suffix?: string
  ): string {
    const [group, version] = apiVersion.includes('/')
      ? apiVersion.split('/')
      : ['', apiVersion];

    const apiPath = group ? `/apis/${apiVersion}` : `/api/${version}`;
    const resource = this.kindToResource(kind);

    let url = `${this.baseUrl}${apiPath}`;

    if (namespace) {
      url += `/namespaces/${namespace}`;
    }

    url += `/${resource}`;

    if (name) {
      url += `/${name}`;
    }

    if (suffix) {
      url += suffix;
    }

    return url;
  }

  private kindToResource(kind: string): string {
    // Simple pluralization
    return kind.toLowerCase() + 's';
  }

  private async request(
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options: https.RequestOptions = {
        method,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...headers,
        },
        ...(this.ca && { ca: this.ca }),
      };

      const req = (url.startsWith('https') ? https : http).request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`Request failed: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  private streamRequest(url: string, onData: (line: string) => void): void {
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      method: 'GET',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...(this.ca && { ca: this.ca }),
    };

    const req = (url.startsWith('https') ? https : http).request(options, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line) {
            onData(line);
          }
        }
      });
    });

    req.on('error', (err) => {
      console.error('Watch error:', err);
    });

    req.end();
  }
}

// ============================================================================
// Work Queue
// ============================================================================

class WorkQueue {
  private queue: string[] = [];
  private processing = new Set<string>();
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter();
  }

  add(key: string): void {
    if (!this.processing.has(key) && !this.queue.includes(key)) {
      this.queue.push(key);
    }
  }

  get(): string | undefined {
    const key = this.queue.shift();
    if (key) {
      this.processing.add(key);
    }
    return key;
  }

  done(key: string): void {
    this.processing.delete(key);
    this.rateLimiter.forget(key);
  }

  requeue(key: string, delay?: number): void {
    this.processing.delete(key);

    if (delay) {
      setTimeout(() => this.add(key), delay);
    } else {
      const backoff = this.rateLimiter.when(key);
      setTimeout(() => this.add(key), backoff);
    }
  }

  length(): number {
    return this.queue.length;
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private failures = new Map<string, number>();
  private baseDelay = 5000;
  private maxDelay = 300000;

  when(key: string): number {
    const failures = this.failures.get(key) || 0;
    this.failures.set(key, failures + 1);

    return Math.min(this.baseDelay * Math.pow(2, failures), this.maxDelay);
  }

  forget(key: string): void {
    this.failures.delete(key);
  }
}

// ============================================================================
// Informer
// ============================================================================

class Informer extends EventEmitter {
  private client: KubernetesClient;
  private apiVersion: string;
  private kind: string;
  private namespace?: string;
  private cache = new Map<string, any>();
  private resourceVersion?: string;

  constructor(
    client: KubernetesClient,
    apiVersion: string,
    kind: string,
    namespace?: string
  ) {
    super();
    this.client = client;
    this.apiVersion = apiVersion;
    this.kind = kind;
    this.namespace = namespace;
  }

  async start(): Promise<void> {
    // Initial list
    await this.list();

    // Start watch
    this.watch();
  }

  private async list(): Promise<void> {
    const response = await this.client.list(this.apiVersion, this.kind, this.namespace);

    this.resourceVersion = response.metadata.resourceVersion;

    response.items.forEach((item: any) => {
      const key = this.keyFor(item);
      this.cache.set(key, item);
    });
  }

  private watch(): void {
    const watcher = this.client.watch(
      this.apiVersion,
      this.kind,
      this.namespace,
      this.resourceVersion
    );

    watcher.on('event', (event: WatchEvent) => {
      const key = this.keyFor(event.object);

      switch (event.type) {
        case 'ADDED':
        case 'MODIFIED':
          this.cache.set(key, event.object);
          break;
        case 'DELETED':
          this.cache.delete(key);
          break;
      }

      this.emit('event', event);

      if (event.object.metadata?.resourceVersion) {
        this.resourceVersion = event.object.metadata.resourceVersion;
      }
    });

    watcher.on('error', (err) => {
      console.error('Watch error:', err);
      // Restart watch
      setTimeout(() => this.watch(), 5000);
    });
  }

  get(name: string, namespace?: string): any {
    const key = namespace ? `${namespace}/${name}` : name;
    return this.cache.get(key);
  }

  list(): any[] {
    return Array.from(this.cache.values());
  }

  private keyFor(obj: any): string {
    const namespace = obj.metadata.namespace;
    const name = obj.metadata.name;
    return namespace ? `${namespace}/${name}` : name;
  }
}

// ============================================================================
// Controller Base Class
// ============================================================================

abstract class Controller<TSpec = any, TStatus = any> extends EventEmitter {
  protected client: KubernetesClient;
  protected config: ControllerConfig;
  protected informer?: Informer;
  protected queue: WorkQueue;
  protected reconciling = false;
  public finalizer?: string;

  constructor(config: ControllerConfig) {
    super();
    this.config = {
      maxConcurrentReconciles: 5,
      reconcileTimeout: 60000,
      ...config,
    };
    this.client = new KubernetesClient();
    this.queue = new WorkQueue();
  }

  async start(namespace?: string): Promise<void> {
    console.log(`Starting controller for ${this.config.kind}`);

    // Create informer
    this.informer = new Informer(
      this.client,
      `${this.config.group}/${this.config.version}`,
      this.config.kind,
      namespace
    );

    // Handle events
    this.informer.on('event', (event: WatchEvent) => {
      if (this.shouldReconcile(event)) {
        const key = this.keyFor(event.object);
        this.queue.add(key);
      }
    });

    // Start informer
    await this.informer.start();

    // Start reconciliation loop
    this.reconciling = true;
    this.runWorkers();
  }

  stop(): void {
    this.reconciling = false;
  }

  private async runWorkers(): Promise<void> {
    const workers = Array(this.config.maxConcurrentReconciles!).fill(null).map(() => this.runWorker());
    await Promise.all(workers);
  }

  private async runWorker(): Promise<void> {
    while (this.reconciling) {
      const key = this.queue.get();

      if (!key) {
        await this.sleep(100);
        continue;
      }

      try {
        await this.processItem(key);
        this.queue.done(key);
      } catch (err) {
        console.error(`Error reconciling ${key}:`, err);
        this.queue.requeue(key);
      }
    }
  }

  private async processItem(key: string): Promise<void> {
    const [namespace, name] = key.includes('/') ? key.split('/') : [undefined, key];

    const resource = this.informer!.get(name, namespace);

    if (!resource) {
      // Resource deleted
      return;
    }

    // Check for deletion
    if (resource.metadata.deletionTimestamp && this.finalizer) {
      if (resource.metadata.finalizers?.includes(this.finalizer)) {
        await this.finalize(resource);
        await this.removeFinalizer(resource);
      }
      return;
    }

    // Add finalizer if needed
    if (this.finalizer && !resource.metadata.finalizers?.includes(this.finalizer)) {
      await this.addFinalizer(resource);
      return;
    }

    // Reconcile
    const result = await this.reconcile(resource);

    if (result.requeue) {
      this.queue.requeue(key, result.requeueAfter);
    }
  }

  abstract reconcile(resource: CustomResource<TSpec, TStatus>): Promise<ReconcileResult>;

  async finalize(resource: CustomResource<TSpec, TStatus>): Promise<void> {
    // Override in subclass if needed
  }

  protected async addFinalizer(resource: CustomResource): Promise<void> {
    if (!this.finalizer) return;

    const finalizers = resource.metadata.finalizers || [];
    if (finalizers.includes(this.finalizer)) return;

    const patch = {
      metadata: {
        finalizers: [...finalizers, this.finalizer],
      },
    };

    await this.client.patch(
      `${this.config.group}/${this.config.version}`,
      this.config.kind,
      resource.metadata.name,
      resource.metadata.namespace || '',
      patch
    );
  }

  protected async removeFinalizer(resource: CustomResource): Promise<void> {
    if (!this.finalizer) return;

    const finalizers = (resource.metadata.finalizers || []).filter(
      (f) => f !== this.finalizer
    );

    const patch = {
      metadata: {
        finalizers,
      },
    };

    await this.client.patch(
      `${this.config.group}/${this.config.version}`,
      this.config.kind,
      resource.metadata.name,
      resource.metadata.namespace || '',
      patch
    );
  }

  protected async updateStatus(
    resource: CustomResource<TSpec, TStatus>,
    status: TStatus
  ): Promise<void> {
    const updated = {
      ...resource,
      status,
    };

    await this.client.updateStatus(
      `${this.config.group}/${this.config.version}`,
      this.config.kind,
      updated
    );
  }

  protected async updateCondition(
    resource: CustomResource<TSpec, TStatus>,
    condition: Condition
  ): Promise<void> {
    const status = resource.status as any || {};
    const conditions = status.conditions || [];

    const existingIndex = conditions.findIndex((c: Condition) => c.type === condition.type);

    if (existingIndex !== -1) {
      conditions[existingIndex] = condition;
    } else {
      conditions.push(condition);
    }

    await this.updateStatus(resource, { ...status, conditions });
  }

  protected createOwnerReference(resource: CustomResource): OwnerReference {
    return {
      apiVersion: `${this.config.group}/${this.config.version}`,
      kind: this.config.kind,
      name: resource.metadata.name,
      uid: resource.metadata.uid,
      controller: true,
      blockOwnerDeletion: true,
    };
  }

  private shouldReconcile(event: WatchEvent): boolean {
    if (!this.config.predicates) return true;

    return this.config.predicates.every(predicate => predicate(event));
  }

  private keyFor(obj: any): string {
    const namespace = obj.metadata.namespace;
    const name = obj.metadata.name;
    return namespace ? `${namespace}/${name}` : name;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Event Recorder
// ============================================================================

class EventRecorder {
  private client: KubernetesClient;

  constructor(client: KubernetesClient) {
    this.client = client;
  }

  async event(
    resource: CustomResource,
    event: {
      type: 'Normal' | 'Warning';
      reason: string;
      message: string;
    }
  ): Promise<void> {
    const eventObj = {
      apiVersion: 'v1',
      kind: 'Event',
      metadata: {
        name: `${resource.metadata.name}.${Date.now()}`,
        namespace: resource.metadata.namespace,
      },
      involvedObject: {
        apiVersion: resource.apiVersion,
        kind: resource.kind,
        name: resource.metadata.name,
        namespace: resource.metadata.namespace,
        uid: resource.metadata.uid,
      },
      reason: event.reason,
      message: event.message,
      type: event.type,
      firstTimestamp: new Date().toISOString(),
      lastTimestamp: new Date().toISOString(),
      count: 1,
    };

    try {
      await this.client.create('v1', 'Event', eventObj);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  }
}

// ============================================================================
// Webhook Server
// ============================================================================

abstract class Webhook {
  abstract path: string;
  abstract rules: WebhookRule[];

  abstract handle(request: AdmissionRequest): Promise<AdmissionResponse>;
}

interface WebhookRule {
  apiGroups: string[];
  apiVersions: string[];
  resources: string[];
  operations: string[];
}

class ValidatingWebhook extends Webhook {
  abstract validate(request: AdmissionRequest): Promise<AdmissionResponse>;

  async handle(request: AdmissionRequest): Promise<AdmissionResponse> {
    return this.validate(request);
  }
}

class MutatingWebhook extends Webhook {
  abstract mutate(request: AdmissionRequest): Promise<AdmissionResponse>;

  async handle(request: AdmissionRequest): Promise<AdmissionResponse> {
    return this.mutate(request);
  }
}

class WebhookServer {
  private server?: https.Server;
  private webhooks = new Map<string, Webhook>();
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  registerWebhook(webhook: Webhook): void {
    this.webhooks.set(webhook.path, webhook);
  }

  async start(): Promise<void> {
    const options = {
      key: fs.readFileSync(path.join(this.config.certDir, 'tls.key')),
      cert: fs.readFileSync(path.join(this.config.certDir, 'tls.crt')),
    };

    this.server = https.createServer(options, async (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end();
        return;
      }

      const webhook = this.webhooks.get(req.url || '');
      if (!webhook) {
        res.writeHead(404);
        res.end();
        return;
      }

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const admissionReview = JSON.parse(body);
          const response = await webhook.handle(admissionReview.request);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            apiVersion: 'admission.k8s.io/v1',
            kind: 'AdmissionReview',
            response: {
              uid: admissionReview.request.uid,
              ...response,
            },
          }));
        } catch (err) {
          console.error('Webhook error:', err);
          res.writeHead(500);
          res.end();
        }
      });
    });

    this.server.listen(this.config.port);
    console.log(`Webhook server listening on port ${this.config.port}`);
  }

  stop(): void {
    this.server?.close();
  }
}

// ============================================================================
// Operator
// ============================================================================

class Operator {
  private config: OperatorConfig;
  private controllers: Controller[] = [];
  private webhookServer?: WebhookServer;
  private metricsServer?: http.Server;
  private healthServer?: http.Server;

  constructor(config: OperatorConfig = {}) {
    this.config = config;
  }

  registerController(controller: Controller): void {
    this.controllers.push(controller);
  }

  registerWebhook(webhook: Webhook): void {
    if (!this.webhookServer && this.config.webhook?.enabled) {
      this.webhookServer = new WebhookServer(this.config.webhook);
    }

    this.webhookServer?.registerWebhook(webhook);
  }

  async start(): Promise<void> {
    console.log('Starting operator...');

    // Start metrics server
    if (this.config.metrics?.enabled) {
      this.startMetricsServer();
    }

    // Start health server
    if (this.config.health?.enabled) {
      this.startHealthServer();
    }

    // Start webhook server
    if (this.webhookServer) {
      await this.webhookServer.start();
    }

    // Start controllers
    for (const controller of this.controllers) {
      await controller.start(this.config.namespace);
    }

    console.log('Operator started successfully');

    // Keep running
    await new Promise(() => {});
  }

  private startMetricsServer(): void {
    const { port, path: metricsPath } = this.config.metrics!;

    this.metricsServer = http.createServer((req, res) => {
      if (req.url === metricsPath) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(this.collectMetrics());
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.metricsServer.listen(port);
    console.log(`Metrics server listening on port ${port}`);
  }

  private startHealthServer(): void {
    const { port, livenessPath, readinessPath } = this.config.health!;

    this.healthServer = http.createServer((req, res) => {
      if (req.url === livenessPath || req.url === readinessPath) {
        res.writeHead(200);
        res.end('ok');
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.healthServer.listen(port);
    console.log(`Health server listening on port ${port}`);
  }

  private collectMetrics(): string {
    // Basic metrics in Prometheus format
    const metrics: string[] = [];

    this.controllers.forEach((controller, i) => {
      metrics.push(`# HELP controller_reconciliations_total Total reconciliations`);
      metrics.push(`# TYPE controller_reconciliations_total counter`);
      metrics.push(`controller_reconciliations_total{controller="${i}"} 0`);
    });

    return metrics.join('\n');
  }

  async stop(): Promise<void> {
    console.log('Stopping operator...');

    this.controllers.forEach(c => c.stop());
    this.webhookServer?.stop();
    this.metricsServer?.close();
    this.healthServer?.close();

    console.log('Operator stopped');
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  Operator,
  Controller,
  Webhook,
  ValidatingWebhook,
  MutatingWebhook,
  KubernetesClient,
  EventRecorder,
  CustomResource,
  ReconcileResult,
  Condition,
  OwnerReference,
  AdmissionRequest,
  AdmissionResponse,
  OperatorConfig,
  ControllerConfig,
};
