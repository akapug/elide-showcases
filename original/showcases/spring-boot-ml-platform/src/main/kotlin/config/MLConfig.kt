package com.example.mlplatform.config

import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import mu.KotlinLogging
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import java.util.concurrent.Executor
import java.util.concurrent.Executors

private val logger = KotlinLogging.logger {}

/**
 * ML Platform Configuration
 *
 * Configures the ML platform components including:
 * - Python runtime initialization
 * - Model storage (S3)
 * - Async processing
 * - Cache settings
 * - Performance tuning
 */
@Configuration
@EnableJpaRepositories(basePackages = ["com.example.mlplatform.repository"])
class MLConfig {

    /**
     * Initialize Elide Python runtime
     */
    @Bean
    @Polyglot
    fun pythonRuntime(): PythonRuntime {
        logger.info { "Initializing Elide Python runtime" }

        // Python runtime is automatically initialized by Elide
        // We just verify it's working
        val sklearn = importPython("sklearn")
        val tf = importPython("tensorflow")
        val pd = importPython("pandas")
        val np = importPython("numpy")

        logger.info { "Python runtime initialized successfully" }
        logger.info { "  - sklearn: ${sklearn.__version__}" }
        logger.info { "  - tensorflow: ${tf.__version__}" }
        logger.info { "  - pandas: ${pd.__version__}" }
        logger.info { "  - numpy: ${np.__version__}" }

        return PythonRuntime(
            sklearn = sklearn,
            tensorflow = tf,
            pandas = pd,
            numpy = np
        )
    }

    /**
     * S3 client for model storage
     */
    @Bean
    fun s3Client(properties: MLStorageProperties): S3Client {
        logger.info { "Configuring S3 client for model storage" }
        logger.info { "  - Region: ${properties.region}" }
        logger.info { "  - Bucket: ${properties.bucket}" }

        return S3Client.builder()
            .region(Region.of(properties.region))
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build()
    }

    /**
     * Thread pool for async ML operations
     */
    @Bean(name = ["mlExecutor"])
    fun mlExecutor(properties: MLAsyncProperties): Executor {
        logger.info { "Configuring ML async executor" }
        logger.info { "  - Core pool size: ${properties.corePoolSize}" }
        logger.info { "  - Max pool size: ${properties.maxPoolSize}" }

        return Executors.newFixedThreadPool(
            properties.maxPoolSize,
            Thread.ofVirtual()  // Use virtual threads (Java 21+)
                .name("ml-worker-", 0)
                .factory()
        )
    }

    /**
     * Model cache configuration
     */
    @Bean
    fun modelCacheConfig(properties: MLCacheProperties): ModelCacheConfig {
        logger.info { "Configuring model cache" }
        logger.info { "  - Max size: ${properties.maxSize}" }
        logger.info { "  - TTL: ${properties.ttlSeconds}s" }

        return ModelCacheConfig(
            maxSize = properties.maxSize,
            ttlSeconds = properties.ttlSeconds,
            preloadModels = properties.preloadModels
        )
    }

    @Polyglot
    private fun importPython(module: String): dynamic {
        return js("require('python:$module')")
    }
}

/**
 * ML Storage properties
 */
@Configuration
@ConfigurationProperties(prefix = "ml.storage")
data class MLStorageProperties(
    var type: String = "s3",
    var bucket: String = "ml-models",
    var region: String = "us-east-1",
    var prefix: String = "models/"
)

/**
 * ML Async processing properties
 */
@Configuration
@ConfigurationProperties(prefix = "ml.async")
data class MLAsyncProperties(
    var enabled: Boolean = true,
    var corePoolSize: Int = 4,
    var maxPoolSize: Int = 16,
    var queueCapacity: Int = 1000
)

/**
 * ML Cache properties
 */
@Configuration
@ConfigurationProperties(prefix = "ml.cache")
data class MLCacheProperties(
    var enabled: Boolean = true,
    var maxSize: Int = 100,
    var ttlSeconds: Long = 3600,
    var preloadModels: List<String> = emptyList()
)

/**
 * ML Prediction properties
 */
@Configuration
@ConfigurationProperties(prefix = "ml.prediction")
data class MLPredictionProperties(
    var batchSize: Int = 1000,
    var timeoutMs: Long = 5000,
    var enableCache: Boolean = true,
    var cacheTtlSeconds: Long = 300
)

/**
 * ML Training properties
 */
@Configuration
@ConfigurationProperties(prefix = "ml.training")
data class MLTrainingProperties(
    var maxConcurrentJobs: Int = 5,
    var defaultValidationSplit: Double = 0.2,
    var defaultRandomState: Int = 42,
    var enableEarlyStop: Boolean = true,
    var earlyStopPatience: Int = 10
)

/**
 * Python runtime holder
 */
data class PythonRuntime(
    val sklearn: Any,
    val tensorflow: Any,
    val pandas: Any,
    val numpy: Any
)

/**
 * Model cache configuration
 */
data class ModelCacheConfig(
    val maxSize: Int,
    val ttlSeconds: Long,
    val preloadModels: List<String>
)

/**
 * Metrics configuration for Prometheus
 */
@Configuration
class MetricsConfig {

    @Bean
    fun mlMetricsCollector(): MLMetricsCollector {
        logger.info { "Configuring ML metrics collector" }
        return MLMetricsCollector()
    }
}

