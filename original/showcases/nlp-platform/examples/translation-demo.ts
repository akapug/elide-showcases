/**
 * Machine Translation Demo
 * Demonstrates translation capabilities with Elide polyglot
 */

import { Translator, MultiTargetTranslator, AutoTranslator, TranslationUtils } from '../src/translation/translator';

/**
 * Basic translation example
 */
async function basicTranslation() {
  console.log('=== Basic Translation ===\n');

  const translator = new Translator('en', 'fr');

  const texts = [
    "Hello, how are you?",
    "The weather is beautiful today.",
    "I love programming.",
    "Technology is changing the world."
  ];

  for (const text of texts) {
    const result = await translator.translate(text);
    console.log(`EN: ${text}`);
    console.log(`FR: ${result.translatedText}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
  }
}

/**
 * Multi-target translation
 */
async function multiTargetTranslation() {
  console.log('\n=== Multi-Target Translation ===\n');

  const translator = new MultiTargetTranslator('en');

  const text = "Hello, welcome to our platform!";
  const targetLanguages = ['fr', 'es', 'de', 'it'] as const;

  console.log(`Original (EN): ${text}\n`);

  const translations = await translator.translateToMany(text, [...targetLanguages]);

  for (const [lang, result] of translations) {
    const langName = TranslationUtils.getLanguageName(lang);
    console.log(`${langName} (${lang}): ${result.translatedText}`);
  }
}

/**
 * Back-translation for validation
 */
async function backTranslation() {
  console.log('\n=== Back-Translation Validation ===\n');

  const translator = new Translator('en', 'fr');

  const text = "Artificial intelligence is revolutionizing healthcare.";

  console.log(`Original: ${text}\n`);

  const backTranslation = await translator.backTranslate(text);

  console.log(`Forward (EN → FR): ${backTranslation.forward}`);
  console.log(`Backward (FR → EN): ${backTranslation.backward}`);
  console.log(`Similarity: ${(backTranslation.similarity * 100).toFixed(1)}%`);
}

/**
 * Batch translation
 */
async function batchTranslation() {
  console.log('\n=== Batch Translation ===\n');

  const translator = new Translator('en', 'es');

  const texts = [
    "Good morning",
    "Good afternoon",
    "Good evening",
    "Good night",
    "Thank you",
    "You're welcome",
    "See you later",
    "Have a nice day"
  ];

  console.log(`Translating ${texts.length} phrases from English to Spanish...\n`);

  const results = await translator.translateBatch(texts, {
    batchSize: 4,
    showProgress: true
  });

  console.log('\nTranslations:');
  for (let i = 0; i < texts.length; i++) {
    console.log(`${texts[i].padEnd(20)} → ${results[i].translatedText}`);
  }
}

/**
 * Auto-detect and translate
 */
async function autoDetectTranslation() {
  console.log('\n=== Auto-Detect Translation ===\n');

  const autoTranslator = new AutoTranslator('en');

  const texts = [
    { text: "Bonjour, comment allez-vous?", expected: "fr" },
    { text: "Hola, ¿cómo estás?", expected: "es" },
    { text: "Guten Tag, wie geht es Ihnen?", expected: "de" },
    { text: "Hello, how are you?", expected: "en" }
  ];

  for (const item of texts) {
    const result = await autoTranslator.translate(item.text);

    console.log(`Text: ${item.text}`);
    console.log(`Detected: ${result.detectedLanguage} (expected: ${item.expected})`);
    console.log(`Translation: ${result.translatedText}\n`);
  }
}

/**
 * Multi-hop translation
 */
async function multiHopTranslation() {
  console.log('\n=== Multi-Hop Translation ===\n');

  const text = "The future of technology is exciting!";

  console.log(`Original (EN): ${text}\n`);

  // EN → FR
  const enFr = new Translator('en', 'fr');
  const frText = (await enFr.translate(text)).translatedText;
  console.log(`French: ${frText}`);

  // FR → ES
  const frEs = new Translator('fr', 'es');
  const esText = (await frEs.translate(frText)).translatedText;
  console.log(`Spanish: ${esText}`);

  // ES → DE
  const esDe = new Translator('es', 'de');
  const deText = (await esDe.translate(esText)).translatedText;
  console.log(`German: ${deText}`);

  // DE → EN (back)
  const deEn = new Translator('de', 'en');
  const backText = (await deEn.translate(deText)).translatedText;
  console.log(`\nBack to English: ${backText}`);
}

/**
 * Document translation
 */
async function documentTranslation() {
  console.log('\n=== Document Translation ===\n');

  const translator = new Translator('en', 'fr');

  const document = `
    Artificial Intelligence in Healthcare

    Artificial intelligence (AI) is transforming healthcare delivery.
    Machine learning algorithms can analyze medical images with high accuracy.
    Natural language processing helps doctors extract information from medical records.
    AI-powered chatbots provide 24/7 patient support.

    The future of healthcare is data-driven and AI-enhanced.
  `;

  console.log('Translating document from English to French...\n');

  const result = await translator.translate(document.trim());

  console.log('Original (EN):');
  console.log(document.trim());
  console.log('\nTranslation (FR):');
  console.log(result.translatedText);
}

/**
 * Translation quality metrics
 */
async function translationQuality() {
  console.log('\n=== Translation Quality Analysis ===\n');

  const translator = new Translator('en', 'es');

  const texts = [
    "Hello",
    "This is a simple sentence.",
    "The quick brown fox jumps over the lazy dog.",
    "Artificial intelligence and machine learning are revolutionizing technology."
  ];

  console.log('Analyzing translation quality...\n');

  for (const text of texts) {
    const result = await translator.translate(text);
    const backTranslation = await translator.backTranslate(text);

    console.log(`Original: ${text}`);
    console.log(`Translation: ${result.translatedText}`);
    console.log(`Back-translation: ${backTranslation.backward}`);
    console.log(`Similarity: ${(backTranslation.similarity * 100).toFixed(1)}%`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log();
  }
}

/**
 * Real-world use case: Multi-lingual customer support
 */
async function customerSupportTranslation() {
  console.log('\n=== Multi-lingual Customer Support ===\n');

  const autoTranslator = new AutoTranslator('en');

  // Simulate customer messages in different languages
  const messages = [
    { text: "Je voudrais annuler ma commande", customer: "Jean" },
    { text: "¿Cuándo llegará mi pedido?", customer: "Maria" },
    { text: "I need help with my account", customer: "John" },
    { text: "Mein Paket ist beschädigt angekommen", customer: "Hans" }
  ];

  console.log('Processing customer support messages...\n');

  for (const message of messages) {
    const translation = await autoTranslator.translate(message.text);

    console.log(`Customer: ${message.customer}`);
    console.log(`Original (${translation.detectedLanguage}): ${message.text}`);
    console.log(`English: ${translation.translatedText}`);
    console.log(`Action: Route to support agent\n`);
  }
}

/**
 * Translation memory simulation
 */
async function translationMemory() {
  console.log('\n=== Translation Memory ===\n');

  const translator = new Translator('en', 'fr');
  const memory: Map<string, string> = new Map();

  const texts = [
    "Hello world",
    "Goodbye world",
    "Hello world", // Repeated
    "Hello there",
    "Hello world"  // Repeated again
  ];

  console.log('Using translation memory for repeated phrases...\n');

  for (const text of texts) {
    let translation: string;

    if (memory.has(text)) {
      translation = memory.get(text)!;
      console.log(`[CACHED] ${text} → ${translation}`);
    } else {
      const result = await translator.translate(text);
      translation = result.translatedText;
      memory.set(text, translation);
      console.log(`[TRANSLATED] ${text} → ${translation}`);
    }
  }

  console.log(`\nCache size: ${memory.size} entries`);
  console.log(`Cache hit rate: ${((texts.length - memory.size) / texts.length * 100).toFixed(1)}%`);
}

/**
 * Main demo function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Machine Translation Demo - Elide NLP ║');
  console.log('║   Powered by Elide Polyglot            ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await basicTranslation();
    await multiTargetTranslation();
    await backTranslation();
    await batchTranslation();
    await autoDetectTranslation();
    await multiHopTranslation();
    await documentTranslation();
    await translationQuality();
    await customerSupportTranslation();
    await translationMemory();

    console.log('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  main();
}

export {
  basicTranslation,
  multiTargetTranslation,
  backTranslation,
  batchTranslation,
  autoDetectTranslation,
  multiHopTranslation,
  documentTranslation,
  translationQuality,
  customerSupportTranslation,
  translationMemory
};
