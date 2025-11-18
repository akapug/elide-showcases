import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

interface TimeSeriesDataPoint {
  timestamp: Date;
  metric: string;
  value: number | bigint;
  tags?: Record<string, string>;
}

interface BlockMetrics {
  timestamp: Date;
  blockNumber: number;
  transactionCount: number;
  gasUsed: bigint;
  gasLimit: bigint;
  baseFeePerGas?: bigint | null;
  avgGasPrice?: bigint;
  totalValue?: bigint;
}

interface TransactionMetrics {
  timestamp: Date;
  blockNumber: number;
  transactionCount: number;
  avgGasPrice: bigint;
  medianGasPrice: bigint;
  totalValue: bigint;
  uniqueAddresses: number;
}

interface AddressMetrics {
  timestamp: Date;
  address: string;
  transactionCount: number;
  totalSent: bigint;
  totalReceived: bigint;
  currentBalance: bigint;
}

interface TokenMetrics {
  timestamp: Date;
  tokenAddress: string;
  transferCount: number;
  uniqueHolders: number;
  totalSupply?: bigint;
  volume24h?: bigint;
}

interface GasPriceStats {
  timestamp: Date;
  fast: bigint;
  standard: bigint;
  slow: bigint;
  baseFee?: bigint;
}

interface NetworkStats {
  timestamp: Date;
  blockNumber: number;
  blockTime: number;
  transactionsPerSecond: number;
  gasUtilization: number;
  activeAddresses: number;
}

interface BalanceChange {
  timestamp: Date;
  address: string;
  balance: bigint;
  delta: bigint;
  blockNumber: number;
}

interface AggregationWindow {
  interval: '1m' | '5m' | '15m' | '1h' | '6h' | '1d' | '7d' | '30d';
  retention: string;
}

export class TimeSeriesDB {
  private pgPool: Pool;
  private isTimescaleEnabled: boolean;
  private aggregationWindows: AggregationWindow[];
  private writeBuffer: Map<string, TimeSeriesDataPoint[]>;
  private bufferFlushInterval: NodeJS.Timeout;
  private bufferSize: number;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
    this.isTimescaleEnabled = false;
    this.writeBuffer = new Map();
    this.bufferSize = parseInt(process.env.TS_BUFFER_SIZE || '1000', 10);

    // Aggregation and retention policy
    this.aggregationWindows = [
      { interval: '1m', retention: '7d' },
      { interval: '5m', retention: '30d' },
      { interval: '1h', retention: '90d' },
      { interval: '1d', retention: '365d' },
    ];

