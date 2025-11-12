/**
 * Source Map Generator
 *
 * Generates source maps for debugging:
 * - Line and column mappings
 * - Multiple source file support
 * - Source content embedding
 * - VLQ encoding
 */

export interface SourceMapOptions {
  file?: string;
  sourceRoot?: string;
  includeContent?: boolean;
}

export interface Mapping {
  generated: { line: number; column: number };
  original: { line: number; column: number };
  source: string;
  name?: string;
}

export class SourceMapGenerator {
  private options: SourceMapOptions;
  private mappings: Mapping[] = [];
  private sources: Set<string> = new Set();
  private names: Set<string> = new Set();
  private sourcesContent: Map<string, string> = new Map();

  constructor(options: SourceMapOptions = {}) {
    this.options = {
      file: options.file,
      sourceRoot: options.sourceRoot,
      includeContent: options.includeContent ?? true,
    };
  }

  /**
   * Add a mapping
   */
  addMapping(mapping: Mapping): void {
    this.mappings.push(mapping);
    this.sources.add(mapping.source);

    if (mapping.name) {
      this.names.add(mapping.name);
    }
  }

  /**
   * Set source content
   */
  setSourceContent(source: string, content: string): void {
    this.sources.add(source);
    this.sourcesContent.set(source, content);
  }

  /**
   * Generate source map
   */
  generate(): any {
    const sourcesArray = Array.from(this.sources);
    const namesArray = Array.from(this.names);

    // Sort mappings by generated position
    const sortedMappings = this.mappings.sort((a, b) => {
      if (a.generated.line !== b.generated.line) {
        return a.generated.line - b.generated.line;
      }
      return a.generated.column - b.generated.column;
    });

    // Encode mappings
    const encodedMappings = this.encodeMappings(sortedMappings, sourcesArray, namesArray);

    const sourceMap: any = {
      version: 3,
      sources: sourcesArray,
      names: namesArray,
      mappings: encodedMappings,
    };

    if (this.options.file) {
      sourceMap.file = this.options.file;
    }

    if (this.options.sourceRoot) {
      sourceMap.sourceRoot = this.options.sourceRoot;
    }

    if (this.options.includeContent) {
      sourceMap.sourcesContent = sourcesArray.map(
        (source) => this.sourcesContent.get(source) || null
      );
    }

    return sourceMap;
  }

  /**
   * Encode mappings using VLQ
   */
  private encodeMappings(
    mappings: Mapping[],
    sources: string[],
    names: string[]
  ): string {
    let result = "";
    let previousGeneratedLine = 1;
    let previousGeneratedColumn = 0;
    let previousOriginalLine = 0;
    let previousOriginalColumn = 0;
    let previousSource = 0;
    let previousName = 0;

    for (const mapping of mappings) {
      const { generated, original, source, name } = mapping;

      // Handle line breaks
      while (previousGeneratedLine < generated.line) {
        result += ";";
        previousGeneratedLine++;
        previousGeneratedColumn = 0;
      }

      if (result.length > 0 && result[result.length - 1] !== ";") {
        result += ",";
      }

      // Generated column
      result += this.encodeVLQ(generated.column - previousGeneratedColumn);
      previousGeneratedColumn = generated.column;

      // Source file index
      const sourceIndex = sources.indexOf(source);
      result += this.encodeVLQ(sourceIndex - previousSource);
      previousSource = sourceIndex;

      // Original line
      result += this.encodeVLQ(original.line - previousOriginalLine);
      previousOriginalLine = original.line;

      // Original column
      result += this.encodeVLQ(original.column - previousOriginalColumn);
      previousOriginalColumn = original.column;

      // Name index (optional)
      if (name) {
        const nameIndex = names.indexOf(name);
        result += this.encodeVLQ(nameIndex - previousName);
        previousName = nameIndex;
      }
    }

    return result;
  }

  /**
   * Encode a value using VLQ (Variable Length Quantity)
   */
  private encodeVLQ(value: number): string {
    let encoded = "";

    // Convert to sign-magnitude
    let vlq = value < 0 ? ((-value) << 1) | 1 : value << 1;

    do {
      let digit = vlq & 0x1f;
      vlq >>>= 5;

      if (vlq > 0) {
        digit |= 0x20; // Continuation bit
      }

      encoded += this.base64Encode(digit);
    } while (vlq > 0);

    return encoded;
  }

