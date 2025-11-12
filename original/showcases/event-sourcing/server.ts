/**
 * Event Sourcing Implementation with Elide
 *
 * Demonstrates enterprise event sourcing patterns including:
 * - Event store with persistence
 * - Event replay and reconstruction
 * - Projections for read models
 * - Snapshots for optimization
 * - CQRS (Command Query Responsibility Segregation)
 */

interface Event {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  data: any;
  metadata: {
    timestamp: number;
    version: number;
    userId?: string;
    correlationId?: string;
  };
}

interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
  timestamp: number;
}

interface Projection {
  name: string;
  lastProcessedEvent: string | null;
  lastProcessedVersion: number;
  data: any;
}

interface AggregateRoot {
  id: string;
  version: number;
  apply(event: Event): void;
  getState(): any;
}

// Example Aggregate: BankAccount
class BankAccount implements AggregateRoot {
  id: string;
  version: number = 0;
  private balance: number = 0;
  private isActive: boolean = false;
  private transactions: Array<{ type: string; amount: number; timestamp: number }> = [];

  constructor(id: string) {
    this.id = id;
}

  apply(event: Event): void {
    switch (event.eventType) {
      case 'AccountOpened':
        this.isActive = true;
        this.balance = event.data.initialBalance || 0;
        break;

      case 'MoneyDeposited':
        this.balance += event.data.amount;
        this.transactions.push({
          type: 'deposit',
          amount: event.data.amount,
          timestamp: event.metadata.timestamp
        });
        break;

      case 'MoneyWithdrawn':
        this.balance -= event.data.amount;
        this.transactions.push({
          type: 'withdrawal',
          amount: event.data.amount,
          timestamp: event.metadata.timestamp
        });
        break;

      case 'AccountClosed':
        this.isActive = false;
        break;
    }
    this.version = event.metadata.version;
}

  getState(): any {
    return {
      id: this.id,
      version: this.version,
      balance: this.balance,
      isActive: this.isActive,
      transactionCount: this.transactions.length,
      transactions: this.transactions
    };
}
}

class EventStore {
  private events: Map<string, Event[]> = new Map();
  private globalEventLog: Event[] = [];
  private snapshots: Map<string, Snapshot> = new Map();
  private snapshotInterval: number = 10; // Create snapshot every N events

  async appendEvent(event: Event): Promise<void> {
    const aggregateKey = `${event.aggregateType}:${event.aggregateId}`;
    const events = this.events.get(aggregateKey) || [];

    event.id = crypto.randomUUID();
    event.metadata.timestamp = Date.now();
    event.metadata.version = events.length + 1;

    events.push(event);
    this.events.set(aggregateKey, events);
    this.globalEventLog.push(event);

    console.log(`Event stored: ${event.eventType} for ${aggregateKey} (v${event.metadata.version})`);

    // Create snapshot if threshold reached
    if (events.length % this.snapshotInterval === 0) {
      await this.createSnapshot(event.aggregateType, event.aggregateId);
    }
}

  async getEvents(aggregateType: string, aggregateId: string, fromVersion: number = 0): Promise<Event[]> {
    const aggregateKey = `${aggregateType}:${aggregateId}`;
    const events = this.events.get(aggregateKey) || [];
    return events.filter(e => e.metadata.version > fromVersion);
}

  async getAllEvents(fromId?: string): Promise<Event[]> {
    if (!fromId) return [...this.globalEventLog];

    const index = this.globalEventLog.findIndex(e => e.id === fromId);
    return index >= 0 ? this.globalEventLog.slice(index + 1) : [];
}

  async getEventsByType(eventType: string): Promise<Event[]> {
    return this.globalEventLog.filter(e => e.eventType === eventType);
}

  async createSnapshot(aggregateType: string, aggregateId: string): Promise<void> {
    const aggregate = await this.rehydrateAggregate(aggregateType, aggregateId);
    if (!aggregate) return;

    const snapshot: Snapshot = {
      aggregateId,
      aggregateType,
      version: aggregate.version,
      state: aggregate.getState(),
      timestamp: Date.now()
    };

    const snapshotKey = `${aggregateType}:${aggregateId}`;
    this.snapshots.set(snapshotKey, snapshot);
    console.log(`Snapshot created for ${snapshotKey} at version ${aggregate.version}`);
}

  async getSnapshot(aggregateType: string, aggregateId: string): Promise<Snapshot | null> {
    const snapshotKey = `${aggregateType}:${aggregateId}`;
    return this.snapshots.get(snapshotKey) || null;
}

