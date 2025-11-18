/**
 * React Window - Components for Efficiently Rendering Large Lists
 *
 * React components for efficiently rendering large lists and tabular data.
 * **POLYGLOT SHOWCASE**: Efficient list rendering for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-window (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class FixedSizeList {
  static render(props: { height: number; itemCount: number; itemSize: number; width: number }): string {
    const visibleItems = Math.floor(props.height / props.itemSize);
    let html = `<div class="react-window-list" style="height: ${props.height}px; width: ${props.width}px">\n`;
    for (let i = 0; i < Math.min(props.itemCount, visibleItems); i++) {
      html += `  <div style="height: ${props.itemSize}px">Item ${i}</div>\n`;
    }
    if (props.itemCount > visibleItems) {
      html += `  ... (${props.itemCount - visibleItems} more items)\n`;
    }
    html += '</div>';
    return html;
  }
}

export class VariableSizeList {
  static render(props: { height: number; itemCount: number; width: number }): string {
    return `<div class="react-window-list" style="height: ${props.height}px; width: ${props.width}px">
  ${props.itemCount} items (variable size)
</div>`;
  }
}

export default { FixedSizeList, VariableSizeList };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Window - Efficient Lists (POLYGLOT!)\n");
  console.log(FixedSizeList.render({ height: 350, itemCount: 1000, itemSize: 35, width: 300 }));
  console.log("\n🚀 ~1M+ downloads/week!");
}
