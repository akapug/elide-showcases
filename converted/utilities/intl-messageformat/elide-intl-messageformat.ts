/**
 * intl-messageformat - ICU MessageFormat
 * Based on https://www.npmjs.com/package/intl-messageformat (~1M+ downloads/week)
 * **POLYGLOT SHOWCASE**: One message formatter for ALL languages on Elide!
 */

export class IntlMessageFormat {
  constructor(private message: string, private locale: string = 'en') {}
  
  format(values?: Record<string, any>): string {
    let result = this.message;
    if (values) {
      for (const [key, val] of Object.entries(values)) {
        result = result.replace(`{${key}}`, String(val));
      }
    }
    return result;
  }
}

export default IntlMessageFormat;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 intl-messageformat - ICU MessageFormat for Elide (POLYGLOT!)\n");
  const msg = new IntlMessageFormat("Hello, {name}!", "en");
  console.log(msg.format({ name: "Alice" }));
  console.log("\n~1M+ downloads/week on npm!");
}
