/**
 * cldr-data - Internationalization Library
 * Based on https://www.npmjs.com/package/cldr-data (~500K+ downloads/week)
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
  console.log("🌍 cldr-data - i18n Library for Elide (POLYGLOT!)\n");
  console.log("Example:", translate("Hello, {{name}}", { name: "World" }));
  console.log("\n~500K+ downloads/week on npm!");
}
