/**
 * Computer Vision Platform - OCR Text Recognition
 *
 * Advanced OCR using Tesseract via Elide's polyglot bridge
 * Demonstrates seamless Python-TypeScript integration
 */

// @ts-ignore - Elide polyglot import
import pytesseract from 'python:pytesseract';
// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';
// @ts-ignore - Elide polyglot import
import PIL from 'python:PIL';

import {
  ImageData,
  BoundingBox,
  TextDetection,
  OCRResult,
  Point,
} from '../types.js';

// ============================================================================
// OCR Types
// ============================================================================

export interface TextRecognizerConfig {
  language?: string | string[]; // eng, fra, deu, etc.
  pageSegmentationMode?: PageSegmentationMode;
  ocrEngineMode?: OCREngineMode;
  whitelistChars?: string;
  blacklistChars?: string;
  minConfidence?: number;
  preprocessingSteps?: PreprocessingStep[];
}

export enum PageSegmentationMode {
  OSD_ONLY = 0, // Orientation and script detection
  AUTO_OSD = 1, // Automatic page segmentation with OSD
  AUTO = 3, // Automatic page segmentation
  SINGLE_COLUMN = 4, // Single column of text
  SINGLE_BLOCK_VERT = 5, // Single uniform block of vertically aligned text
  SINGLE_BLOCK = 6, // Single uniform block of text
  SINGLE_LINE = 7, // Single text line
  SINGLE_WORD = 8, // Single word
  CIRCLE_WORD = 9, // Circle word
  SINGLE_CHAR = 10, // Single character
  SPARSE_TEXT = 11, // Sparse text
  SPARSE_TEXT_OSD = 12, // Sparse text with OSD
  RAW_LINE = 13, // Raw line
}

export enum OCREngineMode {
  LEGACY = 0, // Legacy engine only
  NEURAL = 1, // Neural nets LSTM engine only
  LEGACY_NEURAL = 2, // Legacy + Neural
  DEFAULT = 3, // Default (based on config)
}

export enum PreprocessingStep {
  GRAYSCALE = 'grayscale',
  THRESHOLD = 'threshold',
  ADAPTIVE_THRESHOLD = 'adaptive_threshold',
  DENOISE = 'denoise',
  DILATION = 'dilation',
  EROSION = 'erosion',
  OPENING = 'opening',
  CLOSING = 'closing',
  DESKEW = 'deskew',
  CONTRAST = 'contrast',
  SHARPEN = 'sharpen',
}

export interface TextLine {
  text: string;
  bbox: BoundingBox;
  confidence: number;
  words: TextWord[];
}

export interface TextWord {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface TextBlock {
  text: string;
  bbox: BoundingBox;
  confidence: number;
  lines: TextLine[];
}

export interface DocumentStructure {
  blocks: TextBlock[];
  fullText: string;
  layout: LayoutAnalysis;
}

export interface LayoutAnalysis {
  columns: number;
  orientation: number; // degrees
  scriptDirection: 'ltr' | 'rtl' | 'ttb';
  textRegions: BoundingBox[];
}

export interface TableCell {
  text: string;
  bbox: BoundingBox;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

export interface TableDetection {
  cells: TableCell[][];
  bbox: BoundingBox;
  numRows: number;
  numCols: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script: string;
}

export interface TextEnhancementResult {
  enhanced: ImageData;
  improvements: {
    contrast: number;
    clarity: number;
    readability: number;
  };
}

// ============================================================================
// Text Recognizer Class
// ============================================================================

export class TextRecognizer {
  private config: Required<TextRecognizerConfig>;
  private tesseractConfig: string;

  constructor(config: TextRecognizerConfig = {}) {
    this.config = {
      language: config.language ?? 'eng',
      pageSegmentationMode: config.pageSegmentationMode ?? PageSegmentationMode.AUTO,
      ocrEngineMode: config.ocrEngineMode ?? OCREngineMode.DEFAULT,
      whitelistChars: config.whitelistChars ?? '',
      blacklistChars: config.blacklistChars ?? '',
      minConfidence: config.minConfidence ?? 0.6,
      preprocessingSteps: config.preprocessingSteps ?? [
        PreprocessingStep.GRAYSCALE,
        PreprocessingStep.THRESHOLD,
      ],
    };

    this.tesseractConfig = this.buildTesseractConfig();
    this.initializeTesseract();
  }

