/**
 * WebSocket Connection Manager
 *
 * Manages WebSocket connections for real-time data streaming.
 * Handles connection lifecycle, broadcasting, and connection pooling.
 */

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
  connectedAt: number;
  lastActivity: number;
}

export interface BroadcastMessage {
  type: string;
  channel: string;
  data: any;
  timestamp: number;
}

export class WebSocketManager {
  private clients = new Map<string, WebSocketClient>();
  private channels = new Map<string, Set<string>>();
  private messageQueue: BroadcastMessage[] = [];
  private stats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesTransferred: 0
  };

  constructor() {
    this.startHealthCheck();
    this.startMessageProcessor();
  }

  // Register new WebSocket connection
  register(socket: WebSocket, metadata: Record<string, any> = {}): string {
    const clientId = this.generateClientId();

    const client: WebSocketClient = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      metadata,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    };

    this.clients.set(clientId, client);
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    // Handle incoming messages
    socket.addEventListener('message', (event) => {
      this.handleMessage(clientId, event.data);
    });

    // Handle connection close
    socket.addEventListener('close', () => {
      this.unregister(clientId);
    });

    // Handle errors
    socket.addEventListener('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.unregister(clientId);
    });

    console.log(`WebSocket client ${clientId} connected (total: ${this.stats.activeConnections})`);

    return clientId;
  }

  // Unregister client
  unregister(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all channels
    for (const channel of client.subscriptions) {
      const subscribers = this.channels.get(channel);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.channels.delete(channel);
        }
      }
    }

    this.clients.delete(clientId);
    this.stats.activeConnections--;

    console.log(`WebSocket client ${clientId} disconnected (remaining: ${this.stats.activeConnections})`);
  }

  // Subscribe client to channel
  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(clientId);

    console.log(`Client ${clientId} subscribed to channel: ${channel}`);
  }

  // Unsubscribe client from channel
  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(channel);

    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }

    console.log(`Client ${clientId} unsubscribed from channel: ${channel}`);
  }

  // Send message to specific client
  send(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) return;

    try {
      const data = JSON.stringify(message);
      client.socket.send(data);
      client.lastActivity = Date.now();
      this.stats.messagesSent++;
      this.stats.bytesTransferred += data.length;
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
    }
  }

  // Broadcast message to channel
  broadcast(channel: string, message: any): void {
    const broadcastMsg: BroadcastMessage = {
      type: 'broadcast',
      channel,
      data: message,
      timestamp: Date.now()
    };

    this.messageQueue.push(broadcastMsg);
  }

  // Broadcast to all connected clients
  broadcastAll(message: any): void {
    for (const clientId of this.clients.keys()) {
      this.send(clientId, message);
    }
  }

  // Handle incoming message from client
  private handleMessage(clientId: string, data: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();
    this.stats.messagesReceived++;

    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
          this.subscribe(clientId, message.channel);
          this.send(clientId, {
            type: 'subscribed',
            channel: message.channel,
            success: true
          });
          break;

        case 'unsubscribe':
          this.unsubscribe(clientId, message.channel);
          this.send(clientId, {
            type: 'unsubscribed',
            channel: message.channel,
            success: true
          });
          break;

        case 'ping':
          this.send(clientId, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Failed to parse message from client ${clientId}:`, error);
    }
  }

  // Process message queue
  private startMessageProcessor(): void {
    setInterval(() => {
      if (this.messageQueue.length === 0) return;

      const batch = this.messageQueue.splice(0, 100); // Process in batches

      for (const msg of batch) {
        const subscribers = this.channels.get(msg.channel);
        if (!subscribers) continue;

        for (const clientId of subscribers) {
          this.send(clientId, msg.data);
        }
      }
    }, 10); // Process every 10ms for high throughput
  }

  // Health check and cleanup
  private startHealthCheck(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      for (const [clientId, client] of this.clients.entries()) {
        // Check for stale connections
        if (now - client.lastActivity > timeout) {
          console.log(`Client ${clientId} timed out`);
          client.socket.close();
          this.unregister(clientId);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Generate unique client ID
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get client info
  getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  // Get all clients
  getClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  // Get channel subscribers
  getSubscribers(channel: string): string[] {
    const subscribers = this.channels.get(channel);
    return subscribers ? Array.from(subscribers) : [];
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      channels: this.channels.size,
      queuedMessages: this.messageQueue.length
    };
  }
}
