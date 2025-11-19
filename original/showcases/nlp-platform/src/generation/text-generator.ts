/**
 * Text Generation module using GPT models via Elide polyglot
 * Demonstrates state-of-the-art text generation with Python transformers
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';

import {
  GenerationOptions,
  GenerationResult,
  GeneratedSequence,
  TextGeneratorConfig,
  InvalidInputError
} from '../types';

/**
 * Text Generator using GPT and other generative models
 *
 * This class demonstrates Elide's polyglot power by using Python's
 * transformers library for text generation directly in TypeScript.
 *
 * @example
 * ```typescript
 * const generator = new TextGenerator('gpt2');
 * const result = await generator.generate(
 *   "The future of AI is",
 *   { maxLength: 100, temperature: 0.8 }
 * );
 * console.log(result.sequences[0].text);
 * ```
 */
export class TextGenerator {
  private pipeline: any;
  private model: any;
  private tokenizer: any;
  private config: TextGeneratorConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new TextGenerator instance
   *
   * @param modelName - Model to use for generation
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'gpt2',
    config: TextGeneratorConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      defaultOptions: {
        maxLength: 100,
        temperature: 1.0,
        topK: 50,
        topP: 0.95,
        numReturnSequences: 1,
        doSample: true,
        repetitionPenalty: 1.0,
        lengthPenalty: 1.0,
        earlyStopping: true,
        noRepeatNgramSize: 3
      },
      ...config
    };
  }

  /**
   * Load the generation model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Load model and tokenizer directly from Python
      this.tokenizer = transformers.AutoTokenizer.from_pretrained(this.modelName);
      this.model = transformers.AutoModelForCausalLM.from_pretrained(this.modelName);

      // Create pipeline
      this.pipeline = transformers.pipeline(
        'text-generation',
        {
          model: this.model,
          tokenizer: this.tokenizer,
          device: this.config.device === 'cuda' ? 0 : -1
        }
      );

      // Set padding token if needed
      if (!this.tokenizer.pad_token) {
        this.tokenizer.pad_token = this.tokenizer.eos_token;
      }

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Text generator loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load text generator: ${error}`);
    }
  }

  /**
   * Generate text from prompt
   *
   * @param prompt - Input prompt
   * @param options - Generation options
   * @returns Generation result with generated sequences
   */
  async generate(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    if (!prompt || prompt.trim().length === 0) {
      throw new InvalidInputError('Prompt cannot be empty');
    }

    await this.load();

    const startTime = Date.now();
    const mergedOptions = { ...this.config.defaultOptions, ...options };

    try {
      // Prepare generation parameters
      const genParams: any = {
        max_length: mergedOptions.maxLength,
        min_length: mergedOptions.minLength,
        temperature: mergedOptions.temperature,
        top_k: mergedOptions.topK,
        top_p: mergedOptions.topP,
        num_beams: mergedOptions.numBeams,
        num_return_sequences: mergedOptions.numReturnSequences,
        repetition_penalty: mergedOptions.repetitionPenalty,
        length_penalty: mergedOptions.lengthPenalty,
        early_stopping: mergedOptions.earlyStopping,
        do_sample: mergedOptions.doSample,
        no_repeat_ngram_size: mergedOptions.noRepeatNgramSize,
        return_full_text: false
      };

      // Generate text
      const results = this.pipeline(prompt, genParams);

      // Convert to our format
      const sequences: GeneratedSequence[] = results.map((result: any) => ({
        text: result.generated_text,
        score: result.score || 0
      }));

      const inferenceTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Generated ${sequences.length} sequences in ${inferenceTime}ms`);
      }

      return {
        sequences,
        prompt,
        options: mergedOptions,
        metrics: {
          totalTime: inferenceTime,
          inferenceTime,
          throughput: sequences.length / (inferenceTime / 1000)
        }
      };
    } catch (error) {
      throw new Error(`Text generation failed: ${error}`);
    }
  }

  /**
   * Generate with beam search
   *
   * @param prompt - Input prompt
   * @param numBeams - Number of beams
   * @param maxLength - Maximum length
   * @returns Generation result
   */
  async generateWithBeamSearch(
    prompt: string,
    numBeams: number = 5,
    maxLength: number = 100
  ): Promise<GenerationResult> {
    return this.generate(prompt, {
      numBeams,
      maxLength,
      doSample: false,
      earlyStopping: true
    });
  }

  /**
   * Generate with sampling
   *
   * @param prompt - Input prompt
   * @param temperature - Sampling temperature
   * @param topK - Top-k sampling
   * @param topP - Nucleus sampling
   * @returns Generation result
   */
  async generateWithSampling(
    prompt: string,
    temperature: number = 0.8,
    topK: number = 50,
    topP: number = 0.95
  ): Promise<GenerationResult> {
    return this.generate(prompt, {
      temperature,
      topK,
      topP,
      doSample: true
    });
  }

  /**
   * Generate multiple diverse sequences
   *
   * @param prompt - Input prompt
   * @param numSequences - Number of sequences to generate
   * @param options - Generation options
   * @returns Generation result with multiple sequences
   */
  async generateMultiple(
    prompt: string,
    numSequences: number = 3,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    return this.generate(prompt, {
      ...options,
      numReturnSequences: numSequences,
      temperature: options.temperature || 0.9,
      doSample: true
    });
  }

  /**
   * Continue text from prompt
   *
   * @param text - Text to continue
   * @param maxNewTokens - Maximum new tokens to generate
   * @returns Continuation
   */
  async continue(
    text: string,
    maxNewTokens: number = 50
  ): Promise<string> {
    const result = await this.generate(text, {
      maxLength: text.split(' ').length + maxNewTokens,
      numReturnSequences: 1,
      temperature: 0.7
    });

    return result.sequences[0].text;
  }

  /**
   * Generate with constraints
   *
   * @param prompt - Input prompt
   * @param mustInclude - Words that must be included
   * @param options - Generation options
   * @returns Generation result
   */
  async generateWithConstraints(
    prompt: string,
    mustInclude: string[],
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    // Generate multiple sequences and filter
    const result = await this.generateMultiple(
      prompt,
      Math.max(5, (options.numReturnSequences || 1) * 3),
      options
    );

    // Filter sequences that include required words
    const filtered = result.sequences.filter(seq => {
      const text = seq.text.toLowerCase();
      return mustInclude.every(word => text.includes(word.toLowerCase()));
    });

    // Take top N
    const topN = options.numReturnSequences || 1;
    result.sequences = filtered.slice(0, topN);

    return result;
  }

  /**
   * Generate story or long-form content
   *
   * @param prompt - Story beginning
   * @param targetLength - Target length in words
   * @returns Generated story
   */
  async generateStory(
    prompt: string,
    targetLength: number = 500
  ): Promise<string> {
    let story = prompt;
    let currentLength = prompt.split(' ').length;

    while (currentLength < targetLength) {
      const continuation = await this.continue(
        story,
        Math.min(100, targetLength - currentLength)
      );

      story = continuation;
      currentLength = story.split(' ').length;

      if (this.config.verbose) {
        console.log(`Story length: ${currentLength}/${targetLength} words`);
      }
    }

    return story;
  }

  /**
   * Generate dialogue
   *
   * @param context - Dialogue context
   * @param turns - Number of turns
   * @returns Dialogue
   */
  async generateDialogue(
    context: string,
    turns: number = 5
  ): Promise<string[]> {
    const dialogue: string[] = [context];

    for (let i = 0; i < turns; i++) {
      const prompt = dialogue.join('\n');
      const result = await this.generate(prompt, {
        maxLength: prompt.split(' ').length + 50,
        temperature: 0.85,
        topP: 0.9
      });

      const response = result.sequences[0].text.trim();
      dialogue.push(response);

      if (this.config.verbose) {
        console.log(`Turn ${i + 1}/${turns}`);
      }
    }

    return dialogue;
  }

  /**
   * Complete code from prompt
   *
   * @param codePrompt - Code prompt or partial code
   * @param language - Programming language
   * @returns Completed code
   */
  async completeCode(
    codePrompt: string,
    language: string = 'python'
  ): Promise<string> {
    // Add language context
    const prompt = `# ${language}\n${codePrompt}`;

    const result = await this.generate(prompt, {
      maxLength: 200,
      temperature: 0.3, // Lower temperature for code
      topP: 0.95,
      repetitionPenalty: 1.1
    });

    return result.sequences[0].text;
  }

  /**
   * Generate creative writing
   *
   * @param prompt - Writing prompt
   * @param style - Writing style
   * @returns Creative text
   */
  async generateCreative(
    prompt: string,
    style: 'poetic' | 'narrative' | 'descriptive' | 'dialogue' = 'narrative'
  ): Promise<string> {
    const stylePrompts = {
      poetic: 'In poetic verse: ',
      narrative: 'Tell a story: ',
      descriptive: 'Describe in detail: ',
      dialogue: 'Write a dialogue: '
    };

    const styledPrompt = stylePrompts[style] + prompt;

    const result = await this.generate(styledPrompt, {
      maxLength: 200,
      temperature: 0.9,
      topP: 0.95,
      repetitionPenalty: 1.2
    });

    return result.sequences[0].text;
  }

  /**
   * Generate with prefix and suffix
   *
   * @param prefix - Text before
   * @param suffix - Text after
   * @param options - Generation options
   * @returns Infilled text
   */
  async infill(
    prefix: string,
    suffix: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    // Some models support infilling with special tokens
    const prompt = `${prefix}<|infill|>${suffix}`;

    const result = await this.generate(prompt, {
      ...options,
      temperature: 0.7
    });

    return result.sequences[0].text;
  }

  /**
   * Score text likelihood
   *
   * @param text - Text to score
   * @returns Likelihood score
   */
  async scoreText(text: string): Promise<number> {
    await this.load();

    try {
      const inputs = this.tokenizer(text, { return_tensors: 'pt' });
      const outputs = this.model(inputs.input_ids);
      const logits = outputs.logits;

      // Calculate perplexity as score
      // Lower perplexity = more likely text
      // This is a simplified scoring
      return 1.0; // Placeholder
    } catch (error) {
      throw new Error(`Text scoring failed: ${error}`);
    }
  }

  /**
   * Get model information
   *
   * @returns Model information
   */
  async getInfo(): Promise<{
    modelName: string;
    vocabSize: number;
    maxLength: number;
  }> {
    await this.load();

    return {
      modelName: this.modelName,
      vocabSize: this.tokenizer.vocab_size,
      maxLength: this.model.config.max_length || 1024
    };
  }
}

