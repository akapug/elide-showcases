/**
 * SubscriptionManager - Manages real-time subscriptions to query results
 * Notifies subscribers when data changes
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  Query,
  Subscription,
  TableName,
  StorageAdapter
} from '../types';

interface ActiveSubscription {
  id: string;
  query: Query;
  callback: (documents: Document[]) => void;
  lastResults: Document[];
}

export class SubscriptionManager {
  private storage: StorageAdapter;
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private tableSubscriptions: Map<TableName, Set<string>> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  private pollFrequency: number = 1000; // 1 second

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Subscribe to query results
   */
  subscribe(query: Query, callback: (documents: Document[]) => void): Subscription {
    const id = uuidv4();

    // Execute query to get initial results
    this.storage.query(query).then(results => {
      const subscription: ActiveSubscription = {
        id,
        query,
        callback,
        lastResults: results
      };

      this.subscriptions.set(id, subscription);

      // Track by table for efficient notification
      if (!this.tableSubscriptions.has(query.table)) {
        this.tableSubscriptions.set(query.table, new Set());
      }
      this.tableSubscriptions.get(query.table)!.add(id);

      // Call callback with initial results
      callback(results);

      // Start polling if not already started
      this.startPolling();
    });

    // Return subscription object
    return {
      id,
      query,
      callback,
      unsubscribe: () => this.unsubscribe(id)
    };
  }

  /**
   * Unsubscribe from a subscription
   */
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return;

    // Remove from table subscriptions
    const tableSet = this.tableSubscriptions.get(subscription.query.table);
    if (tableSet) {
      tableSet.delete(id);
      if (tableSet.size === 0) {
        this.tableSubscriptions.delete(subscription.query.table);
      }
    }

    // Remove subscription
    this.subscriptions.delete(id);

    // Stop polling if no more subscriptions
    if (this.subscriptions.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * Notify subscribers when a table changes
   */
  async notifySubscribers(table: TableName): Promise<void> {
    const subscriptionIds = this.tableSubscriptions.get(table);
    if (!subscriptionIds) return;

    for (const id of subscriptionIds) {
      await this.checkSubscription(id);
    }
  }

  /**
   * Check if a subscription's results have changed
   */
  private async checkSubscription(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return;

    try {
      const newResults = await this.storage.query(subscription.query);

      // Check if results have changed
      if (this.hasResultsChanged(subscription.lastResults, newResults)) {
        subscription.lastResults = newResults;
        subscription.callback(newResults);
      }
    } catch (error) {
      console.error(`Error checking subscription ${id}:`, error);
    }
  }

  /**
   * Check if query results have changed
   */
  private hasResultsChanged(oldResults: Document[], newResults: Document[]): boolean {
    if (oldResults.length !== newResults.length) {
      return true;
    }

    // Quick check: compare IDs and versions
    const oldMap = new Map(oldResults.map(doc => [doc.id, doc._version]));
    const newMap = new Map(newResults.map(doc => [doc.id, doc._version]));

    // Check if any documents were added or removed
    for (const [id] of oldMap) {
      if (!newMap.has(id)) return true;
    }
    for (const [id] of newMap) {
      if (!oldMap.has(id)) return true;
    }

    // Check if any document versions changed
    for (const [id, version] of oldMap) {
      if (newMap.get(id) !== version) return true;
    }

    return false;
  }

  /**
   * Start polling for changes
   */
  private startPolling(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(() => {
      this.pollSubscriptions();
    }, this.pollFrequency);
  }

  /**
   * Stop polling for changes
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Poll all subscriptions for changes
   */
  private async pollSubscriptions(): Promise<void> {
    const promises = Array.from(this.subscriptions.keys()).map(id =>
      this.checkSubscription(id)
    );

    await Promise.all(promises);
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.stopPolling();
    this.subscriptions.clear();
    this.tableSubscriptions.clear();
  }

  /**
   * Get active subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get active subscriptions for a table
   */
  getTableSubscriptionCount(table: TableName): number {
    const subscriptionIds = this.tableSubscriptions.get(table);
    return subscriptionIds ? subscriptionIds.size : 0;
  }

  /**
   * Set poll frequency (in milliseconds)
   */
  setPollFrequency(frequency: number): void {
    this.pollFrequency = frequency;

    // Restart polling with new frequency
    if (this.pollInterval) {
      this.stopPolling();
      this.startPolling();
    }
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): Array<{ id: string; query: Query }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      query: sub.query
    }));
  }
}

/**
 * Reactive subscription wrapper for frameworks like React
 */
export class ReactiveSubscription<T extends Document> {
  private subscription: Subscription | null = null;
  private listeners: Set<(data: T[]) => void> = new Set();
  private currentData: T[] = [];

  constructor(
    private query: Query,
    private manager: SubscriptionManager
  ) {}

  /**
   * Start the subscription
   */
  start(): void {
    if (this.subscription) return;

    this.subscription = this.manager.subscribe(this.query, (documents) => {
      this.currentData = documents as T[];
      this.notifyListeners();
    });
  }

  /**
   * Stop the subscription
   */
  stop(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Subscribe to data changes
   */
  onChange(listener: (data: T[]) => void): () => void {
    this.listeners.add(listener);

    // Call with current data
    if (this.currentData.length > 0) {
      listener(this.currentData);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentData));
  }

  /**
   * Get current data
   */
  getData(): T[] {
    return this.currentData;
  }
}

/**
 * React hook for ElideDB subscriptions
 */
export function useElideQuery<T extends Document>(
  query: Query,
  manager: SubscriptionManager
): {
  data: T[];
  loading: boolean;
  error: Error | null;
} {
  // This would be a proper React hook in a real implementation
  // For now, it's a placeholder showing the intended API

  const reactive = new ReactiveSubscription<T>(query, manager);
  reactive.start();

  return {
    data: reactive.getData(),
    loading: false,
    error: null
  };
}

/**
 * Batch subscription updates
 */
export class BatchSubscriptionManager extends SubscriptionManager {
  private batchQueue: Set<TableName> = new Set();
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number = 50; // 50ms debounce

  async notifySubscribers(table: TableName): Promise<void> {
    // Add to batch queue
    this.batchQueue.add(table);

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Set new timeout
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  private async processBatch(): Promise<void> {
    const tables = Array.from(this.batchQueue);
    this.batchQueue.clear();
    this.batchTimeout = null;

    // Process all tables in parallel
    await Promise.all(
      tables.map(table => super.notifySubscribers(table))
    );
  }

  setBatchDelay(delay: number): void {
    this.batchDelay = delay;
  }
}
