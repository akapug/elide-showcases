/**
 * Path - Node.js Path Manipulation for Elide
 *
 * Complete implementation of Node.js path module.
 * **POLYGLOT SHOWCASE**: Path manipulation for ALL platforms on Elide!
 *
 * Features:
 * - Cross-platform path operations
 * - POSIX and Windows support
 * - Path parsing and formatting
 * - Relative path resolution
 * - Path normalization
 * - Extension handling
 * - Directory and basename extraction
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need path manipulation
 * - ONE implementation works everywhere on Elide
 * - Consistent path handling across platforms
 * - No os-specific path modules needed
 *
 * Use cases:
 * - File system operations
 * - URL routing
 * - Asset management
 * - Build tools
 * - Module resolution
 */

export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

/**
 * POSIX path implementation
 */
export const posix = {
  sep: '/',
  delimiter: ':',

  normalize(path: string): string {
    if (path.length === 0) return '.';

    const isAbsolute = path.charAt(0) === '/';
    const trailingSlash = path.charAt(path.length - 1) === '/';

    // Normalize the path
    const parts = path.split('/').filter(p => p.length > 0 && p !== '.');
    const stack: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        if (stack.length > 0 && stack[stack.length - 1] !== '..') {
          stack.pop();
        } else if (!isAbsolute) {
          stack.push('..');
        }
      } else {
        stack.push(part);
      }
    }

    let normalized = stack.join('/');
    if (isAbsolute) {
      normalized = '/' + normalized;
    }
    if (trailingSlash && normalized.length > 1) {
      normalized += '/';
    }

    return normalized || (isAbsolute ? '/' : '.');
  },

  join(...paths: string[]): string {
    const joined = paths.filter(p => p.length > 0).join('/');
    return this.normalize(joined);
  },

  resolve(...paths: string[]): string {
    let resolvedPath = '';
    let resolvedAbsolute = false;

    for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      const path = i >= 0 ? paths[i] : '/'; // Assume current dir is /

      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    resolvedPath = this.normalize(resolvedPath);
    return resolvedAbsolute ? resolvedPath : '/' + resolvedPath;
  },

  isAbsolute(path: string): boolean {
    return path.length > 0 && path.charAt(0) === '/';
  },

  relative(from: string, to: string): string {
    from = this.resolve(from);
    to = this.resolve(to);

    if (from === to) return '';

    const fromParts = from.split('/').filter(p => p.length > 0);
    const toParts = to.split('/').filter(p => p.length > 0);

    // Find common parts
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] !== toParts[i]) break;
      commonLength++;
    }

    // Build relative path
    const upCount = fromParts.length - commonLength;
    const relativeParts = Array(upCount).fill('..');
    relativeParts.push(...toParts.slice(commonLength));

    return relativeParts.join('/') || '.';
  },

  dirname(path: string): string {
    if (path.length === 0) return '.';

    const hasRoot = path.charAt(0) === '/';
    let end = -1;
    let matchedSlash = true;

    for (let i = path.length - 1; i >= 1; --i) {
      if (path.charAt(i) === '/') {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        matchedSlash = false;
      }
    }

    if (end === -1) {
      return hasRoot ? '/' : '.';
    }

    if (hasRoot && end === 1) {
      return '/';
    }

    return path.slice(0, end);
  },

  basename(path: string, ext?: string): string {
    let start = 0;
    let end = -1;
    let matchedSlash = true;

    // Get basename
    for (let i = path.length - 1; i >= 0; --i) {
      if (path.charAt(i) === '/') {
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
    }

    if (end === -1) return '';

    const base = path.slice(start, end);

    // Remove extension if provided
    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }

    return base;
  },

  extname(path: string): string {
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;

    for (let i = path.length - 1; i >= 0; --i) {
      const code = path.charAt(i);

      if (code === '/') {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }

      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }

      if (code === '.') {
        if (startDot === -1) {
          startDot = i;
        } else if (preDotState !== 1) {
          preDotState = 1;
        }
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }

    if (
      startDot === -1 ||
      end === -1 ||
      preDotState === 0 ||
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    ) {
      return '';
    }

    return path.slice(startDot, end);
  },

  parse(path: string): ParsedPath {
    const ret: ParsedPath = {
      root: '',
      dir: '',
      base: '',
      ext: '',
      name: ''
    };

    if (path.length === 0) return ret;

    const isAbsolute = path.charAt(0) === '/';
    let start: number;

    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }

    let startDot = -1;
    let startPart = start;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;

    for (let i = path.length - 1; i >= start; --i) {
      const code = path.charAt(i);

      if (code === '/') {
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }

      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }

      if (code === '.') {
        if (startDot === -1) {
          startDot = i;
        } else if (preDotState !== 1) {
          preDotState = 1;
        }
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }

    if (end !== -1) {
      const slice = path.slice(startPart, end);

      if (
        startDot === -1 ||
        preDotState === 0 ||
        (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
      ) {
        ret.base = ret.name = slice;
      } else {
        ret.name = slice.slice(0, startDot - startPart);
        ret.base = slice;
        ret.ext = path.slice(startDot, end);
      }
    }

    if (startPart > 0 && startPart !== start) {
      ret.dir = path.slice(0, startPart - 1);
    } else if (isAbsolute) {
      ret.dir = '/';
    }

    return ret;
  },

  format(pathObject: Partial<ParsedPath>): string {
    const dir = pathObject.dir || pathObject.root || '';
    const base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');

    if (!dir) {
      return base;
    }

    if (dir === pathObject.root) {
      return dir + base;
    }

    return dir + '/' + base;
  }
};

