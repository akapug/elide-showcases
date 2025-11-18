/**
 * detect-browser - Browser and OS Detection
 *
 * Detect browser name, version, and operating system.
 * **POLYGLOT SHOWCASE**: One detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/detect-browser (~200K+ downloads/week)
 *
 * Features:
 * - Browser detection (Chrome, Firefox, Safari, Edge, etc.)
 * - OS detection
 * - Node.js detection
 * - Type-safe results
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export type BrowserName = 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'opera' | 'unknown';
export type OSName = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';

export interface BrowserInfo {
  name: BrowserName;
  version: string;
  os: OSName;
  type: 'browser' | 'node';
}

export function detectBrowser(userAgent?: string): BrowserInfo | null {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  if (!ua) {
    return { name: 'unknown', version: '', os: 'unknown', type: 'node' };
  }

  const browser = detectBrowserName(ua);
  const os = detectOS(ua);

  return {
    ...browser,
    os,
    type: 'browser',
  };
}

function detectBrowserName(ua: string): { name: BrowserName; version: string } {
  if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
    return { name: 'chrome', version: ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '' };
  }
  if (/Firefox/.test(ua)) {
    return { name: 'firefox', version: ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '' };
  }
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    return { name: 'safari', version: ua.match(/Version\/(\d+\.\d+)/)?.[1] || '' };
  }
  if (/Edg/.test(ua)) {
    return { name: 'edge', version: ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '' };
  }
  if (/MSIE|Trident/.test(ua)) {
    return { name: 'ie', version: ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || '' };
  }
  if (/OPR|Opera/.test(ua)) {
    return { name: 'opera', version: ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1] || '' };
  }
  return { name: 'unknown', version: '' };
}

function detectOS(ua: string): OSName {
  if (/Windows/.test(ua)) return 'windows';
  if (/Mac OS X/.test(ua)) return 'macos';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Linux/.test(ua)) return 'linux';
  return 'unknown';
}

export default detectBrowser;

// CLI Demo
if (import.meta.url.includes("elide-detect-browser.ts")) {
  console.log("🔎 detect-browser - Browser Detection for Elide (POLYGLOT!)\n");

  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
  const browser = detectBrowser(ua);

  console.log("=== Browser Info ===");
  console.log(browser);
  console.log();

  console.log("✅ Use Cases: Type-safe browser detection");
  console.log("🚀 ~200K+ downloads/week on npm!");
}
