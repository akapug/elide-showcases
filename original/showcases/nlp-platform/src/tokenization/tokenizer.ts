/**
 * Tokenization module using Hugging Face Transformers via Elide polyglot
 * Demonstrates direct Python library integration in TypeScript
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  TokenizationResult,
  TokenizerConfig,
  TokenizerType,
  BatchOptions,
  PerformanceMetrics,
  InvalidInputError
} from '../types';

/**
 * Tokenizer class for text tokenization using transformers
 *
 * This class demonstrates Elide's polyglot capabilities by directly
 * importing and using Python's transformers library in TypeScript.
 *
 * @example
 * ```typescript
 * const tokenizer = new Tokenizer('bert-base-uncased');
 * const result = await tokenizer.tokenize("Hello, world!");
 * console.log(result.tokens);
 * ```
 */
export class Tokenizer {
  private tokenizer: any;
  private config: TokenizerConfig;
  private modelName: TokenizerType | string;
  private loaded: boolean = false;

  /**
   * Create a new Tokenizer instance
   *
   * @param modelName - Name of the tokenizer model to use
   * @param config - Optional configuration
   */
  constructor(
    modelName: TokenizerType | string = 'bert-base-uncased',
    config: TokenizerConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      maxLength: 512,
      padding: 'max_length',
      truncation: true,
      returnTensors: 'pt',
      addSpecialTokens: true,
      returnAttentionMask: true,
      returnTokenTypeIds: true,
      returnOffsets: false,
      device: 'cpu',
      cache: true,
      verbose: false,
      ...config
    };
  }

  /**
   * Load the tokenizer model
   *
   * This method demonstrates the polyglot bridge in action:
   * - Python's AutoTokenizer is called directly from TypeScript
   * - No REST API, no serialization, no network overhead
   * - Direct in-memory object access
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Direct Python library call - this is the magic of Elide polyglot!
      this.tokenizer = transformers.AutoTokenizer.from_pretrained(
        this.modelName,
        { cache_dir: this.config.cache ? './.cache/transformers' : null }
      );

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Tokenizer loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load tokenizer: ${error}`);
    }
  }

  /**
   * Tokenize a single text
   *
   * @param text - Text to tokenize
   * @param config - Optional tokenization config override
   * @returns Tokenization result with tokens, IDs, and masks
   */
  async tokenize(
    text: string,
    config?: Partial<TokenizerConfig>
  ): Promise<TokenizationResult> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    const startTime = Date.now();
    const mergedConfig = { ...this.config, ...config };

    try {
      // Call Python tokenizer directly
      const encoded = this.tokenizer(
        text,
        {
          max_length: mergedConfig.maxLength,
          padding: mergedConfig.padding,
          truncation: mergedConfig.truncation,
          return_tensors: mergedConfig.returnTensors,
          add_special_tokens: mergedConfig.addSpecialTokens,
          return_attention_mask: mergedConfig.returnAttentionMask,
          return_token_type_ids: mergedConfig.returnTokenTypeIds,
          return_offsets_mapping: mergedConfig.returnOffsets
        }
      );

      // Convert tokens back to text
      const inputIds = this.toArray(encoded.input_ids[0]);
      const tokens = this.tokenizer.convert_ids_to_tokens(inputIds);
      const attentionMask = this.toArray(encoded.attention_mask[0]);

      const result: TokenizationResult = {
        tokens,
        inputIds,
        attentionMask,
        text
      };

      // Add optional fields
      if (encoded.token_type_ids !== undefined) {
        result.tokenTypeIds = this.toArray(encoded.token_type_ids[0]);
      }

      if (encoded.offset_mapping !== undefined) {
        result.offsetMapping = this.toArray(encoded.offset_mapping[0]).map(
          (offset: any) => [offset[0], offset[1]] as [number, number]
        );
      }

      const inferenceTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Tokenized in ${inferenceTime}ms`);
        console.log(`Tokens: ${tokens.length}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Tokenization failed: ${error}`);
    }
  }

  /**
   * Tokenize multiple texts in batch
   *
   * @param texts - Array of texts to tokenize
   * @param options - Batch processing options
   * @returns Array of tokenization results
   */
  async tokenizeBatch(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<TokenizationResult[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const batchSize = options.batchSize || 32;
    const results: TokenizationResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      if (options.showProgress) {
        console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(texts.length / batchSize)}`);
      }

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(text => this.tokenize(text))
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Decode token IDs back to text
   *
   * @param inputIds - Token IDs to decode
   * @param skipSpecialTokens - Skip special tokens like [CLS], [SEP]
   * @returns Decoded text
   */
  async decode(
    inputIds: number[],
    skipSpecialTokens: boolean = true
  ): Promise<string> {
    await this.load();

    try {
      const text = this.tokenizer.decode(
        inputIds,
        { skip_special_tokens: skipSpecialTokens }
      );
      return text;
    } catch (error) {
      throw new Error(`Decoding failed: ${error}`);
    }
  }

  /**
   * Decode batch of token IDs
   *
   * @param batchInputIds - Array of token ID arrays
   * @param skipSpecialTokens - Skip special tokens
   * @returns Array of decoded texts
   */
  async decodeBatch(
    batchInputIds: number[][],
    skipSpecialTokens: boolean = true
  ): Promise<string[]> {
    await this.load();

    return Promise.all(
      batchInputIds.map(ids => this.decode(ids, skipSpecialTokens))
    );
  }

  /**
   * Get vocabulary size
   *
   * @returns Vocabulary size
   */
  async getVocabSize(): Promise<number> {
    await this.load();
    return this.tokenizer.vocab_size;
  }

  /**
   * Get model maximum length
   *
   * @returns Maximum sequence length
   */
  async getMaxLength(): Promise<number> {
    await this.load();
    return this.tokenizer.model_max_length;
  }

  /**
   * Get special tokens
   *
   * @returns Object with special tokens
   */
  async getSpecialTokens(): Promise<{
    cls?: string;
    sep?: string;
    pad?: string;
    unk?: string;
    mask?: string;
    bos?: string;
    eos?: string;
  }> {
    await this.load();

    return {
      cls: this.tokenizer.cls_token,
      sep: this.tokenizer.sep_token,
      pad: this.tokenizer.pad_token,
      unk: this.tokenizer.unk_token,
      mask: this.tokenizer.mask_token,
      bos: this.tokenizer.bos_token,
      eos: this.tokenizer.eos_token
    };
  }

  /**
   * Add tokens to vocabulary
   *
   * @param tokens - Tokens to add
   * @returns Number of tokens added
   */
  async addTokens(tokens: string[]): Promise<number> {
    await this.load();

    const numAdded = this.tokenizer.add_tokens(tokens);
    return numAdded;
  }

  /**
   * Add special tokens to vocabulary
   *
   * @param specialTokens - Special tokens to add
   * @returns Number of tokens added
   */
  async addSpecialTokens(
    specialTokens: Record<string, string>
  ): Promise<number> {
    await this.load();

    const numAdded = this.tokenizer.add_special_tokens(specialTokens);
    return numAdded;
  }

  /**
   * Convert token to ID
   *
   * @param token - Token to convert
   * @returns Token ID
   */
  async tokenToId(token: string): Promise<number> {
    await this.load();
    return this.tokenizer.convert_tokens_to_ids(token);
  }

  /**
   * Convert ID to token
   *
   * @param id - ID to convert
   * @returns Token
   */
  async idToToken(id: number): Promise<string> {
    await this.load();
    return this.tokenizer.convert_ids_to_tokens(id);
  }

  /**
   * Save tokenizer to disk
   *
   * @param path - Path to save to
   */
  async save(path: string): Promise<void> {
    await this.load();
    this.tokenizer.save_pretrained(path);
  }

  /**
   * Convert Python tensor to JavaScript array
   *
   * @param tensor - Python tensor
   * @returns JavaScript array
   */
  private toArray(tensor: any): any[] {
    // Convert PyTorch tensor to list
    if (tensor.tolist !== undefined) {
      return tensor.tolist();
    }
    // Already a list
    if (Array.isArray(tensor)) {
      return tensor;
    }
    // Convert numpy array
    if (tensor.numpy !== undefined) {
      return Array.from(tensor.numpy());
    }
    return Array.from(tensor);
  }

  /**
   * Truncate text to maximum length
   *
   * @param text - Text to truncate
   * @param maxLength - Maximum length in tokens
   * @returns Truncated text
   */
  async truncate(text: string, maxLength?: number): Promise<string> {
    const length = maxLength || this.config.maxLength || 512;
    const result = await this.tokenize(text, { maxLength: length, truncation: true });
    return this.decode(result.inputIds);
  }

  /**
   * Get tokenizer information
   *
   * @returns Tokenizer information
   */
  async getInfo(): Promise<{
    modelName: string;
    vocabSize: number;
    maxLength: number;
    specialTokens: any;
  }> {
    await this.load();

    return {
      modelName: this.modelName,
      vocabSize: await this.getVocabSize(),
      maxLength: await this.getMaxLength(),
      specialTokens: await this.getSpecialTokens()
    };
  }
}

