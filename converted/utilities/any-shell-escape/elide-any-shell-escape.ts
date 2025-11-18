/**
 * Any Shell Escape - Universal Shell Escaping
 *
 * Universal shell escaping for any platform.
 * **POLYGLOT SHOWCASE**: Universal escaping for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/any-shell-escape (~50K+ downloads/week)
 *
 * Features:
 * - Universal shell escaping
 * - Windows/Unix support
 * - Auto-detect platform
 * - Safe argument handling
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function anyShellEscape(args: string[], platform?: string): string {
  const isWindows = platform === 'win32' || process.platform === 'win32';

  if (isWindows) {
    return args.map(arg => {
      if (!arg) return '""';
      if (!/[\s"]/.test(arg)) return arg;
      return '"' + arg.replace(/"/g, '""') + '"';
    }).join(' ');
  }

  return args.map(arg => {
    if (!arg) return "''";
    if (/^[a-zA-Z0-9_\-./]+$/.test(arg)) return arg;
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }).join(' ');
}

export default anyShellEscape;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 Any Shell Escape - Universal Escaping (POLYGLOT!)\n");
  console.log("Unix:", anyShellEscape(['echo', 'hello world'], 'linux'));
  console.log("Windows:", anyShellEscape(['echo', 'hello world'], 'win32'));
  console.log("\n🚀 ~50K+ downloads/week on npm!");
}
