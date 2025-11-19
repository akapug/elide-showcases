/**
 * Elide CLI Builder - UI Components
 *
 * Progress bars, spinners, prompts, and styled output for CLI tools.
 */

import { NativeBridge } from '../runtime/bridge';

// Colors

export enum Color {
  Reset = '\x1b[0m',
  Bright = '\x1b[1m',
  Dim = '\x1b[2m',
  Underscore = '\x1b[4m',
  Blink = '\x1b[5m',
  Reverse = '\x1b[7m',
  Hidden = '\x1b[8m',

  Black = '\x1b[30m',
  Red = '\x1b[31m',
  Green = '\x1b[32m',
  Yellow = '\x1b[33m',
  Blue = '\x1b[34m',
  Magenta = '\x1b[35m',
  Cyan = '\x1b[36m',
  White = '\x1b[37m',

  BgBlack = '\x1b[40m',
  BgRed = '\x1b[41m',
  BgGreen = '\x1b[42m',
  BgYellow = '\x1b[43m',
  BgBlue = '\x1b[44m',
  BgMagenta = '\x1b[45m',
  BgCyan = '\x1b[46m',
  BgWhite = '\x1b[47m',
}

export class StyledText {
  static colorize(text: string, color: Color): string {
    return `${color}${text}${Color.Reset}`;
  }

  static bold(text: string): string {
    return `${Color.Bright}${text}${Color.Reset}`;
  }

  static dim(text: string): string {
    return `${Color.Dim}${text}${Color.Reset}`;
  }

  static underline(text: string): string {
    return `${Color.Underscore}${text}${Color.Reset}`;
  }

  static red(text: string): string {
    return this.colorize(text, Color.Red);
  }

  static green(text: string): string {
    return this.colorize(text, Color.Green);
  }

  static yellow(text: string): string {
    return this.colorize(text, Color.Yellow);
  }

  static blue(text: string): string {
    return this.colorize(text, Color.Blue);
  }

  static magenta(text: string): string {
    return this.colorize(text, Color.Magenta);
  }

  static cyan(text: string): string {
    return this.colorize(text, Color.Cyan);
  }

  static white(text: string): string {
    return this.colorize(text, Color.White);
  }

  static success(text: string): string {
    return `${Color.Green}✓${Color.Reset} ${text}`;
  }

  static error(text: string): string {
    return `${Color.Red}✗${Color.Reset} ${text}`;
  }

  static warning(text: string): string {
    return `${Color.Yellow}⚠${Color.Reset} ${text}`;
  }

  static info(text: string): string {
    return `${Color.Blue}ℹ${Color.Reset} ${text}`;
  }
}

// Progress Bar

export interface ProgressBarOptions {
  total: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  showValue?: boolean;
  showPercentage?: boolean;
}

export class ProgressBar {
  private current: number = 0;
  private total: number;
  private width: number;
  private complete: string;
  private incomplete: string;
  private showValue: boolean;
  private showPercentage: boolean;
  private startTime: number;

  constructor(options: ProgressBarOptions) {
    this.total = options.total;
    this.width = options.width || 40;
    this.complete = options.complete || '█';
    this.incomplete = options.incomplete || '░';
    this.showValue = options.showValue !== false;
    this.showPercentage = options.showPercentage !== false;
    this.startTime = Date.now();
  }

  tick(amount: number = 1): void {
    this.current = Math.min(this.current + amount, this.total);
    this.render();
  }

  update(value: number): void {
    this.current = Math.min(value, this.total);
    this.render();
  }

