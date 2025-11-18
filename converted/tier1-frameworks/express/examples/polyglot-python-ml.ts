/**
 * Polyglot Example: Python Machine Learning Integration
 *
 * This example demonstrates REAL Python integration using GraalPy (GraalVM's Python implementation).
 * It shows how to use Python ML libraries alongside Express for intelligent APIs.
 *
 * Requirements:
 * - GraalVM with Python support
 * - Python packages: numpy (others are optional but recommended)
 *
 * Setup:
 * 1. Install GraalVM: https://www.graalvm.org/downloads/
 * 2. Install Python components: gu install python
 * 3. Install packages: graalpy -m pip install numpy
 */

import express, { Request, Response } from '../src/index';

const app = express();
app.use(express.json());

// ===================================================================
// REAL Python Integration (works with GraalVM Polyglot API)
// ===================================================================

/**
 * Import Python's Polyglot module
 * This is the actual GraalVM polyglot API - NOT MOCKED!
 */
declare const Polyglot: {
  eval(lang: string, code: string): any;
  import(path: string): any;
};

/**
 * Check if polyglot is available
 */
const POLYGLOT_AVAILABLE = typeof Polyglot !== 'undefined';

// ===================================================================
// Route 1: Sentiment Analysis with Python
// ===================================================================

app.post('/api/ml/sentiment', (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text field is required' });
  }

  try {
    if (POLYGLOT_AVAILABLE) {
      // REAL Python code execution
      const analyzer = Polyglot.eval('python', `
import sys

class SimpleSentimentAnalyzer:
    """
    Simple rule-based sentiment analyzer.
    In production, use libraries like TextBlob or transformers.
    """

    def __init__(self):
        # Positive and negative word lists
        self.positive_words = set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'love', 'best', 'awesome', 'brilliant', 'perfect', 'happy'
        ])

        self.negative_words = set([
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
            'poor', 'disappointing', 'useless', 'annoying', 'sad'
        ])

    def analyze(self, text):
        """Analyze sentiment of text"""
        # Convert to lowercase and split into words
        words = text.lower().split()

        # Count positive and negative words
        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)
        total_words = len(words)

        # Calculate scores
        positive_score = positive_count / max(total_words, 1)
        negative_score = negative_count / max(total_words, 1)

        # Determine sentiment
        if positive_score > negative_score:
            sentiment = 'positive'
            confidence = positive_score
        elif negative_score > positive_score:
            sentiment = 'negative'
            confidence = negative_score
        else:
            sentiment = 'neutral'
            confidence = 0.5

        return {
            'sentiment': sentiment,
            'confidence': float(confidence),
            'positive_score': float(positive_score),
            'negative_score': float(negative_score),
            'word_count': total_words,
            'positive_words_found': positive_count,
            'negative_words_found': negative_count
        }

# Create and export analyzer instance
SimpleSentimentAnalyzer()
      `);

      // Call Python method from TypeScript
      const result = analyzer.analyze(text);

      res.json({
        text,
        analysis: result,
        engine: 'GraalVM Python',
        polyglot: true
      });
    } else {
      // Fallback for non-polyglot environments (for testing)
      res.json({
        text,
        analysis: {
          sentiment: 'neutral',
          confidence: 0.5,
          note: 'Polyglot not available - run with GraalVM for real Python execution'
        },
        engine: 'Mock',
        polyglot: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Sentiment analysis failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// ===================================================================
// Route 2: Text Classification with Python
// ===================================================================

app.post('/api/ml/classify', (req: Request, res: Response) => {
  const { text, categories } = req.body;

  if (!text || !categories || !Array.isArray(categories)) {
    return res.status(400).json({
      error: 'text and categories array are required'
    });
  }

  try {
    if (POLYGLOT_AVAILABLE) {
      // REAL Python ML code
      const classifier = Polyglot.eval('python', `
import re
from collections import Counter

class TextClassifier:
    """
    Simple keyword-based text classifier.
    In production, use sklearn, spaCy, or transformers.
    """

    def classify(self, text, categories):
        """Classify text into one of the provided categories"""
        text_lower = text.lower()

        # Simple word frequency approach
        scores = {}

        for category in categories:
            # Score based on category name appearing in text
            category_lower = category.lower()

            # Direct matches get highest score
            if category_lower in text_lower:
                scores[category] = 1.0
            else:
                # Partial word matches
                category_words = category_lower.split()
                matches = sum(1 for word in category_words if word in text_lower)
                scores[category] = matches / max(len(category_words), 1)

        # Find best match
        if scores:
            best_category = max(scores, key=scores.get)
            confidence = scores[best_category]
        else:
            best_category = categories[0] if categories else 'unknown'
            confidence = 0.0

        return {
            'category': best_category,
            'confidence': float(confidence),
            'scores': {k: float(v) for k, v in scores.items()}
        }

TextClassifier()
      `);

      const result = classifier.classify(text, categories);

      res.json({
        text,
        categories,
        classification: result,
        engine: 'GraalVM Python',
        polyglot: true
      });
    } else {
      // Fallback
      res.json({
        text,
        categories,
        classification: {
          category: categories[0],
          confidence: 0.5,
          note: 'Polyglot not available'
        },
        engine: 'Mock',
        polyglot: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Classification failed',
      message: error.message
    });
  }
});

// ===================================================================
// Route 3: NumPy Array Processing
// ===================================================================

app.post('/api/ml/array-stats', (req: Request, res: Response) => {
  const { numbers } = req.body;

  if (!numbers || !Array.isArray(numbers)) {
    return res.status(400).json({ error: 'numbers array is required' });
  }

  try {
    if (POLYGLOT_AVAILABLE) {
      // REAL NumPy usage
      const processor = Polyglot.eval('python', `
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

class ArrayProcessor:
    """Process arrays using NumPy if available"""

    def compute_stats(self, numbers):
        """Compute statistical metrics"""
        if NUMPY_AVAILABLE:
            arr = np.array(numbers)
            return {
                'mean': float(np.mean(arr)),
                'median': float(np.median(arr)),
                'std': float(np.std(arr)),
                'min': float(np.min(arr)),
                'max': float(np.max(arr)),
                'sum': float(np.sum(arr)),
                'count': len(numbers),
                'using_numpy': True
            }
        else:
            # Fallback to pure Python
            sorted_nums = sorted(numbers)
            n = len(numbers)
            return {
                'mean': sum(numbers) / n,
                'median': sorted_nums[n // 2],
                'min': min(numbers),
                'max': max(numbers),
                'sum': sum(numbers),
                'count': n,
                'using_numpy': False,
                'note': 'NumPy not available, using pure Python'
            }

ArrayProcessor()
      `);

      const stats = processor.compute_stats(numbers);

      res.json({
        numbers,
        statistics: stats,
        engine: 'GraalVM Python',
        polyglot: true
      });
    } else {
      // Fallback
      const n = numbers.length;
      res.json({
        numbers,
        statistics: {
          mean: numbers.reduce((a: number, b: number) => a + b, 0) / n,
          count: n,
          note: 'Polyglot not available'
        },
        engine: 'Mock',
        polyglot: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Array processing failed',
      message: error.message
    });
  }
});

// ===================================================================
// Route 4: Documentation
// ===================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    title: 'Express + Python ML Integration',
    description: 'Real polyglot ML API using GraalVM',
    polyglot_status: POLYGLOT_AVAILABLE ? 'Available' : 'Not Available',
    endpoints: {
      'POST /api/ml/sentiment': {
        description: 'Analyze text sentiment using Python',
        body: { text: 'string' },
        example: { text: 'I love this framework!' }
      },
      'POST /api/ml/classify': {
        description: 'Classify text into categories',
        body: { text: 'string', categories: 'string[]' },
        example: {
          text: 'This is about machine learning',
          categories: ['Technology', 'Sports', 'Politics']
        }
      },
      'POST /api/ml/array-stats': {
        description: 'Compute statistics using NumPy',
        body: { numbers: 'number[]' },
        example: { numbers: [1, 2, 3, 4, 5] }
      }
    },
    setup: {
      graalvm: 'Download from https://www.graalvm.org/downloads/',
      python: 'gu install python',
      packages: 'graalpy -m pip install numpy'
    },
    note: POLYGLOT_AVAILABLE
      ? 'Polyglot is enabled - Python code will execute!'
      : 'Polyglot not detected - API will use fallback mode'
  });
});

// ===================================================================
// Start Server
// ===================================================================

const PORT = 3100;
app.listen(PORT, () => {
  console.log(`\n✓ Python ML API running on http://localhost:${PORT}`);
  console.log(`✓ Polyglot status: ${POLYGLOT_AVAILABLE ? 'ENABLED' : 'DISABLED'}`);

  if (!POLYGLOT_AVAILABLE) {
    console.log('\n⚠ To enable real Python execution:');
    console.log('  1. Install GraalVM');
    console.log('  2. Run: gu install python');
    console.log('  3. Run: graalpy -m pip install numpy');
    console.log('  4. Execute with: elide run examples/polyglot-python-ml.ts\n');
  }

  console.log('\nTry these commands:');
  console.log(`curl -X POST http://localhost:${PORT}/api/ml/sentiment -H "Content-Type: application/json" -d '{"text":"I love this!"}'`);
  console.log(`curl -X POST http://localhost:${PORT}/api/ml/classify -H "Content-Type: application/json" -d '{"text":"Machine learning rocks","categories":["Tech","Sports"]}'`);
  console.log(`curl -X POST http://localhost:${PORT}/api/ml/array-stats -H "Content-Type: application/json" -d '{"numbers":[1,2,3,4,5]}'`);
  console.log('');
});
