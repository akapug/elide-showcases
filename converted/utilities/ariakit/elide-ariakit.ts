/**
 * Ariakit - Accessible React Components
 *
 * Toolkit for building accessible web apps with React.
 * **POLYGLOT SHOWCASE**: Accessible toolkit for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ariakit (~50K+ downloads/week)
 *
 * Package has ~50K+ downloads/week on npm!
 */

export class Button {
  static render(props: { children?: string }): string {
    return `<button role="button">${props.children || 'Button'}</button>`;
  }
}

export class Dialog {
  static render(props: { open?: boolean; children?: string }): string {
    if (!props.open) return '';
    return `<div role="dialog">${props.children || ''}</div>`;
  }
}

export default { Button, Dialog };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Ariakit - Accessible Toolkit (POLYGLOT!)\n");
  console.log(Button.render({ children: 'Click' }));
  console.log(Dialog.render({ open: true, children: 'Dialog' }));
  console.log("\n🚀 ~50K+ downloads/week!");
}
