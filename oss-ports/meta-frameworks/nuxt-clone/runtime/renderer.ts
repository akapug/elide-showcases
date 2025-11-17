/**
 * Vue SSR Renderer for Nuxt Clone
 *
 * Features:
 * - Server-side rendering
 * - Static generation
 * - Hydration
 * - Data prefetching
 */

import { createSSRApp, createApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { NuxtRouter } from './router';

export interface RenderContext {
  url: string;
  req?: any;
  res?: any;
}

export interface RenderResult {
  html: string;
  head: string;
  state: Record<string, any>;
  statusCode: number;
}

export class VueRenderer {
  private router: NuxtRouter;
  private rootComponent: any;

  constructor(router: NuxtRouter, rootComponent: any) {
    this.router = router;
    this.rootComponent = rootComponent;
  }

  /**
   * Render to HTML string
   */
  async render(context: RenderContext): Promise<RenderResult> {
    const start = performance.now();

    // Create SSR app
    const app = createSSRApp(this.rootComponent);

    // Create router
    const router = this.router.createVueRouter(true);
    app.use(router);

    // Navigate to URL
    await router.push(context.url);
    await router.isReady();

    // Render to string
    const html = await renderToString(app);

    // Collect state
    const state = this.collectState(app);

    // Generate head tags
    const head = this.generateHead(app);

    const elapsed = performance.now() - start;
    console.log(`[SSR] Rendered ${context.url} in ${elapsed.toFixed(2)}ms`);

    return {
      html,
      head,
      state,
      statusCode: 200,
    };
  }

  /**
   * Collect app state
   */
  private collectState(app: any): Record<string, any> {
    // In real implementation, collect Pinia/Vuex state, async data, etc.
    return {};
  }

  /**
   * Generate head tags
   */
  private generateHead(app: any): string {
    // In real implementation, use @unhead/vue or similar
    return `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Elide Nuxt App</title>
    `.trim();
  }

  /**
   * Wrap HTML with document structure
   */
  wrapHtml(result: RenderResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
  ${result.head}
  <script type="module" src="/__elide_client__.js"></script>
</head>
<body>
  <div id="__nuxt">${result.html}</div>
  <script>
    window.__NUXT__ = ${JSON.stringify(result.state)};
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Hydrate on client
   */
  static async hydrate(rootComponent: any, router: NuxtRouter): Promise<void> {
    const app = createApp(rootComponent);

    const vueRouter = router.createVueRouter(false);
    app.use(vueRouter);

    // Restore state
    if (typeof window !== 'undefined' && (window as any).__NUXT__) {
      // Restore Pinia/Vuex state
    }

    await vueRouter.isReady();
    app.mount('#__nuxt');
  }
}

export default VueRenderer;
