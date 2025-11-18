/**
 * OCR and Document Analysis Pipeline
 *
 * Demonstrates comprehensive OCR and document processing using Tesseract,
 * EasyOCR, and document structure analysis with Elide's polyglot capabilities.
 *
 * Features:
 * - Multi-language OCR
 * - Text detection and recognition
 * - Document structure analysis
 * - Table extraction
 * - Receipt parsing
 * - ID card/passport reading
 * - Handwriting recognition
 * - PDF document processing
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * OCR result for detected text
 */
interface OCRResult {
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language: string;
}

/**
 * Text line with word-level details
 */
interface TextLine {
  text: string;
  words: Word[];
  bbox: BoundingBox;
  confidence: number;
}

/**
 * Individual word detection
 */
interface Word {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

/**
 * Bounding box
 */
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Document structure
 */
interface DocumentStructure {
  title?: string;
  sections: DocumentSection[];
  tables: Table[];
  metadata: DocumentMetadata;
}

/**
 * Document section
 */
interface DocumentSection {
  heading?: string;
  content: string[];
  level: number;
  bbox: BoundingBox;
}

/**
 * Table structure
 */
interface Table {
  headers: string[];
  rows: string[][];
  bbox: BoundingBox;
  confidence: number;
}

/**
 * Document metadata
 */
interface DocumentMetadata {
  pageCount: number;
  language: string;
  orientation: number;
  dpi: number;
  size: { width: number; height: number };
}

/**
 * OCR configuration
 */
interface OCRConfig {
  engine: 'tesseract' | 'easyocr' | 'paddleocr';
  languages: string[];
  psm?: number; // Page segmentation mode for Tesseract
  oem?: number; // OCR engine mode for Tesseract
  gpu: boolean;
  preprocessor?: 'auto' | 'none' | 'enhance';
}

/**
 * OCR Engine wrapper
 */
class OCREngine {
  private config: OCRConfig;
  private engine: any;

  constructor(config: OCRConfig) {
    this.config = config;
  }

