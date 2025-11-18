/**
 * @emotion/react - Emotion for React
 *
 * CSS-in-JS library designed for React with SSR support.
 * **POLYGLOT SHOWCASE**: React styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@emotion/react (~2M+ downloads/week)
 *
 * Features:
 * - css prop for React
 * - ThemeProvider
 * - Global styles
 * - SSR support
 * - Framework agnostic core
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Use React patterns in Python, Ruby, Java via Elide
 * - Share React components across languages
 * - ONE component library for all platforms
 *
 * Use cases:
 * - React applications
 * - Design systems
 * - Server-side rendering
 * - Component libraries
 *
 * Package has ~2M+ downloads/week on npm!
 */

interface Theme {
  [key: string]: any;
}

let currentTheme: Theme = {};
const styleRegistry = new Map<string, string>();

/**
 * Process CSS with theme
 */
function processCSS(css: any, theme: Theme): string {
  if (typeof css === 'function') {
    return css(theme);
  }
  if (typeof css === 'string') {
    return css;
  }
  if (typeof css === 'object') {
    return objectToCSS(css);
  }
  return '';
}

function objectToCSS(obj: any): string {
  let result = '';
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (typeof value === 'object') {
      result += `${key} { ${objectToCSS(value)} } `;
    } else {
      result += `${cssKey}: ${value}; `;
    }
  }
  return result;
}

/**
 * css prop helper
 */
export function css(styles: any) {
  const className = `emotion-${Object.keys(styleRegistry).length}`;
  const cssText = processCSS(styles, currentTheme);
  styleRegistry.set(className, cssText);
  return className;
}

/**
 * ThemeProvider component
 */
export class ThemeProvider {
  constructor(public theme: Theme, public children: any) {
    currentTheme = theme;
  }

  render() {
    return this.children;
  }
}

/**
 * useTheme hook
 */
export function useTheme(): Theme {
  return currentTheme;
}

/**
 * Global styles
 */
export function Global({ styles }: { styles: any }) {
  const cssText = processCSS(styles, currentTheme);
  styleRegistry.set('global', cssText);
}

/**
 * ClassNames component
 */
export function ClassNames({ children }: { children: (helpers: any) => any }) {
  return children({ css });
}

/**
 * Get stylesheet
 */
export function getStyleSheet(): string {
  let result = '';
  for (const [className, css] of styleRegistry.entries()) {
    if (className === 'global') {
      result += css + '\n';
    } else {
      result += `.${className} { ${css} }\n`;
    }
  }
  return result;
}

export default { css, ThemeProvider, useTheme, Global, ClassNames };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚛️ @emotion/react - React CSS-in-JS (POLYGLOT!)\n");

  console.log("=== Example 1: css prop ===");
  const buttonClass = css({
    backgroundColor: 'hotpink',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px'
  });
  console.log("Button class:", buttonClass);
  console.log();

  console.log("=== Example 2: Theme Provider ===");
  const theme = {
    colors: {
      primary: '#007bff',
      secondary: '#6c757d'
    }
  };

  const provider = new ThemeProvider(theme, 'children');
  console.log("Theme:", useTheme());
  console.log();

  console.log("=== Example 3: Global Styles ===");
  Global({
    styles: {
      body: {
        margin: 0,
        fontFamily: 'sans-serif'
      }
    }
  });
  console.log("Global styles applied");
  console.log();

  console.log("=== Example 4: Complete Stylesheet ===");
  console.log(getStyleSheet());
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Use @emotion/react in all languages via Elide!");
  console.log("  ✓ React components everywhere");
  console.log("  ✓ Shared design systems");
  console.log("  ✓ ~2M+ downloads/week on npm");
}
