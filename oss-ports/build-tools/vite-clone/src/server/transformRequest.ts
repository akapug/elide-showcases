/**
 * Vite Clone - Transform Request
 *
 * Handles transformation of source files including:
 * - TypeScript/JSX compilation
 * - Import resolution
 * - Source map generation
 * - Caching
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, extname } from 'path';
import type { ViteDevServer, TransformOptions, TransformResult } from './index';
import { cleanUrl, normalizePath } from '../core/config';
import { createHash } from 'crypto';

/**
 * Transform request and return transformed code
 */
export async function transformRequest(
  url: string,
  server: ViteDevServer,
  options: TransformOptions = {},
): Promise<TransformResult | null> {
  const { config, moduleGraph, pluginContainer } = server;

  // Clean URL
  const cleanedUrl = cleanUrl(url);

  // Check if it's a special URL
  if (cleanedUrl === '/@vite/client') {
    return {
      code: getViteClientCode(),
      etag: generateETag(getViteClientCode()),
    };
  }

  if (cleanedUrl.startsWith('/@id/')) {
    // Virtual module
    const id = cleanedUrl.slice(5);
    return await transformVirtualModule(id, server, options);
  }

  // Get or create module node
  const mod = await moduleGraph.ensureEntryFromUrl(cleanedUrl);

  // Check cache
  if (mod.transformResult && !options.ssr) {
    return mod.transformResult;
  }

  // Resolve ID
  const resolved = await pluginContainer.resolveId(cleanedUrl);
  const id = resolved?.id || cleanedUrl;

  // Normalize file path
  const filePath = id.startsWith('/') ? id : resolve(config.root, id.slice(1));

  // Check if file exists
  if (!existsSync(filePath)) {
    return null;
  }

  // Load file content
  let code: string;
  const loadResult = await pluginContainer.load(id, options);

  if (loadResult) {
    code = loadResult.code;
  } else {
    code = readFileSync(filePath, 'utf-8');
  }

  // Transform code
  const transformResult = await pluginContainer.transform(code, id, options);

  if (transformResult) {
    code = transformResult.code;
  }

  // Additional transformations
  code = await applyAdditionalTransformations(code, id, server);

  // Generate ETag
  const etag = generateETag(code);

  const result: TransformResult = {
    code,
    map: transformResult?.map,
    etag,
  };

  // Cache result
  if (!options.ssr) {
    mod.transformResult = result;
  } else {
    mod.ssrTransformResult = result;
  }

  return result;
}

/**
 * Transform virtual module
 */
async function transformVirtualModule(
  id: string,
  server: ViteDevServer,
  options: TransformOptions,
): Promise<TransformResult | null> {
  const { pluginContainer } = server;

  // Load virtual module
  const loadResult = await pluginContainer.load(id, options);

  if (!loadResult) {
    return null;
  }

  let code = loadResult.code;

  // Transform
  const transformResult = await pluginContainer.transform(code, id, options);

  if (transformResult) {
    code = transformResult.code;
  }

  return {
    code,
    map: transformResult?.map || loadResult.map,
    etag: generateETag(code),
  };
}

/**
 * Apply additional transformations
 */
async function applyAdditionalTransformations(
  code: string,
  id: string,
  server: ViteDevServer,
): Promise<string> {
  // Resolve imports
  code = await resolveImports(code, id, server);

  // Inject HMR runtime
  if (shouldInjectHMR(id)) {
    code = injectHMRRuntime(code, id);
  }

  // Transform JSX/TSX
  const ext = extname(id);
  if (['.jsx', '.tsx'].includes(ext)) {
    code = await transformJSX(code, id, server);
  }

  // Transform TypeScript
  if (['.ts', '.tsx'].includes(ext)) {
    code = await transformTypeScript(code, id, server);
  }

  // Transform CSS
  if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
    code = await transformCSS(code, id, server);
  }

  return code;
}

/**
 * Resolve imports in code
 */
async function resolveImports(
  code: string,
  id: string,
  server: ViteDevServer,
): Promise<string> {
  // Match import statements
  const importRegex = /\bimport\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match;
  const replacements: Array<{ start: number; end: number; replacement: string }> = [];

  // Static imports
  while ((match = importRegex.exec(code)) !== null) {
    const [fullMatch, importPath] = match;
    const resolved = await resolveImportPath(importPath, id, server);

    if (resolved && resolved !== importPath) {
      const startQuote = fullMatch.lastIndexOf(importPath);
      replacements.push({
        start: match.index + startQuote,
        end: match.index + startQuote + importPath.length,
        replacement: resolved,
      });
    }
  }

  // Dynamic imports
  while ((match = dynamicImportRegex.exec(code)) !== null) {
    const [fullMatch, importPath] = match;
    const resolved = await resolveImportPath(importPath, id, server);

    if (resolved && resolved !== importPath) {
      const startQuote = fullMatch.lastIndexOf(importPath);
      replacements.push({
        start: match.index + startQuote,
        end: match.index + startQuote + importPath.length,
        replacement: resolved,
      });
    }
  }

  // Apply replacements in reverse order to preserve indices
  replacements.sort((a, b) => b.start - a.start);

  for (const { start, end, replacement } of replacements) {
    code = code.slice(0, start) + replacement + code.slice(end);
  }

  return code;
}

