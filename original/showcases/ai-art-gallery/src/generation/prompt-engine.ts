/**
 * Prompt Engine - Intelligent Prompt Generation and Optimization
 *
 * Advanced prompt engineering system that generates, optimizes, and enhances prompts
 * for AI art generation. Uses linguistic analysis, style templates, and iterative
 * refinement to create high-quality prompts.
 *
 * Features:
 * - Intelligent prompt generation from keywords
 * - Prompt optimization and enhancement
 * - Negative prompt suggestions
 * - Template system with variables
 * - Multi-language support
 * - Style-specific prompt adaptation
 * - Quality analysis and scoring
 *
 * @module prompt-engine
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Prompt template interface
 */
export interface PromptTemplate {
  name: string;
  category: string;
  template: string;
  variables: string[];
  description?: string;
  examples?: string[];
  tags?: string[];
}

/**
 * Prompt optimization options
 */
export interface OptimizationOptions {
  style?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  addDetails?: boolean;
  addQualityModifiers?: boolean;
  removeRedundancy?: boolean;
  expandKeywords?: boolean;
  targetLength?: number;
}

/**
 * Prompt analysis result
 */
export interface PromptAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords: {
    subjects: string[];
    styles: string[];
    modifiers: string[];
    technical: string[];
  };
  length: number;
  complexity: number;
}

/**
 * Generated prompt result
 */
export interface GeneratedPrompt {
  positive: string;
  negative?: string;
  metadata: {
    template?: string;
    style?: string;
    quality: string;
    keywords: string[];
  };
}

/**
 * Prompt Engine Configuration
 */
export interface PromptEngineConfig {
  modelType: 'gpt-style' | 'stable-diffusion' | 'midjourney' | 'custom';
  templatesPath?: string;
  language?: string;
  maxLength?: number;
}

/**
 * Prompt Engine
 */
export class PromptEngine {
  private modelType: string;
  private templatesPath: string;
  private language: string;
  private maxLength: number;
  private templates: Map<string, PromptTemplate> = new Map();
  private styleModifiers: Map<string, string[]> = new Map();
  private qualityModifiers: Map<string, string[]> = new Map();

  constructor(config: PromptEngineConfig) {
    this.modelType = config.modelType;
    this.templatesPath = config.templatesPath || './storage/templates';
    this.language = config.language || 'en';
    this.maxLength = config.maxLength || 500;

    this.initializeModifiers();
    this.loadTemplates();
  }

  /**
   * Generate prompt from keywords or concept
   */
  async generate(
    concept: string,
    options: {
      template?: string;
      style?: string;
      quality?: 'low' | 'medium' | 'high' | 'ultra';
      includeNegative?: boolean;
      variables?: Record<string, string>;
    } = {}
  ): Promise<GeneratedPrompt> {
    let positive: string;

    // Use template if specified
    if (options.template) {
      const template = this.templates.get(options.template);
      if (!template) {
        throw new Error(`Template not found: ${options.template}`);
      }

      positive = this.applyTemplate(template, {
        concept,
        ...options.variables
      });
    } else {
      // Generate from concept
      positive = await this.generateFromConcept(concept, options);
    }

    // Optimize
    positive = await this.optimize(positive, {
      style: options.style,
      quality: options.quality || 'high',
      addDetails: true,
      addQualityModifiers: true
    });

    // Generate negative prompt
    let negative: string | undefined;
    if (options.includeNegative) {
      negative = this.generateNegativePrompt(positive, options.style);
    }

    return {
      positive,
      negative,
      metadata: {
        template: options.template,
        style: options.style,
        quality: options.quality || 'high',
        keywords: this.extractKeywords(positive)
      }
    };
  }

  /**
   * Optimize existing prompt
   */
  async optimize(
    prompt: string,
    options: OptimizationOptions = {}
  ): Promise<string> {
    let optimized = prompt.trim();

    // Remove redundancy
    if (options.removeRedundancy !== false) {
      optimized = this.removeRedundancy(optimized);
    }

    // Expand keywords
    if (options.expandKeywords) {
      optimized = this.expandKeywords(optimized);
    }

    // Add style modifiers
    if (options.style) {
      optimized = this.addStyleModifiers(optimized, options.style);
    }

    // Add quality modifiers
    if (options.addQualityModifiers) {
      optimized = this.addQualityModifiers(optimized, options.quality || 'high');
    }

    // Add details
    if (options.addDetails) {
      optimized = this.addDetails(optimized);
    }

    // Ensure proper length
    if (options.targetLength) {
      optimized = this.adjustLength(optimized, options.targetLength);
    } else if (optimized.length > this.maxLength) {
      optimized = this.adjustLength(optimized, this.maxLength);
    }

    // Clean up formatting
    optimized = this.cleanupFormatting(optimized);

    return optimized;
  }

