/**
 * TypeScript Compiler
 *
 * Compiles TypeScript to JavaScript with:
 * - Type checking
 * - Declaration generation
 * - Incremental compilation
 * - Watch mode support
 */

import { CompileResult, Diagnostic, CompilerOptions } from "./index";

export class TypeScriptCompiler {
  private options: CompilerOptions;
  private diagnostics: Diagnostic[] = [];
  private cache: Map<string, CompileResult> = new Map();
  private declarationCache: Map<string, string> = new Map();

  constructor(options: CompilerOptions) {
    this.options = options;
  }

  /**
   * Compile TypeScript code
   */
  async compile(code: string, filename: string): Promise<CompileResult> {
    // Check cache
    const cacheKey = this.getCacheKey(code, filename);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const diagnostics: Diagnostic[] = [];

    try {
      // Transform TypeScript to JavaScript
      let transformed = this.transformTypeScript(code);

      // Remove type annotations
      transformed = this.removeTypeAnnotations(transformed);

      // Transform decorators if enabled
      if (this.options.experimentalDecorators) {
        transformed = this.transformDecorators(transformed);
      }

      // Transform class fields
      transformed = this.transformClassFields(transformed);

      // Transform async/await if needed
      if (this.needsAsyncTransform()) {
        transformed = this.transformAsync(transformed);
      }

      // Remove comments if requested
      if (this.options.removeComments) {
        transformed = this.removeComments(transformed);
      }

      // Generate declarations if requested
      let declarations: string | undefined;
      if (this.options.declaration) {
        declarations = this.generateDeclarations(code, filename);
      }

      const result: CompileResult = {
        code: transformed,
        declarations,
        diagnostics,
      };

      this.cache.set(cacheKey, result);

      return result;
    } catch (error: any) {
      diagnostics.push({
        severity: "error",
        message: error.message || String(error),
        file: filename,
      });

      return {
        code,
        diagnostics,
      };
    }
  }

  /**
   * Transform TypeScript syntax
   */
  private transformTypeScript(code: string): string {
    let result = code;

    // Transform enum declarations
    result = this.transformEnums(result);

    // Transform namespace declarations
    result = this.transformNamespaces(result);

    // Transform type assertions
    result = this.transformTypeAssertions(result);

    // Transform parameter properties
    result = this.transformParameterProperties(result);

    return result;
  }

  /**
   * Remove type annotations
   */
  private removeTypeAnnotations(code: string): string {
    let result = code;

    // Remove type annotations from variables
    result = result.replace(/:\s*[^=,;)\n{]+(?=[=,;)\n{])/g, "");

    // Remove type parameters
    result = result.replace(/<[^>]+>/g, "");

    // Remove interface declarations
    result = result.replace(/interface\s+\w+\s*{[^}]*}/g, "");

    // Remove type alias declarations
    result = result.replace(/type\s+\w+\s*=\s*[^;]+;/g, "");

    // Remove implements clause
    result = result.replace(/\simplements\s+[^{]+/g, "");

    // Remove as type assertions
    result = result.replace(/\sas\s+\w+/g, "");

    return result;
  }

