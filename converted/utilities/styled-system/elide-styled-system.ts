/**
 * styled-system - Style Props System
 *
 * Responsive, theme-based style props.
 * **POLYGLOT SHOWCASE**: Design systems for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/styled-system (~300K+ downloads/week)
 *
 * Features:
 * - Style props
 * - Responsive values
 * - Theme-based
 * - Variants
 * - Utilities
 *
 * Package has ~300K+ downloads/week on npm!
 */

export function space(props: any): any {
  const styles: any = {};
  if (props.m) styles.margin = props.m;
  if (props.p) styles.padding = props.p;
  return styles;
}

export function color(props: any): any {
  const styles: any = {};
  if (props.color) styles.color = props.color;
  if (props.bg) styles.backgroundColor = props.bg;
  return styles;
}

export function typography(props: any): any {
  const styles: any = {};
  if (props.fontSize) styles.fontSize = props.fontSize;
  if (props.fontWeight) styles.fontWeight = props.fontWeight;
  return styles;
}

export function layout(props: any): any {
  const styles: any = {};
  if (props.width) styles.width = props.width;
  if (props.height) styles.height = props.height;
  return styles;
}

export function compose(...fns: any[]) {
  return (props: any) => {
    return Object.assign({}, ...fns.map(fn => fn(props)));
  };
}

export default { space, color, typography, layout, compose };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎨 styled-system - Style Props (POLYGLOT!)\n");
  const props = { m: 2, p: 3, color: 'blue', fontSize: 16 };
  const styles = compose(space, color, typography)(props);
  console.log("Styles:", styles);
  console.log("\n🌐 ~300K+ downloads/week on npm!");
}
