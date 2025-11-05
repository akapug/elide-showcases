/**
 * Escape HTML - HTML Entity Escaping
 *
 * Escape HTML characters to prevent XSS attacks and display user content safely.
 * **POLYGLOT SHOWCASE**: One HTML escaper for ALL languages on Elide!
 *
 * Features:
 * - Escape dangerous HTML characters
 * - Prevent XSS (Cross-Site Scripting)
 * - Safe user-generated content display
 * - Fast and lightweight
 * - Comprehensive entity coverage
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTML escaping
 * - ONE implementation works everywhere on Elide
 * - Consistent XSS prevention across languages
 * - No need for language-specific escaping libs
 *
 * Use cases:
 * - Web applications and templates
 * - User-generated content (comments, posts)
 * - HTML email generation
 * - Server-side rendering
 * - API responses with HTML
 * - Security: XSS prevention
 *
 * Package has ~30M+ downloads/week on npm!
 */

/**
 * HTML entity mapping for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Regex pattern for matching characters that need escaping
 */
const ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escape HTML special characters
 */
export default function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(ESCAPE_REGEX, char => HTML_ENTITIES[char]);
}

/**
 * Escape HTML (named export)
 */
export function escape(str: string): string {
  return escapeHtml(str);
}

/**
 * Unescape HTML entities back to characters
 */
