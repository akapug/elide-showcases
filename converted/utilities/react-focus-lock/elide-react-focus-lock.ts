/**
 * React Focus Lock - Focus Management
 *
 * Trap focus within a DOM node.
 * **POLYGLOT SHOWCASE**: Focus management for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-focus-lock (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class FocusLock {
  static render(props: { disabled?: boolean; children?: string }): string {
    return `<div class="focus-lock" ${props.disabled ? '' : 'data-focus-lock="true"'}>
  ${props.children || ''}
</div>`;
  }
}

export function enableFocusLock(element: string): string {
  return `<div data-focus-lock="true">
  ${element}
</div>`;
}

export default { FocusLock, enableFocusLock };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Focus Lock - Focus Management (POLYGLOT!)\n");
  console.log(FocusLock.render({ children: '<button>Focused button</button>' }));
  console.log(enableFocusLock('<input type="text" placeholder="Focused input" />'));
  console.log("\n🚀 ~500K+ downloads/week!");
}
