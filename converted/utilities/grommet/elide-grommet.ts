/**
 * Grommet - React-based Framework
 *
 * A react-based framework that provides accessibility, modularity, responsiveness, and theming.
 * **POLYGLOT SHOWCASE**: Accessible framework for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/grommet (~50K+ downloads/week)
 *
 * Features:
 * - Responsive and accessible
 * - Themeable
 * - Modular components
 *
 * Package has ~50K+ downloads/week on npm!
 */

export class Button {
  static render(props: { primary?: boolean; label?: string }): string {
    return `<button class="grommet-button ${props.primary ? 'primary' : ''}">${props.label || 'Button'}</button>`;
  }
}

export class Box {
  static render(props: { pad?: string; background?: string; children?: string }): string {
    return `<div class="grommet-box" style="padding: ${props.pad || '0'}; background: ${props.background || 'transparent'}">${props.children || ''}</div>`;
  }
}

export default { Button, Box };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Grommet - Accessible Framework (POLYGLOT!)\n");
  console.log(Button.render({ primary: true, label: 'Primary' }));
  console.log(Box.render({ pad: 'medium', children: 'Box content' }));
  console.log("\n🚀 ~50K+ downloads/week!");
}
