/**
 * React Tooltip - Tooltip Component
 *
 * React tooltip component.
 * **POLYGLOT SHOWCASE**: Tooltips for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-tooltip (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class Tooltip {
  static render(props: { id: string; place?: string; effect?: string; children?: string }): string {
    return `<div class="react-tooltip" data-tip-id="${props.id}" data-place="${props.place || 'top'}" data-effect="${props.effect || 'solid'}">
  ${props.children || 'Tooltip content'}
</div>`;
  }
}

export function renderWithTooltip(element: string, tooltip: string): string {
  return `<span data-tooltip="${tooltip}">${element}</span>`;
}

export default { Tooltip, renderWithTooltip };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Tooltip - Tooltips (POLYGLOT!)\n");
  console.log(renderWithTooltip('<button>Hover me</button>', 'This is a tooltip'));
  console.log(Tooltip.render({ id: 'tooltip-1', place: 'top', children: 'Tooltip text' }));
  console.log("\n🚀 ~500K+ downloads/week!");
}
