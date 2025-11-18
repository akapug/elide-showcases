/**
 * Needle - Streamable HTTP client
 * Package has ~8M downloads/week on npm!
 */

export interface NeedleOptions {
  headers?: Record<string, string>;
  json?: boolean;
  follow_max?: number;
  timeout?: number;
}

async function needle(method: string, url: string, data?: any, options: NeedleOptions = {}): Promise<any> {
  const { headers = {}, json = false, timeout = 0 } = options;

  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    fetchOptions.body = json ? JSON.stringify(data) : data;
  }

  const response = await fetch(url, fetchOptions);
  const body = json ? await response.json() : await response.text();

  return {
    statusCode: response.status,
    body,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

needle.get = (url: string, options?: NeedleOptions) => needle('GET', url, null, options);
needle.post = (url: string, data?: any, options?: NeedleOptions) => needle('POST', url, data, options);
needle.put = (url: string, data?: any, options?: NeedleOptions) => needle('PUT', url, data, options);
needle.delete = (url: string, options?: NeedleOptions) => needle('DELETE', url, null, options);

export default needle;

if (import.meta.url.includes("elide-needle.ts")) {
  console.log("🌐 Needle - Streamable HTTP (POLYGLOT!) | ~8M downloads/week");
}
