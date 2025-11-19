/**
 * Computer Vision Platform - Image Enhancement Demo
 *
 * Demonstrates advanced image enhancement capabilities
 */

// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import {
  ImageEnhancer,
  createImageEnhancer,
  SuperResolutionModel,
} from '../src/enhancement/image-enhancer.js';
import { ImageData } from '../src/types.js';

// ============================================================================
// Demo 1: Super-Resolution Enhancement
// ============================================================================

async function demoSuperResolution() {
  console.log('='.repeat(80));
  console.log('Demo 1: Super-Resolution (2x, 3x, 4x upscaling)');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('quality');

  // Load low-resolution image
  const image = cv2.imread('examples/assets/low_res.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Original image: ${width}x${height}`);

  // Test different scales
  const scales = [2, 3, 4];

  for (const scale of scales) {
    console.log(`\nUpscaling ${scale}x...`);

    const result = await enhancer.superResolve(imageData, {
      scale,
      model: SuperResolutionModel.ESPCN,
    });

    console.log(
      `  Result: ${result.width}x${result.height} (${result.width * result.height} pixels)`
    );
    console.log(
      `  Size increase: ${((result.width * result.height) / (width * height)).toFixed(1)}x`
    );

    // Save result
    cv2.imwrite(`output/super_res_${scale}x.jpg`, result.data);
    console.log(`  Saved to: output/super_res_${scale}x.jpg`);
  }

  // Test different models
  console.log('\nComparing SR models (2x upscaling):');
  const models = [
    SuperResolutionModel.ESPCN,
    SuperResolutionModel.FSRCNN,
    SuperResolutionModel.EDSR,
    SuperResolutionModel.LAPSRN,
  ];

  for (const model of models) {
    const startTime = Date.now();
    const result = await enhancer.superResolve(imageData, { scale: 2, model });
    const time = Date.now() - startTime;

    console.log(`  ${model}: ${time}ms`);
    cv2.imwrite(`output/super_res_${model}.jpg`, result.data);
  }
}

// ============================================================================
// Demo 2: Noise Reduction
// ============================================================================

async function demoNoiseReduction() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 2: Advanced Noise Reduction');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load noisy image
  const image = cv2.imread('examples/assets/noisy.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing noisy image: ${width}x${height}`);

  // Test different denoising methods
  const methods: Array<'nlmeans' | 'bilateral' | 'gaussian'> = [
    'nlmeans',
    'bilateral',
    'gaussian',
  ];

  for (const method of methods) {
    console.log(`\nTesting ${method}...`);

    const result = enhancer.denoise(imageData, {
      method,
      h: 10,
      templateWindowSize: 7,
      searchWindowSize: 21,
    });

    console.log(`  Noise level: ${result.noiseLevel.toFixed(2)}`);
    console.log(`  SNR improvement: ${result.snrImprovement.toFixed(2)} dB`);

    cv2.imwrite(`output/denoised_${method}.jpg`, result.denoised.data);
    console.log(`  Saved to: output/denoised_${method}.jpg`);
  }

  // Test different strengths
  console.log('\nTesting different strengths (NL-Means):');
  const strengths = [5, 10, 15, 20];

  for (const h of strengths) {
    const result = enhancer.denoise(imageData, {
      method: 'nlmeans',
      h,
    });

    console.log(`  h=${h}: SNR improvement = ${result.snrImprovement.toFixed(2)} dB`);
    cv2.imwrite(`output/denoised_h${h}.jpg`, result.denoised.data);
  }
}

// ============================================================================
// Demo 3: Sharpening Techniques
// ============================================================================

async function demoSharpening() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 3: Image Sharpening Techniques');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load blurry image
  const image = cv2.imread('examples/assets/blurry.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing blurry image: ${width}x${height}`);

  // Test different sharpening methods
  const methods: Array<'unsharp' | 'laplacian' | 'highpass'> = [
    'unsharp',
    'laplacian',
    'highpass',
  ];

  for (const method of methods) {
    console.log(`\nTesting ${method} mask...`);

    const result = enhancer.sharpen(imageData, {
      method,
      amount: 1.0,
      radius: 1.0,
    });

    console.log(`  Sharpness score: ${result.sharpnessScore.toFixed(2)}`);
    console.log(`  Detail level: ${result.detailLevel}`);

    cv2.imwrite(`output/sharpened_${method}.jpg`, result.enhanced.data);
    console.log(`  Saved to: output/sharpened_${method}.jpg`);
  }

  // Test different amounts
  console.log('\nTesting different amounts (Unsharp Mask):');
  const amounts = [0.5, 1.0, 1.5, 2.0];

  for (const amount of amounts) {
    const result = enhancer.sharpen(imageData, {
      method: 'unsharp',
      amount,
    });

    console.log(
      `  Amount=${amount}: Sharpness = ${result.sharpnessScore.toFixed(2)}`
    );
    cv2.imwrite(`output/sharpened_${amount}.jpg`, result.enhanced.data);
  }
}

// ============================================================================
// Demo 4: HDR and Tone Mapping
// ============================================================================

async function demoHDRToneMapping() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 4: HDR and Tone Mapping');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load high dynamic range image
  const image = cv2.imread('examples/assets/hdr.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing HDR image: ${width}x${height}`);

  // Apply HDR processing
  console.log('\nApplying HDR enhancement...');
  const hdrResult = enhancer.applyHDR(imageData, {
    gamma: 1.2,
    saturation: 1.1,
    contrast: 1.15,
    exposure: 0.5,
  });

  console.log(`  Dynamic range: ${hdrResult.dynamicRange.toFixed(2)}`);
  console.log(`  Contrast ratio: ${hdrResult.contrastRatio.toFixed(2)}:1`);

  cv2.imwrite('output/hdr_enhanced.jpg', hdrResult.enhanced.data);
  console.log('  Saved to: output/hdr_enhanced.jpg');

  // Test different tone mapping methods
  console.log('\nTesting tone mapping methods:');
  const methods: Array<'drago' | 'reinhard' | 'mantiuk'> = [
    'drago',
    'reinhard',
    'mantiuk',
  ];

  for (const method of methods) {
    console.log(`\n  ${method}...`);

    const result = enhancer.toneMap(imageData, {
      method,
      gamma: 1.0,
      saturation: 1.0,
    });

    cv2.imwrite(`output/tonemap_${method}.jpg`, result.data);
    console.log(`    Saved to: output/tonemap_${method}.jpg`);
  }

  // Test different exposures
  console.log('\nTesting different exposures:');
  const exposures = [-1, -0.5, 0, 0.5, 1];

  for (const exposure of exposures) {
    const result = enhancer.applyHDR(imageData, { exposure });

    console.log(`  Exposure ${exposure}: DR = ${result.dynamicRange.toFixed(2)}`);
    cv2.imwrite(`output/hdr_exp_${exposure}.jpg`, result.enhanced.data);
  }
}

// ============================================================================
// Demo 5: Low-Light Enhancement
// ============================================================================

async function demoLowLightEnhancement() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 5: Low-Light Image Enhancement');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load low-light image
  const image = cv2.imread('examples/assets/low_light.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing low-light image: ${width}x${height}`);

  // Test different enhancement methods
  const methods: Array<'clahe' | 'gamma' | 'retinex'> = [
    'clahe',
    'gamma',
    'retinex',
  ];

  for (const method of methods) {
    console.log(`\nTesting ${method}...`);

    const result = enhancer.enhanceLowLight(imageData, {
      method,
      gamma: 2.2,
      gain: 1.5,
    });

    cv2.imwrite(`output/lowlight_${method}.jpg`, result.data);
    console.log(`  Saved to: output/lowlight_${method}.jpg`);
  }

  // Test different gamma values
  console.log('\nTesting different gamma values:');
  const gammas = [1.5, 2.0, 2.5, 3.0];

  for (const gamma of gammas) {
    const result = enhancer.enhanceLowLight(imageData, {
      method: 'gamma',
      gamma,
    });

    console.log(`  Gamma ${gamma}: Enhanced`);
    cv2.imwrite(`output/lowlight_gamma_${gamma}.jpg`, result.data);
  }
}

// ============================================================================
// Demo 6: Color Grading
// ============================================================================

async function demoColorGrading() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 6: Professional Color Grading');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load image for grading
  const image = cv2.imread('examples/assets/portrait.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Apply warm tone
  console.log('\nApplying warm tone...');
  const warm = enhancer.colorGrade(imageData, {
    temperature: 30,
    saturation: 10,
  });
  cv2.imwrite('output/grading_warm.jpg', warm.data);

  // Apply cool tone
  console.log('Applying cool tone...');
  const cool = enhancer.colorGrade(imageData, {
    temperature: -30,
    saturation: 10,
  });
  cv2.imwrite('output/grading_cool.jpg', cool.data);

  // Apply vibrant colors
  console.log('Applying vibrant colors...');
  const vibrant = enhancer.colorGrade(imageData, {
    vibrance: 40,
    saturation: 20,
  });
  cv2.imwrite('output/grading_vibrant.jpg', vibrant.data);

  // Apply muted colors
  console.log('Applying muted colors...');
  const muted = enhancer.colorGrade(imageData, {
    saturation: -30,
  });
  cv2.imwrite('output/grading_muted.jpg', muted.data);

  // Test temperature range
  console.log('\nTesting temperature range:');
  const temperatures = [-50, -25, 0, 25, 50];

  for (const temp of temperatures) {
    const result = enhancer.colorGrade(imageData, {
      temperature: temp,
    });

    console.log(`  Temperature ${temp}: Applied`);
    cv2.imwrite(`output/grading_temp_${temp}.jpg`, result.data);
  }
}

// ============================================================================
// Demo 7: Auto-Enhancement
// ============================================================================

async function demoAutoEnhancement() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 7: Automatic Image Enhancement');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load various problem images
  const testImages = [
    'examples/assets/dark.jpg',
    'examples/assets/bright.jpg',
    'examples/assets/low_contrast.jpg',
    'examples/assets/blurry2.jpg',
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

      console.log(`\nProcessing: ${imagePath}`);

      const result = enhancer.autoEnhance(imageData);

      console.log(`  Processing time: ${result.processingTime}ms`);
      console.log('  Improvements:');
      console.log(`    Brightness: ${result.improvements.brightness.toFixed(2)}`);
      console.log(`    Contrast: ${result.improvements.contrast.toFixed(2)}`);
      console.log(`    Sharpness: ${result.improvements.sharpness.toFixed(2)}`);

      const filename = imagePath.split('/').pop()?.replace('.jpg', '_auto.jpg');
      cv2.imwrite(`output/${filename}`, result.enhanced.data);
      console.log(`  Saved to: output/${filename}`);
    } catch (e) {
      console.log(`  Image not found: ${imagePath}`);
    }
  }
}

