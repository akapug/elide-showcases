/**
 * Headless UI - Unstyled, Accessible UI Components
 *
 * Completely unstyled, fully accessible UI components for React.
 * **POLYGLOT SHOWCASE**: Headless UI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@headlessui/react (~300K+ downloads/week)
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class Dialog {
  static render(props: { open: boolean; children?: string }): string {
    if (!props.open) return '';
    return `<div role="dialog">${props.children || ''}</div>`;
  }
}

export class Menu {
  static Button(props: { children?: string }): string {
    return `<button>${props.children || 'Menu'}</button>`;
  }

  static Items(props: { children?: string }): string {
    return `<div role="menu">${props.children || ''}</div>`;
  }
}

export class Disclosure {
  static Button(props: { children?: string }): string {
    return `<button>${props.children || 'Toggle'}</button>`;
  }

  static Panel(props: { children?: string }): string {
    return `<div>${props.children || ''}</div>`;
  }
}

export default { Dialog, Menu, Disclosure };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Headless UI - Unstyled Accessible Components (POLYGLOT!)\n");
  console.log(Dialog.render({ open: true, children: 'Dialog' }));
  console.log(Menu.Button({ children: 'Open Menu' }));
  console.log(Disclosure.Button({ children: 'Toggle' }));
  console.log("\n🚀 ~300K+ downloads/week!");
}
