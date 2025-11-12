#!/usr/bin/env elide

/**
 * Elide Marketplace Platform - Main API Server
 *
 * Complete marketplace platform for Elide packages and services
 * Features:
 * - npm-compatible package registry
 * - Service marketplace
 * - Authentication and authorization
 * - Analytics and monitoring
 * - Billing integration
 * - Webhook support
 */

import { serve, json, Request, Response } from "@elide/http";
import { Database } from "@elide/db";

// Types and Interfaces
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "publisher" | "admin";
  apiTokens: ApiToken[];
  createdAt: Date;
  updatedAt: Date;
}

interface ApiToken {
  id: string;
  userId: string;
  token: string;
  name: string;
  scopes: string[];
  expiresAt?: Date;
  createdAt: Date;
}

interface Package {
  id: string;
  name: string;
  scope?: string;
  description: string;
  versions: PackageVersion[];
  maintainers: string[];
  keywords: string[];
  license: string;
  repository?: string;
  homepage?: string;
  downloads: number;
  stars: number;
  score: PackageScore;
  createdAt: Date;
  updatedAt: Date;
}

interface PackageVersion {
  version: string;
  description: string;
  tarball: string;
  shasum: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  scripts: Record<string, string>;
  main?: string;
  types?: string;
  publishedBy: string;
  publishedAt: Date;
  deprecated?: string;
}

interface PackageScore {
  quality: number;    // 0-100
  popularity: number; // 0-100
  maintenance: number; // 0-100
  overall: number;    // weighted average
}

interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  provider: string;
  pricing: ServicePricing;
  features: string[];
  specifications: Record<string, any>;
  health: ServiceHealth;
  ratings: ServiceRating[];
  averageRating: number;
  totalReviews: number;
  deployments: number;
  createdAt: Date;
  updatedAt: Date;
}

type ServiceCategory =
  | "database"
  | "api"
  | "ml-model"
  | "template"
  | "tool"
  | "storage"
  | "compute";

interface ServicePricing {
  model: "free" | "payAsYouGo" | "subscription" | "custom";
  tiers: PricingTier[];
}

interface PricingTier {
  name: string;
  price: number;
  currency: string;
  period: "hour" | "day" | "month" | "year";
  features: string[];
  limits: Record<string, number>;
}

interface ServiceHealth {
  status: "healthy" | "degraded" | "down";
  uptime: number; // percentage
  latency: number; // ms
  lastChecked: Date;
}

interface ServiceRating {
  userId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: Date;
}

interface Deployment {
  id: string;
  serviceId: string;
  userId: string;
  status: "pending" | "running" | "stopped" | "failed";
  config: Record<string, any>;
  endpoint?: string;
  metrics: DeploymentMetrics;
  createdAt: Date;
  updatedAt: Date;
}

interface DeploymentMetrics {
  requests: number;
  errors: number;
  avgResponseTime: number;
  dataTransfer: number; // bytes
  uptime: number; // seconds
}

interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  deliveries: WebhookDelivery[];
  createdAt: Date;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: "pending" | "success" | "failed";
  attempts: number;
  response?: string;
  deliveredAt?: Date;
}