/**
 * ML Metrics collector
 */
class MLMetricsCollector {
    private val predictionCounter = mutableMapOf<String, Long>()
    private val predictionLatencies = mutableMapOf<String, MutableList<Double>>()
    private val trainingCounter = mutableMapOf<String, Long>()

    fun recordPrediction(modelId: String, latencyMs: Double) {
        predictionCounter[modelId] = (predictionCounter[modelId] ?: 0) + 1

        val latencies = predictionLatencies.getOrPut(modelId) { mutableListOf() }
        latencies.add(latencyMs)

        // Keep only last 1000 latencies
        if (latencies.size > 1000) {
            latencies.removeAt(0)
        }
    }

    fun recordTraining(modelId: String) {
        trainingCounter[modelId] = (trainingCounter[modelId] ?: 0) + 1
    }

    fun getMetrics(): Map<String, Any> {
        return mapOf(
            "predictions" to predictionCounter,
            "latencies" to predictionLatencies.mapValues { (_, latencies) ->
                mapOf(
                    "avg" to latencies.average(),
                    "p50" to latencies.sorted()[latencies.size / 2],
                    "p95" to latencies.sorted()[(latencies.size * 0.95).toInt()],
                    "p99" to latencies.sorted()[(latencies.size * 0.99).toInt()]
                )
            },
            "trainings" to trainingCounter
        )
    }
}

/**
 * Database configuration
 */
@Configuration
class DatabaseConfig {

    @Bean
    fun databaseInitializer(): DatabaseInitializer {
        return DatabaseInitializer()
    }
}

/**
 * Database initializer
 */
class DatabaseInitializer {

    fun initialize() {
        logger.info { "Initializing database schema" }
        // Database migrations handled by Flyway
    }
}

/**
 * Security configuration for ML endpoints
 */
@Configuration
class MLSecurityConfig {

    @Bean
    fun apiKeyValidator(): ApiKeyValidator {
        return ApiKeyValidator()
    }
}

/**
 * API key validator
 */
class ApiKeyValidator {

    fun validate(apiKey: String): Boolean {
        // In production, validate against database or secret manager
        return apiKey.isNotEmpty()
    }
}

/**
 * Feature engineering configuration
 */
@Configuration
@ConfigurationProperties(prefix = "ml.feature-engineering")
data class FeatureEngineeringProperties(
    var enableTemporalFeatures: Boolean = true,
    var enableStatisticalFeatures: Boolean = true,
    var enableInteractionFeatures: Boolean = true,
    var enableRollingFeatures: Boolean = true,
    var maxInteractionDegree: Int = 2,
    var rollingWindowSizes: List<Int> = listOf(3, 7, 14, 30),
    var correlationThreshold: Double = 0.95
)

/**
 * Model registry configuration
 */
@Configuration
class ModelRegistryConfig {

    @Bean
    fun modelRegistry(): ModelRegistry {
        logger.info { "Initializing model registry" }
        return ModelRegistry()
    }
}

/**
 * Model registry - tracks all models
 */
class ModelRegistry {
    private val models = mutableMapOf<String, ModelMetadata>()

    fun register(metadata: ModelMetadata) {
        models[metadata.id] = metadata
        logger.info { "Registered model: ${metadata.id} (${metadata.name})" }
    }

    fun get(modelId: String): ModelMetadata? {
        return models[modelId]
    }

    fun list(): List<ModelMetadata> {
        return models.values.toList()
    }

    fun remove(modelId: String) {
        models.remove(modelId)
        logger.info { "Removed model from registry: $modelId" }
    }
}

/**
 * Hyperparameter tuning configuration
 */
@Configuration
@ConfigurationProperties(prefix = "ml.hyperparameter-tuning")
data class HyperparameterTuningProperties(
    var enabled: Boolean = false,
    var method: String = "grid", // grid, random, bayesian
    var maxTrials: Int = 100,
    var cvFolds: Int = 5,
    var scoringMetric: String = "accuracy"
)

/**
 * Model monitoring configuration
 */
@Configuration
@ConfigurationProperties(prefix = "ml.monitoring")
data class ModelMonitoringProperties(
    var enabled: Boolean = true,
    var checkInterval: Long = 3600, // seconds
    var accuracyThreshold: Double = 0.8,
    var driftDetection: Boolean = true,
    var alertOnDrift: Boolean = true
)

/**
 * Logging configuration for ML operations
 */
@Configuration
class MLLoggingConfig {

    @Bean
    fun mlLogger(): MLLogger {
        return MLLogger()
    }
}

/**
 * ML-specific logger
 */
class MLLogger {
    private val logger = KotlinLogging.logger {}

    fun logTraining(modelId: String, algorithm: Algorithm, metrics: ModelMetrics) {
        logger.info {
            "Training completed - Model: $modelId, Algorithm: $algorithm, " +
                    "Accuracy: ${metrics.accuracy}, F1: ${metrics.f1Score}"
        }
    }

    fun logPrediction(modelId: String, latencyMs: Double, batchSize: Int = 1) {
        logger.debug {
            "Prediction - Model: $modelId, Batch: $batchSize, Latency: ${latencyMs}ms"
        }
    }

    fun logError(operation: String, error: Throwable) {
        logger.error(error) { "ML operation failed: $operation" }
    }
}
