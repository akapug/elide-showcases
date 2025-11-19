package com.example.mlplatform.examples

import com.example.mlplatform.service.*
import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot

/**
 * Spring Boot ML Platform - Comprehensive Examples
 *
 * This file demonstrates the full power of Elide's Kotlin + Python polyglot
 * capabilities for enterprise ML applications. All examples run in a single
 * Spring Boot process with zero microservices overhead!
 */

// ============================================================================
// Example 1: Simple Classification Model
// ============================================================================

/**
 * Train a fraud detection model using Random Forest
 */
@Polyglot
fun fraudDetectionExample() {
    // Import Python libraries directly in Kotlin!
    val sklearn = importPython("sklearn")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    println("=== Fraud Detection Example ===")

    // Generate sample fraud data using numpy
    val nSamples = 1000
    val X = numpy.random.randn(nSamples, 10)
    val y = numpy.random.randint(0, 2, nSamples)

    // Create pandas DataFrame
    val df = pandas.DataFrame(X, columns = (0..9).map { "feature_$it" })
    df["is_fraud"] = y

    // Train Random Forest model
    val model = sklearn.ensemble.RandomForestClassifier(
        n_estimators = 100,
        max_depth = 10,
        random_state = 42
    )

    val XTrain = df.drop(columns = listOf("is_fraud"))
    val yTrain = df["is_fraud"]

    model.fit(XTrain, yTrain)

    // Make predictions
    val predictions = model.predict(XTrain)
    val probabilities = model.predict_proba(XTrain)

    // Evaluate
    val accuracy = sklearn.metrics.accuracy_score(yTrain, predictions)
    val f1 = sklearn.metrics.f1_score(yTrain, predictions)

    println("Model trained successfully!")
    println("Accuracy: $accuracy")
    println("F1 Score: $f1")
    println("Feature Importances: ${model.feature_importances_.tolist()}")
}

// ============================================================================
// Example 2: Deep Learning with TensorFlow
// ============================================================================

/**
 * Build a neural network for customer churn prediction
 */
@Polyglot
fun deepLearningExample() {
    val tf = importPython("tensorflow")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    println("\n=== Deep Learning Example ===")

    // Generate sample data
    val nSamples = 5000
    val nFeatures = 20

    val X = numpy.random.randn(nSamples, nFeatures)
    val y = numpy.random.randint(0, 2, nSamples)

    // Build neural network
    val model = tf.keras.Sequential(listOf(
        tf.keras.layers.Input(shape = listOf(nFeatures)),
        tf.keras.layers.Dense(128, activation = "relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation = "relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(32, activation = "relu"),
        tf.keras.layers.Dense(1, activation = "sigmoid")
    ))

    // Compile model
    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate = 0.001),
        loss = "binary_crossentropy",
        metrics = listOf("accuracy", "precision", "recall", "AUC")
    )

    // Train model
    val history = model.fit(
        X, y,
        epochs = 20,
        batch_size = 32,
        validation_split = 0.2,
        callbacks = listOf(
            tf.keras.callbacks.EarlyStopping(
                monitor = "val_loss",
                patience = 5,
                restore_best_weights = true
            )
        ),
        verbose = 1
    )

    // Evaluate
    val testLoss = history.history["val_loss"][-1]
    val testAccuracy = history.history["val_accuracy"][-1]

    println("Neural Network trained successfully!")
    println("Validation Loss: $testLoss")
    println("Validation Accuracy: $testAccuracy")

    // Make predictions
    val predictions = model.predict(X[":100"])
    println("Sample predictions: ${predictions[":10"]}")
}

// ============================================================================
// Example 3: Advanced Feature Engineering with pandas
// ============================================================================

/**
 * Demonstrate powerful pandas transformations in Kotlin
 */
