/**
 * Canonical URL - Canonical Link Generator
 *
 * Generate canonical URLs for SEO.
 * **POLYGLOT SHOWCASE**: One canonical URL generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/canonical-url (~20K+ downloads/week)
 *
 * Features:
 * - Generate canonical URLs
 * - Normalize URLs
 * - Remove query parameters
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export function canonicalize(url: string, options?: {
  removeQuery?: boolean;
  removeHash?: boolean;
  lowercasePath?: boolean;
}): string {
  try {
    const parsed = new URL(url);
    let canonical = `${parsed.protocol}//${parsed.hostname}`;

    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      canonical += `:${parsed.port}`;
    }

    let path = parsed.pathname;
    if (options?.lowercasePath) {
      path = path.toLowerCase();
    }

    canonical += path;

    if (!options?.removeQuery && parsed.search) {
      canonical += parsed.search;
    }

    if (!options?.removeHash && parsed.hash) {
      canonical += parsed.hash;
    }

    return canonical;
  } catch (e) {
    return url;
  }
}

export function generateCanonicalTag(url: string): string {
  return `<link rel="canonical" href="${canonicalize(url)}">`;
}

export default { canonicalize, generateCanonicalTag };

if (import.meta.url.includes("elide-canonical-url.ts")) {
  console.log("🔗 Canonical URL - Canonical Link Generator (POLYGLOT!)\n");

  const url1 = 'https://example.com/page?utm_source=twitter';
  const url2 = 'https://example.com/Page#section';

  console.log("Original:", url1);
  console.log("Canonical:", canonicalize(url1, { removeQuery: true }));
  console.log();

  console.log("Original:", url2);
  console.log("Canonical:", canonicalize(url2, { lowercasePath: true, removeHash: true }));
  console.log();

  console.log("Tag:", generateCanonicalTag(url1));
  console.log("\n~20K+ downloads/week on npm!");
}
