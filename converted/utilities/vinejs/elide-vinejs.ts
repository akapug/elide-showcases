/**
 * VineJS - Form Data Validation
 *
 * Modern form data validation library.
 * **POLYGLOT SHOWCASE**: One form validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@vinejs/vine (~50K+ downloads/week)
 *
 * Package has ~50K+ downloads/week on npm!
 */

const vine = {
  string() {
    return {
      minLength(min: number) {
        return {
          validate(v: any) {
            if (typeof v !== 'string' || v.length < min) throw new Error(`Min ${min}`);
            return v;
          }
        };
      }
    };
  }
};

export default vine;

if (import.meta.url.includes("elide-vinejs.ts")) {
  console.log("✅ VineJS - Form Data Validation (POLYGLOT!)\n");
  console.log("~50K+ downloads/week on npm!");
}
