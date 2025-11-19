# Polyglot Showcases

This directory contains 20 comprehensive polyglot showcases demonstrating REAL cross-language integration using Elide's polyglot runtime.

**Key Feature:** These showcases use DIRECT imports between languages - NOT HTTP calls! This means <1ms overhead with zero serialization.

## All 20 Showcases

### Python + TypeScript (8 showcases)

1. **ml-model-serving** - Python TensorFlow + TypeScript API
   - Location: `/home/user/elide-showcases/original/showcases/ml-model-serving`
   - Files: `model.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: TensorFlow model serving, batch predictions, model registry

2. **data-science-pipeline** - Python Pandas + TypeScript orchestration
   - Location: `/home/user/elide-showcases/original/showcases/data-science-pipeline`
   - Files: `analytics.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Data aggregation, filtering, statistics, pivot tables

3. **scientific-computing** - Python NumPy/SciPy + TypeScript UI
   - Location: `/home/user/elide-showcases/original/showcases/scientific-computing`
   - Files: `numpy_compute.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Array operations, matrix math, FFT, linear algebra

4. **image-processing** - Python PIL + TypeScript API
   - Location: `/home/user/elide-showcases/original/showcases/image-processing`
   - Files: `image_proc.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Image resizing, filters, metadata extraction

5. **nlp-processing** - Python spaCy + TypeScript API
   - Location: `/home/user/elide-showcases/original/showcases/nlp-processing`
   - Files: `nlp_engine.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Tokenization, entity extraction, sentiment analysis

6. **time-series-analysis** - Python statsmodels + TypeScript dashboards
   - Location: `/home/user/elide-showcases/original/showcases/time-series-analysis`
   - Files: `timeseries.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Trend detection, forecasting, seasonality analysis

7. **geospatial-analysis** - Python GeoPandas + TypeScript maps
   - Location: `/home/user/elide-showcases/original/showcases/geospatial-analysis`
   - Files: `geo_processor.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Distance calculations, nearest neighbor search

8. **audio-processing** - Python librosa + TypeScript API
   - Location: `/home/user/elide-showcases/original/showcases/audio-processing`
   - Files: `audio_processor.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Feature extraction, tempo detection, spectral analysis

9. **video-analysis** - Python OpenCV + TypeScript streaming
   - Location: `/home/user/elide-showcases/original/showcases/video-analysis`
   - Files: `video_analyzer.py`, `server.ts`, `examples.ts`, `README.md`
   - Features: Metadata extraction, object detection, frame extraction

### Java + TypeScript (8 showcases)

10. **java-spring-integration** - Java Spring beans + TypeScript frontend
    - Location: `/home/user/elide-showcases/original/showcases/java-spring-integration`
    - Files: `SpringBeans.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: Spring dependency injection, bean management, events

11. **database-orm** - Java Hibernate + TypeScript business logic
    - Location: `/home/user/elide-showcases/original/showcases/database-orm`
    - Files: `HibernateORM.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: Entity management, sessions, queries

12. **pdf-generation** - Java iText + TypeScript API
    - Location: `/home/user/elide-showcases/original/showcases/pdf-generation`
    - Files: `PDFGenerator.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: Document creation, invoice generation, metadata

13. **xml-processing** - Java JAXB + TypeScript API
    - Location: `/home/user/elide-showcases/original/showcases/xml-processing`
    - Files: `XMLProcessor.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: XML parsing, generation, schema validation

14. **crypto-operations** - Java BouncyCastle + TypeScript API
    - Location: `/home/user/elide-showcases/original/showcases/crypto-operations`
    - Files: `CryptoUtils.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: SHA-256, HMAC, key generation, encryption

15. **graph-algorithms** - Java JGraphT + TypeScript visualization
    - Location: `/home/user/elide-showcases/original/showcases/graph-algorithms`
    - Files: `GraphLib.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: Graph creation, shortest path, cycle detection

