/**
 * React Virtualized - Components for Efficiently Rendering Large Lists
 *
 * React components for efficiently rendering large lists and tabular data.
 * **POLYGLOT SHOWCASE**: Virtualization for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-virtualized (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class List {
  static render(props: { rowCount: number; rowHeight: number; rowRenderer: (index: number) => string }): string {
    let html = '<div class="ReactVirtualized__List">\n';
    for (let i = 0; i < Math.min(props.rowCount, 10); i++) {
      html += `  <div style="height: ${props.rowHeight}px">${props.rowRenderer(i)}</div>\n`;
    }
    if (props.rowCount > 10) {
      html += `  ... (${props.rowCount - 10} more rows)\n`;
    }
    html += '</div>';
    return html;
  }
}

export class Grid {
  static render(props: { columnCount: number; rowCount: number; cellRenderer: (row: number, col: number) => string }): string {
    let html = '<div class="ReactVirtualized__Grid">\n';
    for (let r = 0; r < Math.min(props.rowCount, 5); r++) {
      html += '  <div class="row">\n';
      for (let c = 0; c < Math.min(props.columnCount, 5); c++) {
        html += `    <div class="cell">${props.cellRenderer(r, c)}</div>\n`;
      }
      html += '  </div>\n';
    }
    html += '</div>';
    return html;
  }
}

export default { List, Grid };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Virtualized - Large List Rendering (POLYGLOT!)\n");
  console.log(List.render({
    rowCount: 1000,
    rowHeight: 35,
    rowRenderer: (i) => `Row ${i}`
  }));
  console.log("\n🚀 ~500K+ downloads/week!");
}
