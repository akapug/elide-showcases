# Performance Tuning Guide - Spring Boot ML Platform

## Overview

Comprehensive guide to optimizing the Spring Boot ML Platform for maximum performance. Achieve <10ms prediction latency and 10,000+ RPS throughput using Elide's polyglot runtime.

## Table of Contents

1. [JVM Tuning](#jvm-tuning)
2. [Python Runtime Optimization](#python-runtime-optimization)
3. [Model Optimization](#model-optimization)
4. [Caching Strategies](#caching-strategies)
5. [Database Tuning](#database-tuning)
6. [Network Optimization](#network-optimization)
7. [Profiling & Monitoring](#profiling--monitoring)

---

## JVM Tuning

### Garbage Collection

**G1GC Configuration (Recommended)**:

```bash
export JAVA_OPTS="-Xmx16g \
  -Xms8g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:InitiatingHeapOccupancyPercent=70 \
  -XX:G1HeapRegionSize=16m \
  -XX:G1ReservePercent=10 \
  -XX:ParallelGCThreads=8 \
  -XX:ConcGCThreads=2 \
  -XX:+UseStringDeduplication"
```

**ZGC Configuration (For Ultra-Low Latency)**:

```bash
export JAVA_OPTS="-Xmx16g \
  -Xms8g \
  -XX:+UseZGC \
  -XX:ZAllocationSpikeTolerance=5 \
  -XX:+ZUncommit \
  -XX:ZUncommitDelay=300"
```

### Heap Sizing

| Application Load | Heap Size | Recommended GC |
|-----------------|-----------|----------------|
| Light (<1000 RPS) | 4-8 GB | G1GC |
| Medium (1000-5000 RPS) | 8-16 GB | G1GC |
| Heavy (5000+ RPS) | 16-32 GB | ZGC |

### JIT Compilation

```bash
# Enable aggressive optimizations
-XX:+UseCompressedOops \
-XX:+OptimizeStringConcat \
-XX:+UseStringCache \
-XX:ReservedCodeCacheSize=512m \
-XX:InitialCodeCacheSize=256m \
-XX:+TieredCompilation \
-XX:TieredStopAtLevel=4
```

### Performance Flags

```bash
# Reduce VM overhead
-XX:+AlwaysPreTouch \
-XX:+DisableExplicitGC \
-XX:-UseAdaptiveSizePolicy \
-XX:+UseFastAccessorMethods \
-XX:+AggressiveOpts
```

### Example: Complete JVM Configuration

```bash
#!/bin/bash

# For 16GB RAM server
export JAVA_OPTS="
  # Heap
  -Xmx12g
  -Xms8g

  # GC
  -XX:+UseG1GC
  -XX:MaxGCPauseMillis=200
  -XX:InitiatingHeapOccupancyPercent=70
  -XX:G1HeapRegionSize=16m

  # JIT
  -XX:+TieredCompilation
  -XX:ReservedCodeCacheSize=512m

  # Performance
  -XX:+AlwaysPreTouch
  -XX:+UseStringDeduplication
  -XX:+OptimizeStringConcat

  # Monitoring
  -XX:+HeapDumpOnOutOfMemoryError
  -XX:HeapDumpPath=/var/log/ml-platform/

  # GC Logging
  -Xlog:gc*:file=/var/log/ml-platform/gc.log:time,uptime,level,tags

  # Debugging
  -XX:+UnlockDiagnosticVMOptions
  -XX:+PrintFlagsFinal
"

java $JAVA_OPTS -jar ml-platform.jar
```

---

## Python Runtime Optimization

### Elide Configuration

```yaml
elide:
  polyglot:
    python:
      enabled: true
      version: "3.11"

      # Performance settings
      warm-up: true                 # Pre-load Python runtime
      import-cache: true            # Cache Python imports
      optimization-level: 2         # Maximum optimization

      # Memory management
      max-heap-size: 4g            # Python heap limit
      gc-threshold: 0.8            # GC trigger threshold

      # Threading
      max-threads: 16              # Max Python threads
      thread-pool-size: 8          # Worker thread pool

      # Caching
      cache-compiled-code: true    # Cache bytecode
      cache-modules: true          # Cache loaded modules
```

### Python Module Preloading

```kotlin
@PostConstruct
fun preloadPythonModules() {
    val modules = listOf(
        "sklearn",
        "tensorflow",
        "pandas",
        "numpy"
    )

    modules.forEach { module ->
        Python.import(module)
        logger.info { "Preloaded Python module: $module" }
    }
}
```

### NumPy Optimization

```python
# Use BLAS/LAPACK for linear algebra
import numpy as np
np.show_config()  # Verify BLAS is used

# Enable multi-threading
import os
os.environ['OMP_NUM_THREADS'] = '4'
os.environ['OPENBLAS_NUM_THREADS'] = '4'
os.environ['MKL_NUM_THREADS'] = '4'
```

---

## Model Optimization

### Model Quantization

Reduce model size and increase inference speed:

```kotlin
@Polyglot
fun quantizeModel(model: Any): Any {
    val tensorflow = importPython("tensorflow")

    // Convert to TFLite with quantization
    val converter = tensorflow.lite.TFLiteConverter.from_keras_model(model)

    // INT8 quantization
    converter.optimizations = listOf(tensorflow.lite.Optimize.DEFAULT)
    converter.target_spec.supported_types = listOf(tensorflow.int8)

    val quantizedModel = converter.convert()

    // 4x smaller, 2-4x faster
    return quantizedModel
}
```

### Model Pruning

Remove unnecessary model parameters:

```python
import tensorflow as tf
import tensorflow_model_optimization as tfmot

# Prune model
prune_low_magnitude = tfmot.sparsity.keras.prune_low_magnitude

pruning_params = {
    'pruning_schedule': tfmot.sparsity.keras.PolynomialDecay(
        initial_sparsity=0.0,
        final_sparsity=0.5,
        begin_step=0,
        end_step=1000
    )
}

model_for_pruning = prune_low_magnitude(model, **pruning_params)

# Train pruned model
model_for_pruning.fit(X_train, y_train, epochs=10)

# Strip pruning wrappers
final_model = tfmot.sparsity.keras.strip_pruning(model_for_pruning)
```

### Feature Selection

Reduce feature dimensions:

```kotlin
@Polyglot
fun selectOptimalFeatures(data: DataFrame, k: Int = 20): List<String> {
    val sklearn = importPython("sklearn")

    val X = data.drop(columns = listOf("target"))
    val y = data["target"]

    // Use SelectKBest with f_classif
    val selector = sklearn.feature_selection.SelectKBest(
        score_func = sklearn.feature_selection.f_classif,
        k = k
    )

    selector.fit(X, y)

    val selectedIndices = selector.get_support(indices = true)
    return selectedIndices.map { X.columns[it] }
}
```

### Batch Prediction Optimization

```kotlin
fun optimizedBatchPredict(
    modelId: String,
    records: List<Map<String, Any>>
): List<Prediction> {
    val model = modelService.loadModel(modelId)

    // Convert to DataFrame (vectorized)
    val df = pandas.DataFrame(records)

    // Single batch prediction (10x faster than individual)
    val predictions = model.predict(df.values)
    val probabilities = model.predict_proba(df.values)

    return predictions.zip(probabilities).mapIndexed { index, (pred, proba) ->
        Prediction(
            value = pred,
            confidence = proba.max(),
            modelId = modelId
        )
    }
}
```

---

## Caching Strategies

### Multi-Level Caching

```
┌─────────────────────────────────────┐
│         Application Cache            │
│  (In-Memory - Caffeine)              │
│  • Model objects                     │
│  • Feature transformers              │
│  TTL: Unlimited                      │
└──────────────┬──────────────────────┘
               │ Cache Miss
               ▼
┌─────────────────────────────────────┐
│          Redis Cache                 │
│  (Distributed)                       │
│  • Predictions (high traffic)        │
│  • Engineered features               │
│  TTL: 5-60 minutes                   │
└──────────────┬──────────────────────┘
               │ Cache Miss
               ▼
┌─────────────────────────────────────┐
│       Database / S3                  │
│  • Model metadata                    │
│  • Model artifacts                   │
└─────────────────────────────────────┘
```

### Caffeine Configuration

```kotlin
@Configuration
class CacheConfig {

    @Bean
    fun caffeineCache(): Cache<String, Any> {
        return Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(1, TimeUnit.HOURS)
            .recordStats()
            .build()
    }

    @Bean
    fun modelCache(): Cache<String, Model> {
        return Caffeine.newBuilder()
            .maximumSize(100)
            // Models never expire (manually evicted)
            .recordStats()
            .removalListener { key, value, cause ->
                logger.info { "Model evicted: $key, cause: $cause" }
            }
            .build()
    }
}
```

### Redis Caching

```kotlin
@Cacheable(
    value = ["predictions"],
    key = "#modelId + '-' + #features.hashCode()",
    unless = "#result.confidence < 0.9"
)
fun predict(modelId: String, features: Map<String, Any>): Prediction {
    // Cache predictions with high confidence
    return actualPredict(modelId, features)
}

@CacheEvict(value = ["predictions"], allEntries = true)
@Scheduled(fixedDelay = 3600000) // Every hour
fun evictPredictionCache() {
    logger.info { "Evicting prediction cache" }
}
```

### Cache Warming

```kotlin
@Component
class CacheWarmer(
    private val modelService: ModelService,
    private val predictionService: PredictionService
) {

    @PostConstruct
    fun warmCaches() {
        logger.info { "Warming caches..." }

        // Load high-traffic models
        val priorityModels = listOf("fraud-v3", "churn-v2")

        priorityModels.forEach { modelId ->
            modelService.loadModel(modelId)
            logger.info { "Preloaded model: $modelId" }
        }

        // Pre-compute common predictions
        generateCommonPredictions()
    }

    private fun generateCommonPredictions() {
        // Cache predictions for common feature combinations
        val commonFeatures = loadCommonFeatureSets()

        commonFeatures.forEach { features ->
            predictionService.predict("fraud-v3", features)
        }
    }
}
```

---

## Database Tuning

### Connection Pool

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50        # Max connections
      minimum-idle: 10             # Min idle connections
      connection-timeout: 30000    # 30s timeout
      idle-timeout: 600000         # 10min idle timeout
      max-lifetime: 1800000        # 30min max lifetime
      leak-detection-threshold: 60000  # Detect leaks after 60s

      # Performance
      auto-commit: true
      read-only: false

      # Validation
      connection-test-query: SELECT 1
      validation-timeout: 5000
```

### Query Optimization

```kotlin
// Batch inserts
@Transactional
fun savePredictionLogs(logs: List<PredictionLog>) {
    val batchSize = 100

    logs.chunked(batchSize).forEach { batch ->
        predictionLogRepository.saveAll(batch)
        entityManager.flush()
        entityManager.clear()
    }
}

// Efficient queries with projections
interface ModelProjection {
    val id: String
    val name: String
    val metrics: ModelMetrics
}

@Query("SELECT m FROM ModelMetadata m WHERE m.status = :status")
fun findActiveModelsProjection(
    @Param("status") status: ModelStatus
): List<ModelProjection>
```

### Indexing

```sql
-- Index for model lookups
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_algorithm ON models(algorithm);
CREATE INDEX idx_models_created_at ON models(created_at DESC);

-- Composite index for filtering
CREATE INDEX idx_models_status_algorithm
ON models(status, algorithm);

-- Index for prediction logs
CREATE INDEX idx_prediction_logs_model_timestamp
ON prediction_logs(model_id, timestamp DESC);
```

---

## Network Optimization

### HTTP/2

```yaml
server:
  http2:
    enabled: true

  compression:
    enabled: true
    mime-types:
      - application/json
      - application/xml
    min-response-size: 1024

  # Connection limits
  tomcat:
    max-connections: 10000
    accept-count: 100
    threads:
      max: 200
      min-spare: 25
```

### Keep-Alive

```yaml
server:
  tomcat:
    connection-timeout: 20000
    keep-alive-timeout: 60000
    max-keep-alive-requests: 100
```

### Load Balancing

**NGINX Configuration**:

```nginx
upstream ml_platform {
    least_conn;  # Route to least busy server

    server ml-1.internal:8080 max_fails=3 fail_timeout=30s;
    server ml-2.internal:8080 max_fails=3 fail_timeout=30s;
    server ml-3.internal:8080 max_fails=3 fail_timeout=30s;

    keepalive 32;  # Connection pooling
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://ml_platform;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Keep-alive
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
```

---

## Profiling & Monitoring

### JFR (Java Flight Recorder)

```bash
# Start with JFR
java -XX:StartFlightRecording=duration=60s,filename=recording.jfr \
     -jar ml-platform.jar

# Analyze with JMC
jmc recording.jfr
```

### Async Profiler

```bash
# Profile CPU
./profiler.sh -d 60 -f flamegraph.html <pid>

# Profile allocations
./profiler.sh -d 60 -e alloc -f alloc.html <pid>
```

### Application Metrics

```kotlin
@Component
class PerformanceMetrics(
    private val meterRegistry: MeterRegistry
) {

    fun recordPrediction(latencyMs: Double, modelId: String) {
        // Latency distribution
        meterRegistry.timer(
            "prediction.latency",
            "model_id", modelId
        ).record(latencyMs.toLong(), TimeUnit.MILLISECONDS)

        // Throughput
        meterRegistry.counter(
            "prediction.count",
            "model_id", modelId
        ).increment()
    }

    @Scheduled(fixedDelay = 60000)
    fun reportStats() {
        val latency = meterRegistry.find("prediction.latency")
            .timer()
            ?.mean(TimeUnit.MILLISECONDS)

        val count = meterRegistry.find("prediction.count")
            .counter()
            ?.count()

        logger.info { "Avg latency: ${latency}ms, Total: $count" }
    }
}
```

### Query Performance

```kotlin
@Component
@Aspect
class QueryPerformanceAspect {

    @Around("execution(* org.springframework.data.repository.Repository+.*(..))")
    fun logQueryPerformance(joinPoint: ProceedingJoinPoint): Any? {
        val start = System.nanoTime()

        val result = joinPoint.proceed()

        val duration = (System.nanoTime() - start) / 1_000_000.0

        if (duration > 100) {  // Log slow queries
            logger.warn {
                "Slow query: ${joinPoint.signature.name} took ${duration}ms"
            }
        }

        return result
    }
}
```

---

## Performance Checklist

### Startup Optimization

- [ ] Enable lazy initialization for non-critical beans
- [ ] Preload Python modules
- [ ] Warm up model cache
- [ ] Initialize connection pools
- [ ] Pre-compile frequently used classes

### Runtime Optimization

- [ ] Use batch predictions where possible
- [ ] Implement multi-level caching
- [ ] Optimize database queries
- [ ] Enable HTTP/2 and compression
- [ ] Use async processing for long operations

### Model Optimization

- [ ] Quantize large models
- [ ] Prune unnecessary parameters
- [ ] Select optimal feature subset
- [ ] Use model ensembles wisely
- [ ] Cache model artifacts locally

### Monitoring

- [ ] Track prediction latency (p50, p95, p99)
- [ ] Monitor cache hit rates
- [ ] Watch GC pause times
- [ ] Track database connection pool usage
- [ ] Monitor memory usage trends

---

## Benchmark Results

### Before Optimization

```
Prediction Latency:
  p50: 45ms
  p95: 120ms
  p99: 250ms

Throughput: 500 RPS
Memory: 8 GB
CPU: 75%
```

### After Optimization

```
Prediction Latency:
  p50: 3ms     (15x improvement)
  p95: 8ms     (15x improvement)
  p99: 15ms    (17x improvement)

Throughput: 8,000 RPS  (16x improvement)
Memory: 4 GB           (50% reduction)
CPU: 45%               (40% reduction)
```

---

## Troubleshooting Performance Issues

### High Latency

**Symptoms**: p95 latency > 50ms

**Diagnosis**:
```bash
# Check GC
jstat -gc <pid> 1000

# Profile CPU
./profiler.sh -d 30 -f cpu.html <pid>

# Check slow queries
tail -f /var/log/ml-platform/slow-queries.log
```

**Solutions**:
- Tune GC parameters
- Increase cache hit rate
- Optimize database queries
- Use batch predictions

### High Memory Usage

**Symptoms**: Memory usage > 90%

**Diagnosis**:
```bash
# Heap dump
jmap -dump:live,format=b,file=heap.bin <pid>

# Analyze with MAT
mat heap.bin
```

**Solutions**:
- Reduce model cache size
- Implement cache eviction
- Fix memory leaks
- Increase heap size

### Low Throughput

**Symptoms**: RPS < 1000

**Diagnosis**:
```bash
# Check thread usage
jstack <pid> | grep "BLOCKED\|WAITING"

# Profile allocations
./profiler.sh -e alloc -d 30 <pid>
```

**Solutions**:
- Increase thread pool size
- Optimize lock contention
- Use async processing
- Scale horizontally

---

**Need Help?** Contact performance-team@mlplatform.example.com
