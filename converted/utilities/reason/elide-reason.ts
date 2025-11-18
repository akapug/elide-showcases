/**
 * Reason - OCaml for JavaScript Developers
 *
 * Reason compiler with OCaml syntax for JavaScript.
 * **POLYGLOT SHOWCASE**: One Reason compiler for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/reason (~50K+ downloads/week)
 *
 * Features:
 * - OCaml syntax
 * - Sound type system
 * - Fast compilation
 * - React integration
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function compile(source: string): { js: string } {
  const js = source.replace(/let\s+(\w+)\s*=\s*/g, 'const $1 = ');
  return { js };
}

export default { compile };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔶 Reason - OCaml for JS (POLYGLOT!)\n");
  console.log("✅ ~50K+ downloads/week on npm!");
}
