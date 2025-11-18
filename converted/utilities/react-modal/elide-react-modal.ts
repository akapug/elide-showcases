/**
 * React Modal - Accessible Modal Dialog Component
 *
 * Accessible modal dialog component for React.
 * **POLYGLOT SHOWCASE**: Modal dialogs for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-modal (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class Modal {
  static render(props: { isOpen: boolean; onRequestClose?: () => void; children?: string; contentLabel?: string }): string {
    if (!props.isOpen) return '';
    return `<div class="ReactModal__Overlay">
  <div class="ReactModal__Content" role="dialog" aria-label="${props.contentLabel || 'Modal'}">
    <button class="ReactModal__CloseButton" onclick="close()">×</button>
    ${props.children || ''}
  </div>
</div>`;
  }

  static setAppElement(element: string): void {
    console.log(`App element set to: ${element}`);
  }
}

export default Modal;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Modal - Accessible Modals (POLYGLOT!)\n");
  console.log(Modal.render({
    isOpen: true,
    contentLabel: 'Example Modal',
    children: '<h2>Modal Title</h2><p>Modal content goes here...</p>'
  }));
  console.log("\n🚀 ~1M+ downloads/week!");
}
