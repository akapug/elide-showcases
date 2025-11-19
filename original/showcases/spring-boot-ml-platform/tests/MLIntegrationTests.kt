package com.example.mlplatform.tests

import com.example.mlplatform.controller.MLController
import com.example.mlplatform.service.*
import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import io.mockk.*
import org.junit.jupiter.api.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import kotlin.test.assertTrue

/**
 * Comprehensive Integration Tests for ML Platform
 *
 * Tests the full stack including:
 * - REST API endpoints
 * - Python ML operations
 * - Feature engineering
 * - Model training and prediction
 * - Performance requirements
 */

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MLIntegrationTests {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var modelService: ModelService

    @Autowired
    private lateinit var predictionService: PredictionService

    @Autowired
    private lateinit var featureEngine: FeatureEngineering

    @BeforeAll
    fun setup() {
        println("Setting up ML Platform integration tests")
    }

    @AfterAll
    fun teardown() {
        println("Cleaning up ML Platform integration tests")
    }

    // ========================================================================
    // Health Check Tests
    // ========================================================================

    @Test
    fun `health endpoint should return Python runtime status`() {
        mockMvc.perform(get("/api/ml/health"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.pythonRuntime").value("available"))
            .andExpect(jsonPath("$.libraries").exists())
    }

    @Test
    fun `health check should include sklearn version`() {
        mockMvc.perform(get("/api/ml/health"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.libraries.sklearn").exists())
            .andExpect(jsonPath("$.libraries.tensorflow").exists())
    }

    // ========================================================================
    // Model Training Tests
    // ========================================================================

    @Test
    @Polyglot
    fun `should train Random Forest model successfully`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(1000, 10)
        val y = numpy.random.randint(0, 2, 1000)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 50,
            max_depth = 5,
            random_state = 42
        )

        assertDoesNotThrow {
            model.fit(X, y)
        }

        val predictions = model.predict(X)
        assertTrue(predictions.size == 1000)
    }

    @Test
    @Polyglot
    fun `should train Gradient Boosting model successfully`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(500, 15)
        val y = numpy.random.randint(0, 2, 500)

        val model = sklearn.ensemble.GradientBoostingClassifier(
            n_estimators = 50,
            learning_rate = 0.1,
            random_state = 42
        )

        model.fit(X, y)

        val accuracy = sklearn.metrics.accuracy_score(
            y,
            model.predict(X)
        ) as Double

        assertTrue(accuracy > 0.5, "Accuracy should be better than random")
    }

    @Test
    @Polyglot
    fun `should train Neural Network with TensorFlow`() {
        val tf = importPython("tensorflow")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(1000, 20)
        val y = numpy.random.randint(0, 2, 1000)

        val model = tf.keras.Sequential(listOf(
            tf.keras.layers.Input(shape = listOf(20)),
            tf.keras.layers.Dense(64, activation = "relu"),
            tf.keras.layers.Dense(32, activation = "relu"),
            tf.keras.layers.Dense(1, activation = "sigmoid")
        ))

        model.compile(
            optimizer = "adam",
            loss = "binary_crossentropy",
            metrics = listOf("accuracy")
        )

        val history = model.fit(
            X, y,
            epochs = 5,
            batch_size = 32,
            validation_split = 0.2,
            verbose = 0
        )

        val finalAccuracy = history.history["val_accuracy"][-1] as Double
        assertTrue(finalAccuracy > 0.4)
    }

    @Test
    fun `should evaluate model with correct metrics`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(500, 10)
        val y = numpy.random.randint(0, 2, 500)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 50,
            random_state = 42
        )
        model.fit(X, y)

        val metrics = modelService.evaluateModel(model, createDataFrame(X, y))

        assertTrue(metrics.accuracy >= 0.0 && metrics.accuracy <= 1.0)
        assertTrue(metrics.precision >= 0.0 && metrics.precision <= 1.0)
        assertTrue(metrics.recall >= 0.0 && metrics.recall <= 1.0)
        assertTrue(metrics.f1Score >= 0.0 && metrics.f1Score <= 1.0)
    }

    // ========================================================================
    // Prediction Tests
    // ========================================================================

    @Test
    fun `single prediction should complete in under 10ms`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        // Train a model
        val X = numpy.random.randn(1000, 10)
        val y = numpy.random.randint(0, 2, 1000)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 100,
            random_state = 42
        )
        model.fit(X, y)

        // Warmup
        repeat(100) {
            model.predict(numpy.random.randn(1, 10))
        }

        // Measure prediction time
        val latencies = mutableListOf<Double>()
        repeat(1000) {
            val start = System.nanoTime()
            model.predict(numpy.random.randn(1, 10))
            val latency = (System.nanoTime() - start) / 1_000_000.0
            latencies.add(latency)
        }

        val p50 = latencies.sorted()[latencies.size / 2]
        val p95 = latencies.sorted()[(latencies.size * 0.95).toInt()]

        println("Prediction latency - p50: ${p50}ms, p95: ${p95}ms")

        assertTrue(p50 < 10.0, "p50 latency should be under 10ms, got ${p50}ms")
        assertTrue(p95 < 20.0, "p95 latency should be under 20ms, got ${p95}ms")
    }

    @Test
    fun `batch prediction should be more efficient than individual calls`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(1000, 10)
        val y = numpy.random.randint(0, 2, 1000)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 100,
            random_state = 42
        )
        model.fit(X, y)

        val batchSize = 100

        // Individual predictions
        val individualStart = System.nanoTime()
        repeat(batchSize) {
            model.predict(numpy.random.randn(1, 10))
        }
        val individualTime = (System.nanoTime() - individualStart) / 1_000_000.0

        // Batch prediction
        val batchStart = System.nanoTime()
        model.predict(numpy.random.randn(batchSize, 10))
        val batchTime = (System.nanoTime() - batchStart) / 1_000_000.0

        println("Individual: ${individualTime}ms, Batch: ${batchTime}ms")
        println("Speedup: ${individualTime / batchTime}x")

        assertTrue(
            batchTime < individualTime,
            "Batch prediction should be faster than individual calls"
        )
    }

    @Test
    fun `prediction with probabilities should work correctly`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(500, 10)
        val y = numpy.random.randint(0, 2, 500)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 50,
            random_state = 42
        )
        model.fit(X, y)

        val sample = numpy.random.randn(1, 10)
        val prediction = model.predict(sample)[0]
        val probabilities = model.predict_proba(sample)[0]

        // Probabilities should sum to 1
        val sum = (probabilities[0] as Double) + (probabilities[1] as Double)
        assertTrue(Math.abs(sum - 1.0) < 0.001, "Probabilities should sum to 1")

        // Prediction should match highest probability
        val predictedClass = if (probabilities[0] as Double > probabilities[1] as Double) 0 else 1
        assertTrue(prediction == predictedClass)
    }

    // ========================================================================
    // Feature Engineering Tests
    // ========================================================================

    @Test
    @Polyglot
    fun `should create temporal features from timestamps`() {
        val pandas = importPython("pandas")
        val numpy = importPython("numpy")

        val dates = pandas.date_range("2024-01-01", periods = 100, freq = "H")
        val df = pandas.DataFrame(mapOf(
            "timestamp" to dates,
            "value" to numpy.random.randn(100)
        ))

        // Add temporal features
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["is_weekend"] = df["day_of_week"].isin(listOf(5, 6))

        assertTrue(df.columns.contains("hour"))
        assertTrue(df.columns.contains("day_of_week"))
        assertTrue(df.columns.contains("is_weekend"))

        // Verify values
        val hours = df["hour"].tolist() as List<Int>
        assertTrue(hours.all { it in 0..23 })

        val daysOfWeek = df["day_of_week"].tolist() as List<Int>
        assertTrue(daysOfWeek.all { it in 0..6 })
    }

    @Test
    @Polyglot
    fun `should perform categorical encoding correctly`() {
        val pandas = importPython("pandas")
        val sklearn = importPython("sklearn")

        val df = pandas.DataFrame(mapOf(
            "category" to listOf("A", "B", "C", "A", "B", "C")
        ))

        // Label encoding
        val encoder = sklearn.preprocessing.LabelEncoder()
        df["category_encoded"] = encoder.fit_transform(df["category"])

        val encoded = df["category_encoded"].tolist() as List<Int>
        assertTrue(encoded.all { it in 0..2 })

        // One-hot encoding
        val dummies = pandas.get_dummies(df["category"], prefix = "cat")
        assertTrue(dummies.shape[1] == 3) // 3 categories
    }

    @Test
    @Polyglot
    fun `should normalize features correctly`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.uniform(0, 100, Pair(100, 5))

        // Standard scaling
        val scaler = sklearn.preprocessing.StandardScaler()
        val XScaled = scaler.fit_transform(X)

        // Check mean and std
        val mean = XScaled.mean(axis = 0)
        val std = XScaled.std(axis = 0)

        // Mean should be close to 0
        assertTrue(mean.tolist().all { Math.abs(it as Double) < 0.1 })

        // Std should be close to 1
        assertTrue(std.tolist().all { Math.abs((it as Double) - 1.0) < 0.1 })
    }

    @Test
    @Polyglot
    fun `should create rolling window features`() {
        val pandas = importPython("pandas")
        val numpy = importPython("numpy")

        val df = pandas.DataFrame(mapOf(
            "value" to numpy.arange(100)
        ))

        // Add rolling mean
        df["rolling_mean_7"] = df["value"].rolling(window = 7).mean()
        df["rolling_std_7"] = df["value"].rolling(window = 7).std()

        // First 6 values should be NaN
        assertTrue(df["rolling_mean_7"].iloc[0].isna())
        assertTrue(df["rolling_mean_7"].iloc[5].isna())

        // 7th value onwards should have values
        assertTrue(!df["rolling_mean_7"].iloc[6].isna())
        assertTrue(!df["rolling_std_7"].iloc[6].isna())
    }

    @Test
    @Polyglot
    fun `should handle missing values correctly`() {
        val pandas = importPython("pandas")
        val numpy = importPython("numpy")

        val df = pandas.DataFrame(mapOf(
            "col1" to listOf(1.0, null, 3.0, 4.0, 5.0),
            "col2" to listOf(null, 2.0, 3.0, null, 5.0)
        ))

        val missingCount = df.isna().sum().sum() as Int
        assertTrue(missingCount == 3)

        // Fill with mean
        val filled = df.fillna(df.mean())
        val missingAfter = filled.isna().sum().sum() as Int
        assertTrue(missingAfter == 0)
    }

    // ========================================================================
    // API Integration Tests
    // ========================================================================

    @Test
    fun `POST train endpoint should accept valid request`() {
        val requestBody = """
            {
                "name": "test-model",
                "algorithm": "RANDOM_FOREST",
                "dataSource": "test://data.csv",
                "targetColumn": "target",
                "hyperparameters": {
                    "n_estimators": 50,
                    "max_depth": 5
                }
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/ml/train")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
        ).andExpect(status().isOk)
    }

    @Test
    fun `POST predict endpoint should return prediction`() {
        // First train a model (mocked)
        // Then make prediction

        val requestBody = """
            {
                "modelId": "test-model-id",
                "features": {
                    "feature1": 1.0,
                    "feature2": 2.0,
                    "feature3": 3.0
                }
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/ml/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.latencyMs").exists())
    }

    @Test
    fun `GET models endpoint should return list of models`() {
        mockMvc.perform(get("/api/ml/models"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.models").isArray)
            .andExpect(jsonPath("$.total").exists())
    }

    // ========================================================================
    // Performance Tests
    // ========================================================================

    @Test
    fun `should handle concurrent predictions`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        // Train model
        val X = numpy.random.randn(1000, 10)
        val y = numpy.random.randint(0, 2, 1000)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 100,
            random_state = 42
        )
        model.fit(X, y)

        // Concurrent predictions
        val threads = (1..10).map {
            Thread {
                repeat(100) {
                    model.predict(numpy.random.randn(1, 10))
                }
            }
        }

        val start = System.currentTimeMillis()
        threads.forEach { it.start() }
        threads.forEach { it.join() }
        val duration = System.currentTimeMillis() - start

        println("Concurrent predictions (10 threads, 100 each): ${duration}ms")
        assertTrue(duration < 5000, "Should complete in under 5 seconds")
    }

    @Test
    fun `should achieve target throughput`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(1000, 10)
        val y = numpy.random.randint(0, 2, 1000)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 100,
            random_state = 42
        )
        model.fit(X, y)

        // Warmup
        repeat(100) {
            model.predict(numpy.random.randn(1, 10))
        }

        // Measure throughput
        val durationMs = 1000L // 1 second
        val start = System.currentTimeMillis()
        var count = 0

        while (System.currentTimeMillis() - start < durationMs) {
            model.predict(numpy.random.randn(1, 10))
            count++
        }

        val throughput = count.toDouble() / (durationMs / 1000.0)
        println("Throughput: $throughput predictions/second")

        assertTrue(
            throughput > 1000,
            "Should achieve >1000 predictions/sec, got $throughput"
        )
    }

    // ========================================================================
    // Error Handling Tests
    // ========================================================================

    @Test
    fun `should handle invalid model ID gracefully`() {
        mockMvc.perform(get("/api/ml/models/invalid-id"))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `should validate prediction request`() {
        val invalidRequest = """
            {
                "modelId": "",
                "features": {}
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/ml/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRequest)
        ).andExpect(status().isBadRequest)
    }

    @Test
    fun `should handle large batch sizes`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(1000, 10)
        val y = numpy.random.randint(0, 2, 1000)

        val model = sklearn.ensemble.RandomForestClassifier(
            n_estimators = 100,
            random_state = 42
        )
        model.fit(X, y)

        // Predict on large batch
        val largeBatch = numpy.random.randn(10000, 10)

        assertDoesNotThrow {
            val predictions = model.predict(largeBatch)
            assertTrue(predictions.size == 10000)
        }
    }

    // ========================================================================
    // Algorithm Comparison Tests
    // ========================================================================

    @Test
    fun `should compare multiple algorithms`() {
        val sklearn = importPython("sklearn")
        val numpy = importPython("numpy")

        val X = numpy.random.randn(500, 10)
        val y = numpy.random.randint(0, 2, 500)

        val algorithms = mapOf(
            "Random Forest" to sklearn.ensemble.RandomForestClassifier(
                n_estimators = 50,
                random_state = 42
            ),
            "Gradient Boosting" to sklearn.ensemble.GradientBoostingClassifier(
                n_estimators = 50,
                random_state = 42
            ),
            "Logistic Regression" to sklearn.linear_model.LogisticRegression(
                random_state = 42
            )
        )

        val results = algorithms.map { (name, model) ->
            model.fit(X, y)
            val accuracy = sklearn.metrics.accuracy_score(
                y,
                model.predict(X)
            ) as Double

            name to accuracy
        }.toMap()

        println("Algorithm comparison:")
        results.forEach { (name, accuracy) ->
            println("  $name: $accuracy")
        }

        // All should achieve reasonable accuracy
        assertTrue(results.values.all { it > 0.5 })
    }

    // ========================================================================
    // Helper Functions
    // ========================================================================

    @Polyglot
    private fun importPython(module: String): dynamic {
        return js("require('python:$module')")
    }

    private fun createDataFrame(X: Any, y: Any): DataFrame {
        val pandas = importPython("pandas")
        val df = pandas.DataFrame(X)
        df["target"] = y
        return df.toDataFrame()
    }
}