// Database Schema
const db = new Database("marketplace.db");

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    scopes TEXT NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    scope TEXT,
    description TEXT,
    maintainers TEXT NOT NULL,
    keywords TEXT,
    license TEXT,
    repository TEXT,
    homepage TEXT,
    downloads INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS package_versions (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    tarball TEXT NOT NULL,
    shasum TEXT NOT NULL,
    dependencies TEXT,
    dev_dependencies TEXT,
    peer_dependencies TEXT,
    scripts TEXT,
    main_file TEXT,
    types_file TEXT,
    published_by TEXT NOT NULL,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deprecated TEXT,
    FOREIGN KEY (package_id) REFERENCES packages(id),
    UNIQUE(package_id, version)
  );

  CREATE TABLE IF NOT EXISTS package_scores (
    package_id TEXT PRIMARY KEY,
    quality REAL DEFAULT 0,
    popularity REAL DEFAULT 0,
    maintenance REAL DEFAULT 0,
    overall REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL,
    pricing TEXT NOT NULL,
    features TEXT,
    specifications TEXT,
    average_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    deployments INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_health (
    service_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'healthy',
    uptime REAL DEFAULT 100,
    latency REAL DEFAULT 0,
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS service_ratings (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    config TEXT NOT NULL,
    endpoint TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS deployment_metrics (
    deployment_id TEXT PRIMARY KEY,
    requests INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    data_transfer INTEGER DEFAULT 0,
    uptime INTEGER DEFAULT 0,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
  );

  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    secret TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id TEXT PRIMARY KEY,
    webhook_id TEXT NOT NULL,
    event TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    response TEXT,
    delivered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
  CREATE INDEX IF NOT EXISTS idx_packages_scope ON packages(scope);
  CREATE INDEX IF NOT EXISTS idx_package_versions_package ON package_versions(package_id);
  CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
  CREATE INDEX IF NOT EXISTS idx_deployments_user ON deployments(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics(entity_type, entity_id);
`);

// Utility Functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function hashPassword(password: string): string {
  // In production, use bcrypt or argon2
  // This is a simplified example
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function verifyToken(token: string): User | null {
  const result = db.prepare(`
    SELECT u.* FROM users u
    JOIN api_tokens t ON u.id = t.user_id
    WHERE t.token = ? AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))
  `).get(token);

  return result ? {
    id: result.id,
    username: result.username,
    email: result.email,
    passwordHash: result.password_hash,
    role: result.role,
    apiTokens: [],
    createdAt: new Date(result.created_at),
    updatedAt: new Date(result.updated_at)
  } : null;
}

function requireAuth(req: Request): User | Response {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    return json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return user;
}

function calculatePackageScore(pkg: Package): PackageScore {
  // Quality score based on:
  // - Has README, LICENSE, tests
  // - TypeScript types available
  // - Dependencies up to date
  const quality = 75 + Math.random() * 25; // Simplified

  // Popularity score based on:
  // - Downloads
  // - Stars
  // - Dependents
  const popularity = Math.min(100, (pkg.downloads / 1000) + (pkg.stars * 2));

  // Maintenance score based on:
  // - Recent commits
  // - Issue response time
  // - Version frequency
  const maintenance = 60 + Math.random() * 40; // Simplified

  const overall = (quality * 0.3) + (popularity * 0.4) + (maintenance * 0.3);

  return { quality, popularity, maintenance, overall };
}

async function trackAnalytics(
  entityType: string,
  entityId: string,
  eventType: string,
  metadata?: any
) {
  db.prepare(`
    INSERT INTO analytics (id, entity_type, entity_id, event_type, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    generateId(),
    entityType,
    entityId,
    eventType,
    metadata ? JSON.stringify(metadata) : null
  );
}

async function triggerWebhooks(event: string, payload: any) {
  const webhooks = db.prepare(`
    SELECT * FROM webhooks WHERE active = 1 AND events LIKE ?
  `).all(`%${event}%`);

  for (const webhook of webhooks) {
    const deliveryId = generateId();

    // Store delivery record
    db.prepare(`
      INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(deliveryId, webhook.id, event, JSON.stringify(payload));

    // Async delivery (in production, use a queue)
    fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhook.secret,
        "X-Webhook-Event": event
      },
      body: JSON.stringify(payload)
    }).then(response => {
      db.prepare(`
        UPDATE webhook_deliveries
        SET status = ?, response = ?, delivered_at = datetime('now'), attempts = attempts + 1
        WHERE id = ?
      `).run(
        response.ok ? "success" : "failed",
        response.statusText,
        deliveryId
      );
    }).catch(error => {
      db.prepare(`
        UPDATE webhook_deliveries
        SET status = 'failed', response = ?, attempts = attempts + 1
        WHERE id = ?
      `).run(error.message, deliveryId);
    });
  }
}

// API Routes

// Health check
async function handleHealth(req: Request): Promise<Response> {
  return json({
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      registry: "operational",
      marketplace: "operational"
    }
  });
}

// Authentication endpoints
async function handleRegister(req: Request): Promise<Response> {
  const data = await req.json();
  const { username, email, password } = data;

  if (!username || !email || !password) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if user exists
  const existing = db.prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);

  if (existing) {
    return json({ error: "User already exists" }, { status: 409 });
  }

  const userId = generateId();
  const passwordHash = hashPassword(password);

  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, 'user')
  `).run(userId, username, email, passwordHash);

  // Create default API token
  const token = generateToken();
  db.prepare(`
    INSERT INTO api_tokens (id, user_id, token, name, scopes)
    VALUES (?, ?, ?, 'default', 'read,write,publish')
  `).run(generateId(), userId, token);

  await trackAnalytics("user", userId, "registered");

  return json({
    userId,
    username,
    email,
    token
  }, { status: 201 });
}

async function handleLogin(req: Request): Promise<Response> {
  const data = await req.json();
  const { username, password } = data;

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = generateToken();
  db.prepare(`
    INSERT INTO api_tokens (id, user_id, token, name, scopes)
    VALUES (?, ?, ?, 'login-session', 'read,write,publish')
  `).run(generateId(), user.id, token);

  await trackAnalytics("user", user.id, "logged_in");

  return json({
    userId: user.id,
    username: user.username,
    token
  });
}

// Package Registry endpoints (npm-compatible)
async function handlePackagePublish(req: Request): Promise<Response> {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const data = await req.json();
  const { name, version, description, tarball, dependencies = {}, devDependencies = {}, license } = data;

  // Check if package exists
  let pkg = db.prepare("SELECT * FROM packages WHERE name = ?").get(name);

  if (!pkg) {
    // Create new package
    const packageId = generateId();
    db.prepare(`
      INSERT INTO packages (id, name, description, maintainers, license)
      VALUES (?, ?, ?, ?, ?)
    `).run(packageId, name, description, JSON.stringify([user.username]), license);

    pkg = { id: packageId };
  } else {
    // Verify maintainer
    const maintainers = JSON.parse(pkg.maintainers);
    if (!maintainers.includes(user.username)) {
      return json({ error: "Not authorized to publish this package" }, { status: 403 });
    }
  }

  // Check if version exists
  const existingVersion = db.prepare(
    "SELECT version FROM package_versions WHERE package_id = ? AND version = ?"
  ).get(pkg.id, version);

  if (existingVersion) {
    return json({ error: "Version already exists" }, { status: 409 });
  }

  // Create package version
  db.prepare(`
    INSERT INTO package_versions (
      id, package_id, version, description, tarball, shasum,
      dependencies, dev_dependencies, published_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    generateId(),
    pkg.id,
    version,
    description,
    tarball,
    generateId(), // shasum placeholder
    JSON.stringify(dependencies),
    JSON.stringify(devDependencies),
    user.username
  );

  // Update package score
  const score = calculatePackageScore({ ...pkg, downloads: 0, stars: 0 } as Package);
  db.prepare(`
    INSERT OR REPLACE INTO package_scores (package_id, quality, popularity, maintenance, overall)
    VALUES (?, ?, ?, ?, ?)
  `).run(pkg.id, score.quality, score.popularity, score.maintenance, score.overall);

  await trackAnalytics("package", pkg.id, "version_published", { version });
  await triggerWebhooks("package.published", { name, version });

  return json({
    success: true,
    package: name,
    version
  }, { status: 201 });
}

async function handlePackageGet(req: Request, name: string): Promise<Response> {
  const pkg = db.prepare(`
    SELECT p.*, ps.quality, ps.popularity, ps.maintenance, ps.overall
    FROM packages p
    LEFT JOIN package_scores ps ON p.id = ps.package_id
    WHERE p.name = ?
  `).get(name);

  if (!pkg) {
    return json({ error: "Package not found" }, { status: 404 });
  }

  const versions = db.prepare(
    "SELECT * FROM package_versions WHERE package_id = ? ORDER BY published_at DESC"
  ).all(pkg.id);

  await trackAnalytics("package", pkg.id, "viewed");

  return json({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    maintainers: JSON.parse(pkg.maintainers),
    license: pkg.license,
    downloads: pkg.downloads,
    stars: pkg.stars,
    score: {
      quality: pkg.quality,
      popularity: pkg.popularity,
      maintenance: pkg.maintenance,
      overall: pkg.overall
    },
    versions: versions.map(v => ({
      version: v.version,
      description: v.description,
      tarball: v.tarball,
      dependencies: JSON.parse(v.dependencies || "{}"),
      publishedAt: v.published_at
    }))
  });
}

async function handlePackageSearch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const packages = db.prepare(`
    SELECT p.*, ps.overall as score
    FROM packages p
    LEFT JOIN package_scores ps ON p.id = ps.package_id
    WHERE p.name LIKE ? OR p.description LIKE ?
    ORDER BY ps.overall DESC, p.downloads DESC
    LIMIT ? OFFSET ?
  `).all(`%${query}%`, `%${query}%`, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM packages
    WHERE name LIKE ? OR description LIKE ?
  `).get(`%${query}%`, `%${query}%`);

  return json({
    results: packages.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      downloads: p.downloads,
      score: p.score
    })),
    total: total.count,
    limit,
    offset
  });
}

