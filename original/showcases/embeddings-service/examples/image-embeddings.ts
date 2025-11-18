/**
 * Image embeddings example using CLIP
 * Note: Requires actual image files to run
 */

import { Logger } from '../shared/utils';
import path from 'path';

async function main() {
  Logger.info('=== Image Embeddings Example ===\n');

  Logger.info('Image embeddings use CLIP model for multimodal understanding.');
  Logger.info('CLIP can encode both images and text into the same embedding space.\n');

  // Example 1: Text-to-image search
  Logger.info('1. Text-to-Image Search Use Case:');
  Logger.info('   Query: "a dog playing in a park"');
  Logger.info('   → Encode query text with CLIP text encoder');
  Logger.info('   → Encode image database with CLIP image encoder');
  Logger.info('   → Find most similar images using cosine similarity');
  Logger.info('   Result: Images of dogs in parks will rank highest\n');

  // Example 2: Image similarity
  Logger.info('2. Image Similarity Use Case:');
  Logger.info('   Use case: Find similar product images');
  Logger.info('   → Encode product catalog images');
  Logger.info('   → For each query image, find nearest neighbors');
  Logger.info('   → Recommend similar products\n');

  // Example 3: Image classification
  Logger.info('3. Zero-Shot Image Classification:');
  Logger.info('   Categories: ["a photo of a cat", "a photo of a dog", "a photo of a bird"]');
  Logger.info('   → Encode category descriptions as text');
  Logger.info('   → Encode query image');
  Logger.info('   → Find highest similarity to determine category\n');

  // Example implementation structure
  Logger.info('4. Example API Usage:');
  Logger.info('   ```typescript');
  Logger.info('   // Encode image from file path');
  Logger.info('   const result = await fetch("http://localhost:3000/embed/image", {');
  Logger.info('     method: "POST",');
  Logger.info('     headers: { "Content-Type": "application/json" },');
  Logger.info('     body: JSON.stringify({');
  Logger.info('       images: ["./assets/sample-image.jpg"]');
  Logger.info('     })');
  Logger.info('   });');
  Logger.info('   const { embeddings } = await result.json();');
  Logger.info('   ```\n');

  // Example 5: Multimodal applications
  Logger.info('5. Multimodal Search Applications:');
  Logger.info('   - E-commerce: Search products by text or image');
  Logger.info('   - Content moderation: Classify images using text descriptions');
  Logger.info('   - Image retrieval: Natural language queries for image databases');
  Logger.info('   - Recommendation: Similar images based on user preferences\n');

  Logger.info('=== Example Complete ===');
  Logger.info('\nNote: To run with actual images:');
  Logger.info('1. Place sample images in ./assets/');
  Logger.info('2. Update the code to use actual file paths');
  Logger.info('3. Start the API server: npm start');
  Logger.info('4. Use the HTTP API to encode images');
}

main().catch(error => {
  Logger.error('Example failed:', error);
  process.exit(1);
});