  /**
   * Initialize OCR engine
   */
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.config.engine} OCR engine...`);

    const ocrModule = await this.loadPythonOCR();

    this.engine = ocrModule.OCREngine({
      engine: this.config.engine,
      languages: this.config.languages,
      psm: this.config.psm,
      oem: this.config.oem,
      use_gpu: this.config.gpu
    });

    await this.engine.load_model();
    console.log('OCR engine initialized');
  }

  /**
   * Load Python OCR module
   */
  private async loadPythonOCR(): Promise<any> {
    return {
      OCREngine: (config: any) => ({
        load_model: async () => {},
        recognize_text: async (imageData: Buffer) => this.mockOCR(),
        recognize_text_batch: async (images: Buffer[]) =>
          images.map(() => this.mockOCR()),
        detect_text: async (imageData: Buffer) => this.mockTextDetection(),
        release: async () => {}
      })
    };
  }

  /**
   * Mock OCR results
   */
  private mockOCR(): OCRResult[] {
    return [
      {
        text: 'Sample Document',
        confidence: 0.98,
        bbox: { x: 100, y: 50, width: 400, height: 40 },
        language: 'en'
      },
      {
        text: 'This is a sample text extracted from the document.',
        confidence: 0.95,
        bbox: { x: 100, y: 120, width: 600, height: 30 },
        language: 'en'
      },
      {
        text: 'Multiple lines can be detected and recognized.',
        confidence: 0.93,
        bbox: { x: 100, y: 160, width: 580, height: 30 },
        language: 'en'
      }
    ];
  }

  /**
   * Mock text detection
   */
  private mockTextDetection(): BoundingBox[] {
    return [
      { x: 100, y: 50, width: 400, height: 40 },
      { x: 100, y: 120, width: 600, height: 30 },
      { x: 100, y: 160, width: 580, height: 30 }
    ];
  }

  /**
   * Recognize text in image
   */
  async recognizeText(imagePath: string): Promise<OCRResult[]> {
    const imageData = await readFile(imagePath);
    const preprocessed = await this.preprocess(imageData);
    return await this.engine.recognize_text(preprocessed);
  }

  /**
   * Detect text regions without recognition
   */
  async detectText(imagePath: string): Promise<BoundingBox[]> {
    const imageData = await readFile(imagePath);
    return await this.engine.detect_text(imageData);
  }

  /**
   * Preprocess image for better OCR
   */
  private async preprocess(imageData: Buffer): Promise<Buffer> {
    if (this.config.preprocessor === 'none') {
      return imageData;
    }

    // Apply preprocessing (deskew, denoise, enhance contrast, etc.)
    // In real implementation, would use image processing library
    return imageData;
  }

  /**
   * Batch OCR processing
   */
  async recognizeBatch(imagePaths: string[]): Promise<OCRResult[][]> {
    const images = await Promise.all(
      imagePaths.map(path => readFile(path))
    );

    return await this.engine.recognize_text_batch(images);
  }

  /**
   * Release engine resources
   */
  async release(): Promise<void> {
    if (this.engine) {
      await this.engine.release();
    }
  }
}

/**
 * Document structure analyzer
 */
class DocumentAnalyzer {
  private ocrEngine: OCREngine;

  constructor(ocrEngine: OCREngine) {
    this.ocrEngine = ocrEngine;
  }

  /**
   * Analyze document structure
   */
  async analyzeDocument(imagePath: string): Promise<DocumentStructure> {
    const ocrResults = await this.ocrEngine.recognizeText(imagePath);

    // Sort results by Y coordinate
    const sortedResults = ocrResults.sort((a, b) => a.bbox.y - b.bbox.y);

    const sections = this.extractSections(sortedResults);
    const tables = this.extractTables(sortedResults);
    const metadata = await this.extractMetadata(imagePath);

    return {
      title: this.extractTitle(sortedResults),
      sections,
      tables,
      metadata
    };
  }

  /**
   * Extract document title
   */
  private extractTitle(results: OCRResult[]): string | undefined {
    if (results.length === 0) return undefined;

    // Title is typically the first large text
    const firstResult = results[0];
    if (firstResult.bbox.height > 30) {
      return firstResult.text;
    }

    return undefined;
  }

  /**
   * Extract document sections
   */
  private extractSections(results: OCRResult[]): DocumentSection[] {
    const sections: DocumentSection[] = [];
    let currentSection: DocumentSection | null = null;

    for (const result of results) {
      // Check if this is a heading (larger font, short text)
      const isHeading = result.bbox.height > 25 && result.text.split(' ').length < 10;

      if (isHeading) {
        // Start new section
        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          heading: result.text,
          content: [],
          level: this.determineHeadingLevel(result.bbox.height),
          bbox: result.bbox
        };
      } else if (currentSection) {
        // Add to current section
        currentSection.content.push(result.text);
      } else {
        // No section yet, create one
        currentSection = {
          content: [result.text],
          level: 1,
          bbox: result.bbox
        };
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Determine heading level based on font size
   */
  private determineHeadingLevel(fontSize: number): number {
    if (fontSize > 40) return 1;
    if (fontSize > 30) return 2;
    if (fontSize > 25) return 3;
    return 4;
  }

  /**
   * Extract tables from OCR results
   */
  private extractTables(results: OCRResult[]): Table[] {
    // Simplified table detection
    // Real implementation would use more sophisticated algorithms
    const tables: Table[] = [];

    // Group results by similar Y coordinates (potential table rows)
    const rows = this.groupByRows(results);

    if (rows.length > 2) {
      // Check if this looks like a table
      const columnCounts = rows.map(row => row.length);
      const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;

      if (avgColumns > 1 && this.isUniform(columnCounts)) {
        tables.push({
          headers: rows[0].map(r => r.text),
          rows: rows.slice(1).map(row => row.map(r => r.text)),
          bbox: this.calculateBoundingBox(results),
          confidence: 0.85
        });
      }
    }

    return tables;
  }

  /**
   * Group OCR results by rows
   */
  private groupByRows(results: OCRResult[]): OCRResult[][] {
    const rows: OCRResult[][] = [];
    const threshold = 15; // Y coordinate threshold for same row

    for (const result of results) {
      let addedToRow = false;

      for (const row of rows) {
        if (Math.abs(row[0].bbox.y - result.bbox.y) < threshold) {
          row.push(result);
          addedToRow = true;
          break;
        }
      }

      if (!addedToRow) {
        rows.push([result]);
      }
    }

    // Sort each row by X coordinate
    rows.forEach(row => row.sort((a, b) => a.bbox.x - b.bbox.x));

    return rows;
  }

  /**
   * Check if array values are uniform
   */
  private isUniform(values: number[]): boolean {
    if (values.length < 2) return true;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) =>
      sum + Math.pow(val - avg, 2), 0) / values.length;

    return variance < 2; // Low variance indicates uniform columns
  }

  /**
   * Calculate bounding box for multiple results
   */
  private calculateBoundingBox(results: OCRResult[]): BoundingBox {
    if (results.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...results.map(r => r.bbox.x));
    const minY = Math.min(...results.map(r => r.bbox.y));
    const maxX = Math.max(...results.map(r => r.bbox.x + r.bbox.width));
    const maxY = Math.max(...results.map(r => r.bbox.y + r.bbox.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Extract document metadata
   */
  private async extractMetadata(imagePath: string): Promise<DocumentMetadata> {
    // Mock metadata extraction
    return {
      pageCount: 1,
      language: 'en',
      orientation: 0,
      dpi: 300,
      size: { width: 2480, height: 3508 }
    };
  }
}

/**
 * Receipt parser for structured data extraction
 */
class ReceiptParser {
  private ocrEngine: OCREngine;

  constructor(ocrEngine: OCREngine) {
    this.ocrEngine = ocrEngine;
  }

  /**
   * Parse receipt and extract structured data
   */
  async parseReceipt(imagePath: string): Promise<ReceiptData> {
    const ocrResults = await this.ocrEngine.recognizeText(imagePath);
    const text = ocrResults.map(r => r.text).join('\n');

    return {
      merchant: this.extractMerchant(text),
      date: this.extractDate(text),
      total: this.extractTotal(text),
      items: this.extractItems(text),
      taxAmount: this.extractTax(text),
      paymentMethod: this.extractPaymentMethod(text)
    };
  }

  private extractMerchant(text: string): string {
    // Extract merchant name (typically first line or after "FROM:")
    const lines = text.split('\n');
    return lines[0] || 'Unknown';
  }

  private extractDate(text: string): string {
    // Extract date using regex
    const datePattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
    const match = text.match(datePattern);
    return match ? match[0] : '';
  }

  private extractTotal(text: string): number {
    // Extract total amount
    const totalPattern = /(?:total|amount)[:\s]+\$?(\d+\.\d{2})/i;
    const match = text.match(totalPattern);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractItems(text: string): ReceiptItem[] {
    // Extract line items
    const items: ReceiptItem[] = [];
    const itemPattern = /(.+?)\s+\$?(\d+\.\d{2})/g;
    let match;

    while ((match = itemPattern.exec(text)) !== null) {
      items.push({
        description: match[1].trim(),
        price: parseFloat(match[2]),
        quantity: 1
      });
    }

    return items;
  }

  private extractTax(text: string): number {
    const taxPattern = /(?:tax)[:\s]+\$?(\d+\.\d{2})/i;
    const match = text.match(taxPattern);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractPaymentMethod(text: string): string {
    const methods = ['cash', 'credit', 'debit', 'card'];
    const lowerText = text.toLowerCase();

    for (const method of methods) {
      if (lowerText.includes(method)) {
        return method;
      }
    }

    return 'unknown';
  }
}

/**
 * Receipt data structure
 */
interface ReceiptData {
  merchant: string;
  date: string;
  total: number;
  items: ReceiptItem[];
  taxAmount: number;
  paymentMethod: string;
}

/**
 * Receipt item
 */
interface ReceiptItem {
  description: string;
  price: number;
  quantity: number;
}

/**
 * ID document parser
 */
class IDDocumentParser {
  private ocrEngine: OCREngine;

  constructor(ocrEngine: OCREngine) {
    this.ocrEngine = ocrEngine;
  }

  /**
   * Parse ID document (passport, driver's license, etc.)
   */
  async parseIDDocument(imagePath: string): Promise<IDData> {
    const ocrResults = await this.ocrEngine.recognizeText(imagePath);
    const text = ocrResults.map(r => r.text).join('\n');

    return {
      documentType: this.detectDocumentType(text),
      firstName: this.extractField(text, ['first name', 'given name']),
      lastName: this.extractField(text, ['last name', 'surname', 'family name']),
      documentNumber: this.extractDocumentNumber(text),
      dateOfBirth: this.extractField(text, ['date of birth', 'dob', 'birth date']),
      expiryDate: this.extractField(text, ['expiry', 'expires', 'exp date']),
      nationality: this.extractField(text, ['nationality', 'nation']),
      gender: this.extractField(text, ['sex', 'gender'])
    };
  }

  private detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('passport')) return 'passport';
    if (lowerText.includes('driver')) return 'drivers_license';
    if (lowerText.includes('identity') || lowerText.includes('id card')) return 'id_card';

    return 'unknown';
  }

  private extractField(text: string, keywords: string[]): string {
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[:\\s]+([^\\n]+)`, 'i');
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }

  private extractDocumentNumber(text: string): string {
    // Extract document number (alphanumeric pattern)
    const pattern = /[A-Z0-9]{8,12}/;
    const match = text.match(pattern);
    return match ? match[0] : '';
  }
}

