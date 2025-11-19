package com.example.mlplatform.monitoring

import com.example.mlplatform.service.*
import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer
import mu.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong
import javax.annotation.PostConstruct

private val logger = KotlinLogging.logger {}

/**
 * ML Monitoring Service - Production ML Observability
 *
 * Comprehensive monitoring for production ML systems including:
 * - Model performance tracking
 * - Data drift detection
 * - Prediction latency monitoring
 * - Resource utilization
 * - Alerting
 */
@Service
class MLMonitoringService(
    private val modelService: ModelService,
    private val predictionService: PredictionService,
    private val meterRegistry: MeterRegistry
) {
    private val modelMetrics = ConcurrentHashMap<String, ModelPerformanceMetrics>()
    private val predictionMetrics = ConcurrentHashMap<String, PredictionMetrics>()
    private val alerts = mutableListOf<Alert>()

    @PostConstruct
    fun initialize() {
        logger.info { "Initializing ML Monitoring Service" }
        setupMetrics()
    }

    /**
     * Setup Prometheus metrics
     */
    private fun setupMetrics() {
        // Register custom metrics
        meterRegistry.gauge("ml.models.active", modelService) { service ->
            service.listModels(status = ModelStatus.ACTIVE).totalElements.toDouble()
        }

        meterRegistry.gauge("ml.models.deployed", modelService) { service ->
            service.listModels(status = ModelStatus.DEPLOYED).totalElements.toDouble()
        }
    }

    /**
     * Record prediction metrics
     */
    fun recordPrediction(
        modelId: String,
        prediction: Any,
        actual: Any? = null,
        latencyMs: Double,
        features: Map<String, Any>
    ) {
        // Update prediction count
        meterRegistry.counter("ml.predictions.total", "model_id", modelId).increment()

        // Record latency
        meterRegistry.timer("ml.predictions.latency", "model_id", modelId)
            .record(latencyMs.toLong(), TimeUnit.MILLISECONDS)

        // Update internal metrics
        val metrics = predictionMetrics.getOrPut(modelId) {
            PredictionMetrics(modelId = modelId)
        }

        metrics.totalPredictions.incrementAndGet()
        metrics.latencies.add(latencyMs)

        if (metrics.latencies.size > 1000) {
            metrics.latencies.removeAt(0)
        }

        // If actual value provided, calculate accuracy
        actual?.let {
            if (prediction == it) {
                metrics.correctPredictions.incrementAndGet()
            }

            metrics.predictions.add(PredictionRecord(
                timestamp = Instant.now(),
                prediction = prediction,
                actual = it,
                latencyMs = latencyMs,
                features = features
            ))

            // Detect drift
            detectDataDrift(modelId, features)
        }
    }

    /**
     * Monitor model performance
     */
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    fun monitorModelPerformance() {
        logger.debug { "Running model performance monitoring..." }

        val activeModels = modelService.listModels(status = ModelStatus.ACTIVE)

        activeModels.content.forEach { model ->
            try {
                val metrics = calculateCurrentMetrics(model.id)

                // Update stored metrics
                modelMetrics[model.id] = metrics

                // Check for degradation
                if (metrics.currentAccuracy < model.metrics.accuracy * 0.9) {
                    createAlert(
                        modelId = model.id,
                        severity = AlertSeverity.WARNING,
                        message = "Model accuracy degraded from ${model.metrics.accuracy} " +
                                "to ${metrics.currentAccuracy}"
                    )
                }

                // Check latency SLA
                if (metrics.p95LatencyMs > 50.0) {
                    createAlert(
                        modelId = model.id,
                        severity = AlertSeverity.WARNING,
                        message = "p95 latency ${metrics.p95LatencyMs}ms exceeds 50ms SLA"
                    )
                }

                // Update Prometheus metrics
                meterRegistry.gauge(
                    "ml.model.accuracy",
                    listOf(io.micrometer.core.instrument.Tag.of("model_id", model.id)),
                    metrics.currentAccuracy
                )

                meterRegistry.gauge(
                    "ml.model.predictions.total",
                    listOf(io.micrometer.core.instrument.Tag.of("model_id", model.id)),
                    metrics.totalPredictions.toDouble()
                )

            } catch (e: Exception) {
                logger.error(e) { "Failed to monitor model ${model.id}" }
            }
        }
    }

    /**
     * Calculate current model metrics
     */
    private fun calculateCurrentMetrics(modelId: String): ModelPerformanceMetrics {
        val predMetrics = predictionMetrics[modelId]
            ?: return ModelPerformanceMetrics(modelId = modelId)

        val recentPredictions = predMetrics.predictions.takeLast(1000)

        val accuracy = if (recentPredictions.isNotEmpty()) {
            recentPredictions.count { it.prediction == it.actual }.toDouble() /
                    recentPredictions.size
        } else {
            0.0
        }

        val latencies = predMetrics.latencies
        val sortedLatencies = latencies.sorted()

        val p50 = if (sortedLatencies.isNotEmpty()) {
            sortedLatencies[sortedLatencies.size / 2]
        } else 0.0

        val p95 = if (sortedLatencies.isNotEmpty()) {
            sortedLatencies[(sortedLatencies.size * 0.95).toInt()]
        } else 0.0

        val p99 = if (sortedLatencies.isNotEmpty()) {
            sortedLatencies[(sortedLatencies.size * 0.99).toInt()]
        } else 0.0

        return ModelPerformanceMetrics(
            modelId = modelId,
            currentAccuracy = accuracy,
            totalPredictions = predMetrics.totalPredictions.get(),
            avgLatencyMs = latencies.average(),
            p50LatencyMs = p50,
            p95LatencyMs = p95,
            p99LatencyMs = p99,
            lastUpdated = Instant.now()
        )
    }

    /**
     * Detect data drift using statistical tests
     */
    @Polyglot
    private fun detectDataDrift(modelId: String, features: Map<String, Any>) {
        try {
            val scipy = importPython("scipy")
            val numpy = importPython("numpy")

            val metrics = predictionMetrics[modelId] ?: return

            // Get historical feature distributions
            val historicalFeatures = metrics.predictions
                .take(1000)
                .map { it.features }

            if (historicalFeatures.size < 100) return

            // Check each feature for drift
            features.forEach { (featureName, value) ->
                val historicalValues = historicalFeatures
                    .mapNotNull { it[featureName] as? Double }

                if (historicalValues.size < 100) return@forEach

                // Current window
                val recentValues = historicalFeatures
                    .takeLast(100)
                    .mapNotNull { it[featureName] as? Double }

                if (recentValues.size < 50) return@forEach

                // Kolmogorov-Smirnov test
                val ksResult = scipy.stats.ks_2samp(
                    numpy.array(historicalValues),
                    numpy.array(recentValues)
                )

                val pValue = ksResult.pvalue as Double

                // If p-value < 0.05, distributions are different (drift detected)
                if (pValue < 0.05) {
                    createAlert(
                        modelId = modelId,
                        severity = AlertSeverity.WARNING,
                        message = "Data drift detected in feature '$featureName' (p-value: $pValue)"
                    )

                    logger.warn { "Data drift detected for model $modelId, feature $featureName" }
                }
            }

        } catch (e: Exception) {
            logger.error(e) { "Failed to detect data drift for model $modelId" }
        }
    }

    /**
     * Monitor system resources
     */
    @Scheduled(fixedDelay = 60000) // Every minute
    fun monitorSystemResources() {
        val runtime = Runtime.getRuntime()

        val totalMemoryMB = runtime.totalMemory() / 1024 / 1024
        val freeMemoryMB = runtime.freeMemory() / 1024 / 1024
        val usedMemoryMB = totalMemoryMB - freeMemoryMB
        val maxMemoryMB = runtime.maxMemory() / 1024 / 1024

        val memoryUsagePercent = (usedMemoryMB.toDouble() / maxMemoryMB) * 100

        // Update Prometheus metrics
        meterRegistry.gauge("ml.system.memory.used.mb", usedMemoryMB.toDouble())
        meterRegistry.gauge("ml.system.memory.total.mb", totalMemoryMB.toDouble())
        meterRegistry.gauge("ml.system.memory.max.mb", maxMemoryMB.toDouble())
        meterRegistry.gauge("ml.system.memory.usage.percent", memoryUsagePercent)

        // Alert if memory usage is high
        if (memoryUsagePercent > 90) {
            createAlert(
                modelId = "SYSTEM",
                severity = AlertSeverity.CRITICAL,
                message = "High memory usage: ${memoryUsagePercent}%"
            )
        }

        // CPU monitoring
        val osBean = java.lang.management.ManagementFactory.getOperatingSystemMXBean()
        if (osBean is com.sun.management.OperatingSystemMXBean) {
            val cpuLoad = osBean.systemCpuLoad * 100

            meterRegistry.gauge("ml.system.cpu.usage.percent", cpuLoad)

            if (cpuLoad > 90) {
                createAlert(
                    modelId = "SYSTEM",
                    severity = AlertSeverity.WARNING,
                    message = "High CPU usage: ${cpuLoad}%"
                )
            }
        }
    }

    /**
     * Monitor prediction throughput
     */
    @Scheduled(fixedDelay = 60000) // Every minute
    fun monitorThroughput() {
        predictionMetrics.forEach { (modelId, metrics) ->
            val currentCount = metrics.totalPredictions.get()
            val previousCount = metrics.previousPredictionCount.getAndSet(currentCount)

            val throughput = currentCount - previousCount // predictions per minute

            meterRegistry.gauge(
                "ml.predictions.throughput",
                listOf(io.micrometer.core.instrument.Tag.of("model_id", modelId)),
                throughput.toDouble()
            )

            // Alert if throughput drops significantly
            if (throughput < metrics.averageThroughput * 0.5 && metrics.averageThroughput > 0) {
                createAlert(
                    modelId = modelId,
                    severity = AlertSeverity.WARNING,
                    message = "Throughput dropped to $throughput/min " +
                            "(avg: ${metrics.averageThroughput}/min)"
                )
            }

            metrics.averageThroughput = (metrics.averageThroughput + throughput) / 2
        }
    }

    /**
     * Check model staleness
     */
    @Scheduled(fixedDelay = 3600000) // Every hour
    fun checkModelStaleness() {
        val models = modelService.listModels(status = ModelStatus.ACTIVE)

        models.content.forEach { model ->
            val age = java.time.Duration.between(model.createdAt, Instant.now()).toDays()

            if (age > 30) {
                createAlert(
                    modelId = model.id,
                    severity = AlertSeverity.INFO,
                    message = "Model is ${age} days old, consider retraining"
                )
            }

            meterRegistry.gauge(
                "ml.model.age.days",
                listOf(io.micrometer.core.instrument.Tag.of("model_id", model.id)),
                age.toDouble()
            )
        }
    }

    /**
     * Generate monitoring report
     */
    fun generateMonitoringReport(): MonitoringReport {
        val systemMetrics = getSystemMetrics()
        val modelReports = modelMetrics.values.toList()
        val recentAlerts = alerts.takeLast(100)

        return MonitoringReport(
            timestamp = Instant.now(),
            systemMetrics = systemMetrics,
            modelMetrics = modelReports,
            alerts = recentAlerts,
            summary = generateSummary(systemMetrics, modelReports, recentAlerts)
        )
    }

    private fun getSystemMetrics(): SystemMetrics {
        val runtime = Runtime.getRuntime()

        return SystemMetrics(
            totalMemoryMB = runtime.totalMemory() / 1024 / 1024,
            usedMemoryMB = (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024,
            maxMemoryMB = runtime.maxMemory() / 1024 / 1024,
            cpuUsagePercent = getCpuUsage(),
            activeModels = modelService.listModels(status = ModelStatus.ACTIVE).totalElements.toInt(),
            totalPredictions = predictionMetrics.values.sumOf { it.totalPredictions.get() }
        )
    }

    private fun getCpuUsage(): Double {
        val osBean = java.lang.management.ManagementFactory.getOperatingSystemMXBean()
        return if (osBean is com.sun.management.OperatingSystemMXBean) {
            osBean.systemCpuLoad * 100
        } else {
            0.0
        }
    }

    private fun generateSummary(
        system: SystemMetrics,
        models: List<ModelPerformanceMetrics>,
        alerts: List<Alert>
    ): String {
        val criticalAlerts = alerts.count { it.severity == AlertSeverity.CRITICAL }
        val warningAlerts = alerts.count { it.severity == AlertSeverity.WARNING }

        val avgAccuracy = if (models.isNotEmpty()) {
            models.map { it.currentAccuracy }.average()
        } else 0.0

        val avgLatency = if (models.isNotEmpty()) {
            models.map { it.p95LatencyMs }.average()
        } else 0.0

        return """
            System Status: ${if (criticalAlerts == 0) "HEALTHY" else "DEGRADED"}
            Active Models: ${system.activeModels}
            Average Accuracy: ${String.format("%.2f%%", avgAccuracy * 100)}
            Average p95 Latency: ${String.format("%.2f", avgLatency)}ms
            Total Predictions: ${system.totalPredictions}
            Memory Usage: ${system.usedMemoryMB}/${system.maxMemoryMB} MB
            Critical Alerts: $criticalAlerts
            Warning Alerts: $warningAlerts
        """.trimIndent()
    }

    /**
     * Create alert
     */
    private fun createAlert(
        modelId: String,
        severity: AlertSeverity,
        message: String
    ) {
        val alert = Alert(
            modelId = modelId,
            severity = severity,
            message = message,
            timestamp = Instant.now()
        )

        alerts.add(alert)

        // Keep only last 1000 alerts
        if (alerts.size > 1000) {
            alerts.removeAt(0)
        }

        logger.warn { "Alert created: [$severity] $modelId - $message" }

        // Update Prometheus counter
        meterRegistry.counter(
            "ml.alerts.total",
            "model_id", modelId,
            "severity", severity.toString()
        ).increment()

        // In production, send to alerting system (PagerDuty, Slack, etc.)
        sendAlertNotification(alert)
    }

    private fun sendAlertNotification(alert: Alert) {
        // Implement alerting logic (Slack, email, PagerDuty, etc.)
        when (alert.severity) {
            AlertSeverity.CRITICAL -> {
                logger.error { "CRITICAL ALERT: ${alert.message}" }
                // Send to PagerDuty
            }
            AlertSeverity.WARNING -> {
                logger.warn { "WARNING ALERT: ${alert.message}" }
                // Send to Slack
            }
            else -> {
                logger.info { "INFO ALERT: ${alert.message}" }
            }
        }
    }

    /**
     * Get alerts for a model
     */
    fun getAlerts(modelId: String, limit: Int = 100): List<Alert> {
        return alerts.filter { it.modelId == modelId }.takeLast(limit)
    }

    /**
     * Get all recent alerts
     */
    fun getRecentAlerts(limit: Int = 100): List<Alert> {
        return alerts.takeLast(limit)
    }

    @Polyglot
    private fun importPython(module: String): dynamic {
        return js("require('python:$module')")
    }
}

/**
 * Model performance metrics
 */
data class ModelPerformanceMetrics(
    val modelId: String,
    val currentAccuracy: Double = 0.0,
    val totalPredictions: Long = 0,
    val avgLatencyMs: Double = 0.0,
    val p50LatencyMs: Double = 0.0,
    val p95LatencyMs: Double = 0.0,
    val p99LatencyMs: Double = 0.0,
    val lastUpdated: Instant = Instant.now()
)

/**
 * Prediction metrics tracking
 */
data class PredictionMetrics(
    val modelId: String,
    val totalPredictions: AtomicLong = AtomicLong(0),
    val correctPredictions: AtomicLong = AtomicLong(0),
    val latencies: MutableList<Double> = mutableListOf(),
    val predictions: MutableList<PredictionRecord> = mutableListOf(),
    val previousPredictionCount: AtomicLong = AtomicLong(0),
    var averageThroughput: Long = 0
) {
    fun getAccuracy(): Double {
        val total = totalPredictions.get()
        return if (total > 0) {
            correctPredictions.get().toDouble() / total
        } else 0.0
    }
}

/**
 * Prediction record for monitoring
 */
data class PredictionRecord(
    val timestamp: Instant,
    val prediction: Any,
    val actual: Any,
    val latencyMs: Double,
    val features: Map<String, Any>
)

/**
 * System metrics
 */
data class SystemMetrics(
    val totalMemoryMB: Long,
    val usedMemoryMB: Long,
    val maxMemoryMB: Long,
    val cpuUsagePercent: Double,
    val activeModels: Int,
    val totalPredictions: Long
)

/**
 * Alert
 */
data class Alert(
    val modelId: String,
    val severity: AlertSeverity,
    val message: String,
    val timestamp: Instant
)

/**
 * Monitoring report
 */
data class MonitoringReport(
    val timestamp: Instant,
    val systemMetrics: SystemMetrics,
    val modelMetrics: List<ModelPerformanceMetrics>,
    val alerts: List<Alert>,
    val summary: String
)

/**
 * Model health check service
 */
@Service
class ModelHealthCheckService(
    private val modelService: ModelService,
    private val monitoringService: MLMonitoringService
) {
    private val logger = KotlinLogging.logger {}

    /**
     * Check health of all models
     */
    @Scheduled(fixedDelay = 600000) // Every 10 minutes
    fun checkModelHealth() {
        logger.debug { "Running model health checks..." }

        val models = modelService.listModels(status = ModelStatus.ACTIVE)

        models.content.forEach { model ->
            try {
                val health = checkModelHealth(model)

                if (health.status == HealthStatus.UNHEALTHY) {
                    logger.warn { "Model ${model.id} is unhealthy: ${health.issues}" }
                }

            } catch (e: Exception) {
                logger.error(e) { "Health check failed for model ${model.id}" }
            }
        }
    }

    private fun checkModelHealth(model: ModelMetadata): ModelHealth {
        val issues = mutableListOf<String>()

        // Check age
        val age = java.time.Duration.between(model.createdAt, Instant.now()).toDays()
        if (age > 90) {
            issues.add("Model is ${age} days old (>90 days)")
        }

        // Check accuracy
        if (model.metrics.accuracy < 0.7) {
            issues.add("Accuracy ${model.metrics.accuracy} is below threshold (0.7)")
        }

        // Check alerts
        val recentAlerts = monitoringService.getAlerts(model.id, limit = 10)
        val criticalAlerts = recentAlerts.count { it.severity == AlertSeverity.CRITICAL }

        if (criticalAlerts > 0) {
            issues.add("$criticalAlerts critical alerts in recent history")
        }

        val status = when {
            criticalAlerts > 0 -> HealthStatus.UNHEALTHY
            issues.isNotEmpty() -> HealthStatus.DEGRADED
            else -> HealthStatus.HEALTHY
        }

        return ModelHealth(
            modelId = model.id,
            status = status,
            issues = issues,
            lastChecked = Instant.now()
        )
    }
}

/**
 * Model health status
 */
enum class HealthStatus {
    HEALTHY,
    DEGRADED,
    UNHEALTHY
}

/**
 * Model health information
 */
data class ModelHealth(
    val modelId: String,
    val status: HealthStatus,
    val issues: List<String>,
    val lastChecked: Instant
)
