/**
 * Pandas Data Processor - Data Processing in TypeScript
 *
 * Demonstrates Elide polyglot by wrapping Python's pandas library
 * for powerful data manipulation and analysis in TypeScript.
 */

// @ts-ignore - Elide polyglot import: pandas for data processing
import pandas from 'python:pandas';

// @ts-ignore - Elide polyglot import: numpy for numerical operations
import numpy from 'python:numpy';

/**
 * Data processor configuration
 */
export interface ProcessorConfig {
  /** Index column */
  indexColumn?: string;

  /** Parse dates in these columns */
  parseDates?: string[];

  /** Convert data types */
  dtype?: Record<string, string>;

  /** Drop NA threshold (fraction of non-null values required) */
  naThreshold?: number;

  /** Fill NA strategy */
  fillNaStrategy?: 'mean' | 'median' | 'mode' | 'forward' | 'backward' | 'value';

  /** Fill NA value (when strategy is 'value') */
  fillNaValue?: any;
}

/**
 * Aggregation functions
 */
export type AggFunction = 'sum' | 'mean' | 'median' | 'min' | 'max' | 'std' | 'var' | 'count' | 'first' | 'last';

/**
 * Pandas Data Processor class
 */
export class PandasProcessor {
  private df: any;
  private config: ProcessorConfig;

  /**
   * Initialize processor with data
   */
  constructor(data: any[] | Record<string, any[]>, config: ProcessorConfig = {}) {
    this.config = config;

    // Create DataFrame
    const options: any = {};

    if (this.config.indexColumn) {
      options.index = this.config.indexColumn;
    }

    if (this.config.dtype) {
      options.dtype = this.config.dtype;
    }

    if (this.config.parseDates) {
      options.parse_dates = this.config.parseDates;
    }

    this.df = pandas.DataFrame(data, options);

    // Apply initial processing
    this.applyInitialProcessing();
  }

  /**
   * Create processor from CSV file
   */
  static fromCSV(filepath: string, config?: ProcessorConfig & {
    delimiter?: string;
    encoding?: string;
    skipRows?: number;
    header?: number | null;
  }): PandasProcessor {
    const options: any = {};

    if (config?.delimiter) {
      options.delimiter = config.delimiter;
    }

    if (config?.encoding) {
      options.encoding = config.encoding;
    }

    if (config?.skipRows) {
      options.skiprows = config.skipRows;
    }

    if (config?.header !== undefined) {
      options.header = config.header;
    }

    if (config?.parseDates) {
      options.parse_dates = config.parseDates;
    }

    const df = pandas.read_csv(filepath, options);
    const processor = Object.create(PandasProcessor.prototype);
    processor.df = df;
    processor.config = config || {};
    return processor;
  }

  /**
   * Create processor from JSON file
   */
  static fromJSON(filepath: string, config?: ProcessorConfig): PandasProcessor {
    const df = pandas.read_json(filepath);
    const processor = Object.create(PandasProcessor.prototype);
    processor.df = df;
    processor.config = config || {};
    return processor;
  }

  /**
   * Create processor from Excel file
   */
  static fromExcel(filepath: string, sheetName?: string, config?: ProcessorConfig): PandasProcessor {
    const options: any = {};

    if (sheetName) {
      options.sheet_name = sheetName;
    }

    const df = pandas.read_excel(filepath, options);
    const processor = Object.create(PandasProcessor.prototype);
    processor.df = df;
    processor.config = config || {};
    return processor;
  }

  /**
   * Apply initial processing based on config
   */
  private applyInitialProcessing(): void {
    // Auto-drop rows with too many NAs
    if (this.config.naThreshold) {
      this.df = this.df.dropna({ thresh: this.config.naThreshold });
    }

    // Auto-fill NAs
    if (this.config.fillNaStrategy) {
      this.fillNA();
    }
  }

  /**
   * Get DataFrame info
   */
  info(): {
    shape: [number, number];
    columns: string[];
    dtypes: Record<string, string>;
    memory: string;
  } {
    return {
      shape: [this.df.shape[0], this.df.shape[1]],
      columns: Array.from(this.df.columns),
      dtypes: Object.fromEntries(
        Array.from(this.df.dtypes.items()).map(([k, v]: [any, any]) => [k, String(v)])
      ),
      memory: this.df.memory_usage(deep: true).sum()
    };
  }

  /**
   * Get first N rows
   */
  head(n: number = 5): any[] {
    return this.df.head(n).to_dict('records');
  }

