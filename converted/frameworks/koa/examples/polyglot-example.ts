/**
 * Polyglot Example - The Power of Elide
 *
 * Demonstrates:
 * - Using Python libraries in TypeScript
 * - Using Ruby code in middleware
 * - Mixed-language processing pipeline
 * - Real-world polyglot use cases
 */

import { Koa } from '../server';

const app = new Koa();

// Body parser middleware
app.use(async (ctx, next) => {
  if (ctx.method === 'POST') {
    const chunks: Buffer[] = [];

    ctx.req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    await new Promise<void>((resolve) => {
      ctx.req.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          ctx.request.body = JSON.parse(body);
        } catch (e) {
          ctx.request.body = {};
        }
        resolve();
      });
    });
  }

  await next();
});

// Logging middleware
app.use(async (ctx, next) => {
  console.log(`→ ${ctx.method} ${ctx.path}`);
  await next();
  console.log(`← ${ctx.status}`);
});

// Routes
app.use(async (ctx) => {
  const path = ctx.path;

  // Home page with API documentation
  if (path === '/' && ctx.method === 'GET') {
    ctx.body = {
      title: 'Polyglot Koa Example',
      description: 'Demonstrating multi-language capabilities with Elide',
      note: 'These examples show the API structure. In production, enable Polyglot.eval() in your Elide runtime.',
      endpoints: {
        'POST /analyze/sentiment': {
          description: 'Analyze text sentiment using Python NLTK',
          example: { text: 'I love this framework!' },
          languages: ['TypeScript', 'Python']
        },
        'POST /analyze/text': {
          description: 'Advanced text analysis with Ruby NLP',
          example: { text: 'The quick brown fox jumps over the lazy dog' },
          languages: ['TypeScript', 'Ruby']
        },
        'POST /ml/predict': {
          description: 'ML prediction using Python scikit-learn',
          example: { features: [1.2, 3.4, 5.6, 7.8] },
          languages: ['TypeScript', 'Python']
        },
        'POST /transform/text': {
          description: 'Text transformation pipeline (TS → Python → Ruby → TS)',
          example: { text: 'hello world', operations: ['uppercase', 'reverse'] },
          languages: ['TypeScript', 'Python', 'Ruby']
        }
      },
      setup: {
        python: 'Requires: numpy, nltk, scikit-learn',
        ruby: 'Requires: activesupport gem',
        elide: 'Enable polyglot support in elide.yaml'
      }
    };
    return;
  }

  // Sentiment Analysis with Python
  if (path === '/analyze/sentiment' && ctx.method === 'POST') {
    const { text } = (ctx.request as any).body || {};

    if (!text) {
      ctx.status = 400;
      ctx.body = { error: 'text field is required' };
      return;
    }

    try {
      // Example of polyglot integration
      // In production Elide runtime, this would execute:
      /*
      const analyzer = Polyglot.eval('python', `
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

class SentimentAnalyzer:
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()

    def analyze(self, text):
        scores = self.sia.polarity_scores(text)
        return {
            'positive': scores['pos'],
            'negative': scores['neg'],
            'neutral': scores['neu'],
            'compound': scores['compound']
        }

SentimentAnalyzer()
      `);

      const result = analyzer.analyze(text);
      */

      // Mock response showing expected structure
      const result = {
        positive: 0.8,
        negative: 0.05,
        neutral: 0.15,
        compound: 0.75
      };

      ctx.body = {
        text,
        sentiment: result,
        classification: result.compound > 0.05 ? 'positive' :
                       result.compound < -0.05 ? 'negative' : 'neutral',
        languages_used: ['TypeScript', 'Python'],
        note: 'Enable Polyglot.eval() in Elide runtime for actual Python execution'
      };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: 'Sentiment analysis failed', message: err.message };
    }
    return;
  }

  // Text Analysis with Ruby
  if (path === '/analyze/text' && ctx.method === 'POST') {
    const { text } = (ctx.request as any).body || {};

    if (!text) {
      ctx.status = 400;
      ctx.body = { error: 'text field is required' };
      return;
    }

    try {
      // Example polyglot Ruby integration
      /*
      const analyzer = Polyglot.eval('ruby', `
require 'active_support/core_ext/string'

class TextAnalyzer
  def analyze(text)
    {
      word_count: text.split.length,
      char_count: text.length,
      titleized: text.titleize,
      parameterized: text.parameterize,
      truncated: text.truncate(50)
    }
  end
end

TextAnalyzer.new
      `);

      const result = analyzer.analyze(text);
      */

      // Mock response
      const words = text.split(/\s+/);
      const result = {
        word_count: words.length,
        char_count: text.length,
        titleized: text.split(' ').map((w: string) =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' '),
        parameterized: text.toLowerCase().replace(/\s+/g, '-'),
        truncated: text.length > 50 ? text.substring(0, 47) + '...' : text
      };

      ctx.body = {
        text,
        analysis: result,
        languages_used: ['TypeScript', 'Ruby'],
        note: 'Enable Polyglot.eval() in Elide runtime for actual Ruby execution'
      };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: 'Text analysis failed', message: err.message };
    }
    return;
  }

  // ML Prediction with Python scikit-learn
  if (path === '/ml/predict' && ctx.method === 'POST') {
    const { features } = (ctx.request as any).body || {};

    if (!features || !Array.isArray(features)) {
      ctx.status = 400;
      ctx.body = { error: 'features array is required' };
      return;
    }

    try {
      // Example ML integration
      /*
      const predictor = Polyglot.import('python', './ml_model.py');
      const prediction = predictor.predict(features);
      */

      // Mock prediction
      const prediction = {
        class: features[0] > 5 ? 'A' : 'B',
        probability: Math.random() * 0.5 + 0.5,
        features_used: features.length
      };

      ctx.body = {
        input: features,
        prediction,
        model: 'RandomForestClassifier',
        languages_used: ['TypeScript', 'Python'],
        note: 'Enable Polyglot.import() in Elide runtime for actual ML model execution'
      };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: 'Prediction failed', message: err.message };
    }
    return;
  }

  // Multi-language Pipeline
  if (path === '/transform/text' && ctx.method === 'POST') {
    const { text, operations } = (ctx.request as any).body || {};

    if (!text) {
      ctx.status = 400;
      ctx.body = { error: 'text field is required' };
      return;
    }

    try {
      let result = text;
      const pipeline = [];

      // TypeScript: Initial processing
      result = result.trim();
      pipeline.push({ stage: 'TypeScript', operation: 'trim', result });

      // Python: NLP processing
      if (operations?.includes('uppercase')) {
        result = result.toUpperCase();
        pipeline.push({ stage: 'Python', operation: 'uppercase', result });
      }

      // Ruby: Formatting
      if (operations?.includes('reverse')) {
        result = result.split('').reverse().join('');
        pipeline.push({ stage: 'Ruby', operation: 'reverse', result });
      }

      // TypeScript: Final formatting
      const final = {
        original: text,
        transformed: result,
        length_change: result.length - text.length,
        operations_applied: operations || []
      };
      pipeline.push({ stage: 'TypeScript', operation: 'finalize', result: final });

      ctx.body = {
        pipeline,
        final,
        languages_used: ['TypeScript', 'Python', 'Ruby'],
        note: 'This demonstrates the concept. Enable full polyglot in Elide runtime.'
      };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: 'Transformation failed', message: err.message };
    }
    return;
  }

  // 404
  ctx.status = 404;
  ctx.body = { error: 'Not found' };
});

// Start server
const PORT = 3003;
app.listen(PORT, () => {
  console.log(`✓ Polyglot example server running on http://localhost:${PORT}`);
  console.log('\n  This example demonstrates Elide\'s polyglot capabilities');
  console.log('  Enable Polyglot.eval() and Polyglot.import() in your Elide runtime\n');
  console.log('  Try these commands:');
  console.log('  curl http://localhost:3003/');
  console.log('  curl -X POST http://localhost:3003/analyze/sentiment -H "Content-Type: application/json" -d \'{"text":"I love this!"}\'');
  console.log('  curl -X POST http://localhost:3003/analyze/text -H "Content-Type: application/json" -d \'{"text":"hello world"}\'');
  console.log('  curl -X POST http://localhost:3003/ml/predict -H "Content-Type: application/json" -d \'{"features":[1,2,3,4]}\'');
  console.log('  curl -X POST http://localhost:3003/transform/text -H "Content-Type: application/json" -d \'{"text":"hello","operations":["uppercase","reverse"]}\'');
});
