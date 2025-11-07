/**
 * HTML Entities Encoder/Decoder
 *
 * Encode and decode HTML entities for web security and display
 * Prevents XSS attacks by escaping HTML special characters
 *
 * escape-html package has ~35M downloads/week on npm!
 */

// HTML entity map
const htmlEntities: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

const htmlEntitiesReverse: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x2F;': '/',
  '&apos;': "'",
};

// Extended entity map (common named entities)
const extendedEntities: { [key: string]: string } = {
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '¢': '&cent;',
  '§': '&sect;',
  '¶': '&para;',
  '†': '&dagger;',
  '‡': '&Dagger;',
  '•': '&bull;',
  '…': '&hellip;',
  '′': '&prime;',
  '″': '&Prime;',
  '←': '&larr;',
  '→': '&rarr;',
  '↑': '&uarr;',
  '↓': '&darr;',
  '↔': '&harr;',
  '⇐': '&lArr;',
  '⇒': '&rArr;',
  '⇑': '&uArr;',
  '⇓': '&dArr;',
  '⇔': '&hArr;',
  '∀': '&forall;',
  '∂': '&part;',
  '∃': '&exist;',
  '∅': '&empty;',
  '∇': '&nabla;',
  '∈': '&isin;',
  '∉': '&notin;',
  '∋': '&ni;',
  '∏': '&prod;',
  '∑': '&sum;',
  '−': '&minus;',
  '∗': '&lowast;',
  '√': '&radic;',
  '∝': '&prop;',
  '∞': '&infin;',
  '∠': '&ang;',
  '∧': '&and;',
  '∨': '&or;',
  '∩': '&cap;',
  '∪': '&cup;',
  '∫': '&int;',
  '≈': '&asymp;',
  '≠': '&ne;',
  '≡': '&equiv;',
  '≤': '&le;',
  '≥': '&ge;',
  '⊂': '&sub;',
  '⊃': '&sup;',
  '⊆': '&sube;',
  '⊇': '&supe;',
  '⊕': '&oplus;',
  '⊗': '&otimes;',
  '⊥': '&perp;',
  '⋅': '&sdot;',
  ' ': '&nbsp;',
};

/**
 * Escape HTML special characters
 */
export function escape(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.replace(/[&<>"'\/]/g, char => htmlEntities[char] || char);
}

/**
 * Unescape HTML entities
 */
export function unescape(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Named entities
    .replace(/&[a-zA-Z]+;/g, entity => {
      const reversed = Object.entries(extendedEntities).find(([_, val]) => val === entity);
      if (reversed) return reversed[0];
      return htmlEntitiesReverse[entity] || entity;
    })
    // Numeric entities (&#123; or &#xAB;)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Encode text with extended entities (includes symbols)
 */
export function encodeExtended(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let result = escape(text);

  // Replace extended characters
  for (const [char, entity] of Object.entries(extendedEntities)) {
    result = result.replace(new RegExp(char, 'g'), entity);
  }

  return result;
}

/**
 * Encode text as numeric entities (&#123;)
 */
export function encodeNumeric(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    // Only encode non-ASCII and special HTML characters
    if (code > 127 || htmlEntities[char]) {
      return `&#${code};`;
    }
    return char;
  }).join('');
}

/**
 * Encode text as hexadecimal entities (&#xAB;)
 */
export function encodeHex(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    // Only encode non-ASCII and special HTML characters
    if (code > 127 || htmlEntities[char]) {
      return `&#x${code.toString(16).toUpperCase()};`;
    }
    return char;
  }).join('');
}

// CLI Demo
if (import.meta.url.includes("elide-html-entities.ts")) {
  console.log("🎯 HTML Entities Encoder/Decoder for Elide\n");

  console.log("=== Example 1: Basic Escaping (XSS Prevention) ===");
  const userInput = '<script>alert("XSS")</script>';
  console.log(`Input:  ${userInput}`);
  console.log(`Escaped: ${escape(userInput)}`);
  console.log();

  console.log("=== Example 2: Quotes and Ampersands ===");
  const text = 'Tom & Jerry say "Hello" & \'Goodbye\'';
  console.log(`Input:  ${text}`);
  console.log(`Escaped: ${escape(text)}`);
  console.log();

  console.log("=== Example 3: Unescaping ===");
  const encoded = '&lt;div class=&quot;example&quot;&gt;Hello &amp; Goodbye&lt;/div&gt;';
  console.log(`Encoded:   ${encoded}`);
  console.log(`Decoded:   ${unescape(encoded)}`);
  console.log();

  console.log("=== Example 4: Extended Entities (Symbols) ===");
  const symbols = 'Price: €50, © 2025, 1 + 1 ≠ 3, ∞ is big';
  console.log(`Input:    ${symbols}`);
  console.log(`Encoded:  ${encodeExtended(symbols)}`);
  console.log(`Decoded:  ${unescape(encodeExtended(symbols))}`);
  console.log();

  console.log("=== Example 5: Numeric Encoding ===");
  const unicode = 'Hello 世界 🌍';
  console.log(`Input:     ${unicode}`);
  console.log(`Numeric:   ${encodeNumeric(unicode)}`);
  console.log(`Hex:       ${encodeHex(unicode)}`);
  console.log();

  console.log("=== Example 6: Real-World Use Case (Blog Comments) ===");
  const comment = 'Great post! Check out <a href="http://evil.com">my site</a> & read more.';
  console.log(`User comment: ${comment}`);
  console.log(`Safe HTML:    ${escape(comment)}`);
  console.log();

  console.log("=== Example 7: Round-Trip Test ===");
  const original = '<div id="test">Hello & "Goodbye"</div>';
  const escaped = escape(original);
  const unescaped = unescape(escaped);
  console.log(`Original:   ${original}`);
  console.log(`Escaped:    ${escaped}`);
  console.log(`Unescaped:  ${unescaped}`);
  console.log(`Match:      ${original === unescaped}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- XSS attack prevention");
  console.log("- User-generated content display");
  console.log("- Blog comments, forums");
  console.log("- HTML email templates");
  console.log("- RSS/XML feeds");
  console.log("- JSON with HTML snippets");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- escape-html: ~35M downloads/week on npm");
}

export default { escape, unescape, encodeExtended, encodeNumeric, encodeHex };
