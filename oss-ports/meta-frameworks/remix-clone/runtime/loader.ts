/**
 * Loader System - Server-side data loading
 *
 * Features:
 * - Parallel loader execution
 * - Type-safe data
 * - Error handling
 * - Caching
 */

export interface LoaderContext {
  request: Request;
  params: Record<string, string>;
  context: Record<string, any>;
}

export interface LoaderFunction {
  (context: LoaderContext): Promise<Response> | Response;
}

export class LoaderExecutor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 60000; // 1 minute

  /**
   * Execute loader
   */
  async execute(
    loaderPath: string,
    context: LoaderContext
  ): Promise<Response> {
    const start = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(loaderPath, context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[Loader] Cache hit: ${loaderPath}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load module
    const module = await import(loaderPath);
    const loader = module.loader as LoaderFunction;

    if (!loader) {
      return new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Execute loader
    try {
      const response = await loader(context);

      // Cache response
      if (response.ok) {
        const data = await response.clone().json();
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      const elapsed = performance.now() - start;
      console.log(`[Loader] Executed ${loaderPath} in ${elapsed.toFixed(2)}ms`);

      return response;
    } catch (error) {
      console.error(`[Loader] Error in ${loaderPath}:`, error);

      return new Response(
        JSON.stringify({ error: String(error) }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  /**
   * Execute multiple loaders in parallel
   */
  async executeMultiple(
    loaders: Array<{ path: string; context: LoaderContext }>
  ): Promise<Response[]> {
    return Promise.all(
      loaders.map(({ path, context }) => this.execute(path, context))
    );
  }

  /**
   * Get cache key
   */
  private getCacheKey(path: string, context: LoaderContext): string {
    return `${path}:${JSON.stringify(context.params)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Helper functions for loaders
 */
export function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

export function redirect(url: string, init: number | ResponseInit = 302): Response {
  const status = typeof init === 'number' ? init : init.status || 302;
  const headers = new Headers(typeof init === 'object' ? init.headers : {});

  headers.set('Location', url);

  return new Response(null, {
    status,
    headers,
  });
}

export function defer<T extends Record<string, unknown>>(data: T): Response {
  // Simplified defer - in production, use streaming
  return json(data);
}

export default LoaderExecutor;
