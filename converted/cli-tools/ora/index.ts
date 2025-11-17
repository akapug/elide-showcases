/**
 * Ora for Elide
 *
 * An elegant terminal spinner for CLI applications.
 * This implementation provides full API compatibility with the original ora
 * while leveraging Elide's instant startup and optimized performance.
 *
 * @module @elide/ora
 */

import { WriteStream } from 'tty';
import * as readline from 'readline';

/**
 * Spinner animation frames
 */
export interface SpinnerDefinition {
  interval: number;
  frames: string[];
}

/**
 * Built-in spinner types
 */
export const spinners: Record<string, SpinnerDefinition> = {
  dots: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  },
  dots2: {
    interval: 80,
    frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']
  },
  dots3: {
    interval: 80,
    frames: ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓']
  },
  line: {
    interval: 130,
    frames: ['-', '\\', '|', '/']
  },
  line2: {
    interval: 100,
    frames: ['⠂', '-', '–', '—', '–', '-']
  },
  pipe: {
    interval: 100,
    frames: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐']
  },
  simpleDots: {
    interval: 400,
    frames: ['.  ', '.. ', '...', '   ']
  },
  simpleDotsScrolling: {
    interval: 200,
    frames: ['.  ', '.. ', '...', ' ..', '  .', '   ']
  },
  star: {
    interval: 70,
    frames: ['✶', '✸', '✹', '✺', '✹', '✷']
  },
  star2: {
    interval: 80,
    frames: ['+', 'x', '*']
  },
  flip: {
    interval: 70,
    frames: ['_', '_', '_', '-', '`', '`', "'", '´', '-', '_', '_', '_']
  },
  hamburger: {
    interval: 100,
    frames: ['☱', '☲', '☴']
  },
  growVertical: {
    interval: 120,
    frames: ['▁', '▃', '▄', '▅', '▆', '▇', '▆', '▅', '▄', '▃']
  },
  growHorizontal: {
    interval: 120,
    frames: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '▊', '▋', '▌', '▍', '▎']
  },
  balloon: {
    interval: 140,
    frames: [' ', '.', 'o', 'O', '@', '*', ' ']
  },
  balloon2: {
    interval: 120,
    frames: ['.', 'o', 'O', '°', 'O', 'o', '.']
  },
  noise: {
    interval: 100,
    frames: ['▓', '▒', '░']
  },
  bounce: {
    interval: 120,
    frames: ['⠁', '⠂', '⠄', '⠂']
  },
  boxBounce: {
    interval: 120,
    frames: ['▖', '▘', '▝', '▗']
  },
  boxBounce2: {
    interval: 100,
    frames: ['▌', '▀', '▐', '▄']
  },
  triangle: {
    interval: 50,
    frames: ['◢', '◣', '◤', '◥']
  },
  arc: {
    interval: 100,
    frames: ['◜', '◠', '◝', '◞', '◡', '◟']
  },
  circle: {
    interval: 120,
    frames: ['◡', '⊙', '◠']
  },
  squareCorners: {
    interval: 180,
    frames: ['◰', '◳', '◲', '◱']
  },
  circleQuarters: {
    interval: 120,
    frames: ['◴', '◷', '◶', '◵']
  },
  circleHalves: {
    interval: 50,
    frames: ['◐', '◓', '◑', '◒']
  },
  squish: {
    interval: 100,
    frames: ['╫', '╪']
  },
  toggle: {
    interval: 250,
    frames: ['⊶', '⊷']
  },
  toggle2: {
    interval: 80,
    frames: ['▫', '▪']
  },
  toggle3: {
    interval: 120,
    frames: ['□', '■']
  },
  toggle4: {
    interval: 100,
    frames: ['■', '□', '▪', '▫']
  },
  toggle5: {
    interval: 100,
    frames: ['▮', '▯']
  },
  toggle6: {
    interval: 300,
    frames: ['ဝ', '၀']
  },
  toggle7: {
    interval: 80,
    frames: ['⦾', '⦿']
  },
  toggle8: {
    interval: 100,
    frames: ['◍', '◌']
  },
  toggle9: {
    interval: 100,
    frames: ['◉', '◎']
  },
  toggle10: {
    interval: 100,
    frames: ['㊂', '㊀', '㊁']
  },
  toggle11: {
    interval: 50,
    frames: ['⧇', '⧆']
  },
  toggle12: {
    interval: 120,
    frames: ['☗', '☖']
  },
  toggle13: {
    interval: 80,
    frames: ['=', '*', '-']
  },
  arrow: {
    interval: 100,
    frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙']
  },
  arrow2: {
    interval: 80,
    frames: ['⬆️ ', '↗️ ', '➡️ ', '↘️ ', '⬇️ ', '↙️ ', '⬅️ ', '↖️ ']
  },
  arrow3: {
    interval: 120,
    frames: ['▹▹▹▹▹', '▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸']
  },
  bouncingBar: {
    interval: 80,
    frames: ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]', '[  ==]', '[   =]', '[    ]', '[   =]', '[  ==]', '[ ===]', '[====]', '[=== ]', '[==  ]', '[=   ]']
  },
  bouncingBall: {
    interval: 80,
    frames: ['( ●    )', '(  ●   )', '(   ●  )', '(    ● )', '(     ●)', '(    ● )', '(   ●  )', '(  ●   )', '( ●    )', '(●     )']
  },
  smiley: {
    interval: 200,
    frames: ['😄 ', '😝 ']
  },
  monkey: {
    interval: 300,
    frames: ['🙈 ', '🙈 ', '🙉 ', '🙊 ']
  },
  hearts: {
    interval: 100,
    frames: ['💛 ', '💙 ', '💜 ', '💚 ', '❤️ ']
  },
  clock: {
    interval: 100,
    frames: ['🕐 ', '🕑 ', '🕒 ', '🕓 ', '🕔 ', '🕕 ', '🕖 ', '🕗 ', '🕘 ', '🕙 ', '🕚 ']
  },
  earth: {
    interval: 180,
    frames: ['🌍 ', '🌎 ', '🌏 ']
  },
  moon: {
    interval: 80,
    frames: ['🌑 ', '🌒 ', '🌓 ', '🌔 ', '🌕 ', '🌖 ', '🌗 ', '🌘 ']
  },
  runner: {
    interval: 140,
    frames: ['🚶 ', '🏃 ']
  },
  pong: {
    interval: 80,
    frames: ['▐⠂       ▌', '▐⠈       ▌', '▐ ⠂      ▌', '▐ ⠠      ▌', '▐  ⡀     ▌', '▐  ⠠     ▌', '▐   ⠂    ▌', '▐   ⠈    ▌', '▐    ⠂   ▌', '▐    ⠠   ▌', '▐     ⡀  ▌', '▐     ⠠  ▌', '▐      ⠂ ▌', '▐      ⠈ ▌', '▐       ⠂▌', '▐       ⠠▌', '▐       ⡀▌', '▐      ⠠ ▌', '▐      ⠂ ▌', '▐     ⠈  ▌', '▐     ⠂  ▌', '▐    ⠠   ▌', '▐    ⡀   ▌', '▐   ⠠    ▌', '▐   ⠂    ▌', '▐  ⠈     ▌', '▐  ⠂     ▌', '▐ ⠠      ▌', '▐ ⡀      ▌', '▐⠠       ▌']
  },
  shark: {
    interval: 120,
    frames: ['▐|\\____________▌', '▐_|\\___________▌', '▐__|\\__________▌', '▐___|\\_________▌', '▐____|\\________▌', '▐_____|\\_______▌', '▐______|\\______▌', '▐_______|\\_____▌', '▐________|\\____▌', '▐_________|\\___▌', '▐__________|\\__▌', '▐___________|\\_▌', '▐____________|\\▌', '▐____________/|▌', '▐___________/|_▌', '▐__________/|__▌', '▐_________/|___▌', '▐________/|____▌', '▐_______/|_____▌', '▐______/|______▌', '▐_____/|_______▌', '▐____/|________▌', '▐___/|_________▌', '▐__/|__________▌', '▐_/|___________▌', '▐/|____________▌']
  },
  dqpb: {
    interval: 100,
    frames: ['d', 'q', 'p', 'b']
  },
  weather: {
    interval: 100,
    frames: ['☀️ ', '☀️ ', '☀️ ', '🌤 ', '⛅️ ', '🌥 ', '☁️ ', '🌧 ', '🌨 ', '🌧 ', '🌨 ', '🌨 ', '⛈ ', '🌨 ', '🌧 ', '🌨 ', '☁️ ', '🌥 ', '⛅️ ', '🌤 ', '☀️ ', '☀️ ']
  },
  christmas: {
    interval: 400,
    frames: ['🌲', '🎄']
  }
};

