/**
 * CMS Platform - Article Editor Component
 *
 * Rich markdown editor for creating and editing articles.
 * Features live preview, auto-save, and media insertion.
 */

interface EditorState {
  content: string;
  cursor: { line: number; column: number };
  selection?: { start: number; end: number };
  isDirty: boolean;
  lastSaved?: Date;
}

interface EditorConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  tabSize: number;
  lineWrapping: boolean;
  spellCheck: boolean;
}

interface ArticleMetadata {
  title: string;
  slug: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  featuredImage?: string;
  status: 'draft' | 'review' | 'published';
}

/**
 * Article Editor Component
 */
export class ArticleEditor {
  private state: EditorState;
  private config: EditorConfig;
  private articleId?: string;
  private metadata: Partial<ArticleMetadata>;
  private autoSaveTimer?: NodeJS.Timeout;
  private onSaveCallback?: (content: string, metadata: ArticleMetadata) => Promise<void>;
  private onChangeCallback?: (content: string) => void;

  constructor(config: Partial<EditorConfig> = {}) {
    this.config = {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      tabSize: 2,
      lineWrapping: true,
      spellCheck: true,
      ...config
    };

    this.state = {
      content: '',
      cursor: { line: 0, column: 0 },
      isDirty: false
    };

    this.metadata = {
      status: 'draft',
      tags: [],
      categories: []
    };
  }

