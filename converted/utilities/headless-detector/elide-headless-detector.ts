/**
 * headless-detector - Headless Browser Detection
 *
 * Detect headless browsers and automation tools.
 * **POLYGLOT SHOWCASE**: One headless detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/headless-detector (~20K+ downloads/week)
 *
 * Features:
 * - Headless Chrome detection
 * - PhantomJS detection
 * - Puppeteer detection
 * - Playwright detection
 * - Selenium detection
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export interface HeadlessInfo {
  isHeadless: boolean;
  tool: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
}

export function detectHeadless(userAgent: string): HeadlessInfo {
  if (!userAgent) {
    return { isHeadless: false, tool: null, confidence: null };
  }

  const ua = userAgent.toLowerCase();

  // High confidence headless indicators
  if (/headlesschrome/.test(ua)) {
    return { isHeadless: true, tool: 'Headless Chrome', confidence: 'high' };
  }
  if (/phantomjs/.test(ua)) {
    return { isHeadless: true, tool: 'PhantomJS', confidence: 'high' };
  }

  // Medium confidence
  if (/puppeteer/.test(ua)) {
    return { isHeadless: true, tool: 'Puppeteer', confidence: 'medium' };
  }
  if (/playwright/.test(ua)) {
    return { isHeadless: true, tool: 'Playwright', confidence: 'medium' };
  }
  if (/selenium|webdriver/.test(ua)) {
    return { isHeadless: true, tool: 'Selenium/WebDriver', confidence: 'medium' };
  }

  // Low confidence (suspicious patterns)
  if (/chrome\/\d+\.0\.0\.0/.test(ua) && !/mobile|android/.test(ua)) {
    return { isHeadless: true, tool: 'Possible Headless', confidence: 'low' };
  }

  return { isHeadless: false, tool: null, confidence: null };
}

export function isHeadless(userAgent: string): boolean {
  return detectHeadless(userAgent).isHeadless;
}

export default detectHeadless;

// CLI Demo
if (import.meta.url.includes("elide-headless-detector.ts")) {
  console.log("👻 headless-detector - Headless Detection for Elide (POLYGLOT!)\n");

  const testUAs = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0',
    'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 PhantomJS/2.1.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 (normal browser)',
  ];

  console.log("=== Headless Detection ===");
  testUAs.forEach(ua => {
    const result = detectHeadless(ua);
    console.log(`${ua.substring(0, 60)}...`);
    console.log(`  Headless: ${result.isHeadless}`);
    console.log(`  Tool: ${result.tool || 'None'}`);
    console.log(`  Confidence: ${result.confidence || 'N/A'}`);
    console.log();
  });

  console.log("✅ Use Cases: Security, fraud detection, bot prevention");
  console.log("🚀 ~20K+ downloads/week on npm!");
}
