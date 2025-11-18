/**
 * Mitt - Tiny 200b Event Emitter
 *
 * Ultra-lightweight event emitter.
 * **POLYGLOT SHOWCASE**: Tiny event emitter for ALL languages on Elide!
 *
 * Features:
 * - Tiny footprint (200 bytes gzipped)
 * - Simple API (on, off, emit)
 * - Wildcard support
 * - TypeScript support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java need lightweight events
 * - ONE tiny implementation works everywhere
 * - Minimal overhead
 *
 * Use cases:
 * - Micro frontends
 * - Browser extensions
 * - Lightweight apps
 * - Event bus
 *
 * Package has ~8M+ downloads/week on npm!
 */

export type EventType = string | symbol;
export type Handler<T = any> = (event: T) => void;
export type WildcardHandler = (type: EventType, event?: any) => void;
export type EventHandlerMap = Map<EventType, Handler[]>;

export interface Emitter {
  on<T = any>(type: EventType, handler: Handler<T>): void;
  off<T = any>(type: EventType, handler: Handler<T>): void;
  emit<T = any>(type: EventType, event?: T): void;
}

export default function mitt(all?: EventHandlerMap): Emitter {
  all = all || new Map();

  return {
    on<T = any>(type: EventType, handler: Handler<T>) {
      const handlers = all!.get(type);
      if (handlers) {
        handlers.push(handler);
      } else {
        all!.set(type, [handler] as Handler[]);
      }
    },

    off<T = any>(type: EventType, handler: Handler<T>) {
      const handlers = all!.get(type);
      if (handlers) {
        handlers.splice(handlers.indexOf(handler) >>> 0, 1);
      }
    },

    emit<T = any>(type: EventType, evt?: T) {
      let handlers = all!.get(type);
      if (handlers) {
        (handlers as Handler[]).slice().forEach((handler) => {
          handler(evt!);
        });
      }

      handlers = all!.get('*');
      if (handlers) {
        (handlers as WildcardHandler[]).slice().forEach((handler) => {
          handler(type, evt!);
        });
      }
    }
  };
}

// CLI Demo
if (import.meta.url.includes("elide-mitt.ts")) {
  console.log("🎯 Mitt - Tiny Event Emitter for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Usage ===");
  const emitter = mitt();

  emitter.on('foo', (e) => console.log(`  foo: ${e}`));
  emitter.emit('foo', 'hello');
  console.log();

  console.log("=== Example 2: Wildcard ===");
  const emitter2 = mitt();

  emitter2.on('*', (type, e) => console.log(`  ${String(type)}: ${e}`));
  emitter2.emit('bar', 'test');
  console.log();

  console.log("=== Example 3: Multiple Events ===");
  const emitter3 = mitt();

  emitter3.on('message', (msg) => console.log(`  Message: ${msg}`));
  emitter3.on('data', (data) => console.log(`  Data: ${data}`));

  emitter3.emit('message', 'Hello');
  emitter3.emit('data', '42');
  console.log();

  console.log("Benefits:");
  console.log("  ✓ Ultra lightweight (200b)");
  console.log("  ✓ Works in all languages via Elide");
  console.log("  ✓ Wildcard support");
  console.log("  ✓ ~8M+ downloads/week on npm");
  console.log();
}
