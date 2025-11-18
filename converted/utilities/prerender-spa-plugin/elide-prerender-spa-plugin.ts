/**
 * Prerender SPA Plugin - Static Prerendering
 *
 * Prerender SPA pages for better SEO.
 * **POLYGLOT SHOWCASE**: One prerenderer for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/prerender-spa-plugin (~100K+ downloads/week)
 *
 * Features:
 * - Prerender SPA routes
 * - Generate static HTML
 * - SEO optimization
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface PrerenderRoute {
  path: string;
  html: string;
}

export class PrerenderSPAPlugin {
  private routes: PrerenderRoute[] = [];

  addRoute(path: string, html: string): void {
    this.routes.push({ path, html });
  }

  async prerender(paths: string[], renderFn: (path: string) => Promise<string>): Promise<PrerenderRoute[]> {
    const rendered: PrerenderRoute[] = [];
    
    for (const path of paths) {
      const html = await renderFn(path);
      rendered.push({ path, html });
    }
    
    return rendered;
  }

  getRoutes(): PrerenderRoute[] {
    return this.routes;
  }
}

export default PrerenderSPAPlugin;

if (import.meta.url.includes("elide-prerender-spa-plugin.ts")) {
  console.log("⚡ Prerender SPA Plugin - Static Prerendering (POLYGLOT!)\n");

  const plugin = new PrerenderSPAPlugin();
  
  const routes = await plugin.prerender(['/home', '/about'], async (path) => {
    return `<html><body><h1>${path}</h1></body></html>`;
  });

  console.log(routes);
  console.log("\n~100K+ downloads/week on npm!");
}
