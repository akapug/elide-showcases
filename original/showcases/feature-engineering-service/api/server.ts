/**
 * Feature Engineering Service - Production API Server
 *
 * High-performance feature store with <1ms real-time serving
 * Supports feature versioning, caching, and drift monitoring
 */

import * as http from 'http';
import { FeatureStore } from './feature-store';
import { FeatureCache } from './feature-cache';
import { DriftMonitor } from './drift-monitor';

const PORT = parseInt(process.env.PORT || '3000', 10);
const ENABLE_DRIFT = process.env.ENABLE_DRIFT_MONITORING === 'true';

// Initialize components
const cache = new FeatureCache({
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '10000', 10),
  ttl: parseInt(process.env.CACHE_TTL_MS || '300000', 10),
});

const featureStore = new FeatureStore(cache);
const driftMonitor = ENABLE_DRIFT ? new DriftMonitor(featureStore) : null;

interface FeatureRequest {
  entity_id: string;
  features?: string[];
  timestamp?: number;
  version?: string;
}

interface BatchFeatureRequest {
  entity_ids: string[];
  features?: string[];
  timestamp?: number;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const startTime = process.hrtime.bigint();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        cache: cache.getStats(),
        drift: driftMonitor?.getStats() || null,
        memory: process.memoryUsage(),
        timestamp: Date.now(),
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
      return;
    }

    // Single feature request
    if (req.url === '/features' && req.method === 'POST') {
      const body = await parseBody(req);
      const request: FeatureRequest = JSON.parse(body);

      const features = await featureStore.getFeatures(
        request.entity_id,
        request.features,
        request.version
      );

      // Track for drift monitoring
      if (driftMonitor) {
        driftMonitor.track(request.entity_id, features);
      }

      const latency = Number(process.hrtime.bigint() - startTime) / 1e6; // Convert to ms

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        entity_id: request.entity_id,
        features,
        version: request.version || 'v1',
        cached: cache.has(request.entity_id),
        latency_ms: latency,
        timestamp: Date.now(),
      }, null, 2));
      return;
    }

    // Batch feature request
    if (req.url === '/features/batch' && req.method === 'POST') {
      const body = await parseBody(req);
      const request: BatchFeatureRequest = JSON.parse(body);

      const results = await featureStore.getBatchFeatures(
        request.entity_ids,
        request.features
      );

      const latency = Number(process.hrtime.bigint() - startTime) / 1e6;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        count: results.length,
        features: results,
        latency_ms: latency,
        avg_latency_per_entity: latency / results.length,
        timestamp: Date.now(),
      }, null, 2));
      return;
    }

    // Feature statistics
    if (req.url === '/features/stats' && req.method === 'GET') {
      const stats = featureStore.getFeatureStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats, null, 2));
      return;
    }

    // Drift report
    if (req.url === '/drift/report' && req.method === 'GET') {
      if (!driftMonitor) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Drift monitoring not enabled' }));
        return;
      }

      const report = driftMonitor.getReport();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(report, null, 2));
      return;
    }

    // Cache management
    if (req.url === '/cache/clear' && req.method === 'POST') {
      cache.clear();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Cache cleared successfully' }));
      return;
    }

    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
});

// Helper to parse request body
function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Feature Engineering Service running on port ${PORT}`);
  console.log(`📊 Cache: max ${cache['maxSize']} items, TTL ${cache['ttl']}ms`);
  console.log(`📈 Drift monitoring: ${ENABLE_DRIFT ? 'enabled' : 'disabled'}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  POST   /features          - Get features for single entity');
  console.log('  POST   /features/batch    - Get features for multiple entities');
  console.log('  GET    /features/stats    - Get feature statistics');
  console.log('  GET    /drift/report      - Get drift monitoring report');
  console.log('  GET    /health            - Health check');
  console.log('  POST   /cache/clear       - Clear feature cache');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { server, featureStore, cache, driftMonitor };
