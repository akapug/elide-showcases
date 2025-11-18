/**
 * useragent - Advanced User Agent Parser
 *
 * Parse and analyze User-Agent strings with versioning support.
 * **POLYGLOT SHOWCASE**: One UA analyzer for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/useragent (~500K+ downloads/week)
 *
 * Features:
 * - Detailed browser detection with version comparisons
 * - OS family and version parsing
 * - Device type classification
 * - Browser family grouping (Chrome-based, Firefox-based)
 * - Version comparison utilities
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need UA analysis
 * - ONE implementation works everywhere on Elide
 * - Consistent versioning logic across services
 * - Share browser rules across your stack
 *
 * Use cases:
 * - Feature gating (enable features for specific versions)
 * - Browser compatibility warnings
 * - Analytics with detailed browser breakdown
 * - A/B testing by browser family
 *
 * Package has ~500K+ downloads/week on npm - essential analytics utility!
 */

export class UserAgent {
  family: string;
  major: string | null;
  minor: string | null;
  patch: string | null;
  source: string;

  constructor(family: string, major: string | null = null, minor: string | null = null, patch: string | null = null, source: string = '') {
    this.family = family;
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.source = source;
  }

  toString(): string {
    let version = this.major || '';
    if (this.minor) version += `.${this.minor}`;
    if (this.patch) version += `.${this.patch}`;
    return version ? `${this.family} ${version}` : this.family;
  }

  toVersion(): string {
    let version = this.major || '0';
    if (this.minor) version += `.${this.minor}`;
    if (this.patch) version += `.${this.patch}`;
    return version;
  }

  satisfies(range: string): boolean {
    const version = this.toVersion();
    return satisfiesVersion(version, range);
  }
}

export class OS {
  family: string;
  major: string | null;
  minor: string | null;
  patch: string | null;

  constructor(family: string, major: string | null = null, minor: string | null = null, patch: string | null = null) {
    this.family = family;
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  toString(): string {
    let version = this.major || '';
    if (this.minor) version += `.${this.minor}`;
    if (this.patch) version += `.${this.patch}`;
    return version ? `${this.family} ${version}` : this.family;
  }
}

export class Device {
  family: string;

  constructor(family: string) {
    this.family = family;
  }

  toString(): string {
    return this.family;
  }
}

export interface ParsedUA {
  browser: UserAgent;
  os: OS;
  device: Device;
}

/**
 * Parse a user agent string
 */
export function parse(userAgentString: string): ParsedUA {
  const browser = parseBrowser(userAgentString);
  const os = parseOS(userAgentString);
  const device = parseDevice(userAgentString);

  return { browser, os, device };
}

function parseBrowser(ua: string): UserAgent {
  // Chrome
  const chromeMatch = ua.match(/Chrome\/(\d+)\.(\d+)\.(\d+)/);
  if (chromeMatch && !/Edge|Edg/.test(ua)) {
    return new UserAgent('Chrome', chromeMatch[1], chromeMatch[2], chromeMatch[3], ua);
  }

  // Edge
  const edgeMatch = ua.match(/Edg\/(\d+)\.(\d+)\.(\d+)/);
  if (edgeMatch) {
    return new UserAgent('Edge', edgeMatch[1], edgeMatch[2], edgeMatch[3], ua);
  }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+)\.(\d+)/);
  if (firefoxMatch) {
    return new UserAgent('Firefox', firefoxMatch[1], firefoxMatch[2], null, ua);
  }

  // Safari
  const safariMatch = ua.match(/Version\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari/);
  if (safariMatch && !/Chrome/.test(ua)) {
    return new UserAgent('Safari', safariMatch[1], safariMatch[2], safariMatch[3] || null, ua);
  }

  // Opera
  const operaMatch = ua.match(/OPR\/(\d+)\.(\d+)\.(\d+)/);
  if (operaMatch) {
    return new UserAgent('Opera', operaMatch[1], operaMatch[2], operaMatch[3], ua);
  }

  // IE
  const ieMatch = ua.match(/(?:MSIE |rv:)(\d+)\.(\d+)/);
  if (ieMatch && /Trident|MSIE/.test(ua)) {
    return new UserAgent('IE', ieMatch[1], ieMatch[2], null, ua);
  }

  return new UserAgent('Other', null, null, null, ua);
}

function parseOS(ua: string): OS {
  // Windows
  const winMatch = ua.match(/Windows NT (\d+)\.(\d+)/);
  if (winMatch) {
    return new OS('Windows', winMatch[1], winMatch[2]);
  }

  // macOS
  const macMatch = ua.match(/Mac OS X (\d+)[._](\d+)(?:[._](\d+))?/);
  if (macMatch) {
    return new OS('macOS', macMatch[1], macMatch[2], macMatch[3] || null);
  }

  // iOS
  const iosMatch = ua.match(/(?:iPhone|iPad).*OS (\d+)[._](\d+)(?:[._](\d+))?/);
  if (iosMatch) {
    return new OS('iOS', iosMatch[1], iosMatch[2], iosMatch[3] || null);
  }

  // Android
  const androidMatch = ua.match(/Android (\d+)\.(\d+)(?:\.(\d+))?/);
  if (androidMatch) {
    return new OS('Android', androidMatch[1], androidMatch[2], androidMatch[3] || null);
  }

  // Linux
  if (/Linux/.test(ua)) {
    return new OS('Linux');
  }

  return new OS('Other');
}

