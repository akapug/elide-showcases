/**
 * RSuite - React Suite UI Library
 *
 * A suite of React components, sensible UI design, and a friendly development experience.
 * **POLYGLOT SHOWCASE**: Sensible UI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rsuite (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class Button {
  static render(props: { appearance?: string; color?: string; children?: string }): string {
    return `<button class="rs-btn rs-btn-${props.appearance || 'default'} rs-btn-${props.color || 'blue'}">${props.children || 'Button'}</button>`;
  }
}

export class Panel {
  static render(props: { header?: string; children?: string }): string {
    return `<div class="rs-panel">${props.header ? `<div class="rs-panel-header">${props.header}</div>` : ''}<div class="rs-panel-body">${props.children || ''}</div></div>`;
  }
}

export default { Button, Panel };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 RSuite (POLYGLOT!)\n");
  console.log(Button.render({ appearance: 'primary', children: 'Click' }));
  console.log(Panel.render({ header: 'Panel', children: 'Content' }));
  console.log("\n🚀 ~100K+ downloads/week!");
}
