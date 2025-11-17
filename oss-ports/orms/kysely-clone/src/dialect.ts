/**
 * Database dialects
 */

export class PostgresDialect {
  constructor(private config: { pool: any }) {}

  async executeQuery(sql: string): Promise<any> {
    return await this.config.pool.query(sql);
  }

  async destroy(): Promise<void> {
    await this.config.pool.end();
  }
}

export class MysqlDialect {
  constructor(private config: { pool: any }) {}

  async executeQuery(sql: string): Promise<any> {
    return await this.config.pool.query(sql);
  }

  async destroy(): Promise<void> {
    await this.config.pool.end();
  }
}

export class SqliteDialect {
  constructor(private config: { database: any }) {}

  async executeQuery(sql: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.config.database.all(sql, (err: any, rows: any) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    });
  }

  async destroy(): Promise<void> {
    await new Promise((resolve) => this.config.database.close(resolve));
  }
}
