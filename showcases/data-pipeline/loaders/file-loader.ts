/**
 * File Loader
 *
 * Loads data into various file formats (JSON, CSV, etc.).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PipelineContext } from '../orchestrator/pipeline';

// File loader configuration
export interface FileLoaderConfig {
  outputPath: string;
  format: 'json' | 'jsonl' | 'csv' | 'tsv';
  encoding?: BufferEncoding;
  mode?: 'overwrite' | 'append' | 'timestamp';
  csvOptions?: CsvOptions;
  jsonOptions?: JsonOptions;
  createDirectory?: boolean;
  compress?: boolean;
}

export interface CsvOptions {
  delimiter?: string;
  quote?: string;
  header?: boolean;
  columns?: string[];
}

export interface JsonOptions {
  pretty?: boolean;
  indent?: number;
}

/**
 * File Loader
 */
export class FileLoader {
  /**
   * Load data to file
   */
  async load(
    data: any[],
    config: FileLoaderConfig,
    context: PipelineContext
  ): Promise<void> {
    console.log(`[${context.runId}] Loading ${data.length} records to file: ${config.outputPath}`);

    const outputPath = this.resolveOutputPath(config, context);

    // Create directory if configured
    if (config.createDirectory) {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
    }

    // Load based on format
    switch (config.format) {
      case 'json':
        await this.loadJSON(data, outputPath, config);
        break;

      case 'jsonl':
        await this.loadJSONLines(data, outputPath, config);
        break;

      case 'csv':
        await this.loadCSV(data, outputPath, config, ',');
        break;

      case 'tsv':
        await this.loadCSV(data, outputPath, config, '\t');
        break;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    console.log(`[${context.runId}] File loaded successfully: ${outputPath}`);
  }

  /**
   * Resolve output path based on mode
   */
  private resolveOutputPath(config: FileLoaderConfig, context: PipelineContext): string {
    const basePath = path.resolve(config.outputPath);

    if (config.mode === 'timestamp') {
      const ext = path.extname(basePath);
      const basename = path.basename(basePath, ext);
      const dir = path.dirname(basePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return path.join(dir, `${basename}-${timestamp}${ext}`);
    }

    return basePath;
  }

  /**
   * Load as JSON
   */
  private async loadJSON(
    data: any[],
    outputPath: string,
    config: FileLoaderConfig
  ): Promise<void> {
    const encoding = config.encoding || 'utf8';
    const jsonOptions = config.jsonOptions || {};

    let content: string;

    if (jsonOptions.pretty !== false) {
      const indent = jsonOptions.indent || 2;
      content = JSON.stringify(data, null, indent);
    } else {
      content = JSON.stringify(data);
    }

    if (config.mode === 'append') {
      // Append is complex for JSON - we need to read, parse, append, and write
      try {
        const existing = await fs.readFile(outputPath, encoding);
        const existingData = JSON.parse(existing);

        if (Array.isArray(existingData)) {
          const combined = [...existingData, ...data];
          content = jsonOptions.pretty !== false
            ? JSON.stringify(combined, null, jsonOptions.indent || 2)
            : JSON.stringify(combined);
        }
      } catch (error) {
        // File doesn't exist or is invalid, just write new data
      }
    }

    await fs.writeFile(outputPath, content, encoding);
  }

  /**
   * Load as JSON Lines
   */
  private async loadJSONLines(
    data: any[],
    outputPath: string,
    config: FileLoaderConfig
  ): Promise<void> {
    const encoding = config.encoding || 'utf8';
    const lines = data.map(record => JSON.stringify(record)).join('\n') + '\n';

    if (config.mode === 'append') {
      await fs.appendFile(outputPath, lines, encoding);
    } else {
      await fs.writeFile(outputPath, lines, encoding);
    }
  }

  /**
   * Load as CSV/TSV
   */
  private async loadCSV(
    data: any[],
    outputPath: string,
    config: FileLoaderConfig,
    delimiter: string
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const encoding = config.encoding || 'utf8';
    const csvOptions = config.csvOptions || {};

    const quote = csvOptions.quote || '"';
    const includeHeader = csvOptions.header !== false;

    // Determine columns
    const columns = csvOptions.columns || Object.keys(data[0]);

    // Build CSV content
    const lines: string[] = [];

    // Add header
    if (includeHeader) {
      const header = columns.map(col => this.escapeCSVField(col, delimiter, quote)).join(delimiter);
      lines.push(header);
    }

    // Add data rows
    for (const record of data) {
      const row = columns.map(col => {
        const value = record[col];
        return this.escapeCSVField(this.formatValue(value), delimiter, quote);
      }).join(delimiter);

      lines.push(row);
    }

    const content = lines.join('\n') + '\n';

    if (config.mode === 'append') {
      // When appending, don't include header
      const dataLines = includeHeader ? lines.slice(1) : lines;
      await fs.appendFile(outputPath, dataLines.join('\n') + '\n', encoding);
    } else {
      await fs.writeFile(outputPath, content, encoding);
    }
  }

  /**
   * Escape CSV field
   */
  private escapeCSVField(value: string, delimiter: string, quote: string): string {
    const needsQuoting = value.includes(delimiter) || value.includes(quote) || value.includes('\n');

    if (needsQuoting) {
      const escaped = value.replace(new RegExp(quote, 'g'), quote + quote);
      return `${quote}${escaped}${quote}`;
    }

    return value;
  }

  /**
   * Format value for CSV
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Load to multiple files (partitioned)
   */
  async loadPartitioned(
    data: any[],
    config: FileLoaderConfig,
    partitionField: string,
    context: PipelineContext
  ): Promise<void> {
    console.log(`[${context.runId}] Loading partitioned by ${partitionField}`);

    // Group by partition field
    const partitions = new Map<string, any[]>();

    for (const record of data) {
      const partitionValue = String(record[partitionField] || 'unknown');

      if (!partitions.has(partitionValue)) {
        partitions.set(partitionValue, []);
      }

      partitions.get(partitionValue)!.push(record);
    }

    // Write each partition
    for (const [partitionValue, records] of partitions) {
      const ext = path.extname(config.outputPath);
      const basename = path.basename(config.outputPath, ext);
      const dir = path.dirname(config.outputPath);

      const partitionPath = path.join(dir, `${basename}-${partitionValue}${ext}`);

      const partitionConfig = {
        ...config,
        outputPath: partitionPath
      };

      await this.load(records, partitionConfig, context);
    }

    console.log(`[${context.runId}] Loaded ${partitions.size} partitions`);
  }

  /**
   * Load with compression
   */
  async loadCompressed(
    data: any[],
    config: FileLoaderConfig,
    context: PipelineContext
  ): Promise<void> {
    // For compression, we would use zlib or similar
    // This is a placeholder implementation
    console.log(`[${context.runId}] Compression not yet implemented, loading uncompressed`);
    await this.load(data, config, context);
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    lines?: number;
    records?: number;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const size = stats.size;

      // Count lines for text files
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').length;

      return {
        exists: true,
        size,
        lines,
        records: lines - 1 // Approximate, assumes header
      };
    } catch (error) {
      return {
        exists: false
      };
    }
  }
}

/**
 * Stream writer for large datasets
 */
export class StreamFileLoader {
  private writeStream?: fs.FileHandle;
  private recordCount: number = 0;