  private initializeTesseract(): void {
    // Configure Tesseract
    const langs = Array.isArray(this.config.language)
      ? this.config.language.join('+')
      : this.config.language;

    console.log(`Initializing Tesseract with language(s): ${langs}`);
  }

  private buildTesseractConfig(): string {
    const configParts: string[] = [];

    // Page segmentation mode
    configParts.push(`--psm ${this.config.pageSegmentationMode}`);

    // OCR engine mode
    configParts.push(`--oem ${this.config.ocrEngineMode}`);

    // Character whitelist/blacklist
    if (this.config.whitelistChars) {
      configParts.push(`-c tessedit_char_whitelist=${this.config.whitelistChars}`);
    }
    if (this.config.blacklistChars) {
      configParts.push(`-c tessedit_char_blacklist=${this.config.blacklistChars}`);
    }

    return configParts.join(' ');
  }

  /**
   * Recognize text from image
   */
  async recognizeText(image: ImageData): Promise<OCRResult> {
    const startTime = Date.now();

    // Preprocess image
    const preprocessed = this.preprocessImage(image);

    // Perform OCR
    const langs = Array.isArray(this.config.language)
      ? this.config.language.join('+')
      : this.config.language;

    // Get detailed OCR data
    const data = pytesseract.image_to_data(
      preprocessed,
      lang: langs,
      config: this.tesseractConfig,
      output_type: pytesseract.Output.DICT
    );

    // Parse results
    const detections = this.parseOCRData(data);

    // Filter by confidence
    const filteredDetections = detections.filter(
      d => d.confidence >= this.config.minConfidence
    );

    // Build full text
    const fullText = filteredDetections.map(d => d.text).join(' ');

    const processingTime = Date.now() - startTime;

    return {
      detections: filteredDetections,
      fullText,
      processingTime,
    };
  }

  /**
   * Recognize text with detailed structure
   */
  async recognizeStructured(image: ImageData): Promise<DocumentStructure> {
    const preprocessed = this.preprocessImage(image);

    const langs = Array.isArray(this.config.language)
      ? this.config.language.join('+')
      : this.config.language;

    const data = pytesseract.image_to_data(
      preprocessed,
      lang: langs,
      config: this.tesseractConfig,
      output_type: pytesseract.Output.DICT
    );

    // Parse into structured format
    const blocks = this.buildTextBlocks(data);
    const layout = this.analyzeLayout(data, image);

    return {
      blocks,
      fullText: blocks.map(b => b.text).join('\n\n'),
      layout,
    };
  }

  /**
   * Detect and extract tables from image
   */
  async detectTables(image: ImageData): Promise<TableDetection[]> {
    const preprocessed = this.preprocessImage(image);

    // Detect table structure using line detection
    const horizontalLines = this.detectHorizontalLines(preprocessed);
    const verticalLines = this.detectVerticalLines(preprocessed);

    // Find table intersections
    const tables = this.findTables(horizontalLines, verticalLines);

    // Extract text from cells
    const tableDetections: TableDetection[] = [];

    for (const table of tables) {
      const cells = await this.extractTableCells(preprocessed, table);
      tableDetections.push(cells);
    }

    return tableDetections;
  }

  /**
   * Detect language of text in image
   */
  async detectLanguage(image: ImageData): Promise<LanguageDetectionResult> {
    const preprocessed = this.preprocessImage(image);

    // Use Tesseract OSD (Orientation and Script Detection)
    const osd = pytesseract.image_to_osd(preprocessed);

    // Parse OSD output
    const lines = osd.split('\n');
    let script = 'Latin';
    let orientation = 0;

    for (const line of lines) {
      if (line.includes('Script:')) {
        script = line.split(':')[1].trim();
      }
      if (line.includes('Orientation in degrees:')) {
        orientation = parseInt(line.split(':')[1].trim());
      }
    }

    // Attempt detection with multiple languages
    const testLanguages = ['eng', 'fra', 'deu', 'spa', 'ita', 'por', 'rus', 'chi_sim', 'jpn', 'kor'];
    let bestLang = 'eng';
    let bestConfidence = 0;

    for (const lang of testLanguages) {
      try {
        const data = pytesseract.image_to_data(
          preprocessed,
          lang: lang,
          output_type: pytesseract.Output.DICT
        );

        const avgConfidence = this.calculateAverageConfidence(data);
        if (avgConfidence > bestConfidence) {
          bestConfidence = avgConfidence;
          bestLang = lang;
        }
      } catch (e) {
        // Language not available
        continue;
      }
    }

    return {
      language: bestLang,
      confidence: bestConfidence,
      script,
    };
  }

