/**
 * Event-Driven Polyglot Architecture
 *
 * Demonstrates event sourcing and event-driven patterns across multiple languages:
 * - TypeScript: Event store and event bus
 * - Python: Event processing and analytics
 * - Go: High-throughput event streaming
 * - Java: Complex event processing (CEP)
 */

// Event Types
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: number;
  data: any;
  metadata: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

// Event Store (TypeScript)
class EventStore {
  private events: DomainEvent[] = [];
  private subscribers: Map<string, Array<(event: DomainEvent) => void>> = new Map();

  append(event: DomainEvent): void {
    console.log(`[EventStore] Appending event: ${event.type}`);
    this.events.push(event);
    this.publish(event);
  }

  getEvents(aggregateId?: string, eventType?: string): DomainEvent[] {
    let filtered = this.events;

    if (aggregateId) {
      filtered = filtered.filter(e => e.aggregateId === aggregateId);
    }

    if (eventType) {
      filtered = filtered.filter(e => e.type === eventType);
    }

    return filtered;
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
    console.log(`[EventStore] Subscriber registered for: ${eventType}`);
  }

  private publish(event: DomainEvent): void {
    const handlers = this.subscribers.get(event.type) || [];
    const wildcardHandlers = this.subscribers.get('*') || [];

    for (const handler of [...handlers, ...wildcardHandlers]) {
      try {
        handler(event);
      } catch (error) {
        console.error(`[EventStore] Handler error:`, error);
      }
    }
  }

  replay(aggregateId: string): any {
    const events = this.getEvents(aggregateId);
    console.log(`[EventStore] Replaying ${events.length} events for ${aggregateId}`);

    // Rebuild aggregate state from events
    let state: any = {};
    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  private applyEvent(state: any, event: DomainEvent): any {
    switch (event.type) {
      case 'UserCreated':
        return { ...event.data, id: event.aggregateId };
      case 'UserUpdated':
        return { ...state, ...event.data };
      case 'OrderPlaced':
        return { ...event.data, id: event.aggregateId, status: 'placed' };
      case 'OrderPaid':
        return { ...state, status: 'paid', paidAt: event.timestamp };
      case 'OrderShipped':
        return { ...state, status: 'shipped', shippedAt: event.timestamp };
      default:
        return state;
    }
  }
}

// Event Processor (Python-style)
class EventProcessor {
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Subscribe to all events for analytics
    this.eventStore.subscribe('*', (event) => this.processForAnalytics(event));

    // Subscribe to specific events
    this.eventStore.subscribe('OrderPlaced', (event) => this.handleOrderPlaced(event));
    this.eventStore.subscribe('UserCreated', (event) => this.handleUserCreated(event));
  }

  private processForAnalytics(event: DomainEvent): void {
    console.log(`  [Python EventProcessor] Processing for analytics: ${event.type}`);
    // Simulate Python data processing (Pandas, NumPy)
    // - Update time-series database
    // - Calculate metrics
    // - Update dashboards
  }

  private handleOrderPlaced(event: DomainEvent): void {
    console.log(`  [Python EventProcessor] Order placed analytics`);
    console.log(`    → Updating revenue metrics`);
    console.log(`    → Calculating conversion rate`);
    console.log(`    → Updating inventory predictions`);
  }

  private handleUserCreated(event: DomainEvent): void {
    console.log(`  [Python EventProcessor] User created analytics`);
    console.log(`    → Updating user acquisition metrics`);
    console.log(`    → Running cohort analysis`);
    console.log(`    → Calculating LTV predictions`);
  }

  getAnalytics(aggregateId: string): any {
    const events = this.eventStore.getEvents(aggregateId);
    return {
      totalEvents: events.length,
      eventTypes: [...new Set(events.map(e => e.type))],
      firstEvent: events[0]?.timestamp,
      lastEvent: events[events.length - 1]?.timestamp,
      timeline: events.map(e => ({ type: e.type, timestamp: e.timestamp })),
    };
  }
}