// ============================================================================
// Demo 8: Basic Adjustments
// ============================================================================

async function demoBasicAdjustments() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 8: Basic Image Adjustments');
  console.log('='.repeat(80));

  const enhancer = createImageEnhancer('balanced');

  // Load test image
  const image = cv2.imread('examples/assets/test.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Test brightness
  console.log('\nAdjusting brightness...');
  const bright = enhancer.adjustBasic(imageData, { brightness: 30 });
  cv2.imwrite('output/basic_bright.jpg', bright.data);
  console.log('  Saved to: output/basic_bright.jpg');

  // Test contrast
  console.log('\nAdjusting contrast...');
  const contrast = enhancer.adjustBasic(imageData, { contrast: 20 });
  cv2.imwrite('output/basic_contrast.jpg', contrast.data);
  console.log('  Saved to: output/basic_contrast.jpg');

  // Test saturation
  console.log('\nAdjusting saturation...');
  const saturation = enhancer.adjustBasic(imageData, { saturation: 30 });
  cv2.imwrite('output/basic_saturation.jpg', saturation.data);
  console.log('  Saved to: output/basic_saturation.jpg');

  // Test combined adjustments
  console.log('\nApplying combined adjustments...');
  const combined = enhancer.adjustBasic(imageData, {
    brightness: 10,
    contrast: 15,
    saturation: 20,
    sharpness: 0.5,
  });
  cv2.imwrite('output/basic_combined.jpg', combined.data);
  console.log('  Saved to: output/basic_combined.jpg');
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runAllDemos() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'IMAGE ENHANCEMENT DEMO' + ' '.repeat(36) + '║');
  console.log('║' + ' '.repeat(18) + 'Powered by OpenCV via Elide' + ' '.repeat(34) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  try {
    // Create output directory
    try {
      cv2.mkdir('output');
    } catch (e) {
      // Directory already exists
    }

    // Run demos
    await demoSuperResolution();
    await demoNoiseReduction();
    await demoSharpening();
    await demoHDRToneMapping();
    await demoLowLightEnhancement();
    await demoColorGrading();
    await demoAutoEnhancement();
    await demoBasicAdjustments();

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
  demoSuperResolution,
  demoNoiseReduction,
  demoSharpening,
  demoHDRToneMapping,
  demoLowLightEnhancement,
  demoColorGrading,
  demoAutoEnhancement,
  demoBasicAdjustments,
};
