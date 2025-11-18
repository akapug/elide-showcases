/**
 * ismobilejs - Simple Mobile Detection
 *
 * Lightweight mobile, tablet, and phone detection utility.
 * **POLYGLOT SHOWCASE**: One mobile checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ismobilejs (~100K+ downloads/week)
 *
 * Features:
 * - Apple device detection (iPhone, iPad, iPod)
 * - Android device detection
 * - Windows Phone detection
 * - Seven device profile
 * - Amazon device detection
 * - Zero dependencies
 *
 * Use cases:
 * - Quick mobile checks
 * - Simple device routing
 * - Minimal mobile detection
 * - Lightweight alternative
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface IsMobileResult {
  apple: {
    phone: boolean;
    ipod: boolean;
    tablet: boolean;
    universal: boolean;
    device: boolean;
  };
  amazon: {
    phone: boolean;
    tablet: boolean;
    device: boolean;
  };
  android: {
    phone: boolean;
    tablet: boolean;
    device: boolean;
  };
  windows: {
    phone: boolean;
    tablet: boolean;
    device: boolean;
  };
  other: {
    blackberry: boolean;
    blackberry10: boolean;
    opera: boolean;
    firefox: boolean;
    chrome: boolean;
    device: boolean;
  };
  any: boolean;
  phone: boolean;
  tablet: boolean;
}

/**
 * Detect mobile device from user agent
 */
export function isMobile(userAgent?: string): IsMobileResult {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  // Apple devices
  const apple = {
    phone: /iPhone/.test(ua),
    ipod: /iPod/.test(ua),
    tablet: /iPad/.test(ua),
    universal: /iPhone|iPod|iPad/.test(ua),
    device: /iPhone|iPod|iPad/.test(ua),
  };

  // Amazon devices
  const amazon = {
    phone: /(?:SD4930UR|Kindle Fire|Silk-Accelerated)/.test(ua),
    tablet: /Kindle|Silk/.test(ua) && !/Mobile/.test(ua),
    device: /Kindle|Silk/.test(ua),
  };

  // Android devices
  const android = {
    phone: /Android/.test(ua) && /Mobile/.test(ua),
    tablet: /Android/.test(ua) && !/Mobile/.test(ua),
    device: /Android/.test(ua),
  };

  // Windows devices
  const windows = {
    phone: /Windows Phone/.test(ua),
    tablet: /Windows/.test(ua) && /Touch/.test(ua) && !/Phone/.test(ua),
    device: /Windows Phone|Windows.*Touch/.test(ua),
  };

  // Other devices
  const other = {
    blackberry: /BlackBerry|BB10/.test(ua),
    blackberry10: /BB10/.test(ua),
    opera: /Opera Mini/.test(ua),
    firefox: /Firefox/.test(ua) && /Mobile/.test(ua),
    chrome: /Chrome/.test(ua) && /Mobile/.test(ua),
    device: /BlackBerry|BB10|Opera Mini|Firefox.*Mobile|Chrome.*Mobile/.test(ua),
  };

  // Aggregate flags
  const phone = apple.phone || amazon.phone || android.phone || windows.phone || other.blackberry || other.firefox || other.chrome;
  const tablet = apple.tablet || amazon.tablet || android.tablet || windows.tablet;
  const any = phone || tablet || apple.ipod;

  return {
    apple,
    amazon,
    android,
    windows,
    other,
    any,
    phone,
    tablet,
  };
}

export default isMobile;

// CLI Demo
if (import.meta.url.includes("elide-ismobilejs.ts")) {
  console.log("📱 ismobilejs - Simple Mobile Detection for Elide (POLYGLOT!)\n");

  const testUserAgents = [
    { name: 'iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)' },
    { name: 'iPad', ua: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X)' },
    { name: 'Android Phone', ua: 'Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile' },
    { name: 'Desktop', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
  ];

  console.log("=== Example 1: Mobile Detection ===");
  testUserAgents.forEach(({ name, ua }) => {
    const result = isMobile(ua);
    console.log(`${name}:`);
    console.log(`  any: ${result.any}`);
    console.log(`  phone: ${result.phone}`);
    console.log(`  tablet: ${result.tablet}`);
    console.log(`  apple.device: ${result.apple.device}`);
    console.log(`  android.device: ${result.android.device}`);
    console.log();
  });

  console.log("=== Example 2: Quick Check ===");
  console.log(`
import { isMobile } from './elide-ismobilejs.ts';

const ua = req.headers['user-agent'] || '';
const mobile = isMobile(ua);

if (mobile.any) {
  res.redirect('/mobile');
}
  `.trim());
  console.log();

  console.log("=== Example 3: POLYGLOT Use Case ===");
  console.log("🌐 Same mobile detection works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Quick mobile checks");
  console.log("- Simple device routing");
  console.log("- Lightweight mobile detection");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal footprint");
  console.log("- ~100K+ downloads/week on npm!");
}
