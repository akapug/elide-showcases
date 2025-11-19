/**
 * Basic Usage Examples
 *
 * Simple, focused examples showing how to use each module of the
 * Medical Imaging Platform.
 */

import {
  DICOMProcessor,
  ImageAnalyzer,
  MedicalSegmentation,
  DiagnosisAssistant,
  VolumeVisualizer,
  PACSIntegration,
  type PACSConfig,
} from '../src/index';

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sitk from 'python:SimpleITK';
// @ts-ignore
import pydicom from 'python:pydicom';

console.log('📚 Medical Imaging Platform - Basic Usage Examples\n');
console.log('='.repeat(70) + '\n');

// ============================================================================
// Example 1: Read and Display DICOM File
// ============================================================================

console.log('Example 1: Read and Display DICOM File\n');

async function example1_readDICOM() {
  // Create test DICOM
  const ds = new pydicom.Dataset();
  ds.PatientName = 'EXAMPLE^PATIENT';
  ds.PatientID = 'EX001';
  ds.Modality = 'CT';
  ds.Rows = 256;
  ds.Columns = 256;

  const pixels = numpy.random.randint(0, 1000, [256, 256], dtype: 'uint16');
  ds.PixelData = pixels.tobytes();
  ds.SamplesPerPixel = 1;
  ds.PhotometricInterpretation = 'MONOCHROME2';
  ds.BitsAllocated = 16;
  ds.BitsStored = 16;
  ds.HighBit = 15;
  ds.PixelRepresentation = 0;

  const filepath = '/tmp/example1.dcm';
  pydicom.dcmwrite(filepath, ds);

  // Read with DICOMProcessor
  const processor = new DICOMProcessor();
  const dataset = processor.readDICOM(filepath);

  console.log(`  Patient: ${dataset.PatientName}`);
  console.log(`  ID: ${dataset.PatientID}`);
  console.log(`  Modality: ${dataset.Modality}`);
  console.log(`  Image Size: ${dataset.Rows}x${dataset.Columns}`);

  // Get pixel statistics
  const info = processor.getPixelArrayInfo(dataset);
  console.log(`  Pixel Range: ${info.min} - ${info.max}`);
  console.log(`  Mean: ${info.mean.toFixed(1)}`);
  console.log(`  ✓ Done\n`);
}

await example1_readDICOM();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 2: Apply Image Filters
// ============================================================================

console.log('Example 2: Apply Image Filters\n');

function example2_filters() {
  // Create test image
  const testArray = numpy.random.rand(256, 256) * 1000;
  const analyzer = new ImageAnalyzer();
  const image = sitk.GetImageFromArray(testArray);

  // Apply Gaussian smoothing
  console.log('  Applying Gaussian smoothing...');
  const smoothed = analyzer.gaussianSmooth(image, 2.0);
  console.log('  ✓ Smoothed');

  // Enhance contrast
  console.log('  Enhancing contrast with CLAHE...');
  const enhanced = analyzer.clahe(smoothed);
  console.log('  ✓ Enhanced');

  // Detect edges
  console.log('  Detecting edges...');
  const edges = analyzer.detectEdgesSobel(enhanced);
  console.log('  ✓ Edges detected');

  // Get statistics
  console.log('  Calculating statistics...');
  const stats = analyzer.getStatistics(enhanced);
  console.log(`    Mean: ${stats.mean.toFixed(2)}`);
  console.log(`    P95: ${stats.percentile95.toFixed(2)}`);
  console.log('  ✓ Done\n');
}

example2_filters();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 3: Segment Organs
// ============================================================================

console.log('Example 3: Segment Organs from CT Scan\n');

async function example3_segmentation() {
  // Create synthetic CT volume
  const volume = numpy.zeros([64, 128, 128]);

  // Add synthetic liver (HU 40-60)
  volume[20:50, 40:80, 40:80] = 50 + numpy.random.randn(30, 40, 40) * 5;

  // Add synthetic lungs (HU -900 to -700)
  volume[20:50, 20:40, 20:60] = -800 + numpy.random.randn(30, 20, 40) * 50;
  volume[20:50, 88:108, 20:60] = -800 + numpy.random.randn(30, 20, 40) * 50;

  const image = sitk.GetImageFromArray(volume);
  image.SetSpacing([1.0, 1.0, 2.0]);

  const segmenter = new MedicalSegmentation();

  // Segment liver
  console.log('  Segmenting liver...');
  const liver = await segmenter.segmentLiver(image);
  console.log(`    Volume: ${(liver.volume / 1000).toFixed(1)} ml`);
  console.log(`    Confidence: ${(liver.confidence * 100).toFixed(0)}%`);

  // Segment lungs
  console.log('  Segmenting lungs...');
  const lungs = await segmenter.segmentLungs(image);
  console.log(`    Volume: ${(lungs.volume / 1000).toFixed(1)} ml`);
  console.log(`    Confidence: ${(lungs.confidence * 100).toFixed(0)}%`);

  // Detect tumors in liver
  console.log('  Detecting tumors in liver...');
  const tumors = await segmenter.detectTumors(image, liver.mask);
  console.log(`    Found ${tumors.length} potential tumors`);

  console.log('  ✓ Done\n');
}

