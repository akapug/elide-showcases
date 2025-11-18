/**
 * i18n-iso-countries - ISO Country Codes & Names
 *
 * i18n for ISO 3166-1 country codes with localized country names.
 * **POLYGLOT SHOWCASE**: One country data library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/i18n-iso-countries (~200K+ downloads/week)
 *
 * Features:
 * - Convert country codes (alpha-2, alpha-3, numeric)
 * - Get localized country names
 * - Multiple language support
 * - Validate country codes
 * - Get all countries
 * - Reverse lookup
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need country data
 * - ONE library works everywhere on Elide
 * - Consistent country data across languages
 * - Share country lists across your stack
 *
 * Use cases:
 * - Country selection forms
 * - Localized country names
 * - Address validation
 * - Shipping calculations
 *
 * Package has ~200K+ downloads/week on npm!
 */

interface CountryData {
  alpha2: string;
  alpha3: string;
  numeric: string;
  names: Record<string, string>;
}

const COUNTRIES: CountryData[] = [
  { alpha2: 'US', alpha3: 'USA', numeric: '840', names: { en: 'United States', es: 'Estados Unidos', fr: 'États-Unis', de: 'Vereinigte Staaten' } },
  { alpha2: 'GB', alpha3: 'GBR', numeric: '826', names: { en: 'United Kingdom', es: 'Reino Unido', fr: 'Royaume-Uni', de: 'Vereinigtes Königreich' } },
  { alpha2: 'CA', alpha3: 'CAN', numeric: '124', names: { en: 'Canada', es: 'Canadá', fr: 'Canada', de: 'Kanada' } },
  { alpha2: 'FR', alpha3: 'FRA', numeric: '250', names: { en: 'France', es: 'Francia', fr: 'France', de: 'Frankreich' } },
  { alpha2: 'DE', alpha3: 'DEU', numeric: '276', names: { en: 'Germany', es: 'Alemania', fr: 'Allemagne', de: 'Deutschland' } },
  { alpha2: 'IT', alpha3: 'ITA', numeric: '380', names: { en: 'Italy', es: 'Italia', fr: 'Italie', de: 'Italien' } },
  { alpha2: 'ES', alpha3: 'ESP', numeric: '724', names: { en: 'Spain', es: 'España', fr: 'Espagne', de: 'Spanien' } },
  { alpha2: 'JP', alpha3: 'JPN', numeric: '392', names: { en: 'Japan', es: 'Japón', fr: 'Japon', de: 'Japan' } },
  { alpha2: 'CN', alpha3: 'CHN', numeric: '156', names: { en: 'China', es: 'China', fr: 'Chine', de: 'China' } },
  { alpha2: 'IN', alpha3: 'IND', numeric: '356', names: { en: 'India', es: 'India', fr: 'Inde', de: 'Indien' } },
  { alpha2: 'BR', alpha3: 'BRA', numeric: '076', names: { en: 'Brazil', es: 'Brasil', fr: 'Brésil', de: 'Brasilien' } },
  { alpha2: 'MX', alpha3: 'MEX', numeric: '484', names: { en: 'Mexico', es: 'México', fr: 'Mexique', de: 'Mexiko' } },
  { alpha2: 'RU', alpha3: 'RUS', numeric: '643', names: { en: 'Russia', es: 'Rusia', fr: 'Russie', de: 'Russland' } },
  { alpha2: 'AU', alpha3: 'AUS', numeric: '036', names: { en: 'Australia', es: 'Australia', fr: 'Australie', de: 'Australien' } },
  { alpha2: 'KR', alpha3: 'KOR', numeric: '410', names: { en: 'South Korea', es: 'Corea del Sur', fr: 'Corée du Sud', de: 'Südkorea' } }
];

const alpha2Map = new Map(COUNTRIES.map(c => [c.alpha2, c]));
const alpha3Map = new Map(COUNTRIES.map(c => [c.alpha3, c]));
const numericMap = new Map(COUNTRIES.map(c => [c.numeric, c]));

export function getName(code: string, lang: string = 'en'): string {
  const country = alpha2Map.get(code) || alpha3Map.get(code);
  return country?.names[lang] || '';
}

