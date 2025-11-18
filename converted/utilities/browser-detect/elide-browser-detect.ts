/**
 * browser-detect - Simple Browser Detection
 *
 * Lightweight browser name detection from User-Agent.
 * **POLYGLOT SHOWCASE**: One browser detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/browser-detect (~100K+ downloads/week)
 *
 * Features:
 * - Browser name detection
 * - Version extraction
 * - OS detection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface BrowserInfo {
  name: string;
  version: string;
  os: string;
}

export function detect(userAgent?: string): BrowserInfo | null {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  if (!ua) return null;

  let name = 'unknown';
  let version = '';
  let os = 'unknown';

  // Browser detection
  if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
    name = 'chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (/Firefox/.test(ua)) {
    name = 'firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    name = 'safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (/Edg/.test(ua)) {
    name = 'edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || '';
  } else if (/MSIE|Trident/.test(ua)) {
    name = 'ie';
    version = ua.match(/(?:MSIE |rv:)(\d+)/)?.[1] || '';
  }

  // OS detection
  if (/Windows/.test(ua)) os = 'windows';
  else if (/Mac OS X/.test(ua)) os = 'macos';
  else if (/Linux/.test(ua)) os = 'linux';
  else if (/Android/.test(ua)) os = 'android';
  else if (/iPhone|iPad/.test(ua)) os = 'ios';

  return { name, version, os };
}

export default detect;

// CLI Demo
if (import.meta.url.includes("elide-browser-detect.ts")) {
  console.log("🔍 browser-detect - Browser Detection for Elide (POLYGLOT!)\n");

  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
  const browser = detect(ua);

  console.log("=== Browser Info ===");
  console.log(browser);
  console.log();

  console.log("✅ Use Cases: Simple browser detection");
  console.log("🚀 ~100K+ downloads/week on npm!");
}
