/**
 * country-code-lookup - Country Data
 * Based on https://www.npmjs.com/package/country-code-lookup (~50K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One country data library for ALL languages on Elide!
 */

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }
];

export function byIso(code: string) {
  return COUNTRIES.find(c => c.code === code);
}

export function all() {
  return COUNTRIES;
}

export default { byIso, all };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 country-code-lookup - Country Data for Elide (POLYGLOT!)\n");
  console.log("US:", byIso('US'));
  console.log("\n~50K+ downloads/week on npm!");
}
