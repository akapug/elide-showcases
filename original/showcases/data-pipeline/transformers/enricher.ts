/**
 * Data Enricher Transformer
 *
 * Enriches data with additional fields, lookups, and computed values.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { PipelineContext } from '../orchestrator/pipeline';

// Enricher configuration
export interface EnricherConfig {
  usePythonNormalizer?: boolean;
  pythonConfig?: Record<string, any>;
  computedFields?: Record<string, ComputedField>;
  lookups?: LookupConfig[];
  aggregations?: AggregationConfig[];
}

// Computed field definition
export interface ComputedField {
  type: 'concat' | 'arithmetic' | 'date' | 'custom';
  expression: string;
  fields?: string[];
  function?: (record: any) => any;
}

// Lookup configuration
export interface LookupConfig {
  targetField: string;
  lookupField: string;
  lookupTable: Record<string, any>;
  defaultValue?: any;
}

// Aggregation configuration
export interface AggregationConfig {
  groupBy: string[];
  aggregates: {
    field: string;
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
    outputField: string;
  }[];
}

/**
 * Data Enricher
 */
export class DataEnricher {
  /**
   * Transform and enrich data
   */
  async transform(
    data: any[],
    config: EnricherConfig,
    context: PipelineContext
  ): Promise<any[]> {
    console.log(`[${context.runId}] Enriching ${data.length} records`);

    let enrichedData = [...data];

    // Use Python normalizer if configured
    if (config.usePythonNormalizer) {
      enrichedData = await this.applyPythonNormalizer(enrichedData, config.pythonConfig || {}, context);
    }

    // Add computed fields
    if (config.computedFields) {
      enrichedData = this.addComputedFields(enrichedData, config.computedFields);
    }

    // Apply lookups
    if (config.lookups) {
      enrichedData = this.applyLookups(enrichedData, config.lookups);
    }

    // Apply aggregations
    if (config.aggregations) {
      for (const aggConfig of config.aggregations) {
        enrichedData = this.applyAggregation(enrichedData, aggConfig);
      }
    }

    console.log(`[${context.runId}] Enrichment complete`);

    return enrichedData;
  }

  /**
   * Apply Python normalizer
   */
  private async applyPythonNormalizer(
    data: any[],
    config: Record<string, any>,
    context: PipelineContext
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'normalizer.py');

      const python = spawn('python3', [
        pythonScript,
        'normalize',
        JSON.stringify(config)
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python normalizer failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          console.log(`[${context.runId}] Python normalizer stats:`, result.stats);
          resolve(result.data);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });

