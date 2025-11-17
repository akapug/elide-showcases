/**
 * Island Architecture Implementation
 *
 * Features:
 * - Selective hydration
 * - Multiple hydration strategies
 * - Framework-agnostic islands
 * - Minimal JavaScript shipping
 */

export type HydrationStrategy =
  | 'load'      // Hydrate immediately
  | 'idle'      // Hydrate when browser is idle
  | 'visible'   // Hydrate when visible
  | 'media'     // Hydrate based on media query
  | 'only';     // Client-only rendering

export interface Island {
  id: string;
  component: string;
  framework: 'react' | 'vue' | 'svelte' | 'solid' | 'preact';
  props: Record<string, any>;
  strategy: HydrationStrategy;
  media?: string;
  children?: string;
}

export class IslandManager {
  private islands = new Map<string, Island>();
  private hydrated = new Set<string>();

  /**
   * Register island
   */
  register(island: Island): void {
    this.islands.set(island.id, island);
  }

  /**
   * Get all islands
   */
  getIslands(): Island[] {
    return Array.from(this.islands.values());
  }

  /**
   * Get island by ID
   */
  getIsland(id: string): Island | undefined {
    return this.islands.get(id);
  }

  /**
   * Generate island HTML
   */
  generateHTML(island: Island): string {
    return `
      <astro-island
        uid="${island.id}"
        component-url="${this.getComponentURL(island)}"
        component-export="default"
        renderer-url="${this.getRendererURL(island.framework)}"
        props="${this.encodeProps(island.props)}"
        client="${island.strategy}"
        ${island.media ? `media="${island.media}"` : ''}
      >
        ${island.children || ''}
      </astro-island>
    `;
  }

  /**
   * Generate hydration script
   */
  generateHydrationScript(): string {
    return `
<script type="module">
class AstroIsland extends HTMLElement {
  async connectedCallback() {
    const uid = this.getAttribute('uid');
    const strategy = this.getAttribute('client');
    const componentUrl = this.getAttribute('component-url');
    const rendererUrl = this.getAttribute('renderer-url');
    const props = JSON.parse(this.getAttribute('props') || '{}');

    // Apply hydration strategy
    await this.hydrate(strategy, async () => {
      // Load renderer
      const renderer = await import(rendererUrl);

      // Load component
      const component = await import(componentUrl);

      // Hydrate
      await renderer.default(this, component.default, props);
    });
  }

  async hydrate(strategy, fn) {
    switch (strategy) {
      case 'load':
        await fn();
        break;

      case 'idle':
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => fn());
        } else {
          setTimeout(() => fn(), 200);
        }
        break;

      case 'visible':
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              observer.disconnect();
              fn();
            }
          }
        });
        observer.observe(this);
        break;

      case 'media':
        const media = this.getAttribute('media');
        if (media) {
          const mql = window.matchMedia(media);
          if (mql.matches) {
            await fn();
          } else {
            mql.addEventListener('change', () => fn(), { once: true });
          }
        }
        break;

      case 'only':
        // Already client-only, just render
        await fn();
        break;
    }
  }
}

customElements.define('astro-island', AstroIsland);
</script>
    `.trim();
  }

  /**
   * Get component URL
   */
  private getComponentURL(island: Island): string {
    return `/__astro_components__/${island.component}.js`;
  }

  /**
   * Get renderer URL
   */
  private getRendererURL(framework: string): string {
    return `/__astro_renderers__/${framework}.js`;
  }

  /**
   * Encode props for HTML attribute
   */
  private encodeProps(props: Record<string, any>): string {
    return JSON.stringify(props)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Mark island as hydrated
   */
  markHydrated(id: string): void {
    this.hydrated.add(id);
  }

  /**
   * Check if island is hydrated
   */
  isHydrated(id: string): boolean {
    return this.hydrated.has(id);
  }
}

/**
 * Client-side island hydrator
 */
export class ClientHydrator {
  /**
   * Hydrate all islands on page
   */
  static async hydrateAll(): Promise<void> {
    const islands = document.querySelectorAll('astro-island');

    for (const island of islands) {
      await this.hydrateIsland(island as HTMLElement);
    }
  }

  /**
   * Hydrate single island
   */
  private static async hydrateIsland(element: HTMLElement): Promise<void> {
    const strategy = element.getAttribute('client');
    const componentUrl = element.getAttribute('component-url');
    const rendererUrl = element.getAttribute('renderer-url');
    const props = JSON.parse(element.getAttribute('props') || '{}');

    if (!componentUrl || !rendererUrl) {
      return;
    }

    // Apply strategy
    switch (strategy) {
      case 'load':
        await this.hydrate(element, componentUrl, rendererUrl, props);
        break;

      case 'idle':
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            this.hydrate(element, componentUrl, rendererUrl, props);
          });
        } else {
          setTimeout(() => {
            this.hydrate(element, componentUrl, rendererUrl, props);
          }, 200);
        }
        break;

      case 'visible':
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              observer.disconnect();
              this.hydrate(element, componentUrl, rendererUrl, props);
            }
          }
        });
        observer.observe(element);
        break;

      case 'media':
        const media = element.getAttribute('media');
        if (media) {
          const mql = window.matchMedia(media);
          if (mql.matches) {
            await this.hydrate(element, componentUrl, rendererUrl, props);
          } else {
            mql.addEventListener(
              'change',
              () => this.hydrate(element, componentUrl, rendererUrl, props),
              { once: true }
            );
          }
        }
        break;

      case 'only':
        await this.hydrate(element, componentUrl, rendererUrl, props);
        break;
    }
  }

  /**
   * Hydrate component
   */
  private static async hydrate(
    element: HTMLElement,
    componentUrl: string,
    rendererUrl: string,
    props: Record<string, any>
  ): Promise<void> {
    try {
      // Load renderer and component
      const [renderer, component] = await Promise.all([
        import(rendererUrl),
        import(componentUrl),
      ]);

      // Hydrate
      await renderer.default(element, component.default, props);
    } catch (error) {
      console.error('Failed to hydrate island:', error);
    }
  }
}

/**
 * Framework renderers
 */
export const renderers = {
  /**
   * React renderer
   */
  react: async (element: HTMLElement, Component: any, props: any) => {
    const { hydrateRoot } = await import('react-dom/client');
    const { createElement } = await import('react');

    hydrateRoot(element, createElement(Component, props));
  },

  /**
   * Vue renderer
   */
  vue: async (element: HTMLElement, Component: any, props: any) => {
    const { createApp } = await import('vue');

    const app = createApp(Component, props);
    app.mount(element);
  },

  /**
   * Svelte renderer
   */
  svelte: async (element: HTMLElement, Component: any, props: any) => {
    new Component({
      target: element,
      props,
      hydrate: true,
    });
  },

  /**
   * Solid renderer
   */
  solid: async (element: HTMLElement, Component: any, props: any) => {
    const { hydrate } = await import('solid-js/web');

    hydrate(() => Component(props), element);
  },
};

export default IslandManager;