@Polyglot
fun featureEngineeringExample() {
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    println("\n=== Feature Engineering Example ===")

    // Create sample transaction data
    val dates = pandas.date_range("2024-01-01", periods = 1000, freq = "H")
    val df = pandas.DataFrame(mapOf(
        "timestamp" to dates,
        "amount" to numpy.random.uniform(10, 1000, 1000),
        "user_id" to numpy.random.randint(1, 100, 1000),
        "merchant_category" to numpy.random.choice(
            listOf("grocery", "restaurant", "online", "gas"),
            1000
        )
    ))

    println("Original data shape: ${df.shape}")

    // Extract temporal features
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin(listOf(5, 6))
    df["month"] = df["timestamp"].dt.month

    // Cyclical encoding for time features
    df["hour_sin"] = numpy.sin(2 * numpy.pi * df["hour"] / 24)
    df["hour_cos"] = numpy.cos(2 * numpy.pi * df["hour"] / 24)

    // Statistical transformations
    df["amount_log"] = numpy.log1p(df["amount"])
    df["amount_sqrt"] = numpy.sqrt(df["amount"])
    df["amount_squared"] = df["amount"].pow(2)

    // Aggregation features by user
    df["user_avg_amount"] = df.groupBy("user_id")["amount"].transform("mean")
    df["user_total_amount"] = df.groupBy("user_id")["amount"].transform("sum")
    df["user_transaction_count"] = df.groupBy("user_id")["amount"].transform("count")

    // Rolling window features
    df = df.sort_values(by = "timestamp")
    df["rolling_mean_24h"] = df["amount"].rolling(window = 24).mean()
    df["rolling_std_24h"] = df["amount"].rolling(window = 24).std()

    // Categorical encoding
    df["merchant_encoded"] = pandas.Categorical(df["merchant_category"]).codes

    // One-hot encoding
    val dummies = pandas.get_dummies(df["merchant_category"], prefix = "merchant")
    df = pandas.concat(listOf(df, dummies), axis = 1)

    println("Engineered data shape: ${df.shape}")
    println("New features created: ${df.columns.size - 4}")
    println("\nSample of engineered features:")
    println(df.head(5))
}

// ============================================================================
// Example 4: Time Series Forecasting with Prophet
// ============================================================================

/**
 * Forecast sales using Facebook Prophet
 */
@Polyglot
fun timeSeriesForecastingExample() {
    val prophet = importPython("prophet")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    println("\n=== Time Series Forecasting Example ===")

    // Generate sample sales data
    val dates = pandas.date_range("2023-01-01", periods = 365, freq = "D")
    val trend = numpy.linspace(100, 200, 365)
    val seasonality = 50 * numpy.sin(numpy.arange(365) * 2 * numpy.pi / 365)
    val noise = numpy.random.randn(365) * 10
    val sales = trend + seasonality + noise

    val df = pandas.DataFrame(mapOf(
        "ds" to dates,
        "y" to sales
    ))

    // Train Prophet model
    val model = prophet.Prophet(
        yearly_seasonality = true,
        weekly_seasonality = true,
        daily_seasonality = false
    )

    // Add custom seasonality
    model.add_seasonality(
        name = "monthly",
        period = 30.5,
        fourier_order = 5
    )

    model.fit(df)

    // Make future predictions
    val future = model.make_future_dataframe(periods = 90)
    val forecast = model.predict(future)

    println("Forecast generated for next 90 days")
    println("\nSample predictions:")
    println(forecast[listOf("ds", "yhat", "yhat_lower", "yhat_upper")].tail(10))

    // Extract trend components
    val trend_component = forecast["trend"].tail(90)
    println("\nTrend (last 90 days): ${trend_component.mean()}")
}

// ============================================================================
// Example 5: Gradient Boosting with XGBoost
// ============================================================================

/**
 * Train an XGBoost model for customer segmentation
 */
