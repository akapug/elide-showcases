/**
 * Emittery - Typed Event Emitter
 * **POLYGLOT SHOWCASE**: Typed events for ALL languages on Elide!
 * Package has ~15M+ downloads/week on npm!
 */

export default class Emittery<EventData = Record<string, any>> {
  private events = new Map<keyof EventData, Set<Function>>();

  on<Name extends keyof EventData>(eventName: Name, listener: (eventData: EventData[Name]) => void | Promise<void>): () => void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(listener);
    return () => this.off(eventName, listener);
  }

  once<Name extends keyof EventData>(eventName: Name, listener: (eventData: EventData[Name]) => void | Promise<void>): () => void {
    const wrapper = (data: EventData[Name]) => {
      this.off(eventName, wrapper as any);
      return listener(data);
    };
    return this.on(eventName, wrapper as any);
  }

  off<Name extends keyof EventData>(eventName: Name, listener: Function): void {
    this.events.get(eventName)?.delete(listener);
  }

  async emit<Name extends keyof EventData>(eventName: Name, eventData: EventData[Name]): Promise<void> {
    const listeners = this.events.get(eventName);
    if (!listeners) return;
    await Promise.all(Array.from(listeners).map(fn => fn(eventData)));
  }

  async emitSerial<Name extends keyof EventData>(eventName: Name, eventData: EventData[Name]): Promise<void> {
    const listeners = this.events.get(eventName);
    if (!listeners) return;
    for (const fn of listeners) {
      await fn(eventData);
    }
  }

  clearListeners<Name extends keyof EventData>(eventName?: Name): void {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  listenerCount<Name extends keyof EventData>(eventName?: Name): number {
    if (eventName) {
      return this.events.get(eventName)?.size || 0;
    }
    return Array.from(this.events.values()).reduce((acc, set) => acc + set.size, 0);
  }
}

if (import.meta.url.includes("elide-emittery.ts")) {
  console.log("🎯 Emittery - Typed Event Emitter (POLYGLOT!)\n");
  
  interface MyEvents {
    hello: string;
    goodbye: number;
  }
  
  const emitter = new Emittery<MyEvents>();
  
  emitter.on('hello', (msg) => {
    console.log(`  Hello: ${msg}`);
  });
  
  await emitter.emit('hello', 'World');
  console.log("\n✅ ~15M+ downloads/week on npm");
}
