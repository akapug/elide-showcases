/**
 * Normalize URL - Normalize a URL
 *
 * Normalize URLs to a consistent format
 * Package has ~40M downloads/week on npm!
 */

export interface NormalizeOptions {
  defaultProtocol?: string;
  normalizeProtocol?: boolean;
  forceHttp?: boolean;
  forceHttps?: boolean;
  stripAuthentication?: boolean;
  stripHash?: boolean;
  stripTextFragment?: boolean;
  stripWWW?: boolean;
  removeQueryParameters?: boolean | string[];
  removeTrailingSlash?: boolean;
  removeSingleSlash?: boolean;
  removeDirectoryIndex?: boolean | string[];
  sortQueryParameters?: boolean;
}

export function normalizeUrl(url: string, options: NormalizeOptions = {}): string {
  const {
    defaultProtocol = 'https:',
    stripHash = false,
    stripWWW = true,
    removeTrailingSlash = true,
    sortQueryParameters = true,
  } = options;

  try {
    let urlObj = new URL(url);

    // Strip www
    if (stripWWW && urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.slice(4);
    }

    // Strip hash
    if (stripHash) {
      urlObj.hash = '';
    }

    // Sort query parameters
    if (sortQueryParameters) {
      const params = Array.from(urlObj.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
      urlObj.search = new URLSearchParams(params).toString();
    }

    let normalized = urlObj.toString();

    // Remove trailing slash
    if (removeTrailingSlash && normalized.endsWith('/') && urlObj.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return url;
  }
}

export default normalizeUrl;

if (import.meta.url.includes("elide-normalize-url.ts")) {
  console.log("🌐 Normalize URL (POLYGLOT!)\n");
  console.log("Example:");
  console.log(normalizeUrl('https://www.example.com/path/?z=1&a=2#hash'));
  console.log("\n📦 ~40M downloads/week on npm");
}
