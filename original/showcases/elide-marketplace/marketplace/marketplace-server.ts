#!/usr/bin/env elide

/**
 * Elide Service Marketplace Server
 *
 * Service marketplace for Elide services including:
 * - Database-as-a-Service
 * - ML-Model-as-a-Service
 * - API-as-a-Service
 * - Storage-as-a-Service
 * - Compute-as-a-Service
 */

import { serve, json, Request, Response } from "@elide/http";
import { Database } from "@elide/db";

// Service categories and types
export type ServiceCategory =
  | "database"
  | "api"
  | "ml-model"
  | "template"
  | "tool"
  | "storage"
  | "compute"
  | "analytics"
  | "messaging"
  | "monitoring";

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  longDescription: string;
  provider: string;
  providerId: string;
  version: string;
  logo?: string;
  pricing: ServicePricing;
  features: string[];
  specifications: ServiceSpecification;
  tags: string[];
  averageRating: number;
  totalReviews: number;
  activeDeployments: number;
  totalDeployments: number;
  status: "active" | "deprecated" | "beta";
  createdAt: Date;
  updatedAt: Date;
}

export interface ServicePricing {
  model: "free" | "payAsYouGo" | "subscription" | "custom" | "freemium";
  currency: string;
  tiers: PricingTier[];
  billingPeriod?: "hourly" | "daily" | "monthly" | "yearly";
  freeQuota?: {
    requests?: number;
    storage?: number;
    bandwidth?: number;
    units?: string;
  };
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: "hour" | "day" | "month" | "year" | "request" | "gb";
  features: string[];
  limits: {
    requests?: number;
    storage?: number;
    bandwidth?: number;
    users?: number;
    concurrent?: number;
    custom?: Record<string, number>;
  };
  highlighted?: boolean;
}

export interface ServiceSpecification {
  runtime?: string;
  memory?: string;
  cpu?: string;
  storage?: string;
  regions?: string[];
  protocols?: string[];
  authentication?: string[];
  sla?: {
    uptime: number;
    responseTime: number;
    support: string;
  };
  compliance?: string[];
  integrations?: string[];
}

