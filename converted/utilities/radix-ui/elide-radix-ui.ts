/**
 * Radix UI - Unstyled, Accessible Components
 *
 * An open-source UI component library for building high-quality, accessible design systems.
 * **POLYGLOT SHOWCASE**: Accessible primitives for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@radix-ui/react (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class Dialog {
  static Trigger(props: { children?: string }): string {
    return `<button class="radix-dialog-trigger">${props.children || 'Open'}</button>`;
  }

  static Content(props: { children?: string }): string {
    return `<div class="radix-dialog-content">${props.children || ''}</div>`;
  }
}

export class DropdownMenu {
  static Trigger(props: { children?: string }): string {
    return `<button class="radix-dropdown-trigger">${props.children || 'Menu'}</button>`;
  }

  static Item(props: { children?: string }): string {
    return `<div class="radix-dropdown-item">${props.children || ''}</div>`;
  }
}

export default { Dialog, DropdownMenu };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Radix UI - Accessible Primitives (POLYGLOT!)\n");
  console.log(Dialog.Trigger({ children: 'Open Dialog' }));
  console.log(Dialog.Content({ children: 'Dialog content' }));
  console.log(DropdownMenu.Trigger({ children: 'Menu' }));
  console.log(DropdownMenu.Item({ children: 'Item 1' }));
  console.log("\n🚀 ~500K+ downloads/week!");
}
