/**
 * WebSocket Proxy Module
 *
 * Provides WebSocket gateway functionality:
 * - WebSocket connection management
 * - Message routing and broadcasting
 * - Connection pooling
 * - Authentication for WebSocket connections
 * - Message transformation
 * - Pub/Sub support
 * - Room/channel management
 */

// ==================== Types & Interfaces ====================

export interface WebSocketConnection {
  id: string;
  socket: any; // WebSocket instance
  userId?: string;
  rooms: Set<string>;
  metadata: Record<string, any>;
  connectedAt: number;
  lastActivityAt: number;
}

export interface WebSocketMessage {
  type: 'message' | 'join' | 'leave' | 'broadcast' | 'ping' | 'pong';
  room?: string;
  data: any;
  userId?: string;
  timestamp: number;
}

export interface WebSocketRoute {
  path: string;
  targetUrl: string;
  requiresAuth: boolean;
  messageTransform?: (message: any) => any;
}

export interface RoomInfo {
  name: string;
  connections: Set<string>;
  createdAt: number;
  metadata: Record<string, any>;
}

// ==================== Connection Manager ====================

export class WebSocketConnectionManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();
  private heartbeatInterval: number = 30000; // 30 seconds
  private connectionTimeout: number = 60000; // 1 minute

  /**
   * Add a new connection
   */
  addConnection(
    id: string,
    socket: any,
    userId?: string,
    metadata?: Record<string, any>
  ): WebSocketConnection {
    const connection: WebSocketConnection = {
      id,
      socket,
      userId,
      rooms: new Set(),
      metadata: metadata || {},
      connectedAt: Date.now(),
      lastActivityAt: Date.now()
    };

    this.connections.set(id, connection);

    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(id);
    }

    return connection;
  }

  /**
   * Remove a connection
   */
  removeConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (!connection) {
      return false;
    }

    // Remove from rooms
    for (const room of connection.rooms) {
      this.leaveRoom(id, room);
    }

    // Remove from user connections
    if (connection.userId) {
      const userConns = this.userConnections.get(connection.userId);
      if (userConns) {
        userConns.delete(id);
        if (userConns.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
    }

    this.connections.delete(id);
    return true;
  }

  /**
   * Get connection by ID
   */
  getConnection(id: string): WebSocketConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): WebSocketConnection[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) {
      return [];
    }

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter((conn): conn is WebSocketConnection => conn !== undefined);
  }

  /**
   * Join a room
   */
  joinRoom(connectionId: string, roomName: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, {
        name: roomName,
        connections: new Set(),
        createdAt: Date.now(),
        metadata: {}
      });
    }

    const room = this.rooms.get(roomName)!;
    room.connections.add(connectionId);
    connection.rooms.add(roomName);

    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(connectionId: string, roomName: string): boolean {
    const connection = this.connections.get(connectionId);
    const room = this.rooms.get(roomName);

    if (!connection || !room) {
      return false;
    }

    room.connections.delete(connectionId);
    connection.rooms.delete(roomName);

    // Clean up empty rooms
    if (room.connections.size === 0) {
      this.rooms.delete(roomName);
    }

    return true;
  }

  /**
   * Get all connections in a room
   */
  getRoomConnections(roomName: string): WebSocketConnection[] {
    const room = this.rooms.get(roomName);
    if (!room) {
      return [];
    }

    return Array.from(room.connections)
      .map(id => this.connections.get(id))
      .filter((conn): conn is WebSocketConnection => conn !== undefined);
  }

  /**
   * Update connection activity
   */
  updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivityAt = Date.now();
    }
  }

  /**
   * Get all active connections
   */
  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection stats
   */
  getStats(): {
    totalConnections: number;
    totalUsers: number;
    totalRooms: number;
    rooms: Array<{ name: string; connections: number }>;
  } {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([name, room]) => ({
        name,
        connections: room.connections.size
      }))
    };
  }

  /**
   * Clean up inactive connections
   */
  cleanup(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, connection] of this.connections.entries()) {
      if (now - connection.lastActivityAt > this.connectionTimeout) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeConnection(id);
    }
  }
}

// ==================== Message Router ====================

