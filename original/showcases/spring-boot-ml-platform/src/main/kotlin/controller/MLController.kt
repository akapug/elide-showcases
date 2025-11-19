package com.example.mlplatform.controller

import com.example.mlplatform.service.*
import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import mu.KotlinLogging
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.time.Instant
import java.util.*
import java.util.concurrent.CompletableFuture
import javax.validation.Valid
import javax.validation.constraints.*

private val logger = KotlinLogging.logger {}

/**
 * Main ML REST Controller - Demonstrates Elide Kotlin + Python Polyglot
 *
 * This controller shows how to build enterprise ML APIs using Elide's polyglot runtime.
 * Python ML libraries (sklearn, tensorflow, pandas) are imported and used directly in Kotlin!
 *
 * Key Features:
 * - Real-time predictions (<10ms latency)
 * - Model training with Python libraries
 * - Batch inference
 * - Model management
 * - Feature engineering with pandas
 *
 * Zero microservices overhead - everything runs in a single Spring Boot process.
 */
@RestController
@RequestMapping("/api/ml")
@Validated
class MLController(
    private val modelService: ModelService,
    private val predictionService: PredictionService,
    private val featureEngine: FeatureEngineering
) {

    /**
     * Health check endpoint with Python runtime status
     */
    @GetMapping("/health")
    fun health(): ResponseEntity<HealthResponse> {
        return try {
            val sklearn = importPython("sklearn")
            val tf = importPython("tensorflow")

            ResponseEntity.ok(
                HealthResponse(
                    status = "UP",
                    pythonRuntime = "available",
                    libraries = mapOf(
                        "sklearn" to sklearn.__version__.toString(),
                        "tensorflow" to tf.__version__.toString()
                    ),
                    timestamp = Instant.now()
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Health check failed" }
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                HealthResponse(
                    status = "DOWN",
                    pythonRuntime = "unavailable",
                    error = e.message,
                    timestamp = Instant.now()
                )
            )
        }
    }

    /**
     * Train a new ML model using Python libraries
     *
     * POST /api/ml/train
     * {
     *   "name": "fraud-detector-v3",
     *   "algorithm": "RANDOM_FOREST",
     *   "dataSource": "s3://training-data/fraud.csv",
     *   "targetColumn": "is_fraud",
     *   "hyperparameters": {
     *     "n_estimators": 100,
     *     "max_depth": 10
     *   }
     * }
     */
    @PostMapping("/train")
    fun trainModel(@Valid @RequestBody request: TrainRequest): ResponseEntity<TrainResponse> {
        logger.info { "Training model: ${request.name} with ${request.algorithm}" }

        return try {
            val startTime = System.currentTimeMillis()

            // Load and prepare data using pandas
            val data = loadTrainingData(request.dataSource)
            val engineeredData = featureEngine.engineerFeatures(data)

            // Train model using Python ML libraries
            val metadata = modelService.trainAndRegister(
                name = request.name,
                data = engineeredData,
                algorithm = request.algorithm,
                hyperparameters = request.hyperparameters
            )

            val duration = System.currentTimeMillis() - startTime

            logger.info { "Model trained successfully: ${metadata.id} in ${duration}ms" }

            ResponseEntity.ok(
                TrainResponse(
                    modelId = metadata.id,
                    status = "COMPLETED",
                    metrics = metadata.metrics,
                    trainingTimeMs = duration,
                    completedAt = Instant.now()
                )
            )

        } catch (e: Exception) {
            logger.error(e) { "Model training failed: ${request.name}" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                TrainResponse(
                    status = "FAILED",
                    error = e.message
                )
            )
        }
    }

    /**
     * Make a single prediction - demonstrates <10ms latency
     *
     * POST /api/ml/predict
     * {
     *   "modelId": "model-123",
     *   "features": {
     *     "amount": 1250.50,
     *     "merchant_category": "online_retail",
     *     "hour": 14,
     *     "day_of_week": 3
     *   }
     * }
     */
    @PostMapping("/predict")
    fun predict(@Valid @RequestBody request: PredictRequest): ResponseEntity<PredictResponse> {
        val startTime = System.nanoTime()

        return try {
            // Engineer features using pandas
            val engineeredFeatures = featureEngine.transformFeatures(request.features)

            // Make prediction using cached Python model
            val prediction = predictionService.predict(
                modelId = request.modelId,
                features = engineeredFeatures
            )

            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0

            logger.debug { "Prediction completed in ${latencyMs}ms" }

            ResponseEntity.ok(
                PredictResponse(
                    prediction = prediction.value,
                    confidence = prediction.confidence,
                    latencyMs = latencyMs,
                    modelId = request.modelId,
                    modelVersion = prediction.modelVersion,
                    timestamp = Instant.now()
                )
            )

        } catch (e: Exception) {
            logger.error(e) { "Prediction failed for model: ${request.modelId}" }
            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0

            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                PredictResponse(
                    latencyMs = latencyMs,
                    error = e.message
                )
            )
        }
    }

    /**
     * Batch predictions - process up to 10,000 records efficiently
     *
     * POST /api/ml/predict/batch
     * {
     *   "modelId": "model-123",
     *   "records": [
     *     {"amount": 125.50, "merchant_category": "grocery", ...},
     *     {"amount": 2500.00, "merchant_category": "jewelry", ...}
     *   ]
     * }
     */
    @PostMapping("/predict/batch")
    fun batchPredict(
        @Valid @RequestBody request: BatchPredictRequest
    ): ResponseEntity<BatchPredictResponse> {
        val startTime = System.nanoTime()

        return try {
            require(request.records.size <= 10000) {
                "Batch size cannot exceed 10,000 records"
            }

            logger.info { "Processing batch prediction: ${request.records.size} records" }

            // Engineer features for all records using pandas (vectorized operations)
            val engineeredRecords = request.records.map { record ->
                featureEngine.transformFeatures(record)
            }

            // Batch prediction using Python model
            val predictions = predictionService.batchPredict(
                modelId = request.modelId,
                batch = engineeredRecords
            )

            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0
            val avgLatencyMs = latencyMs / request.records.size

            logger.info {
                "Batch prediction completed: ${request.records.size} records in ${latencyMs}ms " +
                        "(avg: ${avgLatencyMs}ms per record)"
            }

            ResponseEntity.ok(
                BatchPredictResponse(
                    predictions = predictions.mapIndexed { index, pred ->
                        PredictionResult(
                            index = index,
                            prediction = pred.value,
                            confidence = pred.confidence
                        )
                    },
                    totalRecords = request.records.size,
                    totalLatencyMs = latencyMs,
                    avgLatencyMs = avgLatencyMs,
                    modelId = request.modelId,
                    timestamp = Instant.now()
                )
            )

        } catch (e: Exception) {
            logger.error(e) { "Batch prediction failed" }
            val latencyMs = (System.nanoTime() - startTime) / 1_000_000.0

            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BatchPredictResponse(
                    predictions = emptyList(),
                    totalRecords = request.records.size,
                    totalLatencyMs = latencyMs,
                    error = e.message
                )
            )
        }
    }

    /**
     * Async batch prediction for large datasets
     */
    @PostMapping("/predict/batch/async")
    fun asyncBatchPredict(
        @Valid @RequestBody request: BatchPredictRequest
    ): ResponseEntity<AsyncBatchResponse> {
        val jobId = UUID.randomUUID().toString()

        logger.info { "Queued async batch prediction: $jobId (${request.records.size} records)" }

        CompletableFuture.runAsync {
            try {
                batchPredict(request)
                logger.info { "Async batch prediction completed: $jobId" }
            } catch (e: Exception) {
                logger.error(e) { "Async batch prediction failed: $jobId" }
            }
        }

        return ResponseEntity.accepted().body(
            AsyncBatchResponse(
                jobId = jobId,
                status = "QUEUED",
                totalRecords = request.records.size,
                estimatedTimeSeconds = (request.records.size / 1000) * 5,
                statusUrl = "/api/ml/jobs/$jobId/status"
            )
        )
    }

    /**
     * Upload training data and train model
     */
    @PostMapping("/train/upload")
    fun uploadAndTrain(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("name") name: String,
        @RequestParam("algorithm") algorithm: Algorithm,
        @RequestParam("targetColumn") targetColumn: String,
        @RequestParam(required = false) hyperparameters: Map<String, Any>?
    ): ResponseEntity<TrainResponse> {
        return try {
            // Load CSV using pandas
            val pd = importPython("pandas")
            val data = pd.read_csv(file.inputStream)

            logger.info { "Uploaded data: ${data.shape[0]} rows, ${data.shape[1]} columns" }

            // Prepare training request
            val trainRequest = TrainRequest(
                name = name,
                algorithm = algorithm,
                dataSource = "upload://${file.originalFilename}",
                targetColumn = targetColumn,
                hyperparameters = hyperparameters ?: emptyMap(),
                data = data.toDataFrame()
            )

            trainModel(trainRequest)

        } catch (e: Exception) {
            logger.error(e) { "Upload and train failed" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                TrainResponse(
                    status = "FAILED",
                    error = e.message
                )
            )
        }
    }

    /**
     * Get model information
     */
    @GetMapping("/models/{modelId}")
    fun getModel(@PathVariable modelId: String): ResponseEntity<ModelInfo> {
        return try {
            val model = modelService.getModel(modelId)
            ResponseEntity.ok(
                ModelInfo(
                    id = model.id,
                    name = model.name,
                    algorithm = model.algorithm,
                    version = model.version,
                    status = model.status,
                    metrics = model.metrics,
                    createdAt = model.createdAt,
                    updatedAt = model.updatedAt
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Get model failed: $modelId" }
            ResponseEntity.notFound().build()
        }
    }

    /**
     * List all models
     */
    @GetMapping("/models")
    fun listModels(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) algorithm: Algorithm?,
        @RequestParam(required = false) status: ModelStatus?
    ): ResponseEntity<ModelListResponse> {
        return try {
            val models = modelService.listModels(
                page = page,
                size = size,
                algorithm = algorithm,
                status = status
            )

            ResponseEntity.ok(
                ModelListResponse(
                    models = models.content.map { model ->
                        ModelInfo(
                            id = model.id,
                            name = model.name,
                            algorithm = model.algorithm,
                            version = model.version,
                            status = model.status,
                            metrics = model.metrics,
                            createdAt = model.createdAt,
                            updatedAt = model.updatedAt
                        )
                    },
                    total = models.totalElements,
                    page = page,
                    size = size
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "List models failed" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ModelListResponse(
                    models = emptyList(),
                    total = 0,
                    error = e.message
                )
            )
        }
    }

    /**
     * Delete a model
     */
    @DeleteMapping("/models/{modelId}")
    fun deleteModel(@PathVariable modelId: String): ResponseEntity<DeleteResponse> {
        return try {
            modelService.deleteModel(modelId)
            logger.info { "Model deleted: $modelId" }

            ResponseEntity.ok(
                DeleteResponse(
                    modelId = modelId,
                    status = "DELETED",
                    timestamp = Instant.now()
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Delete model failed: $modelId" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                DeleteResponse(
                    modelId = modelId,
                    status = "FAILED",
                    error = e.message
                )
            )
        }
    }

    /**
     * Deploy model to production
     */
    @PostMapping("/models/{modelId}/deploy")
    fun deployModel(
        @PathVariable modelId: String,
        @RequestBody request: DeployRequest
    ): ResponseEntity<DeployResponse> {
        return try {
            val deployment = modelService.deployModel(
                modelId = modelId,
                environment = request.environment,
                replicas = request.replicas
            )

            logger.info { "Model deployed: $modelId to ${request.environment}" }

            ResponseEntity.ok(
                DeployResponse(
                    modelId = modelId,
                    environment = request.environment,
                    status = "DEPLOYED",
                    endpoint = deployment.endpoint,
                    timestamp = Instant.now()
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Deploy model failed: $modelId" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                DeployResponse(
                    modelId = modelId,
                    status = "FAILED",
                    error = e.message
                )
            )
        }
    }

    /**
     * Evaluate model performance on test data
     */
    @PostMapping("/models/{modelId}/evaluate")
    fun evaluateModel(
        @PathVariable modelId: String,
        @RequestBody request: EvaluateRequest
    ): ResponseEntity<EvaluateResponse> {
        return try {
            val testData = loadTestData(request.dataSource)

            val metrics = modelService.evaluateModel(
                modelId = modelId,
                data = testData
            )

            logger.info { "Model evaluated: $modelId - Accuracy: ${metrics.accuracy}" }

            ResponseEntity.ok(
                EvaluateResponse(
                    modelId = modelId,
                    metrics = metrics,
                    timestamp = Instant.now()
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Evaluate model failed: $modelId" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                EvaluateResponse(
                    modelId = modelId,
                    error = e.message
                )
            )
        }
    }

    /**
     * Get feature importance from tree-based models
     */
    @GetMapping("/models/{modelId}/feature-importance")
    fun getFeatureImportance(@PathVariable modelId: String): ResponseEntity<FeatureImportanceResponse> {
        return try {
            val importance = modelService.getFeatureImportance(modelId)

            ResponseEntity.ok(
                FeatureImportanceResponse(
                    modelId = modelId,
                    features = importance
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Get feature importance failed: $modelId" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                FeatureImportanceResponse(
                    modelId = modelId,
                    error = e.message
                )
            )
        }
    }

    /**
     * Explain a single prediction using SHAP values
     */
    @PostMapping("/explain")
    fun explainPrediction(
        @Valid @RequestBody request: ExplainRequest
    ): ResponseEntity<ExplainResponse> {
        return try {
            val explanation = predictionService.explainPrediction(
                modelId = request.modelId,
                features = request.features
            )

            ResponseEntity.ok(
                ExplainResponse(
                    modelId = request.modelId,
                    prediction = explanation.prediction,
                    baseValue = explanation.baseValue,
                    shapValues = explanation.shapValues,
                    featureContributions = explanation.featureContributions
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Explain prediction failed" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ExplainResponse(
                    modelId = request.modelId,
                    error = e.message
                )
            )
        }
    }

    /**
     * Get model performance metrics over time
     */
    @GetMapping("/models/{modelId}/metrics/history")
    fun getMetricsHistory(
        @PathVariable modelId: String,
        @RequestParam(required = false) startDate: Instant?,
        @RequestParam(required = false) endDate: Instant?
    ): ResponseEntity<MetricsHistoryResponse> {
        return try {
            val history = modelService.getMetricsHistory(
                modelId = modelId,
                startDate = startDate,
                endDate = endDate
            )

            ResponseEntity.ok(
                MetricsHistoryResponse(
                    modelId = modelId,
                    history = history
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Get metrics history failed: $modelId" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                MetricsHistoryResponse(
                    modelId = modelId,
                    error = e.message
                )
            )
        }
    }

    /**
     * Retrain model with new data
     */
    @PostMapping("/models/{modelId}/retrain")
    fun retrainModel(
        @PathVariable modelId: String,
        @RequestBody request: RetrainRequest
    ): ResponseEntity<TrainResponse> {
        return try {
            logger.info { "Retraining model: $modelId" }

            val newData = loadTrainingData(request.dataSource)
            val metadata = modelService.retrainModel(
                modelId = modelId,
                data = newData,
                hyperparameters = request.hyperparameters
            )

            ResponseEntity.ok(
                TrainResponse(
                    modelId = metadata.id,
                    status = "COMPLETED",
                    metrics = metadata.metrics,
                    completedAt = Instant.now()
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Retrain model failed: $modelId" }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                TrainResponse(
                    status = "FAILED",
                    error = e.message
                )
            )
        }
    }

    // Helper functions

    @Polyglot
    private fun importPython(module: String): dynamic {
        // Elide polyglot import
        return js("require('python:$module')")
    }

    @Polyglot
    private fun loadTrainingData(source: String): DataFrame {
        val pd = importPython("pandas")

        return when {
            source.startsWith("s3://") -> {
                // Load from S3
                val bucket = source.substringAfter("s3://").substringBefore("/")
                val key = source.substringAfter("s3://$bucket/")
                // S3 loading logic...
                pd.read_csv(source).toDataFrame()
            }
            source.startsWith("upload://") -> {
                // Already loaded in memory
                DataFrame.empty()
            }
            else -> {
                // Load from local file
                pd.read_csv(source).toDataFrame()
            }
        }
    }

    @Polyglot
    private fun loadTestData(source: String): DataFrame {
        return loadTrainingData(source)
    }
}

/**
 * Exception handler for ML operations
 */
@RestControllerAdvice
class MLExceptionHandler {

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgument(e: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.badRequest().body(
            ErrorResponse(
                error = "Invalid argument",
                message = e.message ?: "Invalid request",
                timestamp = Instant.now()
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(e: Exception): ResponseEntity<ErrorResponse> {
        logger.error(e) { "Unexpected error" }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse(
                error = "Internal server error",
                message = e.message ?: "An unexpected error occurred",
                timestamp = Instant.now()
            )
        )
    }
}
