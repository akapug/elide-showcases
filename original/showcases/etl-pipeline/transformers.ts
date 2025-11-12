/**
 * Data Transformation Functions
 *
 * Production-grade data transformations:
 * - Field mapping and renaming
 * - Type conversions
 * - Aggregations and grouping
 * - Joins and merges
 * - Window functions
 * - Pivoting and unpivoting
 * - Deduplication
 * - Enrichment
 */

export interface TransformConfig {
  name: string;
  type: string;
  params: Record<string, any>;
}

export interface TransformResult {
  data: any[];
  stats: {
    inputCount: number;
    outputCount: number;
    transformTime: number;
  };
}

// ==================== Base Transformer ====================

export abstract class BaseTransformer {
  abstract transform(data: any[], config: TransformConfig): any[];

  measureTransform(data: any[], config: TransformConfig): TransformResult {
    const startTime = Date.now();
    const result = this.transform(data, config);
    const transformTime = Date.now() - startTime;

    return {
      data: result,
      stats: {
        inputCount: data.length,
        outputCount: result.length,
        transformTime
      }
    };
  }
}

// ==================== Field Transformer ====================

export class FieldTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    switch (config.type) {
      case 'select':
        return this.selectFields(data, config.params.fields);
      case 'rename':
        return this.renameFields(data, config.params.mapping);
      case 'add':
        return this.addField(data, config.params.field, config.params.value);
      case 'remove':
        return this.removeFields(data, config.params.fields);
      case 'cast':
        return this.castFields(data, config.params.types);
      case 'flatten':
        return this.flattenNested(data, config.params.prefix);
      default:
        return data;
    }
  }

  private selectFields(data: any[], fields: string[]): any[] {
    return data.map(record => {
      const selected: any = {};
      fields.forEach(field => {
        if (field in record) {
          selected[field] = record[field];
        }
      });
      return selected;
    });
  }

  private renameFields(data: any[], mapping: Record<string, string>): any[] {
    return data.map(record => {
      const renamed: any = { ...record };

      for (const [oldName, newName] of Object.entries(mapping)) {
        if (oldName in renamed) {
          renamed[newName] = renamed[oldName];
          delete renamed[oldName];
        }
      }

      return renamed;
    });
  }

  private addField(data: any[], field: string, value: any): any[] {
    return data.map(record => ({
      ...record,
      [field]: typeof value === 'function' ? value(record) : value
    }));
  }

  private removeFields(data: any[], fields: string[]): any[] {
    return data.map(record => {
      const filtered: any = { ...record };
      fields.forEach(field => delete filtered[field]);
      return filtered;
    });
  }

  private castFields(data: any[], types: Record<string, string>): any[] {
    return data.map(record => {
      const casted: any = { ...record };

      for (const [field, type] of Object.entries(types)) {
        if (field in casted) {
          casted[field] = this.castValue(casted[field], type);
        }
      }

      return casted;
    });
  }

  private castValue(value: any, type: string): any {
    if (value === null || value === undefined) return null;

    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  private flattenNested(data: any[], prefix = ''): any[] {
    return data.map(record => this.flattenObject(record, prefix));
  }

  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }
}

// ==================== Filter Transformer ====================