export class WebSocketMessageRouter {
  private routes: Map<string, WebSocketRoute> = new Map();

  /**
   * Register a WebSocket route
   */
  registerRoute(route: WebSocketRoute): void {
    this.routes.set(route.path, route);
  }

  /**
   * Get route for path
   */
  getRoute(path: string): WebSocketRoute | undefined {
    return this.routes.get(path);
  }

  /**
   * Transform message
   */
  transformMessage(message: any, route?: WebSocketRoute): any {
    if (!route || !route.messageTransform) {
      return message;
    }

    return route.messageTransform(message);
  }
}

// ==================== Message Broadcaster ====================

export class MessageBroadcaster {
  /**
   * Broadcast message to all connections
   */
  broadcastToAll(
    connections: WebSocketConnection[],
    message: any,
    excludeId?: string
  ): void {
    const data = JSON.stringify(message);

    for (const connection of connections) {
      if (excludeId && connection.id === excludeId) {
        continue;
      }

      try {
        // In a real implementation, use connection.socket.send(data)
        console.log(`Broadcasting to ${connection.id}:`, data);
      } catch (error) {
        console.error(`Failed to send to ${connection.id}:`, error);
      }
    }
  }

  /**
   * Broadcast to a specific room
   */
  broadcastToRoom(
    connections: WebSocketConnection[],
    roomName: string,
    message: any,
    excludeId?: string
  ): void {
    const roomConnections = connections.filter(conn => conn.rooms.has(roomName));
    this.broadcastToAll(roomConnections, message, excludeId);
  }

  /**
   * Send to specific user (all their connections)
   */
  sendToUser(
    connections: WebSocketConnection[],
    userId: string,
    message: any
  ): void {
    const userConnections = connections.filter(conn => conn.userId === userId);
    this.broadcastToAll(userConnections, message);
  }

  /**
   * Send to specific connection
   */
  sendToConnection(connection: WebSocketConnection, message: any): boolean {
    try {
      const data = JSON.stringify(message);
      // In a real implementation, use connection.socket.send(data)
      console.log(`Sending to ${connection.id}:`, data);
      return true;
    } catch (error) {
      console.error(`Failed to send to ${connection.id}:`, error);
      return false;
    }
  }
}

// ==================== WebSocket Proxy ====================

export class WebSocketProxy {
  private connectionManager: WebSocketConnectionManager;
  private messageRouter: WebSocketMessageRouter;
  private broadcaster: MessageBroadcaster;
  private pingInterval: any;

