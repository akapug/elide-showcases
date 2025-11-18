/**
 * Terminal Link - Clickable Terminal Links
 *
 * Create clickable links in terminal output.
 * **POLYGLOT SHOWCASE**: Terminal links for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/terminal-link (~1M+ downloads/week)
 *
 * Features:
 * - Clickable terminal links
 * - Fallback support
 * - Auto-detection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~1M+ downloads/week on npm!
 */

const supportsHyperlinks = (): boolean => {
  return !!(
    process.env.FORCE_HYPERLINK ||
    (process.env.TERM_PROGRAM === 'iTerm.app') ||
    (process.env.TERM_PROGRAM === 'WezTerm') ||
    (process.env.VTE_VERSION && parseInt(process.env.VTE_VERSION) >= 5000)
  );
};

export function terminalLink(text: string, url: string, options?: { fallback?: boolean }): string {
  if (supportsHyperlinks()) {
    return `\x1B]8;;${url}\x07${text}\x1B]8;;\x07`;
  }

  if (options?.fallback !== false) {
    return `${text} (${url})`;
  }

  return text;
}

export default terminalLink;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔗 Terminal Link - Clickable Links (POLYGLOT!)\n");

  console.log("Example links:");
  console.log(terminalLink('Elide', 'https://elide.dev'));
  console.log(terminalLink('GitHub', 'https://github.com'));
  console.log(terminalLink('npm', 'https://npmjs.com'));

  console.log("\n🚀 ~1M+ downloads/week on npm!");
}
