/**
 * Text Classification module using transformers via Elide polyglot
 * Demonstrates document classification with zero-shot and fine-tuned models
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  ClassificationResult,
  MultiLabelClassificationResult,
  TextClassifierConfig,
  HierarchicalClassificationResult,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Text Classifier for document categorization
 *
 * Supports zero-shot, few-shot, and fine-tuned classification
 *
 * @example
 * ```typescript
 * const classifier = new TextClassifier(['tech', 'sports', 'politics']);
 * const result = await classifier.classify("Apple announces new MacBook Pro");
 * console.log(result.category); // 'tech'
 * ```
 */
export class TextClassifier {
  private pipeline: any;
  private config: TextClassifierConfig;
  private loaded: boolean = false;

  /**
   * Create a new TextClassifier instance
   *
   * @param labels - Category labels or config
   * @param config - Optional configuration
   */
  constructor(
    labels: string[] | TextClassifierConfig,
    config: Partial<TextClassifierConfig> = {}
  ) {
    if (Array.isArray(labels)) {
      this.config = {
        labels,
        device: 'cpu',
        cache: true,
        verbose: false,
        multiLabel: false,
        threshold: 0.5,
        zeroShot: true,
        hypothesisTemplate: 'This text is about {}.',
        ...config
      };
    } else {
      this.config = {
        device: 'cpu',
        cache: true,
        verbose: false,
        multiLabel: false,
        threshold: 0.5,
        zeroShot: true,
        hypothesisTemplate: 'This text is about {}.',
        ...labels
      };
    }
  }

  /**
   * Load the classification model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      if (this.config.zeroShot) {
        // Use zero-shot classification
        this.pipeline = transformers.pipeline(
          'zero-shot-classification',
          {
            model: this.config.model || 'facebook/bart-large-mnli',
            device: this.config.device === 'cuda' ? 0 : -1
          }
        );
      } else {
        // Use fine-tuned classifier
        this.pipeline = transformers.pipeline(
          'text-classification',
          {
            model: this.config.model || 'distilbert-base-uncased',
            device: this.config.device === 'cuda' ? 0 : -1
          }
        );
      }

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Text classifier loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load text classifier: ${error}`);
    }
  }

  /**
   * Classify text
   *
   * @param text - Text to classify
   * @returns Classification result
   */
  async classify(text: string): Promise<ClassificationResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    const startTime = Date.now();

