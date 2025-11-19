# Winston Clone - Elide Implementation

A production-ready logging library ported to Elide, inspired by Winston's flexible logging system.

## Features

- **Multiple Transports**: Console, File, HTTP, Stream, and custom transports
- **Log Levels**: Configurable log levels with npm, syslog, and custom schemas
- **Formatting**: JSON, simple, colorize, timestamp, and custom formatters
- **Metadata**: Rich metadata support for structured logging
- **Child Loggers**: Create child loggers with inherited configuration
- **Error Handling**: Robust error handling and uncaught exception logging
- **Profiling**: Built-in profiling for performance measurement
- **Query**: Query log files for specific entries
- **TypeScript**: Full TypeScript support with type definitions

## Installation

```bash
npm install @elide/winston-clone
```

## Quick Start

```typescript
import { createLogger, format, transports } from '@elide/winston-clone';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' }),
  ],
});

logger.info('Hello world!');
logger.error('An error occurred', { userId: 123 });
```

## Log Levels

### Default Levels (npm)

```typescript
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');
```

### Syslog Levels

```typescript
import { createLogger, config } from '@elide/winston-clone';

const logger = createLogger({
  levels: config.syslog.levels,
  transports: [new transports.Console()],
});

logger.emerg('Emergency!');
logger.alert('Alert!');
logger.crit('Critical!');
logger.error('Error!');
logger.warning('Warning!');
logger.notice('Notice');
logger.info('Info');
logger.debug('Debug');
```

### Custom Levels

```typescript
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    trace: 4,
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    trace: 'blue',
  },
};

const logger = createLogger({
  levels: customLevels.levels,
  transports: [new transports.Console()],
});

logger.fatal('Fatal error!');
logger.trace('Trace message');
```

## Transports

### Console Transport

```typescript
new transports.Console({
  level: 'debug',
  format: format.combine(
    format.colorize(),
    format.simple()
  ),
  handleExceptions: true,
  handleRejections: true,
});
```

### File Transport

```typescript
new transports.File({
  filename: 'application.log',
  level: 'info',
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  tailable: true,
  format: format.json(),
});

// Separate error log
new transports.File({
  filename: 'errors.log',
  level: 'error',
});

// Daily rotate files
new transports.DailyRotateFile({
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
});
```

### HTTP Transport

```typescript
new transports.Http({
  host: 'localhost',
  port: 8080,
  path: '/logs',
  ssl: false,
  auth: {
    username: 'logger',
    password: 'secret',
  },
});
```

### Stream Transport

```typescript
import * as fs from 'fs';

const stream = fs.createWriteStream('output.log');

new transports.Stream({
  stream,
  format: format.json(),
});
```

## Formats

### Built-in Formats

```typescript
import { format } from '@elide/winston-clone';

// JSON format
format.json();

// Simple text format
format.simple();

// Timestamp
format.timestamp();
format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

// Colorize
format.colorize();
format.colorize({ all: true });

// Pretty print
format.prettyPrint();

// Align
format.align();

// Errors (stack traces)
format.errors({ stack: true });

// Metadata
format.metadata();

// Label
format.label({ label: 'my-service' });

// Padding
format.padLevels();

// MS (milliseconds since last log)
format.ms();
```

### Combining Formats

```typescript
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
});
```

### Custom Formats

```typescript
const customFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    customFormat
  ),
});
```

## Metadata

```typescript
// Object metadata
logger.info('User logged in', {
  userId: 123,
  username: 'john',
  ip: '192.168.1.1',
});

// Multiple metadata objects
logger.info('Transaction completed', {
  transactionId: 'tx-123',
  amount: 99.99,
}, {
  userId: 123,
});

// String interpolation
logger.info('User %s logged in from %s', 'john', '192.168.1.1');
```

## Child Loggers

```typescript
const parentLogger = createLogger({
  level: 'info',
  transports: [new transports.Console()],
});

// Create child with additional metadata
const childLogger = parentLogger.child({
  service: 'authentication',
  version: '1.0.0',
});

childLogger.info('User logged in', { userId: 123 });
// Output includes: { service: 'authentication', version: '1.0.0', userId: 123 }

// Multiple levels of children
const grandchildLogger = childLogger.child({
  component: 'oauth',
});
```

