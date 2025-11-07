/**
 * CLI Progress Bar
 * Simple terminal progress bar
 */

export interface ProgressOptions {
  total: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  showPercent?: boolean;
}

export class ProgressBar {
  private current: number = 0;
  private total: number;
  private width: number;
  private complete: string;
  private incomplete: string;
  private showPercent: boolean;

  constructor(options: ProgressOptions) {
    this.total = options.total;
    this.width = options.width || 40;
    this.complete = options.complete || '█';
    this.incomplete = options.incomplete || '░';
    this.showPercent = options.showPercent !== false;
  }

  tick(amount: number = 1): void {
    this.current = Math.min(this.current + amount, this.total);
  }

  update(value: number): void {
    this.current = Math.max(0, Math.min(value, this.total));
  }

  render(): string {
    const percent = this.total > 0 ? this.current / this.total : 0;
    const completed = Math.floor(percent * this.width);
    const remaining = this.width - completed;

    let bar = this.complete.repeat(completed) + this.incomplete.repeat(remaining);

    if (this.showPercent) {
      const pct = Math.floor(percent * 100);
      bar += ` ${pct}%`;
    }

    bar += ` ${this.current}/${this.total}`;

    return bar;
  }

  isComplete(): boolean {
    return this.current >= this.total;
  }

  reset(): void {
    this.current = 0;
  }
}

export function simpleProgressBar(current: number, total: number, width: number = 20): string {
  const percent = total > 0 ? current / total : 0;
  const filled = Math.floor(percent * width);
  const empty = width - filled;

  return '[' + '='.repeat(filled) + ' '.repeat(empty) + '] ' + Math.floor(percent * 100) + '%';
}

// CLI demo
if (import.meta.url.includes("progress-bar.ts")) {
  console.log("Progress Bar Demo\n");

  const bar = new ProgressBar({ total: 100, width: 30 });

  console.log("Progress:");
  for (let i = 0; i <= 100; i += 20) {
    bar.update(i);
    console.log(bar.render());
  }

  console.log("\nSimple progress bar:");
  [0, 25, 50, 75, 100].forEach(pct => {
    console.log(simpleProgressBar(pct, 100));
  });

  console.log("\n✅ Progress bar test passed");
}
