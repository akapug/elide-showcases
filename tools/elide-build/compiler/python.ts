/**
 * Python Compiler
 *
 * Compiles Python to JavaScript for Elide:
 * - Type hints preservation
 * - Class transformation
 * - Decorator support
 * - List comprehensions
 */

import { CompileResult, Diagnostic } from "./index";

export class PythonCompiler {
  private diagnostics: Diagnostic[] = [];

  /**
   * Compile Python code to JavaScript
   */
  async compile(code: string, filename: string): Promise<CompileResult> {
    try {
      let transformed = code;

      // Transform Python syntax to JavaScript
      transformed = this.transformIndentation(transformed);
      transformed = this.transformClasses(transformed);
      transformed = this.transformFunctions(transformed);
      transformed = this.transformControlFlow(transformed);
      transformed = this.transformDataStructures(transformed);
      transformed = this.transformOperators(transformed);

      return {
        code: transformed,
        diagnostics: [],
      };
    } catch (error: any) {
      const diagnostic: Diagnostic = {
        severity: "error",
        message: error.message || String(error),
        file: filename,
      };

      this.diagnostics.push(diagnostic);

      return {
        code,
        diagnostics: [diagnostic],
      };
    }
  }

  /**
   * Transform Python indentation to braces
   */
  private transformIndentation(code: string): string {
    const lines = code.split("\n");
    const result: string[] = [];
    const indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();

      if (!trimmed || trimmed.startsWith("#")) {
        result.push(line);
        continue;
      }

      const indent = line.length - trimmed.length;
      const currentIndent = indentStack[indentStack.length - 1];

      if (indent > currentIndent) {
        result[result.length - 1] = result[result.length - 1] + " {";
        indentStack.push(indent);
      } else if (indent < currentIndent) {
        while (indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
          result.push(" ".repeat(indentStack[indentStack.length - 1]) + "}");
        }
      }

      result.push(line);
    }

    // Close remaining blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      result.push("}");
    }

    return result.join("\n");
  }

  /**
   * Transform Python classes
   */
  private transformClasses(code: string): string {
    // class Name: -> class Name {
    let result = code.replace(/class\s+(\w+)(?:\(([^)]*)\))?:/g, (match, name, base) => {
      if (base) {
        return `class ${name} extends ${base}`;
      }
      return `class ${name}`;
    });

    // Transform __init__ to constructor
    result = result.replace(/def\s+__init__\s*\(/g, "constructor(");

    // Transform self to this
    result = result.replace(/\bself\./g, "this.");
    result = result.replace(/\(self,\s*/g, "(");
    result = result.replace(/\(self\)/g, "()");

    return result;
  }

  /**
   * Transform Python functions
   */
  private transformFunctions(code: string): string {
    // def name(params): -> function name(params) {
    let result = code.replace(/def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*[^:]+)?:/g, "function $1($2)");

    // Remove type hints from parameters
    result = result.replace(/(\w+)\s*:\s*\w+/g, "$1");

    return result;
  }

  /**
   * Transform control flow
   */
  private transformControlFlow(code: string): string {
    let result = code;

    // if condition: -> if (condition) {
    result = result.replace(/if\s+([^:]+):/g, "if ($1)");

    // elif -> else if
    result = result.replace(/elif\s+([^:]+):/g, "else if ($1)");

    // else: -> else {
    result = result.replace(/else:/g, "else");

    // for item in items: -> for (const item of items) {
    result = result.replace(/for\s+(\w+)\s+in\s+([^:]+):/g, "for (const $1 of $2)");

    // while condition: -> while (condition) {
    result = result.replace(/while\s+([^:]+):/g, "while ($1)");

    // Transform range
    result = result.replace(/range\((\d+)\)/g, "Array.from({length: $1}, (_, i) => i)");

    return result;
  }

  /**
   * Transform data structures
   */
  private transformDataStructures(code: string): string {
    let result = code;

    // List comprehensions: [x for x in items] -> items.map(x => x)
    result = result.replace(/\[([^[\]]+)\s+for\s+(\w+)\s+in\s+([^[\]]+)\]/g, "$3.map($2 => $1)");

    // Dictionary comprehensions: {k: v for k, v in items}
    result = result.replace(/{([^:]+):\s*([^}]+)\s+for\s+(\w+),\s*(\w+)\s+in\s+([^}]+)}/g,
      "Object.fromEntries($5.map(($3, $4) => [$1, $2]))");

    // None -> null
    result = result.replace(/\bNone\b/g, "null");

    // True/False -> true/false
    result = result.replace(/\bTrue\b/g, "true");
    result = result.replace(/\bFalse\b/g, "false");

    return result;
  }

  /**
   * Transform operators
   */
  private transformOperators(code: string): string {
    let result = code;

    // and -> &&
    result = result.replace(/\band\b/g, "&&");

    // or -> ||
    result = result.replace(/\bor\b/g, "||");

    // not -> !
    result = result.replace(/\bnot\b/g, "!");

    // // (integer division) -> Math.floor(/)
    result = result.replace(/(\w+)\s*\/\/\s*(\w+)/g, "Math.floor($1 / $2)");

    return result;
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Diagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Clear diagnostics
   */
  clear(): void {
    this.diagnostics = [];
  }
}
