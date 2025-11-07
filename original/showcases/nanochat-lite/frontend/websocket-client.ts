/**
 * WebSocket Client for Nanochat-Lite
 *
 * Handles real-time bidirectional communication with the backend server.
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Event-based API for easy integration
 */

type WebSocketMessage = {
    type: string;
    [key: string]: any;
};

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private maxReconnectDelay: number = 30000;
    private messageQueue: WebSocketMessage[] = [];
    private connected: boolean = false;

    // Event handlers
    private messageHandlers: MessageHandler[] = [];
    private connectHandlers: ConnectionHandler[] = [];
    private disconnectHandlers: ConnectionHandler[] = [];
    private errorHandlers: ErrorHandler[] = [];

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    /**
     * Establish WebSocket connection
     */
    private connect(): void {
        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;

                // Send queued messages
                this.flushMessageQueue();

                // Notify connect handlers
                this.connectHandlers.forEach(handler => handler());
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.messageHandlers.forEach(handler => handler(data));
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.connected = false;
                this.ws = null;

                // Notify disconnect handlers
                this.disconnectHandlers.forEach(handler => handler());

                // Attempt reconnection
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.errorHandlers.forEach(handler => handler(error));
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.attemptReconnect();
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Send message to server
     */
    public send(message: WebSocketMessage): void {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                this.queueMessage(message);
            }
        } else {
            this.queueMessage(message);
        }
    }

    /**
     * Queue message for later delivery
     */
    private queueMessage(message: WebSocketMessage): void {
        this.messageQueue.push(message);

        // Limit queue size
        if (this.messageQueue.length > 100) {
            this.messageQueue.shift();
        }
    }

    /**
     * Send all queued messages
     */
    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            if (message) {
                this.send(message);
            }
        }
    }

    /**
     * Register message handler
     */
    public onMessage(handler: MessageHandler): void {
        this.messageHandlers.push(handler);
    }

    /**
     * Register connect handler
     */
    public onConnect(handler: ConnectionHandler): void {
        this.connectHandlers.push(handler);
    }

    /**
     * Register disconnect handler
     */
    public onDisconnect(handler: ConnectionHandler): void {
        this.disconnectHandlers.push(handler);
    }

    /**
     * Register error handler
     */
    public onError(handler: ErrorHandler): void {
        this.errorHandlers.push(handler);
    }

    /**
     * Check if connected
     */
    public isConnected(): boolean {
        return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Disconnect and cleanup
     */
    public disconnect(): void {
        if (this.ws) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }

    /**
     * Get connection state
     */
    public getState(): string {
        if (!this.ws) return 'CLOSED';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.OPEN:
                return 'OPEN';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'CLOSED';
            default:
                return 'UNKNOWN';
        }
    }

    /**
     * Get queued message count
     */
    public getQueuedMessageCount(): number {
        return this.messageQueue.length;
    }

    /**
     * Clear message queue
     */
    public clearQueue(): void {
        this.messageQueue = [];
    }
}
