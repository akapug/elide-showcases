/**
 * XHR - XMLHttpRequest wrapper
 * Package has ~5M downloads/week on npm!
 */

export interface XHROptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  json?: boolean;
  timeout?: number;
}

export function xhr(options: XHROptions, callback: (err: any, resp: any, body: any) => void) {
  const { method = 'GET', body, headers = {}, json = false, timeout = 0 } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
  };

  if (body) {
    fetchOptions.body = json ? JSON.stringify(body) : body;
  }

  fetch(options.url || '', fetchOptions)
    .then(async (response) => {
      const responseBody = json ? await response.json() : await response.text();
      callback(null, { statusCode: response.status }, responseBody);
    })
    .catch((error) => {
      callback(error, null, null);
    });
}

export default xhr;

if (import.meta.url.includes("elide-xhr.ts")) {
  console.log("🌐 XHR - XMLHttpRequest wrapper (POLYGLOT!) | ~5M downloads/week");
}
