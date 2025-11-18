/**
 * express-useragent - Express User Agent Middleware
 *
 * Express middleware for parsing User-Agent with detailed device info.
 * **POLYGLOT SHOWCASE**: One UA middleware for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/express-useragent (~300K+ downloads/week)
 *
 * Features:
 * - Express middleware integration
 * - Detailed browser, OS, platform detection
 * - Mobile, tablet, desktop classification
 * - Bot detection
 * - Version parsing
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need request UA parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent device flags across services
 * - Share middleware logic across your stack
 *
 * Use cases:
 * - Express/Fastify apps (attach UA info to req)
 * - API routes (conditional logic based on device)
 * - Analytics middleware
 * - Mobile redirects
 *
 * Package has ~300K+ downloads/week on npm - essential Express utility!
 */

export interface UserAgentData {
  // Main properties
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isBot: boolean;

  // Browser
  browser: string;
  version: string;

  // OS
  os: string;
  platform: string;

  // Source
  source: string;

  // Detailed flags
  isiPhone: boolean;
  isiPad: boolean;
  isiPod: boolean;
  isAndroid: boolean;
  isBlackberry: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;

  // Browser flags
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isOpera: boolean;
  isIE: boolean;
  isEdge: boolean;

  // Other
  isChromeOS: boolean;
  isSmartTV: boolean;
}

/**
 * Parse user agent string
 */
export function parse(userAgent: string): UserAgentData {
  const ua = userAgent || '';

  // Device detection
  const isiPhone = /iPhone/.test(ua);
  const isiPad = /iPad/.test(ua);
  const isiPod = /iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isBlackberry = /BlackBerry|BB10/.test(ua);
  const isWindows = /Windows/.test(ua);
  const isMac = /Macintosh|Mac OS X/.test(ua);
  const isLinux = /Linux/.test(ua) && !isAndroid;

  // Browser detection
  const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isOpera = /OPR|Opera/.test(ua);
  const isIE = /MSIE|Trident/.test(ua);
  const isEdge = /Edge|Edg/.test(ua);

  // Device type
  const isMobile = isiPhone || isiPod || (isAndroid && /Mobile/.test(ua)) || isBlackberry;
  const isTablet = isiPad || (isAndroid && !/Mobile/.test(ua));
  const isDesktop = !isMobile && !isTablet;

  // Bot detection
  const isBot = /bot|crawler|spider|crawling/i.test(ua);

  // OS detection
  const isChromeOS = /CrOS/.test(ua);
  const isSmartTV = /SmartTV|TV/.test(ua);

  // Extract versions
  let browser = 'Unknown';
  let version = '';

  if (isChrome) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
  } else if (isEdge) {
    browser = 'Edge';
    version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
  } else if (isFirefox) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
  } else if (isSafari) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
  } else if (isOpera) {
    browser = 'Opera';
    version = ua.match(/OPR\/(\d+\.\d+)/)?.[1] || '';
  } else if (isIE) {
    browser = 'IE';
    version = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || '';
  }

  // OS name
  let os = 'Unknown';
  if (isiPhone || isiPad || isiPod) os = 'iOS';
  else if (isAndroid) os = 'Android';
  else if (isWindows) os = 'Windows';
  else if (isMac) os = 'macOS';
  else if (isLinux) os = 'Linux';
  else if (isChromeOS) os = 'Chrome OS';

  // Platform
  let platform = 'Unknown';
  if (isiPhone) platform = 'iPhone';
  else if (isiPad) platform = 'iPad';
  else if (isiPod) platform = 'iPod';
  else if (isAndroid && isMobile) platform = 'Android Mobile';
  else if (isAndroid && isTablet) platform = 'Android Tablet';
  else if (isWindows) platform = 'Windows';
  else if (isMac) platform = 'Mac';
  else if (isLinux) platform = 'Linux';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isBot,
    browser,
    version,
    os,
    platform,
    source: ua,
    isiPhone,
    isiPad,
    isiPod,
    isAndroid,
    isBlackberry,
    isWindows,
    isMac,
    isLinux,
    isChrome,
    isFirefox,
    isSafari,
    isOpera,
    isIE,
    isEdge,
    isChromeOS,
    isSmartTV,
  };
}

/**
 * Express middleware
 */
export function middleware() {
  return (req: any, res: any, next: any) => {
    const ua = req.headers['user-agent'] || '';
    req.useragent = parse(ua);
    next();
  };
}

export default parse;

// CLI Demo
if (import.meta.url.includes("elide-express-useragent.ts")) {
  console.log("🔌 express-useragent - UA Middleware for Elide (POLYGLOT!)\n");

  const testUserAgents = [
    { name: 'Chrome Desktop', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    { name: 'iPhone Safari', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1' },
    { name: 'iPad Safari', ua: 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1' },
    { name: 'Android Mobile', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' },
    { name: 'Firefox Mac', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' },
  ];

  console.log("=== Example 1: Parse User Agents ===");
  testUserAgents.forEach(({ name, ua }) => {
    const parsed = parse(ua);
    console.log(`${name}:`);
    console.log(`  Device: ${parsed.isMobile ? 'Mobile' : parsed.isTablet ? 'Tablet' : 'Desktop'}`);
    console.log(`  Browser: ${parsed.browser} ${parsed.version}`);
    console.log(`  OS: ${parsed.os}`);
    console.log(`  Platform: ${parsed.platform}`);
    console.log();
  });

  console.log("=== Example 2: Device Flags ===");
  const iphoneUA = testUserAgents[1].ua;
  const parsed = parse(iphoneUA);
  console.log("iPhone Detection:");
  console.log(`  isiPhone: ${parsed.isiPhone}`);
  console.log(`  isMobile: ${parsed.isMobile}`);
  console.log(`  isSafari: ${parsed.isSafari}`);
  console.log();

  console.log("=== Example 3: Express Middleware Pattern ===");
  console.log(`
import { middleware } from './elide-express-useragent.ts';

app.use(middleware());

app.get('/api/content', (req, res) => {
  if (req.useragent.isMobile) {
    res.json({ layout: 'mobile' });
  } else {
    res.json({ layout: 'desktop' });
  }
});
  `.trim());
  console.log();

  console.log("=== Example 4: Mobile Redirect ===");
  console.log(`
app.get('/', (req, res) => {
  if (req.useragent.isMobile) {
    res.redirect('/mobile');
  } else {
    res.render('desktop/home');
  }
});
  `.trim());
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same middleware works in:");
  console.log("  • Express (Node.js)");
  console.log("  • Flask (Python via Elide)");
  console.log("  • Sinatra/Rails (Ruby via Elide)");
  console.log("  • Spring Boot (Java via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Consistent device detection");
  console.log("  ✓ Same flags across all services");
  console.log("  ✓ Share middleware logic");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Express/Fastify middleware");
  console.log("- Mobile/desktop routing");
  console.log("- Analytics tracking");
  console.log("- Conditional API responses");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast flag detection");
  console.log("- ~300K+ downloads/week on npm!");
}
