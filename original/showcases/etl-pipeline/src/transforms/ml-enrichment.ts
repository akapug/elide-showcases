/**
 * ML-Based Data Enrichment
 *
 * Machine learning-powered data transformations:
 * - Text classification and categorization
 * - Sentiment analysis
 * - Named entity recognition (NER)
 * - Language detection
 * - Text embedding and similarity
 * - Anomaly detection
 * - Data imputation
 * - Feature engineering
 * - Predictive enrichment
 * - Auto-tagging and labeling
 */

// ==================== Types ====================

interface MLEnrichmentConfig {
  models?: {
    textClassification?: string;
    sentimentAnalysis?: string;
    ner?: string;
    languageDetection?: string;
    anomalyDetection?: string;
  };
  features?: {
    sentiment?: boolean;
    entities?: boolean;
    language?: boolean;
    categories?: boolean;
    embeddings?: boolean;
    anomalies?: boolean;
  };
  thresholds?: {
    sentimentConfidence?: number;
    categoryConfidence?: number;
    anomalyScore?: number;
  };
}

interface EnrichmentResult {
  original: any;
  enriched: any;
  metadata: {
    enrichments: string[];
    duration: number;
    confidence: number;
  };
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  aspects?: Array<{
    aspect: string;
    sentiment: string;
    score: number;
  }>;
}

interface EntityResult {
  entities: Array<{
    text: string;
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'PRODUCT' | 'EVENT' | 'OTHER';
    confidence: number;
    start: number;
    end: number;
  }>;
}

interface CategoryResult {
  categories: Array<{
    label: string;
    score: number;
  }>;
  primaryCategory: string;
}

interface LanguageResult {
  language: string;
  confidence: number;
  script?: string;
}

interface EmbeddingResult {
  embedding: number[];
  dimension: number;
  model: string;
}

interface AnomalyResult {
  isAnomaly: boolean;
  score: number;
  reason?: string;
  expectedRange?: { min: number; max: number };
}

interface ImputationStrategy {
  method: 'mean' | 'median' | 'mode' | 'knn' | 'regression' | 'forward_fill' | 'backward_fill';
  neighbors?: number;
  features?: string[];
}

// ==================== ML Enrichment Engine ====================

export class MLEnrichmentEngine {
  private config: MLEnrichmentConfig;
  private modelCache = new Map<string, any>();
  private statisticsCache = new Map<string, any>();

  constructor(config: MLEnrichmentConfig = {}) {
    this.config = {
      features: {
        sentiment: true,
        entities: true,
        language: true,
        categories: true,
        embeddings: false,
        anomalies: false,
        ...config.features
      },
      thresholds: {
        sentimentConfidence: 0.7,
        categoryConfidence: 0.5,
        anomalyScore: 0.8,
        ...config.thresholds
      },
      models: config.models || {}
    };
  }

  /**
   * Enrich a single record with ML features
   */
  async enrichRecord(record: Record<string, any>): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const enriched = { ...record };
    const enrichments: string[] = [];
    let totalConfidence = 0;
    let confidenceCount = 0;

    // Text sentiment analysis
    if (this.config.features!.sentiment && record.text) {
      const sentiment = await this.analyzeSentiment(record.text);
      enriched.sentiment = sentiment.sentiment;
      enriched.sentiment_score = sentiment.score;
      enriched.sentiment_confidence = sentiment.confidence;

      if (sentiment.aspects && sentiment.aspects.length > 0) {
        enriched.aspects = sentiment.aspects;
      }

      enrichments.push('sentiment');
      totalConfidence += sentiment.confidence;
      confidenceCount++;
    }

    // Named entity recognition
    if (this.config.features!.entities && record.text) {
      const entities = await this.extractEntities(record.text);
      enriched.entities = entities.entities;
      enriched.entity_count = entities.entities.length;

      // Extract specific entity types
      const people = entities.entities.filter(e => e.type === 'PERSON').map(e => e.text);
      const organizations = entities.entities.filter(e => e.type === 'ORGANIZATION').map(e => e.text);
      const locations = entities.entities.filter(e => e.type === 'LOCATION').map(e => e.text);

      if (people.length > 0) enriched.people = people;
      if (organizations.length > 0) enriched.organizations = organizations;
      if (locations.length > 0) enriched.locations = locations;

      enrichments.push('entities');
    }

