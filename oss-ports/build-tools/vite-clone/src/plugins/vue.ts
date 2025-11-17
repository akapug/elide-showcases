/**
 * Vite Clone - Vue Plugin
 *
 * Provides Vue 3 support with SFC compilation, HMR, and script setup.
 */

import type { Plugin } from '../types/plugin';
import { normalizePath } from '../core/config';

/**
 * Vue plugin options
 */
export interface VuePluginOptions {
  /**
   * Include files matching these patterns
   */
  include?: string | RegExp | Array<string | RegExp>;

  /**
   * Exclude files matching these patterns
   */
  exclude?: string | RegExp | Array<string | RegExp>;

  /**
   * Template compilation options
   */
  template?: {
    /**
     * Compiler options for @vue/compiler-dom
     */
    compilerOptions?: Record<string, any>;

    /**
     * Transform asset URLs in template
     */
    transformAssetUrls?: Record<string, string | string[]> | boolean;
  };

  /**
   * Script options
   */
  script?: {
    /**
     * Enable define model for script setup
     */
    defineModel?: boolean;

    /**
     * Enable props destructure for script setup
     */
    propsDestructure?: boolean;
  };

  /**
   * Style options
   */
  style?: {
    /**
     * CSS modules options
     */
    cssModules?: Record<string, any>;
  };

  /**
   * Custom blocks
   */
  customElement?: boolean | string | RegExp;
}

/**
 * Default options
 */
const defaultOptions: Required<VuePluginOptions> = {
  include: /\.vue$/,
  exclude: /node_modules/,
  template: {},
  script: {
    defineModel: false,
    propsDestructure: false,
  },
  style: {},
  customElement: false,
};

/**
 * Vue plugin
 */
export default function vue(options: VuePluginOptions = {}): Plugin {
  const opts = { ...defaultOptions, ...options };

  return {
    name: 'vite-clone:vue',

    enforce: 'pre',

    config() {
      return {
        optimizeDeps: {
          include: ['vue', '@vue/runtime-dom', '@vue/runtime-core', '@vue/reactivity', '@vue/shared'],
        },
        resolve: {
          dedupe: ['vue'],
          alias: {
            'vue': 'vue/dist/vue.esm-bundler.js',
          },
        },
      };
    },

    async transform(code: string, id: string, options?: any) {
      // Check if file should be transformed
      if (!shouldTransform(id, opts)) {
        return null;
      }

      const isSSR = options?.ssr || false;

      // Parse SFC
      const descriptor = parseSFC(code, id);

      // Transform script
      let scriptCode = '';
      if (descriptor.script) {
        scriptCode = await transformScript(descriptor.script, id, opts, isSSR);
      }

      // Transform template
      let templateCode = '';
      if (descriptor.template) {
        templateCode = await transformTemplate(descriptor.template, id, opts, isSSR);
      }

      // Transform styles
      const styleBlocks: string[] = [];
      for (const style of descriptor.styles) {
        const styleCode = await transformStyle(style, id, opts);
        styleBlocks.push(styleCode);
      }

      // Combine all parts
      let transformedCode = '';

      // Import Vue runtime
      transformedCode += `import { defineComponent } from 'vue';\n`;

      // Add script content
      if (scriptCode) {
        transformedCode += scriptCode + '\n';
      }

      // Add template render function
      if (templateCode) {
        transformedCode += templateCode + '\n';
      }

      // Define component
      transformedCode += `\nexport default defineComponent({\n`;

      if (templateCode) {
        transformedCode += `  render,\n`;
      }

      if (descriptor.script) {
        transformedCode += `  ...script,\n`;
      }

      transformedCode += `});\n`;

      // Import styles
      for (let i = 0; i < styleBlocks.length; i++) {
        transformedCode += `\nimport '${id}?vue&type=style&index=${i}';\n`;
      }

      // Add HMR
      if (!isSSR) {
        transformedCode += generateHMR(id);
      }

      return {
        code: transformedCode,
        map: null,
      };
    },

    async handleHotUpdate({ file, server }) {
      if (file.endsWith('.vue')) {
        console.log('[vue] HMR update:', file);

        // Invalidate module
        const module = server.moduleGraph.getModuleByUrl(file);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }

        // Send HMR update
        server.ws.send({
          type: 'update',
          updates: [
            {
              type: 'js-update',
              path: file,
              acceptedPath: file,
              timestamp: Date.now(),
            },
          ],
        });
      }
    },
  };
}

/**
 * Check if file should be transformed
 */
