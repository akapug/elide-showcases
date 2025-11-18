/**
 * Gestalt - Pinterest's Design System
 *
 * A set of React UI components that supports Pinterest's design language.
 * **POLYGLOT SHOWCASE**: Pinterest's UI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/gestalt (~20K+ downloads/week)
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class Button {
  static render(props: { text: string; color?: string; size?: string }): string {
    return `<button class="gestalt-button gestalt-${props.color || 'gray'} gestalt-${props.size || 'md'}">${props.text}</button>`;
  }
}

export class Box {
  static render(props: { children?: string; padding?: number }): string {
    return `<div class="gestalt-box" style="padding: ${props.padding || 0}px">${props.children || ''}</div>`;
  }
}

export default { Button, Box };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Gestalt - Pinterest Design (POLYGLOT!)\n");
  console.log(Button.render({ text: 'Click', color: 'red' }));
  console.log(Box.render({ padding: 4, children: 'Content' }));
  console.log("\n🚀 ~20K+ downloads/week!");
}
