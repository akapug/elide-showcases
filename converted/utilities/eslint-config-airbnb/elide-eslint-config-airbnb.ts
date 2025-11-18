/**
 * ESLint Config Airbnb - Shareable ESLint Configuration
 *
 * Airbnb's ESLint config with React, Hooks, and best practices.
 * **POLYGLOT SHOWCASE**: One linting config for ALL JavaScript code!
 *
 * Based on https://www.npmjs.com/package/eslint-config-airbnb (~3M+ downloads/week)
 *
 * Features:
 * - Airbnb JavaScript Style Guide rules
 * - React and JSX best practices
 * - ES6+ modern syntax support
 * - Import/export validation
 * - Accessibility (a11y) rules
 * - Zero dependencies (pure TypeScript)
 *
 * Polyglot Benefits:
 * - One style guide for all your JavaScript projects
 * - Consistent code quality across TypeScript, React, Vue
 * - Share linting rules across frontend and backend
 * - Works with Elide polyglot runtime
 *
 * Use cases:
 * - React applications (component linting)
 * - Node.js backend services
 * - TypeScript projects
 * - Monorepo configurations
 *
 * Package has ~3M+ downloads/week on npm - industry standard config!
 */

export interface ESLintRule {
  name: string;
  severity: 'off' | 'warn' | 'error';
  options?: any[];
  category: string;
  description: string;
}

export interface ESLintConfig {
  env?: Record<string, boolean>;
  extends?: string[];
  parser?: string;
  parserOptions?: Record<string, any>;
  plugins?: string[];
  rules?: Record<string, any>;
  settings?: Record<string, any>;
}

/**
 * Airbnb base rules for ES6+
 */
