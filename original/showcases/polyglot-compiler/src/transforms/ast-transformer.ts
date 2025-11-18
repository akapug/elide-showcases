/**
 * AST Transformer
 *
 * Transforms and optimizes TypeScript AST for better code generation
 * Implements visitor pattern for transformations and cross-language optimizations
 */

import * as ts from 'typescript';

export interface TransformOptions {
  removeUnused?: boolean;
  inlineFunctions?: boolean;
  constantFolding?: boolean;
  deadCodeElimination?: boolean;
  optimizeLoops?: boolean;
  simplifyExpressions?: boolean;
  targetLanguage?: 'python' | 'ruby' | 'java' | 'javascript';
}

/**
 * Symbol tracker for usage analysis
 */
class SymbolTracker {
  private declarations = new Map<string, ts.Node>();
  private usages = new Map<string, number>();

  declare(name: string, node: ts.Node): void {
    this.declarations.set(name, node);
    if (!this.usages.has(name)) {
      this.usages.set(name, 0);
    }
  }

  use(name: string): void {
    const current = this.usages.get(name) || 0;
    this.usages.set(name, current + 1);
  }

  isUnused(name: string): boolean {
    return (this.usages.get(name) || 0) === 0;
  }

  getUsageCount(name: string): number {
    return this.usages.get(name) || 0;
  }
}

/**
 * AST Transformer with optimization pipeline
 */
export class ASTTransformer {
  private options: TransformOptions;
  private symbolTracker: SymbolTracker;

  constructor(options: TransformOptions = {}) {
    this.options = {
      removeUnused: true,
      inlineFunctions: false,
      constantFolding: true,
      deadCodeElimination: true,
      optimizeLoops: true,
      simplifyExpressions: true,
      ...options
    };
    this.symbolTracker = new SymbolTracker();
  }

  /**
   * Transform TypeScript AST
   */
  transform(sourceFile: ts.SourceFile): ts.SourceFile {
    // Reset symbol tracker
    this.symbolTracker = new SymbolTracker();

    // Phase 1: Analyze symbols (declarations and usages)
    this.analyzeSymbols(sourceFile);

    // Phase 2: Apply transformations
    let transformed = sourceFile;

    if (this.options.removeUnused) {
      transformed = this.removeUnusedDeclarations(transformed);
    }

    if (this.options.constantFolding) {
      transformed = this.foldConstants(transformed);
    }

    if (this.options.simplifyExpressions) {
      transformed = this.simplifyExpressions(transformed);
    }

    if (this.options.deadCodeElimination) {
      transformed = this.eliminateDeadCode(transformed);
    }

    if (this.options.optimizeLoops) {
      transformed = this.optimizeLoops(transformed);
    }

    if (this.options.inlineFunctions) {
      transformed = this.inlineSimpleFunctions(transformed);
    }

    return transformed;
  }

