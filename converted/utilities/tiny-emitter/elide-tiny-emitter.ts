/**
 * Tiny Emitter - Tiny Event Emitter
 * **POLYGLOT SHOWCASE**: Tiny events for ALL languages on Elide!
 * Package has ~8M+ downloads/week on npm!
 */

export default class TinyEmitter {
  private e: Record<string, Function[]> = {};

  on(name: string, callback: Function, ctx?: any): this {
    (this.e[name] || (this.e[name] = [])).push({f: callback, c: ctx});
    return this;
  }

  once(name: string, callback: Function, ctx?: any): this {
    const wrapper = (...args: any[]) => {
      this.off(name, wrapper);
      callback.apply(ctx, args);
    };
    return this.on(name, wrapper, ctx);
  }

  emit(name: string, ...args: any[]): this {
    const evtArr = ((this.e[name] || []) as any[]).slice();
    for (let i = 0; i < evtArr.length; i++) {
      evtArr[i].f.apply(evtArr[i].c, args);
    }
    return this;
  }

  off(name: string, callback?: Function): this {
    if (!callback) {
      delete this.e[name];
    } else {
      const evts = this.e[name] as any[];
      if (evts) {
        for (let i = 0; i < evts.length; i++) {
          if (evts[i].f === callback) {
            evts.splice(i, 1);
            break;
          }
        }
      }
    }
    return this;
  }
}

if (import.meta.url.includes("elide-tiny-emitter.ts")) {
  console.log("🎯 Tiny Emitter - Minimal Events (POLYGLOT!)\n");
  const emitter = new TinyEmitter();
  emitter.on('test', (msg: string) => console.log(`  ${msg}`));
  emitter.emit('test', 'Hello!');
  console.log("\n✅ ~8M+ downloads/week on npm");
}
