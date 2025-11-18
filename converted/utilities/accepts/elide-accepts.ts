/**
 * Accepts - Content Negotiation
 *
 * Higher level content negotiation based on negotiator.
 * **POLYGLOT SHOWCASE**: Content negotiation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/accepts (~30M downloads/week)
 *
 * Features:
 * - Accept header parsing
 * - Content type negotiation
 * - Encoding negotiation
 * - Language negotiation
 * - Charset negotiation
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need content negotiation
 * - ONE negotiation logic works everywhere on Elide
 * - Consistent content handling across languages
 * - Share negotiation rules across your stack
 *
 * Use cases:
 * - REST API versioning
 * - Internationalization (i18n)
 * - Response format selection
 * - Compression negotiation
 *
 * Package has ~30M downloads/week on npm - essential HTTP utility!
 */

interface Request {
  headers: Record<string, string>;
}

/**
 * Parse accept header
 */
function parseAccept(acceptHeader: string = "*/*"): Array<{ type: string; q: number }> {
  return acceptHeader
    .split(",")
    .map((part) => {
      const [type, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? parseFloat(qParam.split("=")[1]) : 1;
      return { type: type.trim(), q };
    })
    .sort((a, b) => b.q - a.q);
}

/**
 * Check if type matches
 */
function typeMatches(accepted: string, offered: string): boolean {
  if (accepted === "*/*") return true;
  if (accepted.endsWith("/*")) {
    const prefix = accepted.slice(0, -2);
    return offered.startsWith(prefix);
  }
  return accepted === offered;
}

/**
 * Accepts class for content negotiation
 */
export class Accepts {
  private request: Request;

  constructor(req: Request) {
    this.request = req;
  }

  /**
   * Check if types are acceptable
   */
  type(types: string | string[]): string | false {
    const acceptHeader = this.request.headers["accept"] || "*/*";
    const accepted = parseAccept(acceptHeader);
    const typeArray = Array.isArray(types) ? types : [types];

    for (const acceptedType of accepted) {
      for (const offeredType of typeArray) {
        if (typeMatches(acceptedType.type, offeredType)) {
          return offeredType;
        }
      }
    }

    return false;
  }

  /**
   * Check if types are acceptable (alias)
   */
  types(...types: string[]): string | false {
    return this.type(types);
  }

  /**
   * Check if encodings are acceptable
   */
  encoding(encodings: string | string[]): string | false {
    const acceptEncoding = this.request.headers["accept-encoding"] || "";
    const encodingArray = Array.isArray(encodings) ? encodings : [encodings];

    if (!acceptEncoding) {
      return encodingArray[0] || false;
    }

    const accepted = acceptEncoding.split(",").map((e) => e.trim());

    for (const enc of encodingArray) {
      if (accepted.includes(enc) || accepted.includes("*")) {
        return enc;
      }
    }

    return false;
  }

  /**
   * Check if encodings are acceptable (alias)
   */
  encodings(...encodings: string[]): string | false {
    return this.encoding(encodings);
  }

  /**
   * Check if charsets are acceptable
   */
  charset(charsets: string | string[]): string | false {
    const acceptCharset = this.request.headers["accept-charset"] || "";
    const charsetArray = Array.isArray(charsets) ? charsets : [charsets];

    if (!acceptCharset) {
      return charsetArray[0] || false;
    }

    const accepted = acceptCharset.split(",").map((c) => c.trim().toLowerCase());

    for (const charset of charsetArray) {
      if (accepted.includes(charset.toLowerCase()) || accepted.includes("*")) {
        return charset;
      }
    }

    return false;
  }

  /**
   * Check if charsets are acceptable (alias)
   */
  charsets(...charsets: string[]): string | false {
    return this.charset(charsets);
  }

  /**
   * Check if languages are acceptable
   */
  language(languages: string | string[]): string | false {
    const acceptLanguage = this.request.headers["accept-language"] || "";
    const languageArray = Array.isArray(languages) ? languages : [languages];

    if (!acceptLanguage) {
      return languageArray[0] || false;
    }

    const accepted = acceptLanguage
      .split(",")
      .map((lang) => lang.trim().split(";")[0].toLowerCase());

    for (const lang of languageArray) {
      if (accepted.includes(lang.toLowerCase()) || accepted.includes("*")) {
        return lang;
      }
    }

    return false;
  }

  /**
   * Check if languages are acceptable (alias)
   */
  languages(...languages: string[]): string | false {
    return this.language(languages);
  }
}

/**
 * Create Accepts instance
 */
export default function accepts(req: Request): Accepts {
  return new Accepts(req);
}

export { accepts };

// CLI Demo
if (import.meta.url.includes("elide-accepts.ts")) {
  console.log("🤝 Accepts - Content Negotiation (POLYGLOT!)\n");

  console.log("=== Example 1: Accept Types ===");
  const req1: Request = {
    headers: { accept: "application/json, text/html" },
  };
  const acc1 = accepts(req1);
  console.log("Accepts JSON:", acc1.type("application/json"));
  console.log("Accepts HTML:", acc1.type("text/html"));
  console.log("Accepts XML:", acc1.type("application/xml"));
  console.log();

  console.log("=== Example 2: Wildcard Accept ===");
  const req2: Request = {
    headers: { accept: "*/*" },
  };
  const acc2 = accepts(req2);
  console.log("Accepts anything:", acc2.type("application/json"));
  console.log();

  console.log("=== Example 3: Type Priority ===");
  const req3: Request = {
    headers: { accept: "application/json;q=0.9, text/html;q=1.0" },
  };
  const acc3 = accepts(req3);
  console.log("Best type:", acc3.types("application/json", "text/html"));
  console.log();

  console.log("=== Example 4: Encoding Negotiation ===");
  const req4: Request = {
    headers: { "accept-encoding": "gzip, deflate, br" },
  };
  const acc4 = accepts(req4);
  console.log("Supports gzip:", acc4.encoding("gzip"));
  console.log("Supports brotli:", acc4.encoding("br"));
  console.log("Supports identity:", acc4.encoding("identity"));
  console.log();

  console.log("=== Example 5: Language Negotiation ===");
  const req5: Request = {
    headers: { "accept-language": "en-US, fr;q=0.9, es;q=0.8" },
  };
  const acc5 = accepts(req5);
  console.log("Best language:", acc5.languages("en-US", "fr", "es"));
  console.log();

  console.log("=== Example 6: Charset Negotiation ===");
  const req6: Request = {
    headers: { "accept-charset": "utf-8, iso-8859-1;q=0.5" },
  };
  const acc6 = accepts(req6);
  console.log("Charset:", acc6.charset(["utf-8", "iso-8859-1"]));
  console.log();

  console.log("=== Example 7: API Versioning ===");
  const req7: Request = {
    headers: {
      accept: "application/vnd.api+json;version=2, application/vnd.api+json;version=1;q=0.5",
    },
  };
  const acc7 = accepts(req7);
  const version = acc7.type([
    "application/vnd.api+json;version=1",
    "application/vnd.api+json;version=2",
  ]);
  console.log("API version:", version);
  console.log();

  console.log("=== Example 8: Response Format Selection ===");
  function selectFormat(req: Request) {
    const accept = accepts(req);
    const format = accept.types("application/json", "text/html", "text/xml");

    switch (format) {
      case "application/json":
        return { contentType: "application/json", data: JSON.stringify({ hello: "world" }) };
      case "text/html":
        return { contentType: "text/html", data: "<html><body>Hello World</body></html>" };
      case "text/xml":
        return { contentType: "text/xml", data: "<root><hello>world</hello></root>" };
      default:
        return { contentType: "text/plain", data: "Hello World" };
    }
  }

  const req8a: Request = { headers: { accept: "application/json" } };
  const req8b: Request = { headers: { accept: "text/html" } };

  console.log("JSON request:", selectFormat(req8a));
  console.log("HTML request:", selectFormat(req8b));
  console.log();

  console.log("=== Example 9: Compression Selection ===");
  function selectCompression(req: Request) {
    const accept = accepts(req);
    const encoding = accept.encodings("br", "gzip", "deflate");

    if (!encoding) {
      return "identity";
    }

    return encoding;
  }

  const req9: Request = {
    headers: { "accept-encoding": "gzip, deflate, br" },
  };
  console.log("Selected encoding:", selectCompression(req9));
  console.log();

  console.log("=== Example 10: i18n Language Selection ===");
  function selectLanguage(req: Request) {
    const accept = accepts(req);
    return accept.languages("en", "fr", "es", "de") || "en";
  }

  const req10: Request = {
    headers: { "accept-language": "fr-FR, fr;q=0.9, en;q=0.8" },
  };
  console.log("Selected language:", selectLanguage(req10));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- REST API versioning");
  console.log("- Internationalization (i18n)");
  console.log("- Response format selection");
  console.log("- Compression negotiation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast header parsing");
  console.log("- ~30M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Same negotiation logic across languages");
  console.log("- Consistent content handling");
  console.log("- Share i18n configuration");
}
