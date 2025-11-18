/**
 * bcp-47-normalize - Normalize BCP 47 Tags
 * Based on https://www.npmjs.com/package/bcp-47-normalize (~50K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One tag normalizer for ALL languages on Elide!
 */

export function normalize(tag: string): string {
  const parts = tag.split('-');
  if (parts.length === 0) return tag;
  parts[0] = parts[0].toLowerCase();
  if (parts.length > 1 && parts[1].length === 2) {
    parts[1] = parts[1].toUpperCase();
  }
  return parts.join('-');
}

export default { normalize };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 bcp-47-normalize - Normalize Language Tags for Elide (POLYGLOT!)\n");
  console.log(normalize('EN-us')); // en-US
  console.log(normalize('FR-fr')); // fr-FR
  console.log("\n~50K+ downloads/week on npm!");
}
