/**
 * OpenTelemetry SDK Implementation
 */

import type { TracerProvider, MeterProvider, Resource } from './types';
import { BasicTracerProvider } from './trace';
import { MeterProvider as MeterProviderImpl } from './metrics';

export interface NodeSDKConfiguration {
  serviceName?: string;
  serviceVersion?: string;
  resource?: Resource;
  spanProcessor?: any;
  metricReader?: any;
  traceExporter?: any;
  metricExporter?: any;
  sampler?: any;
}

export class NodeSDK {
  private tracerProvider: TracerProvider;
  private meterProvider: MeterProvider;
  private resource: Resource;

  constructor(config: NodeSDKConfiguration = {}) {
    // Create resource
    this.resource = config.resource || {
      attributes: {
        'service.name': config.serviceName || 'unknown-service',
        'service.version': config.serviceVersion || '0.0.0',
      },
      merge: (other) => this.resource,
    };

    // Create tracer provider
    this.tracerProvider = new BasicTracerProvider({ resource: this.resource });

    // Create meter provider
    this.meterProvider = new MeterProviderImpl({ resource: this.resource });
  }

  start(): void {
    // Register providers globally
    (this.tracerProvider as any).register?.();
  }

  async shutdown(): Promise<void> {
    await (this.tracerProvider as any).shutdown?.();
  }
}

export * from './trace';
export * from './metrics';
export * from './exporters';
export * from './logs';
export * from './context';
export * from './propagation';
