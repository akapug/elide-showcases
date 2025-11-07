/**
 * ETL Data Pipeline Example
 *
 * Complete example demonstrating the ETL pipeline capabilities.
 */

import { ETLPipeline, PipelineConfig } from './orchestrator/pipeline';
import { PipelineScheduler, ScheduleConfig } from './orchestrator/scheduler';
import { ApiExtractor } from './extractors/api-extractor';
import { CsvExtractor } from './extractors/csv-extractor';
import { JsonExtractor } from './extractors/json-extractor';
import { DataValidator, CommonSchemas } from './transformers/validator';
import { DataEnricher, CommonEnrichments } from './transformers/enricher';
import { DatabaseLoader } from './loaders/db-loader';
import { FileLoader } from './loaders/file-loader';

/**
 * Example 1: Simple CSV to JSON pipeline
 */
async function simpleCSVToJSON(): Promise<void> {
  console.log('=== Example 1: CSV to JSON Pipeline ===\n');

  const config: PipelineConfig = {
    name: 'csv-to-json-pipeline',
    description: 'Convert CSV file to JSON',
    extractors: [
      {
        type: 'csv',
        name: 'csv-extractor',
        config: {
          filePath: './data/input/sample.csv',
          hasHeader: true,
          delimiter: ',',
          encoding: 'utf8'
        }
      }
    ],
    transformers: [
      {
        type: 'validator',
        name: 'data-validator',
        config: {
          schema: {
            id: [{ type: 'required' }],
            email: [{ type: 'email' }]
          },
          removeInvalid: true
        }
      }
    ],
    loaders: [
      {
        type: 'file',
        name: 'json-loader',
        config: {
          outputPath: './data/output/converted.json',
          format: 'json',
          createDirectory: true,
          jsonOptions: {
            pretty: true,
            indent: 2
          }
        }
      }
    ],
    options: {
      parallel: false,
      continueOnError: true,
      archiveData: true,
      archivePath: './data/archive'
    }
  };

  const pipeline = new ETLPipeline(config);

  // Register components
  pipeline.registerExtractor('csv', new CsvExtractor());
  pipeline.registerTransformer('validator', new DataValidator());
  pipeline.registerLoader('file', new FileLoader());

  // Execute pipeline
  const result = await pipeline.execute();

  console.log('\nPipeline Result:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Duration: ${result.durationMs}ms`);
  console.log(`  Total Records: ${result.totalRecords}`);
  console.log(`  Successful: ${result.successfulRecords}`);
  console.log(`  Failed: ${result.failedRecords}`);
}

/**
 * Example 2: Multi-source data integration
 */
async function multiSourceIntegration(): Promise<void> {
  console.log('\n=== Example 2: Multi-Source Integration ===\n');

  const config: PipelineConfig = {
    name: 'multi-source-pipeline',
    description: 'Integrate data from API, CSV, and JSON sources',
    extractors: [
      {
        type: 'api',
        name: 'api-extractor',
        config: {
          url: 'https://api.example.com/users',
          method: 'GET',
          dataPath: 'data.users',
          pagination: {
            type: 'offset',
            pageSize: 100,
            maxPages: 5
          }
        },
        enabled: false // Disabled for demo
      },
      {
        type: 'csv',
        name: 'csv-extractor',
        config: {
          filePath: './data/input/users.csv'
        }
      },
      {
        type: 'json',
        name: 'json-extractor',
        config: {
          filePath: './data/input/users.json',
          dataPath: 'users'
        }
      }
    ],
    transformers: [
      {
        type: 'validator',
        name: 'user-validator',
        config: {
          schema: CommonSchemas.user,
          removeInvalid: false,
          addValidationField: true
        }
      },
      {
        type: 'enricher',
        name: 'user-enricher',
        config: {
          computedFields: {
            fullName: CommonEnrichments.fullName,
            processedAt: CommonEnrichments.timestamp
          },
          lookups: [
            {
              targetField: 'role',
              lookupField: 'roleId',
              lookupTable: {
                '1': 'Admin',
                '2': 'User',
                '3': 'Guest'
              },
              defaultValue: 'Unknown'
            }
          ]
        }
      }
    ],
    loaders: [
      {
        type: 'database',
        name: 'db-loader',
        config: {
          type: 'mock',
          connection: {},
          table: 'users',
          mode: 'upsert',
          conflictKeys: ['id'],
          batchSize: 1000
        }
      },
      {
        type: 'file',
        name: 'backup-loader',
        config: {
          outputPath: './data/output/users-backup.jsonl',
          format: 'jsonl',
          mode: 'timestamp',
          createDirectory: true
        }
      }
    ],
    options: {
      parallel: true,
      maxConcurrency: 3,
      continueOnError: true,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 1000,
        backoffMultiplier: 2
      }
    }
  };

  const pipeline = new ETLPipeline(config);

  // Register components
  pipeline.registerExtractor('api', new ApiExtractor());
  pipeline.registerExtractor('csv', new CsvExtractor());
  pipeline.registerExtractor('json', new JsonExtractor());
  pipeline.registerTransformer('validator', new DataValidator());
  pipeline.registerTransformer('enricher', new DataEnricher());
  pipeline.registerLoader('database', new DatabaseLoader());
  pipeline.registerLoader('file', new FileLoader());

  // Listen to events
  pipeline.on('stage:start', (stage, context) => {
    console.log(`[${stage}] Starting...`);
  });

  pipeline.on('stage:complete', (stage, result, context) => {
    console.log(`[${stage}] Complete: ${result.metrics.recordsProcessed} records`);
  });

  // Execute pipeline
  const result = await pipeline.execute();

  console.log('\nPipeline Summary:');
  for (const stage of result.stages) {
    console.log(`  ${stage.stage}: ${stage.status} (${stage.metrics.recordsProcessed} records, ${stage.metrics.durationMs}ms)`);
  }
}

