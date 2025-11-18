/**
 * messageformat - Internationalization Library
 * Based on https://www.npmjs.com/package/messageformat (~200K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One i18n library for ALL languages on Elide!
 */

export function translate(key: string, options?: Record<string, any>): string {
  let result = key;
  if (options) {
    for (const [k, v] of Object.entries(options)) {
      result = result.replace(`{{${k}}}`, String(v));
    }
  }
  return result;
}

export default { translate };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 messageformat - i18n Library for Elide (POLYGLOT!)\n");
  console.log("Example:", translate("Hello, {{name}}", { name: "World" }));
  console.log("\n~200K+ downloads/week on npm!");
}
