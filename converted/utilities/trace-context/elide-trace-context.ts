/**
 * trace-context - W3C Trace Context
 *
 * W3C Trace Context specification implementation for distributed tracing.
 * **POLYGLOT SHOWCASE**: Standard trace context for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/trace-context (~50K+ downloads/week)
 *
 * Features:
 * - W3C Trace Context standard
 * - Traceparent header parsing
 * - Tracestate header handling
 * - Context propagation
 * - Version compatibility
 * - Sampling decisions
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Standard trace format across languages
 * - ONE trace context spec on Elide
 * - Interoperable tracing
 * - Framework-agnostic
 *
 * Use cases:
 * - Distributed tracing
 * - Microservices communication
 * - Trace propagation
 * - Cross-platform tracing
 *
 * Package has ~50K+ downloads/week on npm!
 */

interface TraceContext {
  version: string;
  traceId: string;
  parentId: string;
  traceFlags: string;
  traceState?: string;
}

class TraceContextParser {
  private static readonly VERSION = '00';
  private static readonly TRACE_ID_LENGTH = 32;
  private static readonly PARENT_ID_LENGTH = 16;

  static parse(traceparent: string, tracestate?: string): TraceContext | null {
    const parts = traceparent.split('-');

    if (parts.length !== 4) {
      console.error('[TraceContext] Invalid traceparent format');
      return null;
    }

    const [version, traceId, parentId, traceFlags] = parts;

    if (version.length !== 2 || traceId.length !== this.TRACE_ID_LENGTH ||
        parentId.length !== this.PARENT_ID_LENGTH || traceFlags.length !== 2) {
      console.error('[TraceContext] Invalid traceparent field lengths');
      return null;
    }

    return {
      version,
      traceId,
      parentId,
      traceFlags,
      traceState: tracestate,
    };
  }

  static serialize(context: TraceContext): { traceparent: string; tracestate?: string } {
    const traceparent = `${context.version}-${context.traceId}-${context.parentId}-${context.traceFlags}`;

    return {
      traceparent,
      tracestate: context.traceState,
    };
  }

  static create(options?: { sampled?: boolean }): TraceContext {
    return {
      version: this.VERSION,
      traceId: this.generateTraceId(),
      parentId: this.generateSpanId(),
      traceFlags: options?.sampled !== false ? '01' : '00',
    };
  }

  static isSampled(context: TraceContext): boolean {
    return (parseInt(context.traceFlags, 16) & 0x01) === 0x01;
  }

  static setSampled(context: TraceContext, sampled: boolean): TraceContext {
    const flags = parseInt(context.traceFlags, 16);
    const newFlags = sampled ? (flags | 0x01) : (flags & 0xfe);

    return {
      ...context,
      traceFlags: newFlags.toString(16).padStart(2, '0'),
    };
  }

  static childContext(parent: TraceContext): TraceContext {
    return {
      version: parent.version,
      traceId: parent.traceId,
      parentId: this.generateSpanId(),
      traceFlags: parent.traceFlags,
      traceState: parent.traceState,
    };
  }

  private static generateTraceId(): string {
    return this.randomHex(32);
  }

  private static generateSpanId(): string {
    return this.randomHex(16);
  }

  private static randomHex(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  }

  static parseTraceState(tracestate: string): Map<string, string> {
    const state = new Map<string, string>();

    if (!tracestate) return state;

    const entries = tracestate.split(',');
    for (const entry of entries) {
      const [key, value] = entry.trim().split('=');
      if (key && value) {
        state.set(key, value);
      }
    }

    return state;
  }

  static serializeTraceState(state: Map<string, string>): string {
    return Array.from(state.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }
}

export { TraceContextParser, TraceContext };
export default TraceContextParser;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔗 trace-context - W3C Trace Context (POLYGLOT!)\n");

  console.log("=== Create New Trace Context ===");
  const context = TraceContextParser.create({ sampled: true });
  console.log('Context:', context);
  console.log();

  console.log("=== Serialize Context ===");
  const headers = TraceContextParser.serialize(context);
  console.log('Headers:', headers);
  console.log();

  console.log("=== Parse Context ===");
  const parsed = TraceContextParser.parse(headers.traceparent, headers.tracestate);
  console.log('Parsed:', parsed);
  console.log();

  console.log("=== Check Sampling ===");
  console.log('Is sampled:', TraceContextParser.isSampled(context));
  const unsampled = TraceContextParser.setSampled(context, false);
  console.log('After unsampling:', TraceContextParser.isSampled(unsampled));
  console.log();

  console.log("=== Create Child Context ===");
  const child = TraceContextParser.childContext(context);
  console.log('Child context:', child);
  console.log('Same trace ID:', child.traceId === context.traceId);
  console.log('Different parent ID:', child.parentId !== context.parentId);
  console.log();

  console.log("=== Trace State ===");
  const stateMap = new Map([
    ['vendor1', 'value1'],
    ['vendor2', 'value2'],
  ]);
  const tracestate = TraceContextParser.serializeTraceState(stateMap);
  console.log('Serialized tracestate:', tracestate);

  const parsedState = TraceContextParser.parseTraceState(tracestate);
  console.log('Parsed tracestate:', parsedState);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Distributed tracing");
  console.log("- Microservices communication");
  console.log("- Trace propagation");
  console.log("- Cross-platform tracing");
  console.log("- ~50K+ downloads/week on npm!");
}
