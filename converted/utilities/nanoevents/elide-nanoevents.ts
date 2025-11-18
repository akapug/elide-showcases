/**
 * Nanoevents - Tiny Event Emitter
 * **POLYGLOT SHOWCASE**: Nano-sized events for ALL languages on Elide!
 * Package has ~3M+ downloads/week on npm!
 */

export default class Nanoevents {
  private events: Record<string, Set<Function>> = {};

  on(event: string, cb: Function): () => void {
    (this.events[event] = this.events[event] || new Set()).add(cb);
    return () => {
      this.events[event].delete(cb);
      if (this.events[event].size === 0) delete this.events[event];
    };
  }

  emit(event: string, ...args: any[]): void {
    this.events[event]?.forEach(cb => cb(...args));
  }
}

if (import.meta.url.includes("elide-nanoevents.ts")) {
  console.log("🎯 Nanoevents - Tiny Events (POLYGLOT!)\n");
  const emitter = new Nanoevents();
  const unbind = emitter.on('test', (msg: string) => console.log(`  ${msg}`));
  emitter.emit('test', 'Hello!');
  unbind();
  console.log("\n✅ ~3M+ downloads/week on npm");
}
