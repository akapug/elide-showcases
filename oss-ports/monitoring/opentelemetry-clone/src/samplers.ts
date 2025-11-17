/**
 * OpenTelemetry Samplers
 */

import type {
  Sampler,
  SamplingResult,
  SamplingDecision,
  Context,
  SpanKind,
  SpanAttributes,
  Link,
  TraceState,
} from './types';

/**
 * Always-on sampler - samples all spans
 */
export class AlwaysOnSampler implements Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[]
  ): SamplingResult {
    return {
      decision: 2 as SamplingDecision, // RECORD_AND_SAMPLED
    };
  }

  toString(): string {
    return 'AlwaysOnSampler';
  }
}

/**
 * Always-off sampler - never samples
 */
export class AlwaysOffSampler implements Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[]
  ): SamplingResult {
    return {
      decision: 0 as SamplingDecision, // NOT_RECORD
    };
  }

  toString(): string {
    return 'AlwaysOffSampler';
  }
}

/**
 * Trace ID ratio-based sampler
 */
export class TraceIdRatioBasedSampler implements Sampler {
  private readonly upperBound: number;

  constructor(private readonly ratio: number) {
    if (ratio < 0 || ratio > 1) {
      throw new Error('Ratio must be between 0 and 1');
    }

    this.upperBound = Math.floor(ratio * 0x100000000);
  }

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[]
  ): SamplingResult {
    // Use trace ID to determine sampling
    const traceIdValue = parseInt(traceId.slice(0, 8), 16);

    const decision =
      traceIdValue < this.upperBound
        ? (2 as SamplingDecision) // RECORD_AND_SAMPLED
        : (0 as SamplingDecision); // NOT_RECORD

    return { decision };
  }

  toString(): string {
    return `TraceIdRatioBasedSampler{${this.ratio}}`;
  }
}

/**
 * Parent-based sampler configuration
 */
export interface ParentBasedSamplerConfig {
  root?: Sampler;
  remoteParentSampled?: Sampler;
  remoteParentNotSampled?: Sampler;
  localParentSampled?: Sampler;
  localParentNotSampled?: Sampler;
}

/**
 * Parent-based sampler
 */
export class ParentBasedSampler implements Sampler {
  private readonly root: Sampler;
  private readonly remoteParentSampled: Sampler;
  private readonly remoteParentNotSampled: Sampler;
  private readonly localParentSampled: Sampler;
  private readonly localParentNotSampled: Sampler;

  constructor(config: ParentBasedSamplerConfig) {
    this.root = config.root || new AlwaysOnSampler();
    this.remoteParentSampled = config.remoteParentSampled || new AlwaysOnSampler();
    this.remoteParentNotSampled = config.remoteParentNotSampled || new AlwaysOffSampler();
    this.localParentSampled = config.localParentSampled || new AlwaysOnSampler();
    this.localParentNotSampled = config.localParentNotSampled || new AlwaysOffSampler();
  }

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[]
  ): SamplingResult {
    // Get parent span context from context
    const parentSpanContext = this.getParentSpanContext(context);

    if (!parentSpanContext) {
      // No parent, use root sampler
      return this.root.shouldSample(
        context,
        traceId,
        spanName,
        spanKind,
        attributes,
        links
      );
    }

    // Determine which sampler to use based on parent
    const isRemote = parentSpanContext.isRemote || false;
    const isSampled = (parentSpanContext.traceFlags & 1) === 1;

    let sampler: Sampler;

    if (isRemote) {
      sampler = isSampled ? this.remoteParentSampled : this.remoteParentNotSampled;
    } else {
      sampler = isSampled ? this.localParentSampled : this.localParentNotSampled;
    }

    return sampler.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links
    );
  }

  toString(): string {
    return `ParentBasedSampler{root=${this.root}}`;
  }

  private getParentSpanContext(context: Context): any {
    // Would extract parent span context from context
    return null;
  }
}