export function getAlpha2Code(nameOrCode: string, lang: string = 'en'): string {
  // Try as alpha-3
  const byAlpha3 = alpha3Map.get(nameOrCode);
  if (byAlpha3) return byAlpha3.alpha2;

  // Try as name
  for (const country of COUNTRIES) {
    if (country.names[lang]?.toLowerCase() === nameOrCode.toLowerCase()) {
      return country.alpha2;
    }
  }

  return '';
}

export function getAlpha3Code(nameOrCode: string, lang: string = 'en'): string {
  // Try as alpha-2
  const byAlpha2 = alpha2Map.get(nameOrCode);
  if (byAlpha2) return byAlpha2.alpha3;

  // Try as name
  for (const country of COUNTRIES) {
    if (country.names[lang]?.toLowerCase() === nameOrCode.toLowerCase()) {
      return country.alpha3;
    }
  }

  return '';
}

export function getNumericCode(code: string): string {
  const country = alpha2Map.get(code) || alpha3Map.get(code);
  return country?.numeric || '';
}

export function isValid(code: string): boolean {
  return alpha2Map.has(code) || alpha3Map.has(code) || numericMap.has(code);
}

export function getNames(lang: string = 'en'): Record<string, string> {
  const result: Record<string, string> = {};
  for (const country of COUNTRIES) {
    if (country.names[lang]) {
      result[country.alpha2] = country.names[lang];
    }
  }
  return result;
}

export function getAlpha2Codes(): string[] {
  return COUNTRIES.map(c => c.alpha2);
}

export function getAlpha3Codes(): string[] {
  return COUNTRIES.map(c => c.alpha3);
}

export default {
  getName,
  getAlpha2Code,
  getAlpha3Code,
  getNumericCode,
  isValid,
  getNames,
  getAlpha2Codes,
  getAlpha3Codes
};

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 i18n-iso-countries - Country Codes & Names for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Get Country Name ===");
  console.log('US (en):', getName('US', 'en'));
  console.log('US (es):', getName('US', 'es'));
  console.log('US (fr):', getName('US', 'fr'));
  console.log();

  console.log("=== Example 2: Code Conversion ===");
  console.log('US -> alpha-3:', getAlpha3Code('US'));
  console.log('USA -> alpha-2:', getAlpha2Code('USA'));
  console.log('US -> numeric:', getNumericCode('US'));
  console.log();

  console.log("=== Example 3: Name to Code ===");
  console.log('United States ->', getAlpha2Code('United States', 'en'));
  console.log('France ->', getAlpha2Code('France', 'en'));
  console.log('Japan ->', getAlpha2Code('Japan', 'en'));
  console.log();

  console.log("=== Example 4: Validate Codes ===");
  console.log('US valid?', isValid('US'));
  console.log('USA valid?', isValid('USA'));
  console.log('ZZ valid?', isValid('ZZ'));
  console.log();

  console.log("=== Example 5: All Countries in Language ===");
  const countriesEn = getNames('en');
  console.log('Countries in English:', Object.keys(countriesEn).length);
  console.log('First 5:', Object.entries(countriesEn).slice(0, 5).map(([code, name]) => `${code}: ${name}`).join(', '));
  console.log();

  console.log("=== Example 6: All Country Codes ===");
  console.log('Alpha-2:', getAlpha2Codes().slice(0, 10).join(', '));
  console.log('Alpha-3:', getAlpha3Codes().slice(0, 10).join(', '));
  console.log();

  console.log("=== Example 7: Localized Names ===");
  const countries = ['US', 'FR', 'JP', 'BR'];
  const languages = ['en', 'es', 'fr'];

  for (const code of countries) {
    console.log(`${code}:`);
    for (const lang of languages) {
      console.log(`  ${lang}: ${getName(code, lang)}`);
    }
  }
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same i18n-iso-countries library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One country data library, all languages");
  console.log("  ✓ Share country lists everywhere");
  console.log("  ✓ Consistent country names across stack");
  console.log("  ✓ No need for language-specific libraries");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Country selection forms");
  console.log("- Localized country names");
  console.log("- Address validation");
  console.log("- Shipping calculations");
  console.log("- Analytics by country");
  console.log("- Multi-language forms");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- In-memory lookup");
  console.log("- Instant execution on Elide");
  console.log("- ~200K+ downloads/week on npm!");
}
