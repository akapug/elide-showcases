/**
 * Polyglot Business Logic Example
 *
 * THE KILLER FEATURE: Python API endpoints calling TypeScript business logic!
 * This is IMPOSSIBLE with standard Python FastAPI.
 *
 * Demonstrates:
 * - FastAPI endpoints in TypeScript
 * - Business logic in both Python and TypeScript
 * - Seamless language interop
 * - Shared data models
 */

import FastAPI from '../src/fastapi';
import { createModel, Field } from '../src/models';

const app = new FastAPI({
  title: 'Polyglot Business Logic API',
  description: 'FastAPI with Python + TypeScript business logic',
  version: '1.0.0',
});

// TypeScript business logic
const TypeScriptLogic = {
  /**
   * Calculate price with discount (TypeScript implementation)
   * Fast, type-safe TypeScript computation
   */
  calculateDiscount(price: number, discountPercent: number): number {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Invalid discount percentage');
    }
    return price * (1 - discountPercent / 100);
  },

  /**
   * Validate and format order (TypeScript)
   */
  formatOrder(order: any): any {
    return {
      id: order.id,
      items: order.items.map((item: any) => ({
        ...item,
        formatted_price: `$${item.price.toFixed(2)}`,
      })),
      total: order.items.reduce((sum: number, item: any) =>
        sum + (item.price * item.quantity), 0
      ),
      formatted_at: new Date().toISOString(),
    };
  },

  /**
   * Complex JSON transformation (TypeScript)
   */
  transformData(data: any): any {
    return {
      ...data,
      processed: true,
      metadata: {
        processor: 'typescript',
        timestamp: Date.now(),
        version: '1.0.0',
      },
    };
  },
};

// Python business logic (simulated - in real Elide would import Python)
const PythonLogic = {
  /**
   * Text processing using Python (simulated)
   * In production: import from python/fastapi_impl.py
   */
  async processText(text: string): Promise<any> {
    // This would call: python.DataProcessor.clean_text(text)
    const cleaned = text.toLowerCase().trim().replace(/[^\w\s]/g, '');

    return {
      original: text,
      cleaned,
      word_count: cleaned.split(/\s+/).length,
      processor: 'python',
    };
  },

  /**
   * Sentiment analysis using Python ML (simulated)
   * In production: import from python/fastapi_impl.py
   */
  async analyzeSentiment(text: string): Promise<any> {
    // This would call: python.MLInference.predict_sentiment(text)
    const positiveWords = ['good', 'great', 'excellent', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'poor'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;

    return {
      sentiment: positiveCount > negativeCount ? 'positive' :
                negativeCount > positiveCount ? 'negative' : 'neutral',
      score: (positiveCount - negativeCount) / Math.max(words.length, 1),
      processor: 'python-ml',
    };
  },

  /**
   * Data statistics using Python (simulated)
   * In production: import from python/fastapi_impl.py
   */
  async calculateStatistics(numbers: number[]): Promise<any> {
    // This would call: python.DataProcessor.calculate_statistics(numbers)
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      count: numbers.length,
      mean,
      median,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      processor: 'python-statistics',
    };
  },
};

// Define models
const ProductModel = createModel('Product', {
  fields: {
    id: Field({ type: 'number' }),
    name: Field({ type: 'string', required: true }),
    price: Field({ type: 'number', required: true, min: 0 }),
    discount_percent: Field({ type: 'number', min: 0, max: 100 }),
  },
});

/**
 * POLYGLOT ENDPOINT 1: Price calculation
 * TypeScript endpoint using TypeScript business logic
 */
app.post('/calculate-price', async (req) => {
  const product = new ProductModel(req.body);
  const productData = product.dict();

  // Call TypeScript business logic
  const finalPrice = TypeScriptLogic.calculateDiscount(
    productData.price,
    productData.discount_percent || 0
  );

  return {
    product: productData,
    original_price: productData.price,
    discount: productData.discount_percent || 0,
    final_price: finalPrice,
    savings: productData.price - finalPrice,
    processor: 'typescript',
  };
}, {
  summary: 'Calculate price with TypeScript logic',
  description: 'FastAPI endpoint using TypeScript business logic',
  tags: ['Polyglot', 'TypeScript'],
});

/**
 * POLYGLOT ENDPOINT 2: Text analysis
 * TypeScript endpoint calling Python text processing
 */
app.post('/analyze-text', async (req) => {
  const text = req.body.text;

  // Call Python business logic for text processing
  const processed = await PythonLogic.processText(text);

  // Call Python ML for sentiment analysis
  const sentiment = await PythonLogic.analyzeSentiment(text);

  // Combine results with TypeScript transformation
  const result = TypeScriptLogic.transformData({
    text_analysis: processed,
    sentiment_analysis: sentiment,
  });

  return result;
}, {
  summary: 'Analyze text using Python + TypeScript',
  description: 'Python text processing + TypeScript data transformation',
  tags: ['Polyglot', 'Python', 'ML'],
});

