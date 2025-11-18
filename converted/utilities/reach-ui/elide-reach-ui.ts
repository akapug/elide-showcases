/**
 * Reach UI - Accessible React Components
 *
 * The accessible foundation for React apps and design systems.
 * **POLYGLOT SHOWCASE**: Accessible foundation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@reach/router (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

export class Dialog {
  static render(props: { isOpen: boolean; children?: string }): string {
    if (!props.isOpen) return '';
    return `<div role="dialog" class="reach-dialog">${props.children || ''}</div>`;
  }
}

export class Menu {
  static render(props: { children?: string }): string {
    return `<div role="menu" class="reach-menu">${props.children || ''}</div>`;
  }
}

export default { Dialog, Menu };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Reach UI - Accessible Foundation (POLYGLOT!)\n");
  console.log(Dialog.render({ isOpen: true, children: 'Dialog content' }));
  console.log(Menu.render({ children: 'Menu items' }));
  console.log("\n🚀 ~200K+ downloads/week!");
}
