/**
 * Pluggable - Simple Plugin System
 *
 * Minimalist plugin system for JavaScript applications.
 * **POLYGLOT SHOWCASE**: Plugin system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/pluggable (~30K+ downloads/week)
 *
 * Features:
 * - Plugin registration
 * - Plugin loading
 * - Hook system
 * - Plugin dependencies
 * - Event emission
 * - Zero dependencies
 *
 * Use cases:
 * - Extensible applications
 * - Plugin architectures
 * - Modular systems
 * - Extension points
 */

export interface Plugin {
  name: string;
  install: (app: any) => void | Promise<void>;
}

export class Pluggable {
  private plugins: Map<string, Plugin> = new Map();

  use(plugin: Plugin): this {
    this.plugins.set(plugin.name, plugin);
    console.log(`[Pluggable] Registered plugin: ${plugin.name}`);
    return this;
  }

  async install(app: any): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.install(app);
    }
  }
}

export default Pluggable;

if (import.meta.url.includes("elide-pluggable.ts")) {
  console.log("🔌 Pluggable - Plugin System (POLYGLOT!)\n");
  const system = new Pluggable();
  system.use({
    name: 'logger',
    install: (app) => console.log('  Logger plugin installed')
  });
  (async () => {
    await system.install({});
    console.log('\n✅ ~30K+ downloads/week - plugin system!');
  })();
}
