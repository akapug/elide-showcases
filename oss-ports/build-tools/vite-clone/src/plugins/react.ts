/**
 * Vite Clone - React Plugin
 *
 * Provides React Fast Refresh, JSX transformation, and React-specific optimizations.
 */

import type { Plugin } from '../types/plugin';
import { normalizePath } from '../core/config';

/**
 * React plugin options
 */
export interface ReactPluginOptions {
  /**
   * Include files matching these patterns
   */
  include?: string | RegExp | Array<string | RegExp>;

  /**
   * Exclude files matching these patterns
   */
  exclude?: string | RegExp | Array<string | RegExp>;

  /**
   * Enable Fast Refresh
   */
  fastRefresh?: boolean;

  /**
   * JSX runtime
   */
  jsxRuntime?: 'classic' | 'automatic';

  /**
   * Babel options
   */
  babel?: {
    plugins?: any[];
    presets?: any[];
    parserOpts?: any;
    generatorOpts?: any;
  };

  /**
   * JSX import source (for automatic runtime)
   */
  jsxImportSource?: string;
}

/**
 * Default options
 */
const defaultOptions: Required<ReactPluginOptions> = {
  include: /\.(jsx|tsx)$/,
  exclude: /node_modules/,
  fastRefresh: true,
  jsxRuntime: 'automatic',
  babel: {},
  jsxImportSource: 'react',
};

/**
 * React plugin
 */
export default function react(options: ReactPluginOptions = {}): Plugin {
  const opts = { ...defaultOptions, ...options };

  return {
    name: 'vite-clone:react',

    enforce: 'pre',

    config() {
      return {
        esbuild: {
          jsx: 'automatic',
          jsxDev: true,
        },
        optimizeDeps: {
          include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
        },
        resolve: {
          dedupe: ['react', 'react-dom'],
        },
      };
    },

    async transform(code: string, id: string, options?: any) {
      // Check if file should be transformed
      if (!shouldTransform(id, opts)) {
        return null;
      }

      const isSSR = options?.ssr || false;

      // Transform JSX
      let transformedCode = code;

      if (opts.jsxRuntime === 'automatic') {
        // Inject JSX runtime import
        if (!code.includes('jsx')) {
          const importStatement = isSSR
            ? `import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from '${opts.jsxImportSource}/jsx-runtime';\n`
            : `import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from '${opts.jsxImportSource}/jsx-dev-runtime';\n`;

          transformedCode = importStatement + transformedCode;
        }

        // Transform JSX elements to jsx() calls
        transformedCode = transformJSXToJSXRuntime(transformedCode);
      } else {
        // Classic JSX runtime - ensure React is imported
        if (!code.includes('import React')) {
          transformedCode = `import React from 'react';\n${transformedCode}`;
        }

        // Transform JSX to React.createElement
        transformedCode = transformJSXToCreateElement(transformedCode);
      }

      // Inject Fast Refresh runtime
      if (opts.fastRefresh && !isSSR && !id.includes('node_modules')) {
        transformedCode = injectFastRefresh(transformedCode, id);
      }

      // Apply Babel transformations if specified
      if (opts.babel && (opts.babel.plugins?.length || opts.babel.presets?.length)) {
        transformedCode = await applyBabelTransform(transformedCode, id, opts.babel);
      }

      return {
        code: transformedCode,
        map: null,
      };
    },

    transformIndexHtml(html: string) {
      // Inject Fast Refresh preamble
      if (opts.fastRefresh) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'module' },
              children: FAST_REFRESH_PREAMBLE,
              injectTo: 'head-prepend',
            },
          ],
        };
      }

      return html;
    },
  };
}

/**
 * Check if file should be transformed
 */
function shouldTransform(
  id: string,
  options: Required<ReactPluginOptions>,
): boolean {
  const normalizedId = normalizePath(id);

  // Check exclude
  if (matchPattern(normalizedId, options.exclude)) {
    return false;
  }

  // Check include
  return matchPattern(normalizedId, options.include);
}

/**
 * Match file path against pattern
 */
