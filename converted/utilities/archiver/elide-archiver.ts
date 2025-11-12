/**
 * Elide Archiver - Universal Archive Creation
 */

export interface ArchiverOptions {
  zlib?: {
    level?: number;
  };
}

export class Archiver {
  private files: Array<{ name: string; data: string | Buffer }> = [];
  private format: string;

  constructor(format: string, options?: ArchiverOptions) {
    this.format = format;
    console.log(`Creating ${format} archive`);
  }

  file(filepath: string, options?: { name?: string }) {
    const name = options?.name || filepath;
    console.log(`Adding file: ${name}`);
    this.files.push({ name, data: 'mock-file-data' });
    return this;
  }

  directory(dirpath: string, destPath?: string) {
    console.log(`Adding directory: ${dirpath} -> ${destPath || dirpath}`);
    return this;
  }

  append(data: string | Buffer, options: { name: string }) {
    console.log(`Appending: ${options.name}`);
    this.files.push({ name: options.name, data });
    return this;
  }

  finalize() {
    console.log(`Finalizing archive with ${this.files.length} files`);
    return Promise.resolve();
  }

  pipe(stream: any) {
    console.log('Piping to stream');
    return this;
  }

  on(event: string, handler: Function) {
    return this;
  }
}

export function create(format: string, options?: ArchiverOptions): Archiver {
  return new Archiver(format, options);
}

export default { create };

if (import.meta.main) {
  console.log('=== Elide Archiver Demo ===\n');

  const archive = create('zip', { zlib: { level: 9 } });

  archive
    .file('file1.txt', { name: 'file1.txt' })
    .file('file2.txt', { name: 'file2.txt' })
    .directory('src/', 'source/')
    .append('Hello World', { name: 'greeting.txt' });

  await archive.finalize();
  console.log('✓ Demo completed');
}
