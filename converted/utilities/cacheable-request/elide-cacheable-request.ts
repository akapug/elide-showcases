/**
 * Cacheable-Request - HTTP Request Caching
 * Based on https://www.npmjs.com/package/cacheable-request (~2M+ downloads/week)
 * Features: Cache HTTP requests with TTL
 */

export class CacheableRequest {
  private cache: Map<string, { response: any; timestamp: number }> = new Map();

  constructor(private ttl: number = 60000) {}

  async request(url: string, options: any = {}): Promise<any> {
    const cacheKey = \`\${options.method || 'GET'}:\${url}\`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.response;
    }

    // Simulated request
    const response = {
      url,
      status: 200,
      data: \`Response for \${url}\`,
      timestamp: Date.now()
    };

    this.cache.set(cacheKey, { response, timestamp: Date.now() });
    return response;
  }

  clear(): void {
    this.cache.clear();
  }
}

export default CacheableRequest;

if (import.meta.url.includes("elide-cacheable-request.ts")) {
  console.log("🌐 Cacheable-Request (~2M+/week)\n");
  
  const cacheableRequest = new CacheableRequest(5000);
  
  (async () => {
    console.log("Request 1:", await cacheableRequest.request('https://api.example.com/data'));
    console.log("Request 2 (cached):", await cacheableRequest.request('https://api.example.com/data'));
  })();
}
