/**
 * NextUI - Beautiful & Modern React UI Library
 *
 * Beautiful, fast and modern React UI library.
 * **POLYGLOT SHOWCASE**: Modern UI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@nextui-org/react (~50K+ downloads/week)
 *
 * Features:
 * - Beautiful default theme
 * - Dark mode built-in
 * - Fully customizable
 * - Accessible components
 * - TypeScript support
 *
 * Polyglot Benefits:
 * - Modern design system for all platforms
 * - Beautiful UI in any language
 *
 * Use cases:
 * - Modern web apps
 * - Landing pages
 * - SaaS platforms
 *
 * Package has ~50K+ downloads/week on npm!
 */

export class Button {
  static render(props: { color?: string; variant?: string; children?: string }): string {
    return `<button class="nextui-button nextui-button-${props.color || 'primary'} nextui-button-${props.variant || 'solid'}">${props.children || 'Button'}</button>`;
  }
}

export class Card {
  static render(props: { isPressable?: boolean; children?: string }): string {
    return `<div class="nextui-card ${props.isPressable ? 'pressable' : ''}">${props.children || ''}</div>`;
  }
}

export class Input {
  static render(props: { label?: string; placeholder?: string; type?: string }): string {
    return `<div class="nextui-input">
  ${props.label ? `<label>${props.label}</label>` : ''}
  <input type="${props.type || 'text'}" placeholder="${props.placeholder || ''}" />
</div>`;
  }
}

export default { Button, Card, Input };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 NextUI - Beautiful Modern UI (POLYGLOT!)\n");
  console.log(Button.render({ color: 'primary', variant: 'solid', children: 'Primary' }));
  console.log(Card.render({ isPressable: true, children: 'Interactive card' }));
  console.log(Input.render({ label: 'Email', placeholder: 'you@example.com' }));
  console.log("\n🌐 Beautiful UI for all languages!");
  console.log("🚀 ~50K+ downloads/week!");
}
