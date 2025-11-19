/**
 * SvelteKit Server Runtime
 *
 * Features:
 * - SSR rendering
 * - Server routes
 * - Form actions
 * - Hooks
 */

import { compile } from 'svelte/compiler';
import { SvelteKitRouter, LoadExecutor } from './router';

export interface RenderOptions {
  url: string;
  method?: string;
  headers?: Headers;
  body?: any;
}

export interface RenderResult {
  html: string;
  head: string;
  css: string;
  statusCode: number;
  headers: Record<string, string>;
}

export class SvelteKitServer {
  private router: SvelteKitRouter;
  private loadExecutor: LoadExecutor;

  constructor(router: SvelteKitRouter) {
    this.router = router;
    this.loadExecutor = new LoadExecutor();
  }

  /**
   * Render page
   */
  async render(options: RenderOptions): Promise<RenderResult> {
    const start = performance.now();

    // Match route
    const match = this.router.match(options.url);

    if (!match) {
      return this.render404();
    }

    // Handle server route
    if (match.route.server && !match.route.page) {
      return this.handleServerRoute(match.route, options);
    }

    // Execute load functions
    const data = await this.executeLoadFunctions(match.route, {
      params: match.params,
      url: new URL(options.url, 'http://localhost'),
      method: options.method || 'GET',
    });

    // Render Svelte component
    const result = await this.renderComponent(match.route.page!, data);

    const elapsed = performance.now() - start;
    console.log(`[SSR] Rendered ${options.url} in ${elapsed.toFixed(2)}ms`);

    return {
      ...result,
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    };
  }

  /**
   * Execute load functions
   */
  private async executeLoadFunctions(
    route: any,
    context: any
  ): Promise<any> {
    let data = {};

    // Execute server load first
    if (route.serverLoad) {
      data = await this.loadExecutor.executeServer(route.serverLoad, {
        ...context,
        request: new Request(context.url),
        cookies: {},
        locals: {},
      });
    }

    // Execute client load
    if (route.load) {
      const clientData = await this.loadExecutor.execute(route.load, {
        ...context,
        fetch: global.fetch,
        parent: async () => data,
      });

      data = { ...data, ...clientData };
    }

    return data;
  }

  /**
   * Render Svelte component
   */
  private async renderComponent(
    componentPath: string,
    data: any
  ): Promise<{ html: string; head: string; css: string }> {
    // Load component
    const component = await import(componentPath);
    const Component = component.default;

    // Render to HTML
    const rendered = Component.render(data);

    return {
      html: rendered.html,
      head: rendered.head || '',
      css: rendered.css?.code || '',
    };
  }

  /**
   * Handle server route
   */
  private async handleServerRoute(
    route: any,
    options: RenderOptions
  ): Promise<RenderResult> {
    const serverModule = await import(route.server);
    const handler = serverModule[options.method || 'GET'];

    if (!handler) {
      return {
        html: 'Method not allowed',
        head: '',
        css: '',
        statusCode: 405,
        headers: {},
      };
    }

    const response = await handler({
      request: new Request(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
      }),
    });

    const html = await response.text();

    return {
      html,
      head: '',
      css: '',
      statusCode: response.status,
      headers: Object.fromEntries(response.headers),
    };
  }

  /**
   * Render 404
   */
  private async render404(): Promise<RenderResult> {
    return {
      html: '<h1>404 - Not Found</h1>',
      head: '<title>404</title>',
      css: '',
      statusCode: 404,
      headers: {
        'Content-Type': 'text/html',
      },
    };
  }

  /**
   * Wrap HTML
   */
  wrapHtml(result: RenderResult, data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  ${result.head}
  ${result.css ? `<style>${result.css}</style>` : ''}
  <script type="module" src="/__elide_client__.js"></script>
</head>
<body>
  <div id="svelte">${result.html}</div>
  <script>
    window.__SVELTEKIT__ = ${JSON.stringify(data)};
  </script>
</body>
</html>
    `.trim();
  }
}

/**
 * Form actions handler
 */
export class FormActionsHandler {
  /**
   * Execute action
   */
  async execute(
    actionPath: string,
    actionName: string,
    formData: FormData
  ): Promise<any> {
    const actionsModule = await import(actionPath);
    const actions = actionsModule.actions;

    if (!actions) {
      throw new Error('No actions found');
    }

    const action = actionName ? actions[actionName] : actions.default;

    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    return await action({
      request: new Request('http://localhost', {
        method: 'POST',
        body: formData,
      }),
      cookies: {},
      locals: {},
    });
  }
}

export default SvelteKitServer;
