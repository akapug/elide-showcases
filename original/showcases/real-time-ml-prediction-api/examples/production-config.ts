/**
 * Production Configuration Example
 *
 * Best practices for running the ML API in production.
 */

import { PolyglotBridge, MLBridge } from '../src/polyglot/bridge';

// Production configuration
const PRODUCTION_CONFIG = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    workers: parseInt(process.env.WORKERS || '4', 10),
    requestTimeout: 30000,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
  },

  // Polyglot configuration
  polyglot: {
    pythonPath: [
      './src/polyglot',
      './ml/models',
      '/opt/ml/models', // Production model path
    ],
    debug: process.env.NODE_ENV !== 'production',
    cacheSize: 100,
    timeout: 30000,
  },

  // ML models configuration
  models: {
    warmupOnStart: true,
    warmupIterations: 100,
    enableCaching: true,
    batchSize: 100,
  },

  // Monitoring configuration
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60000, // 1 minute
    enableHealthCheck: true,
    healthCheckInterval: 30000, // 30 seconds
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    includeTimestamp: true,
    includeRequestId: true,
  },
};

/**
 * Production-ready ML Bridge with monitoring
 */
class ProductionMLBridge {
  private bridge: MLBridge;
  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.bridge = new MLBridge(PRODUCTION_CONFIG.polyglot);
  }

  /**
   * Initialize for production
   */
  async initialize(): Promise<void> {
    console.log('Initializing ML Bridge for production...');

    // Warm up models
    if (PRODUCTION_CONFIG.models.warmupOnStart) {
      console.log('Warming up models...');
      await this.bridge.warmup();
      console.log('✓ Models warmed up');
    }

    // Start monitoring
    if (PRODUCTION_CONFIG.monitoring.enableMetrics) {
      this.startMetricsCollection();
    }

    if (PRODUCTION_CONFIG.monitoring.enableHealthCheck) {
      this.startHealthChecks();
    }

    console.log('✓ ML Bridge initialized');
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      const metrics = this.bridge.getMetrics();

      // Log metrics in production format
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'metrics',
        data: {
          polyglot: {
            totalCalls: metrics.totalCalls,
            successRate: metrics.totalCalls > 0
              ? (metrics.successfulCalls / metrics.totalCalls * 100).toFixed(2)
              : '100',
            avgLatency: metrics.avgLatency.toFixed(3),
            cacheHitRate: metrics.totalCalls > 0
              ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(2)
              : 'N/A',
          },
          memory: process.memoryUsage(),
        },
      }));
    }, PRODUCTION_CONFIG.monitoring.metricsInterval);
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Quick health check: test sentiment model
        const result = await this.bridge.analyzeSentiment({
          text: 'health check',
        });

        const healthy = result.success && result.latency < 100;

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'health_check',
          status: healthy ? 'healthy' : 'degraded',
          latency: result.latency.toFixed(3),
        }));
      } catch (error) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'health_check',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }, PRODUCTION_CONFIG.monitoring.healthCheckInterval);
  }

  /**
   * Shutdown gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down ML Bridge...');

    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Log final metrics
    const finalMetrics = this.bridge.getMetrics();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'shutdown',
      finalMetrics,
    }));

    console.log('✓ ML Bridge shut down');
  }

  /**
   * Get the underlying bridge
   */
  getBridge(): MLBridge {
    return this.bridge;
  }
}

// Example usage
async function main() {
  console.log('🚀 Production Configuration Example\n');
  console.log('='.repeat(50));

  // Show configuration
  console.log('\nProduction Configuration:');
  console.log(JSON.stringify(PRODUCTION_CONFIG, null, 2));

  // Initialize production bridge
  console.log('\n\nInitializing production ML bridge...\n');
  const productionBridge = new ProductionMLBridge();
  await productionBridge.initialize();

  // Simulate production usage
  console.log('\n\nSimulating production traffic...\n');

  const mlBridge = productionBridge.getBridge();

  // Process some requests
  for (let i = 0; i < 10; i++) {
    const result = await mlBridge.analyzeSentiment({
      text: `Production request ${i}`,
    });

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'request',
      request_id: `req_${i}`,
      success: result.success,
      latency: result.latency.toFixed(3),
    }));

    // Simulate realistic interval
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Wait for metrics to be logged
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Shutdown
  console.log('\n\nShutting down...\n');
  await productionBridge.shutdown();

  console.log('\n✅ Production example complete!\n');
}

// Best practices documentation
console.log(`
╔════════════════════════════════════════════════════════════╗
║           Production Best Practices                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  1. Model Warm-up                                          ║
║     Always warm up models on server start to avoid        ║
║     slow first requests.                                   ║
║                                                            ║
║  2. Health Checks                                          ║
║     Implement periodic health checks to ensure models     ║
║     are responding correctly.                              ║
║                                                            ║
║  3. Metrics Collection                                     ║
║     Track performance metrics (latency, throughput,       ║
║     error rate) for monitoring and alerting.              ║
║                                                            ║
║  4. Error Handling                                         ║
║     Always check result.success and handle errors         ║
║     gracefully. Log errors in structured format.          ║
║                                                            ║
║  5. Batch Processing                                       ║
║     Use batch methods for better throughput when          ║
║     processing multiple items.                             ║
║                                                            ║
║  6. Resource Limits                                        ║
║     Set appropriate timeouts and request size limits      ║
║     to prevent resource exhaustion.                        ║
║                                                            ║
║  7. Caching                                                ║
║     Module caching is automatic. Monitor cache hit        ║
║     rate for optimization opportunities.                   ║
║                                                            ║
║  8. Graceful Shutdown                                      ║
║     Handle SIGTERM/SIGINT to close connections cleanly    ║
║     and log final metrics.                                 ║
║                                                            ║
║  9. Structured Logging                                     ║
║     Use JSON format for logs in production for better     ║
║     parsing and analysis.                                  ║
║                                                            ║
║  10. Environment Variables                                 ║
║      Use env vars for configuration to support            ║
║      different environments without code changes.         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { PRODUCTION_CONFIG, ProductionMLBridge };
