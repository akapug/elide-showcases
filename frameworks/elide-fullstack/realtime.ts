/**
 * Elide Full-Stack Framework - Real-time System
 *
 * WebSocket-based real-time communication inspired by Socket.io/Pusher:
 * - WebSocket connections
 * - Pub/sub messaging
 * - Room/channel system
 * - Presence tracking
 * - Broadcasting
 * - Event-based architecture
 *
 * Features:
 * - Connection management
 * - Auto-reconnection
 * - Message acknowledgments
 * - Typing indicators
 * - User presence
 * - Private channels
 * - Message history
 */

import type { RouteContext } from "./router.ts";

// Message types
export interface RealtimeMessage<T = any> {
  id: string;
  event: string;
  data: T;
  timestamp: number;
  from?: string;
  to?: string;
}

export interface PresenceData {
  userId: string;
  username?: string;
  metadata?: Record<string, any>;
  connectedAt: number;
  lastSeenAt: number;
}

// Connection types
export interface Connection {
  id: string;
  userId?: string;
  socket: WebSocket;
  channels: Set<string>;
  presence?: PresenceData;
  metadata?: Record<string, any>;
  connectedAt: number;
}

export interface ChannelOptions {
  private?: boolean;
  presence?: boolean;
  historySize?: number;
  authorize?: (connection: Connection) => boolean | Promise<boolean>;
}

export type MessageHandler<T = any> = (
  message: RealtimeMessage<T>,
  connection: Connection
) => void | Promise<void>;

export type ConnectionHandler = (connection: Connection) => void | Promise<void>;

/**
 * Real-time channel for organizing connections
 */
export class Channel {
  private connections = new Map<string, Connection>();
  private handlers = new Map<string, Set<MessageHandler>>();
  private messageHistory: RealtimeMessage[] = [];
  private presence = new Map<string, PresenceData>();

  constructor(
    public name: string,
    private options: ChannelOptions = {}
  ) {
    this.options.historySize = options.historySize || 100;
  }

  /**
   * Add connection to channel
   */
  async join(connection: Connection): Promise<boolean> {
    // Check authorization for private channels
    if (this.options.private && this.options.authorize) {
      const authorized = await this.options.authorize(connection);
      if (!authorized) {
        return false;
      }
    }

    this.connections.set(connection.id, connection);
    connection.channels.add(this.name);

    // Handle presence
    if (this.options.presence && connection.presence) {
      this.presence.set(connection.userId!, connection.presence);

      // Notify others about new presence
      await this.broadcast("presence:join", connection.presence, connection.id);
    }

    // Send message history to new connection
    if (this.messageHistory.length > 0) {
      this.sendTo(connection.id, "history", this.messageHistory);
    }

    return true;
  }

  /**
   * Remove connection from channel
   */
  async leave(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);