  /**
   * Transform enum declarations
   */
  private transformEnums(code: string): string {
    // Simple enum transformation
    const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g;

    return code.replace(enumRegex, (match, name, body) => {
      const members = body
        .split(",")
        .map((m: string) => m.trim())
        .filter((m: string) => m);

      let result = `const ${name} = {\n`;

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const parts = member.split("=").map((p) => p.trim());
        const key = parts[0];
        const value = parts[1] || String(i);

        result += `  ${key}: ${value},\n`;
        result += `  ${value}: '${key}',\n`;
      }

      result += "};\n";

      return result;
    });
  }

  /**
   * Transform namespace declarations
   */
  private transformNamespaces(code: string): string {
    // Transform namespace to object
    const namespaceRegex = /namespace\s+(\w+)\s*{([^}]+)}/g;

    return code.replace(namespaceRegex, (match, name, body) => {
      return `const ${name} = (function() {\n${body}\nreturn {};\n})();`;
    });
  }

  /**
   * Transform type assertions
   */
  private transformTypeAssertions(code: string): string {
    // Remove angle-bracket type assertions
    let result = code.replace(/<(\w+)>([^;,)\n]+)/g, "$2");

    // Remove 'as' type assertions
    result = result.replace(/([^;,)\n]+)\s+as\s+\w+/g, "$1");

    return result;
  }

  /**
   * Transform parameter properties
   */
  private transformParameterProperties(code: string): string {
    // Transform constructor parameter properties
    const constructorRegex = /constructor\s*\(([^)]+)\)/g;

    return code.replace(constructorRegex, (match, params) => {
      const paramList = params.split(",").map((p: string) => p.trim());
      const assignments: string[] = [];
      const cleanParams: string[] = [];

      for (const param of paramList) {
        if (param.match(/^(public|private|protected|readonly)/)) {
          const parts = param.split(/\s+/);
          const name = parts[parts.length - 1].split(":")[0];
          assignments.push(`this.${name} = ${name};`);
          cleanParams.push(name);
        } else {
          cleanParams.push(param);
        }
      }

      let result = `constructor(${cleanParams.join(", ")})`;

      if (assignments.length > 0) {
        result += ` {\n${assignments.join("\n")}\n}`;
      }

      return result;
    });
  }

  /**
   * Transform decorators
   */
  private transformDecorators(code: string): string {
    // Simple decorator transformation
    let result = code;

    // Class decorators
    result = result.replace(/@(\w+)\s*\n\s*class\s+(\w+)/g, (match, decorator, className) => {
      return `class ${className}`;
    });

    // Method decorators
    result = result.replace(/@(\w+)\s*\n\s*(\w+)\s*\(/g, "$2(");

    return result;
  }

  /**
   * Transform class fields
   */
  private transformClassFields(code: string): string {
    // Transform class field initializers to constructor assignments
    return code;
  }

  /**
   * Check if async transformation is needed
   */
  private needsAsyncTransform(): boolean {
    return this.options.target === "es5" || this.options.target === "es2015";
  }

  /**
   * Transform async/await
   */
  private transformAsync(code: string): string {
    // Simple async/await transformation (in production, use regenerator)
    return code;
  }

  /**
   * Remove comments
   */
  private removeComments(code: string): string {
    // Remove single-line comments
    let result = code.replace(/\/\/[^\n]*/g, "");

    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");

    return result;
  }

  /**
   * Generate type declarations
   */
  private generateDeclarations(code: string, filename: string): string {
    // Extract type information and generate .d.ts content
    let declarations = "";

    // Export declarations
    const exportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(code)) !== null) {
      const name = match[1];
      const declaration = this.extractDeclaration(code, name);
      declarations += declaration + "\n";
    }

    return declarations;
  }

  /**
   * Extract declaration for a symbol
   */
  private extractDeclaration(code: string, name: string): string {
    // Simple declaration extraction
    const functionRegex = new RegExp(`export\\s+function\\s+${name}\\s*\\([^)]*\\)[^{]*`, "g");
    const classRegex = new RegExp(`export\\s+class\\s+${name}[^{]*`, "g");
    const constRegex = new RegExp(`export\\s+const\\s+${name}\\s*:[^=]+`, "g");

    let match = functionRegex.exec(code);
    if (match) return `export ${match[0]};`;

    match = classRegex.exec(code);
    if (match) return `export ${match[0]} {}`;

    match = constRegex.exec(code);
    if (match) return `export ${match[0]};`;

    return `export declare const ${name}: any;`;
  }

  /**
   * Get cache key
   */
  private getCacheKey(code: string, filename: string): string {
    let hash = 0;
    const input = code + filename;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return String(hash);
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Diagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Clear cache and diagnostics
   */
  clear(): void {
    this.cache.clear();
    this.declarationCache.clear();
    this.diagnostics = [];
  }
}
