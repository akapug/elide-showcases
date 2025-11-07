/**
 * JSON Extractor
 *
 * Extracts data from JSON files with support for various formats,
 * nested structures, and streaming.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { PipelineContext } from '../orchestrator/pipeline';

// JSON extractor configuration
export interface JsonExtractorConfig {
  filePath: string;
  encoding?: BufferEncoding;
  format?: 'json' | 'jsonl' | 'ndjson'; // JSON Lines / Newline Delimited JSON
  dataPath?: string; // Path to extract from nested JSON
  streaming?: boolean; // Use streaming for large files
  maxRecords?: number;
  filter?: (record: any) => boolean;
}

/**
 * JSON Extractor
 */
export class JsonExtractor {
  /**
   * Extract data from JSON file
   */
  async extract(config: JsonExtractorConfig, context: PipelineContext): Promise<any[]> {
    console.log(`[${context.runId}] Extracting from JSON: ${config.filePath}`);

    const filePath = path.resolve(config.filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`JSON file not found: ${filePath}`);
    }

    const format = config.format || this.detectFormat(filePath);

    let records: any[] = [];

    switch (format) {
      case 'jsonl':
      case 'ndjson':
        records = await this.extractJSONLines(filePath, config, context);
        break;

      case 'json':
      default:
        records = await this.extractJSON(filePath, config, context);
        break;
    }

    // Apply filter if configured
    if (config.filter) {
      records = records.filter(config.filter);
    }

    // Apply max records limit
    if (config.maxRecords) {
      records = records.slice(0, config.maxRecords);
    }

    console.log(`[${context.runId}] Extracted ${records.length} records from JSON`);

