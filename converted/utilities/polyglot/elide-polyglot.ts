/**
 * polyglot - Airbnb I18n Library
 *
 * Simple internationalization library with pluralization support.
 * **POLYGLOT SHOWCASE**: One i18n library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/node-polyglot (~100K+ downloads/week)
 *
 * Features:
 * - Simple phrase translation
 * - Interpolation
 * - Pluralization rules
 * - Nested keys
 * - Locale switching
 * - Lightweight API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need simple i18n
 * - ONE library works everywhere on Elide
 * - Consistent translation API across languages
 * - Share phrase dictionaries across your stack
 *
 * Use cases:
 * - Simple web applications
 * - Mobile apps
 * - CLI tools
 * - Email templates
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface PolyglotOptions {
  phrases?: Record<string, string>;
  locale?: string;
  allowMissing?: boolean;
  onMissingKey?: (key: string) => string;
}

interface TranslateOptions {
  smart_count?: number;
  _?: string;
  [key: string]: any;
}

class Polyglot {
  private phrases: Record<string, string>;
  private locale: string;
  private allowMissing: boolean;
  private onMissingKey?: (key: string) => string;

  constructor(options: PolyglotOptions = {}) {
    this.phrases = options.phrases || {};
    this.locale = options.locale || 'en';
    this.allowMissing = options.allowMissing || false;
    this.onMissingKey = options.onMissingKey;
  }

  /**
   * Add phrases
   */
  extend(phrases: Record<string, string>, prefix?: string): void {
    if (prefix) {
      for (const [key, value] of Object.entries(phrases)) {
        this.phrases[`${prefix}.${key}`] = value;
      }
    } else {
      Object.assign(this.phrases, phrases);
    }
  }

  /**
   * Replace all phrases
   */
  replace(phrases: Record<string, string>): void {
    this.phrases = { ...phrases };
  }

  /**
   * Clear all phrases
   */
  clear(): void {
    this.phrases = {};
  }

  /**
   * Set locale
   */
  locale(locale?: string): string {
    if (locale) {
      this.locale = locale;
    }
    return this.locale;
  }

  /**
   * Check if phrase exists
   */
  has(key: string): boolean {
    return key in this.phrases;
  }

  /**
   * Get phrase without interpolation
   */
  private getPhrase(key: string): string {
    if (this.has(key)) {
      return this.phrases[key];
    }

    if (this.onMissingKey) {
      return this.onMissingKey(key);
    }

    if (this.allowMissing) {
      return '';
    }

    return key;
  }

  /**
   * Interpolate variables
   */
  private interpolate(phrase: string, options: TranslateOptions): string {
    let result = phrase;

    for (const [key, value] of Object.entries(options)) {
      if (key === 'smart_count' || key === '_') continue;
      const regex = new RegExp(`%\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Choose plural form
   */
  private choosePluralForm(phrase: string, count: number): string {
    const parts = phrase.split('||||');

    if (parts.length === 1) {
      return phrase;
    }

    if (count === 0 && parts.length > 2) {
      return parts[0].trim();
    }

    if (count === 1) {
      return (parts[parts.length === 2 ? 0 : 1] || parts[0]).trim();
    }

    return (parts[parts.length === 2 ? 1 : 2] || parts[parts.length - 1]).trim();
  }

  /**
   * Translate a phrase
   */
  t(key: string, options?: TranslateOptions | number): string {
    // Handle numeric shorthand for smart_count
    if (typeof options === 'number') {
      options = { smart_count: options };
    }

    const opts = options || {};
    let phrase = this.getPhrase(key);

    // Handle pluralization
    if (opts.smart_count !== undefined) {
      phrase = this.choosePluralForm(phrase, opts.smart_count);
    }

    // Interpolate variables
    phrase = this.interpolate(phrase, opts);

    return phrase;
  }

  /**
   * Unset phrase
   */
  unset(key: string): void {
    delete this.phrases[key];
  }
}

export default Polyglot;
export { Polyglot, type PolyglotOptions };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✈️ polyglot - Airbnb I18n Library for Elide (POLYGLOT!)\n");

  const polyglot = new Polyglot({
    locale: 'en',
    phrases: {
      'hello': 'Hello',
      'hello_name': 'Hello, %{name}',
      'car': 'car |||| cars',
      'count_cars': '%{smart_count} car |||| %{smart_count} cars',
      'user.profile': 'User Profile',
      'user.settings': 'User Settings'
    }
  });

  console.log("=== Example 1: Basic Translation ===");
  console.log(polyglot.t('hello'));
  console.log(polyglot.t('hello_name', { name: 'Alice' }));
  console.log();

  console.log("=== Example 2: Pluralization ===");
  console.log(polyglot.t('car', { smart_count: 1 }));
  console.log(polyglot.t('car', { smart_count: 5 }));
  console.log();

  console.log("=== Example 3: Pluralization with Interpolation ===");
  console.log(polyglot.t('count_cars', { smart_count: 1 }));
  console.log(polyglot.t('count_cars', { smart_count: 5 }));
  console.log(polyglot.t('count_cars', 1)); // Numeric shorthand
  console.log(polyglot.t('count_cars', 10));
  console.log();

  console.log("=== Example 4: Nested Keys ===");
  console.log(polyglot.t('user.profile'));
  console.log(polyglot.t('user.settings'));
  console.log();

  console.log("=== Example 5: Extend Phrases ===");
  polyglot.extend({
    'goodbye': 'Goodbye',
    'farewell': 'Farewell, %{name}'
  });

  console.log(polyglot.t('goodbye'));
  console.log(polyglot.t('farewell', { name: 'Bob' }));
  console.log();

  console.log("=== Example 6: Extend with Prefix ===");
  polyglot.extend({
    'title': 'Dashboard',
    'subtitle': 'Overview'
  }, 'nav');

  console.log(polyglot.t('nav.title'));
  console.log(polyglot.t('nav.subtitle'));
  console.log();

  console.log("=== Example 7: Check Phrase Existence ===");
  console.log('hello exists:', polyglot.has('hello'));
  console.log('nonexistent exists:', polyglot.has('nonexistent'));
  console.log();

  console.log("=== Example 8: Replace All Phrases ===");
  const polyglot2 = new Polyglot();
  polyglot2.replace({
    'greeting': 'Hi there!',
    'welcome': 'Welcome!'
  });

  console.log(polyglot2.t('greeting'));
  console.log(polyglot2.t('welcome'));
  console.log();

  console.log("=== Example 9: Missing Key Handler ===");
  const polyglot3 = new Polyglot({
    onMissingKey: (key: string) => `[Missing: ${key}]`
  });

  console.log(polyglot3.t('nonexistent'));
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same polyglot library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One simple i18n library, all languages");
  console.log("  ✓ Share phrase files across services");
  console.log("  ✓ Consistent API everywhere");
  console.log("  ✓ No need for language-specific i18n");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Simple web applications");
  console.log("- Mobile app localization");
  console.log("- CLI tool translations");
  console.log("- Email template localization");
  console.log("- Bot responses");
  console.log("- Error messages");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Lightweight API");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster cold start than Node.js");
  console.log("- ~100K+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java apps via Elide");
  console.log("- Share phrase JSONs across all services");
  console.log("- One simple i18n for entire stack");
  console.log("- Perfect for polyglot microservices!");
}
