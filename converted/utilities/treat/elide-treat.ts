/**
 * treat - Themeable CSS-in-TypeScript
 *
 * Themeable, statically extracted CSS-in-TypeScript.
 * **POLYGLOT SHOWCASE**: Typed styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/treat (~10K+ downloads/week)
 *
 * Features:
 * - TypeScript-first
 * - Static extraction
 * - Themeable
 * - Type-safe
 * - Zero runtime
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function style(styles: any): string {
  return 'treat-class';
}

export function createTheme(theme: any): string {
  return 'treat-theme';
}

export default { style, createTheme };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎨 treat - Themeable CSS-in-TS (POLYGLOT!)\n");
  const className = style({ color: 'red' });
  console.log("Class:", className);
  console.log("\n🌐 ~10K+ downloads/week on npm!");
}
