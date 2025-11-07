/**
 * Word Wrap - Wrap Text to a Specific Line Length
 *
 * Wraps long strings to a specified width, breaking at word boundaries.
 * Essential for CLI tools, terminal output formatting, and text processing.
 *
 * Features:
 * - Smart word boundary detection
 * - Preserves existing line breaks
 * - Configurable indent
 * - Trim trailing whitespace
 * - Custom newline character
 *
 * Package has ~8M+ downloads/week on npm!
 */

interface WrapOptions {
  /** Maximum line width (default: 50) */
  width?: number;
  /** String to use for line breaks (default: '\n') */
  newline?: string;
  /** Indent string for wrapped lines (default: '') */
  indent?: string;
  /** Trim trailing whitespace (default: true) */
  trim?: boolean;
  /** Cut long words that exceed width (default: false) */
  cut?: boolean;
}

/**
 * Wrap a string to the specified width
 */
export default function wrap(text: string, options: WrapOptions = {}): string {
  if (typeof text !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof text}`);
  }

  const {
    width = 50,
    newline = '\n',
    indent = '',
    trim = true,
    cut = false,
  } = options;

  if (typeof width !== 'number' || width < 1) {
    throw new TypeError('Expected width to be a positive number');
  }

  // Handle empty string
  if (text.length === 0) {
    return text;
  }

  // Split into existing lines
  const lines = text.split(/\r?\n/);
  const wrapped: string[] = [];

  for (const line of lines) {
    if (line.length === 0) {
      wrapped.push('');
      continue;
    }

    // Wrap this line
    const wrappedLines = wrapLine(line, width, indent, cut);
    wrapped.push(...wrappedLines);
  }

  let result = wrapped.join(newline);

  if (trim) {
    // Trim trailing whitespace from each line
    result = result.split(newline).map(line => line.trimEnd()).join(newline);
  }

  return result;
}

/**
 * Wrap a single line of text
 */
function wrapLine(line: string, width: number, indent: string, cut: boolean): string[] {
  const result: string[] = [];
  const effectiveWidth = width - indent.length;

  if (effectiveWidth < 1) {
    throw new Error('Width minus indent must be at least 1');
  }

  // Split into words
  const words = line.split(/\s+/);
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Handle very long words
    if (cut && word.length > effectiveWidth) {
      // If current line has content, push it first
      if (currentLine) {
        result.push(indent + currentLine.trimEnd());
        currentLine = '';
      }

      // Split the long word across multiple lines
      for (let j = 0; j < word.length; j += effectiveWidth) {
        result.push(indent + word.slice(j, j + effectiveWidth));
      }
      continue;
    }

    // Check if adding this word would exceed width
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= effectiveWidth) {
      currentLine = testLine;
    } else {
      // Line would be too long, push current line and start new one
      if (currentLine) {
        result.push(indent + currentLine);
      }
      currentLine = word;
    }
  }

  // Push remaining content
  if (currentLine) {
    result.push(indent + currentLine);
  }

  return result.length > 0 ? result : [''];
}

/**
 * Wrap with specific width (convenience function)
 */
export function wrapWidth(text: string, width: number): string {
  return wrap(text, { width });
}

/**
 * Unwrap text by joining lines
 */
export function unwrap(text: string): string {
  if (typeof text !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof text}`);
  }

  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(' ');
}

// CLI Demo
if (import.meta.url.includes("elide-word-wrap.ts")) {
  console.log("📏 Word Wrap - Text Line Wrapping for Elide\n");

  console.log("=== Example 1: Basic Wrapping ===");
  const long = "The quick brown fox jumps over the lazy dog. This is a long sentence that needs to be wrapped.";
  console.log("Input:", long);
  console.log("\nWrapped to 30 chars:");
  console.log(wrap(long, { width: 30 }));
  console.log();

  console.log("=== Example 2: Different Widths ===");
  const text = "Elide is a polyglot runtime that runs JavaScript, TypeScript, Python, Ruby, and more!";
  console.log("Original:", text);
  console.log("\nWidth 40:");
  console.log(wrap(text, { width: 40 }));
  console.log("\nWidth 60:");
  console.log(wrap(text, { width: 60 }));
  console.log();

  console.log("=== Example 3: With Indentation ===");
  const quote = "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.";
  console.log("Quote:");
  console.log(wrap(quote, { width: 50, indent: '  ' }));
  console.log();

  console.log("=== Example 4: Preserve Line Breaks ===");
  const multi = "First paragraph here.\n\nSecond paragraph with more text that needs wrapping.\n\nThird paragraph.";
  console.log("Input with paragraphs:");
  console.log(multi);
  console.log("\nWrapped to 30 chars:");
  console.log(wrap(multi, { width: 30 }));
  console.log();

  console.log("=== Example 5: Cut Long Words ===");
  const longWord = "This has a verylongwordthatexceedsthewidthlimit in the middle.";
  console.log("Input:", longWord);
  console.log("\nWithout cut (word preserved):");
  console.log(wrap(longWord, { width: 20, cut: false }));
  console.log("\nWith cut (word split):");
  console.log(wrap(longWord, { width: 20, cut: true }));
  console.log();

  console.log("=== Example 6: Unwrap Text ===");
  const wrapped = `This is a wrapped
paragraph that spans
multiple lines and should
be joined back together.`;
  console.log("Wrapped text:");
  console.log(wrapped);
  console.log("\nUnwrapped:");
  console.log(unwrap(wrapped));
  console.log();

  console.log("=== Example 7: CLI Help Text ===");
  const help = "Usage: elide [options] <file>\n\nRun TypeScript and JavaScript files instantly without a build step. Elide provides fast startup times and polyglot capabilities.";
  console.log("CLI help wrapped to 60 chars:");
  console.log(wrap(help, { width: 60, indent: '' }));
  console.log();

  console.log("=== Example 8: Code Comments ===");
  const comment = "This function performs a complex calculation that takes multiple parameters and returns a result after processing the data through several stages.";
  console.log("Wrapped to 70 chars with comment prefix:");
  const lines = wrap(comment, { width: 67 }).split('\n');
  lines.forEach(line => console.log(`// ${line}`));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Terminal output formatting");
  console.log("- CLI help text and documentation");
  console.log("- Email formatting");
  console.log("- Code comment wrapping");
  console.log("- Markdown/text processing");
  console.log("- Log file formatting");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~8M downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use indent for blockquotes or nested text");
  console.log("- Enable cut for URLs or code that must fit");
  console.log("- Preserve line breaks maintains paragraph structure");
  console.log("- Unwrap is useful for search/comparison");
}
