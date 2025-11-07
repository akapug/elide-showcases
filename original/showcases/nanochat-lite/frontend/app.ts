/**
 * Nanochat-Lite Frontend Application
 *
 * Main UI logic for the chat interface. Handles:
 * - Message rendering and display
 * - User input processing
 * - Communication with backend (HTTP/WebSocket)
 * - Real-time statistics updates
 */

import { WebSocketClient } from './websocket-client';

// Types
interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    tokens?: number;
}

interface ChatResponse {
    message: string;
    tokens: number;
    processingTime: number;
    streaming?: boolean;
}

interface AppState {
    messages: Message[];
    totalTokens: number;
    messageCount: number;
    isStreaming: boolean;
    useWebSocket: boolean;
}

// Application Class
class NanochatApp {
    private state: AppState;
    private wsClient: WebSocketClient | null = null;
    private elements: {
        messages: HTMLElement;
        form: HTMLFormElement;
        input: HTMLTextAreaElement;
        sendButton: HTMLButtonElement;
        tokenCount: HTMLElement;
        messageCount: HTMLElement;
        connectionStatus: HTMLElement;
        charCount: HTMLElement;
        streamMode: HTMLInputElement;
        websocketMode: HTMLInputElement;
        clearChat: HTMLButtonElement;
        exportChat: HTMLButtonElement;
    };

    constructor() {
        this.state = {
            messages: [],
            totalTokens: 0,
            messageCount: 0,
            isStreaming: false,
            useWebSocket: true
        };

        // Get DOM elements
        this.elements = {
            messages: document.getElementById('messages')!,
            form: document.getElementById('chat-form') as HTMLFormElement,
            input: document.getElementById('message-input') as HTMLTextAreaElement,
            sendButton: document.getElementById('send-button') as HTMLButtonElement,
            tokenCount: document.getElementById('token-count')!,
            messageCount: document.getElementById('message-count')!,
            connectionStatus: document.getElementById('connection-status')!,
            charCount: document.getElementById('char-count')!,
            streamMode: document.getElementById('stream-mode') as HTMLInputElement,
            websocketMode: document.getElementById('websocket-mode') as HTMLInputElement,
            clearChat: document.getElementById('clear-chat') as HTMLButtonElement,
            exportChat: document.getElementById('export-chat') as HTMLButtonElement
        };

        this.init();
    }

    private init(): void {
        // Set up event listeners
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.elements.input.addEventListener('input', () => this.updateCharCount());
        this.elements.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.elements.clearChat.addEventListener('click', () => this.clearChat());
        this.elements.exportChat.addEventListener('click', () => this.exportChat());
        this.elements.streamMode.addEventListener('change', () => this.updateStreamMode());
        this.elements.websocketMode.addEventListener('change', () => this.toggleWebSocket());

        // Initialize WebSocket if enabled
        if (this.state.useWebSocket) {
            this.initWebSocket();
        }

        // Auto-resize textarea
        this.elements.input.addEventListener('input', () => {
            this.elements.input.style.height = 'auto';
            this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 150) + 'px';
        });

