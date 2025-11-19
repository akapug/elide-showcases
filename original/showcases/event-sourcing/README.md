# Event Sourcing Implementation

A production-ready event sourcing system demonstrating CQRS patterns with Elide.

## Features

- **Event Store**: Immutable event log with full history
- **Event Replay**: Reconstruct aggregate state from events
- **Projections**: Multiple read models from same event stream
- **Snapshots**: Performance optimization for large event streams
- **CQRS**: Complete command-query separation
- **Aggregate Roots**: Domain-driven design patterns

## Architecture

The system implements event sourcing with CQRS:

1. **Command Side**: Handles writes, produces events
2. **Event Store**: Persists all events immutably
3. **Projection Side**: Builds read models from events
4. **Query Side**: Fast reads from optimized projections

```
Commands → Event Store → Projections → Queries
```

## Core Concepts

### Event Sourcing
Instead of storing current state, we store all events that led to that state.

### CQRS
Separate models for writes (commands) and reads (queries).

### Projections
Read models built by replaying events, optimized for specific queries.

### Snapshots
Periodic state captures to speed up aggregate reconstruction.

## API Endpoints

### Commands (Write Operations)

#### POST /commands/open-account
Open a new bank account.

```bash
curl -X POST http://localhost:3000/commands/open-account \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc-123",
    "initialBalance": 1000
  }'
```

#### POST /commands/deposit
Deposit money to an account.

```bash
curl -X POST http://localhost:3000/commands/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc-123",
    "amount": 500
  }'
```

#### POST /commands/withdraw
Withdraw money from an account.

```bash
curl -X POST http://localhost:3000/commands/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "acc-123",
    "amount": 200
  }'
```

### Queries (Read Operations)

#### GET /queries/account/{accountId}
Get current account state (reconstructed from events).

```bash
curl http://localhost:3000/queries/account/acc-123
```

Response:
```json
{
  "id": "acc-123",
  "version": 5,
  "balance": 1300,
  "isActive": true,
  "transactionCount": 4,
  "transactions": [
    {
      "type": "deposit",
      "amount": 500,
      "timestamp": 1234567890
    }
  ]
}
```

### Event Streams

#### GET /events/stream
Get all events in the system.

```bash
curl http://localhost:3000/events/stream
```

#### GET /events/account/{accountId}
Get all events for a specific account.

```bash
curl http://localhost:3000/events/account/acc-123
```

Response:
```json
[
  {
    "id": "evt-001",
    "aggregateId": "acc-123",
    "aggregateType": "BankAccount",
    "eventType": "AccountOpened",
    "data": {
      "initialBalance": 1000
    },
    "metadata": {
      "timestamp": 1234567890,
      "version": 1
    }
  },
  {
    "id": "evt-002",
    "aggregateId": "acc-123",
    "aggregateType": "BankAccount",
    "eventType": "MoneyDeposited",
    "data": {
      "amount": 500
    },
    "metadata": {
      "timestamp": 1234567900,
      "version": 2
    }
  }
]
```

### Projections

#### GET /projections
List all projections and their status.

```bash
curl http://localhost:3000/projections
```

#### GET /projections/AccountBalances
View the account balances projection.

```bash
curl http://localhost:3000/projections/AccountBalances
```

Response:
```json
{
  "name": "AccountBalances",
  "lastProcessedEvent": "evt-015",
  "lastProcessedVersion": 15,
  "data": {
    "balances": {
      "acc-123": {
        "balance": 1300,
        "lastUpdated": 1234567890
      },
      "acc-456": {
        "balance": 5000,
        "lastUpdated": 1234567900
      }
    }
  }
}
```

#### GET /projections/TransactionHistory
View all transactions across accounts.

```bash
curl http://localhost:3000/projections/TransactionHistory
```

#### GET /projections/DailySummary
View daily transaction summary.

```bash
curl http://localhost:3000/projections/DailySummary
```

Response:
```json
{
  "name": "DailySummary",
  "data": {
    "summary": {
      "deposits": 15000,
      "withdrawals": 3000,
      "netChange": 12000
    }
  }
}
```

#### POST /projections/rebuild
Rebuild a projection by replaying all events.

```bash
curl -X POST http://localhost:3000/projections/rebuild \
  -H "Content-Type: application/json" \
  -d '{ "name": "AccountBalances" }'
```

### Statistics

#### GET /stats
View event store statistics.

```bash
curl http://localhost:3000/stats
```

Response:
```json
{
  "totalEvents": 127,
  "totalAggregates": 15,
  "totalSnapshots": 3,
  "eventsByType": {
    "AccountOpened": 15,
    "MoneyDeposited": 89,
    "MoneyWithdrawn": 23
  },
  "aggregates": [
    {
      "aggregate": "BankAccount:acc-123",
      "eventCount": 12,
      "latestVersion": 12
    }
  ]
}
```

## Example Workflows

### 1. Complete Account Lifecycle

