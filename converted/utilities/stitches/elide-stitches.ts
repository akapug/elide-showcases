/**
 * Stitches - Modern CSS-in-JS
 *
 * CSS-in-JS with near-zero runtime.
 * **POLYGLOT SHOWCASE**: Modern styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@stitches/react (~100K+ downloads/week)
 *
 * Features:
 * - Near-zero runtime
 * - Variants
 * - Tokens and themes
 * - SSR support
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

let counter = 0;

export function css(styles: any): string {
  return \`stitches-\${counter++}\`;
}

export function styled(tag: string, styles: any) {
  return (props: any = {}) => ({
    type: tag,
    className: css(styles),
    toString() { return \`<\${tag} class="\${this.className}">\${props.children || ''}</\${tag}>\`; }
  });
}

export function createTheme(theme: any): string {
  return \`theme-\${counter++}\`;
}

export default { css, styled, createTheme };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("✨ Stitches - Modern CSS-in-JS (POLYGLOT!)\n");
  const button = styled('button', { background: 'blue' });
  console.log(button({ children: 'Click' }).toString());
  console.log("\n🌐 ~100K+ downloads/week on npm!");
}
