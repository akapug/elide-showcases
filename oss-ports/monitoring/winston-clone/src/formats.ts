/**
 * Winston Formats
 */

import type { Format, FormatWrap, LogEntry } from './types';

/**
 * Create a format
 */
function createFormat(transformFn: (info: LogEntry, opts?: any) => LogEntry | false): FormatWrap {
  return (opts?: any): Format => ({
    transform: (info: LogEntry) => transformFn(info, opts),
  });
}

/**
 * Combine multiple formats
 */
function combine(...formats: Format[]): Format {
  return {
    transform: (info: LogEntry) => {
      let current = info;

      for (const fmt of formats) {
        const result = fmt.transform(current);
        if (!result) {
          return false;
        }
        current = result;
      }

      return current;
    },
  };
}

/**
 * JSON format
 */
const json = createFormat((info) => {
  return info;
});

/**
 * Simple format
 */
const simple = createFormat((info) => {
  const { level, message, ...meta } = info;
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return {
    ...info,
    message: `${level}: ${message}${metaStr}`,
  };
});

/**
 * Timestamp format
 */
const timestamp = createFormat((info, opts) => {
  const format = opts?.format || 'ISO';
  const now = new Date();

  let timestampStr: string;

  if (format === 'ISO') {
    timestampStr = now.toISOString();
  } else if (typeof format === 'function') {
    timestampStr = format();
  } else {
    timestampStr = now.toISOString(); // Simplified, would use date-fns or similar
  }

  return {
    ...info,
    timestamp: timestampStr,
  };
});

/**
 * Colorize format
 */
const colorize = createFormat((info, opts) => {
  const colors: Record<string, string> = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    debug: '\x1b[32m',
    verbose: '\x1b[35m',
    reset: '\x1b[0m',
  };

  const colorAll = opts?.all || false;

  if (colorAll) {
    const color = colors[info.level] || '';
    const reset = colors.reset;
    return {
      ...info,
      message: `${color}${info.level}: ${info.message}${reset}`,
    };
  } else {
    const color = colors[info.level] || '';
    const reset = colors.reset;
    return {
      ...info,
      level: `${color}${info.level}${reset}`,
    };
  }
});

/**
 * Pretty print format
 */
const prettyPrint = createFormat((info, opts) => {
  const depth = opts?.depth || 2;
  return {
    ...info,
    message: JSON.stringify(info, null, 2),
  };
});

/**
 * Align format
 */
const align = createFormat((info) => {
  const padding = ' '.repeat(15 - info.level.length);
  return {
    ...info,
    level: info.level + padding,
  };
});

/**
 * Errors format
 */
const errors = createFormat((info, opts) => {
  const stack = opts?.stack || false;

  if (info.error instanceof Error) {
    return {
      ...info,
      error: {
        message: info.error.message,
        stack: stack ? info.error.stack : undefined,
        ...info.error,
      },
    };
  }

  return info;
});

/**
 * Metadata format
 */
const metadata = createFormat((info, opts) => {
  const key = opts?.key || 'metadata';
  const { level, message, timestamp, ...meta } = info;

  return {
    level,
    message,
    timestamp,
    [key]: meta,
  };
});

/**
 * Label format
 */
const label = createFormat((info, opts) => {
  const labelText = opts?.label || 'default';

  return {
    ...info,
    label: labelText,
  };
});

/**
 * Pad levels format
 */
const padLevels = createFormat((info) => {
  const maxLength = 7; // 'verbose'.length
  const padding = ' '.repeat(Math.max(0, maxLength - info.level.length));

  return {
    ...info,
    level: info.level + padding,
  };
});

/**
 * MS format (time since last log)
 */
let lastTime = Date.now();

const ms = createFormat((info) => {
  const now = Date.now();
  const diff = now - lastTime;
  lastTime = now;

  return {
    ...info,
    ms: `+${diff}ms`,
  };
});

/**
 * Splat format (string interpolation)
 */
const splat = createFormat((info) => {
  if (typeof info.message === 'string' && Array.isArray(info.splat)) {
    let message = info.message;
    const args = info.splat;

    // Replace %s, %d, etc.
    message = message.replace(/%s|%d|%j/g, (match) => {
      const arg = args.shift();

      if (match === '%j') {
        return JSON.stringify(arg);
      }

      return String(arg);
    });

    return {
      ...info,
      message,
    };
  }

  return info;
});

/**
 * Printf format
 */
function printf(templateFn: (info: LogEntry) => string): Format {
  return {
    transform: (info: LogEntry) => {
      const message = templateFn(info);
      return {
        ...info,
        message,
      };
    },
  };
}

// Export all formats
export const format = {
  combine,
  json,
  simple,
  timestamp,
  colorize,
  prettyPrint,
  align,
  errors,
  metadata,
  label,
  padLevels,
  ms,
  splat,
  printf,
};
