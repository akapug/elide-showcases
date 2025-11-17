/**
 * Default Prometheus Metrics
 *
 * Collect standard OS and runtime metrics
 */

import type { DefaultMetricsConfiguration } from './types';
import { Counter } from './counter';
import { Gauge } from './gauge';
import { Histogram } from './histogram';
import { register as defaultRegistry } from './registry';

/**
 * Collect default metrics
 */
export function collectDefaultMetrics(
  config: DefaultMetricsConfiguration = {}
): () => void {
  const registry = config.register || defaultRegistry;
  const prefix = config.prefix || '';
  const timeout = config.timeout || 10000;
  const labels = config.labels || {};
  const gcDurationBuckets = config.gcDurationBuckets || [
    0.001, 0.01, 0.1, 1, 2, 5,
  ];

  // Process CPU metrics
  const processCpuUserSeconds = new Counter({
    name: `${prefix}process_cpu_user_seconds_total`,
    help: 'Total user CPU time spent in seconds',
    registers: [registry],
  });

  const processCpuSystemSeconds = new Counter({
    name: `${prefix}process_cpu_system_seconds_total`,
    help: 'Total system CPU time spent in seconds',
    registers: [registry],
  });

  const processCpuSeconds = new Counter({
    name: `${prefix}process_cpu_seconds_total`,
    help: 'Total CPU time spent in seconds',
    registers: [registry],
  });

  // Process start time
  const processStartTime = new Gauge({
    name: `${prefix}process_start_time_seconds`,
    help: 'Start time of the process since unix epoch in seconds',
    registers: [registry],
  });

  processStartTime.set(Date.now() / 1000 - process.uptime());

  // Process memory metrics
  const processResidentMemory = new Gauge({
    name: `${prefix}process_resident_memory_bytes`,
    help: 'Resident memory size in bytes',
    registers: [registry],
  });

  const processHeapBytes = new Gauge({
    name: `${prefix}process_heap_bytes`,
    help: 'Process heap size in bytes',
    registers: [registry],
  });

  // File descriptor metrics
  const processOpenFds = new Gauge({
    name: `${prefix}process_open_fds`,
    help: 'Number of open file descriptors',
    registers: [registry],
  });

  const processMaxFds = new Gauge({
    name: `${prefix}process_max_fds`,
    help: 'Maximum number of open file descriptors',
    registers: [registry],
  });

  // Event loop metrics
  const eventLoopLag = new Gauge({
    name: `${prefix}nodejs_eventloop_lag_seconds`,
    help: 'Event loop lag in seconds',
    registers: [registry],
  });

  const eventLoopLagMin = new Gauge({
    name: `${prefix}nodejs_eventloop_lag_min_seconds`,
    help: 'Minimum event loop lag in seconds',
    registers: [registry],
  });

  const eventLoopLagMax = new Gauge({
    name: `${prefix}nodejs_eventloop_lag_max_seconds`,
    help: 'Maximum event loop lag in seconds',
    registers: [registry],
  });

  const eventLoopLagMean = new Gauge({
    name: `${prefix}nodejs_eventloop_lag_mean_seconds`,
    help: 'Mean event loop lag in seconds',
    registers: [registry],
  });

  // GC metrics
  const gcDuration = new Histogram({
    name: `${prefix}nodejs_gc_duration_seconds`,
    help: 'Garbage collection duration in seconds',
    labelNames: ['kind'],
    buckets: gcDurationBuckets,
    registers: [registry],
  });

  // Heap metrics
  const heapSizeTotal = new Gauge({
    name: `${prefix}nodejs_heap_size_total_bytes`,
    help: 'Total heap size in bytes',
    registers: [registry],
  });

  const heapSizeUsed = new Gauge({
    name: `${prefix}nodejs_heap_size_used_bytes`,
    help: 'Used heap size in bytes',
    registers: [registry],
  });

  const externalMemory = new Gauge({
    name: `${prefix}nodejs_external_memory_bytes`,
    help: 'External memory in bytes',
    registers: [registry],
  });

  // Event loop lag tracking
  let lastCheck = Date.now();
  let lagValues: number[] = [];

  // Collection interval
  const intervalId = setInterval(() => {
    collectMetrics();
  }, timeout);

  // Initial collection
  collectMetrics();

  function collectMetrics(): void {
    // CPU metrics
    const cpuUsage = process.cpuUsage();
    processCpuUserSeconds.inc(cpuUsage.user / 1000000);
    processCpuSystemSeconds.inc(cpuUsage.system / 1000000);
    processCpuSeconds.inc((cpuUsage.user + cpuUsage.system) / 1000000);

    // Memory metrics
    const memUsage = process.memoryUsage();
    processResidentMemory.set(memUsage.rss);
    processHeapBytes.set(memUsage.heapTotal);
    heapSizeTotal.set(memUsage.heapTotal);
    heapSizeUsed.set(memUsage.heapUsed);
    externalMemory.set(memUsage.external);

    // Event loop lag
    const now = Date.now();
    const lag = (now - lastCheck - timeout) / 1000;
    lastCheck = now;

    if (lag > 0) {
      lagValues.push(lag);
      eventLoopLag.set(lag);

      // Keep only recent values
      if (lagValues.length > 100) {
        lagValues.shift();
      }

      // Calculate min, max, mean
      const min = Math.min(...lagValues);
      const max = Math.max(...lagValues);
      const mean = lagValues.reduce((a, b) => a + b, 0) / lagValues.length;

      eventLoopLagMin.set(min);
      eventLoopLagMax.set(max);
      eventLoopLagMean.set(mean);
    }

    // File descriptors (platform-specific)
    try {
      // This is a simplified version - in production you'd use native modules
      processOpenFds.set(0);
      processMaxFds.set(65536);
    } catch (error) {
      // Ignore errors
    }
  }

  // GC tracking (requires --expose-gc flag)
  if (global.gc) {
    const originalGC = global.gc;
    global.gc = function (...args: any[]) {
      const start = Date.now();
      const result = originalGC.apply(this, args);
      const duration = (Date.now() - start) / 1000;
      gcDuration.observe({ kind: 'major' }, duration);
      return result;
    };
  }

  // Return function to stop collecting
  return () => {
    clearInterval(intervalId);

    // Remove metrics from registry
    registry.removeSingleMetric(`${prefix}process_cpu_user_seconds_total`);
    registry.removeSingleMetric(`${prefix}process_cpu_system_seconds_total`);
    registry.removeSingleMetric(`${prefix}process_cpu_seconds_total`);
    registry.removeSingleMetric(`${prefix}process_start_time_seconds`);
    registry.removeSingleMetric(`${prefix}process_resident_memory_bytes`);
    registry.removeSingleMetric(`${prefix}process_heap_bytes`);
    registry.removeSingleMetric(`${prefix}process_open_fds`);
    registry.removeSingleMetric(`${prefix}process_max_fds`);
    registry.removeSingleMetric(`${prefix}nodejs_eventloop_lag_seconds`);
    registry.removeSingleMetric(`${prefix}nodejs_eventloop_lag_min_seconds`);
    registry.removeSingleMetric(`${prefix}nodejs_eventloop_lag_max_seconds`);
    registry.removeSingleMetric(`${prefix}nodejs_eventloop_lag_mean_seconds`);
    registry.removeSingleMetric(`${prefix}nodejs_gc_duration_seconds`);
    registry.removeSingleMetric(`${prefix}nodejs_heap_size_total_bytes`);
    registry.removeSingleMetric(`${prefix}nodejs_heap_size_used_bytes`);
    registry.removeSingleMetric(`${prefix}nodejs_external_memory_bytes`);
  };
}