/**
 * Utility function to create a tokenizer
 *
 * @param modelName - Model name
 * @param config - Configuration
 * @returns Tokenizer instance
 */
export function createTokenizer(
  modelName: TokenizerType | string = 'bert-base-uncased',
  config?: TokenizerConfig
): Tokenizer {
  return new Tokenizer(modelName, config);
}

/**
 * BPE (Byte Pair Encoding) Tokenizer
 * Specialized tokenizer for GPT-style models
 */
export class BPETokenizer extends Tokenizer {
  constructor(
    modelName: string = 'gpt2',
    config: TokenizerConfig = {}
  ) {
    super(modelName, {
      ...config,
      addSpecialTokens: true,
      returnTokenTypeIds: false
    });
  }

  /**
   * Tokenize with byte-level processing
   */
  async tokenizeBytes(text: string): Promise<TokenizationResult> {
    const result = await this.tokenize(text);

    // BPE-specific processing
    return {
      ...result,
      tokens: result.tokens.map(t => t.replace(/Ġ/g, ' '))
    };
  }
}

/**
 * WordPiece Tokenizer
 * Specialized tokenizer for BERT-style models
 */
export class WordPieceTokenizer extends Tokenizer {
  constructor(
    modelName: string = 'bert-base-uncased',
    config: TokenizerConfig = {}
  ) {
    super(modelName, {
      ...config,
      addSpecialTokens: true,
      returnTokenTypeIds: true
    });
  }

