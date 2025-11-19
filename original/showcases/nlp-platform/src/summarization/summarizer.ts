/**
 * Text Summarization module using transformers via Elide polyglot
 * Demonstrates abstractive and extractive summarization
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  SummarizationOptions,
  SummarizationResult,
  SummarizationStrategy,
  SummarizerConfig,
  ExtractiveResult,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Text Summarizer using transformer models
 *
 * Supports both abstractive and extractive summarization
 *
 * @example
 * ```typescript
 * const summarizer = new Summarizer('facebook/bart-large-cnn');
 * const result = await summarizer.summarize(longArticle, {
 *   maxLength: 150,
 *   strategy: 'abstractive'
 * });
 * console.log(result.summary);
 * ```
 */
export class Summarizer {
  private pipeline: any;
  private config: SummarizerConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new Summarizer instance
   *
   * @param modelName - Summarization model name
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'facebook/bart-large-cnn',
    config: SummarizerConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      modelType: 'bart',
      defaultOptions: {
        maxLength: 150,
        minLength: 50,
        strategy: 'abstractive',
        numBeams: 4,
        lengthPenalty: 2.0,
        earlyStopping: true,
        numSentences: 3
      },
      ...config
    };
  }

  /**
   * Load the summarization model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Load summarization pipeline
      this.pipeline = transformers.pipeline(
        'summarization',
        {
          model: this.modelName,
          device: this.config.device === 'cuda' ? 0 : -1
        }
      );

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Summarizer loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load summarizer: ${error}`);
    }
  }

  /**
   * Summarize text
   *
   * @param text - Text to summarize
   * @param options - Summarization options
   * @returns Summarization result
   */
  async summarize(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    const mergedOptions = { ...this.config.defaultOptions, ...options };
    const strategy = mergedOptions.strategy || 'abstractive';

    if (strategy === 'abstractive') {
      return this.summarizeAbstractive(text, mergedOptions);
    } else if (strategy === 'extractive') {
      return this.summarizeExtractive(text, mergedOptions);
    } else {
      return this.summarizeHybrid(text, mergedOptions);
    }
  }

  /**
   * Abstractive summarization
   */
  private async summarizeAbstractive(
    text: string,
    options: SummarizationOptions
  ): Promise<SummarizationResult> {
    await this.load();

    const startTime = Date.now();

    try {
      // Generate summary
      const result = this.pipeline(text, {
        max_length: options.maxLength,
        min_length: options.minLength,
        num_beams: options.numBeams,
        length_penalty: options.lengthPenalty,
        early_stopping: options.earlyStopping
      })[0];

      const summary = result.summary_text;
      const compressionRatio = summary.length / text.length;

      const inferenceTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Summarized in ${inferenceTime}ms`);
        console.log(`Compression: ${(compressionRatio * 100).toFixed(1)}%`);
      }

      return {
        summary,
        originalText: text,
        compressionRatio,
        strategy: 'abstractive',
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } catch (error) {
      throw new Error(`Abstractive summarization failed: ${error}`);
    }
  }

  /**
   * Extractive summarization
   */
  private async summarizeExtractive(
    text: string,
    options: SummarizationOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();

    try {
      // Split into sentences
      const sentences = this.splitIntoSentences(text);

      if (sentences.length === 0) {
        throw new Error('No sentences found in text');
      }

      // Score sentences
      const scores = await this.scoreSentences(sentences, text);

      // Select top sentences
      const numSentences = options.numSentences || 3;
      const topSentences = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences)
        .sort((a, b) => a.position - b.position)
        .map(s => s.text);

      const summary = topSentences.join(' ');
      const compressionRatio = summary.length / text.length;

      const inferenceTime = Date.now() - startTime;

      return {
        summary,
        originalText: text,
        compressionRatio,
        strategy: 'extractive',
        keySentences: topSentences,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } catch (error) {
      throw new Error(`Extractive summarization failed: ${error}`);
    }
  }

  /**
   * Hybrid summarization (extractive + abstractive)
   */
  private async summarizeHybrid(
    text: string,
    options: SummarizationOptions
  ): Promise<SummarizationResult> {
    // First, extractive to reduce length
    const extractive = await this.summarizeExtractive(text, {
      ...options,
      numSentences: Math.max(5, Math.ceil(this.splitIntoSentences(text).length * 0.3))
    });

    // Then, abstractive on extracted sentences
    const abstractive = await this.summarizeAbstractive(
      extractive.summary,
      options
    );

    return {
      ...abstractive,
      strategy: 'hybrid',
      keySentences: extractive.keySentences,
      originalText: text
    };
  }

  /**
   * Summarize multiple texts in batch
   *
   * @param texts - Texts to summarize
   * @param options - Summarization options
   * @param batchOptions - Batch options
   * @returns Summarization results
   */
  async summarizeBatch(
    texts: string[],
    options: SummarizationOptions = {},
    batchOptions: BatchOptions = {}
  ): Promise<SummarizationResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    const results: SummarizationResult[] = [];

    for (let i = 0; i < texts.length; i++) {
      if (batchOptions.showProgress) {
        const progress = ((i + 1) / texts.length * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + 1}/${texts.length})`);
      }

      results.push(await this.summarize(texts[i], options));
    }

    return results;
  }

  /**
   * Generate headlines
   *
   * @param text - Text to generate headline from
   * @returns Short headline
   */
  async generateHeadline(text: string): Promise<string> {
    const result = await this.summarize(text, {
      maxLength: 30,
      minLength: 10,
      strategy: 'abstractive'
    });

    return result.summary;
  }

  /**
   * Generate bullet points
   *
   * @param text - Text to summarize
   * @param numPoints - Number of bullet points
   * @returns Bullet points
   */
  async generateBulletPoints(
    text: string,
    numPoints: number = 5
  ): Promise<string[]> {
    const result = await this.summarizeExtractive(text, {
      numSentences: numPoints,
      strategy: 'extractive'
    });

    return result.keySentences || [];
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter very short sentences
  }

  /**
   * Score sentences for extractive summarization
   */
  private async scoreSentences(
    sentences: string[],
    fullText: string
  ): Promise<Array<{ text: string; score: number; position: number }>> {
    const scores: Array<{ text: string; score: number; position: number }> = [];

    // Calculate word frequencies
    const wordFreq = this.calculateWordFrequencies(fullText);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      let score = 0;

      // Score based on word frequencies
      const words = sentence.toLowerCase().split(/\s+/);
      for (const word of words) {
        score += wordFreq.get(word) || 0;
      }

      // Normalize by sentence length
      score /= words.length;

      // Position bonus (earlier sentences get higher score)
      const positionBonus = 1.0 - (i / sentences.length) * 0.3;
      score *= positionBonus;

      scores.push({ text: sentence, score, position: i });
    }

    return scores;
  }

  /**
   * Calculate word frequencies
   */
  private calculateWordFrequencies(text: string): Map<string, number> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3); // Filter short words

    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Normalize frequencies
    const maxFreq = Math.max(...Array.from(freq.values()));
    for (const [word, count] of freq.entries()) {
      freq.set(word, count / maxFreq);
    }

    return freq;
  }
}