  /**
   * Analyze prompt quality
   */
  async analyze(prompt: string): Promise<PromptAnalysis> {
    const keywords = this.extractDetailedKeywords(prompt);
    const length = prompt.length;
    const complexity = this.calculateComplexity(prompt);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    let score = 50; // Base score

    // Check for subjects
    if (keywords.subjects.length > 0) {
      strengths.push('Clear subject(s) identified');
      score += 15;
    } else {
      weaknesses.push('No clear subject');
      suggestions.push('Add a specific subject or focal point');
    }

    // Check for style indicators
    if (keywords.styles.length > 0) {
      strengths.push('Style specified');
      score += 10;
    } else {
      suggestions.push('Consider adding style modifiers (e.g., "oil painting", "photorealistic")');
    }

    // Check for modifiers
    if (keywords.modifiers.length >= 3) {
      strengths.push('Rich descriptive modifiers');
      score += 10;
    } else if (keywords.modifiers.length === 0) {
      weaknesses.push('Lacks descriptive modifiers');
      suggestions.push('Add adjectives and descriptive terms');
    }

    // Check for technical parameters
    if (keywords.technical.length > 0) {
      strengths.push('Technical parameters specified');
      score += 5;
    }

    // Length analysis
    if (length > 20 && length < 300) {
      strengths.push('Good prompt length');
      score += 10;
    } else if (length < 20) {
      weaknesses.push('Prompt too short');
      suggestions.push('Add more descriptive details');
    } else if (length > 500) {
      weaknesses.push('Prompt too long');
      suggestions.push('Remove redundant or less important details');
    }

    // Complexity analysis
    if (complexity > 0.3 && complexity < 0.7) {
      strengths.push('Good complexity balance');
      score += 10;
    } else if (complexity < 0.3) {
      suggestions.push('Consider adding more varied vocabulary');
    } else {
      suggestions.push('Simplify overly complex phrasing');
    }

    return {
      score: Math.min(100, score),
      strengths,
      weaknesses,
      suggestions,
      keywords,
      length,
      complexity
    };
  }

  /**
   * Generate variations of a prompt
   */
  async generateVariations(
    prompt: string,
    count: number = 5,
    diversity: number = 0.5
  ): Promise<string[]> {
    const variations: string[] = [];
    const keywords = this.extractKeywords(prompt);

    for (let i = 0; i < count; i++) {
      let variation = prompt;

      // Apply different transformations based on diversity
      if (Math.random() < diversity) {
        // Synonym replacement
        variation = this.replaceSynonyms(variation);
      }

      if (Math.random() < diversity) {
        // Add random modifiers
        variation = this.addRandomModifiers(variation);
      }

      if (Math.random() < diversity * 0.7) {
        // Reorder elements
        variation = this.reorderElements(variation);
      }

      variations.push(variation);
    }

    return variations;
  }

  /**
   * Suggest negative prompts
   */
  generateNegativePrompt(
    positivePrompt: string,
    style?: string
  ): string {
    const negativeTerms: string[] = [
      'low quality',
      'blurry',
      'distorted',
      'ugly',
      'disfigured',
      'deformed',
      'bad anatomy',
      'bad proportions',
      'duplicate',
      'cropped',
      'watermark',
      'signature',
      'text'
    ];

    // Style-specific negative terms
    const styleNegatives: Record<string, string[]> = {
      'photorealistic': ['cartoon', 'anime', 'painting', 'drawing', 'illustration'],
      'portrait': ['multiple heads', 'extra limbs', 'missing limbs'],
      'landscape': ['people', 'text', 'buildings'],
      'abstract': ['photorealistic', 'detailed faces'],
      'anime': ['photorealistic', '3d render', 'realistic']
    };

    if (style && styleNegatives[style]) {
      negativeTerms.push(...styleNegatives[style]);
    }

    // Model-specific formatting
    if (this.modelType === 'stable-diffusion') {
      return negativeTerms.join(', ');
    } else if (this.modelType === 'midjourney') {
      return '--no ' + negativeTerms.join(', ');
    }

    return negativeTerms.join(', ');
  }

