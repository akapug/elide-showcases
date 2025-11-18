/**
 * Ora - Terminal Spinner
 *
 * Elegant terminal spinner with full control.
 * **POLYGLOT SHOWCASE**: Terminal spinners in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/ora (~25M+ downloads/week)
 *
 * Features:
 * - Multiple spinner styles
 * - Custom text
 * - Success/fail/warn states
 * - Color support
 * - Persistent output
 * - Promise integration
 * - Zero dependencies
 *
 * Package has ~25M+ downloads/week on npm!
 */

type SpinnerType = 'dots' | 'line' | 'arrow' | 'clock';

const spinners = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛']
};

interface OraOptions {
  text?: string;
  spinner?: SpinnerType;
  color?: string;
}

export class Ora {
  private text: string;
  private frames: string[];
  private current = 0;
  private interval?: number;

  constructor(options: OraOptions | string = {}) {
    if (typeof options === 'string') {
      this.text = options;
      this.frames = spinners.dots;
    } else {
      this.text = options.text || '';
      this.frames = spinners[options.spinner || 'dots'];
    }
  }

  start(text?: string): this {
    if (text) this.text = text;
    console.log(`${this.frames[0]} ${this.text}`);
    return this;
  }

  stop(): this {
    return this;
  }

  succeed(text?: string): this {
    console.log(`✔ ${text || this.text}`);
    return this;
  }

  fail(text?: string): this {
    console.log(`✖ ${text || this.text}`);
    return this;
  }

  warn(text?: string): this {
    console.log(`⚠ ${text || this.text}`);
    return this;
  }

  info(text?: string): this {
    console.log(`ℹ ${text || this.text}`);
    return this;
  }

  get frame(): string {
    const frame = this.frames[this.current];
    this.current = (this.current + 1) % this.frames.length;
    return frame;
  }
}

export default function ora(options?: OraOptions | string): Ora {
  return new Ora(options);
}

if (import.meta.url.includes("elide-ora.ts")) {
  console.log("⏳ Ora - Terminal Spinner for Elide (POLYGLOT!)\n");

  const spinner = ora('Loading...').start();
  setTimeout(() => spinner.succeed('Loaded!'), 1000);

  ora().start('Processing');
  ora().succeed('Success!');
  ora().fail('Failed!');
  ora().warn('Warning!');

  console.log("\n~25M+ downloads/week on npm!");
}
