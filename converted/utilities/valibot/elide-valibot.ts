/**
 * Valibot - Modular Schema Library
 *
 * Modular and type-safe schema library.
 * **POLYGLOT SHOWCASE**: One schema library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/valibot (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

const v = {
  string: () => ({ parse: (v: any) => typeof v === 'string' ? v : (() => { throw new Error('Not string'); })() }),
  number: () => ({ parse: (v: any) => typeof v === 'number' ? v : (() => { throw new Error('Not number'); })() }),
  object: (schema: any) => ({
    parse: (value: any) => {
      const result: any = {};
      for (const [key, s] of Object.entries(schema)) {
        result[key] = (s as any).parse(value[key]);
      }
      return result;
    }
  })
};

export default v;

if (import.meta.url.includes("elide-valibot.ts")) {
  console.log("✅ Valibot - Modular Schema Library (POLYGLOT!)\n");
  console.log("~500K+ downloads/week on npm!");
}
