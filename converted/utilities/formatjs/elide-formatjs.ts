/**
 * formatjs - Internationalization Libraries
 * Based on https://www.npmjs.com/package/@formatjs/intl (~500K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One i18n library for ALL languages on Elide!
 */

export function formatMessage(msg: string, values?: Record<string, any>): string {
  let result = msg;
  if (values) {
    for (const [key, val] of Object.entries(values)) {
      result = result.replace(`{${key}}`, String(val));
    }
  }
  return result;
}

export default { formatMessage };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌐 formatjs - i18n Libraries for Elide (POLYGLOT!)\n");
  console.log(formatMessage("Hello, {name}!", { name: "World" }));
  console.log("\n~500K+ downloads/week on npm!");
}
