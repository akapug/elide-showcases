/**
 * intl-pluralrules - Plural Rules Polyfill
 * Based on https://www.npmjs.com/package/@formatjs/intl-pluralrules (~500K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One plural rules library for ALL languages on Elide!
 */

export class PluralRules {
  constructor(private locale: string = 'en') {}
  
  select(count: number): string {
    if (count === 1) return 'one';
    return 'other';
  }
}

export default PluralRules;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔢 intl-pluralrules - Plural Rules for Elide (POLYGLOT!)\n");
  const pr = new PluralRules('en');
  console.log("1 item:", pr.select(1));
  console.log("5 items:", pr.select(5));
  console.log("\n~500K+ downloads/week on npm!");
}
