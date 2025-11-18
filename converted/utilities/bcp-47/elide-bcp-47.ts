/**
 * bcp-47 - BCP 47 Language Tags
 * Based on https://www.npmjs.com/package/bcp-47 (~100K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One language tag parser for ALL languages on Elide!
 */

export function parse(tag: string): { language?: string; region?: string; script?: string } {
  const parts = tag.split('-');
  return {
    language: parts[0],
    script: parts.length > 1 && parts[1].length === 4 ? parts[1] : undefined,
    region: parts[parts.length - 1].length === 2 ? parts[parts.length - 1] : undefined
  };
}

export function stringify(parts: { language: string; region?: string; script?: string }): string {
  let result = parts.language;
  if (parts.script) result += '-' + parts.script;
  if (parts.region) result += '-' + parts.region;
  return result;
}

export default { parse, stringify };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🏷️ bcp-47 - Language Tags for Elide (POLYGLOT!)\n");
  console.log("Parse:", parse('en-US'));
  console.log("Stringify:", stringify({ language: 'en', region: 'US' }));
  console.log("\n~100K+ downloads/week on npm!");
}
