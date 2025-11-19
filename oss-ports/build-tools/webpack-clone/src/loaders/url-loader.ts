/**
 * Webpack Clone - URL Loader
 *
 * Transforms files into base64 URIs. Falls back to file-loader for large files.
 * Useful for small images, fonts, and other assets to reduce HTTP requests.
 */

import { createHash } from 'crypto';
import { extname, basename } from 'path';
import { fileLoader, FileLoaderOptions } from './file-loader';

export interface URLLoaderOptions extends FileLoaderOptions {
  /**
   * Size limit in bytes. Files larger than this will use file-loader.
   * Default: 8192 (8kb)
   */
  limit?: number | string | boolean;

  /**
   * MIME type for the file. If not specified, will be inferred from extension.
   */
  mimetype?: string | boolean;

  /**
   * Encoding for the data URL
   * Default: 'base64'
   */
  encoding?: 'base64' | 'utf8' | boolean;

  /**
   * Fallback loader when file size exceeds limit
   * Default: 'file-loader'
   */
  fallback?: string;

  /**
   * Generator function for custom data URL format
   */
  generator?: (content: Buffer, mimetype: string, encoding: string) => string;
}

export interface URLLoaderContext {
  resourcePath: string;
  context: string;
  rootContext: string;
  emitFile: (name: string, content: Buffer) => void;
  getOptions: () => any;
}

/**
 * MIME type mappings
 */
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
};

/**
 * URL loader main function
 */
export async function urlLoader(
  this: URLLoaderContext,
  content: Buffer,
  options: URLLoaderOptions = {},
): Promise<string> {
  // Validate and normalize options
  const opts = normalizeOptions(options);

  // Check if should use data URL
  if (shouldUseDataURL(content, opts)) {
    return generateDataURL(content, this.resourcePath, opts);
  }

  // Fallback to file-loader
  return fileLoader.call(this, content, opts);
}

/**
 * Normalize options
 */
function normalizeOptions(options: URLLoaderOptions): Required<URLLoaderOptions> {
  return {
    limit: normalizeLimit(options.limit),
    mimetype: options.mimetype !== false ? (options.mimetype || '') : '',
    encoding: options.encoding !== false ? (options.encoding || 'base64') : 'base64',
    fallback: options.fallback || 'file-loader',
    generator: options.generator || defaultGenerator,
    name: options.name || '[contenthash].[ext]',
    outputPath: options.outputPath || '',
    publicPath: options.publicPath || '',
    context: options.context || '',
    emitFile: options.emitFile !== false,
    regExp: options.regExp,
    useRelativePath: options.useRelativePath || false,
    esModule: options.esModule !== false,
    postTransformPublicPath: options.postTransformPublicPath,
  } as Required<URLLoaderOptions>;
}

/**
 * Normalize limit option
 */
function normalizeLimit(limit: number | string | boolean | undefined): number {
  if (limit === false || limit === 0) {
    return 0;
  }

  if (limit === true || limit === undefined) {
    return 8192; // Default 8kb
  }

  if (typeof limit === 'string') {
    return parseInt(limit, 10);
  }

  return limit;
}

/**
 * Check if should use data URL
 */
function shouldUseDataURL(content: Buffer, options: Required<URLLoaderOptions>): boolean {
  const { limit } = options;

  // If limit is 0 or false, always use file-loader
  if (limit === 0) {
    return false;
  }

  // If limit is true, always use data URL
  if (limit === true) {
    return true;
  }

  // Check file size
  return content.length <= limit;
}

/**
 * Generate data URL
 */
function generateDataURL(
  content: Buffer,
  resourcePath: string,
  options: Required<URLLoaderOptions>,
): string {
  const { mimetype, encoding, generator, esModule } = options;

  // Get MIME type
  const mime = getMimeType(resourcePath, mimetype);

  // Get encoding
  const enc = encoding === true ? 'base64' : encoding;

  // Generate data URL
  const dataURL = generator(content, mime, enc);

  // Generate output code
  return generateOutputCode(dataURL, esModule);
}

/**
 * Default generator function
 */
function defaultGenerator(content: Buffer, mimetype: string, encoding: string): string {
  if (encoding === 'base64') {
    const base64 = content.toString('base64');
    return `data:${mimetype};base64,${base64}`;
  }

  if (encoding === 'utf8') {
    const utf8 = content.toString('utf8');
    const encoded = encodeURIComponent(utf8);
    return `data:${mimetype};charset=utf-8,${encoded}`;
  }

  throw new Error(`Unsupported encoding: ${encoding}`);
}

/**
 * Get MIME type
 */
