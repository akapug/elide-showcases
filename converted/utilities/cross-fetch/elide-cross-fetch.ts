/**
 * Cross-Fetch - Universal fetch for Node & Browser
 *
 * Universal WHATWG Fetch API for Node, Browsers and React Native
 * Package has ~80M downloads/week on npm!
 */

export const fetch = globalThis.fetch;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;

export default fetch;

if (import.meta.url.includes("elide-cross-fetch.ts")) {
  console.log("🌐 Cross-Fetch - Universal Fetch (POLYGLOT!) | ~80M downloads/week");
}
