/**
 * ua-parser-js - User Agent Parser
 *
 * Parse User-Agent strings to extract browser, engine, OS, device, and CPU info.
 * **POLYGLOT SHOWCASE**: One UA parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ua-parser-js (~5M+ downloads/week)
 *
 * Features:
 * - Extract browser name and version
 * - Detect OS (Windows, macOS, Linux, iOS, Android)
 * - Identify device type (mobile, tablet, desktop)
 * - Parse engine (WebKit, Blink, Gecko)
 * - CPU architecture detection
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need UA parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent device detection across services
 * - Share UA rules across your stack
 *
 * Use cases:
 * - Analytics (track browser/OS distribution)
 * - Responsive design (serve mobile/desktop)
 * - Feature detection (browser capabilities)
 * - Security (identify suspicious clients)
 *
 * Package has ~5M+ downloads/week on npm - essential web utility!
 */

export interface UAResult {
  browser: { name: string | null; version: string | null };
  engine: { name: string | null; version: string | null };
  os: { name: string | null; version: string | null };
  device: { type: string | null; vendor: string | null; model: string | null };
  cpu: { architecture: string | null };
}

/**
 * Parse a user agent string
 */
export function parse(userAgent: string): UAResult {
  const ua = userAgent || '';

  return {
    browser: parseBrowser(ua),
    engine: parseEngine(ua),
    os: parseOS(ua),
    device: parseDevice(ua),
    cpu: parseCPU(ua),
  };
}

/**
 * Parse browser info
 */
function parseBrowser(ua: string): { name: string | null; version: string | null } {
  // Chrome
  if (/Chrome\/(\d+\.\d+)/.test(ua) && !/Edge|Edg/.test(ua)) {
    const version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'Chrome', version };
  }

  // Edge
  if (/Edg\/(\d+\.\d+)/.test(ua)) {
    const version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'Edge', version };
  }

  // Firefox
  if (/Firefox\/(\d+\.\d+)/.test(ua)) {
    const version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'Firefox', version };
  }

  // Safari
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    const version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'Safari', version };
  }

  // Opera
  if (/OPR\/(\d+\.\d+)/.test(ua)) {
    const version = ua.match(/OPR\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'Opera', version };
  }

  // IE
  if (/MSIE (\d+\.\d+)/.test(ua) || /Trident.*rv:(\d+\.\d+)/.test(ua)) {
    const version = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || null;
    return { name: 'IE', version };
  }

  return { name: null, version: null };
}

/**
 * Parse engine info
 */
function parseEngine(ua: string): { name: string | null; version: string | null } {
  // Blink (Chrome/Edge)
  if (/Chrome\//.test(ua) && !/Edge\//.test(ua)) {
    const version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'Blink', version };
  }

  // WebKit (Safari)
  if (/AppleWebKit\/(\d+\.\d+)/.test(ua) && !/Chrome/.test(ua)) {
    const version = ua.match(/AppleWebKit\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'WebKit', version };
  }

  // Gecko (Firefox)
  if (/Gecko\//.test(ua) && /Firefox/.test(ua)) {
    const version = ua.match(/rv:(\d+\.\d+)/)?.[1] || null;
    return { name: 'Gecko', version };
  }

  // EdgeHTML
  if (/Edge\/(\d+\.\d+)/.test(ua)) {
    const version = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || null;
    return { name: 'EdgeHTML', version };
  }

  return { name: null, version: null };
}

/**
 * Parse OS info
 */
function parseOS(ua: string): { name: string | null; version: string | null } {
  // Windows
  if (/Windows NT (\d+\.\d+)/.test(ua)) {
    const version = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || null;
    const osVersion = version === '10.0' ? '10/11' : version;
    return { name: 'Windows', version: osVersion };
  }

  // macOS
  if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
    const version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || null;
    return { name: 'macOS', version };
  }

  // iOS
  if (/iPhone OS (\d+[._]\d+)/.test(ua) || /iPad.*OS (\d+[._]\d+)/.test(ua)) {
    const version = ua.match(/(?:iPhone|iPad).*OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || null;
    return { name: 'iOS', version };
  }

  // Android
  if (/Android (\d+\.\d+)/.test(ua)) {
    const version = ua.match(/Android (\d+\.\d+)/)?.[1] || null;
    return { name: 'Android', version };
  }

  // Linux
  if (/Linux/.test(ua)) {
    return { name: 'Linux', version: null };
  }

  return { name: null, version: null };
}

/**
 * Parse device info
 */
function parseDevice(ua: string): { type: string | null; vendor: string | null; model: string | null } {
  // iPhone
  if (/iPhone/.test(ua)) {
    return { type: 'mobile', vendor: 'Apple', model: 'iPhone' };
  }

  // iPad
  if (/iPad/.test(ua)) {
    return { type: 'tablet', vendor: 'Apple', model: 'iPad' };
  }

  // Android mobile
  if (/Android/.test(ua) && /Mobile/.test(ua)) {
    return { type: 'mobile', vendor: null, model: null };
  }

  // Android tablet
  if (/Android/.test(ua) && !/Mobile/.test(ua)) {
    return { type: 'tablet', vendor: null, model: null };
  }

  // Desktop
  return { type: null, vendor: null, model: null };
}

