/**
 * Events - Node.js EventEmitter Implementation for Elide
 *
 * Full implementation of Node.js EventEmitter pattern.
 * **POLYGLOT SHOWCASE**: Event-driven programming for ALL languages on Elide!
 *
 * Features:
 * - EventEmitter class
 * - Event listeners and emitters
 * - Once listeners
 * - Remove listeners
 * - Error handling
 * - Max listeners warning
 * - Prepend listeners
 * - Event names and counts
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need event-driven patterns
 * - ONE implementation works everywhere on Elide
 * - Consistent event API across languages
 * - Share event patterns across your stack
 *
 * Use cases:
 * - Asynchronous programming
 * - Publish-subscribe patterns
 * - Stream processing
 * - Server events
 * - Custom event systems
 * - Plugin architectures
 */

export type Listener = (...args: any[]) => void;

interface ListenerWrapper {
  listener: Listener;
  once: boolean;
}

/**
 * EventEmitter class - Node.js compatible implementation
 */
export class EventEmitter {
  private events: Map<string | symbol, ListenerWrapper[]> = new Map();
  private maxListeners: number = 10;
  private static defaultMaxListeners: number = 10;

  /**
   * Add an event listener
   */
  on(eventName: string | symbol, listener: Listener): this {
    return this.addListener(eventName, listener);
  }

  /**
   * Add an event listener (alias for on)
   */
  addListener(eventName: string | symbol, listener: Listener): this {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    const listeners = this.events.get(eventName) || [];
    listeners.push({ listener, once: false });
    this.events.set(eventName, listeners);

    // Emit newListener event
    if (eventName !== 'newListener') {
      this.emit('newListener', eventName, listener);
    }

    // Check max listeners
    this.checkMaxListeners(eventName, listeners.length);

    return this;
  }

  /**
   * Add a one-time event listener
   */
  once(eventName: string | symbol, listener: Listener): this {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    const listeners = this.events.get(eventName) || [];
    listeners.push({ listener, once: true });
    this.events.set(eventName, listeners);

    // Emit newListener event
    if (eventName !== 'newListener') {
      this.emit('newListener', eventName, listener);
    }

    // Check max listeners
    this.checkMaxListeners(eventName, listeners.length);

    return this;
  }

  /**
   * Remove an event listener
   */
  off(eventName: string | symbol, listener: Listener): this {
    return this.removeListener(eventName, listener);
  }

  /**
   * Remove an event listener (alias for off)
   */
  removeListener(eventName: string | symbol, listener: Listener): this {
    const listeners = this.events.get(eventName);
    if (!listeners) {
      return this;
    }

    const index = listeners.findIndex(wrapper => wrapper.listener === listener);
    if (index !== -1) {
      listeners.splice(index, 1);

      // Emit removeListener event
      if (eventName !== 'removeListener') {
        this.emit('removeListener', eventName, listener);
      }

      if (listeners.length === 0) {
        this.events.delete(eventName);
      }
    }

    return this;
  }

  /**
   * Remove all listeners for an event (or all events)
   */
  removeAllListeners(eventName?: string | symbol): this {
    if (eventName === undefined) {
      // Remove all listeners for all events
      const eventNames = Array.from(this.events.keys());
      for (const name of eventNames) {
        this.removeAllListeners(name);
      }
      this.events.clear();
    } else {
      const listeners = this.events.get(eventName);
      if (listeners) {
        // Emit removeListener for each
        for (const wrapper of listeners) {
          if (eventName !== 'removeListener') {
            this.emit('removeListener', eventName, wrapper.listener);
          }
        }
        this.events.delete(eventName);
      }
    }

    return this;
  }

