/**
 * Deploy Platform - Production HTTP Server
 *
 * Self-hosted deployment platform (Vercel alternative) built with Elide beta11-rc1.
 *
 * Features:
 * - Native HTTP server (no shims!)
 * - Git-based deployments
 * - Preview deployments per branch
 * - Custom domains with auto HTTPS
 * - Environment variables
 * - Build caching
 * - Rollback support
 * - Team collaboration
 * - Zero vendor lock-in
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";
import { PlatformAPI } from "./api/platform-api.ts";

// =============================================================================
// Configuration
// =============================================================================

const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

// =============================================================================
// Request Body Parser
// =============================================================================

async function parseRequestBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        if (body && req.headers["content-type"]?.includes("application/json")) {
          resolve(JSON.parse(body));
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

// =============================================================================
// HTTP Server
// =============================================================================

const api = new PlatformAPI(PORT);

const server = createServer(async (req, res) => {
  const start = Date.now();
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  try {
    // Parse request body for POST/PATCH
    let body = null;
    if (req.method === "POST" || req.method === "PATCH") {
      try {
        body = await parseRequestBody(req);
      } catch (error) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }
    }

    // Build request object for platform API
    const rawRequest = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body,
    };

    // Handle request through platform API
    const response = await api.handleRequest(rawRequest);

    // Build response headers
    const responseHeaders: Record<string, string> = { ...corsHeaders };
    for (const [key, value] of response.headers) {
      responseHeaders[key] = value;
    }

    // Send response
    res.writeHead(response.statusCode, responseHeaders);
    res.end(response.body);

    // Log request (only in verbose mode)
    if (process.env.VERBOSE === "true") {
      const duration = Date.now() - start;
      console.log(`${req.method} ${url.pathname} ${response.statusCode} ${duration}ms`);
    }

  } catch (error) {
    console.error("Request error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
    }));
  }
});

// =============================================================================
// Server Lifecycle
// =============================================================================

server.listen(PORT, HOST, () => {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║           🚀 Deploy Platform - Vercel Alternative             ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("✨ Self-hosted deployment platform built with Elide beta11-rc1");
  console.log("");
  console.log(`🌐 Server:    http://${HOST}:${PORT}`);
  console.log(`🎯 Dashboard: http://${HOST}:${PORT}/`);
  console.log(`📡 API:       http://${HOST}:${PORT}/api`);
  console.log(`❤️  Health:    http://${HOST}:${PORT}/health`);
  console.log("");
  console.log("📍 Key Endpoints:");
  console.log("   Authentication:");
  console.log("     POST   /auth/login        - Login (demo@deploy-platform.io / demo123)");
  console.log("     POST   /auth/register     - Register new user");
  console.log("     POST   /auth/logout       - Logout");
  console.log("     GET    /auth/user         - Get current user");
  console.log("");
  console.log("   Projects:");
  console.log("     GET    /projects          - List projects");
  console.log("     POST   /projects          - Create project");
  console.log("     GET    /projects/:id      - Get project");
  console.log("     PATCH  /projects/:id      - Update project");
  console.log("     DELETE /projects/:id      - Delete project");
  console.log("");
  console.log("   Deployments:");
  console.log("     GET    /projects/:id/deployments      - List deployments");
  console.log("     POST   /projects/:id/deployments      - Create deployment");
  console.log("     GET    /deployments/:id               - Get deployment");
  console.log("     POST   /deployments/:id/cancel        - Cancel deployment");
  console.log("     POST   /deployments/:id/promote       - Promote to production");
  console.log("     POST   /deployments/:id/rollback      - Rollback deployment");
  console.log("");
  console.log("   Domains:");
  console.log("     GET    /projects/:id/domains          - List domains");
  console.log("     POST   /projects/:id/domains          - Add domain");
  console.log("     DELETE /projects/:id/domains/:domainId - Remove domain");
  console.log("     POST   /projects/:id/domains/:domainId/verify - Verify domain");
  console.log("");
  console.log("   Environment Variables:");
  console.log("     GET    /projects/:id/env              - List variables");
  console.log("     POST   /projects/:id/env              - Add variable");
  console.log("     PATCH  /projects/:id/env/:key         - Update variable");
  console.log("     DELETE /projects/:id/env/:key         - Delete variable");
  console.log("");
  console.log("🌟 Features:");
  console.log("   ✅ Git-based deployments");
  console.log("   ✅ Preview deployments per branch");
  console.log("   ✅ Custom domains with auto HTTPS");
  console.log("   ✅ Environment variables");
  console.log("   ✅ Build caching");
  console.log("   ✅ Instant rollback");
  console.log("   ✅ Team collaboration");
  console.log("   ✅ Zero vendor lock-in");
  console.log("   ✅ Polyglot support (any language)");
  console.log("   ✅ Self-hosted or multi-cloud");
  console.log("");
  console.log("🧪 Quick Test:");
  console.log("   # Login and get token");
  console.log(`   curl -X POST http://localhost:${PORT}/auth/login \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"demo@deploy-platform.io","password":"demo123"}\'');
  console.log("");
  console.log("   # List projects (use token from login)");
  console.log(`   curl http://localhost:${PORT}/projects \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
  console.log("");
  console.log("💡 Demo Credentials:");
  console.log("   Email:    demo@deploy-platform.io");
  console.log("   Password: demo123");
  console.log("");
  console.log("📖 Documentation:");
  console.log("   README:  original/showcases/deploy-platform/README.md");
  console.log("   API Ref: original/showcases/deploy-platform/docs/API.md");
  console.log("");
  console.log("🔧 Environment Variables:");
  console.log("   PORT=3000                       # Server port");
  console.log("   HOST=0.0.0.0                    # Server host");
  console.log("   VERBOSE=false                   # Enable request logging");
  console.log("   DB_TYPE=sqlite                  # Database type");
  console.log("   STORAGE_BACKEND=local           # Storage backend");
  console.log("");
  console.log("💪 Production Deployment:");
  console.log("   Docker:     docker build -t deploy-platform .");
  console.log("   Kubernetes: kubectl apply -f k8s/");
  console.log("   AWS:        terraform apply -var-file=aws.tfvars");
  console.log("");
  console.log("✨ Powered by Elide beta11-rc1 - Native HTTP, Zero Dependencies!");
  console.log("");
  console.log("Press Ctrl+C to stop");
  console.log("");
});

// Note: Signal handlers (SIGINT/SIGTERM) not yet supported in Elide beta11-rc1
// Server will run until manually terminated

// Export for testing
export { server, api };
