/**
 * Get URLs - Extract URLs from text
 *
 * Extract all URLs from a string
 * Package has ~3M downloads/week on npm!
 */

export interface GetUrlsOptions {
  requireSchemeOrWww?: boolean;
  normalizeProtocol?: boolean;
  stripWWW?: boolean;
  sortQueryParameters?: boolean;
}

export function getUrls(text: string, options: GetUrlsOptions = {}): Set<string> {
  const urls = new Set<string>();

  // URL regex pattern
  const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;

  const matches = text.match(urlPattern);

  if (matches) {
    for (const match of matches) {
      urls.add(match);
    }
  }

  return urls;
}

export default getUrls;

if (import.meta.url.includes("elide-get-urls.ts")) {
  console.log("🌐 Get URLs (POLYGLOT!)\n");
  console.log("Example:");
  const text = "Check out https://example.com and https://test.org for more!";
  const urls = getUrls(text);
  console.log("Text:", text);
  console.log("URLs found:", Array.from(urls));
  console.log("\n📦 ~3M downloads/week on npm");
}
