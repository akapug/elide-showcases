/**
 * Error Overlay
 *
 * Beautiful error display with source maps, stack traces, and click-to-file support.
 * Provides a developer-friendly interface for debugging build and runtime errors.
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  type?: string;
  file?: string;
  line?: number;
  column?: number;
  sourceMap?: boolean;
}

interface StackFrame {
  file: string;
  line: number;
  column: number;
  function?: string;
  source?: string;
}

export class ErrorOverlay {
  private errorHistory: ErrorInfo[] = [];
  private maxHistorySize = 50;

  /**
   * Generate error overlay HTML
   */
  generateErrorHTML(error: ErrorInfo): string {
    const frames = this.parseStackTrace(error.stack || "");
    const timestamp = new Date().toISOString();

    // Add to history
    this.errorHistory.unshift({
      ...error,
      ...{ timestamp } as any,
    });
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.pop();
    }

    return this.renderErrorPage(error, frames, timestamp);
  }

  /**
   * Get standalone error overlay HTML
   */
  getOverlayHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elide Error Overlay</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="error-overlay">
    <div class="error-header">
      <h1>🔍 Error Inspector</h1>
      <p>View and debug application errors</p>
    </div>
    <div class="error-list">
      ${this.renderErrorHistory()}
    </div>
  </div>
  <script>
    ${this.getScript()}
  </script>