        console.log('Nanochat-Lite initialized');
    }

    private initWebSocket(): void {
        try {
            this.wsClient = new WebSocketClient('ws://localhost:8080/ws');

            this.wsClient.onMessage((data) => {
                this.handleWebSocketMessage(data);
            });

            this.wsClient.onConnect(() => {
                this.updateConnectionStatus(true);
            });

            this.wsClient.onDisconnect(() => {
                this.updateConnectionStatus(false);
            });

            this.wsClient.onError((error) => {
                console.error('WebSocket error:', error);
                this.addErrorMessage('WebSocket connection error. Falling back to HTTP.');
                this.state.useWebSocket = false;
                this.elements.websocketMode.checked = false;
            });
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.state.useWebSocket = false;
            this.elements.websocketMode.checked = false;
        }
    }

    private handleSubmit(e: Event): void {
        e.preventDefault();

        const content = this.elements.input.value.trim();
        if (!content || this.state.isStreaming) return;

        // Add user message
        const userMessage: Message = {
            id: this.generateId(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        this.addMessage(userMessage);
        this.elements.input.value = '';
        this.updateCharCount();
        this.elements.input.style.height = 'auto';

        // Send to backend
        if (this.state.useWebSocket && this.wsClient?.isConnected()) {
            this.sendViaWebSocket(content);
        } else {
            this.sendViaHTTP(content);
        }
    }

    private async sendViaHTTP(content: string): Promise<void> {
        this.state.isStreaming = true;
        this.elements.sendButton.disabled = true;

        // Add typing indicator
        const typingId = this.addTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: content,
                    stream: this.elements.streamMode.checked,
                    history: this.state.messages.slice(-10) // Last 10 messages for context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ChatResponse = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator(typingId);

            // Add assistant message
            const assistantMessage: Message = {
                id: this.generateId(),
                role: 'assistant',
                content: data.message,
                timestamp: Date.now(),
                tokens: data.tokens
            };

            this.addMessage(assistantMessage);
            this.state.totalTokens += data.tokens;
            this.updateStats();

        } catch (error) {
            console.error('HTTP request failed:', error);
            this.removeTypingIndicator(typingId);
            this.addErrorMessage('Failed to send message. Please try again.');
        } finally {
            this.state.isStreaming = false;
            this.elements.sendButton.disabled = false;
        }
    }

    private sendViaWebSocket(content: string): void {
        if (!this.wsClient) return;

        this.state.isStreaming = true;
        this.elements.sendButton.disabled = true;

        const typingId = this.addTypingIndicator();

        this.wsClient.send({
            type: 'chat',
            message: content,
            stream: this.elements.streamMode.checked
        });

        // Store typing indicator ID for later removal
        (this.wsClient as any).currentTypingId = typingId;
    }

    private handleWebSocketMessage(data: any): void {
        const typingId = (this.wsClient as any).currentTypingId;

        if (data.type === 'chat_response') {
            this.removeTypingIndicator(typingId);

            const assistantMessage: Message = {
                id: this.generateId(),
                role: 'assistant',
                content: data.message,
                timestamp: Date.now(),
                tokens: data.tokens
            };

            this.addMessage(assistantMessage);
            this.state.totalTokens += data.tokens;
            this.updateStats();

            this.state.isStreaming = false;
            this.elements.sendButton.disabled = false;
        } else if (data.type === 'error') {
            this.removeTypingIndicator(typingId);
            this.addErrorMessage(data.message);
            this.state.isStreaming = false;
            this.elements.sendButton.disabled = false;
        }
    }

    private addMessage(message: Message): void {
        this.state.messages.push(message);
        this.state.messageCount++;
        this.renderMessage(message);
        this.updateStats();
        this.scrollToBottom();
    }

    private renderMessage(message: Message): void {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        messageEl.dataset.id = message.id;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = this.getAvatarEmoji(message.role);

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatMessageContent(message.content);

        if (message.tokens) {
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            meta.textContent = `${message.tokens} tokens`;
            content.appendChild(meta);
        }

        messageEl.appendChild(avatar);
        messageEl.appendChild(content);

        this.elements.messages.appendChild(messageEl);
    }

    private addTypingIndicator(): string {
        const id = this.generateId();
        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';
        messageEl.dataset.id = id;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';

        content.appendChild(indicator);
        messageEl.appendChild(avatar);
        messageEl.appendChild(content);

        this.elements.messages.appendChild(messageEl);
        this.scrollToBottom();

        return id;
    }

    private removeTypingIndicator(id: string): void {
        const element = this.elements.messages.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.remove();
        }
    }

    private addErrorMessage(content: string): void {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = content;
        this.elements.messages.appendChild(errorEl);
        this.scrollToBottom();

        // Remove after 5 seconds
        setTimeout(() => errorEl.remove(), 5000);
    }

    private formatMessageContent(content: string): string {
        // Simple markdown-like formatting
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');

        // Wrap in paragraphs
        return `<p>${formatted}</p>`;
    }

    private getAvatarEmoji(role: string): string {
        const avatars = {
            user: '👤',
            assistant: '🤖',
            system: 'ℹ️'
        };
        return avatars[role as keyof typeof avatars] || '❓';
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.elements.form.dispatchEvent(new Event('submit'));
        }
    }

    private updateCharCount(): void {
        const length = this.elements.input.value.length;
        const maxLength = 500;
        this.elements.charCount.textContent = `${length} / ${maxLength}`;

        if (length > maxLength) {
            this.elements.input.value = this.elements.input.value.substring(0, maxLength);
            this.updateCharCount();
        }
    }

    private updateStats(): void {
        this.elements.tokenCount.textContent = `Tokens: ${this.state.totalTokens}`;
        this.elements.messageCount.textContent = `Messages: ${this.state.messageCount}`;
    }

    private updateConnectionStatus(connected: boolean): void {
        if (connected) {
            this.elements.connectionStatus.textContent = '⚡ Connected';
            this.elements.connectionStatus.className = 'stat connected';
        } else {
            this.elements.connectionStatus.textContent = '⚠ Disconnected';
            this.elements.connectionStatus.className = 'stat disconnected';
        }
    }

    private updateStreamMode(): void {
        console.log('Stream mode:', this.elements.streamMode.checked);
    }

    private toggleWebSocket(): void {
        this.state.useWebSocket = this.elements.websocketMode.checked;

        if (this.state.useWebSocket && !this.wsClient) {
            this.initWebSocket();
        } else if (!this.state.useWebSocket && this.wsClient) {
            this.wsClient.disconnect();
            this.wsClient = null;
            this.updateConnectionStatus(false);
        }
    }

    private clearChat(): void {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.state.messages = [];
            this.state.messageCount = 0;
            this.state.totalTokens = 0;

            // Keep system message
            this.elements.messages.innerHTML = this.elements.messages.querySelector('.message.system')?.outerHTML || '';

            this.updateStats();
        }
    }

    private exportChat(): void {
        const exportData = {
            messages: this.state.messages,
            stats: {
                totalTokens: this.state.totalTokens,
                messageCount: this.state.messageCount
            },
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nanochat-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    private scrollToBottom(): void {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    private generateId(): string {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new NanochatApp());
} else {
    new NanochatApp();
}

// Export for debugging
(window as any).nanochat = NanochatApp;