    this.initializeTimescale();
    this.startBufferFlush();
  }

  private async initializeTimescale(): Promise<void> {
    try {
      // Check if TimescaleDB extension is available
      const result = await this.pgPool.query(
        "SELECT * FROM pg_extension WHERE extname = 'timescaledb'"
      );

      this.isTimescaleEnabled = result.rows.length > 0;

      if (this.isTimescaleEnabled) {
        logger.info('TimescaleDB extension detected');
        await this.setupHypertables();
        await this.setupContinuousAggregates();
      } else {
        logger.warn('TimescaleDB not available, using regular PostgreSQL tables');
      }
    } catch (error) {
      logger.error('Failed to initialize TimescaleDB', { error });
      this.isTimescaleEnabled = false;
    }
  }

  private async setupHypertables(): Promise<void> {
    if (!this.isTimescaleEnabled) return;

    const hypertables = [
      { table: 'block_metrics', timeColumn: 'timestamp' },
      { table: 'transaction_metrics', timeColumn: 'timestamp' },
      { table: 'address_metrics', timeColumn: 'timestamp' },
      { table: 'token_metrics', timeColumn: 'timestamp' },
      { table: 'gas_price_stats', timeColumn: 'timestamp' },
      { table: 'network_stats', timeColumn: 'timestamp' },
      { table: 'balance_snapshots', timeColumn: 'timestamp' },
    ];

    for (const { table, timeColumn } of hypertables) {
      try {
        await this.pgPool.query(
          `SELECT create_hypertable('${table}', '${timeColumn}', if_not_exists => TRUE)`
        );
        logger.info(`Hypertable created: ${table}`);
      } catch (error) {
        logger.warn(`Failed to create hypertable ${table}`, { error });
      }
    }
  }

  private async setupContinuousAggregates(): Promise<void> {
    if (!this.isTimescaleEnabled) return;

    // Block metrics aggregates
    await this.createContinuousAggregate(
      'block_metrics_1h',
      'block_metrics',
      '1 hour',
      `
        SELECT
          time_bucket('1 hour', timestamp) AS bucket,
          AVG(transaction_count) as avg_tx_count,
          AVG(gas_used::numeric) as avg_gas_used,
          AVG(base_fee_per_gas::numeric) as avg_base_fee,
          MAX(block_number) as max_block_number
        FROM block_metrics
        GROUP BY bucket
      `
    );

    // Transaction metrics aggregates
    await this.createContinuousAggregate(
      'transaction_metrics_1h',
      'transaction_metrics',
      '1 hour',
      `
        SELECT
          time_bucket('1 hour', timestamp) AS bucket,
          SUM(transaction_count) as total_tx_count,
          AVG(avg_gas_price::numeric) as avg_gas_price,
          SUM(total_value::numeric) as total_value,
          COUNT(DISTINCT unique_addresses) as unique_addresses
        FROM transaction_metrics
        GROUP BY bucket
      `
    );

    // Gas price aggregates
    await this.createContinuousAggregate(
      'gas_price_stats_15m',
      'gas_price_stats',
      '15 minutes',
      `
        SELECT
          time_bucket('15 minutes', timestamp) AS bucket,
          percentile_cont(0.9) WITHIN GROUP (ORDER BY fast::numeric) as fast_90th,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY standard::numeric) as standard_50th,
          percentile_cont(0.1) WITHIN GROUP (ORDER BY slow::numeric) as slow_10th
        FROM gas_price_stats
        GROUP BY bucket
      `
    );

    // Network stats aggregates
    await this.createContinuousAggregate(
      'network_stats_5m',
      'network_stats',
      '5 minutes',
      `
        SELECT
          time_bucket('5 minutes', timestamp) AS bucket,
          AVG(block_time) as avg_block_time,
          AVG(transactions_per_second) as avg_tps,
          AVG(gas_utilization) as avg_gas_utilization,
          MAX(active_addresses) as max_active_addresses
        FROM network_stats
        GROUP BY bucket
      `
    );
  }

  private async createContinuousAggregate(
    viewName: string,
    sourceTable: string,
    interval: string,
    query: string
  ): Promise<void> {
    try {
      await this.pgPool.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName}
        WITH (timescaledb.continuous) AS
        ${query}
        WITH NO DATA
      `);

      // Add refresh policy
      await this.pgPool.query(`
        SELECT add_continuous_aggregate_policy('${viewName}',
          start_offset => INTERVAL '1 day',
          end_offset => INTERVAL '${interval}',
          schedule_interval => INTERVAL '${interval}',
          if_not_exists => TRUE
        )
      `);

      logger.info(`Continuous aggregate created: ${viewName}`);
    } catch (error) {
      logger.warn(`Failed to create continuous aggregate ${viewName}`, { error });
    }
  }

  private startBufferFlush(): void {
    const interval = parseInt(process.env.TS_FLUSH_INTERVAL || '5000', 10);

    this.bufferFlushInterval = setInterval(async () => {
      await this.flushBuffer();
    }, interval);
  }

  private async flushBuffer(): Promise<void> {
    if (this.writeBuffer.size === 0) return;

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      for (const [table, dataPoints] of this.writeBuffer.entries()) {
        if (dataPoints.length === 0) continue;

        // Batch insert
        await this.batchInsert(client, table, dataPoints);
      }

      await client.query('COMMIT');

      // Clear buffer
      this.writeBuffer.clear();

      logger.debug('Time-series buffer flushed');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to flush time-series buffer', { error });
    } finally {
      client.release();
    }
  }

  private async batchInsert(
    client: PoolClient,
    table: string,
    dataPoints: TimeSeriesDataPoint[]
  ): Promise<void> {
    // Group by schema to build appropriate queries
    const columns = Object.keys(dataPoints[0]).filter(k => k !== 'tags');
    const tagColumns = dataPoints[0].tags ? Object.keys(dataPoints[0].tags) : [];

    const allColumns = [...columns, ...tagColumns];
    const placeholders = dataPoints
      .map((_, i) => {
        const offset = i * allColumns.length;
        return `(${allColumns.map((_, j) => `$${offset + j + 1}`).join(', ')})`;
      })
      .join(', ');

    const values: any[] = [];
    for (const dp of dataPoints) {
      for (const col of columns) {
        values.push((dp as any)[col]);
      }
      for (const tagCol of tagColumns) {
        values.push(dp.tags![tagCol]);
      }
    }

    const query = `
      INSERT INTO ${table} (${allColumns.join(', ')})
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING
    `;

    await client.query(query, values);
  }

  private bufferWrite(table: string, dataPoint: TimeSeriesDataPoint): void {
    if (!this.writeBuffer.has(table)) {
      this.writeBuffer.set(table, []);
    }

    const buffer = this.writeBuffer.get(table)!;
    buffer.push(dataPoint);

    // Flush if buffer is full
    if (buffer.length >= this.bufferSize) {
      this.flushBuffer().catch(error => {
        logger.error('Auto-flush failed', { error });
      });
    }
  }

  async recordBlock(metrics: BlockMetrics): Promise<void> {
    try {
      await this.pgPool.query(
        `INSERT INTO block_metrics (
          timestamp, block_number, transaction_count, gas_used,
          gas_limit, base_fee_per_gas
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (block_number) DO NOTHING`,
        [
          metrics.timestamp,
          metrics.blockNumber,
          metrics.transactionCount,
          metrics.gasUsed.toString(),
          metrics.gasLimit.toString(),
          metrics.baseFeePerGas?.toString() || null,
        ]
      );

      logger.debug('Block metrics recorded', { blockNumber: metrics.blockNumber });
    } catch (error) {
      logger.error('Failed to record block metrics', { error, metrics });
    }
  }

  async recordTransactionMetrics(metrics: TransactionMetrics): Promise<void> {
    await this.pgPool.query(
      `INSERT INTO transaction_metrics (
        timestamp, block_number, transaction_count, avg_gas_price,
        median_gas_price, total_value, unique_addresses
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        metrics.timestamp,
        metrics.blockNumber,
        metrics.transactionCount,
        metrics.avgGasPrice.toString(),
        metrics.medianGasPrice.toString(),
        metrics.totalValue.toString(),
        metrics.uniqueAddresses,
      ]
    );
  }

  async recordGasPrices(stats: GasPriceStats): Promise<void> {
    await this.pgPool.query(
      `INSERT INTO gas_price_stats (
        timestamp, fast, standard, slow, base_fee
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        stats.timestamp,
        stats.fast.toString(),
        stats.standard.toString(),
        stats.slow.toString(),
        stats.baseFee?.toString() || null,
      ]
    );
  }

  async recordNetworkStats(stats: NetworkStats): Promise<void> {
    await this.pgPool.query(
      `INSERT INTO network_stats (
        timestamp, block_number, block_time, transactions_per_second,
        gas_utilization, active_addresses
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        stats.timestamp,
        stats.blockNumber,
        stats.blockTime,
        stats.transactionsPerSecond,
        stats.gasUtilization,
        stats.activeAddresses,
      ]
    );
  }

  async recordBalanceChange(change: BalanceChange): Promise<void> {
    await this.pgPool.query(
      `INSERT INTO balance_snapshots (
        timestamp, address, balance, delta, block_number
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        change.timestamp,
        change.address,
        change.balance.toString(),
        change.delta.toString(),
        change.blockNumber,
      ]
    );
  }

  async getBlockMetrics(
    fromTime: Date,
    toTime: Date,
    interval?: '1m' | '5m' | '15m' | '1h' | '6h' | '1d'
  ): Promise<BlockMetrics[]> {
    let query: string;
    const params = [fromTime, toTime];

    if (interval && this.isTimescaleEnabled) {
      query = `
        SELECT
          time_bucket($3, timestamp) as timestamp,
          MAX(block_number) as block_number,
          AVG(transaction_count)::int as transaction_count,
          AVG(gas_used::numeric)::numeric as gas_used,
          AVG(gas_limit::numeric)::numeric as gas_limit,
          AVG(base_fee_per_gas::numeric)::numeric as base_fee_per_gas
        FROM block_metrics
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY time_bucket($3, timestamp)
        ORDER BY timestamp
      `;
      params.push(interval);
    } else {
      query = `
        SELECT *
        FROM block_metrics
        WHERE timestamp >= $1 AND timestamp <= $2
        ORDER BY timestamp
      `;
    }

    const result = await this.pgPool.query(query, params);

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      blockNumber: row.block_number,
      transactionCount: row.transaction_count,
      gasUsed: BigInt(row.gas_used),
      gasLimit: BigInt(row.gas_limit),
      baseFeePerGas: row.base_fee_per_gas ? BigInt(row.base_fee_per_gas) : null,
    }));
  }

  async getGasPriceHistory(
    fromTime: Date,
    toTime: Date,
    interval?: string
  ): Promise<GasPriceStats[]> {
    let query: string;
    const params = [fromTime, toTime];

    if (interval && this.isTimescaleEnabled) {
      query = `
        SELECT
          time_bucket($3, timestamp) as timestamp,
          percentile_cont(0.9) WITHIN GROUP (ORDER BY fast::numeric) as fast,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY standard::numeric) as standard,
          percentile_cont(0.1) WITHIN GROUP (ORDER BY slow::numeric) as slow,
          AVG(base_fee::numeric) as base_fee
        FROM gas_price_stats
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY time_bucket($3, timestamp)
        ORDER BY timestamp
      `;
      params.push(interval);
    } else {
      query = `
        SELECT *
        FROM gas_price_stats
        WHERE timestamp >= $1 AND timestamp <= $2
        ORDER BY timestamp
      `;
    }

    const result = await this.pgPool.query(query, params);

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      fast: BigInt(row.fast),
      standard: BigInt(row.standard),
      slow: BigInt(row.slow),
      baseFee: row.base_fee ? BigInt(row.base_fee) : undefined,
    }));
  }

  async getNetworkStats(
    fromTime: Date,
    toTime: Date,
    interval?: string
  ): Promise<NetworkStats[]> {
    let query: string;
    const params = [fromTime, toTime];

    if (interval && this.isTimescaleEnabled) {
      query = `
        SELECT
          time_bucket($3, timestamp) as timestamp,
          MAX(block_number) as block_number,
          AVG(block_time) as block_time,
          AVG(transactions_per_second) as transactions_per_second,
          AVG(gas_utilization) as gas_utilization,
          MAX(active_addresses) as active_addresses
        FROM network_stats
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY time_bucket($3, timestamp)
        ORDER BY timestamp
      `;
      params.push(interval);
    } else {
      query = `
        SELECT *
        FROM network_stats
        WHERE timestamp >= $1 AND timestamp <= $2
        ORDER BY timestamp
      `;
    }

    const result = await this.pgPool.query(query, params);

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      blockNumber: row.block_number,
      blockTime: row.block_time,
      transactionsPerSecond: row.transactions_per_second,
      gasUtilization: row.gas_utilization,
      activeAddresses: row.active_addresses,
    }));
  }

  async getAddressBalanceHistory(
    address: string,
    fromTime: Date,
    toTime: Date
  ): Promise<Array<{ timestamp: Date; balance: bigint }>> {
    const result = await this.pgPool.query(
      `SELECT timestamp, balance
       FROM balance_snapshots
       WHERE address = $1
       AND timestamp >= $2
       AND timestamp <= $3
       ORDER BY timestamp`,
      [address.toLowerCase(), fromTime, toTime]
    );

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      balance: BigInt(row.balance),
    }));
  }

  async getAggregatedMetric(
    table: string,
    metric: string,
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count',
    fromTime: Date,
    toTime: Date,
    interval?: string,
    filters?: Record<string, any>
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    let query: string;
    const params: any[] = [fromTime, toTime];
    let paramCount = 3;

    const whereClause: string[] = ['timestamp >= $1', 'timestamp <= $2'];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        whereClause.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    }

    if (interval && this.isTimescaleEnabled) {
      query = `
        SELECT
          time_bucket($${paramCount}, timestamp) as timestamp,
          ${aggregation}(${metric})::numeric as value
        FROM ${table}
        WHERE ${whereClause.join(' AND ')}
        GROUP BY time_bucket($${paramCount}, timestamp)
        ORDER BY timestamp
      `;
      params.push(interval);
    } else {
      query = `
        SELECT
          timestamp,
          ${metric}::numeric as value
        FROM ${table}
        WHERE ${whereClause.join(' AND ')}
        ORDER BY timestamp
      `;
    }

    const result = await this.pgPool.query(query, params);

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      value: parseFloat(row.value),
    }));
  }

  async downsample(table: string, olderThan: Date, interval: string): Promise<void> {
    if (!this.isTimescaleEnabled) {
      logger.warn('Downsampling requires TimescaleDB');
      return;
    }

    logger.info('Starting downsampling', { table, olderThan, interval });

    try {
      // Refresh continuous aggregates
      await this.pgPool.query(`
        CALL refresh_continuous_aggregate('${table}_${interval}', $1, $2)
      `, [olderThan, new Date()]);

      logger.info('Downsampling completed', { table, interval });
    } catch (error) {
      logger.error('Downsampling failed', { error, table, interval });
    }
  }

  async cleanup(olderThan: Date): Promise<void> {
    logger.info('Starting time-series cleanup', { olderThan });

    const tables = [
      'block_metrics',
      'transaction_metrics',
      'gas_price_stats',
      'network_stats',
      'balance_snapshots',
    ];

    for (const table of tables) {
      try {
        const result = await this.pgPool.query(
          `DELETE FROM ${table} WHERE timestamp < $1`,
          [olderThan]
        );

        logger.info(`Cleaned up ${table}`, { rowsDeleted: result.rowCount });
      } catch (error) {
        logger.error(`Failed to cleanup ${table}`, { error });
      }
    }
  }

  async close(): Promise<void> {
    clearInterval(this.bufferFlushInterval);
    await this.flushBuffer();
    logger.info('Time-series DB closed');
  }
}
