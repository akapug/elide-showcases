/**
 * Polyglot Bridge for TypeScript ↔ Python Communication
 *
 * This module provides utilities for seamless cross-language calls using
 * GraalVM's Polyglot API, enabling <1ms TypeScript→Python function calls.
 *
 * Key Features:
 * - Automatic type conversion between JS and Python
 * - Module caching for optimal performance
 * - Error propagation across language boundaries
 * - Type-safe interfaces for Python functions
 *
 * @module polyglot/bridge
 */

declare const Polyglot: any;

/**
 * Configuration options for the Polyglot Bridge
 */
export interface PolyglotConfig {
  /** Python module search paths */
  pythonPath?: string[];
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Cache size for loaded modules */
  cacheSize?: number;
  /** Timeout for Python calls (ms) */
  timeout?: number;
}

/**
 * Result type for Python function calls
 */
export interface PolyglotResult<T = any> {
  /** The actual result from Python */
  data: T;
  /** Execution time in milliseconds */
  latency: number;
  /** Whether the call succeeded */
  success: boolean;
  /** Error details if failed */
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

/**
 * Metrics for polyglot performance tracking
 */
interface PolyglotMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalLatency: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Main Polyglot Bridge class
 *
 * Manages Python context and provides methods for calling Python code
 * from TypeScript with minimal overhead.
 */
export class PolyglotBridge {
  private pythonContext: any;
  private moduleCache: Map<string, any>;
  private config: Required<PolyglotConfig>;
  private metrics: PolyglotMetrics;

  constructor(config: PolyglotConfig = {}) {
    this.config = {
      pythonPath: config.pythonPath || ['./src/polyglot', './ml', '.'],
      debug: config.debug || false,
      cacheSize: config.cacheSize || 100,
      timeout: config.timeout || 30000,
    };

    this.moduleCache = new Map();
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalLatency: 0,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.initializePythonContext();
    this.log('Polyglot bridge initialized');
  }

  /**
   * Initialize the Python polyglot context
   */
  private initializePythonContext(): void {
    try {
      // Access the Python polyglot context
      this.pythonContext = Polyglot.import('python');

      // Set Python path for module imports
      const pythonPathSetup = `
import sys
${this.config.pythonPath.map(path => `sys.path.insert(0, '${path}')`).join('\n')}
      `;

      this.pythonContext.eval(pythonPathSetup);
      this.log('Python context initialized with paths:', this.config.pythonPath);
    } catch (error) {
      console.error('Failed to initialize Python context:', error);
      throw new Error('Polyglot initialization failed. Ensure GraalVM with Python support is installed.');
    }
  }

  /**
   * Call a Python function from TypeScript
   *
   * @param moduleName - Name of the Python module (e.g., 'sentiment_model')
   * @param functionName - Name of the function to call (e.g., 'analyze')
   * @param args - Arguments to pass (will be converted to Python types)
   * @returns Promise with the result
   */
  async callPython<T = any>(
    moduleName: string,
    functionName: string,
    args?: any
  ): Promise<PolyglotResult<T>> {
    const startTime = performance.now();
    this.metrics.totalCalls++;

    try {
      this.log(`Calling ${moduleName}.${functionName}`, args);

      // Get the Python module (cached)
      const module = this.getModule(moduleName);

      // Get the function from the module
      if (!module[functionName]) {
        throw new Error(`Function '${functionName}' not found in module '${moduleName}'`);
      }

      // Call the Python function
      // The polyglot API automatically converts JS objects to Python dicts
      const result = await module[functionName](args || {});

      const latency = performance.now() - startTime;
      this.updateMetrics(latency, true);

      this.log(`Call succeeded in ${latency.toFixed(2)}ms`, result);

      return {
        data: result as T,
        latency,
        success: true,
      };
    } catch (error) {
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, false);

      const errorDetails = this.extractErrorDetails(error);
      console.error(`Polyglot call failed: ${moduleName}.${functionName}`, errorDetails);

      return {
        data: null as T,
        latency,
        success: false,
        error: errorDetails,
      };
    }
  }

  /**
   * Call Python function synchronously (use sparingly)
   */
  callPythonSync<T = any>(
    moduleName: string,
    functionName: string,
    args?: any
  ): PolyglotResult<T> {
    const startTime = performance.now();
    this.metrics.totalCalls++;

    try {
      const module = this.getModule(moduleName);

      if (!module[functionName]) {
        throw new Error(`Function '${functionName}' not found in module '${moduleName}'`);
      }

      const result = module[functionName](args || {});
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, true);

      return {
        data: result as T,
        latency,
        success: true,
      };
    } catch (error) {
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, false);

