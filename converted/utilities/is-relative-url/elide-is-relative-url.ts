/**
 * Is Relative URL - Check if URL is relative
 *
 * Check if a URL is relative
 * Package has ~5M downloads/week on npm!
 */

export function isRelativeUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  // Not absolute = relative
  // Check for protocol
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
    return false;
  }

  // Check for protocol-relative URL
  if (url.startsWith('//')) {
    return false;
  }

  return true;
}

export default isRelativeUrl;

if (import.meta.url.includes("elide-is-relative-url.ts")) {
  console.log("🌐 Is Relative URL (POLYGLOT!)\n");
  console.log("Examples:");
  console.log("isRelativeUrl('/path/to/page') =>", isRelativeUrl('/path/to/page'));
  console.log("isRelativeUrl('https://example.com') =>", isRelativeUrl('https://example.com'));
  console.log("isRelativeUrl('./file.html') =>", isRelativeUrl('./file.html'));
  console.log("\n📦 ~5M downloads/week on npm");
}
