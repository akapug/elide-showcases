/**
 * Preview Module
 * Handles live preview of generated code
 */

class Preview {
  constructor(app) {
    this.app = app;
    this.iframe = document.getElementById('previewFrame');
    this.currentPreview = null;

    this.init();
  }

  /**
   * Initialize preview
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshPreview')?.addEventListener('click', () => {
      this.refresh();
    });

    // Open in new tab button
    document.getElementById('openInNewTab')?.addEventListener('click', () => {
      this.openInNewTab();
    });

    // Auto-refresh on code change (debounced)
    let refreshTimeout;
    document.getElementById('codeEditor')?.addEventListener('input', () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        if (this.app.state.view === 'preview' || this.app.state.view === 'split') {
          this.refresh();
        }
      }, 1000); // 1 second debounce
    });
  }

  /**
   * Refresh preview
   */
  async refresh() {
    const code = this.app.getCurrentCode();
    if (!code) return;

    try {
      this.showLoading();

      // Get files from state
      const files = Array.from(this.app.state.files.entries()).map(([path, data]) => ({
        path,
        content: data.content,
        language: data.language,
      }));

      // Generate preview
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          files,
          language: this.app.state.language,
          framework: this.app.state.framework,
        }),
      });

      if (!response.ok) {
        throw new Error('Preview generation failed');
      }

      const result = await response.json();

      // Update preview
      this.currentPreview = result;
      this.render(result.bundledCode);
    } catch (error) {
      console.error('Preview error:', error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Render code in iframe
   */
  render(code) {
    if (!this.iframe) return;

    // Detect content type
    const contentType = this.detectContentType(code);

    if (contentType === 'html') {
      // Render HTML directly
      this.renderHTML(code);
    } else if (contentType === 'react' || contentType === 'vue') {
      // Wrap in HTML template
      this.renderComponent(code, contentType);
    } else {
      // Show code output (for backend languages)
      this.renderOutput(code);
    }
  }

  /**
   * Detect content type
   */
  detectContentType(code) {
    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return 'html';
    } else if (code.includes('import React') || code.includes('from "react"')) {
      return 'react';
    } else if (code.includes('import Vue') || code.includes('from "vue"')) {
      return 'vue';
    } else {
      return 'unknown';
    }
  }

  /**
   * Render HTML
   */
  renderHTML(html) {
    const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
  }

  /**
   * Render React/Vue component
   */
  renderComponent(code, type) {
    const template = type === 'react' ? this.getReactTemplate(code) : this.getVueTemplate(code);
    this.renderHTML(template);
  }

  /**
   * Get React template
   */
  getReactTemplate(code) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}

    // Try to render the default export or first component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    try {
      const Component = typeof App !== 'undefined' ? App :
                       typeof exports !== 'undefined' && exports.default ? exports.default :
                       function() { return React.createElement('div', null, 'No component found'); };
      root.render(React.createElement(Component));
    } catch (error) {
      root.render(React.createElement('div', { style: { color: 'red' } },
        'Error: ' + error.message));
      console.error(error);
    }
  </script>
</body>
</html>
    `;
  }

  /**
   * Get Vue template
   */
  getVueTemplate(code) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const { createApp } = Vue;

    try {
      ${code}

      const app = createApp(App || {
        template: '<div>No component found</div>'
      });
      app.mount('#app');
    } catch (error) {
      console.error(error);
      createApp({
        template: '<div style="color: red;">Error: ' + error.message + '</div>'
      }).mount('#app');
    }
  </script>
</body>
</html>
    `;
  }

  /**
   * Render code output (for non-UI code)
   */
  renderOutput(code) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Monaco', 'Menlo', monospace;
      background: #1e1e1e;
      color: #d4d4d4;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .output {
      background: #252526;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #333;
    }
    .message {
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .log {
      background: rgba(255, 255, 255, 0.05);
    }
    .error {
      background: rgba(255, 0, 0, 0.1);
      color: #f48771;
    }
    .warn {
      background: rgba(255, 165, 0, 0.1);
      color: #cca700;
    }
  </style>
</head>
<body>
  <div class="output">
    <div class="message log">
      <strong>Code Output:</strong>
    </div>
    <pre id="output"></pre>
  </div>
  <script>
    // Capture console output
    const output = document.getElementById('output');
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = function(...args) {
      output.innerHTML += '<div class="message log">' + args.join(' ') + '</div>';
      originalLog.apply(console, args);
    };

    console.error = function(...args) {
      output.innerHTML += '<div class="message error">ERROR: ' + args.join(' ') + '</div>';
      originalError.apply(console, args);
    };

    console.warn = function(...args) {
      output.innerHTML += '<div class="message warn">WARN: ' + args.join(' ') + '</div>';
      originalWarn.apply(console, args);
    };

    // Execute code
    try {
      ${code}
      if (output.innerHTML === '') {
        output.innerHTML = '<div class="message log">Code executed successfully (no output)</div>';
      }
    } catch (error) {
      output.innerHTML += '<div class="message error">ERROR: ' + error.message + '</div>';
      console.error(error.stack);
    }
  </script>
</body>
</html>
    `;

    this.renderHTML(html);
  }

  /**
   * Show loading state
   */
  showLoading() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
</body>
</html>
    `;
    this.renderHTML(html);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    // Loading is hidden when new content is rendered
  }

  /**
   * Show error
   */
  showError(message) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .error {
      background: #fee;
      border-left: 4px solid #dc3545;
      padding: 20px;
      border-radius: 8px;
    }
    .error-title {
      color: #dc3545;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .error-message {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="error">
    <div class="error-title">Preview Error</div>
    <div class="error-message">${message}</div>
  </div>
</body>
</html>
    `;
    this.renderHTML(html);
  }

  /**
   * Open preview in new tab
   */
  openInNewTab() {
    if (!this.currentPreview) {
      this.app.showNotification('No preview available', 'warning');
      return;
    }

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(this.iframe.contentDocument.documentElement.outerHTML);
      win.document.close();
    }
  }

  /**
   * Clear preview
   */
  clear() {
    this.currentPreview = null;
    this.renderHTML('<div style="padding: 40px; text-align: center; color: #999;">No preview available</div>');
  }
}

// Make Preview available globally
window.Preview = Preview;