</body>
</html>
    `;
  }

  /**
   * Render complete error page
   */
  private renderErrorPage(error: ErrorInfo, frames: StackFrame[], timestamp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Build Error - Elide Dev Server</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="error-overlay">
    <div class="error-header">
      <div class="error-icon">⚠️</div>
      <div>
        <h1>Build Error</h1>
        <p class="error-time">${timestamp}</p>
      </div>
      <button class="close-button" onclick="window.close()">✕</button>
    </div>

    <div class="error-content">
      <div class="error-type">${this.escapeHtml(error.type || "Error")}</div>
      <div class="error-message">${this.escapeHtml(error.message)}</div>

      ${error.file ? `
        <div class="error-location">
          <span class="label">File:</span>
          <span class="file-path" onclick="openFile('${error.file}', ${error.line})">${this.escapeHtml(error.file)}</span>
          ${error.line ? `<span class="line-number">:${error.line}${error.column ? `:${error.column}` : ""}</span>` : ""}
        </div>
      ` : ""}

      ${frames.length > 0 ? `
        <div class="stack-trace">
          <h2>Stack Trace</h2>
          <div class="frames">
            ${frames.map((frame, i) => this.renderStackFrame(frame, i)).join("")}
          </div>
        </div>
      ` : ""}

      <div class="error-actions">
        <button class="action-button" onclick="window.location.reload()">
          🔄 Reload Page
        </button>
        <button class="action-button" onclick="copyError()">
          📋 Copy Error
        </button>
        <button class="action-button secondary" onclick="showRawError()">
          🔍 Show Raw Error
        </button>
      </div>
    </div>

    <div class="error-tips">
      <h3>💡 Debugging Tips</h3>
      <ul>
        <li>Check the file path and line number above</li>
        <li>Look for syntax errors or missing imports</li>
        <li>Verify that all dependencies are installed</li>
        <li>Check for typos in variable or function names</li>
        <li>Review recent changes that might have caused the error</li>
      </ul>
    </div>
  </div>

  <script>
    const errorData = ${JSON.stringify({ error, frames })};

    function openFile(file, line) {
      // In production, would integrate with editor (VS Code, etc.)
      console.log(\`Opening: \${file}:\${line}\`);
      alert(\`Would open: \${file}:\${line}\n\nThis feature requires editor integration.\`);
    }

    function copyError() {
      const text = \`\${errorData.error.type}: \${errorData.error.message}\n\n\${errorData.error.stack || ""}\`;
      navigator.clipboard.writeText(text).then(() => {
        alert("Error copied to clipboard!");
      });
    }

    function showRawError() {
      const raw = document.createElement("div");
      raw.className = "raw-error";
      raw.innerHTML = \`
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 9999; padding: 40px; overflow: auto;">
          <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
          <pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; margin-top: 60px;">\${JSON.stringify(errorData, null, 2)}</pre>
        </div>
      \`;
      document.body.appendChild(raw);
    }

    ${this.getScript()}
  </script>
</body>
</html>
    `;
  }

  /**
   * Render a single stack frame
   */
  private renderStackFrame(frame: StackFrame, index: number): string {
    return `
      <div class="frame" onclick="openFile('${frame.file}', ${frame.line})">
        <div class="frame-number">${index + 1}</div>
        <div class="frame-details">
          <div class="frame-function">${this.escapeHtml(frame.function || "anonymous")}</div>
          <div class="frame-location">
            <span class="frame-file">${this.escapeHtml(frame.file)}</span>
            <span class="frame-line">:${frame.line}:${frame.column}</span>
          </div>
          ${frame.source ? `<div class="frame-source"><code>${this.escapeHtml(frame.source)}</code></div>` : ""}
        </div>
      </div>
    `;
  }

  /**
   * Render error history
   */
  private renderErrorHistory(): string {
    if (this.errorHistory.length === 0) {
      return "<p>No errors in history</p>";
    }

    return this.errorHistory.map((error, i) => `
      <div class="history-item">
        <div class="history-index">${i + 1}</div>
        <div class="history-details">
          <div class="history-type">${this.escapeHtml(error.type || "Error")}</div>
          <div class="history-message">${this.escapeHtml(error.message.substring(0, 100))}${error.message.length > 100 ? "..." : ""}</div>
          <div class="history-time">${(error as any).timestamp || "Unknown"}</div>
        </div>
      </div>
    `).join("");
  }

  /**
   * Parse stack trace into frames
   */
  private parseStackTrace(stack: string): StackFrame[] {
    const frames: StackFrame[] = [];
    const lines = stack.split("\n");

    for (const line of lines) {
      const frame = this.parseStackLine(line);
      if (frame) {
        frames.push(frame);
      }
    }

    return frames;
  }

  /**
   * Parse a single stack trace line
   */
  private parseStackLine(line: string): StackFrame | null {
    // Try different stack trace formats

    // Format: at functionName (file:line:column)
    let match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1].trim(),
        file: match[2],
        line: parseInt(match[3]),
        column: parseInt(match[4]),
      };
    }

    // Format: at file:line:column
    match = line.match(/at\s+(.+?):(\d+):(\d+)/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
      };
    }

    // Format: file:line:column
    match = line.match(/^\s*(.+?):(\d+):(\d+)/);
    if (match) {
      return {
        file: match[1].trim(),
        line: parseInt(match[2]),
        column: parseInt(match[3]),
      };
    }

    return null;
  }

  /**
   * Get CSS styles for error overlay
   */
  private getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: #0f0f0f;
        color: #d4d4d4;
        line-height: 1.6;
      }

      .error-overlay {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
      }

      .error-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #2d2d2d;
      }

      .error-icon {
        font-size: 48px;
      }

      .error-header h1 {
        color: #ef4444;
        font-size: 32px;
        font-weight: 600;
      }

      .error-time {
        color: #888;
        font-size: 14px;
        margin-top: 4px;
      }

      .close-button {
        margin-left: auto;
        background: #2d2d2d;
        color: #d4d4d4;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 20px;
      }

      .close-button:hover {
        background: #3d3d3d;
      }

      .error-content {
        background: #1a1a1a;
        border: 1px solid #2d2d2d;
        border-radius: 8px;
        padding: 30px;
        margin-bottom: 30px;
      }

      .error-type {
        color: #fbbf24;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }

      .error-message {
        color: #ef4444;
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .error-location {
        background: #2d2d2d;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 20px;
        font-family: "Monaco", "Menlo", "Courier New", monospace;
        font-size: 14px;
      }

      .label {
        color: #888;
        margin-right: 8px;
      }

      .file-path {
        color: #60a5fa;
        cursor: pointer;
        text-decoration: underline;
      }

      .file-path:hover {
        color: #93c5fd;
      }

      .line-number {
        color: #fbbf24;
      }

      .stack-trace {
        margin-top: 30px;
      }

      .stack-trace h2 {
        font-size: 18px;
        margin-bottom: 15px;
        color: #d4d4d4;
      }

      .frames {
        background: #0f0f0f;
        border: 1px solid #2d2d2d;
        border-radius: 6px;
        overflow: hidden;
      }

      .frame {
        display: flex;
        gap: 15px;
        padding: 15px;
        border-bottom: 1px solid #2d2d2d;
        cursor: pointer;
        transition: background 0.2s;
      }

      .frame:last-child {
        border-bottom: none;
      }

      .frame:hover {
        background: #1a1a1a;
      }

      .frame-number {
        color: #888;
        font-weight: 600;
        min-width: 30px;
      }

      .frame-details {
        flex: 1;
      }

      .frame-function {
        color: #a78bfa;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .frame-location {
        font-size: 14px;
        font-family: "Monaco", "Menlo", "Courier New", monospace;
      }

      .frame-file {
        color: #60a5fa;
      }

      .frame-line {
        color: #fbbf24;
      }

      .frame-source {
        margin-top: 8px;
        padding: 8px;
        background: #1a1a1a;
        border-radius: 4px;
        font-size: 13px;
      }

      .frame-source code {
        color: #d4d4d4;
      }

      .error-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }

      .action-button {
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .action-button:hover {
        background: #2563eb;
      }

      .action-button.secondary {
        background: #2d2d2d;
      }

      .action-button.secondary:hover {
        background: #3d3d3d;
      }

      .error-tips {
        background: #1a1a1a;
        border: 1px solid #2d2d2d;
        border-radius: 8px;
        padding: 20px 30px;
      }

      .error-tips h3 {
        color: #60a5fa;
        margin-bottom: 15px;
      }

      .error-tips ul {
        list-style-position: inside;
        color: #888;
      }

      .error-tips li {
        margin-bottom: 8px;
      }
    `;
  }

  /**
   * Get JavaScript for interactivity
   */
  private getScript(): string {
    return `
      console.log("🎨 Elide Error Overlay loaded");

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        // Escape to close
        if (e.key === "Escape") {
          window.close();
        }
        // Cmd/Ctrl + R to reload
        if ((e.metaKey || e.ctrlKey) && e.key === "r") {
          e.preventDefault();
          window.location.reload();
        }
      });
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get error history
   */
  getHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }
}

// CLI demo
if (import.meta.url.includes("error-overlay.ts")) {
  console.log("🎨 Error Overlay Demo\n");

  const overlay = new ErrorOverlay();

  // Example error
  const error: ErrorInfo = {
    type: "TypeError",
    message: "Cannot read property 'map' of undefined",
    file: "/home/user/project/src/server.ts",
    line: 42,
    column: 15,
    stack: `TypeError: Cannot read property 'map' of undefined
    at processData (/home/user/project/src/server.ts:42:15)
    at handleRequest (/home/user/project/src/server.ts:28:10)
    at Server.handler (/home/user/project/src/index.ts:15:5)`,
  };

  const html = overlay.generateErrorHTML(error);

  console.log("✅ Error overlay HTML generated!");
  console.log(`📏 Size: ${html.length} bytes`);
  console.log(`📜 History: ${overlay.getHistory().length} error(s)`);

  // Generate another error
  const error2: ErrorInfo = {
    type: "SyntaxError",
    message: "Unexpected token '}'",
    file: "/home/user/project/src/utils.ts",
    line: 108,
    column: 1,
  };

  overlay.generateErrorHTML(error2);
  console.log(`📜 History updated: ${overlay.getHistory().length} error(s)`);
}