  /**
   * Get word pieces for a token
   */
  async getWordPieces(word: string): Promise<string[]> {
    const result = await this.tokenize(word, { addSpecialTokens: false });
    return result.tokens.filter(t => t !== '[CLS]' && t !== '[SEP]');
  }

  /**
   * Check if token is a word piece (starts with ##)
   */
  isWordPiece(token: string): boolean {
    return token.startsWith('##');
  }

  /**
   * Merge word pieces back to words
   */
  async mergeWordPieces(tokens: string[]): Promise<string[]> {
    const words: string[] = [];
    let currentWord = '';

    for (const token of tokens) {
      if (this.isWordPiece(token)) {
        currentWord += token.substring(2);
      } else {
        if (currentWord) {
          words.push(currentWord);
        }
        currentWord = token;
      }
    }

    if (currentWord) {
      words.push(currentWord);
    }

    return words;
  }
}

/**
 * SentencePiece Tokenizer
 * Specialized tokenizer for T5, XLNet, etc.
 */
export class SentencePieceTokenizer extends Tokenizer {
  constructor(
    modelName: string = 't5-base',
    config: TokenizerConfig = {}
  ) {
    super(modelName, config);
  }

  /**
   * Tokenize with SentencePiece-specific handling
   */
  async tokenizeSentence(text: string): Promise<TokenizationResult> {
    const result = await this.tokenize(text);

    // SentencePiece uses ▁ to indicate word boundaries
    return {
      ...result,
      tokens: result.tokens.map(t => t.replace(/▁/g, '_'))
    };
  }
}

