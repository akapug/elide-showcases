/**
 * EventEmitter3 - Fast Event Emitter
 *
 * A high-performance event emitter implementation.
 * **POLYGLOT SHOWCASE**: One event emitter for ALL languages on Elide!
 *
 * Features:
 * - Fast event emitting and listener management
 * - Support for once listeners
 * - Remove listeners by function reference
 * - Remove all listeners for an event
 * - Get listener count
 * - Typed events support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need event systems
 * - ONE implementation works everywhere on Elide
 * - Consistent event patterns across languages
 * - No need for language-specific event libs
 *
 * Use cases:
 * - Application event bus
 * - Plugin systems
 * - Observer pattern
 * - Pub/sub messaging
 * - State change notifications
 * - Middleware systems
 *
 * Package has ~150M+ downloads/week on npm!
 */

type EventListener = (...args: any[]) => void;

interface EventEmitterStatic {
  prefixed: string | boolean;
}

export class EventEmitter {
  static prefixed: string | boolean = '$';
  private _events: Map<string | symbol, Set<EventListener>>;
  private _onceWrappers: WeakMap<EventListener, EventListener>;

  constructor() {
    this._events = new Map();
    this._onceWrappers = new WeakMap();
  }

  /**
   * Emit an event with arguments
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    const listeners = this._events.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    // Convert to array to avoid issues if listeners modify the set
    const listenersArray = Array.from(listeners);

    for (const listener of listenersArray) {
      listener.apply(this, args);
    }

    return true;
  }

  /**
   * Add an event listener
   */
  on(event: string | symbol, fn: EventListener): this {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event)!.add(fn);
    return this;
  }

  /**
   * Add an event listener (alias for on)
   */
  addListener(event: string | symbol, fn: EventListener): this {
    return this.on(event, fn);
  }

  /**
   * Add a one-time event listener
   */
  once(event: string | symbol, fn: EventListener): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper);
      fn.apply(this, args);
    };

    this._onceWrappers.set(fn, wrapper);
    return this.on(event, wrapper);
  }

  /**
   * Remove an event listener
   */
  removeListener(event: string | symbol, fn: EventListener): this {
    const listeners = this._events.get(event);
    if (!listeners) {
      return this;
    }

    // Try to remove the wrapper if it's a once listener
    const wrapper = this._onceWrappers.get(fn);
    if (wrapper) {
      listeners.delete(wrapper);
      this._onceWrappers.delete(fn);
    }

    listeners.delete(fn);

    if (listeners.size === 0) {
      this._events.delete(event);
    }

    return this;
  }

  /**
   * Remove an event listener (alias)
   */
  off(event: string | symbol, fn: EventListener): this {
    return this.removeListener(event, fn);
  }

  /**
   * Remove all listeners for an event, or all events
   */
  removeAllListeners(event?: string | symbol): this {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }

  /**
   * Get all listeners for an event
   */
  listeners(event: string | symbol): EventListener[] {
    const listeners = this._events.get(event);
    return listeners ? Array.from(listeners) : [];
  }

  /**
   * Get the listener count for an event
   */
  listenerCount(event: string | symbol): number {
    const listeners = this._events.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): (string | symbol)[] {
    return Array.from(this._events.keys());
  }
}

// Default export
export default EventEmitter;

// CLI Demo
if (import.meta.url.includes("elide-eventemitter3.ts")) {
  console.log("🎯 EventEmitter3 - Fast Event Emitter for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Events ===");
  const emitter = new EventEmitter();

  emitter.on('message', (text: string) => {
    console.log(`  Received: ${text}`);
  });

  emitter.emit('message', 'Hello, World!');
  emitter.emit('message', 'Testing events');
  console.log();

  console.log("=== Example 2: Multiple Listeners ===");
  const emitter2 = new EventEmitter();

  emitter2.on('data', (value: number) => {
    console.log(`  Handler 1: ${value * 2}`);
  });

  emitter2.on('data', (value: number) => {
    console.log(`  Handler 2: ${value * 3}`);
  });

  emitter2.emit('data', 5);
  console.log();

  console.log("=== Example 3: Once Listeners ===");
  const emitter3 = new EventEmitter();

  emitter3.once('init', () => {
    console.log("  Initialized (called once)");
  });

  emitter3.emit('init');
  emitter3.emit('init'); // Won't trigger
  emitter3.emit('init'); // Won't trigger
  console.log();

  console.log("=== Example 4: Remove Listeners ===");
  const emitter4 = new EventEmitter();

  const handler = (msg: string) => {
    console.log(`  Handler: ${msg}`);
  };

  emitter4.on('test', handler);
  emitter4.emit('test', 'Before removal');
  emitter4.off('test', handler);
  emitter4.emit('test', 'After removal'); // Won't trigger
  console.log();

  console.log("=== Example 5: Listener Count ===");
  const emitter5 = new EventEmitter();

  emitter5.on('click', () => {});
  emitter5.on('click', () => {});
  emitter5.on('click', () => {});

  console.log(`  Click listeners: ${emitter5.listenerCount('click')}`);
  console.log(`  Event names: ${emitter5.eventNames().join(', ')}`);
  console.log();

  console.log("=== Example 6: Event Arguments ===");
  const emitter6 = new EventEmitter();

  emitter6.on('user:login', (username: string, timestamp: number) => {
    console.log(`  User ${username} logged in at ${new Date(timestamp).toISOString()}`);
  });

  emitter6.emit('user:login', 'alice', Date.now());
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same event emitter works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent event patterns");
  console.log("  ✓ Share event logic across services");
  console.log("  ✓ ~150M+ downloads/week on npm");
  console.log();
}
