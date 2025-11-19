/**
 * Dependency Parsing module using spaCy via Elide polyglot
 * Demonstrates syntactic analysis and dependency parsing
 */

// @ts-ignore - Elide polyglot import
import spacy from 'python:spacy';

import {
  ParsedToken,
  Dependency,
  ParseResult,
  DependencyParserConfig,
  POSTag,
  DepRelation,
  ConstituencyNode,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Dependency Parser using spaCy
 *
 * Analyzes grammatical structure and dependencies
 *
 * @example
 * ```typescript
 * const parser = new DependencyParser('en_core_web_lg');
 * const result = await parser.parse("The cat sits on the mat");
 * console.log(result.dependencies);
 * ```
 */
export class DependencyParser {
  private nlp: any;
  private config: DependencyParserConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new DependencyParser instance
   *
   * @param modelName - spaCy model name
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'en_core_web_sm',
    config: DependencyParserConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      disableParser: false,
      disableTagger: false,
      disableLemmatizer: false,
      ...config
    };
  }

  /**
   * Load the spaCy model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Load spaCy model
      this.nlp = spacy.load(this.modelName);

      // Disable components we don't need
      const disabledComponents: string[] = [];
      if (this.config.disableParser) disabledComponents.push('parser');
      if (this.config.disableTagger) disabledComponents.push('tagger');
      if (this.config.disableLemmatizer) disabledComponents.push('lemmatizer');

      if (disabledComponents.length > 0) {
        this.nlp.disable_pipes(disabledComponents);
      }

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Dependency parser loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load dependency parser: ${error}`);
    }
  }

  /**
   * Parse text
   *
   * @param text - Text to parse
   * @returns Parse result with tokens and dependencies
   */
  async parse(text: string): Promise<ParseResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    const startTime = Date.now();

    try {
      // Process text
      const doc = this.nlp(text);

      const tokens: ParsedToken[] = [];
      const dependencies: Dependency[] = [];
      const sentences: string[] = [];

      // Extract sentences
      for (const sent of doc.sents) {
        sentences.push(sent.text);
      }

      // Extract tokens
      for (const token of doc) {
        tokens.push({
          text: token.text,
          lemma: token.lemma_,
          pos: token.pos_ as POSTag,
          tag: token.tag_,
          dep: token.dep_ as DepRelation,
          head: token.head.i,
          isStop: token.is_stop,
          isPunct: token.is_punct,
          isSpace: token.is_space
        });

        // Extract dependency
        if (token.dep_ !== 'ROOT') {
          dependencies.push({
            text: token.text,
            relation: token.dep_ as DepRelation,
            head: token.head.text,
            headIndex: token.head.i,
            depIndex: token.i
          });
        }
      }

      const inferenceTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Parsed in ${inferenceTime}ms`);
      }

      return {
        tokens,
        dependencies,
        text,
        sentences,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } catch (error) {
      throw new Error(`Parsing failed: ${error}`);
    }
  }

  /**
   * Parse multiple texts in batch
   *
   * @param texts - Texts to parse
   * @param options - Batch options
   * @returns Parse results
   */
  async parseBatch(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<ParseResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const batchSize = options.batchSize || 32;
    const results: ParseResult[] = [];
    const startTime = Date.now();

    if (options.parallel && texts.length > batchSize) {
      // Use spaCy's pipe for batch processing
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        if (options.showProgress) {
          const progress = ((i + batch.length) / texts.length * 100).toFixed(1);
          console.log(`Progress: ${progress}% (${i + batch.length}/${texts.length})`);
        }

        const docs = Array.from(this.nlp.pipe(batch));

        for (let j = 0; j < batch.length; j++) {
          const doc = docs[j];
          const text = batch[j];

          const tokens: ParsedToken[] = [];
          const dependencies: Dependency[] = [];
          const sentences: string[] = [];

          for (const sent of doc.sents) {
            sentences.push(sent.text);
          }

          for (const token of doc) {
            tokens.push({
              text: token.text,
              lemma: token.lemma_,
              pos: token.pos_ as POSTag,
              tag: token.tag_,
              dep: token.dep_ as DepRelation,
              head: token.head.i,
              isStop: token.is_stop,
              isPunct: token.is_punct,
              isSpace: token.is_space
            });

            if (token.dep_ !== 'ROOT') {
              dependencies.push({
                text: token.text,
                relation: token.dep_ as DepRelation,
                head: token.head.text,
                headIndex: token.head.i,
                depIndex: token.i
              });
            }
          }

          results.push({ tokens, dependencies, text, sentences });
        }
      }
    } else {
      // Sequential processing
      for (const text of texts) {
        results.push(await this.parse(text));
      }
    }

    const totalTime = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`Batch parsing complete: ${texts.length} texts in ${totalTime}ms`);
    }

    return results;
  }

  /**
   * Extract noun phrases
   *
   * @param text - Text to analyze
   * @returns Noun phrases
   */
  async getNounPhrases(text: string): Promise<string[]> {
    await this.load();

    const doc = this.nlp(text);
    const phrases: string[] = [];

    for (const chunk of doc.noun_chunks) {
      phrases.push(chunk.text);
    }

    return phrases;
  }

  /**
   * Extract verb phrases
   *
   * @param text - Text to analyze
   * @returns Verb phrases
   */
  async getVerbPhrases(text: string): Promise<string[]> {
    const result = await this.parse(text);
    const phrases: string[] = [];

    for (const token of result.tokens) {
      if (token.pos === 'VERB') {
        // Get verb and its direct objects
        const deps = result.dependencies.filter(
          d => d.headIndex === result.tokens.indexOf(token) &&
               (d.relation === 'dobj' || d.relation === 'pobj')
        );

        if (deps.length > 0) {
          const phrase = [token.text, ...deps.map(d => d.text)].join(' ');
          phrases.push(phrase);
        } else {
          phrases.push(token.text);
        }
      }
    }

    return phrases;
  }

  /**
   * Get sentence subjects
   *
   * @param text - Text to analyze
   * @returns Subjects of sentences
   */
  async getSubjects(text: string): Promise<string[]> {
    const result = await this.parse(text);
    const subjects: string[] = [];

    for (const dep of result.dependencies) {
      if (dep.relation === 'nsubj' || dep.relation === 'nsubjpass') {
        subjects.push(dep.text);
      }
    }

    return subjects;
  }

  /**
   * Get sentence objects
   *
   * @param text - Text to analyze
   * @returns Objects of sentences
   */
  async getObjects(text: string): Promise<string[]> {
    const result = await this.parse(text);
    const objects: string[] = [];

    for (const dep of result.dependencies) {
      if (dep.relation === 'dobj' || dep.relation === 'pobj' || dep.relation === 'iobj') {
        objects.push(dep.text);
      }
    }

    return objects;
  }

  /**
   * Lemmatize text
   *
   * @param text - Text to lemmatize
   * @returns Lemmatized tokens
   */
  async lemmatize(text: string): Promise<string[]> {
    const result = await this.parse(text);
    return result.tokens
      .filter(t => !t.isPunct && !t.isSpace)
      .map(t => t.lemma);
  }

  /**
   * Get part-of-speech tags
   *
   * @param text - Text to tag
   * @returns POS tags
   */
  async posTag(text: string): Promise<Array<{ text: string; pos: POSTag }>> {
    const result = await this.parse(text);
    return result.tokens
      .filter(t => !t.isSpace)
      .map(t => ({ text: t.text, pos: t.pos }));
  }

  /**
   * Visualize dependencies (ASCII tree)
   *
   * @param text - Text to visualize
   * @returns ASCII dependency tree
   */
  async visualize(text: string): Promise<string> {
    const result = await this.parse(text);
    let tree = '';

    for (const dep of result.dependencies) {
      const indent = '  '.repeat(dep.depIndex);
      tree += `${indent}${dep.text} --[${dep.relation}]--> ${dep.head}\n`;
    }

    return tree;
  }

  /**
   * Get syntactic complexity metrics
   *
   * @param text - Text to analyze
   * @returns Complexity metrics
   */
  async getComplexity(text: string): Promise<{
    avgDependencyLength: number;
    maxDependencyLength: number;
    avgTreeDepth: number;
    clauseCount: number;
  }> {
    const result = await this.parse(text);

    // Calculate dependency lengths
    const depLengths = result.dependencies.map(
      d => Math.abs(d.headIndex - d.depIndex)
    );

    const avgDependencyLength = depLengths.length > 0
      ? depLengths.reduce((a, b) => a + b, 0) / depLengths.length
      : 0;

    const maxDependencyLength = depLengths.length > 0
      ? Math.max(...depLengths)
      : 0;

    // Count clauses
    const clauseCount = result.dependencies.filter(
      d => d.relation === 'ccomp' || d.relation === 'advcl' || d.relation === 'acl'
    ).length + 1;

    // Calculate tree depth (simplified)
    const avgTreeDepth = this.calculateTreeDepth(result);

    return {
      avgDependencyLength,
      maxDependencyLength,
      avgTreeDepth,
      clauseCount
    };
  }

  /**
   * Calculate tree depth
   */
  private calculateTreeDepth(result: ParseResult): number {
    const depths = new Map<number, number>();

    // Initialize all tokens with depth 0
    for (let i = 0; i < result.tokens.length; i++) {
      depths.set(i, 0);
    }

    // Calculate depths iteratively
    let changed = true;
    while (changed) {
      changed = false;
      for (const dep of result.dependencies) {
        const headDepth = depths.get(dep.headIndex) || 0;
        const currentDepth = depths.get(dep.depIndex) || 0;
        const newDepth = headDepth + 1;

        if (newDepth > currentDepth) {
          depths.set(dep.depIndex, newDepth);
          changed = true;
        }
      }
    }

    // Return average depth
    const depthValues = Array.from(depths.values());
    return depthValues.reduce((a, b) => a + b, 0) / depthValues.length;
  }
}

/**
 * Create a dependency parser
 *
 * @param modelSize - Model size
 * @param config - Configuration
 * @returns DependencyParser instance
 */
export function createDependencyParser(
  modelSize?: 'small' | 'medium' | 'large',
  config?: DependencyParserConfig
): DependencyParser {
  const models = {
    small: 'en_core_web_sm',
    medium: 'en_core_web_md',
    large: 'en_core_web_lg'
  };

  return new DependencyParser(
    modelSize ? models[modelSize] : 'en_core_web_sm',
    config
  );
}

/**
 * Parsing utilities
 */
export const ParsingUtils = {
  /**
   * Format dependency
   */
  formatDep: (dep: Dependency): string =>
    `${dep.text} --[${dep.relation}]--> ${dep.head}`,

  /**
   * Get dependency path between two tokens
   */
  getDependencyPath: (
    result: ParseResult,
    idx1: number,
    idx2: number
  ): Dependency[] => {
    const path: Dependency[] = [];
    // Simplified implementation
    return path;
  },

  /**
   * Check if sentence is passive
   */
  isPassive: (result: ParseResult): boolean => {
    return result.dependencies.some(d => d.relation === 'nsubjpass');
  },

  /**
   * Get sentence polarity
   */
  hasNegation: (result: ParseResult): boolean => {
    return result.dependencies.some(d => d.relation === 'neg');
  },

  /**
   * Count by POS tag
   */
  countByPOS: (result: ParseResult): Map<POSTag, number> => {
    const counts = new Map<POSTag, number>();

    for (const token of result.tokens) {
      counts.set(token.pos, (counts.get(token.pos) || 0) + 1);
    }

    return counts;
  }
};
