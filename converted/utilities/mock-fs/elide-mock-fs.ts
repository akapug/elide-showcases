/**
 * mock-fs - File system mocking for tests
 *
 * Mock the file system for testing without real files.
 * **POLYGLOT SHOWCASE**: FS mocking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mock-fs (~2M+ downloads/week)
 *
 * Features:
 * - In-memory file system
 * - File/directory mocking
 * - Read/write operations
 * - Path resolution
 * - Zero dependencies
 *
 * Use cases:
 * - Testing file operations
 * - Isolating FS interactions
 * - Mock file structures
 *
 * Package has ~2M+ downloads/week on npm!
 */

interface MockFileSystem {
  [path: string]: string | MockFileSystem | null;
}

class MockFS {
  private fs: MockFileSystem = {};

  mock(structure: MockFileSystem): void {
    this.fs = structure;
  }

  restore(): void {
    this.fs = {};
  }

  readFileSync(path: string, encoding?: string): string {
    const content = this.resolvePath(path);
    if (typeof content !== 'string') {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  writeFileSync(path: string, data: string): void {
    const dir = path.split('/').slice(0, -1).join('/');
    const filename = path.split('/').pop()!;

    const parent = dir ? this.resolvePath(dir) : this.fs;
    if (typeof parent === 'string' || parent === null) {
      throw new Error(`ENOTDIR: not a directory, open '${path}'`);
    }
    parent[filename] = data;
  }

  existsSync(path: string): boolean {
    try {
      this.resolvePath(path);
      return true;
    } catch {
      return false;
    }
  }

  mkdirSync(path: string): void {
    const parts = path.split('/').filter(Boolean);
    let current: any = this.fs;

    for (const part of parts) {
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
      if (typeof current === 'string' || current === null) {
        throw new Error(`EEXIST: file already exists, mkdir '${path}'`);
      }
    }
  }

  readdirSync(path: string): string[] {
    const dir = this.resolvePath(path);
    if (typeof dir === 'string' || dir === null) {
      throw new Error(`ENOTDIR: not a directory, scandir '${path}'`);
    }
    return Object.keys(dir);
  }

  statSync(path: string): { isDirectory(): boolean; isFile(): boolean } {
    const item = this.resolvePath(path);
    return {
      isDirectory: () => typeof item === 'object' && item !== null,
      isFile: () => typeof item === 'string',
    };
  }

  unlinkSync(path: string): void {
    const parts = path.split('/').filter(Boolean);
    const filename = parts.pop()!;
    const dir = parts.join('/');

    const parent = dir ? this.resolvePath(dir) : this.fs;
    if (typeof parent === 'string' || parent === null) {
      throw new Error(`ENOTDIR: not a directory`);
    }
    delete parent[filename];
  }

  rmdirSync(path: string): void {
    this.unlinkSync(path);
  }

  private resolvePath(path: string): any {
    const parts = path.split('/').filter(Boolean);
    let current: any = this.fs;

    for (const part of parts) {
      if (typeof current !== 'object' || current === null || !(part in current)) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      current = current[part];
    }

    return current;
  }
}

const mockFS = new MockFS();

export default mockFS;
export { MockFileSystem };

// CLI Demo
if (import.meta.url.includes('elide-mock-fs.ts')) {
  console.log('📁 mock-fs - File System Mocking for Elide (POLYGLOT!)\n');

  console.log('Example 1: Mock File Structure\n');
  mockFS.mock({
    'tmp': {
      'file.txt': 'Hello World',
      'data': {
        'config.json': '{"key":"value"}',
      },
    },
  });
  console.log('✓ File structure mocked');

  console.log('\nExample 2: Read Files\n');
  const content = mockFS.readFileSync('tmp/file.txt');
  console.log('File content:', content);

  console.log('\nExample 3: Write Files\n');
  mockFS.writeFileSync('tmp/new.txt', 'New content');
  console.log('New file:', mockFS.readFileSync('tmp/new.txt'));

  console.log('\nExample 4: Directory Operations\n');
  console.log('Files in tmp:', mockFS.readdirSync('tmp'));
  console.log('Is directory?', mockFS.statSync('tmp').isDirectory());

  console.log('\nExample 5: File Exists\n');
  console.log('Exists tmp/file.txt?', mockFS.existsSync('tmp/file.txt'));
  console.log('Exists tmp/missing.txt?', mockFS.existsSync('tmp/missing.txt'));

  mockFS.restore();
  console.log('\n✅ File system restored!');
  console.log('🚀 ~2M+ downloads/week on npm!');
  console.log('💡 Test file operations without real files!');
}
