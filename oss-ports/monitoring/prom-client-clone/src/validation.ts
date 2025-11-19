/**
 * Validation utilities for Prometheus metrics
 */

import type { LabelValues } from './types';

/**
 * Validates metric name according to Prometheus naming conventions
 * Must match: [a-zA-Z_:][a-zA-Z0-9_:]*
 */
export function validateMetricName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const metricNameRegex = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
  return metricNameRegex.test(name);
}

/**
 * Validates label name according to Prometheus naming conventions
 * Must match: [a-zA-Z_][a-zA-Z0-9_]*
 * Cannot start with __
 */
export function validateLabelName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Reserved labels start with __
  if (name.startsWith('__')) {
    return false;
  }

  const labelNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return labelNameRegex.test(name);
}

/**
 * Validates label value
 */
export function validateLabelValue(value: string | number): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  // Numbers are always valid
  if (typeof value === 'number') {
    return !isNaN(value);
  }

  // Strings must not be empty
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates label values object
 */
export function validateLabels(
  labels: LabelValues,
  labelNames?: readonly string[]
): void {
  if (!labels || typeof labels !== 'object') {
    throw new Error('Labels must be an object');
  }

  const providedLabels = Object.keys(labels);

  // Validate label names
  for (const name of providedLabels) {
    if (!validateLabelName(name)) {
      throw new Error(`Invalid label name: ${name}`);
    }

    if (!validateLabelValue(labels[name]!)) {
      throw new Error(`Invalid label value for ${name}`);
    }
  }

  // If labelNames provided, ensure all are present
  if (labelNames && labelNames.length > 0) {
    const labelNamesSet = new Set(labelNames);
    const providedSet = new Set(providedLabels);

    // Check for unknown labels
    for (const label of providedLabels) {
      if (!labelNamesSet.has(label)) {
        throw new Error(
          `Unknown label: ${label}. Valid labels: ${labelNames.join(', ')}`
        );
      }
    }

    // Check for missing labels
    for (const label of labelNames) {
      if (!providedSet.has(label)) {
        throw new Error(
          `Missing label: ${label}. Required labels: ${labelNames.join(', ')}`
        );
      }
    }
  }
}

/**
 * Validates metric help text
 */
export function validateHelp(help: string): boolean {
  return typeof help === 'string' && help.length > 0;
}

/**
 * Validates metric configuration
 */
export function validateMetricConfiguration(config: {
  name: string;
  help: string;
  labelNames?: readonly string[];
}): void {
  if (!validateMetricName(config.name)) {
    throw new Error(
      `Invalid metric name: ${config.name}. ` +
        'Must match [a-zA-Z_:][a-zA-Z0-9_:]*'
    );
  }

  if (!validateHelp(config.help)) {
    throw new Error('Help text is required and must be a non-empty string');
  }

  if (config.labelNames) {
    for (const labelName of config.labelNames) {
      if (!validateLabelName(labelName)) {
        throw new Error(
          `Invalid label name: ${labelName}. ` +
            'Must match [a-zA-Z_][a-zA-Z0-9_]* and not start with __'
        );
      }
    }
  }
}

/**
 * Escapes label value for Prometheus format
 */
export function escapeLabelValue(value: string | number): string {
  const str = String(value);
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"');
}

/**
 * Formats labels for Prometheus exposition format
 */
export function formatLabels(labels: LabelValues): string {
  if (!labels || Object.keys(labels).length === 0) {
    return '';
  }

  const parts: string[] = [];
  for (const [key, value] of Object.entries(labels)) {
    if (value !== undefined && value !== null) {
      parts.push(`${key}="${escapeLabelValue(value)}"`);
    }
  }

  return parts.length > 0 ? `{${parts.join(',')}}` : '';
}

/**
 * Validates histogram buckets
 */
export function validateBuckets(buckets: number[]): void {
  if (!Array.isArray(buckets)) {
    throw new Error('Buckets must be an array');
  }

  if (buckets.length === 0) {
    throw new Error('Buckets array cannot be empty');
  }

  // Check for valid numbers
  for (const bucket of buckets) {
    if (typeof bucket !== 'number' || isNaN(bucket) || !isFinite(bucket)) {
      throw new Error(`Invalid bucket value: ${bucket}`);
    }
  }

  // Check for ascending order
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i] <= buckets[i - 1]) {
      throw new Error('Buckets must be in ascending order');
    }
  }

  // Ensure +Inf bucket
  if (buckets[buckets.length - 1] !== Infinity) {
    throw new Error('Last bucket must be +Inf');
  }
}

/**
 * Validates summary percentiles
 */
export function validatePercentiles(percentiles: number[]): void {
  if (!Array.isArray(percentiles)) {
    throw new Error('Percentiles must be an array');
  }

  for (const percentile of percentiles) {
    if (
      typeof percentile !== 'number' ||
      isNaN(percentile) ||
      percentile < 0 ||
      percentile > 1
    ) {
      throw new Error(
        `Invalid percentile: ${percentile}. Must be between 0 and 1`
      );
    }
  }
}

/**
 * Default histogram buckets
 */
export const DEFAULT_HISTOGRAM_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, Infinity,
];

/**
 * Default summary percentiles
 */
export const DEFAULT_SUMMARY_PERCENTILES = [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999];

/**
 * Default summary max age (10 minutes)
 */
export const DEFAULT_SUMMARY_MAX_AGE_SECONDS = 600;

/**
 * Default summary age buckets
 */
export const DEFAULT_SUMMARY_AGE_BUCKETS = 5;
