/**
 * Webpack Clone - CSS Loader
 *
 * Interprets @import and url() like import/require() and resolves them.
 * Supports CSS modules, source maps, and custom import paths.
 */

export interface CSSLoaderOptions {
  /**
   * Enable/disable url() resolving
   */
  url?: boolean | ((url: string, resourcePath: string) => boolean);

  /**
   * Enable/disable @import resolving
   */
  import?: boolean | ((parsedImport: any, resourcePath: string) => boolean);

  /**
   * Enable CSS modules
   */
  modules?: boolean | CSSModulesOptions;

  /**
   * Enable source maps
   */
  sourceMap?: boolean;

  /**
   * Import loaders
   */
  importLoaders?: number;

  /**
   * Export type
   */
  esModule?: boolean;

  /**
   * Export only locals
   */
  exportOnlyLocals?: boolean;
}

export interface CSSModulesOptions {
  /**
   * Scope behaviour
   */
  mode?: 'local' | 'global' | 'pure';

  /**
   * Auto enable CSS modules
   */
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);

  /**
   * Export globals
   */
  exportGlobals?: boolean;

  /**
   * Locals convention
   */
  localIdentName?: string;

  /**
   * Context path
   */
  localIdentContext?: string;

  /**
   * Hash prefix
   */
  localIdentHashPrefix?: string;

  /**
   * Named export
   */
  namedExport?: boolean;

  /**
   * Export locals convention
   */
  exportLocalsConvention?: 'asIs' | 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';

  /**
   * Get local ident
   */
  getLocalIdent?: (
    context: any,
    localIdentName: string,
    localName: string,
    options: any,
  ) => string;
}

export async function cssLoader(
  source: string,
  options: CSSLoaderOptions = {},
): Promise<string> {
  // Default options
  const opts: CSSLoaderOptions = {
    url: options.url !== false,
    import: options.import !== false,
    modules: options.modules || false,
    sourceMap: options.sourceMap !== false,
    importLoaders: options.importLoaders || 0,
    esModule: options.esModule !== false,
    exportOnlyLocals: options.exportOnlyLocals || false,
  };

  let css = source;
  const imports: string[] = [];
  const exports: Record<string, string> = {};

  // Process @import statements
  if (opts.import) {
    css = await processImports(css, opts, imports);
  }

  // Process url() statements
  if (opts.url) {
    css = await processUrls(css, opts);
  }

  // Process CSS modules
  if (opts.modules) {
    const modulesOpts = typeof opts.modules === 'object' ? opts.modules : {};
    css = await processCSSModules(css, modulesOpts, exports);
  }

  // Generate output
  let output = '';

  // Add imports
  if (imports.length > 0) {
    output += imports.map(imp => `import ${imp};`).join('\n') + '\n\n';
  }

  // Export CSS
  if (opts.exportOnlyLocals) {
    // Export only class names (for SSR)
    output += `export default ${JSON.stringify(exports)};\n`;
  } else {
    if (opts.esModule) {
      output += `const css = ${JSON.stringify(css)};\n`;
      output += `const locals = ${JSON.stringify(exports)};\n`;
      output += `export { css, locals };\n`;
      output += `export default locals;\n`;
    } else {
      output += `module.exports = ${JSON.stringify(css)};\n`;
      output += `module.exports.locals = ${JSON.stringify(exports)};\n`;
    }
  }

  return output;
}

/**
 * Process @import statements
 */
async function processImports(
  css: string,
  options: CSSLoaderOptions,
  imports: string[],
): Promise<string> {
  const importRegex = /@import\s+(?:url\()?["']([^"']+)["']\)?[^;]*;/g;
  let match;

  while ((match = importRegex.exec(css)) !== null) {
    const url = match[1];

    // Check if import should be resolved
    if (shouldResolveImport(url, options)) {
      imports.push(`"${url}"`);
      // Remove @import from CSS
      css = css.replace(match[0], '');
    }
  }

  return css;
}

/**
 * Check if import should be resolved
 */
function shouldResolveImport(url: string, options: CSSLoaderOptions): boolean {
  // Don't resolve absolute URLs
  if (/^https?:\/\//.test(url)) {
    return false;
  }

  // Don't resolve data URLs
  if (url.startsWith('data:')) {
    return false;
  }

  // Check custom filter
  if (typeof options.import === 'function') {
    return options.import({ url }, '');
  }

  return true;
}

/**
 * Process url() statements
 */
async function processUrls(css: string, options: CSSLoaderOptions): Promise<string> {
  const urlRegex = /url\(\s*(?:["']([^"')]+)["']|([^)]+))\s*\)/g;
  let match;

  const replacements: Array<{ start: number; end: number; url: string }> = [];

  while ((match = urlRegex.exec(css)) !== null) {
    const url = match[1] || match[2];

    // Check if URL should be resolved
    if (shouldResolveUrl(url, options)) {
      const resolved = await resolveUrl(url);
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        url: `url("${resolved}")`,
      });
    }
  }

  // Apply replacements in reverse order
  replacements.reverse().forEach(({ start, end, url }) => {
    css = css.slice(0, start) + url + css.slice(end);
  });

  return css;
}

