/**
 * visual-regression - Visual Regression Testing
 * Based on https://www.npmjs.com/package/visual-regression (~300K+ downloads/week)
 */

const result = await visualRegression({
  baseline: 'baseline.png',
  current: 'current.png'
});
console.log('Passed:', result.passed);

export {};

if (import.meta.url.includes("elide-visual-regression.ts")) {
  console.log("✅ visual-regression - Visual Regression Testing (POLYGLOT!)\n");
  console.log("\n🚀 ~300K+ downloads/week\n");
}