export class FilterTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    const { field, operator, value, conditions } = config.params;

    if (conditions) {
      return this.filterComplex(data, conditions);
    }

    return this.filterSimple(data, field, operator, value);
  }

  private filterSimple(data: any[], field: string, operator: string, value: any): any[] {
    return data.filter(record => {
      const recordValue = this.getNestedValue(record, field);
      return this.evaluateCondition(recordValue, operator, value);
    });
  }

  private filterComplex(data: any[], conditions: any): any[] {
    return data.filter(record => this.evaluateComplexCondition(record, conditions));
  }

  private evaluateCondition(recordValue: any, operator: string, value: any): boolean {
    switch (operator) {
      case 'eq':
      case '==':
        return recordValue === value;
      case 'ne':
      case '!=':
        return recordValue !== value;
      case 'gt':
      case '>':
        return recordValue > value;
      case 'gte':
      case '>=':
        return recordValue >= value;
      case 'lt':
      case '<':
        return recordValue < value;
      case 'lte':
      case '<=':
        return recordValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(recordValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(recordValue);
      case 'contains':
        return String(recordValue).includes(String(value));
      case 'starts_with':
        return String(recordValue).startsWith(String(value));
      case 'ends_with':
        return String(recordValue).endsWith(String(value));
      case 'is_null':
        return recordValue === null || recordValue === undefined;
      case 'is_not_null':
        return recordValue !== null && recordValue !== undefined;
      case 'matches':
        return new RegExp(value).test(String(recordValue));
      default:
        return true;
    }
  }

  private evaluateComplexCondition(record: any, conditions: any): boolean {
    if (conditions.and) {
      return conditions.and.every((cond: any) => this.evaluateComplexCondition(record, cond));
    }

    if (conditions.or) {
      return conditions.or.some((cond: any) => this.evaluateComplexCondition(record, cond));
    }

    if (conditions.not) {
      return !this.evaluateComplexCondition(record, conditions.not);
    }

    const { field, operator, value } = conditions;
    const recordValue = this.getNestedValue(record, field);
    return this.evaluateCondition(recordValue, operator, value);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}

// ==================== Aggregation Transformer ====================

export class AggregationTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    const { groupBy, aggregations } = config.params;

    if (!groupBy || groupBy.length === 0) {
      return [this.aggregateAll(data, aggregations)];
    }

    return this.aggregateGrouped(data, groupBy, aggregations);
  }

  private aggregateGrouped(data: any[], groupBy: string[], aggregations: Record<string, string>): any[] {
    const groups = this.groupData(data, groupBy);
    const results: any[] = [];

    for (const [key, records] of groups.entries()) {
      const aggregated = this.aggregateRecords(records, aggregations);

      // Add group-by fields
      const groupKeys = key.split('|');
      groupBy.forEach((field, index) => {
        aggregated[field] = records[0][field];
      });

      results.push(aggregated);
    }

    return results;
  }

  private aggregateAll(data: any[], aggregations: Record<string, string>): any {
    return this.aggregateRecords(data, aggregations);
  }

  private groupData(data: any[], groupBy: string[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const record of data) {
      const key = groupBy.map(field => record[field]).join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(record);
    }

    return groups;
  }

  private aggregateRecords(records: any[], aggregations: Record<string, string>): any {
    const result: any = {};

    for (const [field, aggType] of Object.entries(aggregations)) {
      const values = records
        .map(r => r[field])
        .filter(v => v !== null && v !== undefined && !isNaN(v));

      switch (aggType) {
        case 'sum':
          result[`${field}_sum`] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
        case 'mean':
          result[`${field}_avg`] = values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : null;
          break;
        case 'min':
          result[`${field}_min`] = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          result[`${field}_max`] = values.length > 0 ? Math.max(...values) : null;
          break;
        case 'count':
          result[`${field}_count`] = values.length;
          break;
        case 'count_distinct':
          result[`${field}_count_distinct`] = new Set(values).size;
          break;
        case 'first':
          result[`${field}_first`] = records[0]?.[field];
          break;
        case 'last':
          result[`${field}_last`] = records[records.length - 1]?.[field];
          break;
        case 'median':
          result[`${field}_median`] = this.calculateMedian(values);
          break;
        case 'stddev':
          result[`${field}_stddev`] = this.calculateStdDev(values);
          break;
      }
    }

    result.count = records.length;
    return result;
  }

  private calculateMedian(values: number[]): number | null {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStdDev(values: number[]): number | null {
    if (values.length === 0) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }
}

// ==================== Join Transformer ====================