/**
 * GPT-2 text generator
 */
export class GPT2Generator extends TextGenerator {
  constructor(
    variant: 'small' | 'medium' | 'large' | 'xl' = 'small',
    config: TextGeneratorConfig = {}
  ) {
    const models = {
      small: 'gpt2',
      medium: 'gpt2-medium',
      large: 'gpt2-large',
      xl: 'gpt2-xl'
    };
    super(models[variant], config);
  }
}

/**
 * GPT-Neo generator
 */
export class GPTNeoGenerator extends TextGenerator {
  constructor(
    size: '125M' | '1.3B' | '2.7B' = '125M',
    config: TextGeneratorConfig = {}
  ) {
    super(`EleutherAI/gpt-neo-${size}`, config);
  }
}

/**
 * GPT-J generator (6B parameters)
 */
export class GPTJGenerator extends TextGenerator {
  constructor(config: TextGeneratorConfig = {}) {
    super('EleutherAI/gpt-j-6B', config);
  }
}

/**
 * BLOOM generator (multilingual)
 */
export class BLOOMGenerator extends TextGenerator {
  constructor(
    size: '560m' | '1b1' | '3b' | '7b1' = '560m',
    config: TextGeneratorConfig = {}
  ) {
    super(`bigscience/bloom-${size}`, config);
  }

