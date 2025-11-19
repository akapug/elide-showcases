/**
 * Abstract Art Generator Example
 *
 * Creates abstract artwork using multiple AI models with advanced composition,
 * color theory, and style blending techniques.
 *
 * @module abstract-art
 */

import { GANGenerator } from '../python/gan_generator.py';
import { StyleTransfer } from '../python/style_transfer.py';
import { ArtAnalyzer } from '../python/art_analyzer.py';
import { StyleMixer } from '../src/gallery/style-mixer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Abstract art configuration
 */
export interface AbstractConfig {
  movement: 'abstract-expressionism' | 'cubism' | 'suprematism' | 'minimalism' | 'geometric' | 'fluid';
  colorPalette: 'vibrant' | 'pastel' | 'monochrome' | 'earth-tones' | 'neon' | 'complementary';
  complexity: number; // 0-1
  energy: 'static' | 'calm' | 'dynamic' | 'chaotic';
  composition: 'balanced' | 'asymmetric' | 'centered' | 'rule-of-thirds' | 'golden-ratio';
  elements?: string[];
}

/**
 * Abstract Art Generator
 */
export class AbstractArtGenerator {
  private ganGenerator: any;
  private styleTransfer: any;
  private analyzer: any;
  private styleMixer: StyleMixer;
  private outputDir: string;

  constructor(config: { device?: string; outputDir?: string } = {}) {
    this.outputDir = config.outputDir || './output/abstract';

    this.ganGenerator = new GANGenerator({
      model: 'stylegan2-art',
      device: config.device || 'cuda:0',
      resolution: 1024
    });

    this.styleTransfer = new StyleTransfer({
      device: config.device || 'cuda:0',
      models: ['vgg19', 'adain']
    });

    this.analyzer = new ArtAnalyzer({
      device: config.device || 'cuda:0'
    });

    this.styleMixer = new StyleMixer({
      styleTransfer: this.styleTransfer,
      analyzer: this.analyzer
    });

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    console.log('🎨 Initializing Abstract Art Generator...\n');

    await this.ganGenerator.load();
    await this.styleTransfer.load();
    await this.analyzer.load();

    console.log('✓ Abstract Art Generator ready\n');
  }

  /**
   * Generate abstract artwork
   */
  async generate(config: AbstractConfig): Promise<Buffer> {
    console.log(`Generating: ${config.movement} abstract art`);
    console.log('─'.repeat(60));

    // Generate base using GAN
    console.log('Stage 1: Generating base composition...');
    const latent = this.createLatentFromConfig(config);
    let image = await this.ganGenerator.generate(
      latent,
      0.7  // Truncation for quality
    );

    // Apply movement-specific style
    console.log(`Stage 2: Applying ${config.movement} style...`);
    image = await this.applyMovementStyle(image, config);

    // Adjust colors for palette
    console.log(`Stage 3: Adjusting color palette (${config.colorPalette})...`);
    image = await this.adjustColorPalette(image, config.colorPalette);

    // Analyze
    const analysis = await this.analyzer.analyze(image, {
      includeAesthetic: true,
      includeComposition: true,
      includeColors: true
    });

    console.log('\n' + '─'.repeat(60));
    console.log('✓ Abstract artwork generated');
    console.log(`  Aesthetic: ${analysis.aesthetic.score.toFixed(2)}/10`);
    console.log(`  Balance: ${analysis.composition.balance.toFixed(2)}`);
    console.log(`  Color Mood: ${analysis.colors.mood}`);

    const filename = this.saveArtwork(image, config);
    console.log(`  Saved: ${filename}\n`);

    return image;
  }

  /**
   * Apply style transfer with reference
   */
  async applyStyle(
    image: Buffer,
    style: string,
    options: {
      intensity?: number;
      preserveStructure?: boolean;
    } = {}
  ): Promise<Buffer> {
    return await this.styleTransfer.apply(image, style, {
      intensity: options.intensity || 0.7,
      method: options.preserveStructure ? 'vgg' : 'adain'
    });
  }

  /**
   * Create abstract composition series
   */
  async generateSeries(
    baseConfig: AbstractConfig,
    variations: 'color' | 'complexity' | 'energy' | 'composition',
    count: number = 5
  ): Promise<Buffer[]> {
    console.log(`\nGenerating series with ${variations} variations...\n`);

    const results: Buffer[] = [];

    for (let i = 0; i < count; i++) {
      const variantConfig = this.createVariation(baseConfig, variations, i, count);

      console.log(`\nVariation ${i + 1}/${count}`);
      const image = await this.generate(variantConfig);
      results.push(image);
    }

    return results;
  }