export class JoinTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    const { rightData, leftKey, rightKey, joinType = 'inner' } = config.params;

    switch (joinType) {
      case 'inner':
        return this.innerJoin(data, rightData, leftKey, rightKey);
      case 'left':
        return this.leftJoin(data, rightData, leftKey, rightKey);
      case 'right':
        return this.rightJoin(data, rightData, leftKey, rightKey);
      case 'full':
        return this.fullJoin(data, rightData, leftKey, rightKey);
      default:
        return data;
    }
  }

  private innerJoin(left: any[], right: any[], leftKey: string, rightKey: string): any[] {
    const result: any[] = [];
    const rightIndex = this.buildIndex(right, rightKey);

    for (const leftRecord of left) {
      const key = leftRecord[leftKey];
      const rightRecords = rightIndex.get(key) || [];

      for (const rightRecord of rightRecords) {
        result.push({ ...leftRecord, ...rightRecord });
      }
    }

    return result;
  }

  private leftJoin(left: any[], right: any[], leftKey: string, rightKey: string): any[] {
    const result: any[] = [];
    const rightIndex = this.buildIndex(right, rightKey);

    for (const leftRecord of left) {
      const key = leftRecord[leftKey];
      const rightRecords = rightIndex.get(key) || [{}];

      for (const rightRecord of rightRecords) {
        result.push({ ...leftRecord, ...rightRecord });
      }
    }

    return result;
  }

  private rightJoin(left: any[], right: any[], leftKey: string, rightKey: string): any[] {
    const result: any[] = [];
    const leftIndex = this.buildIndex(left, leftKey);

    for (const rightRecord of right) {
      const key = rightRecord[rightKey];
      const leftRecords = leftIndex.get(key) || [{}];

      for (const leftRecord of leftRecords) {
        result.push({ ...leftRecord, ...rightRecord });
      }
    }

    return result;
  }

  private fullJoin(left: any[], right: any[], leftKey: string, rightKey: string): any[] {
    const leftResult = this.leftJoin(left, right, leftKey, rightKey);
    const rightResult = this.rightJoin(left, right, leftKey, rightKey);

    // Remove duplicates from right join
    const leftKeys = new Set(left.map(r => r[leftKey]));
    const uniqueRight = rightResult.filter(r => !leftKeys.has(r[rightKey]));

    return [...leftResult, ...uniqueRight];
  }

  private buildIndex(data: any[], key: string): Map<any, any[]> {
    const index = new Map<any, any[]>();

    for (const record of data) {
      const keyValue = record[key];

      if (!index.has(keyValue)) {
        index.set(keyValue, []);
      }

      index.get(keyValue)!.push(record);
    }

    return index;
  }
}

// ==================== Window Functions ====================

