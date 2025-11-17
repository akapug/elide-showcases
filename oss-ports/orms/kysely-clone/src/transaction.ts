/**
 * Transaction implementation
 */

import { Kysely } from './kysely';

export class Transaction<DB> {
  constructor(private config: any) {}

  async execute<T>(callback: (trx: Kysely<DB>) => Promise<T>): Promise<T> {
    await this.config.dialect.executeQuery('BEGIN');

    try {
      const trx = new Kysely<DB>(this.config);
      const result = await callback(trx);
      await this.config.dialect.executeQuery('COMMIT');
      return result;
    } catch (error) {
      await this.config.dialect.executeQuery('ROLLBACK');
      throw error;
    }
  }
}