  /**
   * Get last N rows
   */
  tail(n: number = 5): any[] {
    return this.df.tail(n).to_dict('records');
  }

  /**
   * Get statistical summary
   */
  describe(): Record<string, any> {
    return this.df.describe().to_dict();
  }

  /**
   * Get column names
   */
  getColumns(): string[] {
    return Array.from(this.df.columns);
  }

  /**
   * Get number of rows
   */
  getRowCount(): number {
    return this.df.shape[0];
  }

  /**
   * Get number of columns
   */
  getColumnCount(): number {
    return this.df.shape[1];
  }

  /**
   * Select columns
   */
  select(columns: string[]): PandasProcessor {
    this.df = this.df[columns];
    return this;
  }

  /**
   * Drop columns
   */
  drop(columns: string[]): PandasProcessor {
    this.df = this.df.drop(columns, { axis: 1 });
    return this;
  }

  /**
   * Rename columns
   */
  rename(mapping: Record<string, string>): PandasProcessor {
    this.df = this.df.rename({ columns: mapping });
    return this;
  }

  /**
   * Filter rows
   */
  filter(conditions: Record<string, any> | ((row: any) => boolean)): PandasProcessor {
    if (typeof conditions === 'function') {
      // Function-based filtering
      this.df = this.df[this.df.apply(conditions, { axis: 1 })];
    } else {
      // Dictionary-based filtering
      let mask = pandas.Series([true] * this.df.shape[0]);

      for (const [column, value] of Object.entries(conditions)) {
        mask = mask & (this.df[column] === value);
      }

      this.df = this.df[mask];
    }

    return this;
  }

  /**
   * Filter rows using query string
   */
  query(queryString: string): PandasProcessor {
    this.df = this.df.query(queryString);
    return this;
  }

  /**
   * Sort data
   */
  sort(
    columns: string | string[],
    options?: {
      ascending?: boolean | boolean[];
      naPosition?: 'first' | 'last';
    }
  ): PandasProcessor {
    const sortOptions: any = {
      by: Array.isArray(columns) ? columns : [columns]
    };

    if (options?.ascending !== undefined) {
      sortOptions.ascending = options.ascending;
    }

    if (options?.naPosition) {
      sortOptions.na_position = options.naPosition;
    }

    this.df = this.df.sort_values(sortOptions);
    return this;
  }

  /**
   * Drop duplicate rows
   */
  dropDuplicates(columns?: string[], keepFirst: boolean = true): PandasProcessor {
    const options: any = {
      keep: keepFirst ? 'first' : 'last'
    };

    if (columns) {
      options.subset = columns;
    }

    this.df = this.df.drop_duplicates(options);
    return this;
  }

  /**
   * Drop rows with NA values
   */
  dropNA(columns?: string[], how: 'any' | 'all' = 'any'): PandasProcessor {
    const options: any = { how };

    if (columns) {
      options.subset = columns;
    }

    this.df = this.df.dropna(options);
    return this;
  }

  /**
   * Fill NA values
   */
  fillNA(value?: any, columns?: string[]): PandasProcessor {
    const strategy = this.config.fillNaStrategy;
    const fillValue = value || this.config.fillNaValue;

    if (columns) {
      for (const col of columns) {
        this.df[col] = this.fillColumn(col, strategy, fillValue);
      }
    } else {
      if (strategy === 'mean') {
        this.df = this.df.fillna(this.df.mean());
      } else if (strategy === 'median') {
        this.df = this.df.fillna(this.df.median());
      } else if (strategy === 'mode') {
        this.df = this.df.fillna(this.df.mode().iloc[0]);
      } else if (strategy === 'forward') {
        this.df = this.df.fillna({ method: 'ffill' });
      } else if (strategy === 'backward') {
        this.df = this.df.fillna({ method: 'bfill' });
      } else {
        this.df = this.df.fillna(fillValue !== undefined ? fillValue : 0);
      }
    }

    return this;
  }

  /**
   * Fill specific column
   */
  private fillColumn(column: string, strategy?: string, value?: any): any {
    if (strategy === 'mean') {
      return this.df[column].fillna(this.df[column].mean());
    } else if (strategy === 'median') {
      return this.df[column].fillna(this.df[column].median());
    } else if (strategy === 'mode') {
      return this.df[column].fillna(this.df[column].mode()[0]);
    } else if (strategy === 'forward') {
      return this.df[column].fillna({ method: 'ffill' });
    } else if (strategy === 'backward') {
      return this.df[column].fillna({ method: 'bfill' });
    } else {
      return this.df[column].fillna(value !== undefined ? value : 0);
    }
  }

