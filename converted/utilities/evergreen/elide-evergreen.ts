/**
 * Evergreen - React UI Framework
 *
 * A design system for the modern web by Segment.
 * **POLYGLOT SHOWCASE**: Modern design system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/evergreen-ui (~30K+ downloads/week)
 *
 * Features:
 * - 30+ polished React components
 * - Built on React UI Primitive
 * - Flexible theming
 *
 * Package has ~30K+ downloads/week on npm!
 */

export class Button {
  static render(props: { appearance?: string; intent?: string; children?: string }): string {
    return `<button class="evergreen-button evergreen-${props.appearance || 'default'} evergreen-${props.intent || 'none'}">${props.children || 'Button'}</button>`;
  }
}

export class Pane {
  static render(props: { elevation?: number; children?: string }): string {
    return `<div class="evergreen-pane elevation-${props.elevation || 0}">${props.children || ''}</div>`;
  }
}

export class toaster {
  static success(title: string): void {
    console.log(`✅ ${title}`);
  }
}

export default { Button, Pane, toaster };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Evergreen - Segment's Design System (POLYGLOT!)\n");
  console.log(Button.render({ appearance: 'primary', children: 'Primary' }));
  console.log(Pane.render({ elevation: 1, children: 'Pane content' }));
  toaster.success('Operation complete');
  console.log("\n🚀 ~30K+ downloads/week!");
}
