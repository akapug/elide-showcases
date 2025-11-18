/**
 * classnames - Conditional className Helper
 *
 * Simple utility for conditionally joining classNames.
 * **POLYGLOT SHOWCASE**: Class utilities for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/classnames (~10M+ downloads/week)
 *
 * Features:
 * - Conditional classes
 * - Array support
 * - Object support
 * - Nested arrays
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Use in Python, Ruby, Java via Elide
 * - ONE class utility everywhere
 * - Share UI logic across languages
 *
 * Use cases:
 * - React className props
 * - Conditional styling
 * - Dynamic class lists
 * - Component libraries
 *
 * Package has ~10M+ downloads/week on npm - essential utility!
 */

type ClassValue =
  | string
  | number
  | ClassDictionary
  | ClassArray
  | undefined
  | null
  | boolean;

interface ClassDictionary {
  [id: string]: any;
}

interface ClassArray extends Array<ClassValue> {}

export function classNames(...args: ClassValue[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    const argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = classNames(...arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (argType === 'object') {
      const obj = arg as ClassDictionary;
      for (const key in obj) {
        if (obj[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

export default classNames;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🏷️  classnames - Conditional Classes (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Usage ===");
  const basic = classNames('foo', 'bar');
  console.log("Result:", basic);
  console.log();

  console.log("=== Example 2: Conditional Classes ===");
  const conditional = classNames('foo', null, undefined, 'bar', false);
  console.log("Result:", conditional);
  console.log();

  console.log("=== Example 3: Object Notation ===");
  const isActive = true;
  const hasError = false;

  const object = classNames({
    'btn': true,
    'btn-active': isActive,
    'btn-error': hasError,
    'btn-primary': true
  });
  console.log("Result:", object);
  console.log();

  console.log("=== Example 4: Mixed Usage ===");
  const mixed = classNames('btn', {
    'btn-active': isActive,
    'btn-disabled': false
  }, 'custom-class');
  console.log("Result:", mixed);
  console.log();

  console.log("=== Example 5: Array Support ===");
  const array = classNames(['foo', 'bar'], 'baz');
  console.log("Result:", array);
  console.log();

  console.log("=== Example 6: Nested Arrays ===");
  const nested = classNames(['foo', ['bar', 'baz']], 'qux');
  console.log("Result:", nested);
  console.log();

  console.log("=== Example 7: React Component Pattern ===");
  function Button({ primary, disabled, children }: any) {
    const className = classNames('btn', {
      'btn-primary': primary,
      'btn-disabled': disabled
    });
    return `<button class="${className}">${children}</button>`;
  }

  console.log(Button({ primary: true, disabled: false, children: 'Click' }));
  console.log(Button({ primary: false, disabled: true, children: 'Disabled' }));
  console.log();

  console.log("=== Example 8: Dynamic Classes ===");
  function getButtonClasses(type: string, size: string) {
    return classNames('btn', {
      'btn-primary': type === 'primary',
      'btn-secondary': type === 'secondary',
      'btn-sm': size === 'small',
      'btn-lg': size === 'large'
    });
  }

  console.log("Small primary:", getButtonClasses('primary', 'small'));
  console.log("Large secondary:", getButtonClasses('secondary', 'large'));
  console.log();

  console.log("=== Example 9: Theme Classes ===");
  const theme = 'dark';
  const themed = classNames('app', {
    'theme-dark': theme === 'dark',
    'theme-light': theme === 'light'
  });
  console.log("Result:", themed);
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same classnames utility in:");
  console.log("  • JavaScript/TypeScript/React");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One class utility, all languages");
  console.log("  ✓ Conditional class logic everywhere");
  console.log("  ✓ Clean component code");
  console.log("  ✓ ~10M+ downloads/week on npm!");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- React className props");
  console.log("- Conditional CSS classes");
  console.log("- Component state styling");
  console.log("- Theme switching");
  console.log("- Dynamic UI states");
}
