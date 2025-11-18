/**
 * Tiny JSON HTTP - Minimal JSON HTTP client
 * Package has ~500K downloads/week on npm!
 */

export interface TinyOptions {
  url?: string;
  data?: any;
  headers?: Record<string, string>;
}

async function makeRequest(method: string, options: string | TinyOptions) {
  if (typeof options === 'string') {
    options = { url: options };
  }

  const { url = '', data, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };

  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);
  const body = await response.json();

  return { body, headers: Object.fromEntries(response.headers.entries()) };
}

export const get = (options: string | TinyOptions) => makeRequest('GET', options);
export const post = (options: string | TinyOptions) => makeRequest('POST', options);
export const put = (options: string | TinyOptions) => makeRequest('PUT', options);
export const del = (options: string | TinyOptions) => makeRequest('DELETE', options);

export default { get, post, put, delete: del };

if (import.meta.url.includes("elide-tiny-json-http.ts")) {
  console.log("🌐 Tiny JSON HTTP (POLYGLOT!) | ~500K downloads/week");
}
