/**
 * Code Transpiler
 *
 * Transpiles code between different languages and frameworks
 * Supports: TypeScript ↔ JavaScript, JSX ↔ TSX, JSX ↔ Vue
 */

import { logger } from '../utils/logger';

export interface TranspileOptions {
  removeTypes?: boolean;
  jsx?: 'preserve' | 'react' | 'react-native';
  target?: 'es5' | 'es6' | 'esnext';
}

export interface TranspileResult {
  code: string;
  sourceMap?: string;
  warnings?: string[];
}

export class Transpiler {
  /**
   * Transpile code from one language to another
   */
  async transpile(
    code: string,
    from: string,
    to: string,
    options: TranspileOptions = {}
  ): Promise<TranspileResult> {
    logger.info(`Transpiling from ${from} to ${to}`);

    const fromLang = from.toLowerCase();
    const toLang = to.toLowerCase();

    // TypeScript to JavaScript
    if (fromLang === 'typescript' && toLang === 'javascript') {
      return this.typescriptToJavaScript(code, options);
    }

    // JavaScript to TypeScript
    if (fromLang === 'javascript' && toLang === 'typescript') {
      return this.javaScriptToTypeScript(code, options);
    }

    // TSX to JSX
    if (fromLang === 'tsx' && toLang === 'jsx') {
      return this.tsxToJsx(code, options);
    }

    // JSX to TSX
    if (fromLang === 'jsx' && toLang === 'tsx') {
      return this.jsxToTsx(code, options);
    }

    // JSX to Vue
    if (fromLang === 'jsx' && toLang === 'vue') {
      return this.jsxToVue(code, options);
    }

    // Vue to JSX
    if (fromLang === 'vue' && toLang === 'jsx') {
      return this.vueToJsx(code, options);
    }

    throw new Error(`Transpilation from ${from} to ${to} is not supported`);
  }

  /**
   * TypeScript to JavaScript
   */
  private typescriptToJavaScript(code: string, options: TranspileOptions): TranspileResult {
    // Remove type annotations
    let result = code;
    const warnings: string[] = [];

    // Remove interface declarations
    result = result.replace(/interface\s+\w+\s*{[^}]*}/g, '');

    // Remove type annotations from variables
    result = result.replace(/:\s*\w+(<[^>]+>)?(\[\])?/g, '');

    // Remove type parameters from functions
    result = result.replace(/<T[^>]*>/g, '');

    // Remove 'as' type assertions
    result = result.replace(/\s+as\s+\w+/g, '');

    // Remove enum declarations
    result = result.replace(/enum\s+\w+\s*{[^}]*}/g, '');

    // Clean up extra whitespace
    result = result.replace(/\n\n+/g, '\n\n');

    logger.info('TypeScript to JavaScript transpilation completed');

    return {
      code: result.trim(),
      warnings,
    };
  }

  /**
   * JavaScript to TypeScript
   */
  private javaScriptToTypeScript(code: string, options: TranspileOptions): TranspileResult {
    // Add basic type annotations
    let result = code;
    const warnings: string[] = [];

    warnings.push('Auto-generated types may not be accurate. Manual review recommended.');

    // Add types to function parameters (basic inference)
    result = result.replace(
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      (match, name, params) => {
        const typedParams = params.split(',').map((p: string) => {
          const param = p.trim();
          return param ? `${param}: any` : '';
        }).join(', ');
        return `function ${name}(${typedParams}): any`;
      }
    );

    // Add types to arrow functions
    result = result.replace(
      /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g,
      (match, name, params) => {
        const typedParams = params.split(',').map((p: string) => {
          const param = p.trim();
          return param ? `${param}: any` : '';
        }).join(', ');
        return `const ${name} = (${typedParams}): any =>`;
      }
    );

    logger.info('JavaScript to TypeScript transpilation completed');

    return {
      code: result,
      warnings,
    };
  }

  /**
   * TSX to JSX
   */
  private tsxToJsx(code: string, options: TranspileOptions): TranspileResult {
    // Similar to TS to JS, but preserve JSX
    return this.typescriptToJavaScript(code, options);
  }

  /**
   * JSX to TSX
   */
  private jsxToTsx(code: string, options: TranspileOptions): TranspileResult {
    // Similar to JS to TS
    const result = this.javaScriptToTypeScript(code, options);

    // Add React imports if missing
    if (!result.code.includes('import React')) {
      result.code = `import React from 'react';\n\n${result.code}`;
    }

    return result;
  }

  /**
   * JSX to Vue
   */
  private jsxToVue(code: string, options: TranspileOptions): TranspileResult {
    const warnings: string[] = [];
    warnings.push('JSX to Vue conversion is approximate. Manual adjustments may be needed.');

    // Extract component name
    const componentMatch = code.match(/(?:function|const)\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'Component';

    // Extract JSX content
    const jsxMatch = code.match(/return\s*\(([\s\S]*?)\);/);
    const jsxContent = jsxMatch ? jsxMatch[1].trim() : code;

    // Convert JSX to Vue template
    let template = jsxContent;

    // Convert className to class
    template = template.replace(/className=/g, 'class=');

    // Convert onClick to @click
    template = template.replace(/onClick=/g, '@click=');

    // Convert onChange to @input
    template = template.replace(/onChange=/g, '@input=');

    // Convert {value} to v-model or :value
    template = template.replace(/value=\{(\w+)\}/g, 'v-model="$1"');

    // Extract state and props
    const stateMatches = code.matchAll(/const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\(([^)]*)\)/g);
    const stateVars: string[] = [];
    for (const match of stateMatches) {
      stateVars.push(`${match[1]}: ${match[2] || 'null'}`);
    }

    // Build Vue component
    const vueCode = `<template>
  ${template}
</template>

<script setup>
import { ref } from 'vue';

${stateVars.map(s => {
  const [name, value] = s.split(':');
  return `const ${name} = ref(${value.trim()});`;
}).join('\n')}
</script>

<style scoped>
/* Add your styles here */
</style>`;

    logger.info('JSX to Vue transpilation completed');

    return {
      code: vueCode,
      warnings,
    };
  }

  /**
   * Vue to JSX
   */
  private vueToJsx(code: string, options: TranspileOptions): TranspileResult {
    const warnings: string[] = [];
    warnings.push('Vue to JSX conversion is approximate. Manual adjustments may be needed.');

    // Extract template
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    let template = templateMatch ? templateMatch[1].trim() : '';

    // Extract script
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const script = scriptMatch ? scriptMatch[1].trim() : '';

    // Convert template to JSX
    // Convert class to className
    template = template.replace(/\sclass=/g, ' className=');

    // Convert @click to onClick
    template = template.replace(/@click=/g, 'onClick=');

    // Convert @input to onChange
    template = template.replace(/@input=/g, 'onChange=');

    // Convert v-model to value + onChange
    template = template.replace(/v-model="(\w+)"/g, 'value={$1} onChange={(e) => set$1(e.target.value)}');

    // Extract ref declarations
    const refMatches = script.matchAll(/const\s+(\w+)\s*=\s*ref\(([^)]*)\)/g);
    const stateVars: string[] = [];
    for (const match of refMatches) {
      stateVars.push(`const [${match[1]}, set${match[1]}] = useState(${match[2] || 'null'});`);
    }

    // Build React component
    const jsxCode = `import React, { useState } from 'react';

export default function Component() {
  ${stateVars.join('\n  ')}

  return (
    ${template}
  );
}`;

    logger.info('Vue to JSX transpilation completed');

    return {
      code: jsxCode,
      warnings,
    };
  }
}
