/**
 * Webpack Clone - Style Loader
 *
 * Injects CSS into the DOM by adding a <style> tag.
 * Supports HMR, source maps, and custom injection strategies.
 */

export interface StyleLoaderOptions {
  /**
   * Insert style tag at specific position
   */
  insert?: string | ((element: HTMLStyleElement) => void);

  /**
   * Style tag attributes
   */
  attributes?: Record<string, string>;

  /**
   * Inject type
   */
  injectType?: 'styleTag' | 'singletonStyleTag' | 'autoStyleTag' | 'lazyStyleTag' | 'lazySingletonStyleTag' | 'linkTag';

  /**
   * Base href for linkTag inject type
   */
  base?: number;

  /**
   * ESModule export
   */
  esModule?: boolean;

  /**
   * Modules options
   */
  modules?: {
    namedExport?: boolean;
  };
}

export async function styleLoader(
  source: string,
  options: StyleLoaderOptions = {},
): Promise<string> {
  const opts: StyleLoaderOptions = {
    insert: options.insert || 'head',
    attributes: options.attributes || {},
    injectType: options.injectType || 'styleTag',
    esModule: options.esModule !== false,
    modules: options.modules || {},
  };

  // Generate runtime code based on inject type
  let runtimeCode = '';

  switch (opts.injectType) {
    case 'styleTag':
      runtimeCode = generateStyleTagCode(source, opts);
      break;

    case 'singletonStyleTag':
      runtimeCode = generateSingletonStyleTagCode(source, opts);
      break;

    case 'autoStyleTag':
      runtimeCode = generateAutoStyleTagCode(source, opts);
      break;

    case 'lazyStyleTag':
      runtimeCode = generateLazyStyleTagCode(source, opts);
      break;

    case 'lazySingletonStyleTag':
      runtimeCode = generateLazySingletonStyleTagCode(source, opts);
      break;

    case 'linkTag':
      runtimeCode = generateLinkTagCode(source, opts);
      break;
  }

  return runtimeCode;
}

/**
 * Generate style tag injection code
 */
function generateStyleTagCode(
  source: string,
  options: StyleLoaderOptions,
): string {
  const insertCode = getInsertCode(options.insert!);
  const attrsCode = getAttributesCode(options.attributes!);

  return `
    ${getAPICode()}

    const css = ${JSON.stringify(source)};

    // Runtime
    const style = document.createElement('style');
    ${attrsCode}
    style.appendChild(document.createTextNode(css));

    ${insertCode}

    ${getHMRCode()}

    export default css;
  `.trim();
}

/**
 * Generate singleton style tag code
 */
function generateSingletonStyleTagCode(
  source: string,
  options: StyleLoaderOptions,
): string {
  const insertCode = getInsertCode(options.insert!);
  const attrsCode = getAttributesCode(options.attributes!);

  return `
    ${getAPICode()}

    const css = ${JSON.stringify(source)};

    // Runtime (Singleton)
    let singletonElement = document.getElementById('__style-loader-singleton__');

    if (!singletonElement) {
      singletonElement = document.createElement('style');
      singletonElement.id = '__style-loader-singleton__';
      ${attrsCode.replace('style.', 'singletonElement.')}
      ${insertCode.replace('style', 'singletonElement')}
    }

    const textNode = document.createTextNode(css);
    singletonElement.appendChild(textNode);

    ${getHMRCode('singletonElement', 'textNode')}

    export default css;
  `.trim();
}

/**
 * Generate auto style tag code
 */
function generateAutoStyleTagCode(
  source: string,
  options: StyleLoaderOptions,
): string {
  return `
    ${getAPICode()}

    const css = ${JSON.stringify(source)};

    // Auto inject
    if (typeof window !== 'undefined') {
      ${generateStyleTagCode(source, options)}
    }

    export default css;
  `.trim();
}

/**
 * Generate lazy style tag code
 */
function generateLazyStyleTagCode(
  source: string,
  options: StyleLoaderOptions,
): string {
  const insertCode = getInsertCode(options.insert!);
  const attrsCode = getAttributesCode(options.attributes!);

  return `
    ${getAPICode()}

    const css = ${JSON.stringify(source)};

    let style;
    let isLoaded = false;

    function use() {
      if (isLoaded) return;

      style = document.createElement('style');
      ${attrsCode}
      style.appendChild(document.createTextNode(css));
      ${insertCode}

      isLoaded = true;
    }

    function unuse() {
      if (!isLoaded) return;

      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }

      isLoaded = false;
    }

    ${getHMRCode()}

    export { use, unuse };
    export default { css, use, unuse };
  `.trim();
}

/**
 * Generate lazy singleton style tag code
 */
function generateLazySingletonStyleTagCode(
  source: string,
  options: StyleLoaderOptions,
): string {
  const insertCode = getInsertCode(options.insert!);
  const attrsCode = getAttributesCode(options.attributes!);

  return `
    ${getAPICode()}

    const css = ${JSON.stringify(source)};

    let singletonElement;
    let textNode;
    let refCount = 0;

    function use() {
      refCount++;

      if (refCount > 1) return;

      singletonElement = document.getElementById('__style-loader-lazy-singleton__');

      if (!singletonElement) {
        singletonElement = document.createElement('style');
        singletonElement.id = '__style-loader-lazy-singleton__';
        ${attrsCode.replace('style.', 'singletonElement.')}
        ${insertCode.replace('style', 'singletonElement')}
      }

      textNode = document.createTextNode(css);
      singletonElement.appendChild(textNode);
    }

    function unuse() {
      refCount--;

      if (refCount > 0) return;

      if (textNode && textNode.parentNode) {
        textNode.parentNode.removeChild(textNode);
      }
    }

    ${getHMRCode('singletonElement', 'textNode')}

    export { use, unuse };
    export default { css, use, unuse };
  `.trim();
}

