/**
 * SyncServer - WebSocket-based sync server for ElideDB
 * Handles synchronization between multiple clients
 */

import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  SyncMessage,
  Change,
  VectorClock,
  Timestamp
} from '../types';
import { ServerStorage } from './storage';
import { AuthManager } from './auth';

export interface SyncServerConfig {
  port: number;
  storage: ServerStorage;
  auth?: AuthManager;
  heartbeatInterval?: number;
}

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  vectorClock: VectorClock;
  lastSyncTime: Timestamp;
  alive: boolean;
}

export class SyncServer {
  private config: SyncServerConfig;
  private server: http.Server;
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: SyncServerConfig) {
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      ...config
    };

    // Create HTTP server
    this.server = http.createServer();

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });

    this.setupWebSocketHandlers();
  }

  /**
   * Start the sync server
   */
  async start(): Promise<void> {
    await this.config.storage.init();

    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        console.log(`ElideDB sync server listening on port ${this.config.port}`);
        this.startHeartbeat();
        resolve();
      });
    });
  }

  /**
   * Stop the sync server
   */
  async stop(): Promise<void> {
    this.stopHeartbeat();

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }

    // Close WebSocket server
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log('Sync server stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
      console.log('New client connection');

      // Authenticate if auth manager is configured
      let userId: string | undefined;
      if (this.config.auth) {
        const token = this.extractToken(req);
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        const authResult = await this.config.auth.verify(token);
        if (!authResult.valid) {
          ws.close(1008, 'Invalid authentication token');
          return;
        }

        userId = authResult.userId;
      }

      // Create client record
      const clientId = this.generateClientId();
      const client: ConnectedClient = {
        id: clientId,
        ws,
        userId,
        vectorClock: { [clientId]: 0 },
        lastSyncTime: 0,
        alive: true
      };

      this.clients.set(clientId, client);

      // Handle messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as SyncMessage;
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(clientId, 'Failed to process message');
        }
      });

      // Handle pong (heartbeat response)
      ws.on('pong', () => {
        client.alive = true;
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`Client ${clientId} error:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendMessage(clientId, {
        type: 'ack',
        clientId: clientId,
        vectorClock: client.vectorClock
      });
    });
  }

  /**
   * Handle incoming sync messages
   */
  private async handleMessage(clientId: string, message: SyncMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Received ${message.type} from ${clientId}`);

    switch (message.type) {
      case 'push':
        await this.handlePush(client, message);
        break;

      case 'pull':
        await this.handlePull(client, message);
        break;

      case 'sync':
        await this.handleSync(client, message);
        break;
    }
  }

  /**
   * Handle push of client changes to server
   */
  private async handlePush(
    client: ConnectedClient,
    message: SyncMessage
  ): Promise<void> {
    if (!message.changes || message.changes.length === 0) {
      this.sendAck(client.id);
      return;
    }

    console.log(`Storing ${message.changes.length} changes from ${client.id}`);

    // Store changes in server storage
    await this.config.storage.storeChanges(message.changes);

    // Update client's vector clock
    if (message.vectorClock) {
      client.vectorClock = this.mergeVectorClocks(
        client.vectorClock,
        message.vectorClock
      );
    }

    // Send acknowledgment
    this.sendAck(client.id);

    // Broadcast changes to other clients
    await this.broadcastChanges(client.id, message.changes);
  }

  /**
   * Handle pull of server changes by client
   */
  private async handlePull(
    client: ConnectedClient,
    message: SyncMessage
  ): Promise<void> {
    const since = message.lastSyncTime || 0;

    console.log(`Client ${client.id} pulling changes since ${since}`);

    // Get changes from server storage
    const changes = await this.config.storage.getChanges(since);

    // Filter out changes that originated from this client
    const filteredChanges = changes.filter(
      change => change.clientId !== client.id
    );

    console.log(`Sending ${filteredChanges.length} changes to ${client.id}`);

    // Send changes to client
    this.sendMessage(client.id, {
      type: 'sync',
      clientId: 'server',
      changes: filteredChanges,
      vectorClock: this.getServerVectorClock()
    });

    // Update client's last sync time
    client.lastSyncTime = Date.now();
  }

  /**
   * Handle bidirectional sync
   */
  private async handleSync(
    client: ConnectedClient,
    message: SyncMessage
  ): Promise<void> {
    // First, handle push if there are changes
    if (message.changes && message.changes.length > 0) {
      await this.handlePush(client, message);
    }

    // Then, handle pull
    await this.handlePull(client, message);
  }

  /**
   * Broadcast changes to all other connected clients
   */
  private async broadcastChanges(
    originClientId: string,
    changes: Change[]
  ): Promise<void> {
    const message: SyncMessage = {
      type: 'push',
      clientId: 'server',
      changes
    };

    for (const [clientId, client] of this.clients) {
      // Don't send back to origin client
      if (clientId === originClientId) continue;

      // Only send if client is authenticated for these changes
      // (in a real implementation, you'd check permissions here)
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error broadcasting to ${clientId}:`, error);
        }
      }
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendMessage(clientId: string, message: SyncMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to ${clientId}:`, error);
    }
  }

  /**
   * Send acknowledgment to client
   */
  private sendAck(clientId: string): void {
    this.sendMessage(clientId, {
      type: 'ack',
      clientId: 'server',
      vectorClock: this.getServerVectorClock()
    });
  }

  /**
   * Send error to client
   */
  private sendError(clientId: string, error: string): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify({ type: 'error', error }));
    } catch (err) {
      console.error(`Error sending error to ${clientId}:`, err);
    }
  }

  /**
   * Merge vector clocks
   */
  private mergeVectorClocks(clock1: VectorClock, clock2: VectorClock): VectorClock {
    const merged: VectorClock = { ...clock1 };

    for (const [clientId, version] of Object.entries(clock2)) {
      if (!merged[clientId] || merged[clientId] < version) {
        merged[clientId] = version;
      }
    }

    return merged;
  }

  /**
   * Get server's global vector clock
   */
  private getServerVectorClock(): VectorClock {
    const clock: VectorClock = { server: 0 };

    for (const client of this.clients.values()) {
      Object.assign(clock, client.vectorClock);
    }

    return clock;
  }

  /**
   * Extract authentication token from request
   */
  private extractToken(req: http.IncomingMessage): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start heartbeat to detect disconnected clients
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients) {
        if (!client.alive) {
          console.log(`Client ${clientId} did not respond to heartbeat, terminating`);
          client.ws.terminate();
          this.clients.delete(clientId);
          continue;
        }

        client.alive = false;
        client.ws.ping();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connectedClients: number;
    totalChanges: number;
    uptime: number;
  } {
    return {
      connectedClients: this.clients.size,
      totalChanges: 0, // Would come from storage
      uptime: process.uptime()
    };
  }

  /**
   * Get connected clients
   */
  getConnectedClients(): Array<{ id: string; userId?: string; lastSyncTime: Timestamp }> {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      userId: client.userId,
      lastSyncTime: client.lastSyncTime
    }));
  }
}

/**
 * Main entry point for running the sync server
 */
if (require.main === module) {
  const storage = new ServerStorage('./data/elidedb-server.db');
  const server = new SyncServer({
    port: 3000,
    storage
  });

  server.start().then(() => {
    console.log('Sync server started successfully');
  }).catch(err => {
    console.error('Failed to start sync server:', err);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}
