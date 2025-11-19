/**
 * Annotation Implementations
 */

import type { AnnotationOptions } from './types';

/**
 * Annotation class
 */
export class Annotation {
  public name: string;
  public datasource: string | null;
  public enable: boolean;
  public iconColor: string;
  public expr?: string;
  public query?: string;
  public tagKeys?: string;
  public textFormat?: string;
  public textColumn?: string;
  public titleColumn?: string;
  public tagsColumn?: string;
  public showIn?: number;
  public builtIn?: number;

  constructor(options: AnnotationOptions) {
    this.name = options.name;
    this.datasource = options.datasource;
    this.enable = options.enable !== false;
    this.iconColor = options.iconColor || 'rgba(0, 211, 255, 1)';

    // Prometheus-specific
    if (options.expr) {
      this.expr = options.expr;
      this.tagKeys = options.tagKeys;
      this.textFormat = options.textFormat;
    }

    // SQL-specific
    if (options.query) {
      this.query = options.query;
      this.textColumn = options.textColumn;
      this.titleColumn = options.titleColumn;
      this.tagsColumn = options.tagsColumn;
    }

    this.showIn = options.showIn || 0;
    this.builtIn = options.builtIn || 0;
  }

  /**
   * Convert annotation to JSON
   */
  toJSON(): any {
    const json: any = {
      name: this.name,
      datasource: this.datasource,
      enable: this.enable,
      iconColor: this.iconColor,
      showIn: this.showIn,
      builtIn: this.builtIn,
    };

    if (this.expr) {
      json.expr = this.expr;
      json.tagKeys = this.tagKeys;
      json.textFormat = this.textFormat;
    }

    if (this.query) {
      json.query = this.query;
      json.textColumn = this.textColumn;
      json.titleColumn = this.titleColumn;
      json.tagsColumn = this.tagsColumn;
    }

    return json;
  }
}

/**
 * Create a Prometheus annotation
 */
export function createPrometheusAnnotation(options: {
  name: string;
  expr: string;
  tagKeys?: string;
  textFormat?: string;
  iconColor?: string;
}): Annotation {
  return new Annotation({
    name: options.name,
    datasource: 'Prometheus',
    expr: options.expr,
    tagKeys: options.tagKeys,
    textFormat: options.textFormat,
    iconColor: options.iconColor,
  });
}

/**
 * Create a SQL annotation
 */
export function createSQLAnnotation(options: {
  name: string;
  datasource: string;
  query: string;
  textColumn?: string;
  titleColumn?: string;
  tagsColumn?: string;
  iconColor?: string;
}): Annotation {
  return new Annotation({
    name: options.name,
    datasource: options.datasource,
    query: options.query,
    textColumn: options.textColumn,
    titleColumn: options.titleColumn,
    tagsColumn: options.tagsColumn,
    iconColor: options.iconColor,
  });
}
