# Pino Clone - Elide Implementation

A production-ready, extremely fast logging library ported to Elide, focused on performance and structured logging.

## Features

- **Extreme Performance**: Asynchronous logging with minimal overhead
- **Structured Logging**: JSON output by default for machine readability
- **Child Loggers**: Create child loggers with inherited bindings
- **Serializers**: Custom serialization for objects
- **Pretty Printing**: Human-readable output for development
- **Log Levels**: Trace, debug, info, warn, error, fatal
- **Low Overhead**: Minimal CPU and memory footprint
- **TypeScript**: Full TypeScript support
- **Redaction**: Automatic redaction of sensitive data
- **Transports**: Custom transport support

## Installation

```bash
npm install @elide/pino-clone
```

## Quick Start

```typescript
import pino from '@elide/pino-clone';

const logger = pino();

logger.info('Hello world!');
logger.error('An error occurred');
```

## Log Levels

```typescript
logger.trace('Trace message');
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.fatal('Fatal error');

// With metadata
logger.info({ userId: 123 }, 'User logged in');
logger.error({ err: error }, 'Request failed');
```

## Configuration

```typescript
const logger = pino({
  level: 'info',
  name: 'my-app',
  prettyPrint: process.env.NODE_ENV !== 'production',
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: ['password', 'creditCard'],
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

## Structured Logging

```typescript
// Object-first API
logger.info({ user: { id: 123, name: 'John' } }, 'User action');

// Output:
// {"level":30,"time":1234567890,"user":{"id":123,"name":"John"},"msg":"User action"}

// Multiple objects
logger.info({ req: request, userId: 123 }, 'HTTP request');
```

## Child Loggers

```typescript
const child = logger.child({ module: 'auth' });

child.info('Login attempt');
// {"level":30,"time":1234567890,"module":"auth","msg":"Login attempt"}

// Nested children
const grandchild = child.child({ userId: 123 });
grandchild.info('Password reset');
// {"level":30,"time":1234567890,"module":"auth","userId":123,"msg":"Password reset"}
```

## Serializers

### Built-in Serializers

```typescript
import pino from '@elide/pino-clone';

const logger = pino({
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Request serialization
logger.info({ req }, 'HTTP request');

// Response serialization
logger.info({ res }, 'HTTP response');

// Error serialization
logger.error({ err: new Error('Failed') }, 'Operation failed');
```

### Custom Serializers

```typescript
const logger = pino({
  serializers: {
    user: (user) => ({
      id: user.id,
      email: user.email,
      // Don't log password
    }),

    order: (order) => ({
      id: order.id,
      total: order.total,
      items: order.items.length,
    }),
  },
});

logger.info({ user }, 'User action');
logger.info({ order }, 'Order placed');
```

## Redaction

### Automatic Redaction

```typescript
const logger = pino({
  redact: {
    paths: ['password', 'creditCard', 'ssn'],
    censor: '[REDACTED]',
  },
});

logger.info({
  user: {
    name: 'John',
    password: 'secret123',
    email: 'john@example.com',
  },
}, 'User data');

// Output: {"level":30,...,"user":{"name":"John","password":"[REDACTED]","email":"john@example.com"},...}
```

### Nested Path Redaction

```typescript
const logger = pino({
  redact: {
    paths: [
      'user.password',
      'payment.*.cardNumber',
      'headers.authorization',
    ],
    remove: true, // Remove instead of censoring
  },
});
```

## Pretty Printing

### Development Mode

```typescript
const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
});

// Output (colorized):
// [2024-01-15 10:30:45] INFO: User logged in
//     userId: 123
//     module: "auth"
```

### Production Mode

```typescript
// Always use JSON in production
const logger = pino({
  prettyPrint: false,
});
```

## Transports

### File Transport

```typescript
import pino from '@elide/pino-clone';
import * as fs from 'fs';

const stream = fs.createWriteStream('/var/log/app.log', { flags: 'a' });
const logger = pino(stream);

logger.info('Log to file');
```

### Multiple Destinations

```typescript
import pinoms from 'pino-multi-stream';

const logger = pino({
  streams: [
    { stream: process.stdout },
    { stream: fs.createWriteStream('/var/log/app.log') },
    { level: 'error', stream: fs.createWriteStream('/var/log/error.log') },
  ],
});
```

### Custom Transport

```typescript
const transport = pino.transport({
  target: '@elide/pino-clone/transports/http',
  options: {
    url: 'http://localhost:8080/logs',
  },
});

