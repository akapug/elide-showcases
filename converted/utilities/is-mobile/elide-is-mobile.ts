/**
 * is-mobile - Mobile Device Check
 *
 * Simple mobile device detection from User-Agent.
 * **POLYGLOT SHOWCASE**: One mobile checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-mobile (~200K+ downloads/week)
 *
 * Features:
 * - Quick mobile check
 * - Tablet support
 * - Simple boolean API
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface IsMobileOptions {
  ua?: string;
  tablet?: boolean;
  featureDetect?: boolean;
}

export function isMobile(opts?: IsMobileOptions | string): boolean {
  let ua: string;
  let tablet = true;

  if (typeof opts === 'string') {
    ua = opts;
  } else {
    ua = opts?.ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    tablet = opts?.tablet !== false;
  }

  const mobileRegex = /iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;

  if (tablet) {
    return mobileRegex.test(ua) || tabletRegex.test(ua);
  }

  return mobileRegex.test(ua);
}

export default isMobile;

// CLI Demo
if (import.meta.url.includes("elide-is-mobile.ts")) {
  console.log("📱 is-mobile - Mobile Check for Elide (POLYGLOT!)\n");

  const testUAs = [
    { name: 'iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1)' },
    { name: 'iPad', ua: 'Mozilla/5.0 (iPad; CPU OS 17_1)' },
    { name: 'Desktop', ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0' },
  ];

  console.log("=== Mobile Detection ===");
  testUAs.forEach(({ name, ua }) => {
    console.log(`${name}: ${isMobile(ua)}`);
  });
  console.log();

  console.log("✅ Use Cases: Quick mobile detection");
  console.log("🚀 ~200K+ downloads/week on npm!");
}
