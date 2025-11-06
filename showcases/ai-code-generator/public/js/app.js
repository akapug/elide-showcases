/**
 * AI Code Generator - Main Application
 */

class App {
  constructor() {
    this.state = {
      currentFile: 'main.tsx',
      files: new Map(),
      language: 'typescript',
      framework: 'react',
      generationHistory: [],
      view: 'code', // 'code', 'preview', 'split'
    };

    this.init();
  }

  /**
   * Initialize application
   */
  init() {
    console.log('AI Code Generator initializing...');

    // Initialize default file
    this.state.files.set('main.tsx', {
      content: document.getElementById('codeEditor').value,
      language: 'typescript',
    });

    // Set up event listeners
    this.setupEventListeners();

    // Initialize modules
    if (window.Editor) {
      this.editor = new window.Editor(this);
    }

    if (window.Chat) {
      this.chat = new window.Chat(this);
    }

    if (window.Preview) {
      this.preview = new window.Preview(this);
    }

    console.log('AI Code Generator ready!');
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // View toggle buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.setView(view);
      });
    });

    // Format button
    document.getElementById('formatBtn')?.addEventListener('click', () => {
      this.formatCode();
    });

    // Transpile button
    document.getElementById('transpileBtn')?.addEventListener('click', () => {
      this.showTranspileDialog();
    });

    // Copy button
    document.getElementById('copyBtn')?.addEventListener('click', () => {
      this.copyCode();
    });

    // New project button
    document.getElementById('newProjectBtn')?.addEventListener('click', () => {
      this.newProject();
    });

    // Export button
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      this.showExportDialog();
    });

    // Export modal
    document.getElementById('closeExportModal')?.addEventListener('click', () => {
      this.hideExportDialog();
    });

    document.getElementById('cancelExport')?.addEventListener('click', () => {
      this.hideExportDialog();
    });

    document.getElementById('confirmExport')?.addEventListener('click', () => {
      this.exportProject();
    });

    // Language selector
    document.getElementById('languageSelect')?.addEventListener('change', (e) => {
      this.state.language = e.target.value;
      this.updateLanguageDisplay();
    });

    // Framework selector
    document.getElementById('frameworkSelect')?.addEventListener('change', (e) => {
      this.state.framework = e.target.value;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });
  }

  /**
   * Set view mode
   */
  setView(view) {
    this.state.view = view;

    // Update button states
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update panel visibility
    const editorPanel = document.getElementById('editorPanel');
    const previewPanel = document.getElementById('previewPanel');

    if (view === 'code') {
      editorPanel.style.display = 'flex';
      editorPanel.style.flex = '1';
      previewPanel.style.display = 'none';
    } else if (view === 'preview') {
      editorPanel.style.display = 'none';
      previewPanel.style.display = 'flex';
      previewPanel.style.flex = '1';
      if (this.preview) {
        this.preview.refresh();
      }
    } else if (view === 'split') {
      editorPanel.style.display = 'flex';
      editorPanel.style.flex = '1';
      previewPanel.style.display = 'flex';
      previewPanel.style.flex = '1';
      if (this.preview) {
        this.preview.refresh();
      }
    }
  }

  /**
   * Format code
   */
  formatCode() {
    const code = this.getCurrentCode();
    if (!code) return;

    // Simple formatting (in production, use prettier or similar)
    let formatted = code;

    // Add proper indentation (basic)
    const lines = formatted.split('\n');
    let indent = 0;
    const indentSize = 2;

    formatted = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Decrease indent for closing brackets
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indent = Math.max(0, indent - 1);
      }

      const indented = ' '.repeat(indent * indentSize) + trimmed;

      // Increase indent for opening brackets
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indent++;
      }

      return indented;
    }).join('\n');

    this.setCurrentCode(formatted);
    this.showNotification('Code formatted', 'success');
  }

  /**
   * Show transpile dialog
   */
  showTranspileDialog() {
    const from = this.state.language;
    const options = ['typescript', 'javascript', 'jsx', 'tsx', 'vue'];
    const to = prompt(`Transpile from ${from} to: (${options.join(', ')})`);

    if (to && options.includes(to.toLowerCase())) {
      this.transpileCode(from, to.toLowerCase());
    }
  }

  /**
   * Transpile code
   */
  async transpileCode(from, to) {
    const code = this.getCurrentCode();
    if (!code) return;

    this.showLoading('Transpiling code...');

    try {
      const response = await fetch('/api/transpile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          from,
          to,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        this.setCurrentCode(result.code);
        this.state.language = to;
        this.updateLanguageDisplay();

        if (result.warnings && result.warnings.length > 0) {
          this.showNotification(`Transpiled with ${result.warnings.length} warnings`, 'warning');
        } else {
          this.showNotification('Code transpiled successfully', 'success');
        }
      } else {
        throw new Error(result.error || 'Transpilation failed');
      }
    } catch (error) {
      console.error('Transpilation error:', error);
      this.showNotification(`Transpilation failed: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Copy code to clipboard
   */
  async copyCode() {
    const code = this.getCurrentCode();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      this.showNotification('Code copied to clipboard', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      this.showNotification('Failed to copy code', 'error');
    }
  }

  /**
   * New project
   */
  newProject() {
    if (confirm('Start a new project? This will clear your current work.')) {
      this.state.files.clear();
      this.state.currentFile = 'main.tsx';
      this.state.files.set('main.tsx', {
        content: '// New project\n',
        language: 'typescript',
      });
      this.setCurrentCode('// New project\n');
      if (this.chat) {
        this.chat.clear();
      }
      this.showNotification('New project created', 'success');
    }
  }

  /**
   * Show export dialog
   */
  showExportDialog() {
    document.getElementById('exportModal').style.display = 'flex';
  }

  /**
   * Hide export dialog
   */
  hideExportDialog() {
    document.getElementById('exportModal').style.display = 'none';
  }

  /**
   * Export project
   */
  async exportProject() {
    const projectName = document.getElementById('projectName').value || 'my-project';
    const format = document.getElementById('exportFormat').value || 'zip';
    const includeNodeModules = document.getElementById('includeNodeModules').checked;

    this.hideExportDialog();
    this.showLoading('Exporting project...');

    try {
      const files = Array.from(this.state.files.entries()).map(([path, data]) => ({
        path,
        content: data.content,
        language: data.language,
      }));

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          format,
          files,
          includeNodeModules,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Project exported successfully', 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification(`Export failed: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcut(e) {
    // Ctrl/Cmd + S - Format
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.formatCode();
    }

    // Ctrl/Cmd + K - Show chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('chatInput')?.focus();
    }

    // Ctrl/Cmd + E - Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      this.showExportDialog();
    }

    // Ctrl/Cmd + 1/2/3 - Switch views
    if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      const views = ['code', 'preview', 'split'];
      this.setView(views[parseInt(e.key) - 1]);
    }
  }

  /**
   * Get current code
   */
  getCurrentCode() {
    return document.getElementById('codeEditor')?.value || '';
  }

  /**
   * Set current code
   */
  setCurrentCode(code) {
    const editor = document.getElementById('codeEditor');
    if (editor) {
      editor.value = code;
      this.updateEditorStats();
    }

    // Update in state
    const file = this.state.files.get(this.state.currentFile);
    if (file) {
      file.content = code;
    }
  }

  /**
   * Update editor stats
   */
  updateEditorStats() {
    const code = this.getCurrentCode();
    const lines = code.split('\n').length;
    const chars = code.length;

    document.getElementById('lineCount').textContent = lines;
    document.getElementById('charCount').textContent = chars;
  }

  /**
   * Update language display
   */
  updateLanguageDisplay() {
    document.getElementById('currentLanguage').textContent = this.state.language;
  }

  /**
   * Show loading overlay
   */
  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('.loading-text');
    if (text) {
      text.textContent = message;
    }
    overlay.style.display = 'flex';
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
