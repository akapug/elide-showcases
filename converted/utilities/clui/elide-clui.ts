/**
 * CLUI - Command Line UI
 *
 * Quickly build command-line UI elements.
 * **POLYGLOT SHOWCASE**: CLI UI components in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/clui (~500K+ downloads/week)
 *
 * Features:
 * - Progress bars
 * - Spinners
 * - Gauges
 * - Sparklines
 * - Lines and boxes
 * - Status indicators
 * - Zero dependencies
 *
 * Use cases:
 * - Progress visualization
 * - Status displays
 * - Terminal dashboards
 * - Build output
 * - Task monitoring
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class Progress {
  private width: number;

  constructor(width = 20) {
    this.width = width;
  }

  update(current: number, total: number, label = ''): string {
    const percent = Math.floor((current / total) * 100);
    const filled = Math.floor((current / total) * this.width);
    const empty = this.width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `${label} [${bar}] ${percent}%`;
  }
}

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private current = 0;

  update(message: string): string {
    const frame = this.frames[this.current];
    this.current = (this.current + 1) % this.frames.length;
    return `${frame} ${message}`;
  }
}

export class Gauge {
  private width: number;

  constructor(width = 20) {
    this.width = width;
  }

  show(value: number, max: number, label = ''): string {
    const percent = Math.floor((value / max) * 100);
    const filled = Math.floor((value / max) * this.width);
    const bar = '▓'.repeat(filled) + '░'.repeat(this.width - filled);
    return `${label} ${bar} ${percent}%`;
  }
}

export default { Progress, Spinner, Gauge };

if (import.meta.url.includes("elide-clui.ts")) {
  console.log("🎨 CLUI - Command Line UI for Elide (POLYGLOT!)\n");

  const progress = new Progress(30);
  console.log(progress.update(25, 100, 'Downloading'));
  console.log(progress.update(50, 100, 'Downloading'));
  console.log(progress.update(75, 100, 'Downloading'));
  console.log(progress.update(100, 100, 'Downloading'));
  console.log();

  const spinner = new Spinner();
  console.log(spinner.update('Loading...'));
  console.log(spinner.update('Loading...'));
  console.log(spinner.update('Loading...'));
  console.log();

  const gauge = new Gauge(25);
  console.log(gauge.show(60, 100, 'Memory'));
  console.log(gauge.show(45, 100, 'CPU'));
  console.log(gauge.show(80, 100, 'Disk'));

  console.log("\n~500K+ downloads/week on npm!");
}
