/**
 * Email Formatter - Email Formatting Library
 *
 * Format and normalize email addresses.
 * **POLYGLOT SHOWCASE**: One formatter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-formatter (~10K+ downloads/week)
 */

export function normalize(email: string): string {
  return email.toLowerCase().trim();
}

export function format(email: string, name?: string): string {
  if (name) {
    return `${name} <${normalize(email)}>`;
  }
  return normalize(email);
}

export function parse(formatted: string): { name?: string; email: string } {
  const match = formatted.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].toLowerCase() };
  }
  return { email: formatted.toLowerCase().trim() };
}

export default { normalize, format, parse };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✉️  Email Formatter - Email Formatting for Elide (POLYGLOT!)\n");

  console.log("Normalize:", normalize("  USER@EXAMPLE.COM  "));
  console.log("Format:", format("user@example.com", "John Doe"));
  console.log("Parse:", parse("John Doe <user@example.com>"));

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
