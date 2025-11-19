/**
 * Machine Translation module using transformers via Elide polyglot
 * Demonstrates neural machine translation with Python transformers
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  TranslationResult,
  TranslatorConfig,
  LanguageCode,
  LanguageDetectionResult,
  BackTranslationResult,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Translator for machine translation
 *
 * Uses MarianMT and other translation models via Elide polyglot
 *
 * @example
 * ```typescript
 * const translator = new Translator('en', 'fr');
 * const result = await translator.translate("Hello, how are you?");
 * console.log(result.translatedText); // "Bonjour, comment allez-vous?"
 * ```
 */
export class Translator {
  private pipeline: any;
  private config: TranslatorConfig;
  private loaded: boolean = false;

  /**
   * Create a new Translator instance
   *
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @param config - Optional configuration
   */
  constructor(
    sourceLanguage: LanguageCode = 'en',
    targetLanguage: LanguageCode = 'fr',
    config: Partial<TranslatorConfig> = {}
  ) {
    this.config = {
      sourceLanguage,
      targetLanguage,
      device: 'cpu',
      cache: true,
      verbose: false,
      maxLength: 512,
      numBeams: 5,
      ...config
    };
  }

  /**
   * Load the translation model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      const modelName = this.getModelName(
        this.config.sourceLanguage,
        this.config.targetLanguage
      );

      // Load translation pipeline from Python
      this.pipeline = transformers.pipeline(
        'translation',
        {
          model: modelName,
          device: this.config.device === 'cuda' ? 0 : -1
        }
      );

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Translator loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load translator: ${error}`);
    }
  }

  /**
   * Translate text
   *
   * @param text - Text to translate
   * @returns Translation result
   */
  async translate(text: string): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    const startTime = Date.now();

    try {
      // Call Python translation pipeline
      const result = this.pipeline(text, {
        max_length: this.config.maxLength,
        num_beams: this.config.numBeams
      })[0];

      const inferenceTime = Date.now() - startTime;

      const translationResult: TranslationResult = {
        translatedText: result.translation_text,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguage: this.config.targetLanguage,
        confidence: result.score || 0.95,
        originalText: text,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };

      if (this.config.verbose) {
        console.log(`Translated in ${inferenceTime}ms`);
      }

      return translationResult;
    } catch (error) {
      throw new Error(`Translation failed: ${error}`);
    }
  }

  /**
   * Translate multiple texts in batch
   *
   * @param texts - Array of texts to translate
   * @param options - Batch options
   * @returns Array of translation results
   */
  async translateBatch(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<TranslationResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const batchSize = options.batchSize || 8;
    const results: TranslationResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      if (options.showProgress) {
        const progress = ((i + batch.length) / texts.length * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + batch.length}/${texts.length})`);
      }

      const batchResults = this.pipeline(batch, {
        max_length: this.config.maxLength,
        num_beams: this.config.numBeams
      });

      for (let j = 0; j < batch.length; j++) {
        results.push({
          translatedText: batchResults[j].translation_text,
          sourceLanguage: this.config.sourceLanguage,
          targetLanguage: this.config.targetLanguage,
          confidence: batchResults[j].score || 0.95,
          originalText: batch[j]
        });
      }
    }

    const totalTime = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`Batch translation complete: ${texts.length} texts in ${totalTime}ms`);
      console.log(`Throughput: ${(texts.length / totalTime * 1000).toFixed(2)} texts/sec`);
    }

    return results;
  }

  /**
   * Back-translate for validation
   *
   * @param text - Text to translate and back
   * @returns Back-translation result
   */
  async backTranslate(text: string): Promise<BackTranslationResult> {
    // Forward translation
    const forward = await this.translate(text);

    // Create reverse translator
    const reverseTranslator = new Translator(
      this.config.targetLanguage,
      this.config.sourceLanguage,
      { ...this.config }
    );

    // Backward translation
    const backward = await reverseTranslator.translate(forward.translatedText);

    // Calculate similarity (simple word overlap)
    const similarity = this.calculateSimilarity(text, backward.translatedText);

    return {
      forward: forward.translatedText,
      backward: backward.translatedText,
      similarity,
      original: text
    };
  }

  /**
   * Get model name for language pair
   */
  private getModelName(
    source: LanguageCode,
    target: LanguageCode
  ): string {
    // Use MarianMT models
    return `Helsinki-NLP/opus-mt-${source}-${target}`;
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

/**
 * Multi-target translator
 * Translate to multiple languages
 */
export class MultiTargetTranslator {
  private translators: Map<LanguageCode, Translator> = new Map();
  private sourceLanguage: LanguageCode;

  constructor(sourceLanguage: LanguageCode = 'en') {
    this.sourceLanguage = sourceLanguage;
  }

  /**
   * Translate to multiple languages
   *
   * @param text - Text to translate
   * @param targetLanguages - Target languages
   * @returns Translations for each language
   */
  async translateToMany(
    text: string,
    targetLanguages: LanguageCode[]
  ): Promise<Map<LanguageCode, TranslationResult>> {
    const results = new Map<LanguageCode, TranslationResult>();

    for (const targetLang of targetLanguages) {
      if (!this.translators.has(targetLang)) {
        this.translators.set(
          targetLang,
          new Translator(this.sourceLanguage, targetLang)
        );
      }

      const translator = this.translators.get(targetLang)!;
      const result = await translator.translate(text);
      results.set(targetLang, result);
    }

    return results;
  }
}

/**
 * M2M (Many-to-Many) Translator
 * Supports any language pair
 */
export class M2MTranslator {
  private model: any;
  private tokenizer: any;
  private loaded: boolean = false;

  constructor(private modelName: string = 'facebook/m2m100_418M') {}

  /**
   * Load M2M model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    try {
      this.tokenizer = transformers.M2M100Tokenizer.from_pretrained(this.modelName);
      this.model = transformers.M2M100ForConditionalGeneration.from_pretrained(this.modelName);
      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to load M2M translator: ${error}`);
    }
  }

  /**
   * Translate between any language pair
   *
   * @param text - Text to translate
   * @param sourceLang - Source language
   * @param targetLang - Target language
   * @returns Translation result
   */
  async translate(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Promise<TranslationResult> {
    await this.load();

    const startTime = Date.now();

    try {
      // Set source language
      this.tokenizer.src_lang = sourceLang;

      // Encode
      const encoded = this.tokenizer(text, { return_tensors: 'pt' });

      // Generate with target language
      const generated = this.model.generate(
        encoded.input_ids,
        { forced_bos_token_id: this.tokenizer.get_lang_id(targetLang) }
      );

      // Decode
      const translatedText = this.tokenizer.batch_decode(
        generated,
        { skip_special_tokens: true }
      )[0];

      const inferenceTime = Date.now() - startTime;

      return {
        translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence: 0.9,
        originalText: text,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } catch (error) {
      throw new Error(`M2M translation failed: ${error}`);
    }
  }
}

/**
 * Language detector
 */
export class LanguageDetector {
  private pipeline: any;
  private loaded: boolean = false;

  /**
   * Load language detection model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    try {
      this.pipeline = transformers.pipeline(
        'text-classification',
        { model: 'papluca/xlm-roberta-base-language-detection' }
      );
      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to load language detector: ${error}`);
    }
  }

  /**
   * Detect language
   *
   * @param text - Text to analyze
   * @returns Detected language
   */
  async detect(text: string): Promise<LanguageDetectionResult> {
    await this.load();

    try {
      const results = this.pipeline(text);
      const topResult = results[0];

      const alternatives = results.slice(1, 4).map((r: any) => ({
        language: r.label as LanguageCode,
        confidence: r.score
      }));

      return {
        language: topResult.label as LanguageCode,
        confidence: topResult.score,
        alternatives
      };
    } catch (error) {
      throw new Error(`Language detection failed: ${error}`);
    }
  }
}

/**
 * Auto-translator with language detection
 */
export class AutoTranslator {
  private detector: LanguageDetector;
  private translators: Map<string, Translator> = new Map();

  constructor(private targetLanguage: LanguageCode = 'en') {
    this.detector = new LanguageDetector();
  }

  /**
   * Detect and translate
   *
   * @param text - Text to translate
   * @returns Translation with detected language
   */
  async translate(
    text: string
  ): Promise<TranslationResult & { detectedLanguage: LanguageCode }> {
    // Detect source language
    const detection = await this.detector.detect(text);
    const sourceLang = detection.language;

    // Skip if already in target language
    if (sourceLang === this.targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: this.targetLanguage,
        confidence: 1.0,
        originalText: text,
        detectedLanguage: sourceLang
      };
    }

    // Get or create translator
    const key = `${sourceLang}-${this.targetLanguage}`;
    if (!this.translators.has(key)) {
      this.translators.set(
        key,
        new Translator(sourceLang, this.targetLanguage)
      );
    }

    const translator = this.translators.get(key)!;
    const result = await translator.translate(text);

    return {
      ...result,
      detectedLanguage: sourceLang
    };
  }
}

