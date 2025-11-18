/**
 * EventEmitter2 - Enhanced Event Emitter
 * **POLYGLOT SHOWCASE**: Namespaced events for ALL languages on Elide!
 * Package has ~15M+ downloads/week on npm!
 */

export default class EventEmitter2 {
  private events = new Map<string, Function[]>();
  private wildcards = new Map<RegExp, Function[]>();
  private delimiter: string;
  private wildcard: boolean;

  constructor(options: { delimiter?: string; wildcard?: boolean } = {}) {
    this.delimiter = options.delimiter || '.';
    this.wildcard = options.wildcard !== false;
  }

  on(event: string | string[], listener: Function): this {
    const events = Array.isArray(event) ? event : [event];
    for (const evt of events) {
      if (this.wildcard && evt.includes('*')) {
        const pattern = this.eventToRegex(evt);
        if (!this.wildcards.has(pattern)) {
          this.wildcards.set(pattern, []);
        }
        this.wildcards.get(pattern)!.push(listener);
      } else {
        if (!this.events.has(evt)) {
          this.events.set(evt, []);
        }
        this.events.get(evt)!.push(listener);
      }
    }
    return this;
  }

  once(event: string, listener: Function): this {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      listener(...args);
    };
    return this.on(event, wrapper);
  }

  off(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    let triggered = false;

    const listeners = this.events.get(event);
    if (listeners) {
      listeners.slice().forEach(fn => fn(...args));
      triggered = true;
    }

    if (this.wildcard) {
      for (const [pattern, fns] of this.wildcards) {
        if (pattern.test(event)) {
          fns.slice().forEach(fn => fn(...args));
          triggered = true;
        }
      }
    }

    return triggered;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
      this.wildcards.clear();
    }
    return this;
  }

  private eventToRegex(event: string): RegExp {
    const escaped = event
      .split(this.delimiter)
      .map(part => part === '*' ? '[^.]+' : part.replace(/[.*+?^$()|\[\]\\]/g, '\\$&'))
      .join('\\' + this.delimiter);
    return new RegExp(`^${escaped}$`);
  }
}

if (import.meta.url.includes("elide-eventemitter2.ts")) {
  console.log("🎯 EventEmitter2 - Namespaced Events (POLYGLOT!)\n");

  const emitter = new EventEmitter2({ delimiter: '.', wildcard: true });

  emitter.on('user.login', (name: string) => {
    console.log(`  User logged in: ${name}`);
  });

  emitter.on('user.*', (name: string) => {
    console.log(`  User event: ${name}`);
  });

  emitter.emit('user.login', 'Alice');
  console.log("\n✅ ~15M+ downloads/week on npm");
}
