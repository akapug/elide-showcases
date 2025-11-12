#!/usr/bin/env elide

/**
 * Elide Package Registry Server
 *
 * npm-compatible package registry with advanced features:
 * - Package publishing and versioning
 * - Dependency analysis and security scanning
 * - Package scoring and ranking
 * - Multi-language support (TS, Python, Java, Ruby)
 * - Download statistics and analytics
 */

import { serve, json, Request, Response } from "@elide/http";
import { Database } from "@elide/db";

// Package metadata structures for different languages
interface NpmPackageMetadata {
  name: string;
  version: string;
  description?: string;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  keywords?: string[];
  author?: string | { name: string; email?: string };
  license?: string;
  repository?: string | { type: string; url: string };
  bugs?: string | { url: string };
  homepage?: string;
}

interface PyPiPackageMetadata {
  name: string;
  version: string;
  summary?: string;
  author?: string;
  author_email?: string;
  license?: string;
  requires_dist?: string[];
  requires_python?: string;
  keywords?: string[];
  classifiers?: string[];
}

interface MavenPackageMetadata {
  groupId: string;
  artifactId: string;
  version: string;
  packaging?: string;
  description?: string;
  dependencies?: Array<{
    groupId: string;
    artifactId: string;
    version: string;
    scope?: string;
  }>;
}

interface RubyGemMetadata {
  name: string;
  version: string;
  summary?: string;
  description?: string;
  authors?: string[];
  email?: string[];
  license?: string;
  homepage?: string;
  dependencies?: Array<{
    name: string;
    requirement: string;
    type?: "runtime" | "development";
  }>;
}

interface SecurityVulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedVersions: string[];
  patchedVersions: string[];
  cve?: string;
  publishedAt: Date;
}

interface DependencyInfo {
  name: string;
  version: string;
  resolved: string;
  integrity?: string;
  dependencies?: Record<string, DependencyInfo>;
  vulnerabilities?: SecurityVulnerability[];
}

// Database for registry
const db = new Database("registry.db");

// Initialize registry schema
db.exec(`
  CREATE TABLE IF NOT EXISTS registry_packages (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    language TEXT NOT NULL,
    latest_version TEXT,
    total_downloads INTEGER DEFAULT 0,
    weekly_downloads INTEGER DEFAULT 0,
    monthly_downloads INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS registry_versions (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    version TEXT NOT NULL,
    metadata TEXT NOT NULL,
    tarball_url TEXT NOT NULL,
    tarball_size INTEGER,
    shasum TEXT NOT NULL,
    integrity TEXT,
    downloads INTEGER DEFAULT 0,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES registry_packages(id),
    UNIQUE(package_id, version)
  );

  CREATE TABLE IF NOT EXISTS dependency_tree (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    dependency_name TEXT NOT NULL,
    dependency_version TEXT NOT NULL,
    dep_type TEXT NOT NULL,
    resolved_version_id TEXT,
    FOREIGN KEY (version_id) REFERENCES registry_versions(id)
  );

  CREATE TABLE IF NOT EXISTS security_scans (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    vulnerabilities TEXT,
    score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'clean',
    FOREIGN KEY (version_id) REFERENCES registry_versions(id)
  );

  CREATE TABLE IF NOT EXISTS package_quality_metrics (
    package_id TEXT PRIMARY KEY,
    has_readme BOOLEAN DEFAULT 0,
    has_license BOOLEAN DEFAULT 0,
    has_tests BOOLEAN DEFAULT 0,
    has_types BOOLEAN DEFAULT 0,
    code_coverage REAL DEFAULT 0,
    dependencies_up_to_date BOOLEAN DEFAULT 1,
    commit_frequency REAL DEFAULT 0,
    issue_response_time REAL DEFAULT 0,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES registry_packages(id)
  );

  CREATE TABLE IF NOT EXISTS download_stats (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    version TEXT,
    downloads INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    country TEXT,
    user_agent TEXT,
    FOREIGN KEY (package_id) REFERENCES registry_packages(id)
  );

  CREATE INDEX IF NOT EXISTS idx_registry_language ON registry_packages(language);
  CREATE INDEX IF NOT EXISTS idx_dependency_tree_version ON dependency_tree(version_id);
  CREATE INDEX IF NOT EXISTS idx_download_stats_date ON download_stats(date);
  CREATE INDEX IF NOT EXISTS idx_download_stats_package ON download_stats(package_id);
`);

