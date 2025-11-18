/**
 * Carbon Components React - IBM's Design System
 *
 * React components for the Carbon Design System.
 * **POLYGLOT SHOWCASE**: IBM Carbon for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/carbon-components-react (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class Button {
  static render(props: { kind?: string; size?: string; children?: string }): string {
    return `<button class="bx--btn bx--btn--${props.kind || 'primary'} bx--btn--${props.size || 'md'}">${props.children || 'Button'}</button>`;
  }
}

export class Tile {
  static render(props: { children?: string }): string {
    return `<div class="bx--tile">${props.children || ''}</div>`;
  }
}

export default { Button, Tile };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Carbon - IBM Design System (POLYGLOT!)\n");
  console.log(Button.render({ kind: 'primary', children: 'Primary' }));
  console.log(Tile.render({ children: 'Tile content' }));
  console.log("\n🚀 ~100K+ downloads/week!");
}