export function unescape(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/**
 * Escape HTML for attribute values
 */
export function escapeAttribute(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Also escape single quotes for attributes
  return str.replace(/[&<>"']/g, char => HTML_ENTITIES[char]);
}

/**
 * Escape HTML but preserve specific tags
 */
export function escapeExcept(str: string, allowedTags: string[]): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Simple implementation: escape everything except allowed tags
  const tagPattern = /<\/?(\w+)[^>]*>/g;
  const parts: Array<{ text: string; isTag: boolean; tagName?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(str)) !== null) {
    // Add text before tag
    if (match.index > lastIndex) {
      parts.push({ text: str.substring(lastIndex, match.index), isTag: false });
    }

    // Add tag
    const tagName = match[1].toLowerCase();
    parts.push({ text: match[0], isTag: true, tagName });

    lastIndex = tagPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < str.length) {
    parts.push({ text: str.substring(lastIndex), isTag: false });
  }

  return parts
    .map(part => {
      if (part.isTag && allowedTags.includes(part.tagName!)) {
        return part.text; // Keep allowed tags
      } else if (part.isTag) {
        return escapeHtml(part.text); // Escape disallowed tags
      } else {
        return escapeHtml(part.text); // Escape text
      }
    })
    .join('');
}

/**
 * Check if string contains HTML
 */
export function containsHtml(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Strip all HTML tags
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escape for JavaScript string context
 */
export function escapeJs(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\//g, '\\/')
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E');
}

/**
 * Escape for SQL LIKE clause
 */
export function escapeSql(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Escape for regex
 */
export function escapeRegex(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// CLI Demo
if (import.meta.url.includes("elide-escape-html.ts")) {
  console.log("🔒 Escape HTML - XSS Prevention for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Escaping ===");
  const dangerous1 = "<script>alert('XSS')</script>";
  const safe1 = escapeHtml(dangerous1);
  console.log("Input:", dangerous1);
  console.log("Escaped:", safe1);
  console.log();

  console.log("=== Example 2: User Comment ===");
  const comment = "I love <3 this & that's \"great\"!";
  const safeComment = escapeHtml(comment);
  console.log("Comment:", comment);
  console.log("Safe:", safeComment);
  console.log();

  console.log("=== Example 3: All Special Characters ===");
  const special = '& < > " \' are escaped';
  const escaped = escapeHtml(special);
  console.log("Input:", special);
  console.log("Escaped:", escaped);
  console.log();

  console.log("=== Example 4: XSS Attack Attempts ===");
  const attacks = [
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '"><script>alert(1)</script>',
    "javascript:alert('XSS')",
    '<iframe src="evil.com"></iframe>'
  ];

  console.log("XSS attempts (escaped):");
  attacks.forEach((attack, i) => {
    console.log(`  ${i + 1}. ${escapeHtml(attack)}`);
  });
  console.log();

  console.log("=== Example 5: Unescape HTML ===");
  const encoded = "&lt;div&gt;Hello &amp; goodbye&lt;/div&gt;";
  const decoded = unescape(encoded);
  console.log("Encoded:", encoded);
  console.log("Decoded:", decoded);
  console.log();

  console.log("=== Example 6: HTML Attributes ===");
  const title = 'He said "Hello" & waved';
  const attrSafe = escapeAttribute(title);
  console.log("Title:", title);
  console.log("Attribute:", attrSafe);
  console.log(`HTML: <div title="${attrSafe}">Content</div>`);
  console.log();

  console.log("=== Example 7: Round Trip ===");
  const original = 'Testing <tags> & "quotes"';
  const escaped2 = escapeHtml(original);
  const unescaped = unescape(escaped2);
  console.log("Original:", original);
  console.log("Escaped:", escaped2);
  console.log("Unescaped:", unescaped);
  console.log("Match:", original === unescaped);
  console.log();

  console.log("=== Example 8: Contains HTML Check ===");
  const samples = [
    'Plain text',
    'Text with <tags>',
    'Text with &lt;escaped&gt;',
    '<p>Paragraph</p>',
    'No HTML here!'
  ];

  console.log("HTML detection:");
  samples.forEach(sample => {
    console.log(`  "${sample}" => ${containsHtml(sample)}`);
  });
  console.log();

  console.log("=== Example 9: Strip HTML ===");
  const html = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
  const stripped = stripHtml(html);
  console.log("HTML:", html);
  console.log("Stripped:", stripped);
  console.log();

  console.log("=== Example 10: Escape Allowed Tags ===");
  const mixed = '<p>Safe paragraph</p> but <script>alert(1)</script> is not';
  const selective = escapeExcept(mixed, ['p', 'strong', 'em']);
  console.log("Input:", mixed);
  console.log("Allow <p>:", selective);
  console.log();

  console.log("=== Example 11: User-Generated Content ===");
  const userPost = `Check out this "amazing" site: <script>steal()</script>
It's really <great> & I love it!`;
  const safePost = escapeHtml(userPost);
  console.log("User post:");
  console.log(userPost);
  console.log("\nSafe version:");
  console.log(safePost);
  console.log();

  console.log("=== Example 12: JavaScript Context ===");
  const jsString = 'Hello "world"\n<script>alert(1)</script>';
  const jsSafe = escapeJs(jsString);
  console.log("String:", jsString);
  console.log("JS-safe:", jsSafe);
  console.log(`JS code: var msg = "${jsSafe}";`);
  console.log();

  console.log("=== Example 13: SQL Escaping ===");
  const sqlInput = "O'Reilly's 50% discount";
  const sqlSafe = escapeSql(sqlInput);
  console.log("Input:", sqlInput);
  console.log("SQL-safe:", sqlSafe);
  console.log(`SQL: WHERE name LIKE '%${sqlSafe}%'`);
  console.log();

  console.log("=== Example 14: Regex Escaping ===");
  const regexInput = "test.*+?^${}()|[]\\special";
  const regexSafe = escapeRegex(regexInput);
  console.log("Input:", regexInput);
  console.log("Regex-safe:", regexSafe);
  console.log("Pattern:", new RegExp(regexSafe));
  console.log();

  console.log("=== Example 15: Template Rendering ===");
  const userData = {
    name: 'Alice <admin>',
    bio: 'I love coding & "clean code"!',
    website: '<script>bad()</script>https://example.com'
  };

  console.log("User data (escaped for display):");
  console.log(`  Name: ${escapeHtml(userData.name)}`);
  console.log(`  Bio: ${escapeHtml(userData.bio)}`);
  console.log(`  Website: ${escapeHtml(userData.website)}`);
  console.log();

  console.log("=== Example 16: Email Template ===");
  const emailSubject = 'Special offer: 50% off "Premium" plan!';
  const emailBody = 'Hello & welcome! <Click here> to claim your discount.';

  console.log("Email (HTML-safe):");
  console.log(`  Subject: ${escapeHtml(emailSubject)}`);
  console.log(`  Body: ${escapeHtml(emailBody)}`);
  console.log();

  console.log("=== Example 17: Security Comparison ===");
  const xssPayload = '"><img src=x onerror=alert(document.cookie)>';
  console.log("XSS Payload:", xssPayload);
  console.log("Without escaping: VULNERABLE!");
  console.log(`Without: <input value="${xssPayload}">`);
  console.log("\nWith escaping: SAFE!");
  console.log(`With: <input value="${escapeHtml(xssPayload)}">`);
  console.log();

  console.log("=== Example 18: POLYGLOT Use Case ===");
  console.log("🌐 Same HTML escaper works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent XSS prevention everywhere");
  console.log("  ✓ No language-specific escaping bugs");
  console.log("  ✓ Share security logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Web applications and templates");
  console.log("- User-generated content display");
  console.log("- HTML email generation");
  console.log("- Server-side rendering");
  console.log("- API responses with HTML");
  console.log("- XSS prevention (security!)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~30M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share security escaping across languages");
  console.log("- One XSS prevention standard for all services");
  console.log("- CRITICAL for web security!");
}