@Polyglot
fun xgboostExample() {
    val xgboost = importPython("xgboost")
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")

    println("\n=== XGBoost Example ===")

    // Generate sample data
    val X = numpy.random.randn(2000, 15)
    val y = numpy.random.randint(0, 3, 2000)  // 3 customer segments

    // Split data
    val trainTestSplit = sklearn.model_selection.train_test_split(
        X, y,
        test_size = 0.2,
        random_state = 42
    )

    val XTrain = trainTestSplit[0]
    val XTest = trainTestSplit[1]
    val yTrain = trainTestSplit[2]
    val yTest = trainTestSplit[3]

    // Train XGBoost model
    val model = xgboost.XGBClassifier(
        n_estimators = 200,
        max_depth = 6,
        learning_rate = 0.1,
        subsample = 0.8,
        colsample_bytree = 0.8,
        random_state = 42,
        n_jobs = -1
    )

    model.fit(
        XTrain, yTrain,
        eval_set = listOf(Pair(XTest, yTest)),
        early_stopping_rounds = 10,
        verbose = false
    )

    // Predictions
    val predictions = model.predict(XTest)
    val probabilities = model.predict_proba(XTest)

    // Evaluate
    val accuracy = sklearn.metrics.accuracy_score(yTest, predictions)
    val f1 = sklearn.metrics.f1_score(yTest, predictions, average = "weighted")

    println("XGBoost model trained successfully!")
    println("Test Accuracy: $accuracy")
    println("Test F1 Score: $f1")
    println("\nFeature Importances:")
    model.feature_importances_.forEachIndexed { index, importance ->
        println("  Feature $index: $importance")
    }
}

// ============================================================================
// Example 6: NLP Sentiment Analysis with Transformers
// ============================================================================

/**
 * Perform sentiment analysis using Hugging Face transformers
 */
@Polyglot
fun nlpSentimentExample() {
    val transformers = importPython("transformers")
    val torch = importPython("torch")

    println("\n=== NLP Sentiment Analysis Example ===")

    // Load pre-trained BERT model
    val tokenizer = transformers.BertTokenizer.from_pretrained("bert-base-uncased")
    val model = transformers.BertForSequenceClassification.from_pretrained(
        "bert-base-uncased",
        num_labels = 3
    )

    // Sample texts
    val texts = listOf(
        "This product is absolutely amazing! I love it!",
        "Terrible experience, would not recommend.",
        "It's okay, nothing special but does the job."
    )

    texts.forEach { text ->
        // Tokenize
        val inputs = tokenizer(
            text,
            return_tensors = "pt",
            padding = true,
            truncation = true,
            max_length = 512
        )

        // Predict
        val outputs = model(**inputs)
        val predictions = torch.nn.functional.softmax(outputs.logits, dim = 1)
        val scores = predictions[0].tolist()

        val sentiment = when (scores.indexOf(scores.max())) {
            0 -> "NEGATIVE"
            1 -> "NEUTRAL"
            2 -> "POSITIVE"
            else -> "UNKNOWN"
        }

        println("\nText: $text")
        println("Sentiment: $sentiment")
        println("Scores: Negative=${scores[0]}, Neutral=${scores[1]}, Positive=${scores[2]}")
    }
}

// ============================================================================
// Example 7: Clustering with K-Means
// ============================================================================

/**
 * Customer segmentation using K-Means clustering
 */