/**
 * Fast Tokenizer wrapper
 * Uses Rust-based fast tokenizers when available
 */
export class FastTokenizer extends Tokenizer {
  constructor(
    modelName: string,
    config: TokenizerConfig = {}
  ) {
    super(modelName, { ...config, returnOffsets: true });
  }

  /**
   * Get character-level offsets
   */
  async getCharOffsets(text: string): Promise<Array<[number, number]>> {
    const result = await this.tokenize(text);
    return result.offsetMapping || [];
  }

  /**
   * Get tokens at specific character positions
   */
  async getTokensInRange(
    text: string,
    start: number,
    end: number
  ): Promise<string[]> {
    const result = await this.tokenize(text);
    const offsets = result.offsetMapping || [];

    const tokens: string[] = [];
    for (let i = 0; i < offsets.length; i++) {
      const [tokenStart, tokenEnd] = offsets[i];
      if (tokenStart >= start && tokenEnd <= end) {
        tokens.push(result.tokens[i]);
      }
    }

    return tokens;
  }
}

/**
 * Multi-lingual tokenizer
 * Handles multiple languages
 */
export class MultilingualTokenizer extends Tokenizer {
  private languageTokens: Map<string, string> = new Map();

  constructor(
    modelName: string = 'bert-base-multilingual-cased',
    config: TokenizerConfig = {}
  ) {
    super(modelName, config);
  }

  /**
   * Tokenize with language hint
   */
  async tokenizeWithLanguage(
    text: string,
    language?: string
  ): Promise<TokenizationResult> {
    let processedText = text;

    // Add language token if specified
    if (language && this.languageTokens.has(language)) {
      const langToken = this.languageTokens.get(language)!;
      processedText = `${langToken} ${text}`;
    }

    return this.tokenize(processedText);
  }

  /**
   * Set language token
   */
  setLanguageToken(language: string, token: string): void {
    this.languageTokens.set(language, token);
  }
}

/**
 * Token statistics
 */
export interface TokenStats {
  /** Total tokens */
  totalTokens: number;
  /** Unique tokens */
  uniqueTokens: number;
  /** Average tokens per text */
  avgTokensPerText: number;
  /** Maximum tokens */
  maxTokens: number;
  /** Minimum tokens */
  minTokens: number;
  /** Token frequency distribution */
  frequency: Map<string, number>;
}

/**
 * Analyze token statistics
 *
 * @param texts - Texts to analyze
 * @param tokenizer - Tokenizer to use
 * @returns Token statistics
 */
export async function analyzeTokenStats(
  texts: string[],
  tokenizer: Tokenizer
): Promise<TokenStats> {
  const results = await tokenizer.tokenizeBatch(texts);

  const allTokens: string[] = [];
  const frequency = new Map<string, number>();
  const tokenCounts: number[] = [];

  for (const result of results) {
    allTokens.push(...result.tokens);
    tokenCounts.push(result.tokens.length);

    for (const token of result.tokens) {
      frequency.set(token, (frequency.get(token) || 0) + 1);
    }
  }

  return {
    totalTokens: allTokens.length,
    uniqueTokens: frequency.size,
    avgTokensPerText: allTokens.length / texts.length,
    maxTokens: Math.max(...tokenCounts),
    minTokens: Math.min(...tokenCounts),
    frequency
  };
}