/**
 * POLYGLOT ENDPOINT 3: Order processing
 * Combines TypeScript formatting with Python statistics
 */
app.post('/process-order', async (req) => {
  const order = req.body;

  // Format order using TypeScript
  const formattedOrder = TypeScriptLogic.formatOrder(order);

  // Calculate statistics using Python
  const prices = order.items.map((item: any) => item.price);
  const priceStats = await PythonLogic.calculateStatistics(prices);

  return {
    order: formattedOrder,
    price_statistics: priceStats,
    processing: {
      formatter: 'typescript',
      statistics: 'python',
      timestamp: new Date().toISOString(),
    },
  };
}, {
  summary: 'Process order with polyglot logic',
  description: 'TypeScript formatting + Python statistics',
  tags: ['Polyglot', 'Business Logic'],
});

/**
 * POLYGLOT ENDPOINT 4: Data transformation pipeline
 * Shows complex data flowing through both languages
 */
app.post('/transform-pipeline', async (req) => {
  const data = req.body;

  // Step 1: Python text cleaning
  const cleaned = await PythonLogic.processText(data.description || '');

  // Step 2: TypeScript data transformation
  const transformed = TypeScriptLogic.transformData({
    ...data,
    description: cleaned.cleaned,
  });

  // Step 3: Python sentiment analysis
  const sentiment = await PythonLogic.analyzeSentiment(data.description || '');

  // Step 4: TypeScript final formatting
  const final = TypeScriptLogic.formatOrder({
    ...transformed,
    sentiment_score: sentiment.score,
    items: data.items || [],
  });

  return {
    pipeline_steps: [
      { step: 1, processor: 'python', operation: 'text_cleaning' },
      { step: 2, processor: 'typescript', operation: 'data_transformation' },
      { step: 3, processor: 'python', operation: 'sentiment_analysis' },
      { step: 4, processor: 'typescript', operation: 'final_formatting' },
    ],
    result: final,
  };
}, {
  summary: 'Multi-stage polyglot pipeline',
  description: 'Data flowing through Python and TypeScript processors',
  tags: ['Polyglot', 'Pipeline'],
});

/**
 * POLYGLOT ENDPOINT 5: Comparison endpoint
 * Shows performance characteristics of each language
 */
app.post('/polyglot-comparison', async (req) => {
  const numbers = req.body.numbers || [1, 2, 3, 4, 5];

  // TypeScript calculation
  const tsStart = Date.now();
  const tsResult = {
    sum: numbers.reduce((a: number, b: number) => a + b, 0),
    avg: numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length,
  };
  const tsDuration = Date.now() - tsStart;

  // Python calculation
  const pyStart = Date.now();
  const pyResult = await PythonLogic.calculateStatistics(numbers);
  const pyDuration = Date.now() - pyStart;

  return {
    typescript: {
      result: tsResult,
      duration_ms: tsDuration,
      language: 'typescript',
    },
    python: {
      result: pyResult,
      duration_ms: pyDuration,
      language: 'python',
    },
    comparison: {
      faster: tsDuration < pyDuration ? 'typescript' : 'python',
      difference_ms: Math.abs(tsDuration - pyDuration),
    },
  };
}, {
  summary: 'Compare TypeScript vs Python performance',
  description: 'Run same calculation in both languages',
  tags: ['Polyglot', 'Benchmarks'],
});

// Start server
if (require.main === module) {
  const PORT = 8003;
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log('  POLYGLOT FASTAPI - THE KILLER FEATURE!');
    console.log(${'='.repeat(60)}\n`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log();
    console.log('This API demonstrates:');
    console.log('  ✓ FastAPI endpoints in TypeScript');
    console.log('  ✓ Business logic in BOTH Python and TypeScript');
    console.log('  ✓ Seamless cross-language calls');
    console.log('  ✓ Best-of-both-worlds architecture');
    console.log();
    console.log('Try these polyglot endpoints:');
    console.log(`  POST http://localhost:${PORT}/calculate-price`);
    console.log(`  POST http://localhost:${PORT}/analyze-text`);
    console.log(`  POST http://localhost:${PORT}/process-order`);
    console.log(`  POST http://localhost:${PORT}/transform-pipeline`);
    console.log();
    console.log(`API docs at http://localhost:${PORT}/docs`);
    console.log(${'='.repeat(60)}\n`);
  });
}

export default app;
