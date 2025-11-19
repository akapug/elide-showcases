/**
 * Main Sequelize class
 */

import { Model } from './model';
import { Transaction } from './transaction';
import { QueryInterface } from './query-interface';
import { QueryTypes } from './query-types';

export interface SequelizeOptions {
  dialect: 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  storage?: string;
  pool?: {
    max?: number;
    min?: number;
    acquire?: number;
    idle?: number;
  };
  logging?: boolean | ((sql: string) => void);
  define?: {
    timestamps?: boolean;
    paranoid?: boolean;
    underscored?: boolean;
    freezeTableName?: boolean;
  };
}

export class Sequelize {
  private models: Map<string, typeof Model> = new Map();
  private _queryInterface?: QueryInterface;

  constructor(public options: SequelizeOptions) {
    this._queryInterface = new QueryInterface(this);
  }

  define(modelName: string, attributes: any, options?: any): typeof Model {
    const model = class extends Model {};
    model.init(attributes, { ...options, sequelize: this, modelName });
    this.models.set(modelName, model);
    return model;
  }

  model(name: string): typeof Model {
    const model = this.models.get(name);
    if (!model) {
      throw new Error(`Model ${name} not found`);
    }
    return model;
  }

  get queryInterface(): QueryInterface {
    return this._queryInterface!;
  }

  async sync(options?: { force?: boolean; alter?: boolean }): Promise<void> {
    for (const model of this.models.values()) {
      await model.sync(options);
    }
  }

  async drop(): Promise<void> {
    for (const model of this.models.values()) {
      await model.drop();
    }
  }

  async authenticate(): Promise<void> {
    try {
      await this.query('SELECT 1+1 AS result');
      console.log('Connection authenticated successfully');
    } catch (error) {
      console.error('Unable to connect to database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Close database connection
  }

  async query(sql: string, options?: any): Promise<any> {
    const type = options?.type || QueryTypes.SELECT;
    const replacements = options?.replacements || [];

    // Execute query logic
    return [];
  }

  async transaction<T>(callback: (t: Transaction) => Promise<T>): Promise<T>;
  async transaction<T>(options: any, callback: (t: Transaction) => Promise<T>): Promise<T>;
  async transaction<T>(
    optionsOrCallback: any | ((t: Transaction) => Promise<T>),
    maybeCallback?: (t: Transaction) => Promise<T>
  ): Promise<T> {
    const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback!;
    const options = typeof optionsOrCallback === 'function' ? {} : optionsOrCallback;

    const transaction = new Transaction(this, options);

    try {
      await transaction.begin();
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  fn(functionName: string, ...args: any[]): any {
    return { type: 'fn', fn: functionName, args };
  }

  col(columnName: string): any {
    return { type: 'col', col: columnName };
  }

  literal(sql: string): any {
    return { type: 'literal', val: sql };
  }

  cast(value: any, type: string): any {
    return { type: 'cast', val: value, dataType: type };
  }

  where(attribute: any, comparator: any, value?: any): any {
    return { type: 'where', attribute, comparator, value };
  }

  getModels(): typeof Model[] {
    return Array.from(this.models.values());
  }

  getDialect(): string {
    return this.options.dialect;
  }

  getDatabaseName(): string {
    return this.options.database || '';
  }
}
