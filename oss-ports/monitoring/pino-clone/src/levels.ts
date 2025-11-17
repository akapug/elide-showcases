/**
 * Pino Log Levels
 */

export const levels = {
  values: {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
  },
  labels: {
    '10': 'trace',
    '20': 'debug',
    '30': 'info',
    '40': 'warn',
    '50': 'error',
    '60': 'fatal',
  },
};

/**
 * Get level value by name
 */
export function getLevelValue(level: string | number): number {
  if (typeof level === 'number') {
    return level;
  }

  return levels.values[level as keyof typeof levels.values] || 30;
}

/**
 * Get level label by value
 */
export function getLevelLabel(level: number): string {
  return levels.labels[level.toString() as keyof typeof levels.labels] || 'unknown';
}

/**
 * Check if level is valid
 */
export function isValidLevel(level: string | number): boolean {
  if (typeof level === 'number') {
    return level in levels.labels;
  }

  return level in levels.values;
}
