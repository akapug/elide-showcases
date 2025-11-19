/**
 * OpenTelemetry Instrumentation
 */

import type { Instrumentation, InstrumentationConfig, TracerProvider, MeterProvider } from './types';

export class HttpInstrumentation implements Instrumentation {
  public readonly instrumentationName = '@opentelemetry/instrumentation-http';
  public readonly instrumentationVersion = '0.1.0';

  constructor(private config: InstrumentationConfig = {}) {}

  enable(): void {}
  disable(): void {}
  setTracerProvider(tracerProvider: TracerProvider): void {}
  setMeterProvider(meterProvider: MeterProvider): void {}
}

export class ExpressInstrumentation implements Instrumentation {
  public readonly instrumentationName = '@opentelemetry/instrumentation-express';
  public readonly instrumentationVersion = '0.1.0';

  constructor(private config: InstrumentationConfig = {}) {}

  enable(): void {}
  disable(): void {}
  setTracerProvider(tracerProvider: TracerProvider): void {}
  setMeterProvider(meterProvider: MeterProvider): void {}
}

export class PostgresInstrumentation implements Instrumentation {
  public readonly instrumentationName = '@opentelemetry/instrumentation-pg';
  public readonly instrumentationVersion = '0.1.0';

  constructor(private config: InstrumentationConfig = {}) {}

  enable(): void {}
  disable(): void {}
  setTracerProvider(tracerProvider: TracerProvider): void {}
  setMeterProvider(meterProvider: MeterProvider): void {}
}

export function registerInstrumentations(config: {
  instrumentations: Instrumentation[];
}): void {
  for (const instrumentation of config.instrumentations) {
    instrumentation.enable();
  }
}
