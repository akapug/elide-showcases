/**
 * Indicative - Schema-based Validation
 *
 * Schema-based validation library.
 * **POLYGLOT SHOWCASE**: One schema validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/indicative (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

const indicative = {
  async validate(data: any, rules: any) {
    const errors: any[] = [];
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      const ruleStr = rule as string;
      if (ruleStr.includes('required') && !value) {
        errors.push({ field, message: 'required' });
      }
      if (ruleStr.includes('email') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ field, message: 'invalid email' });
      }
    }
    if (errors.length > 0) throw errors;
    return data;
  }
};

export default indicative;

if (import.meta.url.includes("elide-indicative.ts")) {
  console.log("✅ Indicative - Schema-based Validation (POLYGLOT!)\n");
  console.log("~100K+ downloads/week on npm!");
}
