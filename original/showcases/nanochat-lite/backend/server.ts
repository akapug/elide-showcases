/**
 * Nanochat-Lite HTTP Server
 *
 * Main server entry point. Handles:
 * - HTTP API endpoints for chat
 * - WebSocket connections for real-time chat
 * - Static file serving for frontend
 * - Health checks and monitoring
 *
 * This demonstrates Elide's capability to run a full web application
 * with both TypeScript and Python components in a single runtime.
 */

import { getChatHandler, type ChatRequest } from './chat-handler';

// Server configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize chat handler
const chatHandler = getChatHandler();

/**
 * Main server class
 */
class NanochatServer {
    private startTime: number;
    private requestCount: number = 0;
    private errorCount: number = 0;

    constructor() {
        this.startTime = Date.now();
    }

    /**
     * Start the server
     */
    public async start(): Promise<void> {
        console.log('='.repeat(60));
        console.log('Nanochat-Lite Server');
        console.log('='.repeat(60));
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Startup time: ${Date.now() - this.startTime}ms`);
        console.log(`Ready at: http://${HOST}:${PORT}`);
        console.log('='.repeat(60));

        // In a real Elide implementation, this would use Elide's HTTP server
        // For now, we demonstrate the structure
        this.setupRoutes();
    }

    /**
     * Setup HTTP routes
     */
    private setupRoutes(): void {
        console.log('Routes configured:');
        console.log('  POST   /api/chat          - Send chat message');
        console.log('  GET    /api/health        - Health check');
        console.log('  GET    /api/stats         - Server statistics');
        console.log('  GET    /api/sessions      - List active sessions');
        console.log('  DELETE /api/sessions/:id  - Delete session');
        console.log('  GET    /ws                - WebSocket endpoint');
        console.log('  GET    /*                 - Static files');
    }

    /**
     * Handle chat API request
     */
    public async handleChatRequest(request: any): Promise<any> {
        this.requestCount++;

        try {
            // Parse request body
            const body: ChatRequest = typeof request.body === 'string'
                ? JSON.parse(request.body)
                : request.body;

            // Validate request
            if (!body.message) {
                return this.errorResponse(400, 'Message is required');
            }

            // Handle chat
            const response = await chatHandler.handleChat({
                message: body.message,
                stream: body.stream || false,
                history: body.history || [],
                sessionId: request.headers['x-session-id'] || body.sessionId,
                userId: request.headers['x-user-id'] || body.userId
            });

            return this.successResponse(response);

        } catch (error) {
            this.errorCount++;
            console.error('Chat request error:', error);

            return this.errorResponse(
                500,
                error instanceof Error ? error.message : 'Internal server error'
            );
        }
    }

    /**
     * Handle health check
     */
    public handleHealthCheck(): any {
        const uptime = Date.now() - this.startTime;
        const stats = chatHandler.getStats();

        return this.successResponse({
            status: 'healthy',
            uptime,
            uptimeHuman: this.formatUptime(uptime),
            requests: this.requestCount,
            errors: this.errorCount,
            sessions: stats.activeSessions,
            messages: stats.totalMessages
        });
    }

    /**
     * Handle stats request
     */
    public handleStatsRequest(): any {
        const chatStats = chatHandler.getStats();
        const generatorStats = chatHandler.getGenerator().getStats();
        const tokenizerStats = {
            vocabSize: chatHandler.getTokenizer().getVocabSize()
        };

        return this.successResponse({
            server: {
                uptime: Date.now() - this.startTime,
                requests: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0
                    ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%'
                    : '0%'
            },
            chat: chatStats,
            generator: generatorStats,
            tokenizer: tokenizerStats
        });
    }

    /**
     * Handle sessions list request
     */
    public handleSessionsRequest(): any {
        const sessionIds = chatHandler.getSessionIds();
        const sessions = sessionIds.map(id => {
            const session = chatHandler.getSession(id);
            return session ? {
                id: session.id,
                userId: session.userId,
                messageCount: session.messages.length,
                createdAt: new Date(session.createdAt).toISOString(),
                updatedAt: new Date(session.updatedAt).toISOString()
            } : null;
        }).filter(Boolean);

        return this.successResponse({
            count: sessions.length,
            sessions
        });
    }

    /**
     * Handle session deletion
     */
    public handleDeleteSession(sessionId: string): any {
        const deleted = chatHandler.deleteSession(sessionId);

        if (deleted) {
            return this.successResponse({ message: 'Session deleted successfully' });
        } else {
            return this.errorResponse(404, 'Session not found');
        }
    }

    /**
     * Handle WebSocket connection
     */
    public handleWebSocketConnection(ws: any): void {
        console.log('WebSocket client connected');

        ws.on('message', async (data: string) => {
            try {
                const message = JSON.parse(data);

                if (message.type === 'chat') {
                    const response = await chatHandler.handleChat({
                        message: message.message,
                        stream: message.stream || false,
                        sessionId: message.sessionId
                    });

                    ws.send(JSON.stringify({
                        type: 'chat_response',
                        ...response
                    }));
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
        });

        ws.on('close', () => {
            console.log('WebSocket client disconnected');
        });

        ws.on('error', (error: Error) => {
            console.error('WebSocket error:', error);
        });
    }

    /**
     * Periodic cleanup task
     */
    public startCleanupTask(): void {
        setInterval(() => {
            const removed = chatHandler.cleanupOldSessions(3600000); // 1 hour
            if (removed > 0) {
                console.log(`Cleaned up ${removed} old sessions`);
            }
        }, 600000); // Run every 10 minutes
    }

    /**
     * Create success response
     */
    private successResponse(data: any): any {
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Response-Time': Date.now() - this.startTime
            },
            body: JSON.stringify({
                success: true,
                data
            })
        };
    }

    /**
     * Create error response
     */
    private errorResponse(status: number, message: string): any {
        return {
            status,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: {
                    message,
                    status
                }
            })
        };
    }

    /**
     * Format uptime in human-readable format
     */
    private formatUptime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Shutdown gracefully
     */
    public async shutdown(): Promise<void> {
        console.log('\nShutting down server...');
        console.log('Final statistics:');
        console.log(`  Total requests: ${this.requestCount}`);
        console.log(`  Total errors: ${this.errorCount}`);
        console.log(`  Uptime: ${this.formatUptime(Date.now() - this.startTime)}`);

        const stats = chatHandler.getStats();
        console.log(`  Active sessions: ${stats.activeSessions}`);
        console.log(`  Total messages: ${stats.totalMessages}`);

        process.exit(0);
    }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    const server = new NanochatServer();

    // Handle shutdown signals
    process.on('SIGINT', () => server.shutdown());
    process.on('SIGTERM', () => server.shutdown());

    // Start cleanup task
    server.startCleanupTask();

    // Start server
    await server.start();

    // For demonstration, log example requests
    console.log('\nExample API calls:');
    console.log('curl -X POST http://localhost:8080/api/chat \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"message": "Hello, Nanochat!"}\'');
    console.log('');
    console.log('curl http://localhost:8080/api/health');
    console.log('');
}

// Export server class and functions
export { NanochatServer, main };

// Run server if this is the main module
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
