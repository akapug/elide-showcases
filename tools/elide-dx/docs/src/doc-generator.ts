/**
 * Elide Documentation Generator
 * Extract and generate documentation from source code
 */

import { EventEmitter } from 'events';

export interface DocConfig {
  input: string[];
  output: string;
  format: 'markdown' | 'html' | 'json';
  includePrivate?: boolean;
  theme?: string;
  title?: string;
  readme?: string;
}

export interface DocEntry {
  name: string;
  kind: 'class' | 'function' | 'interface' | 'type' | 'variable' | 'module';
  description?: string;
  signature?: string;
  parameters?: Parameter[];
  returnType?: string;
  examples?: Example[];
  deprecated?: boolean;
  since?: string;
  see?: string[];
  author?: string;
  tags?: Record<string, string>;
  source?: SourceLocation;
}

export interface Parameter {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface Example {
  code: string;
  language: string;
  caption?: string;
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

export interface ModuleDoc {
  name: string;
  description?: string;
  exports: DocEntry[];
  imports: string[];
}

/**
 * Documentation Generator for Elide
 */
export class ElideDocGenerator extends EventEmitter {
  private config: DocConfig;
  private docs: Map<string, ModuleDoc> = new Map();

  constructor(config: DocConfig) {
    super();
    this.config = config;
  }

  /**
   * Generate documentation
   */
  async generate(): Promise<void> {
    console.log('[DocGenerator] Generating documentation');

    // Parse source files
    for (const inputPath of this.config.input) {
      await this.parseFile(inputPath);
    }

    // Generate output
    const content = this.formatOutput();

    console.log(`[DocGenerator] Documentation generated: ${this.config.output}`);
    this.emit('generated', { output: this.config.output, content });
  }

  /**
   * Parse source file
   */
  private async parseFile(filePath: string): Promise<void> {
    console.log(`[DocGenerator] Parsing file: ${filePath}`);

    // In production, this would read and parse the actual file
    const source = ''; // Would read from file system

    const moduleDoc: ModuleDoc = {
      name: this.getModuleName(filePath),
      exports: [],
      imports: []
    };

    // Parse TypeScript/JSDoc comments
    moduleDoc.exports = this.extractDocEntries(source);

    // Parse Python docstrings
    if (filePath.endsWith('.py')) {
      moduleDoc.exports = this.extractPythonDocs(source);
    }

    this.docs.set(filePath, moduleDoc);
  }

  /**
   * Get module name from file path
   */
  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
  }

