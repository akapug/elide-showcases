/**
 * iso-639-1 - ISO 639-1 Language Codes
 *
 * ISO 639-1 two-letter language code library.
 * **POLYGLOT SHOWCASE**: One language code library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/iso-639-1 (~100K+ downloads/week)
 *
 * Features:
 * - Get language name from code
 * - Get code from language name
 * - Validate language codes
 * - Get all languages
 * - Native names support
 * - Bidirectional lookup
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need language codes
 * - ONE library works everywhere on Elide
 * - Consistent language data across languages
 * - Share language constants across your stack
 *
 * Use cases:
 * - Language selection dropdowns
 * - Localization systems
 * - Content management
 * - API responses
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface LanguageData {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageData[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' }
];

const codeMap = new Map(LANGUAGES.map(l => [l.code, l]));
const nameMap = new Map(LANGUAGES.map(l => [l.name.toLowerCase(), l]));

export function getName(code: string): string {
  return codeMap.get(code)?.name || '';
}

export function getNativeName(code: string): string {
  return codeMap.get(code)?.nativeName || '';
}

export function getCode(name: string): string {
  return nameMap.get(name.toLowerCase())?.code || '';
}

export function validate(code: string): boolean {
  return codeMap.has(code);
}

export function getAllNames(): string[] {
  return LANGUAGES.map(l => l.name);
}

export function getAllCodes(): string[] {
  return LANGUAGES.map(l => l.code);
}

export function getAllNativeNames(): string[] {
  return LANGUAGES.map(l => l.nativeName);
}

export function getLanguages(): LanguageData[] {
  return [...LANGUAGES];
}

export default {
  getName,
  getNativeName,
  getCode,
  validate,
  getAllNames,
  getAllCodes,
  getAllNativeNames,
  getLanguages
};

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 iso-639-1 - Language Codes for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Get Language Name ===");
  console.log('en ->', getName('en'));
  console.log('es ->', getName('es'));
  console.log('fr ->', getName('fr'));
  console.log();

  console.log("=== Example 2: Get Native Name ===");
  console.log('en ->', getNativeName('en'));
  console.log('ja ->', getNativeName('ja'));
  console.log('ar ->', getNativeName('ar'));
  console.log();

  console.log("=== Example 3: Get Code from Name ===");
  console.log('English ->', getCode('English'));
  console.log('Spanish ->', getCode('Spanish'));
  console.log('Japanese ->', getCode('Japanese'));
  console.log();

  console.log("=== Example 4: Validate Codes ===");
  console.log('en valid?', validate('en'));
  console.log('es valid?', validate('es'));
  console.log('zz valid?', validate('zz'));
  console.log();

  console.log("=== Example 5: All Codes ===");
  console.log('First 10 codes:', getAllCodes().slice(0, 10).join(', '));
  console.log('Total languages:', getAllCodes().length);
  console.log();

  console.log("=== Example 6: All Names ===");
  console.log('First 10 names:', getAllNames().slice(0, 10).join(', '));
  console.log();

  console.log("=== Example 7: All Languages ===");
  const languages = getLanguages();
  console.log('First 5 languages:');
  languages.slice(0, 5).forEach(l => {
    console.log(`  ${l.code}: ${l.name} (${l.nativeName})`);
  });
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same iso-639-1 library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One language code library, all languages");
  console.log("  ✓ Share language constants everywhere");
  console.log("  ✓ Consistent language data across stack");
  console.log("  ✓ No need for language-specific libraries");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Language selection dropdowns");
  console.log("- Localization systems");
  console.log("- Content management systems");
  console.log("- API response localization");
  console.log("- User preference storage");
  console.log("- Multi-language routing");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- In-memory lookup (instant)");
  console.log("- Instant execution on Elide");
  console.log("- ~100K+ downloads/week on npm!");
}
