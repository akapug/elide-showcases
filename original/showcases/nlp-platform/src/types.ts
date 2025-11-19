/**
 * Type definitions for Elide NLP Platform
 * Demonstrates type-safe integration with Python NLP libraries
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base configuration for all NLP components
 */
export interface BaseNLPConfig {
  /** Model name or path */
  model?: string;
  /** Device to run on ('cpu', 'cuda', 'mps') */
  device?: 'cpu' | 'cuda' | 'mps';
  /** Enable caching of models */
  cache?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Performance metrics for NLP operations
 */
export interface PerformanceMetrics {
  /** Total time taken in milliseconds */
  totalTime: number;
  /** Time for model loading */
  loadTime?: number;
  /** Time for inference */
  inferenceTime: number;
  /** Time for preprocessing */
  preprocessTime?: number;
  /** Time for postprocessing */
  postprocessTime?: number;
  /** Throughput (items per second) */
  throughput?: number;
  /** Memory used in MB */
  memoryUsed?: number;
}

/**
 * Batch processing options
 */
export interface BatchOptions {
  /** Batch size for processing */
  batchSize?: number;
  /** Show progress bar */
  showProgress?: boolean;
  /** Parallel processing */
  parallel?: boolean;
  /** Maximum number of workers for parallel processing */
  maxWorkers?: number;
}

// ============================================================================
// Tokenization Types
// ============================================================================

/**
 * Tokenization result
 */
export interface TokenizationResult {
  /** Tokenized text */
  tokens: string[];
  /** Input IDs for model */
  inputIds: number[];
  /** Attention mask */
  attentionMask: number[];
  /** Token type IDs (for models like BERT) */
  tokenTypeIds?: number[];
  /** Special tokens mask */
  specialTokensMask?: number[];
  /** Offset mapping (start, end) for each token */
  offsetMapping?: Array<[number, number]>;
  /** Original text */
  text: string;
}

/**
 * Tokenizer configuration
 */
export interface TokenizerConfig extends BaseNLPConfig {
  /** Maximum sequence length */
  maxLength?: number;
  /** Padding strategy */
  padding?: 'max_length' | 'longest' | 'do_not_pad';
  /** Truncation strategy */
  truncation?: boolean;
  /** Return tensors format */
  returnTensors?: 'pt' | 'tf' | 'np';
  /** Add special tokens */
  addSpecialTokens?: boolean;
  /** Return attention mask */
  returnAttentionMask?: boolean;
  /** Return token type IDs */
  returnTokenTypeIds?: boolean;
  /** Return offsets mapping */
  returnOffsets?: boolean;
}

/**
 * Supported tokenizer types
 */
export type TokenizerType =
  | 'bert-base-uncased'
  | 'bert-base-cased'
  | 'bert-large-uncased'
  | 'bert-large-cased'
  | 'gpt2'
  | 'gpt2-medium'
  | 'gpt2-large'
  | 'gpt2-xl'
  | 'roberta-base'
  | 'roberta-large'
  | 'distilbert-base-uncased'
  | 'distilbert-base-cased'
  | 'albert-base-v2'
  | 'albert-large-v2'
  | 't5-small'
  | 't5-base'
  | 't5-large'
  | 'xlnet-base-cased'
  | 'xlnet-large-cased';

// ============================================================================
// Sentiment Analysis Types
// ============================================================================

/**
 * Sentiment label
 */
export type SentimentLabel = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';

/**
 * Confidence level
 */
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

/**
 * Sentiment analysis result
 */
export interface SentimentResult {
  /** Predicted sentiment label */
  label: SentimentLabel;
  /** Confidence score (0-1) */
  score: number;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** All class scores */
  allScores?: Record<SentimentLabel, number>;
  /** Original text */
  text: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Sentiment analyzer configuration
 */
export interface SentimentAnalyzerConfig extends BaseNLPConfig {
  /** Return all scores */
  returnAllScores?: boolean;
  /** Batch size */
  batchSize?: number;
  /** Multi-label classification */
  multiLabel?: boolean;
}

/**
 * Aspect-based sentiment analysis
 */
export interface AspectSentiment {
  /** Aspect/feature being discussed */
  aspect: string;
  /** Sentiment toward this aspect */
  sentiment: SentimentLabel;
  /** Confidence score */
  score: number;
  /** Text snippet mentioning this aspect */
  snippet: string;
}

// ============================================================================
// Named Entity Recognition Types
// ============================================================================

/**
 * Entity type
 */
export type EntityType =
  | 'PERSON'
  | 'NORP'
  | 'FAC'
  | 'ORG'
  | 'GPE'
  | 'LOC'
  | 'PRODUCT'
  | 'EVENT'
  | 'WORK_OF_ART'
  | 'LAW'
  | 'LANGUAGE'
  | 'DATE'
  | 'TIME'
  | 'PERCENT'
  | 'MONEY'
  | 'QUANTITY'
  | 'ORDINAL'
  | 'CARDINAL'
  | 'MISC';

/**
 * Named entity
 */
export interface Entity {
  /** Entity text */
  text: string;
  /** Entity type/label */
  label: EntityType;
  /** Start character position */
  start: number;
  /** End character position */
  end: number;
  /** Confidence score */
  confidence: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Entity recognition result
 */
export interface EntityRecognitionResult {
  /** Extracted entities */
  entities: Entity[];
  /** Original text */
  text: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Entity recognizer configuration
 */
export interface EntityRecognizerConfig extends BaseNLPConfig {
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Filter by entity types */
  entityTypes?: EntityType[];
  /** Disable NER */
  disableNer?: boolean;
}

/**
 * Entity linking result
 */
export interface LinkedEntity extends Entity {
  /** Knowledge base ID */
  kbId: string;
  /** Knowledge base name */
  kbName: string;
  /** Wikipedia URL */
  url?: string;
  /** Description */
  description?: string;
}

// ============================================================================
// Text Generation Types
// ============================================================================

/**
 * Generation strategy
 */
export type GenerationStrategy = 'greedy' | 'beam_search' | 'sampling' | 'top_k' | 'top_p' | 'contrastive';

/**
 * Text generation options
 */
export interface GenerationOptions {
  /** Maximum length of generated text */
  maxLength?: number;
  /** Minimum length of generated text */
  minLength?: number;
  /** Temperature for sampling (higher = more random) */
  temperature?: number;
  /** Top-k sampling */
  topK?: number;
  /** Top-p (nucleus) sampling */
  topP?: number;
  /** Number of beams for beam search */
  numBeams?: number;
  /** Number of sequences to return */
  numReturnSequences?: number;
  /** Repetition penalty */
  repetitionPenalty?: number;
  /** Length penalty */
  lengthPenalty?: number;
  /** Early stopping */
  earlyStopping?: boolean;
  /** Do sample */
  doSample?: boolean;
  /** No repeat n-gram size */
  noRepeatNgramSize?: number;
}

/**
 * Generated sequence
 */
export interface GeneratedSequence {
  /** Generated text */
  text: string;
  /** Score/probability */
  score: number;
  /** Token IDs */
  tokenIds?: number[];
}

/**
 * Text generation result
 */
export interface GenerationResult {
  /** Generated sequences */
  sequences: GeneratedSequence[];
  /** Original prompt */
  prompt: string;
  /** Generation options used */
  options: GenerationOptions;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Text generator configuration
 */
export interface TextGeneratorConfig extends BaseNLPConfig {
  /** Default generation options */
  defaultOptions?: GenerationOptions;
  /** Pad token */
  padToken?: string;
  /** EOS token */
  eosToken?: string;
}

// ============================================================================
// Translation Types
// ============================================================================

/**
 * Language code (ISO 639-1)
 */
export type LanguageCode =
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko'
  | 'ar' | 'hi' | 'nl' | 'pl' | 'tr' | 'vi' | 'th' | 'id' | 'he' | 'sv'
  | 'no' | 'da' | 'fi' | 'el' | 'cs' | 'ro' | 'hu' | 'uk' | 'bg' | 'hr';

/**
 * Translation result
 */
export interface TranslationResult {
  /** Translated text */
  translatedText: string;
  /** Source language */
  sourceLanguage: LanguageCode;
  /** Target language */
  targetLanguage: LanguageCode;
  /** Confidence score */
  confidence: number;
  /** Original text */
  originalText: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Translator configuration
 */
export interface TranslatorConfig extends BaseNLPConfig {
  /** Source language */
  sourceLanguage: LanguageCode;
  /** Target language */
  targetLanguage: LanguageCode;
  /** Maximum length */
  maxLength?: number;
  /** Beam size */
  numBeams?: number;
}

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  /** Detected language */
  language: LanguageCode;
  /** Confidence score */
  confidence: number;
  /** Alternative languages */
  alternatives?: Array<{ language: LanguageCode; confidence: number }>;
}

/**
 * Back translation result (for validation)
 */
export interface BackTranslationResult {
  /** Forward translation */
  forward: string;
  /** Back translation */
  backward: string;
  /** Similarity score */
  similarity: number;
  /** Original text */
  original: string;
}

// ============================================================================
// Classification Types
// ============================================================================

/**
 * Classification result
 */
export interface ClassificationResult {
  /** Predicted category */
  category: string;
  /** Confidence score */
  confidence: number;
  /** All category scores */
  allScores: Record<string, number>;
  /** Original text */
  text: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Multi-label classification result
 */
export interface MultiLabelClassificationResult {
  /** Predicted labels */
  labels: string[];
  /** Scores for each label */
  scores: Record<string, number>;
  /** Threshold used */
  threshold: number;
  /** Original text */
  text: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Text classifier configuration
 */
export interface TextClassifierConfig extends BaseNLPConfig {
  /** Category labels */
  labels: string[];
  /** Multi-label classification */
  multiLabel?: boolean;
  /** Threshold for multi-label */
  threshold?: number;
  /** Zero-shot classification */
  zeroShot?: boolean;
  /** Hypothesis template for zero-shot */
  hypothesisTemplate?: string;
}

/**
 * Hierarchical classification result
 */
export interface HierarchicalClassificationResult {
  /** Category path */
  path: string[];
  /** Confidence at each level */
  confidences: number[];
  /** All scores at leaf level */
  allScores: Record<string, number>;
  /** Original text */
  text: string;
}

// ============================================================================
// Embedding Types
// ============================================================================

/**
 * Text embedding (vector representation)
 */
export type Embedding = number[];

/**
 * Embedding result
 */
export interface EmbeddingResult {
  /** Embedding vector */
  embedding: Embedding;
  /** Dimensionality */
  dimension: number;
  /** Original text */
  text: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  /** Embeddings for each text */
  embeddings: Embedding[];
  /** Dimensionality */
  dimension: number;
  /** Original texts */
  texts: string[];
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Embedder configuration
 */
export interface EmbedderConfig extends BaseNLPConfig {
  /** Normalize embeddings */
  normalize?: boolean;
  /** Pooling strategy */
  pooling?: 'mean' | 'max' | 'cls';
  /** Convert to numpy */
  convertToNumpy?: boolean;
}

/**
 * Similarity result
 */
export interface SimilarityResult {
  /** Similarity score */
  score: number;
  /** Similarity metric used */
  metric: 'cosine' | 'euclidean' | 'manhattan' | 'dot';
  /** Text 1 */
  text1: string;
  /** Text 2 */
  text2: string;
}

/**
 * Clustering result
 */
export interface ClusteringResult {
  /** Cluster assignments */
  clusters: number[];
  /** Number of clusters */
  numClusters: number;
  /** Cluster centroids */
  centroids: Embedding[];
  /** Silhouette score */
  silhouetteScore?: number;
}

// ============================================================================
// Parsing Types
// ============================================================================

/**
 * Part-of-speech tag
 */
export type POSTag =
  | 'ADJ' | 'ADP' | 'ADV' | 'AUX' | 'CONJ' | 'CCONJ' | 'DET' | 'INTJ'
  | 'NOUN' | 'NUM' | 'PART' | 'PRON' | 'PROPN' | 'PUNCT' | 'SCONJ'
  | 'SYM' | 'VERB' | 'X' | 'SPACE';

/**
 * Dependency relation
 */
export type DepRelation =
  | 'ROOT' | 'nsubj' | 'dobj' | 'iobj' | 'amod' | 'advmod' | 'prep'
  | 'pobj' | 'det' | 'aux' | 'neg' | 'cc' | 'conj' | 'mark' | 'punct'
  | 'nmod' | 'appos' | 'nummod' | 'compound' | 'case' | 'acl' | 'advcl';

/**
 * Token with linguistic features
 */
export interface ParsedToken {
  /** Token text */
  text: string;
  /** Lemma (base form) */
  lemma: string;
  /** Part-of-speech tag */
  pos: POSTag;
  /** Fine-grained POS tag */
  tag: string;
  /** Dependency relation */
  dep: DepRelation;
  /** Head token index */
  head: number;
  /** Is this a stop word */
  isStop: boolean;
  /** Is this punctuation */
  isPunct: boolean;
  /** Is this a space */
  isSpace: boolean;
}

/**
 * Dependency edge
 */
export interface Dependency {
  /** Dependent token */
  text: string;
  /** Dependency relation */
  relation: DepRelation;
  /** Head token */
  head: string;
  /** Head token index */
  headIndex: number;
  /** Dependent token index */
  depIndex: number;
}

/**
 * Parse result
 */
export interface ParseResult {
  /** Parsed tokens */
  tokens: ParsedToken[];
  /** Dependency edges */
  dependencies: Dependency[];
  /** Original text */
  text: string;
  /** Sentences */
  sentences: string[];
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Dependency parser configuration
 */
export interface DependencyParserConfig extends BaseNLPConfig {
  /** Disable parser */
  disableParser?: boolean;
  /** Disable tagger */
  disableTagger?: boolean;
  /** Disable lemmatizer */
  disableLemmatizer?: boolean;
}

/**
 * Constituency tree node
 */
export interface ConstituencyNode {
  /** Node label */
  label: string;
  /** Children nodes */
  children: ConstituencyNode[];
  /** Leaf text (if terminal) */
  text?: string;
}

// ============================================================================
// Summarization Types
// ============================================================================

/**
 * Summarization strategy
 */
export type SummarizationStrategy = 'abstractive' | 'extractive' | 'hybrid';

/**
 * Summarization options
 */
export interface SummarizationOptions {
  /** Maximum summary length */
  maxLength?: number;
  /** Minimum summary length */
  minLength?: number;
  /** Summarization strategy */
  strategy?: SummarizationStrategy;
  /** Number of beams */
  numBeams?: number;
  /** Length penalty */
  lengthPenalty?: number;
  /** Early stopping */
  earlyStopping?: boolean;
  /** Number of sentences (for extractive) */
  numSentences?: number;
}

/**
 * Summarization result
 */
export interface SummarizationResult {
  /** Summary text */
  summary: string;
  /** Original text */
  originalText: string;
  /** Compression ratio */
  compressionRatio: number;
  /** Strategy used */
  strategy: SummarizationStrategy;
  /** Key sentences (for extractive/hybrid) */
  keySentences?: string[];
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Summarizer configuration
 */
export interface SummarizerConfig extends BaseNLPConfig {
  /** Default options */
  defaultOptions?: SummarizationOptions;
  /** Model type */
  modelType?: 'bart' | 't5' | 'pegasus' | 'led';
}

/**
 * Extractive summary with scores
 */
export interface ExtractiveResult {
  /** Selected sentences */
  sentences: Array<{
    text: string;
    score: number;
    position: number;
  }>;
  /** Summary text */
  summary: string;
}

// ============================================================================
// Question Answering Types
// ============================================================================

/**
 * Question answering result
 */
export interface QAResult {
  /** Answer text */
  answer: string;
  /** Confidence score */
  confidence: number;
  /** Start position in context */
  startIndex: number;
  /** End position in context */
  endIndex: number;
  /** Original question */
  question: string;
  /** Context used */
  context: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
}

/**
 * Question answerer configuration
 */
export interface QuestionAnswererConfig extends BaseNLPConfig {
  /** Top k answers to consider */
  topK?: number;
  /** Handle impossible questions */
  handleImpossible?: boolean;
  /** Maximum answer length */
  maxAnswerLength?: number;
  /** Minimum score threshold */
  minScore?: number;
}

/**
 * Multi-passage QA result
 */
export interface MultiPassageQAResult {
  /** Best answer */
  bestAnswer: QAResult;
  /** Answers from each passage */
  passageAnswers: QAResult[];
  /** Aggregated confidence */
  aggregatedConfidence: number;
}

/**
 * Open-domain QA result
 */
export interface OpenDomainQAResult {
  /** Answer */
  answer: string;
  /** Confidence */
  confidence: number;
  /** Retrieved documents */
  sources: Array<{
    text: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

// ============================================================================
// Pipeline Types
// ============================================================================

/**
 * Pipeline component
 */
export interface PipelineComponent {
  /** Component name */
  name: string;
  /** Component instance */
  component: any;
  /** Configuration */
  config?: Record<string, any>;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Components in order */
  components: PipelineComponent[];
  /** Enable parallel execution where possible */
  parallel?: boolean;
  /** Cache intermediate results */
  cache?: boolean;
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  /** Results from each component */
  results: Map<string, any>;
  /** Final output */
  output: any;
  /** Total performance metrics */
  metrics?: PerformanceMetrics;
}

// ============================================================================
// Model Management Types
// ============================================================================

/**
 * Model information
 */
export interface ModelInfo {
  /** Model name */
  name: string;
  /** Model type */
  type: string;
  /** Size in MB */
  size: number;
  /** Is cached */
  cached: boolean;
  /** Cache path */
  cachePath?: string;
  /** Last used timestamp */
  lastUsed?: Date;
}

/**
 * Model download progress
 */
export interface DownloadProgress {
  /** Model name */
  model: string;
  /** Bytes downloaded */
  downloaded: number;
  /** Total bytes */
  total: number;
  /** Percentage */
  percentage: number;
  /** Download speed (MB/s) */
  speed: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * NLP error
 */
export class NLPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NLPError';
  }
}

/**
 * Model not found error
 */
export class ModelNotFoundError extends NLPError {
  constructor(modelName: string) {
    super(
      `Model not found: ${modelName}`,
      'MODEL_NOT_FOUND',
      { modelName }
    );
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Invalid input error
 */
export class InvalidInputError extends NLPError {
  constructor(message: string, input?: any) {
    super(message, 'INVALID_INPUT', { input });
    this.name = 'InvalidInputError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Async iterator for batch processing
 */
export interface BatchIterator<T> extends AsyncIterableIterator<T[]> {
  /** Total number of items */
  total: number;
  /** Current batch index */
  currentBatch: number;
  /** Batch size */
  batchSize: number;
}

/**
 * Progress callback
 */
export type ProgressCallback = (progress: {
  current: number;
  total: number;
  percentage: number;
}) => void;

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Timestamp */
  timestamp: Date;
  /** Access count */
  accessCount: number;
}
