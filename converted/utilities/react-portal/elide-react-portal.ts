/**
 * React Portal - Portal Component
 *
 * React component for transportation of modals, lightboxes, loading bars, etc.
 * **POLYGLOT SHOWCASE**: Portals for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-portal (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

export class Portal {
  static render(props: { children?: string; node?: string }): string {
    return `<!-- Portal to ${props.node || 'document.body'} -->
<div class="react-portal">
  ${props.children || ''}
</div>`;
  }
}

export function createPortal(children: string, container: string = 'document.body'): string {
  return `<!-- Portal -->
<div data-portal-container="${container}">
  ${children}
</div>`;
}

export default { Portal, createPortal };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Portal - Portal Component (POLYGLOT!)\n");
  console.log(Portal.render({ children: '<div>Modal content</div>', node: 'document.body' }));
  console.log(createPortal('<div>Lightbox</div>', '#portal-root'));
  console.log("\n🚀 ~200K+ downloads/week!");
}
