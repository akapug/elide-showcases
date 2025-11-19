/**
 * Elide Code Linter
 * ESLint-compatible linter for multiple languages
 */

import { EventEmitter } from 'events';

export interface LinterConfig {
  rules: Record<string, RuleSeverity | [RuleSeverity, any]>;
  extends?: string[];
  plugins?: string[];
  env?: Record<string, boolean>;
  globals?: Record<string, boolean>;
  parserOptions?: ParserOptions;
  ignorePatterns?: string[];
}

export interface ParserOptions {
  ecmaVersion?: number;
  sourceType?: 'script' | 'module';
  ecmaFeatures?: {
    jsx?: boolean;
    globalReturn?: boolean;
  };
}

export type RuleSeverity = 'off' | 'warn' | 'error' | 0 | 1 | 2;

export interface LintMessage {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: Fix;
  suggestions?: Suggestion[];
}

export interface Fix {
  range: [number, number];
  text: string;
}

export interface Suggestion {
  desc: string;
  fix: Fix;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  source?: string;
}

export interface LintRule {
  meta: {
    type: 'problem' | 'suggestion' | 'layout';
    docs: {
      description: string;
      category: string;
      recommended: boolean;
    };
    fixable?: 'code' | 'whitespace';
    schema?: any[];
  };
  create: (context: RuleContext) => any;
}

export interface RuleContext {
  id: string;
  options: any[];
  report: (descriptor: ReportDescriptor) => void;
  getSourceCode: () => SourceCode;
  getFilename: () => string;
}

export interface ReportDescriptor {
  node?: any;
  loc?: { line: number; column: number };
  message: string;
  data?: Record<string, any>;
  fix?: (fixer: Fixer) => Fix | Fix[];
  suggest?: Array<{ desc: string; fix: (fixer: Fixer) => Fix }>;
}

export interface Fixer {
  insertTextAfter: (node: any, text: string) => Fix;
  insertTextBefore: (node: any, text: string) => Fix;
  remove: (node: any) => Fix;
  removeRange: (range: [number, number]) => Fix;
  replaceText: (node: any, text: string) => Fix;
  replaceTextRange: (range: [number, number], text: string) => Fix;
}

export interface SourceCode {
  text: string;
  ast: any;
  lines: string[];
  getTokens: () => Token[];
  getFirstToken: (node: any) => Token | null;
  getLastToken: (node: any) => Token | null;
}

export interface Token {
  type: string;
  value: string;
  start: number;
  end: number;
  loc: { line: number; column: number };
}

/**
 * Code Linter for Elide
 */
export class ElideLinter extends EventEmitter {
  private config: LinterConfig;
  private rules: Map<string, LintRule> = new Map();

  constructor(config: LinterConfig = { rules: {} }) {
    super();
    this.config = config;
    this.registerBuiltInRules();
  }

