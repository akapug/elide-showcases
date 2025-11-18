/**
 * sane - Fast File Watcher
 *
 * Wrapper around native file watchers with consistent API
 * Used by Jest, Metro bundler, and other build tools
 *
 * Popular package with ~8M downloads/week on npm!
 */

interface SaneOptions {
  glob?: string[];
  ignored?: string | RegExp | ((path: string) => boolean);
  watchman?: boolean;
  watchmanPath?: string;
}

type SaneEvent = 'change' | 'add' | 'delete' | 'all';

class Watcher {
  private fsWatcher?: Deno.FsWatcher;
  private listeners = new Map<SaneEvent, Set<Function>>();

  constructor(private dir: string, private options: SaneOptions = {}) {}

  async start(): Promise<void> {
    try {
      this.fsWatcher = Deno.watchFs(this.dir);

      (async () => {
        if (!this.fsWatcher) return;
        for await (const event of this.fsWatcher) {
          for (const path of event.paths) {
            let saneEvent: SaneEvent;
            if (event.kind === 'create') {
              saneEvent = 'add';
            } else if (event.kind === 'modify') {
              saneEvent = 'change';
            } else if (event.kind === 'remove') {
              saneEvent = 'delete';
            } else {
              continue;
            }

            this.emit(saneEvent, path);
            this.emit('all', saneEvent, path);
          }
        }
      })();
    } catch (error) {
      console.error('Failed to start watcher:', error);
    }
  }

  on(event: SaneEvent, callback: Function): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  private emit(event: SaneEvent, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }

  close(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close();
    }
    this.listeners.clear();
  }
}

export function sane(dir: string, options: SaneOptions = {}): Watcher {
  const watcher = new Watcher(dir, options);
  watcher.start();
  return watcher;
}

// CLI Demo
if (import.meta.url.includes("elide-sane.ts")) {
  console.log("🔍 sane - Fast File Watcher for Elide\n");
  console.log('const watcher = sane("src", { glob: ["**/*.ts"] });');
  console.log('watcher.on("change", (filepath) => {');
  console.log('  console.log(`File changed: ${filepath}`);');
  console.log('});');
  console.log();
  console.log("✅ Use Cases: Jest, Metro, build tools");
  console.log("🚀 ~8M downloads/week on npm");
}

export default sane;
export { sane, Watcher };