  /**
   * Generate complementary diptych
   */
  async generateDiptych(config: AbstractConfig): Promise<[Buffer, Buffer]> {
    console.log('\nGenerating complementary diptych...\n');

    // First panel
    console.log('Panel 1:');
    const panel1 = await this.generate(config);

    // Complementary panel (inverted energy and colors)
    console.log('\nPanel 2 (complementary):');
    const complementaryConfig: AbstractConfig = {
      ...config,
      energy: this.invertEnergy(config.energy),
      colorPalette: this.getComplementaryPalette(config.colorPalette),
      composition: config.composition
    };

    const panel2 = await this.generate(complementaryConfig);

    return [panel1, panel2];
  }

  /**
   * Generate triptych
   */
  async generateTriptych(config: AbstractConfig): Promise<[Buffer, Buffer, Buffer]> {
    console.log('\nGenerating triptych...\n');

    const panels: Buffer[] = [];

    // Use progression for energy level
    const energyLevels: AbstractConfig['energy'][] = ['calm', 'dynamic', 'chaotic'];

    for (let i = 0; i < 3; i++) {
      console.log(`\nPanel ${i + 1}/3:`);
      const panelConfig = {
        ...config,
        energy: energyLevels[i]
      };

      const panel = await this.generate(panelConfig);
      panels.push(panel);
    }

    return panels as [Buffer, Buffer, Buffer];
  }

  /**
   * Morph between two abstract styles
   */
  async morphStyles(
    style1: AbstractConfig,
    style2: AbstractConfig,
    steps: number = 10
  ): Promise<Buffer[]> {
    console.log(`\nMorphing between styles (${steps} steps)...\n`);

    const results: Buffer[] = [];

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const morphedConfig = this.interpolateConfigs(style1, style2, t);

      console.log(`Step ${i + 1}/${steps}`);
      const image = await this.generate(morphedConfig);
      results.push(image);
    }

