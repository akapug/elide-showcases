/**
 * istextorbinary - Detect Text or Binary
 *
 * Detect if a buffer or file is text or binary.
 * **POLYGLOT SHOWCASE**: Text/binary detection across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/istextorbinary (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

const textExts = new Set([
  'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'htm', 'xml', 'yml', 'yaml',
  'py', 'rb', 'java', 'c', 'cpp', 'h', 'hpp', 'go', 'rs', 'php', 'sql', 'sh', 'bash'
]);

const binaryExts = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'pdf', 'zip', 'tar', 'gz', 'exe', 'dll', 'so', 'bin'
]);

export function isText(filename?: string, buffer?: Uint8Array): boolean {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && textExts.has(ext)) return true;
    if (ext && binaryExts.has(ext)) return false;
  }

  if (buffer) {
    // Check for null bytes (strong indicator of binary)
    for (let i = 0; i < Math.min(buffer.length, 512); i++) {
      if (buffer[i] === 0) return false;
    }
    
    // Check for high ratio of non-printable characters
    let nonPrintable = 0;
    const sample = Math.min(buffer.length, 512);
    for (let i = 0; i < sample; i++) {
      const byte = buffer[i];
      if ((byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte === 127) {
        nonPrintable++;
      }
    }
    
    return nonPrintable / sample < 0.3;
  }

  return true; // Default to text
}

export function isBinary(filename?: string, buffer?: Uint8Array): boolean {
  return !isText(filename, buffer);
}

export default { isText, isBinary };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔍 istextorbinary (POLYGLOT!)\\n");
  
  console.log("=== By Filename ===");
  console.log("isText('readme.md'):", isText('readme.md'));
  console.log("isText('image.png'):", isText('image.png'));
  console.log();
  
  console.log("=== By Content ===");
  const textBuf = new TextEncoder().encode("Hello, World!");
  const binaryBuf = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
  console.log("isText(text buffer):", isText(undefined, textBuf));
  console.log("isText(binary buffer):", isText(undefined, binaryBuf));
  console.log();
  
  console.log("🚀 ~200K+ downloads/week on npm!");
}
