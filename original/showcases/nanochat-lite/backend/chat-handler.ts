/**
 * Chat Handler for Nanochat-Lite
 *
 * Orchestrates the chat pipeline:
 * 1. Receives user messages
 * 2. Tokenizes input
 * 3. Manages conversation context
 * 4. Generates responses
 * 5. Handles errors and edge cases
 */

import { getTokenizer, type BPETokenizer } from './tokenizer';
import { getGenerator, type ResponseGenerator, type Message } from './response-generator';

export interface ChatRequest {
    message: string;
    stream?: boolean;
    history?: Message[];
    userId?: string;
    sessionId?: string;
}

export interface ChatResponse {
    message: string;
    tokens: number;
    processingTime: number;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface ChatSession {
    id: string;
    userId: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

export class ChatHandler {
    private tokenizer: BPETokenizer;
    private generator: ResponseGenerator;
    private sessions: Map<string, ChatSession>;
    private maxHistoryLength: number = 20;
    private maxMessageLength: number = 2000;

    constructor() {
        this.tokenizer = getTokenizer();
        this.generator = getGenerator();
        this.sessions = new Map();
    }

    /**
     * Handle incoming chat request
     */
    public async handleChat(request: ChatRequest): Promise<ChatResponse> {
        const startTime = Date.now();

        // Validate input
        this.validateRequest(request);

        // Get or create session
        const session = this.getOrCreateSession(request.sessionId, request.userId);

        // Add user message to history
        const userMessage: Message = {
            role: 'user',
            content: request.message
        };

        session.messages.push(userMessage);
        session.updatedAt = Date.now();

        // Tokenize input
        const promptTokens = this.tokenizer.countTokens(request.message);

        // Generate response
        const response = await this.generator.generate(
            request.message,
            this.getRecentHistory(session)
        );

        // Add assistant message to history
        const assistantMessage: Message = {
            role: 'assistant',
            content: response.message
        };

        session.messages.push(assistantMessage);

        // Trim history if needed
        this.trimHistory(session);

        // Calculate tokens
        const completionTokens = response.tokens;
        const totalTokens = promptTokens + completionTokens;

        const processingTime = Date.now() - startTime;

        return {
            message: response.message,
            tokens: completionTokens,
            processingTime,
            model: response.metadata.model,
            usage: {
                promptTokens,
                completionTokens,
                totalTokens
            }
        };
    }

    /**
     * Handle streaming chat request
     */
    public async *handleChatStream(request: ChatRequest): AsyncGenerator<string> {
        this.validateRequest(request);

        const session = this.getOrCreateSession(request.sessionId, request.userId);

        const userMessage: Message = {
            role: 'user',
            content: request.message
        };

        session.messages.push(userMessage);
        session.updatedAt = Date.now();

        const streamGenerator = this.generator.generateStream(
            request.message,
            this.getRecentHistory(session)
        );

        let fullResponse = '';

        for await (const chunk of streamGenerator) {
            fullResponse += chunk;
            yield chunk;
        }

        // Add complete response to history
        const assistantMessage: Message = {
            role: 'assistant',
            content: fullResponse.trim()
        };

        session.messages.push(assistantMessage);
        this.trimHistory(session);
    }

    /**
     * Validate chat request
     */
    private validateRequest(request: ChatRequest): void {
        if (!request.message || typeof request.message !== 'string') {
            throw new Error('Message is required and must be a string');
        }

        if (request.message.length === 0) {
            throw new Error('Message cannot be empty');
        }

        if (request.message.length > this.maxMessageLength) {
            throw new Error(`Message exceeds maximum length of ${this.maxMessageLength} characters`);
        }

        // Sanitize message
        request.message = request.message.trim();
    }

    /**
     * Get or create chat session
     */
    private getOrCreateSession(sessionId?: string, userId?: string): ChatSession {
        const id = sessionId || this.generateSessionId();

        if (this.sessions.has(id)) {
            return this.sessions.get(id)!;
        }

        const session: ChatSession = {
            id,
            userId: userId || 'anonymous',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.sessions.set(id, session);
        return session;
    }

    /**
     * Get recent conversation history
     */
    private getRecentHistory(session: ChatSession): Message[] {
        // Return last N messages for context
        const historyLength = Math.min(this.maxHistoryLength, session.messages.length);
        return session.messages.slice(-historyLength);
    }

    /**
     * Trim session history to prevent memory growth
     */
    private trimHistory(session: ChatSession): void {
        if (session.messages.length > this.maxHistoryLength * 2) {
            // Keep recent messages, discard old ones
            session.messages = session.messages.slice(-this.maxHistoryLength);
        }
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get session by ID
     */
    public getSession(sessionId: string): ChatSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Delete session
     */
    public deleteSession(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    /**
     * Clear all sessions
     */
    public clearAllSessions(): void {
        this.sessions.clear();
    }

    /**
     * Get session count
     */
    public getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Get all session IDs
     */
    public getSessionIds(): string[] {
        return Array.from(this.sessions.keys());
    }

    /**
     * Export session data
     */
    public exportSession(sessionId: string): ChatSession | null {
        const session = this.sessions.get(sessionId);
        return session ? { ...session } : null;
    }

    /**
     * Get statistics
     */
    public getStats(): {
        activeSessions: number;
        totalMessages: number;
        averageMessagesPerSession: number;
    } {
        const sessions = Array.from(this.sessions.values());
        const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);

        return {
            activeSessions: sessions.length,
            totalMessages,
            averageMessagesPerSession: sessions.length > 0
                ? totalMessages / sessions.length
                : 0
        };
    }

    /**
     * Clean up old sessions
     */
    public cleanupOldSessions(maxAgeMs: number = 3600000): number {
        const now = Date.now();
        let removed = 0;

        for (const [id, session] of this.sessions) {
            if (now - session.updatedAt > maxAgeMs) {
                this.sessions.delete(id);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Set max history length
     */
    public setMaxHistoryLength(length: number): void {
        this.maxHistoryLength = Math.max(1, length);
    }

    /**
     * Set max message length
     */
    public setMaxMessageLength(length: number): void {
        this.maxMessageLength = Math.max(1, length);
    }

    /**
     * Get tokenizer instance
     */
    public getTokenizer(): BPETokenizer {
        return this.tokenizer;
    }

    /**
     * Get generator instance
     */
    public getGenerator(): ResponseGenerator {
        return this.generator;
    }
}

/**
 * Singleton instance
 */
let defaultHandler: ChatHandler | null = null;

export function getChatHandler(): ChatHandler {
    if (!defaultHandler) {
        defaultHandler = new ChatHandler();
    }
    return defaultHandler;
}
