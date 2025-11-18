/**
 * Stylelint Config Standard - Standard CSS Configuration
 *
 * Standard shareable config for Stylelint.
 * **POLYGLOT SHOWCASE**: Standard CSS style everywhere!
 *
 * Based on https://www.npmjs.com/package/stylelint-config-standard (~1M+ downloads/week)
 *
 * Features:
 * - Sensible defaults
 * - Community best practices
 * - Zero dependencies
 *
 * Package has ~1M+ downloads/week on npm!
 */

export const standardCssRules = [
  { name: 'block-no-empty', value: true },
  { name: 'color-no-invalid-hex', value: true },
  { name: 'comment-no-empty', value: true },
  { name: 'declaration-block-no-duplicate-properties', value: true },
  { name: 'selector-pseudo-class-no-unknown', value: true }
];

export class StandardConfig {
  getConfig() {
    const rules: Record<string, any> = {};
    standardCssRules.forEach(r => rules[r.name] = r.value);
    return { extends: ['stylelint-config-recommended'], rules };
  }
}

export default new StandardConfig();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📐 Stylelint Config Standard\n");
  const config = new StandardConfig();
  console.log(JSON.stringify(config.getConfig(), null, 2));
  console.log("\n🌐 1M+ downloads/week on npm!");
}