function parseDevice(ua: string): Device {
  if (/iPhone/.test(ua)) return new Device('iPhone');
  if (/iPad/.test(ua)) return new Device('iPad');
  if (/Android/.test(ua) && /Mobile/.test(ua)) return new Device('Mobile');
  if (/Android/.test(ua)) return new Device('Tablet');
  return new Device('Desktop');
}

/**
 * Check if version satisfies range (simple implementation)
 */
function satisfiesVersion(version: string, range: string): boolean {
  const [major, minor = '0', patch = '0'] = version.split('.').map(v => parseInt(v));

  // Handle >= operator
  if (range.startsWith('>=')) {
    const [targetMajor, targetMinor = '0'] = range.slice(2).trim().split('.').map(v => parseInt(v));
    if (major > targetMajor) return true;
    if (major === targetMajor && minor >= targetMinor) return true;
    return false;
  }

  // Handle > operator
  if (range.startsWith('>')) {
    const [targetMajor, targetMinor = '0'] = range.slice(1).trim().split('.').map(v => parseInt(v));
    if (major > targetMajor) return true;
    if (major === targetMajor && minor > targetMinor) return true;
    return false;
  }

  // Handle <= operator
  if (range.startsWith('<=')) {
    const [targetMajor, targetMinor = '0'] = range.slice(2).trim().split('.').map(v => parseInt(v));
    if (major < targetMajor) return true;
    if (major === targetMajor && minor <= targetMinor) return true;
    return false;
  }

  // Handle < operator
  if (range.startsWith('<')) {
    const [targetMajor, targetMinor = '0'] = range.slice(1).trim().split('.').map(v => parseInt(v));
    if (major < targetMajor) return true;
    if (major === targetMajor && minor < targetMinor) return true;
    return false;
  }

  // Exact version
  const [targetMajor, targetMinor = '0', targetPatch = '0'] = range.split('.').map(v => parseInt(v));
  return major === targetMajor && minor === targetMinor && patch === targetPatch;
}

/**
 * Detect browser family (for grouping Chrome-based browsers)
 */
export function getBrowserFamily(ua: string): string {
  const parsed = parse(ua);
  const family = parsed.browser.family;

  if (family === 'Chrome' || family === 'Edge' || family === 'Opera') {
    return 'Chromium';
  }
  if (family === 'Firefox') return 'Gecko';
  if (family === 'Safari') return 'WebKit';
  if (family === 'IE') return 'Trident';

  return 'Other';
}

/**
 * Check if browser is modern (supports ES6+)
 */
export function isModernBrowser(ua: string): boolean {
  const parsed = parse(ua);
  const browser = parsed.browser;
  const major = parseInt(browser.major || '0');

  if (browser.family === 'Chrome') return major >= 51;
  if (browser.family === 'Firefox') return major >= 54;
  if (browser.family === 'Safari') return major >= 10;
  if (browser.family === 'Edge') return major >= 15;

  return false;
}

export default parse;

// CLI Demo
if (import.meta.url.includes("elide-useragent.ts")) {
  console.log("🔎 useragent - Advanced UA Parser for Elide (POLYGLOT!)\n");

  const testUserAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  ];

  console.log("=== Example 1: Parse User Agents ===");
  testUserAgents.forEach(ua => {
    const parsed = parse(ua);
    console.log(`Browser: ${parsed.browser}`);
    console.log(`OS: ${parsed.os}`);
    console.log(`Device: ${parsed.device}`);
    console.log();
  });

  console.log("=== Example 2: Version Comparison ===");
  const chromeUA = testUserAgents[0];
  const parsed = parse(chromeUA);
  console.log(`Browser: ${parsed.browser}`);
  console.log(`Satisfies >= 100: ${parsed.browser.satisfies('>=100')}`);
  console.log(`Satisfies >= 130: ${parsed.browser.satisfies('>=130')}`);
  console.log();

  console.log("=== Example 3: Browser Families ===");
  testUserAgents.forEach(ua => {
    const family = getBrowserFamily(ua);
    const parsed = parse(ua);
    console.log(`${parsed.browser.family} → ${family} family`);
  });
  console.log();

  console.log("=== Example 4: Modern Browser Check ===");
  testUserAgents.forEach(ua => {
    const parsed = parse(ua);
    const modern = isModernBrowser(ua);
    console.log(`${parsed.browser.family}: ${modern ? '✅ Modern' : '❌ Legacy'}`);
  });
  console.log();

  console.log("=== Example 5: Feature Gating Pattern ===");
  console.log(`
function canUseWebP(ua: string): boolean {
  const parsed = parse(ua);
  const browser = parsed.browser;

  if (browser.family === 'Chrome') {
    return browser.satisfies('>=23');
  }
  if (browser.family === 'Firefox') {
    return browser.satisfies('>=65');
  }
  if (browser.family === 'Safari') {
    return browser.satisfies('>=14');
  }

  return false;
}
  `.trim());
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same UA parser works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Consistent version comparisons");
  console.log("  ✓ Same feature gating logic");
  console.log("  ✓ Share browser families across stack");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Feature gating (enable features for specific versions)");
  console.log("- Browser compatibility warnings");
  console.log("- Analytics with detailed browser breakdown");
  console.log("- A/B testing by browser family");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast parsing with version comparison");
  console.log("- ~500K+ downloads/week on npm!");
}
