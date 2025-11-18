/**
 * ML Inference API Example
 *
 * Demonstrates Python ML models served via TypeScript FastAPI endpoints.
 * Shows the power of polyglot: Python ML + TypeScript API layer.
 */

import FastAPI from '../src/fastapi';
import { createModel, Field } from '../src/models';
import { CORSMiddleware, RateLimitMiddleware } from '../src/middleware';

const app = new FastAPI({
  title: 'ML Inference API',
  description: 'Machine Learning inference using Python ML + TypeScript FastAPI',
  version: '1.0.0',
});

// Add middleware
app.add_middleware(CORSMiddleware());
app.add_middleware(RateLimitMiddleware({ requests_per_minute: 100 }));

// Define request/response models
const SentimentRequest = createModel('SentimentRequest', {
  fields: {
    text: Field({
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 10000,
      description: 'Text to analyze',
    }),
  },
});

const ClassificationRequest = createModel('ClassificationRequest', {
  fields: {
    text: Field({
      type: 'string',
      required: true,
      description: 'Text to classify',
    }),
    categories: Field({
      type: 'array',
      required: true,
      description: 'Categories to classify into',
    }),
  },
});

const EntityExtractionRequest = createModel('EntityExtractionRequest', {
  fields: {
    text: Field({
      type: 'string',
      required: true,
      description: 'Text to extract entities from',
    }),
  },
});

// Python ML Integration (simulated - in production would import real Python models)
const PythonML = {
  async predictSentiment(text: string): Promise<any> {
    // Simulates: from python.fastapi_impl import MLInference
    // MLInference.predict_sentiment(text)

    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate ML inference time

    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'wonderful', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'poor', 'horrible', 'worst'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;

    const score = (positiveCount - negativeCount) / Math.max(words.length, 1);
    let sentiment;
    let confidence;

    if (score > 0.1) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + score);
    } else if (score < -0.1) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 - score);
    } else {
      sentiment = 'neutral';
      confidence = 0.5;
    }

    return {
      sentiment,
      score: confidence,
      confidence: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
      details: {
        positive_indicators: positiveCount,
        negative_indicators: negativeCount,
        total_words: words.length,
      },
    };
  },

  async classifyText(text: string, categories: string[]): Promise<any> {
    // Simulates: MLInference.classify_text(text, categories)
    await new Promise(resolve => setTimeout(resolve, 30));

    const scores: Record<string, number> = {};
    const words = new Set(text.toLowerCase().split(/\s+/));

    for (const category of categories) {
      const categoryWords = new Set(category.toLowerCase().split(/\s+/));
      const overlap = [...categoryWords].filter(w => words.has(w)).length;
      scores[category] = overlap / Math.max(categoryWords.size, 1);
    }

    return scores;
  },

  async extractEntities(text: string): Promise<any> {
    // Simulates: MLInference.extract_entities(text)
    await new Promise(resolve => setTimeout(resolve, 25));

    const entities = [];

    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({
        text: email,
        type: 'EMAIL',
        start: text.indexOf(email),
        end: text.indexOf(email) + email.length,
        confidence: 0.95,
      });
    });

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
      entities.push({
        text: url,
        type: 'URL',
        start: text.indexOf(url),
        end: text.indexOf(url) + url.length,
        confidence: 0.95,
      });
    });

    // Extract dates
    const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/g;
    const dates = text.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push({
        text: date,
        type: 'DATE',
        start: text.indexOf(date),
        end: text.indexOf(date) + date.length,
        confidence: 0.9,
      });
    });

    return entities;
  },

  async summarizeText(text: string, maxLength: number = 100): Promise<any> {
    // Simulates: MLInference.summarize_text(text, max_length)
    await new Promise(resolve => setTimeout(resolve, 40));

    // Simple extractive summarization (first sentences)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let summary = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      if (currentLength + sentence.length > maxLength) break;
      summary += sentence.trim() + '. ';
      currentLength += sentence.length;
    }

    return {
      summary: summary.trim(),
      original_length: text.length,
      summary_length: summary.length,
      compression_ratio: summary.length / text.length,
    };
  },
};

/**
 * Sentiment Analysis Endpoint
 */
