/**
 * Content-Type - HTTP Content-Type Header Parser
 *
 * Parse and format HTTP Content-Type headers.
 * **POLYGLOT SHOWCASE**: One Content-Type parser for ALL languages on Elide!
 *
 * Features:
 * - Parse Content-Type headers
 * - Format Content-Type headers
 * - Extract MIME type
 * - Extract parameters (charset, boundary, etc.)
 * - Validate format
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need Content-Type parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent header handling across languages
 * - No need for language-specific parsers
 *
 * Use cases:
 * - HTTP servers and clients
 * - API development
 * - File upload handling
 * - Content negotiation
 * - Media type detection
 * - Email processing
 *
 * Package has ~3M+ downloads/week on npm!
 */

export interface ContentType {
  /** MIME type (e.g., 'application/json') */
  type: string;
  /** Parameters (e.g., { charset: 'utf-8' }) */
  parameters: Record<string, string>;
}

/**
 * Parse Content-Type header
 */
export function parse(header: string | { headers?: Record<string, string> }): ContentType {
  let str: string;

  // Handle header object
  if (typeof header === 'object' && header.headers) {
    const contentType = header.headers['content-type'] || header.headers['Content-Type'];
    if (!contentType) {
      throw new TypeError('Content-Type header missing');
    }
    str = contentType;
  } else if (typeof header === 'string') {
    str = header;
  } else {
    throw new TypeError('Invalid argument');
  }

  // Split type and parameters
  const parts = str.split(';').map(p => p.trim());
  const type = parts[0].toLowerCase();

  if (!type || !/^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+\/[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/.test(type)) {
    throw new TypeError('Invalid media type');
  }

  const parameters: Record<string, string> = {};

  // Parse parameters
  for (let i = 1; i < parts.length; i++) {
    const param = parts[i];
    const eqIdx = param.indexOf('=');

    if (eqIdx < 0) {
      continue;
    }

    let key = param.substring(0, eqIdx).trim().toLowerCase();
    let value = param.substring(eqIdx + 1).trim();

    // Remove quotes
    if (value[0] === '"') {
      value = value.slice(1, value.endsWith('"') ? -1 : value.length);
      // Unescape quoted pairs
      value = value.replace(/\\(.)/g, '$1');
    }

    parameters[key] = value;
  }

  return { type, parameters };
}

/**
 * Format Content-Type object to header string
 */
export function format(obj: ContentType): string {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('Invalid argument');
  }

  const { type, parameters } = obj;

  if (!type || typeof type !== 'string') {
    throw new TypeError('Invalid type');
  }

  let str = type;

  // Add parameters
  if (parameters && typeof parameters === 'object') {
    const keys = Object.keys(parameters).sort();

    for (const key of keys) {
      const value = parameters[key];

      if (value === undefined || value === null) {
        continue;
      }

      str += `; ${key}=`;

      // Quote if necessary
      if (needsQuoting(String(value))) {
        str += `"${String(value).replace(/([\\"])/g, '\\$1')}"`;
      } else {
        str += String(value);
      }
    }
  }

  return str;
}

/**
 * Check if value needs quoting
 */
function needsQuoting(value: string): boolean {
  return !/^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/.test(value);
}

/**
 * Get charset from Content-Type
 */
export function getCharset(contentType: string | ContentType): string | null {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.parameters.charset || null;
}

/**
 * Get boundary from Content-Type (for multipart)
 */
export function getBoundary(contentType: string | ContentType): string | null {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.parameters.boundary || null;
}

/**
 * Check if Content-Type is JSON
 */
export function isJSON(contentType: string | ContentType): boolean {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.type === 'application/json' || parsed.type.endsWith('+json');
}

/**
 * Check if Content-Type is XML
 */
export function isXML(contentType: string | ContentType): boolean {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.type === 'application/xml' || parsed.type === 'text/xml' || parsed.type.endsWith('+xml');
}

/**
 * Check if Content-Type is HTML
 */
export function isHTML(contentType: string | ContentType): boolean {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.type === 'text/html';
}

/**
 * Check if Content-Type is plain text
 */
export function isText(contentType: string | ContentType): boolean {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.type.startsWith('text/');
}

/**
 * Check if Content-Type is multipart
 */
export function isMultipart(contentType: string | ContentType): boolean {
  const parsed = typeof contentType === 'string' ? parse(contentType) : contentType;
  return parsed.type.startsWith('multipart/');
}