const logger = pino(transport);
```

## Bindings

```typescript
const logger = pino();

// Add permanent bindings
const boundLogger = logger.child({
  requestId: 'req-123',
  userId: 456,
});

boundLogger.info('Processing request');
// Includes requestId and userId in every log
```

## Level Management

### Setting Log Level

```typescript
const logger = pino({ level: 'debug' });

// Change level dynamically
logger.level = 'info';

// Check if level is enabled
if (logger.isLevelEnabled('debug')) {
  logger.debug('Expensive debug info');
}
```

### Custom Levels

```typescript
const logger = pino({
  customLevels: {
    audit: 35, // Between info (30) and warn (40)
  },
  useOnlyCustomLevels: false,
});

logger.audit({ action: 'user.login' }, 'Audit event');
```

## Error Logging

```typescript
try {
  throw new Error('Something went wrong');
} catch (err) {
  logger.error({ err }, 'Operation failed');
}

// With additional context
logger.error({
  err,
  userId: 123,
  operation: 'payment',
}, 'Payment processing failed');
```

## Performance

### Benchmarks

```
pino: 52,000 ops/sec
winston: 8,000 ops/sec
bunyan: 10,000 ops/sec
```

### Optimization Tips

1. **Use Child Loggers**: Reuse child loggers instead of passing the same bindings repeatedly
2. **Lazy Evaluation**: Pino doesn't serialize until needed
3. **Async by Default**: No blocking I/O
4. **Minimal Overhead**: ~2-3μs per log operation

## Integration Examples

### Express.js

```typescript
import express from 'express';
import pino from '@elide/pino-clone';
import pinoHttp from 'pino-http';

const logger = pino();
const app = express();

app.use(pinoHttp({ logger }));

app.get('/api/users', (req, res) => {
  req.log.info('Get users request');
  res.json({ users: [] });
});

app.listen(3000);
```

### Fastify

```typescript
import Fastify from 'fastify';
import pino from '@elide/pino-clone';

const logger = pino();

const fastify = Fastify({
  logger,
});

fastify.get('/api/users', async (request, reply) => {
  request.log.info('Get users request');
  return { users: [] };
});

await fastify.listen({ port: 3000 });
```

### NestJS

```typescript
import { Logger } from '@elide/pino-clone';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something');
  }
}
```

## Testing

```typescript
import pino from '@elide/pino-clone';

describe('Logger', () => {
  let logs: any[] = [];

  const logger = pino({
    level: 'debug',
    stream: {
      write: (log: string) => {
        logs.push(JSON.parse(log));
      },
    },
  });

  beforeEach(() => {
    logs = [];
  });

  it('should log messages', () => {
    logger.info({ userId: 123 }, 'Test message');

    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe(30); // info level
    expect(logs[0].msg).toBe('Test message');
    expect(logs[0].userId).toBe(123);
  });
});
```

## Advanced Features

### Context Preservation

```typescript
import { AsyncLocalStorage } from 'async_hooks';

const als = new AsyncLocalStorage();

app.use((req, res, next) => {
  const requestId = generateId();
  als.run({ requestId }, () => {
    req.log = logger.child({ requestId });
    next();
  });
});
```

### Log Sampling

```typescript
const logger = pino({
  hooks: {
    logMethod(args, method) {
      // Sample: log 10% of info messages
      if (args[0]?.level === 30 && Math.random() > 0.1) {
        return;
      }
      return method.apply(this, args);
    },
  },
});
```

### Custom Formatters

```typescript
const logger = pino({
  formatters: {
    level(label, number) {
      return { severity: label.toUpperCase() };
    },
    bindings(bindings) {
      return { host: bindings.hostname };
    },
    log(object) {
      return { ...object, timestamp: Date.now() };
    },
  },
});
```

## Best Practices

1. **Use Structured Logging**: Always log objects, not strings
2. **Child Loggers**: Create child loggers for different modules/contexts
3. **Serializers**: Use serializers for consistent object formatting
4. **Redaction**: Always redact sensitive data
5. **Production JSON**: Use JSON in production, pretty print in development
6. **Error Logging**: Always include error objects in error logs
7. **Performance**: Avoid expensive operations in log statements

## License

MIT License - See LICENSE file for details

## Credits

Ported to Elide from the original Pino library. Original implementation by Matteo Collina and contributors.

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.
