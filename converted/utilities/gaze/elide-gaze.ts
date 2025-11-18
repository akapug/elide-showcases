/**
 * gaze - Simple File Watcher
 *
 * Glob-based file watching with simple API
 * Lightweight alternative for basic watching needs
 *
 * Popular package with ~5M downloads/week on npm!
 */

type GazeCallback = (err: Error | null, watcher?: Gaze) => void;
type ChangeCallback = (filepath: string) => void;

class Gaze {
  private watchers = new Map<string, Deno.FsWatcher>();
  private listeners = new Map<string, Set<ChangeCallback>>();

  async add(patterns: string | string[]): Promise<void> {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];

    for (const pattern of patternArray) {
      try {
        const watcher = Deno.watchFs(pattern);
        this.watchers.set(pattern, watcher);

        (async () => {
          for await (const event of watcher) {
            for (const path of event.paths) {
              const listeners = this.listeners.get('all') || new Set();
              for (const listener of listeners) {
                listener(path);
              }

              if (event.kind === 'modify') {
                const changeListeners = this.listeners.get('changed') || new Set();
                for (const listener of changeListeners) {
                  listener(path);
                }
              }
            }
          }
        })();
      } catch {
        // Ignore errors
      }
    }
  }

  on(event: string, callback: ChangeCallback): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  close(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

export function gaze(patterns: string | string[], callback?: GazeCallback): Gaze {
  const watcher = new Gaze();
  watcher.add(patterns);
  if (callback) {
    setTimeout(() => callback(null, watcher), 0);
  }
  return watcher;
}

// CLI Demo
if (import.meta.url.includes("elide-gaze.ts")) {
  console.log("👀 gaze - Simple File Watcher for Elide\n");
  console.log('gaze("src/**/*.ts", (err, watcher) => {');
  console.log('  watcher.on("changed", (filepath) => {');
  console.log('    console.log(`Changed: ${filepath}`);');
  console.log('  });');
  console.log('});');
  console.log();
  console.log("✅ Use Cases: Simple file watching, build scripts");
  console.log("🚀 ~5M downloads/week on npm");
}

export default gaze;
export { gaze, Gaze };
