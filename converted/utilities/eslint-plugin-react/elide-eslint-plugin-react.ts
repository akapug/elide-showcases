/**
 * ESLint Plugin React - React-specific Linting Rules
 *
 * React-specific linting rules for ESLint.
 * **POLYGLOT SHOWCASE**: React best practices for ALL applications!
 *
 * Based on https://www.npmjs.com/package/eslint-plugin-react (~10M+ downloads/week)
 *
 * Features:
 * - JSX syntax validation
 * - Component best practices
 * - Prop validation
 * - Hook usage rules
 * - Performance optimizations
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Consistent React patterns
 * - Catch common React mistakes
 * - Enforce React best practices
 * - Works with Elide polyglot runtime
 *
 * Use cases:
 * - React applications
 * - React Native apps
 * - Component libraries
 * - Next.js projects
 *
 * Package has ~10M+ downloads/week on npm!
 */

export interface ReactRule {
  name: string;
  severity: 'error' | 'warn' | 'off';
  description: string;
  category: string;
  fixable?: boolean;
}

const reactRules: ReactRule[] = [
  {
    name: 'react/jsx-key',
    severity: 'error',
    description: 'Detect missing key prop in arrays',
    category: 'Possible Errors',
    fixable: false
  },
  {
    name: 'react/jsx-no-duplicate-props',
    severity: 'error',
    description: 'Prevent duplicate props in JSX',
    category: 'Possible Errors',
    fixable: false
  },
  {
    name: 'react/jsx-no-undef',
    severity: 'error',
    description: 'Disallow undeclared variables in JSX',
    category: 'Possible Errors',
    fixable: false
  },
  {
    name: 'react/jsx-uses-react',
    severity: 'error',
    description: 'Prevent React from being incorrectly marked as unused',
    category: 'Possible Errors',
    fixable: false
  },
  {
    name: 'react/jsx-uses-vars',
    severity: 'error',
    description: 'Prevent variables used in JSX from being marked as unused',
    category: 'Possible Errors',
    fixable: false
  },
  {
    name: 'react/no-danger',
    severity: 'warn',
    description: 'Prevent usage of dangerous JSX props',
    category: 'Best Practices',
    fixable: false
  },
  {
    name: 'react/no-deprecated',
    severity: 'error',
    description: 'Prevent usage of deprecated methods',
    category: 'Best Practices',
    fixable: false
  },
  {
    name: 'react/no-direct-mutation-state',
    severity: 'error',
    description: 'Prevent direct mutation of this.state',
    category: 'Best Practices',
    fixable: false
  },
  {
    name: 'react/no-unknown-property',
    severity: 'error',
    description: 'Prevent usage of unknown DOM property',
    category: 'Possible Errors',
    fixable: true
  },
  {
    name: 'react/prop-types',
    severity: 'error',
    description: 'Prevent missing props validation',
    category: 'Best Practices',
    fixable: false
  },
  {
    name: 'react/react-in-jsx-scope',
    severity: 'error',
    description: 'Prevent missing React when using JSX',
    category: 'Possible Errors',
    fixable: false
  },
  {
    name: 'react/self-closing-comp',
    severity: 'error',
    description: 'Prevent extra closing tags for components without children',
    category: 'Style',
    fixable: true
  },
  {
    name: 'react/jsx-closing-bracket-location',
    severity: 'error',
    description: 'Validate closing bracket location in JSX',
    category: 'Style',
    fixable: true
  },
  {
    name: 'react/jsx-boolean-value',
    severity: 'warn',
    description: 'Enforce boolean attributes notation in JSX',
    category: 'Style',
    fixable: true
  },
  {
    name: 'react/jsx-no-bind',
    severity: 'warn',
    description: 'Prevent usage of .bind() in JSX props',
    category: 'Best Practices',
    fixable: false
  }
];

export class ReactPlugin {
  getRules(): ReactRule[] {
    return reactRules;
  }

  getRulesByCategory(category: string): ReactRule[] {
    return reactRules.filter(rule => rule.category === category);
  }

  getConfig() {
    const rules: Record<string, any> = {};
    reactRules.forEach(rule => {
      rules[rule.name] = rule.severity;
    });

    return {
      plugins: ['react'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      rules,
      settings: {
        react: {
          version: 'detect'
        }
      }
    };
  }

  validate(code: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for missing keys in arrays
    if (code.includes('.map(') && !code.includes('key=')) {
      violations.push('Missing key prop in array iteration (react/jsx-key)');
    }

    // Check for direct state mutation
    if (code.includes('this.state.') && code.includes(' = ')) {
      violations.push('Direct state mutation detected (react/no-direct-mutation-state)');
    }

    // Check for dangerouslySetInnerHTML
    if (code.includes('dangerouslySetInnerHTML')) {
      violations.push('Usage of dangerouslySetInnerHTML (react/no-danger)');
    }

    // Check for self-closing tags
    if (code.match(/<(\w+)([^>]*)><\/\1>/)) {
      violations.push('Component has no children, use self-closing tag (react/self-closing-comp)');
    }

    return { passed: violations.length === 0, violations };
  }
}

const reactPlugin = new ReactPlugin();
export default reactPlugin;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚛️  ESLint Plugin React - React Linting Rules\n");

  const plugin = new ReactPlugin();

  console.log("=== Example 1: All React Rules ===");
  const rules = plugin.getRules();
  console.log(`Total rules: ${rules.length}\n`);
  rules.slice(0, 10).forEach(rule => {
    const icon = rule.severity === 'error' ? '🔴' : '🟡';
    const fix = rule.fixable ? ' [fixable]' : '';
    console.log(`${icon} ${rule.name}${fix}`);
    console.log(`   ${rule.description}`);
  });
  console.log();

  console.log("=== Example 2: Rules by Category ===");
  ['Possible Errors', 'Best Practices', 'Style'].forEach(category => {
    const categoryRules = plugin.getRulesByCategory(category);
    console.log(`\n${category}: ${categoryRules.length} rules`);
    categoryRules.slice(0, 3).forEach(rule => {
      console.log(`  • ${rule.name}`);
    });
  });
  console.log();

  console.log("=== Example 3: Code Validation ===");
  const testCases = [
    'items.map(item => <div>{item.name}</div>)',
    'this.state.count = 10;',
    '<div dangerouslySetInnerHTML={{__html: html}} />',
    '<Button></Button>'
  ];

  testCases.forEach((code, i) => {
    console.log(`Test ${i + 1}: ${code}`);
    const result = plugin.validate(code);
    console.log(`Passed: ${result.passed ? '✓' : '✗'}`);
    if (result.violations.length > 0) {
      result.violations.forEach(v => console.log(`  - ${v}`));
    }
    console.log();
  });

  console.log("=== Example 4: Configuration ===");
  console.log(JSON.stringify(plugin.getConfig(), null, 2));
  console.log();

  console.log("=== Example 5: POLYGLOT Benefits ===");
  console.log("🌐 React best practices everywhere:");
  console.log("  • React web applications");
  console.log("  • React Native mobile apps");
  console.log("  • Next.js projects");
  console.log("  • Component libraries");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Catch common React mistakes");
  console.log("  ✓ Enforce best practices");
  console.log("  ✓ 10M+ downloads/week on npm");
  console.log("  ✓ Runs on Elide polyglot runtime");
}
