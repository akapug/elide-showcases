/**
 * Unfetch - Tiny 500b fetch polyfill
 *
 * Bare minimum fetch polyfill
 * Package has ~2M downloads/week on npm!
 */

export function unfetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, options);
}

export default unfetch;

if (import.meta.url.includes("elide-unfetch.ts")) {
  console.log("🌐 Unfetch - Tiny fetch (POLYGLOT!) | ~2M downloads/week");
}
