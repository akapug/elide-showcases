/**
 * Polyglot Example - The Power of Elide
 *
 * Demonstrates:
 * - Using Python libraries in Sinatra
 * - Using JavaScript/TypeScript alongside Ruby DSL
 * - Mixed-language processing pipeline
 * - Real-world polyglot use cases
 */

import { Sinatra } from '../server';

class PolyglotApp extends Sinatra.Base {}

// Configure
PolyglotApp.configure(function() {
  PolyglotApp.set('logging', true);
});

PolyglotApp.before('/api/*', function() {
  this.contentType('json');
});

// Home - API documentation
PolyglotApp.get('/', function() {
  return this.json({
    title: 'Polyglot Sinatra Example',
    description: 'Demonstrating multi-language capabilities with Elide',
    note: 'These examples show the API structure. In production, enable Polyglot.eval() in your Elide runtime.',
    endpoints: {
      'POST /api/analyze/sentiment': {
        description: 'Analyze text sentiment using Python NLTK',
        example: { text: 'I love this framework!' },
        languages: ['Ruby DSL', 'Python']
      },
      'POST /api/analyze/text': {
        description: 'Advanced text analysis with Python NLP',
        example: { text: 'The quick brown fox jumps over the lazy dog' },
        languages: ['Ruby DSL', 'Python']
      },
      'POST /api/ml/predict': {
        description: 'ML prediction using Python scikit-learn',
        example: { features: [1.2, 3.4, 5.6, 7.8] },
        languages: ['Ruby DSL', 'Python']
      },
      'POST /api/transform/text': {
        description: 'Text transformation pipeline (TS → Python → Ruby → TS)',
        example: { text: 'hello world', operations: ['uppercase', 'reverse'] },
        languages: ['Ruby DSL', 'TypeScript', 'Python']
      }
    },
    setup: {
      python: 'Requires: numpy, nltk, scikit-learn',
      ruby: 'Requires: activesupport gem',
      elide: 'Enable polyglot support in elide.yaml'
    }
  });
});

// Sentiment Analysis with Python
PolyglotApp.post('/api/analyze/sentiment', function() {
  let data: any;

  try {
    data = JSON.parse(this.request.body);
  } catch (e) {
    this.status(400);
    return { error: 'Invalid JSON' };
  }

  const { text } = data;

  if (!text) {
    this.status(400);
    return { error: 'text field is required' };
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
      positive: 0.75,
      negative: 0.05,
      neutral: 0.20,
      compound: 0.70
    };

    return {
      text,
      sentiment: result,
      classification: result.compound > 0.05 ? 'positive' :
                     result.compound < -0.05 ? 'negative' : 'neutral',
      languages_used: ['Ruby DSL', 'Python'],
      note: 'Enable Polyglot.eval() in Elide runtime for actual Python execution'
    };
  } catch (err: any) {
    this.status(500);
    return { error: 'Sentiment analysis failed', message: err.message };
  }
});

// Text Analysis with Python
PolyglotApp.post('/api/analyze/text', function() {
  let data: any;

  try {
    data = JSON.parse(this.request.body);
  } catch (e) {
    this.status(400);
    return { error: 'Invalid JSON' };
  }

  const { text } = data;

  if (!text) {
    this.status(400);
    return { error: 'text field is required' };
  }

  try {
    // Example polyglot Python integration
    /*
    const analyzer = Polyglot.eval('python', `
import nltk
from collections import Counter

class TextAnalyzer:
    def analyze(self, text):
        words = nltk.word_tokenize(text.lower())
        word_freq = Counter(words)

        return {
            'word_count': len(words),
            'unique_words': len(word_freq),
            'char_count': len(text),
            'most_common': word_freq.most_common(5)
        }

TextAnalyzer()
    `);

    const result = analyzer.analyze(text);
    */

    // Mock response
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);

    const result = {
      word_count: words.length,
      unique_words: uniqueWords.size,
      char_count: text.length,
      avg_word_length: text.replace(/\s/g, '').length / words.length
    };

    return {
      text,
      analysis: result,
      languages_used: ['Ruby DSL', 'Python'],
      note: 'Enable Polyglot.eval() in Elide runtime for actual Python execution'
    };
  } catch (err: any) {
    this.status(500);
    return { error: 'Text analysis failed', message: err.message };
  }
});

