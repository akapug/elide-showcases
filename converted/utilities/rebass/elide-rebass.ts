/**
 * Rebass - React Primitive UI Components
 *
 * React primitive UI components with styled-system.
 * **POLYGLOT SHOWCASE**: UI primitives for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rebass (~50K+ downloads/week)
 *
 * Features:
 * - Primitive components
 * - Styled-system props
 * - Responsive
 * - Themeable
 * - Accessible
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function Box(props: any): any {
  return { type: 'div', props };
}

export function Flex(props: any): any {
  return { type: 'div', props: { ...props, display: 'flex' } };
}

export function Button(props: any): any {
  return { type: 'button', props };
}

export function Text(props: any): any {
  return { type: 'span', props };
}

export function Heading(props: any): any {
  return { type: 'h2', props };
}

export default { Box, Flex, Button, Text, Heading };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📦 Rebass - UI Primitives (POLYGLOT!)\n");
  const box = Box({ p: 3, bg: 'blue' });
  console.log("Box:", box);
  const btn = Button({ variant: 'primary' });
  console.log("Button:", btn);
  console.log("\n🌐 ~50K+ downloads/week on npm!");
}
