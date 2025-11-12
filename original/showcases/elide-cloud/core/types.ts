/**
 * Core Types for Elide Cloud Platform
 *
 * Comprehensive type definitions for the entire platform
 */

// =============================================================================
// User Management
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
  role: 'user' | 'admin' | 'developer';
  organizationId?: string;
  metadata: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  plan: 'free' | 'pro' | 'enterprise';
  billingEmail: string;
  metadata: Record<string, any>;
}

export interface TeamMember {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  addedAt: Date;
  addedBy: string;
}

// =============================================================================
// Applications
// =============================================================================

export interface Application {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  repository?: string;
  branch: string;
  buildpack?: string;
  stack: 'heroku-22' | 'heroku-24' | 'elide-1' | 'elide-2';
  region: 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1';
  maintenance: boolean;
  metadata: Record<string, any>;
}

// =============================================================================
// Deployments
// =============================================================================

export interface Deployment {
  id: string;
  applicationId: string;
  version: number;
  status: DeploymentStatus;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  source: DeploymentSource;
  buildId?: string;
  slug?: string;
  commit?: string;
  branch?: string;
  message?: string;
  logs: string[];
  metadata: Record<string, any>;
}

export type DeploymentStatus =
  | 'pending'
  | 'queued'
  | 'building'
  | 'deploying'
  | 'running'
  | 'failed'
  | 'cancelled'
  | 'rolled_back';

export interface DeploymentSource {
  type: 'git' | 'docker' | 'archive' | 'manual';
  url?: string;
  ref?: string;
  version?: string;
}

// =============================================================================
// Build System
// =============================================================================

export interface Build {
  id: string;
  deploymentId: string;
  applicationId: string;
  status: BuildStatus;
  buildpack: string;
  stack: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  sourceVersion: string;
  slugId?: string;
  outputStreamUrl?: string;
  buildpacks: BuildpackInfo[];
  cache: {
    enabled: boolean;
    hit: boolean;
    size?: number;
  };
  metadata: Record<string, any>;
}

export type BuildStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface BuildpackInfo {
  name: string;
  version: string;
  url?: string;
  detected: boolean;
}

export interface Buildpack {
  id: string;
  name: string;
  version: string;
  language: string;
  detectScript: string;
  buildScript: string;
  releaseScript?: string;
  priority: number;
  enabled: boolean;
}

// =============================================================================
// Runtime & Processes
// =============================================================================

export interface Process {
  id: string;
  applicationId: string;
  deploymentId: string;
  type: ProcessType;
  command: string;
  status: ProcessStatus;
  dynoId: string;
  size: DynoSize;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  restarts: number;
  metadata: Record<string, any>;
}

export type ProcessType = 'web' | 'worker' | 'clock' | 'release';

export type ProcessStatus =
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'crashed'
  | 'failed';

export type DynoSize =
  | 'free'
  | 'hobby'
  | 'standard-1x'
  | 'standard-2x'
  | 'performance-m'
  | 'performance-l';

export interface Dyno {
  id: string;
  applicationId: string;
  processType: string;
  size: DynoSize;
  command: string;
  status: ProcessStatus;
  createdAt: Date;
  attachedAt?: Date;
  releaseVersion: number;
  state: {
    uptime: number;
    cpu: number;
    memory: number;
    requests: number;
  };
}

export interface ScalingPolicy {
  id: string;
  applicationId: string;
  processType: string;
  enabled: boolean;
  minDynos: number;
  maxDynos: number;
  targetCPU?: number;
  targetMemory?: number;
  targetRPS?: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

// =============================================================================
// Add-ons & Services
// =============================================================================

export interface Addon {
  id: string;
  applicationId: string;
  name: string;
  provider: string;
  plan: string;
  config: Record<string, any>;
  attachments: AddonAttachment[];
  status: AddonStatus;
  createdAt: Date;
  updatedAt: Date;
  webUrl?: string;
  metadata: Record<string, any>;
}

export type AddonStatus =
  | 'provisioning'
  | 'provisioned'
  | 'deprovisioning'
  | 'deprovisioned'
  | 'failed';

export interface AddonAttachment {
  id: string;
  addonId: string;
  applicationId: string;
  name: string;
  config: Record<string, string>;
  namespace?: string;
}

export interface AddonProvider {
  id: string;
  name: string;
  slug: string;
  description: string;
  plans: AddonPlan[];
  configVars: string[];
  supportsSharing: boolean;
  supportsSingleTenancy: boolean;
}

export interface AddonPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceUnit: 'month' | 'hour';
  features: Record<string, any>;
}

