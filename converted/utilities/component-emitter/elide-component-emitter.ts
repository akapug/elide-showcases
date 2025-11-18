/**
 * Component Emitter - Event Emitter Mixin
 *
 * Event emitter as a mixin for objects.
 * **POLYGLOT SHOWCASE**: Event mixin for ALL languages on Elide!
 *
 * Features:
 * - Mixin pattern for adding events
 * - Simple API (on, once, off, emit)
 * - Listener management
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Add events to any object
 * - Works everywhere on Elide
 * - Consistent mixin pattern
 *
 * Use cases:
 * - Component libraries
 * - Class augmentation
 * - Plugin systems
 *
 * Package has ~150M+ downloads/week on npm!
 */

export interface Emitter {
  on(event: string, fn: Function): this;
  once(event: string, fn: Function): this;
  off(event?: string, fn?: Function): this;
  emit(event: string, ...args: any[]): this;
  listeners(event: string): Function[];
  hasListeners(event: string): boolean;
}

export default function Emitter<T extends object>(obj?: T): T & Emitter {
  if (obj) return mixin(obj);
  return new EmitterClass() as any;
}

class EmitterClass implements Emitter {
  private _callbacks: Map<string, Function[]> = new Map();

  on(event: string, fn: Function): this {
    if (!this._callbacks.has(event)) {
      this._callbacks.set(event, []);
    }
    this._callbacks.get(event)!.push(fn);
    return this;
  }

  once(event: string, fn: Function): this {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      fn.apply(this, args);
    };
    (wrapper as any).fn = fn;
    this.on(event, wrapper);
    return this;
  }

  off(event?: string, fn?: Function): this {
    if (!event) {
      this._callbacks.clear();
      return this;
    }

    if (!fn) {
      this._callbacks.delete(event);
      return this;
    }

    const callbacks = this._callbacks.get(event);
    if (!callbacks) return this;

    for (let i = 0; i < callbacks.length; i++) {
      const cb = callbacks[i];
      if (cb === fn || (cb as any).fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }

    if (callbacks.length === 0) {
      this._callbacks.delete(event);
    }

    return this;
  }

  emit(event: string, ...args: any[]): this {
    const callbacks = this._callbacks.get(event);
    if (callbacks) {
      callbacks.slice().forEach(fn => fn.apply(this, args));
    }
    return this;
  }

  listeners(event: string): Function[] {
    return this._callbacks.get(event)?.slice() || [];
  }

  hasListeners(event: string): boolean {
    return !!this._callbacks.get(event)?.length;
  }
}

function mixin<T extends object>(obj: T): T & Emitter {
  const emitter = new EmitterClass();
  Object.setPrototypeOf(obj, Object.getPrototypeOf(emitter));
  Object.assign(obj, emitter);
  return obj as T & Emitter;
}

// CLI Demo
if (import.meta.url.includes("elide-component-emitter.ts")) {
  console.log("🎯 Component Emitter - Event Mixin for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Standalone Emitter ===");
  const emitter = Emitter();

  emitter.on('message', (msg: string) => {
    console.log(`  Received: ${msg}`);
  });

  emitter.emit('message', 'Hello!');
  console.log();

  console.log("=== Example 2: Mixin Pattern ===");
  class User {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
  }

  const user = Emitter(new User('Alice'));

  user.on('login', () => {
    console.log(`  ${user.name} logged in`);
  });

  user.emit('login');
  console.log();

  console.log("=== Example 3: Once Listeners ===");
  const emitter2 = Emitter();

  emitter2.once('init', () => {
    console.log("  Initialized");
  });

  emitter2.emit('init');
  emitter2.emit('init'); // Won't trigger
  console.log();

  console.log("Benefits:");
  console.log("  ✓ Add events to any object");
  console.log("  ✓ Works in all languages via Elide");
  console.log("  ✓ Mixin pattern");
  console.log("  ✓ ~150M+ downloads/week on npm");
  console.log();
}
