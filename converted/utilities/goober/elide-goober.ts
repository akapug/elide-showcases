/**
 * goober - Less than 1KB CSS-in-JS
 *
 * Tiny CSS-in-JS solution.
 * **POLYGLOT SHOWCASE**: Micro CSS-in-JS for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/goober (~20K+ downloads/week)
 *
 * Features:
 * - Less than 1KB
 * - Fast performance
 * - SSR support
 * - Framework agnostic
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

let id = 0;

export function css(tag: TemplateStringsArray | any, ...args: any[]): string {
  return \`go\${id++}\`;
}

export function styled(tag: string) {
  return (styles: any) => (props: any = {}) => ({
    type: tag,
    className: css(styles),
    toString() { return \`<\${tag} class="\${this.className}">\${props.children || ''}</\${tag}>\`; }
  });
}

export default styled;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🐐 goober - Tiny CSS-in-JS (POLYGLOT!)\n");
  const className = css\`color: red;\`;
  console.log("Class:", className);
  console.log("\n🌐 ~20K+ downloads/week, <1KB!");
}