await example3_segmentation();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 4: AI Diagnosis
// ============================================================================

console.log('Example 4: AI-Assisted Diagnosis\n');

async function example4_diagnosis() {
  // Create test chest X-ray
  const xray = numpy.random.rand(512, 512) * 255;

  // Add synthetic lung regions
  xray[100:400, 50:230] = xray[100:400, 50:230] * 0.3;
  xray[100:400, 280:460] = xray[100:400, 280:460] * 0.3;

  // Add potential abnormality
  xray[200:250, 150:200] = 200;

  const image = sitk.GetImageFromArray(xray);

  const assistant = new DiagnosisAssistant();

  console.log('  Loading ML model...');
  await assistant.loadTensorFlowModel();
  console.log('  ✓ Model loaded');

  console.log('  Classifying disease...');
  const diagnosis = await assistant.classifyDisease(image);
  console.log(`    Diagnosis: ${diagnosis.label}`);
  console.log(`    Confidence: ${(diagnosis.confidence * 100).toFixed(1)}%`);
  console.log(`    Severity: ${diagnosis.severity}`);

  console.log('  Top 3 differential diagnoses:');
  const sorted = Object.entries(diagnosis.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [disease, prob] of sorted) {
    console.log(`    - ${disease}: ${(prob * 100).toFixed(1)}%`);
  }

  console.log('  ✓ Done\n');
}

await example4_diagnosis();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 5: 3D Visualization
// ============================================================================

console.log('Example 5: 3D Visualization and Measurements\n');

function example5_visualization() {
  // Create test volume
  const volume = numpy.random.rand(64, 128, 128) * 1000;

  // Add synthetic organ
  for (let z = 20; z < 50; z++) {
    for (let y = 40; y < 80; y++) {
      for (let x = 40; x < 80; x++) {
        const dx = x - 60;
        const dy = y - 60;
        const dz = z - 35;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 20) {
          volume[z][y][x] = 800;
        }
      }
    }
  }

  const visualizer = new VolumeVisualizer();

  // Multi-planar views
  console.log('  Generating multi-planar views...');
  const mpr = visualizer.getMultiplanarViews(volume);
  console.log(`    Axial: ${mpr.axial.shape}`);
  console.log(`    Sagittal: ${mpr.sagittal.shape}`);
  console.log(`    Coronal: ${mpr.coronal.shape}`);

  // MIP
  console.log('  Creating MIP...');
  const mip = visualizer.maximumIntensityProjection(volume, 0);
  console.log(`    MIP shape: ${mip.shape}`);

  // Surface extraction
  console.log('  Extracting 3D surface...');
  const image = sitk.GetImageFromArray(volume);
  const mesh = visualizer.extractSurface(image, 700, [1.0, 1.0, 2.0]);
  console.log(`    Vertices: ${mesh.numVertices}`);
  console.log(`    Faces: ${mesh.numFaces}`);

  // Measurements
  console.log('  Making measurements...');
  const distance = visualizer.measureDistance([10, 10, 10], [50, 50, 30], [1, 1, 2]);
  console.log(`    Distance: ${distance.value.toFixed(1)} mm`);

  const angle = visualizer.measureAngle([0, 0, 0], [10, 10, 10], [20, 0, 0]);
  console.log(`    Angle: ${angle.value.toFixed(1)} degrees`);

  console.log('  ✓ Done\n');
}

example5_visualization();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 6: PACS Integration
// ============================================================================

console.log('Example 6: PACS Integration\n');

async function example6_pacs() {
  const config: PACSConfig = {
    host: 'pacs.hospital.org',
    port: 11112,
    aet: 'HOSPITAL_PACS',
  };

  const pacs = new PACSIntegration(config);

  // Test connection
  console.log('  Testing PACS connection...');
  const connected = await pacs.testConnection();
  console.log(`    Status: ${connected ? 'Connected ✓' : 'Disconnected ✗'}`);

  // Query studies
  console.log('  Querying studies...');
  const studies = await pacs.findStudies({
    patientID: 'PATIENT001',
    modality: 'CT',
  });
  console.log(`    Found ${studies.length} studies`);

  if (studies.length > 0) {
    const study = studies[0];
    console.log(`    Latest study: ${study.studyDescription}`);
    console.log(`    Date: ${study.studyDate}`);
    console.log(`    Images: ${study.numberOfImages}`);

    // Query series
    console.log('  Querying series...');
    const series = await pacs.findSeries(study.studyInstanceUID);
    console.log(`    Series: ${series.length}`);
  }

  // Query worklist
  console.log('  Querying worklist...');
  const worklist = await pacs.queryWorklist();
  console.log(`    Scheduled procedures: ${worklist.length}`);

  console.log('  ✓ Done\n');
}