  private render(): void {
    const percentage = this.current / this.total;
    const completeWidth = Math.floor(this.width * percentage);
    const incompleteWidth = this.width - completeWidth;

    const bar = this.complete.repeat(completeWidth) + this.incomplete.repeat(incompleteWidth);

    let output = `[${bar}]`;

    if (this.showPercentage) {
      output += ` ${Math.floor(percentage * 100)}%`;
    }

    if (this.showValue) {
      output += ` ${this.current}/${this.total}`;
    }

    // Calculate ETA
    if (this.current > 0 && this.current < this.total) {
      const elapsed = Date.now() - this.startTime;
      const rate = this.current / elapsed;
      const remaining = this.total - this.current;
      const eta = remaining / rate;

      output += ` ETA: ${this.formatTime(eta)}`;
    }

    process.stdout.write(`\r${output}`);

    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Spinner

export class Spinner {
  private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private message: string;
  private interval?: NodeJS.Timeout;
  private currentFrame: number = 0;

  constructor(message: string = 'Loading...') {
    this.message = message;
  }

  start(): void {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  setMessage(message: string): void {
    this.message = message;
  }

  succeed(message?: string): void {
    this.stop();
    console.log(StyledText.success(message || this.message));
  }

  fail(message?: string): void {
    this.stop();
    console.log(StyledText.error(message || this.message));
  }

  warn(message?: string): void {
    this.stop();
    console.log(StyledText.warning(message || this.message));
  }

  info(message?: string): void {
    this.stop();
    console.log(StyledText.info(message || this.message));
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
      process.stdout.write('\r' + ' '.repeat(this.message.length + 3) + '\r');
    }
  }
}

// Prompts

export class Prompt {
  static async text(question: string, defaultValue?: string): Promise<string> {
    return NativeBridge.promptText(question, defaultValue);
  }

  static async confirm(question: string, defaultValue: boolean = false): Promise<boolean> {
    return NativeBridge.promptConfirm(question, defaultValue);
  }

  static async select<T>(question: string, choices: T[]): Promise<T> {
    return NativeBridge.promptSelect(question, choices);
  }

  static async multiSelect<T>(question: string, choices: T[]): Promise<T[]> {
    return NativeBridge.promptMultiSelect(question, choices);
  }

  static async password(question: string): Promise<string> {
    return NativeBridge.promptPassword(question);
  }

  static async number(question: string, defaultValue?: number): Promise<number> {
    return NativeBridge.promptNumber(question, defaultValue);
  }
}

// Tables

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export class Table {
  private columns: TableColumn[];
  private rows: any[] = [];

  constructor(columns: TableColumn[]) {
    this.columns = columns;
  }

  addRow(row: any): void {
    this.rows.push(row);
  }

  addRows(rows: any[]): void {
    this.rows.push(...rows);
  }

  render(): void {
    // Calculate column widths
    const widths = this.columns.map((col, i) => {
      const headerWidth = col.header.length;
      const maxDataWidth = Math.max(
        ...this.rows.map(row => String(row[col.key] || '').length)
      );
      return col.width || Math.max(headerWidth, maxDataWidth);
    });

    // Render header
    const header = this.columns.map((col, i) =>
      this.alignText(col.header, widths[i], col.align || 'left')
    ).join(' │ ');

    console.log(header);
    console.log(widths.map(w => '─'.repeat(w)).join('─┼─'));

    // Render rows
    for (const row of this.rows) {
      const rowText = this.columns.map((col, i) =>
        this.alignText(String(row[col.key] || ''), widths[i], col.align || 'left')
      ).join(' │ ');
      console.log(rowText);
    }
  }

  private alignText(text: string, width: number, align: 'left' | 'center' | 'right'): string {
    if (text.length >= width) {
      return text.substring(0, width);
    }

    const padding = width - text.length;

    switch (align) {
      case 'center':
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
      case 'right':
        return ' '.repeat(padding) + text;
      default:
        return text + ' '.repeat(padding);
    }
  }
}

// Boxes

export class Box {
  static single(content: string, title?: string): string {
    const lines = content.split('\n');
    const maxWidth = Math.max(...lines.map(l => l.length));

    let box = '┌' + '─'.repeat(maxWidth + 2) + '┐\n';

    if (title) {
      const titlePadding = maxWidth - title.length;
      const leftPad = Math.floor(titlePadding / 2);
      const rightPad = titlePadding - leftPad;
      box += '│ ' + ' '.repeat(leftPad) + title + ' '.repeat(rightPad) + ' │\n';
      box += '├' + '─'.repeat(maxWidth + 2) + '┤\n';
    }

    for (const line of lines) {
      box += '│ ' + line.padEnd(maxWidth) + ' │\n';
    }

    box += '└' + '─'.repeat(maxWidth + 2) + '┘';

    return box;
  }

  static double(content: string, title?: string): string {
    const lines = content.split('\n');
    const maxWidth = Math.max(...lines.map(l => l.length));

    let box = '╔' + '═'.repeat(maxWidth + 2) + '╗\n';

    if (title) {
      const titlePadding = maxWidth - title.length;
      const leftPad = Math.floor(titlePadding / 2);
      const rightPad = titlePadding - leftPad;
      box += '║ ' + ' '.repeat(leftPad) + title + ' '.repeat(rightPad) + ' ║\n';
      box += '╠' + '═'.repeat(maxWidth + 2) + '╣\n';
    }

    for (const line of lines) {
      box += '║ ' + line.padEnd(maxWidth) + ' ║\n';
    }

    box += '╚' + '═'.repeat(maxWidth + 2) + '╝';

    return box;
  }

  static rounded(content: string, title?: string): string {
    const lines = content.split('\n');
    const maxWidth = Math.max(...lines.map(l => l.length));

    let box = '╭' + '─'.repeat(maxWidth + 2) + '╮\n';

    if (title) {
      const titlePadding = maxWidth - title.length;
      const leftPad = Math.floor(titlePadding / 2);
      const rightPad = titlePadding - leftPad;
      box += '│ ' + ' '.repeat(leftPad) + title + ' '.repeat(rightPad) + ' │\n';
      box += '├' + '─'.repeat(maxWidth + 2) + '┤\n';
    }

    for (const line of lines) {
      box += '│ ' + line.padEnd(maxWidth) + ' │\n';
    }

    box += '╰' + '─'.repeat(maxWidth + 2) + '╯';

    return box;
  }
}

// Logger

export class Logger {
  static log(message: string): void {
    console.log(message);
  }

  static success(message: string): void {
    console.log(StyledText.success(message));
  }

  static error(message: string): void {
    console.error(StyledText.error(message));
  }

  static warning(message: string): void {
    console.warn(StyledText.warning(message));
  }

  static info(message: string): void {
    console.log(StyledText.info(message));
  }

  static debug(message: string): void {
    console.log(StyledText.dim(message));
  }
}
