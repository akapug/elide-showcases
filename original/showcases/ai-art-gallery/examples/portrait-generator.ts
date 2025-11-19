/**
 * Portrait Generator Example
 *
 * Demonstrates AI portrait generation using Stable Diffusion with advanced
 * features like lighting control, pose variation, and style application.
 *
 * Shows the power of Elide's polyglot runtime by seamlessly calling Python
 * AI models from TypeScript with zero overhead.
 *
 * @module portrait-generator
 */

import { StableDiffusion } from '../python/stable_diffusion.py';
import { StyleTransfer } from '../python/style_transfer.py';
import { ImageEnhancement } from '../python/image_enhancement.py';
import { ArtAnalyzer } from '../python/art_analyzer.py';
import { PromptEngine } from '../src/generation/prompt-engine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Portrait configuration
 */
export interface PortraitConfig {
  subject: string;
  style?: string;
  lighting?: 'rembrandt' | 'butterfly' | 'loop' | 'split' | 'broad' | 'short' | 'natural';
  mood?: string;
  details?: string[];
  background?: string;
  enhancement?: boolean;
  upscale?: number;
}

/**
 * Portrait generation result
 */
export interface PortraitResult {
  image: Buffer;
  metadata: {
    prompt: string;
    style: string;
    lighting: string;
    generationTime: number;
    aestheticScore?: number;
  };
}

/**
 * Portrait Generator
 */
export class PortraitGenerator {
  private stableDiffusion: any;
  private styleTransfer: any;
  private enhancement: any;
  private analyzer: any;
  private promptEngine: PromptEngine;
  private outputDir: string;

