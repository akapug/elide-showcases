/**
 * Computer Vision Platform - OCR Demo
 *
 * Demonstrates advanced OCR capabilities using Tesseract
 */

// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import {
  TextRecognizer,
  createTextRecognizer,
  PageSegmentationMode,
  PreprocessingStep,
} from '../src/ocr/text-recognizer.js';
import { ImageData } from '../src/types.js';

// ============================================================================
// Demo 1: Basic Text Recognition
// ============================================================================

async function demoBasicOCR() {
  console.log('='.repeat(80));
  console.log('Demo 1: Basic Text Recognition');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('document');

  // Load test image
  const image = cv2.imread('examples/assets/document.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Recognize text
  const result = await recognizer.recognizeText(imageData);

  console.log(`\nText recognized in ${result.processingTime}ms`);
  console.log(`Found ${result.detections.length} text regions`);

  // Display first few detections
  console.log('\nSample detections:');
  for (let i = 0; i < Math.min(5, result.detections.length); i++) {
    const detection = result.detections[i];
    console.log(
      `  "${detection.text}" (confidence: ${detection.confidence.toFixed(3)})`
    );
  }

  // Display full text
  console.log('\nFull text:');
  console.log('─'.repeat(80));
  console.log(result.fullText);
  console.log('─'.repeat(80));

  // Draw detections on image
  const annotated = image.copy();
  for (const detection of result.detections) {
    cv2.rectangle(
      annotated,
      [detection.bbox.x, detection.bbox.y],
      [
        detection.bbox.x + detection.bbox.width,
        detection.bbox.y + detection.bbox.height,
      ],
      [0, 255, 0],
      2
    );
  }

  cv2.imwrite('output/ocr_basic.jpg', annotated);
  console.log('\nAnnotated image saved to: output/ocr_basic.jpg');
}

// ============================================================================
// Demo 2: Structured Document Recognition
// ============================================================================

async function demoStructuredOCR() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 2: Structured Document Recognition');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('document');

  // Load test image
  const image = cv2.imread('examples/assets/structured_doc.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Recognize structured text
  const structure = await recognizer.recognizeStructured(imageData);

  console.log(`\nDocument structure analyzed`);
  console.log(`  Blocks: ${structure.blocks.length}`);
  console.log(`  Columns: ${structure.layout.columns}`);
  console.log(`  Text regions: ${structure.layout.textRegions.length}`);

  // Display blocks
  console.log('\nText blocks:');
  for (let i = 0; i < structure.blocks.length; i++) {
    const block = structure.blocks[i];
    console.log(`\nBlock ${i + 1}:`);
    console.log(`  Lines: ${block.lines.length}`);
    console.log(`  Confidence: ${block.confidence.toFixed(3)}`);
    console.log(`  Text: ${block.text.substring(0, 100)}${block.text.length > 100 ? '...' : ''}`);
  }

  // Visualize structure
  const annotated = image.copy();
  const colors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 0, 255],
  ];

  for (let i = 0; i < structure.blocks.length; i++) {
    const block = structure.blocks[i];
    const color = colors[i % colors.length];

    cv2.rectangle(
      annotated,
      [block.bbox.x, block.bbox.y],
      [block.bbox.x + block.bbox.width, block.bbox.y + block.bbox.height],
      color,
      3
    );
  }

  cv2.imwrite('output/ocr_structured.jpg', annotated);
  console.log('\nAnnotated image saved to: output/ocr_structured.jpg');
}

// ============================================================================
// Demo 3: Table Extraction
// ============================================================================

