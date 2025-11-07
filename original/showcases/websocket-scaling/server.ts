/**
 * Scalable WebSocket Server
 *
 * This server implements a production-ready WebSocket solution with:
 * - Connection pooling and management
 * - Pub/sub messaging system
 * - Room-based messaging
 * - Presence tracking
 * - Message broadcasting
 * - Heartbeat/ping-pong
 *
 * @module websocket-scaling
 */

import { serve } from "elide/http";

/**
 * WebSocket connection wrapper
 */
interface WSConnection {
  id: string;
  socket: WebSocket;
  userId?: string;
  rooms: Set<string>;
  metadata: Map<string, any>;
  lastActivity: number;
  isAlive: boolean;
}

/**
 * Message types
 */
enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  MESSAGE = 'message',
  BROADCAST = 'broadcast',
  PRESENCE = 'presence',
  PING = 'ping',
  PONG = 'pong'
}

/**
 * WebSocket message
 */
interface WSMessage {
  type: MessageType;
  payload: any;
  room?: string;
  userId?: string;
  timestamp?: number;
}

/**
 * Room information
 */
interface Room {
  id: string;
  name: string;
  connections: Set<string>;
  metadata: Map<string, any>;
  createdAt: number;
}

/**
 * Presence information
 */
interface Presence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  metadata?: Record<string, any>;
}

/**
 * Connection pool manager
 */
class ConnectionPool {
  private connections: Map<string, WSConnection>;
  private maxConnections: number;

  constructor(maxConnections: number = 10000) {
    this.connections = new Map();
    this.maxConnections = maxConnections;
  }

  add(connection: WSConnection): boolean {
    if (this.connections.size >= this.maxConnections) {
      return false;
    }

    this.connections.set(connection.id, connection);
    return true;
  }

  get(id: string): WSConnection | undefined {
    return this.connections.get(id);
  }

  remove(id: string): boolean {
    return this.connections.delete(id);
  }

  getAll(): WSConnection[] {
    return Array.from(this.connections.values());
  }

  getByUserId(userId: string): WSConnection[] {
    return this.getAll().filter(conn => conn.userId === userId);
  }

  getByRoom(roomId: string): WSConnection[] {
    return this.getAll().filter(conn => conn.rooms.has(roomId));
  }

  size(): number {
    return this.connections.size;
  }

