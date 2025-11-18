/**
 * Wolfy87 EventEmitter - Feature-Rich Event Emitter
 * **POLYGLOT SHOWCASE**: Full-featured events for ALL languages on Elide!
 * Package has ~3M+ downloads/week on npm!
 */

export default class EventEmitter {
  private _events: Map<string | RegExp, Set<Function>> = new Map();

  addListener(evt: string | RegExp, listener: Function): this {
    const listeners = this._events.get(evt) || new Set();
    listeners.add(listener);
    this._events.set(evt, listeners);
    return this;
  }

  on(evt: string | RegExp, listener: Function): this {
    return this.addListener(evt, listener);
  }

  once(evt: string, listener: Function): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(evt, wrapper);
      listener(...args);
    };
    return this.addListener(evt, wrapper);
  }

  removeListener(evt: string | RegExp, listener: Function): this {
    this._events.get(evt)?.delete(listener);
    return this;
  }

  off(evt: string | RegExp, listener: Function): this {
    return this.removeListener(evt, listener);
  }

  removeAllListeners(evt?: string): this {
    if (evt) {
      this._events.delete(evt);
    } else {
      this._events.clear();
    }
    return this;
  }

  emit(evt: string, ...args: any[]): this {
    for (const [key, listeners] of this._events) {
      if (key instanceof RegExp && key.test(evt)) {
        listeners.forEach(fn => fn(...args));
      } else if (key === evt) {
        listeners.forEach(fn => fn(...args));
      }
    }
    return this;
  }

  getListeners(evt: string): Function[] {
    const result: Function[] = [];
    for (const [key, listeners] of this._events) {
      if (key instanceof RegExp && key.test(evt)) {
        result.push(...listeners);
      } else if (key === evt) {
        result.push(...listeners);
      }
    }
    return result;
  }
}

if (import.meta.url.includes("elide-wolfy87-eventemitter.ts")) {
  console.log("🎯 Wolfy87 EventEmitter - Full-Featured Events (POLYGLOT!)\n");
  const emitter = new EventEmitter();
  emitter.on('test', (msg: string) => console.log(`  ${msg}`));
  emitter.on(/test.*/, (msg: string) => console.log(`  Regex: ${msg}`));
  emitter.emit('test', 'Hello!');
  console.log("\n✅ ~3M+ downloads/week on npm");
}
