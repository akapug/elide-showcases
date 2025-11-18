/**
 * Hyperquest - Streaming HTTP requests
 * Package has ~2M downloads/week on npm!
 */

export interface HyperquestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export function hyperquest(url: string, options: HyperquestOptions = {}): Promise<Response> {
  return fetch(url, options);
}

export default hyperquest;

if (import.meta.url.includes("elide-hyperquest.ts")) {
  console.log("🌐 Hyperquest - Streaming HTTP (POLYGLOT!) | ~2M downloads/week");
}