    // Language detection
    if (this.config.features!.language && record.text) {
      const language = await this.detectLanguage(record.text);
      enriched.language = language.language;
      enriched.language_confidence = language.confidence;

      enrichments.push('language');
      totalConfidence += language.confidence;
      confidenceCount++;
    }

    // Text categorization
    if (this.config.features!.categories && record.text) {
      const categories = await this.categorizeText(record.text);
      enriched.category = categories.primaryCategory;
      enriched.categories = categories.categories;

      enrichments.push('categories');
      totalConfidence += categories.categories[0]?.score || 0;
      confidenceCount++;
    }

    // Generate embeddings
    if (this.config.features!.embeddings && record.text) {
      const embedding = await this.generateEmbedding(record.text);
      enriched.embedding = embedding.embedding;
      enriched.embedding_dimension = embedding.dimension;

      enrichments.push('embeddings');
    }

    // Anomaly detection
    if (this.config.features!.anomalies) {
      const anomaly = await this.detectAnomaly(record);
      enriched.is_anomaly = anomaly.isAnomaly;
      enriched.anomaly_score = anomaly.score;

      if (anomaly.reason) {
        enriched.anomaly_reason = anomaly.reason;
      }

      enrichments.push('anomalies');
    }

    const duration = Date.now() - startTime;
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 1.0;

