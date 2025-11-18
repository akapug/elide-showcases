/**
 * Isomorphic-Fetch - Isomorphic WHATWG Fetch API
 *
 * Fetch for node and browser
 * Package has ~15M downloads/week on npm!
 */

export const fetch = globalThis.fetch;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;

export default fetch;

if (import.meta.url.includes("elide-isomorphic-fetch.ts")) {
  console.log("🌐 Isomorphic-Fetch (POLYGLOT!) | ~15M downloads/week");
}
