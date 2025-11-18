/**
 * react-device-detect - React Device Detection Utilities
 *
 * Device detection hooks and components for React applications.
 * **POLYGLOT SHOWCASE**: One device detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-device-detect (~300K+ downloads/week)
 *
 * Features:
 * - Mobile, tablet, desktop detection
 * - Browser detection
 * - OS detection
 * - Device-specific conditionals
 * - SSR-friendly
 * - Zero dependencies (React not required for Elide)
 *
 * Use cases:
 * - React component rendering
 * - Conditional UI logic
 * - Responsive components
 * - Device-specific features
 *
 * Package has ~300K+ downloads/week on npm!
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isBrowser: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  browserName: string;
  osName: string;
  deviceType: string;
}

/**
 * Detect device from user agent
 */
export function detectDevice(userAgent?: string): DeviceInfo {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  const isMobile = /iPhone|Android.*Mobile/.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
  const isDesktop = !isMobile && !isTablet;
  const isBrowser = true;

  const isAndroid = /Android/.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua);

  const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isEdge = /Edge|Edg/.test(ua);

  let browserName = 'Unknown';
  if (isChrome) browserName = 'Chrome';
  else if (isFirefox) browserName = 'Firefox';
  else if (isSafari) browserName = 'Safari';
  else if (isEdge) browserName = 'Edge';

  let osName = 'Unknown';
  if (isIOS) osName = 'iOS';
  else if (isAndroid) osName = 'Android';
  else if (/Windows/.test(ua)) osName = 'Windows';
  else if (/Mac OS X/.test(ua)) osName = 'macOS';
  else if (/Linux/.test(ua)) osName = 'Linux';

  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isBrowser,
    isAndroid,
    isIOS,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    browserName,
    osName,
    deviceType,
  };
}

// Export individual flags
export const {
  isMobile,
  isTablet,
  isDesktop,
  isAndroid,
  isIOS,
  isChrome,
  isFirefox,
  isSafari,
  isEdge,
  browserName,
  osName,
  deviceType,
} = detectDevice();

export default detectDevice;

// CLI Demo
if (import.meta.url.includes("elide-react-device-detect.ts")) {
  console.log("⚛️  react-device-detect - Device Detection for Elide (POLYGLOT!)\n");

  const testUserAgents = [
    { name: 'Chrome Desktop', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
    { name: 'iPhone Safari', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) Safari/604.1' },
    { name: 'Android Chrome', ua: 'Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile' },
  ];

  console.log("=== Example 1: Device Detection ===");
  testUserAgents.forEach(({ name, ua }) => {
    const device = detectDevice(ua);
    console.log(`${name}:`);
    console.log(`  Type: ${device.deviceType}`);
    console.log(`  Browser: ${device.browserName}`);
    console.log(`  OS: ${device.osName}`);
    console.log(`  isMobile: ${device.isMobile}`);
    console.log();
  });

  console.log("=== Example 2: React Pattern (TypeScript) ===");
  console.log(`
import { detectDevice } from './elide-react-device-detect.ts';

function App() {
  const device = detectDevice(navigator.userAgent);

  return (
    <div>
      {device.isMobile && <MobileLayout />}
      {device.isTablet && <TabletLayout />}
      {device.isDesktop && <DesktopLayout />}
    </div>
  );
}
  `.trim());
  console.log();

  console.log("=== Example 3: POLYGLOT Use Case ===");
  console.log("🌐 Same device detection works in:");
  console.log("  • React (TypeScript/JavaScript)");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- React component rendering");
  console.log("- Conditional UI logic");
  console.log("- Responsive components");
  console.log("- Device-specific features");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- SSR-friendly");
  console.log("- ~300K+ downloads/week on npm!");
}