function matchPattern(
  path: string,
  pattern: string | RegExp | Array<string | RegExp>,
): boolean {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];

  for (const p of patterns) {
    if (typeof p === 'string') {
      if (path.includes(p)) return true;
    } else if (p instanceof RegExp) {
      if (p.test(path)) return true;
    }
  }

  return false;
}

/**
 * Transform JSX to JSX runtime
 */
function transformJSXToJSXRuntime(code: string): string {
  // Simplified JSX transformation for automatic runtime
  // In production, would use @babel/plugin-transform-react-jsx

  // Transform opening and closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?>(.*?)<\/\1>/gs,
    (match, tag, attrs, children) => {
      const hasChildren = children.trim().length > 0;
      const props = parseJSXProps(attrs);
      const propsStr = Object.keys(props).length > 0 ? JSON.stringify(props) : '{}';

      if (hasChildren) {
        return `_jsxs('${tag}', { ...${propsStr}, children: [${children}] })`;
      } else {
        return `_jsx('${tag}', ${propsStr})`;
      }
    },
  );

  // Transform self-closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?\/>/g,
    (match, tag, attrs) => {
      const props = parseJSXProps(attrs);
      const propsStr = Object.keys(props).length > 0 ? JSON.stringify(props) : '{}';
      return `_jsx('${tag}', ${propsStr})`;
    },
  );

  return code;
}

/**
 * Transform JSX to React.createElement
 */
function transformJSXToCreateElement(code: string): string {
  // Simplified JSX transformation for classic runtime
  // In production, would use @babel/plugin-transform-react-jsx

  // Transform opening and closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?>(.*?)<\/\1>/gs,
    (match, tag, attrs, children) => {
      const props = parseJSXProps(attrs);
      const propsStr = Object.keys(props).length > 0 ? JSON.stringify(props) : 'null';
      const childrenStr = children.trim() || 'null';

      return `React.createElement('${tag}', ${propsStr}, ${childrenStr})`;
    },
  );

  // Transform self-closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?\/>/g,
    (match, tag, attrs) => {
      const props = parseJSXProps(attrs);
      const propsStr = Object.keys(props).length > 0 ? JSON.stringify(props) : 'null';
      return `React.createElement('${tag}', ${propsStr})`;
    },
  );

  return code;
}

/**
 * Parse JSX props
 */
function parseJSXProps(attrs: string | undefined): Record<string, any> {
  if (!attrs) return {};

  const props: Record<string, any> = {};
  const attrRegex = /(\w+)=({[^}]+}|"[^"]*"|'[^']*')/g;

  let match;
  while ((match = attrRegex.exec(attrs)) !== null) {
    const [, key, value] = match;

    if (value.startsWith('{') && value.endsWith('}')) {
      // Expression
      props[key] = value.slice(1, -1);
    } else if (value.startsWith('"') || value.startsWith("'")) {
      // String literal
      props[key] = value.slice(1, -1);
    } else {
      props[key] = value;
    }
  }

  return props;
}

/**
 * Inject Fast Refresh runtime
 */
function injectFastRefresh(code: string, id: string): string {
  const refreshReg = `
const RefreshRuntime = window.$RefreshRuntime$;
const prevRefreshReg = window.$RefreshReg$;
const prevRefreshSig = window.$RefreshSig$;

let hasComponents = false;

if (RefreshRuntime) {
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = (type, id) => {
    hasComponents = true;
    RefreshRuntime.register(type, ${JSON.stringify(id)} + ' ' + id);
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
`.trim();

  const refreshCleanup = `
if (RefreshRuntime) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;

  if (hasComponents) {
    RefreshRuntime.performReactRefresh();
  }
}
`.trim();

  return `${refreshReg}\n\n${code}\n\n${refreshCleanup}`;
}

/**
 * Apply Babel transformation
 */
async function applyBabelTransform(
  code: string,
  id: string,
  babelOptions: any,
): Promise<string> {
  // In production, would use @babel/core to transform
  // For now, return code unchanged
  return code;
}

/**
 * Fast Refresh preamble script
 */
const FAST_REFRESH_PREAMBLE = `
if (import.meta.hot) {
  import RefreshRuntime from "/@react-refresh";

  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshRuntime$ = RefreshRuntime;
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
}
`.trim();