/**
 * Windows path implementation
 */
export const win32 = {
  sep: '\\',
  delimiter: ';',

  normalize(path: string): string {
    if (path.length === 0) return '.';

    const isAbsolute = /^[a-zA-Z]:[\\\/]/.test(path) || path.startsWith('\\\\');
    const trailingSlash = /[\\\/]$/.test(path);

    // Replace forward slashes with backslashes
    path = path.replace(/\//g, '\\');

    // Normalize the path
    const parts = path.split('\\').filter(p => p.length > 0 && p !== '.');
    const stack: string[] = [];
    let root = '';

    if (/^[a-zA-Z]:$/.test(parts[0])) {
      root = parts.shift()! + '\\';
    } else if (path.startsWith('\\\\')) {
      root = '\\\\';
    }

    for (const part of parts) {
      if (part === '..') {
        if (stack.length > 0 && stack[stack.length - 1] !== '..') {
          stack.pop();
        } else if (!root) {
          stack.push('..');
        }
      } else {
        stack.push(part);
      }
    }

    let normalized = root + stack.join('\\');
    if (trailingSlash && normalized.length > 3) {
      normalized += '\\';
    }

    return normalized || (root || '.');
  },

  join(...paths: string[]): string {
    const joined = paths.filter(p => p.length > 0).join('\\');
    return this.normalize(joined);
  },

  resolve(...paths: string[]): string {
    let resolvedPath = '';
    let resolvedAbsolute = false;

    for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      const path = i >= 0 ? paths[i] : 'C:\\'; // Assume current dir is C:\

      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '\\' + resolvedPath;
      resolvedAbsolute = /^[a-zA-Z]:[\\\/]/.test(path) || path.startsWith('\\\\');
    }

    return this.normalize(resolvedPath);
  },

  isAbsolute(path: string): boolean {
    return /^[a-zA-Z]:[\\\/]/.test(path) || path.startsWith('\\\\');
  },

  dirname(path: string): string {
    // Similar to posix but with backslashes
    path = path.replace(/\//g, '\\');

    if (path.length === 0) return '.';

    const hasRoot = /^[a-zA-Z]:[\\\/]/.test(path) || path.startsWith('\\\\');
    let end = -1;
    let matchedSlash = true;

    for (let i = path.length - 1; i >= 1; --i) {
      if (path.charAt(i) === '\\') {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        matchedSlash = false;
      }
    }

    if (end === -1) {
      if (hasRoot) {
        const match = path.match(/^([a-zA-Z]:[\\\/])/);
        return match ? match[1] : path;
      }
      return '.';
    }

    return path.slice(0, end);
  },

  basename(path: string, ext?: string): string {
    path = path.replace(/\//g, '\\');

    let start = 0;
    let end = -1;
    let matchedSlash = true;

    for (let i = path.length - 1; i >= 0; --i) {
      if (path.charAt(i) === '\\') {
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
    }

    if (end === -1) return '';

    const base = path.slice(start, end);

    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }

    return base;
  },

  extname(path: string): string {
    path = path.replace(/\//g, '\\');
    return posix.extname(path.replace(/\\/g, '/'));
  },

  parse(path: string): ParsedPath {
    path = path.replace(/\//g, '\\');
    const parsed = posix.parse(path.replace(/\\/g, '/'));

    // Adjust for Windows root
    if (/^[a-zA-Z]:/.test(path)) {
      parsed.root = path.slice(0, 2) + '\\';
    }

    // Convert separators back
    if (parsed.dir) {
      parsed.dir = parsed.dir.replace(/\//g, '\\');
    }

    return parsed;
  },

  format(pathObject: Partial<ParsedPath>): string {
    const formatted = posix.format(pathObject);
    return formatted.replace(/\//g, '\\');
  },

  relative(from: string, to: string): string {
    from = this.resolve(from);
    to = this.resolve(to);

    if (from === to) return '';

    from = from.toLowerCase();
    to = to.toLowerCase();

    if (from === to) return '';

    const fromParts = from.split('\\').filter(p => p.length > 0);
    const toParts = to.split('\\').filter(p => p.length > 0);

    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] !== toParts[i]) break;
      commonLength++;
    }

    const upCount = fromParts.length - commonLength;
    const relativeParts = Array(upCount).fill('..');
    relativeParts.push(...toParts.slice(commonLength));

    return relativeParts.join('\\') || '.';
  }
};

// Default to POSIX (most common in Elide runtime)
export const {
  sep,
  delimiter,
  normalize,
  join,
  resolve,
  isAbsolute,
  relative,
  dirname,
  basename,
  extname,
  parse,
  format
} = posix;

// Default export
export default {
  sep,
  delimiter,
  normalize,
  join,
  resolve,
  isAbsolute,
  relative,
  dirname,
  basename,
  extname,
  parse,
  format,
  posix,
  win32
};

// CLI Demo
if (import.meta.url.includes("path.ts")) {
  console.log("📁 Path - Path Manipulation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Join Paths ===");
  console.log(join('/foo', 'bar', 'baz/file.txt'));
  console.log(join('foo', 'bar', '../baz'));
  console.log();

  console.log("=== Example 2: Normalize Paths ===");
  console.log(normalize('/foo/bar//baz/..'));
  console.log(normalize('foo/../bar/./baz'));
  console.log();

  console.log("=== Example 3: Resolve Paths ===");
  console.log(resolve('foo', 'bar', 'baz'));
  console.log(resolve('/foo', './bar', '../baz'));
  console.log();

  console.log("=== Example 4: Parse Path ===");
  const parsed = parse('/home/user/file.txt');
  console.log('Full path:', '/home/user/file.txt');
  console.log('Parsed:', parsed);
  console.log();

  console.log("=== Example 5: Extract Components ===");
  const filePath = '/home/user/documents/report.pdf';
  console.log('Path:', filePath);
  console.log('Directory:', dirname(filePath));
  console.log('Basename:', basename(filePath));
  console.log('Basename (no ext):', basename(filePath, '.pdf'));
  console.log('Extension:', extname(filePath));
  console.log();

  console.log("=== Example 6: Format Path ===");
  const formatted = format({
    dir: '/home/user',
    base: 'file.txt'
  });
  console.log('Formatted:', formatted);
  console.log();

  console.log("=== Example 7: Relative Paths ===");
  console.log('From /data to /data/files:', relative('/data', '/data/files'));
  console.log('From /data/foo to /data/bar:', relative('/data/foo', '/data/bar'));
  console.log();

  console.log("=== Example 8: Absolute Path Check ===");
  console.log('Is "/home/user" absolute?', isAbsolute('/home/user'));
  console.log('Is "home/user" absolute?', isAbsolute('home/user'));
  console.log();

  console.log("=== Example 9: Windows Paths ===");
  console.log('Win32 join:', win32.join('C:\\Users', 'John', 'Documents'));
  console.log('Win32 normalize:', win32.normalize('C:\\Users\\..\\John\\.\\file.txt'));
  console.log();

  console.log("=== Example 10: Cross-Platform ===");
  console.log('POSIX separator:', posix.sep);
  console.log('Windows separator:', win32.sep);
  console.log('Current separator:', sep);
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Path manipulation works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One path API for all languages");
  console.log("  ✓ Cross-platform path handling");
  console.log("  ✓ Consistent file operations");
  console.log("  ✓ No os-specific modules needed");
}
