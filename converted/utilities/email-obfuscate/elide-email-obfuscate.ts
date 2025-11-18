/**
 * Email Obfuscate - Email Address Obfuscation
 *
 * Obfuscate email addresses to prevent scraping.
 * **POLYGLOT SHOWCASE**: One obfuscator for ALL languages on Elide!
 */

export function obfuscate(email: string): string {
  return email.split('').map(char => {
    if (char === '@') return '&#64;';
    return `&#${char.charCodeAt(0)};`;
  }).join('');
}

export function obfuscateSimple(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  return `${local.substring(0, 3)}***@${domain}`;
}

export function deobfuscate(html: string): string {
  return html.replace(/&#(\d+);/g, (match, code) => {
    return String.fromCharCode(parseInt(code));
  });
}

export default { obfuscate, obfuscateSimple, deobfuscate };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔒 Email Obfuscate - Email Obfuscation for Elide (POLYGLOT!)\n");

  const email = "user@example.com";
  const obfuscated = obfuscate(email);
  const simple = obfuscateSimple(email);

  console.log("Original:", email);
  console.log("HTML entities:", obfuscated);
  console.log("Simple:", simple);
  console.log("Deobfuscated:", deobfuscate(obfuscated));

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
