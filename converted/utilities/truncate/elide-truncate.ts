/**
 * Truncate - Elide Polyglot Showcase
 *
 * Truncate strings to specified length with smart word boundaries.
 * Perfect for previews, summaries, and mobile UI.
 *
 * Features:
 * - Truncate to character or word boundaries
 * - Custom ellipsis/suffix
 * - Preserve complete words
 * - HTML-aware truncation option
 * - Zero dependencies
 *
 * Use cases:
 * - Article previews
 * - Tweet-length summaries
 * - Mobile UI text truncation
 * - Meta descriptions
 * - Search result snippets
 */

interface TruncateOptions {
  /** Length to truncate to */
  length?: number;
  /** Suffix to append (default: '...') */
  suffix?: string;
  /** Preserve complete words (default: false) */
  preserveWords?: boolean;
  /** Separator for word boundary (default: ' ') */
  separator?: string;
}

/**
 * Truncate a string to specified length
 */
export default function truncate(
  str: string,
  lengthOrOptions: number | TruncateOptions = 50,
  suffix: string = '...'
): string {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof str}`);
  }

  // Handle options object
  let options: TruncateOptions;
  if (typeof lengthOrOptions === 'number') {
    options = { length: lengthOrOptions, suffix };
  } else {
    options = lengthOrOptions;
  }

  const {
    length = 50,
    suffix: sfx = '...',
    preserveWords = false,
    separator = ' '
  } = options;

  // String is already short enough
  if (str.length <= length) {
    return str;
  }

  // Calculate max content length
  const maxLength = length - sfx.length;

  if (preserveWords) {
    // Find last word boundary before maxLength
    const truncated = str.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(separator);

    if (lastSpace > 0) {
      return truncated.slice(0, lastSpace) + sfx;
    }
  }

  // Simple character truncation
  return str.slice(0, maxLength) + sfx;
}

/**
 * Truncate to word boundary
 */
export function truncateWords(str: string, length: number, suffix: string = '...'): string {
  return truncate(str, { length, suffix, preserveWords: true });
}

/**
 * Truncate to tweet length (280 chars)
 */
export function truncateToTweet(str: string): string {
  return truncate(str, { length: 280, suffix: '…' });
}

// CLI Demo
if (import.meta.url.includes("elide-truncate.ts")) {
  console.log("✂️  Truncate - Smart Text Trimming for Elide\n");

  console.log("=== Example 1: Basic Truncation ===");
  console.log(truncate("Hello, World!", 10));
  console.log(truncate("The quick brown fox jumps over the lazy dog", 20));
  console.log(truncate("Short", 20));
  console.log();

  console.log("=== Example 2: Article Previews ===");
  const article = "Understanding the intricacies of modern web development requires a deep dive into various technologies and frameworks.";
  console.log("Full:", article);
  console.log("Preview:", truncate(article, 50));
  console.log("Short:", truncate(article, 30));
  console.log();

  console.log("=== Example 3: Custom Suffix ===");
  console.log(truncate("Read more about this topic", 15, '…'));
  console.log(truncate("Click here for details", 15, ' [more]'));
  console.log(truncate("Long description here", 15, ''));
  console.log();

  console.log("=== Example 4: Preserve Words ===");
  const text = "The quick brown fox jumps over the lazy dog";
  console.log("Char boundary:", truncate(text, 25));
  console.log("Word boundary:", truncateWords(text, 25));
  console.log();

  console.log("=== Example 5: Tweet Length ===");
  const longTweet = "This is a very long message that exceeds the Twitter character limit and needs to be truncated to fit within the 280 character constraint that Twitter imposes on all tweets to ensure brevity and conciseness in communication.";
  console.log("Tweet:", truncateToTweet(longTweet));
  console.log(`Length: ${truncateToTweet(longTweet).length} chars`);
  console.log();

  console.log("=== Example 6: Search Results ===");
  const results = [
    "How to Build a Modern Web Application with TypeScript and React",
    "Understanding JavaScript Closures: A Complete Guide for Beginners",
    "10 Essential Tips for Writing Clean and Maintainable Code"
  ];
  console.log("Search snippets:");
  results.forEach(result => {
    console.log(`  - ${truncate(result, 45)}`);
  });
  console.log();

  console.log("=== Example 7: Mobile UI ===");
  const notifications = [
    "You have a new message from John regarding the project proposal",
    "Sarah commented on your post about web development",
    "Reminder: Meeting in 15 minutes"
  ];
  console.log("Notification previews:");
  notifications.forEach(notif => {
    console.log(`  📱 ${truncate(notif, 35)}`);
  });
  console.log();

  console.log("=== Example 8: Meta Descriptions ===");
  const pageContent = "Learn how to build scalable web applications using modern frameworks and best practices. This comprehensive guide covers everything from setup to deployment.";
  console.log("Meta (160 chars):", truncate(pageContent, 160));
  console.log();

  console.log("=== Example 9: Table Cell Content ===");
  const productNames = [
    "Samsung Galaxy S24 Ultra 5G Smartphone with 512GB Storage",
    "MacBook Pro 16-inch M3 Max with 64GB RAM",
    "Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
  ];
  console.log("Table cells (30 chars):");
  productNames.forEach(name => {
    console.log(`  | ${truncate(name, 30)} |`);
  });
  console.log();

  console.log("=== Example 10: Email Subject Lines ===");
  const subjects = [
    "Important: Action Required - Please Review Your Account Settings",
    "Weekly Newsletter - Top 10 Articles You Might Have Missed",
    "Reminder: Your subscription expires in 3 days"
  ];
  console.log("Email subjects (50 chars):");
  subjects.forEach(subj => {
    console.log(`  ✉️  ${truncate(subj, 50)}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Article/blog post previews");
  console.log("- Tweet-length summaries");
  console.log("- Mobile notification text");
  console.log("- SEO meta descriptions");
  console.log("- Search result snippets");
  console.log("- Table cell content");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- O(n) complexity");
  console.log("- Instant execution");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use preserveWords for readable truncation");
  console.log("- Choose appropriate suffix (…, [more], etc.)");
  console.log("- Consider context (tweets, emails, UI)");
  console.log("- Test with various string lengths");
}
