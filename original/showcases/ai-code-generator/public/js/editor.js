/**
 * Code Editor
 * Enhanced text editor with syntax highlighting, autocomplete, etc.
 */

class Editor {
  constructor(app) {
    this.app = app;
    this.editor = document.getElementById('codeEditor');
    this.currentLanguage = 'typescript';
    this.autocompleteVisible = false;

    this.init();
  }

  /**
   * Initialize editor
   */
  init() {
    if (!this.editor) return;

    this.setupEventListeners();
    this.setupSyntaxHighlighting();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Track changes
    this.editor.addEventListener('input', () => {
      this.handleInput();
    });

    // Track cursor position
    this.editor.addEventListener('click', () => {
      this.updateCursorPosition();
    });

    this.editor.addEventListener('keyup', () => {
      this.updateCursorPosition();
    });

    // Handle tab key
    this.editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.insertTab();
      }

      // Auto-close brackets
      if (['(', '[', '{', '"', "'"].includes(e.key)) {
        this.autoCloseBracket(e);
      }

      // Autocomplete trigger
      if (e.key === '.' || (e.ctrlKey && e.key === ' ')) {
        this.showAutocomplete();
      }

      // Escape to close autocomplete
      if (e.key === 'Escape') {
        this.hideAutocomplete();
      }
    });
  }

  /**
   * Handle editor input
   */
  handleInput() {
    this.app.updateEditorStats();
    this.updateSyntaxHighlighting();
  }

  /**
   * Update cursor position
   */
  updateCursorPosition() {
    const position = this.editor.selectionStart;
    const text = this.editor.value;
    const line = text.substring(0, position).split('\n').length;
    const col = position - text.lastIndexOf('\n', position - 1);

    // Update status bar (if exists)
    const statusBar = document.querySelector('.editor-status');
    if (statusBar) {
      let posInfo = statusBar.querySelector('.status-position');
      if (!posInfo) {
        posInfo = document.createElement('span');
        posInfo.className = 'status-item status-position';
        statusBar.appendChild(posInfo);
      }
      posInfo.textContent = `Ln ${line}, Col ${col}`;
    }
  }

  /**
   * Insert tab character
   */
  insertTab() {
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;
    const value = this.editor.value;

    // Insert 2 spaces for tab
    this.editor.value = value.substring(0, start) + '  ' + value.substring(end);
    this.editor.selectionStart = this.editor.selectionEnd = start + 2;

    this.handleInput();
  }

  /**
   * Auto-close brackets
   */
  autoCloseBracket(e) {
    const closingChars = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
    };

    const closing = closingChars[e.key];
    if (!closing) return;

    // Check if we should auto-close
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;

    if (start !== end) {
      // Wrap selection
      e.preventDefault();
      const value = this.editor.value;
      const selected = value.substring(start, end);
      this.editor.value = value.substring(0, start) + e.key + selected + closing + value.substring(end);
      this.editor.selectionStart = start + 1;
      this.editor.selectionEnd = end + 1;
    } else {
      // Auto-close
      setTimeout(() => {
        const value = this.editor.value;
        const pos = this.editor.selectionStart;
        this.editor.value = value.substring(0, pos) + closing + value.substring(pos);
        this.editor.selectionStart = this.editor.selectionEnd = pos;
      }, 0);
    }
  }

  /**
   * Setup syntax highlighting (basic)
   */
  setupSyntaxHighlighting() {
    // In a real implementation, this would use a library like Prism.js or Monaco
    // For now, we'll keep it simple
    console.log('Syntax highlighting enabled');
  }

  /**
   * Update syntax highlighting
   */
  updateSyntaxHighlighting() {
    // Placeholder for syntax highlighting update
    // In production, use a proper syntax highlighter
  }

  /**
   * Show autocomplete suggestions
   */
  showAutocomplete() {
    if (this.autocompleteVisible) return;

    const suggestions = this.getAutocompleteSuggestions();
    if (suggestions.length === 0) return;

    // Create autocomplete popup
    const popup = document.createElement('div');
    popup.id = 'autocompletePopup';
    popup.className = 'editor-autocomplete';

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      if (index === 0) item.classList.add('selected');

      const icon = document.createElement('span');
      icon.className = `autocomplete-icon ${suggestion.type}`;
      icon.textContent = this.getIconForType(suggestion.type);

      const label = document.createElement('span');
      label.textContent = suggestion.label;

      item.appendChild(icon);
      item.appendChild(label);

      item.addEventListener('click', () => {
        this.insertCompletion(suggestion.insertText);
        this.hideAutocomplete();
      });

      popup.appendChild(item);
    });

    // Position popup near cursor
    const rect = this.editor.getBoundingClientRect();
    popup.style.left = rect.left + 'px';
    popup.style.top = (rect.top + 20) + 'px';

    document.body.appendChild(popup);
    this.autocompleteVisible = true;
  }

  /**
   * Hide autocomplete
   */
  hideAutocomplete() {
    const popup = document.getElementById('autocompletePopup');
    if (popup) {
      popup.remove();
    }
    this.autocompleteVisible = false;
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions() {
    const text = this.editor.value;
    const pos = this.editor.selectionStart;
    const beforeCursor = text.substring(0, pos);
    const currentWord = this.getCurrentWord(beforeCursor);

    // Basic JavaScript/TypeScript suggestions
    const suggestions = [
      { label: 'console', type: 'variable', insertText: 'console' },
      { label: 'function', type: 'keyword', insertText: 'function' },
      { label: 'const', type: 'keyword', insertText: 'const' },
      { label: 'let', type: 'keyword', insertText: 'let' },
      { label: 'var', type: 'keyword', insertText: 'var' },
      { label: 'if', type: 'keyword', insertText: 'if' },
      { label: 'else', type: 'keyword', insertText: 'else' },
      { label: 'for', type: 'keyword', insertText: 'for' },
      { label: 'while', type: 'keyword', insertText: 'while' },
      { label: 'return', type: 'keyword', insertText: 'return' },
      { label: 'import', type: 'keyword', insertText: 'import' },
      { label: 'export', type: 'keyword', insertText: 'export' },
      { label: 'class', type: 'keyword', insertText: 'class' },
      { label: 'interface', type: 'keyword', insertText: 'interface' },
      { label: 'type', type: 'keyword', insertText: 'type' },
    ];

    // Filter by current word
    return suggestions.filter(s =>
      s.label.toLowerCase().startsWith(currentWord.toLowerCase())
    );
  }

  /**
   * Get current word being typed
   */
  getCurrentWord(text) {
    const match = text.match(/\w+$/);
    return match ? match[0] : '';
  }

  /**
   * Insert completion
   */
  insertCompletion(text) {
    const pos = this.editor.selectionStart;
    const value = this.editor.value;
    const beforeCursor = value.substring(0, pos);
    const currentWord = this.getCurrentWord(beforeCursor);

    // Replace current word with completion
    const newValue = beforeCursor.substring(0, beforeCursor.length - currentWord.length) +
      text + value.substring(pos);

    this.editor.value = newValue;
    this.editor.selectionStart = this.editor.selectionEnd = pos - currentWord.length + text.length;
    this.handleInput();
  }

  /**
   * Get icon for completion type
   */
  getIconForType(type) {
    const icons = {
      function: 'ƒ',
      variable: 'v',
      keyword: 'k',
      class: 'C',
      interface: 'I',
    };
    return icons[type] || '•';
  }

  /**
   * Find and replace
   */
  findAndReplace(find, replace, options = {}) {
    const { caseSensitive = false, wholeWord = false, regex = false } = options;
    let text = this.editor.value;

    if (regex) {
      const flags = caseSensitive ? 'g' : 'gi';
      text = text.replace(new RegExp(find, flags), replace);
    } else {
      if (wholeWord) {
        find = `\\b${find}\\b`;
      }
      const flags = caseSensitive ? 'g' : 'gi';
      text = text.replace(new RegExp(find, flags), replace);
    }

    this.editor.value = text;
    this.handleInput();
  }

  /**
   * Go to line
   */
  goToLine(lineNumber) {
    const lines = this.editor.value.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) return;

    let position = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      position += lines[i].length + 1; // +1 for newline
    }

    this.editor.focus();
    this.editor.selectionStart = this.editor.selectionEnd = position;
    this.updateCursorPosition();
  }

  /**
   * Get selected text
   */
  getSelectedText() {
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;
    return this.editor.value.substring(start, end);
  }

  /**
   * Insert text at cursor
   */
  insertText(text) {
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;
    const value = this.editor.value;

    this.editor.value = value.substring(0, start) + text + value.substring(end);
    this.editor.selectionStart = this.editor.selectionEnd = start + text.length;
    this.handleInput();
  }

  /**
   * Comment/uncomment selected lines
   */
  toggleComment() {
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;
    const value = this.editor.value;

    // Get selected lines
    const beforeSelection = value.substring(0, start);
    const selection = value.substring(start, end);
    const afterSelection = value.substring(end);

    const lineStart = beforeSelection.lastIndexOf('\n') + 1;
    const lineEnd = afterSelection.indexOf('\n');
    const fullLineSelection = value.substring(
      lineStart,
      lineEnd === -1 ? value.length : end + lineEnd
    );

    // Check if already commented
    const lines = fullLineSelection.split('\n');
    const allCommented = lines.every(line => line.trim().startsWith('//'));

    const newLines = lines.map(line => {
      if (allCommented) {
        // Uncomment
        return line.replace(/^(\s*)\/\/\s?/, '$1');
      } else {
        // Comment
        const indent = line.match(/^\s*/)[0];
        return indent + '// ' + line.substring(indent.length);
      }
    });

    this.editor.value = value.substring(0, lineStart) +
      newLines.join('\n') +
      value.substring(lineEnd === -1 ? value.length : end + lineEnd);

    this.handleInput();
  }
}

// Make Editor available globally
window.Editor = Editor;
