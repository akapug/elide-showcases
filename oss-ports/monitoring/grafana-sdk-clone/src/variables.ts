/**
 * Template Variable Implementations
 */

import type {
  Variable,
  QueryVariableOptions,
  CustomVariableOptions,
  IntervalVariableOptions,
  DatasourceVariableOptions,
} from './types';

/**
 * Query Variable
 */
export class QueryVariable implements Variable {
  public name: string;
  public type: string = 'query';
  public label?: string;
  public query: string;
  public datasource: string | null;
  public refresh: number | string;
  public regex: string;
  public sort: number;
  public multi: boolean;
  public includeAll: boolean;
  public allValue?: string;
  public current?: any;
  public options?: any[];
  public hide?: number;
  public skipUrlSync?: boolean;

  constructor(options: QueryVariableOptions) {
    this.name = options.name;
    this.label = options.label;
    this.query = options.query;
    this.datasource = options.datasource;
    this.refresh = options.refresh || 'on_time_range_change';
    this.regex = options.regex || '';
    this.sort = options.sort || 0;
    this.multi = options.multi || false;
    this.includeAll = options.includeAll || false;
    this.allValue = options.allValue;
    this.current = options.current;
    this.options = options.options;
  }

  toJSON(): any {
    return {
      name: this.name,
      type: this.type,
      label: this.label,
      query: this.query,
      datasource: this.datasource,
      refresh: this.parseRefresh(this.refresh),
      regex: this.regex,
      sort: this.sort,
      multi: this.multi,
      includeAll: this.includeAll,
      allValue: this.allValue,
      current: this.current,
      options: this.options,
      hide: this.hide,
      skipUrlSync: this.skipUrlSync,
    };
  }

  private parseRefresh(refresh: number | string): number {
    if (typeof refresh === 'number') return refresh;
    const refreshMap: Record<string, number> = {
      never: 0,
      on_dashboard_load: 1,
      on_time_range_change: 2,
    };
    return refreshMap[refresh] || 0;
  }
}

/**
 * Custom Variable
 */
export class CustomVariable implements Variable {
  public name: string;
  public type: string = 'custom';
  public label?: string;
  public query: string;
  public multi: boolean;
  public includeAll: boolean;
  public allValue?: string;
  public current?: any;
  public options?: any[];
  public hide?: number;
  public skipUrlSync?: boolean;

  constructor(options: CustomVariableOptions) {
    this.name = options.name;
    this.label = options.label;
    this.query = options.query;
    this.multi = options.multi || false;
    this.includeAll = options.includeAll || false;
    this.allValue = options.allValue;
    this.current = options.current;
    this.options = options.options;
  }

  toJSON(): any {
    return {
      name: this.name,
      type: this.type,
      label: this.label,
      query: this.query,
      multi: this.multi,
      includeAll: this.includeAll,
      allValue: this.allValue,
      current: this.current,
      options: this.options,
      hide: this.hide,
      skipUrlSync: this.skipUrlSync,
    };
  }
}

/**
 * Interval Variable
 */
export class IntervalVariable implements Variable {
  public name: string;
  public type: string = 'interval';
  public label?: string;
  public values: string[];
  public auto: boolean;
  public autoCount?: number;
  public autoMin?: string;
  public current?: any;
  public hide?: number;
  public skipUrlSync?: boolean;

  constructor(options: IntervalVariableOptions) {
    this.name = options.name;
    this.label = options.label;
    this.values = options.values;
    this.auto = options.auto || false;
    this.autoCount = options.autoCount;
    this.autoMin = options.autoMin;
    this.current = options.current;
  }

  toJSON(): any {
    return {
      name: this.name,
      type: this.type,
      label: this.label,
      query: this.values.join(','),
      auto: this.auto,
      auto_count: this.autoCount,
      auto_min: this.autoMin,
      current: this.current,
      hide: this.hide,
      skipUrlSync: this.skipUrlSync,
    };
  }
}

/**
 * Datasource Variable
 */
export class DatasourceVariable implements Variable {
  public name: string;
  public type: string = 'datasource';
  public label?: string;
  public datasourceType: string;
  public regex: string;
  public current?: any;
  public hide?: number;
  public skipUrlSync?: boolean;

  constructor(options: DatasourceVariableOptions) {
    this.name = options.name;
    this.label = options.label;
    this.datasourceType = options.type;
    this.regex = options.regex || '';
    this.current = options.current;
  }

  toJSON(): any {
    return {
      name: this.name,
      type: this.type,
      label: this.label,
      query: this.datasourceType,
      regex: this.regex,
      current: this.current,
      hide: this.hide,
      skipUrlSync: this.skipUrlSync,
    };
  }
}
