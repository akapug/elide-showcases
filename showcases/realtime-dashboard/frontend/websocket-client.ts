/**
 * WebSocket Client
 *
 * Manages real-time connection to the dashboard server.
 * Handles reconnection, heartbeat, and message routing.
 */

export interface MetricsUpdate {
  type: 'metrics_update';
  timestamp: number;
  data: {
    system: any;
    application: any;
    anomalies: any[];
  };
}

export interface MessageHandler {
  (message: any): void;
}

export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private reconnectInterval: number = 5000;
  private reconnectTimer: any = null;
  private heartbeatInterval: number = 30000;
  private heartbeatTimer: any = null;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Connection attempt already in progress');
      return;
    }

    this.isConnecting = true;
    console.log(`Connecting to WebSocket: ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.onConnected();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.onDisconnected();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Register a message handler for a specific message type
   */
  public on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Remove a message handler
   */
  public off(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send a message to the server
   */
  public send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Request historical data
   */
  public requestHistory(limit: number = 100): void {
    this.send({ type: 'request_history', limit });
  }

  /**
   * Trigger traffic simulation
   */
  public simulateTraffic(): void {
    this.send({ type: 'simulate_traffic' });
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const messageType = message.type;

      // Call registered handlers
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }

      // Call wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => handler(message));
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Called when connection is established
   */
  private onConnected(): void {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Start heartbeat
    this.startHeartbeat();

    // Emit connected event
    const handlers = this.messageHandlers.get('connected');
    if (handlers) {
      handlers.forEach(handler => handler({ type: 'connected' }));
    }
  }

  /**
   * Called when connection is closed
   */
  private onDisconnected(): void {
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Emit disconnected event
    const handlers = this.messageHandlers.get('disconnected');
    if (handlers) {
      handlers.forEach(handler => handler({ type: 'disconnected' }));
    }

    // Schedule reconnect
    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`Scheduling reconnect in ${this.reconnectInterval}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.connect();
      }
    }, this.reconnectInterval);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }
}

/**
 * Polling-based client (fallback if WebSocket is not available)
 */
export class PollingClient {
  private apiUrl: string;
  private pollInterval: number = 2000;
  private pollTimer: any = null;
  private isPolling: boolean = false;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();

  constructor(apiUrl: string, pollInterval: number = 2000) {
    this.apiUrl = apiUrl;
    this.pollInterval = pollInterval;
  }

  /**
   * Start polling
   */
  public start(): void {
    if (this.isPolling) {
      return;
    }

    console.log('Starting polling client');
    this.isPolling = true;
    this.poll();

    // Emit connected event
    const handlers = this.messageHandlers.get('connected');
    if (handlers) {
      handlers.forEach(handler => handler({ type: 'connected' }));
    }
  }

  /**
   * Stop polling
   */
  public stop(): void {
    if (!this.isPolling) {
      return;
    }

    console.log('Stopping polling client');
    this.isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    // Emit disconnected event
    const handlers = this.messageHandlers.get('disconnected');
    if (handlers) {
      handlers.forEach(handler => handler({ type: 'disconnected' }));
    }
  }

  /**
   * Register a message handler
   */
  public on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Remove a message handler
   */
  public off(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Check if polling is active
   */
  public isConnected(): boolean {
    return this.isPolling;
  }

  /**
   * Poll for metrics
   */
  private async poll(): Promise<void> {
    if (!this.isPolling) {
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/metrics/current`);
      const data = await response.json();

      if (data.success) {
        // Emit metrics update
        const message = {
          type: 'metrics_update',
          timestamp: data.timestamp,
          data: data.data,
        };

        const handlers = this.messageHandlers.get('metrics_update');
        if (handlers) {
          handlers.forEach(handler => handler(message));
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }

    // Schedule next poll
    this.pollTimer = setTimeout(() => {
      this.poll();
    }, this.pollInterval);
  }
}

/**
 * Create client with automatic fallback
 */
export function createClient(
  websocketUrl: string,
  pollingUrl: string,
  pollInterval: number = 2000
): WebSocketClient | PollingClient {
  // Try WebSocket first
  if (typeof WebSocket !== 'undefined') {
    return new WebSocketClient(websocketUrl);
  }

  // Fallback to polling
  console.log('WebSocket not available, using polling');
  return new PollingClient(pollingUrl, pollInterval);
}