  /**
   * Extract doc entries from TypeScript/JavaScript source
   */
  private extractDocEntries(source: string): DocEntry[] {
    const entries: DocEntry[] = [];

    // Extract JSDoc comments and their associated declarations
    const docCommentRegex = /\/\*\*[\s\S]*?\*\//g;
    const matches = source.match(docCommentRegex);

    if (!matches) return entries;

    for (const comment of matches) {
      const entry = this.parseJSDoc(comment);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Parse JSDoc comment
   */
  private parseJSDoc(comment: string): DocEntry | null {
    // Remove comment delimiters
    const content = comment
      .replace(/\/\*\*|\*\//g, '')
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim();

    if (!content) return null;

    const entry: DocEntry = {
      name: 'Unknown',
      kind: 'function',
      parameters: [],
      examples: [],
      tags: {}
    };

    // Parse tags
    const lines = content.split('\n');
    let description = '';
    let currentTag: string | null = null;
    let currentContent = '';

    for (const line of lines) {
      if (line.startsWith('@')) {
        // Save previous tag
        if (currentTag) {
          this.applyTag(entry, currentTag, currentContent.trim());
        }

        // Parse new tag
        const match = line.match(/@(\w+)\s*(.*)/);
        if (match) {
          currentTag = match[1];
          currentContent = match[2];
        }
      } else if (currentTag) {
        currentContent += '\n' + line;
      } else {
        description += line + '\n';
      }
    }

    // Apply last tag
    if (currentTag) {
      this.applyTag(entry, currentTag, currentContent.trim());
    }

    entry.description = description.trim();

    return entry;
  }

  /**
   * Apply JSDoc tag to entry
   */
  private applyTag(entry: DocEntry, tag: string, content: string): void {
    switch (tag) {
      case 'param':
        const paramMatch = content.match(/\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
        if (paramMatch) {
          entry.parameters!.push({
            name: paramMatch[2],
            type: paramMatch[1],
            description: paramMatch[3],
            optional: paramMatch[1].includes('?')
          });
        }
        break;

      case 'returns':
      case 'return':
        const returnMatch = content.match(/\{([^}]+)\}\s*(.*)/);
        if (returnMatch) {
          entry.returnType = returnMatch[1];
        }
        break;

      case 'example':
        entry.examples!.push({
          code: content,
          language: 'typescript'
        });
        break;

      case 'deprecated':
        entry.deprecated = true;
        break;

      case 'since':
        entry.since = content;
        break;

      case 'see':
        if (!entry.see) entry.see = [];
        entry.see.push(content);
        break;

      case 'author':
        entry.author = content;
        break;

      default:
        entry.tags![tag] = content;
    }
  }

  /**
   * Extract Python docstrings
   */
  private extractPythonDocs(source: string): DocEntry[] {
    const entries: DocEntry[] = [];

    // Extract triple-quoted docstrings
    const docstringRegex = /"""[\s\S]*?"""|'''[\s\S]*?'''/g;
    const matches = source.match(docstringRegex);

    if (!matches) return entries;

    for (const docstring of matches) {
      const entry = this.parsePythonDocstring(docstring);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Parse Python docstring
   */
  private parsePythonDocstring(docstring: string): DocEntry | null {
    // Remove quotes
    const content = docstring
      .replace(/^["']{3}|["']{3}$/g, '')
      .trim();

    if (!content) return null;

    const entry: DocEntry = {
      name: 'Unknown',
      kind: 'function',
      parameters: [],
      examples: []
    };

    // Parse sections
    const lines = content.split('\n');
    let section: 'description' | 'args' | 'returns' | 'examples' = 'description';
    let description = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'Args:' || trimmed === 'Parameters:') {
        section = 'args';
      } else if (trimmed === 'Returns:') {
        section = 'returns';
      } else if (trimmed === 'Examples:') {
        section = 'examples';
      } else {
        switch (section) {
          case 'description':
            description += line + '\n';
            break;

          case 'args':
            const argMatch = trimmed.match(/(\w+)\s*\(([^)]+)\):\s*(.*)/);
            if (argMatch) {
              entry.parameters!.push({
                name: argMatch[1],
                type: argMatch[2],
                description: argMatch[3]
              });
            }
            break;

          case 'returns':
            if (trimmed) {
              entry.returnType = trimmed;
            }
            break;

          case 'examples':
            if (entry.examples!.length === 0 || trimmed.startsWith('>>>')) {
              entry.examples!.push({
                code: trimmed,
                language: 'python'
              });
            } else {
              const last = entry.examples![entry.examples!.length - 1];
              last.code += '\n' + trimmed;
            }
            break;
        }
      }
    }

    entry.description = description.trim();

    return entry;
  }

  /**
   * Format output
   */
  private formatOutput(): string {
    switch (this.config.format) {
      case 'markdown':
        return this.formatMarkdown();
      case 'html':
        return this.formatHTML();
      case 'json':
        return this.formatJSON();
      default:
        return '';
    }
  }

  /**
   * Format as Markdown
   */
  private formatMarkdown(): string {
    let output = `# ${this.config.title || 'API Documentation'}\n\n`;

    for (const [filePath, moduleDoc] of this.docs) {
      output += `## ${moduleDoc.name}\n\n`;

      if (moduleDoc.description) {
        output += `${moduleDoc.description}\n\n`;
      }

      for (const entry of moduleDoc.exports) {
        if (!this.config.includePrivate && entry.name.startsWith('_')) {
          continue;
        }

        output += `### ${entry.name}\n\n`;

        if (entry.deprecated) {
          output += '> **Deprecated**\n\n';
        }

        if (entry.description) {
          output += `${entry.description}\n\n`;
        }

        if (entry.signature) {
          output += '```typescript\n';
          output += `${entry.signature}\n`;
          output += '```\n\n';
        }

        if (entry.parameters && entry.parameters.length > 0) {
          output += '**Parameters:**\n\n';
          for (const param of entry.parameters) {
            output += `- \`${param.name}\` (${param.type})`;
            if (param.optional) output += ' *optional*';
            if (param.description) output += ` - ${param.description}`;
            output += '\n';
          }
          output += '\n';
        }

        if (entry.returnType) {
          output += `**Returns:** \`${entry.returnType}\`\n\n`;
        }

        if (entry.examples && entry.examples.length > 0) {
          output += '**Examples:**\n\n';
          for (const example of entry.examples) {
            output += `\`\`\`${example.language}\n`;
            output += `${example.code}\n`;
            output += '```\n\n';
          }
        }

        if (entry.see && entry.see.length > 0) {
          output += '**See also:**\n';
          for (const ref of entry.see) {
            output += `- ${ref}\n`;
          }
          output += '\n';
        }
      }
    }

    return output;
  }

  /**
   * Format as HTML
   */
  private formatHTML(): string {
    let output = `<!DOCTYPE html>
<html>
<head>
  <title>${this.config.title || 'API Documentation'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 40px; }
    h3 { color: #333; margin-top: 30px; }
    code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .deprecated { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>${this.config.title || 'API Documentation'}</h1>
`;

    for (const [filePath, moduleDoc] of this.docs) {
      output += `  <h2>${moduleDoc.name}</h2>\n`;

      if (moduleDoc.description) {
        output += `  <p>${moduleDoc.description}</p>\n`;
      }

      for (const entry of moduleDoc.exports) {
        if (!this.config.includePrivate && entry.name.startsWith('_')) {
          continue;
        }

        output += `  <h3 id="${entry.name}">${entry.name}</h3>\n`;

        if (entry.deprecated) {
          output += '  <div class="deprecated"><strong>Deprecated</strong></div>\n';
        }

        if (entry.description) {
          output += `  <p>${entry.description}</p>\n`;
        }

        if (entry.signature) {
          output += `  <pre><code>${entry.signature}</code></pre>\n`;
        }

        if (entry.parameters && entry.parameters.length > 0) {
          output += '  <h4>Parameters</h4>\n  <ul>\n';
          for (const param of entry.parameters) {
            output += `    <li><code>${param.name}</code> (${param.type})`;
            if (param.optional) output += ' <em>optional</em>';
            if (param.description) output += ` - ${param.description}`;
            output += '</li>\n';
          }
          output += '  </ul>\n';
        }

        if (entry.returnType) {
          output += `  <p><strong>Returns:</strong> <code>${entry.returnType}</code></p>\n`;
        }
      }
    }

    output += '</body>\n</html>';
    return output;
  }

  /**
   * Format as JSON
   */
  private formatJSON(): string {
    const docs: any = {};

    for (const [filePath, moduleDoc] of this.docs) {
      docs[moduleDoc.name] = {
        description: moduleDoc.description,
        exports: moduleDoc.exports.filter(entry =>
          this.config.includePrivate || !entry.name.startsWith('_')
        )
      };
    }

    return JSON.stringify(docs, null, 2);
  }

  /**
   * Get all documentation entries
   */
  getDocs(): Map<string, ModuleDoc> {
    return new Map(this.docs);
  }
}

export default ElideDocGenerator;
