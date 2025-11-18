/**
 * Pino - Fast JSON Logger
 *
 * An extremely fast JSON logger for Node.js and beyond.
 * **POLYGLOT SHOWCASE**: Fast JSON logging for ALL languages on Elide!
 *
 * Features:
 * - Extremely fast performance
 * - JSON structured logging
 * - Low overhead
 * - Child loggers
 * - Custom serializers
 * - Multiple log levels
 * - Timestamp support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need JSON logging
 * - ONE fast logger works everywhere on Elide
 * - Consistent JSON format across languages
 * - Easy parsing and aggregation
 *
 * Use cases:
 * - Production logging
 * - Log aggregation systems
 * - Cloud-native applications
 * - Performance-critical apps
 * - Microservices
 *
 * Package has ~15M downloads/week on npm!
 */

export type PinoLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface PinoOptions {
  level?: PinoLevel;
  name?: string;
  serializers?: Record<string, (value: any) => any>;
  base?: Record<string, any>;
  timestamp?: boolean;
}

export interface LogObject {
  level: number;
  time: number;
  msg: string;
  pid?: number;
  hostname?: string;
  name?: string;
  [key: string]: any;
}

const LEVEL_VALUES: Record<PinoLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const LEVEL_NAMES: Record<number, PinoLevel> = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

export class Pino {
  private levelValue: number;
  private loggerName?: string;
  private serializers: Record<string, (value: any) => any>;
  private baseObject: Record<string, any>;
  private useTimestamp: boolean;

  constructor(options: PinoOptions = {}) {
    this.levelValue = LEVEL_VALUES[options.level || 'info'];
    this.loggerName = options.name;
    this.serializers = options.serializers || {};
    this.baseObject = options.base || {};
    this.useTimestamp = options.timestamp !== false;
  }

  private write(level: PinoLevel, msg: string, obj?: Record<string, any>): void {
    const levelValue = LEVEL_VALUES[level];

    if (levelValue < this.levelValue) {
      return;
    }

    const logObj: LogObject = {
      level: levelValue,
      time: this.useTimestamp ? Date.now() : 0,
      msg,
      ...this.baseObject,
    };

    if (this.loggerName) {
      logObj.name = this.loggerName;
    }

    if (obj) {
      for (const [key, value] of Object.entries(obj)) {
        const serializer = this.serializers[key];
        logObj[key] = serializer ? serializer(value) : value;
      }
    }

    console.log(JSON.stringify(logObj));
  }

  fatal(msg: string, obj?: Record<string, any>): void;
  fatal(obj: Record<string, any>, msg?: string): void;
  fatal(msgOrObj: string | Record<string, any>, objOrMsg?: string | Record<string, any>): void {
    if (typeof msgOrObj === 'string') {
      this.write('fatal', msgOrObj, objOrMsg as Record<string, any>);
    } else {
      this.write('fatal', (objOrMsg as string) || '', msgOrObj);
    }
  }

  error(msg: string, obj?: Record<string, any>): void;
  error(obj: Record<string, any>, msg?: string): void;
  error(msgOrObj: string | Record<string, any>, objOrMsg?: string | Record<string, any>): void {
    if (typeof msgOrObj === 'string') {
      this.write('error', msgOrObj, objOrMsg as Record<string, any>);
    } else {
      this.write('error', (objOrMsg as string) || '', msgOrObj);
    }
  }

  warn(msg: string, obj?: Record<string, any>): void;
  warn(obj: Record<string, any>, msg?: string): void;
  warn(msgOrObj: string | Record<string, any>, objOrMsg?: string | Record<string, any>): void {
    if (typeof msgOrObj === 'string') {
      this.write('warn', msgOrObj, objOrMsg as Record<string, any>);
    } else {
      this.write('warn', (objOrMsg as string) || '', msgOrObj);
    }
  }

  info(msg: string, obj?: Record<string, any>): void;
  info(obj: Record<string, any>, msg?: string): void;
  info(msgOrObj: string | Record<string, any>, objOrMsg?: string | Record<string, any>): void {
    if (typeof msgOrObj === 'string') {
      this.write('info', msgOrObj, objOrMsg as Record<string, any>);
    } else {
      this.write('info', (objOrMsg as string) || '', msgOrObj);
    }
  }

  debug(msg: string, obj?: Record<string, any>): void;
  debug(obj: Record<string, any>, msg?: string): void;
  debug(msgOrObj: string | Record<string, any>, objOrMsg?: string | Record<string, any>): void {
    if (typeof msgOrObj === 'string') {
      this.write('debug', msgOrObj, objOrMsg as Record<string, any>);
    } else {
      this.write('debug', (objOrMsg as string) || '', msgOrObj);
    }
  }

  trace(msg: string, obj?: Record<string, any>): void;
  trace(obj: Record<string, any>, msg?: string): void;
  trace(msgOrObj: string | Record<string, any>, objOrMsg?: string | Record<string, any>): void {
    if (typeof msgOrObj === 'string') {
      this.write('trace', msgOrObj, objOrMsg as Record<string, any>);
    } else {
      this.write('trace', (objOrMsg as string) || '', msgOrObj);
    }
  }

  child(bindings: Record<string, any>): Pino {
    return new Pino({
      level: LEVEL_NAMES[this.levelValue],
      name: this.loggerName,
      serializers: this.serializers,
      base: { ...this.baseObject, ...bindings },
      timestamp: this.useTimestamp,
    });
  }
}

export default function pino(options?: PinoOptions): Pino {
  return new Pino(options);
}

// CLI Demo
if (import.meta.url.includes("elide-pino.ts")) {
  console.log("⚡ Pino - Fast JSON Logger (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Logging ===");
  const logger = pino();
  logger.info('Application started');
  logger.warn('Warning message');
  logger.error('Error occurred');
  console.log();

  console.log("=== Example 2: Logging with Objects ===");
  logger.info('User login', { userId: 123, ip: '192.168.1.1' });
  logger.error({ err: { message: 'Failed' } }, 'Database error');
  console.log();

  console.log("=== Example 3: Named Logger ===");
  const namedLogger = pino({ name: 'my-app' });
  namedLogger.info('Named logger message');
  console.log();

  console.log("=== Example 4: Child Logger ===");
  const child = logger.child({ requestId: 'abc-123' });
  child.info('Request started');
  child.info('Request completed');
  console.log();

  console.log("=== Example 5: Custom Serializers ===");
  const customLogger = pino({
    serializers: {
      user: (user) => ({ id: user.id, name: user.name }),
    },
  });
  customLogger.info('User data', { user: { id: 1, name: 'Alice', password: 'secret' } });
  console.log();

  console.log("=== Example 6: Different Log Levels ===");
  logger.trace('Trace message');
  logger.debug('Debug message');
  logger.info('Info message');
  logger.warn('Warning message');
  logger.error('Error message');
  logger.fatal('Fatal message');
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("⚡ Same fast logger works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Extremely fast JSON logging");
  console.log("  ✓ Consistent format everywhere");
  console.log("  ✓ Easy log aggregation");
  console.log("  ✓ Low performance overhead");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Production logging");
  console.log("- Log aggregation systems");
  console.log("- Cloud-native applications");
  console.log("- Performance-critical apps");
  console.log("- Microservices");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Extremely fast");
  console.log("- Low memory footprint");
  console.log("- ~15M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share JSON log format across languages");
  console.log("- Perfect for log aggregators");
  console.log("- Ideal for microservices!");
}
