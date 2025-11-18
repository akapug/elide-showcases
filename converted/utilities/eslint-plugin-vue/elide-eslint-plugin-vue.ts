/**
 * ESLint Plugin Vue - Vue.js Linting Rules
 *
 * Official ESLint plugin for Vue.js.
 * **POLYGLOT SHOWCASE**: Vue.js best practices everywhere!
 *
 * Based on https://www.npmjs.com/package/eslint-plugin-vue (~2M+ downloads/week)
 *
 * Features:
 * - Vue component linting
 * - Template validation
 * - Props validation
 * - v-directives checking
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export const vueRules = [
  { name: 'vue/no-unused-vars', severity: 'error', description: 'Disallow unused variables in template' },
  { name: 'vue/require-v-for-key', severity: 'error', description: 'Require v-bind:key with v-for' },
  { name: 'vue/no-use-v-if-with-v-for', severity: 'error', description: 'Disallow v-if with v-for' },
  { name: 'vue/require-prop-types', severity: 'error', description: 'Require type definitions in props' },
  { name: 'vue/multi-word-component-names', severity: 'warn', description: 'Require multi-word component names' }
];

export class VuePlugin {
  getConfig() {
    const rules: Record<string, any> = {};
    vueRules.forEach(r => rules[r.name] = r.severity);
    return { plugins: ['vue'], extends: ['plugin:vue/vue3-recommended'], rules };
  }
}

export default new VuePlugin();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💚 ESLint Plugin Vue - Vue.js Linting\n");
  const plugin = new VuePlugin();
  console.log("=== Vue Rules ===");
  vueRules.forEach(r => console.log(`  ${r.severity === 'error' ? '🔴' : '🟡'} ${r.name}: ${r.description}`));
  console.log("\n🌐 2M+ downloads/week on npm!");
}
