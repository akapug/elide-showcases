/**
 * Shx - Cross-Platform Shell Commands
 *
 * Portable Unix shell commands as CLI.
 * **POLYGLOT SHOWCASE**: Cross-platform shell for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/shx (~500K+ downloads/week)
 *
 * Features:
 * - Cross-platform shell commands
 * - Portable Unix commands
 * - No bash/sh dependencies
 * - Windows/Mac/Linux compatible
 * - Exit codes and error handling
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need cross-platform shells
 * - ONE implementation works everywhere on Elide
 * - Consistent shell behavior across platforms
 * - Share scripts across your stack
 *
 * Use cases:
 * - npm scripts (cross-platform)
 * - Build automation
 * - CI/CD pipelines
 * - Development workflows
 *
 * Package has ~500K+ downloads/week on npm - essential shell utility!
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ShxResult {
  code: number;
  output: string;
  error: string;
}

export class Shx {
  /**
   * Copy files
   */
  static cp(source: string, dest: string, recursive = false): ShxResult {
    try {
      const stat = fs.statSync(source);

      if (stat.isDirectory()) {
        if (!recursive) {
          return { code: 1, output: '', error: 'cp: -r not specified' };
        }
        this.copyDir(source, dest);
      } else {
        fs.copyFileSync(source, dest);
      }

      return { code: 0, output: '', error: '' };
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }

  private static copyDir(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Move/rename files
   */
  static mv(source: string, dest: string): ShxResult {
    try {
      fs.renameSync(source, dest);
      return { code: 0, output: '', error: '' };
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }

  /**
   * Remove files
   */
  static rm(target: string, recursive = false, force = false): ShxResult {
    try {
      if (!fs.existsSync(target) && force) {
        return { code: 0, output: '', error: '' };
      }

      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        if (!recursive) {
          return { code: 1, output: '', error: 'rm: is a directory' };
        }
        fs.rmSync(target, { recursive: true, force });
      } else {
        fs.unlinkSync(target);
      }

      return { code: 0, output: '', error: '' };
    } catch (error) {
      if (force) {
        return { code: 0, output: '', error: '' };
      }
      return { code: 1, output: '', error: String(error) };
    }
  }

  /**
   * Make directory
   */
  static mkdir(dir: string, recursive = false): ShxResult {
    try {
      fs.mkdirSync(dir, { recursive });
      return { code: 0, output: '', error: '' };
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }

  /**
   * List files
   */
  static ls(dir = '.'): ShxResult {
    try {
      const files = fs.readdirSync(dir);
      return { code: 0, output: files.join('\n'), error: '' };
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }

  /**
   * Echo text
   */
  static echo(...args: string[]): ShxResult {
    return { code: 0, output: args.join(' '), error: '' };
  }

  /**
   * Get current directory
   */
  static pwd(): ShxResult {
    return { code: 0, output: process.cwd(), error: '' };
  }

  /**
   * Touch file
   */
  static touch(file: string): ShxResult {
    try {
      const now = new Date();
      if (fs.existsSync(file)) {
        fs.utimesSync(file, now, now);
      } else {
        fs.writeFileSync(file, '');
      }
      return { code: 0, output: '', error: '' };
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }

  /**
   * Check if file exists
   */
  static test(flag: string, target: string): ShxResult {
    try {
      const exists = fs.existsSync(target);

      if (flag === '-e') {
        return { code: exists ? 0 : 1, output: '', error: '' };
      }

      if (!exists) {
        return { code: 1, output: '', error: '' };
      }

      const stat = fs.statSync(target);

      switch (flag) {
        case '-f':
          return { code: stat.isFile() ? 0 : 1, output: '', error: '' };
        case '-d':
          return { code: stat.isDirectory() ? 0 : 1, output: '', error: '' };
        default:
          return { code: 1, output: '', error: 'Unknown flag' };
      }
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }

  /**
   * Cat file contents
   */
  static cat(...files: string[]): ShxResult {
    try {
      const contents = files.map(f => fs.readFileSync(f, 'utf8'));
      return { code: 0, output: contents.join(''), error: '' };
    } catch (error) {
      return { code: 1, output: '', error: String(error) };
    }
  }
}

export default Shx;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 Shx - Cross-Platform Shell for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Echo ===");
  const echo = Shx.echo("Hello", "World");
  console.log("Output:", echo.output);
  console.log("Exit code:", echo.code);
  console.log();

  console.log("=== Example 2: PWD ===");
  const pwd = Shx.pwd();
  console.log("Current directory:", pwd.output);
  console.log();

  console.log("=== Example 3: Test Files ===");
  const testFile = Shx.test('-f', 'package.json');
  const testDir = Shx.test('-d', 'node_modules');
  console.log("package.json is file:", testFile.code === 0);
  console.log("node_modules is dir:", testDir.code === 0);
  console.log();

  console.log("=== Example 4: Temp Operations ===");
  console.log("Creating temp file...");
  const touch = Shx.touch('/tmp/shx-demo.txt');
  console.log("Touch result:", touch.code === 0 ? 'Success' : 'Failed');

  const testExists = Shx.test('-e', '/tmp/shx-demo.txt');
  console.log("File exists:", testExists.code === 0);

  const cleanup = Shx.rm('/tmp/shx-demo.txt', false, true);
  console.log("Cleanup:", cleanup.code === 0 ? 'Success' : 'Failed');
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same shx library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Cross-platform shell commands");
  console.log("  ✓ No bash/sh dependencies");
  console.log("  ✓ Works on Windows/Mac/Linux");
  console.log("  ✓ Share npm scripts across platforms");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- npm scripts (cross-platform)");
  console.log("- Build automation");
  console.log("- CI/CD pipelines");
  console.log("- Development workflows");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Native Node.js APIs");
  console.log("- Fast execution on Elide");
  console.log("- ~500K+ downloads/week on npm!");
}
