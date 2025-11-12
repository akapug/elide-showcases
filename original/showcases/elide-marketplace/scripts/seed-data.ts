#!/usr/bin/env elide

/**
 * Database Seeding Script
 *
 * Seeds the marketplace with sample data for demonstration
 */

import { Database } from "@elide/db";

const db = new Database("marketplace.db");

console.log("Seeding marketplace database...\n");

// Seed users
console.log("Creating sample users...");
const users = [
  {
    id: "user-admin",
    username: "admin",
    email: "admin@elide.dev",
    passwordHash: Buffer.from("admin123").toString("base64"),
    role: "admin"
  },
  {
    id: "user-publisher",
    username: "publisher",
    email: "publisher@elide.dev",
    passwordHash: Buffer.from("publisher123").toString("base64"),
    role: "publisher"
  },
  {
    id: "user-demo",
    username: "demo",
    email: "demo@elide.dev",
    passwordHash: Buffer.from("demo123").toString("base64"),
    role: "user"
  }
];

users.forEach(user => {
  db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.username, user.email, user.passwordHash, user.role);

  // Create API token for each user
  const token = `token_${user.username}_${Math.random().toString(36).substr(2, 32)}`;
  db.prepare(`
    INSERT OR IGNORE INTO api_tokens (id, user_id, token, name, scopes)
    VALUES (?, ?, ?, 'default', 'read,write,publish')
  `).run(`token-${user.id}`, user.id, token);

  console.log(`  ✓ Created user: ${user.username} (token: ${token})`);
});

// Seed packages
console.log("\nCreating sample packages...");
const packages = [
  {
    id: "pkg-http",
    name: "@elide/http",
    scope: "elide",
    description: "Native HTTP server and client for Elide runtime",
    maintainers: ["admin", "publisher"],
    keywords: ["http", "server", "client", "fetch"],
    license: "Apache-2.0",
    downloads: 150000,
    stars: 1234
  },
  {
    id: "pkg-db",
    name: "@elide/db",
    scope: "elide",
    description: "Database abstraction layer with SQLite support",
    maintainers: ["admin"],
    keywords: ["database", "sqlite", "orm"],
    license: "Apache-2.0",
    downloads: 120000,
    stars: 987
  },
  {
    id: "pkg-template",
    name: "@elide/template",
    scope: "elide",
    description: "Fast template rendering with JSX support",
    maintainers: ["publisher"],
    keywords: ["template", "jsx", "rendering"],
    license: "MIT",
    downloads: 80000,
    stars: 654
  },
  {
    id: "pkg-validation",
    name: "@elide/validation",
    scope: "elide",
    description: "Schema validation and type checking",
    maintainers: ["admin"],
    keywords: ["validation", "schema", "types"],
    license: "MIT",
    downloads: 65000,
    stars: 432
  },
  {
    id: "pkg-crypto",
    name: "@elide/crypto",
    scope: "elide",
    description: "Cryptographic utilities and hashing",
    maintainers: ["admin"],
    keywords: ["crypto", "hash", "encryption"],
    license: "Apache-2.0",
    downloads: 55000,
    stars: 345
  }
];

packages.forEach(pkg => {
  db.prepare(`
    INSERT OR IGNORE INTO packages (
      id, name, scope, description, maintainers, keywords, license, downloads, stars
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pkg.id,
    pkg.name,
    pkg.scope,
    pkg.description,
    JSON.stringify(pkg.maintainers),
    JSON.stringify(pkg.keywords),
    pkg.license,
    pkg.downloads,
    pkg.stars
  );

  // Add versions
  const versions = ["1.0.0", "1.1.0", "1.2.0", "2.0.0"];
  versions.forEach((version, index) => {
    const versionId = `${pkg.id}-v${index}`;
    db.prepare(`
      INSERT OR IGNORE INTO package_versions (
        id, package_id, version, description, tarball, shasum,
        dependencies, published_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      pkg.id,
      version,
      pkg.description,
      `https://registry.elide.dev/${pkg.name}/-/${pkg.name.split('/')[1]}-${version}.tgz`,
      `sha256-${Math.random().toString(36).substr(2)}`,
      JSON.stringify({}),
      pkg.maintainers[0]
    );
  });

  // Add package scores
  const quality = 75 + Math.random() * 25;
  const popularity = Math.min(100, pkg.downloads / 2000);
  const maintenance = 70 + Math.random() * 30;
  const overall = (quality * 0.3 + popularity * 0.4 + maintenance * 0.3);

  db.prepare(`
    INSERT OR REPLACE INTO package_scores (package_id, quality, popularity, maintenance, overall)
    VALUES (?, ?, ?, ?, ?)
  `).run(pkg.id, quality, popularity, maintenance, overall);

  console.log(`  ✓ Created package: ${pkg.name} (${versions.length} versions)`);
});

// Seed sample deployments
console.log("\nCreating sample deployments...");
const deployments = [
  {
    id: "deploy-1",
    serviceId: "svc-postgres",
    userId: "user-demo",
    name: "my-postgres-db",
    status: "running",
    config: { tier: "starter", region: "us-east-1" },
    endpoint: "deploy-1.db.elide.services:5432",
    region: "us-east-1",
    tier: "starter"
  },
  {
    id: "deploy-2",
    serviceId: "svc-redis",
    userId: "user-demo",
    name: "my-cache",
    status: "running",
    config: { tier: "basic", region: "us-west-2" },
    endpoint: "deploy-2.db.elide.services:6379",
    region: "us-west-2",
    tier: "basic"
  }
];

deployments.forEach(deploy => {
  db.prepare(`
    INSERT OR IGNORE INTO deployments (
      id, service_id, user_id, name, status, config, endpoint, region, tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    deploy.id,
    deploy.serviceId,
    deploy.userId,
    deploy.name,
    deploy.status,
    JSON.stringify(deploy.config),
    deploy.endpoint,
    deploy.region,
    deploy.tier
  );

  // Add metrics
  db.prepare(`
    INSERT OR IGNORE INTO deployment_metrics (
      deployment_id, requests, errors, avg_response_time, uptime
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    deploy.id,
    Math.floor(Math.random() * 100000),
    Math.floor(Math.random() * 100),
    Math.random() * 50,
    99.9
  );

  // Add billing
  db.prepare(`
    INSERT OR IGNORE INTO billing (
      deployment_id, current_cost, projected_cost, currency
    ) VALUES (?, ?, ?, 'USD')
  `).run(deploy.id, 9.50, 19.00);

  console.log(`  ✓ Created deployment: ${deploy.name}`);
});

// Seed analytics
console.log("\nGenerating analytics data...");
const today = new Date();
for (let i = 0; i < 30; i++) {
  const date = new Date(today);
  date.setDate(date.getDate() - i);

  packages.forEach(pkg => {
    const downloads = Math.floor(Math.random() * 1000);

    db.prepare(`
      INSERT INTO analytics (id, entity_type, entity_id, event_type, metadata, created_at)
      VALUES (?, 'package', ?, 'downloaded', ?, ?)
    `).run(
      `analytics-${pkg.id}-${i}`,
      pkg.id,
      JSON.stringify({ count: downloads }),
      date.toISOString()
    );
  });
}

console.log("  ✓ Generated 30 days of analytics data");

console.log("\n✓ Database seeding complete!");
console.log("\nTest credentials:");
console.log("  Username: demo");
console.log("  Password: demo123");
console.log("\nYou can now start the marketplace servers:");
console.log("  elide run server.ts");
console.log("  elide run registry/registry-server.ts");
console.log("  elide run marketplace/marketplace-server.ts");
console.log("  elide run dashboard/dashboard-server.ts");