  /**
   * Enhance image for better OCR
   */
  enhanceForOCR(image: ImageData): TextEnhancementResult {
    const startTime = Date.now();

    let enhanced = image.data.copy();

    // Convert to grayscale
    if (image.channels > 1) {
      enhanced = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY);
    }

    // Increase contrast
    const clahe = cv2.createCLAHE({ clipLimit: 2.0, tileGridSize: [8, 8] });
    enhanced = clahe.apply(enhanced);

    // Denoise
    enhanced = cv2.fastNlMeansDenoising(enhanced, null, 10, 7, 21);

    // Adaptive thresholding
    enhanced = cv2.adaptiveThreshold(
      enhanced,
      255,
      cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv2.THRESH_BINARY,
      11,
      2
    );

    // Sharpen
    const kernel = numpy.array([
      [-1, -1, -1],
      [-1, 9, -1],
      [-1, -1, -1],
    ]);
    enhanced = cv2.filter2D(enhanced, -1, kernel);

    const processingTime = Date.now() - startTime;

    return {
      enhanced: {
        data: enhanced,
        width: image.width,
        height: image.height,
        channels: 1,
        dtype: 'uint8',
      },
      improvements: {
        contrast: 0.3,
        clarity: 0.25,
        readability: 0.4,
      },
    };
  }

  /**
   * Preprocess image for OCR
   */
  private preprocessImage(image: ImageData): any {
    let processed = image.data.copy();

    for (const step of this.config.preprocessingSteps) {
      processed = this.applyPreprocessingStep(processed, step);
    }

    return processed;
  }

  private applyPreprocessingStep(image: any, step: PreprocessingStep): any {
    switch (step) {
      case PreprocessingStep.GRAYSCALE:
        if (image.ndim === 3) {
          return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
        }
        return image;

      case PreprocessingStep.THRESHOLD:
        const gray = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
        return cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1];

      case PreprocessingStep.ADAPTIVE_THRESHOLD:
        const grayAdapt = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
        return cv2.adaptiveThreshold(
          grayAdapt,
          255,
          cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv2.THRESH_BINARY,
          11,
          2
        );

      case PreprocessingStep.DENOISE:
        if (image.ndim === 3) {
          return cv2.fastNlMeansDenoisingColored(image, null, 10, 10, 7, 21);
        }
        return cv2.fastNlMeansDenoising(image, null, 10, 7, 21);

      case PreprocessingStep.DILATION:
        const kernel = numpy.ones([3, 3], numpy.uint8);
        return cv2.dilate(image, kernel, { iterations: 1 });

      case PreprocessingStep.EROSION:
        const kernelE = numpy.ones([3, 3], numpy.uint8);
        return cv2.erode(image, kernelE, { iterations: 1 });

      case PreprocessingStep.OPENING:
        const kernelO = numpy.ones([3, 3], numpy.uint8);
        return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernelO);

      case PreprocessingStep.CLOSING:
        const kernelC = numpy.ones([3, 3], numpy.uint8);
        return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernelC);

      case PreprocessingStep.DESKEW:
        return this.deskewImage(image);

