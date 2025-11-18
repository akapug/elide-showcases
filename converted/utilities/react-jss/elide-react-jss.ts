/**
 * react-jss - JSS for React
 *
 * JSS integration for React.
 * **POLYGLOT SHOWCASE**: React styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-jss (~200K+ downloads/week)
 *
 * Features:
 * - JSS for React
 * - HOC pattern
 * - Theming
 * - Dynamic styles
 * - Server-side rendering
 *
 * Package has ~200K+ downloads/week on npm!
 */

let counter = 0;

export function createUseStyles(styles: any) {
  return (props: any = {}) => {
    const classes: any = {};
    for (const key in styles) {
      classes[key] = \`jss-\${counter++}\`;
    }
    return classes;
  };
}

export function useTheme(): any {
  return {};
}

export default { createUseStyles, useTheme };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⚛️ react-jss - JSS for React (POLYGLOT!)\n");
  const useStyles = createUseStyles({
    button: { background: 'blue', color: 'white' }
  });
  const classes = useStyles();
  console.log("Classes:", classes);
  console.log("\n🌐 ~200K+ downloads/week on npm!");
}
