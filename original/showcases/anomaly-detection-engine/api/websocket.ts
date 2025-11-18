/**
 * WebSocket server for real-time alert streaming.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { AlertManager, Alert } from '../core/alert-manager.js';
import { RealtimeScorer, ScoringResult } from '../core/scorer.js';
import { logger } from './middleware.js';

export interface WebSocketMessage {
  type: 'alert' | 'score' | 'ping' | 'subscribe' | 'unsubscribe';
  data?: any;
}

export class AnomalyWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, Set<string>> = new Map();
  private alertManager: AlertManager;
  private scorer: RealtimeScorer;

  constructor(
    server: Server,
    alertManager: AlertManager,
    scorer: RealtimeScorer
  ) {
    this.alertManager = alertManager;
    this.scorer = scorer;

    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    this.initialize();
  }

  /**
   * Initialize WebSocket server and event handlers.
   */
  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');

      // Initialize client subscriptions
      this.clients.set(ws, new Set());

      // Set up event handlers
      ws.on('message', (message: string) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      // Send welcome message
      this.send(ws, {
        type: 'ping',
        data: {
          message: 'Connected to anomaly detection engine',
          timestamp: Date.now()
        }
      });
    });

    // Listen for alerts
    this.alertManager.on('alert', (alert: Alert) => {
      this.broadcastAlert(alert);
    });

    // Listen for alert updates
    this.alertManager.on('alert:acknowledged', (alert: Alert) => {
      this.broadcast({
        type: 'alert',
        data: {
          action: 'acknowledged',
          alert
        }
      });
    });

    this.alertManager.on('alert:resolved', (alert: Alert) => {
      this.broadcast({
        type: 'alert',
        data: {
          action: 'resolved',
          alert
        }
      });
    });

    logger.info('WebSocket server initialized on /ws');
  }

  /**
   * Handle incoming WebSocket messages.
   */
  private handleMessage(ws: WebSocket, message: string): void {
    try {
      const msg: WebSocketMessage = JSON.parse(message);

      switch (msg.type) {
        case 'subscribe':
          this.handleSubscribe(ws, msg.data);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, msg.data);
          break;

        case 'ping':
          this.send(ws, {
            type: 'ping',
            data: { timestamp: Date.now() }
          });
          break;

        default:
          logger.warn(`Unknown message type: ${msg.type}`);
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error);
      this.send(ws, {
        type: 'error',
        data: {
          message: 'Invalid message format'
        }
      });
    }
  }

  /**
   * Handle subscription requests.
   */
  private handleSubscribe(ws: WebSocket, data: any): void {
    const subscriptions = this.clients.get(ws);
    if (!subscriptions) return;

    const { channels } = data;

    if (Array.isArray(channels)) {
      channels.forEach((channel: string) => {
        subscriptions.add(channel);
      });
    } else if (typeof channels === 'string') {
      subscriptions.add(channels);
    }

    this.send(ws, {
      type: 'subscribe',
      data: {
        message: 'Subscribed successfully',
        channels: Array.from(subscriptions)
      }
    });

    logger.info(`Client subscribed to: ${Array.from(subscriptions).join(', ')}`);
  }

  /**
   * Handle unsubscription requests.
   */
  private handleUnsubscribe(ws: WebSocket, data: any): void {
    const subscriptions = this.clients.get(ws);
    if (!subscriptions) return;

    const { channels } = data;

    if (Array.isArray(channels)) {
      channels.forEach((channel: string) => {
        subscriptions.delete(channel);
      });
    } else if (typeof channels === 'string') {
      subscriptions.delete(channels);
    }

    this.send(ws, {
      type: 'unsubscribe',
      data: {
        message: 'Unsubscribed successfully',
        channels: Array.from(subscriptions)
      }
    });
  }

  /**
   * Broadcast alert to all subscribed clients.
   */
  private broadcastAlert(alert: Alert): void {
    this.broadcast(
      {
        type: 'alert',
        data: {
          action: 'created',
          alert
        }
      },
      ['alerts', `severity:${alert.severity}`]
    );
  }

  /**
   * Broadcast scoring result.
   */
  broadcastScore(result: ScoringResult): void {
    this.broadcast(
      {
        type: 'score',
        data: result
      },
      ['scores']
    );
  }

  /**
   * Send message to a specific client.
   */
  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients (optionally filtered by subscription).
   */
  private broadcast(message: any, channels?: string[]): void {
    for (const [ws, subscriptions] of this.clients.entries()) {
      // If channels specified, only send to subscribed clients
      if (channels) {
        const hasSubscription = channels.some(ch => subscriptions.has(ch));
        if (!hasSubscription) continue;
      }

      this.send(ws, message);
    }
  }

  /**
   * Get connected client count.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get subscription statistics.
   */
  getStats(): {
    clients: number;
    subscriptions: Record<string, number>;
  } {
    const subscriptionCounts: Record<string, number> = {};

    for (const subscriptions of this.clients.values()) {
      for (const channel of subscriptions) {
        subscriptionCounts[channel] = (subscriptionCounts[channel] || 0) + 1;
      }
    }

    return {
      clients: this.clients.size,
      subscriptions: subscriptionCounts
    };
  }

  /**
   * Close the WebSocket server.
   */
  close(): void {
    this.wss.close();
    logger.info('WebSocket server closed');
  }
}
