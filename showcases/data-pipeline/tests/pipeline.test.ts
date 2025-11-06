/**
 * Pipeline Tests
 *
 * Test suite for ETL pipeline orchestration.
 */

import { ETLPipeline, PipelineConfig } from '../orchestrator/pipeline';
import { ApiExtractor } from '../extractors/api-extractor';
import { CsvExtractor } from '../extractors/csv-extractor';
import { JsonExtractor } from '../extractors/json-extractor';
import { DataValidator } from '../transformers/validator';
import { DataEnricher } from '../transformers/enricher';
import { DatabaseLoader } from '../loaders/db-loader';
import { FileLoader } from '../loaders/file-loader';

/**
 * Test: Basic pipeline execution
 */
async function testBasicPipeline(): Promise<void> {
  console.log('Test: Basic pipeline execution');

  const config: PipelineConfig = {
    name: 'test-pipeline',
    description: 'Test pipeline',
    extractors: [
      {
        type: 'json',
        name: 'test-extractor',
        config: {
          filePath: './data/input/test.json'
        }
      }
    ],
    transformers: [
      {
        type: 'validator',
        name: 'test-validator',
        config: {
          schema: {
            id: [{ type: 'required' }]
          }
        }
      }
    ],
    loaders: [
      {
        type: 'file',
        name: 'test-loader',
        config: {
          outputPath: './data/output/test.json',
          format: 'json'
        }
      }
    ],
    options: {
      parallel: false,
      continueOnError: true,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 1000
      }
    }
  };

  const pipeline = new ETLPipeline(config);

  // Register components
  pipeline.registerExtractor('json', new JsonExtractor());
  pipeline.registerTransformer('validator', new DataValidator());
  pipeline.registerLoader('file', new FileLoader());

  try {
    const result = await pipeline.execute();

    console.log('Pipeline result:', {
      success: result.success,
      duration: result.durationMs,
      totalRecords: result.totalRecords,
      successfulRecords: result.successfulRecords
    });

    if (result.success) {
      console.log('✓ Basic pipeline test passed');
    } else {
      console.error('✗ Basic pipeline test failed:', result.error);
    }
  } catch (error) {
    console.error('✗ Basic pipeline test error:', error);
  }
}

/**
 * Test: Pipeline with multiple extractors
 */
async function testMultipleExtractors(): Promise<void> {
  console.log('\nTest: Multiple extractors');

  const config: PipelineConfig = {
    name: 'multi-extractor-pipeline',
    extractors: [
      {
        type: 'json',
        name: 'json-extractor',
        config: {
          filePath: './data/input/data1.json'
        }
      },
      {
        type: 'csv',
        name: 'csv-extractor',
        config: {
          filePath: './data/input/data2.csv'
        }
      }
    ],
    transformers: [],
    loaders: [
      {
        type: 'file',
        name: 'combined-loader',
        config: {
          outputPath: './data/output/combined.json',
          format: 'json'
        }
      }
    ],
    options: {
      parallel: true,
      maxConcurrency: 2
    }
  };

  const pipeline = new ETLPipeline(config);
  pipeline.registerExtractor('json', new JsonExtractor());
  pipeline.registerExtractor('csv', new CsvExtractor());
  pipeline.registerLoader('file', new FileLoader());

  try {
    const result = await pipeline.execute();
    console.log('✓ Multiple extractors test passed');
  } catch (error) {
    console.error('✗ Multiple extractors test failed:', error);
  }
}

/**
 * Test: Pipeline error handling
 */
async function testErrorHandling(): Promise<void> {
  console.log('\nTest: Error handling');

  const config: PipelineConfig = {
    name: 'error-test-pipeline',
    extractors: [
      {
        type: 'json',
        name: 'bad-extractor',
        config: {
          filePath: './data/nonexistent.json'
        }
      }
    ],
    transformers: [],
    loaders: [],
    options: {
      continueOnError: true,
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 100
      }
    }
  };

  const pipeline = new ETLPipeline(config);
  pipeline.registerExtractor('json', new JsonExtractor());

  try {
    const result = await pipeline.execute();

    if (!result.success) {
      console.log('✓ Error handling test passed (error caught correctly)');
    } else {
      console.error('✗ Error handling test failed (should have errored)');
    }
  } catch (error) {
    console.log('✓ Error handling test passed (exception thrown)');
  }
}

/**
 * Test: Pipeline events
 */
async function testPipelineEvents(): Promise<void> {
  console.log('\nTest: Pipeline events');

  const config: PipelineConfig = {
    name: 'event-test-pipeline',
    extractors: [
      {
        type: 'json',
        name: 'json-extractor',
        config: {
          filePath: './data/input/test.json'
        }
      }
    ],
    transformers: [],
    loaders: [],
    options: {}
  };

  const pipeline = new ETLPipeline(config);
  pipeline.registerExtractor('json', new JsonExtractor());

  const events: string[] = [];

  pipeline.on('pipeline:start', () => events.push('start'));
  pipeline.on('stage:start', (stage) => events.push(`stage:${stage}:start`));
  pipeline.on('stage:complete', (stage) => events.push(`stage:${stage}:complete`));
  pipeline.on('pipeline:complete', () => events.push('complete'));

  try {
    await pipeline.execute();

    const expectedEvents = ['start', 'complete'];
    const hasEvents = expectedEvents.every(e => events.includes(e));

    if (hasEvents) {
      console.log('✓ Pipeline events test passed');
    } else {
      console.error('✗ Pipeline events test failed. Events:', events);
    }
  } catch (error) {
    console.error('✗ Pipeline events test error:', error);
  }
}

/**
 * Test: Pipeline retry logic
 */
async function testRetryLogic(): Promise<void> {
  console.log('\nTest: Retry logic');

  let attempts = 0;
  const maxAttempts = 3;

  class FailingExtractor {
    async extract(): Promise<any[]> {
      attempts++;
      if (attempts < maxAttempts) {
        throw new Error('Simulated failure');
      }
      return [{ id: 1 }];
    }
  }

  const config: PipelineConfig = {
    name: 'retry-test-pipeline',
    extractors: [
      {
        type: 'failing',
        name: 'failing-extractor',
        config: {}
      }
    ],
    transformers: [],
    loaders: [],
    options: {
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 50
      }
    }
  };

  const pipeline = new ETLPipeline(config);
  pipeline.registerExtractor('failing', new FailingExtractor());

  try {
    const result = await pipeline.execute();

    if (attempts === maxAttempts && result.success) {
      console.log('✓ Retry logic test passed');
    } else {
      console.error('✗ Retry logic test failed. Attempts:', attempts);
    }
  } catch (error) {
    console.error('✗ Retry logic test error:', error);
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('=== ETL Pipeline Tests ===\n');

  await testBasicPipeline();
  await testMultipleExtractors();
  await testErrorHandling();
  await testPipelineEvents();
  await testRetryLogic();

  console.log('\n=== Tests Complete ===');
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export {
  testBasicPipeline,
  testMultipleExtractors,
  testErrorHandling,
  testPipelineEvents,
  testRetryLogic,
  runTests
};
