/**
 * Target Implementations
 */

import type {
  Target,
  PrometheusTarget,
  InfluxDBTarget,
  ElasticsearchTarget,
} from './types';

/**
 * Create a Prometheus target
 */
export function createPrometheusTarget(
  expr: string,
  options: Partial<PrometheusTarget> = {}
): PrometheusTarget {
  return {
    refId: options.refId || 'A',
    expr,
    legendFormat: options.legendFormat || '',
    interval: options.interval || '',
    format: options.format || 'time_series',
    instant: options.instant || false,
    exemplar: options.exemplar !== false,
    datasource: options.datasource || null,
    hide: options.hide || false,
  };
}

/**
 * Create an InfluxDB target
 */
export function createInfluxDBTarget(
  options: Partial<InfluxDBTarget> = {}
): InfluxDBTarget {
  return {
    refId: options.refId || 'A',
    measurement: options.measurement || '',
    policy: options.policy || 'default',
    tags: options.tags || [],
    groupBy: options.groupBy || [{ type: 'time', params: ['$__interval'] }],
    select: options.select || [[{ type: 'field', params: ['value'] }]],
    rawQuery: options.rawQuery || false,
    query: options.query || '',
    datasource: options.datasource || null,
    hide: options.hide || false,
  };
}

/**
 * Create an Elasticsearch target
 */
export function createElasticsearchTarget(
  options: Partial<ElasticsearchTarget> = {}
): ElasticsearchTarget {
  return {
    refId: options.refId || 'A',
    query: options.query || '',
    alias: options.alias || '',
    metrics: options.metrics || [{ type: 'count', id: '1' }],
    bucketAggs: options.bucketAggs || [
      {
        type: 'date_histogram',
        id: '2',
        field: '@timestamp',
        settings: { interval: 'auto' },
      },
    ],
    timeField: options.timeField || '@timestamp',
    datasource: options.datasource || null,
    hide: options.hide || false,
  };
}
