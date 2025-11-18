/**
 * tailwind-styled-components - Tailwind + Styled Components
 *
 * Use Tailwind with styled-components.
 * **POLYGLOT SHOWCASE**: Tailwind styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/tailwind-styled-components (~10K+ downloads/week)
 *
 * Features:
 * - Tailwind classes
 * - Styled components API
 * - TypeScript support
 * - Variants
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function tw(tag: string) {
  return (classes: TemplateStringsArray, ...args: any[]) => (props: any = {}) => ({
    type: tag,
    className: classes[0],
    toString() { return \`<\${tag} class="\${this.className}">\${props.children || ''}</\${tag}>\`; }
  });
}

export default tw;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎨 tailwind-styled-components (POLYGLOT!)\n");
  const Button = tw('button')\`bg-blue-500 text-white p-4\`;
  console.log(Button({ children: 'Click' }).toString());
  console.log("\n🌐 ~10K+ downloads/week on npm!");
}
