/**
 * Strip JSON Comments - Remove Comments from JSON
 *
 * Strip comments from JSON strings, allowing JSON with comments (JSONC).
 * **POLYGLOT SHOWCASE**: One JSON comment stripper for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/strip-json-comments (~6M+ downloads/week)
 *
 * Features:
 * - Remove single-line comments (//)
 * - Remove multi-line comments (/* */)
 * - Preserve strings (don't strip // or /* inside strings)
 * - Handle edge cases (escaped quotes, etc.)
 * - Fast and lightweight
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need config file parsing
 * - ONE JSON comment stripper works everywhere on Elide
 * - Consistent config format across languages
 * - Share commented JSON configs across your stack
 *
 * Use cases:
 * - Configuration files (tsconfig.json, etc.)
 * - JSON with documentation
 * - Development configs
 * - Build tool configurations
 *
 * Package has ~6M+ downloads/week on npm!
 */

/**
 * Strip comments from JSON string
 *
 * @param jsonString - JSON string with comments
 * @param options - Optional configuration
 * @returns JSON string without comments
 */
export default function stripJsonComments(
  jsonString: string,
  options: { whitespace?: boolean } = {}
): string {
  const { whitespace = true } = options;

  let result = '';
  let i = 0;
  let inString: string | null = null;
  let escaped = false;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const next = jsonString[i + 1];

    // Handle string state
    if (inString) {
      result += char;

      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }

      i++;
      continue;
    }

    // Enter string
    if (char === '"' || char === "'") {
      inString = char;
      result += char;
      i++;
      continue;
    }

    // Single-line comment: //
    if (char === '/' && next === '/') {
      // Skip until end of line
      i += 2;
      while (i < jsonString.length && jsonString[i] !== '\n' && jsonString[i] !== '\r') {
        i++;
      }

      // Preserve the newline if we want whitespace
      if (whitespace && i < jsonString.length) {
        result += jsonString[i];
        i++;
      }
      continue;
    }

    // Multi-line comment: /* */
    if (char === '/' && next === '*') {
      // Skip until */
      i += 2;
      while (i < jsonString.length - 1) {
        if (jsonString[i] === '*' && jsonString[i + 1] === '/') {
          i += 2;
          break;
        }

        // Preserve newlines in whitespace mode
        if (whitespace && (jsonString[i] === '\n' || jsonString[i] === '\r')) {
          result += jsonString[i];
        }

        i++;
      }
      continue;
    }

    // Regular character
    result += char;
    i++;
  }

  return result;
}

/**
 * Strip comments and parse JSON
 */
export function parseJson<T = any>(jsonString: string): T {
  const stripped = stripJsonComments(jsonString);
  return JSON.parse(stripped);
}

