/**
 * intl-relativetimeformat - Relative Time Formatting
 * Based on https://www.npmjs.com/package/@formatjs/intl-relativetimeformat (~300K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One relative time formatter for ALL languages on Elide!
 */

export class RelativeTimeFormat {
  constructor(private locale: string = 'en') {}
  
  format(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    return new Intl.RelativeTimeFormat(this.locale).format(value, unit);
  }
}

export default RelativeTimeFormat;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏰ intl-relativetimeformat - Relative Time for Elide (POLYGLOT!)\n");
  const rtf = new RelativeTimeFormat('en');
  console.log(rtf.format(-1, 'day'));
  console.log(rtf.format(2, 'hour'));
  console.log("\n~300K+ downloads/week on npm!");
}
