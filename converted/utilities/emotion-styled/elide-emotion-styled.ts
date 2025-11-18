/**
 * @emotion/styled - Styled Component API for Emotion
 *
 * Styled component API built on Emotion.
 * **POLYGLOT SHOWCASE**: Styled components for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@emotion/styled (~2M+ downloads/week)
 *
 * Features:
 * - styled.div`` syntax
 * - Prop-based styling
 * - Theme support
 * - TypeScript support
 * - Server-side rendering
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Styled components in Python, Ruby, Java via Elide
 * - Share component libraries across languages
 * - ONE styling API everywhere
 *
 * Use cases:
 * - React component libraries
 * - Design systems
 * - Dynamic theming
 * - Responsive designs
 *
 * Package has ~2M+ downloads/week on npm!
 */

interface StyledProps {
  theme?: any;
  [key: string]: any;
}

const styleCache = new Map<string, string>();
let counter = 0;

function generateClassName(): string {
  return `styled-${counter++}`;
}

function processTemplate(
  strings: TemplateStringsArray,
  values: any[],
  props: StyledProps
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const value = values[i];
      if (typeof value === 'function') {
        result += value(props);
      } else {
        result += value;
      }
    }
  }
  return result;
}

function createStyledComponent(tag: string) {
  return (strings: TemplateStringsArray, ...values: any[]) => {
    return (props: StyledProps = {}) => {
      const className = generateClassName();
      const css = processTemplate(strings, values, props);
      styleCache.set(className, css);

      return {
        type: tag,
        className,
        props,
        toString() {
          return `<${tag} class="${className}">${props.children || ''}</${tag}>`;
        }
      };
    };
  };
}

export const styled = new Proxy({} as any, {
  get(target, tag: string) {
    return createStyledComponent(tag);
  }
});

export function getStyles(): string {
  let result = '';
  for (const [className, css] of styleCache.entries()) {
    result += `.${className} { ${css} }\n`;
  }
  return result;
}

export default styled;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💅 @emotion/styled - Styled API (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Styled Component ===");
  const Button = styled.button`
    background: palevioletred;
    color: white;
    padding: 0.5em 1em;
    border-radius: 4px;
  `;

  const btn = Button({ children: 'Click' });
  console.log("Button:", btn.toString());
  console.log();

  console.log("=== Example 2: Props-Based Styling ===");
  const DynamicButton = styled.button`
    background: ${(props: any) => props.primary ? 'blue' : 'gray'};
    color: white;
    padding: 0.5em 1em;
  `;

  const primaryBtn = DynamicButton({ primary: true });
  console.log("Primary button created");
  console.log();

  console.log("=== Example 3: Styled Div ===");
  const Container = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  `;

  const container = Container({});
  console.log("Container:", container.toString());
  console.log();

  console.log("=== Styles ===");
  console.log(getStyles());
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 @emotion/styled in all languages!");
  console.log("  ✓ ~2M+ downloads/week on npm");
}