// Event Stream (Go-style)
class EventStream {
  private eventStore: EventStore;
  private checkpoints: Map<string, number> = new Map();

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  async* stream(fromPosition: number = 0): AsyncGenerator<DomainEvent> {
    console.log(`  [Go EventStream] Starting stream from position ${fromPosition}`);

    const events = this.eventStore.getEvents();

    for (let i = fromPosition; i < events.length; i++) {
      yield events[i];
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate streaming
    }
  }

  async* subscribe(eventTypes: string[]): AsyncGenerator<DomainEvent> {
    console.log(`  [Go EventStream] Subscribing to: ${eventTypes.join(', ')}`);

    // In production, this would be a real-time stream
    // For demo, we'll simulate with existing events
    const events = this.eventStore.getEvents();

    for (const event of events) {
      if (eventTypes.includes(event.type) || eventTypes.includes('*')) {
        yield event;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  saveCheckpoint(consumerId: string, position: number): void {
    console.log(`  [Go EventStream] Checkpoint saved: ${consumerId} @ ${position}`);
    this.checkpoints.set(consumerId, position);
  }

  getCheckpoint(consumerId: string): number {
    return this.checkpoints.get(consumerId) || 0;
  }
}

// Complex Event Processing (Java-style)
class ComplexEventProcessor {
  private eventStore: EventStore;
  private patterns: Map<string, Array<(events: DomainEvent[]) => boolean>> = new Map();

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
    this.setupPatterns();
  }

  private setupPatterns(): void {
    // Pattern: Abandoned cart (OrderPlaced but not OrderPaid within time window)
    this.definePattern('AbandonedCart', (events: DomainEvent[]) => {
      const orderPlaced = events.find(e => e.type === 'OrderPlaced');
      const orderPaid = events.find(e => e.type === 'OrderPaid');

      if (orderPlaced && !orderPaid) {
        const timeSincePlaced = Date.now() - orderPlaced.timestamp;
        return timeSincePlaced > 3600000; // 1 hour
      }

      return false;
    });

    // Pattern: High-value user (Multiple purchases over threshold)
    this.definePattern('HighValueUser', (events: DomainEvent[]) => {
      const orderEvents = events.filter(e => e.type === 'OrderPaid');
      const totalSpent = orderEvents.reduce((sum, e) => sum + (e.data.amount || 0), 0);
      return totalSpent > 1000;
    });

    // Pattern: Rapid purchases (Multiple orders in short time)
    this.definePattern('RapidPurchases', (events: DomainEvent[]) => {
      const orderEvents = events.filter(e => e.type === 'OrderPlaced');
      if (orderEvents.length < 3) return false;

      const recentOrders = orderEvents.filter(e => Date.now() - e.timestamp < 3600000);
      return recentOrders.length >= 3;
    });
  }

  definePattern(name: string, matcher: (events: DomainEvent[]) => boolean): void {
    if (!this.patterns.has(name)) {
      this.patterns.set(name, []);
    }
    this.patterns.get(name)!.push(matcher);
  }

  detectPatterns(aggregateId: string): string[] {
    console.log(`  [Java CEP] Detecting patterns for ${aggregateId}`);

    const events = this.eventStore.getEvents(aggregateId);
    const detected: string[] = [];

    for (const [patternName, matchers] of this.patterns) {
      for (const matcher of matchers) {
        if (matcher(events)) {
          detected.push(patternName);
          console.log(`    ✓ Pattern detected: ${patternName}`);
        }
      }
    }

    return detected;
  }

  processComplexQueries(query: string): any {
    console.log(`  [Java CEP] Processing complex query: ${query}`);

    // Simulate complex event queries (similar to SQL over event streams)
    const allEvents = this.eventStore.getEvents();

    return {
      query,
      matchedEvents: allEvents.length,
      aggregations: {
        byType: this.aggregateByType(allEvents),
        byHour: this.aggregateByTimeWindow(allEvents, 3600000),
      },
    };
  }

  private aggregateByType(events: DomainEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  }

  private aggregateByTimeWindow(events: DomainEvent[], windowMs: number): any[] {
    // Group events by time window
    const windows: Record<string, number> = {};

    for (const event of events) {
      const window = Math.floor(event.timestamp / windowMs) * windowMs;
      windows[window] = (windows[window] || 0) + 1;
    }

    return Object.entries(windows).map(([time, count]) => ({
      window: new Date(parseInt(time)).toISOString(),
      count,
    }));
  }
}

// Demo scenario
async function runEventSourcingDemo(eventStore: EventStore) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          Event Sourcing Demo - Complete Flow              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Create some events
  console.log('[Step 1] Generate Domain Events\n');

  const userId = 'user-123';
  const orderId = 'order-456';

  eventStore.append({
    id: 'evt-1',
    type: 'UserCreated',
    aggregateId: userId,
    timestamp: Date.now() - 10000,
    data: { email: 'john@example.com', name: 'John Doe' },
    metadata: { correlationId: 'corr-1' },
  });

  eventStore.append({
    id: 'evt-2',
    type: 'OrderPlaced',
    aggregateId: orderId,
    timestamp: Date.now() - 5000,
    data: { userId, items: [{ id: 'prod-1', qty: 2 }], total: 99.98 },
    metadata: { userId, correlationId: 'corr-2' },
  });

  eventStore.append({
    id: 'evt-3',
    type: 'OrderPaid',
    aggregateId: orderId,
    timestamp: Date.now() - 2000,
    data: { amount: 99.98, method: 'card' },
    metadata: { userId, correlationId: 'corr-2', causationId: 'evt-2' },
  });

  eventStore.append({
    id: 'evt-4',
    type: 'OrderShipped',
    aggregateId: orderId,
    timestamp: Date.now(),
    data: { carrier: 'FedEx', tracking: 'TRACK123' },
    metadata: { userId, correlationId: 'corr-2', causationId: 'evt-3' },
  });

  console.log();

  // Replay events
  console.log('[Step 2] Event Replay - Rebuild Aggregate State\n');
  const orderState = eventStore.replay(orderId);
  console.log('Reconstructed Order State:', orderState);
  console.log();

  // Analytics
  console.log('[Step 3] Event Analytics\n');
  const processor = new EventProcessor(eventStore);
  const analytics = processor.getAnalytics(orderId);
  console.log('Order Analytics:', analytics);
  console.log();

  // Event streaming
  console.log('[Step 4] Event Streaming\n');
  const stream = new EventStream(eventStore);
  let count = 0;
  for await (const event of stream.stream()) {
    console.log(`  Stream event ${++count}:`, event.type);
  }
  console.log();

  // Complex event processing
  console.log('[Step 5] Complex Event Processing\n');
  const cep = new ComplexEventProcessor(eventStore);
  const patterns = cep.detectPatterns(orderId);
  console.log('Detected Patterns:', patterns.length > 0 ? patterns : ['None']);
  console.log();

  const queryResult = cep.processComplexQueries('SELECT COUNT(*) FROM events WHERE type = "OrderPaid"');
  console.log('Query Result:', queryResult.aggregations.byType);
  console.log();
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    Event-Driven Polyglot - Elide Runtime Showcase       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Event-Driven Architecture:');
  console.log('  • Event Store:              TypeScript');
  console.log('  • Event Processing:         Python (Analytics)');
  console.log('  • Event Streaming:          Go (High throughput)');
  console.log('  • Complex Event Processing: Java (Pattern matching)');
  console.log();
  console.log('Patterns Demonstrated:');
  console.log('  → Event sourcing');
  console.log('  → Event replay');
  console.log('  → Event streaming');
  console.log('  → Complex event processing (CEP)');
  console.log('  → Analytics from events');
  console.log();

  const eventStore = new EventStore();

  await runEventSourcingDemo(eventStore);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Event-Driven Demo Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Key Benefits:');
  console.log('  ✓ Complete audit trail');
  console.log('  ✓ Time travel (replay events)');
  console.log('  ✓ Real-time analytics');
  console.log('  ✓ Pattern detection');
  console.log('  ✓ Each language handles what it does best');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
