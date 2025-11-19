# Production Deployment Guide - Spring Boot ML Platform

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Scaling](#scaling)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Overview

This guide covers deploying the Spring Boot ML Platform to production using Elide's Kotlin + Python polyglot runtime. The platform enables enterprise ML capabilities without the complexity of microservices.

### Key Benefits

- **Single Application Deployment**: No microservices overhead
- **<10ms Prediction Latency**: In-process Python calls
- **66% Memory Savings**: vs separate Spring + Python services
- **20x Better Performance**: vs HTTP-based ML services
- **Simplified Operations**: One JAR, one deployment

## Prerequisites

### Software Requirements

```yaml
- Java: 21+
- Kotlin: 1.9.21+
- GraalVM: 22.3+ (for Elide polyglot)
- PostgreSQL: 14+
- Redis: 7+
- Kubernetes: 1.24+ (optional)
- Docker: 20.10+ (optional)
```

### Hardware Requirements

**Minimum (Development)**:
- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB

**Recommended (Production)**:
- CPU: 8+ cores
- RAM: 16+ GB
- Disk: 100+ GB SSD
- Network: 1 Gbps+

**High-Performance (Large Scale)**:
- CPU: 16+ cores
- RAM: 32+ GB
- Disk: 500+ GB NVMe SSD
- Network: 10 Gbps+

## Architecture

### Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (AWS ALB / NGINX)                       │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────┐          ┌──────▼────────┐
│  ML Platform │          │  ML Platform  │
│   Instance 1 │          │   Instance 2  │
│              │          │               │
│  ┌────────┐  │          │  ┌────────┐   │
│  │ Kotlin │  │          │  │ Kotlin │   │
│  │   +    │  │          │  │   +    │   │
│  │ Python │  │          │  │ Python │   │
│  └────────┘  │          │  └────────┘   │
└───────┬──────┘          └──────┬────────┘
        │                        │
        └───────────┬────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
┌───────▼──────┐         ┌──────▼────────┐
│  PostgreSQL  │         │     Redis     │
│   (Models)   │         │    (Cache)    │
└──────────────┘         └───────────────┘
        │
        │
┌───────▼──────┐
│   S3/Minio   │
│ (Model Files)│
└──────────────┘
```

### Component Responsibilities

**Spring Boot Application**:
- REST API endpoints
- Request validation
- Authentication/Authorization
- Caching layer
- Metrics collection

**Elide Polyglot Runtime**:
- Python ML library execution
- In-process interop
- Memory management
- GraalVM optimization

**PostgreSQL**:
- Model metadata
- Training history
- Prediction logs
- User data

**Redis**:
- Model cache
- Prediction cache
- Session storage
- Rate limiting

**S3/MinIO**:
- Trained model artifacts
- Training datasets
- Model checkpoints
- Backups

## Configuration

### Application Configuration

**application-prod.yml**:

```yaml
spring:
  application:
    name: ml-platform-prod

  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true

  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
    lettuce:
      pool:
        max-active: 20
        max-idle: 10
        min-idle: 5

  cache:
    type: redis
    redis:
      time-to-live: 3600000
      cache-null-values: false

elide:
  polyglot:
    python:
      enabled: true
      version: "3.11"
      warm-up: true
      import-cache: true
      optimization-level: 2

ml:
  models:
    cache-size: 100
    cache-ttl: 3600
    preload:
      - fraud-detector-v3
      - churn-predictor-v2

  predictions:
    batch-size: 1000
    timeout-ms: 5000
    enable-cache: true
    cache-ttl-seconds: 300

  storage:
    type: s3
    bucket: ${ML_MODELS_BUCKET}
    region: ${AWS_REGION}
    endpoint: ${S3_ENDPOINT} # For MinIO

  monitoring:
    enabled: true
    check-interval: 300
    drift-detection: true
    alert-on-drift: true

server:
  port: 8080
  tomcat:
    threads:
      max: 200
      min-spare: 10
    accept-count: 100
    max-connections: 10000

  compression:
    enabled: true
    mime-types:
      - application/json
      - application/xml
    min-response-size: 1024

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus,info
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
      environment: production

logging:
  level:
    root: INFO
    com.example.mlplatform: INFO
    org.springframework.web: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
  file:
    name: /var/log/ml-platform/application.log
    max-size: 100MB
    max-history: 30
```

### Environment Variables

```bash
# Database
export DB_HOST=postgres.production.internal
export DB_NAME=mlplatform
export DB_USER=mlplatform_user
export DB_PASSWORD=<secret>

# Redis
export REDIS_HOST=redis.production.internal
export REDIS_PORT=6379
export REDIS_PASSWORD=<secret>

# S3/Storage
export ML_MODELS_BUCKET=ml-models-prod
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=<secret>
export AWS_SECRET_ACCESS_KEY=<secret>

# Application
export SPRING_PROFILES_ACTIVE=prod
export JAVA_OPTS="-Xmx8g -Xms4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### JVM Tuning

**For 16GB RAM**:

```bash
export JAVA_OPTS="-Xmx12g \
  -Xms8g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:ParallelGCThreads=8 \
  -XX:ConcGCThreads=2 \
  -XX:InitiatingHeapOccupancyPercent=70 \
  -XX:+UseStringDeduplication \
  -XX:+OptimizeStringConcat \
  -Djava.security.egd=file:/dev/./urandom"
```

**For GraalVM Native Image**:

```bash
export NATIVE_IMAGE_OPTS="-H:+StaticExecutableWithDynamicLibC \
  -H:+ReportExceptionStackTraces \
  --no-fallback \
  --initialize-at-build-time \
  -H:+RemoveUnusedSymbols \
  -H:+JNI \
  --enable-all-security-services"
```

## Deployment

### Docker Deployment

**Dockerfile**:

```dockerfile
FROM elide/jvm:21-jammy

LABEL maintainer="ml-platform@example.com"
LABEL description="Spring Boot ML Platform with Elide Polyglot"

WORKDIR /app

# Copy application JAR
COPY build/libs/spring-boot-ml-platform.jar app.jar

# Install Python ML libraries
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install \
    scikit-learn==1.3.2 \
    tensorflow==2.15.0 \
    pandas==2.1.4 \
    numpy==1.26.2 \
    xgboost==2.0.3 \
    lightgbm==4.1.0

# Create logs directory
RUN mkdir -p /var/log/ml-platform

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Set JVM options
ENV JAVA_OPTS="-Xmx8g -Xms4g -XX:+UseG1GC"

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**Build and Run**:

```bash
# Build image
docker build -t ml-platform:1.0.0 .

# Run container
docker run -d \
  --name ml-platform \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=postgres \
  -e DB_NAME=mlplatform \
  -e DB_USER=mluser \
  -e DB_PASSWORD=secret \
  -e REDIS_HOST=redis \
  -e REDIS_PASSWORD=secret \
  -v /data/models:/data/models \
  ml-platform:1.0.0
```

### Kubernetes Deployment

**deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-platform
  namespace: production
  labels:
    app: ml-platform
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ml-platform
  template:
    metadata:
      labels:
        app: ml-platform
        version: v1.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      containers:
      - name: ml-platform
        image: ml-platform:1.0.0
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ml-platform-config
              key: db.host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ml-platform-secrets
              key: db.password
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: ml-platform-config
              key: redis.host
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ml-platform-secrets
              key: redis.password
        resources:
          requests:
            memory: "8Gi"
            cpu: "4000m"
          limits:
            memory: "12Gi"
            cpu: "8000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: logs
          mountPath: /var/log/ml-platform
      volumes:
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: ml-platform
  namespace: production
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: ml-platform
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-platform-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-platform
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Apply**:

```bash
kubectl apply -f deployment.yaml
kubectl get pods -n production
kubectl logs -f deployment/ml-platform -n production
```

## Monitoring

### Prometheus Metrics

**Key Metrics**:

```
# Model Metrics
ml_models_active - Number of active models
ml_models_deployed - Number of deployed models
ml_model_accuracy{model_id} - Current model accuracy
ml_model_predictions_total{model_id} - Total predictions per model
ml_model_age_days{model_id} - Age of model in days

# Prediction Metrics
ml_predictions_total{model_id} - Total predictions
ml_predictions_latency{model_id} - Prediction latency histogram
ml_predictions_throughput{model_id} - Predictions per minute

# System Metrics
ml_system_memory_used_mb - Memory usage
ml_system_memory_usage_percent - Memory usage percentage
ml_system_cpu_usage_percent - CPU usage

# Alert Metrics
ml_alerts_total{model_id,severity} - Total alerts by severity
```

### Grafana Dashboard

**Sample PromQL Queries**:

```promql
# Average prediction latency (p95)
histogram_quantile(0.95, rate(ml_predictions_latency_bucket[5m]))

# Predictions per second
rate(ml_predictions_total[1m])

# Model accuracy over time
ml_model_accuracy{model_id="fraud-detector"}

# Memory usage trend
ml_system_memory_usage_percent

# Error rate
rate(ml_predictions_errors_total[5m])
```

### Alerting Rules

**prometheus-alerts.yml**:

```yaml
groups:
- name: ml_platform_alerts
  rules:
  - alert: HighPredictionLatency
    expr: histogram_quantile(0.95, rate(ml_predictions_latency_bucket[5m])) > 50
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High prediction latency detected"
      description: "p95 latency is {{ $value }}ms (threshold: 50ms)"

  - alert: ModelAccuracyDegraded
    expr: ml_model_accuracy < 0.8
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: "Model accuracy degraded"
      description: "Model {{ $labels.model_id }} accuracy is {{ $value }}"

  - alert: HighMemoryUsage
    expr: ml_system_memory_usage_percent > 90
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Memory usage is {{ $value }}%"

  - alert: LowThroughput
    expr: rate(ml_predictions_total[5m]) < 10
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Low prediction throughput"
      description: "Only {{ $value }} predictions/sec"
```

## Scaling

### Horizontal Scaling

**Considerations**:

1. **Stateless Design**: Application is fully stateless
2. **Model Caching**: Models cached in Redis for consistency
3. **Load Balancing**: Round-robin or least-connections
4. **Session Affinity**: Not required

**Scaling Strategy**:

```yaml
# Scale based on CPU and memory
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: ml_predictions_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

### Vertical Scaling

**Instance Sizing Guide**:

| Load Level | vCPU | RAM  | Expected RPS | Concurrent Users |
|------------|------|------|--------------|------------------|
| Small      | 4    | 8GB  | 500          | 100             |
| Medium     | 8    | 16GB | 2,000        | 500             |
| Large      | 16   | 32GB | 5,000        | 2,000           |
| X-Large    | 32   | 64GB | 10,000       | 5,000           |

## Security

### Authentication

**API Key Authentication**:

```kotlin
@Configuration
class SecurityConfig {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/actuator/health").permitAll()
                    .requestMatchers("/api/**").authenticated()
            }
            .addFilterBefore(ApiKeyFilter(), UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }
}
```

### Network Security

**Firewall Rules**:

```
Inbound:
- Port 8080: From load balancer only
- Port 5432: From application to PostgreSQL
- Port 6379: From application to Redis

Outbound:
- Port 443: To S3/AWS services
- Port 80: To external APIs (if needed)
```

### Secrets Management

**AWS Secrets Manager**:

```kotlin
@Configuration
class SecretsConfig {
    @Bean
    fun dataSource(): DataSource {
        val secret = getSecret("prod/ml-platform/db")

        return DataSourceBuilder.create()
            .url(secret["url"])
            .username(secret["username"])
            .password(secret["password"])
            .build()
    }

    private fun getSecret(secretName: String): Map<String, String> {
        val client = AWSSecretsManagerClientBuilder.defaultClient()
        val request = GetSecretValueRequest()
            .withSecretId(secretName)

        val response = client.getSecretValue(request)
        return JSON.parse(response.secretString)
    }
}
```

## Troubleshooting

### Common Issues

**1. High Memory Usage**

```bash
# Check heap dump
jmap -dump:live,format=b,file=heap.bin <pid>

# Analyze with MAT or JProfiler
# Look for:
# - Cached models not evicting
# - Memory leaks in prediction pipeline
# - Large feature DataFrames

# Fix:
# - Reduce model cache size
# - Implement aggressive cache eviction
# - Process features in batches
```

**2. Slow Predictions**

```bash
# Profile predictions
# Check:
# - Model loading time
# - Feature engineering overhead
# - Cache hit rate

# Optimize:
# - Preload frequently used models
# - Cache feature transformations
# - Use batch predictions
# - Enable model quantization
```

**3. Python Import Errors**

```bash
# Verify Python libraries
python3 -c "import sklearn; print(sklearn.__version__)"
python3 -c "import tensorflow; print(tensorflow.__version__)"

# Check Elide polyglot config
elide.polyglot.python.enabled=true

# Reinstall if needed
pip3 install --upgrade --force-reinstall scikit-learn tensorflow
```

## Best Practices

### 1. Model Management

```kotlin
// Version all models
val modelId = "${modelName}-v${version}-${timestamp}"

// Track model lineage
metadata.parentModelId = previousVersion
metadata.trainingData = datasetId

// A/B test new models
abTest.deploy(modelA = "fraud-v2", modelB = "fraud-v3", split = 0.1)
```

### 2. Caching Strategy

```kotlin
@Cacheable("predictions", unless = "#result.confidence < 0.9")
fun predict(modelId: String, features: Map<String, Any>): Prediction

// Cache with TTL
@CacheEvict("predictions", allEntries = true)
@Scheduled(fixedDelay = 3600000)
fun evictPredictionCache()
```

### 3. Monitoring

```kotlin
// Always record metrics
metricsService.recordPrediction(
    modelId = modelId,
    latencyMs = latency,
    prediction = result,
    actual = groundTruth
)

// Set up alerts
if (accuracy < threshold) {
    alertService.send(AlertLevel.CRITICAL, "Model degraded")
}
```

### 4. Error Handling

```kotlin
try {
    return predictionService.predict(modelId, features)
} catch (e: ModelNotFoundException) {
    logger.error("Model not found: $modelId")
    return fallbackPrediction()
} catch (e: TimeoutException) {
    logger.warn("Prediction timeout for $modelId")
    return cachedPrediction()
}
```

### 5. Testing in Production

```kotlin
// Canary deployments
@GetMapping("/api/ml/predict")
fun predict(@RequestBody request: PredictRequest): PredictResponse {
    val useCanary = random.nextDouble() < canaryPercentage

    return if (useCanary) {
        canaryPredictionService.predict(request)
    } else {
        productionPredictionService.predict(request)
    }
}
```

---

**Support**: ml-platform-support@example.com
**Documentation**: https://docs.ml-platform.example.com
**Status Page**: https://status.ml-platform.example.com
