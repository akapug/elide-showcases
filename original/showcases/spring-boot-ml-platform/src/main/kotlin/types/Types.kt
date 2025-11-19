package com.example.mlplatform.types

import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import javax.persistence.*
import javax.validation.constraints.*

/**
 * Type definitions for ML Platform
 *
 * This file contains all data types, request/response models,
 * JPA entities, and repository interfaces for the ML platform.
 */

// ============================================================================
// JPA Entities
// ============================================================================

/**
 * Model metadata entity
 */
@Entity
@Table(name = "models")
data class ModelMetadata(
    @Id
    val id: String,

    @Column(nullable = false)
    val name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val algorithm: Algorithm,

    @Column(nullable = false)
    var version: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ModelStatus = ModelStatus.ACTIVE,

    @Embedded
    var metrics: ModelMetrics = ModelMetrics(),

    @Column(columnDefinition = "TEXT")
    var hyperparameters: Map<String, Any> = emptyMap(),

    @Column(columnDefinition = "TEXT")
    var featureImportance: Map<String, Double> = emptyMap(),

    @Column
    var trainingTimeMs: Long = 0,

    @Column
    @CreatedDate
    val createdAt: Instant = Instant.now(),

    @Column
    @LastModifiedDate
    var updatedAt: Instant = Instant.now(),

    @Column
    var deployedAt: Instant? = null
)

/**
 * Model metrics embedded type
 */
@Embeddable
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ModelMetrics(
    @Column
    var accuracy: Double = 0.0,

    @Column
    var precision: Double = 0.0,

    @Column
    var recall: Double = 0.0,

    @Column
    var f1Score: Double = 0.0,

    @Column
    var auc: Double? = null,

    @Column(columnDefinition = "TEXT")
    var confusionMatrix: List<List<Int>> = emptyList(),

    @Column(columnDefinition = "TEXT")
    var classificationReport: Any? = null
)

// ============================================================================
// Enums
// ============================================================================

/**
 * Supported ML algorithms
 */
enum class Algorithm {
    RANDOM_FOREST,
    GRADIENT_BOOSTING,
    NEURAL_NETWORK,
    SVM,
    LOGISTIC_REGRESSION,
    XGBOOST,
    LIGHTGBM,
    DECISION_TREE,
    NAIVE_BAYES,
    KNN
}

/**
 * Model status
 */