  /**
   * Register built-in linting rules
   */
  private registerBuiltInRules(): void {
    // Register common rules
    this.registerRule('no-console', {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow console statements',
          category: 'Best Practices',
          recommended: false
        }
      },
      create: (context) => ({
        CallExpression: (node: any) => {
          if (node.callee?.object?.name === 'console') {
            context.report({
              node,
              message: 'Unexpected console statement'
            });
          }
        }
      })
    });

    this.registerRule('no-unused-vars', {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow unused variables',
          category: 'Variables',
          recommended: true
        }
      },
      create: (context) => ({
        VariableDeclaration: (node: any) => {
          // Check if variable is unused
          // This is a simplified implementation
        }
      })
    });

    this.registerRule('no-undef', {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow undefined variables',
          category: 'Variables',
          recommended: true
        }
      },
      create: (context) => ({
        Identifier: (node: any) => {
          // Check if identifier is defined
          // This is a simplified implementation
        }
      })
    });

    this.registerRule('semi', {
      meta: {
        type: 'layout',
        docs: {
          description: 'Require or disallow semicolons',
          category: 'Stylistic Issues',
          recommended: false
        },
        fixable: 'code'
      },
      create: (context) => ({
        ExpressionStatement: (node: any) => {
          // Check for semicolons
          // This is a simplified implementation
        }
      })
    });

    this.registerRule('quotes', {
      meta: {
        type: 'layout',
        docs: {
          description: 'Enforce quote style',
          category: 'Stylistic Issues',
          recommended: false
        },
        fixable: 'code'
      },
      create: (context) => ({
        Literal: (node: any) => {
          if (typeof node.value === 'string') {
            const [severity, style = 'single'] = context.options;
            // Check quote style
          }
        }
      })
    });

    this.registerRule('indent', {
      meta: {
        type: 'layout',
        docs: {
          description: 'Enforce consistent indentation',
          category: 'Stylistic Issues',
          recommended: false
        },
        fixable: 'whitespace'
      },
      create: (context) => ({
        Program: (node: any) => {
          // Check indentation
          // This is a simplified implementation
        }
      })
    });

    this.registerRule('no-debugger', {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow debugger statements',
          category: 'Possible Errors',
          recommended: true
        },
        fixable: 'code'
      },
      create: (context) => ({
        DebuggerStatement: (node: any) => {
          context.report({
            node,
            message: 'Unexpected debugger statement',
            fix: (fixer) => fixer.remove(node)
          });
        }
      })
    });

    this.registerRule('no-var', {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require let or const instead of var',
          category: 'Best Practices',
          recommended: true
        },
        fixable: 'code'
      },
      create: (context) => ({
        VariableDeclaration: (node: any) => {
          if (node.kind === 'var') {
            context.report({
              node,
              message: 'Unexpected var, use let or const instead',
              fix: (fixer) => fixer.replaceText(node, node.text.replace('var', 'const'))
            });
          }
        }
      })
    });

    this.registerRule('eqeqeq', {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require === and !==',
          category: 'Best Practices',
          recommended: true
        },
        fixable: 'code'
      },
      create: (context) => ({
        BinaryExpression: (node: any) => {
          if (node.operator === '==' || node.operator === '!=') {
            context.report({
              node,
              message: 'Use === or !== instead',
              fix: (fixer) => {
                const strict = node.operator === '==' ? '===' : '!==';
                return fixer.replaceText(node, strict);
              }
            });
          }
        }
      })
    });

    this.registerRule('no-eval', {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow eval()',
          category: 'Best Practices',
          recommended: true
        }
      },
      create: (context) => ({
        CallExpression: (node: any) => {
          if (node.callee?.name === 'eval') {
            context.report({
              node,
              message: 'eval() is dangerous and should not be used'
            });
          }
        }
      })
    });
  }

  /**
   * Register a linting rule
   */
  registerRule(name: string, rule: LintRule): void {
    this.rules.set(name, rule);
  }

  /**
   * Lint a file
   */
  async lintFile(filePath: string, source: string): Promise<LintResult> {
    console.log(`[Linter] Linting file: ${filePath}`);

    const messages: LintMessage[] = [];

    try {
      // Parse source code
      const ast = this.parse(source);
      const sourceCode = this.createSourceCode(source, ast);

      // Run each enabled rule
      for (const [ruleId, ruleSetting] of Object.entries(this.config.rules)) {
        const rule = this.rules.get(ruleId);
        if (!rule) continue;

        const severity = this.getRuleSeverity(ruleSetting);
        if (severity === 'off') continue;

        const options = Array.isArray(ruleSetting) ? ruleSetting.slice(1) : [];

        // Create rule context
        const context = this.createRuleContext(
          ruleId,
          options,
          messages,
          sourceCode,
          filePath,
          severity
        );

        // Execute rule
        const visitor = rule.create(context);
        this.traverseAST(ast, visitor);
      }
    } catch (error) {
      messages.push({
        ruleId: 'parse-error',
        severity: 'error',
        message: error instanceof Error ? error.message : 'Parse error',
        line: 1,
        column: 0
      });
    }

    const result: LintResult = {
      filePath,
      messages,
      errorCount: messages.filter(m => m.severity === 'error').length,
      warningCount: messages.filter(m => m.severity === 'warning').length,
      fixableErrorCount: messages.filter(m => m.severity === 'error' && m.fix).length,
      fixableWarningCount: messages.filter(m => m.severity === 'warning' && m.fix).length,
      source
    };

    this.emit('lintComplete', result);
    return result;
  }

  /**
   * Lint multiple files
   */
  async lintFiles(files: Array<{ path: string; content: string }>): Promise<LintResult[]> {
    const results: LintResult[] = [];

    for (const file of files) {
      if (this.shouldIgnoreFile(file.path)) {
        continue;
      }

      const result = await this.lintFile(file.path, file.content);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(filePath: string): boolean {
    if (!this.config.ignorePatterns) return false;

    for (const pattern of this.config.ignorePatterns) {
      // Simple pattern matching (in production, use proper glob matching)
      if (filePath.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get rule severity
   */
  private getRuleSeverity(setting: RuleSeverity | [RuleSeverity, any]): 'off' | 'warn' | 'error' {
    const severity = Array.isArray(setting) ? setting[0] : setting;

    if (severity === 0 || severity === 'off') return 'off';
    if (severity === 1 || severity === 'warn') return 'warn';
    if (severity === 2 || severity === 'error') return 'error';

    return 'off';
  }

  /**
   * Parse source code to AST
   */
  private parse(source: string): any {
    // In production, this would use a proper parser (e.g., @babel/parser)
    // For now, return a mock AST
    return {
      type: 'Program',
      body: [],
      sourceType: 'module'
    };
  }

  /**
   * Create source code object
   */
  private createSourceCode(source: string, ast: any): SourceCode {
    const lines = source.split('\n');

    return {
      text: source,
      ast,
      lines,
      getTokens: () => [],
      getFirstToken: () => null,
      getLastToken: () => null
    };
  }

  /**
   * Create rule context
   */
  private createRuleContext(
    ruleId: string,
    options: any[],
    messages: LintMessage[],
    sourceCode: SourceCode,
    filePath: string,
    severity: 'warn' | 'error'
  ): RuleContext {
    return {
      id: ruleId,
      options,
      report: (descriptor: ReportDescriptor) => {
        const message: LintMessage = {
          ruleId,
          severity: severity === 'error' ? 'error' : 'warning',
          message: descriptor.message,
          line: descriptor.loc?.line || 1,
          column: descriptor.loc?.column || 0,
          fix: descriptor.fix ? descriptor.fix(this.createFixer()) : undefined
        };

        messages.push(message);
      },
      getSourceCode: () => sourceCode,
      getFilename: () => filePath
    };
  }

  /**
   * Create fixer object
   */
  private createFixer(): Fixer {
    return {
      insertTextAfter: (node: any, text: string) => ({
        range: [node.end, node.end],
        text
      }),
      insertTextBefore: (node: any, text: string) => ({
        range: [node.start, node.start],
        text
      }),
      remove: (node: any) => ({
        range: [node.start, node.end],
        text: ''
      }),
      removeRange: (range: [number, number]) => ({
        range,
        text: ''
      }),
      replaceText: (node: any, text: string) => ({
        range: [node.start, node.end],
        text
      }),
      replaceTextRange: (range: [number, number], text: string) => ({
        range,
        text
      })
    };
  }

  /**
   * Traverse AST and apply visitor
   */
  private traverseAST(node: any, visitor: any): void {
    if (!node || typeof node !== 'object') return;

    // Call visitor for this node type
    if (visitor[node.type]) {
      visitor[node.type](node);
    }

    // Traverse children
    for (const key of Object.keys(node)) {
      const child = node[key];

      if (Array.isArray(child)) {
        for (const item of child) {
          this.traverseAST(item, visitor);
        }
      } else if (child && typeof child === 'object') {
        this.traverseAST(child, visitor);
      }
    }
  }

  /**
   * Fix linting errors
   */
  async fix(source: string, messages: LintMessage[]): Promise<string> {
    let fixed = source;

    // Sort messages by position (reverse order to fix from end to start)
    const fixableMessages = messages
      .filter(m => m.fix)
      .sort((a, b) => b.fix!.range[0] - a.fix!.range[0]);

    for (const message of fixableMessages) {
      if (!message.fix) continue;

      const [start, end] = message.fix.range;
      fixed = fixed.slice(0, start) + message.fix.text + fixed.slice(end);
    }

    return fixed;
  }

  /**
   * Get configuration
   */
  getConfig(): LinterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LinterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      rules: {
        ...this.config.rules,
        ...config.rules
      }
    };
  }

  /**
   * Get available rules
   */
  getRules(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Get rule documentation
   */
  getRuleDoc(ruleId: string): LintRule['meta'] | undefined {
    const rule = this.rules.get(ruleId);
    return rule?.meta;
  }
}

export default ElideLinter;
