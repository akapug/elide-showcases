/**
 * Ruby Compiler
 *
 * Compiles Ruby to JavaScript for Elide:
 * - Class transformation
 * - Method definitions
 * - Blocks and iterators
 * - Symbols
 */

import { CompileResult, Diagnostic } from "./index";

export class RubyCompiler {
  private diagnostics: Diagnostic[] = [];

  /**
   * Compile Ruby code to JavaScript
   */
  async compile(code: string, filename: string): Promise<CompileResult> {
    try {
      let transformed = code;

      // Transform Ruby syntax to JavaScript
      transformed = this.transformClasses(transformed);
      transformed = this.transformMethods(transformed);
      transformed = this.transformBlocks(transformed);
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
   * Transform Ruby classes
   */
  private transformClasses(code: string): string {
    // class Name -> class Name {
    let result = code.replace(/class\s+(\w+)(?:\s*<\s*(\w+))?/g, (match, name, base) => {
      if (base) {
        return `class ${name} extends ${base} {`;
      }
      return `class ${name} {`;
    });

    // end -> }
    result = result.replace(/\bend\b/g, "}");

    // @instance_var -> this.instance_var
    result = result.replace(/@(\w+)/g, "this.$1");

    return result;
  }

  /**
   * Transform Ruby methods
   */
  private transformMethods(code: string): string {
    // def name(params) -> name(params) {
    let result = code.replace(/def\s+(\w+)(?:\(([^)]*)\))?/g, (match, name, params) => {
      return `${name}(${params || ""}) {`;
    });

    return result;
  }

  /**
   * Transform blocks
   */
  private transformBlocks(code: string): string {
    let result = code;

    // do |params| -> (params) => {
    result = result.replace(/do\s*\|([^|]*)\|/g, "($1) => {");

    // { |params| -> (params) => {
    result = result.replace(/{\s*\|([^|]*)\|/g, "($1) => {");

    return result;
  }

  /**
   * Transform control flow
   */
  private transformControlFlow(code: string): string {
    let result = code;

    // if condition -> if (condition) {
    result = result.replace(/if\s+([^\n]+)/g, "if ($1) {");

    // elsif -> } else if
    result = result.replace(/elsif\s+([^\n]+)/g, "} else if ($1) {");

    // else -> } else {
    result = result.replace(/\belse\b/g, "} else {");

    // unless condition -> if (!(condition)) {
    result = result.replace(/unless\s+([^\n]+)/g, "if (!($1)) {");

    // while condition -> while (condition) {
    result = result.replace(/while\s+([^\n]+)/g, "while ($1) {");

    // until condition -> while (!(condition)) {
    result = result.replace(/until\s+([^\n]+)/g, "while (!($1)) {");

    return result;
  }

  /**
   * Transform data structures
   */
  private transformDataStructures(code: string): string {
    let result = code;

    // Symbols: :symbol -> "symbol"
    result = result.replace(/:(\w+)/g, '"$1"');

    // Hash syntax: { key: value } (already valid JS)
    // Array syntax: [1, 2, 3] (already valid JS)

    // nil -> null
    result = result.replace(/\bnil\b/g, "null");

    // true/false (already valid JS)

    return result;
  }

  /**
   * Transform operators
   */
  private transformOperators(code: string): string {
    let result = code;

    // && and || (already valid JS)

    // ! (already valid JS)

    // String interpolation: "hello #{name}" -> `hello ${name}`
    result = result.replace(/"([^"]*#{[^}]+}[^"]*)"/g, (match, content) => {
      const transformed = content.replace(/#\{([^}]+)\}/g, "${$1}");
      return `\`${transformed}\``;
    });

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