// Utility functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function detectLanguage(metadata: any): string {
  if (metadata.name && metadata.version && metadata.scripts) {
    return "typescript";
  }
  if (metadata.requires_python || metadata.requires_dist) {
    return "python";
  }
  if (metadata.groupId && metadata.artifactId) {
    return "java";
  }
  if (metadata.authors && metadata.summary) {
    return "ruby";
  }
  return "unknown";
}

function calculatePackageHash(content: string): string {
  // Simple hash for demo - use crypto in production
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function parseVersionRange(range: string): { min: string; max?: string } {
  // Simplified version range parsing
  const cleanRange = range.replace(/[^\d\.\-]/g, "");
  return { min: cleanRange };
}

async function scanDependencies(
  dependencies: Record<string, string>
): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = [];

  for (const [name, version] of Object.entries(dependencies)) {
    const pkg = db.prepare(`
      SELECT rp.*, rv.version, rv.metadata
      FROM registry_packages rp
      JOIN registry_versions rv ON rp.id = rv.package_id
      WHERE rp.name = ? AND rv.version = ?
    `).get(name, version);

    const vulnerabilities = pkg ? await scanForVulnerabilities(pkg.id, version) : [];

    deps.push({
      name,
      version,
      resolved: pkg ? pkg.version : version,
      vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : undefined
    });
  }

  return deps;
}

