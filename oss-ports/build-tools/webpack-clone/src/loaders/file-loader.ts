/**
 * Webpack Clone - File Loader
 *
 * Resolves import/require() on a file into a URL and emits the file into the output directory.
 * Supports file hashing, output paths, and public paths.
 */

import { createHash } from 'crypto';
import { basename, dirname, extname, join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

export interface FileLoaderOptions {
  /**
   * Output file name template
   * Supported placeholders:
   * - [name] - Base name of the file
   * - [ext] - Extension with leading dot
   * - [path] - Path relative to context
   * - [hash] - MD5 hash of content
   * - [hash:N] - First N chars of hash
   * - [contenthash] - MD5 hash of content
   * - [contenthash:N] - First N chars of content hash
   */
  name?: string | ((resourcePath: string, content: Buffer) => string);

  /**
   * Output directory relative to output path
   */
  outputPath?: string | ((url: string, resourcePath: string, context: string) => string);

  /**
   * Public path for the files
   */
  publicPath?: string | ((url: string, resourcePath: string, context: string) => string);

  /**
   * Context for the path
   */
  context?: string;

  /**
   * Emit file
   */
  emitFile?: boolean;

  /**
   * Regex to match the file name
   */
  regExp?: RegExp;

  /**
   * Use relative path
   */
  useRelativePath?: boolean;

  /**
   * ESModule export
   */
  esModule?: boolean;

  /**
   * Post transform function
   */
  postTransformPublicPath?: (p: string) => string;
}

export interface FileLoaderContext {
  resourcePath: string;
  context: string;
  rootContext: string;
  emitFile: (name: string, content: Buffer) => void;
  getOptions: () => any;
}

/**
 * File loader main function
 */
export async function fileLoader(
  this: FileLoaderContext,
  content: Buffer,
  options: FileLoaderOptions = {},
): Promise<string> {
  const opts: FileLoaderOptions = {
    name: options.name || '[contenthash].[ext]',
    context: options.context || this.context || this.rootContext || process.cwd(),
    emitFile: options.emitFile !== false,
    esModule: options.esModule !== false,
    ...options,
  };

  const resourcePath = this.resourcePath;
  const context = opts.context!;

  // Generate output file name
  const url = generateFileName(resourcePath, content, opts);

  // Resolve output path
  const outputPath = resolveOutputPath(url, resourcePath, context, opts);

  // Resolve public path
  const publicPath = resolvePublicPath(url, resourcePath, context, opts);

  // Apply post transform
  const finalPublicPath = opts.postTransformPublicPath
    ? opts.postTransformPublicPath(publicPath)
    : publicPath;

  // Emit file
  if (opts.emitFile && this.emitFile) {
    this.emitFile(outputPath, content);
  }

  // Generate output code
  return generateOutputCode(finalPublicPath, opts.esModule!);
}

/**
 * Generate file name from template
 */
function generateFileName(
  resourcePath: string,
  content: Buffer,
  options: FileLoaderOptions,
): string {
  const { name } = options;

  // Use custom function if provided
  if (typeof name === 'function') {
    return name(resourcePath, content);
  }

  // Parse template
  let fileName = name!;
  const ext = extname(resourcePath);
  const baseName = basename(resourcePath, ext);
  const dirName = dirname(resourcePath);

  // Replace [name]
  fileName = fileName.replace(/\[name\]/g, baseName);

  // Replace [ext]
  fileName = fileName.replace(/\[ext\]/g, ext.slice(1));

  // Replace [path]
  if (options.context) {
    const relativePath = dirName.replace(options.context, '').replace(/^\//, '');
    fileName = fileName.replace(/\[path\]/g, relativePath ? relativePath + '/' : '');
  }

  // Replace [hash] and [contenthash]
  const hash = generateContentHash(content);
  fileName = fileName.replace(/\[hash(?::(\d+))?\]/g, (match, length) => {
    return length ? hash.slice(0, parseInt(length, 10)) : hash;
  });
  fileName = fileName.replace(/\[contenthash(?::(\d+))?\]/g, (match, length) => {
    return length ? hash.slice(0, parseInt(length, 10)) : hash;
  });

  // Handle regexp matches
  if (options.regExp) {
    const match = resourcePath.match(options.regExp);
    if (match) {
      match.forEach((m, index) => {
        fileName = fileName.replace(new RegExp(`\\[${index}\\]`, 'g'), m || '');
      });
    }
  }

  return fileName;
}

/**
 * Generate content hash
 */
function generateContentHash(content: Buffer): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Resolve output path
 */
function resolveOutputPath(
  url: string,
  resourcePath: string,
  context: string,
  options: FileLoaderOptions,
): string {
  const { outputPath, useRelativePath } = options;

  // Use custom function if provided
  if (typeof outputPath === 'function') {
    return outputPath(url, resourcePath, context);
  }

  // Use relative path if specified
  if (useRelativePath) {
    const relativePath = dirname(resourcePath).replace(context, '').replace(/^\//, '');
    return relativePath ? join(relativePath, url) : url;
  }

  // Use output path option
  if (outputPath) {
    return join(outputPath, url);
  }

  return url;
}

/**
 * Resolve public path
 */
function resolvePublicPath(
  url: string,
  resourcePath: string,
  context: string,
  options: FileLoaderOptions,
): string {
  const { publicPath, useRelativePath } = options;

  // Use custom function if provided
  if (typeof publicPath === 'function') {
    return publicPath(url, resourcePath, context);
  }

  // Use relative path if specified
  if (useRelativePath) {
    const relativePath = dirname(resourcePath).replace(context, '').replace(/^\//, '');
    const fullPath = relativePath ? join(relativePath, url) : url;
    return fullPath.replace(/\\/g, '/');
  }

  // Use public path option
  if (publicPath) {
    const separator = publicPath.endsWith('/') ? '' : '/';
    return `${publicPath}${separator}${url}`;
  }

  return url;
}

/**
 * Generate output code
 */
function generateOutputCode(publicPath: string, esModule: boolean): string {
  if (esModule) {
    return `export default ${JSON.stringify(publicPath)};`;
  } else {
    return `module.exports = ${JSON.stringify(publicPath)};`;
  }
}

/**
 * Process file and emit
 */
export async function processFile(
  filePath: string,
  outputDir: string,
  options: FileLoaderOptions = {},
): Promise<string> {
  // Read file
  const content = await readFile(filePath);

  // Generate file name
  const url = generateFileName(filePath, content, options);

  // Resolve output path
  const outputPath = resolveOutputPath(
    url,
    filePath,
    options.context || dirname(filePath),
    options,
  );

  // Write file
  const fullOutputPath = join(outputDir, outputPath);
  await mkdir(dirname(fullOutputPath), { recursive: true });
  await writeFile(fullOutputPath, content);

  // Resolve public path
  const publicPath = resolvePublicPath(
    url,
    filePath,
    options.context || dirname(filePath),
    options,
  );

  return publicPath;
}

/**
 * Get loader options from webpack config
 */
export function getLoaderOptions(loaderContext: any): FileLoaderOptions {
  return loaderContext.getOptions ? loaderContext.getOptions() : {};
}

/**
 * Validate options
 */
export function validateOptions(options: FileLoaderOptions): void {
  if (options.name !== undefined) {
    if (typeof options.name !== 'string' && typeof options.name !== 'function') {
      throw new TypeError('options.name must be a string or function');
    }
  }

  if (options.outputPath !== undefined) {
    if (typeof options.outputPath !== 'string' && typeof options.outputPath !== 'function') {
      throw new TypeError('options.outputPath must be a string or function');
    }
  }

  if (options.publicPath !== undefined) {
    if (typeof options.publicPath !== 'string' && typeof options.publicPath !== 'function') {
      throw new TypeError('options.publicPath must be a string or function');
    }
  }

  if (options.context !== undefined && typeof options.context !== 'string') {
    throw new TypeError('options.context must be a string');
  }

  if (options.emitFile !== undefined && typeof options.emitFile !== 'boolean') {
    throw new TypeError('options.emitFile must be a boolean');
  }

  if (options.regExp !== undefined && !(options.regExp instanceof RegExp)) {
    throw new TypeError('options.regExp must be a RegExp');
  }

  if (options.useRelativePath !== undefined && typeof options.useRelativePath !== 'boolean') {
    throw new TypeError('options.useRelativePath must be a boolean');
  }

  if (options.esModule !== undefined && typeof options.esModule !== 'boolean') {
    throw new TypeError('options.esModule must be a boolean');
  }

  if (
    options.postTransformPublicPath !== undefined &&
    typeof options.postTransformPublicPath !== 'function'
  ) {
    throw new TypeError('options.postTransformPublicPath must be a function');
  }
}

/**
 * Normalize path
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Interpolate name with custom variables
 */
export function interpolateName(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

export default fileLoader;
