/**
 * robot-detect - Robot and Bot Detection
 *
 * Detect robots, crawlers, and automated agents.
 * **POLYGLOT SHOWCASE**: One robot detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/robot-detect (~30K+ downloads/week)
 *
 * Features:
 * - Robot detection
 * - Crawler classification
 * - Headless browser detection
 * - Automation tool detection
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export interface RobotInfo {
  isRobot: boolean;
  type: 'search' | 'social' | 'headless' | 'automation' | 'other' | null;
  name: string | null;
}

export function detectRobot(userAgent: string): RobotInfo {
  if (!userAgent) {
    return { isRobot: false, type: null, name: null };
  }

  const ua = userAgent.toLowerCase();

  // Search engines
  if (/googlebot|bingbot|slurp/.test(ua)) {
    const name = ua.includes('googlebot') ? 'Googlebot' : ua.includes('bingbot') ? 'Bingbot' : 'Yahoo Slurp';
    return { isRobot: true, type: 'search', name };
  }

  // Social
  if (/facebookexternalhit|twitterbot|linkedinbot/.test(ua)) {
    const name = ua.includes('facebook') ? 'Facebook' : ua.includes('twitter') ? 'Twitter' : 'LinkedIn';
    return { isRobot: true, type: 'social', name: `${name} Bot` };
  }

  // Headless
  if (/headlesschrome|phantomjs|puppeteer|playwright/.test(ua)) {
    const name = ua.includes('headless') ? 'Headless Chrome' : ua.includes('phantomjs') ? 'PhantomJS' :
                 ua.includes('puppeteer') ? 'Puppeteer' : 'Playwright';
    return { isRobot: true, type: 'headless', name };
  }

  // Automation
  if (/selenium|webdriver|cypress/.test(ua)) {
    const name = ua.includes('selenium') ? 'Selenium' : ua.includes('webdriver') ? 'WebDriver' : 'Cypress';
    return { isRobot: true, type: 'automation', name };
  }

  // Generic
  if (/bot|crawler|spider/.test(ua)) {
    return { isRobot: true, type: 'other', name: 'Unknown Bot' };
  }

  return { isRobot: false, type: null, name: null };
}

export function isRobot(userAgent: string): boolean {
  return detectRobot(userAgent).isRobot;
}

export default detectRobot;

// CLI Demo
if (import.meta.url.includes("elide-robot-detect.ts")) {
  console.log("🤖 robot-detect - Robot Detection for Elide (POLYGLOT!)\n");

  const testUAs = [
    'Googlebot/2.1',
    'HeadlessChrome/120.0',
    'Selenium/4.0',
    'Chrome/120.0 (normal browser)',
  ];

  console.log("=== Robot Detection ===");
  testUAs.forEach(ua => {
    const robot = detectRobot(ua);
    console.log(`${ua.substring(0, 40)}: ${robot.isRobot ? `✓ ${robot.type} (${robot.name})` : '✗ Not robot'}`);
  });
  console.log();

  console.log("✅ Use Cases: Comprehensive robot detection");
  console.log("🚀 ~30K+ downloads/week on npm!");
}
