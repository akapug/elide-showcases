/**
 * EditorConfig - Maintain Consistent Coding Styles
 *
 * EditorConfig helps maintain consistent coding styles across editors.
 * **POLYGLOT SHOWCASE**: Consistent editor settings everywhere!
 *
 * Based on https://www.npmjs.com/package/editorconfig (~500K+ downloads/week)
 *
 * Features:
 * - Cross-editor compatibility
 * - Simple configuration
 * - Language-agnostic
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export interface EditorConfigRules {
  indent_style?: 'space' | 'tab';
  indent_size?: number;
  end_of_line?: 'lf' | 'crlf' | 'cr';
  charset?: string;
  trim_trailing_whitespace?: boolean;
  insert_final_newline?: boolean;
  max_line_length?: number;
}

export class EditorConfig {
  private config: EditorConfigRules;

  constructor(config: EditorConfigRules = {}) {
    this.config = {
      indent_style: 'space',
      indent_size: 2,
      end_of_line: 'lf',
      charset: 'utf-8',
      trim_trailing_whitespace: true,
      insert_final_newline: true,
      ...config
    };
  }

  format(code: string): string {
    let formatted = code;

    // Apply indent style
    if (this.config.indent_style === 'space' && this.config.indent_size) {
      formatted = formatted.replace(/\t/g, ' '.repeat(this.config.indent_size));
    }

    // Trim trailing whitespace
    if (this.config.trim_trailing_whitespace) {
      formatted = formatted.split('\n').map(line => line.trimEnd()).join('\n');
    }

    // Normalize line endings
    if (this.config.end_of_line === 'lf') {
      formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    // Insert final newline
    if (this.config.insert_final_newline && !formatted.endsWith('\n')) {
      formatted += '\n';
    }

    return formatted;
  }

  parse(editorconfig: string): EditorConfigRules {
    const rules: EditorConfigRules = {};
    const lines = editorconfig.split('\n');

    lines.forEach(line => {
      const [key, value] = line.split('=').map(s => s.trim());
      if (key && value) {
        switch (key) {
          case 'indent_style':
            rules.indent_style = value as 'space' | 'tab';
            break;
          case 'indent_size':
            rules.indent_size = parseInt(value);
            break;
          case 'end_of_line':
            rules.end_of_line = value as 'lf' | 'crlf' | 'cr';
            break;
          case 'charset':
            rules.charset = value;
            break;
          case 'trim_trailing_whitespace':
            rules.trim_trailing_whitespace = value === 'true';
            break;
          case 'insert_final_newline':
            rules.insert_final_newline = value === 'true';
            break;
          case 'max_line_length':
            rules.max_line_length = parseInt(value);
            break;
        }
      }
    });

    return rules;
  }

  getConfig(): EditorConfigRules {
    return this.config;
  }
}

export default new EditorConfig();

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚙️  EditorConfig - Consistent Coding Styles\n");

  const config = new EditorConfig({
    indent_style: 'space',
    indent_size: 2,
    end_of_line: 'lf',
    trim_trailing_whitespace: true
  });

  const code = 'const\tx = 10;  \nconst y = 20;';
  console.log("Before:");
  console.log(JSON.stringify(code));
  console.log("\nAfter:");
  console.log(JSON.stringify(config.format(code)));

  console.log("\n=== Example .editorconfig ===");
  console.log("root = true");
  console.log("\n[*]");
  Object.entries(config.getConfig()).forEach(([key, value]) => {
    console.log(`${key} = ${value}`);
  });

  console.log("\n🌐 500K+ downloads/week on npm!");
  console.log("✓ Works in VS Code, Vim, Emacs, Sublime, etc.");
}