@Polyglot
fun clusteringExample() {
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")
    val pandas = importPython("pandas")

    println("\n=== K-Means Clustering Example ===")

    // Generate sample customer data
    val nSamples = 500
    val X = numpy.random.randn(nSamples, 5)

    // Standardize features
    val scaler = sklearn.preprocessing.StandardScaler()
    val XScaled = scaler.fit_transform(X)

    // Find optimal number of clusters using elbow method
    val inertias = mutableListOf<Double>()
    for (k in 2..10) {
        val kmeans = sklearn.cluster.KMeans(n_clusters = k, random_state = 42)
        kmeans.fit(XScaled)
        inertias.add(kmeans.inertia_ as Double)
    }

    println("Inertias for k=2 to k=10:")
    inertias.forEachIndexed { index, inertia ->
        println("  k=${index + 2}: $inertia")
    }

    // Train final model with k=4
    val kmeans = sklearn.cluster.KMeans(n_clusters = 4, random_state = 42)
    val clusters = kmeans.fit_predict(XScaled)

    println("\nCluster distribution:")
    val clusterCounts = pandas.Series(clusters).value_counts()
    println(clusterCounts)

    println("\nCluster centers:")
    val centers = kmeans.cluster_centers_
    println(centers)
}

// ============================================================================
// Example 8: Dimensionality Reduction with PCA
// ============================================================================

/**
 * Reduce feature dimensions using PCA
 */
@Polyglot
fun pcaExample() {
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")
    val pandas = importPython("pandas")

    println("\n=== PCA Dimensionality Reduction Example ===")

    // Generate high-dimensional data
    val nSamples = 1000
    val nFeatures = 50
    val X = numpy.random.randn(nSamples, nFeatures)

    println("Original data shape: ${X.shape}")

    // Standardize
    val scaler = sklearn.preprocessing.StandardScaler()
    val XScaled = scaler.fit_transform(X)

    // Apply PCA
    val pca = sklearn.decomposition.PCA(n_components = 10)
    val XReduced = pca.fit_transform(XScaled)

    println("Reduced data shape: ${XReduced.shape}")
    println("\nExplained variance ratio:")
    pca.explained_variance_ratio_.forEachIndexed { index, ratio ->
        println("  PC${index + 1}: ${ratio}")
    }

    val totalVariance = pca.explained_variance_ratio_.sum()
    println("\nTotal variance explained: $totalVariance")
}

// ============================================================================
// Example 9: Hyperparameter Tuning with Grid Search
// ============================================================================

/**
 * Find best hyperparameters using GridSearchCV
 */
@Polyglot
fun hyperparameterTuningExample() {
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")

    println("\n=== Hyperparameter Tuning Example ===")

    // Generate data
    val X = numpy.random.randn(1000, 10)
    val y = numpy.random.randint(0, 2, 1000)

    // Define parameter grid
    val paramGrid = mapOf(
        "n_estimators" to listOf(50, 100, 200),
        "max_depth" to listOf(5, 10, 15),
        "min_samples_split" to listOf(2, 5, 10)
    )

    // Create model
    val model = sklearn.ensemble.RandomForestClassifier(random_state = 42)

    // Grid search
    val gridSearch = sklearn.model_selection.GridSearchCV(
        model,
        paramGrid,
        cv = 5,
        scoring = "f1",
        n_jobs = -1,
        verbose = 1
    )

    gridSearch.fit(X, y)

    println("\nBest parameters:")
    println(gridSearch.best_params_)
    println("\nBest score: ${gridSearch.best_score_}")

    // Use best model
    val bestModel = gridSearch.best_estimator_
    println("\nBest model trained and ready for predictions!")
}

// ============================================================================
// Example 10: Model Explainability with SHAP
// ============================================================================

/**
 * Explain model predictions using SHAP values
 */
@Polyglot
fun shapExplainabilityExample() {
    val sklearn = importPython("sklearn")
    val shap = importPython("shap")
    val numpy = importPython("numpy")

    println("\n=== SHAP Explainability Example ===")

    // Generate data
    val X = numpy.random.randn(500, 10)
    val y = numpy.random.randint(0, 2, 500)

    // Train model
    val model = sklearn.ensemble.RandomForestClassifier(
        n_estimators = 100,
        random_state = 42
    )
    model.fit(X, y)

    // Create SHAP explainer
    val explainer = shap.TreeExplainer(model)

    // Get SHAP values
    val shapValues = explainer.shap_values(X[":10"])

    println("SHAP values computed for 10 samples")
    println("SHAP values shape: ${shapValues.shape}")

    // Feature importance from SHAP
    val shapImportance = numpy.abs(shapValues).mean(axis = 0)
    println("\nFeature importance (SHAP):")
    shapImportance.forEachIndexed { index, importance ->
        println("  Feature $index: $importance")
    }
}