      return {
        data: null as T,
        latency,
        success: false,
        error: this.extractErrorDetails(error),
      };
    }
  }

  /**
   * Get or import a Python module (with caching)
   */
  private getModule(moduleName: string): any {
    // Check cache first
    if (this.moduleCache.has(moduleName)) {
      this.metrics.cacheHits++;
      this.log(`Cache hit for module: ${moduleName}`);
      return this.moduleCache.get(moduleName);
    }

    this.metrics.cacheMisses++;
    this.log(`Cache miss, importing module: ${moduleName}`);

    try {
      // Import the Python module
      const importCode = `
import ${moduleName}
${moduleName}
      `.trim();

      const module = this.pythonContext.eval(importCode);

      // Cache the module
      if (this.moduleCache.size >= this.config.cacheSize) {
        // Simple LRU: remove first entry
        const firstKey = this.moduleCache.keys().next().value;
        this.moduleCache.delete(firstKey);
      }

      this.moduleCache.set(moduleName, module);
      return module;
    } catch (error) {
      throw new Error(`Failed to import Python module '${moduleName}': ${error}`);
    }
  }

  /**
   * Execute arbitrary Python code (use with caution)
   */
  evalPython<T = any>(code: string): T {
    try {
      return this.pythonContext.eval(code) as T;
    } catch (error) {
      console.error('Python eval failed:', error);
      throw error;
    }
  }

  /**
   * Extract error details from Python exceptions
   */
  private extractErrorDetails(error: any): { type: string; message: string; stack?: string } {
    if (error && error.isPythonException) {
      return {
        type: error.pythonExceptionType || 'PythonError',
        message: error.message || String(error),
        stack: error.stack,
      };
    }

    return {
      type: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack,
    };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(latency: number, success: boolean): void {
    if (success) {
      this.metrics.successfulCalls++;
    } else {
      this.metrics.failedCalls++;
    }

    this.metrics.totalLatency += latency;
    this.metrics.avgLatency = this.metrics.totalLatency / this.metrics.totalCalls;
    this.metrics.minLatency = Math.min(this.metrics.minLatency, latency);
    this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latency);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PolyglotMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalLatency: 0,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Clear module cache
   */
  clearCache(): void {
    this.moduleCache.clear();
    this.log('Module cache cleared');
  }

  /**
   * Warm up modules by importing them ahead of time
   */
  async warmup(modules: string[]): Promise<void> {
    this.log(`Warming up ${modules.length} modules...`);
    const startTime = performance.now();

    for (const moduleName of modules) {
      try {
        this.getModule(moduleName);
        this.log(`  ✓ ${moduleName} loaded`);
      } catch (error) {
        console.error(`  ✗ ${moduleName} failed to load:`, error);
      }
    }

    const duration = performance.now() - startTime;
    this.log(`Warmup completed in ${duration.toFixed(2)}ms`);
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[PolyglotBridge]', ...args);
    }
  }

  /**
   * Get bridge info for debugging
   */
  getInfo(): {
    config: PolyglotConfig;
    metrics: PolyglotMetrics;
    cachedModules: string[];
  } {
    return {
      config: this.config,
      metrics: this.getMetrics(),
      cachedModules: Array.from(this.moduleCache.keys()),
    };
  }
}

/**
 * Type-safe interfaces for specific Python models
 */

export interface SentimentAnalysisInput {
  text: string;
  options?: {
    detailed?: boolean;
    threshold?: number;
  };
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  score: number;
  scores?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface ImageClassificationInput {
  image_url?: string;
  image_data?: string; // base64 encoded
  top_k?: number;
}

export interface ImageClassificationResult {
  predictions: Array<{
    label: string;
    confidence: number;
    class_id?: number;
  }>;
}

export interface RecommendationInput {
  user_id: string;
  context?: Record<string, any>;
  limit?: number;
}

export interface RecommendationResult {
  recommendations: Array<{
    item_id: string;
    score: number;
    reason?: string;
  }>;
}

/**
 * Convenience wrapper for common ML operations
 */
export class MLBridge {
  private bridge: PolyglotBridge;

  constructor(config?: PolyglotConfig) {
    this.bridge = new PolyglotBridge(config);
  }

  /**
   * Analyze text sentiment
   */
  async analyzeSentiment(input: SentimentAnalysisInput): Promise<PolyglotResult<SentimentAnalysisResult>> {
    return this.bridge.callPython<SentimentAnalysisResult>(
      'sentiment_model',
      'analyze',
      input
    );
  }

  /**
   * Classify image
   */
  async classifyImage(input: ImageClassificationInput): Promise<PolyglotResult<ImageClassificationResult>> {
    return this.bridge.callPython<ImageClassificationResult>(
      'image_classifier',
      'classify',
      input
    );
  }

  /**
   * Get recommendations
   */
  async getRecommendations(input: RecommendationInput): Promise<PolyglotResult<RecommendationResult>> {
    return this.bridge.callPython<RecommendationResult>(
      'recommender',
      'recommend',
      input
    );
  }

  /**
   * Batch sentiment analysis
   */
  async analyzeSentimentBatch(texts: string[]): Promise<PolyglotResult<SentimentAnalysisResult[]>> {
    return this.bridge.callPython<SentimentAnalysisResult[]>(
      'sentiment_model',
      'analyze_batch',
      { texts }
    );
  }

  /**
   * Get underlying bridge for advanced operations
   */
  getBridge(): PolyglotBridge {
    return this.bridge;
  }

  /**
   * Warm up all ML models
   */
  async warmup(): Promise<void> {
    await this.bridge.warmup([
      'sentiment_model',
      'image_classifier',
      'recommender',
    ]);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PolyglotMetrics {
    return this.bridge.getMetrics();
  }
}

// Export singleton instance for convenience
export const mlBridge = new MLBridge({ debug: false });