      case PreprocessingStep.CONTRAST:
        const clahe = cv2.createCLAHE({ clipLimit: 2.0, tileGridSize: [8, 8] });
        if (image.ndim === 3) {
          const lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB);
          const channels = cv2.split(lab);
          channels[0] = clahe.apply(channels[0]);
          const merged = cv2.merge(channels);
          return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR);
        }
        return clahe.apply(image);

      case PreprocessingStep.SHARPEN:
        const sharpKernel = numpy.array([
          [-1, -1, -1],
          [-1, 9, -1],
          [-1, -1, -1],
        ]);
        return cv2.filter2D(image, -1, sharpKernel);

      default:
        return image;
    }
  }

  private deskewImage(image: any): any {
    // Calculate skew angle
    const coords = numpy.column_stack(numpy.where(image > 0));
    const angle = cv2.minAreaRect(coords)[-1];

    let skewAngle = angle;
    if (angle < -45) {
      skewAngle = -(90 + angle);
    } else {
      skewAngle = -angle;
    }

    // Rotate image to deskew
    if (Math.abs(skewAngle) > 0.5) {
      const [h, w] = image.shape.slice(0, 2);
      const center = [w / 2, h / 2];
      const M = cv2.getRotationMatrix2D(center, skewAngle, 1.0);
      return cv2.warpAffine(
        image,
        M,
        [w, h],
        { flags: cv2.INTER_CUBIC, borderMode: cv2.BORDER_REPLICATE }
      );
    }

    return image;
  }

  /**
   * Parse OCR data from Tesseract
   */
  private parseOCRData(data: any): TextDetection[] {
    const detections: TextDetection[] = [];
    const n = data['text'].length;

    for (let i = 0; i < n; i++) {
      const text = data['text'][i].trim();
      if (!text) continue;

      const conf = parseInt(data['conf'][i]);
      if (conf < 0) continue;

      const bbox: BoundingBox = {
        x: data['left'][i],
        y: data['top'][i],
        width: data['width'][i],
        height: data['height'][i],
      };

      detections.push({
        text,
        bbox,
        confidence: conf / 100,
      });
    }

    return detections;
  }

  /**
   * Build hierarchical text blocks
   */
  private buildTextBlocks(data: any): TextBlock[] {
    const blocks: TextBlock[] = [];
    const n = data['text'].length;

    let currentBlock: TextBlock | null = null;
    let currentLine: TextLine | null = null;

    for (let i = 0; i < n; i++) {
      const level = data['level'][i];
      const text = data['text'][i].trim();
      const conf = parseInt(data['conf'][i]);

      if (conf < 0) continue;

      const bbox: BoundingBox = {
        x: data['left'][i],
        y: data['top'][i],
        width: data['width'][i],
        height: data['height'][i],
      };

      if (level === 2) {
        // New block
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          text: '',
          bbox,
          confidence: conf / 100,
          lines: [],
        };
        currentLine = null;
      } else if (level === 4) {
        // New line
        if (currentLine && currentBlock) {
          currentBlock.lines.push(currentLine);
        }
        currentLine = {
          text: '',
          bbox,
          confidence: conf / 100,
          words: [],
        };
      } else if (level === 5 && text) {
        // Word
        const word: TextWord = {
          text,
          bbox,
          confidence: conf / 100,
        };

        if (currentLine) {
          currentLine.words.push(word);
          currentLine.text += (currentLine.text ? ' ' : '') + text;
        }
      }
    }

    // Add final line and block
    if (currentLine && currentBlock) {
      currentBlock.lines.push(currentLine);
    }
    if (currentBlock) {
      currentBlock.text = currentBlock.lines.map(l => l.text).join('\n');
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Analyze document layout
   */
  private analyzeLayout(data: any, image: ImageData): LayoutAnalysis {
    // Detect columns by analyzing text regions
    const textRegions: BoundingBox[] = [];
    const n = data['text'].length;

    for (let i = 0; i < n; i++) {
      const level = data['level'][i];
      if (level === 2) {
        // Block level
        textRegions.push({
          x: data['left'][i],
          y: data['top'][i],
          width: data['width'][i],
          height: data['height'][i],
        });
      }
    }

    // Simple column detection
    const midX = image.width / 2;
    let leftRegions = 0;
    let rightRegions = 0;

    for (const region of textRegions) {
      if (region.x + region.width / 2 < midX) {
        leftRegions++;
      } else {
        rightRegions++;
      }
    }

    const columns = leftRegions > 0 && rightRegions > 0 ? 2 : 1;

    return {
      columns,
      orientation: 0,
      scriptDirection: 'ltr',
      textRegions,
    };
  }

  /**
   * Detect horizontal lines in image
   */
  private detectHorizontalLines(image: any): any[] {
    const horizontal = image.copy();
    const horizontalSize = Math.floor(horizontal.shape[1] / 30);

    const horizontalStructure = cv2.getStructuringElement(
      cv2.MORPH_RECT,
      [horizontalSize, 1]
    );

    const horizontalLines = cv2.morphologyEx(
      horizontal,
      cv2.MORPH_OPEN,
      horizontalStructure
    );

    return this.findLineSegments(horizontalLines);
  }

  /**
   * Detect vertical lines in image
   */
  private detectVerticalLines(image: any): any[] {
    const vertical = image.copy();
    const verticalSize = Math.floor(vertical.shape[0] / 30);

    const verticalStructure = cv2.getStructuringElement(
      cv2.MORPH_RECT,
      [1, verticalSize]
    );

    const verticalLines = cv2.morphologyEx(
      vertical,
      cv2.MORPH_OPEN,
      verticalStructure
    );

    return this.findLineSegments(verticalLines);
  }

  private findLineSegments(lineImage: any): any[] {
    const lines = cv2.HoughLinesP(
      lineImage,
      1,
      Math.PI / 180,
      50,
      null,
      50,
      10
    );

    return lines ? lines : [];
  }

  /**
   * Find table structures from line intersections
   */
  private findTables(horizontalLines: any[], verticalLines: any[]): any[] {
    // Simplified table detection
    const tables: any[] = [];

    if (horizontalLines.length > 2 && verticalLines.length > 2) {
      // Found potential table
      tables.push({
        horizontalLines,
        verticalLines,
      });
    }

    return tables;
  }

  /**
   * Extract text from table cells
   */
  private async extractTableCells(
    image: any,
    table: any
  ): Promise<TableDetection> {
    const { horizontalLines, verticalLines } = table;

    // Create grid from intersections
    const cells: TableCell[][] = [];
    const numRows = horizontalLines.length - 1;
    const numCols = verticalLines.length - 1;

    for (let row = 0; row < numRows; row++) {
      cells[row] = [];
      for (let col = 0; col < numCols; col++) {
        // Extract cell region
        const y1 = horizontalLines[row];
        const y2 = horizontalLines[row + 1];
        const x1 = verticalLines[col];
        const x2 = verticalLines[col + 1];

        const cellImage = image[y1:y2, x1:x2];

        // OCR cell
        const langs = Array.isArray(this.config.language)
          ? this.config.language.join('+')
          : this.config.language;

        const cellText = pytesseract.image_to_string(cellImage, lang: langs);

        cells[row][col] = {
          text: cellText.trim(),
          bbox: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
          row,
          col,
        };
      }
    }

    return {
      cells,
      bbox: { x: 0, y: 0, width: image.shape[1], height: image.shape[0] },
      numRows,
      numCols,
    };
  }

  /**
   * Calculate average confidence from OCR data
   */
  private calculateAverageConfidence(data: any): number {
    const confidences: number[] = [];

    for (let i = 0; i < data['conf'].length; i++) {
      const conf = parseInt(data['conf'][i]);
      if (conf >= 0) {
        confidences.push(conf);
      }
    }

    if (confidences.length === 0) return 0;
    return confidences.reduce((a, b) => a + b, 0) / confidences.length / 100;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    const langs = pytesseract.get_languages();
    return langs;
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<TextRecognizerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.tesseractConfig = this.buildTesseractConfig();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create text recognizer with common presets
 */
export function createTextRecognizer(
  preset: 'document' | 'receipt' | 'license-plate' | 'handwritten' | 'custom',
  customConfig?: TextRecognizerConfig
): TextRecognizer {
  let config: TextRecognizerConfig;

  switch (preset) {
    case 'document':
      config = {
        pageSegmentationMode: PageSegmentationMode.AUTO,
        ocrEngineMode: OCREngineMode.DEFAULT,
        preprocessingSteps: [
          PreprocessingStep.GRAYSCALE,
          PreprocessingStep.DESKEW,
          PreprocessingStep.CONTRAST,
          PreprocessingStep.THRESHOLD,
        ],
        minConfidence: 0.7,
      };
      break;

    case 'receipt':
      config = {
        pageSegmentationMode: PageSegmentationMode.SINGLE_BLOCK,
        ocrEngineMode: OCREngineMode.NEURAL,
        preprocessingSteps: [
          PreprocessingStep.GRAYSCALE,
          PreprocessingStep.DENOISE,
          PreprocessingStep.SHARPEN,
          PreprocessingStep.ADAPTIVE_THRESHOLD,
        ],
        minConfidence: 0.6,
      };
      break;

    case 'license-plate':
      config = {
        pageSegmentationMode: PageSegmentationMode.SINGLE_LINE,
        ocrEngineMode: OCREngineMode.NEURAL,
        whitelistChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        preprocessingSteps: [
          PreprocessingStep.GRAYSCALE,
          PreprocessingStep.CONTRAST,
          PreprocessingStep.THRESHOLD,
        ],
        minConfidence: 0.8,
      };
      break;

    case 'handwritten':
      config = {
        pageSegmentationMode: PageSegmentationMode.AUTO,
        ocrEngineMode: OCREngineMode.NEURAL,
        preprocessingSteps: [
          PreprocessingStep.GRAYSCALE,
          PreprocessingStep.DENOISE,
          PreprocessingStep.CONTRAST,
        ],
        minConfidence: 0.5,
      };
      break;

    case 'custom':
      config = customConfig ?? {};
      break;
  }

  return new TextRecognizer(config);
}
