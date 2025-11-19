/**
 * Landscape Generator Example
 *
 * Advanced landscape art generation with control over scene composition,
 * weather, time of day, and artistic style.
 *
 * Demonstrates Elide's seamless Python/TypeScript integration for AI art.
 *
 * @module landscape-generator
 */

import { StableDiffusion } from '../python/stable_diffusion.py';
import { StyleTransfer } from '../python/style_transfer.py';
import { ImageEnhancement } from '../python/image_enhancement.py';
import { ArtAnalyzer } from '../python/art_analyzer.py';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Landscape configuration
 */
export interface LandscapeConfig {
  scene: 'mountain' | 'ocean' | 'forest' | 'desert' | 'valley' | 'lake' | 'river' | 'canyon' | 'plains';
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'golden-hour' | 'sunset' | 'dusk' | 'night' | 'blue-hour';
  weather: 'clear' | 'partly-cloudy' | 'overcast' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  style?: 'photorealistic' | 'impressionist' | 'hudson-river-school' | 'romanticism' | 'minimalist' | 'fantasy';
  features?: string[];
  mood?: string;
  enhancement?: boolean;
}

/**
 * Landscape Generator
 */
export class LandscapeGenerator {
  private stableDiffusion: any;
  private styleTransfer: any;
  private enhancement: any;
  private analyzer: any;
  private outputDir: string;

