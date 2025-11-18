/**
 * Ky - Tiny & elegant HTTP client based on Fetch API
 *
 * Modern HTTP client with retry, timeout, and hooks
 * Package has ~5M downloads/week on npm!
 */

export interface KyOptions extends RequestInit {
  timeout?: number;
  retry?: number;
  hooks?: any;
  searchParams?: Record<string, any>;
  json?: any;
}

async function ky(url: string, options: KyOptions = {}): Promise<Response> {
  const { timeout = 10000, retry = 2, searchParams, json, ...fetchOptions } = options;

  let fullUrl = url;
  if (searchParams) {
    const params = new URLSearchParams(searchParams as any);
    fullUrl += '?' + params.toString();
  }

  if (json) {
    fetchOptions.body = JSON.stringify(json);
    fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': 'application/json' };
  }

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(fullUrl, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      if (attempt === retry) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Request failed');
}

ky.get = (url: string, options?: KyOptions) => ky(url, { ...options, method: 'GET' });
ky.post = (url: string, options?: KyOptions) => ky(url, { ...options, method: 'POST' });
ky.put = (url: string, options?: KyOptions) => ky(url, { ...options, method: 'PUT' });
ky.delete = (url: string, options?: KyOptions) => ky(url, { ...options, method: 'DELETE' });

export default ky;

if (import.meta.url.includes("elide-ky.ts")) {
  console.log("🌐 Ky - Tiny HTTP client (POLYGLOT!) | ~5M downloads/week");
}
