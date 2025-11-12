# Polyglot Examples - Cross-Language Interoperability with Elide

This showcase demonstrates Elide's powerful polyglot capabilities, enabling seamless interoperability between TypeScript, Python, Ruby, Java, and Kotlin.

## Overview

Elide runs on GraalVM, which provides true polyglot execution where languages can:
- Share objects directly (zero-copy)
- Call functions across language boundaries
- Pass callbacks and async operations
- Share types and data structures
- Handle errors across languages

## Examples

### Basic Interop
1. **[Python ML Model](./examples/01-python-ml-model.ts)** - Use Python ML libraries from TypeScript
2. **[Java JDBC](./examples/02-java-jdbc.ts)** - Use Java JDBC from TypeScript for database access
3. **[Ruby Gems](./examples/03-ruby-gems.ts)** - Use Ruby gems from TypeScript
4. **[Shared Data](./examples/04-shared-data.ts)** - Share objects across languages (zero-copy)

### Advanced Patterns
5. **[TypeScript from Python](./examples/05-typescript-from-python.py)** - Call TypeScript from Python
6. **[Callbacks](./examples/06-callbacks.ts)** - Cross-language callbacks and closures
7. **[Async/Await](./examples/07-async-await.ts)** - Async patterns across languages
8. **[Error Handling](./examples/08-error-handling.ts)** - Error propagation across languages
9. **[Streaming](./examples/09-streaming.ts)** - Streaming data across languages
10. **[Shared Types](./examples/10-shared-types.ts)** - Type safety across languages

### Language-Specific Features
11. **[Java Collections](./examples/11-java-collections.ts)** - Use Java Collections framework
12. **[Python NumPy](./examples/12-python-numpy.ts)** - Use NumPy for data processing
13. **[Ruby ActiveRecord](./examples/13-ruby-activerecord.ts)** - Use Ruby's ActiveRecord ORM
14. **[Kotlin Coroutines](./examples/14-kotlin-coroutines.ts)** - Use Kotlin coroutines from TypeScript
15. **[Python Generators](./examples/15-python-generators.ts)** - Work with Python generators

### Production Patterns
16. **[Java Crypto](./examples/16-java-crypto.ts)** - Use Java's crypto libraries
17. **[Ruby String Utils](./examples/17-ruby-string-utils.ts)** - Use Ruby's powerful string manipulation
18. **[Multi-Language Pipeline](./examples/18-multi-language-pipeline.ts)** - Build data pipelines across languages
19. **[Shared State](./examples/19-shared-state.ts)** - Manage shared state across languages
20. **[Performance Benchmarks](./examples/20-performance-benchmarks.ts)** - Compare polyglot vs native performance

## Running the Examples

### Run Individual Examples
```bash
# Run TypeScript examples
elide run examples/01-python-ml-model.ts

# Run Python examples
elide run examples/05-typescript-from-python.py
```

### Run the Demo Server
```bash
elide serve server.ts
```

Then visit:
- http://localhost:3000/ - All examples with benchmarks
- http://localhost:3000/example/1 - Specific example
- http://localhost:3000/benchmark - Performance comparison

## Key Concepts

### Zero-Copy Data Sharing
Objects are shared directly between languages without serialization overhead:
```typescript
const pythonData = Python.eval("{'key': 'value'}");
// pythonData is a direct reference, not a copy
```

### Cross-Language Function Calls
Functions can be called across languages with automatic type conversion:
```typescript
const result = pythonModule.some_function(arg1, arg2);
```

### Bidirectional Communication
Any language can call any other language:
- TypeScript → Python → Java → Ruby → back to TypeScript
- Callbacks work across all boundaries

### Performance Characteristics
- **First Call**: ~1-5ms overhead (JIT warming)
- **Subsequent Calls**: <0.1ms overhead (near-native)
- **Data Transfer**: Zero-copy for compatible types
- **Type Conversion**: Automatic with minimal overhead

## Requirements

- Elide beta11-rc1 or later
- Python language pack (for Python examples)
- Ruby language pack (for Ruby examples)
- Java/Kotlin support (built-in)

## Performance Tips

1. **Minimize Language Boundaries**: Keep hot loops in one language
2. **Batch Operations**: Pass arrays instead of calling per-item
3. **Cache References**: Reuse imported modules and functions
4. **Use Native Types**: Primitive types transfer fastest
5. **Profile First**: Measure before optimizing

## Use Cases

### When to Use Polyglot
- Leverage existing libraries from other ecosystems
- Use language-specific strengths (Python ML, Java enterprise, Ruby DSLs)
- Migrate gradually between languages
- Share code across team language preferences

### When to Stay Monoglot
- Performance-critical tight loops
- Simple applications without external dependencies
- When team only knows one language

## Learn More

- [Elide Documentation](https://elide.dev)
- [GraalVM Polyglot Guide](https://www.graalvm.org/latest/reference-manual/polyglot-programming/)
- [Example Source Code](./examples/)

## License

MIT - See LICENSE file for details
