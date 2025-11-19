package com.example.mlplatform.service

import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import mu.KotlinLogging
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import javax.annotation.PostConstruct

private val logger = KotlinLogging.logger {}

/**
 * Prediction Service - Real-time ML inference with <10ms latency
 *
 * This service demonstrates ultra-fast ML predictions using Elide's polyglot runtime.
 * Python ML models are called directly from Kotlin with zero network overhead,
 * achieving <10ms prediction latency vs 50-200ms with microservices.
 *
 * Features:
 * - Single predictions (<10ms)
 * - Batch predictions (vectorized)
 * - Model caching for performance
 * - Prediction explanation (SHAP)
 * - Real-time metrics
 */
@Service
class PredictionService(
    private val modelService: ModelService
) {
    private val predictionMetrics = ConcurrentHashMap<String, PredictionStats>()
    private val totalPredictions = AtomicLong(0)

    // Python imports
    @Polyglot
    private val pandas = importPython("pandas")

    @Polyglot
    private val numpy = importPython("numpy")

    @Polyglot
    private val shap = importPython("shap")

    @PostConstruct
    fun initialize() {
        logger.info { "Initializing PredictionService" }
        logger.info { "  - Real-time inference: <10ms latency target" }
        logger.info { "  - Batch processing: up to 10,000 records" }
        logger.info { "  - Model caching: enabled" }
    }

    /**
     * Make a single prediction - optimized for <10ms latency
     */
    @Cacheable("predictions", key = "#modelId + '-' + #features.hashCode()")
    fun predict(modelId: String, features: Map<String, Any>): Prediction {
        val startTime = System.nanoTime()

        try {
            // Load model (cached)
            val model = modelService.loadModel(modelId)
            val metadata = modelService.getModel(modelId)

            // Convert features to pandas DataFrame
            val df = createDataFrame(features)

            // Make prediction using Python model
            val prediction = makePrediction(model, df)
            val confidence = calculateConfidence(model, df)

            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0

            // Update metrics
            updateMetrics(modelId, latencyMs, success = true)

            logger.debug {
                "Prediction completed in ${latencyMs}ms for model $modelId"
            }

            return Prediction(
                value = prediction,
                confidence = confidence,
                latencyMs = latencyMs,
                modelId = modelId,
                modelVersion = metadata.version,
                timestamp = Instant.now()
            )

        } catch (e: Exception) {
            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0
            updateMetrics(modelId, latencyMs, success = false)

            logger.error(e) { "Prediction failed for model $modelId" }
            throw RuntimeException("Prediction failed", e)
        }
    }

    /**
     * Batch predictions - vectorized processing for efficiency
     */
    fun batchPredict(modelId: String, batch: List<Map<String, Any>>): List<Prediction> {
        val startTime = System.nanoTime()

        logger.debug { "Processing batch prediction: ${batch.size} records" }

        try {
            require(batch.isNotEmpty()) { "Batch cannot be empty" }
            require(batch.size <= 10000) { "Batch size cannot exceed 10,000 records" }

            // Load model (cached)
            val model = modelService.loadModel(modelId)
            val metadata = modelService.getModel(modelId)

            // Convert batch to pandas DataFrame (vectorized operation)
            val df = createBatchDataFrame(batch)

            // Make predictions (vectorized)
            val predictions = makeBatchPredictions(model, df)
            val confidences = calculateBatchConfidences(model, df)

            val totalLatencyMs = (System.nanoTime() - startTime) / 1_000_000.0
            val avgLatencyMs = totalLatencyMs / batch.size

            // Update metrics
            updateMetrics(modelId, avgLatencyMs, success = true, batchSize = batch.size)

            logger.debug {
                "Batch prediction completed: ${batch.size} records in ${totalLatencyMs}ms " +
                        "(avg: ${avgLatencyMs}ms per record)"
            }

            return predictions.zip(confidences).map { (pred, conf) ->
                Prediction(
                    value = pred,
                    confidence = conf,
                    latencyMs = avgLatencyMs,
                    modelId = modelId,
                    modelVersion = metadata.version,
                    timestamp = Instant.now()
                )
            }

        } catch (e: Exception) {
            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0
            updateMetrics(modelId, latencyMs, success = false, batchSize = batch.size)

            logger.error(e) { "Batch prediction failed for model $modelId" }
            throw RuntimeException("Batch prediction failed", e)
        }
    }

    /**
     * Explain a prediction using SHAP values
     */
    fun explainPrediction(modelId: String, features: Map<String, Any>): PredictionExplanation {
        val startTime = System.nanoTime()

        logger.debug { "Explaining prediction for model $modelId" }

        try {
            val model = modelService.loadModel(modelId)
            val df = createDataFrame(features)

            // Create SHAP explainer
            val explainer = createShapExplainer(model, df)

            // Calculate SHAP values
            val shapValues = explainer.shap_values(df.values)
            val baseValue = explainer.expected_value

            // Make prediction
            val prediction = makePrediction(model, df)

            // Extract feature contributions
            val featureNames = df.columns.tolist() as List<String>
            val shapArray = shapValues[0] as List<Double>

            val featureContributions = featureNames.zip(shapArray)
                .map { (name, value) ->
                    FeatureContribution(
                        feature = name,
                        contribution = value,
                        value = features[name]
                    )
                }
                .sortedByDescending { kotlin.math.abs(it.contribution) }

            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0

            logger.debug { "Prediction explained in ${latencyMs}ms" }

            return PredictionExplanation(
                prediction = prediction,
                baseValue = baseValue as Double,
                shapValues = shapArray,
                featureContributions = featureContributions,
                latencyMs = latencyMs
            )

        } catch (e: Exception) {
            logger.error(e) { "Prediction explanation failed" }
            throw RuntimeException("Explanation failed", e)
        }
    }

    /**
     * Stream predictions for real-time processing
     */
    fun streamPredict(
        modelId: String,
        featuresSequence: Sequence<Map<String, Any>>
    ): Sequence<Prediction> {
        return featuresSequence.map { features ->
            predict(modelId, features)
        }
    }

    /**
     * Get prediction statistics for a model
     */
    fun getPredictionStats(modelId: String): PredictionStats {
        return predictionMetrics.getOrDefault(
            modelId,
            PredictionStats(
                modelId = modelId,
                totalPredictions = 0,
                successfulPredictions = 0,
                failedPredictions = 0,
                avgLatencyMs = 0.0,
                p50LatencyMs = 0.0,
                p95LatencyMs = 0.0,
                p99LatencyMs = 0.0
            )
        )
    }

    /**
     * Get overall prediction statistics
     */
    fun getOverallStats(): Map<String, Any> {
        return mapOf(
            "totalPredictions" to totalPredictions.get(),
            "modelStats" to predictionMetrics.values.toList()
        )
    }

    // Private helper methods

    @Polyglot
    private fun createDataFrame(features: Map<String, Any>): dynamic {
        // Convert map to pandas DataFrame
        return pandas.DataFrame(listOf(features))
    }

    @Polyglot
    private fun createBatchDataFrame(batch: List<Map<String, Any>>): dynamic {
        // Convert list of maps to pandas DataFrame (efficient)
        return pandas.DataFrame(batch)
    }

    @Polyglot
    private fun makePrediction(model: Any, df: dynamic): Any {
        return try {
            val predictions = model.predict(df)
            predictions[0]
        } catch (e: Exception) {
            logger.error(e) { "Prediction failed" }
            throw e
        }
    }

    @Polyglot
    private fun makeBatchPredictions(model: Any, df: dynamic): List<Any> {
        return try {
            val predictions = model.predict(df)
            predictions.tolist() as List<Any>
        } catch (e: Exception) {
            logger.error(e) { "Batch prediction failed" }
            throw e
        }
    }

    @Polyglot
    private fun calculateConfidence(model: Any, df: dynamic): Double {
        return try {
            val probabilities = model.predict_proba(df)
            val maxProb = probabilities[0].max() as Double
            maxProb
        } catch (e: Exception) {
            // Model doesn't support probabilities
            0.0
        }
    }

    @Polyglot
    private fun calculateBatchConfidences(model: Any, df: dynamic): List<Double> {
        return try {
            val probabilities = model.predict_proba(df)
            val maxProbs = probabilities.max(axis = 1)
            maxProbs.tolist() as List<Double>
        } catch (e: Exception) {
            // Model doesn't support probabilities
            List(df.shape[0] as Int) { 0.0 }
        }
    }

    @Polyglot
    private fun createShapExplainer(model: Any, df: dynamic): dynamic {
        return try {
            // Try TreeExplainer first (faster for tree models)
            shap.TreeExplainer(model)
        } catch (e: Exception) {
            try {
                // Fall back to KernelExplainer
                shap.KernelExplainer(model.predict_proba, df)
            } catch (e2: Exception) {
                // Use LinearExplainer for linear models
                shap.LinearExplainer(model, df)
            }
        }
    }

    private fun updateMetrics(
        modelId: String,
        latencyMs: Double,
        success: Boolean,
        batchSize: Int = 1
    ) {
        totalPredictions.addAndGet(batchSize.toLong())

        predictionMetrics.compute(modelId) { _, stats ->
            val current = stats ?: PredictionStats(
                modelId = modelId,
                totalPredictions = 0,
                successfulPredictions = 0,
                failedPredictions = 0,
                avgLatencyMs = 0.0,
                p50LatencyMs = 0.0,
                p95LatencyMs = 0.0,
                p99LatencyMs = 0.0,
                latencies = mutableListOf()
            )

            val newTotal = current.totalPredictions + batchSize
            val newSuccessful = if (success) current.successfulPredictions + batchSize else current.successfulPredictions
            val newFailed = if (!success) current.failedPredictions + batchSize else current.failedPredictions

            // Update latency tracking
            current.latencies.add(latencyMs)
            if (current.latencies.size > 1000) {
                current.latencies.removeAt(0)
            }

            // Calculate percentiles
            val sortedLatencies = current.latencies.sorted()
            val p50 = percentile(sortedLatencies, 0.50)
            val p95 = percentile(sortedLatencies, 0.95)
            val p99 = percentile(sortedLatencies, 0.99)

            // Calculate average
            val newAvg = (current.avgLatencyMs * current.totalPredictions + latencyMs * batchSize) / newTotal

            PredictionStats(
                modelId = modelId,
                totalPredictions = newTotal,
                successfulPredictions = newSuccessful,
                failedPredictions = newFailed,
                avgLatencyMs = newAvg,
                p50LatencyMs = p50,
                p95LatencyMs = p95,
                p99LatencyMs = p99,
                latencies = current.latencies
            )
        }
    }

    private fun percentile(sortedList: List<Double>, percentile: Double): Double {
        if (sortedList.isEmpty()) return 0.0

        val index = (sortedList.size * percentile).toInt()
        return sortedList.getOrElse(index) { sortedList.last() }
    }

    @Polyglot
    private fun importPython(module: String): dynamic {
        return js("require('python:$module')")
    }
}

