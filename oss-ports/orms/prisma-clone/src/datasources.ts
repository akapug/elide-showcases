/**
 * Datasource adapters
 */

export class PostgreSQLAdapter {
  connect(url: string): Promise<void> {
    return Promise.resolve();
  }
}

export class MySQLAdapter {
  connect(url: string): Promise<void> {
    return Promise.resolve();
  }
}

export class SQLiteAdapter {
  connect(url: string): Promise<void> {
    return Promise.resolve();
  }
}

export class MongoDBAdapter {
  connect(url: string): Promise<void> {
    return Promise.resolve();
  }
}
