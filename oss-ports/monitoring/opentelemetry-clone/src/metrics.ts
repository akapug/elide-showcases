/**
 * OpenTelemetry Metrics Implementation
 */

import type {
  Meter,
  MeterProvider,
  Counter,
  BoundCounter,
  UpDownCounter,
  BoundUpDownCounter,
  Histogram,
  BoundHistogram,
  ObservableGauge,
  ObservableCounter,
  ObservableUpDownCounter,
  MetricOptions,
  MetricAttributes,
  ObservableCallback,
  ObservableResult,
  Resource,
  InstrumentationLibrary,
  ValueType,
} from './types';

// Observable result implementation
class ObservableResultImpl implements ObservableResult {
  private observations: Array<{ value: number; attributes?: MetricAttributes }> = [];

  observe(value: number, attributes?: MetricAttributes): void {
    this.observations.push({ value, attributes });
  }

  getObservations() {
    return this.observations;
  }
}

// Bound instrument base class
abstract class BoundInstrument {
  constructor(protected attributes: MetricAttributes) {}

  abstract unbind(): void;
}

// Counter implementation
class CounterImpl implements Counter {
  private boundInstruments = new Map<string, BoundCounterImpl>();

  constructor(
    private name: string,
    private options: MetricOptions = {}
  ) {}

  add(value: number, attributes?: MetricAttributes): void {
    if (value < 0) {
      console.warn('Counter values must be non-negative');
      return;
    }

    // Record metric value
    this.record(value, attributes || {});
  }

  bind(attributes: MetricAttributes): BoundCounter {
    const key = this.attributesKey(attributes);
    let bound = this.boundInstruments.get(key);

    if (!bound) {
      bound = new BoundCounterImpl(attributes, this);
      this.boundInstruments.set(key, bound);
    }

    return bound;
  }

  unbind(bound: BoundCounterImpl): void {
    const key = this.attributesKey(bound.getAttributes());
    this.boundInstruments.delete(key);
  }

  private record(value: number, attributes: MetricAttributes): void {
    // Would record to metric collector
  }

  private attributesKey(attributes: MetricAttributes): string {
    return JSON.stringify(
      Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  }
}

class BoundCounterImpl extends BoundInstrument implements BoundCounter {
  constructor(attributes: MetricAttributes, private counter: CounterImpl) {
    super(attributes);
  }

  add(value: number): void {
    this.counter.add(value, this.attributes);
  }

  unbind(): void {
    this.counter.unbind(this);
  }

  getAttributes(): MetricAttributes {
    return this.attributes;
  }
}

// UpDownCounter implementation
class UpDownCounterImpl implements UpDownCounter {
  private boundInstruments = new Map<string, BoundUpDownCounterImpl>();

  constructor(
    private name: string,
    private options: MetricOptions = {}
  ) {}

  add(value: number, attributes?: MetricAttributes): void {
    this.record(value, attributes || {});
  }

  bind(attributes: MetricAttributes): BoundUpDownCounter {
    const key = this.attributesKey(attributes);
    let bound = this.boundInstruments.get(key);

    if (!bound) {
      bound = new BoundUpDownCounterImpl(attributes, this);
      this.boundInstruments.set(key, bound);
    }

    return bound;
  }

  unbind(bound: BoundUpDownCounterImpl): void {
    const key = this.attributesKey(bound.getAttributes());
    this.boundInstruments.delete(key);
  }

  private record(value: number, attributes: MetricAttributes): void {
    // Would record to metric collector
  }

  private attributesKey(attributes: MetricAttributes): string {
    return JSON.stringify(
      Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  }
}

class BoundUpDownCounterImpl extends BoundInstrument implements BoundUpDownCounter {
  constructor(attributes: MetricAttributes, private counter: UpDownCounterImpl) {
    super(attributes);
  }

  add(value: number): void {
    this.counter.add(value, this.attributes);
  }

  unbind(): void {
    this.counter.unbind(this);
  }

  getAttributes(): MetricAttributes {
    return this.attributes;
  }
}

// Histogram implementation
class HistogramImpl implements Histogram {
  private boundInstruments = new Map<string, BoundHistogramImpl>();

  constructor(
    private name: string,
    private options: MetricOptions = {}
  ) {}

  record(value: number, attributes?: MetricAttributes): void {
    if (value < 0) {
      console.warn('Histogram values must be non-negative');
      return;
    }

    this.recordValue(value, attributes || {});
  }

  bind(attributes: MetricAttributes): BoundHistogram {
    const key = this.attributesKey(attributes);
    let bound = this.boundInstruments.get(key);

    if (!bound) {
      bound = new BoundHistogramImpl(attributes, this);
      this.boundInstruments.set(key, bound);
    }

    return bound;
  }

