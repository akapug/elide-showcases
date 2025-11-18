/**
 * Events - Node.js Events Module
 *
 * Node.js-compatible event emitter implementation.
 * **POLYGLOT SHOWCASE**: Node events for ALL languages on Elide!
 *
 * Features:
 * - Node.js EventEmitter compatibility
 * - Max listeners warning
 * - Prepend listeners
 * - Error event handling
 * - Event name enumeration
 * - Typed events support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can use Node.js event patterns
 * - ONE implementation works everywhere on Elide
 * - Compatible with Node.js code
 * - No need for language-specific event libs
 *
 * Use cases:
 * - Node.js compatibility
 * - Stream implementations
 * - Server event handling
 * - Process event management
 * - Error propagation
 * - State machines
 *
 * Package has ~150M+ downloads/week on npm!
 */

type Listener = (...args: any[]) => void;

export class EventEmitter {
  private _events: Map<string | symbol, Listener[]>;
  private _maxListeners: number;
  static defaultMaxListeners = 10;

  constructor() {
    this._events = new Map();
    this._maxListeners = EventEmitter.defaultMaxListeners;
  }

  /**
   * Set max listeners for this emitter
   */
  setMaxListeners(n: number): this {
    this._maxListeners = n;
    return this;
  }

  /**
   * Get max listeners for this emitter
   */
  getMaxListeners(): number {
    return this._maxListeners;
  }

  /**
   * Emit an event
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    const listeners = this._events.get(event);

    if (!listeners || listeners.length === 0) {
      // Special handling for 'error' event
      if (event === 'error') {
        const err = args[0];
        if (err instanceof Error) {
          throw err;
        }
        throw new Error('Unhandled error event');
      }
      return false;
    }

    // Clone array to avoid issues if listeners modify the array
    const listenersCopy = listeners.slice();

    for (const listener of listenersCopy) {
      listener.apply(this, args);
    }

    return true;
  }

  /**
   * Add listener to the end of the listeners array
   */
  on(event: string | symbol, listener: Listener): this {
    return this._addListener(event, listener, false);
  }

  /**
   * Add listener (alias for on)
   */
  addListener(event: string | symbol, listener: Listener): this {
    return this.on(event, listener);
  }

  /**
   * Add listener to the beginning of the listeners array
   */
  prependListener(event: string | symbol, listener: Listener): this {
    return this._addListener(event, listener, true);
  }

  /**
   * Add one-time listener
   */
  once(event: string | symbol, listener: Listener): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper);
      listener.apply(this, args);
    };
    (wrapper as any).listener = listener;
    return this.on(event, wrapper);
  }

  /**
   * Add one-time listener at the beginning
   */
  prependOnceListener(event: string | symbol, listener: Listener): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper);
      listener.apply(this, args);
    };
    (wrapper as any).listener = listener;
    return this.prependListener(event, wrapper);
  }

  /**
   * Remove listener
   */
  removeListener(event: string | symbol, listener: Listener): this {
    const listeners = this._events.get(event);
    if (!listeners) {
      return this;
    }

    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === listener || (listeners[i] as any).listener === listener) {
        listeners.splice(i, 1);
        break;
      }
    }

    if (listeners.length === 0) {
      this._events.delete(event);
    }

    return this;
  }

  /**
   * Remove listener (alias)
   */
  off(event: string | symbol, listener: Listener): this {
    return this.removeListener(event, listener);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string | symbol): this {
    if (event !== undefined) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }

  /**
   * Get listeners array for an event
   */
  listeners(event: string | symbol): Listener[] {
    const listeners = this._events.get(event);
    return listeners ? listeners.slice() : [];
  }

  /**
   * Get raw listeners (including wrappers)
   */
  rawListeners(event: string | symbol): Listener[] {
    return this.listeners(event);
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string | symbol): number {
    const listeners = this._events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): (string | symbol)[] {
    return Array.from(this._events.keys());
  }

  /**
   * Internal: Add listener
   */
  private _addListener(event: string | symbol, listener: Listener, prepend: boolean): this {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    const listeners = this._events.get(event)!;

    if (prepend) {
      listeners.unshift(listener);
    } else {
      listeners.push(listener);
    }

    // Check max listeners
    if (this._maxListeners > 0 && listeners.length > this._maxListeners) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ` +
        `${listeners.length} ${String(event)} listeners added. ` +
        `Use emitter.setMaxListeners() to increase limit`
      );
    }

    return this;
  }
}

export default EventEmitter;

// CLI Demo
if (import.meta.url.includes("elide-events.ts")) {
  console.log("🎯 Events - Node.js Events Module for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Events ===");
  const emitter = new EventEmitter();

  emitter.on('message', (text: string) => {
    console.log(`  Received: ${text}`);
  });

  emitter.emit('message', 'Hello from Node events!');
  console.log();

  console.log("=== Example 2: Prepend Listeners ===");
  const emitter2 = new EventEmitter();

  emitter2.on('data', () => console.log("  Second"));
  emitter2.prependListener('data', () => console.log("  First"));

  emitter2.emit('data');
  console.log();

  console.log("=== Example 3: Once Listeners ===");
  const emitter3 = new EventEmitter();

  emitter3.once('init', () => {
    console.log("  Initialized (called once)");
  });

  emitter3.emit('init');
  emitter3.emit('init'); // Won't trigger
  console.log();

  console.log("=== Example 4: Max Listeners ===");
  const emitter4 = new EventEmitter();
  emitter4.setMaxListeners(2);

  console.log(`  Max listeners: ${emitter4.getMaxListeners()}`);
  console.log();

  console.log("=== Example 5: Event Names ===");
  const emitter5 = new EventEmitter();

  emitter5.on('data', () => {});
  emitter5.on('message', () => {});
  emitter5.on('error', () => {});

  console.log(`  Event names: ${emitter5.eventNames().join(', ')}`);
  console.log(`  Listener counts:`);
  emitter5.eventNames().forEach(name => {
    console.log(`    ${String(name)}: ${emitter5.listenerCount(name)}`);
  });
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Node.js events work in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Node.js compatibility");
  console.log("  ✓ Stream implementations");
  console.log("  ✓ Error event handling");
  console.log("  ✓ ~150M+ downloads/week on npm");
  console.log();
}
