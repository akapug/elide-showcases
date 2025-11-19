/**
 * Style Mixer - Advanced Style Mixing and Blending System
 *
 * Enables sophisticated blending of multiple artistic styles with adaptive weighting,
 * style interpolation, and custom style definition. Leverages AI analysis for optimal
 * style combination.
 *
 * Features:
 * - Multi-style blending with adaptive weights
 * - Style interpolation and morphing
 * - Custom style definition and training
 * - Style library management
 * - Automatic weight optimization
 * - Conflict resolution
 *
 * @module style-mixer
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Style definition interface
 */
export interface StyleDefinition {
  name: string;
  description?: string;
  category: string;
  characteristics: {
    colorPalette?: string[];
    brushwork?: string;
    mood?: string;
    era?: string;
    movement?: string;
  };
  transferParams: {
    method: 'vgg' | 'adain' | 'custom';
    layers?: string[];
    weights?: number[];
    iterations?: number;
  };
  examples?: string[];
  created: number;
}

/**
 * Style weight interface
 */
export interface StyleWeight {
  name: string;
  weight: number;
  priority?: number;
}

/**
 * Blend configuration interface
 */
export interface BlendConfig {
  prompt: string;
  styles: StyleWeight[];
  blendMode: 'linear' | 'adaptive' | 'hierarchical' | 'competitive';
  optimization?: {
    enabled: boolean;
    iterations?: number;
    targetAesthetic?: number;
  };
  constraints?: {
    maxStyles?: number;
    minWeight?: number;
    preserveStructure?: boolean;
  };
}

/**
 * Blend result interface
 */
export interface BlendResult {
  image: Buffer;
  finalWeights: StyleWeight[];
  blendMode: string;
  metadata: {
    aestheticScore: number;
    dominantStyle: string;
    styleContributions: Map<string, number>;
    optimizationSteps?: number;
  };
}

/**
 * Style interpolation configuration
 */
export interface InterpolationConfig {
  startStyle: string;
  endStyle: string;
  steps: number;
  method: 'linear' | 'spherical' | 'cosine';
  easing?: 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Style compatibility result
 */
export interface StyleCompatibility {
  style1: string;
  style2: string;
  compatibility: number;
  conflicts: string[];
  suggestions: string[];
}

/**
 * Style Mixer Configuration
 */
export interface StyleMixerConfig {
  styleTransfer: any;
  analyzer?: any;
  libraryPath?: string;
  cacheEnabled?: boolean;
}

/**
 * Style Mixer
 */
export class StyleMixer {
  private styleTransfer: any;
  private analyzer: any;
  private libraryPath: string;
  private styles: Map<string, StyleDefinition> = new Map();
  private cache: Map<string, BlendResult> = new Map();
  private cacheEnabled: boolean;

  constructor(config: StyleMixerConfig) {
    this.styleTransfer = config.styleTransfer;
    this.analyzer = config.analyzer;
    this.libraryPath = config.libraryPath || './storage/styles';
    this.cacheEnabled = config.cacheEnabled ?? true;

    // Ensure library directory exists
    if (!fs.existsSync(this.libraryPath)) {
      fs.mkdirSync(this.libraryPath, { recursive: true });
    }

    // Load built-in styles
    this.loadBuiltInStyles();

    // Load custom styles
    this.loadCustomStyles();
  }

