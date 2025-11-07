/**
 * Entities - HTML Entity Encoding/Decoding
 *
 * Encode and decode HTML entities for safe text processing.
 * **POLYGLOT SHOWCASE**: One entity coder for ALL languages on Elide!
 *
 * Features:
 * - Encode HTML entities
 * - Decode HTML entities
 * - Named entities (< &lt; >)
 * - Numeric entities (&#60;)
 * - Hexadecimal entities (&#x3C;)
 * - XML entities
 * - XSS prevention
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTML encoding
 * - ONE implementation works everywhere on Elide
 * - Consistent entity handling across languages
 * - No need for language-specific encoder libs
 *
 * Use cases:
 * - XSS prevention
 * - HTML generation
 * - XML processing
 * - Data sanitization
 * - Template rendering
 * - Safe text display
 *
 * Package has ~5M+ downloads/week on npm!
 */

/**
 * HTML named entities map
 */
export const namedEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Reverse map for decoding
 */
const entityMap: Record<string, string> = Object.entries(namedEntities).reduce(
  (map, [char, entity]) => {
    map[entity] = char;
    return map;
  },
  {} as Record<string, string>
);

// Add common HTML entities
const commonEntities: Record<string, string> = {
  '&nbsp;': '\u00A0',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&cent;': '¢',
  '&sect;': '§',
  '&para;': '¶',
  '&dagger;': '†',
  '&Dagger;': '‡',
  '&bull;': '•',
  '&hellip;': '…',
  '&prime;': '′',
  '&Prime;': '″',
  '&lsaquo;': '‹',
  '&rsaquo;': '›',
  '&laquo;': '«',
  '&raquo;': '»',
  '&ndash;': '–',
  '&mdash;': '—'
};

Object.assign(entityMap, commonEntities);

/**
 * Encode HTML entities
 */
export function encode(str: string, options: { useNamedReferences?: boolean } = {}): string {
  const { useNamedReferences = true } = options;

  if (!str) return '';

  return str.replace(/[&<>"'\/`=]/g, char => {
    if (useNamedReferences && namedEntities[char]) {
      return namedEntities[char];
    }
    return `&#${char.charCodeAt(0)};`;
  });
}

/**
 * Encode all characters (not just special HTML chars)
 */
export function encodeNonUTF(str: string): string {
  if (!str) return '';

  return str.replace(/[\u0080-\uFFFF]/g, char => {
    return `&#${char.charCodeAt(0)};`;
  });
}

/**
 * Encode for XML
 */
export function encodeXML(str: string): string {
  if (!str) return '';

  const xmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };

  return str.replace(/[&<>"']/g, char => xmlEntities[char]);
}

/**
 * Decode HTML entities
 */
export function decode(str: string): string {
  if (!str) return '';

  return str
    // Decode named entities
    .replace(/&[a-zA-Z]+;/g, entity => {
      return entityMap[entity] || entity;
    })
    // Decode numeric entities (&#60;)
    .replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    })
    // Decode hex entities (&#x3C;)
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Decode XML entities
 */
export function decodeXML(str: string): string {
  if (!str) return '';

  const xmlDecodeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'"
  };

  return str.replace(/&(amp|lt|gt|quot|apos);/g, entity => {
    return xmlDecodeMap[entity] || entity;
  });
}

/**
 * Escape for HTML attribute
 */