export interface ServiceReview {
  id: string;
  serviceId: string;
  userId: string;
  username: string;
  rating: number;
  title: string;
  review: string;
  pros?: string[];
  cons?: string[];
  verified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceDeployment {
  id: string;
  serviceId: string;
  userId: string;
  name: string;
  status: "pending" | "provisioning" | "running" | "stopped" | "failed" | "terminated";
  config: DeploymentConfig;
  endpoint?: string;
  credentials?: Record<string, string>;
  region: string;
  tier: string;
  metrics: DeploymentMetrics;
  billing: BillingInfo;
  createdAt: Date;
  updatedAt: Date;
  terminatedAt?: Date;
}

export interface DeploymentConfig {
  tier: string;
  region: string;
  customDomain?: string;
  environment?: Record<string, string>;
  resources?: {
    memory?: string;
    cpu?: string;
    storage?: string;
  };
  scaling?: {
    min: number;
    max: number;
    target: number;
  };
}

export interface DeploymentMetrics {
  requests: number;
  errors: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  dataTransfer: number;
  uptime: number;
  lastMetricAt?: Date;
}

export interface BillingInfo {
  currentCost: number;
  projectedCost: number;
  currency: string;
  billingCycle: string;
  lastBilledAt?: Date;
  nextBillingAt?: Date;
}

// Database
const db = new Database("marketplace.db");

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    version TEXT NOT NULL,
    logo TEXT,
    pricing TEXT NOT NULL,
    features TEXT,
    specifications TEXT,
    tags TEXT,
    average_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    active_deployments INTEGER DEFAULT 0,
    total_deployments INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_reviews (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT,
    review TEXT,
    pros TEXT,
    cons TEXT,
    verified BOOLEAN DEFAULT 0,
    helpful INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    config TEXT NOT NULL,
    endpoint TEXT,
    credentials TEXT,
    region TEXT NOT NULL,
    tier TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    terminated_at DATETIME,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS deployment_metrics (
    deployment_id TEXT PRIMARY KEY,
    requests INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    p95_response_time REAL DEFAULT 0,
    data_transfer INTEGER DEFAULT 0,
    uptime REAL DEFAULT 100,
    last_metric_at DATETIME,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
  );

  CREATE TABLE IF NOT EXISTS billing (
    deployment_id TEXT PRIMARY KEY,
    current_cost REAL DEFAULT 0,
    projected_cost REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT,
    last_billed_at DATETIME,
    next_billing_at DATETIME,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
  );

  CREATE TABLE IF NOT EXISTS service_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    service_count INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
  CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
  CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
  CREATE INDEX IF NOT EXISTS idx_deployments_user ON deployments(user_id);
  CREATE INDEX IF NOT EXISTS idx_deployments_service ON deployments(service_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_service ON service_reviews(service_id);
`);

// Seed categories
const categories = [
  { id: "cat-db", name: "Databases", slug: "database", description: "Managed database services", icon: "database" },
  { id: "cat-api", name: "APIs", slug: "api", description: "Ready-to-use APIs", icon: "api" },
  { id: "cat-ml", name: "ML Models", slug: "ml-model", description: "Machine learning models", icon: "brain" },
  { id: "cat-tpl", name: "Templates", slug: "template", description: "Project templates", icon: "template" },
  { id: "cat-tool", name: "Tools", slug: "tool", description: "Development tools", icon: "tool" },
  { id: "cat-storage", name: "Storage", slug: "storage", description: "Object and file storage", icon: "storage" },
  { id: "cat-compute", name: "Compute", slug: "compute", description: "Serverless compute", icon: "server" },
  { id: "cat-analytics", name: "Analytics", slug: "analytics", description: "Analytics services", icon: "chart" },
  { id: "cat-msg", name: "Messaging", slug: "messaging", description: "Message queues", icon: "message" },
  { id: "cat-monitor", name: "Monitoring", slug: "monitoring", description: "Monitoring & observability", icon: "monitor" }
];

categories.forEach(cat => {
  db.prepare(`
    INSERT OR IGNORE INTO service_categories (id, name, slug, description, icon)
    VALUES (?, ?, ?, ?, ?)
  `).run(cat.id, cat.name, cat.slug, cat.description, cat.icon);
});

// Utility functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// API Handlers
async function handleListServices(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const sortBy = url.searchParams.get("sort") || "popular";
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = "SELECT * FROM services WHERE status = 'active'";
  const params: any[] = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Sorting
  switch (sortBy) {
    case "popular":
      query += " ORDER BY active_deployments DESC, average_rating DESC";
      break;
    case "rating":
      query += " ORDER BY average_rating DESC, total_reviews DESC";
      break;
    case "newest":
      query += " ORDER BY created_at DESC";
      break;
    case "price":
      query += " ORDER BY pricing ASC";
      break;
  }

  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const services = db.prepare(query).all(...params);

  return json({
    services: services.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
      description: s.description,
      provider: s.provider,
      version: s.version,
      logo: s.logo,
      pricing: JSON.parse(s.pricing),
      features: JSON.parse(s.features || "[]"),
      tags: JSON.parse(s.tags || "[]"),
      averageRating: s.average_rating,
      totalReviews: s.total_reviews,
      activeDeployments: s.active_deployments
    })),
    total: services.length,
    limit,
    offset
  });
}

async function handleGetService(req: Request, slug: string): Promise<Response> {
  const service = db.prepare("SELECT * FROM services WHERE slug = ? AND status = 'active'").get(slug);

  if (!service) {
    return json({ error: "Service not found" }, { status: 404 });
  }

  // Get recent reviews
  const reviews = db.prepare(`
    SELECT * FROM service_reviews
    WHERE service_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(service.id);

  return json({
    id: service.id,
    name: service.name,
    slug: service.slug,
    category: service.category,
    description: service.description,
    longDescription: service.long_description,
    provider: service.provider,
    version: service.version,
    logo: service.logo,
    pricing: JSON.parse(service.pricing),
    features: JSON.parse(service.features || "[]"),
    specifications: JSON.parse(service.specifications || "{}"),
    tags: JSON.parse(service.tags || "[]"),
    averageRating: service.average_rating,
    totalReviews: service.total_reviews,
    activeDeployments: service.active_deployments,
    totalDeployments: service.total_deployments,
    status: service.status,
    reviews: reviews.map(r => ({
      id: r.id,
      username: r.username,
      rating: r.rating,
      title: r.title,
      review: r.review,
      pros: JSON.parse(r.pros || "[]"),
      cons: JSON.parse(r.cons || "[]"),
      verified: r.verified === 1,
      helpful: r.helpful,
      createdAt: r.created_at
    }))
  });
}

async function handleDeployService(req: Request): Promise<Response> {
  // This would require authentication
  const data = await req.json();
  const { serviceId, name, config } = data;

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);

  if (!service) {
    return json({ error: "Service not found" }, { status: 404 });
  }

  const deploymentId = generateId();
  const region = config.region || "us-east-1";
  const tier = config.tier || "free";

  // Generate endpoint
  const endpoint = `https://${deploymentId}.${slugify(service.name)}.elide.services`;

  // Create deployment
  db.prepare(`
    INSERT INTO deployments (id, service_id, user_id, name, status, config, endpoint, region, tier)
    VALUES (?, ?, ?, ?, 'provisioning', ?, ?, ?, ?)
  `).run(deploymentId, serviceId, "user-123", name, JSON.stringify(config), endpoint, region, tier);

  // Initialize metrics
  db.prepare(`
    INSERT INTO deployment_metrics (deployment_id)
    VALUES (?)
  `).run(deploymentId);

  // Initialize billing
  const pricing = JSON.parse(service.pricing);
  const tierInfo = pricing.tiers.find((t: any) => t.id === tier) || pricing.tiers[0];

  db.prepare(`
    INSERT INTO billing (deployment_id, currency, billing_cycle)
    VALUES (?, ?, ?)
  `).run(deploymentId, pricing.currency, pricing.billingPeriod || "monthly");

  // Update service deployment count
  db.prepare(`
    UPDATE services
    SET active_deployments = active_deployments + 1,
        total_deployments = total_deployments + 1
    WHERE id = ?
  `).run(serviceId);

  // Simulate provisioning
  setTimeout(() => {
    db.prepare("UPDATE deployments SET status = 'running' WHERE id = ?").run(deploymentId);
  }, 5000);

  return json({
    deploymentId,
    name,
    status: "provisioning",
    endpoint,
    estimatedTime: "5-10 seconds",
    credentials: {
      // Would generate real credentials
      apiKey: generateId()
    }
  }, { status: 202 });
}

async function handleGetDeployment(req: Request, id: string): Promise<Response> {
  const deployment = db.prepare("SELECT * FROM deployments WHERE id = ?").get(id);

  if (!deployment) {
    return json({ error: "Deployment not found" }, { status: 404 });
  }

  const metrics = db.prepare("SELECT * FROM deployment_metrics WHERE deployment_id = ?").get(id);
  const billing = db.prepare("SELECT * FROM billing WHERE deployment_id = ?").get(id);
  const service = db.prepare("SELECT name, logo FROM services WHERE id = ?").get(deployment.service_id);

  return json({
    id: deployment.id,
    serviceId: deployment.service_id,
    serviceName: service?.name,
    serviceLogo: service?.logo,
    name: deployment.name,
    status: deployment.status,
    config: JSON.parse(deployment.config),
    endpoint: deployment.endpoint,
    region: deployment.region,
    tier: deployment.tier,
    metrics: metrics ? {
      requests: metrics.requests,
      errors: metrics.errors,
      avgResponseTime: metrics.avg_response_time,
      p95ResponseTime: metrics.p95_response_time,
      dataTransfer: metrics.data_transfer,
      uptime: metrics.uptime,
      lastMetricAt: metrics.last_metric_at
    } : null,
    billing: billing ? {
      currentCost: billing.current_cost,
      projectedCost: billing.projected_cost,
      currency: billing.currency,
      billingCycle: billing.billing_cycle,
      nextBillingAt: billing.next_billing_at
    } : null,
    createdAt: deployment.created_at,
    updatedAt: deployment.updated_at
  });
}

async function handleListDeployments(req: Request): Promise<Response> {
  // Would filter by authenticated user
  const deployments = db.prepare(`
    SELECT d.*, s.name as service_name, s.logo as service_logo
    FROM deployments d
    JOIN services s ON d.service_id = s.id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
  `).all("user-123");

  return json({
    deployments: deployments.map(d => ({
      id: d.id,
      serviceId: d.service_id,
      serviceName: d.service_name,
      serviceLogo: d.service_logo,
      name: d.name,
      status: d.status,
      endpoint: d.endpoint,
      region: d.region,
      tier: d.tier,
      createdAt: d.created_at
    }))
  });
}

async function handleStopDeployment(req: Request, id: string): Promise<Response> {
  const deployment = db.prepare("SELECT * FROM deployments WHERE id = ?").get(id);

  if (!deployment) {
    return json({ error: "Deployment not found" }, { status: 404 });
  }

  db.prepare("UPDATE deployments SET status = 'stopped', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(id);

  db.prepare("UPDATE services SET active_deployments = active_deployments - 1 WHERE id = ?")
    .run(deployment.service_id);

  return json({ success: true, status: "stopped" });
}

async function handleCreateReview(req: Request, serviceId: string): Promise<Response> {
  const data = await req.json();
  const { rating, title, review, pros, cons } = data;

  if (!rating || rating < 1 || rating > 5) {
    return json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);

  if (!service) {
    return json({ error: "Service not found" }, { status: 404 });
  }

  const reviewId = generateId();

  db.prepare(`
    INSERT INTO service_reviews (id, service_id, user_id, username, rating, title, review, pros, cons)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reviewId,
    serviceId,
    "user-123",
    "demo-user",
    rating,
    title,
    review,
    JSON.stringify(pros || []),
    JSON.stringify(cons || [])
  );

  // Recalculate average rating
  const stats = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as count
    FROM service_reviews WHERE service_id = ?
  `).get(serviceId);

  db.prepare(`
    UPDATE services SET average_rating = ?, total_reviews = ? WHERE id = ?
  `).run(stats.avg, stats.count, serviceId);

  return json({ success: true, reviewId }, { status: 201 });
}

async function handleGetCategories(req: Request): Promise<Response> {
  const categories = db.prepare(`
    SELECT c.*, COUNT(s.id) as service_count
    FROM service_categories c
    LEFT JOIN services s ON c.slug = s.category AND s.status = 'active'
    GROUP BY c.id
    ORDER BY service_count DESC
  `).all();

  return json({ categories });
}

// Request router
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  try {
    // Services
    if (path === "/api/services" && method === "GET") {
      return await handleListServices(req);
    }

    const serviceMatch = path.match(/^\/api\/services\/([^\/]+)$/);
    if (serviceMatch && method === "GET") {
      return await handleGetService(req, serviceMatch[1]);
    }

    // Deployments
    if (path === "/api/deployments" && method === "GET") {
      return await handleListDeployments(req);
    }

    if (path === "/api/deployments" && method === "POST") {
      return await handleDeployService(req);
    }

    const deploymentMatch = path.match(/^\/api\/deployments\/([^\/]+)$/);
    if (deploymentMatch && method === "GET") {
      return await handleGetDeployment(req, deploymentMatch[1]);
    }

    const stopMatch = path.match(/^\/api\/deployments\/([^\/]+)\/stop$/);
    if (stopMatch && method === "POST") {
      return await handleStopDeployment(req, stopMatch[1]);
    }

    // Reviews
    const reviewMatch = path.match(/^\/api\/services\/([^\/]+)\/reviews$/);
    if (reviewMatch && method === "POST") {
      return await handleCreateReview(req, reviewMatch[1]);
    }

    // Categories
    if (path === "/api/categories" && method === "GET") {
      return await handleGetCategories(req);
    }

    return json({ error: "Not found" }, { status: 404 });

  } catch (error) {
    console.error("Marketplace error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

const PORT = parseInt(Deno.env.get("MARKETPLACE_PORT") || "3001");

console.log(`
🛍️  Elide Service Marketplace
   Port: ${PORT}

   Browse services: /api/services
   Deploy service: POST /api/deployments
   Manage deployments: /api/deployments
`);

serve(handleRequest, { port: PORT });
