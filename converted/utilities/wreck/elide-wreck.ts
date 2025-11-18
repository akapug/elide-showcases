/**
 * Wreck - HTTP client utilities
 * Package has ~3M downloads/week on npm!
 */

export interface WreckOptions {
  headers?: Record<string, string>;
  payload?: any;
  json?: boolean;
  timeout?: number;
}

export async function request(method: string, url: string, options: WreckOptions = {}) {
  const { headers = {}, payload, json = false, timeout = 0 } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
  };

  if (payload) {
    fetchOptions.body = json ? JSON.stringify(payload) : payload;
  }

  const response = await fetch(url, fetchOptions);
  const body = json ? await response.json() : await response.text();

  return {
    res: response,
    payload: body,
  };
}

export const get = (url: string, options?: WreckOptions) => request('GET', url, options);
export const post = (url: string, options?: WreckOptions) => request('POST', url, options);
export const put = (url: string, options?: WreckOptions) => request('PUT', url, options);
export const del = (url: string, options?: WreckOptions) => request('DELETE', url, options);

export default { request, get, post, put, delete: del };

if (import.meta.url.includes("elide-wreck.ts")) {
  console.log("🌐 Wreck - HTTP utilities (POLYGLOT!) | ~3M downloads/week");
}