async function demoTableExtraction() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 3: Table Extraction');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('document');

  // Load test image
  const image = cv2.imread('examples/assets/table.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Detect tables
  const tables = await recognizer.detectTables(imageData);

  console.log(`\nFound ${tables.length} table(s)`);

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    console.log(`\nTable ${i + 1}:`);
    console.log(`  Rows: ${table.numRows}`);
    console.log(`  Columns: ${table.numCols}`);

    // Display table data
    console.log('\n  Table data:');
    for (let row = 0; row < Math.min(5, table.numRows); row++) {
      const rowData = table.cells[row].map(cell => cell.text.substring(0, 15));
      console.log(`  ${rowData.join(' | ')}`);
    }

    if (table.numRows > 5) {
      console.log(`  ... (${table.numRows - 5} more rows)`);
    }
  }

  // Visualize tables
  const annotated = image.copy();
  for (const table of tables) {
    for (const row of table.cells) {
      for (const cell of row) {
        cv2.rectangle(
          annotated,
          [cell.bbox.x, cell.bbox.y],
          [cell.bbox.x + cell.bbox.width, cell.bbox.y + cell.bbox.height],
          [0, 255, 0],
          2
        );
      }
    }
  }

  cv2.imwrite('output/ocr_table.jpg', annotated);
  console.log('\nAnnotated image saved to: output/ocr_table.jpg');
}

// ============================================================================
// Demo 4: Multi-language Recognition
// ============================================================================

async function demoMultiLanguageOCR() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 4: Multi-language Recognition');
  console.log('='.repeat(80));

  const languages = ['eng', 'fra', 'deu', 'spa', 'ita'];

  for (const lang of languages) {
    console.log(`\nTesting ${lang}...`);

    const imagePath = `examples/assets/text_${lang}.jpg`;
    try {
      const image = cv2.imread(imagePath);
      const [height, width] = image.shape.slice(0, 2);

      const imageData: ImageData = {
        data: image,
        width,
        height,
        channels: 3,
        dtype: 'uint8',
      };

      const recognizer = new TextRecognizer({
        language: lang,
        pageSegmentationMode: PageSegmentationMode.AUTO,
      });

      const result = await recognizer.recognizeText(imageData);

      console.log(`  Detected ${result.detections.length} text regions`);
      console.log(`  Sample text: ${result.fullText.substring(0, 100)}...`);
    } catch (e) {
      console.log(`  Image not found: ${imagePath}`);
    }
  }
}

// ============================================================================
// Demo 5: Language Detection
// ============================================================================

async function demoLanguageDetection() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 5: Automatic Language Detection');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('document');

  const testImages = [
    'examples/assets/unknown_lang_1.jpg',
    'examples/assets/unknown_lang_2.jpg',
    'examples/assets/unknown_lang_3.jpg',
  ];

  for (const imagePath of testImages) {
    try {
      const image = cv2.imread(imagePath);
      const [height, width] = image.shape.slice(0, 2);

      const imageData: ImageData = {
        data: image,
        width,
        height,
        channels: 3,
        dtype: 'uint8',
      };

      console.log(`\nAnalyzing: ${imagePath}`);

      const langResult = await recognizer.detectLanguage(imageData);

      console.log(`  Detected language: ${langResult.language}`);
      console.log(`  Confidence: ${langResult.confidence.toFixed(3)}`);
      console.log(`  Script: ${langResult.script}`);
    } catch (e) {
      console.log(`  Image not found: ${imagePath}`);
    }
  }
}

// ============================================================================
// Demo 6: Receipt OCR
// ============================================================================

async function demoReceiptOCR() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 6: Receipt OCR (Specialized Configuration)');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('receipt');

  // Load test receipt
  const image = cv2.imread('examples/assets/receipt.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing receipt: ${width}x${height}`);

  // Enhance image for better OCR
  const enhanced = recognizer.enhanceForOCR(imageData);
  console.log(`\nImage enhanced:`);
  console.log(`  Contrast improvement: ${enhanced.improvements.contrast.toFixed(2)}`);
  console.log(`  Clarity improvement: ${enhanced.improvements.clarity.toFixed(2)}`);
  console.log(`  Readability improvement: ${enhanced.improvements.readability.toFixed(2)}`);

  // Recognize text
  const result = await recognizer.recognizeText(enhanced.enhanced);

  console.log(`\nText recognized in ${result.processingTime}ms`);
  console.log(`Found ${result.detections.length} text regions`);

  // Extract key information
  console.log('\nReceipt content:');
  console.log('─'.repeat(80));
  console.log(result.fullText);
  console.log('─'.repeat(80));

  // Parse receipt items
  const lines = result.fullText.split('\n');
  const items: Array<{ name: string; price: string }> = [];

  for (const line of lines) {
    const priceMatch = line.match(/\$?\d+\.\d{2}/);
    if (priceMatch) {
      items.push({
        name: line.substring(0, priceMatch.index).trim(),
        price: priceMatch[0],
      });
    }
  }

  console.log('\nExtracted items:');
  for (const item of items) {
    console.log(`  ${item.name}: ${item.price}`);
  }
}