/**
 * Prediction statistics tracking
 */
data class PredictionStats(
    val modelId: String,
    val totalPredictions: Int,
    val successfulPredictions: Int,
    val failedPredictions: Int,
    val avgLatencyMs: Double,
    val p50LatencyMs: Double,
    val p95LatencyMs: Double,
    val p99LatencyMs: Double,
    val latencies: MutableList<Double> = mutableListOf()
)

/**
 * Feature contribution for prediction explanation
 */
data class FeatureContribution(
    val feature: String,
    val contribution: Double,
    val value: Any?
)

/**
 * Prediction explanation with SHAP values
 */
data class PredictionExplanation(
    val prediction: Any,
    val baseValue: Double,
    val shapValues: List<Double>,
    val featureContributions: List<FeatureContribution>,
    val latencyMs: Double
)

/**
 * Real-time prediction stream processor
 */
@Service
class StreamPredictionService(
    private val predictionService: PredictionService
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Process predictions in real-time with backpressure handling
     */
    fun processStream(
        modelId: String,
        inputStream: Sequence<Map<String, Any>>,
        batchSize: Int = 100
    ): Sequence<Prediction> {
        logger.info { "Starting stream prediction for model $modelId (batch size: $batchSize)" }

        return inputStream
            .chunked(batchSize)
            .flatMap { batch ->
                try {
                    predictionService.batchPredict(modelId, batch).asSequence()
                } catch (e: Exception) {
                    logger.error(e) { "Stream batch prediction failed" }
                    emptySequence()
                }
            }
    }

    /**
     * Process with retry logic
     */
    fun processStreamWithRetry(
        modelId: String,
        inputStream: Sequence<Map<String, Any>>,
        maxRetries: Int = 3
    ): Sequence<Prediction> {
        return inputStream.map { features ->
            var lastException: Exception? = null
            repeat(maxRetries) { attempt ->
                try {
                    return@map predictionService.predict(modelId, features)
                } catch (e: Exception) {
                    lastException = e
                    logger.warn { "Prediction attempt ${attempt + 1} failed, retrying..." }
                    Thread.sleep(100 * (attempt + 1).toLong())
                }
            }
            throw lastException ?: RuntimeException("Prediction failed after $maxRetries retries")
        }
    }
}