/**
 * ID document data
 */
interface IDData {
  documentType: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  nationality: string;
  gender: string;
}

/**
 * Example usage demonstrations
 */
async function demonstrateOCR(): Promise<void> {
  console.log('=== OCR and Document Analysis ===\n');

  const config: OCRConfig = {
    engine: 'easyocr',
    languages: ['en', 'fr', 'de'],
    gpu: true,
    preprocessor: 'auto'
  };

  const ocrEngine = new OCREngine(config);
  await ocrEngine.initialize();

  try {
    // Basic OCR
    console.log('1. Basic Text Recognition:');
    const ocrResults = await ocrEngine.recognizeText('./documents/sample.jpg');
    console.log(`Detected ${ocrResults.length} text regions:`);
    ocrResults.forEach(result => {
      console.log(`  "${result.text}" (${(result.confidence * 100).toFixed(1)}%)`);
    });

    // Document structure analysis
    console.log('\n2. Document Structure Analysis:');
    const analyzer = new DocumentAnalyzer(ocrEngine);
    const structure = await analyzer.analyzeDocument('./documents/report.jpg');

    console.log(`Title: ${structure.title || 'N/A'}`);
    console.log(`Sections: ${structure.sections.length}`);
    console.log(`Tables: ${structure.tables.length}`);

    structure.sections.forEach((section, idx) => {
      console.log(`\nSection ${idx + 1} (Level ${section.level}):`);
      console.log(`  Heading: ${section.heading || 'N/A'}`);
      console.log(`  Content lines: ${section.content.length}`);
    });

    // Receipt parsing
    console.log('\n3. Receipt Parsing:');
    const receiptParser = new ReceiptParser(ocrEngine);
    const receipt = await receiptParser.parseReceipt('./documents/receipt.jpg');

    console.log(`Merchant: ${receipt.merchant}`);
    console.log(`Date: ${receipt.date}`);
    console.log(`Items: ${receipt.items.length}`);
    console.log(`Tax: $${receipt.taxAmount.toFixed(2)}`);
    console.log(`Total: $${receipt.total.toFixed(2)}`);
    console.log(`Payment: ${receipt.paymentMethod}`);

    // ID document parsing
    console.log('\n4. ID Document Parsing:');
    const idParser = new IDDocumentParser(ocrEngine);
    const idData = await idParser.parseIDDocument('./documents/passport.jpg');

    console.log(`Document Type: ${idData.documentType}`);
    console.log(`Name: ${idData.firstName} ${idData.lastName}`);
    console.log(`Document #: ${idData.documentNumber}`);
    console.log(`DOB: ${idData.dateOfBirth}`);
    console.log(`Nationality: ${idData.nationality}`);

  } finally {
    await ocrEngine.release();
  }
}

// Run example
if (require.main === module) {
  (async () => {
    try {
      await demonstrateOCR();
      console.log('\n✓ OCR demonstration completed');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

export {
  OCREngine,
  DocumentAnalyzer,
  ReceiptParser,
  IDDocumentParser,
  OCRResult,
  DocumentStructure,
  ReceiptData,
  IDData,
  OCRConfig
};