  constructor() {
    this.connectionManager = new WebSocketConnectionManager();
    this.messageRouter = new WebSocketMessageRouter();
    this.broadcaster = new MessageBroadcaster();

    this.startHeartbeat();
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(
    socket: any,
    path: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const connectionId = crypto.randomUUID();

    // Check route
    const route = this.messageRouter.getRoute(path);
    if (!route) {
      throw new Error('WebSocket route not found');
    }

    if (route.requiresAuth && !userId) {
      throw new Error('Authentication required for this WebSocket endpoint');
    }

    // Add connection
    const connection = this.connectionManager.addConnection(
      connectionId,
      socket,
      userId,
      metadata
    );

    console.log(`WebSocket connected: ${connectionId} (user: ${userId || 'anonymous'})`);

    return connectionId;
  }

  /**
   * Handle incoming message
   */
  async handleMessage(
    connectionId: string,
    rawMessage: string
  ): Promise<void> {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) {
      return;
    }

    this.connectionManager.updateActivity(connectionId);

    try {
      const message: WebSocketMessage = JSON.parse(rawMessage);
      message.timestamp = Date.now();

      switch (message.type) {
        case 'join':
          if (message.room) {
            this.handleJoinRoom(connectionId, message.room);
          }
          break;

        case 'leave':
          if (message.room) {
            this.handleLeaveRoom(connectionId, message.room);
          }
          break;

        case 'broadcast':
          if (message.room) {
            this.handleBroadcastToRoom(connectionId, message.room, message.data);
          } else {
            this.handleBroadcastToAll(connectionId, message.data);
          }
          break;

        case 'message':
          this.handleUserMessage(connectionId, message);
          break;

        case 'ping':
          this.handlePing(connectionId);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(connectionId, 'Invalid message format');
    }
  }

  /**
   * Handle connection close
   */
  handleClose(connectionId: string): void {
    const connection = this.connectionManager.getConnection(connectionId);
    if (connection) {
      console.log(`WebSocket disconnected: ${connectionId}`);

      // Notify rooms
      for (const room of connection.rooms) {
        this.broadcaster.broadcastToRoom(
          this.connectionManager.getAllConnections(),
          room,
          {
            type: 'user-left',
            userId: connection.userId,
            room,
            timestamp: Date.now()
          },
          connectionId
        );
      }
    }

    this.connectionManager.removeConnection(connectionId);
  }

  /**
   * Register WebSocket route
   */
  registerRoute(route: WebSocketRoute): void {
    this.messageRouter.registerRoute(route);
  }

  /**
   * Get connection stats
   */
  getStats(): any {
    return this.connectionManager.getStats();
  }

  private handleJoinRoom(connectionId: string, roomName: string): void {
    const success = this.connectionManager.joinRoom(connectionId, roomName);
    const connection = this.connectionManager.getConnection(connectionId);

    if (success && connection) {
      // Notify user
      this.broadcaster.sendToConnection(connection, {
        type: 'joined',
        room: roomName,
        timestamp: Date.now()
      });

      // Notify room
      this.broadcaster.broadcastToRoom(
        this.connectionManager.getAllConnections(),
        roomName,
        {
          type: 'user-joined',
          userId: connection.userId,
          room: roomName,
          timestamp: Date.now()
        },
        connectionId
      );
    }
  }

  private handleLeaveRoom(connectionId: string, roomName: string): void {
    const connection = this.connectionManager.getConnection(connectionId);
    const success = this.connectionManager.leaveRoom(connectionId, roomName);

    if (success && connection) {
      // Notify user
      this.broadcaster.sendToConnection(connection, {
        type: 'left',
        room: roomName,
        timestamp: Date.now()
      });

      // Notify room
      this.broadcaster.broadcastToRoom(
        this.connectionManager.getAllConnections(),
        roomName,
        {
          type: 'user-left',
          userId: connection.userId,
          room: roomName,
          timestamp: Date.now()
        }
      );
    }
  }

  private handleBroadcastToRoom(connectionId: string, roomName: string, data: any): void {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) {
      return;
    }

    this.broadcaster.broadcastToRoom(
      this.connectionManager.getAllConnections(),
      roomName,
      {
        type: 'message',
        room: roomName,
        userId: connection.userId,
        data,
        timestamp: Date.now()
      },
      connectionId
    );
  }

  private handleBroadcastToAll(connectionId: string, data: any): void {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) {
      return;
    }

    this.broadcaster.broadcastToAll(
      this.connectionManager.getAllConnections(),
      {
        type: 'message',
        userId: connection.userId,
        data,
        timestamp: Date.now()
      },
      connectionId
    );
  }

  private handleUserMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) {
      return;
    }

    // Echo back or process message
    this.broadcaster.sendToConnection(connection, {
      type: 'message-received',
      data: message.data,
      timestamp: Date.now()
    });
  }

  private handlePing(connectionId: string): void {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) {
      return;
    }

    this.broadcaster.sendToConnection(connection, {
      type: 'pong',
      timestamp: Date.now()
    });
  }

  private sendError(connectionId: string, error: string): void {
    const connection = this.connectionManager.getConnection(connectionId);
    if (!connection) {
      return;
    }

    this.broadcaster.sendToConnection(connection, {
      type: 'error',
      error,
      timestamp: Date.now()
    });
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      const connections = this.connectionManager.getAllConnections();

      for (const connection of connections) {
        this.broadcaster.sendToConnection(connection, {
          type: 'ping',
          timestamp: Date.now()
        });
      }

      // Cleanup inactive connections
      this.connectionManager.cleanup();
    }, 30000); // Every 30 seconds
  }

  /**
   * Shutdown proxy
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all connections
    const connections = this.connectionManager.getAllConnections();
    for (const connection of connections) {
      this.handleClose(connection.id);
    }
  }
}