/**
 * Generate link tag code
 */
function generateLinkTagCode(
  source: string,
  options: StyleLoaderOptions,
): string {
  const insertCode = getInsertCode(options.insert!);
  const attrsCode = getAttributesCode(options.attributes!);

  return `
    ${getAPICode()}

    const url = ${JSON.stringify(source)};

    // Runtime
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    ${attrsCode.replace('style.', 'link.')}

    ${insertCode.replace('style', 'link')}

    ${getHMRCode('link')}

    export default url;
  `.trim();
}

/**
 * Get insert code
 */
function getInsertCode(insert: string | ((element: HTMLStyleElement) => void)): string {
  if (typeof insert === 'function') {
    return `(${insert.toString()})(style);`;
  }

  // Handle predefined insert positions
  switch (insert) {
    case 'head':
      return `document.head.appendChild(style);`;

    case 'body':
      return `document.body.appendChild(style);`;

    default:
      // Assume it's a selector
      return `
        const target = document.querySelector(${JSON.stringify(insert)});
        if (target) {
          target.appendChild(style);
        } else {
          document.head.appendChild(style);
        }
      `;
  }
}

/**
 * Get attributes code
 */
function getAttributesCode(attributes: Record<string, string>): string {
  const attrs = Object.entries(attributes);

  if (attrs.length === 0) {
    return '';
  }

  return attrs
    .map(([key, value]) => {
      return `style.setAttribute(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
    })
    .join('\n');
}

/**
 * Get API code
 */
function getAPICode(): string {
  return `
    // Style Loader API
    const api = {
      insertStyleElement: function(style) {
        document.head.appendChild(style);
      },
      removeStyleElement: function(style) {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      },
      updateStyleElement: function(style, css) {
        style.innerHTML = css;
      }
    };
  `.trim();
}

/**
 * Get HMR code
 */
function getHMRCode(elementVar: string = 'style', textNodeVar?: string): string {
  return `
    // Hot Module Replacement
    if (module.hot) {
      module.hot.accept(function(err) {
        if (err) {
          console.error('Cannot apply HMR update:', err);
          return;
        }

        console.log('[HMR] Updating styles...');

        // Update the style element
        if (${elementVar}) {
          ${
            textNodeVar
              ? `
            if (${textNodeVar}) {
              ${textNodeVar}.textContent = css;
            } else {
              ${elementVar}.innerHTML = css;
            }
          `
              : `${elementVar}.innerHTML = css;`
          }
        }
      });

      module.hot.dispose(function() {
        // Cleanup on disposal
        if (${elementVar} && ${elementVar}.parentNode) {
          ${elementVar}.parentNode.removeChild(${elementVar});
        }
      });
    }
  `.trim();
}

/**
 * Create style element
 */
export function createStyleElement(css: string, options: StyleLoaderOptions = {}): HTMLStyleElement {
  const style = document.createElement('style');

  // Set attributes
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      style.setAttribute(key, value);
    });
  }

  // Add CSS content
  style.appendChild(document.createTextNode(css));

  return style;
}

/**
 * Insert style element
 */
export function insertStyleElement(
  style: HTMLStyleElement,
  insert: string | ((element: HTMLStyleElement) => void),
): void {
  if (typeof insert === 'function') {
    insert(style);
    return;
  }

  // Handle predefined positions
  switch (insert) {
    case 'head':
      document.head.appendChild(style);
      break;

    case 'body':
      document.body.appendChild(style);
      break;

    default:
      // Try as selector
      const target = document.querySelector(insert);
      if (target) {
        target.appendChild(style);
      } else {
        document.head.appendChild(style);
      }
  }
}

/**
 * Remove style element
 */
export function removeStyleElement(style: HTMLStyleElement): void {
  if (style.parentNode) {
    style.parentNode.removeChild(style);
  }
}

/**
 * Update style element
 */
export function updateStyleElement(style: HTMLStyleElement, css: string): void {
  // Clear existing content
  while (style.firstChild) {
    style.removeChild(style.firstChild);
  }

  // Add new content
  style.appendChild(document.createTextNode(css));
}

/**
 * Singleton manager
 */
class SingletonManager {
  private element: HTMLStyleElement | null = null;
  private refCount: number = 0;
  private css: Set<string> = new Set();

  constructor(private id: string, private options: StyleLoaderOptions) {}

  add(css: string): () => void {
    this.css.add(css);
    this.refCount++;

    if (!this.element) {
      this.createElement();
    }

    this.update();

    return () => this.remove(css);
  }

  private createElement(): void {
    this.element = createStyleElement('', this.options);
    this.element.id = this.id;
    insertStyleElement(this.element, this.options.insert || 'head');
  }

  private update(): void {
    if (!this.element) return;

    const combinedCSS = Array.from(this.css).join('\n\n');
    updateStyleElement(this.element, combinedCSS);
  }

  private remove(css: string): void {
    this.css.delete(css);
    this.refCount--;

    if (this.refCount === 0) {
      if (this.element) {
        removeStyleElement(this.element);
        this.element = null;
      }
    } else {
      this.update();
    }
  }
}

// Global singleton instance
let singletonInstance: SingletonManager | null = null;

/**
 * Get singleton instance
 */
export function getSingleton(options: StyleLoaderOptions = {}): SingletonManager {
  if (!singletonInstance) {
    singletonInstance = new SingletonManager(
      '__style-loader-singleton__',
      options,
    );
  }

  return singletonInstance;
}

export default styleLoader;
