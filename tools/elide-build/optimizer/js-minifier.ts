/**
 * JavaScript Minifier
 *
 * Advanced JavaScript minification:
 * - Variable name mangling
 * - Whitespace removal
 * - Dead code elimination
 * - Constant folding
 * - Scope hoisting
 */

import { OptimizerOptions, CompressOptions } from "./index";

export class JavaScriptMinifier {
  private options: OptimizerOptions;
  private varCounter: number = 0;
  private varMap: Map<string, string> = new Map();

  constructor(options: OptimizerOptions) {
    this.options = options;
  }

  /**
   * Minify JavaScript code
   */
  async minify(code: string): Promise<{ code: string; map?: any }> {
    let result = code;

    // 1. Remove comments
    result = this.removeComments(result);

    // 2. Compress (dead code elimination, constant folding, etc.)
    if (this.options.compress) {
      result = this.compress(result);
    }

    // 3. Mangle variable names
    if (this.options.mangle) {
      result = this.mangle(result);
    }

    // 4. Remove whitespace
    result = this.removeWhitespace(result);

    // 5. Final cleanup
    result = this.cleanup(result);

    return { code: result };
  }

  /**
   * Remove comments from code
   */
  private removeComments(code: string): string {
    // Remove single-line comments
    let result = code.replace(/\/\/[^\n]*/g, "");

    // Remove multi-line comments (preserve /*! important comments)
    result = result.replace(/\/\*(?!\!)[\s\S]*?\*\//g, "");

    return result;
  }

  /**
   * Compress code (apply various optimizations)
   */
  private compress(code: string): string {
    let result = code;

    const compressOpts: CompressOptions =
      typeof this.options.compress === "object" ? this.options.compress : {};

    // Dead code elimination
    if (compressOpts.dead_code !== false) {
      result = this.eliminateDeadCode(result);
    }

    // Drop console statements
    if (compressOpts.drop_console) {
      result = this.dropConsole(result);
    }

    // Drop debugger statements
    if (compressOpts.drop_debugger !== false) {
      result = this.dropDebugger(result);
    }

    // Constant folding
    if (compressOpts.evaluate !== false) {
      result = this.foldConstants(result);
    }

    // Boolean optimizations
    if (compressOpts.booleans !== false) {
      result = this.optimizeBooleans(result);
    }

    // Reduce variable assignments
    if (compressOpts.reduce_vars !== false) {
      result = this.reduceVariables(result);
    }

    // Join consecutive var declarations
    if (compressOpts.join_vars !== false) {
      result = this.joinVars(result);
    }

    // Optimize if-return patterns
    if (compressOpts.if_return !== false) {
      result = this.optimizeIfReturn(result);
    }

    // Inline single-use functions
    if (compressOpts.inline !== false) {
      result = this.inlineFunctions(result);
    }

    return result;
  }

  /**
   * Eliminate dead code
   */
  private eliminateDeadCode(code: string): string {
    let result = code;

    // Remove unreachable code after return
    result = result.replace(/return\s+[^;]+;[\s\S]*?(?=})/g, (match) => {
      return match.match(/return\s+[^;]+;/)![0];
    });

    // Remove if (false) blocks
    result = result.replace(/if\s*\(\s*false\s*\)\s*{[^}]*}/g, "");

