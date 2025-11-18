/**
 * ESLint Config Standard - JavaScript Standard Style
 *
 * Standard JavaScript linting rules - no configuration needed.
 * **POLYGLOT SHOWCASE**: One standard style for ALL JavaScript!
 *
 * Based on https://www.npmjs.com/package/eslint-config-standard (~1M+ downloads/week)
 *
 * Features:
 * - Zero configuration
 * - 2 space indentation
 * - Single quotes for strings
 * - No semicolons (except when required)
 * - No trailing commas
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Consistent JavaScript style everywhere
 * - No bikeshedding over style choices
 * - Same rules for Node.js and browser code
 * - Works with Elide polyglot runtime
 *
 * Use cases:
 * - Quick project setup
 * - Open source projects
 * - Team collaboration
 * - Reducing style debates
 *
 * Package has ~1M+ downloads/week on npm!
 */

export interface StandardRule {
  name: string;
  value: any;
  description: string;
}

export const standardRules: StandardRule[] = [
  {
    name: 'indent',
    value: ['error', 2],
    description: '2 spaces for indentation'
  },
  {
    name: 'quotes',
    value: ['error', 'single', { avoidEscape: true }],
    description: 'Single quotes for strings'
  },
  {
    name: 'semi',
    value: ['error', 'never'],
    description: 'No semicolons'
  },
  {
    name: 'comma-dangle',
    value: ['error', 'never'],
    description: 'No trailing commas'
  },
  {
    name: 'space-before-function-paren',
    value: ['error', 'always'],
    description: 'Space before function parenthesis'
  },
  {
    name: 'keyword-spacing',
    value: ['error', { before: true, after: true }],
    description: 'Space around keywords'
  },
  {
    name: 'space-infix-ops',
    value: ['error'],
    description: 'Spaces around operators'
  },
  {
    name: 'brace-style',
    value: ['error', '1tbs', { allowSingleLine: true }],
    description: 'One true brace style'
  },
  {
    name: 'camelcase',
    value: ['error', { properties: 'never' }],
    description: 'Camel case naming'
  },
  {
    name: 'eqeqeq',
    value: ['error', 'always', { null: 'ignore' }],
    description: 'Use === and !=='
  },
  {
    name: 'no-unused-vars',
    value: ['error', { vars: 'all', args: 'after-used' }],
    description: 'No unused variables'
  },
  {
    name: 'no-var',
    value: ['error'],
    description: 'Use let or const instead of var'
  }
];

export class StandardConfig {
  getRules(): Record<string, any> {
    const rules: Record<string, any> = {};
    standardRules.forEach(rule => {
      rules[rule.name] = rule.value;
    });
    return rules;
  }

  getConfig() {
    return {
      env: {
        browser: true,
        node: true,
        es2021: true
      },
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      },
      rules: this.getRules()
    };
  }

  format(code: string): string {
    // Simple formatting based on Standard rules
    return code
      .replace(/;\s*$/gm, '') // Remove semicolons
      .replace(/"/g, "'") // Use single quotes
      .replace(/\t/g, '  ') // Convert tabs to 2 spaces
      .trim();
  }

  validate(code: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (code.includes(';') && !code.includes('for (')) {
      errors.push('Unexpected semicolon (semi)');
    }
    if (code.match(/"\w+"/)) {
      errors.push('Use single quotes instead of double quotes (quotes)');
    }
    if (code.includes('var ')) {
      errors.push('Use let or const instead of var (no-var)');
    }

    return { valid: errors.length === 0, errors };
  }
}

const standardConfig = new StandardConfig();
export default standardConfig;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⭐ ESLint Config Standard - JavaScript Standard Style\n");

  const config = new StandardConfig();

  console.log("=== Example 1: Full Configuration ===");
  console.log(JSON.stringify(config.getConfig(), null, 2));
  console.log();

  console.log("=== Example 2: All Rules ===");
  standardRules.forEach(rule => {
    console.log(`  • ${rule.name}: ${rule.description}`);
  });
  console.log();

  console.log("=== Example 3: Code Validation ===");
  const testCode1 = 'const x = "hello";';
  const result1 = config.validate(testCode1);
  console.log(`Code: ${testCode1}`);
  console.log(`Valid: ${result1.valid}`);
  if (result1.errors.length > 0) {
    console.log(`Errors: ${result1.errors.join(', ')}`);
  }
  console.log();

  console.log("=== Example 4: Auto-formatting ===");
  const uglyCode = `const  message = "Hello World";\nconsole.log( message );`;
  console.log("Before:");
  console.log(uglyCode);
  console.log("\nAfter:");
  console.log(config.format(uglyCode));
  console.log();

  console.log("=== Example 5: POLYGLOT Benefits ===");
  console.log("🌐 Use Standard style everywhere:");
  console.log("  • Node.js backends");
  console.log("  • React frontends");
  console.log("  • CLI tools");
  console.log("  • npm packages");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Zero configuration needed");
  console.log("  ✓ Consistent style across projects");
  console.log("  ✓ 1M+ downloads/week on npm");
  console.log("  ✓ Works on Elide polyglot runtime");
}