enum class ModelStatus {
    TRAINING,
    ACTIVE,
    DEPLOYED,
    DEPRECATED,
    FAILED,
    DELETED
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Health check response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class HealthResponse(
    val status: String,
    val pythonRuntime: String,
    val libraries: Map<String, String>? = null,
    val error: String? = null,
    val timestamp: Instant
)

/**
 * Training request
 */
data class TrainRequest(
    @field:NotBlank(message = "Model name is required")
    val name: String,

    @field:NotNull(message = "Algorithm is required")
    val algorithm: Algorithm,

    @field:NotBlank(message = "Data source is required")
    val dataSource: String,

    @field:NotBlank(message = "Target column is required")
    val targetColumn: String,

    val hyperparameters: Map<String, Any> = emptyMap(),

    @field:Min(0)
    @field:Max(1)
    val validationSplit: Double = 0.2,

    val data: DataFrame? = null
)

/**
 * Training response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class TrainResponse(
    val modelId: String? = null,
    val status: String,
    val metrics: ModelMetrics? = null,
    val trainingTimeMs: Long? = null,
    val completedAt: Instant? = null,
    val error: String? = null
)

/**
 * Prediction request
 */
data class PredictRequest(
    @field:NotBlank(message = "Model ID is required")
    val modelId: String,

    @field:NotEmpty(message = "Features are required")
    val features: Map<String, Any>
)

/**
 * Prediction response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class PredictResponse(
    val prediction: Any? = null,
    val confidence: Double? = null,
    val latencyMs: Double,
    val modelId: String? = null,
    val modelVersion: String? = null,
    val timestamp: Instant? = null,
    val error: String? = null
)

/**
 * Batch prediction request
 */
data class BatchPredictRequest(
    @field:NotBlank(message = "Model ID is required")
    val modelId: String,

    @field:NotEmpty(message = "Records are required")
    @field:Size(max = 10000, message = "Batch size cannot exceed 10,000")
    val records: List<Map<String, Any>>
)

/**
 * Batch prediction response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class BatchPredictResponse(
    val predictions: List<PredictionResult>,
    val totalRecords: Int,
    val totalLatencyMs: Double,
    val avgLatencyMs: Double? = null,
    val modelId: String? = null,
    val timestamp: Instant? = null,
    val error: String? = null
)

/**
 * Single prediction result in batch
 */
data class PredictionResult(
    val index: Int,
    val prediction: Any,
    val confidence: Double
)

/**
 * Async batch response
 */
data class AsyncBatchResponse(
    val jobId: String,
    val status: String,
    val totalRecords: Int,
    val estimatedTimeSeconds: Int,
    val statusUrl: String
)

/**
 * Model information
 */
data class ModelInfo(
    val id: String,
    val name: String,
    val algorithm: Algorithm,
    val version: String,
    val status: ModelStatus,
    val metrics: ModelMetrics,
    val createdAt: Instant,
    val updatedAt: Instant
)

/**
 * Model list response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ModelListResponse(
    val models: List<ModelInfo>,
    val total: Long,
    val page: Int? = null,
    val size: Int? = null,
    val error: String? = null
)

/**
 * Delete response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class DeleteResponse(
    val modelId: String,
    val status: String,
    val timestamp: Instant? = null,
    val error: String? = null
)

/**
 * Deploy request
 */
data class DeployRequest(
    @field:NotBlank(message = "Environment is required")
    val environment: String,

    @field:Min(1)
    val replicas: Int = 3
)

/**
 * Deploy response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class DeployResponse(
    val modelId: String,
    val environment: String? = null,
    val status: String,
    val endpoint: String? = null,
    val timestamp: Instant? = null,
    val error: String? = null
)

/**
 * Model deployment info
 */
data class ModelDeployment(
    val modelId: String,
    val environment: String,
    val replicas: Int,
    val endpoint: String,
    val status: String,
    val deployedAt: Instant
)

/**
 * Evaluate request
 */
data class EvaluateRequest(
    @field:NotBlank(message = "Data source is required")
    val dataSource: String
)

/**
 * Evaluate response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class EvaluateResponse(
    val modelId: String,
    val metrics: ModelMetrics? = null,
    val timestamp: Instant? = null,
    val error: String? = null
)

/**
 * Feature importance response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class FeatureImportanceResponse(
    val modelId: String,
    val features: Map<String, Double>? = null,
    val error: String? = null
)

/**
 * Explain request
 */
data class ExplainRequest(
    @field:NotBlank(message = "Model ID is required")
    val modelId: String,

    @field:NotEmpty(message = "Features are required")
    val features: Map<String, Any>
)

/**
 * Explain response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ExplainResponse(
    val modelId: String,
    val prediction: Any? = null,
    val baseValue: Double? = null,
    val shapValues: List<Double>? = null,
    val featureContributions: List<Map<String, Any>>? = null,
    val error: String? = null
)

/**
 * Metrics history response
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class MetricsHistoryResponse(
    val modelId: String,
    val history: List<MetricsSnapshot>? = null,
    val error: String? = null
)

/**
 * Metrics snapshot
 */
data class MetricsSnapshot(
    val timestamp: Instant,
    val metrics: ModelMetrics
)

/**
 * Retrain request
 */
data class RetrainRequest(
    @field:NotBlank(message = "Data source is required")
    val dataSource: String,

    val hyperparameters: Map<String, Any>? = null
)

/**
 * Error response
 */
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: Instant
)

/**
 * Prediction entity
 */
data class Prediction(
    val value: Any,
    val confidence: Double,
    val latencyMs: Double? = null,
    val modelId: String? = null,
    val modelVersion: String? = null,
    val timestamp: Instant = Instant.now()
)

// ============================================================================
// DataFrame abstraction
// ============================================================================

/**
 * DataFrame - wrapper around pandas DataFrame
 */
data class DataFrame(
    val data: Map<String, List<Any>>,
    val rows: Int = 0,
    val columns: Int = 0
) {
    fun toMap(): Map<String, List<Any>> = data

    companion object {
        fun empty() = DataFrame(emptyMap(), 0, 0)
    }
}

// Extension function for Python DataFrame conversion
fun dynamic.toDataFrame(): DataFrame {
    // Convert Python DataFrame to Kotlin DataFrame
    val columns = this.columns.tolist() as List<String>
    val data = columns.associateWith { col ->
        this[col].tolist() as List<Any>
    }
    val rows = this.shape[0] as Int
    return DataFrame(data, rows, columns.size)
}

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Model repository
 */
@Repository
interface ModelRepository : JpaRepository<ModelMetadata, String> {

    fun findByName(name: String): List<ModelMetadata>

    fun findByAlgorithm(algorithm: Algorithm, pageable: Pageable): Page<ModelMetadata>

    fun findByStatus(status: ModelStatus, pageable: Pageable): Page<ModelMetadata>