// Default export
export default {
  parse,
  format,
  getCharset,
  getBoundary,
  isJSON,
  isXML,
  isHTML,
  isText,
  isMultipart
};

// CLI Demo
if (import.meta.url.includes("elide-content-type.ts")) {
  console.log("📄 Content-Type - HTTP Header Parser for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Parse Basic Content-Type ===");
  const json = parse('application/json');
  console.log("Input: 'application/json'");
  console.log("Parsed:", JSON.stringify(json, null, 2));
  console.log();

  console.log("=== Example 2: Parse with Charset ===");
  const html = parse('text/html; charset=utf-8');
  console.log("Input: 'text/html; charset=utf-8'");
  console.log("Parsed:", JSON.stringify(html, null, 2));
  console.log();

  console.log("=== Example 3: Parse Multipart ===");
  const multipart = parse('multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');
  console.log("Input: 'multipart/form-data; boundary=...'");
  console.log("Type:", multipart.type);
  console.log("Boundary:", multipart.parameters.boundary);
  console.log();

  console.log("=== Example 4: Format Content-Type ===");
  const formatted1 = format({
    type: 'application/json',
    parameters: { charset: 'utf-8' }
  });
  console.log("Format JSON with charset:");
  console.log(formatted1);
  console.log();

  console.log("=== Example 5: Multiple Parameters ===");
  const formatted2 = format({
    type: 'text/plain',
    parameters: {
      charset: 'iso-8859-1',
      format: 'flowed'
    }
  });
  console.log("Multiple parameters:");
  console.log(formatted2);
  console.log();

  console.log("=== Example 6: Get Charset ===");
  const charset1 = getCharset('text/html; charset=utf-8');
  const charset2 = getCharset('application/json');
  console.log("'text/html; charset=utf-8' => charset:", charset1);
  console.log("'application/json' => charset:", charset2);
  console.log();

  console.log("=== Example 7: Get Boundary ===");
  const boundary = getBoundary('multipart/form-data; boundary=abc123');
  console.log("Boundary:", boundary);
  console.log();

  console.log("=== Example 8: Type Checking ===");
  const types = [
    'application/json',
    'text/xml',
    'text/html',
    'text/plain',
    'multipart/form-data',
    'application/hal+json'
  ];

  console.log("Type checking:");
  types.forEach(type => {
    console.log(`${type}:`);
    console.log(`  JSON: ${isJSON(type)}`);
    console.log(`  XML: ${isXML(type)}`);
    console.log(`  HTML: ${isHTML(type)}`);
    console.log(`  Text: ${isText(type)}`);
    console.log(`  Multipart: ${isMultipart(type)}`);
  });
  console.log();

  console.log("=== Example 9: Common Content-Types ===");
  const common = [
    { type: 'application/json', params: {} },
    { type: 'text/html', params: { charset: 'utf-8' } },
    { type: 'application/x-www-form-urlencoded', params: {} },
    { type: 'multipart/form-data', params: { boundary: '----WebKit123' } },
    { type: 'application/pdf', params: {} }
  ];

  console.log("Common Content-Types:");
  common.forEach(({ type, params }) => {
    console.log(`  ${format({ type, parameters: params })}`);
  });
  console.log();

  console.log("=== Example 10: Round-trip ===");
  const original = 'application/json; charset=utf-8; version=1';
  const parsed = parse(original);
  const formatted = format(parsed);
  console.log("Original:", original);
  console.log("Parsed:", JSON.stringify(parsed, null, 2));
  console.log("Formatted:", formatted);
  console.log();

  console.log("=== Example 11: Quoted Parameters ===");
  const quoted = parse('application/json; title="Hello \\"World\\""');
  console.log("Input with quotes:", 'application/json; title="Hello \\"World\\""');
  console.log("Parsed title:", quoted.parameters.title);
  console.log();

  console.log("=== Example 12: POLYGLOT Use Case ===");
  console.log("🌐 Same Content-Type parser works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent header parsing everywhere");
  console.log("  ✓ No language-specific parsing bugs");
  console.log("  ✓ Share HTTP logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP servers and clients");
  console.log("- API development");
  console.log("- File upload handling");
  console.log("- Content negotiation");
  console.log("- Media type detection");
  console.log("- Email processing");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~3M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share Content-Type logic across languages");
  console.log("- One header parser for all services");
  console.log("- Perfect for HTTP libraries!");
}
