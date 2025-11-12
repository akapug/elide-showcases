/**
 * Elide Desktop Framework - Event System
 *
 * High-performance event emitter for native desktop applications.
 */

type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();
  private onceWrappers: WeakMap<EventListener, EventListener> = new WeakMap();

  on(event: string, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return this;
  }

  once(event: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };

    this.onceWrappers.set(listener, onceWrapper);
    return this.on(event, onceWrapper);
  }

  off(event: string, listener: EventListener): this {
    const listeners = this.events.get(event);
    if (!listeners) return this;

    // Check if this is a once wrapper
    const wrapper = this.onceWrappers.get(listener);
    if (wrapper) {
      listeners.delete(wrapper);
      this.onceWrappers.delete(listener);
    } else {
      listeners.delete(listener);
    }

    if (listeners.size === 0) {
      this.events.delete(event);
    }

    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.size === 0) return false;

    // Create a copy to avoid issues with listeners being removed during emit
    const listenersArray = Array.from(listeners);
    for (const listener of listenersArray) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }

    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
      this.onceWrappers = new WeakMap();
    }
    return this;
  }

  listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }

  listeners(event: string): EventListener[] {
    const listeners = this.events.get(event);
    return listeners ? Array.from(listeners) : [];
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}
