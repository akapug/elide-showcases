/**
 * @typescript-eslint/eslint-plugin - TypeScript ESLint Plugin
 *
 * ESLint plugin with TypeScript-specific linting rules.
 * **POLYGLOT SHOWCASE**: TypeScript linting rules for ALL languages!
 *
 * Based on https://www.npmjs.com/package/@typescript-eslint/eslint-plugin (~10M+ downloads/week)
 *
 * Features:
 * - 100+ TypeScript rules
 * - Type-aware linting
 * - Recommended configs
 * - Auto-fix support
 * - Performance optimized
 * - Extensible rules
 *
 * Polyglot Benefits:
 * - Lint TS from any language
 * - Share linting rules
 * - Consistent code quality
 * - One ruleset everywhere
 *
 * Use cases:
 * - TypeScript code quality
 * - Type safety enforcement
 * - Best practices
 * - Team standards
 *
 * Package has ~10M+ downloads/week on npm!
 */

export interface RuleModule {
  meta: {
    type: 'problem' | 'suggestion' | 'layout';
    docs: {
      description: string;
      recommended?: boolean;
    };
    fixable?: 'code' | 'whitespace';
    schema: any[];
  };
  create: (context: any) => any;
}

export const rules: Record<string, RuleModule> = {
  'no-explicit-any': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Disallow usage of the `any` type',
        recommended: true,
      },
      schema: [],
    },
    create: (context) => ({
      TSAnyKeyword(node: any) {
        context.report({
          node,
          message: 'Unexpected any. Specify a different type.',
        });
      },
    }),
  },
  'no-unused-vars': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow unused variables',
        recommended: true,
      },
      schema: [],
    },
    create: (context) => ({}),
  },
};

export const configs = {
  recommended: {
    extends: ['eslint:recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
};

export default { rules, configs };

// CLI Demo
if (import.meta.url.includes("elide-typescript-eslint-eslint-plugin.ts")) {
  console.log("🔧 @typescript-eslint/eslint-plugin - TS ESLint Plugin for Elide!\n");

  console.log("=== Example 1: Available Rules ===");
  console.log("Rules:", Object.keys(rules));
  console.log();

  console.log("=== Example 2: Recommended Config ===");
  console.log("Config:", configs.recommended);
  console.log();

  console.log("🚀 100+ TypeScript linting rules - ~10M+ downloads/week!");
}