/**
 * Parse CPU architecture
 */
function parseCPU(ua: string): { architecture: string | null } {
  if (/WOW64|Win64|x64|x86_64|amd64/.test(ua)) {
    return { architecture: 'amd64' };
  }

  if (/arm64|aarch64/.test(ua)) {
    return { architecture: 'arm64' };
  }

  if (/arm/.test(ua)) {
    return { architecture: 'arm' };
  }

  if (/x86|i686/.test(ua)) {
    return { architecture: 'ia32' };
  }

  return { architecture: null };
}

/**
 * Get browser name
 */
export function getBrowser(userAgent: string): string | null {
  return parseBrowser(userAgent).name;
}

/**
 * Get OS name
 */
export function getOS(userAgent: string): string | null {
  return parseOS(userAgent).name;
}

/**
 * Get device type
 */
export function getDevice(userAgent: string): string | null {
  return parseDevice(userAgent).type;
}

/**
 * Check if mobile device
 */
export function isMobile(userAgent: string): boolean {
  const device = parseDevice(userAgent);
  return device.type === 'mobile' || device.type === 'tablet';
}

export default parse;

// CLI Demo
if (import.meta.url.includes("elide-ua-parser-js.ts")) {
  console.log("🔍 ua-parser-js - User Agent Parser for Elide (POLYGLOT!)\n");

  const testUserAgents = [
    // Desktop browsers
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',

    // Mobile browsers
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  ];

  console.log("=== Example 1: Parse User Agents ===");
  testUserAgents.slice(0, 3).forEach(ua => {
    const result = parse(ua);
    console.log(`Browser: ${result.browser.name} ${result.browser.version}`);
    console.log(`OS: ${result.os.name} ${result.os.version}`);
    console.log(`Device: ${result.device.type || 'desktop'}`);
    console.log();
  });

  console.log("=== Example 2: Browser Distribution ===");
  const browsers = testUserAgents.map(ua => getBrowser(ua));
  const browserCounts: Record<string, number> = {};
  browsers.forEach(browser => {
    if (browser) {
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    }
  });
  Object.entries(browserCounts).forEach(([browser, count]) => {
    console.log(`${browser}: ${count} (${Math.round(count / browsers.length * 100)}%)`);
  });
  console.log();

  console.log("=== Example 3: OS Distribution ===");
  const oses = testUserAgents.map(ua => getOS(ua));
  const osCounts: Record<string, number> = {};
  oses.forEach(os => {
    if (os) {
      osCounts[os] = (osCounts[os] || 0) + 1;
    }
  });
  Object.entries(osCounts).forEach(([os, count]) => {
    console.log(`${os}: ${count} (${Math.round(count / oses.length * 100)}%)`);
  });
  console.log();

  console.log("=== Example 4: Mobile vs Desktop ===");
  const mobileCount = testUserAgents.filter(ua => isMobile(ua)).length;
  const desktopCount = testUserAgents.length - mobileCount;
  console.log(`Mobile: ${mobileCount} (${Math.round(mobileCount / testUserAgents.length * 100)}%)`);
  console.log(`Desktop: ${desktopCount} (${Math.round(desktopCount / testUserAgents.length * 100)}%)`);
  console.log();

  console.log("=== Example 5: Detailed Parsing ===");
  const mobileUA = testUserAgents.find(ua => /iPhone/.test(ua))!;
  const result = parse(mobileUA);
  console.log("iPhone User Agent:");
  console.log(JSON.stringify(result, null, 2));
  console.log();

  console.log("=== Example 6: Express Middleware Pattern ===");
  console.log(`
function detectDevice(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers['user-agent'] || '';
  const parsed = parse(ua);

  req.device = {
    isMobile: isMobile(ua),
    browser: parsed.browser.name,
    os: parsed.os.name,
  };

  next();
}
  `.trim());
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same UA parser works in:");
  console.log("  • JavaScript/TypeScript (Express, Next.js)");
  console.log("  • Python (via Elide - Flask, FastAPI)");
  console.log("  • Ruby (via Elide - Rails, Sinatra)");
  console.log("  • Java (via Elide - Spring Boot)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Consistent device detection everywhere");
  console.log("  ✓ Same analytics across all services");
  console.log("  ✓ Share UA rules across your stack");
  console.log("  ✓ One parser, all languages");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Analytics (track browser/OS distribution)");
  console.log("- Responsive design (serve mobile/desktop)");
  console.log("- Feature detection (browser capabilities)");
  console.log("- Security (identify suspicious clients)");
  console.log("- A/B testing (segment by browser/device)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast regex matching");
  console.log("- Instant execution on Elide");
  console.log("- ~5M+ downloads/week on npm!");
}