  /**
   * Emit an event
   */
  emit(eventName: string | symbol, ...args: any[]): boolean {
    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      // Special case for 'error' event
      if (eventName === 'error') {
        const error = args[0];
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Unhandled error event: ${error}`);
        }
      }
      return false;
    }

    // Make a copy to handle once listeners safely
    const listenersCopy = [...listeners];

    for (const wrapper of listenersCopy) {
      try {
        wrapper.listener.apply(this, args);
      } catch (err) {
        // If error in error handler, we need to throw
        if (eventName === 'error') {
          throw err;
        }
        // Otherwise emit error event
        this.emit('error', err);
      }

      // Remove once listeners
      if (wrapper.once) {
        this.removeListener(eventName, wrapper.listener);
      }
    }

    return true;
  }

  /**
   * Get listeners for an event
   */
  listeners(eventName: string | symbol): Listener[] {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.map(wrapper => wrapper.listener) : [];
  }

  /**
   * Get raw listeners (including wrapped once listeners)
   */
  rawListeners(eventName: string | symbol): Listener[] {
    return this.listeners(eventName);
  }

  /**
   * Get listener count for an event
   */
  listenerCount(eventName: string | symbol): number {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): (string | symbol)[] {
    return Array.from(this.events.keys());
  }

  /**
   * Prepend a listener (add to beginning)
   */
  prependListener(eventName: string | symbol, listener: Listener): this {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    const listeners = this.events.get(eventName) || [];
    listeners.unshift({ listener, once: false });
    this.events.set(eventName, listeners);

    // Emit newListener event
    if (eventName !== 'newListener') {
      this.emit('newListener', eventName, listener);
    }

    // Check max listeners
    this.checkMaxListeners(eventName, listeners.length);

    return this;
  }

  /**
   * Prepend a one-time listener (add to beginning)
   */
  prependOnceListener(eventName: string | symbol, listener: Listener): this {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    const listeners = this.events.get(eventName) || [];
    listeners.unshift({ listener, once: true });
    this.events.set(eventName, listeners);

    // Emit newListener event
    if (eventName !== 'newListener') {
      this.emit('newListener', eventName, listener);
    }

    // Check max listeners
    this.checkMaxListeners(eventName, listeners.length);

    return this;
  }

  /**
   * Set max listeners for this emitter
   */
  setMaxListeners(n: number): this {
    if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) {
      throw new RangeError('n must be a non-negative number');
    }
    this.maxListeners = n;
    return this;
  }

  /**
   * Get max listeners for this emitter
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * Check if we've exceeded max listeners
   */
  private checkMaxListeners(eventName: string | symbol, count: number): void {
    if (this.maxListeners > 0 && count > this.maxListeners) {
      const warning = `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ` +
        `${count} ${String(eventName)} listeners added. ` +
        `Use emitter.setMaxListeners() to increase limit`;
      console.warn(warning);
    }
  }

  /**
   * Set default max listeners for all emitters
   */
  static setDefaultMaxListeners(n: number): void {
    if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) {
      throw new RangeError('n must be a non-negative number');
    }
    EventEmitter.defaultMaxListeners = n;
  }

  /**
   * Get default max listeners
   */
  static getDefaultMaxListeners(): number {
    return EventEmitter.defaultMaxListeners;
  }

  /**
   * Get listener count (static method for compatibility)
   */
  static listenerCount(emitter: EventEmitter, eventName: string | symbol): number {
    return emitter.listenerCount(eventName);
  }
}

// Export default
export default EventEmitter;

// Named exports for compatibility
export { EventEmitter as events };

// CLI Demo
if (import.meta.url.includes("events.ts")) {
  console.log("📡 Events - EventEmitter for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Events ===");
  const emitter1 = new EventEmitter();

  emitter1.on('greet', (name: string) => {
    console.log(`Hello, ${name}!`);
  });

  emitter1.emit('greet', 'Alice');
  emitter1.emit('greet', 'Bob');
  console.log();

  console.log("=== Example 2: Multiple Listeners ===");
  const emitter2 = new EventEmitter();

  emitter2.on('data', (data: any) => {
    console.log('Listener 1:', data);
  });

  emitter2.on('data', (data: any) => {
    console.log('Listener 2:', data);
  });

  emitter2.emit('data', { value: 42 });
  console.log();

  console.log("=== Example 3: Once Listeners ===");
  const emitter3 = new EventEmitter();

  emitter3.once('init', () => {
    console.log('Initialized! (only once)');
  });

  emitter3.emit('init');
  emitter3.emit('init'); // Won't print
  console.log();

  console.log("=== Example 4: Remove Listeners ===");
  const emitter4 = new EventEmitter();

  const handler = (msg: string) => {
    console.log('Message:', msg);
  };

  emitter4.on('message', handler);
  emitter4.emit('message', 'Hello');

  emitter4.removeListener('message', handler);
  emitter4.emit('message', 'World'); // Won't print
  console.log();

  console.log("=== Example 5: Event Names and Count ===");
  const emitter5 = new EventEmitter();

  emitter5.on('start', () => {});
  emitter5.on('stop', () => {});
  emitter5.on('data', () => {});
  emitter5.on('data', () => {});

  console.log('Event names:', emitter5.eventNames());
  console.log('Listeners for "data":', emitter5.listenerCount('data'));
  console.log();

  console.log("=== Example 6: Error Handling ===");
  const emitter6 = new EventEmitter();

  emitter6.on('error', (err: Error) => {
    console.log('Error caught:', err.message);
  });

  emitter6.emit('error', new Error('Something went wrong'));
  console.log();

  console.log("=== Example 7: Max Listeners ===");
  const emitter7 = new EventEmitter();
  emitter7.setMaxListeners(2);

  emitter7.on('test', () => {});
  emitter7.on('test', () => {});
  console.log('Max listeners:', emitter7.getMaxListeners());
  console.log('Current listeners:', emitter7.listenerCount('test'));
  console.log();

  console.log("=== Example 8: Prepend Listeners ===");
  const emitter8 = new EventEmitter();

  emitter8.on('order', () => console.log('Second'));
  emitter8.prependListener('order', () => console.log('First'));

  emitter8.emit('order');
  console.log();

  console.log("=== Example 9: Custom Event Emitter ===");
  class DataStream extends EventEmitter {
    process(data: any) {
      this.emit('data', data);
    }

    close() {
      this.emit('close');
    }
  }

  const stream = new DataStream();

  stream.on('data', (data) => {
    console.log('Received:', data);
  });

  stream.on('close', () => {
    console.log('Stream closed');
  });

  stream.process({ id: 1, value: 'test' });
  stream.close();
  console.log();

  console.log("=== Example 10: Real-World HTTP Server ===");
  class SimpleServer extends EventEmitter {
    start(port: number) {
      console.log(`Server starting on port ${port}...`);
      this.emit('listening', port);

      // Simulate request
      setTimeout(() => {
        this.emit('request', { method: 'GET', url: '/api/data' });
      }, 100);
    }

    stop() {
      this.emit('close');
    }
  }

  const server = new SimpleServer();

  server.on('listening', (port) => {
    console.log(`✓ Server listening on port ${port}`);
  });

  server.on('request', (req) => {
    console.log(`✓ ${req.method} ${req.url}`);
  });

  server.on('close', () => {
    console.log('✓ Server closed');
  });

  server.start(3000);
  setTimeout(() => server.stop(), 200);

  setTimeout(() => {
    console.log();
    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 EventEmitter works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();
    console.log("Benefits:");
    console.log("  ✓ One event pattern for all languages");
    console.log("  ✓ Consistent async programming");
    console.log("  ✓ Share event-driven architectures");
    console.log("  ✓ Cross-language pub/sub patterns");
    console.log();
    console.log("✅ Use Cases:");
    console.log("- HTTP servers");
    console.log("- Stream processing");
    console.log("- Plugin systems");
    console.log("- Real-time applications");
    console.log("- Message queues");
    console.log("- Custom frameworks");
  }, 300);
}