  /**
   * Create custom template
   */
  createTemplate(
    name: string,
    template: string,
    options: {
      category?: string;
      description?: string;
      examples?: string[];
      tags?: string[];
    } = {}
  ): PromptTemplate {
    // Extract variables from template
    const variablePattern = /\{(\w+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const promptTemplate: PromptTemplate = {
      name,
      category: options.category || 'custom',
      template,
      variables,
      description: options.description,
      examples: options.examples,
      tags: options.tags
    };

    this.templates.set(name, promptTemplate);
    return promptTemplate;
  }

  /**
   * List available templates
   */
  listTemplates(category?: string): PromptTemplate[] {
    const templates = Array.from(this.templates.values());

    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates;
  }

  /**
   * Generate from concept
   */
  private async generateFromConcept(
    concept: string,
    options: any
  ): Promise<string> {
    const parts: string[] = [];

    // Start with concept
    parts.push(concept);

    // Detect and enhance based on concept type
    const conceptType = this.detectConceptType(concept);

    switch (conceptType) {
      case 'portrait':
        parts.push(this.getRandomModifiers('portrait-quality', 2).join(', '));
        break;

      case 'landscape':
        parts.push(this.getRandomModifiers('landscape-details', 2).join(', '));
        break;

      case 'abstract':
        parts.push(this.getRandomModifiers('abstract-elements', 2).join(', '));
        break;

      case 'object':
        parts.push(this.getRandomModifiers('object-details', 2).join(', '));
        break;
    }

    return parts.join(', ');
  }

  /**
   * Apply template with variables
   */
  private applyTemplate(
    template: PromptTemplate,
    variables: Record<string, string>
  ): string {
    let result = template.template;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Check for unresolved variables
    const unresolved = result.match(/\{(\w+)\}/g);
    if (unresolved) {
      console.warn(`Unresolved template variables: ${unresolved.join(', ')}`);
    }

    return result;
  }

  /**
   * Remove redundancy from prompt
   */
  private removeRedundancy(prompt: string): string {
    const words = prompt.split(/,\s*/);
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const word of words) {
      const normalized = word.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(word.trim());
      }
    }

    return unique.join(', ');
  }

  /**
   * Expand keywords with synonyms and related terms
   */
  private expandKeywords(prompt: string): string {
    const expansions: Record<string, string[]> = {
      'beautiful': ['stunning', 'gorgeous', 'magnificent'],
      'detailed': ['intricate', 'elaborate', 'complex'],
      'high quality': ['professional', 'masterpiece', 'award-winning'],
      'realistic': ['photorealistic', 'lifelike', 'true-to-life']
    };

    let expanded = prompt;

    for (const [keyword, synonyms] of Object.entries(expansions)) {
      if (expanded.toLowerCase().includes(keyword)) {
        const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
        expanded += `, ${synonym}`;
      }
    }

    return expanded;
  }

  /**
   * Add style modifiers
   */
  private addStyleModifiers(prompt: string, style: string): string {
    const modifiers = this.styleModifiers.get(style) || [];

    if (modifiers.length === 0) {
      return `${prompt}, ${style} style`;
    }

    const selectedModifiers = this.getRandomModifiers(style, 2);
    return `${prompt}, ${selectedModifiers.join(', ')}`;
  }

  /**
   * Add quality modifiers
   */
  private addQualityModifiers(prompt: string, quality: string): string {
    const modifiers = this.qualityModifiers.get(quality) || [];
    const selectedModifiers = modifiers.slice(0, 3);

    if (selectedModifiers.length === 0) {
      return prompt;
    }

    return `${prompt}, ${selectedModifiers.join(', ')}`;
  }

