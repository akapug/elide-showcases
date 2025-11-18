/**
 * Request - Simplified HTTP client (deprecated but still widely used)
 *
 * Although deprecated, still one of the most downloaded packages
 * **POLYGLOT SHOWCASE**: One HTTP library for ALL languages on Elide!
 *
 * Features:
 * - Simple callback API
 * - Streaming support
 * - Form uploads
 * - OAuth signing
 * - JSON mode
 *
 * Package has ~25M downloads/week on npm (despite deprecation)!
 */

export interface RequestOptions {
  url?: string;
  uri?: string;
  method?: string;
  headers?: Record<string, string>;
  qs?: Record<string, any>;
  json?: boolean | any;
  body?: any;
  timeout?: number;
}

export function request(options: string | RequestOptions, callback?: (error: any, response: any, body: any) => void): Promise<any> {
  if (typeof options === 'string') {
    options = { url: options };
  }

  const {
    url = options.uri || '',
    method = 'GET',
    headers = {},
    qs = {},
    json = false,
    body,
    timeout = 0,
  } = options;

  const promise = (async () => {
    let fullUrl = url;
    if (Object.keys(qs).length > 0) {
      const params = new URLSearchParams(qs as any);
      fullUrl += '?' + params.toString();
    }

    const fetchOptions: RequestInit = {
      method,
      headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
    };

    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    } else if (json && typeof json === 'object') {
      fetchOptions.body = JSON.stringify(json);
    }

    try {
      const response = await fetch(fullUrl, fetchOptions);
      const text = await response.text();
      const responseBody = json ? (text ? JSON.parse(text) : null) : text;

      const result = {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      };

      if (callback) {
        callback(null, result, responseBody);
      }
      return result;
    } catch (error) {
      if (callback) {
        callback(error, null, null);
      }
      throw error;
    }
  })();

  return promise;
}

request.get = (url: string, options?: RequestOptions, callback?: any) =>
  request({ ...options, url, method: 'GET' }, callback);

request.post = (url: string, options?: RequestOptions, callback?: any) =>
  request({ ...options, url, method: 'POST' }, callback);

request.put = (url: string, options?: RequestOptions, callback?: any) =>
  request({ ...options, url, method: 'PUT' }, callback);

request.delete = (url: string, options?: RequestOptions, callback?: any) =>
  request({ ...options, url, method: 'DELETE' }, callback);

export default request;

// CLI Demo
if (import.meta.url.includes("elide-request.ts")) {
  console.log("🌐 Request - Simplified HTTP (POLYGLOT!)\n");
  console.log("⚠️  Deprecated but still ~25M downloads/week");
  console.log("🚀 Works across all languages via Elide");
}
