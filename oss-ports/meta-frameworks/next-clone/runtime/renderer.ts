/**
 * SSR/SSG/ISR Renderer for Elide Next Clone
 *
 * Supports:
 * - Server-Side Rendering (SSR)
 * - Static Site Generation (SSG)
 * - Incremental Static Regeneration (ISR)
 * - Edge rendering
 * - Streaming SSR
 */

import * as React from 'react';
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import { RSCRenderer } from './rsc';
import { Route } from './router';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export type RenderMode = 'ssr' | 'ssg' | 'isr' | 'edge';

export interface RenderOptions {
  mode: RenderMode;
  revalidate?: number | false;
  streaming?: boolean;
  cache?: boolean;
}

export interface RenderResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  revalidate?: number;
}

export interface GetStaticPropsContext {
  params: Record<string, string | string[]>;
  preview?: boolean;
  previewData?: any;
}

export interface GetStaticPropsResult {
  props: Record<string, any>;
  revalidate?: number | false;
  notFound?: boolean;
  redirect?: {
    destination: string;
    permanent: boolean;
  };
}

export interface GetServerSidePropsContext {
  params: Record<string, string | string[]>;
  req: any;
  res: any;
  query: Record<string, string>;
  preview?: boolean;
  previewData?: any;
}

export interface GetServerSidePropsResult {
  props: Record<string, any>;
  notFound?: boolean;
  redirect?: {
    destination: string;
    permanent: boolean;
  };
}

/**
 * Main renderer class
 */
export class PageRenderer {
  private rscRenderer: RSCRenderer;
  private staticCache = new Map<string, { html: string; timestamp: number }>();
  private buildDir: string;

  constructor(buildDir = '.next') {
    this.buildDir = buildDir;
    this.rscRenderer = new RSCRenderer();
  }

  /**
   * Render page based on route configuration
   */
  async render(
    route: Route,
    params: Record<string, string | string[]>,
    req: any,
    res: any
  ): Promise<RenderResult> {
    // Load page module
    const pageModule = await this.loadPage(route.filePath);

    // Determine render mode
    const mode = this.detectRenderMode(route, pageModule);

    // Render based on mode
    switch (mode) {
      case 'ssg':
        return this.renderSSG(route, pageModule, params);
      case 'isr':
        return this.renderISR(route, pageModule, params);
      case 'ssr':
        return this.renderSSR(route, pageModule, params, req, res);
      case 'edge':
        return this.renderEdge(route, pageModule, params, req, res);
      default:
        throw new Error(`Unknown render mode: ${mode}`);
    }
  }

