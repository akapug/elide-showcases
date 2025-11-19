/**
 * Animation Generator Example
 *
 * Generate animated art sequences using interpolation, morphing, and temporal
 * consistency techniques across multiple AI models.
 *
 * Demonstrates advanced polyglot integration for frame-by-frame generation.
 *
 * @module animation-generator
 */

import { StableDiffusion } from '../python/stable_diffusion.py';
import { GANGenerator } from '../python/gan_generator.py';
import { StyleTransfer } from '../python/style_transfer.py';
import { ImageEnhancement } from '../python/image_enhancement.py';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  startPrompt: string;
  endPrompt?: string;
  frames: number;
  fps: number;
  interpolation: 'linear' | 'smooth' | 'spherical';
  style?: string;
  consistency?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
}

/**
 * Frame metadata
 */
export interface FrameMetadata {
  index: number;
  prompt: string;
  interpolationValue: number;
  generationTime: number;
}

/**
 * Animation result
 */
export interface AnimationResult {
  frames: Buffer[];
  metadata: {
    totalFrames: number;
    fps: number;
    duration: number;
    totalGenerationTime: number;
  };
}

/**
 * Animation Generator
 */
export class AnimationGenerator {
  private stableDiffusion: any;
  private ganGenerator: any;
  private styleTransfer: any;
  private enhancement: any;
  private outputDir: string;

  constructor(config: { device?: string; outputDir?: string } = {}) {
    this.outputDir = config.outputDir || './output/animations';

    this.stableDiffusion = new StableDiffusion({
      model: 'stabilityai/stable-diffusion-2-1',
      device: config.device || 'cuda:0',
      precision: 'fp16'
    });

    this.ganGenerator = new GANGenerator({
      model: 'stylegan2-art',
      device: config.device || 'cuda:0',
      resolution: 512
    });

    this.styleTransfer = new StyleTransfer({
      device: config.device || 'cuda:0'
    });

    this.enhancement = new ImageEnhancement({
      device: config.device || 'cuda:0'
    });

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    console.log('🎬 Initializing Animation Generator...\n');

    await this.stableDiffusion.load();
    await this.ganGenerator.load();
    await this.styleTransfer.load();
    await this.enhancement.load();

    console.log('✓ Animation Generator ready\n');
  }

  /**
   * Generate animation
   */
  async generate(config: AnimationConfig): Promise<AnimationResult> {
    console.log('Generating animation:');
    console.log(`  Frames: ${config.frames}`);
    console.log(`  FPS: ${config.fps}`);
    console.log(`  Duration: ${(config.frames / config.fps).toFixed(2)}s`);
    console.log('─'.repeat(60));

    const startTime = Date.now();
    const frames: Buffer[] = [];
    const frameMetadata: FrameMetadata[] = [];

    // Determine method based on configuration
    const useGAN = !config.endPrompt;

    if (useGAN) {
      console.log('Method: GAN latent interpolation\n');
      return await this.generateGANAnimation(config);
    } else {
      console.log('Method: Prompt interpolation\n');
      return await this.generatePromptAnimation(config);
    }
  }

  /**
   * Generate animation using GAN latent interpolation
   */
  private async generateGANAnimation(config: AnimationConfig): Promise<AnimationResult> {
    const frames: Buffer[] = [];
    const startTime = Date.now();

    // Generate start and end latent vectors
    console.log('Generating latent vectors...');
    const startLatent = this.ganGenerator.random_latent(1);
    const endLatent = this.ganGenerator.random_latent(1);

    // Interpolate
    console.log(`Generating ${config.frames} frames...\n`);

    const interpolatedImages = await this.ganGenerator.interpolate(
      startLatent,
      endLatent,
      config.frames,
      config.interpolation === 'spherical' ? 'slerp' : 'linear',
      0.7  // Truncation
    );

    // Apply style if specified
    for (let i = 0; i < interpolatedImages.length; i++) {
      console.log(`Frame ${i + 1}/${config.frames}`);

      let frame = interpolatedImages[i];

      if (config.style) {
        frame = await this.styleTransfer.apply(frame, config.style, {
          intensity: 0.7
        });
      }

      frames.push(frame);

      // Save frame
      this.saveFrame(frame, i, config);
    }

    const totalTime = Date.now() - startTime;

    console.log('\n' + '─'.repeat(60));
    console.log(`✓ Animation generated in ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Avg time per frame: ${(totalTime / config.frames).toFixed(2)}ms`);

    return {
      frames,
      metadata: {
        totalFrames: config.frames,
        fps: config.fps,
        duration: config.frames / config.fps,
        totalGenerationTime: totalTime
      }
    };
  }

