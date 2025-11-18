# stryker - Mutation Testing

**Pure TypeScript implementation of stryker for Elide.**

Based on [stryker](https://www.npmjs.com/package/stryker) (~500K+ downloads/week)

## Features

- Mutation testing
- Test quality analysis
- Multiple mutators
- HTML/JSON reports
- Zero dependencies

## Installation

```bash
elide install @elide/stryker
```

## Usage

```typescript
import Stryker from './elide-stryker.ts';

const stryker = new Stryker({
  mutator: ['arithmetic', 'conditional', 'logical', 'block'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  concurrency: 4,
  files: ['src/**/*.ts', 'test/**/*.spec.ts'],
  mutate: ['src/**/*.ts'],
});

// Run mutation testing
const score = await stryker.run();

console.log(`Mutation score: ${score.mutationScore}%`);

// Generate reports
stryker.generateReport('html');
stryker.generateReport('json');

// Get mutants
const mutants = stryker.getMutants();
```

## Configuration

```typescript
interface StrykerOptions {
  mutator?: string[];           // Mutator types
  testRunner?: string;          // Test runner (jest, mocha, etc)
  coverageAnalysis?: string;    // Coverage strategy
  reporters?: string[];         // Report formats
  concurrency?: number;         // Parallel execution
  timeoutMS?: number;           // Test timeout
  files?: string[];             // Files to include
  mutate?: string[];            // Files to mutate
}
```

## Mutators

Available mutators:
- `arithmetic` - +, -, *, /, %
- `block` - Remove code blocks
- `conditional` - <, >, <=, >=, ==, !=
- `logical` - &&, ||, !
- `string` - String literals
- `unary` - +, -, ~, !

## Mutation Score

The mutation score indicates test quality:
- **80-100%** - Excellent
- **60-79%** - Good
- **Below 60%** - Needs improvement

## Results

```typescript
interface MutationScore {
  killed: number;          // Tests caught the mutation
  survived: number;        // Mutation went undetected
  noCoverage: number;      // No tests cover the code
  timeout: number;         // Test timeout
  compileError: number;    // Compilation failed
  total: number;           // Total mutants
  mutationScore: number;   // Score percentage
}
```

## Mutant Status

- **Killed** - Tests detected the mutation (good)
- **Survived** - Mutation not detected (bad - improve tests)
- **NoCoverage** - No tests cover the code
- **Timeout** - Tests took too long
- **CompileError** - Mutation broke compilation

## Performance

- **500K+ downloads/week** - Popular mutation testing framework

## License

MIT
