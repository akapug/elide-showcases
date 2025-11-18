/**
 * ESLint Config Next - Next.js ESLint Configuration
 *
 * Official ESLint configuration for Next.js applications.
 * **POLYGLOT SHOWCASE**: Next.js best practices for ALL projects!
 *
 * Based on https://www.npmjs.com/package/eslint-config-next (~2M+ downloads/week)
 *
 * Features:
 * - Next.js-specific rules (Image, Link, Script)
 * - React and Hooks rules
 * - Core Web Vitals optimization
 * - Accessibility checks
 * - Performance best practices
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Consistent Next.js patterns
 * - Framework-specific optimizations
 * - SEO and performance best practices
 * - Works with Elide polyglot runtime
 *
 * Use cases:
 * - Next.js applications
 * - React Server Components
 * - Static site generation
 * - Server-side rendering
 *
 * Package has ~2M+ downloads/week on npm!
 */

export interface NextRule {
  name: string;
  severity: 'error' | 'warn' | 'off';
  description: string;
  category: string;
}

const nextRules: NextRule[] = [
  {
    name: '@next/next/no-html-link-for-pages',
    severity: 'error',
    description: 'Prevent usage of <a> instead of next/link',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-img-element',
    severity: 'warn',
    description: 'Prefer next/image over <img>',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-page-custom-font',
    severity: 'warn',
    description: 'Prevent page-only custom fonts',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-sync-scripts',
    severity: 'error',
    description: 'Prevent synchronous scripts',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-unwanted-polyfillio',
    severity: 'warn',
    description: 'Prevent duplicate polyfills from Polyfill.io',
    category: 'Next.js'
  },
  {
    name: '@next/next/inline-script-id',
    severity: 'error',
    description: 'Enforce id attribute on next/script with inline content',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-css-tags',
    severity: 'warn',
    description: 'Prevent manual stylesheet tags',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-head-element',
    severity: 'warn',
    description: 'Prevent usage of <head> instead of next/head',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-document-import-in-page',
    severity: 'error',
    description: 'Prevent importing next/document outside of pages/_document.js',
    category: 'Next.js'
  },
  {
    name: '@next/next/no-duplicate-head',
    severity: 'error',
    description: 'Prevent duplicate usage of <Head> in pages/_document.js',
    category: 'Next.js'
  }
];

const coreWebVitalsRules: NextRule[] = [
  {
    name: '@next/next/no-before-interactive-script-outside-document',
    severity: 'warn',
    description: 'Prevent beforeInteractive scripts outside _document.js',
    category: 'Core Web Vitals'
  },
  {
    name: '@next/next/google-font-display',
    severity: 'warn',
    description: 'Enforce font-display for Google Fonts',
    category: 'Core Web Vitals'
  },
  {
    name: '@next/next/google-font-preconnect',
    severity: 'warn',
    description: 'Enforce preconnect for Google Fonts',
    category: 'Core Web Vitals'
  }
];

export class NextConfig {
  getAllRules(): NextRule[] {
    return [...nextRules, ...coreWebVitalsRules];
  }

  getConfig() {
    const rules: Record<string, any> = {};
    this.getAllRules().forEach(rule => {
      rules[rule.name] = rule.severity;
    });

    return {
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      plugins: ['@next/next'],
      rules,
      settings: {
        react: {
          version: 'detect'
        },
        next: {
          rootDir: './'
        }
      }
    };
  }

  getCoreWebVitalsConfig() {
    const rules: Record<string, any> = {};
    [...nextRules, ...coreWebVitalsRules].forEach(rule => {
      rules[rule.name] = rule.severity;
    });

    return {
      extends: ['next', 'next/core-web-vitals'],
      rules
    };
  }

  getRulesByCategory(category: string): NextRule[] {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  validate(code: string): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    if (code.includes('<a href=') && !code.includes('import Link')) {
      issues.push('Use next/link instead of <a> tag for navigation');
    }
    if (code.includes('<img') && !code.includes('next/image')) {
      issues.push('Use next/image instead of <img> for better performance');
    }
    if (code.includes('<script') && code.includes('src=')) {
      issues.push('Use next/script instead of <script> tag');
    }
    if (code.includes('<head>') && !code.includes('_document')) {
      issues.push('Use next/head instead of <head> element');
    }

    return { passed: issues.length === 0, issues };
  }
}

const nextConfig = new NextConfig();
export default nextConfig;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("▲ ESLint Config Next - Next.js Linting\n");

  const config = new NextConfig();

  console.log("=== Example 1: Full Configuration ===");
  console.log(JSON.stringify(config.getConfig(), null, 2));
  console.log();

  console.log("=== Example 2: Core Web Vitals Config ===");
  console.log(JSON.stringify(config.getCoreWebVitalsConfig(), null, 2));
  console.log();

  console.log("=== Example 3: Next.js Rules ===");
  const nextRules = config.getRulesByCategory('Next.js');
  console.log(`Found ${nextRules.length} Next.js-specific rules:`);
  nextRules.forEach(rule => {
    const icon = rule.severity === 'error' ? '🔴' : '🟡';
    console.log(`  ${icon} ${rule.name}`);
    console.log(`     ${rule.description}`);
  });
  console.log();

  console.log("=== Example 4: Core Web Vitals Rules ===");
  const cwvRules = config.getRulesByCategory('Core Web Vitals');
  console.log(`Found ${cwvRules.length} Core Web Vitals rules:`);
  cwvRules.forEach(rule => {
    console.log(`  • ${rule.name}: ${rule.description}`);
  });
  console.log();

  console.log("=== Example 5: Code Validation ===");
  const testCases = [
    '<a href="/about">About</a>',
    '<img src="/logo.png" alt="Logo" />',
    '<script src="analytics.js"></script>',
    'import Link from "next/link"; <Link href="/about">About</Link>'
  ];

  testCases.forEach((code, i) => {
    const result = config.validate(code);
    console.log(`Test ${i + 1}: ${code.substring(0, 40)}...`);
    console.log(`Passed: ${result.passed ? '✓' : '✗'}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log();
  });

  console.log("=== Example 6: POLYGLOT Benefits ===");
  console.log("🌐 Next.js best practices everywhere:");
  console.log("  • Optimized images with next/image");
  console.log("  • Client-side navigation with next/link");
  console.log("  • Script optimization with next/script");
  console.log("  • SEO with next/head");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Framework-specific optimizations");
  console.log("  ✓ Core Web Vitals compliance");
  console.log("  ✓ 2M+ downloads/week on npm");
  console.log("  ✓ Runs on Elide polyglot runtime");
}
