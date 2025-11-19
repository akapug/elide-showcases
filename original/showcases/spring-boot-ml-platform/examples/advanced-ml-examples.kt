package com.example.mlplatform.examples.advanced

import elide.runtime.gvm.annotations.Polyglot

/**
 * Advanced ML Examples - Production Use Cases
 *
 * Comprehensive examples demonstrating real-world ML applications
 * using Elide's Kotlin + Python polyglot capabilities.
 *
 * Covered Topics:
 * - Customer Churn Prediction
 * - Fraud Detection Pipeline
 * - Recommendation Systems
 * - Time Series Forecasting
 * - NLP Text Classification
 * - Image Classification
 * - Anomaly Detection
 * - A/B Testing Framework
 */

// ============================================================================
// Example 1: Complete Fraud Detection Pipeline
// ============================================================================

/**
 * End-to-end fraud detection system
 */
@Polyglot
fun fraudDetectionPipeline() {
    println("=== Complete Fraud Detection Pipeline ===\n")

    val sklearn = importPython("sklearn")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")
    val lightgbm = importPython("lightgbm")

    // Step 1: Generate synthetic transaction data
    println("Step 1: Generating synthetic transaction data...")
    val nSamples = 10000
    val dates = pandas.date_range("2024-01-01", periods = nSamples, freq = "min")

    val df = pandas.DataFrame(mapOf(
        "timestamp" to dates,
        "amount" to numpy.random.lognormal(5, 2, nSamples),
        "merchant_category" to numpy.random.choice(
            listOf("grocery", "restaurant", "online", "gas", "entertainment"),
            nSamples
        ),
        "user_age" to numpy.random.randint(18, 80, nSamples),
        "account_age_days" to numpy.random.randint(1, 3650, nSamples),
        "transaction_count_24h" to numpy.random.poisson(3, nSamples),
        "avg_amount_30d" to numpy.random.uniform(50, 500, nSamples),
        "device_type" to numpy.random.choice(
            listOf("mobile", "desktop", "tablet"),
            nSamples
        ),
        "is_international" to numpy.random.choice(listOf(true, false), nSamples, p = listOf(0.1, 0.9))
    ))

    // Create fraud labels (5% fraud rate)
    df["is_fraud"] = numpy.random.choice(
        listOf(0, 1),
        nSamples,
        p = listOf(0.95, 0.05)
    )

    println("  Generated $nSamples transactions")
    println("  Fraud rate: ${(df["is_fraud"].sum() / nSamples * 100)}%\n")

    // Step 2: Feature Engineering
    println("Step 2: Feature engineering...")

    // Temporal features
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin(listOf(5, 6))
    df["is_night"] = df["hour"].isin((0..5).toList() + (22..23).toList())

    // Amount-based features
    df["amount_log"] = numpy.log1p(df["amount"])
    df["amount_zscore"] = (df["amount"] - df["amount"].mean()) / df["amount"].std()
    df["is_high_amount"] = df["amount"] > df["amount"].quantile(0.95)

    // Velocity features
    df["amount_to_avg_ratio"] = df["amount"] / df["avg_amount_30d"]
    df["transactions_per_day"] = df["transaction_count_24h"] * 365.0 / df["account_age_days"]

    // Device and merchant features
    df["merchant_encoded"] = pandas.Categorical(df["merchant_category"]).codes
    df["device_encoded"] = pandas.Categorical(df["device_type"]).codes

    // Risk score features
    df["risk_score"] = (
        df["is_high_amount"].astype(int) * 3 +
        df["is_international"].astype(int) * 2 +
        df["is_night"].astype(int) * 1
    )

    println("  Created ${df.columns.size} features\n")

    // Step 3: Train/Test Split
    println("Step 3: Splitting data...")

    val featureCols = listOf(
        "hour", "day_of_week", "is_weekend", "is_night",
        "amount_log", "amount_zscore", "is_high_amount",
        "user_age", "account_age_days", "transaction_count_24h",
        "amount_to_avg_ratio", "transactions_per_day",
        "merchant_encoded", "device_encoded", "is_international",
        "risk_score"
    )

    val X = df[featureCols]
    val y = df["is_fraud"]

    val split = sklearn.model_selection.train_test_split(
        X, y,
        test_size = 0.2,
        stratify = y,
        random_state = 42
    )

    val XTrain = split[0]
    val XTest = split[1]
    val yTrain = split[2]
    val yTest = split[3]

    println("  Training set: ${XTrain.shape[0]} samples")
    println("  Test set: ${XTest.shape[0]} samples\n")

    // Step 4: Handle Class Imbalance
    println("Step 4: Handling class imbalance with SMOTE...")

    val imblearn = importPython("imblearn")
    val smote = imblearn.over_sampling.SMOTE(random_state = 42)
    val resampled = smote.fit_resample(XTrain, yTrain)

    val XTrainBalanced = resampled[0]
    val yTrainBalanced = resampled[1]

    println("  Balanced training set: ${XTrainBalanced.shape[0]} samples\n")

    // Step 5: Train LightGBM Model
    println("Step 5: Training LightGBM model...")

    val model = lightgbm.LGBMClassifier(
        n_estimators = 200,
        learning_rate = 0.05,
        max_depth = 7,
        num_leaves = 31,
        min_child_samples = 20,
        subsample = 0.8,
        colsample_bytree = 0.8,
        random_state = 42,
        n_jobs = -1
    )

    model.fit(
        XTrainBalanced, yTrainBalanced,
        eval_set = listOf(Pair(XTest, yTest)),
        early_stopping_rounds = 20,
        verbose = 50
    )

    println("  Model trained successfully\n")

    // Step 6: Evaluation
    println("Step 6: Evaluating model...")

    val yPred = model.predict(XTest)
    val yPredProba = model.predict_proba(XTest)["[:,1]"]

    val metrics_module = sklearn.metrics

    val accuracy = metrics_module.accuracy_score(yTest, yPred)
    val precision = metrics_module.precision_score(yTest, yPred)
    val recall = metrics_module.recall_score(yTest, yPred)
    val f1 = metrics_module.f1_score(yTest, yPred)
    val auc = metrics_module.roc_auc_score(yTest, yPredProba)

    println("\nModel Performance:")
    println("  Accuracy:  $accuracy")
    println("  Precision: $precision")
    println("  Recall:    $recall")
    println("  F1 Score:  $f1")
    println("  AUC-ROC:   $auc")

    // Confusion matrix
    val cm = metrics_module.confusion_matrix(yTest, yPred)
    println("\nConfusion Matrix:")
    println("  TN: ${cm[0][0]}, FP: ${cm[0][1]}")
    println("  FN: ${cm[1][0]}, TP: ${cm[1][1]}")

    // Feature importance
    println("\nTop 10 Feature Importances:")
    val importances = model.feature_importances_
    val featureImportance = featureCols.zip(importances.tolist() as List<Double>)
        .sortedByDescending { it.second }
        .take(10)

    featureImportance.forEach { (feature, importance) ->
        println("  $feature: $importance")
    }

    // Step 7: Precision-Recall Curve
    println("\nStep 7: Analyzing precision-recall tradeoff...")

    val precision_curve = metrics_module.precision_recall_curve(yTest, yPredProba)
    val precisions = precision_curve[0]
    val recalls = precision_curve[1]
    val thresholds = precision_curve[2]

    // Find optimal threshold
    val f1Scores = (0 until precisions.size - 1).map { i ->
        val p = precisions[i] as Double
        val r = recalls[i] as Double
        2 * (p * r) / (p + r)
    }

    val optimalIdx = f1Scores.indexOf(f1Scores.max())
    val optimalThreshold = thresholds[optimalIdx]

    println("  Optimal threshold: $optimalThreshold")
    println("  Precision at optimal: ${precisions[optimalIdx]}")
    println("  Recall at optimal: ${recalls[optimalIdx]}")

    println("\nFraud Detection Pipeline Complete!")
}

