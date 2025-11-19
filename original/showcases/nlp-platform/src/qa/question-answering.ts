/**
 * Question Answering module using transformers via Elide polyglot
 * Demonstrates extractive QA with RoBERTa, BERT, and other models
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  QAResult,
  QuestionAnswererConfig,
  MultiPassageQAResult,
  OpenDomainQAResult,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Question Answerer using transformer models
 *
 * Extracts answers from given context using extractive QA
 *
 * @example
 * ```typescript
 * const qa = new QuestionAnswerer('deepset/roberta-base-squad2');
 * const result = await qa.answer(
 *   "What is the capital of France?",
 *   "France is a country in Europe. Paris is the capital..."
 * );
 * console.log(result.answer); // "Paris"
 * ```
 */
export class QuestionAnswerer {
  private pipeline: any;
  private config: QuestionAnswererConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new QuestionAnswerer instance
   *
   * @param modelName - QA model name
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'deepset/roberta-base-squad2',
    config: QuestionAnswererConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      topK: 1,
      handleImpossible: true,
      maxAnswerLength: 50,
      minScore: 0.01,
      ...config
    };
  }

  /**
   * Load the QA model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Load question-answering pipeline
      this.pipeline = transformers.pipeline(
        'question-answering',
        {
          model: this.modelName,
          device: this.config.device === 'cuda' ? 0 : -1
        }
      );

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Question answerer loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load question answerer: ${error}`);
    }
  }

  /**
   * Answer a question
   *
   * @param question - Question to answer
   * @param context - Context containing the answer
   * @returns QA result with answer and confidence
   */
  async answer(
    question: string,
    context: string
  ): Promise<QAResult> {
    if (!question || question.trim().length === 0) {
      throw new InvalidInputError('Question cannot be empty');
    }

    if (!context || context.trim().length === 0) {
      throw new InvalidInputError('Context cannot be empty');
    }

    await this.load();

    const startTime = Date.now();

    try {
      // Get answer from pipeline
      const result = this.pipeline({
        question,
        context
      }, {
        top_k: this.config.topK,
        max_answer_len: this.config.maxAnswerLength,
        handle_impossible_answer: this.config.handleImpossible
      });

      // Handle single or multiple results
      const topResult = Array.isArray(result) ? result[0] : result;

      const inferenceTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Answered in ${inferenceTime}ms`);
        console.log(`Answer: ${topResult.answer} (${(topResult.score * 100).toFixed(1)}%)`);
      }

      // Check if answer meets minimum score
      if (topResult.score < (this.config.minScore || 0)) {
        return {
          answer: '',
          confidence: 0,
          startIndex: -1,
          endIndex: -1,
          question,
          context,
          metrics: {
            totalTime: inferenceTime,
            inferenceTime,
            throughput: 1000 / inferenceTime
          }
        };
      }

      return {
        answer: topResult.answer,
        confidence: topResult.score,
        startIndex: topResult.start,
        endIndex: topResult.end,
        question,
        context,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } catch (error) {
      throw new Error(`Question answering failed: ${error}`);
    }
  }

  /**
   * Answer multiple questions for the same context
   *
   * @param questions - Array of questions
   * @param context - Shared context
   * @param options - Batch options
   * @returns Array of QA results
   */
  async answerBatch(
    questions: string[],
    context: string,
    options: BatchOptions = {}
  ): Promise<QAResult[]> {
    if (!questions || questions.length === 0) {
      throw new InvalidInputError('Questions array cannot be empty');
    }

    const results: QAResult[] = [];

    for (let i = 0; i < questions.length; i++) {
      if (options.showProgress) {
        const progress = ((i + 1) / questions.length * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + 1}/${questions.length})`);
      }

      results.push(await this.answer(questions[i], context));
    }

    return results;
  }

  /**
   * Answer from multiple passages
   *
   * @param question - Question to answer
   * @param passages - Array of context passages
   * @returns Multi-passage QA result
   */
  async answerMultiPassage(
    question: string,
    passages: string[]
  ): Promise<MultiPassageQAResult> {
    if (!passages || passages.length === 0) {
      throw new InvalidInputError('Passages array cannot be empty');
    }

    // Get answers from all passages
    const passageAnswers = await Promise.all(
      passages.map(passage => this.answer(question, passage))
    );

    // Find best answer
    const bestAnswer = passageAnswers.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // Calculate aggregated confidence
    const aggregatedConfidence = passageAnswers.reduce(
      (sum, result) => sum + result.confidence,
      0
    ) / passageAnswers.length;

    return {
      bestAnswer,
      passageAnswers,
      aggregatedConfidence
    };
  }

  /**
   * Get top K answers
   *
   * @param question - Question to answer
   * @param context - Context
   * @param k - Number of answers to return
   * @returns Top K answers
   */
  async getTopKAnswers(
    question: string,
    context: string,
    k: number = 3
  ): Promise<QAResult[]> {
    const originalTopK = this.config.topK;
    this.config.topK = k;

    await this.load();

    try {
      const results = this.pipeline({
        question,
        context
      }, {
        top_k: k,
        max_answer_len: this.config.maxAnswerLength,
        handle_impossible_answer: this.config.handleImpossible
      });

      const startTime = Date.now();
      const inferenceTime = Date.now() - startTime;

      return results.map((result: any) => ({
        answer: result.answer,
        confidence: result.score,
        startIndex: result.start,
        endIndex: result.end,
        question,
        context,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      }));
    } finally {
      this.config.topK = originalTopK;
    }
  }

  /**
   * Check if question is answerable from context
   *
   * @param question - Question
   * @param context - Context
   * @param threshold - Confidence threshold
   * @returns True if answerable
   */
  async isAnswerable(
    question: string,
    context: string,
    threshold: number = 0.3
  ): Promise<boolean> {
    const result = await this.answer(question, context);
    return result.confidence >= threshold && result.answer.length > 0;
  }

  /**
   * Extract all facts from context
   *
   * @param context - Context to extract from
   * @param factQuestions - Template questions for facts
   * @returns Extracted facts
   */
  async extractFacts(
    context: string,
    factQuestions: string[]
  ): Promise<Record<string, string>> {
    const facts: Record<string, string> = {};

    for (const question of factQuestions) {
      const result = await this.answer(question, context);

      if (result.confidence > 0.3) {
        facts[question] = result.answer;
      }
    }

    return facts;
  }

  /**
   * Find answer span in context
   *
   * @param answer - Answer text
   * @param context - Context
   * @returns Start and end indices
   */
  findAnswerSpan(
    answer: string,
    context: string
  ): { start: number; end: number } | null {
    const start = context.indexOf(answer);

    if (start === -1) {
      return null;
    }

    return {
      start,
      end: start + answer.length
    };
  }

  /**
   * Highlight answer in context
   *
   * @param result - QA result
   * @param format - Format function
   * @returns Context with highlighted answer
   */
  highlightAnswer(
    result: QAResult,
    format: (answer: string) => string = (a) => `**${a}**`
  ): string {
    if (result.startIndex === -1) {
      return result.context;
    }

    return (
      result.context.substring(0, result.startIndex) +
      format(result.answer) +
      result.context.substring(result.endIndex)
    );
  }
}

