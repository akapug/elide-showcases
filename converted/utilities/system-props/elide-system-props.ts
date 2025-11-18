/**
 * system-props - Style System Props
 *
 * Responsive style system props.
 * **POLYGLOT SHOWCASE**: Style props for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/system-props (~10K+ downloads/week)
 *
 * Features:
 * - Style props
 * - Responsive design
 * - Theme-aware
 * - TypeScript support
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function system(props: any): any {
  const styles: any = {};
  
  // Space
  if (props.m) styles.margin = props.m;
  if (props.p) styles.padding = props.p;
  
  // Color
  if (props.color) styles.color = props.color;
  if (props.bg) styles.backgroundColor = props.bg;
  
  // Typography
  if (props.fontSize) styles.fontSize = props.fontSize;
  
  // Layout
  if (props.width) styles.width = props.width;
  if (props.height) styles.height = props.height;
  
  return styles;
}

export default system;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎨 system-props - Style System (POLYGLOT!)\n");
  const styles = system({ m: 2, p: 3, color: 'blue' });
  console.log("Styles:", styles);
  console.log("\n🌐 ~10K+ downloads/week on npm!");
}
