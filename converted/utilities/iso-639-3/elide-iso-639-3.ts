/**
 * iso-639-3 - Language Codes
 * Based on https://www.npmjs.com/package/iso-639-3 (~20K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One language code library for ALL languages on Elide!
 */

const LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' }
];

export function getName(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.name || '';
}

export function getCode(name: string): string {
  return LANGUAGES.find(l => l.name.toLowerCase() === name.toLowerCase())?.code || '';
}

export default { getName, getCode };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 iso-639-3 - Language Codes for Elide (POLYGLOT!)\n");
  console.log("eng ->", getName('eng'));
  console.log("\n~20K+ downloads/week on npm!");
}