// ============================================================================
// Example 11: Anomaly Detection
// ============================================================================

/**
 * Detect anomalies using Isolation Forest
 */
@Polyglot
fun anomalyDetectionExample() {
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")

    println("\n=== Anomaly Detection Example ===")

    // Generate normal data with some anomalies
    val nNormal = 900
    val nAnomalies = 100

    val XNormal = numpy.random.randn(nNormal, 5)
    val XAnomalies = numpy.random.uniform(-4, 4, Pair(nAnomalies, 5))

    val X = numpy.vstack(listOf(XNormal, XAnomalies))

    // Train Isolation Forest
    val model = sklearn.ensemble.IsolationForest(
        contamination = 0.1,
        random_state = 42
    )

    val predictions = model.fit_predict(X)

    // Count anomalies
    val nDetectedAnomalies = (predictions == -1).sum()
    val nDetectedNormal = (predictions == 1).sum()

    println("Total samples: ${X.shape[0]}")
    println("Detected anomalies: $nDetectedAnomalies")
    println("Detected normal: $nDetectedNormal")
    println("Contamination rate: ${nDetectedAnomalies.toDouble() / X.shape[0]}")
}

// ============================================================================
// Example 12: Cross-Validation
// ============================================================================

/**
 * Evaluate model using cross-validation
 */
@Polyglot
fun crossValidationExample() {
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")

    println("\n=== Cross-Validation Example ===")

    // Generate data
    val X = numpy.random.randn(1000, 15)
    val y = numpy.random.randint(0, 2, 1000)

    // Create model
    val model = sklearn.ensemble.RandomForestClassifier(
        n_estimators = 100,
        random_state = 42
    )

    // Perform cross-validation
    val cvScores = sklearn.model_selection.cross_val_score(
        model, X, y,
        cv = 5,
        scoring = "accuracy"
    )

    println("Cross-validation scores:")
    cvScores.forEachIndexed { index, score ->
        println("  Fold ${index + 1}: $score")
    }

    println("\nMean CV score: ${cvScores.mean()}")
    println("Std CV score: ${cvScores.std()}")

    // Cross-validate with multiple metrics
    val scoring = listOf("accuracy", "precision", "recall", "f1")
    scoring.forEach { metric ->
        val scores = sklearn.model_selection.cross_val_score(
            model, X, y,
            cv = 5,
            scoring = metric
        )
        println("\n$metric: ${scores.mean()} (+/- ${scores.std()})")
    }
}

// ============================================================================
// Main Demo Runner
// ============================================================================

/**
 * Run all examples
 */
fun main() {
    println("╔═══════════════════════════════════════════════════════════╗")
    println("║  Spring Boot ML Platform - Powered by Elide Polyglot     ║")
    println("║  Kotlin + Python in a Single Application                 ║")
    println("╚═══════════════════════════════════════════════════════════╝")
    println()

    try {
        fraudDetectionExample()
        deepLearningExample()
        featureEngineeringExample()
        timeSeriesForecastingExample()
        xgboostExample()
        nlpSentimentExample()
        clusteringExample()
        pcaExample()
        hyperparameterTuningExample()
        shapExplainabilityExample()
        anomalyDetectionExample()
        crossValidationExample()

        println("\n" + "=".repeat(60))
        println("All examples completed successfully!")
        println("=".repeat(60))

    } catch (e: Exception) {
        println("\nError running examples: ${e.message}")
        e.printStackTrace()
    }
}

// Helper function
@Polyglot
private fun importPython(module: String): dynamic {
    return js("require('python:$module')")
}