  constructor(config: {
    device?: string;
    outputDir?: string;
  } = {}) {
    this.outputDir = config.outputDir || './output/portraits';

    // Initialize AI models (Python running in same process via Elide!)
    this.stableDiffusion = new StableDiffusion({
      model: 'stabilityai/stable-diffusion-2-1',
      device: config.device || 'cuda:0',
      precision: 'fp16'
    });

    this.styleTransfer = new StyleTransfer({
      device: config.device || 'cuda:0',
      models: ['vgg19', 'adain']
    });

    this.enhancement = new ImageEnhancement({
      device: config.device || 'cuda:0',
      models: ['esrgan', 'deoldify']
    });

    this.analyzer = new ArtAnalyzer({
      device: config.device || 'cuda:0'
    });

    this.promptEngine = new PromptEngine({
      modelType: 'stable-diffusion'
    });

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Initialize all models
   */
  async initialize(): Promise<void> {
    console.log('🎨 Initializing Portrait Generator...\n');

    await this.stableDiffusion.load();
    await this.styleTransfer.load();
    await this.enhancement.load();
    await this.analyzer.load();

    console.log('\n✓ Portrait Generator ready\n');
  }

  /**
   * Generate portrait
   */
  async generate(config: PortraitConfig): Promise<PortraitResult> {
    const startTime = Date.now();

    console.log(`Generating portrait: ${config.subject}`);
    console.log('─'.repeat(60));

    // Build comprehensive prompt
    const prompt = this.buildPrompt(config);
    console.log(`Prompt: ${prompt}\n`);

    // Generate negative prompt
    const negativePrompt = this.buildNegativePrompt();

    // Generate base portrait
    console.log('Stage 1/5: Generating base portrait...');
    let image = await this.stableDiffusion.generate({
      prompt,
      negative_prompt: negativePrompt,
      width: 768,
      height: 1024,  // Portrait aspect ratio
      num_inference_steps: 50,
      guidance_scale: 7.5,
      seed: Math.floor(Math.random() * 1000000)
    });

    // Apply style if specified
    if (config.style && config.style !== 'photorealistic') {
      console.log(`Stage 2/5: Applying ${config.style} style...`);
      image = await this.styleTransfer.apply(image, config.style, {
        intensity: 0.7,
        method: 'adain'
      });
    } else {
      console.log('Stage 2/5: Skipped (photorealistic)');
    }

    // Enhance details
    if (config.enhancement) {
      console.log('Stage 3/5: Enhancing details...');
      image = await this.enhancement.denoise(image, 0.3);
      image = await this.enhancement.sharpen(image, 0.5);
    } else {
      console.log('Stage 3/5: Skipped');
    }

    // Upscale if requested
    if (config.upscale && config.upscale > 1) {
      console.log(`Stage 4/5: Upscaling ${config.upscale}x...`);
      image = await this.enhancement.upscale(image, {
        method: 'esrgan',
        factor: config.upscale,
        preset: 'quality'
      });
    } else {
      console.log('Stage 4/5: Skipped');
    }

    // Analyze result
    console.log('Stage 5/5: Analyzing result...');
    const analysis = await this.analyzer.analyze(image, {
      includeAesthetic: true,
      includeStyle: true,
      includeComposition: true
    });

    const generationTime = Date.now() - startTime;

    console.log('\n' + '─'.repeat(60));
    console.log(`✓ Portrait generated in ${(generationTime / 1000).toFixed(2)}s`);
    console.log(`  Aesthetic Score: ${analysis.aesthetic.score.toFixed(2)}/10`);
    console.log(`  Detected Style: ${analysis.style.primary}`);
    console.log(`  Composition: ${analysis.composition.ruleOfThirds.toFixed(2)}`);

    // Save
    const filename = this.savePortrait(image, config);
    console.log(`  Saved: ${filename}\n`);

    return {
      image,
      metadata: {
        prompt,
        style: config.style || 'photorealistic',
        lighting: config.lighting || 'natural',
        generationTime,
        aestheticScore: analysis.aesthetic.score
      }
    };
  }

  /**
   * Generate portrait variations
   */
  async generateVariations(
    baseConfig: PortraitConfig,
    count: number = 4,
    variationType: 'lighting' | 'style' | 'mood' | 'pose' = 'style'
  ): Promise<PortraitResult[]> {
    console.log(`\nGenerating ${count} variations (${variationType})...\n`);

    const results: PortraitResult[] = [];

    for (let i = 0; i < count; i++) {
      const variantConfig = this.createVariant(baseConfig, variationType, i);

      console.log(`\nVariation ${i + 1}/${count}`);
      const result = await this.generate(variantConfig);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate portrait series with progression
   */
  async generateSeries(
    subject: string,
    progression: 'age' | 'mood' | 'style',
    steps: number = 5
  ): Promise<PortraitResult[]> {
    console.log(`\nGenerating ${subject} series (${progression})...\n`);

    const results: PortraitResult[] = [];

    for (let i = 0; i < steps; i++) {
      const config = this.createProgressionConfig(subject, progression, i, steps);

      console.log(`\nStep ${i + 1}/${steps}: ${config.mood || config.style}`);
      const result = await this.generate(config);
      results.push(result);
    }

    return results;
  }

  /**
   * Enhance existing portrait
   */
  async enhance(
    image: Buffer,
    operations: Array<'denoise' | 'sharpen' | 'upscale' | 'restore_face' | 'hdr'>
  ): Promise<Buffer> {
    let enhanced = image;

    for (const operation of operations) {
      console.log(`Applying ${operation}...`);

      switch (operation) {
        case 'denoise':
          enhanced = await this.enhancement.denoise(enhanced, 0.5);
          break;

        case 'sharpen':
          enhanced = await this.enhancement.sharpen(enhanced, 0.6);
          break;

        case 'upscale':
          enhanced = await this.enhancement.upscale(enhanced, {
            method: 'esrgan',
            factor: 4,
            preset: 'quality'
          });
          break;

        case 'restore_face':
          enhanced = await this.enhancement.restore_face(enhanced);
          break;

        case 'hdr':
          enhanced = await this.enhancement.enhance_hdr(enhanced);
          break;
      }
    }

    return enhanced;
  }

  /**
   * Build comprehensive prompt
   */
  private buildPrompt(config: PortraitConfig): string {
    const parts: string[] = [];

    // Subject
    parts.push(`portrait of ${config.subject}`);

    // Lighting
    if (config.lighting) {
      const lightingDescriptions: Record<string, string> = {
        'rembrandt': 'Rembrandt lighting, dramatic side light with triangle on cheek',
        'butterfly': 'butterfly lighting, light from above creating shadow under nose',
        'loop': 'loop lighting, slight shadow on one side',
        'split': 'split lighting, half face lit, half in shadow',
        'broad': 'broad lighting, wide side illuminated',
        'short': 'short lighting, narrow side illuminated',
        'natural': 'natural lighting, soft and even'
      };

      parts.push(lightingDescriptions[config.lighting]);
    }

    // Mood
    if (config.mood) {
      parts.push(config.mood);
    }

    // Details
    if (config.details && config.details.length > 0) {
      parts.push(...config.details);
    }

    // Background
    if (config.background) {
      parts.push(`background: ${config.background}`);
    }

    // Style-specific modifiers
    const style = config.style || 'photorealistic';
    const styleModifiers: Record<string, string[]> = {
      'photorealistic': ['highly detailed', 'professional photography', 'sharp focus', '8k'],
      'renaissance': ['oil painting', 'classical art', 'chiaroscuro', 'masterpiece'],
      'impressionist': ['impressionist style', 'visible brushstrokes', 'soft colors'],
      'anime': ['anime style', 'cel shaded', 'detailed eyes', 'vibrant colors'],
      'digital-art': ['digital painting', 'concept art', 'trending on artstation']
    };

    if (styleModifiers[style]) {
      parts.push(...styleModifiers[style]);
    }

    // Quality modifiers
    parts.push('high quality', 'professional', 'masterpiece');

    return parts.join(', ');
  }

  /**
   * Build negative prompt
   */
  private buildNegativePrompt(): string {
    return [
      'low quality',
      'blurry',
      'distorted',
      'disfigured',
      'bad anatomy',
      'bad proportions',
      'extra limbs',
      'missing limbs',
      'deformed',
      'ugly',
      'duplicate',
      'mutated',
      'watermark',
      'signature',
      'text'
    ].join(', ');
  }

  /**
   * Create variant configuration
   */
  private createVariant(
    base: PortraitConfig,
    type: string,
    index: number
  ): PortraitConfig {
    const variant = { ...base };

    switch (type) {
      case 'lighting':
        const lightings: PortraitConfig['lighting'][] = ['rembrandt', 'butterfly', 'loop', 'split'];
        variant.lighting = lightings[index % lightings.length];
        break;

      case 'style':
        const styles = ['photorealistic', 'renaissance', 'impressionist', 'digital-art'];
        variant.style = styles[index % styles.length];
        break;

      case 'mood':
        const moods = ['contemplative', 'joyful', 'mysterious', 'serene'];
        variant.mood = moods[index % moods.length];
        break;

      case 'pose':
        const poses = ['front view', 'three-quarter view', 'profile view', 'looking away'];
        variant.details = [poses[index % poses.length]];
        break;
    }

    return variant;
  }

  /**
   * Create progression configuration
   */
  private createProgressionConfig(
    subject: string,
    type: string,
    step: number,
    totalSteps: number
  ): PortraitConfig {
    const config: PortraitConfig = {
      subject,
      enhancement: true
    };

    switch (type) {
      case 'age':
        const ages = ['young child', 'teenager', 'young adult', 'middle-aged', 'elderly'];
        const ageIndex = Math.floor((step / totalSteps) * ages.length);
        config.subject = `${ages[Math.min(ageIndex, ages.length - 1)]} ${subject}`;
        break;

      case 'mood':
        const moods = ['joyful', 'content', 'neutral', 'contemplative', 'melancholic'];
        config.mood = moods[Math.min(step, moods.length - 1)];
        break;

      case 'style':
        const styles = ['photorealistic', 'impressionist', 'renaissance', 'digital-art', 'anime'];
        config.style = styles[Math.min(step, styles.length - 1)];
        break;
    }

    return config;
  }

  /**
   * Save portrait to disk
   */
  private savePortrait(image: Buffer, config: PortraitConfig): string {
    const timestamp = Date.now();
    const subject = config.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const style = (config.style || 'photorealistic').replace(/[^a-z0-9]/gi, '_');

    const filename = `portrait_${subject}_${style}_${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, image);

    return filepath;
  }
}

/**
 * Example usage
 */
async function main() {
  const generator = new PortraitGenerator({
    device: 'cuda:0',
    outputDir: './output/portraits'
  });

  await generator.initialize();

  // Example 1: Single portrait
  console.log('━'.repeat(60));
  console.log('EXAMPLE 1: RENAISSANCE PORTRAIT');
  console.log('━'.repeat(60));

  await generator.generate({
    subject: 'a wise philosopher',
    style: 'renaissance',
    lighting: 'rembrandt',
    mood: 'contemplative',
    details: ['flowing beard', 'ornate robes', 'holding ancient book'],
    background: 'library with candlelight',
    enhancement: true,
    upscale: 2
  });

  // Example 2: Variations
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 2: LIGHTING VARIATIONS');
  console.log('━'.repeat(60));

  await generator.generateVariations(
    {
      subject: 'a young woman',
      style: 'photorealistic',
      details: ['elegant', 'professional headshot']
    },
    4,
    'lighting'
  );

  // Example 3: Age progression
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 3: AGE PROGRESSION');
  console.log('━'.repeat(60));

  await generator.generateSeries('person', 'age', 5);

  console.log('\n✓ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default PortraitGenerator;
