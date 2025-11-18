/**
 * Get Stream - Stream to String/Buffer
 * **POLYGLOT SHOWCASE**: Stream collection for ALL languages on Elide!
 * Package has ~120M+ downloads/week on npm!
 */

export default async function getStream(stream: any): Promise<string> {
  const chunks: any[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(chunks.join(''));
    });

    stream.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export async function buffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export async function array(stream: any): Promise<any[]> {
  const items: any[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (item: any) => {
      items.push(item);
    });

    stream.on('end', () => {
      resolve(items);
    });

    stream.on('error', (err: Error) => {
      reject(err);
    });
  });
}

if (import.meta.url.includes("elide-get-stream.ts")) {
  console.log("🎯 Get Stream - Stream to Value (POLYGLOT!)\n");

  const { Readable } = await import('../readable-stream/elide-readable-stream.ts');

  const stream = new Readable();
  stream.push('Hello ');
  stream.push('World');
  stream.push(null);

  const result = await getStream(stream);
  console.log(`  Result: ${result}`);

  console.log("\n✅ ~120M+ downloads/week on npm");
}
