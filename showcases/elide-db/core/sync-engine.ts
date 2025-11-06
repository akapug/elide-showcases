/**
 * SyncEngine - Handles bi-directional sync between local and remote databases
 * Uses vector clocks for causal ordering and conflict detection
 */

import {
  Change,
  SyncMessage,
  VectorClock,
  Timestamp,
  ReplicationState,
  StorageAdapter
} from '../types';
import { ConflictResolver } from './conflict-resolver';

export interface SyncEngineConfig {
  clientId: string;
  syncUrl: string;
  storage: StorageAdapter;
  conflictResolver: ConflictResolver;
  syncInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class SyncEngine {
  private config: SyncEngineConfig;
  private ws: WebSocket | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private vectorClock: VectorClock = {};
  private lastSyncTime: Timestamp = 0;
  private pendingChanges: Change[] = [];
  private syncInProgress: boolean = false;
  private retryCount: number = 0;
  private listeners: Set<(state: ReplicationState) => void> = new Set();

  constructor(config: SyncEngineConfig) {
    this.config = {
      syncInterval: 5000,
      retryAttempts: 3,
      retryDelay: 2000,
      ...config
    };
    this.vectorClock[config.clientId] = 0;
  }

  /**
   * Start the sync engine
   */
  async start(): Promise<void> {
    // Load replication state from storage
    await this.loadReplicationState();

    // Connect to sync server
    await this.connect();

    // Perform initial sync
    await this.sync();

    // Start periodic sync
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        this.sync().catch(err => console.error('Sync error:', err));
      }, this.config.syncInterval);
    }
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Connect to the sync server via WebSocket
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.syncUrl);

        this.ws.onopen = () => {
          console.log('Connected to sync server');
          this.retryCount = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.handleDisconnect();
        };

        this.ws.onclose = () => {
          console.log('Disconnected from sync server');
          this.handleDisconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket disconnection with retry logic
   */
  private handleDisconnect(): void {
    this.ws = null;

    if (this.retryCount < (this.config.retryAttempts || 3)) {
      this.retryCount++;
      console.log(`Reconnecting... (attempt ${this.retryCount})`);

      setTimeout(() => {
        this.connect().catch(err => console.error('Reconnection failed:', err));
      }, this.config.retryDelay);
    }
  }

  /**
   * Perform a full sync operation
   */
  async sync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      // Phase 1: Push local changes to server
      await this.pushChanges();

      // Phase 2: Pull remote changes from server
      await this.pullChanges();

      // Update sync time
      this.lastSyncTime = Date.now();

      // Save replication state
      await this.saveReplicationState();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Push local changes to server
   */
  private async pushChanges(): Promise<void> {
    // Get changes since last sync
    const changes = await this.config.storage.getChanges(this.lastSyncTime);

    if (changes.length === 0) {
      console.log('No local changes to push');
      return;
    }

    console.log(`Pushing ${changes.length} changes to server`);

    // Send changes to server
    const message: SyncMessage = {
      type: 'push',
      clientId: this.config.clientId,
      changes,
      vectorClock: this.vectorClock
    };

    await this.sendMessage(message);

    // Wait for acknowledgment
    await this.waitForAck();

    // Increment our vector clock
    this.vectorClock[this.config.clientId]++;
  }

  /**
   * Pull remote changes from server
   */
  private async pullChanges(): Promise<void> {
    console.log('Pulling changes from server');

    // Request changes from server
    const message: SyncMessage = {
      type: 'pull',
      clientId: this.config.clientId,
      lastSyncTime: this.lastSyncTime,
      vectorClock: this.vectorClock
    };

    await this.sendMessage(message);

    // Wait for response (handled in handleMessage)
  }

  /**
   * Handle incoming sync messages
   */
  private async handleMessage(message: SyncMessage): Promise<void> {
    console.log('Received message:', message.type);

    switch (message.type) {
      case 'sync':
        // Server is sending us changes
        if (message.changes && message.changes.length > 0) {
          await this.applyRemoteChanges(message.changes);
        }

        // Update vector clock
        if (message.vectorClock) {
          this.mergeVectorClocks(message.vectorClock);
        }

        // Send acknowledgment
        await this.sendMessage({
          type: 'ack',
          clientId: this.config.clientId,
          vectorClock: this.vectorClock
        });
        break;

      case 'ack':
        // Server acknowledged our push
        console.log('Server acknowledged changes');
        break;

      case 'push':
        // Server is pushing changes to us
        if (message.changes) {
          await this.applyRemoteChanges(message.changes);
        }
        break;
    }
  }

  /**
   * Apply remote changes with conflict resolution
   */
  private async applyRemoteChanges(remoteChanges: Change[]): Promise<void> {
    console.log(`Applying ${remoteChanges.length} remote changes`);

    // Get local changes that might conflict
    const localChanges = await this.config.storage.getChanges(0);

    // Detect and resolve conflicts
    const resolvedChanges: Change[] = [];

    for (const remoteChange of remoteChanges) {
      // Find conflicting local change
      const conflictingLocal = localChanges.find(
        local =>
          local.documentId === remoteChange.documentId &&
          local.table === remoteChange.table &&
          local.timestamp >= remoteChange.timestamp
      );

      if (conflictingLocal) {
        // Conflict detected - resolve it
        console.log(`Conflict detected for document ${remoteChange.documentId}`);
        const resolved = this.config.conflictResolver.resolve(
          conflictingLocal,
          remoteChange,
          this.vectorClock
        );
        resolvedChanges.push(resolved);
      } else {
        // No conflict - apply remote change directly
        resolvedChanges.push(remoteChange);
      }
    }

    // Apply resolved changes to local storage
    await this.config.storage.applyChanges(resolvedChanges);

    console.log(`Applied ${resolvedChanges.length} changes`);
  }

  /**
   * Merge vector clocks from remote
   */
  private mergeVectorClocks(remoteVectorClock: VectorClock): void {
    for (const [clientId, version] of Object.entries(remoteVectorClock)) {
      if (!this.vectorClock[clientId] || this.vectorClock[clientId] < version) {
        this.vectorClock[clientId] = version;
      }
    }
  }

  /**
   * Send a message to the server
   */
  private async sendMessage(message: SyncMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws!.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Wait for acknowledgment from server
   */
  private async waitForAck(): Promise<void> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const message = JSON.parse(event.data) as SyncMessage;
        if (message.type === 'ack') {
          this.ws!.removeEventListener('message', handler);
          resolve();
        }
      };

      this.ws!.addEventListener('message', handler);

      // Timeout after 10 seconds
      setTimeout(() => {
        this.ws!.removeEventListener('message', handler);
        resolve();
      }, 10000);
    });
  }

  /**
   * Load replication state from storage
   */
  private async loadReplicationState(): Promise<void> {
    try {
      const state = await this.config.storage.getMetadata('replicationState');
      if (state) {
        this.lastSyncTime = state.lastSyncTime || 0;
        this.vectorClock = state.vectorClock || { [this.config.clientId]: 0 };
        this.pendingChanges = state.pendingChanges || [];
      }
    } catch (error) {
      console.error('Failed to load replication state:', error);
    }
  }

  /**
   * Save replication state to storage
   */
  private async saveReplicationState(): Promise<void> {
    try {
      const state: ReplicationState = {
        lastSyncTime: this.lastSyncTime,
        vectorClock: this.vectorClock,
        pendingChanges: this.pendingChanges,
        syncInProgress: this.syncInProgress
      };

      await this.config.storage.setMetadata('replicationState', state);
    } catch (error) {
      console.error('Failed to save replication state:', error);
    }
  }

  /**
   * Get current replication state
   */
  getState(): ReplicationState {
    return {
      lastSyncTime: this.lastSyncTime,
      vectorClock: this.vectorClock,
      pendingChanges: this.pendingChanges,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Subscribe to replication state changes
   */
  onStateChange(listener: (state: ReplicationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Force an immediate sync
   */
  async forceSync(): Promise<void> {
    return this.sync();
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Node.js version using ws library
 */
export class SyncEngineNode extends SyncEngine {
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const WebSocket = require('ws');
        const ws = new WebSocket(this.config.syncUrl);

        ws.on('open', () => {
          console.log('Connected to sync server');
          this.retryCount = 0;
          this.ws = ws as any;
          resolve();
        });

        ws.on('message', (data: string) => {
          this.handleMessage(JSON.parse(data));
        });

        ws.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        ws.on('close', () => {
          console.log('Disconnected from sync server');
          this.handleDisconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
