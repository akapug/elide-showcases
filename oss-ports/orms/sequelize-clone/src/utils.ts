/**
 * Utility functions
 */

export class Utils {
  static camelizeIf(str: string, condition: boolean): string {
    return condition ? this.camelize(str) : str;
  }

  static camelize(str: string): string {
    return str.replace(/[_-](\w)/g, (_, c) => c ? c.toUpperCase() : '');
  }

  static underscoredIf(str: string, condition: boolean): string {
    return condition ? this.underscore(str) : str;
  }

  static underscore(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  static pluralize(str: string): string {
    return str + 's'; // Simple implementation
  }

  static singularize(str: string): string {
    return str.endsWith('s') ? str.slice(0, -1) : str;
  }
}