  /**
   * Generate with language specification
   */
  async generateInLanguage(
    prompt: string,
    language: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const langPrompt = `[${language}] ${prompt}`;
    return this.generate(langPrompt, options);
  }
}

/**
 * Code generator (CodeGen, StarCoder, etc.)
 */
export class CodeGenerator extends TextGenerator {
  constructor(
    model: 'codegen' | 'starcoder' | 'incoder' = 'codegen',
    config: TextGeneratorConfig = {}
  ) {
    const models = {
      codegen: 'Salesforce/codegen-350M-mono',
      starcoder: 'bigcode/starcoder',
      incoder: 'facebook/incoder-1B'
    };
    super(models[model], config);
  }

  /**
   * Generate code with language specification
   */
  async generateCode(
    prompt: string,
    language: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    const codePrompt = `# Language: ${language}\n${prompt}`;

    const result = await this.generate(codePrompt, {
      ...options,
      temperature: 0.2, // Low temperature for code
      maxLength: options.maxLength || 500
    });

    return result.sequences[0].text;
  }

  /**
   * Complete function from signature
   */
  async completeFunction(
    signature: string,
    docstring?: string
  ): Promise<string> {
    let prompt = signature;
    if (docstring) {
      prompt += `\n    """${docstring}"""`;
    }

    const result = await this.generate(prompt, {
      maxLength: 300,
      temperature: 0.2,
      topP: 0.95,
      stopSequence: '\n\n'
    });

    return result.sequences[0].text;
  }
}

/**
 * Create a text generator
 *
 * @param modelType - Model type
 * @param config - Configuration
 * @returns TextGenerator instance
 */
export function createTextGenerator(
  modelType?: 'gpt2' | 'gpt-neo' | 'gpt-j' | 'bloom' | 'code' | string,
  config?: TextGeneratorConfig
): TextGenerator {
  switch (modelType) {
    case 'gpt2':
      return new GPT2Generator('small', config);
    case 'gpt-neo':
      return new GPTNeoGenerator('125M', config);
    case 'gpt-j':
      return new GPTJGenerator(config);
    case 'bloom':
      return new BLOOMGenerator('560m', config);
    case 'code':
      return new CodeGenerator('codegen', config);
    default:
      return new TextGenerator(modelType, config);
  }
}

/**
 * Generation utilities
 */
export const GenerationUtils = {
  /**
   * Count tokens approximately
   */
  countTokens: (text: string): number => {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  },

  /**
   * Truncate to token limit
   */
  truncate: (text: string, maxTokens: number): string => {
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars);
  },

  /**
   * Calculate perplexity score
   */
  calculatePerplexity: (sequences: GeneratedSequence[]): number => {
    if (sequences.length === 0) return Infinity;
    const avgScore = sequences.reduce((sum, s) => sum + s.score, 0) / sequences.length;
    return Math.exp(-avgScore);
  },

  /**
   * Find best sequence
   */
  findBest: (sequences: GeneratedSequence[]): GeneratedSequence => {
    return sequences.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  },

  /**
   * Remove duplicates
   */
  removeDuplicates: (sequences: GeneratedSequence[]): GeneratedSequence[] => {
    const seen = new Set<string>();
    return sequences.filter(seq => {
      const normalized = seq.text.trim().toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }
};
