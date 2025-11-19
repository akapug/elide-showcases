/**
 * Webpack Clone - Babel Loader
 *
 * Transpiles JavaScript using Babel with support for:
 * - ES6+ to ES5
 * - JSX to JavaScript
 * - TypeScript to JavaScript
 * - Custom presets and plugins
 */

export interface BabelLoaderOptions {
  /**
   * Babel presets
   */
  presets?: Array<string | [string, any]>;

  /**
   * Babel plugins
   */
  plugins?: Array<string | [string, any]>;

  /**
   * Source maps
   */
  sourceMaps?: boolean;

  /**
   * Cache directory
   */
  cacheDirectory?: boolean | string;

  /**
   * Cache identifier
   */
  cacheIdentifier?: string;

  /**
   * Cache compression
   */
  cacheCompression?: boolean;

  /**
   * Babel config file
   */
  configFile?: string | false;

  /**
   * Babel helpers
   */
  helpers?: 'bundled' | 'runtime' | 'external';
}

export async function babelLoader(
  source: string,
  options: BabelLoaderOptions = {},
): Promise<string> {
  // Default options
  const opts: BabelLoaderOptions = {
    presets: options.presets || [],
    plugins: options.plugins || [],
    sourceMaps: options.sourceMaps !== false,
    cacheDirectory: options.cacheDirectory || false,
    helpers: options.helpers || 'bundled',
    ...options,
  };

  // Apply transformations
  let code = source;

  // Transform JSX
  if (needsJSXTransform(code)) {
    code = transformJSX(code, opts);
  }

  // Transform TypeScript
  if (needsTypeScriptTransform(code)) {
    code = transformTypeScript(code, opts);
  }

  // Transform ES6+
  code = transformES6(code, opts);

  // Transform async/await
  code = transformAsyncAwait(code, opts);

  // Transform class properties
  code = transformClassProperties(code, opts);

  // Transform decorators
  code = transformDecorators(code, opts);

  // Transform object rest spread
  code = transformObjectRestSpread(code, opts);

  // Transform optional chaining
  code = transformOptionalChaining(code, opts);

  // Transform nullish coalescing
  code = transformNullishCoalescing(code, opts);

  return code;
}

/**
 * Check if JSX transform is needed
 */
function needsJSXTransform(code: string): boolean {
  return /<\w+/.test(code) && /\/?>/.test(code);
}

/**
 * Check if TypeScript transform is needed
 */
function needsTypeScriptTransform(code: string): boolean {
  return /:\s*\w+/.test(code) || /interface\s+\w+/.test(code) || /type\s+\w+/.test(code);
}

/**
 * Transform JSX
 */
function transformJSX(code: string, options: BabelLoaderOptions): string {
  // Simplified JSX transformation
  // In production, would use @babel/plugin-transform-react-jsx

  // Handle JSX pragma comments
  const pragmaMatch = code.match(/\/\*\s*@jsx\s+(\w+)\s*\*\//);
  const pragma = pragmaMatch ? pragmaMatch[1] : 'React.createElement';

  // Transform opening and closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?>(.*?)<\/\1>/gs,
    (match, tag, attrs, children) => {
      const attrString = attrs ? parseJSXAttrs(attrs) : 'null';
      const childrenString = children.trim() ? `, ${children}` : '';
      return `${pragma}('${tag}', ${attrString}${childrenString})`;
    },
  );

  // Transform self-closing tags
  code = code.replace(
    /<(\w+)(\s+[^>]*)?\/>/g,
    (match, tag, attrs) => {
      const attrString = attrs ? parseJSXAttrs(attrs) : 'null';
      return `${pragma}('${tag}', ${attrString})`;
    },
  );

  // Transform fragments
  code = code.replace(
    /<>(.*?)<\/>/gs,
    (match, children) => {
      return `${pragma}(React.Fragment, null, ${children})`;
    },
  );

  return code;
}

/**
 * Parse JSX attributes
 */
function parseJSXAttrs(attrs: string): string {
  const attrPairs: string[] = [];
  const attrRegex = /(\w+)=(?:{([^}]+)}|"([^"]*)"|'([^']*)')/g;

  let match;
  while ((match = attrRegex.exec(attrs)) !== null) {
    const key = match[1];
    const expr = match[2];
    const doubleQuoted = match[3];
    const singleQuoted = match[4];

    if (expr) {
      attrPairs.push(`${key}: ${expr}`);
    } else if (doubleQuoted !== undefined || singleQuoted !== undefined) {
      const value = doubleQuoted || singleQuoted;
      attrPairs.push(`${key}: "${value}"`);
    }
  }

  // Handle boolean attributes
  const boolRegex = /\s+(\w+)(?=\s|>|\/)/g;
  while ((match = boolRegex.exec(attrs)) !== null) {
    const key = match[1];
    if (!attrPairs.some(pair => pair.startsWith(key + ':'))) {
      attrPairs.push(`${key}: true`);
    }
  }

  return attrPairs.length > 0 ? `{${attrPairs.join(', ')}}` : 'null';
}

/**
 * Transform TypeScript
 */
function transformTypeScript(code: string, options: BabelLoaderOptions): string {
  // Simplified TypeScript transformation
  // In production, would use @babel/preset-typescript

  // Remove type annotations
  code = code.replace(/:\s*\w+(\[\])?/g, '');
  code = code.replace(/as\s+\w+/g, '');

  // Remove interfaces
  code = code.replace(/interface\s+\w+\s*{[^}]*}/g, '');

  // Remove type aliases
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

  // Remove enums
  code = code.replace(/enum\s+\w+\s*{[^}]*}/g, '');

  // Remove namespace
  code = code.replace(/namespace\s+\w+\s*{[^}]*}/g, '');

  // Remove declare
  code = code.replace(/declare\s+/g, '');

  // Remove readonly
  code = code.replace(/readonly\s+/g, '');

  // Remove type parameters
  code = code.replace(/<[^>]+>/g, '');

  return code;
}