async function handlePackageDownload(req: Request, name: string, version: string): Promise<Response> {
  const pkg = db.prepare("SELECT * FROM packages WHERE name = ?").get(name);

  if (!pkg) {
    return json({ error: "Package not found" }, { status: 404 });
  }

  const pkgVersion = db.prepare(
    "SELECT * FROM package_versions WHERE package_id = ? AND version = ?"
  ).get(pkg.id, version);

  if (!pkgVersion) {
    return json({ error: "Version not found" }, { status: 404 });
  }

  // Increment download count
  db.prepare("UPDATE packages SET downloads = downloads + 1 WHERE id = ?").run(pkg.id);

  await trackAnalytics("package", pkg.id, "downloaded", { version });

  return Response.redirect(pkgVersion.tarball);
}

// Service Marketplace endpoints
async function handleServiceList(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = `
    SELECT s.*, sh.status, sh.uptime, sh.latency
    FROM services s
    LEFT JOIN service_health sh ON s.id = sh.service_id
  `;

  const params: any[] = [];

  if (category) {
    query += " WHERE s.category = ?";
    params.push(category);
  }

  query += " ORDER BY s.average_rating DESC, s.deployments DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const services = db.prepare(query).all(...params);

  return json({
    services: services.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      provider: s.provider,
      averageRating: s.average_rating,
      totalReviews: s.total_reviews,
      deployments: s.deployments,
      health: {
        status: s.status,
        uptime: s.uptime,
        latency: s.latency
      }
    })),
    total: services.length
  });
}

