/**
 * Elide Code Formatter
 * Prettier-compatible code formatter
 */

export interface FormatterConfig {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  quoteProps?: 'as-needed' | 'consistent' | 'preserve';
  trailingComma?: 'none' | 'es5' | 'all';
  bracketSpacing?: boolean;
  arrowParens?: 'avoid' | 'always';
  endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';
  insertPragma?: boolean;
  requirePragma?: boolean;
}

export interface FormatResult {
  formatted: string;
  changed: boolean;
}

/**
 * Code Formatter for Elide
 */
export class ElideFormatter {
  private config: Required<FormatterConfig>;

  constructor(config: FormatterConfig = {}) {
    this.config = {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      quoteProps: 'as-needed',
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'lf',
      insertPragma: false,
      requirePragma: false,
      ...config
    };
  }

  /**
   * Format source code
   */
  format(source: string, filePath?: string): FormatResult {
    const language = this.detectLanguage(filePath);

    let formatted: string;
    switch (language) {
      case 'typescript':
      case 'javascript':
        formatted = this.formatJavaScript(source);
        break;
      case 'json':
        formatted = this.formatJSON(source);
        break;
      case 'html':
        formatted = this.formatHTML(source);
        break;
      case 'css':
        formatted = this.formatCSS(source);
        break;
      case 'markdown':
        formatted = this.formatMarkdown(source);
        break;
      default:
        formatted = source;
    }

    return {
      formatted,
      changed: formatted !== source
    };
  }