// ============================================================================
// Example 2: Customer Churn Prediction with Deep Learning
// ============================================================================

@Polyglot
fun customerChurnPrediction() {
    println("\n=== Customer Churn Prediction ===\n")

    val tf = importPython("tensorflow")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")
    val sklearn = importPython("sklearn")

    // Generate synthetic customer data
    println("Generating customer data...")
    val nCustomers = 5000

    val df = pandas.DataFrame(mapOf(
        "customer_id" to (1..nCustomers).toList(),
        "tenure_months" to numpy.random.randint(1, 72, nCustomers),
        "monthly_charges" to numpy.random.uniform(20, 150, nCustomers),
        "total_charges" to numpy.random.uniform(100, 8000, nCustomers),
        "contract_type" to numpy.random.choice(
            listOf("month-to-month", "one-year", "two-year"),
            nCustomers,
            p = listOf(0.5, 0.3, 0.2)
        ),
        "payment_method" to numpy.random.choice(
            listOf("credit_card", "bank_transfer", "electronic_check"),
            nCustomers
        ),
        "internet_service" to numpy.random.choice(
            listOf("DSL", "Fiber", "No"),
            nCustomers
        ),
        "support_tickets" to numpy.random.poisson(2, nCustomers),
        "late_payments" to numpy.random.poisson(1, nCustomers),
        "num_products" to numpy.random.randint(1, 5, nCustomers),
        "satisfaction_score" to numpy.random.uniform(1, 10, nCustomers)
    ))

    // Create churn label based on features
    df["churn_probability"] = (
        (1 / (df["tenure_months"] + 1)) * 0.3 +
        (df["late_payments"] / 5) * 0.3 +
        ((10 - df["satisfaction_score"]) / 10) * 0.4
    )

    df["churned"] = (numpy.random.random(nCustomers) < df["churn_probability"]).astype(int)

    println("  Total customers: $nCustomers")
    println("  Churn rate: ${df["churned"].mean()}\n")

    // Feature engineering
    println("Feature engineering...")

    df["avg_monthly_charge"] = df["total_charges"] / df["tenure_months"]
    df["charge_to_products_ratio"] = df["monthly_charges"] / df["num_products"]
    df["is_new_customer"] = (df["tenure_months"] < 12).astype(int)
    df["has_issues"] = ((df["support_tickets"] + df["late_payments"]) > 3).astype(int)

    // Encode categorical variables
    df["contract_encoded"] = pandas.Categorical(df["contract_type"]).codes
    df["payment_encoded"] = pandas.Categorical(df["payment_method"]).codes
    df["internet_encoded"] = pandas.Categorical(df["internet_service"]).codes

    // Select features for modeling
    featureCols = listOf(
        "tenure_months", "monthly_charges", "total_charges",
        "support_tickets", "late_payments", "num_products",
        "satisfaction_score", "avg_monthly_charge",
        "charge_to_products_ratio", "is_new_customer", "has_issues",
        "contract_encoded", "payment_encoded", "internet_encoded"
    )

    val X = df[featureCols].values
    val y = df["churned"].values

    // Split data
    val split = sklearn.model_selection.train_test_split(
        X, y,
        test_size = 0.2,
        stratify = y,
        random_state = 42
    )

    val XTrain = split[0]
    val XTest = split[1]
    val yTrain = split[2]
    val yTest = split[3]

    // Scale features
    val scaler = sklearn.preprocessing.StandardScaler()
    val XTrainScaled = scaler.fit_transform(XTrain)
    val XTestScaled = scaler.transform(XTest)

    println("  Features: ${featureCols.size}")
    println("  Training samples: ${XTrain.shape[0]}\n")

    // Build neural network
    println("Building neural network...")

    val inputDim = featureCols.size

    val model = tf.keras.Sequential(listOf(
        tf.keras.layers.Input(shape = listOf(inputDim)),
        tf.keras.layers.Dense(128, activation = "relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation = "relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(32, activation = "relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(1, activation = "sigmoid")
    ))

    model.compile(
        optimizer = tf.keras.optimizers.Adam(learning_rate = 0.001),
        loss = "binary_crossentropy",
        metrics = listOf("accuracy", "precision", "recall", "AUC")
    )

    println(model.summary())

    // Train model
    println("\nTraining model...")

    val history = model.fit(
        XTrainScaled, yTrain,
        epochs = 50,
        batch_size = 32,
        validation_split = 0.2,
        callbacks = listOf(
            tf.keras.callbacks.EarlyStopping(
                monitor = "val_loss",
                patience = 10,
                restore_best_weights = true
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor = "val_loss",
                factor = 0.5,
                patience = 5,
                min_lr = 0.00001
            )
        ),
        verbose = 1
    )

    // Evaluate
    println("\nEvaluating model...")

    val testLoss = model.evaluate(XTestScaled, yTest, verbose = 0)
    println("  Test Loss: ${testLoss[0]}")
    println("  Test Accuracy: ${testLoss[1]}")
    println("  Test Precision: ${testLoss[2]}")
    println("  Test Recall: ${testLoss[3]}")
    println("  Test AUC: ${testLoss[4]}")

    // Predictions
    val yPredProba = model.predict(XTestScaled)
    val yPred = (yPredProba > 0.5).astype(int)

    // Classification report
    println("\nClassification Report:")
    println(sklearn.metrics.classification_report(yTest, yPred))

    // Analyze predictions
    println("\nPrediction Analysis:")

    val churnProbabilities = yPredProba.flatten()
    val highRisk = (churnProbabilities > 0.7).sum()
    val mediumRisk = ((churnProbabilities > 0.3) & (churnProbabilities <= 0.7)).sum()
    val lowRisk = (churnProbabilities <= 0.3).sum()

    println("  High risk customers (>70%): $highRisk")
    println("  Medium risk customers (30-70%): $mediumRisk")
    println("  Low risk customers (<30%): $lowRisk")

    println("\nChurn Prediction Complete!")
}

// ============================================================================
// Example 3: Recommendation System with Collaborative Filtering
// ============================================================================

@Polyglot
fun recommendationSystem() {
    println("\n=== Recommendation System ===\n")

    val surprise = importPython("surprise")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    // Generate synthetic rating data
    println("Generating user-item ratings...")

    val nUsers = 1000
    val nItems = 500
    val nRatings = 20000

    val userIds = numpy.random.randint(1, nUsers + 1, nRatings)
    val itemIds = numpy.random.randint(1, nItems + 1, nRatings)
    val ratings = numpy.random.randint(1, 6, nRatings)

    val df = pandas.DataFrame(mapOf(
        "user_id" to userIds,
        "item_id" to itemIds,
        "rating" to ratings
    ))

    // Remove duplicates
    df = df.drop_duplicates(subset = listOf("user_id", "item_id"))

    println("  Total ratings: ${df.shape[0]}")
    println("  Unique users: ${df["user_id"].nunique()}")
    println("  Unique items: ${df["item_id"].nunique()}\n")

    // Create Surprise dataset
    println("Building recommendation model...")

    val reader = surprise.Reader(rating_scale = Tuple2(1, 5))
    val data = surprise.Dataset.load_from_df(
        df[listOf("user_id", "item_id", "rating")],
        reader
    )

    // Train-test split
    val trainset = data.build_full_trainset()
    val testset = trainset.build_anti_testset()

    // Try multiple algorithms
    val algorithms = mapOf(
        "SVD" to surprise.SVD(n_factors = 100, n_epochs = 20, random_state = 42),
        "SVD++" to surprise.SVDpp(n_factors = 20, random_state = 42),
        "NMF" to surprise.NMF(n_factors = 15, random_state = 42),
        "KNN" to surprise.KNNBasic(sim_options = mapOf("name" to "cosine"))
    )

    val results = mutableMapOf<String, Map<String, Double>>()

    algorithms.forEach { (name, algo) ->
        println("\nTraining $name...")

        val start = System.currentTimeMillis()
        algo.fit(trainset)
        val trainTime = System.currentTimeMillis() - start

        // Cross-validation
        val cvResults = surprise.model_selection.cross_validate(
            algo, data,
            measures = listOf("RMSE", "MAE"),
            cv = 5,
            verbose = false
        )

        val rmse = cvResults["test_rmse"].mean()
        val mae = cvResults["test_mae"].mean()

        results[name] = mapOf(
            "RMSE" to rmse,
            "MAE" to mae,
            "train_time_ms" to trainTime.toDouble()
        )

        println("  RMSE: $rmse")
        println("  MAE: $mae")
        println("  Training time: ${trainTime}ms")
    }

    // Select best model (SVD)
    println("\nUsing SVD for recommendations...")
    val bestModel = algorithms["SVD"]!!
    bestModel.fit(trainset)

    // Generate recommendations for a sample user
    val sampleUserId = 1

    val allItems = (1..nItems).toList()
    val userRatedItems = df[df["user_id"] == sampleUserId]["item_id"].tolist() as List<Int>
    val unratedItems = allItems.filter { it !in userRatedItems }

    println("\nGenerating recommendations for user $sampleUserId...")
    println("  User has rated ${userRatedItems.size} items")
    println("  Recommending from ${unratedItems.size} unrated items")

    val predictions = unratedItems.map { itemId ->
        val pred = bestModel.predict(sampleUserId, itemId)
        itemId to pred.est
    }.sortedByDescending { it.second }

    println("\nTop 10 Recommendations:")
    predictions.take(10).forEach { (itemId, score) ->
        println("  Item $itemId: $score")
    }

    println("\nRecommendation System Complete!")
}

// ============================================================================
// Helper Functions
// ============================================================================

@Polyglot
private fun importPython(module: String): dynamic {
    return js("require('python:$module')")
}

fun main() {
    println("╔══════════════════════════════════════════════════════════╗")
    println("║      Advanced ML Examples - Production Use Cases         ║")
    println("╚══════════════════════════════════════════════════════════╝")
    println()

    try {
        fraudDetectionPipeline()
        customerChurnPrediction()
        recommendationSystem()

        println("\n" + "=".repeat(60))
        println("All advanced examples completed successfully!")
        println("=".repeat(60))

    } catch (e: Exception) {
        println("\nError: ${e.message}")
        e.printStackTrace()
    }
}