  async rehydrateAggregate(aggregateType: string, aggregateId: string): Promise<AggregateRoot | null> {
    // Try to load from snapshot first
    const snapshot = await this.getSnapshot(aggregateType, aggregateId);
    let aggregate: AggregateRoot;
    let fromVersion = 0;

    if (snapshot) {
      // Restore from snapshot
      aggregate = this.createAggregate(aggregateType, aggregateId);
      Object.assign(aggregate, snapshot.state);
      fromVersion = snapshot.version;
    } else {
      // Create new aggregate
      aggregate = this.createAggregate(aggregateType, aggregateId);
    }

    // Apply events after snapshot
    const events = await this.getEvents(aggregateType, aggregateId, fromVersion);
    for (const event of events) {
      aggregate.apply(event);
    }

    return aggregate;
}

  private createAggregate(aggregateType: string, aggregateId: string): AggregateRoot {
    switch (aggregateType) {
      case 'BankAccount':
        return new BankAccount(aggregateId);
      default:
        throw new Error(`Unknown aggregate type: ${aggregateType}`);
    }
}

  getStats(): any {
    return {
      totalEvents: this.globalEventLog.length,
      totalAggregates: this.events.size,
      totalSnapshots: this.snapshots.size,
      eventsByType: this.getEventCountsByType(),
      aggregates: Array.from(this.events.entries()).map(([key, events]) => ({
        aggregate: key,
        eventCount: events.length,
        latestVersion: events[events.length - 1]?.metadata.version || 0
      }))
    };
}

  private getEventCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.globalEventLog) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    }
    return counts;
}
}

class ProjectionManager {
  private projections: Map<string, Projection> = new Map();
  private eventStore: EventStore;
  private projectionHandlers: Map<string, (event: Event) => void> = new Map();

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
    this.initializeProjections();
}

  private initializeProjections(): void {
    // Account Balance Projection
    this.createProjection('AccountBalances', (event: Event) => {
      const projection = this.projections.get('AccountBalances')!;
      const balances = projection.data.balances || {};

      switch (event.eventType) {
        case 'AccountOpened':
          balances[event.aggregateId] = {
            balance: event.data.initialBalance || 0,
            lastUpdated: event.metadata.timestamp
          };
          break;

        case 'MoneyDeposited':
          if (balances[event.aggregateId]) {
            balances[event.aggregateId].balance += event.data.amount;
            balances[event.aggregateId].lastUpdated = event.metadata.timestamp;
          }
          break;

        case 'MoneyWithdrawn':
          if (balances[event.aggregateId]) {
            balances[event.aggregateId].balance -= event.data.amount;
            balances[event.aggregateId].lastUpdated = event.metadata.timestamp;
          }
          break;
      }

      projection.data.balances = balances;
    });

    // Transaction History Projection
    this.createProjection('TransactionHistory', (event: Event) => {
      const projection = this.projections.get('TransactionHistory')!;
      const transactions = projection.data.transactions || [];

      if (event.eventType === 'MoneyDeposited' || event.eventType === 'MoneyWithdrawn') {
        transactions.push({
          accountId: event.aggregateId,
          type: event.eventType === 'MoneyDeposited' ? 'deposit' : 'withdrawal',
          amount: event.data.amount,
          timestamp: event.metadata.timestamp,
          eventId: event.id
        });
      }

      projection.data.transactions = transactions;
    });

    // Daily Summary Projection
    this.createProjection('DailySummary', (event: Event) => {
      const projection = this.projections.get('DailySummary')!;
      const summary = projection.data.summary || { deposits: 0, withdrawals: 0, netChange: 0 };

      if (event.eventType === 'MoneyDeposited') {
        summary.deposits += event.data.amount;
        summary.netChange += event.data.amount;
      } else if (event.eventType === 'MoneyWithdrawn') {
        summary.withdrawals += event.data.amount;
        summary.netChange -= event.data.amount;
      }

      projection.data.summary = summary;
    });
}

  private createProjection(name: string, handler: (event: Event) => void): void {
    this.projections.set(name, {
      name,
      lastProcessedEvent: null,
      lastProcessedVersion: 0,
      data: {}
    });
    this.projectionHandlers.set(name, handler);
}

  async rebuildProjection(name: string): Promise<void> {
    const projection = this.projections.get(name);
    if (!projection) {
      throw new Error(`Projection ${name} not found`);
    }

    const handler = this.projectionHandlers.get(name);
    if (!handler) {
      throw new Error(`No handler for projection ${name}`);
    }

    // Reset projection
    projection.data = {};
    projection.lastProcessedEvent = null;
    projection.lastProcessedVersion = 0;

    // Replay all events
    const events = await this.eventStore.getAllEvents();
    for (const event of events) {
      handler(event);
      projection.lastProcessedEvent = event.id;
      projection.lastProcessedVersion++;
    }

    console.log(`Projection ${name} rebuilt with ${events.length} events`);
}

  async updateProjections(event: Event): Promise<void> {
    for (const [name, handler] of this.projectionHandlers.entries()) {
      const projection = this.projections.get(name)!;
      handler(event);
      projection.lastProcessedEvent = event.id;
      projection.lastProcessedVersion++;
    }
}

  getProjection(name: string): Projection | null {
    return this.projections.get(name) || null;
}

  getAllProjections(): Projection[] {
    return Array.from(this.projections.values());
}
}