    try {
      let result: any;

      if (this.config.zeroShot) {
        // Zero-shot classification
        result = this.pipeline(
          text,
          this.config.labels,
          {
            hypothesis_template: this.config.hypothesisTemplate,
            multi_label: this.config.multiLabel
          }
        );

        const allScores: Record<string, number> = {};
        for (let i = 0; i < result.labels.length; i++) {
          allScores[result.labels[i]] = result.scores[i];
        }

        const inferenceTime = Date.now() - startTime;

        return {
          category: result.labels[0],
          confidence: result.scores[0],
          allScores,
          text,
          metrics: {
            totalTime: inferenceTime,
            inferenceTime,
            throughput: 1000 / inferenceTime
          }
        };
      } else {
        // Fine-tuned classification
        result = this.pipeline(text)[0];

        const inferenceTime = Date.now() - startTime;

        return {
          category: result.label,
          confidence: result.score,
          allScores: { [result.label]: result.score },
          text,
          metrics: {
            totalTime: inferenceTime,
            inferenceTime,
            throughput: 1000 / inferenceTime
          }
        };
      }
    } catch (error) {
      throw new Error(`Classification failed: ${error}`);
    }
  }

  /**
   * Classify multiple texts in batch
   *
   * @param texts - Texts to classify
   * @param options - Batch options
   * @returns Classification results
   */
  async classifyBatch(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<ClassificationResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const batchSize = options.batchSize || 8;
    const results: ClassificationResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      if (options.showProgress) {
        const progress = ((i + batch.length) / texts.length * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + batch.length}/${texts.length})`);
      }

      if (this.config.zeroShot) {
        for (const text of batch) {
          results.push(await this.classify(text));
        }
      } else {
        const batchResults = this.pipeline(batch);
        for (let j = 0; j < batch.length; j++) {
          const result = batchResults[j];
          results.push({
            category: result.label,
            confidence: result.score,
            allScores: { [result.label]: result.score },
            text: batch[j]
          });
        }
      }
    }

    const totalTime = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`Batch classification complete: ${texts.length} texts in ${totalTime}ms`);
    }

    return results;
  }

  /**
   * Multi-label classification
   *
   * @param text - Text to classify
   * @returns Multi-label result
   */
  async classifyMultiLabel(text: string): Promise<MultiLabelClassificationResult> {
    const originalMultiLabel = this.config.multiLabel;
    this.config.multiLabel = true;

    await this.load();

    const startTime = Date.now();

    try {
      const result = this.pipeline(
        text,
        this.config.labels,
        {
          hypothesis_template: this.config.hypothesisTemplate,
          multi_label: true
        }
      );

      const scores: Record<string, number> = {};
      const labels: string[] = [];

      for (let i = 0; i < result.labels.length; i++) {
        const score = result.scores[i];
        scores[result.labels[i]] = score;

        if (score >= (this.config.threshold || 0.5)) {
          labels.push(result.labels[i]);
        }
      }

      const inferenceTime = Date.now() - startTime;

      return {
        labels,
        scores,
        threshold: this.config.threshold || 0.5,
        text,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } finally {
      this.config.multiLabel = originalMultiLabel;
    }
  }

  /**
   * Get top N categories
   *
   * @param text - Text to classify
   * @param topN - Number of categories to return
   * @returns Top N categories with scores
   */
  async getTopN(
    text: string,
    topN: number = 3
  ): Promise<Array<{ category: string; confidence: number }>> {
    const result = await this.classify(text);

    return Object.entries(result.allScores)
      .map(([category, confidence]) => ({ category, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, topN);
  }

  /**
   * Classify with confidence threshold
   *
   * @param text - Text to classify
   * @param threshold - Minimum confidence threshold
   * @returns Classification result or null if below threshold
   */
  async classifyWithThreshold(
    text: string,
    threshold: number
  ): Promise<ClassificationResult | null> {
    const result = await this.classify(text);

    if (result.confidence < threshold) {
      return null;
    }

    return result;
  }
}

/**
 * Sentiment classifier (specialized)
 */
export class SentimentClassifier extends TextClassifier {
  constructor(config: Partial<TextClassifierConfig> = {}) {
    super(['positive', 'negative', 'neutral'], {
      ...config,
      model: config.model || 'distilbert-base-uncased-finetuned-sst-2-english',
      zeroShot: false
    });
  }
}

/**
 * Topic classifier
 */
export class TopicClassifier extends TextClassifier {
  constructor(
    topics: string[],
    config: Partial<TextClassifierConfig> = {}
  ) {
    super(topics, {
      ...config,
      hypothesisTemplate: 'This text is about {}.',
      zeroShot: true
    });
  }
}

/**
 * Intent classifier (for chatbots)
 */
export class IntentClassifier extends TextClassifier {
  constructor(
    intents: string[],
    config: Partial<TextClassifierConfig> = {}
  ) {
    super(intents, {
      ...config,
      hypothesisTemplate: 'The user wants to {}.',
      zeroShot: true
    });
  }

  /**
   * Classify user intent
   */
  async classifyIntent(
    userMessage: string
  ): Promise<ClassificationResult & { intent: string }> {
    const result = await this.classify(userMessage);
    return {
      ...result,
      intent: result.category
    };
  }
}

/**
 * Emotion classifier
 */
export class EmotionClassifier extends TextClassifier {
  constructor(config: Partial<TextClassifierConfig> = {}) {
    super(
      ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'],
      {
        ...config,
        hypothesisTemplate: 'This text expresses {}.',
        zeroShot: true
      }
    );
  }

  /**
   * Classify emotion
   */
  async classifyEmotion(
    text: string
  ): Promise<ClassificationResult & { emotion: string }> {
    const result = await this.classify(text);
    return {
      ...result,
      emotion: result.category
    };
  }
}

/**
 * Spam classifier
 */
export class SpamClassifier extends TextClassifier {
  constructor(config: Partial<TextClassifierConfig> = {}) {
    super(['spam', 'not spam'], {
      ...config,
      model: config.model || 'mrm8488/bert-tiny-finetuned-sms-spam-detection',
      zeroShot: false
    });
  }

  /**
   * Check if text is spam
   */
  async isSpam(text: string, threshold: number = 0.5): Promise<boolean> {
    const result = await this.classify(text);
    return result.category === 'spam' && result.confidence >= threshold;
  }
}

/**
 * Language style classifier
 */
export class StyleClassifier extends TextClassifier {
  constructor(config: Partial<TextClassifierConfig> = {}) {
    super(
      ['formal', 'informal', 'technical', 'casual', 'professional'],
      {
        ...config,
        hypothesisTemplate: 'This text is written in a {} style.',
        zeroShot: true
      }
    );
  }
}

/**
 * Content moderation classifier
 */
export class ModerationClassifier extends TextClassifier {
  constructor(config: Partial<TextClassifierConfig> = {}) {
    super(
      ['safe', 'unsafe', 'toxic', 'hate-speech', 'violence', 'sexual'],
      {
        ...config,
        multiLabel: true,
        threshold: 0.7
      }
    );
  }

  /**
   * Check if content is safe
   */
  async isSafe(text: string, threshold: number = 0.7): Promise<boolean> {
    const result = await this.classifyMultiLabel(text);
    const unsafeLabels = result.labels.filter(l => l !== 'safe');
    return unsafeLabels.length === 0;
  }

  /**
   * Get moderation flags
   */
  async getFlags(text: string): Promise<{
    safe: boolean;
    flags: string[];
    scores: Record<string, number>;
  }> {
    const result = await this.classifyMultiLabel(text);
    const flags = result.labels.filter(l => l !== 'safe');

    return {
      safe: flags.length === 0,
      flags,
      scores: result.scores
    };
  }
}

/**
 * Hierarchical classifier
 * For multi-level categorization
 */
export class HierarchicalClassifier {
  private levels: Map<number, TextClassifier> = new Map();

  constructor(
    private hierarchy: Array<{ level: number; labels: string[] }>
  ) {
    for (const { level, labels } of hierarchy) {
      this.levels.set(level, new TextClassifier(labels));
    }
  }

  /**
   * Classify through hierarchy
   */
  async classify(text: string): Promise<HierarchicalClassificationResult> {
    const path: string[] = [];
    const confidences: number[] = [];
    let allScores: Record<string, number> = {};

    for (const [level, classifier] of this.levels) {
      const result = await classifier.classify(text);
      path.push(result.category);
      confidences.push(result.confidence);

      if (level === this.levels.size - 1) {
        allScores = result.allScores;
      }
    }

    return {
      path,
      confidences,
      allScores,
      text
    };
  }
}

/**
 * Create a text classifier
 *
 * @param type - Classifier type
 * @param labels - Labels or config
 * @returns TextClassifier instance
 */
export function createTextClassifier(
  type: 'general' | 'sentiment' | 'topic' | 'intent' | 'emotion' | 'spam' | 'style' | 'moderation',
  labels?: string[] | Partial<TextClassifierConfig>
): TextClassifier {
  switch (type) {
    case 'sentiment':
      return new SentimentClassifier(labels as any);
    case 'topic':
      return new TopicClassifier(
        (labels as string[]) || ['technology', 'sports', 'politics'],
        {}
      );
    case 'intent':
      return new IntentClassifier(
        (labels as string[]) || ['book', 'cancel', 'question'],
        {}
      );
    case 'emotion':
      return new EmotionClassifier({});
    case 'spam':
      return new SpamClassifier({});
    case 'style':
      return new StyleClassifier({});
    case 'moderation':
      return new ModerationClassifier({});
    case 'general':
    default:
      return new TextClassifier(labels as any);
  }
}

/**
 * Classification utilities
 */
export const ClassificationUtils = {
  /**
   * Format classification result
   */
  format: (result: ClassificationResult): string => {
    const percentage = (result.confidence * 100).toFixed(1);
    return `${result.category} (${percentage}% confidence)`;
  },

  /**
   * Get confusion matrix
   */
  getConfusionMatrix: (
    predictions: ClassificationResult[],
    trueLabels: string[]
  ): Map<string, Map<string, number>> => {
    const matrix = new Map<string, Map<string, number>>();

    for (let i = 0; i < predictions.length; i++) {
      const predicted = predictions[i].category;
      const actual = trueLabels[i];

      if (!matrix.has(actual)) {
        matrix.set(actual, new Map());
      }

      const row = matrix.get(actual)!;
      row.set(predicted, (row.get(predicted) || 0) + 1);
    }

    return matrix;
  },

  /**
   * Calculate accuracy
   */
  calculateAccuracy: (
    predictions: ClassificationResult[],
    trueLabels: string[]
  ): number => {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].category === trueLabels[i]) {
        correct++;
      }
    }
    return correct / predictions.length;
  },

  /**
   * Get precision for a label
   */
  getPrecision: (
    predictions: ClassificationResult[],
    trueLabels: string[],
    label: string
  ): number => {
    let truePositives = 0;
    let falsePositives = 0;

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].category === label) {
        if (trueLabels[i] === label) {
          truePositives++;
        } else {
          falsePositives++;
        }
      }
    }

    return truePositives / (truePositives + falsePositives) || 0;
  },

  /**
   * Get recall for a label
   */
  getRecall: (
    predictions: ClassificationResult[],
    trueLabels: string[],
    label: string
  ): number => {
    let truePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < predictions.length; i++) {
      if (trueLabels[i] === label) {
        if (predictions[i].category === label) {
          truePositives++;
        } else {
          falseNegatives++;
        }
      }
    }

    return truePositives / (truePositives + falseNegatives) || 0;
  }
};