// =============================================================================
// Configuration
// =============================================================================

export interface ConfigVar {
  key: string;
  value: string;
  applicationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Release {
  id: string;
  version: number;
  applicationId: string;
  deploymentId?: string;
  description: string;
  status: 'pending' | 'current' | 'expired';
  createdAt: Date;
  createdBy: string;
  slugId?: string;
  config: Record<string, string>;
  addons: string[];
  processes: Record<string, string>;
}

// =============================================================================
// Domains & Routing
// =============================================================================

export interface Domain {
  id: string;
  applicationId: string;
  hostname: string;
  kind: 'custom' | 'heroku' | 'elide';
  status: DomainStatus;
  cname?: string;
  acmStatus?: ACMStatus;
  sslCert?: SSLCertificate;
  createdAt: Date;
  updatedAt: Date;
}

export type DomainStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'none';

export type ACMStatus =
  | 'pending'
  | 'ok'
  | 'failed'
  | 'disabled';

export interface SSLCertificate {
  id: string;
  domainId: string;
  certPem: string;
  keyPem: string;
  chainPem?: string;
  expiresAt: Date;
  issuedAt: Date;
  issuer: string;
  autoRenew: boolean;
}

// =============================================================================
// Routing & Load Balancing
// =============================================================================

export interface Route {
  id: string;
  applicationId: string;
  domain: string;
  path: string;
  targetService: string;
  targetPort: number;
  protocol: 'http' | 'https' | 'tcp' | 'websocket';
  sslEnabled: boolean;
  loadBalancer: LoadBalancerConfig;
  healthCheck?: HealthCheckConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash';
  sessionAffinity: boolean;
  timeoutSeconds: number;
  maxConnections: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  path: string;
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}

// =============================================================================
// Monitoring & Metrics
// =============================================================================

export interface Metric {
  applicationId: string;
  timestamp: Date;
  type: MetricType;
  value: number;
  unit: string;
  dimensions: Record<string, string>;
}

export type MetricType =
  | 'cpu'
  | 'memory'
  | 'disk'
  | 'network_in'
  | 'network_out'
  | 'requests'
  | 'response_time'
  | 'errors'
  | 'active_connections';

export interface LogEntry {
  id: string;
  applicationId: string;
  processId?: string;
  timestamp: Date;
  source: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, any>;
}

export type LogLevel =
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'fatal';

// =============================================================================
// Billing
// =============================================================================

export interface Invoice {
  id: string;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  total: number;
  currency: string;
  lineItems: LineItem[];
  createdAt: Date;
  paidAt?: Date;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  metadata: Record<string, any>;
}

export interface UsageRecord {
  applicationId: string;
  organizationId: string;
  timestamp: Date;
  resource: string;
  quantity: number;
  unit: string;
  cost: number;
}

// =============================================================================
// API Types
// =============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
    requestId?: string;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Database Types
// =============================================================================

export interface DatabaseConnection {
  id: string;
  applicationId: string;
  addonId: string;
  type: 'postgres' | 'mysql' | 'redis' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
  connectionUrl: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
}

// =============================================================================
// Storage Types
// =============================================================================

export interface StorageBlob {
  id: string;
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  etag: string;
  uploadedAt: Date;
  uploadedBy: string;
  metadata: Record<string, string>;
}

// =============================================================================
// Collaboration
// =============================================================================

export interface CollaboratorAccess {
  userId: string;
  applicationId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: Permission[];
  grantedAt: Date;
  grantedBy: string;
}

export type Permission =
  | 'view'
  | 'deploy'
  | 'scale'
  | 'manage_config'
  | 'manage_addons'
  | 'manage_domains'
  | 'manage_collaborators'
  | 'delete_app';

// =============================================================================
// Webhooks
// =============================================================================

export interface Webhook {
  id: string;
  applicationId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

export type WebhookEvent =
  | 'deployment.created'
  | 'deployment.succeeded'
  | 'deployment.failed'
  | 'build.started'
  | 'build.completed'
  | 'dyno.crashed'
  | 'domain.verified'
  | 'addon.created'
  | 'config.changed';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  nextAttemptAt?: Date;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date;
}
