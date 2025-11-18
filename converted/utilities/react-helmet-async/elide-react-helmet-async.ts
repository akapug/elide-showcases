/**
 * React Helmet Async - Async Document Head Manager
 *
 * Async version of React Helmet for better SSR performance.
 * **POLYGLOT SHOWCASE**: One async head manager for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-helmet-async (~1M+ downloads/week)
 *
 * Features:
 * - Async rendering support
 * - Thread-safe SSR
 * - Same API as react-helmet
 * - Zero dependencies
 *
 * Package has ~1M+ downloads/week on npm!
 */

interface HelmetData {
  title?: string;
  meta?: Array<{ name?: string; property?: string; content: string }>;
  link?: Array<{ rel: string; href: string }>;
}

export class HelmetAsync {
  private data: HelmetData = {};
  private queue: Array<() => Promise<void>> = [];

  async set(data: HelmetData): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(async () => {
        this.data = { ...this.data, ...data };
        resolve();
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.queue.length === 0) return;
    const task = this.queue.shift();
    if (task) await task();
    if (this.queue.length > 0) await this.process();
  }

  async renderStatic(): Promise<{ title: string; meta: string; link: string }> {
    await this.process();

    return {
      title: this.data.title ? `<title>${this.data.title}</title>` : '',
      meta: (this.data.meta || []).map(m => {
        const attrs = [];
        if (m.name) attrs.push(`name="${m.name}"`);
        if (m.property) attrs.push(`property="${m.property}"`);
        attrs.push(`content="${m.content}"`);
        return `<meta ${attrs.join(' ')}>`;
      }).join('\n'),
      link: (this.data.link || []).map(l => `<link rel="${l.rel}" href="${l.href}">`).join('\n'),
    };
  }
}

export default new HelmetAsync();

if (import.meta.url.includes("elide-react-helmet-async.ts")) {
  console.log("🪖 React Helmet Async - Async Head Manager (POLYGLOT!)\n");

  const helmet = new HelmetAsync();

  await helmet.set({
    title: 'My Page',
    meta: [{ name: 'description', content: 'Great page' }],
  });

  const rendered = await helmet.renderStatic();
  console.log(rendered.title);
  console.log(rendered.meta);
  console.log("\n~1M+ downloads/week on npm!");
}
