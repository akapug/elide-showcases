/**
 * Elide require-from-string - Require from String
 * NPM Package: require-from-string | Weekly Downloads: ~40,000,000 | License: MIT
 */

export default function requireFromString(code: string, filename?: string): any {
  const module = { exports: {} };
  const require = (id: string) => {
    return globalThis.require?.(id);
  };
  
  try {
    const fn = new Function('module', 'exports', 'require', '__filename', '__dirname', code);
    fn(module, module.exports, require, filename || 'eval.js', '.');
    return module.exports;
  } catch (error) {
    throw new Error(`Failed to require from string: ${${error}}`);
  }
}
