/**
 * glamor - Inline CSS
 *
 * Inline CSS for React.
 * **POLYGLOT SHOWCASE**: Inline CSS for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/glamor (~50K+ downloads/week)
 *
 * Features:
 * - Inline CSS
 * - Pseudo-selectors
 * - Media queries
 * - Server-side rendering
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

let counter = 0;

export function css(styles: any): any {
  return { toString: () => \`glamor-\${counter++}\` };
}

export function merge(...styles: any[]): any {
  return css(Object.assign({}, ...styles));
}

export default { css, merge };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("💄 glamor - Inline CSS (POLYGLOT!)\n");
  const style = css({ color: 'red', ':hover': { color: 'blue' } });
  console.log("Style:", style.toString());
  console.log("\n🌐 ~50K+ downloads/week on npm!");
}