    return {
      original: record,
      enriched,
      metadata: {
        enrichments,
        duration,
        confidence: avgConfidence
      }
    };
  }

  /**
   * Enrich batch of records
   */
  async enrichBatch(records: Record<string, any>[]): Promise<EnrichmentResult[]> {
    console.log(`Enriching batch of ${records.length} records...`);

    const results = await Promise.all(
      records.map(record => this.enrichRecord(record))
    );

    const avgDuration = results.reduce((sum, r) => sum + r.metadata.duration, 0) / results.length;
    console.log(`Batch enrichment complete (avg ${avgDuration.toFixed(2)}ms per record)`);

    return results;
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    // Simulated sentiment analysis
    await this.sleep(10);

    // Simple rule-based sentiment (in production, use ML model)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.5 + (positiveCount / (positiveCount + negativeCount)) * 0.5;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -0.5 - (negativeCount / (positiveCount + negativeCount)) * 0.5;
    } else {
      sentiment = 'neutral';
      score = 0;
    }

    return {
      sentiment,
      score,
      confidence: 0.75 + Math.random() * 0.2
    };
  }

  /**
   * Extract named entities from text
   */
  async extractEntities(text: string): Promise<EntityResult> {
    // Simulated NER
    await this.sleep(15);

    const entities: EntityResult['entities'] = [];

    // Simple pattern matching (in production, use ML model)
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'PERSON' as const },
      { regex: /\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd)\b/g, type: 'ORGANIZATION' as const },
      { regex: /\b(New York|London|Tokyo|Paris|Berlin)\b/g, type: 'LOCATION' as const }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: pattern.type,
          confidence: 0.8 + Math.random() * 0.15,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }

    return { entities };
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<LanguageResult> {
    // Simulated language detection
    await this.sleep(5);

    // Simple heuristic (in production, use ML model)
    const languages = [
      { code: 'en', patterns: ['the', 'and', 'is', 'in', 'to'] },
      { code: 'es', patterns: ['el', 'la', 'de', 'que', 'es'] },
      { code: 'fr', patterns: ['le', 'la', 'de', 'et', 'est'] },
      { code: 'de', patterns: ['der', 'die', 'das', 'und', 'ist'] }
    ];

    const lowerText = text.toLowerCase();
    let detectedLanguage = 'en';
    let maxScore = 0;

    for (const lang of languages) {
      const score = lang.patterns.filter(pattern => lowerText.includes(pattern)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang.code;
      }
    }

    return {
      language: detectedLanguage,
      confidence: 0.85 + Math.random() * 0.1
    };
  }

  /**
   * Categorize text into predefined categories
   */
  async categorizeText(text: string): Promise<CategoryResult> {
    // Simulated text classification
    await this.sleep(20);

    const categories = [
      'Technology',
      'Business',
      'Sports',
      'Entertainment',
      'Politics',
      'Science',
      'Health',
      'Education'
    ];

    // Assign random scores (in production, use ML model)
    const scored = categories.map(label => ({
      label,
      score: Math.random()
    })).sort((a, b) => b.score - a.score);

    return {
      categories: scored.slice(0, 3),
      primaryCategory: scored[0].label
    };
  }

  /**
   * Generate text embeddings
   */
  async generateEmbedding(text: string, dimension: number = 384): Promise<EmbeddingResult> {
    // Simulated embedding generation
    await this.sleep(30);

    // Generate random embedding (in production, use model like BERT, Sentence-BERT)
    const embedding = Array.from({ length: dimension }, () => Math.random() * 2 - 1);

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map(val => val / magnitude);

    return {
      embedding: normalized,
      dimension,
      model: 'sentence-bert-base'
    };
  }

  /**
   * Detect anomalies in record
   */
  async detectAnomaly(record: Record<string, any>): Promise<AnomalyResult> {
    // Simulated anomaly detection
    await this.sleep(25);

    // Statistical anomaly detection
    const numericFields = Object.entries(record)
      .filter(([_, value]) => typeof value === 'number');

    if (numericFields.length === 0) {
      return {
        isAnomaly: false,
        score: 0
      };
    }

    let anomalyScore = 0;
    const reasons: string[] = [];

    for (const [field, value] of numericFields) {
      const stats = this.getFieldStatistics(field);

      if (!stats) continue;

      // Z-score calculation
      const zScore = Math.abs((value as number - stats.mean) / stats.stdDev);

      if (zScore > 3) {
        anomalyScore = Math.max(anomalyScore, Math.min(zScore / 5, 1));
        reasons.push(`${field} is ${zScore.toFixed(2)} standard deviations from mean`);
      }
    }

    return {
      isAnomaly: anomalyScore > (this.config.thresholds!.anomalyScore || 0.8),
      score: anomalyScore,
      reason: reasons.join('; ')
    };
  }

  /**
   * Impute missing values using various strategies
   */
  async imputeMissingValues(
    records: Record<string, any>[],
    field: string,
    strategy: ImputationStrategy
  ): Promise<Record<string, any>[]> {
    console.log(`Imputing missing values for ${field} using ${strategy.method}...`);

    const result = [...records];

    switch (strategy.method) {
      case 'mean':
        const values = records.map(r => r[field]).filter(v => v !== null && v !== undefined);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;

        result.forEach(record => {
          if (record[field] === null || record[field] === undefined) {
            record[field] = mean;
          }
        });
        break;

      case 'median':
        const sortedValues = records
          .map(r => r[field])
          .filter(v => v !== null && v !== undefined)
          .sort((a, b) => a - b);

        const median = sortedValues[Math.floor(sortedValues.length / 2)];

        result.forEach(record => {
          if (record[field] === null || record[field] === undefined) {
            record[field] = median;
          }
        });
        break;

      case 'mode':
        const counts = new Map<any, number>();
        records.forEach(r => {
          if (r[field] !== null && r[field] !== undefined) {
            counts.set(r[field], (counts.get(r[field]) || 0) + 1);
          }
        });

        const mode = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        result.forEach(record => {
          if (record[field] === null || record[field] === undefined) {
            record[field] = mode;
          }
        });
        break;

      case 'forward_fill':
        let lastValue: any = null;
        result.forEach(record => {
          if (record[field] !== null && record[field] !== undefined) {
            lastValue = record[field];
          } else if (lastValue !== null) {
            record[field] = lastValue;
          }
        });
        break;

      case 'backward_fill':
        let nextValue: any = null;
        for (let i = result.length - 1; i >= 0; i--) {
          if (result[i][field] !== null && result[i][field] !== undefined) {
            nextValue = result[i][field];
          } else if (nextValue !== null) {
            result[i][field] = nextValue;
          }
        }
        break;

      case 'knn':
        // Simplified KNN imputation
        await this.knnImpute(result, field, strategy.neighbors || 5, strategy.features || []);
        break;
    }

    return result;
  }

  /**
   * KNN-based imputation
   */
  private async knnImpute(
    records: Record<string, any>[],
    targetField: string,
    k: number,
    features: string[]
  ): Promise<void> {
    const recordsWithValues = records.filter(
      r => r[targetField] !== null && r[targetField] !== undefined
    );

    for (let i = 0; i < records.length; i++) {
      if (records[i][targetField] !== null && records[i][targetField] !== undefined) {
        continue;
      }

      // Find k nearest neighbors
      const distances = recordsWithValues.map(neighbor => ({
        record: neighbor,
        distance: this.calculateDistance(records[i], neighbor, features)
      }));

      distances.sort((a, b) => a.distance - b.distance);

      const kNearest = distances.slice(0, k);
      const imputedValue = kNearest.reduce((sum, n) => sum + n.record[targetField], 0) / k;

      records[i][targetField] = imputedValue;
    }
  }

  /**
   * Calculate Euclidean distance between records
   */
  private calculateDistance(
    record1: Record<string, any>,
    record2: Record<string, any>,
    features: string[]
  ): number {
    let sumSquaredDiff = 0;

    for (const feature of features) {
      const val1 = record1[feature] || 0;
      const val2 = record2[feature] || 0;
      sumSquaredDiff += Math.pow(val1 - val2, 2);
    }

    return Math.sqrt(sumSquaredDiff);
  }

  /**
   * Generate derived features
   */
  async engineerFeatures(record: Record<string, any>): Promise<Record<string, any>> {
    const features = { ...record };

    // Time-based features
    if (record.timestamp) {
      const date = new Date(record.timestamp);
      features.hour = date.getHours();
      features.day_of_week = date.getDay();
      features.day_of_month = date.getDate();
      features.month = date.getMonth() + 1;
      features.year = date.getFullYear();
      features.is_weekend = date.getDay() === 0 || date.getDay() === 6;
      features.quarter = Math.floor(date.getMonth() / 3) + 1;
    }

    // Text features
    if (record.text) {
      features.text_length = record.text.length;
      features.word_count = record.text.split(/\s+/).length;
      features.avg_word_length = features.text_length / features.word_count;
      features.sentence_count = record.text.split(/[.!?]+/).length;
      features.has_question = record.text.includes('?');
      features.has_exclamation = record.text.includes('!');
      features.uppercase_ratio = (record.text.match(/[A-Z]/g) || []).length / features.text_length;
    }

    // Numeric features
    const numericFields = Object.entries(record)
      .filter(([_, value]) => typeof value === 'number');

    if (numericFields.length >= 2) {
      const values = numericFields.map(([_, v]) => v as number);
      features.numeric_mean = values.reduce((a, b) => a + b, 0) / values.length;
      features.numeric_std = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - features.numeric_mean, 2), 0) / values.length
      );
      features.numeric_min = Math.min(...values);
      features.numeric_max = Math.max(...values);
      features.numeric_range = features.numeric_max - features.numeric_min;
    }

    return features;
  }

  /**
   * Get or calculate field statistics
   */
  private getFieldStatistics(field: string): { mean: number; stdDev: number } | null {
    // Check cache
    if (this.statisticsCache.has(field)) {
      return this.statisticsCache.get(field);
    }

    // Simulated statistics (in production, calculate from historical data)
    const stats = {
      mean: 100 + Math.random() * 900,
      stdDev: 50 + Math.random() * 50
    };

    this.statisticsCache.set(field, stats);

    return stats;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Example Usage ====================

export async function demonstrateMLEnrichment() {
  console.log('=== ML Enrichment Demonstration ===\n');

  const engine = new MLEnrichmentEngine({
    features: {
      sentiment: true,
      entities: true,
      language: true,
      categories: true,
      embeddings: true,
      anomalies: true
    }
  });

  // Sample record
  const record = {
    id: 1,
    text: 'Apple Inc announced excellent quarterly earnings. CEO Tim Cook praised the team in New York.',
    value: 1000,
    timestamp: new Date().toISOString()
  };

  // Enrich single record
  const enriched = await engine.enrichRecord(record);

  console.log('Original record:');
  console.log(JSON.stringify(record, null, 2));

  console.log('\nEnriched record:');
  console.log(JSON.stringify(enriched.enriched, null, 2));

  console.log('\nEnrichment metadata:');
  console.log(`  Enrichments: ${enriched.metadata.enrichments.join(', ')}`);
  console.log(`  Duration: ${enriched.metadata.duration}ms`);
  console.log(`  Confidence: ${(enriched.metadata.confidence * 100).toFixed(2)}%`);

  // Feature engineering
  const engineered = await engine.engineerFeatures(record);

  console.log('\nEngineered features:');
  console.log(JSON.stringify(engineered, null, 2));

  console.log('\n=== ML Enrichment Demo Complete ===');
}

if (import.meta.main) {
  await demonstrateMLEnrichment();
}
