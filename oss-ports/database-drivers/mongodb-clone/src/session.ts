import * as types from './types';

export class ClientSession {
  private client: any;
  private options: types.SessionOptions;
  private inTransaction: boolean = false;

  constructor(client: any, options: types.SessionOptions = {}) {
    this.client = client;
    this.options = options;
  }

  async startTransaction(options?: types.TransactionOptions): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    this.inTransaction = true;
    await (globalThis as any).__elide_mongo_start_transaction?.(this.client, options);
  }

  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    await (globalThis as any).__elide_mongo_commit_transaction?.(this.client);
    this.inTransaction = false;
  }

  async abortTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    await (globalThis as any).__elide_mongo_abort_transaction?.(this.client);
    this.inTransaction = false;
  }

  async withTransaction<T>(fn: (session: this) => Promise<T>, options?: types.TransactionOptions): Promise<T> {
    await this.startTransaction(options);
    try {
      const result = await fn(this);
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.abortTransaction();
      throw error;
    }
  }

  async endSession(): Promise<void> {
    if (this.inTransaction) {
      await this.abortTransaction();
    }
    await (globalThis as any).__elide_mongo_end_session?.(this.client);
  }

  get inTransactionState(): boolean {
    return this.inTransaction;
  }
}