/**
 * Check if URL should be resolved
 */
function shouldResolveUrl(url: string, options: CSSLoaderOptions): boolean {
  // Don't resolve absolute URLs
  if (/^https?:\/\//.test(url)) {
    return false;
  }

  // Don't resolve data URLs
  if (url.startsWith('data:')) {
    return false;
  }

  // Don't resolve root-relative URLs
  if (url.startsWith('/')) {
    return false;
  }

  // Check custom filter
  if (typeof options.url === 'function') {
    return options.url(url, '');
  }

  return true;
}

/**
 * Resolve URL
 */
async function resolveUrl(url: string): Promise<string> {
  // Simplified URL resolution
  // In production, would resolve relative to context
  return url;
}

/**
 * Process CSS modules
 */
async function processCSSModules(
  css: string,
  options: CSSModulesOptions,
  exports: Record<string, string>,
): Promise<string> {
  const mode = options.mode || 'local';
  const localIdentName = options.localIdentName || '[hash:base64]';

  // Parse CSS rules
  const rules = parseRules(css);

  let processedCSS = '';

  for (const rule of rules) {
    const { selector, declarations } = rule;

    // Check if selector should be localized
    if (shouldLocalizeSelector(selector, mode)) {
      const localizedSelector = localizeSelector(selector, localIdentName, options);
      const originalName = extractClassName(selector);

      if (originalName) {
        const localName = extractClassName(localizedSelector);
        exports[originalName] = localName;
      }

      processedCSS += `${localizedSelector} { ${declarations} }\n`;
    } else {
      processedCSS += `${selector} { ${declarations} }\n`;
    }
  }

  return processedCSS;
}

/**
 * Parse CSS rules
 */
function parseRules(css: string): Array<{ selector: string; declarations: string }> {
  const rules: Array<{ selector: string; declarations: string }> = [];

  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Parse rules
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2].trim();

    rules.push({ selector, declarations });
  }

  return rules;
}

/**
 * Check if selector should be localized
 */
function shouldLocalizeSelector(selector: string, mode: string): boolean {
  if (mode === 'global') {
    return false;
  }

  if (mode === 'pure') {
    return !selector.startsWith(':global');
  }

  // Default 'local' mode
  return !selector.startsWith(':global');
}

/**
 * Localize selector
 */
function localizeSelector(
  selector: string,
  localIdentName: string,
  options: CSSModulesOptions,
): string {
  // Extract class names
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match;

  const replacements: Array<{ start: number; end: number; replacement: string }> = [];

  while ((match = classRegex.exec(selector)) !== null) {
    const className = match[1];
    const localName = generateLocalName(className, localIdentName, options);

    replacements.push({
      start: match.index,
      end: match.index + match[0].length,
      replacement: `.${localName}`,
    });
  }

  // Apply replacements in reverse order
  replacements.reverse().forEach(({ start, end, replacement }) => {
    selector = selector.slice(0, start) + replacement + selector.slice(end);
  });

  return selector;
}

/**
 * Extract class name from selector
 */
function extractClassName(selector: string): string | null {
  const match = selector.match(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/);
  return match ? match[1] : null;
}

/**
 * Generate local name
 */
function generateLocalName(
  originalName: string,
  template: string,
  options: CSSModulesOptions,
): string {
  // Use custom function if provided
  if (options.getLocalIdent) {
    return options.getLocalIdent({}, template, originalName, {});
  }

  // Generate hash
  const hash = generateHash(originalName + (options.localIdentHashPrefix || ''));

  // Replace template variables
  let localName = template;
  localName = localName.replace('[local]', originalName);
  localName = localName.replace('[hash]', hash);
  localName = localName.replace('[hash:base64]', hash);
  localName = localName.replace('[hash:base64:8]', hash.slice(0, 8));

  return localName;
}

/**
 * Generate hash
 */
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash;
  }

  // Convert to base64-like string
  const hashStr = Math.abs(hash).toString(36);
  return hashStr.slice(0, 8);
}

/**
 * Apply locals convention
 */
function applyLocalsConvention(
  locals: Record<string, string>,
  convention: string,
): Record<string, string> {
  const converted: Record<string, string> = {};

  for (const [key, value] of Object.entries(locals)) {
    let convertedKey = key;

    switch (convention) {
      case 'camelCase':
      case 'camelCaseOnly':
        convertedKey = camelCase(key);
        if (convention === 'camelCase') {
          converted[key] = value;
        }
        break;

      case 'dashes':
      case 'dashesOnly':
        convertedKey = dashCase(key);
        if (convention === 'dashes') {
          converted[key] = value;
        }
        break;

      default:
        // 'asIs'
        convertedKey = key;
    }

    converted[convertedKey] = value;
  }

  return converted;
}

/**
 * Convert to camelCase
 */
function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert to dash-case
 */
function dashCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export default cssLoader;
