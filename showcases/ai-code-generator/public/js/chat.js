/**
 * Chat Interface
 * Handles AI conversation and code generation requests
 */

class Chat {
  constructor(app) {
    this.app = app;
    this.messages = [];
    this.conversationHistory = [];
    this.isGenerating = false;

    this.init();
  }

  /**
   * Initialize chat
   */
  init() {
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('sendBtn');

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Send button
    this.sendBtn?.addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter to send (Shift+Enter for new line)
    this.chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.currentTarget.dataset.prompt;
        this.chatInput.value = prompt;
        this.sendMessage();
      });
    });

    // Auto-resize textarea
    this.chatInput?.addEventListener('input', () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
    });
  }

  /**
   * Send message
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isGenerating) return;

    // Clear input
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';

    // Add user message
    this.addMessage('user', message);

    // Show typing indicator
    this.showTypingIndicator();

    // Disable send button
    this.isGenerating = true;
    this.sendBtn.disabled = true;

    try {
      // Generate code
      const result = await this.generateCode(message);

      // Hide typing indicator
      this.hideTypingIndicator();

      // Add assistant response
      this.addMessage('assistant', result.explanation || 'Code generated successfully!');

      // Update editor with generated code
      if (result.code) {
        this.app.setCurrentCode(result.code);
      }

      // Update files
      if (result.files && result.files.length > 0) {
        result.files.forEach(file => {
          this.app.state.files.set(file.path, {
            content: file.content,
            language: file.language,
          });
        });
      }

      // Add suggestions if any
      if (result.suggestions && result.suggestions.length > 0) {
        this.addSuggestions(result.suggestions);
      }

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: result.explanation || 'Code generated',
      });
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('assistant', `Error: ${error.message}`, 'error');
      console.error('Generation error:', error);
    } finally {
      this.isGenerating = false;
      this.sendBtn.disabled = false;
      this.chatInput.focus();
    }
  }

  /**
   * Generate code via API
   */
  async generateCode(prompt) {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        language: this.app.state.language,
        framework: this.app.state.framework,
        context: {
          previousCode: this.app.getCurrentCode(),
          conversation: this.conversationHistory.slice(-5), // Last 5 messages
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    return await response.json();
  }

  /**
   * Add message to chat
   */
  addMessage(role, content, type = 'normal') {
    const message = {
      role,
      content,
      type,
      timestamp: new Date(),
    };

    this.messages.push(message);

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role} ${type === 'error' ? 'error-message' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    // Parse markdown-like content
    const formattedContent = this.formatContent(content);
    contentEl.innerHTML = formattedContent;

    // Add metadata
    const metadata = document.createElement('div');
    metadata.className = 'message-metadata';

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = this.formatTime(message.timestamp);
    metadata.appendChild(time);

    const actions = document.createElement('div');
    actions.className = 'message-actions';

    // Copy button for assistant messages
    if (role === 'assistant') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'message-action-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(content);
        this.app.showNotification('Message copied', 'success');
      };
      actions.appendChild(copyBtn);
    }

    metadata.appendChild(actions);
    contentEl.appendChild(metadata);

    messageEl.appendChild(avatar);
    messageEl.appendChild(contentEl);

    this.chatMessages.appendChild(messageEl);

    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * Format message content (basic markdown)
   */
  formatContent(content) {
    let formatted = content;

    // Code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `
        <div class="code-snippet">
          <div class="code-snippet-header">
            <span class="code-snippet-language">${lang || 'code'}</span>
            <button class="code-snippet-copy" onclick="navigator.clipboard.writeText(\`${code.trim().replace(/`/g, '\\`')}\`)">Copy</button>
          </div>
          <pre><code>${this.escapeHtml(code.trim())}</code></pre>
        </div>
      `;
    });

    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp
   */
  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message assistant';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const content = document.createElement('div');
    content.className = 'typing-indicator';
    content.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

    indicator.appendChild(avatar);
    indicator.appendChild(content);

    this.chatMessages.appendChild(indicator);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Add suggestions
   */
  addSuggestions(suggestions) {
    const container = document.createElement('div');
    container.className = 'message-examples';

    suggestions.forEach(suggestion => {
      const btn = document.createElement('button');
      btn.className = 'example-btn';
      btn.textContent = suggestion;
      btn.onclick = () => {
        this.chatInput.value = suggestion;
        this.sendMessage();
      };
      container.appendChild(btn);
    });

    const lastMessage = this.chatMessages.querySelector('.message.assistant:last-child .message-content');
    if (lastMessage) {
      lastMessage.appendChild(container);
    }
  }

  /**
   * Clear chat
   */
  clear() {
    this.messages = [];
    this.conversationHistory = [];

    // Keep only the initial welcome message
    const messages = this.chatMessages.querySelectorAll('.message');
    messages.forEach((msg, index) => {
      if (index > 0) {
        msg.remove();
      }
    });
  }
}

// Make Chat available globally
window.Chat = Chat;
