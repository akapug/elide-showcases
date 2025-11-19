/**
 * Named Entity Recognition module using spaCy via Elide polyglot
 * Demonstrates industrial-strength NER with Python's spaCy library
 */

// @ts-ignore - Elide polyglot import
import spacy from 'python:spacy';

import {
  Entity,
  EntityType,
  EntityRecognitionResult,
  EntityRecognizerConfig,
  LinkedEntity,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Entity Recognizer using spaCy
 *
 * This class demonstrates Elide's polyglot capabilities by using
 * Python's spaCy library directly in TypeScript for NER.
 *
 * @example
 * ```typescript
 * const recognizer = new EntityRecognizer('en_core_web_lg');
 * const result = await recognizer.recognize(
 *   "Apple Inc. CEO Tim Cook announced the new iPhone in San Francisco."
 * );
 * console.log(result.entities);
 * ```
 */
export class EntityRecognizer {
  private nlp: any;
  private config: EntityRecognizerConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new EntityRecognizer instance
   *
   * @param modelName - spaCy model to use
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'en_core_web_sm',
    config: EntityRecognizerConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      minConfidence: 0.5,
      disableNer: false,
      ...config
    };
  }

  /**
   * Load the spaCy model
   *
   * Direct Python spaCy model loading - the power of polyglot!
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Direct Python spaCy call
      this.nlp = spacy.load(this.modelName);

      // Disable components we don't need for performance
      if (this.config.disableNer) {
        this.nlp.disable_pipes(['ner']);
      }

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Entity recognizer loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(
        `Failed to load spaCy model '${this.modelName}'. ` +
        `Make sure it's installed: python -m spacy download ${this.modelName}`
      );
    }
  }

  /**
   * Recognize entities in text
   *
   * @param text - Text to analyze
   * @returns Entity recognition result
   */
  async recognize(text: string): Promise<EntityRecognitionResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    const startTime = Date.now();

    try {
      // Process text with spaCy
      const doc = this.nlp(text);

      const entities: Entity[] = [];

      // Extract entities from spaCy doc
      for (const ent of doc.ents) {
        const label = ent.label_ as EntityType;

        // Filter by entity type if specified
        if (this.config.entityTypes && !this.config.entityTypes.includes(label)) {
          continue;
        }

        // Estimate confidence (spaCy doesn't provide confidence by default)
        const confidence = this.estimateConfidence(ent);

        // Filter by confidence
        if (confidence < (this.config.minConfidence || 0)) {
          continue;
        }

        entities.push({
          text: ent.text,
          label,
          start: ent.start_char,
          end: ent.end_char,
          confidence,
          metadata: {
            lemma: ent.lemma_,
            kb_id: ent.kb_id_
          }
        });
      }

      const inferenceTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Recognized ${entities.length} entities in ${inferenceTime}ms`);
      }

      return {
        entities,
        text,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: 1000 / inferenceTime
        }
      };
    } catch (error) {
      throw new Error(`Entity recognition failed: ${error}`);
    }
  }

  /**
   * Recognize entities in multiple texts
   *
   * @param texts - Array of texts to analyze
   * @param options - Batch processing options
   * @returns Array of entity recognition results
   */
  async recognizeBatch(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<EntityRecognitionResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const batchSize = options.batchSize || 32;
    const results: EntityRecognitionResult[] = [];
    const startTime = Date.now();

    // Use spaCy's pipe for efficient batch processing
    if (options.parallel && texts.length > batchSize) {
      // Process in batches
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        if (options.showProgress) {
          const progress = ((i + batch.length) / texts.length * 100).toFixed(1);
          console.log(`Progress: ${progress}% (${i + batch.length}/${texts.length})`);
        }

        // Use spaCy's pipe for batch processing
        const docs = Array.from(this.nlp.pipe(batch));

        for (let j = 0; j < batch.length; j++) {
          const doc = docs[j];
          const text = batch[j];

          const entities: Entity[] = [];
          for (const ent of doc.ents) {
            const label = ent.label_ as EntityType;

            if (this.config.entityTypes && !this.config.entityTypes.includes(label)) {
              continue;
            }

            const confidence = this.estimateConfidence(ent);
            if (confidence < (this.config.minConfidence || 0)) {
              continue;
            }

            entities.push({
              text: ent.text,
              label,
              start: ent.start_char,
              end: ent.end_char,
              confidence
            });
          }

          results.push({ entities, text });
        }
      }
    } else {
      // Sequential processing
      for (const text of texts) {
        results.push(await this.recognize(text));
      }
    }

    const totalTime = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`Batch recognition complete: ${texts.length} texts in ${totalTime}ms`);
      console.log(`Throughput: ${(texts.length / totalTime * 1000).toFixed(2)} texts/sec`);
    }

    return results;
  }

  /**
   * Get entities of specific type
   *
   * @param text - Text to analyze
   * @param entityType - Type of entity to extract
   * @returns Entities of specified type
   */
  async getEntitiesOfType(
    text: string,
    entityType: EntityType
  ): Promise<Entity[]> {
    const result = await this.recognize(text);
    return result.entities.filter(e => e.label === entityType);
  }

  /**
   * Extract all person names
   *
   * @param text - Text to analyze
   * @returns Person entities
   */
  async extractPeople(text: string): Promise<Entity[]> {
    return this.getEntitiesOfType(text, 'PERSON');
  }

  /**
   * Extract all organization names
   *
   * @param text - Text to analyze
   * @returns Organization entities
   */
  async extractOrganizations(text: string): Promise<Entity[]> {
    return this.getEntitiesOfType(text, 'ORG');
  }

  /**
   * Extract all locations
   *
   * @param text - Text to analyze
   * @returns Location entities (GPE and LOC)
   */
  async extractLocations(text: string): Promise<Entity[]> {
    const result = await this.recognize(text);
    return result.entities.filter(e =>
      e.label === 'GPE' || e.label === 'LOC'
    );
  }

  /**
   * Extract dates and times
   *
   * @param text - Text to analyze
   * @returns Date and time entities
   */
  async extractDates(text: string): Promise<Entity[]> {
    const result = await this.recognize(text);
    return result.entities.filter(e =>
      e.label === 'DATE' || e.label === 'TIME'
    );
  }

  /**
   * Extract monetary values
   *
   * @param text - Text to analyze
   * @returns Money entities
   */
  async extractMoney(text: string): Promise<Entity[]> {
    return this.getEntitiesOfType(text, 'MONEY');
  }

  /**
   * Group entities by type
   *
   * @param text - Text to analyze
   * @returns Entities grouped by type
   */
  async groupByType(text: string): Promise<Map<EntityType, Entity[]>> {
    const result = await this.recognize(text);
    const groups = new Map<EntityType, Entity[]>();

    for (const entity of result.entities) {
      if (!groups.has(entity.label)) {
        groups.set(entity.label, []);
      }
      groups.get(entity.label)!.push(entity);
    }

    return groups;
  }

  /**
   * Get entity spans with context
   *
   * @param text - Text to analyze
   * @param contextSize - Number of characters to include as context
   * @returns Entities with surrounding context
   */
  async getEntitiesWithContext(
    text: string,
    contextSize: number = 50
  ): Promise<Array<Entity & { context: string }>> {
    const result = await this.recognize(text);

    return result.entities.map(entity => {
      const start = Math.max(0, entity.start - contextSize);
      const end = Math.min(text.length, entity.end + contextSize);
      const context = text.substring(start, end);

      return {
        ...entity,
        context
      };
    });
  }

  /**
   * Merge overlapping entities
   *
   * @param entities - Entities to merge
   * @returns Merged entities
   */
  mergeOverlapping(entities: Entity[]): Entity[] {
    if (entities.length === 0) return [];

    // Sort by start position
    const sorted = [...entities].sort((a, b) => a.start - b.start);
    const merged: Entity[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // Check for overlap
      if (current.start <= last.end) {
        // Merge entities
        last.end = Math.max(last.end, current.end);
        last.text = `${last.text} ${current.text}`;
        last.confidence = Math.max(last.confidence, current.confidence);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Filter entities by confidence threshold
   *
   * @param entities - Entities to filter
   * @param threshold - Minimum confidence
   * @returns Filtered entities
   */
  filterByConfidence(entities: Entity[], threshold: number): Entity[] {
    return entities.filter(e => e.confidence >= threshold);
  }

  /**
   * Get most common entities
   *
   * @param text - Text to analyze
   * @param topN - Number of top entities to return
   * @returns Most frequent entities
   */
  async getMostCommon(
    text: string,
    topN: number = 10
  ): Promise<Array<{ entity: string; count: number; label: EntityType }>> {
    const result = await this.recognize(text);
    const counts = new Map<string, { count: number; label: EntityType }>();

    for (const entity of result.entities) {
      const key = entity.text.toLowerCase();
      if (!counts.has(key)) {
        counts.set(key, { count: 0, label: entity.label });
      }
      counts.get(key)!.count++;
    }

    return Array.from(counts.entries())
      .map(([entity, data]) => ({ entity, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }

  /**
   * Highlight entities in text
   *
   * @param text - Text to process
   * @param format - Format function for highlighting
   * @returns Text with highlighted entities
   */
  async highlight(
    text: string,
    format: (entity: Entity) => string = (e) => `**${e.text}**`
  ): Promise<string> {
    const result = await this.recognize(text);

    // Sort entities by start position (descending) to avoid offset issues
    const sorted = [...result.entities].sort((a, b) => b.start - a.start);

    let highlighted = text;
    for (const entity of sorted) {
      const formatted = format(entity);
      highlighted =
        highlighted.substring(0, entity.start) +
        formatted +
        highlighted.substring(entity.end);
    }

    return highlighted;
  }

  /**
   * Extract relationships between entities
   *
   * @param text - Text to analyze
   * @returns Entity relationships
   */
  async extractRelationships(
    text: string
  ): Promise<Array<{
    subject: Entity;
    predicate: string;
    object: Entity;
  }>> {
    await this.load();

    const doc = this.nlp(text);
    const relationships: Array<{
      subject: Entity;
      predicate: string;
      object: Entity;
    }> = [];

    // Extract dependency-based relationships
    for (const token of doc) {
      if (token.dep_ === 'nsubj') {
        const verb = token.head;
        for (const child of verb.children) {
          if (child.dep_ === 'dobj' || child.dep_ === 'pobj') {
            const subjectEnt = this.findEntity(doc.ents, token);
            const objectEnt = this.findEntity(doc.ents, child);

            if (subjectEnt && objectEnt) {
              relationships.push({
                subject: this.convertEntity(subjectEnt),
                predicate: verb.text,
                object: this.convertEntity(objectEnt)
              });
            }
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Get noun phrases (non-entity)
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
   * Estimate entity confidence
   * (spaCy doesn't provide confidence by default)
   */
  private estimateConfidence(ent: any): number {
    // Use entity length and type as heuristics
    const length = ent.text.length;
    const label = ent.label_;

    // Base confidence
    let confidence = 0.7;

    // Longer entities tend to be more reliable
    if (length > 10) confidence += 0.1;
    if (length > 20) confidence += 0.1;

    // Some entity types are more reliable
    if (['PERSON', 'ORG', 'GPE'].includes(label)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.99);
  }

  /**
   * Find entity containing token
   */
  private findEntity(entities: any, token: any): any {
    for (const ent of entities) {
      if (token.i >= ent.start && token.i < ent.end) {
        return ent;
      }
    }
    return null;
  }

  /**
   * Convert spaCy entity to our Entity type
   */
  private convertEntity(ent: any): Entity {
    return {
      text: ent.text,
      label: ent.label_ as EntityType,
      start: ent.start_char,
      end: ent.end_char,
      confidence: this.estimateConfidence(ent)
    };
  }
}

/**
 * Large model entity recognizer
 * More accurate but slower
 */
export class LargeEntityRecognizer extends EntityRecognizer {
  constructor(config: EntityRecognizerConfig = {}) {
    super('en_core_web_lg', config);
  }
}

/**
 * Transformer-based entity recognizer
 * State-of-the-art accuracy
 */
export class TransformerEntityRecognizer extends EntityRecognizer {
  constructor(config: EntityRecognizerConfig = {}) {
    super('en_core_web_trf', config);
  }
}

/**
 * Multi-lingual entity recognizer
 */
export class MultilingualEntityRecognizer {
  private recognizers: Map<string, EntityRecognizer> = new Map();

  /**
   * Get recognizer for language
   */
  private getRecognizer(language: string): EntityRecognizer {
    if (!this.recognizers.has(language)) {
      const modelMap: Record<string, string> = {
        en: 'en_core_web_sm',
        es: 'es_core_news_sm',
        fr: 'fr_core_news_sm',
        de: 'de_core_news_sm',
        it: 'it_core_news_sm',
        pt: 'pt_core_news_sm',
        nl: 'nl_core_news_sm',
        el: 'el_core_news_sm',
        nb: 'nb_core_news_sm',
        lt: 'lt_core_news_sm',
        zh: 'zh_core_web_sm',
        ja: 'ja_core_news_sm'
      };

      const modelName = modelMap[language] || 'xx_ent_wiki_sm';
      this.recognizers.set(language, new EntityRecognizer(modelName));
    }

    return this.recognizers.get(language)!;
  }

  /**
   * Recognize entities with language
   */
  async recognize(
    text: string,
    language: string = 'en'
  ): Promise<EntityRecognitionResult> {
    const recognizer = this.getRecognizer(language);
    return recognizer.recognize(text);
  }
}

/**
 * Create an entity recognizer
 *
 * @param modelType - Model type or name
 * @param config - Configuration
 * @returns EntityRecognizer instance
 */
export function createEntityRecognizer(
  modelType?: 'small' | 'medium' | 'large' | 'transformer' | string,
  config?: EntityRecognizerConfig
): EntityRecognizer {
  switch (modelType) {
    case 'small':
      return new EntityRecognizer('en_core_web_sm', config);
    case 'medium':
      return new EntityRecognizer('en_core_web_md', config);
    case 'large':
      return new LargeEntityRecognizer(config);
    case 'transformer':
      return new TransformerEntityRecognizer(config);
    default:
      return new EntityRecognizer(modelType, config);
  }
}

/**
 * Entity recognition utilities
 */
export const EntityUtils = {
  /**
   * Format entity for display
   */
  format: (entity: Entity): string =>
    `${entity.text} [${entity.label}] (${(entity.confidence * 100).toFixed(1)}%)`,

  /**
   * Get unique entity texts
   */
  getUnique: (entities: Entity[]): string[] =>
    [...new Set(entities.map(e => e.text))],

  /**
   * Count entities by type
   */
  countByType: (entities: Entity[]): Map<EntityType, number> => {
    const counts = new Map<EntityType, number>();
    for (const entity of entities) {
      counts.set(entity.label, (counts.get(entity.label) || 0) + 1);
    }
    return counts;
  },

  /**
   * Convert entities to JSON
   */
  toJSON: (result: EntityRecognitionResult): string =>
    JSON.stringify(result, null, 2)
};
