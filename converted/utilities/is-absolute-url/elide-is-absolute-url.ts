/**
 * Is Absolute URL - Check if URL is absolute
 *
 * Check if a URL is absolute
 * Package has ~20M downloads/week on npm!
 */

export function isAbsoluteUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  // Check for protocol
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
    return true;
  }

  // Check for protocol-relative URL
  if (url.startsWith('//')) {
    return true;
  }

  return false;
}

export default isAbsoluteUrl;

if (import.meta.url.includes("elide-is-absolute-url.ts")) {
  console.log("🌐 Is Absolute URL (POLYGLOT!)\n");
  console.log("Examples:");
  console.log("isAbsoluteUrl('https://example.com') =>", isAbsoluteUrl('https://example.com'));
  console.log("isAbsoluteUrl('/path/to/page') =>", isAbsoluteUrl('/path/to/page'));
  console.log("isAbsoluteUrl('//example.com') =>", isAbsoluteUrl('//example.com'));
  console.log("\n📦 ~20M downloads/week on npm");
}
