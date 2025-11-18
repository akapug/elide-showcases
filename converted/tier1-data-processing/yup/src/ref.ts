/**
 * Yup Reference Implementation
 * Supports cross-field validation
 */

export class Reference {
  readonly key: string;
  readonly options: { path?: string };

  constructor(key: string, options: { path?: string } = {}) {
    this.key = key;
    this.options = options;
  }

  getValue(parent: any, context?: any): any {
    const path = this.options.path || this.key;
    return this.resolvePath(parent, path, context);
  }

  private resolvePath(obj: any, path: string, context?: any): any {
    // Handle context references ($context.key)
    if (path.startsWith('$')) {
      const contextPath = path.slice(1);
      return this.getNestedValue(context, contextPath);
    }

    // Handle relative paths
    return this.getNestedValue(obj, path);
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  cast(value: any, parent: any, context?: any): any {
    return this.getValue(parent, context);
  }

  toString(): string {
    return `Ref(${this.key})`;
  }

  static isRef(value: any): value is Reference {
    return value instanceof Reference;
  }
}

export function ref(key: string, options?: { path?: string }): Reference {
  return new Reference(key, options);
}
