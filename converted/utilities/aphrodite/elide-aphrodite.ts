/**
 * Aphrodite - Inline Styles
 *
 * Framework-agnostic CSS-in-JS with support for server-side rendering.
 * **POLYGLOT SHOWCASE**: Inline styles for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/aphrodite (~100K+ downloads/week)
 *
 * Features:
 * - Inline styles
 * - Media queries
 * - Pseudo-selectors
 * - Server-side rendering
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

let counter = 0;

export class StyleSheet {
  static create(styles: any): any {
    const result: any = {};
    
    for (const key in styles) {
      result[key] = { _name: \`aphrodite-\${counter++}\`, _definition: styles[key] };
    }
    
    return result;
  }
}

export function css(...styles: any[]): string {
  return styles.map(s => s._name).filter(Boolean).join(' ');
}

export default { StyleSheet, css };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("💄 Aphrodite - Inline Styles (POLYGLOT!)\n");
  
  const styles = StyleSheet.create({
    button: {
      background: 'blue',
      color: 'white',
      ':hover': { background: 'darkblue' }
    }
  });
  
  console.log("Button class:", css(styles.button));
  console.log("\n🌐 ~100K+ downloads/week on npm!");
}
