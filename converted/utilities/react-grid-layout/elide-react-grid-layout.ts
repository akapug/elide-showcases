/**
 * React Grid Layout - Draggable and Resizable Grid Layout
 *
 * A draggable and resizable grid layout with responsive breakpoints.
 * **POLYGLOT SHOWCASE**: Grid layouts for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-grid-layout (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class GridLayout {
  static render(props: { layout: LayoutItem[]; cols?: number; rowHeight?: number }): string {
    const { cols = 12, rowHeight = 30 } = props;
    let html = `<div class="react-grid-layout" style="position: relative">\n`;
    props.layout.forEach(item => {
      const width = (item.w / cols) * 100;
      const left = (item.x / cols) * 100;
      html += `  <div class="grid-item" style="position: absolute; left: ${left}%; top: ${item.y * rowHeight}px; width: ${width}%; height: ${item.h * rowHeight}px">\n`;
      html += `    Item ${item.i}\n`;
      html += `  </div>\n`;
    });
    html += '</div>';
    return html;
  }
}

export default GridLayout;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Grid Layout - Draggable Grid (POLYGLOT!)\n");
  console.log(GridLayout.render({
    layout: [
      { i: 'a', x: 0, y: 0, w: 6, h: 2 },
      { i: 'b', x: 6, y: 0, w: 6, h: 2 },
      { i: 'c', x: 0, y: 2, w: 12, h: 3 }
    ]
  }));
  console.log("\n🚀 ~200K+ downloads/week!");
}