  /**
   * Analyze symbols (declarations and usages)
   */
  private analyzeSymbols(node: ts.Node): void {
    const visit = (n: ts.Node) => {
      // Track declarations
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) {
        this.symbolTracker.declare(n.name.text, n);
      } else if (ts.isFunctionDeclaration(n) && n.name) {
        this.symbolTracker.declare(n.name.text, n);
      } else if (ts.isClassDeclaration(n) && n.name) {
        this.symbolTracker.declare(n.name.text, n);
      } else if (ts.isInterfaceDeclaration(n)) {
        this.symbolTracker.declare(n.name.text, n);
      } else if (ts.isEnumDeclaration(n)) {
        this.symbolTracker.declare(n.name.text, n);
      }

      // Track usages
      if (ts.isIdentifier(n)) {
        this.symbolTracker.use(n.text);
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
  }

  /**
   * Remove unused declarations
   */
  private removeUnusedDeclarations(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node | undefined => {
          // Check if this is an unused declaration
          if (ts.isVariableStatement(n)) {
            const filteredDeclarations = n.declarationList.declarations.filter(decl => {
              if (ts.isIdentifier(decl.name)) {
                return !this.symbolTracker.isUnused(decl.name.text);
              }
              return true;
            });

            if (filteredDeclarations.length === 0) {
              return undefined; // Remove entire statement
            }

            if (filteredDeclarations.length < n.declarationList.declarations.length) {
              // Update with filtered declarations
              return ts.factory.updateVariableStatement(
                n,
                n.modifiers,
                ts.factory.updateVariableDeclarationList(
                  n.declarationList,
                  filteredDeclarations
                )
              );
            }
          } else if (ts.isFunctionDeclaration(n) && n.name) {
            if (this.symbolTracker.isUnused(n.name.text)) {
              return undefined; // Remove unused function
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Fold constant expressions
   */
  private foldConstants(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node => {
          if (ts.isBinaryExpression(n)) {
            const folded = this.tryFoldBinaryExpression(n);
            if (folded) {
              return folded;
            }
          } else if (ts.isPrefixUnaryExpression(n)) {
            const folded = this.tryFoldUnaryExpression(n);
            if (folded) {
              return folded;
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Try to fold binary expression
   */
  private tryFoldBinaryExpression(node: ts.BinaryExpression): ts.Expression | null {
    // Only fold if both operands are literals
    if (!ts.isLiteralExpression(node.left) || !ts.isLiteralExpression(node.right)) {
      return null;
    }

    // Numeric operations
    if (ts.isNumericLiteral(node.left) && ts.isNumericLiteral(node.right)) {
      const left = parseFloat(node.left.text);
      const right = parseFloat(node.right.text);
      let result: number | boolean | null = null;

      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
          result = left + right;
          break;
        case ts.SyntaxKind.MinusToken:
          result = left - right;
          break;
        case ts.SyntaxKind.AsteriskToken:
          result = left * right;
          break;
        case ts.SyntaxKind.SlashToken:
          result = left / right;
          break;
        case ts.SyntaxKind.PercentToken:
          result = left % right;
          break;
        case ts.SyntaxKind.LessThanToken:
          result = left < right;
          break;
        case ts.SyntaxKind.GreaterThanToken:
          result = left > right;
          break;
        case ts.SyntaxKind.LessThanEqualsToken:
          result = left <= right;
          break;
        case ts.SyntaxKind.GreaterThanEqualsToken:
          result = left >= right;
          break;
        case ts.SyntaxKind.EqualsEqualsToken:
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
          result = left === right;
          break;
        case ts.SyntaxKind.ExclamationEqualsToken:
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          result = left !== right;
          break;
      }

      if (result !== null) {
        if (typeof result === 'number') {
          return ts.factory.createNumericLiteral(result);
        } else if (typeof result === 'boolean') {
          return result ? ts.factory.createTrue() : ts.factory.createFalse();
        }
      }
    }

    // String concatenation
    if (ts.isStringLiteral(node.left) && ts.isStringLiteral(node.right)) {
      if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        return ts.factory.createStringLiteral(node.left.text + node.right.text);
      }
    }

    // Boolean operations
    if (this.isBooleanLiteral(node.left) && this.isBooleanLiteral(node.right)) {
      const left = this.getBooleanValue(node.left);
      const right = this.getBooleanValue(node.right);

      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return left && right ? ts.factory.createTrue() : ts.factory.createFalse();
      } else if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        return left || right ? ts.factory.createTrue() : ts.factory.createFalse();
      }
    }

    return null;
  }

  /**
   * Try to fold unary expression
   */
  private tryFoldUnaryExpression(node: ts.PrefixUnaryExpression): ts.Expression | null {
    if (ts.isNumericLiteral(node.operand)) {
      const value = parseFloat(node.operand.text);

      if (node.operator === ts.SyntaxKind.MinusToken) {
        return ts.factory.createNumericLiteral(-value);
      } else if (node.operator === ts.SyntaxKind.PlusToken) {
        return ts.factory.createNumericLiteral(value);
      }
    }

    if (this.isBooleanLiteral(node.operand)) {
      if (node.operator === ts.SyntaxKind.ExclamationToken) {
        const value = this.getBooleanValue(node.operand);
        return value ? ts.factory.createFalse() : ts.factory.createTrue();
      }
    }

    return null;
  }

  /**
   * Check if expression is a boolean literal
   */
  private isBooleanLiteral(node: ts.Expression): boolean {
    return node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword;
  }

  /**
   * Get boolean value from literal
   */
  private getBooleanValue(node: ts.Expression): boolean {
    return node.kind === ts.SyntaxKind.TrueKeyword;
  }

  /**
   * Simplify expressions
   */
  private simplifyExpressions(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node => {
          // Simplify: x + 0 -> x
          if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
            if (ts.isNumericLiteral(n.right) && parseFloat(n.right.text) === 0) {
              return n.left;
            }
            if (ts.isNumericLiteral(n.left) && parseFloat(n.left.text) === 0) {
              return n.right;
            }
          }

          // Simplify: x * 1 -> x
          if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AsteriskToken) {
            if (ts.isNumericLiteral(n.right) && parseFloat(n.right.text) === 1) {
              return n.left;
            }
            if (ts.isNumericLiteral(n.left) && parseFloat(n.left.text) === 1) {
              return n.right;
            }
          }

          // Simplify: x * 0 -> 0
          if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AsteriskToken) {
            if (ts.isNumericLiteral(n.right) && parseFloat(n.right.text) === 0) {
              return ts.factory.createNumericLiteral(0);
            }
            if (ts.isNumericLiteral(n.left) && parseFloat(n.left.text) === 0) {
              return ts.factory.createNumericLiteral(0);
            }
          }

          // Simplify: !!x -> x (for boolean context)
          if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken) {
            if (ts.isPrefixUnaryExpression(n.operand) && n.operand.operator === ts.SyntaxKind.ExclamationToken) {
              return n.operand.operand;
            }
          }

          // Simplify: true && x -> x, false && x -> false
          if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
            if (n.left.kind === ts.SyntaxKind.TrueKeyword) {
              return n.right;
            }
            if (n.left.kind === ts.SyntaxKind.FalseKeyword) {
              return ts.factory.createFalse();
            }
          }

          // Simplify: true || x -> true, false || x -> x
          if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            if (n.left.kind === ts.SyntaxKind.TrueKeyword) {
              return ts.factory.createTrue();
            }
            if (n.left.kind === ts.SyntaxKind.FalseKeyword) {
              return n.right;
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Eliminate dead code
   */
  private eliminateDeadCode(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node | undefined => {
          // Remove unreachable code after return/throw
          if (ts.isBlock(n)) {
            const statements: ts.Statement[] = [];
            let reachable = true;

            for (const statement of n.statements) {
              if (reachable) {
                statements.push(statement);

                // Check if this statement makes subsequent code unreachable
                if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) {
                  reachable = false;
                }
              }
            }

            if (statements.length < n.statements.length) {
              return ts.factory.updateBlock(n, statements);
            }
          }

          // Remove if (false) blocks
          if (ts.isIfStatement(n)) {
            if (n.expression.kind === ts.SyntaxKind.FalseKeyword) {
              return n.elseStatement; // Keep else branch, remove if
            } else if (n.expression.kind === ts.SyntaxKind.TrueKeyword) {
              return n.thenStatement; // Keep then branch, remove else
            }
          }

          // Remove while (false) loops
          if (ts.isWhileStatement(n)) {
            if (n.expression.kind === ts.SyntaxKind.FalseKeyword) {
              return undefined; // Remove entire loop
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Optimize loops
   */
  private optimizeLoops(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node => {
          // Convert for-in to for-of where appropriate
          if (ts.isForInStatement(n)) {
            // Check if iterating over array
            const iterable = n.expression;
            // Could add more sophisticated analysis here
          }

          // Optimize simple counting loops
          if (ts.isForStatement(n)) {
            // Could optimize range-based loops
            // e.g., for (let i = 0; i < arr.length; i++) could use iterator
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Inline simple functions
   */
  private inlineSimpleFunctions(sourceFile: ts.SourceFile): ts.SourceFile {
    // Build map of simple functions that can be inlined
    const inlinableFunctions = new Map<string, ts.Expression>();

    const findInlinable = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        // Check if function is simple enough to inline
        if (this.isInlinableFunction(node)) {
          const body = this.extractFunctionBody(node);
          if (body) {
            inlinableFunctions.set(node.name.text, body);
          }
        }
      }

      ts.forEachChild(node, findInlinable);
    };

    findInlinable(sourceFile);

    // Now inline the functions
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node | undefined => {
          // Inline function calls
          if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
            const funcName = n.expression.text;
            if (inlinableFunctions.has(funcName)) {
              // Only inline if usage count is low
              if (this.symbolTracker.getUsageCount(funcName) <= 2) {
                return inlinableFunctions.get(funcName);
              }
            }
          }

          // Remove inlined function declarations
          if (ts.isFunctionDeclaration(n) && n.name) {
            if (inlinableFunctions.has(n.name.text) && this.symbolTracker.getUsageCount(n.name.text) <= 2) {
              return undefined;
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Check if function can be inlined
   */
  private isInlinableFunction(func: ts.FunctionDeclaration): boolean {
    // Function must have a body
    if (!func.body) {
      return false;
    }

    // Must have no parameters or only simple parameters
    if (func.parameters.length > 3) {
      return false;
    }

    // Body must be simple (single return statement)
    if (func.body.statements.length !== 1) {
      return false;
    }

    const statement = func.body.statements[0];
    return ts.isReturnStatement(statement) && statement.expression !== undefined;
  }

  /**
   * Extract function body for inlining
   */
  private extractFunctionBody(func: ts.FunctionDeclaration): ts.Expression | null {
    if (!func.body || func.body.statements.length !== 1) {
      return null;
    }

    const statement = func.body.statements[0];
    if (ts.isReturnStatement(statement) && statement.expression) {
      return statement.expression;
    }

    return null;
  }

  /**
   * Target-specific transformations
   */
  transformForTarget(sourceFile: ts.SourceFile, target: 'python' | 'ruby' | 'java'): ts.SourceFile {
    switch (target) {
      case 'python':
        return this.transformForPython(sourceFile);
      case 'ruby':
        return this.transformForRuby(sourceFile);
      case 'java':
        return this.transformForJava(sourceFile);
      default:
        return sourceFile;
    }
  }

  /**
   * Python-specific transformations
   */
  private transformForPython(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node => {
          // Convert undefined to None
          if (ts.isIdentifier(n) && n.text === 'undefined') {
            return ts.factory.createNull();
          }

          // Convert console.log to print
          if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
            if (n.expression.expression.getText() === 'console' && n.expression.name.text === 'log') {
              // Transform to print call
              return ts.factory.createCallExpression(
                ts.factory.createIdentifier('print'),
                undefined,
                n.arguments
              );
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Ruby-specific transformations
   */
  private transformForRuby(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node => {
          // Convert undefined/null to nil
          if (ts.isIdentifier(n) && n.text === 'undefined') {
            return ts.factory.createNull();
          }

          // Convert console.log to puts
          if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
            if (n.expression.expression.getText() === 'console' && n.expression.name.text === 'log') {
              return ts.factory.createCallExpression(
                ts.factory.createIdentifier('puts'),
                undefined,
                n.arguments
              );
            }
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Java-specific transformations
   */
  private transformForJava(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (node) => {
        const visitor = (n: ts.Node): ts.Node => {
          // Convert console.log to System.out.println
          if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
            if (n.expression.expression.getText() === 'console' && n.expression.name.text === 'log') {
              return ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier('System'),
                    ts.factory.createIdentifier('out')
                  ),
                  ts.factory.createIdentifier('println')
                ),
                undefined,
                n.arguments
              );
            }
          }

          // Convert array literals to List.of()
          if (ts.isArrayLiteralExpression(n) && n.elements.length <= 10) {
            return ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier('List'),
                ts.factory.createIdentifier('of')
              ),
              undefined,
              n.elements
            );
          }

          return ts.visitEachChild(n, visitor, context);
        };

        return ts.visitNode(node, visitor) as ts.SourceFile;
      };
    };

    return ts.transform(sourceFile, [transformer]).transformed[0];
  }

  /**
   * Get transformation statistics
   */
  getStats(): {
    unusedDeclarations: number;
    optimizedExpressions: number;
    deadCodeRemoved: number;
  } {
    let unusedCount = 0;

    // Count unused symbols
    // Note: In a real implementation, we'd track these during transformation

    return {
      unusedDeclarations: unusedCount,
      optimizedExpressions: 0,
      deadCodeRemoved: 0
    };
  }
}

/**
 * Create transformer with options
 */
export function createTransformer(options?: TransformOptions): ASTTransformer {
  return new ASTTransformer(options);
}

/**
 * Quick transform function
 */
export function transform(sourceFile: ts.SourceFile, options?: TransformOptions): ts.SourceFile {
  const transformer = new ASTTransformer(options);
  return transformer.transform(sourceFile);
}