  /**
   * Detect language from file path
   */
  private detectLanguage(filePath?: string): string {
    if (!filePath) return 'javascript';

    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
      case 'scss':
      case 'less':
        return 'css';
      case 'md':
        return 'markdown';
      default:
        return 'javascript';
    }
  }

  /**
   * Format JavaScript/TypeScript code
   */
  private formatJavaScript(source: string): string {
    // In production, this would use a proper parser and printer
    // For now, implement basic formatting

    let formatted = source;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Apply semicolons
    if (this.config.semi) {
      formatted = this.addSemicolons(formatted);
    } else {
      formatted = this.removeSemicolons(formatted);
    }

    // Apply quotes
    if (this.config.singleQuote) {
      formatted = this.convertToSingleQuotes(formatted);
    } else {
      formatted = this.convertToDoubleQuotes(formatted);
    }

    // Apply indentation
    formatted = this.applyIndentation(formatted);

    // Apply trailing commas
    formatted = this.applyTrailingCommas(formatted);

    // Apply bracket spacing
    if (this.config.bracketSpacing) {
      formatted = formatted.replace(/\{([^\s])/g, '{ $1');
      formatted = formatted.replace(/([^\s])\}/g, '$1 }');
    } else {
      formatted = formatted.replace(/\{\s+/g, '{');
      formatted = formatted.replace(/\s+\}/g, '}');
    }

    // Wrap long lines
    formatted = this.wrapLongLines(formatted);

    return formatted;
  }

  /**
   * Format JSON
   */
  private formatJSON(source: string): string {
    try {
      const obj = JSON.parse(source);
      const indent = this.config.useTabs ? '\t' : ' '.repeat(this.config.tabWidth);
      return JSON.stringify(obj, null, indent);
    } catch {
      return source;
    }
  }

  /**
   * Format HTML
   */
  private formatHTML(source: string): string {
    // Basic HTML formatting
    let formatted = source;
    let indent = 0;
    const lines: string[] = [];

    const tokens = formatted.split(/(<[^>]+>)/g).filter(Boolean);

    for (const token of tokens) {
      if (token.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }

      if (token.trim()) {
        const indentStr = this.getIndentString(indent);
        lines.push(indentStr + token.trim());
      }

      if (token.startsWith('<') && !token.startsWith('</') && !token.endsWith('/>')) {
        indent++;
      }
    }

    return lines.join('\n');
  }

  /**
   * Format CSS
   */
  private formatCSS(source: string): string {
    // Basic CSS formatting
    let formatted = source;

    // Add spaces after colons
    formatted = formatted.replace(/:\s*/g, ': ');

    // Add semicolons
    if (this.config.semi) {
      formatted = formatted.replace(/([^;{}])\s*\n/g, '$1;\n');
    }

    // Format braces
    if (this.config.bracketSpacing) {
      formatted = formatted.replace(/\{/g, ' {');
      formatted = formatted.replace(/\}/g, ' }');
    }

    return formatted;
  }

  /**
   * Format Markdown
   */
  private formatMarkdown(source: string): string {
    // Basic Markdown formatting
    let formatted = source;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Ensure consistent spacing around headers
    formatted = formatted.replace(/^(#{1,6})\s+/gm, '$1 ');

    // Ensure blank lines around code blocks
    formatted = formatted.replace(/```/g, '\n```\n');

    return formatted.trim();
  }

  /**
   * Add semicolons
   */
  private addSemicolons(source: string): string {
    return source.replace(/([^;{}\s])\s*\n/g, '$1;\n');
  }

  /**
   * Remove semicolons
   */
  private removeSemicolons(source: string): string {
    return source.replace(/;\s*\n/g, '\n');
  }

  /**
   * Convert to single quotes
   */
  private convertToSingleQuotes(source: string): string {
    return source.replace(/"([^"]*)"/g, "'$1'");
  }

  /**
   * Convert to double quotes
   */
  private convertToDoubleQuotes(source: string): string {
    return source.replace(/'([^']*)'/g, '"$1"');
  }

  /**
   * Apply indentation
   */
  private applyIndentation(source: string): string {
    const lines = source.split('\n');
    let indent = 0;
    const formatted: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        formatted.push('');
        continue;
      }

      // Decrease indent for closing braces
      if (line.startsWith('}') || line.startsWith(']')) {
        indent = Math.max(0, indent - 1);
      }

      // Add indentation
      const indentStr = this.getIndentString(indent);
      formatted.push(indentStr + line);

      // Increase indent for opening braces
      if (line.endsWith('{') || line.endsWith('[')) {
        indent++;
      }
    }

    return formatted.join('\n');
  }

  /**
   * Apply trailing commas
   */
  private applyTrailingCommas(source: string): string {
    if (this.config.trailingComma === 'none') {
      return source.replace(/,\s*([}\]])/g, '$1');
    }

    if (this.config.trailingComma === 'all') {
      // Add trailing commas where missing
      return source.replace(/([^,\s])(\s*[}\]])/g, '$1,$2');
    }

    // ES5: trailing commas in objects and arrays, but not in function parameters
    return source;
  }

  /**
   * Wrap long lines
   */
  private wrapLongLines(source: string): string {
    const lines = source.split('\n');
    const wrapped: string[] = [];

    for (const line of lines) {
      if (line.length <= this.config.printWidth) {
        wrapped.push(line);
      } else {
        // Try to break at operators or commas
        const breakPoints = [' && ', ' || ', ', ', ' + ', ' - '];
        let remaining = line;
        let broken = false;

        for (const breakPoint of breakPoints) {
          if (remaining.includes(breakPoint)) {
            const parts = remaining.split(breakPoint);
            wrapped.push(parts[0] + breakPoint);
            remaining = this.getIndentString(1) + parts.slice(1).join(breakPoint);
            broken = true;
            break;
          }
        }

        if (!broken) {
          wrapped.push(line);
        } else {
          wrapped.push(remaining);
        }
      }
    }

    return wrapped.join('\n');
  }

  /**
   * Get indent string
   */
  private getIndentString(level: number): string {
    if (this.config.useTabs) {
      return '\t'.repeat(level);
    }
    return ' '.repeat(level * this.config.tabWidth);
  }

  /**
   * Check if file should be formatted
   */
  shouldFormat(filePath: string): boolean {
    // Check for pragma if required
    if (this.config.requirePragma) {
      // Would check file contents for @format pragma
      return true;
    }

    return true;
  }

  /**
   * Get configuration
   */
  getConfig(): FormatterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FormatterConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

export default ElideFormatter;