export class WindowTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    const { partitionBy, orderBy, windowFunction, field, outputField } = config.params;

    // Partition data
    const partitions = partitionBy
      ? this.partitionData(data, partitionBy)
      : new Map([['all', data]]);

    const result: any[] = [];

    for (const [, partition] of partitions) {
      // Sort partition
      const sorted = orderBy ? this.sortData(partition, orderBy) : partition;

      // Apply window function
      const transformed = this.applyWindowFunction(sorted, windowFunction, field, outputField);
      result.push(...transformed);
    }

    return result;
  }

  private partitionData(data: any[], partitionBy: string[]): Map<string, any[]> {
    const partitions = new Map<string, any[]>();

    for (const record of data) {
      const key = partitionBy.map(field => record[field]).join('|');

      if (!partitions.has(key)) {
        partitions.set(key, []);
      }

      partitions.get(key)!.push(record);
    }

    return partitions;
  }

  private sortData(data: any[], orderBy: { field: string; direction: 'asc' | 'desc' }[]): any[] {
    return [...data].sort((a, b) => {
      for (const { field, direction } of orderBy) {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }

  private applyWindowFunction(data: any[], windowFunction: string, field: string, outputField: string): any[] {
    switch (windowFunction) {
      case 'row_number':
        return data.map((record, index) => ({ ...record, [outputField]: index + 1 }));

      case 'rank':
        return this.applyRank(data, field, outputField);

      case 'dense_rank':
        return this.applyDenseRank(data, field, outputField);

      case 'lag':
        return this.applyLag(data, field, outputField, 1);

      case 'lead':
        return this.applyLead(data, field, outputField, 1);

      case 'cumsum':
        return this.applyCumulativeSum(data, field, outputField);

      case 'moving_avg':
        return this.applyMovingAverage(data, field, outputField, 3);

      default:
        return data;
    }
  }

  private applyRank(data: any[], field: string, outputField: string): any[] {
    let currentRank = 1;
    let previousValue: any = null;
    let sameRankCount = 0;

    return data.map((record, index) => {
      const value = record[field];

      if (index === 0 || value !== previousValue) {
        currentRank += sameRankCount;
        sameRankCount = 1;
      } else {
        sameRankCount++;
      }

      previousValue = value;

      return { ...record, [outputField]: currentRank };
    });
  }

  private applyDenseRank(data: any[], field: string, outputField: string): any[] {
    let currentRank = 1;
    let previousValue: any = null;

    return data.map((record, index) => {
      const value = record[field];

      if (index > 0 && value !== previousValue) {
        currentRank++;
      }

      previousValue = value;

      return { ...record, [outputField]: currentRank };
    });
  }

  private applyLag(data: any[], field: string, outputField: string, offset: number): any[] {
    return data.map((record, index) => {
      const lagValue = index >= offset ? data[index - offset][field] : null;
      return { ...record, [outputField]: lagValue };
    });
  }

  private applyLead(data: any[], field: string, outputField: string, offset: number): any[] {
    return data.map((record, index) => {
      const leadValue = index + offset < data.length ? data[index + offset][field] : null;
      return { ...record, [outputField]: leadValue };
    });
  }

  private applyCumulativeSum(data: any[], field: string, outputField: string): any[] {
    let sum = 0;

    return data.map(record => {
      sum += Number(record[field]) || 0;
      return { ...record, [outputField]: sum };
    });
  }

  private applyMovingAverage(data: any[], field: string, outputField: string, window: number): any[] {
    return data.map((record, index) => {
      const start = Math.max(0, index - window + 1);
      const values = data.slice(start, index + 1).map(r => Number(r[field]) || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      return { ...record, [outputField]: avg };
    });
  }
}

// ==================== Deduplication Transformer ====================

export class DeduplicationTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    const { keys, keepFirst = true } = config.params;

    if (!keys || keys.length === 0) {
      // Remove exact duplicates
      return this.deduplicateExact(data);
    }

    return this.deduplicateByKeys(data, keys, keepFirst);
  }

  private deduplicateExact(data: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const record of data) {
      const key = JSON.stringify(record);

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(record);
      }
    }

    return unique;
  }

  private deduplicateByKeys(data: any[], keys: string[], keepFirst: boolean): any[] {
    const seen = new Map<string, any>();

    for (const record of data) {
      const key = keys.map(k => record[k]).join('|');

      if (!seen.has(key)) {
        seen.set(key, record);
      } else if (!keepFirst) {
        seen.set(key, record);
      }
    }

    return Array.from(seen.values());
  }
}

// ==================== Pivot Transformer ====================

export class PivotTransformer extends BaseTransformer {
  transform(data: any[], config: TransformConfig): any[] {
    const { index, columns, values, aggFunc = 'sum' } = config.params;

    const pivoted = new Map<string, any>();

    for (const record of data) {
      const indexKey = index.map((field: string) => record[field]).join('|');
      const columnValue = record[columns];

      if (!pivoted.has(indexKey)) {
        const baseRecord: any = {};
        index.forEach((field: string) => {
          baseRecord[field] = record[field];
        });
        pivoted.set(indexKey, baseRecord);
      }

      const pivotedRecord = pivoted.get(indexKey)!;
      const colName = `${columns}_${columnValue}`;

      if (!(colName in pivotedRecord)) {
        pivotedRecord[colName] = [];
      }

      pivotedRecord[colName].push(record[values]);
    }

    // Aggregate values
    const result: any[] = [];

    for (const [, record] of pivoted) {
      const aggregated: any = {};

      for (const [key, value] of Object.entries(record)) {
        if (Array.isArray(value)) {
          aggregated[key] = this.aggregate(value, aggFunc);
        } else {
          aggregated[key] = value;
        }
      }

      result.push(aggregated);
    }

    return result;
  }

  private aggregate(values: any[], aggFunc: string): any {
    const numbers = values.filter(v => typeof v === 'number');

    switch (aggFunc) {
      case 'sum':
        return numbers.reduce((a, b) => a + b, 0);
      case 'avg':
        return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
      case 'min':
        return numbers.length > 0 ? Math.min(...numbers) : null;
      case 'max':
        return numbers.length > 0 ? Math.max(...numbers) : null;
      case 'count':
        return numbers.length;
      default:
        return null;
    }
  }
}
