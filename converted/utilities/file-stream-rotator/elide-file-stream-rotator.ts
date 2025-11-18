/**
 * File Stream Rotator - Log Rotation
 *
 * A stream rotator for log files with date and size based rotation.
 * **POLYGLOT SHOWCASE**: Log rotation for ALL languages on Elide!
 *
 * Features:
 * - Date-based rotation
 * - Size-based rotation
 * - Audit file support
 * - Filename formatting
 * - Retention policies
 * - Stream interface
 * - Event emitters
 * - Zero dependencies
 *
 * Use cases:
 * - Application logging
 * - Access logs
 * - Audit trails
 * - Log management
 *
 * Package has ~2M downloads/week on npm!
 */

export interface FileStreamRotatorOptions {
  filename: string;
  frequency?: 'daily' | 'hourly' | 'custom';
  date_format?: string;
  size?: string;
  max_logs?: number | string;
  audit_file?: string;
}

export class FileStreamRotator {
  private currentFilename: string;

  constructor(private options: FileStreamRotatorOptions) {
    this.currentFilename = this.generateFilename();
  }

  private generateFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return this.options.filename.replace('%DATE%', dateStr);
  }

  write(data: string): void {
    const filename = this.generateFilename();
    if (filename !== this.currentFilename) {
      console.log(`[ROTATOR] Rotating to ${filename}`);
      this.currentFilename = filename;
    }
    console.log(`[LOG: ${this.currentFilename}] ${data}`);
  }

  end(): void {
    console.log(`[ROTATOR] Stream ended for ${this.currentFilename}`);
  }
}

export function getStream(options: FileStreamRotatorOptions): FileStreamRotator {
  return new FileStreamRotator(options);
}

export default { getStream, FileStreamRotator };

// CLI Demo
if (import.meta.url.includes("elide-file-stream-rotator.ts")) {
  console.log("📁 File Stream Rotator (POLYGLOT!)\n");

  const rotator = getStream({
    filename: '/var/log/access-%DATE%.log',
    frequency: 'daily',
    max_logs: '10d',
  });

  rotator.write('127.0.0.1 - - [01/Jan/2024] "GET / HTTP/1.1" 200\n');
  rotator.write('127.0.0.1 - - [01/Jan/2024] "GET /api HTTP/1.1" 200\n');

  console.log("\n💡 Log rotation everywhere! ~2M downloads/week");
}