function getMimeType(resourcePath: string, mimetype: string | boolean): string {
  // Use provided MIME type
  if (typeof mimetype === 'string' && mimetype) {
    return mimetype;
  }

  // Infer from extension
  const ext = extname(resourcePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Generate output code
 */
function generateOutputCode(dataURL: string, esModule: boolean): string {
  if (esModule) {
    return `export default ${JSON.stringify(dataURL)};`;
  } else {
    return `module.exports = ${JSON.stringify(dataURL)};`;
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(content: Buffer): number {
  return content.length;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Check if file should be inlined based on type
 */
export function shouldInlineByType(resourcePath: string, inlineTypes: string[]): boolean {
  const ext = extname(resourcePath).toLowerCase();
  return inlineTypes.some(type => ext === type || ext === `.${type}`);
}

/**
 * Optimize SVG content before encoding
 */
export function optimizeSVG(content: Buffer): Buffer {
  let svg = content.toString('utf8');

  // Remove XML declaration
  svg = svg.replace(/<\?xml[^?]*\?>/g, '');

  // Remove comments
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');

  // Minify whitespace
  svg = svg.replace(/\s+/g, ' ');
  svg = svg.replace(/>\s+</g, '><');

  // Remove unnecessary attributes
  svg = svg.replace(/\s+xmlns:xlink="[^"]*"/g, '');

  return Buffer.from(svg.trim(), 'utf8');
}

/**
 * Convert SVG to data URL with optimizations
 */
export function svgToDataURL(content: Buffer, options: URLLoaderOptions = {}): string {
  // Optimize SVG
  const optimized = optimizeSVG(content);

  // Use UTF-8 encoding for SVG (more efficient than base64)
  const mimetype = 'image/svg+xml';
  const encoding = 'utf8';

  const svg = optimized.toString('utf8');
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:${mimetype};charset=utf-8,${encoded}`;
}

/**
 * Validate options
 */
export function validateOptions(options: URLLoaderOptions): void {
  if (options.limit !== undefined) {
    const validTypes = ['number', 'string', 'boolean'];
    if (!validTypes.includes(typeof options.limit)) {
      throw new TypeError('options.limit must be a number, string, or boolean');
    }
  }

  if (options.mimetype !== undefined) {
    const validTypes = ['string', 'boolean'];
    if (!validTypes.includes(typeof options.mimetype)) {
      throw new TypeError('options.mimetype must be a string or boolean');
    }
  }

  if (options.encoding !== undefined) {
    if (typeof options.encoding === 'string') {
      const validEncodings = ['base64', 'utf8'];
      if (!validEncodings.includes(options.encoding)) {
        throw new Error(`Invalid encoding: ${options.encoding}`);
      }
    } else if (typeof options.encoding !== 'boolean') {
      throw new TypeError('options.encoding must be a string or boolean');
    }
  }

  if (options.fallback !== undefined && typeof options.fallback !== 'string') {
    throw new TypeError('options.fallback must be a string');
  }

  if (options.generator !== undefined && typeof options.generator !== 'function') {
    throw new TypeError('options.generator must be a function');
  }
}

/**
 * Calculate optimal encoding
 */
export function calculateOptimalEncoding(
  content: Buffer,
  resourcePath: string,
): 'base64' | 'utf8' {
  const ext = extname(resourcePath).toLowerCase();

  // SVG is more efficient with UTF-8
  if (ext === '.svg') {
    return 'utf8';
  }

  // Text files can use UTF-8
  const textExtensions = ['.txt', '.html', '.css', '.js', '.json', '.xml'];
  if (textExtensions.includes(ext)) {
    return 'utf8';
  }

  // Binary files should use base64
  return 'base64';
}

/**
 * Create custom generator with prefix
 */
export function createPrefixedGenerator(prefix: string) {
  return (content: Buffer, mimetype: string, encoding: string): string => {
    const dataURL = defaultGenerator(content, mimetype, encoding);
    return `${prefix}${dataURL}`;
  };
}

/**
 * Create custom generator with suffix
 */
export function createSuffixedGenerator(suffix: string) {
  return (content: Buffer, mimetype: string, encoding: string): string => {
    const dataURL = defaultGenerator(content, mimetype, encoding);
    return `${dataURL}${suffix}`;
  };
}

/**
 * Estimate data URL size increase
 */
export function estimateDataURLSize(fileSize: number, encoding: 'base64' | 'utf8'): number {
  if (encoding === 'base64') {
    // Base64 encoding increases size by ~33%
    return Math.ceil(fileSize * 1.33);
  }

  // UTF-8 encoding with URL encoding can increase size by ~3x in worst case
  // but typically only ~10-20% for text content
  return Math.ceil(fileSize * 1.2);
}

/**
 * Get recommended limit based on file type
 */
export function getRecommendedLimit(resourcePath: string): number {
  const ext = extname(resourcePath).toLowerCase();

  // Smaller limits for images (4kb)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  if (imageExtensions.includes(ext)) {
    return 4096;
  }

  // Larger limits for fonts (10kb)
  const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
  if (fontExtensions.includes(ext)) {
    return 10240;
  }

  // SVG can be larger (8kb)
  if (ext === '.svg') {
    return 8192;
  }

  // Default limit (8kb)
  return 8192;
}

export default urlLoader;