/**
 * BERT-based QA
 */
export class BERTQuestionAnswerer extends QuestionAnswerer {
  constructor(
    variant: 'base' | 'large' = 'base',
    config: QuestionAnswererConfig = {}
  ) {
    const models = {
      base: 'bert-large-uncased-whole-word-masking-finetuned-squad',
      large: 'deepset/bert-large-uncased-whole-word-masking-squad2'
    };
    super(models[variant], config);
  }
}

/**
 * RoBERTa-based QA
 */
export class RoBERTaQuestionAnswerer extends QuestionAnswerer {
  constructor(config: QuestionAnswererConfig = {}) {
    super('deepset/roberta-base-squad2', config);
  }
}

/**
 * ALBERT-based QA (more efficient)
 */
export class ALBERTQuestionAnswerer extends QuestionAnswerer {
  constructor(config: QuestionAnswererConfig = {}) {
    super('twmkn9/albert-base-v2-squad2', config);
  }
}

/**
 * DistilBERT-based QA (fast)
 */
export class DistilBERTQuestionAnswerer extends QuestionAnswerer {
  constructor(config: QuestionAnswererConfig = {}) {
    super('distilbert-base-cased-distilled-squad', config);
  }
}

/**
 * Conversational QA
 * Maintains conversation history
 */
export class ConversationalQA {
  private qa: QuestionAnswerer;
  private history: Array<{ question: string; answer: string; context: string }> = [];

  constructor(qa?: QuestionAnswerer) {
    this.qa = qa || new QuestionAnswerer();
  }

