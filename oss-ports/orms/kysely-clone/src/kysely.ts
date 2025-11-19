/**
 * Main Kysely class
 */

import { SelectQueryBuilder } from './query-builder/select';
import { InsertQueryBuilder } from './query-builder/insert';
import { UpdateQueryBuilder } from './query-builder/update';
import { DeleteQueryBuilder } from './query-builder/delete';
import { Transaction } from './transaction';
import { SchemaBuilder } from './schema';

export interface KyselyConfig {
  dialect: any;
  plugins?: any[];
  log?: (event: any) => void;
}

export class Kysely<DB> {
  constructor(private config: KyselyConfig) {}

  selectFrom<T extends keyof DB & string>(table: T) {
    return new SelectQueryBuilder<DB, T>(this.config, table);
  }

  insertInto<T extends keyof DB & string>(table: T) {
    return new InsertQueryBuilder<DB, T>(this.config, table);
  }

  updateTable<T extends keyof DB & string>(table: T) {
    return new UpdateQueryBuilder<DB, T>(this.config, table);
  }

  deleteFrom<T extends keyof DB & string>(table: T) {
    return new DeleteQueryBuilder<DB, T>(this.config, table);
  }

  get schema() {
    return new SchemaBuilder(this.config);
  }

  get fn() {
    return {
      count: <T = number>(column: string) => ({ fn: 'COUNT', args: [column] }),
      avg: <T = number>(column: string) => ({ fn: 'AVG', args: [column] }),
      sum: <T = number>(column: string) => ({ fn: 'SUM', args: [column] }),
      min: <T = number>(column: string) => ({ fn: 'MIN', args: [column] }),
      max: <T = number>(column: string) => ({ fn: 'MAX', args: [column] }),
      coalesce: (...args: any[]) => ({ fn: 'COALESCE', args })
    };
  }

  transaction() {
    return new Transaction<DB>(this.config);
  }

  raw<T = any>(sql: string | TemplateStringsArray, ...values: any[]) {
    const sqlString = typeof sql === 'string' ? sql : this._templateToSQL(sql, values);
    return {
      execute: async () => {
        const result = await this.config.dialect.executeQuery(sqlString);
        return result.rows as T[];
      }
    };
  }

  async destroy(): Promise<void> {
    if (this.config.dialect.destroy) {
      await this.config.dialect.destroy();
    }
  }

  private _templateToSQL(strings: TemplateStringsArray, values: any[]): string {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += `$${i + 1}` + strings[i + 1];
    }
    return result;
  }
}
