/**
 * Parse URL - Advanced URL parser
 *
 * Parse URLs and return detailed information
 * Package has ~3M downloads/week on npm!
 */

export interface ParsedUrl {
  protocols: string[];
  protocol: string;
  port: string;
  resource: string;
  user: string;
  password: string;
  pathname: string;
  hash: string;
  search: string;
  href: string;
}

export function parseUrl(url: string): ParsedUrl {
  try {
    const urlObj = new URL(url);

    return {
      protocols: [urlObj.protocol.replace(':', '')],
      protocol: urlObj.protocol.replace(':', ''),
      port: urlObj.port,
      resource: urlObj.hostname,
      user: urlObj.username,
      password: urlObj.password,
      pathname: urlObj.pathname,
      hash: urlObj.hash.replace('#', ''),
      search: urlObj.search.replace('?', ''),
      href: urlObj.href,
    };
  } catch {
    return {} as ParsedUrl;
  }
}

export default parseUrl;

if (import.meta.url.includes("elide-parse-url.ts")) {
  console.log("🌐 Parse URL (POLYGLOT!) | ~3M downloads/week");
}