    return records;
  }

  /**
   * Extract from standard JSON file
   */
  private async extractJSON(
    filePath: string,
    config: JsonExtractorConfig,
    context: PipelineContext
  ): Promise<any[]> {
    const encoding = config.encoding || 'utf8';
    const content = await fs.readFile(filePath, encoding);

    let data: any;

    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in file: ${filePath}`);
    }

    // Extract data from nested path if specified
    if (config.dataPath) {
      data = this.extractFromPath(data, config.dataPath);
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      return [data];
    }

    return data;
  }

  /**
   * Extract from JSON Lines file
   */
  private async extractJSONLines(
    filePath: string,
    config: JsonExtractorConfig,
    context: PipelineContext
  ): Promise<any[]> {
    const records: any[] = [];
    const encoding = config.encoding || 'utf8';

    const fileStream = createReadStream(filePath, { encoding });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;

      if (line.trim() === '') {
        continue;
      }

      try {
        let record = JSON.parse(line);

        // Extract from nested path if specified
        if (config.dataPath) {
          record = this.extractFromPath(record, config.dataPath);
        }

        records.push(record);

        // Check max records limit
        if (config.maxRecords && records.length >= config.maxRecords) {
          break;
        }
      } catch (error) {
        console.warn(`[${context.runId}] Invalid JSON on line ${lineNumber}: ${line.substring(0, 100)}`);
      }
    }

    return records;
  }

  /**
   * Extract data from nested path
   */
  private extractFromPath(data: any, dataPath: string): any {
    const parts = dataPath.split('.');
    let current = data;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return [];
      }

      // Handle array indices
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        current = current[index];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Detect JSON format from file extension
   */
  private detectFormat(filePath: string): 'json' | 'jsonl' | 'ndjson' {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.jsonl') {
      return 'jsonl';
    }

    if (ext === '.ndjson') {
      return 'ndjson';
    }

    return 'json';
  }

  /**
   * Extract from multiple JSON files
   */
  async extractMultiple(
    configs: JsonExtractorConfig[],
    context: PipelineContext
  ): Promise<any[]> {
    const allRecords: any[] = [];

    for (const config of configs) {
      const records = await this.extract(config, context);
      allRecords.push(...records);
    }

    return allRecords;
  }

  /**
   * Extract from JSON directory
   */
  async extractFromDirectory(
    dirPath: string,
    pattern: RegExp = /\.json(l)?$/i,
    config: Partial<JsonExtractorConfig>,
    context: PipelineContext
  ): Promise<any[]> {
    console.log(`[${context.runId}] Extracting from directory: ${dirPath}`);

    const resolvedDir = path.resolve(dirPath);

    // Check if directory exists
    try {
      const stat = await fs.stat(resolvedDir);
      if (!stat.isDirectory()) {
        throw new Error(`Not a directory: ${resolvedDir}`);
      }
    } catch (error) {
      throw new Error(`Directory not found: ${resolvedDir}`);
    }

    // Read directory
    const files = await fs.readdir(resolvedDir);
    const jsonFiles = files.filter(f => pattern.test(f));

    console.log(`[${context.runId}] Found ${jsonFiles.length} JSON files`);

    const allRecords: any[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(resolvedDir, file);

      try {
        const fileConfig: JsonExtractorConfig = {
          ...config,
          filePath
        } as JsonExtractorConfig;

        const records = await this.extract(fileConfig, context);
        allRecords.push(...records);
      } catch (error) {
        console.error(`[${context.runId}] Failed to extract from ${file}:`, error);
        throw error;
      }
    }

    console.log(`[${context.runId}] Extracted ${allRecords.length} total records from directory`);

    return allRecords;
  }

  /**
   * Stream large JSON arrays
   */
  async *streamJSONArray(
    filePath: string,
    config: JsonExtractorConfig,
    context: PipelineContext
  ): AsyncGenerator<any, void, unknown> {
    console.log(`[${context.runId}] Streaming from JSON: ${filePath}`);

    const encoding = config.encoding || 'utf8';
    const content = await fs.readFile(filePath, encoding);

    let data: any;

    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in file: ${filePath}`);
    }

    // Extract from nested path if specified
    if (config.dataPath) {
      data = this.extractFromPath(data, config.dataPath);
    }

    if (!Array.isArray(data)) {
      yield data;
      return;
    }

    let count = 0;

    for (const item of data) {
      yield item;
      count++;

      if (config.maxRecords && count >= config.maxRecords) {
        break;
      }
    }
  }

  /**
   * Validate JSON file
   */
  async validate(filePath: string): Promise<{
    valid: boolean;
    error?: string;
    recordCount?: number;
  }> {
    try {
      const resolvedPath = path.resolve(filePath);
      const content = await fs.readFile(resolvedPath, 'utf8');

      const data = JSON.parse(content);

      const recordCount = Array.isArray(data) ? data.length : 1;

      return {
        valid: true,
        recordCount
      };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get JSON file statistics
   */
  async getStats(filePath: string, dataPath?: string): Promise<{
    recordCount: number;
    fileSize: number;
    format: 'json' | 'jsonl' | 'ndjson';
    keys?: string[];
  }> {
    const resolvedPath = path.resolve(filePath);

    // Get file size
    const stats = await fs.stat(resolvedPath);
    const fileSize = stats.size;

    const format = this.detectFormat(filePath);

    if (format === 'jsonl' || format === 'ndjson') {
      // Count lines for JSONL
      const fileStream = createReadStream(resolvedPath, { encoding: 'utf8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let recordCount = 0;
      let keys: string[] | undefined;

      for await (const line of rl) {
        if (line.trim() === '') {
          continue;
        }

        recordCount++;

        // Get keys from first record
        if (!keys) {
          try {
            const record = JSON.parse(line);
            keys = Object.keys(record);
          } catch (error) {
            // Ignore parse errors for stats
          }
        }
      }

      return { recordCount, fileSize, format, keys };
    } else {
      // Parse JSON to count records
      const content = await fs.readFile(resolvedPath, 'utf8');
      let data = JSON.parse(content);

      if (dataPath) {
        data = this.extractFromPath(data, dataPath);
      }

      const recordCount = Array.isArray(data) ? data.length : 1;
      const keys = Array.isArray(data) && data.length > 0
        ? Object.keys(data[0])
        : undefined;

      return { recordCount, fileSize, format, keys };
    }
  }

  /**
   * Convert JSON to JSONL
   */
  async convertToJSONL(
    inputPath: string,
    outputPath: string,
    dataPath?: string
  ): Promise<void> {
    const content = await fs.readFile(inputPath, 'utf8');
    let data = JSON.parse(content);

    if (dataPath) {
      data = this.extractFromPath(data, dataPath);
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    const lines = data.map((record: any) => JSON.stringify(record)).join('\n');
    await fs.writeFile(outputPath, lines, 'utf8');
  }
}
