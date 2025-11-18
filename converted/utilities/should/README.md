# should - BDD Assertion Library

**Pure TypeScript implementation of should for Elide.**

Based on [should](https://www.npmjs.com/package/should) (~5M+ downloads/week)

## Features

- Expressive BDD syntax
- Chainable assertions
- Readable test code
- Zero dependencies

## Installation

```bash
elide install @elide/should
```

## Usage

```typescript
import should from './elide-should.ts';

should(2 + 2).equal(4);
should('test').be.a.type('string');
should(true).be.true;
should([1, 2, 3]).have.length(3);
should(() => { throw new Error(); }).throw();
```

## API Reference

- `equal(value)` - Deep equality
- `exactly(value)` - Strict equality
- `type(name)` - Type check
- `.ok` / `.true` / `.false` / `.null`
- `length(n)` - Length check
- `match(pattern)` - Pattern match
- `containEql(item)` - Array contains
- `property(key, value?)` - Property check
- `throw(pattern?)` - Exception check

## Performance

- **5M+ downloads/week** - Popular BDD library

## License

MIT
