/**
 * Main Server
 * Elide-compatible HTTP server for the full-stack template
 */

import * as path from 'path';
import * as fs from 'fs';
import { applyCors, handleCorsPreFlight } from './middleware/cors.js';
import { logRequest } from './middleware/logger.js';
import * as usersRoute from './routes/users.js';
import * as authRoute from './routes/auth.js';
import * as healthRoute from './routes/health.js';

const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || 'localhost';

// Route matching
interface Route {
  method: string;
  pattern: RegExp;
  handler: (context: any) => Response;
  paramNames?: string[];
}

const routes: Route[] = [
  // Health routes
  { method: 'GET', pattern: /^\/api\/health$/, handler: healthRoute.healthCheck },
  { method: 'GET', pattern: /^\/api\/health\/detailed$/, handler: healthRoute.detailedHealthCheck },
  { method: 'GET', pattern: /^\/api\/health\/ready$/, handler: healthRoute.readinessCheck },
  { method: 'GET', pattern: /^\/api\/health\/live$/, handler: healthRoute.livenessCheck },

  // Auth routes
  { method: 'POST', pattern: /^\/api\/auth\/login$/, handler: authRoute.login },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, handler: authRoute.logout },
  { method: 'GET', pattern: /^\/api\/auth\/me$/, handler: authRoute.getCurrentUser },

  // User routes
  { method: 'GET', pattern: /^\/api\/users$/, handler: usersRoute.getAllUsers },
  {
    method: 'GET',
    pattern: /^\/api\/users\/([a-zA-Z0-9-]+)$/,
    handler: usersRoute.getUserById,
    paramNames: ['id']
  },
  { method: 'POST', pattern: /^\/api\/users$/, handler: usersRoute.createUser },
  {
    method: 'PUT',
    pattern: /^\/api\/users\/([a-zA-Z0-9-]+)$/,
    handler: usersRoute.updateUser,
    paramNames: ['id']
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/users\/([a-zA-Z0-9-]+)$/,
    handler: usersRoute.deleteUser,
    paramNames: ['id']
  },
];

// Parse request body
async function parseBody(request: Request): Promise<any> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch (error) {
      return null;
    }
  }

  return null;
}

// Route matching function
function matchRoute(method: string, pathname: string): {
  route: Route;
  params: Record<string, string>;
} | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = pathname.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    if (route.paramNames && match.length > 1) {
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
    }

    return { route, params };
  }

  return null;
}

// Serve static files (for production build)
function serveStatic(pathname: string): Response | null {
  const frontendDistPath = path.join(process.cwd(), '../frontend/dist');

  // Normalize path and prevent directory traversal
  let filePath = path.join(frontendDistPath, pathname);

  // Security check
  if (!filePath.startsWith(frontendDistPath)) {
    return null;
  }

  // Check if file exists
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      // For SPA routing, serve index.html
      filePath = path.join(frontendDistPath, 'index.html');
      if (!fs.existsSync(filePath)) {
        return null;
      }
    }

    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = getContentType(ext);

    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    return null;
  }
}

// Get content type by file extension
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  return types[ext] || 'application/octet-stream';
}

// Main request handler
async function handleRequest(request: Request): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  try {
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      const response = handleCorsPreFlight();
      logRequest(request, response, startTime);
      return response;
    }

    // Try to match API route
    const routeMatch = matchRoute(method, pathname);

    if (routeMatch) {
      const body = await parseBody(request);
      const context = {
        params: routeMatch.params,
        body,
        headers: request.headers,
      };

      const response = routeMatch.route.handler(context);
      const corsResponse = applyCors(response);
      logRequest(request, corsResponse, startTime);
      return corsResponse;
    }

    // Try to serve static files
    const staticResponse = serveStatic(pathname);
    if (staticResponse) {
      const corsResponse = applyCors(staticResponse);
      logRequest(request, corsResponse, startTime);
      return corsResponse;
    }

    // 404 Not Found
    const notFoundResponse = new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `Route ${method} ${pathname} not found`,
        statusCode: 404,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const corsResponse = applyCors(notFoundResponse);
    logRequest(request, corsResponse, startTime);
    return corsResponse;

  } catch (error) {
    console.error('Server error:', error);

    const errorResponse = new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const corsResponse = applyCors(errorResponse);
    logRequest(request, corsResponse, startTime);
    return corsResponse;
  }
}

// Start server
async function startServer() {
  console.log('🚀 Starting Elide Full-Stack Template Server...\n');

  // Try using Bun server (Elide likely supports this)
  if (typeof Bun !== 'undefined') {
    const server = Bun.serve({
      port: PORT,
      hostname: HOST,
      fetch: handleRequest,
    });

    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    console.log(`📊 API endpoint: http://${HOST}:${PORT}/api`);
    console.log(`❤️  Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`\n🎯 Environment: ${process.env.NODE_ENV || 'development'}\n`);

    return server;
  }

  // Fallback: Try using native Node.js HTTP server
  if (typeof process !== 'undefined') {
    const http = await import('http');

    const server = http.createServer(async (req, res) => {
      const request = new Request(`http://${HOST}:${PORT}${req.url}`, {
        method: req.method,
        headers: req.headers as any,
      });

      const response = await handleRequest(request);

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const body = await response.text();
      res.end(body);
    });

    server.listen(PORT, HOST, () => {
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      console.log(`📊 API endpoint: http://${HOST}:${PORT}/api`);
      console.log(`❤️  Health check: http://${HOST}:${PORT}/api/health`);
      console.log(`\n🎯 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    return server;
  }

  throw new Error('No compatible server runtime found');
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export { handleRequest, startServer };
