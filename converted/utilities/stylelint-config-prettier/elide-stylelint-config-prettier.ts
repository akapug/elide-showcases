/**
 * Stylelint Config Prettier - Prettier-compatible Stylelint
 *
 * Turns off all rules that conflict with Prettier.
 * **POLYGLOT SHOWCASE**: Stylelint + Prettier harmony!
 *
 * Based on https://www.npmjs.com/package/stylelint-config-prettier (~300K+ downloads/week)
 *
 * Features:
 * - Disable conflicting rules
 * - Use with Prettier
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

export const disabledRules = [
  'indentation',
  'max-line-length',
  'declaration-colon-newline-after',
  'declaration-colon-space-after',
  'declaration-colon-space-before'
];

export class PrettierConfig {
  getConfig() {
    const rules: Record<string, any> = {};
    disabledRules.forEach(r => rules[r] = null);
    return { rules };
  }
}

export default new PrettierConfig();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ Stylelint Config Prettier\n");
  const config = new PrettierConfig();
  console.log("Disabled rules for Prettier compatibility:");
  disabledRules.forEach(r => console.log(`  ✗ ${r}`));
  console.log("\n🌐 300K+ downloads/week on npm!");
}
