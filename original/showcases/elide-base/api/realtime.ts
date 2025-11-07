/**
 * ElideBase - Real-time Subscriptions
 *
 * Provides WebSocket-based real-time subscriptions to database changes
 * with filtering and authentication.
 */

import { SQLiteDatabase } from '../database/sqlite';
import { SchemaManager } from '../database/schema';

export interface Subscription {
  id: string;
  collection: string;
  filter?: string;
  clientId: string;
  userId?: string;
}

export interface RealtimeEvent {
  type: 'create' | 'update' | 'delete';
  collection: string;
  record: any;
  timestamp: number;
}

export interface WebSocketClient {
  id: string;
  userId?: string;
  send: (data: any) => void;
  close: () => void;
}

export class RealtimeServer {
  private db: SQLiteDatabase;
  private schema: SchemaManager;
  private clients: Map<string, WebSocketClient>;
  private subscriptions: Map<string, Subscription[]>;

  constructor(db: SQLiteDatabase, schema: SchemaManager) {
    this.db = db;
    this.schema = schema;
    this.clients = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Register a new WebSocket client
   */
  registerClient(client: WebSocketClient): void {
    this.clients.set(client.id, client);
    this.subscriptions.set(client.id, []);

    console.log(`Client connected: ${client.id}`);

    // Send welcome message
    this.sendToClient(client.id, {
      type: 'connected',
      clientId: client.id,
      timestamp: Date.now()
    });
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
    this.subscriptions.delete(clientId);

    console.log(`Client disconnected: ${clientId}`);
  }

  /**
   * Handle client message
   */
  handleMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(`Client not found: ${clientId}`);
      return;
    }

    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;

      switch (data.type) {
        case 'subscribe':
          this.subscribe(clientId, data.collection, data.filter);
          break;

        case 'unsubscribe':
          this.unsubscribe(clientId, data.collection);
          break;

        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          this.sendToClient(clientId, {
            type: 'error',
            error: `Unknown message type: ${data.type}`
          });
      }
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'error',
        error: `Invalid message format: ${error}`
      });
    }
  }

  /**
   * Subscribe client to collection changes
   */
  private subscribe(clientId: string, collection: string, filter?: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Validate collection exists
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      this.sendToClient(clientId, {
        type: 'error',
        error: `Collection ${collection} not found`
      });
      return;
    }

    // Check if already subscribed
    const clientSubs = this.subscriptions.get(clientId) || [];
    const existing = clientSubs.find(s => s.collection === collection);

    if (existing) {
      this.sendToClient(clientId, {
        type: 'error',
        error: `Already subscribed to ${collection}`
      });
      return;
    }

    // Create subscription
    const subscription: Subscription = {
      id: `${clientId}_${collection}_${Date.now()}`,
      collection,
      filter,
      clientId,
      userId: client.userId
    };

    clientSubs.push(subscription);
    this.subscriptions.set(clientId, clientSubs);

    console.log(`Client ${clientId} subscribed to ${collection}`);

    this.sendToClient(clientId, {
      type: 'subscribed',
      collection,
      subscriptionId: subscription.id
    });
  }

  /**
   * Unsubscribe client from collection
   */
  private unsubscribe(clientId: string, collection: string): void {
    const clientSubs = this.subscriptions.get(clientId) || [];
    const filtered = clientSubs.filter(s => s.collection !== collection);

    this.subscriptions.set(clientId, filtered);

    console.log(`Client ${clientId} unsubscribed from ${collection}`);

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      collection
    });
  }

  /**
   * Broadcast event to subscribers
   */
  broadcast(event: RealtimeEvent): void {
    for (const [clientId, subs] of this.subscriptions) {
      for (const sub of subs) {
        if (sub.collection === event.collection) {
          // Check if event matches filter
          if (this.matchesFilter(event.record, sub.filter)) {
            this.sendToClient(clientId, {
              type: 'event',
              subscriptionId: sub.id,
              event
            });
          }
        }
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
      }
    }
  }

  /**
   * Check if record matches subscription filter
   */
  private matchesFilter(record: any, filter?: string): boolean {
    if (!filter) {
      return true;
    }

    try {
      // Simple filter matching (field=value)
      const conditions = filter.split('&&').map(c => c.trim());

      for (const condition of conditions) {
        if (condition.includes('=')) {
          const [field, value] = condition.split('=').map(s => s.trim());
          if (String(record[field]) !== value) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Filter matching error:', error);
      return false;
    }
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subs of this.subscriptions.values()) {
      count += subs.length;
    }
    return count;
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get subscription statistics
   */
  getStats(): any {
    const collectionCounts: Record<string, number> = {};

    for (const subs of this.subscriptions.values()) {
      for (const sub of subs) {
        collectionCounts[sub.collection] = (collectionCounts[sub.collection] || 0) + 1;
      }
    }

    return {
      clients: this.getClientCount(),
      subscriptions: this.getSubscriptionCount(),
      collections: collectionCounts
    };
  }
}

/**
 * Database change tracker
 * Monitors database changes and triggers real-time events
 */
export class ChangeTracker {
  private realtime: RealtimeServer;
  private enabled: boolean;

  constructor(realtime: RealtimeServer) {
    this.realtime = realtime;
    this.enabled = true;
  }

  /**
   * Track create event
   */
  trackCreate(collection: string, record: any): void {
    if (!this.enabled) return;

    this.realtime.broadcast({
      type: 'create',
      collection,
      record,
      timestamp: Date.now()
    });
  }

  /**
   * Track update event
   */
  trackUpdate(collection: string, record: any): void {
    if (!this.enabled) return;

    this.realtime.broadcast({
      type: 'update',
      collection,
      record,
      timestamp: Date.now()
    });
  }

  /**
   * Track delete event
   */
  trackDelete(collection: string, record: any): void {
    if (!this.enabled) return;

    this.realtime.broadcast({
      type: 'delete',
      collection,
      record,
      timestamp: Date.now()
    });
  }

  /**
   * Enable change tracking
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable change tracking
   */
  disable(): void {
    this.enabled = false;
  }
}