async function handleServiceGet(req: Request, id: string): Promise<Response> {
  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(id);

  if (!service) {
    return json({ error: "Service not found" }, { status: 404 });
  }

  const health = db.prepare("SELECT * FROM service_health WHERE service_id = ?").get(id);
  const ratings = db.prepare(
    "SELECT * FROM service_ratings WHERE service_id = ? ORDER BY created_at DESC LIMIT 10"
  ).all(id);

  await trackAnalytics("service", id, "viewed");

  return json({
    id: service.id,
    name: service.name,
    category: service.category,
    description: service.description,
    provider: service.provider,
    pricing: JSON.parse(service.pricing),
    features: JSON.parse(service.features || "[]"),
    specifications: JSON.parse(service.specifications || "{}"),
    averageRating: service.average_rating,
    totalReviews: service.total_reviews,
    deployments: service.deployments,
    health: health || { status: "unknown" },
    recentRatings: ratings
  });
}

async function handleServiceDeploy(req: Request): Promise<Response> {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const data = await req.json();
  const { serviceId, config } = data;

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);

  if (!service) {
    return json({ error: "Service not found" }, { status: 404 });
  }

  const deploymentId = generateId();
  const endpoint = `https://${deploymentId}.elide-services.dev`;

  db.prepare(`
    INSERT INTO deployments (id, service_id, user_id, status, config, endpoint)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(deploymentId, serviceId, user.id, JSON.stringify(config), endpoint);

  db.prepare(`
    INSERT INTO deployment_metrics (deployment_id)
    VALUES (?)
  `).run(deploymentId);

  // Update service deployment count
  db.prepare("UPDATE services SET deployments = deployments + 1 WHERE id = ?").run(serviceId);

  await trackAnalytics("service", serviceId, "deployed");
  await triggerWebhooks("service.deployed", { serviceId, deploymentId, userId: user.id });

  // Simulate deployment process
  setTimeout(() => {
    db.prepare("UPDATE deployments SET status = 'running' WHERE id = ?").run(deploymentId);
  }, 5000);

  return json({
    deploymentId,
    status: "pending",
    endpoint,
    estimatedTime: "5 seconds"
  }, { status: 202 });
}

async function handleServiceRate(req: Request, id: string): Promise<Response> {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const data = await req.json();
  const { rating, review } = data;

  if (!rating || rating < 1 || rating > 5) {
    return json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(id);

  if (!service) {
    return json({ error: "Service not found" }, { status: 404 });
  }

  // Check if user already rated
  const existing = db.prepare(
    "SELECT id FROM service_ratings WHERE service_id = ? AND user_id = ?"
  ).get(id, user.id);

  if (existing) {
    db.prepare(`
      UPDATE service_ratings SET rating = ?, review = ? WHERE id = ?
    `).run(rating, review, existing.id);
  } else {
    db.prepare(`
      INSERT INTO service_ratings (id, service_id, user_id, rating, review)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateId(), id, user.id, rating, review);
  }

  // Recalculate average rating
  const stats = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as count
    FROM service_ratings WHERE service_id = ?
  `).get(id);

  db.prepare(`
    UPDATE services SET average_rating = ?, total_reviews = ? WHERE id = ?
  `).run(stats.avg, stats.count, id);

  await trackAnalytics("service", id, "rated", { rating });

  return json({ success: true });
}

// Analytics endpoints
async function handleAnalytics(req: Request): Promise<Response> {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const entityType = url.searchParams.get("type");
  const entityId = url.searchParams.get("id");
  const days = parseInt(url.searchParams.get("days") || "30");

  let query = `
    SELECT
      DATE(created_at) as date,
      event_type,
      COUNT(*) as count
    FROM analytics
    WHERE created_at >= datetime('now', '-${days} days')
  `;

  const params: any[] = [];

  if (entityType) {
    query += " AND entity_type = ?";
    params.push(entityType);
  }

  if (entityId) {
    query += " AND entity_id = ?";
    params.push(entityId);
  }

  query += " GROUP BY DATE(created_at), event_type ORDER BY date DESC";

  const analytics = db.prepare(query).all(...params);

  return json({
    period: `${days} days`,
    analytics
  });
}

// Webhook endpoints
async function handleWebhookCreate(req: Request): Promise<Response> {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const data = await req.json();
  const { url, events } = data;

  if (!url || !events || !Array.isArray(events)) {
    return json({ error: "Invalid webhook configuration" }, { status: 400 });
  }

  const webhookId = generateId();
  const secret = generateToken();

  db.prepare(`
    INSERT INTO webhooks (id, user_id, url, events, secret)
    VALUES (?, ?, ?, ?, ?)
  `).run(webhookId, user.id, url, JSON.stringify(events), secret);

  return json({
    webhookId,
    url,
    events,
    secret
  }, { status: 201 });
}

async function handleWebhookList(req: Request): Promise<Response> {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const webhooks = db.prepare("SELECT * FROM webhooks WHERE user_id = ?").all(user.id);

  return json({
    webhooks: webhooks.map(w => ({
      id: w.id,
      url: w.url,
      events: JSON.parse(w.events),
      active: w.active === 1,
      createdAt: w.created_at
    }))
  });
}

// Main request router
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  try {
    // Health check
    if (path === "/health" && method === "GET") {
      return await handleHealth(req);
    }

    // Authentication
    if (path === "/api/auth/register" && method === "POST") {
      return await handleRegister(req);
    }
    if (path === "/api/auth/login" && method === "POST") {
      return await handleLogin(req);
    }

    // Package Registry API (npm-compatible)
    if (path.startsWith("/api/packages")) {
      if (path === "/api/packages" && method === "POST") {
        return await handlePackagePublish(req);
      }
      if (path === "/api/packages/search" && method === "GET") {
        return await handlePackageSearch(req);
      }

      const packageMatch = path.match(/^\/api\/packages\/([^\/]+)$/);
      if (packageMatch && method === "GET") {
        return await handlePackageGet(req, packageMatch[1]);
      }

      const downloadMatch = path.match(/^\/api\/packages\/([^\/]+)\/([^\/]+)\/download$/);
      if (downloadMatch && method === "GET") {
        return await handlePackageDownload(req, downloadMatch[1], downloadMatch[2]);
      }
    }

    // Service Marketplace API
    if (path.startsWith("/api/services")) {
      if (path === "/api/services" && method === "GET") {
        return await handleServiceList(req);
      }
      if (path === "/api/services/deploy" && method === "POST") {
        return await handleServiceDeploy(req);
      }

      const serviceMatch = path.match(/^\/api\/services\/([^\/]+)$/);
      if (serviceMatch && method === "GET") {
        return await handleServiceGet(req, serviceMatch[1]);
      }

      const rateMatch = path.match(/^\/api\/services\/([^\/]+)\/rate$/);
      if (rateMatch && method === "POST") {
        return await handleServiceRate(req, rateMatch[1]);
      }
    }

    // Analytics API
    if (path === "/api/analytics" && method === "GET") {
      return await handleAnalytics(req);
    }

    // Webhook API
    if (path.startsWith("/api/webhooks")) {
      if (path === "/api/webhooks" && method === "GET") {
        return await handleWebhookList(req);
      }
      if (path === "/api/webhooks" && method === "POST") {
        return await handleWebhookCreate(req);
      }
    }

    // Default 404
    return json({ error: "Not found" }, { status: 404 });

  } catch (error) {
    console.error("Error handling request:", error);
    return json({
      error: "Internal server error",
      message: error.message
    }, { status: 500 });
  }
}

// Start server
const PORT = parseInt(Deno.env.get("PORT") || "3000");

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           Elide Marketplace Platform v1.0.0                  ║
║                                                              ║
║  Package Registry  •  Service Marketplace  •  Analytics      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

🚀 Server starting on http://localhost:${PORT}

📦 Package Registry API:
   POST   /api/packages              - Publish package
   GET    /api/packages/search       - Search packages
   GET    /api/packages/:name        - Get package details
   GET    /api/packages/:name/:ver/download - Download package

🛍️  Service Marketplace API:
   GET    /api/services              - List services
   GET    /api/services/:id          - Get service details
   POST   /api/services/deploy       - Deploy service
   POST   /api/services/:id/rate     - Rate service

🔐 Authentication API:
   POST   /api/auth/register         - Register user
   POST   /api/auth/login            - Login user

📊 Analytics API:
   GET    /api/analytics             - Get analytics data

🪝 Webhook API:
   GET    /api/webhooks              - List webhooks
   POST   /api/webhooks              - Create webhook

Ready to serve!
`);

serve(handleRequest, { port: PORT });
