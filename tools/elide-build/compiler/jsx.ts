/**
 * JSX Transformer
 *
 * Transforms JSX/TSX to JavaScript:
 * - React classic runtime (createElement)
 * - React automatic runtime (jsx/jsxs)
 * - Custom pragma support
 * - Fragment support
 */

import { CompileResult, Diagnostic } from "./index";

export interface JSXOptions {
  runtime?: "classic" | "automatic";
  pragma?: string;
  pragmaFrag?: string;
  importSource?: string;
}

export class JSXTransformer {
  private options: Required<JSXOptions>;
  private diagnostics: Diagnostic[] = [];

  constructor(options: JSXOptions = {}) {
    this.options = {
      runtime: options.runtime || "classic",
      pragma: options.pragma || "React.createElement",
      pragmaFrag: options.pragmaFrag || "React.Fragment",
      importSource: options.importSource || "react",
    };
  }

  /**
   * Transform JSX code
   */
  async transform(code: string, filename: string): Promise<CompileResult> {
    try {
      let transformed = code;

      // Add imports for automatic runtime
      if (this.options.runtime === "automatic") {
        transformed = this.addAutomaticRuntimeImports(transformed);
      }

      // Transform JSX elements
      transformed = this.transformJSXElements(transformed);

      // Transform JSX fragments
      transformed = this.transformFragments(transformed);

      // Transform JSX spread attributes
      transformed = this.transformSpreadAttributes(transformed);

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
   * Add imports for automatic runtime
   */
  private addAutomaticRuntimeImports(code: string): string {
    if (!code.includes("import {") || !code.includes("from '" + this.options.importSource)) {
      return `import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from '${this.options.importSource}/jsx-runtime';\n` + code;
    }
    return code;
  }

  /**
   * Transform JSX elements
   */
  private transformJSXElements(code: string): string {
    // Match JSX elements: <Component prop="value">children</Component>
    const jsxRegex = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;

    return code.replace(jsxRegex, (match, tag, attrs, children) => {
      const props = this.parseAttributes(attrs);
      const childrenCode = this.transformChildren(children);

      if (this.options.runtime === "automatic") {
        const hasChildren = childrenCode.length > 0;
        const jsxFunc = hasChildren ? "_jsxs" : "_jsx";

        return `${jsxFunc}("${tag}", ${this.generatePropsObject(props, childrenCode)})`;
      } else {
        const args = [`"${tag}"`, this.generatePropsObject(props)];

        if (childrenCode.length > 0) {
          args.push(...childrenCode);
        }

        return `${this.options.pragma}(${args.join(", ")})`;
      }
    });
  }

  /**
   * Transform JSX fragments
   */
  private transformFragments(code: string): string {
    // Match fragments: <>children</>
    const fragmentRegex = /<>([^<]*)<\/>/g;

    return code.replace(fragmentRegex, (match, children) => {
      const childrenCode = this.transformChildren(children);

      if (this.options.runtime === "automatic") {
        return `_jsx(_Fragment, { children: [${childrenCode.join(", ")}] })`;
      } else {
        return `${this.options.pragma}(${this.options.pragmaFrag}, null, ${childrenCode.join(", ")})`;
      }
    });
  }

  /**
   * Transform spread attributes
   */
  private transformSpreadAttributes(code: string): string {
    // Handle {...spread} attributes
    return code;
  }

  /**
   * Parse JSX attributes
   */
  private parseAttributes(attrs: string): Record<string, string> {
    const props: Record<string, string> = {};

    if (!attrs.trim()) {
      return props;
    }

    // Match attribute="value" or attribute={expression}
    const attrRegex = /(\w+)(?:="([^"]*)"|={([^}]*)})?/g;
    let match;

    while ((match = attrRegex.exec(attrs)) !== null) {
      const name = match[1];
      const stringValue = match[2];
      const exprValue = match[3];

      if (stringValue !== undefined) {
        props[name] = `"${stringValue}"`;
      } else if (exprValue !== undefined) {
        props[name] = exprValue;
      } else {
        props[name] = "true";
      }
    }

    return props;
  }

  /**
   * Transform children
   */
  private transformChildren(children: string): string[] {
    if (!children.trim()) {
      return [];
    }

    const result: string[] = [];

    // Split by JSX elements
    const parts = children.split(/(<\w+[^>]*>.*?<\/\w+>)/gs);

    for (const part of parts) {
      if (part.trim()) {
        if (part.startsWith("<")) {
          // It's a JSX element
          result.push(this.transformJSXElements(part));
        } else {
          // It's text content or expression
          if (part.includes("{")) {
            // Expression
            const exprMatch = part.match(/{([^}]+)}/);
            if (exprMatch) {
              result.push(exprMatch[1]);
            }
          } else {
            // Text
            const text = part.trim();
            if (text) {
              result.push(`"${text}"`);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Generate props object
   */
  private generatePropsObject(props: Record<string, string>, children?: string[]): string {
    const entries = Object.entries(props);

    if (entries.length === 0 && (!children || children.length === 0)) {
      return "null";
    }

    let obj = "{ ";

    for (const [key, value] of entries) {
      obj += `${key}: ${value}, `;
    }

    if (children && children.length > 0) {
      if (children.length === 1) {
        obj += `children: ${children[0]}, `;
      } else {
        obj += `children: [${children.join(", ")}], `;
      }
    }

    obj += "}";

    return obj;
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
