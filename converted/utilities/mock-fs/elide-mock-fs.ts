/**
 * Mock FS - Mock Filesystem
 *
 * Mock filesystem for testing without touching real files.
 * **POLYGLOT SHOWCASE**: One filesystem mock for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mock-fs (~300K+ downloads/week)
 *
 * Features:
 * - Mock filesystem operations
 * - In-memory file system
 * - No real file I/O
 * - Easy setup and teardown
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

interface FileSystemConfig {
  [path: string]: string | Buffer | FileSystemConfig;
}

class MockFileSystem {
  private files: Map<string, any> = new Map();

  mock(config: FileSystemConfig): void {
    this.files.clear();
    this.processConfig('/', config);
  }

  private processConfig(basePath: string, config: FileSystemConfig): void {
    for (const [key, value] of Object.entries(config)) {
      const fullPath = basePath + key;
      if (typeof value === 'string' || value instanceof Buffer) {
        this.files.set(fullPath, value);
      } else {
        this.processConfig(fullPath + '/', value);
      }
    }
  }

  restore(): void {
    this.files.clear();
  }

  readFileSync(path: string): string | Buffer {
    return this.files.get(path) || '';
  }

  existsSync(path: string): boolean {
    return this.files.has(path);
  }
}

const mockFs = new MockFileSystem();

export function mock(config: FileSystemConfig): void {
  mockFs.mock(config);
}

export function restore(): void {
  mockFs.restore();
}

export default mock;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📁 Mock FS - Filesystem Mocking for Elide (POLYGLOT!)\n");
  
  mock({
    '/tmp/test.txt': 'file content',
    '/data': {
      'file1.txt': 'content 1',
      'file2.txt': 'content 2'
    }
  });
  
  console.log("Mocked filesystem created");
  restore();
  console.log("\n✅ ~300K+ downloads/week on npm!");
}