  constructor(config: { device?: string; outputDir?: string } = {}) {
    this.outputDir = config.outputDir || './output/landscapes';

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
      device: config.device || 'cuda:0'
    });

    this.analyzer = new ArtAnalyzer({
      device: config.device || 'cuda:0'
    });

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    console.log('🏔️  Initializing Landscape Generator...\n');

    await this.stableDiffusion.load();
    await this.styleTransfer.load();
    await this.enhancement.load();
    await this.analyzer.load();

    console.log('✓ Landscape Generator ready\n');
  }

  /**
   * Generate landscape
   */
  async generate(config: LandscapeConfig): Promise<Buffer> {
    console.log(`Generating: ${config.scene} at ${config.timeOfDay}`);
    console.log('─'.repeat(60));

    const prompt = this.buildPrompt(config);
    console.log(`Prompt: ${prompt}\n`);

    // Generate
    let image = await this.stableDiffusion.generate({
      prompt,
      negative_prompt: this.buildNegativePrompt(),
      width: 1024,
      height: 768,  // Landscape aspect ratio
      num_inference_steps: 50,
      guidance_scale: 7.5
    });

    // Apply artistic style
    if (config.style && config.style !== 'photorealistic') {
      console.log(`Applying ${config.style} style...`);
      image = await this.styleTransfer.apply(image, config.style, {
        intensity: 0.8,
        method: 'adain'
      });
    }

    // Enhance
    if (config.enhancement) {
      console.log('Enhancing landscape...');
      image = await this.enhancement.enhance_hdr(image);
      image = await this.enhancement.sharpen(image, 0.4);
    }

    // Analyze
    const analysis = await this.analyzer.analyze(image, {
      includeAesthetic: true,
      includeComposition: true,
      includeColors: true
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`✓ Landscape generated`);
    console.log(`  Aesthetic: ${analysis.aesthetic.score.toFixed(2)}/10`);
    console.log(`  Composition: ${analysis.composition.balance.toFixed(2)}`);
    console.log(`  Dominant Colors: ${analysis.colors.dominant.slice(0, 3).join(', ')}`);

    const filename = this.saveLandscape(image, config);
    console.log(`  Saved: ${filename}\n`);

    return image;
  }

  /**
   * Generate panoramic landscape
   */
  async generatePanoramic(config: LandscapeConfig): Promise<Buffer> {
    console.log('Generating panoramic landscape...');

    const panoramicPrompt = this.buildPrompt(config) + ', panoramic view, ultra wide angle, expansive vista';

    const image = await this.stableDiffusion.generate({
      prompt: panoramicPrompt,
      width: 1920,
      height: 512,  // Panoramic aspect ratio
      num_inference_steps: 60,
      guidance_scale: 8.0
    });

    return image;
  }

  /**
   * Generate landscape series through day cycle
   */
  async generateDayCycle(config: Omit<LandscapeConfig, 'timeOfDay'>): Promise<Buffer[]> {
    const times: LandscapeConfig['timeOfDay'][] = [
      'dawn',
      'morning',
      'noon',
      'golden-hour',
      'sunset',
      'dusk',
      'night'
    ];

    const results: Buffer[] = [];

    console.log('\nGenerating day cycle...\n');

    for (const time of times) {
      console.log(`\nTime: ${time}`);
      const image = await this.generate({
        ...config,
        timeOfDay: time
      });
      results.push(image);
    }

    return results;
  }

  /**
   * Generate seasonal variations
   */
  async generateSeasons(
    config: Omit<LandscapeConfig, 'season'>
  ): Promise<Map<string, Buffer>> {
    const seasons: LandscapeConfig['season'][] = ['spring', 'summer', 'autumn', 'winter'];
    const results = new Map<string, Buffer>();

    console.log('\nGenerating seasonal variations...\n');

    for (const season of seasons) {
      console.log(`\nSeason: ${season}`);
      const image = await this.generate({
        ...config,
        season
      });
      results.set(season, image);
    }

    return results;
  }

  /**
   * Generate weather variations
   */
  async generateWeatherVariations(
    config: Omit<LandscapeConfig, 'weather'>
  ): Promise<Buffer[]> {
    const weatherConditions: LandscapeConfig['weather'][] = [
      'clear',
      'partly-cloudy',
      'overcast',
      'rainy',
      'stormy',
      'foggy'
    ];

    const results: Buffer[] = [];

    console.log('\nGenerating weather variations...\n');

    for (const weather of weatherConditions) {
      console.log(`\nWeather: ${weather}`);
      const image = await this.generate({
        ...config,
        weather
      });
      results.push(image);
    }

    return results;
  }

  /**
   * Generate landscape variations
   */
  async variations(
    baseImage: Buffer,
    count: number = 4,
    strength: number = 0.5
  ): Promise<Buffer[]> {
    console.log(`\nGenerating ${count} variations...\n`);

    const variations: Buffer[] = [];

    for (let i = 0; i < count; i++) {
      console.log(`Variation ${i + 1}/${count}...`);

      const variation = await this.stableDiffusion.img2img({
        init_image: baseImage,
        prompt: 'beautiful landscape, high quality',
        strength: strength,
        num_inference_steps: 30
      });

      variations.push(variation);
    }

    return variations;
  }

  /**
   * Build landscape prompt
   */
  private buildPrompt(config: LandscapeConfig): string {
    const parts: string[] = [];

    // Scene description
    const sceneDescriptions: Record<string, string> = {
      'mountain': 'majestic mountain landscape',
      'ocean': 'vast ocean seascape',
      'forest': 'lush forest landscape',
      'desert': 'expansive desert vista',
      'valley': 'serene valley landscape',
      'lake': 'tranquil lake scene',
      'river': 'winding river landscape',
      'canyon': 'dramatic canyon vista',
      'plains': 'rolling plains landscape'
    };

    parts.push(sceneDescriptions[config.scene]);

    // Time of day lighting
    const timeDescriptions: Record<string, string> = {
      'dawn': 'early morning dawn, soft pink and purple sky',
      'morning': 'bright morning light, clear sky',
      'noon': 'midday sun, high contrast',
      'golden-hour': 'golden hour, warm glowing light',
      'sunset': 'dramatic sunset, orange and red sky',
      'dusk': 'twilight dusk, deep blue hour',
      'night': 'starry night sky, moonlit',
      'blue-hour': 'blue hour, soft ethereal light'
    };

    parts.push(timeDescriptions[config.timeOfDay]);

    // Weather
    const weatherDescriptions: Record<string, string> = {
      'clear': 'clear sky',
      'partly-cloudy': 'scattered clouds',
      'overcast': 'overcast sky, diffused light',
      'rainy': 'rain, wet atmosphere',
      'stormy': 'dramatic storm clouds, lightning',
      'foggy': 'misty fog, atmospheric',
      'snowy': 'falling snow, winter atmosphere'
    };

    parts.push(weatherDescriptions[config.weather]);

    // Season
    const seasonalElements: Record<string, string> = {
      'spring': 'spring flowers, fresh green foliage',
      'summer': 'lush summer vegetation, vibrant',
      'autumn': 'autumn colors, golden and red foliage',
      'winter': 'winter snow, bare trees'
    };

    parts.push(seasonalElements[config.season]);

    // Features
    if (config.features && config.features.length > 0) {
      parts.push(...config.features);
    }

    // Mood
    if (config.mood) {
      parts.push(config.mood);
    }

    // Style-specific additions
    const style = config.style || 'photorealistic';
    const styleModifiers: Record<string, string[]> = {
      'photorealistic': ['highly detailed', 'professional photography', 'sharp focus', '8k uhd'],
      'impressionist': ['impressionist painting', 'visible brushstrokes', 'soft colors', 'plein air'],
      'hudson-river-school': ['Hudson River School style', 'romantic landscape', 'dramatic lighting', 'detailed nature'],
      'romanticism': ['romantic style', 'dramatic atmosphere', 'sublime nature', 'emotional'],
      'minimalist': ['minimalist composition', 'clean lines', 'simple', 'serene'],
      'fantasy': ['fantasy landscape', 'magical atmosphere', 'otherworldly', 'ethereal']
    };

    if (styleModifiers[style]) {
      parts.push(...styleModifiers[style]);
    }

    // Quality
    parts.push('masterpiece', 'high quality', 'professional', 'stunning vista');

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
      'people',
      'person',
      'buildings',
      'urban',
      'text',
      'watermark',
      'signature',
      'ugly',
      'deformed'
    ].join(', ');
  }

  /**
   * Save landscape
   */
  private saveLandscape(image: Buffer, config: LandscapeConfig): string {
    const timestamp = Date.now();
    const scene = config.scene;
    const time = config.timeOfDay;
    const weather = config.weather;

    const filename = `landscape_${scene}_${time}_${weather}_${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, image);

    return filepath;
  }
}

/**
 * Example usage
 */
async function main() {
  const generator = new LandscapeGenerator({
    device: 'cuda:0',
    outputDir: './output/landscapes'
  });

  await generator.initialize();

  // Example 1: Mountain sunset
  console.log('━'.repeat(60));
  console.log('EXAMPLE 1: MOUNTAIN SUNSET');
  console.log('━'.repeat(60));

  await generator.generate({
    scene: 'mountain',
    timeOfDay: 'sunset',
    weather: 'partly-cloudy',
    season: 'autumn',
    style: 'hudson-river-school',
    features: ['snow-capped peaks', 'alpine meadow', 'dramatic clouds'],
    mood: 'majestic and serene',
    enhancement: true
  });

  // Example 2: Day cycle
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 2: OCEAN DAY CYCLE');
  console.log('━'.repeat(60));

  await generator.generateDayCycle({
    scene: 'ocean',
    weather: 'clear',
    season: 'summer',
    style: 'impressionist',
    features: ['rocky coastline', 'waves crashing']
  });

  // Example 3: Seasonal forest
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 3: FOREST SEASONS');
  console.log('━'.repeat(60));

  await generator.generateSeasons({
    scene: 'forest',
    timeOfDay: 'morning',
    weather: 'clear',
    style: 'photorealistic',
    features: ['sunlight filtering through trees', 'forest path']
  });

  console.log('\n✓ All examples completed!\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default LandscapeGenerator;