const baseRules: Record<string, ESLintRule> = {
  'no-console': {
    name: 'no-console',
    severity: 'warn',
    options: [{ allow: ['warn', 'error'] }],
    category: 'Best Practices',
    description: 'Disallow console statements except warn/error'
  },
  'no-unused-vars': {
    name: 'no-unused-vars',
    severity: 'error',
    options: [{ vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
    category: 'Variables',
    description: 'Disallow unused variables'
  },
  'no-var': {
    name: 'no-var',
    severity: 'error',
    category: 'ES6',
    description: 'Require let or const instead of var'
  },
  'prefer-const': {
    name: 'prefer-const',
    severity: 'error',
    category: 'ES6',
    description: 'Prefer const for variables that are never reassigned'
  },
  'arrow-body-style': {
    name: 'arrow-body-style',
    severity: 'error',
    options: [{ requireReturnForObjectLiteral: false }],
    category: 'ES6',
    description: 'Require braces in arrow function body as needed'
  },
  'no-param-reassign': {
    name: 'no-param-reassign',
    severity: 'error',
    options: [{ props: true }],
    category: 'Best Practices',
    description: 'Disallow reassignment of function parameters'
  },
  'prefer-destructuring': {
    name: 'prefer-destructuring',
    severity: 'error',
    options: [{ array: true, object: true }],
    category: 'ES6',
    description: 'Prefer destructuring from arrays and objects'
  },
  'no-shadow': {
    name: 'no-shadow',
    severity: 'error',
    category: 'Variables',
    description: 'Disallow variable declarations that shadow outer scope'
  },
  'eqeqeq': {
    name: 'eqeqeq',
    severity: 'error',
    options: ['always'],
    category: 'Best Practices',
    description: 'Require === and !== instead of == and !='
  },
  'curly': {
    name: 'curly',
    severity: 'error',
    options: ['all'],
    category: 'Best Practices',
    description: 'Require following curly brace conventions'
  }
};

/**
 * React-specific rules
 */
const reactRules: Record<string, ESLintRule> = {
  'react/jsx-filename-extension': {
    name: 'react/jsx-filename-extension',
    severity: 'error',
    options: [{ extensions: ['.jsx', '.tsx'] }],
    category: 'React',
    description: 'Restrict file extensions that may contain JSX'
  },
  'react/prop-types': {
    name: 'react/prop-types',
    severity: 'error',
    category: 'React',
    description: 'Prevent missing props validation in React components'
  },
  'react/jsx-props-no-spreading': {
    name: 'react/jsx-props-no-spreading',
    severity: 'warn',
    category: 'React',
    description: 'Prevent JSX prop spreading'
  },
  'react/require-default-props': {
    name: 'react/require-default-props',
    severity: 'error',
    category: 'React',
    description: 'Enforce default props for non-required props'
  },
  'react/jsx-no-bind': {
    name: 'react/jsx-no-bind',
    severity: 'warn',
    category: 'React',
    description: 'Prevent usage of .bind() in JSX props'
  },
  'react/function-component-definition': {
    name: 'react/function-component-definition',
    severity: 'error',
    options: [{ namedComponents: 'arrow-function' }],
    category: 'React',
    description: 'Enforce a specific function type for components'
  },
  'react-hooks/rules-of-hooks': {
    name: 'react-hooks/rules-of-hooks',
    severity: 'error',
    category: 'React Hooks',
    description: 'Enforce Rules of Hooks'
  },
  'react-hooks/exhaustive-deps': {
    name: 'react-hooks/exhaustive-deps',
    severity: 'warn',
    category: 'React Hooks',
    description: 'Verify dependencies of Hooks'
  }
};

/**
 * Import rules
 */
const importRules: Record<string, ESLintRule> = {
  'import/no-unresolved': {
    name: 'import/no-unresolved',
    severity: 'error',
    category: 'Import',
    description: 'Ensure imports point to a file/module that can be resolved'
  },
  'import/named': {
    name: 'import/named',
    severity: 'error',
    category: 'Import',
    description: 'Ensure named imports correspond to a named export'
  },
  'import/prefer-default-export': {
    name: 'import/prefer-default-export',
    severity: 'error',
    category: 'Import',
    description: 'Prefer a default export if module exports a single name'
  },
  'import/no-extraneous-dependencies': {
    name: 'import/no-extraneous-dependencies',
    severity: 'error',
    category: 'Import',
    description: 'Forbid import of external modules not declared in package.json'
  }
};

/**
 * ESLint Config Airbnb implementation
 */
export class AirbnbConfig {
  private rules: Map<string, ESLintRule> = new Map();

  constructor() {
    // Load all rule categories
    Object.entries(baseRules).forEach(([key, rule]) => this.rules.set(key, rule));
    Object.entries(reactRules).forEach(([key, rule]) => this.rules.set(key, rule));
    Object.entries(importRules).forEach(([key, rule]) => this.rules.set(key, rule));
  }

  /**
   * Get the full ESLint configuration object
   */
  getConfig(): ESLintConfig {
    const rules: Record<string, any> = {};

    this.rules.forEach((rule, name) => {
      if (rule.options) {
        rules[name] = [rule.severity, ...rule.options];
      } else {
        rules[name] = rule.severity;
      }
    });

    return {
      env: {
        browser: true,
        es2021: true,
        node: true
      },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:jsx-a11y/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      plugins: ['react', 'react-hooks', 'import', 'jsx-a11y'],
      rules,
      settings: {
        react: {
          version: 'detect'
        },
        'import/resolver': {
          node: {
            extensions: ['.js', '.jsx', '.ts', '.tsx']
          }
        }
      }
    };
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): ESLintRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.category === category);
  }

  /**
   * Get rule by name
   */
  getRule(name: string): ESLintRule | undefined {
    return this.rules.get(name);
  }

  /**
   * Check if code passes a specific rule
   */
  validateRule(ruleName: string, code: string): { passed: boolean; message?: string } {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      return { passed: false, message: 'Rule not found' };
    }

    // Simple validation examples (real ESLint uses AST parsing)
    switch (ruleName) {
      case 'no-var':
        if (code.includes('var ')) {
          return { passed: false, message: 'Use let or const instead of var' };
        }
        break;
      case 'prefer-const':
        // Basic check for let without reassignment (simplified)
        if (code.includes('let ') && !code.includes('=')) {
          return { passed: false, message: 'Use const for variables that are never reassigned' };
        }
        break;
      case 'eqeqeq':
        if (code.includes('==') && !code.includes('===')) {
          return { passed: false, message: 'Use === instead of ==' };
        }
        break;
      case 'no-console':
        if (code.includes('console.log')) {
          return { passed: false, message: 'Unexpected console statement' };
        }
        break;
    }

    return { passed: true };
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.rules.forEach(rule => categories.add(rule.category));
    return Array.from(categories);
  }

  /**
   * Export config as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }
}

// Export default instance
const airbnbConfig = new AirbnbConfig();
export default airbnbConfig;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✈️  ESLint Config Airbnb - Elide Polyglot Showcase\n");

  const config = new AirbnbConfig();

  console.log("=== Example 1: Full Configuration ===");
  console.log(config.toJSON());
  console.log();

  console.log("=== Example 2: Rules by Category ===");
  const categories = config.getCategories();
  categories.forEach(category => {
    const rules = config.getRulesByCategory(category);
    console.log(`\n${category} (${rules.length} rules):`);
    rules.slice(0, 3).forEach(rule => {
      console.log(`  - ${rule.name}: ${rule.description}`);
    });
  });
  console.log();

  console.log("=== Example 3: Rule Validation ===");
  const testCases = [
    { code: 'var x = 10;', rule: 'no-var' },
    { code: 'let x = 10;', rule: 'prefer-const' },
    { code: 'if (x == 10) {}', rule: 'eqeqeq' },
    { code: 'console.log("test");', rule: 'no-console' }
  ];

  testCases.forEach(({ code, rule }) => {
    const result = config.validateRule(rule, code);
    console.log(`Code: "${code}"`);
    console.log(`Rule: ${rule}`);
    console.log(`Result: ${result.passed ? '✓ Passed' : '✗ Failed'}`);
    if (result.message) {
      console.log(`Message: ${result.message}`);
    }
    console.log();
  });

  console.log("=== Example 4: React Rules ===");
  const reactRules = config.getRulesByCategory('React');
  console.log(`Found ${reactRules.length} React rules:`);
  reactRules.forEach(rule => {
    console.log(`  ${rule.severity === 'error' ? '🔴' : '🟡'} ${rule.name}`);
  });
  console.log();

  console.log("=== Example 5: ES6 Rules ===");
  const es6Rules = config.getRulesByCategory('ES6');
  console.log(`Found ${es6Rules.length} ES6 rules:`);
  es6Rules.forEach(rule => {
    console.log(`  - ${rule.name}: ${rule.description}`);
  });
  console.log();

  console.log("=== Example 6: Import Rules ===");
  const importRules = config.getRulesByCategory('Import');
  console.log(`Found ${importRules.length} Import rules:`);
  importRules.forEach(rule => {
    console.log(`  - ${rule.name}: ${rule.description}`);
  });
  console.log();

  console.log("=== Example 7: Severity Levels ===");
  const allRules = Array.from(config.getConfig().rules || {});
  const errorRules = allRules.filter(([_, v]) => {
    return Array.isArray(v) ? v[0] === 'error' : v === 'error';
  });
  const warnRules = allRules.filter(([_, v]) => {
    return Array.isArray(v) ? v[0] === 'warn' : v === 'warn';
  });
  console.log(`Total rules: ${allRules.length}`);
  console.log(`Error level: ${errorRules.length}`);
  console.log(`Warning level: ${warnRules.length}`);
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Use Airbnb config across all your JavaScript projects:");
  console.log("  • React/Next.js frontends");
  console.log("  • Node.js backends");
  console.log("  • TypeScript applications");
  console.log("  • Vue/Svelte projects");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One style guide, all projects");
  console.log("  ✓ Consistent code quality");
  console.log("  ✓ Industry-standard best practices");
  console.log("  ✓ 3M+ downloads/week on npm");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- React component linting");
  console.log("- ES6+ modern JavaScript");
  console.log("- Import/export validation");
  console.log("- Accessibility checking");
  console.log("- TypeScript projects");
  console.log();

  console.log("🚀 Elide Polyglot Runtime:");
  console.log("- Zero dependencies");
  console.log("- Pure TypeScript implementation");
  console.log("- Works across all Elide-supported languages");
  console.log("- Fast execution");
}
