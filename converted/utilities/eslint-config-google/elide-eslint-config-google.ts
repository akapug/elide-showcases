/**
 * ESLint Config Google - Google JavaScript Style Guide
 *
 * Google's JavaScript style guide as an ESLint config.
 * **POLYGLOT SHOWCASE**: Google's style for ALL your JavaScript!
 *
 * Based on https://www.npmjs.com/package/eslint-config-google (~200K+ downloads/week)
 *
 * Features:
 * - 2 space indentation
 * - Single quotes
 * - Require semicolons
 * - Max line length 80
 * - Google's naming conventions
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Google-approved coding standards
 * - Consistent with Google's open source projects
 * - Clear, readable code
 * - Works with Elide polyglot runtime
 *
 * Use cases:
 * - Enterprise applications
 * - Google Cloud projects
 * - Open source libraries
 * - Team standardization
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface GoogleRule {
  name: string;
  config: any;
  category: 'Style' | 'Best Practices' | 'Errors';
  description: string;
}

const googleRules: GoogleRule[] = [
  {
    name: 'indent',
    config: ['error', 2],
    category: 'Style',
    description: '2 spaces for indentation'
  },
  {
    name: 'quotes',
    config: ['error', 'single'],
    category: 'Style',
    description: 'Single quotes for strings'
  },
  {
    name: 'semi',
    config: ['error', 'always'],
    category: 'Style',
    description: 'Require semicolons'
  },
  {
    name: 'max-len',
    config: ['error', { code: 80, ignoreUrls: true }],
    category: 'Style',
    description: 'Max line length of 80 characters'
  },
  {
    name: 'camelcase',
    config: ['error'],
    category: 'Style',
    description: 'Enforce camelCase naming'
  },
  {
    name: 'curly',
    config: ['error', 'all'],
    category: 'Best Practices',
    description: 'Require curly braces for all control statements'
  },
  {
    name: 'guard-for-in',
    config: ['error'],
    category: 'Best Practices',
    description: 'Require hasOwnProperty in for-in loops'
  },
  {
    name: 'no-caller',
    config: ['error'],
    category: 'Best Practices',
    description: 'Disallow use of arguments.caller/callee'
  },
  {
    name: 'no-extend-native',
    config: ['error'],
    category: 'Best Practices',
    description: 'Disallow extending native objects'
  },
  {
    name: 'no-multi-str',
    config: ['error'],
    category: 'Errors',
    description: 'Disallow multi-line strings'
  },
  {
    name: 'no-var',
    config: ['error'],
    category: 'Best Practices',
    description: 'Require let or const instead of var'
  },
  {
    name: 'prefer-const',
    config: ['error'],
    category: 'Best Practices',
    description: 'Prefer const for variables that are never reassigned'
  }
];

export class GoogleConfig {
  getRules(): Record<string, any> {
    const rules: Record<string, any> = {};
    googleRules.forEach(rule => {
      rules[rule.name] = rule.config;
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

  getRulesByCategory(category: 'Style' | 'Best Practices' | 'Errors'): GoogleRule[] {
    return googleRules.filter(rule => rule.category === category);
  }

  validateLine(line: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (line.length > 80) {
      errors.push(`Line exceeds 80 characters (${line.length} chars)`);
    }
    if (line.includes('"') && !line.includes("'")) {
      errors.push('Use single quotes instead of double quotes');
    }
    if (!line.endsWith(';') && line.match(/^(const|let|var|return)\s/)) {
      errors.push('Missing semicolon');
    }

    return { valid: errors.length === 0, errors };
  }
}

const googleConfig = new GoogleConfig();
export default googleConfig;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 ESLint Config Google - Google JavaScript Style\n");

  const config = new GoogleConfig();

  console.log("=== Example 1: Configuration ===");
  console.log(JSON.stringify(config.getConfig(), null, 2));
  console.log();

  console.log("=== Example 2: Rules by Category ===");
  ['Style', 'Best Practices', 'Errors'].forEach(category => {
    const rules = config.getRulesByCategory(category as any);
    console.log(`\n${category} (${rules.length} rules):`);
    rules.forEach(rule => {
      console.log(`  • ${rule.name}: ${rule.description}`);
    });
  });
  console.log();

  console.log("=== Example 3: Line Validation ===");
  const lines = [
    'const message = "Hello";',
    'const x = 10',
    'const veryLongVariableNameThatExceedsTheEightyCharacterLimitAndShouldBeReportedAsAnError = true;'
  ];
  lines.forEach(line => {
    const result = config.validateLine(line);
    console.log(`Line: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
    console.log(`Valid: ${result.valid ? '✓' : '✗'}`);
    if (result.errors.length > 0) {
      result.errors.forEach(err => console.log(`  - ${err}`));
    }
    console.log();
  });

  console.log("=== Example 4: POLYGLOT Benefits ===");
  console.log("🌐 Google style for all JavaScript:");
  console.log("  • Angular applications");
  console.log("  • Google Cloud Functions");
  console.log("  • Node.js services");
  console.log("  • Chrome extensions");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Enterprise-grade standards");
  console.log("  ✓ Google-approved practices");
  console.log("  ✓ 200K+ downloads/week");
  console.log("  ✓ Runs on Elide polyglot runtime");
}