  /**
   * Server-Side Rendering
   */
  private async renderSSR(
    route: Route,
    pageModule: any,
    params: Record<string, string | string[]>,
    req: any,
    res: any
  ): Promise<RenderResult> {
    const start = performance.now();

    // Get server-side props
    let props = {};
    if (pageModule.getServerSideProps) {
      const context: GetServerSidePropsContext = {
        params,
        req,
        res,
        query: req.query || {},
      };

      const result = await pageModule.getServerSideProps(context);

      // Handle redirects
      if (result.redirect) {
        return {
          html: '',
          statusCode: result.redirect.permanent ? 301 : 302,
          headers: {
            Location: result.redirect.destination,
          },
        };
      }

      // Handle not found
      if (result.notFound) {
        return {
          html: await this.render404(),
          statusCode: 404,
          headers: {},
        };
      }

      props = result.props;
    }

    // Render component
    const Component = pageModule.default;
    const html = await this.renderComponent(Component, props);

    const elapsed = performance.now() - start;
    console.log(`[SSR] Rendered ${route.path} in ${elapsed.toFixed(2)}ms`);

    return {
      html,
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Render-Mode': 'ssr',
        'X-Render-Time': elapsed.toFixed(2),
      },
    };
  }

  /**
   * Static Site Generation
   */
  private async renderSSG(
    route: Route,
    pageModule: any,
    params: Record<string, string | string[]>
  ): Promise<RenderResult> {
    // Check static cache
    const cacheKey = this.getCacheKey(route.path, params);
    const cached = await this.getStaticPage(cacheKey);

    if (cached) {
      return {
        html: cached,
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Render-Mode': 'ssg',
          'X-Cache': 'HIT',
        },
      };
    }

    // Generate static page
    const start = performance.now();

    let props = {};
    if (pageModule.getStaticProps) {
      const context: GetStaticPropsContext = { params };
      const result = await pageModule.getStaticProps(context);

      if (result.redirect) {
        return {
          html: '',
          statusCode: result.redirect.permanent ? 301 : 302,
          headers: {
            Location: result.redirect.destination,
          },
        };
      }

      if (result.notFound) {
        return {
          html: await this.render404(),
          statusCode: 404,
          headers: {},
        };
      }

      props = result.props;
    }

    const Component = pageModule.default;
    const html = await this.renderComponent(Component, props);

    // Cache static page
    await this.saveStaticPage(cacheKey, html);

    const elapsed = performance.now() - start;
    console.log(`[SSG] Generated ${route.path} in ${elapsed.toFixed(2)}ms`);

    return {
      html,
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Render-Mode': 'ssg',
        'X-Cache': 'MISS',
      },
    };
  }

  /**
   * Incremental Static Regeneration
   */
  private async renderISR(
    route: Route,
    pageModule: any,
    params: Record<string, string | string[]>
  ): Promise<RenderResult> {
    const cacheKey = this.getCacheKey(route.path, params);
    const cached = this.staticCache.get(cacheKey);

    // Get revalidate time
    let revalidate = route.revalidate || 60;
    if (pageModule.getStaticProps) {
      const context: GetStaticPropsContext = { params };
      const result = await pageModule.getStaticProps(context);
      if (result.revalidate !== undefined) {
        revalidate = result.revalidate === false ? Infinity : result.revalidate;
      }
    }

    // Check if cache is still valid
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const maxAge = typeof revalidate === 'number' ? revalidate * 1000 : Infinity;

      if (age < maxAge) {
        return {
          html: cached.html,
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Render-Mode': 'isr',
            'X-Cache': 'HIT',
            'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate`,
          },
          revalidate: typeof revalidate === 'number' ? revalidate : undefined,
        };
      }

      // Stale content - revalidate in background
      this.revalidateInBackground(route, pageModule, params, cacheKey);

      // Return stale content
      return {
        html: cached.html,
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Render-Mode': 'isr',
          'X-Cache': 'STALE',
          'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate`,
        },
        revalidate: typeof revalidate === 'number' ? revalidate : undefined,
      };
    }

    // No cache - render fresh
    const result = await this.renderSSG(route, pageModule, params);
    this.staticCache.set(cacheKey, {
      html: result.html,
      timestamp: Date.now(),
    });

    return {
      ...result,
      headers: {
        ...result.headers,
        'X-Render-Mode': 'isr',
        'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate`,
      },
      revalidate: typeof revalidate === 'number' ? revalidate : undefined,
    };
  }

  /**
   * Edge rendering (minimal runtime)
   */
  private async renderEdge(
    route: Route,
    pageModule: any,
    params: Record<string, string | string[]>,
    req: any,
    res: any
  ): Promise<RenderResult> {
    // Edge rendering is similar to SSR but with restrictions
    // No Node.js APIs, smaller bundle
    return this.renderSSR(route, pageModule, params, req, res);
  }

  /**
   * Render React component to HTML
   */
  private async renderComponent(
    Component: React.ComponentType<any>,
    props: Record<string, any>
  ): Promise<string> {
    // Check if server component
    if (this.isServerComponent(Component)) {
      return this.renderServerComponent(Component, props);
    }

    // Regular React component
    const element = React.createElement(Component, props);
    return this.wrapHtml(renderToString(element), props);
  }

  /**
   * Render server component
   */
  private async renderServerComponent(
    Component: React.ComponentType<any>,
    props: Record<string, any>
  ): Promise<string> {
    const flight = await this.rscRenderer.renderToFlight(Component, props);
    return this.wrapRSCHtml(flight, props);
  }

  /**
   * Render with streaming
   */
  async renderToStream(
    Component: React.ComponentType<any>,
    props: Record<string, any>
  ): Promise<ReadableStream> {
    if (this.isServerComponent(Component)) {
      return this.rscRenderer.renderToStream(Component, props);
    }

    // Use React 18 streaming
    return new ReadableStream({
      start(controller) {
        const { pipe } = renderToPipeableStream(
          React.createElement(Component, props),
          {
            onShellReady() {
              const transform = new Transform({
                transform(chunk, encoding, callback) {
                  controller.enqueue(chunk);
                  callback();
                },
              });

              pipe(transform);
            },
            onAllReady() {
              controller.close();
            },
            onError(error) {
              controller.error(error);
            },
          }
        );
      },
    });
  }

  /**
   * Wrap HTML with document structure
   */
  private wrapHtml(html: string, props: Record<string, any>): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title || 'Elide Next App'}</title>
  <script type="module" src="/__elide_client__.js"></script>
