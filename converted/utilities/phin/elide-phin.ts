/**
 * Phin - Lightweight HTTP client
 * Package has ~500K downloads/week on npm!
 */

export interface PhinOptions {
  url: string;
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  parse?: 'json' | 'none';
}

export async function phin(options: string | PhinOptions): Promise<any> {
  if (typeof options === 'string') {
    options = { url: options };
  }

  const { url, method = 'GET', data, headers = {}, parse = 'none' } = options;

  const fetchOptions: RequestInit = { method, headers };
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);
  return parse === 'json' ? response.json() : response.text();
}

export default phin;

if (import.meta.url.includes("elide-phin.ts")) {
  console.log("🌐 Phin - Lightweight HTTP (POLYGLOT!) | ~500K downloads/week");
}
