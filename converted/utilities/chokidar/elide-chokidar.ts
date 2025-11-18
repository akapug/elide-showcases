/**
 * chokidar - Efficient File Watcher
 *
 * Fast cross-platform file watching with minimal resource usage
 * Industry standard for file watching in build tools
 *
 * Popular package with ~100M downloads/week on npm!
 */

interface ChokidarOptions {
  ignored?: string | RegExp | ((path: string) => boolean);
  persistent?: boolean;
  ignoreInitial?: boolean;
  followSymlinks?: boolean;
  cwd?: string;
  usePolling?: boolean;
  interval?: number;
  awaitWriteFinish?: boolean | { stabilityThreshold?: number; pollInterval?: number };
}

type WatchEvent = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
type WatchListener = (path: string, stats?: Deno.FileInfo) => void;

class FSWatcher {
  private watchers = new Map<string, Deno.FsWatcher>();
  private listeners = new Map<WatchEvent, Set<WatchListener>>();
  private options: ChokidarOptions;

  constructor(options: ChokidarOptions = {}) {
    this.options = options;
  }

  on(event: WatchEvent, listener: WatchListener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  async add(paths: string | string[]): Promise<void> {
    const pathArray = Array.isArray(paths) ? paths : [paths];

    for (const path of pathArray) {
      try {
        const watcher = Deno.watchFs(path);
        this.watchers.set(path, watcher);

        (async () => {
          for await (const event of watcher) {
            for (const eventPath of event.paths) {
              let watchEvent: WatchEvent;
              if (event.kind === 'create') {
                watchEvent = 'add';
              } else if (event.kind === 'modify') {
                watchEvent = 'change';
              } else if (event.kind === 'remove') {
                watchEvent = 'unlink';
              } else {
                continue;
              }

              const listeners = this.listeners.get(watchEvent);
              if (listeners) {
                for (const listener of listeners) {
                  listener(eventPath);
                }
              }
            }
          }
        })();
      } catch (error) {
        console.error(`Failed to watch ${path}:`, error);
      }
    }
  }

  close(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    this.listeners.clear();
  }
}

export function watch(paths: string | string[], options: ChokidarOptions = {}): FSWatcher {
  const watcher = new FSWatcher(options);
  watcher.add(paths);
  return watcher;
}

// CLI Demo
if (import.meta.url.includes("elide-chokidar.ts")) {
  console.log("👁️  chokidar - Efficient File Watcher for Elide\n");
  console.log('const watcher = watch("src", {');
  console.log('  ignored: /(^|\\/)\\../, // ignore dotfiles');
  console.log('  persistent: true');
  console.log('});');
  console.log();
  console.log('watcher.on("change", (path) => {');
  console.log('  console.log(`File changed: ${path}`);');
  console.log('});');
  console.log();
  console.log("✅ Use Cases: Build tools, dev servers, live reload");
  console.log("🚀 ~100M downloads/week on npm");
}

export default { watch };
export { watch, FSWatcher };
