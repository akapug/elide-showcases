/**
 * WHATWG URL - WHATWG URL Standard implementation
 *
 * Implementation of the WHATWG URL Standard
 * Package has ~120M downloads/week on npm!
 */

export const URL = globalThis.URL;
export const URLSearchParams = globalThis.URLSearchParams;

export function parseURL(url: string, base?: string) {
  return new URL(url, base);
}

export default { URL, URLSearchParams, parseURL };

if (import.meta.url.includes("elide-whatwg-url.ts")) {
  console.log("🌐 WHATWG URL - URL Standard (POLYGLOT!) | ~120M downloads/week");
}