    return results;
  }

  /**
   * Create latent vector from configuration
   */
  private createLatentFromConfig(config: AbstractConfig): any {
    // Generate base latent
    const latent = this.ganGenerator.random_latent(1);

    // Modify based on config
    // In production, would use learned directions

    return latent;
  }

  /**
   * Apply movement-specific artistic style
   */
  private async applyMovementStyle(
    image: Buffer,
    config: AbstractConfig
  ): Promise<Buffer> {
    const styleMap: Record<string, string> = {
      'abstract-expressionism': 'abstract-expressionism',
      'cubism': 'cubist',
      'suprematism': 'geometric',
      'minimalism': 'minimalist',
      'geometric': 'geometric',
      'fluid': 'abstract'
    };

    const style = styleMap[config.movement];

    if (style) {
      return await this.styleTransfer.apply(image, style, {
        intensity: config.complexity,
        method: 'adain'
      });
    }

    return image;
  }

  /**
   * Adjust image for specific color palette
   */
  private async adjustColorPalette(
    image: Buffer,
    palette: string
  ): Promise<Buffer> {
    // In production, would apply color grading
    // For now, use style transfer with color-specific styles

    const paletteStyles: Record<string, string> = {
      'vibrant': 'vibrant-colors',
      'pastel': 'pastel-tones',
      'monochrome': 'monochrome',
      'earth-tones': 'natural-tones',
      'neon': 'neon-colors',
      'complementary': 'high-contrast'
    };

    // Simplified palette adjustment
    return image;
  }

  /**
   * Create variation of configuration
   */
  private createVariation(
    base: AbstractConfig,
    type: string,
    index: number,
    total: number
  ): AbstractConfig {
    const variant = { ...base };
    const t = index / (total - 1);

    switch (type) {
      case 'color':
        const palettes: AbstractConfig['colorPalette'][] = [
          'vibrant',
          'pastel',
          'monochrome',
          'earth-tones',
          'neon'
        ];
        variant.colorPalette = palettes[Math.min(index, palettes.length - 1)];
        break;

      case 'complexity':
        variant.complexity = t;
        break;

      case 'energy':
        const energies: AbstractConfig['energy'][] = ['static', 'calm', 'dynamic', 'chaotic'];
        variant.energy = energies[Math.min(index, energies.length - 1)];
        break;

      case 'composition':
        const compositions: AbstractConfig['composition'][] = [
          'balanced',
          'asymmetric',
          'centered',
          'rule-of-thirds',
          'golden-ratio'
        ];
        variant.composition = compositions[Math.min(index, compositions.length - 1)];
        break;
    }

    return variant;
  }

  /**
   * Interpolate between two configurations
   */
  private interpolateConfigs(
    config1: AbstractConfig,
    config2: AbstractConfig,
    t: number
  ): AbstractConfig {
    return {
      movement: t < 0.5 ? config1.movement : config2.movement,
      colorPalette: t < 0.5 ? config1.colorPalette : config2.colorPalette,
      complexity: config1.complexity * (1 - t) + config2.complexity * t,
      energy: this.interpolateEnergy(config1.energy, config2.energy, t),
      composition: t < 0.5 ? config1.composition : config2.composition
    };
  }

  /**
   * Interpolate energy levels
   */
  private interpolateEnergy(
    energy1: AbstractConfig['energy'],
    energy2: AbstractConfig['energy'],
    t: number
  ): AbstractConfig['energy'] {
    const energyLevels: AbstractConfig['energy'][] = ['static', 'calm', 'dynamic', 'chaotic'];
    const idx1 = energyLevels.indexOf(energy1);
    const idx2 = energyLevels.indexOf(energy2);

    const interpolated = Math.round(idx1 * (1 - t) + idx2 * t);

    return energyLevels[Math.max(0, Math.min(interpolated, energyLevels.length - 1))];
  }

  /**
   * Invert energy level
   */
  private invertEnergy(energy: AbstractConfig['energy']): AbstractConfig['energy'] {
    const inverse: Record<string, AbstractConfig['energy']> = {
      'static': 'chaotic',
      'calm': 'dynamic',
      'dynamic': 'calm',
      'chaotic': 'static'
    };

    return inverse[energy] || energy;
  }

  /**
   * Get complementary color palette
   */
  private getComplementaryPalette(palette: string): AbstractConfig['colorPalette'] {
    const complementary: Record<string, AbstractConfig['colorPalette']> = {
      'vibrant': 'pastel',
      'pastel': 'vibrant',
      'monochrome': 'neon',
      'earth-tones': 'complementary',
      'neon': 'monochrome',
      'complementary': 'earth-tones'
    };

    return complementary[palette] || 'vibrant';
  }

  /**
   * Save artwork
   */
  private saveArtwork(image: Buffer, config: AbstractConfig): string {
    const timestamp = Date.now();
    const movement = config.movement.replace(/[^a-z0-9]/gi, '_');
    const palette = config.colorPalette.replace(/[^a-z0-9]/gi, '_');

    const filename = `abstract_${movement}_${palette}_${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, image);

    return filepath;
  }
}

/**
 * Example usage
 */
async function main() {
  const generator = new AbstractArtGenerator({
    device: 'cuda:0',
    outputDir: './output/abstract'
  });

  await generator.initialize();

  // Example 1: Abstract Expressionism
  console.log('━'.repeat(60));
  console.log('EXAMPLE 1: ABSTRACT EXPRESSIONISM');
  console.log('━'.repeat(60));

  await generator.generate({
    movement: 'abstract-expressionism',
    colorPalette: 'vibrant',
    complexity: 0.8,
    energy: 'dynamic',
    composition: 'asymmetric',
    elements: ['bold brushstrokes', 'gestural marks', 'color fields']
  });

  // Example 2: Complexity Series
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 2: COMPLEXITY SERIES');
  console.log('━'.repeat(60));

  await generator.generateSeries(
    {
      movement: 'geometric',
      colorPalette: 'complementary',
      complexity: 0.5,
      energy: 'calm',
      composition: 'balanced'
    },
    'complexity',
    5
  );

  // Example 3: Diptych
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 3: COMPLEMENTARY DIPTYCH');
  console.log('━'.repeat(60));

  await generator.generateDiptych({
    movement: 'minimalism',
    colorPalette: 'pastel',
    complexity: 0.3,
    energy: 'calm',
    composition: 'centered'
  });

  console.log('\n✓ All examples completed!\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default AbstractArtGenerator;
