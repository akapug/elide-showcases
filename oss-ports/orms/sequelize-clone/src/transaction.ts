/**
 * Transaction implementation
 */

import { Sequelize } from './sequelize';

export interface TransactionOptions {
  autocommit?: boolean;
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  type?: 'DEFERRED' | 'IMMEDIATE' | 'EXCLUSIVE';
  deferrable?: string;
}

export class Transaction {
  private _committed: boolean = false;
  private _rolledBack: boolean = false;
  private _started: boolean = false;

  constructor(
    private sequelize: Sequelize,
    private options: TransactionOptions = {}
  ) {}

  async begin(): Promise<void> {
    if (this._started) {
      throw new Error('Transaction already started');
    }

    await this.sequelize.query('BEGIN');
    this._started = true;
  }

  async commit(): Promise<void> {
    if (!this._started) {
      throw new Error('Transaction not started');
    }
    if (this._committed) {
      throw new Error('Transaction already committed');
    }
    if (this._rolledBack) {
      throw new Error('Transaction already rolled back');
    }

    await this.sequelize.query('COMMIT');
    this._committed = true;
  }

  async rollback(): Promise<void> {
    if (!this._started) {
      throw new Error('Transaction not started');
    }
    if (this._committed) {
      throw new Error('Transaction already committed');
    }
    if (this._rolledBack) {
      throw new Error('Transaction already rolled back');
    }

    await this.sequelize.query('ROLLBACK');
    this._rolledBack = true;
  }

  async savepoint(name: string): Promise<void> {
    await this.sequelize.query(`SAVEPOINT ${name}`);
  }

  async releaseSavepoint(name: string): Promise<void> {
    await this.sequelize.query(`RELEASE SAVEPOINT ${name}`);
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    await this.sequelize.query(`ROLLBACK TO SAVEPOINT ${name}`);
  }

  get finished(): boolean {
    return this._committed || this._rolledBack;
  }
}
