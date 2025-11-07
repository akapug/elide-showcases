/**
 * Health Check Route Handler
 * Provides health status and system information
 */

import { store } from '../db/store.js';
import { logger } from '../middleware/logger.js';

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

export interface DetailedHealthStatus extends HealthStatus {
  database: {
    status: string;
    userCount: number;
    activeTokens: number;
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    statusCounts: Record<string, number>;
  };
}

const startTime = Date.now();

// GET /api/health - Basic health check
export function healthCheck(): Response {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/health/detailed - Detailed health check with metrics
export function detailedHealthCheck(): Response {
  const stats = logger.getStats();

  const health: DetailedHealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'connected',
      userCount: store.getUserCount(),
      activeTokens: store.getActiveTokenCount(),
    },
    metrics: {
      totalRequests: stats.totalRequests,
      averageResponseTime: stats.averageDuration,
      statusCounts: stats.statusCounts,
    },
  };

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/health/ready - Readiness probe
export function readinessCheck(): Response {
  // Check if the service is ready to accept requests
  const isReady = store.getUserCount() >= 0; // Simple check

  if (isReady) {
    return new Response(
      JSON.stringify({
        status: 'ready',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } else {
    return new Response(
      JSON.stringify({
        status: 'not ready',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// GET /api/health/live - Liveness probe
export function livenessCheck(): Response {
  // Check if the service is alive
  return new Response(
    JSON.stringify({
      status: 'alive',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
