#!/usr/bin/env elide

/**
 * Elide Marketplace Web Dashboard
 *
 * Interactive web interface for browsing packages and services
 */

import { serve, Request, Response } from "@elide/http";

const API_URL = "http://localhost:3000";
const MARKETPLACE_URL = "http://localhost:3001";
const REGISTRY_URL = "http://localhost:4873";

// HTML Templates
const layout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Elide Marketplace</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    nav h1 { font-size: 1.8rem; }
    nav a {
      color: white;
      text-decoration: none;
      margin-left: 2rem;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    nav a:hover { opacity: 0.8; }
    main { padding: 2rem 0; min-height: calc(100vh - 200px); }
    .hero {
      background: white;
      border-radius: 12px;
      padding: 3rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
    }
    .hero h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p { font-size: 1.2rem; color: #666; }
    .search-box {
      margin: 2rem 0;
      text-align: center;
    }
    .search-box input {
      padding: 1rem;
      font-size: 1.1rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      transition: border-color 0.2s;
    }
    .search-box input:focus {
      outline: none;
      border-color: #667eea;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      margin: 2rem 0;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .card h3 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
      color: #667eea;
    }
    .card .meta {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
      font-size: 0.9rem;
      color: #666;
    }
    .card .description {
      color: #666;
      margin: 1rem 0;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .badge.primary { background: #667eea; color: white; }
    .badge.secondary { background: #e0e0e0; color: #333; }
    .badge.success { background: #4caf50; color: white; }
    .tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
    }
    .tab {
      padding: 1rem 2rem;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      font-weight: 500;
      color: #666;
    }
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    .tab:hover { color: #667eea; }
    footer {
      background: #333;
      color: white;
      text-align: center;
      padding: 2rem 0;
      margin-top: 4rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card .number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #667eea;
    }
    .stat-card .label {
      color: #666;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <nav>
        <h1>📦 Elide Marketplace</h1>
        <div>
          <a href="/">Home</a>
          <a href="/packages">Packages</a>
          <a href="/services">Services</a>
          <a href="/docs">Docs</a>
        </div>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      ${content}
    </div>
  </main>
  <footer>
    <div class="container">
      <p>&copy; 2024 Elide Marketplace. Powered by Elide Runtime.</p>
    </div>
  </footer>
</body>
</html>
`;

async function handleHome(req: Request): Promise<Response> {
  const content = `
    <div class="hero">
      <h2>Welcome to Elide Marketplace</h2>
      <p>Discover and deploy packages and services for your Elide applications</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="number">1,234</div>
        <div class="label">Packages</div>
      </div>
      <div class="stat-card">
        <div class="number">87</div>
        <div class="label">Services</div>
      </div>
      <div class="stat-card">
        <div class="number">5.2M</div>
        <div class="label">Downloads</div>
      </div>
      <div class="stat-card">
        <div class="number">3,421</div>
        <div class="label">Deployments</div>
      </div>
    </div>

    <div class="tabs">
      <div class="tab active" onclick="location.href='/packages'">📦 Packages</div>
      <div class="tab" onclick="location.href='/services'">🛍️ Services</div>
    </div>

    <h3 style="margin: 2rem 0 1rem;">Popular Packages</h3>
    <div class="grid">
      <div class="card" onclick="location.href='/packages/elide-http'">
        <h3>@elide/http</h3>
        <div class="meta">
          <span>⬇️ 150K/week</span>
          <span>⭐ 4.8</span>
          <span class="badge secondary">TypeScript</span>
        </div>
        <div class="description">Native HTTP server and client for Elide runtime</div>
      </div>

      <div class="card" onclick="location.href='/packages/elide-db'">
        <h3>@elide/db</h3>
        <div class="meta">
          <span>⬇️ 120K/week</span>
          <span>⭐ 4.7</span>
          <span class="badge secondary">TypeScript</span>
        </div>
        <div class="description">Database abstraction layer with SQLite support</div>
      </div>

      <div class="card" onclick="location.href='/packages/elide-template'">
        <h3>@elide/template</h3>
        <div class="meta">
          <span>⬇️ 80K/week</span>
          <span>⭐ 4.6</span>
          <span class="badge secondary">TypeScript</span>
        </div>
        <div class="description">Fast template rendering with JSX support</div>
      </div>
    </div>

    <h3 style="margin: 2rem 0 1rem;">Featured Services</h3>
    <div class="grid">
      <div class="card" onclick="location.href='/services/postgres-managed'">
        <h3>PostgreSQL Managed</h3>
        <div class="meta">
          <span class="badge primary">Database</span>
          <span>⭐ 4.9</span>
          <span>1.2K deployments</span>
        </div>
        <div class="description">Fully managed PostgreSQL database with automated backups</div>
      </div>

      <div class="card" onclick="location.href='/services/redis-cache'">
        <h3>Redis Cache</h3>
        <div class="meta">
          <span class="badge primary">Database</span>
          <span>⭐ 4.8</span>
          <span>980 deployments</span>
        </div>
        <div class="description">High-performance in-memory data store</div>
      </div>

      <div class="card" onclick="location.href='/services/ml-inference'">
        <h3>ML Inference API</h3>
        <div class="meta">
          <span class="badge primary">ML Model</span>
          <span>⭐ 4.7</span>
          <span>450 deployments</span>
        </div>
        <div class="description">Deploy and serve ML models at scale</div>
      </div>
    </div>
  `;

  return new Response(layout("Home", content), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handlePackages(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const search = url.searchParams.get("q") || "";

  // Fetch packages from API
  let packages = [];
  try {
    const response = await fetch(`${API_URL}/api/packages/search?q=${encodeURIComponent(search)}`);
    if (response.ok) {
      const data = await response.json();
      packages = data.results || [];
    }
  } catch (error) {
    console.error("Error fetching packages:", error);
  }

  const packagesHtml = packages.length > 0 ? packages.map((pkg: any) => `
    <div class="card" onclick="location.href='/packages/${pkg.name}'">
      <h3>${pkg.name}</h3>
      <div class="meta">
        <span>⬇️ ${pkg.downloads.toLocaleString()}</span>
        <span>⭐ ${pkg.score?.toFixed(1) || "N/A"}</span>
      </div>
      <div class="description">${pkg.description || "No description"}</div>
    </div>
  `).join("") : `
    <div class="card">
      <p>No packages found. Try a different search.</p>
    </div>
  `;

  const content = `
    <div class="hero">
      <h2>Browse Packages</h2>
      <p>Discover packages for your Elide applications</p>
    </div>

    <div class="search-box">
      <form action="/packages" method="get">
        <input type="search" name="q" placeholder="Search packages..." value="${search}">
      </form>
    </div>

    <div class="grid">
      ${packagesHtml}
    </div>
  `;

  return new Response(layout("Packages", content), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleServices(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  // Fetch services from marketplace API
  let services = [];
  try {
    let apiUrl = `${MARKETPLACE_URL}/api/services`;
    if (category) {
      apiUrl += `?category=${category}`;
    }

    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      services = data.services || [];
    }
  } catch (error) {
    console.error("Error fetching services:", error);
  }

  const servicesHtml = services.length > 0 ? services.map((service: any) => `
    <div class="card" onclick="location.href='/services/${service.slug}'">
      <h3>${service.name}</h3>
      <div class="meta">
        <span class="badge primary">${service.category}</span>
        <span>⭐ ${service.averageRating.toFixed(1)}</span>
        <span>${service.activeDeployments} active</span>
      </div>
      <div class="description">${service.description}</div>
      <div class="meta">
        <span class="badge secondary">${service.pricing.model}</span>
      </div>
    </div>
  `).join("") : `
    <div class="card">
      <p>No services found in this category.</p>
    </div>
  `;

  const content = `
    <div class="hero">
      <h2>Service Marketplace</h2>
      <p>Deploy managed services with one click</p>
    </div>

    <div class="tabs">
      <div class="tab ${!category ? "active" : ""}" onclick="location.href='/services'">All</div>
      <div class="tab ${category === "database" ? "active" : ""}" onclick="location.href='/services?category=database'">Databases</div>
      <div class="tab ${category === "api" ? "active" : ""}" onclick="location.href='/services?category=api'">APIs</div>
      <div class="tab ${category === "ml-model" ? "active" : ""}" onclick="location.href='/services?category=ml-model'">ML Models</div>
      <div class="tab ${category === "storage" ? "active" : ""}" onclick="location.href='/services?category=storage'">Storage</div>
    </div>

    <div class="grid">
      ${servicesHtml}
    </div>
  `;

  return new Response(layout("Services", content), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleDocs(req: Request): Promise<Response> {
  const content = `
    <div class="hero">
      <h2>Documentation</h2>
      <p>Learn how to use Elide Marketplace</p>
    </div>

    <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h3>Getting Started</h3>
      <p>The Elide Marketplace is a platform for discovering, publishing, and deploying packages and services for Elide applications.</p>

      <h3 style="margin-top: 2rem;">Publishing Packages</h3>
      <pre style="background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto;">
# Install the CLI
npm install -g @elide/marketplace-cli

# Login to marketplace
elide-publish login

# Publish your package
elide-publish publish
      </pre>

      <h3 style="margin-top: 2rem;">Deploying Services</h3>
      <pre style="background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto;">
# List available services
elide-service list

# Deploy a service
elide-service deploy postgres-managed

# Check deployment status
elide-service status <deployment-id>
      </pre>

      <h3 style="margin-top: 2rem;">API Reference</h3>
      <ul style="line-height: 2;">
        <li><code>GET /api/packages</code> - List packages</li>
        <li><code>POST /api/packages</code> - Publish package</li>
        <li><code>GET /api/services</code> - List services</li>
        <li><code>POST /api/deployments</code> - Deploy service</li>
      </ul>
    </div>
  `;

  return new Response(layout("Documentation", content), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`${req.method} ${path}`);

  try {
    if (path === "/" || path === "/index.html") {
      return await handleHome(req);
    }

    if (path === "/packages") {
      return await handlePackages(req);
    }

    if (path === "/services") {
      return await handleServices(req);
    }

    if (path === "/docs") {
      return await handleDocs(req);
    }

    return new Response("Not found", { status: 404 });

  } catch (error) {
    console.error("Dashboard error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

const PORT = parseInt(Deno.env.get("DASHBOARD_PORT") || "8080");

console.log(`
🌐 Elide Marketplace Dashboard
   Port: ${PORT}
   URL: http://localhost:${PORT}
`);

serve(handleRequest, { port: PORT });
