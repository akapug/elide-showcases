/**
 * OpenTelemetry Logging Implementation
 */

import type { Logger, LoggerProvider, LogRecord, Resource, InstrumentationLibrary } from './types';
import { SeverityNumber } from './types';

class LoggerImpl implements Logger {
  constructor(
    private instrumentationLibrary: InstrumentationLibrary,
    private resource: Resource
  ) {}

  emit(logRecord: LogRecord): void {
    // Emit log record to processor
    const timestamp = logRecord.timestamp || Date.now();
    const observedTimestamp = logRecord.observedTimestamp || Date.now();

    // Process log record
    console.log({
      ...logRecord,
      timestamp,
      observedTimestamp,
      resource: this.resource,
      instrumentationScope: this.instrumentationLibrary,
    });
  }
}

class LoggerProviderImpl implements LoggerProvider {
  private loggers = new Map<string, Logger>();
  private resource: Resource;

  constructor(config: { resource?: Resource } = {}) {
    this.resource = config.resource || {
      attributes: {},
      merge: (other) => this.resource,
    };
  }

  getLogger(name: string, version?: string): Logger {
    const key = `${name}@${version || 'latest'}`;
    let logger = this.loggers.get(key);

    if (!logger) {
      const instrumentationLibrary: InstrumentationLibrary = {
        name,
        version,
      };

      logger = new LoggerImpl(instrumentationLibrary, this.resource);
      this.loggers.set(key, logger);
    }

    return logger;
  }
}

let globalLoggerProvider: LoggerProvider = new LoggerProviderImpl();

export const logs = {
  getLogger(name: string, version?: string): Logger {
    return globalLoggerProvider.getLogger(name, version);
  },

  getLoggerProvider(): LoggerProvider {
    return globalLoggerProvider;
  },

  setLoggerProvider(provider: LoggerProvider): void {
    globalLoggerProvider = provider;
  },
};

export { SeverityNumber, LoggerProviderImpl as LoggerProvider };
export type { Logger, LoggerProvider, LogRecord };