async function scanForVulnerabilities(
  packageId: string,
  version: string
): Promise<SecurityVulnerability[]> {
  // Check security scan cache
  const cached = db.prepare(`
    SELECT * FROM security_scans
    WHERE version_id IN (
      SELECT id FROM registry_versions WHERE package_id = ? AND version = ?
    )
    AND scan_date > datetime('now', '-7 days')
  `).get(packageId, version);

  if (cached) {
    return cached.vulnerabilities ? JSON.parse(cached.vulnerabilities) : [];
  }

  // Simulate vulnerability scanning
  // In production, integrate with: Snyk, npm audit, Safety DB, etc.
  const vulnerabilities: SecurityVulnerability[] = [];

  // Example vulnerability for demo
  if (Math.random() > 0.95) {
    vulnerabilities.push({
      id: `VULN-${generateId()}`,
      severity: "medium",
      title: "Prototype Pollution",
      description: "Vulnerability in dependency chain allows prototype pollution",
      affectedVersions: [version],
      patchedVersions: ["*"],
      publishedAt: new Date()
    });
  }

  // Cache scan results
  const versionId = db.prepare(
    "SELECT id FROM registry_versions WHERE package_id = ? AND version = ?"
  ).get(packageId, version)?.id;

  if (versionId) {
    db.prepare(`
      INSERT INTO security_scans (id, version_id, vulnerabilities, score, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      generateId(),
      versionId,
      JSON.stringify(vulnerabilities),
      vulnerabilities.length === 0 ? 100 : Math.max(0, 100 - vulnerabilities.length * 20),
      vulnerabilities.length === 0 ? "clean" : "vulnerable"
    );
  }

  return vulnerabilities;
}

function calculateQualityScore(packageId: string): number {
  const metrics = db.prepare(
    "SELECT * FROM package_quality_metrics WHERE package_id = ?"
  ).get(packageId);

  if (!metrics) return 50;

  let score = 0;
  if (metrics.has_readme) score += 15;
  if (metrics.has_license) score += 10;
  if (metrics.has_tests) score += 20;
  if (metrics.has_types) score += 15;
  if (metrics.code_coverage > 0.7) score += 20;
  if (metrics.dependencies_up_to_date) score += 10;
  if (metrics.commit_frequency > 0.5) score += 10;

  return Math.min(100, score);
}

// npm-compatible endpoints
async function handleNpmPackagePublish(req: Request): Promise<Response> {
  const metadata = await req.json() as NpmPackageMetadata;
  const { name, version, description, dependencies = {}, devDependencies = {} } = metadata;

  // Validate package name
  if (!name || !version) {
    return json({ error: "Package name and version are required" }, { status: 400 });
  }

  // Check if package exists
  let pkg = db.prepare("SELECT * FROM registry_packages WHERE name = ?").get(name);

  if (!pkg) {
    const packageId = generateId();
    db.prepare(`
      INSERT INTO registry_packages (id, name, language, latest_version)
      VALUES (?, ?, 'typescript', ?)
    `).run(packageId, name, version);

    pkg = { id: packageId };

    // Initialize quality metrics
    db.prepare(`
      INSERT INTO package_quality_metrics (package_id, has_readme, has_license, has_types)
      VALUES (?, 1, ?, ?)
    `).run(
      packageId,
      metadata.license ? 1 : 0,
      metadata.types ? 1 : 0
    );
  }

  // Check version doesn't exist
  const existing = db.prepare(
    "SELECT id FROM registry_versions WHERE package_id = ? AND version = ?"
  ).get(pkg.id, version);

  if (existing) {
    return json({ error: "Version already exists" }, { status: 409 });
  }

  // Generate tarball URL and hash
  const tarballUrl = `https://registry.elide.dev/${name}/-/${name}-${version}.tgz`;
  const shasum = calculatePackageHash(JSON.stringify(metadata));

  // Store version
  const versionId = generateId();
  db.prepare(`
    INSERT INTO registry_versions (
      id, package_id, version, metadata, tarball_url, shasum
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    versionId,
    pkg.id,
    version,
    JSON.stringify(metadata),
    tarballUrl,
    shasum
  );

  // Store dependencies
  for (const [depName, depVersion] of Object.entries(dependencies)) {
    db.prepare(`
      INSERT INTO dependency_tree (id, version_id, dependency_name, dependency_version, dep_type)
      VALUES (?, ?, ?, ?, 'production')
    `).run(generateId(), versionId, depName, depVersion);
  }

  for (const [depName, depVersion] of Object.entries(devDependencies)) {
    db.prepare(`
      INSERT INTO dependency_tree (id, version_id, dependency_name, dependency_version, dep_type)
      VALUES (?, ?, ?, ?, 'development')
    `).run(generateId(), versionId, depName, depVersion);
  }

  // Scan for vulnerabilities
  await scanForVulnerabilities(pkg.id, version);

  // Update latest version
  db.prepare(
    "UPDATE registry_packages SET latest_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(version, pkg.id);

  return json({
    success: true,
    id: versionId,
    name,
    version,
    tarball: tarballUrl
  }, { status: 201 });
}

async function handleNpmPackageGet(req: Request, name: string): Promise<Response> {
  const pkg = db.prepare("SELECT * FROM registry_packages WHERE name = ?").get(name);

  if (!pkg) {
    return json({ error: "Package not found" }, { status: 404 });
  }

  const versions = db.prepare(`
    SELECT * FROM registry_versions WHERE package_id = ? ORDER BY published_at DESC
  `).all(pkg.id);

  const versionsObj: any = {};
  const distTags: any = { latest: pkg.latest_version };

  for (const v of versions) {
    const metadata = JSON.parse(v.metadata);
    versionsObj[v.version] = {
      name: pkg.name,
      version: v.version,
      description: metadata.description,
      dist: {
        tarball: v.tarball_url,
        shasum: v.shasum,
        integrity: v.integrity
      },
      dependencies: metadata.dependencies || {},
      devDependencies: metadata.devDependencies || {},
      ...metadata
    };
  }

  // npm-compatible response format
  return json({
    _id: pkg.name,
    name: pkg.name,
    "dist-tags": distTags,
    versions: versionsObj,
    time: {
      created: pkg.created_at,
      modified: pkg.updated_at,
      ...Object.fromEntries(versions.map(v => [v.version, v.published_at]))
    }
  });
}

async function handlePackageDownload(req: Request, name: string, version: string): Promise<Response> {
  const pkg = db.prepare("SELECT * FROM registry_packages WHERE name = ?").get(name);

  if (!pkg) {
    return json({ error: "Package not found" }, { status: 404 });
  }

  const pkgVersion = db.prepare(
    "SELECT * FROM registry_versions WHERE package_id = ? AND version = ?"
  ).get(pkg.id, version);

  if (!pkgVersion) {
    return json({ error: "Version not found" }, { status: 404 });
  }

  // Track download
  db.prepare("UPDATE registry_packages SET total_downloads = total_downloads + 1 WHERE id = ?")
    .run(pkg.id);
  db.prepare("UPDATE registry_versions SET downloads = downloads + 1 WHERE id = ?")
    .run(pkgVersion.id);

  // Track download stats
  db.prepare(`
    INSERT INTO download_stats (id, package_id, version, downloads, date)
    VALUES (?, ?, ?, 1, CURRENT_DATE)
    ON CONFLICT(package_id, version, date) DO UPDATE SET downloads = downloads + 1
  `).run(generateId(), pkg.id, version);

  return Response.redirect(pkgVersion.tarball_url);
}

async function handlePackageSearch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = url.searchParams.get("text") || url.searchParams.get("q") || "";
  const size = parseInt(url.searchParams.get("size") || "20");
  const from = parseInt(url.searchParams.get("from") || "0");

  const packages = db.prepare(`
    SELECT
      rp.*,
      pqm.has_readme,
      pqm.has_license,
      pqm.has_tests,
      pqm.has_types
    FROM registry_packages rp
    LEFT JOIN package_quality_metrics pqm ON rp.id = pqm.package_id
    WHERE rp.name LIKE ? OR rv.metadata LIKE ?
    ORDER BY rp.weekly_downloads DESC, rp.total_downloads DESC
    LIMIT ? OFFSET ?
  `).all(`%${query}%`, `%${query}%`, size, from);

  // npm-compatible search response
  return json({
    objects: packages.map(p => ({
      package: {
        name: p.name,
        version: p.latest_version,
        description: "",
        keywords: [],
        date: p.updated_at,
        links: {},
        publisher: { username: "unknown", email: "" },
        maintainers: []
      },
      score: {
        final: calculateQualityScore(p.id) / 100,
        detail: {
          quality: calculateQualityScore(p.id) / 100,
          popularity: Math.min(1, p.weekly_downloads / 10000),
          maintenance: 0.8
        }
      },
      searchScore: 1.0
    })),
    total: packages.length,
    time: new Date().toISOString()
  });
}

async function handleDependencyAnalysis(req: Request, name: string, version: string): Promise<Response> {
  const pkg = db.prepare("SELECT * FROM registry_packages WHERE name = ?").get(name);

  if (!pkg) {
    return json({ error: "Package not found" }, { status: 404 });
  }

  const pkgVersion = db.prepare(
    "SELECT * FROM registry_versions WHERE package_id = ? AND version = ?"
  ).get(pkg.id, version);

  if (!pkgVersion) {
    return json({ error: "Version not found" }, { status: 404 });
  }

  // Get dependency tree
  const deps = db.prepare(`
    SELECT * FROM dependency_tree WHERE version_id = ?
  `).all(pkgVersion.id);

  // Scan dependencies for vulnerabilities
  const metadata = JSON.parse(pkgVersion.metadata);
  const dependencyInfo = await scanDependencies(metadata.dependencies || {});

  // Get security scan
  const securityScan = db.prepare(
    "SELECT * FROM security_scans WHERE version_id = ? ORDER BY scan_date DESC LIMIT 1"
  ).get(pkgVersion.id);

  return json({
    package: name,
    version,
    dependencies: deps.length,
    dependencyTree: dependencyInfo,
    security: {
      score: securityScan?.score || 100,
      status: securityScan?.status || "unknown",
      vulnerabilities: securityScan ? JSON.parse(securityScan.vulnerabilities || "[]") : [],
      lastScanned: securityScan?.scan_date
    }
  });
}

async function handlePackageStats(req: Request, name: string): Promise<Response> {
  const pkg = db.prepare("SELECT * FROM registry_packages WHERE name = ?").get(name);

  if (!pkg) {
    return json({ error: "Package not found" }, { status: 404 });
  }

  // Get download stats for last 30 days
  const dailyStats = db.prepare(`
    SELECT date, SUM(downloads) as downloads
    FROM download_stats
    WHERE package_id = ? AND date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date
  `).all(pkg.id);

  // Get version distribution
  const versionStats = db.prepare(`
    SELECT version, SUM(downloads) as downloads
    FROM download_stats
    WHERE package_id = ?
    GROUP BY version
    ORDER BY downloads DESC
    LIMIT 10
  `).all(pkg.id);

  return json({
    package: name,
    downloads: {
      total: pkg.total_downloads,
      weekly: pkg.weekly_downloads,
      monthly: pkg.monthly_downloads,
      daily: dailyStats
    },
    versions: versionStats,
    quality: calculateQualityScore(pkg.id)
  });
}

// PyPI-compatible endpoints
async function handlePyPiPackageUpload(req: Request): Promise<Response> {
  // Handle Python package upload (wheel or sdist)
  const formData = await req.formData();
  const metadata = {
    name: formData.get("name") as string,
    version: formData.get("version") as string,
    summary: formData.get("summary") as string,
    author: formData.get("author") as string,
    license: formData.get("license") as string
  };

  const packageId = generateId();
  db.prepare(`
    INSERT INTO registry_packages (id, name, language, latest_version)
    VALUES (?, ?, 'python', ?)
  `).run(packageId, metadata.name, metadata.version);

  return json({ success: true }, { status: 201 });
}

// Maven-compatible endpoints
async function handleMavenPackageDeploy(req: Request): Promise<Response> {
  // Handle Maven artifact deployment
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Extract groupId, artifactId, version from URL
  // Format: /maven2/com/example/artifact/1.0.0/artifact-1.0.0.jar

  return json({ success: true }, { status: 201 });
}

// RubyGems-compatible endpoints
async function handleGemPush(req: Request): Promise<Response> {
  // Handle Ruby gem push
  const gemData = await req.arrayBuffer();

  // Parse .gem file (tar + gzip)
  // Extract gemspec metadata

  return json({ success: true }, { status: 201 });
}

// Request router
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  try {
    // npm-compatible routes
    if (path.startsWith("/npm/")) {
      const npmPath = path.substring(5);

      if (npmPath === "" && method === "PUT") {
        return await handleNpmPackagePublish(req);
      }

      const packageMatch = npmPath.match(/^([^\/]+)$/);
      if (packageMatch && method === "GET") {
        return await handleNpmPackageGet(req, packageMatch[1]);
      }

      const downloadMatch = npmPath.match(/^([^\/]+)\/-\/.*-(.+)\.tgz$/);
      if (downloadMatch && method === "GET") {
        return await handlePackageDownload(req, downloadMatch[1], downloadMatch[2]);
      }
    }

    // Enhanced API routes
    if (path === "/api/search" && method === "GET") {
      return await handlePackageSearch(req);
    }

    const analysisMatch = path.match(/^\/api\/analyze\/([^\/]+)\/([^\/]+)$/);
    if (analysisMatch && method === "GET") {
      return await handleDependencyAnalysis(req, analysisMatch[1], analysisMatch[2]);
    }

    const statsMatch = path.match(/^\/api\/stats\/([^\/]+)$/);
    if (statsMatch && method === "GET") {
      return await handlePackageStats(req, statsMatch[1]);
    }

    // PyPI-compatible routes
    if (path === "/pypi/" && method === "POST") {
      return await handlePyPiPackageUpload(req);
    }

    // Maven-compatible routes
    if (path.startsWith("/maven2/") && method === "PUT") {
      return await handleMavenPackageDeploy(req);
    }

    // RubyGems-compatible routes
    if (path === "/api/v1/gems" && method === "POST") {
      return await handleGemPush(req);
    }

    return json({ error: "Not found" }, { status: 404 });

  } catch (error) {
    console.error("Registry error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

const PORT = parseInt(Deno.env.get("REGISTRY_PORT") || "4873");

console.log(`
📦 Elide Package Registry Server
   Port: ${PORT}
   npm-compatible: http://localhost:${PORT}/npm/
   PyPI-compatible: http://localhost:${PORT}/pypi/
   Maven-compatible: http://localhost:${PORT}/maven2/
   RubyGems-compatible: http://localhost:${PORT}/api/v1/gems
`);

serve(handleRequest, { port: PORT });