## Error Handling

### Exception Handling

```typescript
const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'exceptions.log',
      handleExceptions: true,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'exceptions.log' }),
  ],
});

// Uncaught exceptions will be logged
throw new Error('Uncaught exception!');
```

### Rejection Handling

```typescript
const logger = createLogger({
  transports: [new transports.Console()],
  rejectionHandlers: [
    new transports.File({ filename: 'rejections.log' }),
  ],
});

// Unhandled promise rejections will be logged
Promise.reject(new Error('Unhandled rejection!'));
```

### Transport Errors

```typescript
logger.on('error', (error) => {
  console.error('Logger error:', error);
});
```

## Profiling

```typescript
// Start profiling
logger.profile('database-query');

// Do work
await database.query('SELECT * FROM users');

// End profiling (logs duration)
logger.profile('database-query');
// Output: info: database-query duration=45ms

// With metadata
logger.profile('api-call', { endpoint: '/api/users' });
await fetch('/api/users');
logger.profile('api-call');
```

## Querying Logs

```typescript
const options = {
  from: new Date() - 24 * 60 * 60 * 1000, // Last 24 hours
  until: new Date(),
  limit: 100,
  start: 0,
  order: 'desc',
  fields: ['message', 'level', 'timestamp'],
};

logger.query(options, (err, results) => {
  if (err) {
    console.error('Query error:', err);
    return;
  }

  console.log('Query results:', results);
});

// Promise-based
const results = await logger.queryAsync(options);
```

## Filtering

```typescript
const logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format((info) => {
          // Filter out sensitive data
          if (info.password) {
            info.password = '***REDACTED***';
          }
          return info;
        })(),
        format.json()
      ),
    }),
  ],
});
```

## Stream Interface

```typescript
// Use logger as a stream
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Use with morgan (HTTP request logger)
app.use(morgan('combined', { stream }));
```

## Advanced Configuration

### Multiple Transports with Different Levels

```typescript
const logger = createLogger({
  level: 'debug',
  transports: [
    // All logs to file
    new transports.File({
      filename: 'combined.log',
      level: 'debug',
    }),

    // Only errors to error file
    new transports.File({
      filename: 'errors.log',
      level: 'error',
    }),

    // Info and above to console
    new transports.Console({
      level: 'info',
      format: format.colorize(),
    }),
  ],
});
```

### Conditional Logging

```typescript
const logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format((info) => {
          // Only log in development
          return process.env.NODE_ENV === 'development' ? info : false;
        })(),
        format.simple()
      ),
    }),
  ],
});
```

## Testing

```typescript
import { createLogger, transports } from '@elide/winston-clone';

describe('Logger', () => {
  let logs: any[] = [];

  const mockTransport = new transports.Stream({
    stream: {
      write: (message: string) => {
        logs.push(JSON.parse(message));
      },
    },
  });

  const logger = createLogger({
    transports: [mockTransport],
    format: format.json(),
  });

  beforeEach(() => {
    logs = [];
  });

  it('should log messages', () => {
    logger.info('Test message', { userId: 123 });

    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].userId).toBe(123);
  });
});
```

## Performance

- Async logging by default
- Buffered file writes
- Minimal overhead for disabled log levels
- Efficient JSON serialization
- No-op logger for production when needed

## Integration Examples

### Express.js

```typescript
import express from 'express';
import morgan from 'morgan';
import { createLogger, format, transports } from '@elide/winston-clone';

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' }),
  ],
});

const app = express();

// HTTP request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// Error logging
app.use((err, req, res, next) => {
  logger.error('Express error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).send('Internal Server Error');
});
```

### NestJS

```typescript
import { Logger } from '@elide/winston-clone';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Doing something');
    this.logger.error('Error occurred', stack);
  }
}
```

## License

MIT License - See LICENSE file for details

## Credits

Ported to Elide from the original Winston library. Original implementation by Charlie Robbins and contributors.

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.
