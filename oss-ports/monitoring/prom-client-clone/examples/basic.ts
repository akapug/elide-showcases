/**
 * Basic Prometheus Metrics Example
 */

import {
  Counter,
  Gauge,
  Histogram,
  Summary,
  register,
  collectDefaultMetrics,
} from '../src';

// Create metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status', 'path'],
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['protocol'],
});

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const responseSize = new Summary({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['endpoint'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
});

// Simulate some metrics
async function simulateTraffic() {
  // Increment counters
  httpRequestsTotal.inc({ method: 'GET', status: '200', path: '/api/users' });
  httpRequestsTotal.inc({ method: 'POST', status: '201', path: '/api/users' }, 2);
  httpRequestsTotal.inc({ method: 'GET', status: '404', path: '/api/notfound' });

  // Set gauges
  activeConnections.set({ protocol: 'http' }, 42);
  activeConnections.set({ protocol: 'https' }, 128);

  // Record histogram
  const timer1 = requestDuration.startTimer({ method: 'GET', path: '/api/users' });
  await new Promise((resolve) => setTimeout(resolve, 150));
  timer1();

  requestDuration.observe({ method: 'POST', path: '/api/users' }, 0.75);
  requestDuration.observe({ method: 'GET', path: '/api/notfound' }, 0.03);

  // Record summary
  responseSize.observe({ endpoint: '/api/users' }, 1024);
  responseSize.observe({ endpoint: '/api/users' }, 2048);
  responseSize.observe({ endpoint: '/api/notfound' }, 256);
}

// Main function
async function main() {
  console.log('Prometheus Metrics Basic Example\n');

  // Collect default metrics
  const stopDefaultMetrics = collectDefaultMetrics({ timeout: 5000 });

  // Simulate traffic
  await simulateTraffic();

  // Export metrics
  console.log('=== Metrics Output ===\n');
  const metrics = await register.metrics();
  console.log(metrics);

  // Get specific metric
  console.log('\n=== Counter Value ===');
  const counter = register.getSingleMetric('http_requests_total');
  if (counter) {
    console.log('Total requests:', counter.get());
  }

  // Stop default metrics collection
  stopDefaultMetrics();
}

main().catch(console.error);
