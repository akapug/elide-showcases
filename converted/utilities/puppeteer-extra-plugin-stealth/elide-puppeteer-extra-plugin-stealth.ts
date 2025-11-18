/**
 * puppeteer-extra-plugin-stealth - Stealth Mode Detection
 *
 * Detect and prevent bot detection evasion techniques.
 * **POLYGLOT SHOWCASE**: One stealth detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/puppeteer-extra-plugin-stealth (~100K+ downloads/week)
 *
 * Features:
 * - Detect stealth mode indicators
 * - WebDriver detection
 * - Chrome DevTools Protocol detection
 * - Automation fingerprints
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface StealthInfo {
  isStealth: boolean;
  indicators: string[];
  score: number; // 0-100, higher = more likely stealth
}

export function detectStealth(userAgent: string, additionalChecks?: {
  webdriver?: boolean;
  chromeRuntime?: boolean;
  permissions?: boolean;
}): StealthInfo {
  const indicators: string[] = [];
  let score = 0;

  // User agent checks
  if (userAgent) {
    const ua = userAgent.toLowerCase();

    if (/headless/.test(ua)) {
      indicators.push('Headless UA');
      score += 50;
    }

    if (/phantomjs/.test(ua)) {
      indicators.push('PhantomJS');
      score += 50;
    }

    if (/puppeteer/.test(ua)) {
      indicators.push('Puppeteer in UA');
      score += 40;
    }

    if (/chrome\/\d+\.0\.0\.0$/.test(ua)) {
      indicators.push('Suspicious Chrome version');
      score += 20;
    }
  }

  // Additional checks (would be done client-side in browser)
  if (additionalChecks?.webdriver) {
    indicators.push('WebDriver present');
    score += 40;
  }

  if (additionalChecks?.chromeRuntime) {
    indicators.push('Chrome Runtime detected');
    score += 30;
  }

  if (additionalChecks?.permissions) {
    indicators.push('Suspicious permissions');
    score += 20;
  }

  return {
    isStealth: score >= 50,
    indicators,
    score: Math.min(score, 100),
  };
}

/**
 * Generate client-side detection script
 */
export function getClientDetectionScript(): string {
  return `
(function() {
  const indicators = [];

  // WebDriver check
  if (navigator.webdriver) {
    indicators.push('webdriver');
  }

  // Chrome runtime
  if (window.chrome && window.chrome.runtime) {
    indicators.push('chrome.runtime');
  }

  // Permissions
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'notifications' }).then(result => {
      if (result.state === 'denied') {
        indicators.push('permissions');
      }
    });
  }

  return indicators;
})();
  `.trim();
}

export default detectStealth;

// CLI Demo
if (import.meta.url.includes("elide-puppeteer-extra-plugin-stealth.ts")) {
  console.log("🕵️  puppeteer-extra-plugin-stealth - Stealth Detection for Elide (POLYGLOT!)\n");

  const testCases = [
    { ua: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0', webdriver: true },
    { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', webdriver: false },
  ];

  console.log("=== Stealth Detection ===");
  testCases.forEach(({ ua, webdriver }) => {
    const result = detectStealth(ua, { webdriver });
    console.log(`UA: ${ua.substring(0, 50)}...`);
    console.log(`  Stealth: ${result.isStealth}`);
    console.log(`  Score: ${result.score}/100`);
    console.log(`  Indicators: ${result.indicators.join(', ') || 'None'}`);
    console.log();
  });

  console.log("✅ Use Cases: Bot detection, fraud prevention, security");
  console.log("🚀 ~100K+ downloads/week on npm!");
}
