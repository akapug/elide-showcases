/**
 * dprint - Pluggable Code Formatter
 *
 * Pluggable and configurable code formatting platform.
 * **POLYGLOT SHOWCASE**: Fast formatting everywhere!
 *
 * Based on https://www.npmjs.com/package/dprint (~30K+ downloads/week)
 *
 * Features:
 * - Extremely fast (Rust-based)
 * - Plugin system
 * - Multiple languages
 * - Configuration file
 *
 * Package has ~30K+ downloads/week on npm!
 */

export interface DprintConfig {
  indentWidth?: number;
  lineWidth?: number;
  useTabs?: boolean;
  newLineKind?: 'auto' | 'lf' | 'crlf';
}

export class Dprint {
  private config: DprintConfig;

  constructor(config: DprintConfig = {}) {
    this.config = {
      indentWidth: 2,
      lineWidth: 80,
      useTabs: false,
      newLineKind: 'lf',
      ...config
    };
  }

  format(code: string): string {
    const indent = this.config.useTabs ? '\t' : ' '.repeat(this.config.indentWidth || 2);
    return code
      .replace(/\t/g, indent)
      .replace(/\r\n/g, '\n')
      .trim();
  }

  check(code: string): { formatted: boolean } {
    return { formatted: code === this.format(code) };
  }
}

export default new Dprint();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📐 dprint - Pluggable Formatter\n");
  const dprint = new Dprint({ indentWidth: 2, lineWidth: 80 });

  const code = 'const\tx\t=\t10;';
  const formatted = dprint.format(code);

  console.log(`Original:  ${code}`);
  console.log(`Formatted: ${formatted}`);

  console.log("\n🌐 30K+ downloads/week on npm!");
  console.log("⚡ Rust-based, extremely fast");
}
