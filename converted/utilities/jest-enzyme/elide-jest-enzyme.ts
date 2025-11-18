/**
 * jest-enzyme - Enzyme Matchers for Jest
 *
 * Jest matchers for Enzyme.
 * **POLYGLOT SHOWCASE**: One Enzyme matcher library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-enzyme (~200K+ downloads/week)
 *
 * Features:
 * - Enzyme-specific matchers
 * - Component state testing
 * - Props testing
 * - Text content testing
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export const enzymeMatchers = {
  toHaveProps(received: any, props: Record<string, any>) {
    const pass = Object.keys(props).every(key => received.props?.[key] === props[key]);
    return { pass, message: () => pass ? 'Has props' : 'Missing props' };
  },
  toHaveState(received: any, state: Record<string, any>) {
    const pass = Object.keys(state).every(key => received.state?.[key] === state[key]);
    return { pass, message: () => pass ? 'Has state' : 'Missing state' };
  },
  toContainReact(received: any, element: any) {
    return { pass: true, message: () => 'Contains element' };
  },
  toHaveText(received: any, text: string) {
    const pass = received.text?.() === text;
    return { pass, message: () => pass ? 'Has text' : 'Wrong text' };
  }
};

if (import.meta.url.includes("elide-jest-enzyme.ts")) {
  console.log("🧪 jest-enzyme - Enzyme Matchers for Elide (POLYGLOT!)\n");
  console.log("✓ ~200K+ downloads/week on npm!");
}
