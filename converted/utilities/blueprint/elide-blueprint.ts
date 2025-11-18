/**
 * Blueprint - React UI Toolkit
 *
 * A React-based UI toolkit for the web.
 * **POLYGLOT SHOWCASE**: Professional UI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@blueprintjs/core (~100K+ downloads/week)
 *
 * Features:
 * - 40+ React components
 * - Optimized for building complex data-dense interfaces
 * - TypeScript support
 * - Dark theme
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class Button {
  static render(props: { intent?: string; minimal?: boolean; children?: string }): string {
    return `<button class="bp4-button ${props.intent ? 'bp4-intent-' + props.intent : ''} ${props.minimal ? 'bp4-minimal' : ''}">${props.children || 'Button'}</button>`;
  }
}

export class Card {
  static render(props: { elevation?: number; children?: string }): string {
    return `<div class="bp4-card bp4-elevation-${props.elevation || 0}">${props.children || ''}</div>`;
  }
}

export class Toaster {
  static show(message: string, intent: 'success' | 'warning' | 'danger' | 'primary' = 'primary'): void {
    const icons = { success: '✅', danger: '❌', warning: '⚠️', primary: 'ℹ️' };
    console.log(`${icons[intent]} ${message}`);
  }
}

export default { Button, Card, Toaster };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Blueprint - Professional UI Toolkit (POLYGLOT!)\n");
  console.log(Button.render({ intent: 'primary', children: 'Primary' }));
  console.log(Card.render({ elevation: 2, children: 'Card content' }));
  Toaster.show('Operation successful', 'success');
  console.log("\n🚀 ~100K+ downloads/week!");
}
