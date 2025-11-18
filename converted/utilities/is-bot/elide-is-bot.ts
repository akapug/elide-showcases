/**
 * is-bot - Bot Detection Utility
 *
 * Simple bot detection from User-Agent strings.
 * **POLYGLOT SHOWCASE**: One bot checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-bot (~50K+ downloads/week)
 *
 * Features:
 * - Quick bot detection
 * - Common crawler patterns
 * - Search engine bots
 * - Social media bots
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /curl/i,
  /wget/i,
];

export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export default isBot;

// CLI Demo
if (import.meta.url.includes("elide-is-bot.ts")) {
  console.log("🤖 is-bot - Bot Detection for Elide (POLYGLOT!)\n");

  const testUAs = [
    { name: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)', expected: true },
    { name: 'Chrome', ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0', expected: false },
  ];

  console.log("=== Bot Detection ===");
  testUAs.forEach(({ name, ua, expected }) => {
    const result = isBot(ua);
    console.log(`${name}: ${result} ${result === expected ? '✓' : '✗'}`);
  });
  console.log();

  console.log("✅ Use Cases: Quick bot detection");
  console.log("🚀 ~50K+ downloads/week on npm!");
}
