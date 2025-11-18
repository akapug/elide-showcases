/**
 * Progress-Stream - Stream Progress Tracking
 *
 * Core features:
 * - Stream progress monitoring
 * - Bytes transferred tracking
 * - Time estimation
 * - Speed calculation
 * - Progress events
 * - Percentage calculation
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 5M+ downloads/week
 */

interface ProgressOptions {
  length?: number;
  time?: number;
  transferred?: number;
  drain?: boolean;
}

interface ProgressData {
  percentage: number;
  transferred: number;
  length: number;
  remaining: number;
  eta: number;
  runtime: number;
  delta: number;
  speed: number;
}

export class ProgressStream {
  private transferred: number = 0;
  private length: number;
  private startTime: number = Date.now();
  private lastUpdate: number = 0;
  private lastTransferred: number = 0;
  private callbacks: ((progress: ProgressData) => void)[] = [];

  constructor(options: ProgressOptions = {}) {
    this.length = options.length || 0;
    this.transferred = options.transferred || 0;
  }

  setLength(length: number): this {
    this.length = length;
    return this;
  }

  update(bytes: number): void {
    this.transferred += bytes;
    this.emit();
  }

  setTransferred(transferred: number): void {
    this.transferred = transferred;
    this.emit();
  }

  progress(callback: (progress: ProgressData) => void): this {
    this.callbacks.push(callback);
    return this;
  }

  private emit(): void {
    const now = Date.now();
    const runtime = now - this.startTime;
    const delta = now - this.lastUpdate;
    const deltaTransferred = this.transferred - this.lastTransferred;

    const percentage = this.length > 0 ? (this.transferred / this.length) * 100 : 0;
    const remaining = Math.max(0, this.length - this.transferred);
    const speed = delta > 0 ? (deltaTransferred / delta) * 1000 : 0; // bytes per second
    const eta = speed > 0 ? remaining / speed : 0;

    const data: ProgressData = {
      percentage,
      transferred: this.transferred,
      length: this.length,
      remaining,
      eta,
      runtime,
      delta,
      speed
    };

    this.lastUpdate = now;
    this.lastTransferred = this.transferred;

    for (const callback of this.callbacks) {
      callback(data);
    }
  }

  reset(): void {
    this.transferred = 0;
    this.startTime = Date.now();
    this.lastUpdate = 0;
    this.lastTransferred = 0;
  }
}

export function createProgressStream(options?: ProgressOptions): ProgressStream {
  return new ProgressStream(options);
}

// Helper to format bytes
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Helper to format time
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

if (import.meta.url.includes("progress-stream")) {
  console.log("🎯 Progress-Stream for Elide - Stream Progress Tracking\n");

  console.log("=== File Download Simulation ===");
  const fileSize = 10 * 1024 * 1024; // 10 MB
  const progress = new ProgressStream({ length: fileSize });

  progress.progress((data) => {
    console.log(
      `Progress: ${data.percentage.toFixed(1)}% | ` +
      `${formatBytes(data.transferred)} / ${formatBytes(data.length)} | ` +
      `Speed: ${formatBytes(data.speed)}/s | ` +
      `ETA: ${formatTime(data.eta)}`
    );
  });

  // Simulate download chunks
  const chunkSize = 1024 * 1024; // 1 MB chunks
  for (let i = 0; i < 10; i++) {
    progress.update(chunkSize);
  }

  console.log("\n=== Stream Processing ===");
  const stream = new ProgressStream({ length: 1000 });

  let updates = 0;
  stream.progress((data) => {
    updates++;
    if (updates % 20 === 0) {
      console.log(`Processed: ${data.percentage.toFixed(0)}% (${data.transferred}/${data.length})`);
    }
  });

  for (let i = 0; i < 100; i++) {
    stream.update(10);
  }

  console.log();
  console.log("✅ Use Cases: File uploads/downloads, Data processing, Stream monitoring");
  console.log("🚀 5M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default ProgressStream;
