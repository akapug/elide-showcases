/**
 * @emotion/css - Framework Agnostic CSS-in-JS
 *
 * Framework agnostic CSS-in-JS.
 * **POLYGLOT SHOWCASE**: Universal CSS-in-JS for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@emotion/css (~500K+ downloads/week)
 *
 * Features:
 * - Framework agnostic
 * - String and object styles
 * - Composition
 * - SSR support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Use in any framework via Elide
 * - Python, Ruby, Java styling
 * - ONE CSS library everywhere
 *
 * Use cases:
 * - Vanilla JS applications
 * - Framework agnostic libraries
 * - Server-side rendering
 * - Style utilities
 *
 * Package has ~500K+ downloads/week on npm!
 */

const cache = new Map<string, string>();
let id = 0;

function objToCSS(obj: any): string {
  let css = '';
  for (const [k, v] of Object.entries(obj)) {
    const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
    css += `${key}: ${v}; `;
  }
  return css;
}

export function css(...args: any[]): string {
  const className = `css-${id++}`;
  let cssText = '';

  if (args[0]?.raw) {
    const [strings, ...values] = args;
    for (let i = 0; i < strings.length; i++) {
      cssText += strings[i] + (values[i] || '');
    }
  } else if (typeof args[0] === 'object') {
    cssText = objToCSS(args[0]);
  }

  cache.set(className, cssText);
  return className;
}

export function cx(...classes: any[]): string {
  return classes.filter(Boolean).join(' ');
}

export function injectGlobal(styles: any): void {
  const cssText = typeof styles === 'object' ? objToCSS(styles) : styles;
  cache.set('global', cssText);
}

export function keyframes(...args: any[]): string {
  const name = `anim-${id++}`;
  let kf = '';

  if (args[0]?.raw) {
    const [strings, ...values] = args;
    for (let i = 0; i < strings.length; i++) {
      kf += strings[i] + (values[i] || '');
    }
  }

  cache.set(name, kf);
  return name;
}

export function getStyles(): string {
  let result = '';
  for (const [cls, css] of cache.entries()) {
    if (cls === 'global') {
      result += css + '\n';
    } else if (cls.startsWith('anim-')) {
      result += `@keyframes ${cls} { ${css} }\n`;
    } else {
      result += `.${cls} { ${css} }\n`;
    }
  }
  return result;
}

export default { css, cx, injectGlobal, keyframes };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 @emotion/css - Framework Agnostic (POLYGLOT!)\n");

  const btn = css({ background: 'blue', color: 'white', padding: '10px' });
  console.log("Button class:", btn);

  const card = css`
    background: white;
    border-radius: 8px;
    padding: 20px;
  `;
  console.log("Card class:", card);

  const combined = cx(btn, card);
  console.log("Combined:", combined);

  console.log("\n=== Styles ===");
  console.log(getStyles());

  console.log("\n🌐 Framework agnostic CSS-in-JS!");
  console.log("  ✓ ~500K+ downloads/week");
}