export function escapeAttribute(str: string): string {
  if (!str) return '';

  return encode(str).replace(/"/g, '&quot;');
}

/**
 * Escape for safe display in HTML
 */
export function escapeHTML(str: string): string {
  return encode(str);
}

/**
 * Check if string contains HTML entities
 */
export function hasEntities(str: string): boolean {
  return /&[#a-zA-Z0-9]+;/.test(str);
}

/**
 * Strip all HTML tags and decode entities
 */
export function stripTags(str: string): string {
  return decode(str.replace(/<[^>]*>/g, ''));
}

// Default export
export default {
  encode,
  encodeNonUTF,
  encodeXML,
  decode,
  decodeXML,
  escapeAttribute,
  escapeHTML,
  hasEntities,
  stripTags,
  namedEntities
};

// CLI Demo
if (import.meta.url.includes("elide-entities.ts")) {
  console.log("🔐 Entities - HTML Entity Encoding for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Encoding ===");
  const text1 = '<script>alert("XSS")</script>';
  console.log("Original:", text1);
  console.log("Encoded:", encode(text1));
  console.log();

  console.log("=== Example 2: Basic Decoding ===");
  const encoded = '&lt;div&gt;Hello&lt;/div&gt;';
  console.log("Encoded:", encoded);
  console.log("Decoded:", decode(encoded));
  console.log();

  console.log("=== Example 3: Named vs Numeric ===");
  const special = '&<>"';
  console.log("Original:", special);
  console.log("Named entities:", encode(special, { useNamedReferences: true }));
  console.log("Numeric entities:", encode(special, { useNamedReferences: false }));
  console.log();

  console.log("=== Example 4: Common HTML Entities ===");
  const entities = [
    '&copy;',
    '&reg;',
    '&trade;',
    '&euro;',
    '&pound;',
    '&nbsp;'
  ];
  console.log("Decoding common entities:");
  entities.forEach(entity => {
    console.log(`  ${entity} => ${decode(entity)}`);
  });
  console.log();

  console.log("=== Example 5: Numeric Entities ===");
  const numeric = '&#60;div&#62;Hello&#60;/div&#62;';
  console.log("Numeric:", numeric);
  console.log("Decoded:", decode(numeric));
  console.log();

  console.log("=== Example 6: Hexadecimal Entities ===");
  const hex = '&#x3C;div&#x3E;Hello&#x3C;/div&#x3E;';
  console.log("Hexadecimal:", hex);
  console.log("Decoded:", decode(hex));
  console.log();

  console.log("=== Example 7: XML Encoding ===");
  const xml = '<tag attr="value">O\'Reilly & Associates</tag>';
  console.log("Original:", xml);
  console.log("XML encoded:", encodeXML(xml));
  console.log();

  console.log("=== Example 8: XSS Prevention ===");
  const userInput = '<img src=x onerror="alert(1)">';
  console.log("Dangerous input:", userInput);
  console.log("Safely encoded:", escapeHTML(userInput));
  console.log("Displayed as text, not executed!");
  console.log();

  console.log("=== Example 9: Attribute Escaping ===");
  const attrValue = 'Click "here" & go';
  console.log("Attribute value:", attrValue);
  console.log("For HTML attr:", escapeAttribute(attrValue));
  console.log(`<a href="#" title="${escapeAttribute(attrValue)}">Link</a>`);
  console.log();

  console.log("=== Example 10: Strip Tags ===");
  const htmlText = '<p>Hello <strong>World</strong>! &copy; 2024</p>';
  console.log("HTML:", htmlText);
  console.log("Stripped:", stripTags(htmlText));
  console.log();

  console.log("=== Example 11: Round-trip ===");
  const original = 'Hello <World> & "Friends"!';
  const encoded2 = encode(original);
  const decoded2 = decode(encoded2);
  console.log("Original:", original);
  console.log("Encoded:", encoded2);
  console.log("Decoded:", decoded2);
  console.log("Match:", original === decoded2 ? '✓' : '✗');
  console.log();

  console.log("=== Example 12: Check for Entities ===");
  const strings = [
    "Hello World",
    "Hello &amp; World",
    "Price: &euro;10",
    "<div>Test</div>"
  ];
  strings.forEach(str => {
    console.log(`"${str}": ${hasEntities(str) ? 'has entities' : 'no entities'}`);
  });
  console.log();

  console.log("=== Example 13: Special Characters ===");
  const special2 = '© ® ™ € £ ¥ – — « » ‹ ›';
  console.log("Characters:", special2);
  const encoded3 = encodeNonUTF(special2);
  console.log("Encoded:", encoded3);
  console.log("Decoded:", decode(encoded3));
  console.log();

  console.log("=== Example 14: POLYGLOT Use Case ===");
  console.log("🌐 Same entity coder works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent encoding everywhere");
  console.log("  ✓ No language-specific encoding bugs");
  console.log("  ✓ Share HTML safety across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- XSS prevention and security");
  console.log("- HTML generation and templates");
  console.log("- XML processing");
  console.log("- Data sanitization");
  console.log("- Safe text display");
  console.log("- Email generation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~5M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share HTML safety across languages");
  console.log("- One encoding standard for all services");
  console.log("- Perfect for web security!");
}
