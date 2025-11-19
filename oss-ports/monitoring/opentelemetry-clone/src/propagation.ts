/**
 * OpenTelemetry Propagation
 */

import type { Context, TextMapPropagator, TextMapGetter, TextMapSetter } from './types';

export class W3CTraceContextPropagator implements TextMapPropagator {
  inject(context: Context, carrier: any, setter: TextMapSetter<any>): void {
    // Would inject trace context into carrier
  }

  extract(context: Context, carrier: any, getter: TextMapGetter<any>): Context {
    // Would extract trace context from carrier
    return context;
  }

  fields(): string[] {
    return ['traceparent', 'tracestate'];
  }
}

export class B3Propagator implements TextMapPropagator {
  inject(context: Context, carrier: any, setter: TextMapSetter<any>): void {}
  extract(context: Context, carrier: any, getter: TextMapGetter<any>): Context {
    return context;
  }
  fields(): string[] {
    return ['b3'];
  }
}

export const propagation = {
  inject(context: Context, carrier: any, setter?: TextMapSetter<any>): void {},
  extract(context: Context, carrier: any, getter?: TextMapGetter<any>): Context {
    return context;
  },
};
