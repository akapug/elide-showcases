/**
 * Fluent UI - Microsoft's Design System
 *
 * A collection of UX frameworks for creating beautiful, cross-platform apps.
 * **POLYGLOT SHOWCASE**: Microsoft Fluent for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@fluentui/react (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

export class PrimaryButton {
  static render(props: { text?: string }): string {
    return `<button class="ms-Button ms-Button--primary">${props.text || 'Button'}</button>`;
  }
}

export class Card {
  static render(props: { children?: string }): string {
    return `<div class="ms-Card">${props.children || ''}</div>`;
  }
}

export default { PrimaryButton, Card };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Fluent UI - Microsoft Design (POLYGLOT!)\n");
  console.log(PrimaryButton.render({ text: 'Primary' }));
  console.log(Card.render({ children: 'Card content' }));
  console.log("\n🚀 ~200K+ downloads/week!");
}
