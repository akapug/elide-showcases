/**
 * Astro Renderer - Static site generation
 *
 * Features:
 * - SSG by default
 * - Optional SSR
 * - Component rendering
 * - Island extraction
 */

import { IslandManager } from './islands';
import { ContentCollectionManager } from './content';

export interface AstroComponent {
  render(props: Record<string, any>): Promise<{ html: string; css: string }>;
}

export interface RenderOptions {
  url: string;
  props?: Record<string, any>;
}

export interface RenderResult {
  html: string;
  css: string;
  islands: any[];
  statusCode: number;
}

export class AstroRenderer {
  private islandManager: IslandManager;
  private contentManager: ContentCollectionManager;

  constructor(contentDir: string) {
    this.islandManager = new IslandManager();
    this.contentManager = new ContentCollectionManager(contentDir);
  }

  /**
   * Render page
   */
  async render(
    component: AstroComponent,
    options: RenderOptions
  ): Promise<RenderResult> {
    const start = performance.now();

    // Render component
    const { html, css } = await component.render(options.props || {});

    // Extract islands
    const islands = this.islandManager.getIslands();

    // Wrap HTML
    const wrappedHTML = this.wrapHTML(html, css);

    const elapsed = performance.now() - start;
    console.log(`[Astro] Rendered ${options.url} in ${elapsed.toFixed(2)}ms`);

    return {
      html: wrappedHTML,
      css,
      islands,
      statusCode: 200,
    };
  }

  /**
   * Wrap HTML with document structure
   */
  private wrapHTML(html: string, css: string): string {
    const hydrationScript = this.islandManager.generateHydrationScript();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${css ? `<style>${css}</style>` : ''}
  ${hydrationScript}
</head>
<body>
  ${html}
</body>
</html>
    `.trim();
  }

  /**
   * Get island manager
   */
  getIslandManager(): IslandManager {
    return this.islandManager;
  }

  /**
   * Get content manager
   */
  getContentManager(): ContentCollectionManager {
    return this.contentManager;
  }

  /**
   * Build static site
   */
  async build(routes: Array<{ path: string; component: AstroComponent }>): Promise<void> {
    console.log('[Astro] Building static site...');
    const start = performance.now();

    // Load content collections
    await this.contentManager.load();

    // Render all routes
    for (const route of routes) {
      await this.render(route.component, { url: route.path });
    }

    const elapsed = performance.now() - start;
    console.log(`[Astro] Built ${routes.length} pages in ${elapsed.toFixed(2)}ms`);
  }
}

/**
 * Astro component base
 */
export class AstroComponentBase implements AstroComponent {
  async render(props: Record<string, any>): Promise<{ html: string; css: string }> {
    return {
      html: '<div>Default Astro Component</div>',
      css: '',
    };
  }
}

export default AstroRenderer;
