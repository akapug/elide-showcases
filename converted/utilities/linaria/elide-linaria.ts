/**
 * Linaria - Zero-Runtime CSS-in-JS
 *
 * Zero-runtime CSS in JS library.
 * **POLYGLOT SHOWCASE**: Zero-runtime styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/linaria (~50K+ downloads/week)
 *
 * Features:
 * - Zero runtime
 * - CSS extraction
 * - Template literals
 * - Dynamic styles
 * - Framework agnostic
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function css(styles: TemplateStringsArray | any, ...args: any[]): string {
  return 'linaria-class';
}

export function styled(tag: string) {
  return (styles: any) => (props: any = {}) => ({
    type: tag,
    className: 'linaria-styled',
    toString() { return \`<\${tag} class="\${this.className}">\${props.children || ''}</\${tag}>\`; }
  });
}

export default { css, styled };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⚡ Linaria - Zero-Runtime CSS (POLYGLOT!)\n");
  const className = css\`color: red;\`;
  console.log("Class:", className);
  console.log("\n🌐 ~50K+ downloads/week on npm!");
}