</head>
<body>
  <div id="__elide_root__">${html}</div>
  <script>
    window.__ELIDE_PROPS__ = ${JSON.stringify(props)};
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Wrap RSC HTML
   */
  private wrapRSCHtml(flight: string, props: Record<string, any>): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title || 'Elide Next App'}</title>
  <script type="module" src="/__elide_rsc_client__.js"></script>
</head>
<body>
  <div id="__elide_root__"></div>
  <script type="text/rsc">
${flight}
  </script>
  <script>
    window.__ELIDE_FLIGHT__ = document.querySelector('script[type="text/rsc"]').textContent;
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Render 404 page
   */
  private async render404(): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>404 - Page Not Found</title>
  <style>
    body { font-family: system-ui; text-align: center; padding: 50px; }
    h1 { font-size: 4rem; margin: 0; }
    p { color: #666; }
  </style>
</head>
<body>
  <h1>404</h1>
  <p>This page could not be found.</p>
</body>
</html>
    `.trim();
  }

  /**
   * Detect render mode from route and module
   */
  private detectRenderMode(route: Route, pageModule: any): RenderMode {
    if (route.dynamic === 'force-dynamic') return 'ssr';
    if (route.dynamic === 'force-static') return 'ssg';

    if (pageModule.getStaticProps) {
      return route.revalidate ? 'isr' : 'ssg';
    }

    if (pageModule.getServerSideProps) {
      return 'ssr';
    }

    // Default to SSG for static pages
    return 'ssg';
  }

  /**
   * Check if component is server component
   */
  private isServerComponent(Component: any): boolean {
    return Component.$$typeof === Symbol.for('react.server.component') ||
           Component.__server__ === true;
  }

  /**
   * Load page module
   */
  private async loadPage(filePath: string): Promise<any> {
    // In production, use require/import
    // In development, use dynamic import for HMR
    return import(filePath);
  }

  /**
   * Get cache key
   */
  private getCacheKey(path: string, params: Record<string, any>): string {
    return path + '?' + JSON.stringify(params);
  }

  /**
   * Get static page from disk
   */
  private async getStaticPage(key: string): Promise<string | null> {
    try {
      const filePath = join(this.buildDir, 'static', key + '.html');
      return await readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Save static page to disk
   */
  private async saveStaticPage(key: string, html: string): Promise<void> {
    try {
      const dirPath = join(this.buildDir, 'static');
      await mkdir(dirPath, { recursive: true });

      const filePath = join(dirPath, key + '.html');
      await writeFile(filePath, html, 'utf-8');
    } catch (error) {
      console.error('Failed to save static page:', error);
    }
  }

  /**
   * Revalidate in background
   */
  private async revalidateInBackground(
    route: Route,
    pageModule: any,
    params: Record<string, string | string[]>,
    cacheKey: string
  ): Promise<void> {
    // Don't await - run in background
    (async () => {
      try {
        const result = await this.renderSSG(route, pageModule, params);
        this.staticCache.set(cacheKey, {
          html: result.html,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Background revalidation failed:', error);
      }
    })();
  }
}

export default PageRenderer;
