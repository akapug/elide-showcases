/**
 * Event Emitter - Simple Event Emitter
 * **POLYGLOT SHOWCASE**: Event emitter for ALL languages on Elide!
 * Package has ~40M+ downloads/week on npm!
 */

export default class EventEmitter {
  private _events: Record<string, Function[]> = {};

  on(type: string, listener: Function): void {
    if (!this._events[type]) this._events[type] = [];
    this._events[type].push(listener);
  }

  once(type: string, listener: Function): void {
    const wrapper = (...args: any[]) => {
      this.off(type, wrapper);
      listener(...args);
    };
    this.on(type, wrapper);
  }

  off(type: string, listener?: Function): void {
    if (!listener) {
      delete this._events[type];
      return;
    }
    const idx = this._events[type]?.indexOf(listener);
    if (idx !== undefined && idx !== -1) {
      this._events[type].splice(idx, 1);
    }
  }

  emit(type: string, ...args: any[]): void {
    this._events[type]?.slice().forEach(fn => fn(...args));
  }
}

if (import.meta.url.includes("elide-event-emitter.ts")) {
  console.log("🎯 Event Emitter - Simple Events (POLYGLOT!)\n");
  const emitter = new EventEmitter();
  emitter.on('test', (msg: string) => console.log(`  ${msg}`));
  emitter.emit('test', 'Hello!');
  console.log("\n✅ ~40M+ downloads/week on npm");
}
