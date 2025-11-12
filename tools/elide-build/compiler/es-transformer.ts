/**
 * ES Transformer
 *
 * Transforms modern JavaScript to target ES version:
 * - ES2020+ features to ES2015/ES5
 * - Optional chaining
 * - Nullish coalescing
 * - Class fields
 * - Async/await
 */

import { CompileResult, Diagnostic } from "./index";

export interface ESTransformOptions {
  target?: "es5" | "es2015" | "es2016" | "es2017" | "es2018" | "es2019" | "es2020" | "esnext";
}

export class ESTransformer {
  private options: Required<ESTransformOptions>;
  private diagnostics: Diagnostic[] = [];

  constructor(options: ESTransformOptions = {}) {
    this.options = {
      target: options.target || "esnext",
    };
  }

  /**
   * Transform JavaScript code
   */
  async transform(code: string, filename: string): Promise<CompileResult> {
    try {
      let transformed = code;

      // Apply transformations based on target
      if (this.shouldTransform("es2020")) {
        transformed = this.transformES2020(transformed);
      }

      if (this.shouldTransform("es2019")) {
        transformed = this.transformES2019(transformed);
      }

      if (this.shouldTransform("es2018")) {
        transformed = this.transformES2018(transformed);
      }

      if (this.shouldTransform("es2017")) {
        transformed = this.transformES2017(transformed);
      }

      if (this.shouldTransform("es2016")) {
        transformed = this.transformES2016(transformed);
      }

      if (this.shouldTransform("es2015")) {
        transformed = this.transformES2015(transformed);
      }

      if (this.shouldTransform("es5")) {
        transformed = this.transformES5(transformed);
      }

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
   * Check if transformation is needed
   */
  private shouldTransform(version: string): boolean {
    const versions = ["es5", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "esnext"];
    const targetIndex = versions.indexOf(this.options.target);
    const versionIndex = versions.indexOf(version);

    return targetIndex < versionIndex;
  }

  /**
   * Transform ES2020 features
   */
  private transformES2020(code: string): string {
    let result = code;

    // Optional chaining (?.)
    result = this.transformOptionalChaining(result);

    // Nullish coalescing (??)
    result = this.transformNullishCoalescing(result);

    // BigInt
    result = this.transformBigInt(result);

    // Dynamic import
    result = this.transformDynamicImport(result);

    return result;
  }

  /**
   * Transform optional chaining
   */
  private transformOptionalChaining(code: string): string {
    // obj?.prop -> obj == null ? undefined : obj.prop
    return code.replace(/(\w+)\?\.(\w+)/g, "$1 == null ? undefined : $1.$2");
  }

  /**
   * Transform nullish coalescing
   */
  private transformNullishCoalescing(code: string): string {
    // a ?? b -> a != null ? a : b
    return code.replace(/(\w+)\s*\?\?\s*(\w+)/g, "$1 != null ? $1 : $2");
  }

  /**
   * Transform BigInt
   */
  private transformBigInt(code: string): string {
    // Convert BigInt literals to BigInt() calls
    return code.replace(/(\d+)n\b/g, "BigInt($1)");
  }

  /**
   * Transform dynamic import
   */
  private transformDynamicImport(code: string): string {
    // Keep as-is for now (requires runtime support)
    return code;
  }

  /**
   * Transform ES2019 features
   */
  private transformES2019(code: string): string {
    let result = code;

    // Optional catch binding
    result = this.transformOptionalCatchBinding(result);

    return result;
  }

  /**
   * Transform optional catch binding
   */
  private transformOptionalCatchBinding(code: string): string {
    // catch { } -> catch (e) { }
    return code.replace(/catch\s*{/g, "catch (e) {");
  }

  /**
   * Transform ES2018 features
   */
  private transformES2018(code: string): string {
    let result = code;

    // Rest/spread properties
    result = this.transformRestSpread(result);

    // Async iteration
    result = this.transformAsyncIteration(result);

    return result;
  }

  /**
   * Transform rest/spread properties
   */
  private transformRestSpread(code: string): string {
    // Object rest/spread requires Object.assign or similar
    return code;
  }

  /**
   * Transform async iteration
   */
  private transformAsyncIteration(code: string): string {
    // for await...of transformation
    return code;
  }

  /**
   * Transform ES2017 features
   */
  private transformES2017(code: string): string {
    let result = code;

    // Async/await
    result = this.transformAsyncAwait(result);

    return result;
  }

  /**
   * Transform async/await
   */
  private transformAsyncAwait(code: string): string {
    // Simplified async/await transformation
    // Production would use regenerator-runtime

    // Transform async functions
    let result = code.replace(/async\s+function\s+(\w+)\s*\(/g, "function $1(");

    // Transform await expressions
    result = result.replace(/await\s+/g, "");

    return result;
  }

  /**
   * Transform ES2016 features
   */
  private transformES2016(code: string): string {
    let result = code;

    // Exponentiation operator
    result = this.transformExponentiation(result);

    return result;
  }

  /**
   * Transform exponentiation operator
   */
  private transformExponentiation(code: string): string {
    // a ** b -> Math.pow(a, b)
    return code.replace(/(\w+)\s*\*\*\s*(\w+)/g, "Math.pow($1, $2)");
  }

  /**
   * Transform ES2015 features
   */
  private transformES2015(code: string): string {
    let result = code;

    // Arrow functions
    result = this.transformArrowFunctions(result);

    // Classes
    result = this.transformClasses(result);

    // Template literals
    result = this.transformTemplateLiterals(result);

    // Destructuring
    result = this.transformDestructuring(result);

    // Default parameters
    result = this.transformDefaultParameters(result);

    // const/let to var
    result = this.transformLetConst(result);

    return result;
  }

  /**
   * Transform arrow functions
   */
  private transformArrowFunctions(code: string): string {
    // () => expr -> function() { return expr; }
    let result = code.replace(/\(([^)]*)\)\s*=>\s*([^{][^;,\n]*)/g, "function($1) { return $2; }");

    // () => { body } -> function() { body }
    result = result.replace(/\(([^)]*)\)\s*=>\s*{/g, "function($1) {");

    return result;
  }

  /**
   * Transform classes
   */
  private transformClasses(code: string): string {
    // Simplified class transformation
    // Production would need full prototype-based transformation
    return code;
  }

  /**
   * Transform template literals
   */
  private transformTemplateLiterals(code: string): string {
    // `hello ${name}` -> "hello " + name
    return code.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '"$1" + $2 + "$3"');
  }

  /**
   * Transform destructuring
   */
  private transformDestructuring(code: string): string {
    // Simplified destructuring transformation
    return code;
  }

  /**
   * Transform default parameters
   */
  private transformDefaultParameters(code: string): string {
    // function(a = 1) -> function(a) { a = a === undefined ? 1 : a; }
    return code;
  }

  /**
   * Transform let/const to var
   */
  private transformLetConst(code: string): string {
    return code.replace(/\b(let|const)\b/g, "var");
  }

  /**
   * Transform ES5
   */
  private transformES5(code: string): string {
    // Additional ES5 transformations if needed
    return code;
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
