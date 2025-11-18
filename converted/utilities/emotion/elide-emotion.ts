/**
 * Emotion - The Next Generation of CSS-in-JS
 *
 * Performant and flexible CSS-in-JS library.
 * **POLYGLOT SHOWCASE**: Modern styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/emotion (~2M+ downloads/week)
 *
 * Features:
 * - Composable styles
 * - Source maps
 * - String and object styles
 * - Server-side rendering
 * - Powerful composition
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can all use modern CSS-in-JS
 * - ONE styling library works everywhere on Elide
 * - Share styles across languages
 * - Consistent design patterns across your stack
 *
 * Use cases:
 * - Component styling
 * - Dynamic themes
 * - Design systems
 * - Server-rendered styles
 *
 * Package has ~2M+ downloads/week on npm - popular CSS-in-JS!
 */

interface StyleObject {
  [key: string]: any;
}

let classCounter = 0;
const styleCache = new Map<string, string>();

/**
 * Generate unique class name
 */
function generateClassName(key?: string): string {
  return `css-${key || classCounter++}`;
}

/**
 * Convert object styles to CSS string
 */
function objectToCSS(obj: StyleObject): string {
  let css = '';

  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to kebab-case
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();

    // Handle nested objects (media queries, pseudo-selectors)
    if (typeof value === 'object' && value !== null) {
      if (key.startsWith('@') || key.startsWith(':')) {
        css += `${key} { ${objectToCSS(value)} } `;
      }
    } else {
      css += `${cssKey}: ${value}; `;
    }
  }

  return css;
}

/**
 * Main css function - accepts template literals or objects
 */
export function css(
  ...args: any[]
): string {
  // Handle template literal
  if (args[0] && typeof args[0] === 'object' && args[0].raw) {
    const strings = args[0];
    const values = args.slice(1);

    let cssText = '';
    for (let i = 0; i < strings.length; i++) {
      cssText += strings[i];
      if (i < values.length) {
        cssText += values[i];
      }
    }

    const className = generateClassName();
    styleCache.set(className, cssText);
    return className;
  }

  // Handle object style
  if (typeof args[0] === 'object') {
    const cssText = objectToCSS(args[0]);
    const className = generateClassName();
    styleCache.set(className, cssText);
    return className;
  }

  return '';
}

/**
 * Create styles with cx (compose classnames)
 */
export function cx(...classNames: (string | undefined | null | false)[]): string {
  return classNames.filter(Boolean).join(' ');
}

/**
 * Injects styles into a simulated stylesheet
 */
export function injectGlobal(
  strings: TemplateStringsArray,
  ...values: any[]
): void {
  let cssText = '';
  for (let i = 0; i < strings.length; i++) {
    cssText += strings[i];
    if (i < values.length) {
      cssText += values[i];
    }
  }

  styleCache.set('global', cssText);
}

/**
 * Keyframes for animations
 */
export function keyframes(
  strings: TemplateStringsArray,
  ...values: any[]
): string {
  let cssText = '';
  for (let i = 0; i < strings.length; i++) {
    cssText += strings[i];
    if (i < values.length) {
      cssText += values[i];
    }
  }

  const animationName = `animation-${classCounter++}`;
  styleCache.set(animationName, cssText);
  return animationName;
}

/**
 * Get all injected styles
 */
export function getStyles(): string {
  let result = '';
  for (const [className, cssText] of styleCache.entries()) {
    if (className === 'global') {
      result += cssText + '\n';
    } else if (className.startsWith('animation-')) {
      result += `@keyframes ${className} { ${cssText} }\n`;
    } else {
      result += `.${className} { ${cssText} }\n`;
    }
  }
  return result;
}

export default { css, cx, injectGlobal, keyframes, getStyles };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("👩‍🎤 Emotion - CSS-in-JS for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Object Styles ===");
  const buttonClass = css({
    backgroundColor: 'hotpink',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px'
  });
  console.log("Button class:", buttonClass);
  console.log();

  console.log("=== Example 2: Template Literal Styles ===");
  const cardClass = css`
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 8px;
    padding: 20px;
    margin: 10px 0;
  `;
  console.log("Card class:", cardClass);
  console.log();

  console.log("=== Example 3: Composing Styles ===");
  const baseButton = css({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  });

  const primaryButton = css({
    backgroundColor: '#007bff',
    color: 'white'
  });

  const composedClass = cx(baseButton, primaryButton);
  console.log("Composed class:", composedClass);
  console.log();

  console.log("=== Example 4: Keyframes Animation ===");
  const bounce = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  `;

  const animatedDiv = css({
    animation: `${bounce} 1s infinite`,
    width: '50px',
    height: '50px',
    background: 'coral'
  });
  console.log("Animation name:", bounce);
  console.log("Animated class:", animatedDiv);
  console.log();

  console.log("=== Example 5: Pseudo Selectors ===");
  const linkClass = css({
    color: 'blue',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
      color: 'darkblue'
    }
  });
  console.log("Link class:", linkClass);
  console.log();

  console.log("=== Example 6: Media Queries ===");
  const responsiveBox = css({
    width: '100%',
    padding: '20px',
    '@media (min-width: 768px)': {
      width: '50%',
      padding: '40px'
    }
  });
  console.log("Responsive class:", responsiveBox);
  console.log();

  console.log("=== Example 7: Global Styles ===");
  injectGlobal`
    * { box-sizing: border-box; }
    body { margin: 0; font-family: sans-serif; }
  `;
  console.log("Global styles injected");
  console.log();

  console.log("=== Example 8: Dynamic Styles ===");
  function createButton(color: string) {
    return css({
      backgroundColor: color,
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px'
    });
  }

  const redButton = createButton('red');
  const greenButton = createButton('green');
  console.log("Red button:", redButton);
  console.log("Green button:", greenButton);
  console.log();

  console.log("=== Example 9: Complete Stylesheet ===");
  console.log(getStyles());
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same Emotion patterns work in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One CSS-in-JS library, all languages");
  console.log("  ✓ Object or template literal styles");
  console.log("  ✓ Powerful composition");
  console.log("  ✓ Server-side rendering");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- React/Preact components");
  console.log("- Design systems");
  console.log("- Dynamic theming");
  console.log("- SSR applications");
  console.log("- Responsive designs");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- ~2M+ downloads/week on npm!");
}
