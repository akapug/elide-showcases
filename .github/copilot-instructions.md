# AI Agent Instructions for Elide Showcases

## Repository Purpose
This repository demonstrates Elide's polyglot runtime capabilities through 251 working examples. The goal is to prove that TypeScript code can run efficiently across TypeScript, Python, Ruby, and Java with zero dependencies.

## Project Structure
Two main divisions with strict organization:
```
/converted/           # npm package implementations
  ├── utilities/     # 81 single-purpose packages (uuid, ms, chalk...)
  └── showcases/     # 4 complex packages (marked, validator...)
/original/           # New polyglot examples
  ├── showcases/     # 50+ microservice/AI examples
  └── examples/      # Basic usage examples
```

## Key Development Patterns

### 1. Polyglot Implementation Pattern
Each utility follows this structure:
```
utility-name/
  ├── elide-utility.ts    # TypeScript implementation
  ├── elide-utility.py    # Python binding
  ├── elide-utility.rb    # Ruby binding
  ├── ElideUtilityExample.java  # Java binding
  ├── benchmark.ts        # Performance tests
  └── CASE_STUDY.md      # Real-world usage example
```

### 2. Performance Testing
- Every utility must have a `benchmark.ts` file
- Benchmarks should test both Elide and native implementations
- Example: `/converted/utilities/uuid/benchmark.ts`

### 3. Documentation Standards
Every component requires:
- Implementation in all 4 languages
- Performance benchmarks with metrics
- Case study showing real usage
- API documentation matching original package

## Development Workflow

1. Running Examples:
```bash
elide example.ts|py|rb    # Run any example
elide benchmark.ts        # Run benchmarks
```

2. Testing Pattern:
- Performance tests in `benchmark.ts`
- Integration tests in `test/`
- Cold start measurements required

## Common Pitfalls

1. Language Interop
- Use `elide.interop` for cross-language calls
- Keep type definitions in sync across languages
- See: `/converted/utilities/uuid/` for example

2. Performance Testing
- Always measure cold start time
- Compare against native implementations
- Use consistent benchmark parameters

## Key Files to Study
1. `/converted/utilities/uuid/` - Complete example of polyglot implementation
2. `/original/showcases/velocity/` - High-performance web framework showcase
3. `/original/showcases/nanochat-lite/` - Real-world AI application example

## Integration Points
- All utilities are zero-dependency
- Native language bindings through Elide runtime
- Performance monitoring through standard benchmarks