/**
 * Example 3: Scheduled pipeline
 */
async function scheduledPipeline(): Promise<void> {
  console.log('\n=== Example 3: Scheduled Pipeline ===\n');

  const pipelineConfig: PipelineConfig = {
    name: 'daily-report-pipeline',
    description: 'Generate daily reports',
    extractors: [
      {
        type: 'json',
        name: 'transactions-extractor',
        config: {
          filePath: './data/input/transactions.json'
        }
      }
    ],
    transformers: [
      {
        type: 'enricher',
        name: 'report-enricher',
        config: {
          aggregations: [
            {
              groupBy: ['date'],
              aggregates: [
                {
                  field: 'amount',
                  operation: 'sum',
                  outputField: 'totalAmount'
                },
                {
                  field: 'amount',
                  operation: 'count',
                  outputField: 'transactionCount'
                }
              ]
            }
          ]
        }
      }
    ],
    loaders: [
      {
        type: 'file',
        name: 'report-loader',
        config: {
          outputPath: './data/output/daily-report.json',
          format: 'json',
          mode: 'timestamp',
          createDirectory: true
        }
      }
    ],
    options: {
      continueOnError: false
    }
  };

  const scheduleConfig: ScheduleConfig = {
    name: 'daily-report-schedule',
    cron: '0 0 * * *', // Daily at midnight
    pipeline: pipelineConfig,
    enabled: true,
    maxConcurrentRuns: 1
  };

  const scheduler = new PipelineScheduler();

  // Add job
  const jobId = scheduler.addJob(scheduleConfig);
  console.log(`Scheduled job: ${jobId}`);

  // Listen to job events
  scheduler.on('job:start', (job) => {
    console.log(`Job ${job.id} started (run #${job.runCount})`);
  });

  scheduler.on('job:complete', (job, result) => {
    console.log(`Job ${job.id} completed: ${result.successfulRecords}/${result.totalRecords} records`);
  });

  scheduler.on('job:error', (job, error) => {
    console.error(`Job ${job.id} error:`, error);
  });

  // Start scheduler
  scheduler.start();

  console.log('Scheduler started. Press Ctrl+C to stop.');
  console.log(`Next execution: ${scheduler.getJob(jobId)?.nextExecution}`);

  // Manually trigger for demo
  console.log('\nManually triggering job for demo...');
  const result = await scheduler.triggerJob(jobId);

  console.log(`\nManual execution result: ${result.success ? 'Success' : 'Failed'}`);

  // Stop scheduler
  await scheduler.stop();
  console.log('Scheduler stopped.');
}

/**
 * Example 4: Data quality pipeline
 */
async function dataQualityPipeline(): Promise<void> {
  console.log('\n=== Example 4: Data Quality Pipeline ===\n');

  const config: PipelineConfig = {
    name: 'data-quality-pipeline',
    description: 'Validate and clean customer data',
    extractors: [
      {
        type: 'csv',
        name: 'customer-extractor',
        config: {
          filePath: './data/input/customers.csv'
        }
      }
    ],
    transformers: [
      {
        type: 'enricher',
        name: 'python-normalizer',
        config: {
          usePythonNormalizer: true,
          pythonConfig: {
            remove_duplicates: true,
            remove_empty_strings: true,
            fill_missing: {
              country: 'Unknown',
              status: 'Active'
            }
          }
        }
      },
      {
        type: 'validator',
        name: 'quality-validator',
        config: {
          schema: {
            customerId: [
              { type: 'required' },
              { type: 'pattern', pattern: '^C[0-9]{6}$', message: 'Customer ID must be C followed by 6 digits' }
            ],
            email: [
              { type: 'required' },
              { type: 'email' }
            ],
            phone: [
              { type: 'pattern', pattern: '^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$', message: 'Invalid phone format' }
            ],
            registrationDate: [
              { type: 'required' },
              { type: 'type', dataType: 'date' }
            ]
          },
          strict: false,
          removeInvalid: false,
          addValidationField: true
        }
      }
    ],
    loaders: [
      {
        type: 'file',
        name: 'clean-data-loader',
        config: {
          outputPath: './data/output/customers-clean.json',
          format: 'json',
          createDirectory: true
        }
      }
    ],
    options: {
      continueOnError: true,
      archiveData: true
    }
  };

  const pipeline = new ETLPipeline(config);

  pipeline.registerExtractor('csv', new CsvExtractor());
  pipeline.registerTransformer('enricher', new DataEnricher());
  pipeline.registerTransformer('validator', new DataValidator());
  pipeline.registerLoader('file', new FileLoader());

  const result = await pipeline.execute();

  console.log('\nData Quality Report:');
  console.log(`  Total Records: ${result.totalRecords}`);
  console.log(`  Clean Records: ${result.successfulRecords}`);
  console.log(`  Issues Found: ${result.failedRecords}`);
  console.log(`  Success Rate: ${((result.successfulRecords / result.totalRecords) * 100).toFixed(2)}%`);
}

/**
 * Run all examples
 */
async function runExamples(): Promise<void> {
  console.log('ETL Data Pipeline Examples\n');
  console.log('Note: These examples use mock data and connections.\n');

  try {
    await simpleCSVToJSON();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await multiSourceIntegration();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await scheduledPipeline();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await dataQualityPipeline();

    console.log('\n=== All Examples Complete ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  simpleCSVToJSON,
  multiSourceIntegration,
  scheduledPipeline,
  dataQualityPipeline,
  runExamples
};