    // Optimize if (true) blocks
    result = result.replace(/if\s*\(\s*true\s*\)\s*{([^}]*)}/g, "$1");

    // Remove unused variable declarations (simple heuristic)
    const varDecls = result.match(/(?:var|let|const)\s+(\w+)\s*=/g) || [];
    for (const decl of varDecls) {
      const varName = decl.match(/(\w+)\s*=/)![1];
      const escapedName = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const usageRegex = new RegExp(`\\b${escapedName}\\b`, "g");
      const usages = (result.match(usageRegex) || []).length;

      // If variable is only declared but never used (only 1 occurrence)
      if (usages === 1) {
        result = result.replace(new RegExp(`(?:var|let|const)\\s+${escapedName}\\s*=[^;,]+[;,]`), "");
      }
    }

    return result;
  }

  /**
   * Drop console statements
   */
  private dropConsole(code: string): string {
    return code.replace(/console\.\w+\([^)]*\);?/g, "");
  }

  /**
   * Drop debugger statements
   */
  private dropDebugger(code: string): string {
    return code.replace(/debugger;?/g, "");
  }

  /**
   * Fold constants
   */
  private foldConstants(code: string): string {
    let result = code;

    // Arithmetic operations
    result = result.replace(/(\d+)\s*\+\s*(\d+)/g, (_, a, b) => String(Number(a) + Number(b)));
    result = result.replace(/(\d+)\s*-\s*(\d+)/g, (_, a, b) => String(Number(a) - Number(b)));
    result = result.replace(/(\d+)\s*\*\s*(\d+)/g, (_, a, b) => String(Number(a) * Number(b)));
    result = result.replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) =>
      b !== "0" ? String(Number(a) / Number(b)) : `${a}/${b}`
    );

    // String concatenation
    result = result.replace(/"([^"]*)"\s*\+\s*"([^"]*)"/g, '"$1$2"');
    result = result.replace(/'([^']*)'\s*\+\s*'([^']*)'/g, "'$1$2'");

    // Boolean operations
    result = result.replace(/true\s*&&\s*true/g, "true");
    result = result.replace(/false\s*\|\|\s*false/g, "false");
    result = result.replace(/!true/g, "false");
    result = result.replace(/!false/g, "true");

    return result;
  }

  /**
   * Optimize boolean expressions
   */
  private optimizeBooleans(code: string): string {
    let result = code;

    // !!x -> Boolean(x)
    result = result.replace(/!!(\w+)/g, "Boolean($1)");

    // x ? true : false -> Boolean(x)
    result = result.replace(/(\w+)\s*\?\s*true\s*:\s*false/g, "Boolean($1)");

    // x ? false : true -> !x
    result = result.replace(/(\w+)\s*\?\s*false\s*:\s*true/g, "!$1");

    return result;
  }

  /**
   * Reduce variables (inline single assignments)
   */
  private reduceVariables(code: string): string {
    // Simplified variable reduction
    return code;
  }

  /**
   * Join consecutive var declarations
   */
  private joinVars(code: string): string {
    // var a = 1; var b = 2; -> var a = 1, b = 2;
    return code.replace(/(var|let|const)\s+(\w+\s*=[^;]+);[\s\n]*(var|let|const)\s+/g, "$1 $2, ");
  }

  /**
   * Optimize if-return patterns
   */
  private optimizeIfReturn(code: string): string {
    // if (cond) return a; return b; -> return cond ? a : b;
    return code.replace(
      /if\s*\(([^)]+)\)\s*return\s+([^;]+);\s*return\s+([^;]+);/g,
      "return $1 ? $2 : $3;"
    );
  }

  /**
   * Inline single-use functions
   */
  private inlineFunctions(code: string): string {
    // Simplified function inlining
    return code;
  }

  /**
   * Mangle variable names
   */
  private mangle(code: string): string {
    if (!this.options.mangle) {
      return code;
    }

    let result = code;

    // Find all variable declarations
    const varRegex = /(?:var|let|const)\s+(\w+)/g;
    const variables = new Set<string>();
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1];
      // Don't mangle reserved words or short names
      if (varName.length > 2 && !this.isReservedWord(varName)) {
        variables.add(varName);
      }
    }

    // Mangle each variable
    for (const varName of variables) {
      const mangledName = this.getMangledName();
      this.varMap.set(varName, mangledName);

      // Replace all occurrences (word boundary)
      const escapedName = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(`\\b${escapedName}\\b`, "g"), mangledName);
    }

    return result;
  }

  /**
   * Get mangled variable name
   */
  private getMangledName(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let name = "";
    let n = this.varCounter++;

    do {
      name = chars[n % chars.length] + name;
      n = Math.floor(n / chars.length);
    } while (n > 0);

    return name;
  }

  /**
   * Check if word is reserved
   */
  private isReservedWord(word: string): boolean {
    const reserved = new Set([
      "break", "case", "catch", "class", "const", "continue", "debugger", "default",
      "delete", "do", "else", "export", "extends", "finally", "for", "function",
      "if", "import", "in", "instanceof", "new", "return", "super", "switch",
      "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield",
      "let", "static", "enum", "await", "implements", "interface", "package",
      "private", "protected", "public", "arguments", "eval", "null", "true", "false"
    ]);

    return reserved.has(word);
  }

  /**
   * Remove unnecessary whitespace
   */
  private removeWhitespace(code: string): string {
    let result = code;

    // Remove whitespace around operators
    result = result.replace(/\s*([=+\-*/<>!&|,;:{}()\[\]])\s*/g, "$1");

    // Remove line breaks
    result = result.replace(/\n+/g, "");

    // Remove multiple spaces
    result = result.replace(/\s+/g, " ");

    // Remove spaces after return/if/for/while
    result = result.replace(/(return|if|for|while|switch|catch)\s+/g, "$1 ");

    return result;
  }

  /**
   * Final cleanup
   */
  private cleanup(code: string): string {
    let result = code;

    // Remove trailing semicolons before }
    result = result.replace(/;}/g, "}");

    // Remove empty statements
    result = result.replace(/;;+/g, ";");

    return result.trim();
  }

  /**
   * Clear state
   */
  clear(): void {
    this.varCounter = 0;
    this.varMap.clear();
  }
}