  unbind(bound: BoundHistogramImpl): void {
    const key = this.attributesKey(bound.getAttributes());
    this.boundInstruments.delete(key);
  }

  private recordValue(value: number, attributes: MetricAttributes): void {
    // Would record to metric collector
  }

  private attributesKey(attributes: MetricAttributes): string {
    return JSON.stringify(
      Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  }
}

class BoundHistogramImpl extends BoundInstrument implements BoundHistogram {
  constructor(attributes: MetricAttributes, private histogram: HistogramImpl) {
    super(attributes);
  }

  record(value: number): void {
    this.histogram.record(value, this.attributes);
  }

  unbind(): void {
    this.histogram.unbind(this);
  }

  getAttributes(): MetricAttributes {
    return this.attributes;
  }
}

// Observable gauge implementation
class ObservableGaugeImpl implements ObservableGauge {
  private callbacks: ObservableCallback[] = [];

  constructor(
    private name: string,
    private options: MetricOptions = {}
  ) {}

  addCallback(callback: ObservableCallback): void {
    this.callbacks.push(callback);
  }

  removeCallback(callback: ObservableCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  async collect(): Promise<ObservableResultImpl> {
    const result = new ObservableResultImpl();

    for (const callback of this.callbacks) {
      await callback(result);
    }

    return result;
  }
}

// Observable counter implementation
class ObservableCounterImpl implements ObservableCounter {
  private callbacks: ObservableCallback[] = [];

  constructor(
    private name: string,
    private options: MetricOptions = {}
  ) {}

  addCallback(callback: ObservableCallback): void {
    this.callbacks.push(callback);
  }

  removeCallback(callback: ObservableCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  async collect(): Promise<ObservableResultImpl> {
    const result = new ObservableResultImpl();

    for (const callback of this.callbacks) {
      await callback(result);
    }

    return result;
  }
}

// Observable up-down counter implementation
class ObservableUpDownCounterImpl implements ObservableUpDownCounter {
  private callbacks: ObservableCallback[] = [];

  constructor(
    private name: string,
    private options: MetricOptions = {}
  ) {}

  addCallback(callback: ObservableCallback): void {
    this.callbacks.push(callback);
  }

  removeCallback(callback: ObservableCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  async collect(): Promise<ObservableResultImpl> {
    const result = new ObservableResultImpl();

    for (const callback of this.callbacks) {
      await callback(result);
    }

    return result;
  }
}

// Meter implementation
class MeterImpl implements Meter {
  constructor(
    private instrumentationLibrary: InstrumentationLibrary,
    private resource: Resource
  ) {}

  createCounter(name: string, options?: MetricOptions): Counter {
    return new CounterImpl(name, options);
  }

  createUpDownCounter(name: string, options?: MetricOptions): UpDownCounter {
    return new UpDownCounterImpl(name, options);
  }

  createHistogram(name: string, options?: MetricOptions): Histogram {
    return new HistogramImpl(name, options);
  }

  createObservableGauge(name: string, options?: MetricOptions): ObservableGauge {
    return new ObservableGaugeImpl(name, options);
  }

  createObservableCounter(name: string, options?: MetricOptions): ObservableCounter {
    return new ObservableCounterImpl(name, options);
  }

  createObservableUpDownCounter(
    name: string,
    options?: MetricOptions
  ): ObservableUpDownCounter {
    return new ObservableUpDownCounterImpl(name, options);
  }
}

// Meter provider implementation
class MeterProviderImpl implements MeterProvider {
  private meters = new Map<string, Meter>();
  private resource: Resource;

  constructor(config: { resource?: Resource } = {}) {
    this.resource = config.resource || {
      attributes: {},
      merge: (other) => this.resource,
    };
  }

  getMeter(name: string, version?: string): Meter {
    const key = `${name}@${version || 'latest'}`;
    let meter = this.meters.get(key);

    if (!meter) {
      const instrumentationLibrary: InstrumentationLibrary = {
        name,
        version,
      };

      meter = new MeterImpl(instrumentationLibrary, this.resource);
      this.meters.set(key, meter);
    }

    return meter;
  }
}

// Global meter provider
let globalMeterProvider: MeterProvider = new MeterProviderImpl();

// Metrics API
export const metrics = {
  getMeter(name: string, version?: string): Meter {
    return globalMeterProvider.getMeter(name, version);
  },

  getMeterProvider(): MeterProvider {
    return globalMeterProvider;
  },

  setGlobalMeterProvider(provider: MeterProvider): void {
    globalMeterProvider = provider;
  },
};

export { MeterProviderImpl as MeterProvider };
export type {
  Meter,
  Counter,
  UpDownCounter,
  Histogram,
  ObservableGauge,
  ObservableCounter,
  ObservableUpDownCounter,
};
