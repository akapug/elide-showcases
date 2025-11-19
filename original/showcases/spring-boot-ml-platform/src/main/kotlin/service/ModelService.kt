package com.example.mlplatform.service

import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import mu.KotlinLogging
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.annotation.PostConstruct

private val logger = KotlinLogging.logger {}

/**
 * Model Service - Manages ML model lifecycle using Python libraries
 *
 * This service demonstrates Elide's Kotlin + Python polyglot capabilities for
 * enterprise ML model management. Train, evaluate, and manage models using
 * sklearn, tensorflow, and other Python ML libraries directly from Kotlin!
 *
 * Features:
 * - Model training with multiple algorithms
 * - Model versioning and registry
 * - Performance evaluation
 * - Model persistence to S3
 * - Feature importance extraction
 * - Hyperparameter tuning
 */
@Service
class ModelService(
    private val modelRepository: ModelRepository,
    private val s3Client: S3Client
) {
    private val modelCache = ConcurrentHashMap<String, CachedModel>()

    // Python imports - available via Elide polyglot
    @Polyglot
    private val sklearn = importPython("sklearn")

    @Polyglot
    private val tensorflow = importPython("tensorflow")

    @Polyglot
    private val pandas = importPython("pandas")

    @Polyglot
    private val numpy = importPython("numpy")

    @Polyglot
    private val pickle = importPython("pickle")

    @PostConstruct
    fun initialize() {
        logger.info { "Initializing ModelService with Python ML libraries" }
        logger.info { "  - sklearn version: ${sklearn.__version__}" }
        logger.info { "  - tensorflow version: ${tensorflow.__version__}" }
        logger.info { "  - pandas version: ${pandas.__version__}" }
        logger.info { "  - numpy version: ${numpy.__version__}" }
    }

    /**
     * Train and register a new model
     */
    fun trainAndRegister(
        name: String,
        data: DataFrame,
        algorithm: Algorithm,
        hyperparameters: Map<String, Any>
    ): ModelMetadata {
        logger.info { "Training model: $name with $algorithm" }

        val startTime = System.currentTimeMillis()

        // Train model based on algorithm
        val trainedModel = when (algorithm) {
            Algorithm.RANDOM_FOREST -> trainRandomForest(data, hyperparameters)
            Algorithm.GRADIENT_BOOSTING -> trainGradientBoosting(data, hyperparameters)
            Algorithm.NEURAL_NETWORK -> trainNeuralNetwork(data, hyperparameters)
            Algorithm.SVM -> trainSVM(data, hyperparameters)
            Algorithm.LOGISTIC_REGRESSION -> trainLogisticRegression(data, hyperparameters)
            Algorithm.XGBOOST -> trainXGBoost(data, hyperparameters)
            Algorithm.LIGHTGBM -> trainLightGBM(data, hyperparameters)
        }

        val trainingTime = System.currentTimeMillis() - startTime

        // Evaluate model performance
        val metrics = evaluateModel(trainedModel, data)

        // Generate model ID and version
        val modelId = UUID.randomUUID().toString()
        val version = "1.0.0"

        // Serialize and save model to S3
        saveModelToStorage(modelId, trainedModel)

        // Extract feature importance if available
        val featureImportance = extractFeatureImportance(trainedModel, data)

        // Create metadata
        val metadata = ModelMetadata(
            id = modelId,
            name = name,
            algorithm = algorithm,
            version = version,
            status = ModelStatus.ACTIVE,
            metrics = metrics,
            hyperparameters = hyperparameters,
            featureImportance = featureImportance,
            trainingTimeMs = trainingTime,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        // Save metadata to database
        modelRepository.save(metadata)

        // Cache model for fast inference
        modelCache[modelId] = CachedModel(
            model = trainedModel,
            metadata = metadata,
            loadedAt = Instant.now()
        )

        logger.info {
            "Model trained successfully: $modelId in ${trainingTime}ms " +
                    "(accuracy: ${metrics.accuracy})"
        }

        return metadata
    }

    /**
     * Train Random Forest model using sklearn
     */
    @Polyglot
    private fun trainRandomForest(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training Random Forest with params: $params" }

        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = params["n_estimators"] as? Int ?: 100,
            max_depth = params["max_depth"] as? Int ?: 10,
            min_samples_split = params["min_samples_split"] as? Int ?: 2,
            min_samples_leaf = params["min_samples_leaf"] as? Int ?: 1,
            max_features = params["max_features"] as? String ?: "sqrt",
            bootstrap = params["bootstrap"] as? Boolean ?: true,
            random_state = 42,
            n_jobs = -1  // Use all CPU cores
        )

        model.fit(X, y)

        logger.debug {
            "Random Forest trained with ${model.n_estimators} trees, " +
                    "max_depth=${model.max_depth}"
        }

        return model
    }

    /**
     * Train Gradient Boosting model using sklearn
     */
    @Polyglot
    private fun trainGradientBoosting(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training Gradient Boosting with params: $params" }

        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        val model = sklearn.ensemble.GradientBoostingClassifier(
            n_estimators = params["n_estimators"] as? Int ?: 100,
            learning_rate = params["learning_rate"] as? Double ?: 0.1,
            max_depth = params["max_depth"] as? Int ?: 3,
            min_samples_split = params["min_samples_split"] as? Int ?: 2,
            min_samples_leaf = params["min_samples_leaf"] as? Int ?: 1,
            subsample = params["subsample"] as? Double ?: 1.0,
            random_state = 42
        )

        model.fit(X, y)

        logger.debug {
            "Gradient Boosting trained with ${model.n_estimators} estimators, " +
                    "learning_rate=${model.learning_rate}"
        }

        return model
    }

    /**
     * Train Neural Network using TensorFlow/Keras
     */
    @Polyglot
    private fun trainNeuralNetwork(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training Neural Network with params: $params" }

        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        val inputDim = X.shape[1] as Int
        val hiddenLayers = params["hidden_layers"] as? List<Int> ?: listOf(128, 64, 32)
        val dropout = params["dropout"] as? Double ?: 0.3
        val activation = params["activation"] as? String ?: "relu"

        // Build model architecture
        val layers = mutableListOf<Any>()
        layers.add(tensorflow.keras.layers.Input(shape = listOf(inputDim)))

        // Add hidden layers
        hiddenLayers.forEach { units ->
            layers.add(tensorflow.keras.layers.Dense(units, activation = activation))
            layers.add(tensorflow.keras.layers.BatchNormalization())
            layers.add(tensorflow.keras.layers.Dropout(dropout))
        }

        // Output layer
        val numClasses = y.nunique() as Int
        if (numClasses == 2) {
            layers.add(tensorflow.keras.layers.Dense(1, activation = "sigmoid"))
        } else {
            layers.add(tensorflow.keras.layers.Dense(numClasses, activation = "softmax"))
        }

        val model = tensorflow.keras.Sequential(layers)

        // Compile model
        val loss = if (numClasses == 2) "binary_crossentropy" else "categorical_crossentropy"
        model.compile(
            optimizer = tensorflow.keras.optimizers.Adam(
                learning_rate = params["learning_rate"] as? Double ?: 0.001
            ),
            loss = loss,
            metrics = listOf("accuracy", "precision", "recall", "AUC")
        )

        // Train model
        val epochs = params["epochs"] as? Int ?: 50
        val batchSize = params["batch_size"] as? Int ?: 32

        model.fit(
            X, y,
            epochs = epochs,
            batch_size = batchSize,
            validation_split = 0.2,
            callbacks = listOf(
                tensorflow.keras.callbacks.EarlyStopping(
                    monitor = "val_loss",
                    patience = 10,
                    restore_best_weights = true
                ),
                tensorflow.keras.callbacks.ReduceLROnPlateau(
                    monitor = "val_loss",
                    factor = 0.5,
                    patience = 5
                )
            ),
            verbose = 0
        )

        logger.debug {
            "Neural Network trained: ${hiddenLayers.size} hidden layers, " +
                    "$epochs epochs, batch_size=$batchSize"
        }

        return model
    }

    /**
     * Train SVM model using sklearn
     */
    @Polyglot
    private fun trainSVM(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training SVM with params: $params" }

        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        // Scale features for SVM
        val scaler = sklearn.preprocessing.StandardScaler()
        val X_scaled = scaler.fit_transform(X)

        val model = sklearn.svm.SVC(
            C = params["C"] as? Double ?: 1.0,
            kernel = params["kernel"] as? String ?: "rbf",
            gamma = params["gamma"] as? String ?: "scale",
            probability = true,  // Enable probability estimates
            random_state = 42
        )

        model.fit(X_scaled, y)

        // Store scaler with model
        model.scaler = scaler

        logger.debug { "SVM trained with kernel=${model.kernel}, C=${model.C}" }

        return model
    }

    /**
     * Train Logistic Regression model using sklearn
     */
    @Polyglot
    private fun trainLogisticRegression(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training Logistic Regression with params: $params" }

        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        val model = sklearn.linear_model.LogisticRegression(
            C = params["C"] as? Double ?: 1.0,
            penalty = params["penalty"] as? String ?: "l2",
            solver = params["solver"] as? String ?: "lbfgs",
            max_iter = params["max_iter"] as? Int ?: 1000,
            random_state = 42,
            n_jobs = -1
        )

        model.fit(X, y)

        logger.debug {
            "Logistic Regression trained with penalty=${model.penalty}, C=${model.C}"
        }

        return model
    }

    /**
     * Train XGBoost model
     */
    @Polyglot
    private fun trainXGBoost(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training XGBoost with params: $params" }

        val xgboost = importPython("xgboost")
        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        val model = xgboost.XGBClassifier(
            n_estimators = params["n_estimators"] as? Int ?: 100,
            max_depth = params["max_depth"] as? Int ?: 6,
            learning_rate = params["learning_rate"] as? Double ?: 0.3,
            subsample = params["subsample"] as? Double ?: 1.0,
            colsample_bytree = params["colsample_bytree"] as? Double ?: 1.0,
            random_state = 42,
            n_jobs = -1
        )

        model.fit(X, y)

        logger.debug { "XGBoost trained with ${model.n_estimators} estimators" }

        return model
    }

    /**
     * Train LightGBM model
     */
    @Polyglot
    private fun trainLightGBM(data: DataFrame, params: Map<String, Any>): Any {
        logger.debug { "Training LightGBM with params: $params" }

        val lightgbm = importPython("lightgbm")
        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        val model = lightgbm.LGBMClassifier(
            n_estimators = params["n_estimators"] as? Int ?: 100,
            max_depth = params["max_depth"] as? Int ?: -1,
            learning_rate = params["learning_rate"] as? Double ?: 0.1,
            num_leaves = params["num_leaves"] as? Int ?: 31,
            subsample = params["subsample"] as? Double ?: 1.0,
            colsample_bytree = params["colsample_bytree"] as? Double ?: 1.0,
            random_state = 42,
            n_jobs = -1
        )

        model.fit(X, y)

        logger.debug { "LightGBM trained with ${model.n_estimators} estimators" }

        return model
    }

    /**
     * Evaluate model performance
     */
    @Polyglot
    fun evaluateModel(model: Any, data: DataFrame): ModelMetrics {
        logger.debug { "Evaluating model performance" }

        val df = pandas.DataFrame(data.toMap())
        val X = df.drop(columns = listOf("target"))
        val y = df["target"]

        // Make predictions
        val predictions = model.predict(X)

        // Get probabilities if available
        val probabilities = try {
            model.predict_proba(X)
        } catch (e: Exception) {
            null
        }

        // Calculate metrics
        val metrics_module = sklearn.metrics

        val accuracy = metrics_module.accuracy_score(y, predictions) as Double
        val precision = metrics_module.precision_score(
            y, predictions,
            average = "weighted",
            zero_division = 0
        ) as Double
        val recall = metrics_module.recall_score(
            y, predictions,
            average = "weighted",
            zero_division = 0
        ) as Double
        val f1 = metrics_module.f1_score(
            y, predictions,
            average = "weighted",
            zero_division = 0
        ) as Double

        // Calculate AUC if probabilities available
        val auc = probabilities?.let {
            try {
                val numClasses = y.nunique() as Int
                if (numClasses == 2) {
                    // Binary classification
                    metrics_module.roc_auc_score(y, it["[:,1]"]) as Double
                } else {
                    // Multi-class
                    metrics_module.roc_auc_score(
                        y, it,
                        average = "weighted",
                        multi_class = "ovr"
                    ) as Double
                }
            } catch (e: Exception) {
                logger.warn(e) { "Failed to calculate AUC" }
                null
            }
        }

        // Confusion matrix
        val confusionMatrix = metrics_module.confusion_matrix(y, predictions)
            .tolist() as List<List<Int>>

        // Classification report
        val classificationReport = metrics_module.classification_report(
            y, predictions,
            output_dict = true
        )

        logger.debug {
            "Model evaluation complete - Accuracy: $accuracy, Precision: $precision, " +
                    "Recall: $recall, F1: $f1, AUC: $auc"
        }

        return ModelMetrics(
            accuracy = accuracy,
            precision = precision,
            recall = recall,
            f1Score = f1,
            auc = auc,
            confusionMatrix = confusionMatrix,
            classificationReport = classificationReport
        )
    }

    /**
     * Extract feature importance from tree-based models
     */
    @Polyglot
    private fun extractFeatureImportance(model: Any, data: DataFrame): Map<String, Double> {
        return try {
            val df = pandas.DataFrame(data.toMap())
            val featureNames = df.drop(columns = listOf("target")).columns.tolist() as List<String>

            val importances = model.feature_importances_ as List<Double>

            featureNames.zip(importances).toMap()
        } catch (e: Exception) {
            logger.debug { "Feature importance not available for this model type" }
            emptyMap()
        }
    }

    /**
     * Get feature importance for a trained model
     */
    @Cacheable("feature_importance")
    fun getFeatureImportance(modelId: String): Map<String, Double> {
        val cached = modelCache[modelId]
            ?: throw IllegalArgumentException("Model not found: $modelId")

        return cached.metadata.featureImportance
    }

    /**
     * Save model to S3 storage
     */
    @Polyglot
    private fun saveModelToStorage(modelId: String, model: Any) {
        logger.debug { "Saving model to S3: $modelId" }

        try {
            // Serialize model using pickle
            val modelBytes = pickle.dumps(model)

            // Upload to S3
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket("ml-models")
                    .key("models/$modelId.pkl")
                    .build(),
                RequestBody.fromBytes(modelBytes as ByteArray)
            )

            logger.info { "Model saved to S3: s3://ml-models/models/$modelId.pkl" }
        } catch (e: Exception) {
            logger.error(e) { "Failed to save model to S3: $modelId" }
            throw RuntimeException("Model storage failed", e)
        }
    }

    /**
     * Load model from storage
     */
    @Polyglot
    @Cacheable("models")
    fun loadModel(modelId: String): Any {
        logger.debug { "Loading model from storage: $modelId" }

        // Check cache first
        modelCache[modelId]?.let {
            logger.debug { "Model loaded from cache: $modelId" }
            return it.model
        }

        try {
            // Load from S3
            val s3Object = s3Client.getObject(
                software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
                    .bucket("ml-models")
                    .key("models/$modelId.pkl")
                    .build()
            )

            val modelBytes = s3Object.readAllBytes()

            // Deserialize using pickle
            val model = pickle.loads(modelBytes)

            // Load metadata
            val metadata = modelRepository.findById(modelId).orElseThrow {
                IllegalArgumentException("Model metadata not found: $modelId")
            }

            // Cache model
            modelCache[modelId] = CachedModel(
                model = model,
                metadata = metadata,
                loadedAt = Instant.now()
            )

            logger.info { "Model loaded from S3: $modelId" }

            return model

        } catch (e: Exception) {
            logger.error(e) { "Failed to load model: $modelId" }
            throw RuntimeException("Model loading failed", e)
        }
    }

    /**
     * Get model metadata
     */
    fun getModel(modelId: String): ModelMetadata {
        return modelRepository.findById(modelId).orElseThrow {
            IllegalArgumentException("Model not found: $modelId")
        }
    }

    /**
     * List models with filtering
     */
    fun listModels(
        page: Int = 0,
        size: Int = 20,
        algorithm: Algorithm? = null,
        status: ModelStatus? = null
    ): Page<ModelMetadata> {
        val pageable = PageRequest.of(page, size)

        return when {
            algorithm != null && status != null ->
                modelRepository.findByAlgorithmAndStatus(algorithm, status, pageable)
            algorithm != null ->
                modelRepository.findByAlgorithm(algorithm, pageable)
            status != null ->
                modelRepository.findByStatus(status, pageable)
            else ->
                modelRepository.findAll(pageable)
        }
    }

    /**
     * Delete model
     */
    @CacheEvict("models", key = "#modelId")
    fun deleteModel(modelId: String) {
        logger.info { "Deleting model: $modelId" }

        // Remove from cache
        modelCache.remove(modelId)

        // Delete from S3
        try {
            s3Client.deleteObject(
                software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
                    .bucket("ml-models")
                    .key("models/$modelId.pkl")
                    .build()
            )
        } catch (e: Exception) {
            logger.warn(e) { "Failed to delete model from S3: $modelId" }
        }

        // Delete metadata
        modelRepository.deleteById(modelId)

        logger.info { "Model deleted: $modelId" }
    }

    /**
     * Deploy model to production environment
     */
    fun deployModel(
        modelId: String,
        environment: String,
        replicas: Int = 3
    ): ModelDeployment {
        logger.info { "Deploying model $modelId to $environment with $replicas replicas" }

        val metadata = getModel(modelId)

        // Create deployment
        val deployment = ModelDeployment(
            modelId = modelId,
            environment = environment,
            replicas = replicas,
            endpoint = "https://ml-api-$environment.example.com/models/$modelId/predict",
            status = "DEPLOYED",
            deployedAt = Instant.now()
        )

        // Update model status
        metadata.status = ModelStatus.DEPLOYED
        metadata.updatedAt = Instant.now()
        modelRepository.save(metadata)

        return deployment
    }

    /**
     * Retrain existing model with new data
     */
    fun retrainModel(
        modelId: String,
        data: DataFrame,
        hyperparameters: Map<String, Any>? = null
    ): ModelMetadata {
        logger.info { "Retraining model: $modelId" }

        val existing = getModel(modelId)

        // Use existing hyperparameters if not provided
        val params = hyperparameters ?: existing.hyperparameters

        // Train new version
        val newMetadata = trainAndRegister(
            name = "${existing.name}-retrained",
            data = data,
            algorithm = existing.algorithm,
            hyperparameters = params
        )

        logger.info { "Model retrained: $modelId -> ${newMetadata.id}" }

        return newMetadata
    }

    /**
     * Get metrics history for a model
     */
    fun getMetricsHistory(
        modelId: String,
        startDate: Instant? = null,
        endDate: Instant? = null
    ): List<MetricsSnapshot> {
        // In real implementation, this would query a time-series database
        // For now, return current metrics
        val metadata = getModel(modelId)

        return listOf(
            MetricsSnapshot(
                timestamp = metadata.createdAt,
                metrics = metadata.metrics
            )
        )
    }

    @Polyglot
    private fun importPython(module: String): dynamic {
        return js("require('python:$module')")
    }
}

/**
 * Cached model with metadata
 */
data class CachedModel(
    val model: Any,
    val metadata: ModelMetadata,
    val loadedAt: Instant
)