  /**
   * Generate animation using prompt interpolation
   */
  private async generatePromptAnimation(config: AnimationConfig): Promise<AnimationResult> {
    const frames: Buffer[] = [];
    const startTime = Date.now();

    // Use same seed for consistency
    const baseSeed = Math.floor(Math.random() * 1000000);

    console.log(`Generating ${config.frames} frames...\n`);

    for (let i = 0; i < config.frames; i++) {
      const t = i / (config.frames - 1);
      const frameStart = Date.now();

      // Interpolate prompt
      const prompt = this.interpolatePrompts(
        config.startPrompt,
        config.endPrompt!,
        t,
        config.interpolation
      );

      console.log(`Frame ${i + 1}/${config.frames}: t=${t.toFixed(3)}`);

      // Generate frame
      let frame = await this.stableDiffusion.generate({
        prompt,
        width: config.width || 512,
        height: config.height || 512,
        num_inference_steps: config.consistency === 'high' ? 50 : 30,
        guidance_scale: 7.5,
        seed: baseSeed  // Same seed for consistency
      });

      // Apply temporal smoothing if high consistency
      if (config.consistency === 'high' && frames.length > 0) {
        frame = await this.blendFrames(frames[frames.length - 1], frame, 0.7);
      }

      // Apply style
      if (config.style) {
        frame = await this.styleTransfer.apply(frame, config.style, {
          intensity: 0.8
        });
      }

      frames.push(frame);

      // Save frame
      this.saveFrame(frame, i, config);

      const frameTime = Date.now() - frameStart;
      console.log(`  Generated in ${(frameTime / 1000).toFixed(2)}s\n`);
    }

    const totalTime = Date.now() - startTime;

    console.log('─'.repeat(60));
    console.log(`✓ Animation generated in ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Avg time per frame: ${(totalTime / config.frames / 1000).toFixed(2)}s`);

    return {
      frames,
      metadata: {
        totalFrames: config.frames,
        fps: config.fps,
        duration: config.frames / config.fps,
        totalGenerationTime: totalTime
      }
    };
  }

  /**
   * Generate looping animation
   */
  async generateLoop(
    config: Omit<AnimationConfig, 'endPrompt'>
  ): Promise<AnimationResult> {
    console.log('\nGenerating looping animation...\n');

    // Generate latent loop
    const startLatent = this.ganGenerator.random_latent(1);

    const frames: Buffer[] = [];
    const startTime = Date.now();

    for (let i = 0; i < config.frames; i++) {
      // Circular interpolation
      const angle = (i / config.frames) * Math.PI * 2;
      const t = (Math.sin(angle) + 1) / 2;

      console.log(`Frame ${i + 1}/${config.frames}`);

      // Manipulate latent in circular pattern
      // In production, would use proper circular interpolation
      const frame = await this.ganGenerator.generate(startLatent, 0.7);

      frames.push(frame);
      this.saveFrame(frame, i, config as AnimationConfig);
    }

    const totalTime = Date.now() - startTime;

    return {
      frames,
      metadata: {
        totalFrames: config.frames,
        fps: config.fps,
        duration: config.frames / config.fps,
        totalGenerationTime: totalTime
      }
    };
  }

  /**
   * Generate style morphing animation
   */
  async generateStyleMorph(
    baseImage: Buffer,
    styles: string[],
    framesPerTransition: number = 10
  ): Promise<AnimationResult> {
    console.log(`\nGenerating style morph animation (${styles.length} styles)...\n`);

    const frames: Buffer[] = [];
    const startTime = Date.now();
    let currentFrame = 0;

    for (let i = 0; i < styles.length - 1; i++) {
      const style1 = styles[i];
      const style2 = styles[i + 1];

      console.log(`\nTransition ${i + 1}: ${style1} → ${style2}`);

      for (let j = 0; j < framesPerTransition; j++) {
        const t = j / (framesPerTransition - 1);

        console.log(`  Frame ${j + 1}/${framesPerTransition}`);

        // Blend styles
        let frame: Buffer;

        if (t < 0.5) {
          frame = await this.styleTransfer.apply(baseImage, style1, {
            intensity: 1 - t * 2
          });
        } else {
          frame = await this.styleTransfer.apply(baseImage, style2, {
            intensity: (t - 0.5) * 2
          });
        }

        frames.push(frame);
        this.saveFrame(frame, currentFrame++, {
          frames: framesPerTransition * (styles.length - 1),
          fps: 30
        } as AnimationConfig);
      }
    }

    const totalTime = Date.now() - startTime;
    const totalFrames = frames.length;

    return {
      frames,
      metadata: {
        totalFrames,
        fps: 30,
        duration: totalFrames / 30,
        totalGenerationTime: totalTime
      }
    };
  }

