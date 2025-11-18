// type-detect - Type detection for Elide/TypeScript
// Original: https://github.com/chaijs/type-detect
// Zero dependencies - pure TypeScript!

/**
 * Detect the type of a value with support for complex types.
 * Similar to kind-of but with different formatting (PascalCase).
 *
 * @param value - Value to detect type of
 * @returns Type name as PascalCase string
 *
 * @example
 * ```typescript
 * typeDetect([1, 2])       // 'Array'
 * typeDetect(null)         // 'null'
 * typeDetect(new Date())   // 'Date'
 * typeDetect(/regex/)      // 'RegExp'
 * ```
 */
export default function typeDetect(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  if (type === 'boolean') return 'Boolean';
  if (type === 'string') return 'String';
  if (type === 'symbol') return 'Symbol';
  if (type === 'bigint') return 'BigInt';
  if (type === 'function') return 'Function';

  if (type === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    return 'Number';
  }

  // Get constructor name or Object.prototype.toString
  const tag = Object.prototype.toString.call(value).slice(8, -1);
  return tag;
}

// CLI usage
if (import.meta.url.includes("elide-type-detect.ts")) {
  console.log("🔍 type-detect - Type Detection on Elide\n");

  console.log("=== Common Types ===");
  console.log(`typeDetect([1, 2])       = '${typeDetect([1, 2])}'`);
  console.log(`typeDetect({})           = '${typeDetect({})}'`);
  console.log(`typeDetect(null)         = '${typeDetect(null)}'`);
  console.log(`typeDetect(undefined)    = '${typeDetect(undefined)}'`);
  console.log(`typeDetect(42)           = '${typeDetect(42)}'`);
  console.log(`typeDetect(NaN)          = '${typeDetect(NaN)}'`);
  console.log(`typeDetect('hello')      = '${typeDetect('hello')}'`);
  console.log(`typeDetect(true)         = '${typeDetect(true)}'`);
  console.log(`typeDetect(new Date())   = '${typeDetect(new Date())}'`);
  console.log(`typeDetect(/regex/)      = '${typeDetect(/regex/)}'`);
  console.log(`typeDetect(new Error())  = '${typeDetect(new Error())}'`);
  console.log();

  console.log("✅ 40M+ downloads/week on npm");
}
