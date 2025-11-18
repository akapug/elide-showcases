/**
 * Blockchain Indexer Performance Benchmarks
 *
 * Comprehensive benchmarking suite for measuring indexing speed,
 * query performance, and system throughput.
 */

import { performance } from 'perf_hooks';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import { BlockProcessor } from '../src/indexer/block-processor';
import { TimeSeriesDB } from '../src/storage/time-series-db';
import { GraphDB } from '../src/storage/graph-db';
import { logger } from '../src/utils/logger';

interface BenchmarkResult {
  name: string;
  duration: number;
  throughput: number;
  itemsProcessed: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errors: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
}

class PerformanceBenchmark {
  private pgPool: Pool;
  private timeSeriesDB: TimeSeriesDB;
  private graphDB: GraphDB;
  private results: BenchmarkResult[] = [];
  private latencies: number[] = [];

  constructor() {
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'blockchain_indexer',
      user: process.env.POSTGRES_USER || 'indexer',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
    });

    this.timeSeriesDB = new TimeSeriesDB(this.pgPool);
    this.graphDB = new GraphDB({
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
    });
  }

  /**
   * Benchmark block processing speed
   */
  async benchmarkBlockProcessing(startBlock: number, blockCount: number): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking block processing: ${blockCount} blocks starting from ${startBlock}`);

    const processor = new BlockProcessor(this.pgPool, this.timeSeriesDB, this.graphDB);
    const latencies: number[] = [];
    let errors = 0;

    const startTime = performance.now();

    for (let i = 0; i < blockCount; i++) {
      const blockNumber = startBlock + i;
      const blockStart = performance.now();

      try {
        await processor['processBlock'](blockNumber);
        const blockEnd = performance.now();
        latencies.push(blockEnd - blockStart);
      } catch (error) {
        errors++;
        logger.error('Block processing error', { blockNumber, error });
      }

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`  Processed ${i + 1}/${blockCount} blocks...`);
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // seconds

    latencies.sort((a, b) => a - b);

    return {
      name: 'Block Processing',
      duration,
      throughput: blockCount / duration,
      itemsProcessed: blockCount,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      errors,
    };
  }

  /**
   * Benchmark transaction processing
   */
  async benchmarkTransactionProcessing(blockRange: [number, number]): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking transaction processing: blocks ${blockRange[0]}-${blockRange[1]}`);

    const [startBlock, endBlock] = blockRange;
    const latencies: number[] = [];
    let txCount = 0;
    let errors = 0;

    const startTime = performance.now();

    const result = await this.pgPool.query(
      'SELECT * FROM transactions WHERE block_number >= $1 AND block_number <= $2',
      [startBlock, endBlock]
    );

    txCount = result.rows.length;

    for (const tx of result.rows) {
      const txStart = performance.now();

      try {
        // Simulate transaction processing
        await this.processSingleTransaction(tx);
        const txEnd = performance.now();
        latencies.push(txEnd - txStart);
      } catch (error) {
        errors++;
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    latencies.sort((a, b) => a - b);

    return {
      name: 'Transaction Processing',
      duration,
      throughput: txCount / duration,
      itemsProcessed: txCount,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      errors,
    };
  }

  /**
   * Benchmark query performance
   */
  async benchmarkQueryPerformance(iterations: number = 1000): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking query performance: ${iterations} iterations`);

    const queries = [
      // Simple queries
      () => this.pgPool.query('SELECT * FROM blocks WHERE number = $1', [15000000]),
      () => this.pgPool.query('SELECT * FROM transactions WHERE hash = $1', ['0x' + '0'.repeat(64)]),
      () => this.pgPool.query('SELECT * FROM addresses WHERE address = $1', ['0x' + '0'.repeat(40)]),

      // Complex queries
      () => this.pgPool.query(`
        SELECT a.*, COUNT(t.hash) as tx_count
        FROM addresses a
        LEFT JOIN transactions t ON (t.from_address = a.address OR t.to_address = a.address)
        GROUP BY a.address
        ORDER BY tx_count DESC
        LIMIT 100
      `),

      // Aggregation queries
      () => this.pgPool.query(`
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM blocks
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
      `),

      // Join queries
      () => this.pgPool.query(`
        SELECT t.*, b.timestamp
        FROM transactions t
        JOIN blocks b ON t.block_number = b.number
        WHERE t.from_address = $1
        ORDER BY b.number DESC
        LIMIT 100
      `, ['0x' + '0'.repeat(40)]),
    ];

    const latencies: number[] = [];
    let errors = 0;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const query = queries[i % queries.length];
      const queryStart = performance.now();

      try {
        await query();
        const queryEnd = performance.now();
        latencies.push(queryEnd - queryStart);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`  Executed ${i + 1}/${iterations} queries...`);
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    latencies.sort((a, b) => a - b);

    return {
      name: 'Query Performance',
      duration,
      throughput: iterations / duration,
      itemsProcessed: iterations,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      errors,
    };
  }

  /**
   * Benchmark concurrent query load
   */
  async benchmarkConcurrentQueries(concurrency: number, queriesPerClient: number): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking concurrent queries: ${concurrency} clients, ${queriesPerClient} queries each`);

    const latencies: number[] = [];
    let errors = 0;
    const startTime = performance.now();

    const executeQueries = async (clientId: number) => {
      for (let i = 0; i < queriesPerClient; i++) {
        const queryStart = performance.now();

        try {
          await this.pgPool.query(
            'SELECT * FROM blocks WHERE number >= $1 LIMIT 10',
            [15000000 + clientId * 1000 + i]
          );
          const queryEnd = performance.now();
          latencies.push(queryEnd - queryStart);
        } catch (error) {
          errors++;
        }
      }
    };

    // Execute concurrent queries
    const promises = Array.from({ length: concurrency }, (_, i) => executeQueries(i));
    await Promise.all(promises);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const totalQueries = concurrency * queriesPerClient;

    latencies.sort((a, b) => a - b);

    return {
      name: 'Concurrent Queries',
      duration,
      throughput: totalQueries / duration,
      itemsProcessed: totalQueries,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      errors,
    };
  }

  /**
   * Benchmark graph queries
   */
  async benchmarkGraphQueries(iterations: number = 100): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking graph queries: ${iterations} iterations`);

    const latencies: number[] = [];
    let errors = 0;
    const startTime = performance.now();

    const sampleAddresses = [
      '0x' + '1'.repeat(40),
      '0x' + '2'.repeat(40),
      '0x' + '3'.repeat(40),
    ];

    for (let i = 0; i < iterations; i++) {
      const address = sampleAddresses[i % sampleAddresses.length];
      const queryStart = performance.now();

      try {
        await this.graphDB.getAddressNeighbors(address, 'both', 50);
        const queryEnd = performance.now();
        latencies.push(queryEnd - queryStart);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  Executed ${i + 1}/${iterations} graph queries...`);
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    latencies.sort((a, b) => a - b);

    return {
      name: 'Graph Queries',
      duration,
      throughput: iterations / duration,
      itemsProcessed: iterations,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      errors,
    };
  }

  /**
   * Benchmark write performance
   */
  async benchmarkWritePerformance(recordCount: number): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking write performance: ${recordCount} records`);

    const latencies: number[] = [];
    let errors = 0;
    const startTime = performance.now();

    for (let i = 0; i < recordCount; i++) {
      const writeStart = performance.now();

      try {
        await this.pgPool.query(
          `INSERT INTO test_writes (id, data, timestamp)
           VALUES ($1, $2, NOW())
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [i, `test_data_${i}`]
        );
        const writeEnd = performance.now();
        latencies.push(writeEnd - writeStart);
      } catch (error) {
        errors++;
      }

      if ((i + 1) % 1000 === 0) {
        console.log(`  Written ${i + 1}/${recordCount} records...`);
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    latencies.sort((a, b) => a - b);

    return {
      name: 'Write Performance',
      duration,
      throughput: recordCount / duration,
      itemsProcessed: recordCount,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      errors,
    };
  }

  /**
   * Helper method to process a single transaction
   */
  private async processSingleTransaction(tx: any): Promise<void> {
    // Simulate transaction processing steps
    await this.pgPool.query(
      'SELECT * FROM transaction_inputs WHERE transaction_hash = $1',
      [tx.hash]
    );

    await this.pgPool.query(
      'SELECT * FROM events WHERE transaction_hash = $1',
      [tx.hash]
    );
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): SystemMetrics {
    const usage = process.memoryUsage();

    return {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: usage.heapUsed / 1024 / 1024, // MB
      diskIO: 0, // Would need OS-specific implementation
      networkIO: 0, // Would need OS-specific implementation
    };
  }

  /**
   * Print benchmark results
   */
  private printResults(result: BenchmarkResult): void {
    console.log('\n' + '='.repeat(70));
    console.log(`Benchmark: ${result.name}`);
    console.log('='.repeat(70));
    console.log(`Duration:          ${result.duration.toFixed(2)}s`);
    console.log(`Items Processed:   ${result.itemsProcessed.toLocaleString()}`);
    console.log(`Throughput:        ${result.throughput.toFixed(2)} items/second`);
    console.log(`\nLatency Statistics:`);
    console.log(`  Average:         ${result.avgLatency.toFixed(2)}ms`);
    console.log(`  P50 (Median):    ${result.p50Latency.toFixed(2)}ms`);
    console.log(`  P95:             ${result.p95Latency.toFixed(2)}ms`);
    console.log(`  P99:             ${result.p99Latency.toFixed(2)}ms`);
    console.log(`Errors:            ${result.errors}`);
    console.log('='.repeat(70));
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<void> {
    console.log('\n🚀 Starting Blockchain Indexer Performance Benchmarks\n');

    const startMetrics = this.getSystemMetrics();
    const overallStart = performance.now();

    try {
      // Query performance benchmarks
      const queryResult = await this.benchmarkQueryPerformance(1000);
      this.printResults(queryResult);
      this.results.push(queryResult);

      // Concurrent query benchmarks
      const concurrentResult = await this.benchmarkConcurrentQueries(10, 100);
      this.printResults(concurrentResult);
      this.results.push(concurrentResult);

      // Graph query benchmarks
      const graphResult = await this.benchmarkGraphQueries(100);
      this.printResults(graphResult);
      this.results.push(graphResult);

      // Write performance benchmarks
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS test_writes (
          id INT PRIMARY KEY,
          data TEXT,
          timestamp TIMESTAMP
        )
      `);

      const writeResult = await this.benchmarkWritePerformance(10000);
      this.printResults(writeResult);
      this.results.push(writeResult);

      // Cleanup
      await this.pgPool.query('DROP TABLE IF EXISTS test_writes');

    } catch (error) {
      logger.error('Benchmark error', { error });
    }

    const overallEnd = performance.now();
    const endMetrics = this.getSystemMetrics();

    // Print summary
    console.log('\n\n' + '='.repeat(70));
    console.log('BENCHMARK SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Duration: ${((overallEnd - overallStart) / 1000).toFixed(2)}s\n`);

    console.log('Results by Benchmark:');
    for (const result of this.results) {
      console.log(`\n${result.name}:`);
      console.log(`  Throughput: ${result.throughput.toFixed(2)} items/s`);
      console.log(`  P50 Latency: ${result.p50Latency.toFixed(2)}ms`);
      console.log(`  P99 Latency: ${result.p99Latency.toFixed(2)}ms`);
    }

    console.log('\nSystem Metrics:');
    console.log(`  Memory Used: ${endMetrics.memoryUsage.toFixed(2)} MB`);
    console.log(`  CPU Time: ${endMetrics.cpuUsage.toFixed(2)}s`);

    console.log('\n' + '='.repeat(70));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.pgPool.end();
    await this.graphDB.close();
    await this.timeSeriesDB.close();
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();

  benchmark
    .runAll()
    .then(() => benchmark.cleanup())
    .then(() => {
      console.log('\n✅ Benchmarks completed successfully\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export { PerformanceBenchmark, BenchmarkResult, SystemMetrics };
