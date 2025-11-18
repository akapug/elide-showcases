/**
 * ANSI Regex - Regular Expression for ANSI Codes
 *
 * Regex to match ANSI escape codes.
 * **POLYGLOT SHOWCASE**: ANSI detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ansi-regex (~20M+ downloads/week)
 *
 * Features:
 * - Match ANSI escape codes
 * - Remove ANSI codes
 * - Detect styled text
 * - Simple regex pattern
 * - Zero dependencies
 *
 * Package has ~20M+ downloads/week on npm!
 */

export function ansiRegex(options?: { onlyFirst?: boolean }): RegExp {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');

  return new RegExp(pattern, options?.onlyFirst ? undefined : 'g');
}

export default ansiRegex;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 ANSI Regex - Detect ANSI Codes (POLYGLOT!)\n");

  const text = '\x1b[31mRed text\x1b[0m and normal text';
  console.log("Input:", text);

  const regex = ansiRegex();
  console.log("Has ANSI:", regex.test(text));

  const stripped = text.replace(regex, '');
  console.log("Stripped:", stripped);

  console.log("\n🚀 ~20M+ downloads/week on npm!");
}