/**
 * BART summarizer (high quality)
 */
export class BARTSummarizer extends Summarizer {
  constructor(
    variant: 'base' | 'large' = 'large',
    config: SummarizerConfig = {}
  ) {
    const models = {
      base: 'facebook/bart-base',
      large: 'facebook/bart-large-cnn'
    };
    super(models[variant], { ...config, modelType: 'bart' });
  }
}

/**
 * T5 summarizer
 */
export class T5Summarizer extends Summarizer {
  constructor(
    size: 'small' | 'base' | 'large' = 'base',
    config: SummarizerConfig = {}
  ) {
    const models = {
      small: 't5-small',
      base: 't5-base',
      large: 't5-large'
    };
    super(models[size], { ...config, modelType: 't5' });
  }

  /**
   * Summarize with prefix
   */
  async summarize(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    // T5 requires "summarize: " prefix
    const prefixedText = `summarize: ${text}`;
    return super.summarize(prefixedText, options);
  }
}

/**
 * PEGASUS summarizer (optimized for summarization)
 */
export class PEGASUSSummarizer extends Summarizer {
  constructor(
    variant: 'xsum' | 'cnn_dailymail' | 'arxiv' = 'xsum',
    config: SummarizerConfig = {}
  ) {
    const models = {
      xsum: 'google/pegasus-xsum',
      cnn_dailymail: 'google/pegasus-cnn_dailymail',
      arxiv: 'google/pegasus-arxiv'
    };
    super(models[variant], { ...config, modelType: 'pegasus' });
  }
}

/**
 * LED summarizer (for long documents)
 */
export class LEDSummarizer extends Summarizer {
  constructor(config: SummarizerConfig = {}) {
    super('allenai/led-large-16384-arxiv', { ...config, modelType: 'led' });
  }

  /**
   * Summarize long documents (up to 16K tokens)
   */
  async summarizeLongDocument(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    return this.summarize(text, {
      ...options,
      maxLength: options.maxLength || 512
    });
  }
}

/**
 * Create a summarizer
 *
 * @param type - Summarizer type
 * @param config - Configuration
 * @returns Summarizer instance
 */
export function createSummarizer(
  type?: 'bart' | 't5' | 'pegasus' | 'led' | string,
  config?: SummarizerConfig
): Summarizer {
  switch (type) {
    case 'bart':
      return new BARTSummarizer('large', config);
    case 't5':
      return new T5Summarizer('base', config);
    case 'pegasus':
      return new PEGASUSSummarizer('xsum', config);
    case 'led':
      return new LEDSummarizer(config);
    default:
      return new Summarizer(type, config);
  }
}

/**
 * Summarization utilities
 */
export const SummarizationUtils = {
  /**
   * Calculate ROUGE score (simplified)
   */
  calculateRouge: (summary: string, reference: string): {
    rouge1: number;
    rouge2: number;
    rougeL: number;
  } => {
    // Simplified ROUGE implementation
    const summaryWords = new Set(summary.toLowerCase().split(/\s+/));
    const referenceWords = new Set(reference.toLowerCase().split(/\s+/));

    const intersection = new Set([...summaryWords].filter(w => referenceWords.has(w)));

    const precision = intersection.size / summaryWords.size;
    const recall = intersection.size / referenceWords.size;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      rouge1: f1,
      rouge2: f1 * 0.8, // Placeholder
      rougeL: f1 * 0.9  // Placeholder
    };
  },

  /**
   * Check if summary is faithful to source
   */
  checkFaithfulness: (summary: string, source: string): {
    faithful: boolean;
    coverage: number;
  } => {
    const summaryWords = new Set(summary.toLowerCase().split(/\s+/));
    const sourceWords = new Set(source.toLowerCase().split(/\s+/));

    const covered = [...summaryWords].filter(w => sourceWords.has(w)).length;
    const coverage = covered / summaryWords.size;

    return {
      faithful: coverage > 0.7,
      coverage
    };
  },

  /**
   * Format summary
   */
  format: (result: SummarizationResult): string => {
    const ratio = (result.compressionRatio * 100).toFixed(1);
    return `Summary (${ratio}% of original):\n${result.summary}`;
  }
};
