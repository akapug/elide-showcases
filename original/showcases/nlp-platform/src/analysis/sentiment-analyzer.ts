/**
 * Sentiment Analysis module using transformers via Elide polyglot
 * Demonstrates state-of-the-art sentiment classification with Python ML libraries
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  SentimentResult,
  SentimentLabel,
  ConfidenceLevel,
  SentimentAnalyzerConfig,
  BatchOptions,
  PerformanceMetrics,
  AspectSentiment,
  InvalidInputError
} from '../types';

/**
 * Sentiment Analyzer using transformer models
 *
 * This class demonstrates Elide's polyglot power by using Python's
 * transformers library directly in TypeScript for sentiment analysis.
 *
 * @example
 * ```typescript
 * const analyzer = new SentimentAnalyzer();
 * const result = await analyzer.analyze("I love this product!");
 * console.log(result.label); // 'POSITIVE'
 * console.log(result.score); // 0.9987
 * ```
 */
export class SentimentAnalyzer {
  private pipeline: any;
  private config: SentimentAnalyzerConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new SentimentAnalyzer instance
   *
   * @param modelName - Model to use for sentiment analysis
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'distilbert-base-uncased-finetuned-sst-2-english',
    config: SentimentAnalyzerConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      returnAllScores: false,
      batchSize: 8,
      multiLabel: false,
      ...config
    };
  }

  /**
   * Load the sentiment analysis pipeline
   *
   * Direct Python pipeline creation - no REST API needed!
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Direct Python transformers pipeline call
      this.pipeline = transformers.pipeline(
        'sentiment-analysis',
        {
          model: this.modelName,
          device: this.config.device === 'cuda' ? 0 : -1,
          return_all_scores: this.config.returnAllScores
        }
      );

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Sentiment analyzer loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load sentiment analyzer: ${error}`);
    }
  }

  /**
   * Analyze sentiment of a text
   *
   * @param text - Text to analyze
   * @returns Sentiment analysis result
   */
  async analyze(text: string): Promise<SentimentResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    const startTime = Date.now();

    try {
      // Call Python pipeline directly
      const result = this.pipeline(text)[0];

      let label: SentimentLabel;
      let score: number;
      let allScores: Record<SentimentLabel, number> | undefined;

      if (this.config.returnAllScores && Array.isArray(result)) {
        // Multiple scores returned
        allScores = {} as Record<SentimentLabel, number>;
        let maxScore = 0;
        let maxLabel: SentimentLabel = 'NEUTRAL';

        for (const item of result) {
          const itemLabel = this.normalizeLabel(item.label);
          const itemScore = item.score;
          allScores[itemLabel] = itemScore;

          if (itemScore > maxScore) {
            maxScore = itemScore;
            maxLabel = itemLabel;
          }
        }

        label = maxLabel;
        score = maxScore;
      } else {
        // Single prediction
        label = this.normalizeLabel(result.label);
        score = result.score;
      }

      const confidence = this.getConfidenceLevel(score);
      const inferenceTime = Date.now() - startTime;

      const sentimentResult: SentimentResult = {
        label,
        score,
        confidence,
        text,
        allScores,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };

      if (this.config.verbose) {
        console.log(`Analyzed in ${inferenceTime}ms: ${label} (${score.toFixed(4)})`);
      }

      return sentimentResult;
    } catch (error) {
      throw new Error(`Sentiment analysis failed: ${error}`);
    }
  }

  /**
   * Analyze sentiment of multiple texts in batch
   *
   * @param texts - Array of texts to analyze
   * @param options - Batch processing options
   * @returns Array of sentiment results
   */
  async analyzeBatch(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<SentimentResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const batchSize = options.batchSize || this.config.batchSize || 8;
    const results: SentimentResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      if (options.showProgress) {
        const progress = ((i + batch.length) / texts.length * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + batch.length}/${texts.length})`);
      }

      // Process batch through pipeline
      const batchResults = this.pipeline(batch);

      for (let j = 0; j < batch.length; j++) {
        const result = batchResults[j];
        const text = batch[j];

        let label: SentimentLabel;
        let score: number;

        if (this.config.returnAllScores && Array.isArray(result)) {
          const maxItem = result.reduce((max: any, item: any) =>
            item.score > max.score ? item : max
          );
          label = this.normalizeLabel(maxItem.label);
          score = maxItem.score;
        } else {
          label = this.normalizeLabel(result.label);
          score = result.score;
        }

        results.push({
          label,
          score,
          confidence: this.getConfidenceLevel(score),
          text
        });
      }
    }

    const totalTime = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`Batch analysis complete: ${texts.length} texts in ${totalTime}ms`);
      console.log(`Throughput: ${(texts.length / totalTime * 1000).toFixed(2)} texts/sec`);
    }

    return results;
  }

  /**
   * Get sentiment distribution for a text
   *
   * @param text - Text to analyze
   * @returns Scores for all sentiment classes
   */
  async getSentimentDistribution(
    text: string
  ): Promise<Record<SentimentLabel, number>> {
    const originalReturnAll = this.config.returnAllScores;
    this.config.returnAllScores = true;

    const result = await this.analyze(text);

    this.config.returnAllScores = originalReturnAll;

    return result.allScores || { [result.label]: result.score } as Record<SentimentLabel, number>;
  }

  /**
   * Analyze sentiment by aspect
   *
   * Extracts different aspects from text and analyzes sentiment for each
   *
   * @param text - Text to analyze
   * @param aspects - Aspects to look for
   * @returns Sentiment for each aspect
   */
  async analyzeByAspect(
    text: string,
    aspects: string[]
  ): Promise<AspectSentiment[]> {
    const sentences = this.splitIntoSentences(text);
    const results: AspectSentiment[] = [];

    for (const aspect of aspects) {
      // Find sentences mentioning this aspect
      const relevantSentences = sentences.filter(s =>
        s.toLowerCase().includes(aspect.toLowerCase())
      );

      if (relevantSentences.length === 0) {
        continue;
      }

      // Analyze sentiment of relevant sentences
      const sentimentResults = await this.analyzeBatch(relevantSentences);

      // Aggregate sentiment
      const avgScore = sentimentResults.reduce((sum, r) => sum + r.score, 0) / sentimentResults.length;
      const dominantLabel = this.getDominantLabel(sentimentResults);

      results.push({
        aspect,
        sentiment: dominantLabel,
        score: avgScore,
        snippet: relevantSentences[0]
      });
    }

    return results;
  }

  /**
   * Compare sentiments of two texts
   *
   * @param text1 - First text
   * @param text2 - Second text
   * @returns Comparison result
   */
  async compare(
    text1: string,
    text2: string
  ): Promise<{
    text1: SentimentResult;
    text2: SentimentResult;
    difference: number;
    morePositive: 'text1' | 'text2' | 'equal';
  }> {
    const [result1, result2] = await this.analyzeBatch([text1, text2]);

    const score1 = this.getSentimentScore(result1);
    const score2 = this.getSentimentScore(result2);
    const difference = Math.abs(score1 - score2);

    let morePositive: 'text1' | 'text2' | 'equal';
    if (Math.abs(score1 - score2) < 0.1) {
      morePositive = 'equal';
    } else {
      morePositive = score1 > score2 ? 'text1' : 'text2';
    }

    return {
      text1: result1,
      text2: result2,
      difference,
      morePositive
    };
  }

  /**
   * Track sentiment over time series data
   *
   * @param texts - Array of texts with timestamps
   * @returns Sentiment time series
   */
  async analyzeTimeSeries(
    texts: Array<{ text: string; timestamp: Date }>
  ): Promise<Array<{
    timestamp: Date;
    sentiment: SentimentResult;
  }>> {
    const justTexts = texts.map(t => t.text);
    const results = await this.analyzeBatch(justTexts);

    return texts.map((item, idx) => ({
      timestamp: item.timestamp,
      sentiment: results[idx]
    }));
  }

  /**
   * Get aggregate sentiment statistics
   *
   * @param results - Array of sentiment results
   * @returns Aggregate statistics
   */
  aggregateStats(
    results: SentimentResult[]
  ): {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
    averageScore: number;
    dominantSentiment: SentimentLabel;
  } {
    const counts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0
    };

    let totalScore = 0;

    for (const result of results) {
      const label = result.label.toLowerCase();
      if (label in counts) {
        counts[label as keyof typeof counts]++;
      }
      totalScore += this.getSentimentScore(result);
    }

    const dominantSentiment = Object.entries(counts).reduce((max, [key, value]) =>
      value > max[1] ? [key, value] : max,
      ['neutral', 0]
    )[0].toUpperCase() as SentimentLabel;

    return {
      positive: counts.positive / results.length,
      negative: counts.negative / results.length,
      neutral: counts.neutral / results.length,
      mixed: counts.mixed / results.length,
      averageScore: totalScore / results.length,
      dominantSentiment
    };
  }

  /**
   * Normalize label to standard format
   */
  private normalizeLabel(label: string): SentimentLabel {
    const normalized = label.toUpperCase();

    if (normalized.includes('POS')) return 'POSITIVE';
    if (normalized.includes('NEG')) return 'NEGATIVE';
    if (normalized.includes('NEU')) return 'NEUTRAL';
    if (normalized.includes('MIX')) return 'MIXED';

    // Map numeric labels
    if (label === '5' || label === '4') return 'POSITIVE';
    if (label === '1' || label === '2') return 'NEGATIVE';
    if (label === '3') return 'NEUTRAL';

    return normalized as SentimentLabel;
  }

  /**
   * Determine confidence level from score
   */
  private getConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.95) return 'very_high';
    if (score >= 0.80) return 'high';
    if (score >= 0.60) return 'medium';
    if (score >= 0.40) return 'low';
    return 'very_low';
  }

  /**
   * Convert sentiment to numeric score (-1 to 1)
   */
  private getSentimentScore(result: SentimentResult): number {
    switch (result.label) {
      case 'POSITIVE':
        return result.score;
      case 'NEGATIVE':
        return -result.score;
      case 'NEUTRAL':
        return 0;
      case 'MIXED':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Get dominant sentiment label from multiple results
   */
  private getDominantLabel(results: SentimentResult[]): SentimentLabel {
    const counts = new Map<SentimentLabel, number>();

    for (const result of results) {
      counts.set(result.label, (counts.get(result.label) || 0) + 1);
    }

    let maxCount = 0;
    let dominant: SentimentLabel = 'NEUTRAL';

    for (const [label, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominant = label;
      }
    }

    return dominant;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}

/**
 * RoBERTa-based sentiment analyzer
 * More accurate for nuanced sentiment
 */
export class RobertaSentimentAnalyzer extends SentimentAnalyzer {
  constructor(config: SentimentAnalyzerConfig = {}) {
    super('cardiffnlp/twitter-roberta-base-sentiment-latest', config);
  }
}

/**
 * Multi-lingual sentiment analyzer
 */
export class MultilingualSentimentAnalyzer extends SentimentAnalyzer {
  constructor(config: SentimentAnalyzerConfig = {}) {
    super('nlptown/bert-base-multilingual-uncased-sentiment', config);
  }

  /**
   * Analyze with language detection
   */
  async analyzeWithLanguage(
    text: string
  ): Promise<SentimentResult & { language?: string }> {
    const result = await this.analyze(text);

    // Language detection would be implemented here
    // using langdetect or similar library

    return {
      ...result,
      language: 'auto'
    };
  }
}

/**
 * Financial sentiment analyzer
 * Specialized for financial texts
 */
export class FinancialSentimentAnalyzer extends SentimentAnalyzer {
  constructor(config: SentimentAnalyzerConfig = {}) {
    super('ProsusAI/finbert', config);
  }

  /**
   * Analyze with financial context
   */
  async analyzeFinancial(
    text: string
  ): Promise<SentimentResult & {
    bullish?: number;
    bearish?: number;
    neutral?: number;
  }> {
    const result = await this.analyze(text);

    // Map to financial terms
    const bullish = result.label === 'POSITIVE' ? result.score : 0;
    const bearish = result.label === 'NEGATIVE' ? result.score : 0;
    const neutral = result.label === 'NEUTRAL' ? result.score : 0;

    return {
      ...result,
      bullish,
      bearish,
      neutral
    };
  }
}

/**
 * Create a sentiment analyzer with specified model
 *
 * @param modelName - Model name or type
 * @param config - Configuration
 * @returns SentimentAnalyzer instance
 */
export function createSentimentAnalyzer(
  modelName?: string | 'default' | 'roberta' | 'multilingual' | 'financial',
  config?: SentimentAnalyzerConfig
): SentimentAnalyzer {
  if (!modelName || modelName === 'default') {
    return new SentimentAnalyzer(undefined, config);
  }

  switch (modelName) {
    case 'roberta':
      return new RobertaSentimentAnalyzer(config);
    case 'multilingual':
      return new MultilingualSentimentAnalyzer(config);
    case 'financial':
      return new FinancialSentimentAnalyzer(config);
    default:
      return new SentimentAnalyzer(modelName, config);
  }
}

/**
 * Sentiment analysis utility functions
 */
export const SentimentUtils = {
  /**
   * Check if sentiment is positive
   */
  isPositive: (result: SentimentResult): boolean =>
    result.label === 'POSITIVE' && result.score > 0.5,

  /**
   * Check if sentiment is negative
   */
  isNegative: (result: SentimentResult): boolean =>
    result.label === 'NEGATIVE' && result.score > 0.5,

  /**
   * Check if sentiment is neutral
   */
  isNeutral: (result: SentimentResult): boolean =>
    result.label === 'NEUTRAL',

  /**
   * Check if confidence is high
   */
  isHighConfidence: (result: SentimentResult): boolean =>
    result.confidence === 'high' || result.confidence === 'very_high',

  /**
   * Get sentiment emoji
   */
  getEmoji: (result: SentimentResult): string => {
    switch (result.label) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '😞';
      case 'NEUTRAL': return '😐';
      case 'MIXED': return '😕';
      default: return '❓';
    }
  },

  /**
   * Format sentiment for display
   */
  format: (result: SentimentResult): string => {
    const emoji = SentimentUtils.getEmoji(result);
    const percentage = (result.score * 100).toFixed(1);
    return `${emoji} ${result.label} (${percentage}% confidence)`;
  }
};