  cleanup(maxIdleTime: number): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, conn] of this.connections) {
      if (now - conn.lastActivity > maxIdleTime) {
        conn.socket.close();
        this.connections.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Room manager
 */
class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  create(id: string, name: string): Room {
    const room: Room = {
      id,
      name,
      connections: new Set(),
      metadata: new Map(),
      createdAt: Date.now()
    };

    this.rooms.set(id, room);
    return room;
  }

  get(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getOrCreate(id: string, name?: string): Room {
    let room = this.rooms.get(id);
    if (!room) {
      room = this.create(id, name || id);
    }
    return room;
  }

  delete(id: string): boolean {
    return this.rooms.delete(id);
  }

  join(roomId: string, connectionId: string): boolean {
    const room = this.get(roomId);
    if (!room) return false;

    room.connections.add(connectionId);
    return true;
  }

  leave(roomId: string, connectionId: string): boolean {
    const room = this.get(roomId);
    if (!room) return false;

    const result = room.connections.delete(connectionId);

    // Auto-cleanup empty rooms
    if (room.connections.size === 0) {
      this.delete(roomId);
    }

    return result;
  }

  getMembers(roomId: string): string[] {
    const room = this.get(roomId);
    return room ? Array.from(room.connections) : [];
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

/**
 * Pub/Sub system
 */
class PubSub {
  private subscribers: Map<string, Set<Function>>;

  constructor() {
    this.subscribers = new Map();
  }

  subscribe(channel: string, callback: Function): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(channel);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  publish(channel: string, message: any): number {
    const subs = this.subscribers.get(channel);
    if (!subs) return 0;

    let count = 0;
    for (const callback of subs) {
      try {
        callback(message);
        count++;
      } catch (error) {
        console.error('PubSub callback error:', error);
      }
    }

    return count;
  }

  getSubscriberCount(channel: string): number {
    return this.subscribers.get(channel)?.size || 0;
  }

  getAllChannels(): string[] {
    return Array.from(this.subscribers.keys());
  }
}

/**
 * Presence tracker
 */
class PresenceTracker {
  private presences: Map<string, Presence>;
  private updateCallbacks: Set<Function>;

  constructor() {
    this.presences = new Map();
    this.updateCallbacks = new Set();
  }

  setPresence(userId: string, status: 'online' | 'away' | 'offline', metadata?: Record<string, any>): void {
    const presence: Presence = {
      userId,
      status,
      lastSeen: Date.now(),
      metadata
    };

    this.presences.set(userId, presence);
    this.notifyUpdate(presence);
  }

  getPresence(userId: string): Presence | undefined {
    return this.presences.get(userId);
  }

  getAllPresences(): Presence[] {
    return Array.from(this.presences.values());
  }

  getOnlineUsers(): string[] {
    return Array.from(this.presences.values())
      .filter(p => p.status === 'online')
      .map(p => p.userId);
  }

  onUpdate(callback: Function): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifyUpdate(presence: Presence): void {
    for (const callback of this.updateCallbacks) {
      try {
        callback(presence);
      } catch (error) {
        console.error('Presence update callback error:', error);
      }
    }
  }

  cleanup(maxOfflineTime: number): number {
    const now = Date.now();
    let removed = 0;

    for (const [userId, presence] of this.presences) {
      if (presence.status === 'offline' && now - presence.lastSeen > maxOfflineTime) {
        this.presences.delete(userId);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * WebSocket Server
 */
class WebSocketServer {
  private connectionPool: ConnectionPool;
  private roomManager: RoomManager;
  private pubsub: PubSub;
  private presenceTracker: PresenceTracker;
  private heartbeatInterval: number = 30000; // 30 seconds
  private cleanupInterval: number = 60000; // 1 minute

  constructor() {
    this.connectionPool = new ConnectionPool(10000);
    this.roomManager = new RoomManager();
    this.pubsub = new PubSub();
    this.presenceTracker = new PresenceTracker();

    this.startHeartbeat();
    this.startCleanup();
    this.setupPresenceTracking();
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: WebSocket, request: Request): void {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const connectionId = this.generateId();

    const connection: WSConnection = {
      id: connectionId,
      socket,
      userId: userId || undefined,
      rooms: new Set(),
      metadata: new Map(),
      lastActivity: Date.now(),
      isAlive: true
    };

    // Check connection limit
    if (!this.connectionPool.add(connection)) {
      socket.close(1008, 'Connection limit reached');
      return;
    }

    // Set up event handlers
    socket.addEventListener('message', (event) => {
      this.handleMessage(connection, event.data);
    });

    socket.addEventListener('close', () => {
      this.handleDisconnect(connection);
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect(connection);
    });

    // Send welcome message
    this.sendMessage(connection, {
      type: MessageType.CONNECT,
      payload: {
        connectionId,
        timestamp: Date.now()
      }
    });

    // Update presence
    if (userId) {
      this.presenceTracker.setPresence(userId, 'online');
    }

    console.log(`Connection established: ${connectionId} (user: ${userId || 'anonymous'})`);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(connection: WSConnection, data: string | ArrayBuffer): void {
    connection.lastActivity = Date.now();
    connection.isAlive = true;

    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case MessageType.JOIN_ROOM:
          this.handleJoinRoom(connection, message);
          break;

        case MessageType.LEAVE_ROOM:
          this.handleLeaveRoom(connection, message);
          break;

        case MessageType.MESSAGE:
          this.handleUserMessage(connection, message);
          break;

        case MessageType.BROADCAST:
          this.handleBroadcast(connection, message);
          break;

        case MessageType.PRESENCE:
          this.handlePresenceUpdate(connection, message);
          break;

        case MessageType.PONG:
          // Client responded to ping
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(connection, 'Invalid message format');
    }
  }

  /**
   * Handle room join
   */
  private handleJoinRoom(connection: WSConnection, message: WSMessage): void {
    const { room } = message.payload;
    if (!room) {
      this.sendError(connection, 'Room name required');
      return;
    }

    const roomObj = this.roomManager.getOrCreate(room, room);
    this.roomManager.join(room, connection.id);
    connection.rooms.add(room);

    // Notify room members
    this.broadcastToRoom(room, {
      type: MessageType.JOIN_ROOM,
      payload: {
        userId: connection.userId,
        connectionId: connection.id,
        room
      }
    }, connection.id);

    // Send room info to user
    this.sendMessage(connection, {
      type: MessageType.JOIN_ROOM,
      payload: {
        room,
        members: this.roomManager.getMembers(room).length
      }
    });
  }

  /**
   * Handle room leave
   */
  private handleLeaveRoom(connection: WSConnection, message: WSMessage): void {
    const { room } = message.payload;
    if (!room) {
      this.sendError(connection, 'Room name required');
      return;
    }

    this.roomManager.leave(room, connection.id);
    connection.rooms.delete(room);

    // Notify room members
    this.broadcastToRoom(room, {
      type: MessageType.LEAVE_ROOM,
      payload: {
        userId: connection.userId,
        connectionId: connection.id,
        room
      }
    });
  }

  /**
   * Handle user message
   */
  private handleUserMessage(connection: WSConnection, message: WSMessage): void {
    const { room, content } = message.payload;

    if (room && !connection.rooms.has(room)) {
      this.sendError(connection, 'Not in room');
      return;
    }

    const outgoingMessage: WSMessage = {
      type: MessageType.MESSAGE,
      payload: {
        userId: connection.userId,
        content,
        timestamp: Date.now()
      },
      room
    };

    if (room) {
      this.broadcastToRoom(room, outgoingMessage);
    } else {
      // Direct message to specific user
      const { targetUserId } = message.payload;
      if (targetUserId) {
        this.sendToUser(targetUserId, outgoingMessage);
      }
    }
  }

  /**
   * Handle broadcast
   */
  private handleBroadcast(connection: WSConnection, message: WSMessage): void {
    this.broadcast({
      type: MessageType.BROADCAST,
      payload: {
        userId: connection.userId,
        ...message.payload,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Handle presence update
   */
  private handlePresenceUpdate(connection: WSConnection, message: WSMessage): void {
    if (!connection.userId) return;

    const { status, metadata } = message.payload;
    this.presenceTracker.setPresence(connection.userId, status, metadata);
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(connection: WSConnection): void {
    // Remove from all rooms
    for (const room of connection.rooms) {
      this.roomManager.leave(room, connection.id);
      this.broadcastToRoom(room, {
        type: MessageType.LEAVE_ROOM,
        payload: {
          userId: connection.userId,
          connectionId: connection.id,
          room
        }
      });
    }

    // Remove from connection pool
    this.connectionPool.remove(connection.id);

    // Update presence
    if (connection.userId) {
      const userConnections = this.connectionPool.getByUserId(connection.userId);
      if (userConnections.length === 0) {
        this.presenceTracker.setPresence(connection.userId, 'offline');
      }
    }

    console.log(`Connection closed: ${connection.id}`);
  }

  /**
   * Send message to specific connection
   */
  private sendMessage(connection: WSConnection, message: WSMessage): void {
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Send error to connection
   */
  private sendError(connection: WSConnection, error: string): void {
    this.sendMessage(connection, {
      type: MessageType.MESSAGE,
      payload: { error }
    });
  }

  /**
   * Broadcast to all connections in a room
   */
  private broadcastToRoom(roomId: string, message: WSMessage, excludeId?: string): void {
    const connections = this.connectionPool.getByRoom(roomId);

    for (const conn of connections) {
      if (excludeId && conn.id === excludeId) continue;
      this.sendMessage(conn, message);
    }
  }

  /**
   * Broadcast to all connections
   */
  private broadcast(message: WSMessage): void {
    const connections = this.connectionPool.getAll();

    for (const conn of connections) {
      this.sendMessage(conn, message);
    }
  }

  /**
   * Send to specific user (all their connections)
   */
  private sendToUser(userId: string, message: WSMessage): void {
    const connections = this.connectionPool.getByUserId(userId);

    for (const conn of connections) {
      this.sendMessage(conn, message);
    }
  }

  /**
   * Start heartbeat checker
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const connections = this.connectionPool.getAll();

      for (const conn of connections) {
        if (!conn.isAlive) {
          conn.socket.close();
          this.connectionPool.remove(conn.id);
          continue;
        }

        conn.isAlive = false;
        this.sendMessage(conn, {
          type: MessageType.PING,
          payload: { timestamp: Date.now() }
        });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Start cleanup task
   */
  private startCleanup(): void {
    setInterval(() => {
      // Cleanup idle connections
      const removedConnections = this.connectionPool.cleanup(300000); // 5 minutes
      if (removedConnections > 0) {
        console.log(`Cleaned up ${removedConnections} idle connections`);
      }

      // Cleanup offline presences
      const removedPresences = this.presenceTracker.cleanup(3600000); // 1 hour
      if (removedPresences > 0) {
        console.log(`Cleaned up ${removedPresences} offline presences`);
      }
    }, this.cleanupInterval);
  }

  /**
   * Setup presence tracking
   */
  private setupPresenceTracking(): void {
    this.presenceTracker.onUpdate((presence: Presence) => {
      this.broadcast({
        type: MessageType.PRESENCE,
        payload: presence
      });
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server stats
   */
  getStats(): any {
    return {
      connections: this.connectionPool.size(),
      rooms: this.roomManager.getAllRooms().length,
      onlineUsers: this.presenceTracker.getOnlineUsers().length,
      channels: this.pubsub.getAllChannels().length
    };
  }
}

// Initialize server
const wsServer = new WebSocketServer();

/**
 * HTTP request handler
 */
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // WebSocket upgrade
  if (request.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(request);
    wsServer.handleConnection(socket, request);
    return response;
  }

  // Stats endpoint
  if (url.pathname === '/stats') {
    return new Response(JSON.stringify(wsServer.getStats()), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Client page
  if (url.pathname === '/') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>WebSocket Chat</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; }
            #messages { border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px; }
            .message { margin: 5px 0; }
            input, button { margin: 10px 5px; padding: 10px; }
          </style>
        </head>
        <body>
          <h1>WebSocket Chat</h1>
          <div id="messages"></div>
          <input id="room" placeholder="Room name" value="general">
          <button id="join">Join Room</button>
          <input id="message" placeholder="Type a message">
          <button id="send">Send</button>
          <script>
            const ws = new WebSocket('ws://localhost:3000?userId=user' + Math.random());
            const messages = document.getElementById('messages');

            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              const div = document.createElement('div');
              div.className = 'message';
              div.textContent = JSON.stringify(data, null, 2);
              messages.appendChild(div);
              messages.scrollTop = messages.scrollHeight;
            };

            document.getElementById('join').onclick = () => {
              ws.send(JSON.stringify({
                type: 'join_room',
                payload: { room: document.getElementById('room').value }
              }));
            };

            document.getElementById('send').onclick = () => {
              ws.send(JSON.stringify({
                type: 'message',
                payload: {
                  room: document.getElementById('room').value,
                  content: document.getElementById('message').value
                }
              }));
              document.getElementById('message').value = '';
            };
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return new Response('Not found', { status: 404 });
}

// Start server
serve({
  port: 3000,
  fetch: handleRequest
});

console.log('WebSocket Server running on http://localhost:3000');
console.log('WebSocket endpoint: ws://localhost:3000');
console.log('Stats: http://localhost:3000/stats');
