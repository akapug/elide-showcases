/**
 * Elide Full-Stack Framework - React Server Components
 *
 * Server-side rendering with React Server Components support:
 * - Zero client-side JavaScript by default
 * - Streaming with Suspense boundaries
 * - Automatic code splitting
 * - Data fetching during render
 * - Server-client component boundary
 *
 * Features:
 * - Server Components (RSC)
 * - Client Components with hydration
 * - Streaming SSR with Suspense
 * - Progressive enhancement
 * - Automatic serialization
 */

import { Request, Response } from "elide:http";
import type { RouteContext } from "./router.ts";

// Component types
export type ServerComponent<P = {}> = (props: P) => Promise<JSX.Element> | JSX.Element;
export type ClientComponent<P = {}> = (props: P) => JSX.Element;

// Server component metadata
export interface ComponentMetadata {
  type: "server" | "client";
  id: string;
  props?: Record<string, any>;
  suspenseBoundary?: boolean;
}

// Render options
export interface RenderOptions {
  streaming?: boolean;
  suspense?: boolean;
  head?: HeadConfig;
  bootstrapScripts?: string[];
  bootstrapModules?: string[];
}

export interface HeadConfig {
  title?: string;
  description?: string;
  meta?: Array<{ name?: string; property?: string; content: string }>;
  links?: Array<{ rel: string; href: string; type?: string }>;
}

// Client component registry for hydration
const CLIENT_COMPONENTS = new Map<string, ClientComponent>();

/**
 * Register a client component for hydration
 */
export function registerClientComponent(id: string, component: ClientComponent): void {
  CLIENT_COMPONENTS.set(id, component);
}

/**
 * Mark a component as a client component
 */
export function clientComponent<P = {}>(
  id: string,
  component: ClientComponent<P>
): ClientComponent<P> {
  registerClientComponent(id, component);

  return new Proxy(component, {
    apply(target, thisArg, args) {
      // Add metadata for RSC payload
      const props = args[0] || {};
      return {
        $$typeof: Symbol.for("react.element"),
        type: "client-component",
        props: {
          ...props,
          $$id: id,
          $$client: true,
        },
        key: null,
        ref: null,
      };
    },
  }) as ClientComponent<P>;
}

/**
 * RSC Payload generator for client components
 */
class RSCPayload {
  private chunks: string[] = [];
  private clientReferences = new Set<string>();

  addChunk(chunk: string): void {
    this.chunks.push(chunk);
  }

  addClientReference(id: string): void {
    this.clientReferences.add(id);
  }

  serialize(): string {
    const payload = {
      chunks: this.chunks,
      clientReferences: Array.from(this.clientReferences),
    };

    return JSON.stringify(payload);
  }
}

/**
 * Server-side renderer with streaming support
 */
export class ServerRenderer {
  private payload = new RSCPayload();

  /**
   * Render a component to HTML with streaming support
   */
  async render(
    component: ServerComponent,
    props: Record<string, any> = {},
    options: RenderOptions = {}
  ): Promise<Response> {
    if (options.streaming) {
      return this.renderToStream(component, props, options);
    } else {
      return this.renderToString(component, props, options);
    }
  }

