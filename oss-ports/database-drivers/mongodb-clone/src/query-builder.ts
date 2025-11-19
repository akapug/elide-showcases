/**
 * MongoDB Query Builder
 */

import * as types from './types';

export class QueryBuilder {
  private _filter: types.Filter = {};
  private _projection: types.Projection = {};
  private _sort: types.Sort = {};
  private _limit?: number;
  private _skip?: number;

  filter(conditions: types.Filter): this {
    this._filter = { ...this._filter, ...conditions };
    return this;
  }

  where(field: string, operator: string, value: any): this {
    switch (operator) {
      case '=':
      case '==':
        this._filter[field] = value;
        break;
      case '!=':
        this._filter[field] = { $ne: value };
        break;
      case '>':
        this._filter[field] = { $gt: value };
        break;
      case '>=':
        this._filter[field] = { $gte: value };
        break;
      case '<':
        this._filter[field] = { $lt: value };
        break;
      case '<=':
        this._filter[field] = { $lte: value };
        break;
      case 'in':
        this._filter[field] = { $in: value };
        break;
      case 'nin':
        this._filter[field] = { $nin: value };
        break;
      case 'exists':
        this._filter[field] = { $exists: value };
        break;
      case 'regex':
        this._filter[field] = { $regex: value };
        break;
    }
    return this;
  }

  equals(field: string, value: any): this {
    return this.where(field, '=', value);
  }

  notEquals(field: string, value: any): this {
    return this.where(field, '!=', value);
  }

  greaterThan(field: string, value: any): this {
    return this.where(field, '>', value);
  }

  greaterThanOrEqual(field: string, value: any): this {
    return this.where(field, '>=', value);
  }

  lessThan(field: string, value: any): this {
    return this.where(field, '<', value);
  }

  lessThanOrEqual(field: string, value: any): this {
    return this.where(field, '<=', value);
  }

  in(field: string, values: any[]): this {
    return this.where(field, 'in', values);
  }

  notIn(field: string, values: any[]): this {
    return this.where(field, 'nin', values);
  }

  exists(field: string, value: boolean = true): this {
    return this.where(field, 'exists', value);
  }

  regex(field: string, pattern: string | RegExp, options?: string): this {
    if (typeof pattern === 'string') {
      return this.where(field, 'regex', options ? { $regex: pattern, $options: options } : pattern);
    }
    return this.where(field, 'regex', pattern);
  }

  between(field: string, min: any, max: any): this {
    this._filter[field] = { $gte: min, $lte: max };
    return this;
  }

  select(...fields: string[]): this;
  select(projection: types.Projection): this;
  select(...args: any[]): this {
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      this._projection = args[0];
    } else {
      for (const field of args) {
        this._projection[field] = 1;
      }
    }
    return this;
  }

  exclude(...fields: string[]): this {
    for (const field of fields) {
      this._projection[field] = 0;
    }
    return this;
  }

  sort(field: string, direction: 1 | -1 = 1): this;
  sort(sortSpec: types.Sort): this;
  sort(fieldOrSpec: string | types.Sort, direction?: 1 | -1): this {
    if (typeof fieldOrSpec === 'string') {
      this._sort[fieldOrSpec] = direction || 1;
    } else {
      this._sort = { ...this._sort, ...fieldOrSpec };
    }
    return this;
  }

  ascending(...fields: string[]): this {
    for (const field of fields) {
      this._sort[field] = 1;
    }
    return this;
  }

  descending(...fields: string[]): this {
    for (const field of fields) {
      this._sort[field] = -1;
    }
    return this;
  }

  limit(value: number): this {
    this._limit = value;
    return this;
  }

  skip(value: number): this {
    this._skip = value;
    return this;
  }

  offset(value: number): this {
    return this.skip(value);
  }

  page(pageNumber: number, pageSize: number): this {
    this._skip = (pageNumber - 1) * pageSize;
    this._limit = pageSize;
    return this;
  }

  build(): { filter: types.Filter; options: types.FindOptions } {
    const options: types.FindOptions = {};

    if (Object.keys(this._projection).length > 0) {
      options.projection = this._projection;
    }

    if (Object.keys(this._sort).length > 0) {
      options.sort = this._sort;
    }

    if (this._limit !== undefined) {
      options.limit = this._limit;
    }

    if (this._skip !== undefined) {
      options.skip = this._skip;
    }

    return {
      filter: this._filter,
      options
    };
  }

  getFilter(): types.Filter {
    return this._filter;
  }

  getOptions(): types.FindOptions {
    return this.build().options;
  }

  clone(): QueryBuilder {
    const builder = new QueryBuilder();
    builder._filter = { ...this._filter };
    builder._projection = { ...this._projection };
    builder._sort = { ...this._sort };
    builder._limit = this._limit;
    builder._skip = this._skip;
    return builder;
  }

  clear(): this {
    this._filter = {};
    this._projection = {};
    this._sort = {};
    this._limit = undefined;
    this._skip = undefined;
    return this;
  }
}