// ============================================================================
// Demo 7: License Plate Recognition
// ============================================================================

async function demoLicensePlateOCR() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 7: License Plate Recognition');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('license-plate');

  const testPlates = [
    'examples/assets/plate_1.jpg',
    'examples/assets/plate_2.jpg',
    'examples/assets/plate_3.jpg',
  ];

  for (const imagePath of testPlates) {
    try {
      const image = cv2.imread(imagePath);
      const [height, width] = image.shape.slice(0, 2);

      const imageData: ImageData = {
        data: image,
        width,
        height,
        channels: 3,
        dtype: 'uint8',
      };

      console.log(`\nProcessing: ${imagePath}`);

      const result = await recognizer.recognizeText(imageData);

      if (result.detections.length > 0) {
        const plateText = result.detections
          .map(d => d.text)
          .join('')
          .replace(/\s/g, '');
        console.log(`  License plate: ${plateText}`);
        console.log(`  Confidence: ${result.detections[0].confidence.toFixed(3)}`);
      } else {
        console.log('  No text detected');
      }
    } catch (e) {
      console.log(`  Image not found: ${imagePath}`);
    }
  }
}

// ============================================================================
// Demo 8: Image Enhancement for OCR
// ============================================================================

async function demoOCREnhancement() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 8: Image Enhancement Comparison');
  console.log('='.repeat(80));

  const recognizer = createTextRecognizer('document');

  // Load low-quality image
  const image = cv2.imread('examples/assets/low_quality.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing low-quality image: ${width}x${height}`);

  // Recognize without enhancement
  console.log('\nWithout enhancement:');
  const result1 = await recognizer.recognizeText(imageData);
  console.log(`  Detections: ${result1.detections.length}`);
  console.log(
    `  Average confidence: ${(result1.detections.reduce((sum, d) => sum + d.confidence, 0) / result1.detections.length).toFixed(3)}`
  );

  // Recognize with enhancement
  console.log('\nWith enhancement:');
  const enhanced = recognizer.enhanceForOCR(imageData);
  const result2 = await recognizer.recognizeText(enhanced.enhanced);
  console.log(`  Detections: ${result2.detections.length}`);
  console.log(
    `  Average confidence: ${(result2.detections.reduce((sum, d) => sum + d.confidence, 0) / result2.detections.length).toFixed(3)}`
  );

  // Save comparison
  const comparison = numpy.hstack([image, enhanced.enhanced.data]);
  cv2.imwrite('output/ocr_enhancement_comparison.jpg', comparison);
  console.log('\nComparison saved to: output/ocr_enhancement_comparison.jpg');
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runAllDemos() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(25) + 'OCR DEMO' + ' '.repeat(45) + '║');
  console.log('║' + ' '.repeat(15) + 'Powered by Tesseract via Elide' + ' '.repeat(33) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  try {
    // Create output directory
    try {
      cv2.mkdir('output');
    } catch (e) {
      // Directory already exists
    }

    // Run demos
    await demoBasicOCR();
    await demoStructuredOCR();
    await demoTableExtraction();
    await demoMultiLanguageOCR();
    await demoLanguageDetection();
    await demoReceiptOCR();
    await demoLicensePlateOCR();
    await demoOCREnhancement();

    console.log('\n' + '='.repeat(80));
    console.log('All demos completed successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\nError running demos:', error);
    process.exit(1);
  }
}

// Run demos if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos();
}

export {
  demoBasicOCR,
  demoStructuredOCR,
  demoTableExtraction,
  demoMultiLanguageOCR,
  demoLanguageDetection,
  demoReceiptOCR,
  demoLicensePlateOCR,
  demoOCREnhancement,
};