  /**
   * Open file for streaming
   */
  async open(outputPath: string, config: FileLoaderConfig): Promise<void> {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    this.writeStream = await fs.open(outputPath, 'w');
    this.recordCount = 0;

    // Write header for CSV
    if ((config.format === 'csv' || config.format === 'tsv') && config.csvOptions?.header !== false) {
      const delimiter = config.format === 'csv' ? ',' : '\t';
      const columns = config.csvOptions?.columns || [];
      if (columns.length > 0) {
        const header = columns.join(delimiter) + '\n';
        await this.writeStream.write(header, 'utf8');
      }
    }

    // Write opening bracket for JSON array
    if (config.format === 'json') {
      await this.writeStream.write('[\n', 'utf8');
    }
  }

  /**
   * Write a record
   */
  async write(record: any, config: FileLoaderConfig): Promise<void> {
    if (!this.writeStream) {
      throw new Error('Stream not open');
    }

    let content: string;

    switch (config.format) {
      case 'json':
        content = (this.recordCount > 0 ? ',\n' : '') + JSON.stringify(record, null, 2);
        break;

      case 'jsonl':
        content = JSON.stringify(record) + '\n';
        break;

      case 'csv':
      case 'tsv':
        const delimiter = config.format === 'csv' ? ',' : '\t';
        const columns = config.csvOptions?.columns || Object.keys(record);
        const values = columns.map(col => record[col] || '');
        content = values.join(delimiter) + '\n';
        break;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    await this.writeStream.write(content, 'utf8');
    this.recordCount++;
  }

  /**
   * Close stream
   */
  async close(config: FileLoaderConfig): Promise<void> {
    if (!this.writeStream) {
      return;
    }

    // Write closing bracket for JSON array
    if (config.format === 'json') {
      await this.writeStream.write('\n]\n', 'utf8');
    }

    await this.writeStream.close();
    this.writeStream = undefined;
  }

  /**
   * Get record count
   */
  getRecordCount(): number {
    return this.recordCount;
  }
}