/**
 * Resolve import path
 */
async function resolveImportPath(
  importPath: string,
  importer: string,
  server: ViteDevServer,
): Promise<string | null> {
  const { pluginContainer, config } = server;

  // External URLs don't need resolution
  if (/^https?:\/\//.test(importPath)) {
    return null;
  }

  // Resolve with plugin container
  const resolved = await pluginContainer.resolveId(importPath, importer);

  if (resolved) {
    // Make path relative to root for browser
    const relativePath = resolved.id.replace(config.root, '');
    return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
  }

  // Resolve node_modules
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return `/@id/${importPath}`;
  }

  return null;
}

/**
 * Check if HMR should be injected
 */
function shouldInjectHMR(id: string): boolean {
  const ext = extname(id);
  return ['.js', '.jsx', '.ts', '.tsx', '.vue'].includes(ext);
}

/**
 * Inject HMR runtime
 */
function injectHMRRuntime(code: string, id: string): string {
  // Add HMR accept call if not already present
  if (!code.includes('import.meta.hot')) {
    code += `\n\nif (import.meta.hot) {\n  import.meta.hot.accept();\n}\n`;
  }

  return code;
}

/**
 * Transform JSX
 */
async function transformJSX(
  code: string,
  id: string,
  server: ViteDevServer,
): Promise<string> {
  // Simplified JSX transformation
  // In production, would use @babel/plugin-transform-react-jsx or esbuild

  // Transform JSX syntax
  code = code.replace(
    /<(\w+)(\s+[^>]*)?>(.*?)<\/\1>/gs,
    (match, tag, attrs, children) => {
      const attrString = attrs ? parseJSXAttrs(attrs) : '';
      return `React.createElement('${tag}', ${attrString}, ${children})`;
    },
  );

  // Self-closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?\/>/g,
    (match, tag, attrs) => {
      const attrString = attrs ? parseJSXAttrs(attrs) : 'null';
      return `React.createElement('${tag}', ${attrString})`;
    },
  );

  return code;
}

/**
 * Parse JSX attributes
 */
function parseJSXAttrs(attrs: string): string {
  // Simplified attribute parsing
  const attrPairs = attrs.trim().match(/(\w+)=({[^}]+}|"[^"]*"|'[^']*')/g) || [];
  const attrObj = attrPairs
    .map((pair) => {
      const [key, value] = pair.split('=');
      return `${key}: ${value}`;
    })
    .join(', ');

  return `{${attrObj}}`;
}

/**
 * Transform TypeScript
 */
async function transformTypeScript(
  code: string,
  id: string,
  server: ViteDevServer,
): Promise<string> {
  // Simplified TypeScript transformation
  // In production, would use esbuild or @babel/preset-typescript

  // Remove type annotations
  code = code.replace(/:\s*\w+(\[\])?/g, '');
  code = code.replace(/as\s+\w+/g, '');
  code = code.replace(/interface\s+\w+\s*{[^}]*}/g, '');
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

  return code;
}

/**
 * Transform CSS
 */
async function transformCSS(
  code: string,
  id: string,
  server: ViteDevServer,
): Promise<string> {
  // Wrap CSS in JS module
  const cssCode = JSON.stringify(code);

  return `
const css = ${cssCode};
const style = document.createElement('style');
style.setAttribute('type', 'text/css');
style.innerHTML = css;
document.head.appendChild(style);

export default css;

// HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.prune(() => {
    style.remove();
  });
}
  `.trim();
}

/**
 * Generate ETag
 */
function generateETag(content: string): string {
  const hash = createHash('sha256');
  hash.update(content);
  return hash.digest('hex').slice(0, 8);
}

/**
 * Get Vite client code
 */
function getViteClientCode(): string {
  // This would be the actual HMR client code
  // For now, return a placeholder
  return `
console.log('[vite] client loaded');

// Import HMR runtime
import { hot } from '/@vite/hmr';

// Export for modules to use
export { hot };
  `.trim();
}