  /**
   * Ask a question with conversation context
   *
   * @param question - Question
   * @param newContext - New context (optional)
   * @returns Answer
   */
  async ask(
    question: string,
    newContext?: string
  ): Promise<QAResult> {
    // Build context from history
    let context = this.history.map(h => h.context).join('\n');

    if (newContext) {
      context = newContext + '\n' + context;
    }

    const result = await this.qa.answer(question, context);

    // Add to history
    this.history.push({
      question,
      answer: result.answer,
      context: newContext || ''
    });

    return result;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ question: string; answer: string }> {
    return this.history.map(h => ({
      question: h.question,
      answer: h.answer
    }));
  }
}

/**
 * Document QA system
 * For question answering over large documents
 */
export class DocumentQA {
  private qa: QuestionAnswerer;
  private chunkSize: number;
  private overlap: number;

  constructor(
    qa?: QuestionAnswerer,
    chunkSize: number = 500,
    overlap: number = 50
  ) {
    this.qa = qa || new QuestionAnswerer();
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  /**
   * Answer from large document
   *
   * @param question - Question
   * @param document - Large document
   * @returns Best answer
   */
  async answerFromDocument(
    question: string,
    document: string
  ): Promise<QAResult> {
    // Split document into chunks
    const chunks = this.chunkDocument(document);

    // Find relevant chunks (simplified - could use embeddings)
    const relevantChunks = chunks.slice(0, 5); // Take first 5 for now

    // Get answers from chunks
    const answers = await Promise.all(
      relevantChunks.map(chunk => this.qa.answer(question, chunk))
    );

    // Return best answer
    return answers.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Chunk document
   */
  private chunkDocument(document: string): string[] {
    const chunks: string[] = [];
    const words = document.split(/\s+/);

    for (let i = 0; i < words.length; i += this.chunkSize - this.overlap) {
      const chunk = words.slice(i, i + this.chunkSize).join(' ');
      chunks.push(chunk);
    }

    return chunks;
  }
}

/**
 * Create a question answerer
 *
 * @param type - QA type
 * @param config - Configuration
 * @returns QuestionAnswerer instance
 */
export function createQuestionAnswerer(
  type?: 'bert' | 'roberta' | 'albert' | 'distilbert' | string,
  config?: QuestionAnswererConfig
): QuestionAnswerer {
  switch (type) {
    case 'bert':
      return new BERTQuestionAnswerer('base', config);
    case 'roberta':
      return new RoBERTaQuestionAnswerer(config);
    case 'albert':
      return new ALBERTQuestionAnswerer(config);
    case 'distilbert':
      return new DistilBERTQuestionAnswerer(config);
    default:
      return new QuestionAnswerer(type, config);
  }
}

/**
 * QA utilities
 */
export const QAUtils = {
  /**
   * Format QA result
   */
  format: (result: QAResult): string => {
    const confidence = (result.confidence * 100).toFixed(1);
    return `Q: ${result.question}\nA: ${result.answer} (${confidence}% confidence)`;
  },

  /**
   * Check answer quality
   */
  isHighQuality: (result: QAResult): boolean => {
    return (
      result.confidence > 0.7 &&
      result.answer.length > 0 &&
      result.answer.length < 100
    );
  },

  /**
   * Extract answer with context
   */
  getAnswerContext: (
    result: QAResult,
    contextWindow: number = 50
  ): string => {
    if (result.startIndex === -1) {
      return '';
    }

    const start = Math.max(0, result.startIndex - contextWindow);
    const end = Math.min(result.context.length, result.endIndex + contextWindow);

    return (
      (start > 0 ? '...' : '') +
      result.context.substring(start, end) +
      (end < result.context.length ? '...' : '')
    );
  },

  /**
   * Evaluate QA system
   */
  evaluateAccuracy: (
    predictions: QAResult[],
    goldAnswers: string[]
  ): {
    exactMatch: number;
    f1: number;
  } => {
    let exactMatches = 0;
    let totalF1 = 0;

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i].answer.toLowerCase().trim();
      const gold = goldAnswers[i].toLowerCase().trim();

      // Exact match
      if (pred === gold) {
        exactMatches++;
      }

      // F1 score
      const predTokens = new Set(pred.split(/\s+/));
      const goldTokens = new Set(gold.split(/\s+/));

      const intersection = new Set([...predTokens].filter(t => goldTokens.has(t)));

      const precision = intersection.size / predTokens.size;
      const recall = intersection.size / goldTokens.size;
      const f1 = precision + recall > 0
        ? 2 * (precision * recall) / (precision + recall)
        : 0;

      totalF1 += f1;
    }

    return {
      exactMatch: exactMatches / predictions.length,
      f1: totalF1 / predictions.length
    };
  }
};
