/**
 * HTTP-Cache-Semantics - HTTP Caching Rules
 * Based on https://www.npmjs.com/package/http-cache-semantics (~2M+ downloads/week)
 * Features: RFC 7234 HTTP caching
 */

export class CachePolicy {
  constructor(
    private request: { headers: Record<string, string> },
    private response: { headers: Record<string, string>; status: number }
  ) {}

  storable(): boolean {
    const { status } = this.response;
    const cacheControl = this.response.headers['cache-control'] || '';
    
    if (cacheControl.includes('no-store')) return false;
    if (cacheControl.includes('private')) return false;
    if (status === 200 || status === 301) return true;
    
    return false;
  }

  maxAge(): number {
    const cacheControl = this.response.headers['cache-control'] || '';
    const match = cacheControl.match(/max-age=(\d+)/);
    return match ? parseInt(match[1], 10) * 1000 : 0;
  }

  age(): number {
    const ageHeader = this.response.headers['age'];
    return ageHeader ? parseInt(ageHeader, 10) * 1000 : 0;
  }

  stale(): boolean {
    return this.age() > this.maxAge();
  }
}

export default CachePolicy;

if (import.meta.url.includes("elide-http-cache-semantics.ts")) {
  console.log("🌐 HTTP-Cache-Semantics (~2M+/week)\n");
  
  const policy = new CachePolicy(
    { headers: {} },
    { headers: { 'cache-control': 'max-age=3600' }, status: 200 }
  );
  
  console.log("Storable:", policy.storable());
  console.log("Max age:", policy.maxAge(), "ms");
  console.log("Stale:", policy.stale());
}