await example6_pacs();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 7: Batch Processing
// ============================================================================

console.log('Example 7: Batch Processing Multiple Studies\n');

async function example7_batchProcessing() {
  const processor = new DICOMProcessor();
  const analyzer = new ImageAnalyzer();

  // Create multiple test files
  console.log('  Creating test files...');
  const files: string[] = [];

  for (let i = 0; i < 10; i++) {
    const ds = new pydicom.Dataset();
    ds.PatientName = `BATCH^TEST${i}`;
    ds.PatientID = `BATCH00${i}`;
    ds.Modality = 'CT';
    ds.Rows = 128;
    ds.Columns = 128;

    const pixels = numpy.random.randint(0, 1000, [128, 128], dtype: 'uint16');
    ds.PixelData = pixels.tobytes();
    ds.SamplesPerPixel = 1;
    ds.PhotometricInterpretation = 'MONOCHROME2';
    ds.BitsAllocated = 16;
    ds.BitsStored = 16;
    ds.HighBit = 15;
    ds.PixelRepresentation = 0;

    const filepath = `/tmp/batch-${i}.dcm`;
    pydicom.dcmwrite(filepath, ds);
    files.push(filepath);
  }

  console.log(`    Created ${files.length} files`);

  // Process each file
  console.log('  Processing files...');
  const startTime = performance.now();

  for (const file of files) {
    // Read DICOM
    const dataset = processor.readDICOM(file);

    // Get pixels
    const pixels = processor.getPixelArray(dataset);

    // Create image
    const image = sitk.GetImageFromArray(pixels);

    // Apply filter
    analyzer.gaussianSmooth(image, 1.0);
  }

  const totalTime = performance.now() - startTime;

  console.log(`    Processed ${files.length} files in ${totalTime.toFixed(1)}ms`);
  console.log(`    Average: ${(totalTime / files.length).toFixed(1)}ms per file`);
  console.log('  ✓ Done\n');
}

await example7_batchProcessing();

console.log('─'.repeat(70) + '\n');

// ============================================================================
// Example 8: Complete Mini-Pipeline
// ============================================================================

console.log('Example 8: Complete Mini Diagnostic Pipeline\n');

async function example8_miniPipeline() {
  console.log('  Step 1: Create test CT scan');
  // Create synthetic CT
  const ds = new pydicom.Dataset();
  ds.PatientName = 'MINI^PIPELINE';
  ds.PatientID = 'MINI001';
  ds.Modality = 'CT';
  ds.Rows = 256;
  ds.Columns = 256;

  const pixels = numpy.random.rand(256, 256) * 1000;
  ds.PixelData = numpy.uint16(pixels).tobytes();
  ds.SamplesPerPixel = 1;
  ds.PhotometricInterpretation = 'MONOCHROME2';
  ds.BitsAllocated = 16;
  ds.BitsStored = 16;
  ds.HighBit = 15;
  ds.PixelRepresentation = 0;

  const filepath = '/tmp/mini-pipeline.dcm';
  pydicom.dcmwrite(filepath, ds);
  console.log('    ✓ CT scan created');

  console.log('  Step 2: Load and process DICOM');
  const processor = new DICOMProcessor();
  const dataset = processor.readDICOM(filepath);
  const pixelArray = processor.getPixelArray(dataset);
  console.log(`    ✓ Loaded ${dataset.Rows}x${dataset.Columns} image`);

  console.log('  Step 3: Enhance image quality');
  const analyzer = new ImageAnalyzer();
  const image = sitk.GetImageFromArray(pixelArray);
  const enhanced = analyzer.clahe(image);
  console.log('    ✓ Image enhanced');

  console.log('  Step 4: Calculate statistics');
  const stats = analyzer.getStatistics(enhanced);
  console.log(`    Mean: ${stats.mean.toFixed(1)}, StdDev: ${stats.std.toFixed(1)}`);

  console.log('  Step 5: AI diagnosis');
  const assistant = new DiagnosisAssistant();
  await assistant.loadTensorFlowModel();
  const diagnosis = await assistant.classifyDisease(image);
  console.log(`    Diagnosis: ${diagnosis.label} (${(diagnosis.confidence * 100).toFixed(0)}%)`);

  console.log('  Step 6: Generate report');
  const report = await assistant.generateReport(diagnosis);
  console.log('    ✓ Report generated');

  console.log('  ✓ Pipeline completed!\n');
}

await example8_miniPipeline();

console.log('='.repeat(70));
console.log('✅ All Examples Completed Successfully!');
console.log('='.repeat(70) + '\n');

console.log('💡 Key Takeaways:\n');
console.log('  • Python medical libraries (pydicom, SimpleITK, TensorFlow) work in TypeScript');
console.log('  • Zero serialization overhead for image arrays');
console.log('  • Complete diagnostic workflows in single process');
console.log('  • Production-ready performance and features');
console.log('  • Simple, intuitive API');
console.log('\n🚀 Ready to build your own medical imaging applications with Elide!\n');