  /**
   * Initialize editor
   */
  initialize(container: HTMLElement): void {
    this.renderEditor(container);
    this.setupEventHandlers();

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Load article content
   */
  loadArticle(article: {
    id: string;
    content: string;
    title: string;
    slug: string;
    excerpt: string;
    categories: any[];
    tags: string[];
    featuredImage?: string;
    status: 'draft' | 'review' | 'published';
  }): void {
    this.articleId = article.id;
    this.state.content = article.content;
    this.metadata = {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      categories: article.categories.map(c => c.id),
      tags: article.tags,
      featuredImage: article.featuredImage,
      status: article.status
    };

    this.state.isDirty = false;
    this.state.lastSaved = new Date();
    this.updateUI();
  }

  /**
   * Get editor content
   */
  getContent(): string {
    return this.state.content;
  }

  /**
   * Set editor content
   */
  setContent(content: string): void {
    this.state.content = content;
    this.state.isDirty = true;
    this.updateUI();

    if (this.onChangeCallback) {
      this.onChangeCallback(content);
    }
  }

  /**
   * Insert text at cursor
   */
  insertText(text: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = this.state.content.substring(0, start);
    const after = this.state.content.substring(end);

    this.state.content = before + text + after;
    this.state.isDirty = true;

    this.updateUI();

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  }

  /**
   * Insert markdown formatting
   */
  insertMarkdown(type: string): void {
    const textarea = this.getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.state.content.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;

      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;

      case 'heading1':
        replacement = `# ${selectedText || 'Heading 1'}`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;

      case 'heading2':
        replacement = `## ${selectedText || 'Heading 2'}`;
        cursorOffset = selectedText ? replacement.length : 3;
        break;

      case 'heading3':
        replacement = `### ${selectedText || 'Heading 3'}`;
        cursorOffset = selectedText ? replacement.length : 4;
        break;

      case 'link':
        replacement = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? replacement.length - 4 : 1;
        break;

      case 'image':
        replacement = `![${selectedText || 'alt text'}](image-url)`;
        cursorOffset = selectedText ? replacement.length - 11 : 2;
        break;

      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? replacement.length : 1;
        break;

      case 'codeblock':
        replacement = `\`\`\`\n${selectedText || 'code'}\n\`\`\``;
        cursorOffset = selectedText ? 4 + selectedText.length : 4;
        break;

      case 'quote':
        replacement = `> ${selectedText || 'quote'}`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;

      case 'list':
        replacement = `- ${selectedText || 'list item'}`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;

      case 'orderedlist':
        replacement = `1. ${selectedText || 'list item'}`;
        cursorOffset = selectedText ? replacement.length : 3;
        break;

      default:
        return;
    }

    const before = this.state.content.substring(0, start);
    const after = this.state.content.substring(end);

    this.state.content = before + replacement + after;
    this.state.isDirty = true;

    this.updateUI();

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
      textarea.focus();
    }, 0);
  }

  /**
   * Insert media from library
   */
  insertMedia(media: { url: string; alt?: string; caption?: string }): void {
    const markdown = `![${media.alt || 'Image'}](${media.url})${media.caption ? `\n*${media.caption}*` : ''}`;
    this.insertText('\n\n' + markdown + '\n\n');
  }

  /**
   * Save article
   */
  async save(): Promise<void> {
    if (!this.metadata.title) {
      throw new Error('Article title is required');
    }

    if (this.onSaveCallback) {
      await this.onSaveCallback(this.state.content, this.metadata as ArticleMetadata);
      this.state.isDirty = false;
      this.state.lastSaved = new Date();
      this.updateUI();
    }
  }

  /**
   * Auto-save article
   */
  private async autoSave(): Promise<void> {
    if (!this.state.isDirty || !this.metadata.title) {
      return;
    }

    try {
      await this.save();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(
      () => this.autoSave(),
      this.config.autoSaveInterval
    );
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Update metadata
   */
  updateMetadata(updates: Partial<ArticleMetadata>): void {
    this.metadata = { ...this.metadata, ...updates };
    this.state.isDirty = true;
    this.updateUI();
  }

  /**
   * Get metadata
   */
  getMetadata(): Partial<ArticleMetadata> {
    return { ...this.metadata };
  }

  /**
   * Register save callback
   */
  onSave(callback: (content: string, metadata: ArticleMetadata) => Promise<void>): void {
    this.onSaveCallback = callback;
  }

  /**
   * Register change callback
   */
  onChange(callback: (content: string) => void): void {
    this.onChangeCallback = callback;
  }

  /**
   * Check if editor has unsaved changes
   */
  isDirty(): boolean {
    return this.state.isDirty;
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    return this.state.content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  /**
   * Get character count
   */
  getCharacterCount(): number {
    return this.state.content.length;
  }

  /**
   * Get reading time estimate (words per minute)
   */
  getReadingTime(wpm: number = 200): number {
    const words = this.getWordCount();
    return Math.ceil(words / wpm);
  }

  /**
   * Render editor UI
   */
  private renderEditor(container: HTMLElement): void {
    container.innerHTML = `
      <div class="article-editor">
        <div class="editor-toolbar">
          <button data-action="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button data-action="italic" title="Italic (Ctrl+I)"><em>I</em></button>
          <button data-action="heading1" title="Heading 1">H1</button>
          <button data-action="heading2" title="Heading 2">H2</button>
          <button data-action="heading3" title="Heading 3">H3</button>
          <span class="toolbar-separator"></span>
          <button data-action="link" title="Insert Link">🔗</button>
          <button data-action="image" title="Insert Image">🖼️</button>
          <button data-action="code" title="Inline Code">&lt;/&gt;</button>
          <button data-action="codeblock" title="Code Block">{ }</button>
          <span class="toolbar-separator"></span>
          <button data-action="quote" title="Quote">❝</button>
          <button data-action="list" title="Bullet List">•</button>
          <button data-action="orderedlist" title="Numbered List">1.</button>
          <span class="toolbar-separator"></span>
          <button data-action="media" title="Insert Media">📁</button>
        </div>

        <div class="editor-content">
          <div class="editor-pane">
            <textarea
              class="editor-textarea"
              placeholder="Start writing your article..."
              spellcheck="${this.config.spellCheck}"
            ></textarea>
          </div>
          <div class="preview-pane">
            <div class="preview-content"></div>
          </div>
        </div>

        <div class="editor-status">
          <span class="status-save"></span>
          <span class="status-stats">
            <span class="word-count">0 words</span>
            <span class="char-count">0 characters</span>
            <span class="reading-time">0 min read</span>
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    const container = this.getContainer();
    if (!container) return;

    // Toolbar buttons
    container.querySelectorAll('.editor-toolbar button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = (button as HTMLElement).dataset.action;
        if (action) {
          this.handleToolbarAction(action);
        }
      });
    });

    // Textarea input
    const textarea = this.getTextarea();
    if (textarea) {
      textarea.addEventListener('input', () => {
        this.state.content = textarea.value;
        this.state.isDirty = true;
        this.updateUI();

        if (this.onChangeCallback) {
          this.onChangeCallback(this.state.content);
        }
      });

      // Keyboard shortcuts
      textarea.addEventListener('keydown', (e) => {
        this.handleKeyboardShortcut(e);
      });

      // Tab key handling
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const spaces = ' '.repeat(this.config.tabSize);
          this.insertText(spaces);
        }
      });
    }
  }

  /**
   * Handle toolbar action
   */
  private handleToolbarAction(action: string): void {
    if (action === 'media') {
      // Trigger media library modal
      window.dispatchEvent(new CustomEvent('open-media-library', {
        detail: { callback: (media: any) => this.insertMedia(media) }
      }));
    } else {
      this.insertMarkdown(action);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcut(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          this.insertMarkdown('bold');
          break;
        case 'i':
          e.preventDefault();
          this.insertMarkdown('italic');
          break;
        case 's':
          e.preventDefault();
          this.save().catch(console.error);
          break;
      }
    }
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    const textarea = this.getTextarea();
    if (textarea && textarea.value !== this.state.content) {
      textarea.value = this.state.content;
    }

    this.updatePreview();
    this.updateStatus();
  }

  /**
   * Update preview pane
   */
  private updatePreview(): void {
    const preview = this.getContainer()?.querySelector('.preview-content') as HTMLElement;
    if (!preview) return;

    // In a real implementation, this would use a markdown parser
    // For this showcase, we'll use a simple placeholder
    preview.innerHTML = `<div class="markdown-preview">${this.escapeHtml(this.state.content)}</div>`;
  }

  /**
   * Update status bar
   */
  private updateStatus(): void {
    const container = this.getContainer();
    if (!container) return;

    // Save status
    const saveStatus = container.querySelector('.status-save') as HTMLElement;
    if (saveStatus) {
      if (this.state.isDirty) {
        saveStatus.textContent = 'Unsaved changes';
        saveStatus.className = 'status-save unsaved';
      } else if (this.state.lastSaved) {
        const timeAgo = this.formatTimeAgo(this.state.lastSaved);
        saveStatus.textContent = `Saved ${timeAgo}`;
        saveStatus.className = 'status-save saved';
      }
    }

    // Statistics
    const wordCount = container.querySelector('.word-count') as HTMLElement;
    const charCount = container.querySelector('.char-count') as HTMLElement;
    const readingTime = container.querySelector('.reading-time') as HTMLElement;

    if (wordCount) {
      wordCount.textContent = `${this.getWordCount()} words`;
    }

    if (charCount) {
      charCount.textContent = `${this.getCharacterCount()} characters`;
    }

    if (readingTime) {
      readingTime.textContent = `${this.getReadingTime()} min read`;
    }
  }

  /**
   * Get editor container
   */
  private getContainer(): HTMLElement | null {
    return document.querySelector('.article-editor');
  }

  /**
   * Get textarea element
   */
  private getTextarea(): HTMLTextAreaElement | null {
    return document.querySelector('.editor-textarea');
  }

  /**
   * Format time ago
   */
  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200) return '1 hour ago';
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;

    return date.toLocaleDateString();
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup editor
   */
  destroy(): void {
    this.stopAutoSave();
    this.state.isDirty = false;
  }
}
