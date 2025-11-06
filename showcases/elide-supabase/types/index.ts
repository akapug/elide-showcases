/**
 * Core type definitions for ElideSupabase
 */

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseConfig {
  type: 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  poolSize?: number;
  ssl?: boolean;
  migrations?: {
    enabled: boolean;
    autoRun: boolean;
    directory: string;
  };
}

export interface Table {
  name: string;
  schema: string;
  columns: Column[];
  primaryKey: string[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
  policies: RLSPolicy[];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  unique: boolean;
  autoIncrement: boolean;
}

export interface ForeignKey {
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
  type?: 'BTREE' | 'HASH' | 'GIN' | 'GIST';
}

export interface RLSPolicy {
  name: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  withCheck?: string;
  roles: string[];
}

// ============================================================================
// API Types
// ============================================================================

export interface APIConfig {
  host: string;
  port: number;
  cors?: CORSConfig;
  rateLimit?: RateLimitConfig;
  maxRequestSize?: number;
}

export interface CORSConfig {
  enabled: boolean;
  origins: string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

export interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
  user?: User;
}

export interface APIResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
  };
  providers: {
    email?: EmailAuthConfig;
    google?: OAuthConfig;
    github?: OAuthConfig;
    magicLink?: MagicLinkConfig;
  };
  passwordPolicy?: PasswordPolicy;
  sessionDuration?: number;
}

export interface EmailAuthConfig {
  enabled: boolean;
  requireEmailVerification: boolean;
  verificationTokenExpiry: number;
}

export interface OAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface MagicLinkConfig {
  enabled: boolean;
  tokenExpiry: number;
  emailTemplate?: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageConfig {
  provider: 'local' | 's3' | 'gcs';
  basePath: string;
  maxFileSize: number;
  allowedMimeTypes?: string[];
  cdn?: CDNConfig;
  transformations?: TransformationConfig;
}

export interface CDNConfig {
  enabled: boolean;
  host: string;
  port: number;
  cacheControl?: string;
  compression: boolean;
}

export interface TransformationConfig {
  enabled: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  formats?: string[];
}

export interface StorageObject {
  id: string;
  bucket: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  metadata: Record<string, any>;
  ownerId?: string;
  public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bucket {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
  policies: RLSPolicy[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Edge Functions Types
// ============================================================================

export interface FunctionConfig {
  directory: string;
  timeout: number;
  memoryLimit: number;
  concurrency: number;
  languages: string[];
}

export interface EdgeFunction {
  id: string;
  name: string;
  language: 'typescript' | 'python' | 'ruby' | 'java' | 'kotlin';
  code: string;
  handler: string;
  runtime: string;
  environment: Record<string, string>;
  timeout: number;
  memoryLimit: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface FunctionInvocation {
  id: string;
  functionId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input: any;
  output?: any;
  error?: string;
  duration?: number;
  memoryUsed?: number;
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookConfig {
  enabled: boolean;
  retries: number;
  timeout: number;
}

export interface Webhook {
  id: string;
  name: string;
  table: string;
  events: WebhookEvent[];
  url?: string;
  functionId?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface WebhookPayload {
  event: WebhookEvent;
  table: string;
  schema: string;
  old?: Record<string, any>;
  new?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// Real-time Types
// ============================================================================

export interface RealtimeConfig {
  host: string;
  port: number;
  maxConnections: number;
  heartbeatInterval: number;
}

export interface Subscription {
  id: string;
  connectionId: string;
  table: string;
  filter?: Record<string, any>;
  events: SubscriptionEvent[];
  userId?: string;
  createdAt: Date;
}

export type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeMessage {
  type: 'subscribe' | 'unsubscribe' | 'event';
  subscription?: string;
  table?: string;
  filter?: Record<string, any>;
  events?: SubscriptionEvent[];
  payload?: any;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardConfig {
  enabled: boolean;
  host: string;
  port: number;
  adminEmail?: string;
}

export interface DashboardStats {
  tables: number;
  rows: number;
  storage: {
    used: number;
    limit: number;
  };
  users: {
    total: number;
    active: number;
  };
  functions: {
    total: number;
    invocations: number;
  };
  api: {
    requests: number;
    errors: number;
  };
}

// ============================================================================
// Query Types
// ============================================================================

export interface Query {
  table: string;
  select?: string[];
  filter?: Filter[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface Filter {
  column: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'is'
  | 'not';

export interface OrderBy {
  column: string;
  direction: 'asc' | 'desc';
  nulls?: 'first' | 'last';
}

export interface QueryResult {
  data: any[];
  count?: number;
  error?: string;
}

// ============================================================================
// Migration Types
// ============================================================================

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  timestamp: Date;
  appliedAt?: Date;
}

// ============================================================================
// Logging Types
// ============================================================================

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  output: 'console' | 'file' | 'both';
  file?: string;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}