  /**
   * Render component to a complete HTML string
   */
  private async renderToString(
    component: ServerComponent,
    props: Record<string, any>,
    options: RenderOptions
  ): Promise<Response> {
    const appHtml = await this.renderComponent(component, props);
    const html = this.buildHTMLDocument(appHtml, options);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  /**
   * Render component with streaming and Suspense support
   */
  private async renderToStream(
    component: ServerComponent,
    props: Record<string, any>,
    options: RenderOptions
  ): Promise<Response> {
    const self = this;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial HTML shell
          const shellStart = self.buildHTMLShell(options, true);
          controller.enqueue(encoder.encode(shellStart));

          // Render component with streaming
          const html = await self.renderComponent(component, props);
          controller.enqueue(encoder.encode(html));

          // Send client references for hydration
          if (self.payload.serialize()) {
            const script = `<script type="application/json" id="__RSC_DATA__">${self.payload.serialize()}</script>`;
            controller.enqueue(encoder.encode(script));
          }

          // Send closing HTML
          const shellEnd = self.buildHTMLShell(options, false);
          controller.enqueue(encoder.encode(shellEnd));

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  }

  /**
   * Render a single component to HTML
   */
  private async renderComponent(
    component: ServerComponent,
    props: Record<string, any>
  ): Promise<string> {
    try {
      const element = await component(props);

      if (!element) {
        return "";
      }

      // Handle client components
      if (element.props?.$$client) {
        return this.renderClientComponent(element);
      }

      // Handle server components
      return this.renderServerComponent(element);
    } catch (error) {
      console.error("Component render error:", error);
      return `<div style="color: red; padding: 20px; border: 1px solid red;">Error rendering component: ${error.message}</div>`;
    }
  }

  /**
   * Render a server component
   */
  private renderServerComponent(element: any): string {
    if (typeof element === "string" || typeof element === "number") {
      return String(element);
    }

    if (Array.isArray(element)) {
      return element.map((child) => this.renderServerComponent(child)).join("");
    }

    if (!element.type) {
      return "";
    }

    const { type, props } = element;
    const { children, ...attributes } = props || {};

    // Handle intrinsic elements (div, span, etc.)
    if (typeof type === "string") {
      const attrs = Object.entries(attributes)
        .map(([key, value]) => {
          if (key === "className") {
            return `class="${this.escapeHtml(String(value))}"`;
          }
          if (key.startsWith("on")) {
            // Skip event handlers in SSR
            return "";
          }
          if (typeof value === "boolean") {
            return value ? key : "";
          }
          return `${key}="${this.escapeHtml(String(value))}"`;
        })
        .filter(Boolean)
        .join(" ");

      const childrenHtml = children
        ? Array.isArray(children)
          ? children.map((child) => this.renderServerComponent(child)).join("")
          : this.renderServerComponent(children)
        : "";

      // Self-closing tags
      if (["img", "br", "hr", "input", "meta", "link"].includes(type)) {
        return `<${type} ${attrs} />`;
      }

      return `<${type}${attrs ? " " + attrs : ""}>${childrenHtml}</${type}>`;
    }

    return "";
  }

  /**
   * Render a client component placeholder
   */
  private renderClientComponent(element: any): string {
    const { $$id, ...props } = element.props;

    this.payload.addClientReference($$id);

    // Create a placeholder for hydration
    const dataProps = this.escapeHtml(JSON.stringify(props));

    return `<div data-client-component="${$$id}" data-props="${dataProps}"></div>`;
  }

  /**
   * Build complete HTML document
   */
  private buildHTMLDocument(appHtml: string, options: RenderOptions): string {
    const { head = {}, bootstrapScripts = [], bootstrapModules = [] } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${head.title ? `<title>${this.escapeHtml(head.title)}</title>` : ""}
  ${head.description ? `<meta name="description" content="${this.escapeHtml(head.description)}" />` : ""}
  ${(head.meta || []).map((meta) => this.renderMetaTag(meta)).join("\n  ")}
  ${(head.links || []).map((link) => this.renderLinkTag(link)).join("\n  ")}
</head>
<body>
  <div id="root">${appHtml}</div>
  ${this.payload.serialize() ? `<script type="application/json" id="__RSC_DATA__">${this.payload.serialize()}</script>` : ""}
  ${bootstrapScripts.map((src) => `<script src="${src}"></script>`).join("\n  ")}
  ${bootstrapModules.map((src) => `<script type="module" src="${src}"></script>`).join("\n  ")}
</body>
</html>`;
  }

  /**
   * Build HTML shell for streaming (before/after app content)
   */
  private buildHTMLShell(options: RenderOptions, start: boolean): string {
    if (start) {
      const { head = {} } = options;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${head.title ? `<title>${this.escapeHtml(head.title)}</title>` : ""}
  ${head.description ? `<meta name="description" content="${this.escapeHtml(head.description)}" />` : ""}
  ${(head.meta || []).map((meta) => this.renderMetaTag(meta)).join("\n  ")}
  ${(head.links || []).map((link) => this.renderLinkTag(link)).join("\n  ")}
</head>
<body>
  <div id="root">`;
    } else {
      const { bootstrapScripts = [], bootstrapModules = [] } = options;

      return `</div>
  ${bootstrapScripts.map((src) => `<script src="${src}"></script>`).join("\n  ")}
  ${bootstrapModules.map((src) => `<script type="module" src="${src}"></script>`).join("\n  ")}
</body>
</html>`;
    }
  }

  private renderMetaTag(meta: { name?: string; property?: string; content: string }): string {
    if (meta.name) {
      return `<meta name="${this.escapeHtml(meta.name)}" content="${this.escapeHtml(meta.content)}" />`;
    }
    if (meta.property) {
      return `<meta property="${this.escapeHtml(meta.property)}" content="${this.escapeHtml(meta.content)}" />`;
    }
    return "";
  }

  private renderLinkTag(link: { rel: string; href: string; type?: string }): string {
    const type = link.type ? ` type="${this.escapeHtml(link.type)}"` : "";
    return `<link rel="${this.escapeHtml(link.rel)}" href="${this.escapeHtml(link.href)}"${type} />`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };

    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}

/**
 * Suspense boundary for async components
 */
export async function Suspense<T>(props: {
  fallback: JSX.Element;
  children: Promise<JSX.Element> | JSX.Element;
}): Promise<JSX.Element> {
  try {
    const children = await Promise.resolve(props.children);
    return children;
  } catch {
    return props.fallback;
  }
}

/**
 * Helper to create a server component renderer
 */
export function createRenderer(): ServerRenderer {
  return new ServerRenderer();
}

/**
 * Helper to render a component as an HTTP response
 */
export async function renderToResponse(
  component: ServerComponent,
  props: Record<string, any> = {},
  options: RenderOptions = {}
): Promise<Response> {
  const renderer = new ServerRenderer();
  return renderer.render(component, props, options);
}

// Example usage:
/**
 * // components/Counter.client.ts (Client Component)
 * import { clientComponent } from "../server-components.ts";
 *
 * export const Counter = clientComponent("Counter", ({ initialCount = 0 }) => {
 *   const [count, setCount] = useState(initialCount);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * });
 *
 * // components/UserList.server.ts (Server Component)
 * import { db } from "../lib/db.ts";
 *
 * export async function UserList() {
 *   const users = await db.users.findMany();
 *
 *   return (
 *     <div>
 *       <h2>Users</h2>
 *       <ul>
 *         {users.map(user => (
 *           <li key={user.id}>{user.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 *
 * // pages/index.tsx
 * import { renderToResponse } from "../server-components.ts";
 * import { UserList } from "../components/UserList.server.ts";
 * import { Counter } from "../components/Counter.client.ts";
 *
 * export async function GET(req: Request, ctx: RouteContext) {
 *   return renderToResponse(
 *     async () => (
 *       <html>
 *         <body>
 *           <h1>My App</h1>
 *           <UserList />
 *           <Counter initialCount={0} />
 *         </body>
 *       </html>
 *     ),
 *     {},
 *     {
 *       streaming: true,
 *       head: {
 *         title: "My App",
 *         description: "Built with Elide Full-Stack Framework",
 *       },
 *     }
 *   );
 * }
 */