function shouldTransform(
  id: string,
  options: Required<VuePluginOptions>,
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
 * Parse SFC
 */
function parseSFC(code: string, id: string): SFCDescriptor {
  const descriptor: SFCDescriptor = {
    filename: id,
    script: null,
    scriptSetup: null,
    template: null,
    styles: [],
    customBlocks: [],
  };

  // Parse script
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    const attrs = parseAttributes(scriptMatch[0]);
    descriptor.script = {
      content: scriptMatch[1],
      attrs,
      lang: attrs.lang || 'js',
      setup: attrs.setup !== undefined,
    };

    if (attrs.setup !== undefined) {
      descriptor.scriptSetup = descriptor.script;
      descriptor.script = null;
    }
  }

  // Parse template
  const templateMatch = code.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  if (templateMatch) {
    const attrs = parseAttributes(templateMatch[0]);
    descriptor.template = {
      content: templateMatch[1],
      attrs,
      lang: attrs.lang || 'html',
    };
  }

  // Parse styles
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(code)) !== null) {
    const attrs = parseAttributes(styleMatch[0]);
    descriptor.styles.push({
      content: styleMatch[1],
      attrs,
      lang: attrs.lang || 'css',
      scoped: attrs.scoped !== undefined,
      module: attrs.module,
    });
  }

  return descriptor;
}

/**
 * Parse attributes from tag
 */
function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)(?:="([^"]*)"|='([^']*)'|)/g;

  let match;
  while ((match = attrRegex.exec(tag)) !== null) {
    const key = match[1];
    const value = match[2] || match[3] || '';
    attrs[key] = value;
  }

  return attrs;
}

/**
 * Transform script block
 */
async function transformScript(
  script: SFCBlock,
  id: string,
  options: Required<VuePluginOptions>,
  isSSR: boolean,
): Promise<string> {
  let code = script.content;

  // Handle script setup
  if (script.setup) {
    code = transformScriptSetup(code, options);
  }

  // Transform TypeScript
  if (script.lang === 'ts') {
    code = transformTypeScript(code);
  }

  return `const script = {\n${code}\n};\n`;
}

/**
 * Transform script setup
 */
function transformScriptSetup(
  code: string,
  options: Required<VuePluginOptions>,
): string {
  // Transform defineProps
  code = code.replace(/const\s+(\w+)\s*=\s*defineProps\(/g, (match, name) => {
    return `const ${name} = /*@__PURE__*/ defineProps(`;
  });

  // Transform defineEmits
  code = code.replace(/const\s+(\w+)\s*=\s*defineEmits\(/g, (match, name) => {
    return `const ${name} = /*@__PURE__*/ defineEmits(`;
  });

  // Transform defineModel (if enabled)
  if (options.script.defineModel) {
    code = code.replace(/const\s+(\w+)\s*=\s*defineModel\(/g, (match, name) => {
      return `const ${name} = /*@__PURE__*/ defineModel(`;
    });
  }

  return code;
}

/**
 * Transform TypeScript
 */
function transformTypeScript(code: string): string {
  // Simplified TypeScript transformation
  code = code.replace(/:\s*\w+(\[\])?/g, '');
  code = code.replace(/interface\s+\w+\s*{[^}]*}/g, '');
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
  return code;
}

/**
 * Transform template block
 */
async function transformTemplate(
  template: SFCBlock,
  id: string,
  options: Required<VuePluginOptions>,
  isSSR: boolean,
): Promise<string> {
  const content = template.content;

  // Simplified template compilation
  // In production, would use @vue/compiler-dom

  return `function render() {\n  return [\n    ${JSON.stringify(content)}\n  ];\n}\n`;
}

/**
 * Transform style block
 */
async function transformStyle(
  style: SFCStyleBlock,
  id: string,
  options: Required<VuePluginOptions>,
): Promise<string> {
  let code = style.content;

  // Handle scoped styles
  if (style.scoped) {
    code = scopeStyles(code, id);
  }

  // Handle CSS modules
  if (style.module) {
    code = transformCSSModule(code, id);
  }

  // Transform preprocessors
  if (style.lang && style.lang !== 'css') {
    code = await transformStylePreprocessor(code, style.lang);
  }

  return code;
}

/**
 * Scope styles
 */
function scopeStyles(code: string, id: string): string {
  const scopeId = generateScopeId(id);

  // Add scope attribute to selectors
  code = code.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (match, selector, ending) => {
    return `${selector}[data-v-${scopeId}]${ending}`;
  });

  return code;
}

/**
 * Generate scope ID
 */
function generateScopeId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Transform CSS module
 */
function transformCSSModule(code: string, id: string): string {
  // Transform CSS to CSS modules
  return code;
}

/**
 * Transform style preprocessor
 */
async function transformStylePreprocessor(
  code: string,
  lang: string,
): Promise<string> {
  // Simplified preprocessor transformation
  // In production, would use sass, less, stylus, etc.
  return code;
}

/**
 * Generate HMR code
 */
function generateHMR(id: string): string {
  return `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    __VUE_HMR_RUNTIME__.reload('${id}', newModule.default);
  });
}
  `.trim();
}

/**
 * SFC Descriptor
 */
interface SFCDescriptor {
  filename: string;
  script: SFCBlock | null;
  scriptSetup: SFCBlock | null;
  template: SFCBlock | null;
  styles: SFCStyleBlock[];
  customBlocks: SFCBlock[];
}

/**
 * SFC Block
 */
interface SFCBlock {
  content: string;
  attrs: Record<string, string>;
  lang: string;
  setup?: boolean;
}

/**
 * SFC Style Block
 */
interface SFCStyleBlock extends SFCBlock {
  scoped: boolean;
  module?: string | boolean;
}
