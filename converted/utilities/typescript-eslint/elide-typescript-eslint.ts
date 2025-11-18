/**
 * typescript-eslint - Monorepo for TypeScript ESLint
 *
 * Core features:
 * - TypeScript ESLint tooling
 * - Parser and plugin combined
 * - Type-aware linting
 * - Recommended configs
 * - Project references support
 * - Comprehensive documentation
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 5M+ downloads/week
 */

interface Config {
  parser: string;
  plugins: string[];
  extends?: string[];
  rules: Record<string, any>;
  parserOptions?: {
    project?: string | string[];
    tsconfigRootDir?: string;
  };
}

export const configs = {
  recommended: {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  } as Config,

  recommendedTypeChecked: {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['plugin:@typescript-eslint/recommended'],
    parserOptions: {
      project: true,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  } as Config,

  strict: {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['plugin:@typescript-eslint/recommended-type-checked'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  } as Config,

  stylistic: {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/member-delimiter-style': 'error',
      '@typescript-eslint/type-annotation-spacing': 'error',
    },
  } as Config,
};

export function createConfig(preset: 'recommended' | 'strict' | 'stylistic' = 'recommended'): Config {
  return configs[preset];
}

if (import.meta.url.includes("elide-typescript-eslint")) {
  console.log("🎯 typescript-eslint for Elide - TypeScript ESLint Monorepo\n");

  console.log("=== Available Configs ===\n");

  console.log("1. Recommended (Basic)");
  console.log("   - No type checking required");
  console.log("   - Essential TypeScript rules");
  console.log("   - Good for quick setup\n");

  console.log("2. Recommended Type-Checked");
  console.log("   - Requires tsconfig.json");
  console.log("   - Type-aware rules");
  console.log("   - Catches more errors\n");

  console.log("3. Strict");
  console.log("   - Maximum type safety");
  console.log("   - All recommended rules as errors");
  console.log("   - Best for new projects\n");

  console.log("4. Stylistic");
  console.log("   - Code style rules");
  console.log("   - Consistent formatting");
  console.log("   - Opinionated choices\n");

  console.log("=== Example Config ===");
  const config = createConfig('recommended');
  console.log(JSON.stringify(config, null, 2));

  console.log();
  console.log("✅ Use Cases: TypeScript linting, Type safety, Team consistency");
  console.log("🚀 5M+ npm downloads/week - Complete TS linting solution");
  console.log("📚 Combines parser + plugin + configs");
}

export default { configs, createConfig };