/**
 * Transform ES6+
 */
function transformES6(code: string, options: BabelLoaderOptions): string {
  // Transform arrow functions
  code = code.replace(
    /(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
    'function $1($2) {',
  );

  code = code.replace(
    /(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^;{]+)/g,
    'function $1($2) { return $3; }',
  );

  // Transform template literals
  code = code.replace(
    /`([^`]*\${[^`]*)`/g,
    (match, content) => {
      return '"' + content.replace(/\${([^}]+)}/g, '" + ($1) + "') + '"';
    },
  );

  // Transform destructuring
  code = transformDestructuring(code);

  // Transform default parameters
  code = transformDefaultParameters(code);

  // Transform rest parameters
  code = transformRestParameters(code);

  // Transform spread operator
  code = transformSpreadOperator(code);

  return code;
}

/**
 * Transform destructuring
 */
function transformDestructuring(code: string): string {
  // Simplified destructuring transformation
  // Object destructuring
  code = code.replace(
    /(?:const|let|var)\s+{\s*([^}]+)\s*}\s*=\s*([^;]+);/g,
    (match, props, obj) => {
      const propNames = props.split(',').map((p: string) => p.trim());
      return propNames
        .map((prop: string) => `const ${prop} = ${obj}.${prop};`)
        .join('\n');
    },
  );

  return code;
}

/**
 * Transform default parameters
 */
function transformDefaultParameters(code: string): string {
  // Simplified default parameters transformation
  code = code.replace(
    /function\s+(\w+)\s*\(([^)]+)\)/g,
    (match, name, params) => {
      const paramList = params.split(',').map((p: string) => p.trim());
      const transformed = paramList.map((param: string) => {
        if (param.includes('=')) {
          const [name, defaultValue] = param.split('=').map((s: string) => s.trim());
          return name;
        }
        return param;
      });

      return `function ${name}(${transformed.join(', ')})`;
    },
  );

  return code;
}

/**
 * Transform rest parameters
 */
function transformRestParameters(code: string): string {
  // Simplified rest parameters transformation
  code = code.replace(
    /\.\.\.(\w+)/g,
    (match, name) => {
      return `[].slice.call(arguments, arguments.length - 1)[0]`;
    },
  );

  return code;
}

/**
 * Transform spread operator
 */
function transformSpreadOperator(code: string): string {
  // Simplified spread operator transformation
  code = code.replace(
    /\[\.\.\.(\w+)\]/g,
    (match, name) => {
      return `[].concat(${name})`;
    },
  );

  return code;
}

/**
 * Transform async/await
 */
function transformAsyncAwait(code: string, options: BabelLoaderOptions): string {
  // Simplified async/await transformation
  // In production, would use @babel/plugin-transform-async-to-generator

  // Transform async functions
  code = code.replace(
    /async\s+function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
    'function $1($2) { return __async(function*() {',
  );

  // Transform await
  code = code.replace(
    /await\s+([^;]+)/g,
    'yield $1',
  );

  return code;
}

/**
 * Transform class properties
 */
function transformClassProperties(code: string, options: BabelLoaderOptions): string {
  // Simplified class properties transformation
  // In production, would use @babel/plugin-proposal-class-properties

  code = code.replace(
    /class\s+(\w+)\s*{([^}]*)}/gs,
    (match, className, body) => {
      // Extract class properties
      const properties: string[] = [];
      const methods: string[] = [];

      const lines = body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.includes('(') && !trimmed.startsWith('//')) {
          properties.push(trimmed);
        } else if (trimmed) {
          methods.push(trimmed);
        }
      }

      let result = `class ${className} {\n`;

      if (properties.length > 0) {
        result += `  constructor() {\n`;
        properties.forEach(prop => {
          result += `    this.${prop}\n`;
        });
        result += `  }\n`;
      }

      methods.forEach(method => {
        result += `  ${method}\n`;
      });

      result += '}';

      return result;
    },
  );

  return code;
}

/**
 * Transform decorators
 */
function transformDecorators(code: string, options: BabelLoaderOptions): string {
  // Simplified decorators transformation
  // In production, would use @babel/plugin-proposal-decorators

  code = code.replace(
    /@(\w+)/g,
    (match, decorator) => {
      return `/* @${decorator} */`;
    },
  );

  return code;
}

/**
 * Transform object rest spread
 */
function transformObjectRestSpread(code: string, options: BabelLoaderOptions): string {
  // Simplified object rest spread transformation
  // In production, would use @babel/plugin-proposal-object-rest-spread

  code = code.replace(
    /{\.\.\.(\w+)}/g,
    'Object.assign({}, $1)',
  );

  return code;
}

/**
 * Transform optional chaining
 */
function transformOptionalChaining(code: string, options: BabelLoaderOptions): string {
  // Simplified optional chaining transformation
  // In production, would use @babel/plugin-proposal-optional-chaining

  code = code.replace(
    /(\w+)\?\.(\w+)/g,
    '($1 == null ? void 0 : $1.$2)',
  );

  return code;
}

/**
 * Transform nullish coalescing
 */
function transformNullishCoalescing(code: string, options: BabelLoaderOptions): string {
  // Simplified nullish coalescing transformation
  // In production, would use @babel/plugin-proposal-nullish-coalescing-operator

  code = code.replace(
    /(\w+)\s*\?\?\s*([^;]+)/g,
    '($1 != null ? $1 : $2)',
  );

  return code;
}

export default babelLoader;
