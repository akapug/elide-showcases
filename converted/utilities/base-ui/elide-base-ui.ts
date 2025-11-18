/**
 * Base UI - Unstyled React Components
 *
 * Unstyled React components and hooks from MUI.
 * **POLYGLOT SHOWCASE**: Unstyled primitives for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@base-ui/react (~50K+ downloads/week)
 *
 * Package has ~50K+ downloads/week on npm!
 */

export class Button {
  static render(props: { children?: string; disabled?: boolean }): string {
    return `<button ${props.disabled ? 'disabled' : ''}>${props.children || 'Button'}</button>`;
  }
}

export class Input {
  static render(props: { placeholder?: string }): string {
    return `<input placeholder="${props.placeholder || ''}" />`;
  }
}

export default { Button, Input };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Base UI - Unstyled Components (POLYGLOT!)\n");
  console.log(Button.render({ children: 'Click' }));
  console.log(Input.render({ placeholder: 'Type...' }));
  console.log("\n🚀 ~50K+ downloads/week!");
}