    fun findByAlgorithmAndStatus(
        algorithm: Algorithm,
        status: ModelStatus,
        pageable: Pageable
    ): Page<ModelMetadata>

    @Query("SELECT m FROM ModelMetadata m WHERE m.status = :status ORDER BY m.createdAt DESC")
    fun findActiveModels(status: ModelStatus = ModelStatus.ACTIVE): List<ModelMetadata>

    @Query("SELECT m FROM ModelMetadata m WHERE m.metrics.accuracy >= :threshold")
    fun findHighPerformingModels(threshold: Double = 0.9): List<ModelMetadata>
}

// ============================================================================
// Additional Types
// ============================================================================

/**
 * Training job status
 */
data class TrainingJob(
    val jobId: String,
    val modelId: String,
    val status: JobStatus,
    val startedAt: Instant,
    val completedAt: Instant? = null,
    val progress: Double = 0.0,
    val error: String? = null
)

/**
 * Job status
 */
enum class JobStatus {
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED,
    CANCELLED
}

/**
 * Hyperparameter search space
 */
data class HyperparameterSpace(
    val parameterName: String,
    val type: ParameterType,
    val range: List<Any>
)

/**
 * Parameter type
 */
enum class ParameterType {
    INTEGER,
    FLOAT,
    CATEGORICAL,
    BOOLEAN
}

/**
 * Model comparison
 */
data class ModelComparison(
    val models: List<ModelMetadata>,
    val comparisonMetric: String,
    val winner: String
)

/**
 * Data split configuration
 */
data class DataSplitConfig(
    val trainRatio: Double = 0.8,
    val validationRatio: Double = 0.1,
    val testRatio: Double = 0.1,
    val randomState: Int = 42,
    val stratify: Boolean = true
)

/**
 * Cross-validation configuration
 */
data class CrossValidationConfig(
    val folds: Int = 5,
    val shuffle: Boolean = true,
    val randomState: Int = 42
)

/**
 * Feature engineering pipeline
 */
data class FeaturePipeline(
    val steps: List<FeatureStep>
)

/**
 * Feature engineering step
 */
data class FeatureStep(
    val name: String,
    val type: FeatureStepType,
    val parameters: Map<String, Any> = emptyMap()
)

/**
 * Feature step type
 */
enum class FeatureStepType {
    TEMPORAL,
    STATISTICAL,
    CATEGORICAL_ENCODING,
    NORMALIZATION,
    INTERACTION,
    ROLLING_WINDOW,
    OUTLIER_REMOVAL,
    MISSING_VALUE_IMPUTATION,
    FEATURE_SELECTION
}

/**
 * Model performance report
 */
data class PerformanceReport(
    val modelId: String,
    val metrics: ModelMetrics,
    val featureImportance: Map<String, Double>,
    val confusionMatrix: List<List<Int>>,
    val rocCurve: ROCCurve? = null,
    val prCurve: PRCurve? = null
)

/**
 * ROC curve data
 */
data class ROCCurve(
    val fpr: List<Double>,
    val tpr: List<Double>,
    val thresholds: List<Double>,
    val auc: Double
)

/**
 * Precision-Recall curve data
 */
data class PRCurve(
    val precision: List<Double>,
    val recall: List<Double>,
    val thresholds: List<Double>,
    val auc: Double
)

/**
 * Data drift detection result
 */
data class DataDrift(
    val detected: Boolean,
    val driftScore: Double,
    val driftedFeatures: List<String>,
    val timestamp: Instant
)

/**
 * Model monitoring alert
 */
data class ModelAlert(
    val modelId: String,
    val severity: AlertSeverity,
    val message: String,
    val timestamp: Instant
)

/**
 * Alert severity
 */
enum class AlertSeverity {
    INFO,
    WARNING,
    ERROR,
    CRITICAL
}

/**
 * Prediction log entry
 */
@Entity
@Table(name = "prediction_logs")
data class PredictionLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val modelId: String,

    @Column(columnDefinition = "TEXT")
    val features: String,

    @Column(columnDefinition = "TEXT")
    val prediction: String,

    @Column
    val confidence: Double,

    @Column
    val latencyMs: Double,

    @Column
    @CreatedDate
    val timestamp: Instant = Instant.now()
)

/**
 * Model A/B test configuration
 */
data class ABTestConfig(
    val experimentId: String,
    val modelA: String,
    val modelB: String,
    val trafficSplit: Double = 0.5,
    val successMetric: String = "accuracy"
)

/**
 * Batch processing configuration
 */
data class BatchConfig(
    val batchSize: Int = 1000,
    val parallelism: Int = 4,
    val timeoutMs: Long = 30000
)
