/**
 * Embedding service that interfaces with Python ML backends
 */

import { spawn } from 'child_process';
import { Logger } from '../shared/utils';
import path from 'path';

interface EncodingResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
  processingTime: number;
}

export class EmbeddingService {
  private textModel: string;
  private imageModel: string;

  constructor() {
    this.textModel = process.env.TEXT_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
    this.imageModel = process.env.IMAGE_MODEL || 'openai/clip-vit-base-patch32';
  }

  /**
   * Execute Python script and return JSON result
   */
  private async executePython(
    scriptPath: string,
    args: string[],
    input?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [scriptPath, ...args]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          Logger.error(`Python process exited with code ${code}`);
          Logger.error(`stderr: ${stderr}`);
          reject(new Error(`Python process failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (error) {
          Logger.error('Failed to parse Python output:', stdout);
          reject(new Error('Failed to parse Python output'));
        }
      });

      if (input) {
        python.stdin.write(input);
        python.stdin.end();
      }
    });
  }

  /**
   * Encode text using sentence-transformers
   */
  async encodeText(
    texts: string[],
    model?: string,
    normalize: boolean = true
  ): Promise<EncodingResult> {
    const scriptPath = path.join(__dirname, '../embedding/text_embeddings.py');
    const modelName = model || this.textModel;

    const result = await this.executePython(
      scriptPath,
      ['encode', modelName],
      JSON.stringify(texts)
    );

    if (texts.length === 1) {
      return {
        embeddings: [result.embedding],
        model: modelName,
        dimensions: result.dimensions,
        processingTime: result.processing_time,
      };
    }

    return {
      embeddings: result.embeddings,
      model: modelName,
      dimensions: result.dimensions,
      processingTime: result.total_time,
    };
  }

  /**
   * Encode text in batches for better throughput
   */
  async encodeTextBatch(
    texts: string[],
    model?: string,
    batchSize: number = 100
  ): Promise<EncodingResult> {
    const scriptPath = path.join(__dirname, '../embedding/text_embeddings.py');
    const modelName = model || this.textModel;

    const result = await this.executePython(
      scriptPath,
      ['encode', modelName],
      JSON.stringify(texts)
    );

    return {
      embeddings: result.embeddings,
      model: modelName,
      dimensions: result.dimensions,
      processingTime: result.total_time,
    };
  }

  /**
   * Encode images using CLIP
   */
  async encodeImage(
    images: string[],
    model?: string,
    normalize: boolean = true
  ): Promise<EncodingResult> {
    const scriptPath = path.join(__dirname, '../embedding/image_embeddings.py');
    const modelName = model || this.imageModel;

    const result = await this.executePython(
      scriptPath,
      ['encode_image', modelName],
      JSON.stringify(images)
    );

    if (images.length === 1) {
      return {
        embeddings: [result.embedding],
        model: modelName,
        dimensions: result.dimensions,
        processingTime: result.processing_time,
      };
    }

    return {
      embeddings: result.embeddings,
      model: modelName,
      dimensions: result.dimensions,
      processingTime: result.total_time,
    };
  }

  /**
   * Encode images in batches
   */
  async encodeImageBatch(
    images: string[],
    model?: string,
    batchSize: number = 32
  ): Promise<EncodingResult> {
    const scriptPath = path.join(__dirname, '../embedding/image_embeddings.py');
    const modelName = model || this.imageModel;

    const result = await this.executePython(
      scriptPath,
      ['encode_image', modelName],
      JSON.stringify(images)
    );

    return {
      embeddings: result.embeddings,
      model: modelName,
      dimensions: result.dimensions,
      processingTime: result.total_time,
    };
  }

  /**
   * Get model information
   */
  async getTextModelInfo(): Promise<any> {
    const scriptPath = path.join(__dirname, '../embedding/text_embeddings.py');
    return this.executePython(scriptPath, ['info', this.textModel]);
  }

  async getImageModelInfo(): Promise<any> {
    const scriptPath = path.join(__dirname, '../embedding/image_embeddings.py');
    return this.executePython(scriptPath, ['info', this.imageModel]);
  }
}