  /**
   * Blend multiple styles
   */
  async blend(config: BlendConfig): Promise<BlendResult> {
    // Check cache
    if (this.cacheEnabled) {
      const cacheKey = this.generateCacheKey(config);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Validate styles
    this.validateStyles(config.styles);

    // Normalize weights
    let weights = this.normalizeWeights(config.styles);

    // Apply constraints
    if (config.constraints) {
      weights = this.applyConstraints(weights, config.constraints);
    }

    // Optimize weights if requested
    if (config.optimization?.enabled) {
      weights = await this.optimizeWeights(
        config.prompt,
        weights,
        config.blendMode,
        config.optimization
      );
    }

    // Perform blending
    const result = await this.performBlending(
      config.prompt,
      weights,
      config.blendMode
    );

    // Analyze result
    if (this.analyzer) {
      const analysis = await this.analyzer.analyze(result.image, {
        includeStyle: true,
        includeAesthetic: true
      });

      result.metadata.aestheticScore = analysis.aesthetic.score;
      result.metadata.dominantStyle = analysis.style.primary;
    }

    // Calculate style contributions
    result.metadata.styleContributions = this.calculateContributions(weights);

    // Cache result
    if (this.cacheEnabled) {
      const cacheKey = this.generateCacheKey(config);
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Interpolate between two styles
   */
  async interpolate(
    baseImage: Buffer,
    config: InterpolationConfig
  ): Promise<Buffer[]> {
    const results: Buffer[] = [];

    const startStyle = this.getStyle(config.startStyle);
    const endStyle = this.getStyle(config.endStyle);

    if (!startStyle || !endStyle) {
      throw new Error('Invalid styles for interpolation');
    }

    for (let i = 0; i < config.steps; i++) {
      const t = i / (config.steps - 1);
      const weight = this.calculateInterpolationWeight(t, config);

      // Blend styles with interpolated weight
      const blended = await this.styleTransfer.blend(baseImage, [
        {
          style: config.startStyle,
          weight: 1 - weight,
          params: startStyle.transferParams
        },
        {
          style: config.endStyle,
          weight: weight,
          params: endStyle.transferParams
        }
      ]);

      results.push(blended);
    }

    return results;
  }

  /**
   * Create custom style
   */
  async createStyle(
    name: string,
    options: {
      category: string;
      description?: string;
      referenceImages: string[];
      characteristics?: StyleDefinition['characteristics'];
      transferParams?: Partial<StyleDefinition['transferParams']>;
    }
  ): Promise<StyleDefinition> {
    // Analyze reference images to extract style characteristics
    const characteristics = options.characteristics || await this.analyzeStyleCharacteristics(
      options.referenceImages
    );

    const style: StyleDefinition = {
      name,
      description: options.description,
      category: options.category,
      characteristics,
      transferParams: {
        method: options.transferParams?.method || 'vgg',
        layers: options.transferParams?.layers || ['conv1_1', 'conv2_1', 'conv3_1', 'conv4_1'],
        weights: options.transferParams?.weights || [1.0, 1.0, 1.0, 1.0],
        iterations: options.transferParams?.iterations || 100
      },
      examples: options.referenceImages,
      created: Date.now()
    };

    // Train custom style if using neural methods
    if (style.transferParams.method === 'custom') {
      await this.trainCustomStyle(style, options.referenceImages);
    }

    // Save style
    this.styles.set(name, style);
    await this.saveStyle(style);

    return style;
  }

  /**
   * Get style definition
   */
  getStyle(name: string): StyleDefinition | undefined {
    return this.styles.get(name);
  }

  /**
   * List all styles
   */
  listStyles(category?: string): StyleDefinition[] {
    const styles = Array.from(this.styles.values());

    if (category) {
      return styles.filter(s => s.category === category);
    }

    return styles;
  }

  /**
   * Check style compatibility
   */
  async checkCompatibility(
    style1Name: string,
    style2Name: string
  ): Promise<StyleCompatibility> {
    const style1 = this.getStyle(style1Name);
    const style2 = this.getStyle(style2Name);

    if (!style1 || !style2) {
      throw new Error('Invalid styles');
    }

    const conflicts: string[] = [];
    const suggestions: string[] = [];
    let compatibility = 1.0;

    // Check color palette compatibility
    if (style1.characteristics.colorPalette && style2.characteristics.colorPalette) {
      const colorSim = this.calculateColorCompatibility(
        style1.characteristics.colorPalette,
        style2.characteristics.colorPalette
      );

      if (colorSim < 0.5) {
        conflicts.push('Color palettes may clash');
        suggestions.push('Consider using lower weights or adaptive blending');
        compatibility *= 0.7;
      }
    }

    // Check era compatibility
    if (style1.characteristics.era && style2.characteristics.era) {
      if (this.eraDistance(style1.characteristics.era, style2.characteristics.era) > 100) {
        conflicts.push('Styles from very different eras');
        suggestions.push('Use hierarchical blending for better results');
        compatibility *= 0.8;
      }
    }

    // Check mood compatibility
    if (style1.characteristics.mood && style2.characteristics.mood) {
      if (this.moodsConflict(style1.characteristics.mood, style2.characteristics.mood)) {
        conflicts.push('Conflicting moods');
        suggestions.push('Adjust weights to favor one mood over the other');
        compatibility *= 0.6;
      }
    }

    return {
      style1: style1Name,
      style2: style2Name,
      compatibility,
      conflicts,
      suggestions
    };
  }

  /**
   * Suggest compatible styles
   */
  async suggestStyles(
    baseStyle: string,
    count: number = 5
  ): Promise<Array<{ style: string; compatibility: number }>> {
    const suggestions: Array<{ style: string; compatibility: number }> = [];

    for (const [name, style] of this.styles) {
      if (name === baseStyle) continue;

      const compat = await this.checkCompatibility(baseStyle, name);
      suggestions.push({
        style: name,
        compatibility: compat.compatibility
      });
    }

    // Sort by compatibility and return top N
    suggestions.sort((a, b) => b.compatibility - a.compatibility);
    return suggestions.slice(0, count);
  }

  /**
   * Optimize style weights for best aesthetic result
   */
  private async optimizeWeights(
    prompt: string,
    initialWeights: StyleWeight[],
    blendMode: string,
    optimization: { iterations?: number; targetAesthetic?: number }
  ): Promise<StyleWeight[]> {
    const iterations = optimization.iterations || 10;
    const targetAesthetic = optimization.targetAesthetic || 8.0;

    let bestWeights = [...initialWeights];
    let bestScore = 0;

    for (let iter = 0; iter < iterations; iter++) {
      // Generate variations of weights
      const variations = this.generateWeightVariations(bestWeights, 5);

      for (const weights of variations) {
        // Test this weight configuration
        const result = await this.performBlending(prompt, weights, blendMode);

        if (this.analyzer) {
          const analysis = await this.analyzer.analyze(result.image, {
            includeAesthetic: true
          });

          const score = analysis.aesthetic.score;

          if (score > bestScore) {
            bestScore = score;
            bestWeights = weights;
          }

          // Early exit if target reached
          if (score >= targetAesthetic) {
            return weights;
          }
        }
      }

      // Apply learning: adjust weights based on best performing variation
      bestWeights = this.refineWeights(bestWeights, bestScore, targetAesthetic);
    }

    return bestWeights;
  }

  /**
   * Perform actual style blending
   */
  private async performBlending(
    prompt: string,
    weights: StyleWeight[],
    blendMode: string
  ): Promise<BlendResult> {
    let image: Buffer;

    switch (blendMode) {
      case 'linear':
        image = await this.linearBlending(prompt, weights);
        break;

      case 'adaptive':
        image = await this.adaptiveBlending(prompt, weights);
        break;

      case 'hierarchical':
        image = await this.hierarchicalBlending(prompt, weights);
        break;

      case 'competitive':
        image = await this.competitiveBlending(prompt, weights);
        break;

      default:
        throw new Error(`Unknown blend mode: ${blendMode}`);
    }

    return {
      image,
      finalWeights: weights,
      blendMode,
      metadata: {
        aestheticScore: 0,
        dominantStyle: weights[0].name,
        styleContributions: new Map()
      }
    };
  }

  /**
   * Linear style blending
   */
  private async linearBlending(
    prompt: string,
    weights: StyleWeight[]
  ): Promise<Buffer> {
    // Apply each style with its weight in sequence
    const styleConfigs = weights.map(w => {
      const style = this.getStyle(w.name);
      return {
        style: w.name,
        weight: w.weight,
        params: style!.transferParams
      };
    });

    return await this.styleTransfer.blend(prompt, styleConfigs);
  }

  /**
   * Adaptive style blending
   */
  private async adaptiveBlending(
    prompt: string,
    weights: StyleWeight[]
  ): Promise<Buffer> {
    // Adaptively adjust weights based on content
    const adjustedWeights = await this.adjustWeightsForContent(prompt, weights);

    return await this.linearBlending(prompt, adjustedWeights);
  }

  /**
   * Hierarchical style blending
   */
  private async hierarchicalBlending(
    prompt: string,
    weights: StyleWeight[]
  ): Promise<Buffer> {
    // Sort by priority (or weight if priority not specified)
    const sorted = weights.sort((a, b) => {
      const priorityA = a.priority ?? a.weight;
      const priorityB = b.priority ?? b.weight;
      return priorityB - priorityA;
    });

    // Apply styles in order, each building on the previous
    let result: Buffer | null = null;

    for (const styleWeight of sorted) {
      const style = this.getStyle(styleWeight.name);

      if (result) {
        // Apply to existing image
        result = await this.styleTransfer.apply(
          result,
          styleWeight.name,
          {
            intensity: styleWeight.weight,
            params: style!.transferParams
          }
        );
      } else {
        // Generate initial image
        result = await this.styleTransfer.generate(
          prompt,
          styleWeight.name,
          {
            params: style!.transferParams
          }
        );
      }
    }

    return result!;
  }

  /**
   * Competitive style blending
   */
  private async competitiveBlending(
    prompt: string,
    weights: StyleWeight[]
  ): Promise<Buffer> {
    // Generate separate images for each style
    const candidates: Array<{ style: string; image: Buffer; score: number }> = [];

    for (const styleWeight of weights) {
      const style = this.getStyle(styleWeight.name);

      const image = await this.styleTransfer.generate(
        prompt,
        styleWeight.name,
        { params: style!.transferParams }
      );

      let score = styleWeight.weight;

      // Analyze quality if analyzer available
      if (this.analyzer) {
        const analysis = await this.analyzer.analyze(image, {
          includeAesthetic: true
        });
        score *= analysis.aesthetic.score / 10;
      }

      candidates.push({ style: styleWeight.name, image, score });
    }

    // Select best candidate
    candidates.sort((a, b) => b.score - a.score);

    // Optionally blend top candidates
    if (candidates.length > 1 && candidates[0].score < 0.9) {
      const top2 = candidates.slice(0, 2);
      return await this.styleTransfer.blend(prompt, [
        { style: top2[0].style, weight: 0.7 },
        { style: top2[1].style, weight: 0.3 }
      ]);
    }

    return candidates[0].image;
  }

  /**
   * Analyze style characteristics from reference images
   */
  private async analyzeStyleCharacteristics(
    images: string[]
  ): Promise<StyleDefinition['characteristics']> {
    const characteristics: StyleDefinition['characteristics'] = {
      colorPalette: [],
      brushwork: 'mixed',
      mood: 'neutral'
    };

    if (!this.analyzer) {
      return characteristics;
    }

    // Analyze each reference image
    const analyses = [];
    for (const imagePath of images) {
      const imageBuffer = fs.readFileSync(imagePath);
      const analysis = await this.analyzer.analyze(imageBuffer, {
        includeStyle: true,
        includeColors: true
      });
      analyses.push(analysis);
    }

    // Extract common characteristics
    if (analyses.length > 0) {
      // Most common style
      const styles = analyses.map(a => a.style.primary);
      characteristics.movement = this.mostCommon(styles);

      // Aggregate color palettes
      const allColors = analyses.flatMap(a => a.colors.palette);
      characteristics.colorPalette = this.mostCommonColors(allColors, 5);

      // Average mood
      const moods = analyses.map(a => a.colors.mood);
      characteristics.mood = this.mostCommon(moods);
    }

    return characteristics;
  }

  /**
   * Train custom style model
   */
  private async trainCustomStyle(
    style: StyleDefinition,
    images: string[]
  ): Promise<void> {
    // Train style transfer model on reference images
    await this.styleTransfer.trainStyle({
      name: style.name,
      images: images,
      params: style.transferParams
    });
  }

  /**
   * Validate style weights
   */
  private validateStyles(styles: StyleWeight[]): void {
    if (styles.length === 0) {
      throw new Error('At least one style is required');
    }

    for (const style of styles) {
      if (!this.styles.has(style.name)) {
        throw new Error(`Unknown style: ${style.name}`);
      }

      if (style.weight < 0 || style.weight > 1) {
        throw new Error(`Invalid weight for ${style.name}: ${style.weight}`);
      }
    }
  }

  /**
   * Normalize style weights to sum to 1.0
   */
  private normalizeWeights(styles: StyleWeight[]): StyleWeight[] {
    const total = styles.reduce((sum, s) => sum + s.weight, 0);

    if (total === 0) {
      throw new Error('Total weight cannot be zero');
    }

    return styles.map(s => ({
      ...s,
      weight: s.weight / total
    }));
  }

  /**
   * Apply constraints to weights
   */
  private applyConstraints(
    weights: StyleWeight[],
    constraints: NonNullable<BlendConfig['constraints']>
  ): StyleWeight[] {
    let result = [...weights];

    // Limit number of styles
    if (constraints.maxStyles && result.length > constraints.maxStyles) {
      result.sort((a, b) => b.weight - a.weight);
      result = result.slice(0, constraints.maxStyles);
      result = this.normalizeWeights(result);
    }

    // Apply minimum weight threshold
    if (constraints.minWeight) {
      result = result.filter(w => w.weight >= constraints.minWeight);
      if (result.length > 0) {
        result = this.normalizeWeights(result);
      } else {
        throw new Error('No styles meet minimum weight threshold');
      }
    }

    return result;
  }

  /**
   * Generate weight variations for optimization
   */
  private generateWeightVariations(
    weights: StyleWeight[],
    count: number
  ): StyleWeight[][] {
    const variations: StyleWeight[][] = [];

    for (let i = 0; i < count; i++) {
      const variation = weights.map(w => ({
        ...w,
        weight: Math.max(0, Math.min(1, w.weight + (Math.random() - 0.5) * 0.2))
      }));

      variations.push(this.normalizeWeights(variation));
    }

    return variations;
  }

  /**
   * Refine weights based on optimization results
   */
  private refineWeights(
    weights: StyleWeight[],
    currentScore: number,
    targetScore: number
  ): StyleWeight[] {
    // Simple gradient-based refinement
    const gap = targetScore - currentScore;
    const adjustment = gap / targetScore * 0.1;

    return weights.map(w => ({
      ...w,
      weight: Math.max(0, Math.min(1, w.weight * (1 + adjustment)))
    }));
  }

  /**
   * Adjust weights based on content
   */
  private async adjustWeightsForContent(
    prompt: string,
    weights: StyleWeight[]
  ): Promise<StyleWeight[]> {
    // Analyze prompt to determine suitable style emphasis
    const promptLower = prompt.toLowerCase();

    const adjustments = new Map<string, number>();

    // Keyword-based adjustments (simplified example)
    if (promptLower.includes('portrait') || promptLower.includes('person')) {
      adjustments.set('renaissance', 1.2);
      adjustments.set('photorealistic', 1.3);
    }

    if (promptLower.includes('landscape') || promptLower.includes('nature')) {
      adjustments.set('impressionist', 1.3);
      adjustments.set('hudson-river-school', 1.2);
    }

    if (promptLower.includes('abstract') || promptLower.includes('surreal')) {
      adjustments.set('abstract-expressionism', 1.3);
      adjustments.set('surrealist', 1.2);
    }

    // Apply adjustments
    const adjusted = weights.map(w => ({
      ...w,
      weight: w.weight * (adjustments.get(w.name) || 1.0)
    }));

    return this.normalizeWeights(adjusted);
  }

  /**
   * Calculate interpolation weight with easing
   */
  private calculateInterpolationWeight(
    t: number,
    config: InterpolationConfig
  ): number {
    let weight: number;

    switch (config.method) {
      case 'linear':
        weight = t;
        break;

      case 'spherical':
        // Spherical linear interpolation (slerp)
        weight = Math.sin(t * Math.PI / 2);
        break;

      case 'cosine':
        weight = (1 - Math.cos(t * Math.PI)) / 2;
        break;

      default:
        weight = t;
    }

    // Apply easing if specified
    if (config.easing) {
      weight = this.applyEasing(weight, config.easing);
    }

    return weight;
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }

  /**
   * Calculate style contributions
   */
  private calculateContributions(weights: StyleWeight[]): Map<string, number> {
    const contributions = new Map<string, number>();

    for (const weight of weights) {
      contributions.set(weight.name, weight.weight);
    }

    return contributions;
  }

  /**
   * Calculate color palette compatibility
   */
  private calculateColorCompatibility(palette1: string[], palette2: string[]): number {
    let matches = 0;
    const maxLen = Math.max(palette1.length, palette2.length);

    for (const color of palette1) {
      if (palette2.includes(color)) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Calculate era distance
   */
  private eraDistance(era1: string, era2: string): number {
    const eraMap: Record<string, number> = {
      'ancient': 0,
      'medieval': 500,
      'renaissance': 1500,
      'baroque': 1600,
      'neoclassical': 1750,
      'romantic': 1800,
      'impressionist': 1870,
      'modern': 1900,
      'contemporary': 1970,
      'digital': 2000
    };

    const year1 = eraMap[era1.toLowerCase()] || 2000;
    const year2 = eraMap[era2.toLowerCase()] || 2000;

    return Math.abs(year1 - year2);
  }

  /**
   * Check if moods conflict
   */
  private moodsConflict(mood1: string, mood2: string): boolean {
    const conflicts: Record<string, string[]> = {
      'happy': ['melancholy', 'dark', 'somber'],
      'peaceful': ['chaotic', 'aggressive', 'intense'],
      'bright': ['dark', 'moody'],
      'energetic': ['calm', 'peaceful', 'serene']
    };

    const conflictList = conflicts[mood1.toLowerCase()] || [];
    return conflictList.includes(mood2.toLowerCase());
  }

  /**
   * Find most common element in array
   */
  private mostCommon<T>(array: T[]): T {
    const counts = new Map<T, number>();

    for (const item of array) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let maxCount = 0;
    let mostCommon = array[0];

    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  /**
   * Find most common colors
   */
  private mostCommonColors(colors: string[], count: number): string[] {
    const counts = new Map<string, number>();

    for (const color of colors) {
      counts.set(color, (counts.get(color) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([color]) => color);
  }

  /**
   * Generate cache key for blend config
   */
  private generateCacheKey(config: BlendConfig): string {
    const data = JSON.stringify({
      prompt: config.prompt,
      styles: config.styles.map(s => ({ name: s.name, weight: s.weight })),
      blendMode: config.blendMode
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Load built-in styles
   */
  private loadBuiltInStyles(): void {
    const builtInStyles: StyleDefinition[] = [
      {
        name: 'impressionist',
        category: 'classical',
        description: 'Impressionist style with visible brushstrokes and light effects',
        characteristics: {
          colorPalette: ['#FFD700', '#87CEEB', '#90EE90', '#FFB6C1'],
          brushwork: 'visible',
          mood: 'peaceful',
          era: 'impressionist',
          movement: 'Impressionism'
        },
        transferParams: {
          method: 'vgg',
          layers: ['conv1_1', 'conv2_1', 'conv3_1'],
          weights: [1.0, 0.8, 0.6]
        },
        created: Date.now()
      },
      {
        name: 'abstract-expressionism',
        category: 'modern',
        description: 'Abstract expressionist style with bold colors and gestural marks',
        characteristics: {
          colorPalette: ['#FF0000', '#0000FF', '#FFFF00', '#000000'],
          brushwork: 'expressive',
          mood: 'energetic',
          era: 'modern',
          movement: 'Abstract Expressionism'
        },
        transferParams: {
          method: 'adain',
          iterations: 50
        },
        created: Date.now()
      },
      {
        name: 'cyberpunk',
        category: 'contemporary',
        description: 'Futuristic cyberpunk aesthetic with neon colors',
        characteristics: {
          colorPalette: ['#FF00FF', '#00FFFF', '#FF0080', '#8000FF'],
          mood: 'intense',
          era: 'digital'
        },
        transferParams: {
          method: 'adain'
        },
        created: Date.now()
      }
    ];

    for (const style of builtInStyles) {
      this.styles.set(style.name, style);
    }
  }

  /**
   * Load custom styles from storage
   */
  private loadCustomStyles(): void {
    const customStylesPath = path.join(this.libraryPath, 'custom');

    if (!fs.existsSync(customStylesPath)) {
      fs.mkdirSync(customStylesPath, { recursive: true });
      return;
    }

    const files = fs.readdirSync(customStylesPath);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(customStylesPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const style: StyleDefinition = JSON.parse(content);
        this.styles.set(style.name, style);
      }
    }
  }

  /**
   * Save style definition
   */
  private async saveStyle(style: StyleDefinition): Promise<void> {
    const customStylesPath = path.join(this.libraryPath, 'custom');

    if (!fs.existsSync(customStylesPath)) {
      fs.mkdirSync(customStylesPath, { recursive: true });
    }

    const filePath = path.join(customStylesPath, `${style.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(style, null, 2));
  }
}

export default StyleMixer;