  /**
   * Export animation as video
   */
  async export(
    animation: AnimationResult,
    options: {
      format: 'mp4' | 'gif' | 'webm';
      codec?: string;
      quality?: string;
      path: string;
    }
  ): Promise<string> {
    console.log(`\nExporting animation as ${options.format}...`);

    const framesDir = path.join(this.outputDir, 'frames');

    // Use ffmpeg to create video
    const output = options.path;

    let command: string;

    if (options.format === 'mp4') {
      command = `ffmpeg -framerate ${animation.metadata.fps} -i ${framesDir}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf ${options.quality || '23'} ${output}`;
    } else if (options.format === 'gif') {
      command = `ffmpeg -framerate ${animation.metadata.fps} -i ${framesDir}/frame_%04d.png -vf "fps=${animation.metadata.fps},scale=512:-1:flags=lanczos" ${output}`;
    } else {
      command = `ffmpeg -framerate ${animation.metadata.fps} -i ${framesDir}/frame_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p ${output}`;
    }

    // Execute ffmpeg
    child_process.execSync(command);

    console.log(`✓ Exported: ${output}\n`);

    return output;
  }

  /**
   * Interpolate between two prompts
   */
  private interpolatePrompts(
    prompt1: string,
    prompt2: string,
    t: number,
    method: string
  ): string {
    // Apply easing for smooth interpolation
    let weight = t;

    if (method === 'smooth') {
      // Ease in-out
      weight = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Blend prompts with weights
    if (weight < 0.5) {
      return `(${prompt1}:${1 - weight * 2}) (${prompt2}:${weight * 2})`;
    } else {
      return `(${prompt1}:${(1 - weight) * 2}) (${prompt2}:${(weight - 0.5) * 2})`;
    }
  }

  /**
   * Blend two frames for temporal consistency
   */
  private async blendFrames(
    frame1: Buffer,
    frame2: Buffer,
    weight: number
  ): Promise<Buffer> {
    // In production, would implement proper frame blending
    // For now, return weighted frame
    return weight > 0.5 ? frame2 : frame1;
  }

  /**
   * Save individual frame
   */
  private saveFrame(frame: Buffer, index: number, config: AnimationConfig): void {
    const framesDir = path.join(this.outputDir, 'frames');

    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    const filename = `frame_${index.toString().padStart(4, '0')}.png`;
    const filepath = path.join(framesDir, filename);

    fs.writeFileSync(filepath, frame);
  }
}

/**
 * Example usage
 */
async function main() {
  const generator = new AnimationGenerator({
    device: 'cuda:0',
    outputDir: './output/animations'
  });

  await generator.initialize();

  // Example 1: Prompt interpolation animation
  console.log('━'.repeat(60));
  console.log('EXAMPLE 1: PROMPT INTERPOLATION');
  console.log('━'.repeat(60));

  const animation1 = await generator.generate({
    startPrompt: 'sunrise over mountains, peaceful morning',
    endPrompt: 'starry night sky over mountains, serene evening',
    frames: 30,
    fps: 30,
    interpolation: 'smooth',
    style: 'impressionist',
    consistency: 'high',
    width: 768,
    height: 512
  });

  // Example 2: GAN latent interpolation
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 2: GAN LATENT INTERPOLATION');
  console.log('━'.repeat(60));

  const animation2 = await generator.generate({
    startPrompt: 'abstract art',
    frames: 60,
    fps: 30,
    interpolation: 'spherical',
    style: 'abstract-expressionism'
  });

  // Example 3: Looping animation
  console.log('\n' + '━'.repeat(60));
  console.log('EXAMPLE 3: LOOPING ANIMATION');
  console.log('━'.repeat(60));

  await generator.generateLoop({
    startPrompt: 'abstract flowing patterns',
    frames: 60,
    fps: 30,
    interpolation: 'smooth',
    width: 512,
    height: 512
  });

  console.log('\n✓ All examples completed!\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default AnimationGenerator;