16. **compression-tools** - Java compression + TypeScript API
    - Location: `/home/user/elide-showcases/original/showcases/compression-tools`
    - Files: `Compressor.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: GZIP compression, decompression, analysis

17. **blockchain-utils** - Java Web3j + TypeScript dApp
    - Location: `/home/user/elide-showcases/original/showcases/blockchain-utils`
    - Files: `Web3Utils.java`, `server.ts`, `examples.ts`, `README.md`
    - Features: Balance queries, transactions, block info

### Ruby + TypeScript (4 showcases)

18. **ruby-rails-patterns** - Ruby Rails-style ORM + TypeScript
    - Location: `/home/user/elide-showcases/original/showcases/ruby-rails-patterns`
    - Files: `active_record.rb`, `server.ts`, `examples.ts`, `README.md`
    - Features: ActiveRecord pattern, models, relationships

19. **background-jobs** - Ruby Sidekiq patterns + TypeScript API
    - Location: `/home/user/elide-showcases/original/showcases/background-jobs`
    - Files: `job_queue.rb`, `server.ts`, `examples.ts`, `README.md`
    - Features: Job enqueueing, processing, queue statistics

20. **testing-framework** - Ruby RSpec patterns + TypeScript tests
    - Location: `/home/user/elide-showcases/original/showcases/testing-framework`
    - Files: `rspec_runner.rb`, `server.ts`, `examples.ts`, `README.md`
    - Features: Test suites, expectations, assertions, reporting

## File Structure (Each Showcase)

Every showcase contains exactly 4 files:

1. **Language File** (`.py`, `.java`, or `.rb`) - Implementation in the target language
2. **server.ts** - HTTP API server demonstrating polyglot calls
3. **examples.ts** - Usage examples showing direct cross-language imports
4. **README.md** - Documentation and quick start guide

## Key Features

### REAL Polyglot Integration
- Direct imports: `import { function } from "./file.py"`
- Zero serialization overhead
- <1ms cross-language call overhead
- Shared memory between languages
- Single process execution

### NOT HTTP Calls
Traditional approach:
```
TypeScript → HTTP Request → Python Service (50-100ms)
```

Elide polyglot approach:
```
TypeScript → Direct Function Call → Python (<1ms)
```

This is 50-100x faster!

## Running the Showcases

Each showcase can be run independently:

```bash
# Navigate to any showcase directory
cd /home/user/elide-showcases/original/showcases/ml-model-serving

# Run the server
elide run server.ts

# Or run examples
elide run examples.ts
```

## Quick Start Examples

### Example 1: Python ML Model from TypeScript
```typescript
// Direct Python import!
import { default_model } from "./model.py";

// Call Python function directly
const prediction = default_model.predict(features);
```

### Example 2: Java Spring Beans from TypeScript
```typescript
// Direct Java import!
import { getUserService } from "./SpringBeans.java";

// Use Java Spring beans in TypeScript
const userService = getUserService();
const user = userService.createUser("Alice", "alice@example.com");
```

### Example 3: Ruby ActiveRecord from TypeScript
```typescript
// Direct Ruby import!
import { create_user, get_all_users } from "./active_record.rb";

// Use Ruby ORM patterns in TypeScript
const user = create_user("Bob", "bob@example.com", "admin");
const users = get_all_users();
```

## Technology Stack

- **Runtime**: Elide (GraalVM-based polyglot runtime)
- **Languages**: TypeScript, Python, Java, Ruby
- **Integration**: Direct cross-language imports (zero-copy, shared memory)
- **Performance**: <1ms cross-language call overhead

## Statistics

- Total Showcases: **20**
- Total Files: **80** (20 × 4 files each)
- Languages: **4** (TypeScript, Python, Java, Ruby)
- Python Showcases: **9**
- Java Showcases: **8**
- Ruby Showcases: **3**
- TypeScript: **All 20** (orchestration layer)

## Use Cases

1. **ML/AI Services**: Python ML models with TypeScript APIs
2. **Data Science**: Pandas/NumPy analytics with TypeScript dashboards
3. **Enterprise Integration**: Java Spring/Hibernate with TypeScript frontends
4. **Background Processing**: Ruby Sidekiq patterns with TypeScript APIs
5. **Image/Video Processing**: Python OpenCV with TypeScript streaming
6. **Cryptography**: Java BouncyCastle with TypeScript APIs
7. **Blockchain**: Java Web3j with TypeScript dApps
8. **Testing**: RSpec patterns in TypeScript test suites

## Why This Matters

### Traditional Microservices
- Multiple deployments
- HTTP overhead (50-100ms per call)
- JSON serialization overhead
- Network latency
- Complex debugging

### Elide Polyglot
- Single deployment
- Direct calls (<1ms)
- Zero serialization (shared memory)
- No network overhead
- Single-process debugging

**Result: 50-100x faster with simpler architecture!**

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [GraalVM Polyglot](https://www.graalvm.org/latest/reference-manual/polyglot-programming/)

## License

Apache 2.0