  /**
   * Apply transformation to column
   */
  apply(column: string, func: (value: any) => any): PandasProcessor {
    this.df[column] = this.df[column].apply(func);
    return this;
  }

  /**
   * Apply transformation to entire row
   */
  applyRow(func: (row: any) => any): PandasProcessor {
    this.df = this.df.apply(func, { axis: 1 });
    return this;
  }

  /**
   * Convert column data types
   */
  convert(types: Record<string, 'int' | 'float' | 'string' | 'bool' | 'datetime'>): PandasProcessor {
    for (const [column, type] of Object.entries(types)) {
      switch (type) {
        case 'int':
          this.df[column] = pandas.to_numeric(this.df[column], { errors: 'coerce' }).astype('Int64');
          break;
        case 'float':
          this.df[column] = pandas.to_numeric(this.df[column], { errors: 'coerce' });
          break;
        case 'string':
          this.df[column] = this.df[column].astype(str);
          break;
        case 'bool':
          this.df[column] = this.df[column].astype(bool);
          break;
        case 'datetime':
          this.df[column] = pandas.to_datetime(this.df[column], { errors: 'coerce' });
          break;
      }
    }

    return this;
  }

  /**
   * Group by columns
   */
  groupBy(columns: string | string[]): GroupedData {
    const grouped = this.df.groupby(Array.isArray(columns) ? columns : [columns]);
    return new GroupedData(grouped);
  }

  /**
   * Aggregate data
   */
  aggregate(aggregations: Record<string, AggFunction | AggFunction[]>): Record<string, any> {
    const result = this.df.agg(aggregations);
    return result.to_dict();
  }

  /**
   * Join with another DataFrame
   */
  join(
    other: PandasProcessor,
    on?: string | string[],
    how: 'inner' | 'left' | 'right' | 'outer' = 'inner'
  ): PandasProcessor {
    const options: any = { how };

    if (on) {
      options.on = on;
    }

    this.df = this.df.merge(other.df, options);
    return this;
  }

  /**
   * Pivot table
   */
  pivot(
    index: string | string[],
    columns: string,
    values: string,
    aggFunc: AggFunction = 'mean'
  ): PandasProcessor {
    this.df = this.df.pivot_table({
      index,
      columns,
      values,
      aggfunc: aggFunc
    });
    return this;
  }

  /**
   * Melt (unpivot) DataFrame
   */
  melt(
    idVars: string[],
    valueVars?: string[],
    varName: string = 'variable',
    valueName: string = 'value'
  ): PandasProcessor {
    const options: any = {
      id_vars: idVars,
      var_name: varName,
      value_name: valueName
    };

    if (valueVars) {
      options.value_vars = valueVars;
    }

    this.df = this.df.melt(options);
    return this;
  }

  /**
   * Add calculated column
   */
  addColumn(name: string, values: any[] | ((row: any) => any)): PandasProcessor {
    if (Array.isArray(values)) {
      this.df[name] = values;
    } else {
      this.df[name] = this.df.apply(values, { axis: 1 });
    }

    return this;
  }

  /**
   * Get unique values in column
   */
  unique(column: string): any[] {
    return Array.from(this.df[column].unique());
  }

  /**
   * Get value counts for column
   */
  valueCounts(column: string, normalize: boolean = false): Record<string, number> {
    const counts = this.df[column].value_counts({ normalize });
    return Object.fromEntries(Array.from(counts.items()));
  }

  /**
   * Calculate correlation matrix
   */
  correlation(method: 'pearson' | 'kendall' | 'spearman' = 'pearson'): Record<string, Record<string, number>> {
    const corr = this.df.corr({ method });
    return corr.to_dict();
  }

  /**
   * Sample random rows
   */
  sample(n?: number, frac?: number, replace: boolean = false): PandasProcessor {
    const options: any = { replace };

    if (n !== undefined) {
      options.n = n;
    }

    if (frac !== undefined) {
      options.frac = frac;
    }

    this.df = this.df.sample(options);
    return this;
  }

  /**
   * Reset index
   */
  resetIndex(drop: boolean = false): PandasProcessor {
    this.df = this.df.reset_index({ drop });
    return this;
  }

  /**
   * Set index
   */
  setIndex(column: string | string[]): PandasProcessor {
    this.df = this.df.set_index(column);
    return this;
  }