app.post('/predict/sentiment', async (req) => {
  const request = new SentimentRequest(req.body);
  const { text } = request.dict();

  const result = await PythonML.predictSentiment(text);

  return {
    input: { text },
    prediction: result,
    model: 'python-sentiment-v1',
    inference_time_ms: 20,
  };
}, {
  summary: 'Predict sentiment',
  description: 'Analyze sentiment of text using Python ML model',
  tags: ['ML', 'Sentiment'],
  response_model: null,
});

/**
 * Text Classification Endpoint
 */
app.post('/predict/classify', async (req) => {
  const request = new ClassificationRequest(req.body);
  const { text, categories } = request.dict();

  const scores = await PythonML.classifyText(text, categories);

  // Sort by score
  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([category, score]) => ({
      category,
      score,
      confidence: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
    }));

  return {
    input: { text, categories },
    predictions: sortedScores,
    top_category: sortedScores[0]?.category || null,
    model: 'python-classifier-v1',
  };
}, {
  summary: 'Classify text',
  description: 'Classify text into provided categories using Python ML',
  tags: ['ML', 'Classification'],
});

/**
 * Named Entity Recognition Endpoint
 */
app.post('/predict/entities', async (req) => {
  const request = new EntityExtractionRequest(req.body);
  const { text } = request.dict();

  const entities = await PythonML.extractEntities(text);

  return {
    input: { text },
    entities,
    entity_count: entities.length,
    entity_types: [...new Set(entities.map((e: any) => e.type))],
    model: 'python-ner-v1',
  };
}, {
  summary: 'Extract named entities',
  description: 'Extract named entities (emails, URLs, dates, etc.) using Python NLP',
  tags: ['ML', 'NER'],
});

/**
 * Text Summarization Endpoint
 */
app.post('/predict/summarize', async (req) => {
  const text = req.body.text;
  const maxLength = req.body.max_length || 100;

  const result = await PythonML.summarizeText(text, maxLength);

  return {
    input: { text, max_length: maxLength },
    ...result,
    model: 'python-summarizer-v1',
  };
}, {
  summary: 'Summarize text',
  description: 'Generate text summary using Python ML',
  tags: ['ML', 'Summarization'],
});

/**
 * Batch Prediction Endpoint
 */
app.post('/predict/batch', async (req) => {
  const texts = req.body.texts || [];

  const results = await Promise.all(
    texts.map(async (text: string) => ({
      text,
      sentiment: await PythonML.predictSentiment(text),
      entities: await PythonML.extractEntities(text),
    }))
  );

  return {
    total: texts.length,
    results,
    batch_inference_time_ms: results.length * 25,
  };
}, {
  summary: 'Batch predictions',
  description: 'Process multiple texts in parallel',
  tags: ['ML', 'Batch'],
});

/**
 * Model Info Endpoint
 */
app.get('/models', async () => {
  return {
    models: [
      {
        name: 'sentiment-v1',
        type: 'sentiment-analysis',
        language: 'python',
        framework: 'sklearn',
        status: 'active',
      },
      {
        name: 'classifier-v1',
        type: 'text-classification',
        language: 'python',
        framework: 'sklearn',
        status: 'active',
      },
      {
        name: 'ner-v1',
        type: 'named-entity-recognition',
        language: 'python',
        framework: 'spacy',
        status: 'active',
      },
      {
        name: 'summarizer-v1',
        type: 'text-summarization',
        language: 'python',
        framework: 'transformers',
        status: 'active',
      },
    ],
  };
}, {
  summary: 'List available models',
  description: 'Get information about available ML models',
  tags: ['Models'],
});

// Start server
if (require.main === module) {
  const PORT = 8004;
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log('  ML INFERENCE API - Python ML + TypeScript FastAPI');
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log();
    console.log('Available ML endpoints:');
    console.log(`  POST http://localhost:${PORT}/predict/sentiment`);
    console.log(`  POST http://localhost:${PORT}/predict/classify`);
    console.log(`  POST http://localhost:${PORT}/predict/entities`);
    console.log(`  POST http://localhost:${PORT}/predict/summarize`);
    console.log(`  POST http://localhost:${PORT}/predict/batch`);
    console.log();
    console.log('Example request:');
    console.log('  curl -X POST http://localhost:${PORT}/predict/sentiment \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"text":"This product is amazing!"}\' ');
    console.log();
    console.log(`API docs at http://localhost:${PORT}/docs`);
    console.log(`${'='.repeat(60)}\n`);
  });
}

export default app;
