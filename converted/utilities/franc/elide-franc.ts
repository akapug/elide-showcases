/**
 * Franc - Natural Language Detection
 *
 * Detects the language of text using trigram analysis.
 *
 * Features:
 * - Detect language from text
 * - Supports major languages
 * - Fast and lightweight
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

// Language trigram patterns (simplified)
const patterns: Record<string, string[]> = {
  eng: ['the', 'and', 'ing', 'ion', 'tion'],
  spa: ['que', 'del', 'los', 'las', 'con'],
  fra: ['les', 'des', 'que', 'pas', 'une'],
  deu: ['der', 'die', 'und', 'den', 'ich'],
  ita: ['che', 'per', 'con', 'del', 'una'],
  por: ['que', 'para', 'com', 'uma', 'dos'],
};

function getTrigrams(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const trigrams: string[] = [];

  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.push(normalized.slice(i, i + 3));
  }

  return trigrams;
}

export default function franc(text: string): string {
  if (text.length < 10) return 'und'; // undetermined

  const trigrams = getTrigrams(text);
  const scores: Record<string, number> = {};

  for (const [lang, patterns_] of Object.entries(patterns)) {
    scores[lang] = 0;
    for (const pattern of patterns_) {
      for (const trigram of trigrams) {
        if (trigram.includes(pattern)) {
          scores[lang]++;
        }
      }
    }
  }

  let maxScore = 0;
  let detectedLang = 'und';

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

if (import.meta.url.includes("franc")) {
  console.log("Language of 'Hello world':", franc("Hello world, this is a test"));
  console.log("Language of 'Hola mundo':", franc("Hola mundo, esto es una prueba"));
  console.log("Language of 'Bonjour le monde':", franc("Bonjour le monde, ceci est un test"));
  console.log("Language of 'Hallo Welt':", franc("Hallo Welt, das ist ein Test"));
}
