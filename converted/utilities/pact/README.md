# pact - Contract Testing

**Pure TypeScript implementation of pact for Elide.**

Based on [pact](https://www.npmjs.com/package/pact) (~500K+ downloads/week)

## Features

- Consumer-driven contracts
- Mock provider server
- Provider verification
- Contract publishing
- Zero dependencies

## Installation

```bash
elide install @elide/pact
```

## Usage

### Consumer Test

```typescript
import Pact from './elide-pact.ts';

const pact = new Pact({
  consumer: 'UserService',
  provider: 'AuthService',
  port: 8080,
});

// Setup
await pact.setup();

// Define interaction
pact.addInteraction({
  state: 'user exists',
  uponReceiving: 'a request for user authentication',
  withRequest: {
    method: 'POST',
    path: '/auth/login',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'alice', password: 'secret' },
  },
  willRespondWith: {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { token: 'abc123', userId: 1 },
  },
});

// Run consumer tests against mock
// Your test code here...

// Verify and write pact
await pact.verify();
await pact.finalize();
await pact.cleanup();
```

### Provider Verification

```typescript
await Pact.verifyProvider({
  provider: 'AuthService',
  providerBaseUrl: 'http://localhost:3000',
  pactUrls: ['./pacts/UserService-AuthService.json'],
  providerStatesSetupUrl: 'http://localhost:3000/setup',
});
```

### Publish to Broker

```typescript
await Pact.publishPacts({
  pactFilesOrDirs: ['./pacts'],
  pactBroker: 'https://pact-broker.example.com',
  pactBrokerToken: 'your-token',
  consumerVersion: '1.0.0',
  tags: ['main', 'production'],
});
```

## API Reference

### new Pact(options)

Create a pact instance.

```typescript
interface PactOptions {
  consumer: string;     // Consumer name
  provider: string;     // Provider name
  port?: number;        // Mock server port
  dir?: string;         // Pact files directory
  log?: string;         // Log file path
  logLevel?: string;    // Log level
}
```

### Instance Methods

- `addInteraction(interaction)` - Add interaction
- `setup()` - Start mock server
- `verify()` - Verify interactions
- `finalize()` - Write pact file
- `cleanup()` - Stop mock server
- `mockServerURL()` - Get mock URL

### Static Methods

- `Pact.verifyProvider(options)` - Verify provider
- `Pact.publishPacts(options)` - Publish pacts

### Interaction

```typescript
interface Interaction {
  state?: string;
  uponReceiving: string;
  withRequest: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  };
  willRespondWith: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}
```

## Performance

- **500K+ downloads/week** - Industry standard for contract testing

## License

MIT