  /**
   * Add contextual details
   */
  private addDetails(prompt: string): string {
    const detailTypes = ['lighting', 'composition', 'atmosphere'];
    const selectedType = detailTypes[Math.floor(Math.random() * detailTypes.length)];

    const details: Record<string, string[]> = {
      lighting: ['soft lighting', 'dramatic lighting', 'golden hour', 'studio lighting'],
      composition: ['rule of thirds', 'symmetrical', 'dynamic composition'],
      atmosphere: ['moody atmosphere', 'ethereal', 'cinematic']
    };

    const options = details[selectedType];
    const selected = options[Math.floor(Math.random() * options.length)];

    return `${prompt}, ${selected}`;
  }

  /**
   * Adjust prompt length
   */
  private adjustLength(prompt: string, targetLength: number): string {
    if (prompt.length <= targetLength) {
      return prompt;
    }

    // Truncate at word boundary
    const parts = prompt.split(/,\s*/);
    let result = '';

    for (const part of parts) {
      if ((result + part).length > targetLength) {
        break;
      }
      result += (result ? ', ' : '') + part;
    }

    return result;
  }

  /**
   * Clean up formatting
   */
  private cleanupFormatting(prompt: string): string {
    return prompt
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/,\s*,/g, ',') // Remove empty items
      .replace(/,\s*$/, '') // Remove trailing comma
      .trim();
  }

  /**
   * Extract keywords from prompt
   */
  private extractKeywords(prompt: string): string[] {
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'with', 'by', 'of']);
    const words = prompt.toLowerCase().split(/[\s,]+/);

    return words.filter(w => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Extract detailed keywords
   */
  private extractDetailedKeywords(prompt: string): {
    subjects: string[];
    styles: string[];
    modifiers: string[];
    technical: string[];
  } {
    const subjects: string[] = [];
    const styles: string[] = [];
    const modifiers: string[] = [];
    const technical: string[] = [];

    const subjectPatterns = /\b(portrait|person|woman|man|landscape|city|building|animal|object)\b/gi;
    const stylePatterns = /\b(painting|photograph|illustration|3d render|anime|realistic|abstract|impressionist)\b/gi;
    const technicalPatterns = /\b(4k|8k|uhd|hdr|bokeh|depth of field|ray tracing)\b/gi;

    let match;

    while ((match = subjectPatterns.exec(prompt)) !== null) {
      subjects.push(match[0]);
    }

    while ((match = stylePatterns.exec(prompt)) !== null) {
      styles.push(match[0]);
    }

    while ((match = technicalPatterns.exec(prompt)) !== null) {
      technical.push(match[0]);
    }

    // Remaining words as modifiers
    const allKeywords = new Set([...subjects, ...styles, ...technical]);
    const words = this.extractKeywords(prompt);

    for (const word of words) {
      if (!allKeywords.has(word)) {
        modifiers.push(word);
      }
    }

    return { subjects, styles, modifiers, technical };
  }

  /**
   * Calculate prompt complexity
   */
  private calculateComplexity(prompt: string): number {
    const words = prompt.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    const uniqueness = uniqueWords.size / words.length;
    const lengthScore = Math.min(avgWordLength / 10, 1);

    return (uniqueness + lengthScore) / 2;
  }

  /**
   * Detect concept type
   */
  private detectConceptType(concept: string): string {
    const lower = concept.toLowerCase();

    if (/portrait|person|face|woman|man|people/.test(lower)) return 'portrait';
    if (/landscape|scenery|nature|mountain|ocean|sky/.test(lower)) return 'landscape';
    if (/abstract|surreal|geometric|pattern/.test(lower)) return 'abstract';

    return 'object';
  }

  /**
   * Get random modifiers
   */
  private getRandomModifiers(category: string, count: number): string[] {
    const modifiers = this.styleModifiers.get(category) || [];

    if (modifiers.length === 0) return [];

    const selected: string[] = [];
    const available = [...modifiers];

    for (let i = 0; i < Math.min(count, available.length); i++) {
      const index = Math.floor(Math.random() * available.length);
      selected.push(available[index]);
      available.splice(index, 1);
    }

    return selected;
  }

  /**
   * Replace with synonyms
   */
  private replaceSynonyms(prompt: string): string {
    const synonyms: Record<string, string[]> = {
      'beautiful': ['stunning', 'gorgeous', 'magnificent', 'breathtaking'],
      'detailed': ['intricate', 'elaborate', 'complex', 'refined'],
      'bright': ['vibrant', 'luminous', 'radiant', 'brilliant'],
      'dark': ['shadowy', 'dim', 'murky', 'gloomy']
    };

    let result = prompt;

    for (const [word, alternatives] of Object.entries(synonyms)) {
      if (result.toLowerCase().includes(word)) {
        const synonym = alternatives[Math.floor(Math.random() * alternatives.length)];
        result = result.replace(new RegExp(word, 'gi'), synonym);
      }
    }

    return result;
  }

  /**
   * Add random modifiers
   */
  private addRandomModifiers(prompt: string): string {
    const randomModifiers = [
      'highly detailed',
      'masterpiece',
      'trending on artstation',
      'award-winning',
      'professional',
      'cinematic',
      'atmospheric'
    ];

    const selected = randomModifiers[Math.floor(Math.random() * randomModifiers.length)];
    return `${prompt}, ${selected}`;
  }

  /**
   * Reorder prompt elements
   */
  private reorderElements(prompt: string): string {
    const parts = prompt.split(/,\s*/);

    // Keep first part (usually main subject)
    const subject = parts[0];
    const rest = parts.slice(1);

    // Shuffle rest
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    return [subject, ...rest].join(', ');
  }

  /**
   * Initialize style and quality modifiers
   */
  private initializeModifiers(): void {
    // Style modifiers
    this.styleModifiers.set('impressionist', [
      'visible brushstrokes',
      'light effects',
      'soft colors',
      'outdoor scene'
    ]);

    this.styleModifiers.set('photorealistic', [
      'highly detailed',
      'sharp focus',
      'realistic lighting',
      'professional photography'
    ]);

    this.styleModifiers.set('abstract', [
      'geometric shapes',
      'bold colors',
      'non-representational',
      'expressive'
    ]);

    this.styleModifiers.set('cyberpunk', [
      'neon lights',
      'futuristic',
      'dark atmosphere',
      'high tech'
    ]);

    // Quality modifiers
    this.qualityModifiers.set('low', ['draft', 'sketch']);
    this.qualityModifiers.set('medium', ['good quality', 'detailed']);
    this.qualityModifiers.set('high', ['high quality', 'detailed', 'professional']);
    this.qualityModifiers.set('ultra', [
      'masterpiece',
      'award-winning',
      'highly detailed',
      'perfect composition',
      '8k uhd'
    ]);

    // Detail modifiers
    this.styleModifiers.set('portrait-quality', [
      'sharp eyes',
      'detailed skin texture',
      'professional lighting',
      'bokeh background'
    ]);

    this.styleModifiers.set('landscape-details', [
      'expansive vista',
      'atmospheric perspective',
      'rich colors',
      'detailed foreground'
    ]);

    this.styleModifiers.set('abstract-elements', [
      'dynamic composition',
      'color harmony',
      'visual rhythm',
      'balanced chaos'
    ]);

    this.styleModifiers.set('object-details', [
      'studio lighting',
      'clean background',
      'precise details',
      'sharp focus'
    ]);
  }

  /**
   * Load templates from storage
   */
  private loadTemplates(): void {
    // Built-in templates
    this.createTemplate(
      'portrait-formal',
      'portrait of {subject}, {style} style, {lighting}, professional photography',
      {
        category: 'portrait',
        description: 'Formal portrait template',
        examples: ['portrait of a CEO, photorealistic style, studio lighting, professional photography']
      }
    );

    this.createTemplate(
      'landscape-scenic',
      '{scene} landscape, {time-of-day}, {weather}, {style} style',
      {
        category: 'landscape',
        description: 'Scenic landscape template'
      }
    );

    this.createTemplate(
      'abstract-modern',
      'abstract {theme}, {colors}, {composition}, modern art',
      {
        category: 'abstract',
        description: 'Modern abstract art template'
      }
    );

    // Load custom templates if they exist
    if (fs.existsSync(this.templatesPath)) {
      const files = fs.readdirSync(this.templatesPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(path.join(this.templatesPath, file), 'utf-8');
            const template: PromptTemplate = JSON.parse(content);
            this.templates.set(template.name, template);
          } catch (error) {
            console.warn(`Failed to load template ${file}:`, error);
          }
        }
      }
    }
  }
}

export default PromptEngine;
