/**
 * filenamify - Convert String to Valid Filename
 * Based on https://www.npmjs.com/package/filenamify (~8M downloads/week)
 *
 * Features:
 * - Convert any string to valid filename
 * - Intelligent character replacement
 * - Preserve extension
 * - Length limiting with smart truncation
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface FilenamifyOptions {
  replacement?: string;
  maxLength?: number;
}

const REPLACEMENT_MAP: Record<string, string> = {
  '<': '',
  '>': '',
  ':': '-',
  '"': '',
  '/': '-',
  '\\': '-',
  '|': '-',
  '?': '',
  '*': '',
  '\x00': '',
  '\n': ' ',
  '\r': ' ',
  '\t': ' '
};

function filenamify(input: string, options: FilenamifyOptions = {}): string {
  const { replacement = '!', maxLength = 100 } = options;

  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  // Replace problematic characters
  let output = input;
  for (const [char, replace] of Object.entries(REPLACEMENT_MAP)) {
    output = output.split(char).join(replace);
  }

  // Remove control characters
  output = output.replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Handle reserved names (Windows)
  const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5',
                          'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4',
                          'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];

  const lower = output.toLowerCase();
  for (const reserved of reservedNames) {
    if (lower === reserved || lower.startsWith(reserved + '.')) {
      output = replacement + output;
      break;
    }
  }

  // Remove leading/trailing dots and spaces
  output = output.replace(/^\.+/, '').replace(/[\. ]+$/, '');

  // Truncate if too long
  if (output.length > maxLength) {
    const ext = output.includes('.') ? output.split('.').pop() : '';
    const extLength = ext ? ext.length + 1 : 0;
    const nameLength = maxLength - extLength;

    if (nameLength > 0) {
      output = ext
        ? output.slice(0, nameLength) + '.' + ext
        : output.slice(0, maxLength);
    } else {
      output = output.slice(0, maxLength);
    }
  }

  return output || replacement;
}

function filenamifyPath(path: string, options: FilenamifyOptions = {}): string {
  const parts = path.split(/[\/\\]/);
  return parts.map(part => part ? filenamify(part, options) : part).join('/');
}

export { filenamify, filenamifyPath, FilenamifyOptions };
export default filenamify;

if (import.meta.url.includes("elide-filenamify.ts")) {
  console.log("✅ filenamify - Convert to Valid Filename (POLYGLOT!)\n");

  const testCases = [
    'Hello World!.txt',
    'My: Document?.pdf',
    '<script>alert()</script>.js',
    'File|With|Pipes.txt',
    'Super Long Filename That Exceeds Normal Limits And Should Be Truncated Properly.txt',
    'con.txt',
    'path/to/file.txt',
    'C:\\Users\\file.txt'
  ];

  testCases.forEach(input => {
    console.log('Input:', input);
    console.log('Output:', filenamify(input));
    console.log('Max 20:', filenamify(input, { maxLength: 20 }));
    console.log('---');
  });

  console.log('\n--- Path Handling ---');
  const path = 'folder/sub:folder/file?.txt';
  console.log('Original path:', path);
  console.log('Filenamified:', filenamifyPath(path));

  console.log("\n🔒 ~8M downloads/week | Intelligent filename conversion");
  console.log("🚀 Smart replacements | Extension preservation | Length limiting\n");
}
