/**
 * clsx - Tiny className Utility
 *
 * Tiny (228B) utility for constructing className strings.
 * **POLYGLOT SHOWCASE**: Micro utilities for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/clsx (~5M+ downloads/week)
 *
 * Features:
 * - Tiny size (228 bytes)
 * - Fast performance
 * - Conditional classes
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Minimal overhead everywhere
 * - Use in Python, Ruby, Java via Elide
 * - ONE micro utility for all platforms
 *
 * Use cases:
 * - React components
 * - Class concatenation
 * - Conditional styling
 * - Performance-critical apps
 *
 * Package has ~5M+ downloads/week on npm!
 */

type ClassValue = ClassArray | ClassDictionary | string | number | null | boolean | undefined;
type ClassDictionary = Record<string, any>;
type ClassArray = ClassValue[];

export function clsx(...args: ClassValue[]): string {
  let str = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    const type = typeof arg;

    if (type === 'string' || type === 'number') {
      if (str) str += ' ';
      str += arg;
    } else if (Array.isArray(arg)) {
      const inner = clsx(...arg);
      if (inner) {
        if (str) str += ' ';
        str += inner;
      }
    } else if (type === 'object') {
      for (const key in arg as ClassDictionary) {
        if ((arg as ClassDictionary)[key]) {
          if (str) str += ' ';
          str += key;
        }
      }
    }
  }

  return str;
}

export default clsx;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⚡ clsx - Tiny className Utility (POLYGLOT!)\n");

  console.log("=== Example 1: Basic ===");
  console.log(clsx('foo', 'bar'));
  console.log();

  console.log("=== Example 2: Conditional ===");
  console.log(clsx('foo', true && 'bar', false && 'baz'));
  console.log();

  console.log("=== Example 3: Object ===");
  console.log(clsx({ foo: true, bar: false, baz: true }));
  console.log();

  console.log("=== Example 4: Mixed ===");
  const isActive = true;
  console.log(clsx('btn', { active: isActive, disabled: false }));
  console.log();

  console.log("=== Example 5: Arrays ===");
  console.log(clsx(['foo', 'bar'], 'baz'));
  console.log();

  console.log("=== Example 6: React Pattern ===");
  function Button(props: any) {
    return clsx('btn', props.primary && 'btn-primary', props.className);
  }
  console.log(Button({ primary: true, className: 'custom' }));
  console.log();

  console.log("🌐 Tiny (228B) utility for all languages!");
  console.log("  ✓ ~5M+ downloads/week on npm");
  console.log("  ✓ Faster than classnames");
}