  /**
   * Base64 encode a digit
   */
  private base64Encode(digit: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    return chars[digit];
  }

  /**
   * Generate inline source map comment
   */
  toComment(prefix: string = "//"): string {
    const sourceMap = this.generate();
    const json = JSON.stringify(sourceMap);
    const base64 = Buffer.from(json).toString("base64");

    return `${prefix}# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}`;
  }

  /**
   * Generate external source map reference
   */
  toURL(url: string, prefix: string = "//"): string {
    return `${prefix}# sourceMappingURL=${url}`;
  }

  /**
   * Clear all mappings
   */
  clear(): void {
    this.mappings = [];
    this.sources.clear();
    this.names.clear();
    this.sourcesContent.clear();
  }
}

/**
 * Source Map Consumer
 */
export class SourceMapConsumer {
  private sourceMap: any;
  private decodedMappings: Mapping[] = [];

  constructor(sourceMap: any) {
    this.sourceMap = sourceMap;
    this.decodeMappings();
  }

  /**
   * Decode mappings from source map
   */
  private decodeMappings(): void {
    const { sources, names, mappings } = this.sourceMap;

    let generatedLine = 1;
    let generatedColumn = 0;
    let originalLine = 0;
    let originalColumn = 0;
    let sourceIndex = 0;
    let nameIndex = 0;

    const lines = mappings.split(";");

    for (const line of lines) {
      generatedColumn = 0;

      if (line) {
        const segments = line.split(",");

        for (const segment of segments) {
          if (!segment) continue;

          const decoded = this.decodeVLQ(segment);

          generatedColumn += decoded[0];

          if (decoded.length > 1) {
            sourceIndex += decoded[1];
            originalLine += decoded[2];
            originalColumn += decoded[3];

            const mapping: Mapping = {
              generated: { line: generatedLine, column: generatedColumn },
              original: { line: originalLine, column: originalColumn },
              source: sources[sourceIndex],
            };

            if (decoded.length > 4) {
              nameIndex += decoded[4];
              mapping.name = names[nameIndex];
            }

            this.decodedMappings.push(mapping);
          }
        }
      }

      generatedLine++;
    }
  }

  /**
   * Decode VLQ values
   */
  private decodeVLQ(encoded: string): number[] {
    const result: number[] = [];
    let shift = 0;
    let value = 0;

    for (let i = 0; i < encoded.length; i++) {
      let digit = this.base64Decode(encoded[i]);

      const continuation = digit & 0x20;
      digit &= 0x1f;
      value += digit << shift;

      if (continuation) {
        shift += 5;
      } else {
        // Convert from sign-magnitude to two's complement
        const shouldNegate = value & 1;
        value >>>= 1;

        result.push(shouldNegate ? -value : value);

        // Reset for next value
        value = 0;
        shift = 0;
      }
    }

    return result;
  }

  /**
   * Base64 decode a character
   */
  private base64Decode(char: string): number {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    return chars.indexOf(char);
  }

  /**
   * Get original position for a generated position
   */
  originalPositionFor(generated: { line: number; column: number }): {
    source: string | null;
    line: number | null;
    column: number | null;
    name: string | null;
  } {
    // Binary search for the mapping
    let low = 0;
    let high = this.decodedMappings.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const mapping = this.decodedMappings[mid];

      if (mapping.generated.line === generated.line) {
        if (mapping.generated.column === generated.column) {
          return {
            source: mapping.source,
            line: mapping.original.line,
            column: mapping.original.column,
            name: mapping.name || null,
          };
        } else if (mapping.generated.column < generated.column) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      } else if (mapping.generated.line < generated.line) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return { source: null, line: null, column: null, name: null };
  }

  /**
   * Get generated position for an original position
   */
  generatedPositionFor(original: {
    source: string;
    line: number;
    column: number;
  }): {
    line: number | null;
    column: number | null;
  } {
    for (const mapping of this.decodedMappings) {
      if (
        mapping.source === original.source &&
        mapping.original.line === original.line &&
        mapping.original.column === original.column
      ) {
        return {
          line: mapping.generated.line,
          column: mapping.generated.column,
        };
      }
    }

    return { line: null, column: null };
  }

  /**
   * Get all mappings
   */
  allMappings(): Mapping[] {
    return [...this.decodedMappings];
  }
}