      // Send data to Python script via stdin
      python.stdin.write(JSON.stringify(data));
      python.stdin.end();
    });
  }

  /**
   * Add computed fields to records
   */
  private addComputedFields(
    data: any[],
    computedFields: Record<string, ComputedField>
  ): any[] {
    return data.map(record => {
      const enriched = { ...record };

      for (const [fieldName, config] of Object.entries(computedFields)) {
        enriched[fieldName] = this.computeField(record, config);
      }

      return enriched;
    });
  }

  /**
   * Compute a field value
   */
  private computeField(record: any, config: ComputedField): any {
    switch (config.type) {
      case 'concat':
        return this.computeConcat(record, config);

      case 'arithmetic':
        return this.computeArithmetic(record, config);

      case 'date':
        return this.computeDate(record, config);

      case 'custom':
        return config.function ? config.function(record) : null;

      default:
        return null;
    }
  }

  /**
   * Compute concatenation
   */
  private computeConcat(record: any, config: ComputedField): string {
    const fields = config.fields || [];
    const values = fields.map(field => this.getFieldValue(record, field) || '');
    return config.expression
      .replace(/\{(\w+)\}/g, (_, field) => this.getFieldValue(record, field) || '');
  }

  /**
   * Compute arithmetic expression
   */
  private computeArithmetic(record: any, config: ComputedField): number {
    let expression = config.expression;

    // Replace field names with values
    const fields = config.fields || [];
    for (const field of fields) {
      const value = this.getFieldValue(record, field);
      if (typeof value === 'number') {
        expression = expression.replace(new RegExp(`\\b${field}\\b`, 'g'), String(value));
      }
    }

    // Evaluate expression (safe for simple arithmetic)
    try {
      // Only allow numbers and operators
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        return 0;
      }
      return eval(expression);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Compute date field
   */
  private computeDate(record: any, config: ComputedField): string {
    if (config.expression === 'now') {
      return new Date().toISOString();
    }

    if (config.expression === 'today') {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    }

    // Parse date from field
    if (config.fields && config.fields.length > 0) {
      const dateValue = this.getFieldValue(record, config.fields[0]);
      if (dateValue) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    return new Date().toISOString();
  }

  /**
   * Apply lookups to enrich data
   */
  private applyLookups(data: any[], lookups: LookupConfig[]): any[] {
    return data.map(record => {
      const enriched = { ...record };

      for (const lookup of lookups) {
        const lookupValue = this.getFieldValue(record, lookup.lookupField);

        if (lookupValue !== undefined && lookupValue !== null) {
          const lookedUpValue = lookup.lookupTable[lookupValue];
          enriched[lookup.targetField] = lookedUpValue !== undefined
            ? lookedUpValue
            : lookup.defaultValue;
        } else {
          enriched[lookup.targetField] = lookup.defaultValue;
        }
      }

      return enriched;
    });
  }

  /**
   * Apply aggregation
   */
  private applyAggregation(data: any[], config: AggregationConfig): any[] {
    // Group records
    const groups = new Map<string, any[]>();

    for (const record of data) {
      const groupKey = config.groupBy
        .map(field => this.getFieldValue(record, field))
        .join('|');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      groups.get(groupKey)!.push(record);
    }

    // Compute aggregates for each group
    const aggregated: any[] = [];

    for (const [groupKey, records] of groups) {
      const groupValues = config.groupBy.reduce((obj, field, index) => {
        obj[field] = groupKey.split('|')[index];
        return obj;
      }, {} as Record<string, any>);

      const aggregates = config.aggregates.reduce((obj, agg) => {
        obj[agg.outputField] = this.computeAggregate(records, agg.field, agg.operation);
        return obj;
      }, {} as Record<string, any>);

      aggregated.push({
        ...groupValues,
        ...aggregates,
        _recordCount: records.length
      });
    }

    return aggregated;
  }

  /**
   * Compute aggregate value
   */
  private computeAggregate(
    records: any[],
    field: string,
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): number {
    const values = records
      .map(r => this.getFieldValue(r, field))
      .filter(v => typeof v === 'number');

    switch (operation) {
      case 'sum':
        return values.reduce((sum, v) => sum + v, 0);

      case 'avg':
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

      case 'min':
        return values.length > 0 ? Math.min(...values) : 0;

      case 'max':
        return values.length > 0 ? Math.max(...values) : 0;

      case 'count':
        return records.length;

      default:
        return 0;
    }
  }

  /**
   * Get field value (supports nested fields with dot notation)
   */
  private getFieldValue(record: any, field: string): any {
    const parts = field.split('.');
    let value = record;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }
}

/**
 * Common enrichment configurations
 */
export const CommonEnrichments = {
  /**
   * Add full name from first and last name
   */
  fullName: {
    type: 'concat',
    expression: '{firstName} {lastName}',
    fields: ['firstName', 'lastName']
  } as ComputedField,

  /**
   * Add timestamp
   */
  timestamp: {
    type: 'date',
    expression: 'now'
  } as ComputedField,

  /**
   * Calculate total from price and quantity
   */
  total: {
    type: 'arithmetic',
    expression: 'price * quantity',
    fields: ['price', 'quantity']
  } as ComputedField,

  /**
   * Calculate discount amount
   */
  discountAmount: {
    type: 'arithmetic',
    expression: 'price * (discountPercent / 100)',
    fields: ['price', 'discountPercent']
  } as ComputedField,

  /**
   * Calculate age from birth date
   */
  age: {
    type: 'custom',
    function: (record: any) => {
      if (!record.birthDate) return null;
      const birth = new Date(record.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
  } as ComputedField
};
