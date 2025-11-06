/**
 * CSV Extractor
 *
 * Extracts data from CSV files with support for various delimiters,
 * headers, and encoding options.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { PipelineContext } from '../orchestrator/pipeline';

// CSV extractor configuration
export interface CsvExtractorConfig {
  filePath: string;
  delimiter?: string;
  quote?: string;
  escape?: string;
  encoding?: BufferEncoding;
  hasHeader?: boolean;
  columns?: string[];
  skipRows?: number;
  maxRows?: number;
  trimFields?: boolean;
  skipEmptyLines?: boolean;
  batchSize?: number;
}

/**
 * CSV Extractor
 */
export class CsvExtractor {
  /**
   * Extract data from CSV file
   */
  async extract(config: CsvExtractorConfig, context: PipelineContext): Promise<any[]> {
    console.log(`[${context.runId}] Extracting from CSV: ${config.filePath}`);

    const filePath = path.resolve(config.filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    const records: any[] = [];
    let rowNumber = 0;
    let headerRow: string[] | undefined;

    const delimiter = config.delimiter || ',';
    const quote = config.quote || '"';
    const encoding = config.encoding || 'utf8';
    const hasHeader = config.hasHeader !== false; // Default to true
    const skipRows = config.skipRows || 0;
    const maxRows = config.maxRows;
    const trimFields = config.trimFields !== false;
    const skipEmptyLines = config.skipEmptyLines !== false;

    // Create readline interface for streaming
    const fileStream = createReadStream(filePath, { encoding });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      // Skip empty lines
      if (skipEmptyLines && line.trim() === '') {
        continue;
      }

      rowNumber++;

      // Skip initial rows
      if (rowNumber <= skipRows) {
        continue;
      }

      // Parse CSV line
      const fields = this.parseCSVLine(line, delimiter, quote, config.escape);

      // Trim fields if configured
      const processedFields = trimFields
        ? fields.map(f => f.trim())
        : fields;

      // Handle header row
      if (hasHeader && !headerRow) {
        headerRow = processedFields;
        continue;
      }

      // Use provided columns or header row
      const columns = config.columns || headerRow;

      // Convert to object
      const record: Record<string, any> = {};

      if (columns) {
        for (let i = 0; i < columns.length; i++) {
          const value = processedFields[i] || '';
          record[columns[i]] = this.parseValue(value);
        }
      } else {
        // No headers, use array indices as keys
        for (let i = 0; i < processedFields.length; i++) {
          record[`column_${i}`] = this.parseValue(processedFields[i]);
        }
      }

      records.push(record);

      // Check max rows limit
      if (maxRows && records.length >= maxRows) {
        break;
      }
    }

    console.log(`[${context.runId}] Extracted ${records.length} records from CSV`);

    return records;
  }

  /**
   * Parse a single CSV line
   */
  private parseCSVLine(
    line: string,
    delimiter: string,
    quote: string,
    escape?: string
  ): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : '';

      // Handle escape sequences
      if (escape && char === escape && nextChar) {
        currentField += nextChar;
        i += 2;
        continue;
      }

      // Handle quotes
      if (char === quote) {
        // Check for escaped quote (doubled quote)
        if (inQuotes && nextChar === quote) {
          currentField += quote;
          i += 2;
          continue;
        }

        inQuotes = !inQuotes;
        i++;
        continue;
      }

      // Handle delimiter
      if (char === delimiter && !inQuotes) {
        fields.push(currentField);
        currentField = '';
        i++;
        continue;
      }

      // Regular character
      currentField += char;
      i++;
    }

    // Add last field
    fields.push(currentField);

    return fields;
  }

  /**
   * Parse value with type inference
   */
  private parseValue(value: string): any {
    if (value === '') {
      return null;
    }

    // Try to parse as number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num;
      }
    }

    // Try to parse as boolean
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === 'yes' || lower === '1') {
      return true;
    }
    if (lower === 'false' || lower === 'no' || lower === '0') {
      return false;
    }

    // Try to parse as date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Return as string
    return value;
  }

  /**
   * Extract from multiple CSV files
   */
  async extractMultiple(
    configs: CsvExtractorConfig[],
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
   * Extract from CSV directory
   */
  async extractFromDirectory(
    dirPath: string,
    pattern: RegExp = /\.csv$/i,
    config: Partial<CsvExtractorConfig>,
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
    const csvFiles = files.filter(f => pattern.test(f));

    console.log(`[${context.runId}] Found ${csvFiles.length} CSV files`);

    const allRecords: any[] = [];

    for (const file of csvFiles) {
      const filePath = path.join(resolvedDir, file);

      try {
        const fileConfig: CsvExtractorConfig = {
          ...config,
          filePath
        } as CsvExtractorConfig;

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
   * Get CSV file statistics
   */
  async getStats(filePath: string): Promise<{
    rowCount: number;
    columnCount: number;
    fileSize: number;
    columns?: string[];
  }> {
    const resolvedPath = path.resolve(filePath);

    // Get file size
    const stats = await fs.stat(resolvedPath);
    const fileSize = stats.size;

    let rowCount = 0;
    let columnCount = 0;
    let columns: string[] | undefined;

    const fileStream = createReadStream(resolvedPath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim() === '') {
        continue;
      }

      rowCount++;

      if (rowCount === 1) {
        // Parse first line to get column count
        const fields = this.parseCSVLine(line, ',', '"');
        columnCount = fields.length;
        columns = fields;
      }
    }

    return {
      rowCount: rowCount - 1, // Exclude header
      columnCount,
      fileSize,
      columns
    };
  }
}