  /**
   * Convert to array of objects
   */
  toArray(): any[] {
    return this.df.to_dict('records');
  }

  /**
   * Convert to dictionary
   */
  toDict(orient: 'dict' | 'list' | 'series' | 'split' | 'records' | 'index' = 'dict'): any {
    return this.df.to_dict(orient);
  }

  /**
   * Export to CSV
   */
  toCSV(filepath: string, options?: {
    index?: boolean;
    header?: boolean;
    sep?: string;
    encoding?: string;
  }): void {
    const exportOptions: any = {
      index: options?.index !== false,
      header: options?.header !== false
    };

    if (options?.sep) {
      exportOptions.sep = options.sep;
    }

    if (options?.encoding) {
      exportOptions.encoding = options.encoding;
    }

    this.df.to_csv(filepath, exportOptions);
  }

  /**
   * Export to JSON
   */
  toJSON(filepath: string, orient: 'records' | 'index' | 'columns' = 'records'): void {
    this.df.to_json(filepath, { orient });
  }

  /**
   * Export to Excel
   */
  toExcel(filepath: string, sheetName: string = 'Sheet1', index: boolean = false): void {
    this.df.to_excel(filepath, { sheet_name: sheetName, index });
  }

  /**
   * Export to HTML
   */
  toHTML(filepath: string, index: boolean = false): void {
    this.df.to_html(filepath, { index });
  }

  /**
   * Get raw pandas DataFrame
   */
  getRaw(): any {
    return this.df;
  }

  /**
   * Clone processor
   */
  clone(): PandasProcessor {
    const cloned = Object.create(PandasProcessor.prototype);
    cloned.df = this.df.copy();
    cloned.config = { ...this.config };
    return cloned;
  }
}

/**
 * Grouped data class for group operations
 */
export class GroupedData {
  private grouped: any;

  constructor(grouped: any) {
    this.grouped = grouped;
  }

  /**
   * Aggregate grouped data
   */
  aggregate(aggregations: Record<string, AggFunction | AggFunction[]>): Record<string, any> {
    const result = this.grouped.agg(aggregations);
    return result.to_dict();
  }

  /**
   * Sum grouped data
   */
  sum(): Record<string, any> {
    return this.grouped.sum().to_dict();
  }

  /**
   * Mean of grouped data
   */
  mean(): Record<string, any> {
    return this.grouped.mean().to_dict();
  }

  /**
   * Count grouped data
   */
  count(): Record<string, any> {
    return this.grouped.count().to_dict();
  }

  /**
   * Min of grouped data
   */
  min(): Record<string, any> {
    return this.grouped.min().to_dict();
  }

  /**
   * Max of grouped data
   */
  max(): Record<string, any> {
    return this.grouped.max().to_dict();
  }

  /**
   * First value in each group
   */
  first(): Record<string, any> {
    return this.grouped.first().to_dict();
  }

  /**
   * Last value in each group
   */
  last(): Record<string, any> {
    return this.grouped.last().to_dict();
  }
}

/**
 * Data analysis utilities
 */
export class DataAnalyzer {
  /**
   * Detect outliers using IQR method
   */
  static detectOutliers(data: number[], threshold: number = 1.5): number[] {
    const series = pandas.Series(data);
    const q1 = series.quantile(0.25);
    const q3 = series.quantile(0.75);
    const iqr = q3 - q1;

    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;

    return Array.from(series[(series < lowerBound) | (series > upperBound)]);
  }

  /**
   * Calculate moving average
   */
  static movingAverage(data: number[], window: number): number[] {
    const series = pandas.Series(data);
    const ma = series.rolling({ window }).mean();
    return Array.from(ma);
  }

  /**
   * Normalize data (min-max scaling)
   */
  static normalize(data: number[]): number[] {
    const series = pandas.Series(data);
    const min = series.min();
    const max = series.max();
    const normalized = (series - min) / (max - min);
    return Array.from(normalized);
  }

  /**
   * Standardize data (z-score)
   */
  static standardize(data: number[]): number[] {
    const series = pandas.Series(data);
    const mean = series.mean();
    const std = series.std();
    const standardized = (series - mean) / std;
    return Array.from(standardized);
  }
}

/**
 * Factory function
 */
export function createProcessor(data: any[] | Record<string, any[]>, config?: ProcessorConfig): PandasProcessor {
  return new PandasProcessor(data, config);
}

export default PandasProcessor;