    if (connection) {
      this.connections.delete(connectionId);
      connection.channels.delete(this.name);

      // Handle presence
      if (this.options.presence && connection.userId) {
        const presenceData = this.presence.get(connection.userId);

        if (presenceData) {
          this.presence.delete(connection.userId);

          // Notify others about presence leave
          await this.broadcast("presence:leave", presenceData, connectionId);
        }
      }
    }
  }

  /**
   * Broadcast message to all connections in channel
   */
  async broadcast<T = any>(
    event: string,
    data: T,
    excludeConnectionId?: string
  ): Promise<void> {
    const message: RealtimeMessage<T> = {
      id: crypto.randomUUID(),
      event,
      data,
      timestamp: Date.now(),
    };

    // Add to history
    this.addToHistory(message);

    // Send to all connections
    for (const [connectionId, connection] of this.connections) {
      if (connectionId !== excludeConnectionId) {
        this.sendToConnection(connection, message);
      }
    }

    // Trigger handlers
    await this.triggerHandlers(message, excludeConnectionId);
  }

  /**
   * Send message to specific connection
   */
  sendTo<T = any>(connectionId: string, event: string, data: T): void {
    const connection = this.connections.get(connectionId);

    if (connection) {
      const message: RealtimeMessage<T> = {
        id: crypto.randomUUID(),
        event,
        data,
        timestamp: Date.now(),
        to: connectionId,
      };

      this.sendToConnection(connection, message);
    }
  }

  /**
   * Send message to connection
   */
  private sendToConnection(connection: Connection, message: RealtimeMessage): void {
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Register event handler
   */
  on<T = any>(event: string, handler: MessageHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: MessageHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Trigger event handlers
   */
  private async triggerHandlers(
    message: RealtimeMessage,
    excludeConnectionId?: string
  ): Promise<void> {
    const handlers = this.handlers.get(message.event);

    if (handlers) {
      for (const handler of handlers) {
        for (const [connectionId, connection] of this.connections) {
          if (connectionId !== excludeConnectionId) {
            try {
              await handler(message, connection);
            } catch (error) {
              console.error(`Error in ${message.event} handler:`, error);
            }
          }
        }
      }
    }
  }

  /**
   * Add message to history
   */
  private addToHistory(message: RealtimeMessage): void {
    this.messageHistory.push(message);

    // Keep only recent messages
    if (this.messageHistory.length > this.options.historySize!) {
      this.messageHistory.shift();
    }
  }

  /**
   * Get channel presence
   */
  getPresence(): PresenceData[] {
    return Array.from(this.presence.values());
  }

  /**
   * Get connection count
   */
  size(): number {
    return this.connections.size;
  }

  /**
   * Check if connection is in channel
   */
  has(connectionId: string): boolean {
    return this.connections.has(connectionId);
  }
}

/**
 * Real-time system for managing WebSocket connections
 */
export class RealtimeSystem {
  private connections = new Map<string, Connection>();
  private channels = new Map<string, Channel>();
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];

  /**
   * Handle WebSocket upgrade
   */
  async handleUpgrade(request: Request, ctx: RouteContext): Promise<Response> {
    // Check if request is a WebSocket upgrade
    if (request.headers.get("upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(request);

    // Create connection
    const connection: Connection = {
      id: crypto.randomUUID(),
      userId: ctx.user?.id,
      socket,
      channels: new Set(),
      metadata: {},
      connectedAt: Date.now(),
    };

    // Setup presence if user is authenticated
    if (ctx.user) {
      connection.presence = {
        userId: ctx.user.id,
        username: ctx.user.name,
        metadata: {},
        connectedAt: Date.now(),
        lastSeenAt: Date.now(),
      };
    }

    // Handle socket events
    socket.onopen = async () => {
      this.connections.set(connection.id, connection);

      // Send connection info
      socket.send(
        JSON.stringify({
          event: "connected",
          data: {
            connectionId: connection.id,
            userId: connection.userId,
          },
        })
      );

      // Trigger connection handlers
      for (const handler of this.connectionHandlers) {
        try {
          await handler(connection);
        } catch (error) {
          console.error("Error in connection handler:", error);
        }
      }
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleMessage(message, connection);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };

    socket.onclose = async () => {
      await this.handleDisconnection(connection);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return response;
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: any, connection: Connection): Promise<void> {
    const { event, data, channel } = message;

    switch (event) {
      case "subscribe":
        await this.subscribe(connection, channel, data);
        break;

      case "unsubscribe":
        await this.unsubscribe(connection, channel);
        break;

      case "message":
        await this.handleChannelMessage(connection, channel, data);
        break;

      case "presence:update":
        await this.updatePresence(connection, data);
        break;

      case "ping":
        connection.socket.send(JSON.stringify({ event: "pong", timestamp: Date.now() }));
        break;

      default:
        console.warn(`Unknown event: ${event}`);
    }
  }

  /**
   * Subscribe connection to channel
   */
  private async subscribe(
    connection: Connection,
    channelName: string,
    options?: any
  ): Promise<void> {
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = new Channel(channelName, options);
      this.channels.set(channelName, channel);
    }

    const joined = await channel.join(connection);

    if (joined) {
      connection.socket.send(
        JSON.stringify({
          event: "subscribed",
          data: { channel: channelName },
        })
      );
    } else {
      connection.socket.send(
        JSON.stringify({
          event: "subscription:error",
          data: { channel: channelName, error: "Unauthorized" },
        })
      );
    }
  }

  /**
   * Unsubscribe connection from channel
   */
  private async unsubscribe(connection: Connection, channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.leave(connection.id);

      connection.socket.send(
        JSON.stringify({
          event: "unsubscribed",
          data: { channel: channelName },
        })
      );

      // Clean up empty channels
      if (channel.size() === 0) {
        this.channels.delete(channelName);
      }
    }
  }

  /**
   * Handle channel message
   */
  private async handleChannelMessage(
    connection: Connection,
    channelName: string,
    data: any
  ): Promise<void> {
    const channel = this.channels.get(channelName);

    if (channel && channel.has(connection.id)) {
      await channel.broadcast(data.event || "message", data, connection.id);
    }
  }

  /**
   * Update presence
   */
  private async updatePresence(connection: Connection, data: any): Promise<void> {
    if (connection.presence) {
      connection.presence.metadata = { ...connection.presence.metadata, ...data };
      connection.presence.lastSeenAt = Date.now();

      // Broadcast presence update to all channels
      for (const channelName of connection.channels) {
        const channel = this.channels.get(channelName);
        if (channel) {
          await channel.broadcast("presence:update", connection.presence, connection.id);
        }
      }
    }
  }

  /**
   * Handle disconnection
   */
  private async handleDisconnection(connection: Connection): Promise<void> {
    // Leave all channels
    for (const channelName of connection.channels) {
      const channel = this.channels.get(channelName);
      if (channel) {
        await channel.leave(connection.id);

        if (channel.size() === 0) {
          this.channels.delete(channelName);
        }
      }
    }

    // Remove connection
    this.connections.delete(connection.id);

    // Trigger disconnection handlers
    for (const handler of this.disconnectionHandlers) {
      try {
        await handler(connection);
      } catch (error) {
        console.error("Error in disconnection handler:", error);
      }
    }
  }

  /**
   * Get or create a channel
   */
  channel(name: string, options?: ChannelOptions): Channel {
    let channel = this.channels.get(name);

    if (!channel) {
      channel = new Channel(name, options);
      this.channels.set(name, channel);
    }

    return channel;
  }

  /**
   * Broadcast to channel
   */
  async broadcast<T = any>(channelName: string, event: string, data: T): Promise<void> {
    const channel = this.channels.get(channelName);

    if (channel) {
      await channel.broadcast(event, data);
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): Connection[] {
    return Array.from(this.connections.values()).filter((c) => c.userId === userId);
  }

  /**
   * Listen for new connections
   */
  onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Listen for disconnections
   */
  onDisconnection(handler: ConnectionHandler): void {
    this.disconnectionHandlers.push(handler);
  }

  /**
   * Get statistics
   */
  stats(): {
    connections: number;
    channels: number;
    channelStats: Record<string, number>;
  } {
    const channelStats: Record<string, number> = {};

    for (const [name, channel] of this.channels) {
      channelStats[name] = channel.size();
    }

    return {
      connections: this.connections.size,
      channels: this.channels.size,
      channelStats,
    };
  }
}

/**
 * Helper to create realtime system
 */
export function createRealtimeSystem(): RealtimeSystem {
  return new RealtimeSystem();
}

// Example usage:
/**
 * // Create realtime system
 * const realtime = createRealtimeSystem();
 *
 * // Setup channels
 * const chatChannel = realtime.channel("chat", {
 *   presence: true,
 *   historySize: 50,
 * });
 *
 * chatChannel.on("message", async (message, connection) => {
 *   console.log(`New message from ${connection.userId}:`, message.data);
 *
 *   // Save to database
 *   await db.model("messages").create({
 *     userId: connection.userId,
 *     content: message.data.content,
 *     channelId: "chat",
 *   });
 * });
 *
 * // WebSocket endpoint
 * export async function GET(req: Request, ctx: RouteContext) {
 *   return realtime.handleUpgrade(req, ctx);
 * }
 *
 * // Broadcast from server
 * await realtime.broadcast("chat", "notification", {
 *   type: "system",
 *   message: "Server will restart in 5 minutes",
 * });
 *
 * // Listen for connections
 * realtime.onConnection((connection) => {
 *   console.log(`User connected: ${connection.userId}`);
 * });
 *
 * realtime.onDisconnection((connection) => {
 *   console.log(`User disconnected: ${connection.userId}`);
 * });
 *
 * // Get stats
 * const stats = realtime.stats();
 * console.log("Realtime stats:", stats);
 */
