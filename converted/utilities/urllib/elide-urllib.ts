/**
 * urllib - HTTP client for Node.js
 * Package has ~1M downloads/week on npm!
 */

export interface UrllibOptions {
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  dataType?: 'json' | 'text';
  timeout?: number;
}

export async function request(url: string, options: UrllibOptions = {}) {
  const { method = 'GET', headers = {}, data, dataType = 'text', timeout = 0 } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: dataType === 'json' ? { 'Content-Type': 'application/json', ...headers } : headers,
  };

  if (data) {
    fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);
  const body = dataType === 'json' ? await response.json() : await response.text();

  return {
    status: response.status,
    data: body,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

export default { request };

if (import.meta.url.includes("elide-urllib.ts")) {
  console.log("🌐 urllib - HTTP client (POLYGLOT!) | ~1M downloads/week");
}
