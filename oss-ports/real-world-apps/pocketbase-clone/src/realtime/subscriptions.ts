/**
 * Real-time Subscriptions
 * SSE-based real-time data updates
 */

import { EventEmitter } from 'events';
import { DatabaseConnection } from '../database/connection.js';
import { CollectionManager } from '../collections/manager.js';

export type SubscriptionEvent = 'create' | 'update' | 'delete';

export interface SubscriptionMessage {
  action: SubscriptionEvent;
  record: any;
  collection: string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  collection: string;
  recordId?: string;
  userId?: string;
  filter?: string;
  created: Date;
}

export class RealtimeService extends EventEmitter {
  private db: DatabaseConnection;
  private collections: CollectionManager;
  private subscriptions: Map<string, Subscription> = new Map();
  private clients: Map<string, Set<string>> = new Map(); // clientId -> subscription IDs

  constructor(db: DatabaseConnection, collections: CollectionManager) {
    super();
    this.db = db;
    this.collections = collections;
  }

  /**
   * Subscribe to collection changes
   */
  subscribe(
    clientId: string,
    collection: string,
    recordId?: string,
    filter?: string,
    userId?: string
  ): Subscription {
    const subscription: Subscription = {
      id: `${clientId}_${collection}_${recordId || 'all'}_${Date.now()}`,
      collection,
      recordId,
      userId,
      filter,
      created: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);

    // Track client subscriptions
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, new Set());
    }
    this.clients.get(clientId)!.add(subscription.id);

    return subscription;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    this.subscriptions.delete(subscriptionId);

    // Remove from client tracking
    for (const [clientId, subs] of this.clients.entries()) {
      if (subs.has(subscriptionId)) {
        subs.delete(subscriptionId);
        if (subs.size === 0) {
          this.clients.delete(clientId);
        }
        break;
      }
    }
  }

  /**
   * Unsubscribe all subscriptions for a client
   */
  unsubscribeClient(clientId: string): void {
    const subs = this.clients.get(clientId);
    if (!subs) return;

    for (const subId of subs) {
      this.subscriptions.delete(subId);
    }

    this.clients.delete(clientId);
  }

  /**
   * Get all subscriptions for a client
   */
  getClientSubscriptions(clientId: string): Subscription[] {
    const subIds = this.clients.get(clientId);
    if (!subIds) return [];

    return Array.from(subIds)
      .map(id => this.subscriptions.get(id))
      .filter(sub => sub !== undefined) as Subscription[];
  }

  /**
   * Emit a record event
   */
  emitRecordEvent(collection: string, action: SubscriptionEvent, record: any): void {
    const message: SubscriptionMessage = {
      action,
      record,
      collection,
      timestamp: new Date().toISOString(),
    };

    // Find matching subscriptions
    const matchingSubs = this.findMatchingSubscriptions(collection, record.id, record);

    // Emit to all matching subscriptions
    for (const sub of matchingSubs) {
      this.emit('message', sub.id, message);
    }
  }

  /**
   * Find subscriptions that match the event
   */
  private findMatchingSubscriptions(
    collection: string,
    recordId: string,
    record: any
  ): Subscription[] {
    const matching: Subscription[] = [];

    for (const sub of this.subscriptions.values()) {
      // Check collection match
      if (sub.collection !== collection) continue;

      // Check record ID match (if specified)
      if (sub.recordId && sub.recordId !== recordId) continue;

      // Check filter match (if specified)
      if (sub.filter && !this.matchesFilter(record, sub.filter)) continue;

      matching.push(sub);
    }

    return matching;
  }

  /**
   * Check if a record matches a filter
   */
  private matchesFilter(record: any, filter: string): boolean {
    // Simple filter matching (can be enhanced)
    // Format: field=value
    const parts = filter.split('&&').map(p => p.trim());

    for (const part of parts) {
      const match = part.match(/^(.+?)=(.+)$/);
      if (!match) continue;

      const field = match[1].trim();
      let value = match[2].trim();

      // Parse value
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      }

      if (record[field] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get active clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Clean up old subscriptions
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();

    for (const [id, sub] of this.subscriptions.entries()) {
      if (now - sub.created.getTime() > maxAge) {
        this.unsubscribe(id);
      }
    }
  }
}

/**
 * SSE Connection Manager
 */
export class SSEManager {
  private realtime: RealtimeService;
  private connections: Map<string, any> = new Map();

  constructor(realtime: RealtimeService) {
    this.realtime = realtime;
  }

  /**
   * Create SSE connection
   */
  createConnection(clientId: string, response: any): void {
    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Store connection
    this.connections.set(clientId, response);

    // Send initial connection message
    this.sendMessage(clientId, {
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Set up heartbeat
    const heartbeat = setInterval(() => {
      this.sendHeartbeat(clientId);
    }, 30000); // 30 seconds

    // Listen for messages from realtime service
    const messageHandler = (subId: string, message: SubscriptionMessage) => {
      const subs = this.realtime.getClientSubscriptions(clientId);
      if (subs.some(sub => sub.id === subId)) {
        this.sendMessage(clientId, message);
      }
    };

    this.realtime.on('message', messageHandler);

    // Clean up on disconnect
    response.on('close', () => {
      clearInterval(heartbeat);
      this.realtime.removeListener('message', messageHandler);
      this.realtime.unsubscribeClient(clientId);
      this.connections.delete(clientId);
    });
  }

  /**
   * Send message to client
   */
  private sendMessage(clientId: string, data: any): void {
    const response = this.connections.get(clientId);
    if (!response) return;

    try {
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      this.connections.delete(clientId);
    }
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private sendHeartbeat(clientId: string): void {
    this.sendMessage(clientId, {
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Close connection
   */
  closeConnection(clientId: string): void {
    const response = this.connections.get(clientId);
    if (response) {
      try {
        response.end();
      } catch (error) {
        console.error('Error closing SSE connection:', error);
      }
      this.connections.delete(clientId);
    }
    this.realtime.unsubscribeClient(clientId);
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}
