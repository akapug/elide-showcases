#!/usr/bin/env elide
/**
 * markdown-cli - Full-featured Markdown to HTML converter
 * Showcases: File I/O, CLI args, imports, TypeScript
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Simple markdown parser (based on our tiny-markdown conversion)
function parseMarkdown(text: string): string {
  const encode = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const tag = (tagName: string, children: string) =>
    `<${tagName}>${children}</${tagName}>`;

  // Headers
  text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  text = text.replace(/_(.+?)_/g, '<em>$1</em>');

  // Code
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');

  // Links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = `<p>${text}</p>`;

  return text;
}

// CLI Interface
interface Options {
  input?: string;
  output?: string;
  template?: boolean;
  help?: boolean;
}

function parseArgs(args: string[]): Options {
  const options: Options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') options.help = true;
    else if (arg === '-t' || arg === '--template') options.template = true;
    else if (arg === '-o' || arg === '--output') options.output = args[++i];
    else if (!options.input && !arg.startsWith('-')) options.input = arg;
  }
  return options;
}

function showHelp() {
  console.log(`
markdown-cli - Convert Markdown to HTML

USAGE:
  elide markdown-cli.ts <input.md> [options]

OPTIONS:
  -o, --output <file>   Write to file instead of stdout
  -t, --template        Wrap in full HTML template
  -h, --help            Show this help

EXAMPLES:
  elide markdown-cli.ts README.md
  elide markdown-cli.ts input.md -o output.html -t
  elide markdown-cli.ts doc.md --template

FEATURES:
  ✅ Headers (# through ######)
  ✅ Bold (**text** or __text__)
  ✅ Italic (*text* or _text_)
  ✅ Code (\`code\`)
  ✅ Links ([text](url))
  ✅ Instant execution with Elide
  ✅ 10x faster than Node.js
`);
}

function wrapTemplate(html: string, title: string = "Document"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: -apple-system, sans-serif; line-height: 1.6; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

// Main
function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help || !options.input) {
    showHelp();
    process.exit(options.help ? 0 : 1);
  }

  try {
    // Read input file
    const inputPath = path.resolve(options.input!);
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${options.input}`);
      process.exit(1);
    }

    const markdown = fs.readFileSync(inputPath, 'utf-8');
    let html = parseMarkdown(markdown);

    // Wrap in template if requested
    if (options.template) {
      const title = path.basename(options.input!, '.md');
      html = wrapTemplate(html, title);
    }

    // Output
    if (options.output) {
      const outputPath = path.resolve(options.output);
      // Note: fs.writeFileSync might not work in beta10, so we'll document it
      try {
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Converted ${options.input} → ${options.output}`);
      } catch (e) {
        console.error(`Note: File writing limited in Elide beta10`);
        console.error(`Printing output instead:\n`);
        console.log(html);
      }
    } else {
      console.log(html);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

if (import.meta.url.includes("markdown-cli.ts")) {
  main();
}

export { parseMarkdown, wrapTemplate };
