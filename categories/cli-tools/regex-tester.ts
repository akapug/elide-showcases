/**
 * Regex Tester
 * Test regular expressions with detailed results
 */

export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

export interface RegexTestResult {
  matches: RegexMatch[];
  isMatch: boolean;
  count: number;
}

export function testRegex(pattern: string, text: string, flags: string = 'g'): RegexTestResult {
  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];

    if (flags.includes('g')) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1)
        });
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1)
        });
      }
    }

    return {
      matches,
      isMatch: matches.length > 0,
      count: matches.length
    };
  } catch (error) {
    throw new Error('Invalid regex pattern: ' + (error as Error).message);
  }
}

export function replaceAll(pattern: string, text: string, replacement: string, flags: string = 'g'): string {
  const regex = new RegExp(pattern, flags);
  return text.replace(regex, replacement);
}

export function extractMatches(pattern: string, text: string, flags: string = 'g'): string[] {
  const result = testRegex(pattern, text, flags);
  return result.matches.map(m => m.match);
}

export function validateRegex(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

// Common patterns
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s]+$/,
  phone: /^\+?[\d\s-()]+$/,
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
  hex: /^#?[0-9a-fA-F]{6}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}(:\d{2})?$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// CLI demo
if (import.meta.url.includes("regex-tester.ts")) {
  console.log("Regex Tester Demo\n");

  const text = "Contact us at hello@example.com or support@test.org";
  const pattern = "[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}";

  console.log("Text:", text);
  console.log("Pattern:", pattern);

  const result = testRegex(pattern, text);
  console.log("\nMatches found:", result.count);
  result.matches.forEach((m, i) => {
    console.log("  " + (i + 1) + ". " + m.match + " at index " + m.index);
  });

  console.log("\nReplace:");
  const replaced = replaceAll(pattern, text, "[EMAIL]");
  console.log(replaced);

  console.log("\nValidate patterns:");
  console.log("  Valid pattern?", validateRegex(pattern).valid);
  console.log("  Invalid pattern?", validateRegex("[invalid").valid);

  console.log("\nCommon patterns:");
  console.log("  Email valid?", PATTERNS.email.test("test@example.com"));
  console.log("  URL valid?", PATTERNS.url.test("https://example.com"));
  console.log("  Hex valid?", PATTERNS.hex.test("#FF5733"));

  console.log("✅ Regex tester test passed");
}
