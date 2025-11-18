/**
 * Just Extend - Object Extension
 *
 * Deep merge objects safely.
 * **POLYGLOT SHOWCASE**: One extend utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-extend (~30K+ downloads/week)
 */

export function extend<T extends object>(target: T, ...sources: any[]): T {
  for (const source of sources) {
    if (!source) continue;

    for (const key in source) {
      const sourceVal = source[key];
      const targetVal = (target as any)[key];

      if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
          targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
        (target as any)[key] = extend({}, targetVal, sourceVal);
      } else {
        (target as any)[key] = sourceVal;
      }
    }
  }

  return target;
}

export default extend;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔗 Just Extend - Object Extension for Elide (POLYGLOT!)\n");
  
  const defaults = { host: 'localhost', port: 3000, ssl: false };
  const config = { port: 8080, ssl: true };
  
  console.log("Defaults:", defaults);
  console.log("Config:", config);
  console.log("Extended:", extend({}, defaults, config));
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~30K+ downloads/week on npm");
}