// CLI Demo
if (import.meta.url.includes("elide-strip-json-comments.ts")) {
  console.log("✂️  Strip JSON Comments - Parse JSON with Comments (POLYGLOT!)\n");

  console.log("=== Example 1: Single-Line Comments ===");
  const json1 = `{
  // This is a comment
  "name": "Alice", // Name of the user
  "age": 30 // Age in years
}`;
  console.log("Input:");
  console.log(json1);
  console.log("\nStripped:");
  console.log(stripJsonComments(json1));
  console.log("\nParsed:");
  console.log(parseJson(json1));
  console.log();

  console.log("=== Example 2: Multi-Line Comments ===");
  const json2 = `{
  /* This is a
     multi-line comment */
  "version": "1.0.0",
  /* Another comment */
  "author": "Bob"
}`;
  console.log("Input:");
  console.log(json2);
  console.log("\nStripped:");
  console.log(stripJsonComments(json2));
  console.log("\nParsed:");
  console.log(parseJson(json2));
  console.log();

  console.log("=== Example 3: Mixed Comments ===");
  const json3 = `{
  // Configuration file
  "database": {
    /* Production database */
    "host": "db.example.com", // Server hostname
    "port": 5432, // PostgreSQL default
    /* Credentials */
    "user": "admin",
    "password": "secret123" // TODO: Move to env var
  }
}`;
  console.log("Input:");
  console.log(json3);
  console.log("\nParsed:");
  console.log(parseJson(json3));
  console.log();

  console.log("=== Example 4: tsconfig.json Example ===");
  const tsconfig = `{
  // TypeScript configuration
  "compilerOptions": {
    "target": "ES2020", // Target ECMAScript version
    "module": "commonjs", // Module system
    "strict": true, // Enable all strict type checking
    /* Additional checks */
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  /* Files to include */
  "include": ["src/**/*"],
  "exclude": ["node_modules"] // Don't compile dependencies
}`;
  console.log("Input (tsconfig.json):");
  console.log(tsconfig);
  console.log("\nParsed:");
  console.log(JSON.stringify(parseJson(tsconfig), null, 2));
  console.log();

  console.log("=== Example 5: Strings Containing Comment Syntax ===");
  const json5 = `{
  "url": "https://example.com/path", // Not a comment inside quotes
  "regex": "^//.*$", // This // is inside a string
  "comment": "Use /* */ for comments" // This too
}`;
  console.log("Input:");
  console.log(json5);
  console.log("\nParsed (strings preserved):");
  console.log(parseJson(json5));
  console.log();

  console.log("=== Example 6: Package.json with Comments ===");
  const packageJson = `{
  // Package metadata
  "name": "my-app",
  "version": "1.0.0",
  /* Scripts */
  "scripts": {
    "start": "node index.js", // Start server
    "test": "jest", // Run tests
    "build": "tsc" // Compile TypeScript
  },
  // Dependencies
  "dependencies": {
    "express": "^4.18.0" /* Web framework */
  }
}`;
  console.log("Input (package.json with comments):");
  console.log(packageJson);
  console.log("\nParsed:");
  console.log(JSON.stringify(parseJson(packageJson), null, 2));
  console.log();

  console.log("=== Example 7: Whitespace Preservation ===");
  const json7 = `{
  // Comment 1
  "a": 1,
  // Comment 2
  "b": 2
}`;
  console.log("With whitespace (default):");
  console.log(JSON.stringify(stripJsonComments(json7)));
  console.log("\nWithout whitespace:");
  console.log(JSON.stringify(stripJsonComments(json7, { whitespace: false })));
  console.log();

  console.log("=== Example 8: Escaped Quotes in Strings ===");
  const json8 = `{
  "message": "She said \\"Hello\\"", // Quote inside string
  "path": "C:\\\\Users\\\\Admin" // Backslashes
}`;
  console.log("Input:");
  console.log(json8);
  console.log("\nParsed (escapes preserved):");
  console.log(parseJson(json8));
  console.log();

  console.log("=== Example 9: Real-World Config File ===");
  const realConfig = `{
  // Application Configuration
  /* Server settings */
  "server": {
    "port": 3000, // HTTP port
    "host": "0.0.0.0", // Bind to all interfaces
    /* SSL configuration (optional) */
    "ssl": {
      "enabled": false,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    }
  },

  // Database configuration
  "database": {
    /* Connection settings */
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db",
    // Credentials (move to .env in production!)
    "user": "admin",
    "password": "dev_password_123"
  },

  /* Feature flags */
  "features": {
    "newUI": true, // Enable new UI
    "betaFeatures": false, // Beta features disabled
    "analytics": true // Track usage
  }
}`;
  console.log("Real-world config file:");
  console.log(realConfig);
  console.log("\nParsed configuration:");
  console.log(JSON.stringify(parseJson(realConfig), null, 2));
  console.log();

  console.log("=== Example 10: Error Handling ===");
  try {
    const invalid = `{
      "key": "value", // Comment
      invalid json here
    }`;
    parseJson(invalid);
  } catch (error) {
    console.log("Invalid JSON (after stripping comments):");
    console.log("Error:", (error as Error).message);
  }
  console.log();

  console.log("=== Example 11: POLYGLOT Use Case ===");
  console.log("🌐 Same JSON comment format works in:");
  console.log("  • TypeScript (tsconfig.json)");
  console.log("  • Python config files (via Elide)");
  console.log("  • Ruby config files (via Elide)");
  console.log("  • Java config files (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One config format with comments");
  console.log("  ✓ Document your configs inline");
  console.log("  ✓ Share config files across languages");
  console.log("  ✓ Better than YAML for typed configs");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- tsconfig.json (TypeScript config)");
  console.log("- package.json with documentation");
  console.log("- Application config files");
  console.log("- Build tool configurations");
  console.log("- VS Code settings.json");
  console.log("- Any JSON that needs documentation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast parsing (single pass)");
  console.log("- Handles large files");
  console.log("- ~6M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use for config files across all services");
  console.log("- Document complex configs with inline comments");
  console.log("- Share commented configs in version control");
  console.log("- Perfect for polyglot microservice configs!");
}
