/**
 * EE-First - Get the First Event from Event Emitters
 *
 * Core features:
 * - First event utility
 * - Multiple emitters support
 * - Event cleanup
 * - Promise-based
 * - Memory leak prevention
 * - Simple API
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 40M+ downloads/week
 */

export interface EventEmitterLike {
  on(event: string, listener: (...args: any[]) => void): any;
  once?(event: string, listener: (...args: any[]) => void): any;
  removeListener(event: string, listener: (...args: any[]) => void): any;
}

export interface FirstEventResult {
  event: string;
  args: any[];
  emitter: EventEmitterLike;
}

export function first(
  emitters: EventEmitterLike | EventEmitterLike[],
  events: string[]
): Promise<FirstEventResult> {
  return new Promise((resolve) => {
    const emitterArray = Array.isArray(emitters) ? emitters : [emitters];
    const listeners = new Map<EventEmitterLike, Map<string, (...args: any[]) => void>>();

    const cleanup = () => {
      for (const [emitter, eventMap] of listeners.entries()) {
        for (const [event, listener] of eventMap.entries()) {
          emitter.removeListener(event, listener);
        }
      }
      listeners.clear();
    };

    const createListener = (emitter: EventEmitterLike, event: string) => {
      return (...args: any[]) => {
        cleanup();
        resolve({ event, args, emitter });
      };
    };

    for (const emitter of emitterArray) {
      const eventMap = new Map<string, (...args: any[]) => void>();

      for (const event of events) {
        const listener = createListener(emitter, event);
        eventMap.set(event, listener);

        if (emitter.once) {
          emitter.once(event, listener);
        } else {
          emitter.on(event, listener);
        }
      }

      listeners.set(emitter, eventMap);
    }
  });
}

// Thunk version
export function thunk(
  emitters: EventEmitterLike | EventEmitterLike[],
  events: string[]
): (callback: (err: Error | null, result?: FirstEventResult) => void) => void {
  return (callback) => {
    first(emitters, events)
      .then((result) => callback(null, result))
      .catch((err) => callback(err));
  };
}

if (import.meta.url.includes("ee-first")) {
  console.log("🎯 EE-First for Elide - First Event Utility\n");

  // Simple event emitter for demo
  class SimpleEmitter {
    private listeners = new Map<string, Set<(...args: any[]) => void>>();

    on(event: string, listener: (...args: any[]) => void) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(listener);
      return this;
    }

    once(event: string, listener: (...args: any[]) => void) {
      const wrapper = (...args: any[]) => {
        this.removeListener(event, wrapper);
        listener(...args);
      };
      return this.on(event, wrapper);
    }

    emit(event: string, ...args: any[]) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        for (const listener of listeners) {
          listener(...args);
        }
      }
      return this;
    }

    removeListener(event: string, listener: (...args: any[]) => void) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
      return this;
    }
  }

  console.log("=== First Event from Multiple ===");
  const emitter1 = new SimpleEmitter();
  const emitter2 = new SimpleEmitter();

  first([emitter1, emitter2], ['data', 'error']).then((result) => {
    console.log("First event:", result.event);
    console.log("Args:", result.args);
  });

  setTimeout(() => emitter2.emit('data', 'hello'), 10);

  console.log("\n=== Single Emitter ===");
  const emitter = new SimpleEmitter();

  first(emitter, ['finish', 'error']).then((result) => {
    console.log("Event received:", result.event);
  });

  setTimeout(() => emitter.emit('finish'), 20);

  setTimeout(() => {
    console.log();
    console.log("✅ Use Cases: Request/response handling, Stream events, Error handling");
    console.log("🚀 40M+ npm downloads/week - Zero dependencies - Polyglot-ready");
  }, 50);
}

export default first;