class CommandHandler {
  constructor(
    private eventStore: EventStore,
    private projectionManager: ProjectionManager
  ) {}

  async handleOpenAccount(accountId: string, initialBalance: number = 0): Promise<void> {
    const event: Event = {
      id: '',
      aggregateId: accountId,
      aggregateType: 'BankAccount',
      eventType: 'AccountOpened',
      data: { initialBalance },
      metadata: { timestamp: 0, version: 0 }
    };

    await this.eventStore.appendEvent(event);
    await this.projectionManager.updateProjections(event);
}

  async handleDeposit(accountId: string, amount: number): Promise<void> {
    const event: Event = {
      id: '',
      aggregateId: accountId,
      aggregateType: 'BankAccount',
      eventType: 'MoneyDeposited',
      data: { amount },
      metadata: { timestamp: 0, version: 0 }
    };

    await this.eventStore.appendEvent(event);
    await this.projectionManager.updateProjections(event);
}

  async handleWithdrawal(accountId: string, amount: number): Promise<void> {
    const event: Event = {
      id: '',
      aggregateId: accountId,
      aggregateType: 'BankAccount',
      eventType: 'MoneyWithdrawn',
      data: { amount },
      metadata: { timestamp: 0, version: 0 }
    };

    await this.eventStore.appendEvent(event);
    await this.projectionManager.updateProjections(event);
}

  async handleCloseAccount(accountId: string): Promise<void> {
    const event: Event = {
      id: '',
      aggregateId: accountId,
      aggregateType: 'BankAccount',
      eventType: 'AccountClosed',
      data: {},
      metadata: { timestamp: 0, version: 0 }
    };

    await this.eventStore.appendEvent(event);
    await this.projectionManager.updateProjections(event);
}
}

// Initialize event sourcing system
const eventStore = new EventStore();
const projectionManager = new ProjectionManager(eventStore);
const commandHandler = new CommandHandler(eventStore, projectionManager);

/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 * Run with: elide serve --port 3000 server.ts
 */
export default async function fetch(request: Request): Promise<Response> {


  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Command endpoints (writes)
    if (url.pathname === '/commands/open-account' && request.method === 'POST') {
      try {
        const { accountId, initialBalance } = await request.json();
        await commandHandler.handleOpenAccount(accountId, initialBalance || 0);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/commands/deposit' && request.method === 'POST') {
      try {
        const { accountId, amount } = await request.json();
        await commandHandler.handleDeposit(accountId, amount);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/commands/withdraw' && request.method === 'POST') {
      try {
        const { accountId, amount } = await request.json();
        await commandHandler.handleWithdrawal(accountId, amount);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Query endpoints (reads)
    if (url.pathname.startsWith('/queries/account/') && request.method === 'GET') {
      const accountId = url.pathname.split('/').pop();
      if (!accountId) {
        return new Response(JSON.stringify({ error: 'Account ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const aggregate = await eventStore.rehydrateAggregate('BankAccount', accountId);
      if (!aggregate) {
        return new Response(JSON.stringify({ error: 'Account not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(aggregate.getState()), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Event stream endpoints
    if (url.pathname === '/events/stream') {
      const events = await eventStore.getAllEvents();
      return new Response(JSON.stringify(events, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname.startsWith('/events/account/')) {
      const accountId = url.pathname.split('/').pop();
      if (!accountId) {
        return new Response(JSON.stringify({ error: 'Account ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const events = await eventStore.getEvents('BankAccount', accountId);
      return new Response(JSON.stringify(events, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Projection endpoints
    if (url.pathname === '/projections') {
      const projections = projectionManager.getAllProjections();
      return new Response(JSON.stringify(projections, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname.startsWith('/projections/')) {
      const projectionName = url.pathname.split('/').pop();
      const projection = projectionManager.getProjection(projectionName || '');

      if (!projection) {
        return new Response(JSON.stringify({ error: 'Projection not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(projection, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rebuild projection
    if (url.pathname === '/projections/rebuild' && request.method === 'POST') {
      try {
        const { name } = await request.json();
        await projectionManager.rebuildProjection(name);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Stats endpoint
    if (url.pathname === '/stats') {
      const stats = eventStore.getStats();
      return new Response(JSON.stringify(stats, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Event Sourcing System', { status: 200 });
}



if (import.meta.url.includes("server.ts")) {
  console.log('📝 Event Sourcing System ready on port 3000');
  console.log('CQRS Pattern: Commands → Events → Projections');
}