// ML Prediction with Python scikit-learn
PolyglotApp.post('/api/ml/predict', function() {
  let data: any;

  try {
    data = JSON.parse(this.request.body);
  } catch (e) {
    this.status(400);
    return { error: 'Invalid JSON' };
  }

  const { features } = data;

  if (!features || !Array.isArray(features)) {
    this.status(400);
    return { error: 'features array is required' };
  }

  try {
    // Example ML integration
    /*
    const predictor = Polyglot.import('python', './ml_model.py');
    const prediction = predictor.predict(features);
    */

    // Mock prediction
    const prediction = {
      class: features[0] > 5 ? 'Category A' : 'Category B',
      probability: Math.random() * 0.3 + 0.7,
      features_used: features.length,
      model_version: '1.0.0'
    };

    return {
      input: features,
      prediction,
      model: 'RandomForestClassifier',
      languages_used: ['Ruby DSL', 'Python'],
      note: 'Enable Polyglot.import() in Elide runtime for actual ML model execution'
    };
  } catch (err: any) {
    this.status(500);
    return { error: 'Prediction failed', message: err.message };
  }
});

// Multi-language Pipeline
PolyglotApp.post('/api/transform/text', function() {
  let data: any;

  try {
    data = JSON.parse(this.request.body);
  } catch (e) {
    this.status(400);
    return { error: 'Invalid JSON' };
  }

  const { text, operations } = data;

  if (!text) {
    this.status(400);
    return { error: 'text field is required' };
  }

  try {
    let result = text;
    const pipeline = [];

    // TypeScript: Initial processing
    result = result.trim();
    pipeline.push({
      stage: 'TypeScript',
      operation: 'trim',
      result
    });

    // Python: Text processing
    if (operations?.includes('uppercase')) {
      result = result.toUpperCase();
      pipeline.push({
        stage: 'Python',
        operation: 'uppercase',
        result
      });
    }

    // Ruby: Advanced formatting
    if (operations?.includes('reverse')) {
      result = result.split('').reverse().join('');
      pipeline.push({
        stage: 'Ruby',
        operation: 'reverse',
        result
      });
    }

    if (operations?.includes('titleize')) {
      result = result.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      pipeline.push({
        stage: 'Ruby',
        operation: 'titleize',
        result
      });
    }

    // TypeScript: Final formatting
    const final = {
      original: text,
      transformed: result,
      length_change: result.length - text.length,
      operations_applied: operations || []
    };

    pipeline.push({
      stage: 'TypeScript',
      operation: 'finalize',
      result: final
    });

    return {
      pipeline,
      final,
      languages_used: ['Ruby DSL', 'TypeScript', 'Python'],
      note: 'This demonstrates the concept. Enable full polyglot in Elide runtime.'
    };
  } catch (err: any) {
    this.status(500);
    return { error: 'Transformation failed', message: err.message };
  }
});

// 404 handler
PolyglotApp.notFound(function(error) {
  return {
    error: 'Not Found',
    path: this.request.path,
    available_endpoints: [
      '/',
      'POST /api/analyze/sentiment',
      'POST /api/analyze/text',
      'POST /api/ml/predict',
      'POST /api/transform/text'
    ]
  };
});

// Start server
PolyglotApp.run({ port: 4570 });

console.log('✓ Polyglot example server running on http://localhost:4570');
console.log('\n  This example demonstrates Elide\'s polyglot capabilities');
console.log('  Enable Polyglot.eval() and Polyglot.import() in your Elide runtime\n');
console.log('  Try these commands:');
console.log('  curl http://localhost:4570/');
console.log('  curl -X POST http://localhost:4570/api/analyze/sentiment -H "Content-Type: application/json" -d \'{"text":"I love this!"}\'');
console.log('  curl -X POST http://localhost:4570/api/analyze/text -H "Content-Type: application/json" -d \'{"text":"hello world"}\'');
console.log('  curl -X POST http://localhost:4570/api/ml/predict -H "Content-Type: application/json" -d \'{"features":[1,2,3,4]}\'');
console.log('  curl -X POST http://localhost:4570/api/transform/text -H "Content-Type: application/json" -d \'{"text":"hello world","operations":["uppercase","reverse"]}\'');
