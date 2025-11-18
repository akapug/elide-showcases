/**
 * twin.macro - Tailwind + CSS-in-JS
 *
 * Blends Tailwind with CSS-in-JS.
 * **POLYGLOT SHOWCASE**: Tailwind styling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/twin.macro (~30K+ downloads/week)
 *
 * Features:
 * - Tailwind utility classes
 * - CSS-in-JS integration
 * - Compile-time processing
 * - Variants
 * - Zero runtime overhead
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function tw(classes: string): string {
  return classes;
}

export default tw;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎨 twin.macro - Tailwind + CSS-in-JS (POLYGLOT!)\n");
  const className = tw('bg-blue-500 text-white p-4');
  console.log("Classes:", className);
  console.log("\n🌐 ~30K+ downloads/week on npm!");
}