/**
 * Terminal colors
 */
const colors = {
  black: '\u001B[30m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  blue: '\u001B[34m',
  magenta: '\u001B[35m',
  cyan: '\u001B[36m',
  white: '\u001B[37m',
  gray: '\u001B[90m',
  reset: '\u001B[0m'
};

/**
 * Symbol types
 */
const symbols = {
  success: '✔',
  fail: '✖',
  warning: '⚠',
  info: 'ℹ'
};

/**
 * Ora options
 */
export interface OraOptions {
  text?: string;
  spinner?: string | SpinnerDefinition;
  color?: keyof typeof colors;
  hideCursor?: boolean;
  indent?: number;
  interval?: number;
  stream?: NodeJS.WriteStream;
  isEnabled?: boolean;
  isSilent?: boolean;
  discardStdin?: boolean;
  prefixText?: string;
}

/**
 * Ora instance
 */
export class Ora {
  private _text: string;
  private _spinner: SpinnerDefinition;
  private _color: keyof typeof colors;
  private _indent: number;
  private _stream: NodeJS.WriteStream;
  private _isEnabled: boolean;
  private _isSilent: boolean;
  private _hideCursor: boolean;
  private _interval?: NodeJS.Timeout;
  private _frameIndex: number = 0;
  private _isSpinning: boolean = false;
  private _linesToClear: number = 0;
  private _prefixText: string;

  constructor(options: string | OraOptions = {}) {
    const opts = typeof options === 'string' ? { text: options } : options;

    this._text = opts.text || '';
    this._color = opts.color || 'cyan';
    this._indent = opts.indent || 0;
    this._stream = opts.stream || process.stderr;
    this._isSilent = opts.isSilent || false;
    this._hideCursor = opts.hideCursor !== false;
    this._prefixText = opts.prefixText || '';

    // Determine if terminal supports spinners
    this._isEnabled = opts.isEnabled !== undefined
      ? opts.isEnabled
      : this._stream && typeof this._stream === 'object' && 'isTTY' in this._stream && this._stream.isTTY === true;

    // Set spinner
    if (typeof opts.spinner === 'string') {
      this._spinner = spinners[opts.spinner] || spinners.dots;
    } else if (opts.spinner) {
      this._spinner = opts.spinner;
    } else {
      this._spinner = spinners.dots;
    }
  }

  /**
   * Get current text
   */
  get text(): string {
    return this._text;
  }

  /**
   * Set spinner text
   */
  set text(value: string) {
    this._text = value;
    if (this._isSpinning) {
      this._render();
    }
  }

  /**
   * Get current color
   */
  get color(): keyof typeof colors {
    return this._color;
  }

  /**
   * Set spinner color
   */
  set color(value: keyof typeof colors) {
    this._color = value;
  }

  /**
   * Get current spinner
   */
  get spinner(): SpinnerDefinition {
    return this._spinner;
  }

  /**
   * Set spinner animation
   */
  set spinner(value: string | SpinnerDefinition) {
    if (typeof value === 'string') {
      this._spinner = spinners[value] || spinners.dots;
    } else {
      this._spinner = value;
    }

    if (this._isSpinning) {
      this._frameIndex = 0;
      this._restart();
    }
  }

  /**
   * Check if spinner is active
   */
  get isSpinning(): boolean {
    return this._isSpinning;
  }

  /**
   * Get indent level
   */
  get indent(): number {
    return this._indent;
  }

  /**
   * Set indent level
   */
  set indent(value: number) {
    this._indent = value;
  }

  /**
   * Start the spinner
   */
  start(text?: string): this {
    if (text) {
      this._text = text;
    }

    if (this._isSilent || !this._isEnabled) {
      return this;
    }

    if (this._isSpinning) {
      return this;
    }

    if (this._hideCursor) {
      this._stream.write('\u001B[?25l'); // Hide cursor
    }

    this._isSpinning = true;
    this._render();

    this._interval = setInterval(() => {
      this._frameIndex = (this._frameIndex + 1) % this._spinner.frames.length;
      this._render();
    }, this._spinner.interval);

    return this;
  }

  /**
   * Stop the spinner
   */
  stop(): this {
    if (!this._isSpinning) {
      return this;
    }

    if (this._interval) {
      clearInterval(this._interval);
      this._interval = undefined;
    }

    this._isSpinning = false;
    this._frameIndex = 0;

    if (!this._isSilent && this._isEnabled) {
      this._clear();

      if (this._hideCursor) {
        this._stream.write('\u001B[?25h'); // Show cursor
      }
    }

    return this;
  }

  /**
   * Stop with success symbol
   */
  succeed(text?: string): this {
    return this.stopAndPersist({ symbol: colors.green + symbols.success + colors.reset, text });
  }

  /**
   * Stop with failure symbol
   */
  fail(text?: string): this {
    return this.stopAndPersist({ symbol: colors.red + symbols.fail + colors.reset, text });
  }

  /**
   * Stop with warning symbol
   */
  warn(text?: string): this {
    return this.stopAndPersist({ symbol: colors.yellow + symbols.warning + colors.reset, text });
  }

  /**
   * Stop with info symbol
   */
  info(text?: string): this {
    return this.stopAndPersist({ symbol: colors.blue + symbols.info + colors.reset, text });
  }

  /**
   * Stop and persist with custom options
   */
  stopAndPersist(options: { symbol?: string; text?: string } = {}): this {
    if (!this._isSpinning && !options.symbol && !options.text) {
      return this;
    }

    this.stop();

    if (!this._isSilent && this._isEnabled) {
      const symbol = options.symbol || ' ';
      const text = options.text || this._text;
      const indent = ' '.repeat(this._indent);
      const prefix = this._prefixText ? this._prefixText + ' ' : '';

      this._stream.write(`${indent}${prefix}${symbol} ${text}\n`);
    }

    return this;
  }

  /**
   * Clear the spinner
   */
  clear(): this {
    if (!this._isSpinning && !this._linesToClear) {
      return this;
    }

    this._clear();
    return this;
  }

  /**
   * Get current frame
   */
  frame(): string {
    return this._spinner.frames[this._frameIndex];
  }

  /**
   * Render current frame
   */
  private _render(): void {
    if (this._isSilent || !this._isEnabled) {
      return;
    }

    this._clear();

    const frame = this._spinner.frames[this._frameIndex];
    const colorCode = colors[this._color] || '';
    const indent = ' '.repeat(this._indent);
    const prefix = this._prefixText ? this._prefixText + ' ' : '';

    const output = `${indent}${prefix}${colorCode}${frame}${colors.reset} ${this._text}`;

    this._stream.write(output);
    this._linesToClear = 1;
  }

  /**
   * Clear current line
   */
  private _clear(): void {
    if (!this._isEnabled || this._linesToClear === 0) {
      return;
    }

    for (let i = 0; i < this._linesToClear; i++) {
      if (i > 0) {
        this._stream.write('\u001B[1A'); // Move up
      }
      this._stream.write('\u001B[2K'); // Clear line
      this._stream.write('\u001B[0G'); // Move to column 0
    }

    this._linesToClear = 0;
  }

  /**
   * Restart the spinner with new interval
   */
  private _restart(): void {
    if (!this._isSpinning) {
      return;
    }

    if (this._interval) {
      clearInterval(this._interval);
    }

    this._interval = setInterval(() => {
      this._frameIndex = (this._frameIndex + 1) % this._spinner.frames.length;
      this._render();
    }, this._spinner.interval);
  }
}

/**
 * Create a new ora instance
 */
export default function ora(options?: string | OraOptions): Ora {
  return new Ora(options);
}

// Named exports
export { ora, spinners, colors, symbols };
