/**
 * Code Minifier
 *
 * Minifies code to reduce size
 * Supports JavaScript, CSS, HTML
 */

import { logger } from '../utils/logger';

export class Minifier {
  /**
   * Minify code based on language
   */
  async minify(code: string, language: string): Promise<string> {
    logger.info(`Minifying ${language} code`);

    const lang = language.toLowerCase();

    if (lang === 'javascript' || lang === 'typescript' || lang === 'jsx' || lang === 'tsx') {
      return this.minifyJavaScript(code);
    } else if (lang === 'css') {
      return this.minifyCSS(code);
    } else if (lang === 'html') {
      return this.minifyHTML(code);
    }

    // Return as-is for unsupported languages
    return code;
  }

  /**
   * Minify JavaScript/TypeScript
   */
  private minifyJavaScript(code: string): string {
    let minified = code;

    // Remove comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
    minified = minified.replace(/\/\/.*/g, ''); // Single-line comments

    // Remove extra whitespace
    minified = minified.replace(/\s+/g, ' ');

    // Remove whitespace around operators and punctuation
    minified = minified.replace(/\s*([{}();:,=<>+\-*/%!&|])\s*/g, '$1');

    // Remove empty lines
    minified = minified.replace(/\n+/g, '\n');

    return minified.trim();
  }

  /**
   * Minify CSS
   */
  private minifyCSS(code: string): string {
    let minified = code;

    // Remove comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove extra whitespace
    minified = minified.replace(/\s+/g, ' ');

    // Remove whitespace around special characters
    minified = minified.replace(/\s*([{}:;,>+~])\s*/g, '$1');

    // Remove last semicolon in blocks
    minified = minified.replace(/;}/g, '}');

    return minified.trim();
  }

  /**
   * Minify HTML
   */
  private minifyHTML(code: string): string {
    let minified = code;

    // Remove comments
    minified = minified.replace(/<!--[\s\S]*?-->/g, '');

    // Remove extra whitespace between tags
    minified = minified.replace(/>\s+</g, '><');

    // Remove extra whitespace
    minified = minified.replace(/\s+/g, ' ');

    return minified.trim();
  }
}