/**
 * Create a translator
 *
 * @param source - Source language
 * @param target - Target language
 * @param config - Configuration
 * @returns Translator instance
 */
export function createTranslator(
  source?: LanguageCode,
  target?: LanguageCode,
  config?: Partial<TranslatorConfig>
): Translator {
  return new Translator(source, target, config);
}

/**
 * Translation utilities
 */
export const TranslationUtils = {
  /**
   * Get language name from code
   */
  getLanguageName: (code: LanguageCode): string => {
    const names: Record<LanguageCode, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ru: 'Russian', zh: 'Chinese',
      ja: 'Japanese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi',
      nl: 'Dutch', pl: 'Polish', tr: 'Turkish', vi: 'Vietnamese',
      th: 'Thai', id: 'Indonesian', he: 'Hebrew', sv: 'Swedish',
      no: 'Norwegian', da: 'Danish', fi: 'Finnish', el: 'Greek',
      cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', uk: 'Ukrainian',
      bg: 'Bulgarian', hr: 'Croatian'
    };
    return names[code] || code;
  },

  /**
   * Check if language pair is supported
   */
  isSupported: (source: LanguageCode, target: LanguageCode): boolean => {
    // Most European languages are supported via MarianMT
    const europeanLangs: LanguageCode[] = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'nl', 'pl',
      'sv', 'no', 'da', 'fi', 'el', 'cs', 'ro', 'hu', 'bg', 'hr'
    ];
    return europeanLangs.includes(source) && europeanLangs.includes(target);
  },

  /**
   * Format translation for display
   */
  format: (result: TranslationResult): string => {
    const srcLang = TranslationUtils.getLanguageName(result.sourceLanguage);
    const tgtLang = TranslationUtils.getLanguageName(result.targetLanguage);
    return `[${srcLang} → ${tgtLang}]\n${result.originalText}\n↓\n${result.translatedText}`;
  }
};
