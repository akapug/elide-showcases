/**
 * Event Emitter
 *
 * Simple event emitter implementation with TypeScript support
 */

export type EventHandler<T = any> = (data: T) => void;
export type EventMap = Record<string, any>;

export class EventEmitter<Events extends EventMap = EventMap> {
  private events: Map<keyof Events, Set<EventHandler>> = new Map();

  /**
   * Register event listener
   */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const handlers = this.events.get(event)!;
    handlers.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Register one-time event listener
   */
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const wrappedHandler = (data: Events[K]) => {
      handler(data);
      this.off(event, wrappedHandler as EventHandler);
    };

    this.on(event, wrappedHandler as EventHandler<Events[K]>);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit event
   */
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount<K extends keyof Events>(event: K): number {
    return this.events.get(event)?.size || 0;
  }

  /**
   * Get all event names
   */
  eventNames(): Array<keyof Events> {
    return Array.from(this.events.keys());
  }
}
