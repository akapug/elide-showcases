import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { spawn } from 'child_process';
import { TokenizationCache } from '../shared/tokenization-cache';
import { validateTextInput, validateBatchInput } from './middleware';

const cache = new TokenizationCache(
  parseInt(process.env.TOKENIZATION_CACHE_SIZE || '1000', 10),
  parseInt(process.env.TOKENIZATION_CACHE_TTL || '300000', 10)
);

interface TextAnalysisRequest {
  text: string;
  tasks?: ('ner' | 'sentiment' | 'summarize')[];
}

interface BatchAnalysisRequest {
  texts: string[];
  tasks?: ('ner' | 'sentiment' | 'summarize')[];
}

/**
 * Execute Python NLP processor with shared tokenization
 */
async function executePythonProcessor(
  script: string,
  input: any,
  timeout: number = 30000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const pythonProcess = spawn('python3', [script], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      const processingTime = Date.now() - startTime;

      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve({
          ...result,
          performance: {
            ...result.performance,
            processingTime,
          },
        });
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err}`));
    });

    // Set timeout
    const timer = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python process timeout'));
    }, timeout);

    pythonProcess.on('close', () => clearTimeout(timer));

    // Send input to Python
    pythonProcess.stdin.write(JSON.stringify(input));
    pythonProcess.stdin.end();
  });
}

/**
 * Multi-task analysis endpoint
 * Tokenizes once, runs all requested tasks
 */
async function analyzeText(
  request: FastifyRequest<{ Body: TextAnalysisRequest }>,
  reply: FastifyReply
) {
  try {
    const { text, tasks = ['ner', 'sentiment', 'summarize'] } = request.body;

    validateTextInput(text);

    const startTime = Date.now();

    // Check cache for tokenization
    const cacheKey = `tokenize:${text.substring(0, 100)}`;
    let tokenizationResult = cache.get(cacheKey);

    // Execute multi-task processor
    const result = await executePythonProcessor('nlp/multi_task_processor.py', {
      text,
      tasks,
      cachedTokenization: tokenizationResult,
    });

    // Cache tokenization for future use
    if (result.tokenization && !tokenizationResult) {
      cache.set(cacheKey, result.tokenization);
    }

    const totalTime = Date.now() - startTime;

    reply.send({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      results: result.results,
      performance: {
        totalTime,
        tokenizationCached: !!tokenizationResult,
        ...result.performance,
      },
    });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

/**
 * Batch processing endpoint
 * Processes multiple texts with shared tokenization
 */
async function analyzeBatch(
  request: FastifyRequest<{ Body: BatchAnalysisRequest }>,
  reply: FastifyReply
) {
  try {
    const { texts, tasks = ['ner', 'sentiment', 'summarize'] } = request.body;

    validateBatchInput(texts);

    const startTime = Date.now();

    // Execute batch processor
    const result = await executePythonProcessor('nlp/batch_processor.py', {
      texts,
      tasks,
    });

    const totalTime = Date.now() - startTime;

    reply.send({
      success: true,
      batchSize: texts.length,
      results: result.results,
      performance: {
        totalTime,
        avgTimePerText: totalTime / texts.length,
        ...result.performance,
      },
    });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

/**
 * Named Entity Recognition endpoint
 */
async function extractEntities(
  request: FastifyRequest<{ Body: { text: string } }>,
  reply: FastifyReply
) {
  try {
    const { text } = request.body;

    validateTextInput(text);

    const startTime = Date.now();

    const result = await executePythonProcessor('nlp/ner_processor.py', {
      text,
    });

    const totalTime = Date.now() - startTime;

    reply.send({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      entities: result.entities,
      entityCount: result.entityCount,
      performance: {
        totalTime,
        ...result.performance,
      },
    });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

/**
 * Sentiment Analysis endpoint
 */
async function analyzeSentiment(
  request: FastifyRequest<{ Body: { text: string } }>,
  reply: FastifyReply
) {
  try {
    const { text } = request.body;

    validateTextInput(text);

    const startTime = Date.now();

    const result = await executePythonProcessor('nlp/sentiment_processor.py', {
      text,
    });

    const totalTime = Date.now() - startTime;

    reply.send({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sentiment: result.sentiment,
      score: result.score,
      performance: {
        totalTime,
        ...result.performance,
      },
    });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

/**
 * Summarization endpoint
 */
async function summarizeText(
  request: FastifyRequest<{ Body: { text: string; maxLength?: number } }>,
  reply: FastifyReply
) {
  try {
    const { text, maxLength = 130 } = request.body;

    validateTextInput(text);

    const startTime = Date.now();

    const result = await executePythonProcessor('nlp/summarization_processor.py', {
      text,
      maxLength,
    });

    const totalTime = Date.now() - startTime;

    reply.send({
      success: true,
      originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      summary: result.summary,
      compressionRatio: result.compressionRatio,
      performance: {
        totalTime,
        ...result.performance,
      },
    });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

/**
 * Register all routes
 */
export function registerRoutes(server: FastifyInstance) {
  // Multi-task analysis
  server.post('/api/v1/analyze', analyzeText);
  server.post('/api/v1/analyze/batch', analyzeBatch);

  // Individual tasks
  server.post('/api/v1/ner', extractEntities);
  server.post('/api/v1/sentiment', analyzeSentiment);
  server.post('/api/v1/summarize', summarizeText);

  // Info endpoint
  server.get('/api/v1/info', async () => ({
    service: 'NLP Multi-Task Pipeline',
    version: '1.0.0',
    models: {
      ner: process.env.SPACY_MODEL || 'en_core_web_sm',
      sentiment: process.env.SENTIMENT_MODEL || 'distilbert-base-uncased-finetuned-sst-2-english',
      summarization: process.env.SUMMARIZATION_MODEL || 'facebook/bart-large-cnn',
    },
    features: [
      'Shared tokenization',
      'Multi-task inference',
      'Batch processing',
      'Tokenization caching',
    ],
    performance: {
      target: '<100ms for multi-task analysis',
      speedup: '5x vs separate microservices',
    },
  }));
}