```bash
# Open account
curl -X POST http://localhost:3000/commands/open-account \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acc-999","initialBalance":1000}'

# Make deposits
curl -X POST http://localhost:3000/commands/deposit \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acc-999","amount":500}'

curl -X POST http://localhost:3000/commands/deposit \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acc-999","amount":250}'

# Make withdrawal
curl -X POST http://localhost:3000/commands/withdraw \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acc-999","amount":100}'

# Query current state
curl http://localhost:3000/queries/account/acc-999

# View event history
curl http://localhost:3000/events/account/acc-999

# Check projection
curl http://localhost:3000/projections/AccountBalances
```

### 2. Event Replay

```bash
# View all events
curl http://localhost:3000/events/stream

# Rebuild projection from events
curl -X POST http://localhost:3000/projections/rebuild \
  -H "Content-Type: application/json" \
  -d '{"name":"TransactionHistory"}'

# Verify rebuilt projection
curl http://localhost:3000/projections/TransactionHistory
```

### 3. Analytics

```bash
# Get system statistics
curl http://localhost:3000/stats

# View daily summary
curl http://localhost:3000/projections/DailySummary

# View transaction history
curl http://localhost:3000/projections/TransactionHistory
```

## Event Types

### AccountOpened
```json
{
  "eventType": "AccountOpened",
  "data": {
    "initialBalance": 1000
  }
}
```

### MoneyDeposited
```json
{
  "eventType": "MoneyDeposited",
  "data": {
    "amount": 500
  }
}
```

### MoneyWithdrawn
```json
{
  "eventType": "MoneyWithdrawn",
  "data": {
    "amount": 200
  }
}
```

### AccountClosed
```json
{
  "eventType": "AccountClosed",
  "data": {}
}
```

## Snapshots

Snapshots are automatically created every 10 events to optimize aggregate reconstruction:

```json
{
  "aggregateId": "acc-123",
  "aggregateType": "BankAccount",
  "version": 20,
  "state": {
    "id": "acc-123",
    "balance": 5000,
    "isActive": true,
    "transactions": [...]
  },
  "timestamp": 1234567890
}
```

## Benefits of Event Sourcing

### 1. Complete Audit Trail
Every change is recorded as an event, providing full history.

### 2. Time Travel
Reconstruct state at any point in time by replaying events.

### 3. Multiple Read Models
Create different projections for different use cases from same events.

### 4. Debugging
Reproduce bugs by replaying exact event sequence.

### 5. Analytics
Analyze historical data and trends from event stream.

### 6. Compliance
Built-in audit log for regulatory requirements.

## CQRS Benefits

### 1. Scalability
Scale read and write sides independently.

### 2. Optimization
Optimize projections for specific query patterns.

### 3. Flexibility
Add new projections without affecting existing code.

### 4. Performance
Fast reads from denormalized projections.

## Enterprise Use Cases

- **Banking Systems**: Full transaction history and audit trails
- **E-commerce**: Order history and inventory tracking
- **Healthcare**: Patient record changes with complete audit
- **Gaming**: Player actions and state reconstruction
- **IoT**: Sensor events and time-series analysis
- **Supply Chain**: Product journey and provenance tracking

## Running the System

```bash
elide serve server.ts
```

The event sourcing system will start on `http://localhost:3000`.

## Advanced Patterns

### Event Versioning
Handle schema changes in events over time.

### Event Upcasting
Convert old event formats to new ones during replay.

### Saga Patterns
Coordinate long-running transactions across aggregates.

### Process Managers
Orchestrate complex business workflows.

## Production Considerations

- **Event Store**: Use persistent storage (PostgreSQL, EventStoreDB)
- **Projections**: Store in optimized databases (Redis, MongoDB)
- **Event Bus**: Use message queues (Kafka, RabbitMQ)
- **Snapshots**: Tune snapshot frequency based on event volume
- **Versioning**: Plan for event schema evolution
- **Archival**: Archive old events for compliance
- **Monitoring**: Track projection lag and event processing time

## Testing Event Sourcing

Event sourcing makes testing easier:

```typescript
// Given (events that happened)
const events = [
  { type: 'AccountOpened', data: { balance: 1000 } },
  { type: 'MoneyDeposited', data: { amount: 500 } }
];

// When (new event)
events.push({ type: 'MoneyWithdrawn', data: { amount: 200 } });

// Then (verify state)
const account = rehydrate(events);
expect(account.balance).toBe(1300);
```

## Why Elide?

This showcase demonstrates Elide's capabilities for event sourcing:

- **Performance**: Fast event processing and replay
- **Type Safety**: TypeScript for reliable event handling
- **Simplicity**: Clean implementation without heavy frameworks
- **Standards**: Web-standard APIs throughout
- **Production Ready**: Suitable for real-world event-driven systems

## Further Reading

- Domain-Driven Design by Eric Evans
- Implementing Domain-Driven Design by Vaughn Vernon
- Event Sourcing pattern on Microsoft Architecture Center
- CQRS Journey by Microsoft patterns & practices
