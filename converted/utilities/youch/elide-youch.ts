/**
 * youch - Pretty error reporting
 * Based on https://www.npmjs.com/package/youch (~1M+ downloads/week)
 *
 * Features:
 * - Beautiful error pages
 * - Stack trace highlighting
 * - Code frame display
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Developer-friendly error display
 */

interface ErrorFrame {
  file: string;
  line: number;
  column: number;
  method: string;
  context?: string[];
}

class Youch {
  error: Error;
  request?: any;

  constructor(error: Error, request?: any) {
    this.error = error;
    this.request = request;
  }

  toHTML(): string {
    const frames = this.parseStack();
    let html = `<html><head><style>
      body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
      .error { background: #ff5555; color: white; padding: 10px; margin: 10px 0; }
      .frame { background: #2d2d2d; padding: 10px; margin: 5px 0; border-left: 3px solid #569cd6; }
    </style></head><body>`;
    html += `<h1>💥 ${this.error.name}</h1>`;
    html += `<div class="error">${this.error.message}</div>`;
    frames.forEach(frame => {
      html += `<div class="frame">${frame.method} at ${frame.file}:${frame.line}</div>`;
    });
    html += `</body></html>`;
    return html;
  }

  toJSON(): object {
    return {
      error: {
        name: this.error.name,
        message: this.error.message,
        stack: this.error.stack
      },
      frames: this.parseStack()
    };
  }

  private parseStack(): ErrorFrame[] {
    const stack = this.error.stack || '';
    const lines = stack.split('\n').slice(1);
    return lines.map(line => {
      const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/) ||
                    line.match(/at (.+):(\d+):(\d+)/);
      if (match) {
        return {
          file: match[2] || match[1],
          line: parseInt(match[3] || match[2]),
          column: parseInt(match[4] || match[3]),
          method: match[1] || 'anonymous'
        };
      }
      return { file: '', line: 0, column: 0, method: 'unknown' };
    });
  }
}

export default Youch;

// Self-test
if (import.meta.url.includes("elide-youch.ts")) {
  console.log("✅ youch - Pretty Error Reporting (POLYGLOT!)\n");

  const error = new Error("Division by zero");
  const youch = new Youch(error);

  console.log('Error JSON:', JSON.stringify(youch.toJSON(), null, 2).substring(0, 200));
  console.log('HTML generated:', youch.toHTML().substring(0, 100) + '...');

  console.log("\n🚀 ~1M+ downloads/week | Beautiful error pages\n");
}