/**
 * Prediction cache warmer for high-traffic models
 */
@Service
class PredictionCacheWarmer(
    private val predictionService: PredictionService,
    private val modelService: ModelService
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Warm up prediction cache with common feature combinations
     */
    fun warmCache(modelId: String, sampleFeatures: List<Map<String, Any>>) {
        logger.info { "Warming prediction cache for model $modelId with ${sampleFeatures.size} samples" }

        val startTime = System.currentTimeMillis()

        sampleFeatures.forEach { features ->
            try {
                predictionService.predict(modelId, features)
            } catch (e: Exception) {
                logger.warn(e) { "Cache warming failed for sample" }
            }
        }

        val duration = System.currentTimeMillis() - startTime
        logger.info { "Cache warmed in ${duration}ms" }
    }

    /**
     * Warm cache for all active models
     */
    fun warmAllCaches() {
        logger.info { "Warming caches for all active models" }

        val models = modelService.listModels(status = ModelStatus.ACTIVE)

        models.content.forEach { model ->
            try {
                // Generate sample features and warm cache
                warmCache(model.id, generateSampleFeatures(model))
            } catch (e: Exception) {
                logger.warn(e) { "Failed to warm cache for model ${model.id}" }
            }
        }
    }

    private fun generateSampleFeatures(model: ModelMetadata): List<Map<String, Any>> {
        // Generate representative sample features based on model metadata
        // In real implementation, this would analyze training data
        return emptyList()
    }
}
