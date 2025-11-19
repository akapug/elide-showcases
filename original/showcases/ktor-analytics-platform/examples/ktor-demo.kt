package dev.elide.showcases.ktor.analytics.examples

import dev.elide.showcases.ktor.analytics.models.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Comprehensive demonstration of the Ktor Analytics Platform.
 *
 * This demo showcases:
 * - Loading datasets
 * - Statistical analysis
 * - Time series forecasting
 * - Data visualization
 * - Real-time streaming analytics
 * - WebSocket integration
 *
 * Prerequisites:
 * - Ktor Analytics Platform server running on localhost:8080
 * - Sample dataset file (sales_data.csv)
 *
 * Run this demo:
 * ```
 * ./gradlew run -PmainClass=dev.elide.showcases.ktor.analytics.examples.KtorAnalyticsDemoKt
 * ```
 */
fun main() = runBlocking {
    println("=" .repeat(80))
    println("Ktor Analytics Platform - Comprehensive Demo")
    println("Polyglot Data Science with Kotlin + Python")
    println("=" .repeat(80))
    println()

    // Create HTTP client for API calls
    val client = createHttpClient()

    try {
        // Demo 1: Server health check
        demoHealthCheck(client)

        // Demo 2: Load and explore dataset
        demoDatasetManagement(client)

        // Demo 3: Statistical analysis
        demoStatisticalAnalysis(client)

        // Demo 4: Correlation analysis
        demoCorrelationAnalysis(client)

        // Demo 5: Regression analysis
        demoRegressionAnalysis(client)

        // Demo 6: Time series trend analysis
        demoTrendAnalysis(client)

        // Demo 7: Time series forecasting
        demoForecasting(client)

        // Demo 8: Anomaly detection
        demoAnomalyDetection(client)

        // Demo 9: Data visualization
        demoVisualization(client)

        // Demo 10: Real-time streaming analytics
        demoStreamingAnalytics(client)

        println()
        println("=" .repeat(80))
        println("Demo completed successfully!")
        println("=" .repeat(80))

    } catch (e: Exception) {
        println("Error in demo: ${e.message}")
        e.printStackTrace()
    } finally {
        client.close()
    }
}

/**
 * Create configured HTTP client.
 */
private fun createHttpClient(): HttpClient {
    return HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
        install(WebSockets)
    }
}

/**
 * Demo 1: Health check
 */
private suspend fun demoHealthCheck(client: HttpClient) {
    printSection("Demo 1: Server Health Check")

    val response: HealthStatus = client.get("http://localhost:8080/health").body()

    println("Server Status: ${if (response.healthy) "HEALTHY" else "UNHEALTHY"}")
    println("Uptime: ${response.uptime / 1000} seconds")
    println("Memory Used: ${response.memoryUsage.used / 1024 / 1024} MB")
    println("Memory Total: ${response.memoryUsage.total / 1024 / 1024} MB")
    println()

    println("Component Health:")
    response.checks.forEach { (component, healthy) ->
        println("  - $component: ${if (healthy) "OK" else "FAILED"}")
    }

    println()
}

/**
 * Demo 2: Dataset management
 */
private suspend fun demoDatasetManagement(client: HttpClient) {
    printSection("Demo 2: Dataset Management")

    // Load dataset
    println("Loading sample dataset...")

    val loadRequest = mapOf(
        "filepath" to "data/sales_data.csv",
        "datasetId" to "sales",
        "format" to "CSV"
    )

    val dataset: Dataset = try {
        client.post("http://localhost:8080/datasets/load") {
            contentType(ContentType.Application.Json)
            setBody(loadRequest)
        }.body()
    } catch (e: Exception) {
        println("Note: Using simulated dataset (actual file may not exist)")
        // Continue with demo using simulated data
        return
    }

    println("Dataset loaded: ${dataset.name}")
    println("  Rows: ${dataset.rows}")
    println("  Columns: ${dataset.columns.size}")
    println()

    // List datasets
    val datasetList: Map<String, Any> = client.get("http://localhost:8080/datasets/list").body()
    println("Loaded datasets: ${datasetList["count"]}")

    // Get dataset preview
    val preview: Map<String, Any> = client.get("http://localhost:8080/datasets/sales/preview?limit=5").body()
    println("Dataset preview (first 5 rows):")
    println(preview)

    println()
}

/**
 * Demo 3: Statistical analysis
 */
private suspend fun demoStatisticalAnalysis(client: HttpClient) {
    printSection("Demo 3: Descriptive Statistics")

    println("Computing descriptive statistics...")

    val request = DescribeRequest(
        dataset = "sales",
        columns = listOf("revenue", "customers", "orders"),
        includePercentiles = true,
        percentiles = listOf(25, 50, 75, 90)
    )

    val response: DescribeResponse = try {
        client.get("http://localhost:8080/analytics/describe") {
            parameter("dataset", "sales")
            parameter("columns", "revenue,customers,orders")
        }.body()
    } catch (e: Exception) {
        println("Simulating statistics result...")
        println("Revenue: mean=1250.5, std=345.2, min=100.0, max=5000.0")
        println("Customers: mean=52.3, std=12.5, min=10, max=100")
        println()
        return
    }

    println("Dataset: ${response.dataset}")
    println("Rows analyzed: ${response.rows}")
    println()

    response.statistics.forEach { (column, stats) ->
        println("Column: $column")
        println("  Count: ${stats.count}")
        println("  Mean: ${"%.2f".format(stats.mean)}")
        println("  Std Dev: ${"%.2f".format(stats.std)}")
        println("  Min: ${"%.2f".format(stats.min)}")
        println("  Max: ${"%.2f".format(stats.max)}")
        println("  Median: ${stats.median?.let { "%.2f".format(it) }}")

        if (stats.percentiles.isNotEmpty()) {
            println("  Percentiles:")
            stats.percentiles.forEach { (p, value) ->
                println("    ${p}th: ${"%.2f".format(value)}")
            }
        }

        if (stats.skewness != null) {
            println("  Skewness: ${"%.3f".format(stats.skewness)}")
        }
        if (stats.kurtosis != null) {
            println("  Kurtosis: ${"%.3f".format(stats.kurtosis)}")
        }

        println()
    }
}

/**
 * Demo 4: Correlation analysis
 */
private suspend fun demoCorrelationAnalysis(client: HttpClient) {
    printSection("Demo 4: Correlation Analysis")

    println("Computing correlation matrix...")

    val request = CorrelationRequest(
        dataset = "sales",
        columns = listOf("revenue", "customers", "marketing_spend"),
        method = CorrelationMethod.PEARSON
    )

    val response: CorrelationResponse = try {
        client.post("http://localhost:8080/analytics/correlate") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    } catch (e: Exception) {
        println("Simulating correlation matrix...")
        println("             revenue  customers  marketing")
        println("revenue       1.00      0.85      0.72")
        println("customers     0.85      1.00      0.68")
        println("marketing     0.72      0.68      1.00")
        println()
        return
    }

    println("Correlation Matrix (${response.method}):")
    println("Columns: ${response.columns.joinToString(", ")}")
    println()

    response.correlationMatrix.forEachIndexed { i, row ->
        print("${response.columns[i].padEnd(15)}")
        row.forEach { value ->
            print(" %6.2f".format(value))
        }
        println()
    }

    println()
    println("Significant correlations (|r| > 0.7):")
    response.significantPairs.forEach { pair ->
        println("  ${pair.column1} <-> ${pair.column2}: ${"%.3f".format(pair.correlation)}")
        if (pair.pValue != null) {
            println("    p-value: ${"%.4f".format(pair.pValue)}")
        }
    }

    println()
}

/**
 * Demo 5: Regression analysis
 */
private suspend fun demoRegressionAnalysis(client: HttpClient) {
    printSection("Demo 5: Regression Analysis")

    println("Performing linear regression...")

    val request = RegressionRequest(
        dataset = "sales",
        target = "revenue",
        features = listOf("customers", "marketing_spend"),
        model = RegressionModel.LINEAR,
        testSize = 0.2
    )

    val response: RegressionResponse = try {
        client.post("http://localhost:8080/analytics/regression") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    } catch (e: Exception) {
        println("Simulating regression results...")
        println("Model: Linear Regression")
        println("R² Score: 0.87")
        println("Coefficients:")
        println("  customers: 45.32")
        println("  marketing_spend: 2.18")
        println("Intercept: 250.75")
        println()
        return
    }

    println("Model: ${response.modelType}")
    println()
    println("Performance Metrics:")
    println("  R² Score: ${"%.4f".format(response.r2Score)}")
    println("  MSE: ${"%.2f".format(response.mse)}")
    println("  MAE: ${"%.2f".format(response.mae)}")
    println("  RMSE: ${"%.2f".format(response.rmse)}")
    println()

    println("Model Coefficients:")
    println("  Intercept: ${"%.2f".format(response.intercept)}")
    response.coefficients.forEach { (feature, coef) ->
        println("  $feature: ${"%.2f".format(coef)}")
    }

    if (response.featureImportance != null) {
        println()
        println("Feature Importance:")
        response.featureImportance.entries
            .sortedByDescending { it.value }
            .forEach { (feature, importance) ->
                println("  $feature: ${"%.4f".format(importance)}")
            }
    }

    println()
    println("Sample Predictions (first 5):")
    response.predictions.take(5).forEachIndexed { i, pred ->
        println("  ${i + 1}: ${"%.2f".format(pred)}")
    }

    println()
}

/**
 * Demo 6: Trend analysis
 */
private suspend fun demoTrendAnalysis(client: HttpClient) {
    printSection("Demo 6: Time Series Trend Analysis")

    println("Analyzing trends in time series data...")

    val request = TrendAnalysisRequest(
        dataset = "sales",
        column = "revenue",
        dateColumn = "date",
        window = 7,
        method = TrendMethod.MOVING_AVERAGE
    )

    val response: TrendAnalysisResponse = try {
        client.post("http://localhost:8080/timeseries/trends") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    } catch (e: Exception) {
        println("Simulating trend analysis...")
        println("Trend Direction: UPWARD")
        println("Trend Strength: 0.78")
        println("Seasonality Detected: Yes (period=7)")
        println()
        return
    }

    println("Column: ${response.column}")
    println("Trend Direction: ${response.trend}")
    println("Trend Strength: ${"%.2f".format(response.trendStrength)}")
    println()

    if (response.seasonality != null) {
        println("Seasonality:")
        println("  Detected: ${response.seasonality.detected}")
        println("  Period: ${response.seasonality.period}")
        println("  Strength: ${"%.2f".format(response.seasonality.strength)}")
    } else {
        println("Seasonality: Not detected")
    }

    if (response.changePoints.isNotEmpty()) {
        println()
        println("Change Points Detected: ${response.changePoints.size}")
        println("  Indices: ${response.changePoints.take(5).joinToString(", ")}")
    }

    println()
    println("Moving Average (last 10 values):")
    response.movingAverage.takeLast(10).forEachIndexed { i, value ->
        println("  ${i + 1}: ${"%.2f".format(value)}")
    }

    println()
}

/**
 * Demo 7: Time series forecasting
 */
private suspend fun demoForecasting(client: HttpClient) {
    printSection("Demo 7: Time Series Forecasting")

    println("Forecasting next 30 periods with ARIMA...")

    val request = ForecastRequest(
        dataset = "sales",
        column = "revenue",
        dateColumn = "date",
        periods = 30,
        model = ForecastModel.ARIMA,
        confidence = 0.95
    )

    val response: ForecastResponse = try {
        client.post("http://localhost:8080/timeseries/forecast") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    } catch (e: Exception) {
        println("Simulating forecast results...")
        println("Model: ARIMA")
        println("Forecast (first 7 days):")
        listOf(1250.5, 1275.3, 1290.8, 1305.2, 1320.5, 1335.0, 1350.3).forEachIndexed { i, value ->
            println("  Day ${i + 1}: $${"%.2f".format(value)}")
        }
        println()
        return
    }

    println("Model: ${response.model}")
    println("Periods: ${response.periods}")
    println()

    println("Forecast Accuracy Metrics:")
    println("  MAE: ${"%.2f".format(response.metrics.mae)}")
    println("  RMSE: ${"%.2f".format(response.metrics.rmse)}")
    println("  MAPE: ${"%.2f".format(response.metrics.mape)}%")
    println()

    println("Forecast Values (first 10):")
    response.forecast.take(10).forEachIndexed { i, value ->
        val lower = response.confidenceIntervals.lower.getOrNull(i) ?: 0.0
        val upper = response.confidenceIntervals.upper.getOrNull(i) ?: 0.0
        println("  Period ${i + 1}: ${"%.2f".format(value)} [95% CI: ${"%.2f".format(lower)}, ${"%.2f".format(upper)}]")
    }

    println()
}

/**
 * Demo 8: Anomaly detection
 */
private suspend fun demoAnomalyDetection(client: HttpClient) {
    printSection("Demo 8: Anomaly Detection")

    println("Detecting anomalies using Z-score method...")

    val request = AnomalyDetectionRequest(
        dataset = "sales",
        column = "revenue",
        dateColumn = "date",
        method = AnomalyMethod.ZSCORE,
        threshold = 3.0
    )

    val response: AnomalyDetectionResponse = try {
        client.post("http://localhost:8080/timeseries/anomalies") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    } catch (e: Exception) {
        println("Simulating anomaly detection...")
        println("Total Anomalies: 12")
        println("Anomaly Rate: 1.2%")
        println()
        return
    }

    println("Method: ${response.method}")
    println("Total Anomalies: ${response.totalAnomalies}")
    println("Anomaly Rate: ${"%.2f".format(response.anomalyRate * 100)}%")
    println()

    if (response.anomalies.isNotEmpty()) {
        println("Detected Anomalies (first 5):")
        response.anomalies.take(5).forEach { anomaly ->
            println("  Timestamp: ${anomaly.timestamp}")
            println("    Value: ${"%.2f".format(anomaly.value)}")
            println("    Score: ${"%.2f".format(anomaly.score)}")
            if (anomaly.expected != null) {
                println("    Expected: ${"%.2f".format(anomaly.expected)}")
            }
            if (anomaly.deviation != null) {
                println("    Deviation: ${"%.2f".format(anomaly.deviation)}")
            }
            println()
        }
    }

    println()
}

/**
 * Demo 9: Data visualization
 */
private suspend fun demoVisualization(client: HttpClient) {
    printSection("Demo 9: Data Visualization")

    println("Generating line chart...")

    val chartRequest = ChartRequest(
        dataset = "sales",
        chartType = ChartType.LINE,
        x = "date",
        y = "revenue",
        title = "Revenue Over Time",
        xLabel = "Date",
        yLabel = "Revenue ($)",
        format = ChartFormat.PNG,
        width = 800,
        height = 600
    )

    val chartResponse: ChartResponse = try {
        client.post("http://localhost:8080/visualize/chart") {
            contentType(ContentType.Application.Json)
            setBody(chartRequest)
        }.body()
    } catch (e: Exception) {
        println("Note: Chart generation requires actual dataset")
        println("Chart would be saved at: /charts/[uuid].png")
        println()
        return
    }

    println("Chart generated successfully!")
    println("  URL: ${chartResponse.chartUrl}")
    println("  Type: ${chartResponse.chartType}")
    println("  Size: ${chartResponse.width}x${chartResponse.height}")
    println("  Format: ${chartResponse.format}")
    println()

    // Generate heatmap
    println("Generating correlation heatmap...")

    val heatmapRequest = HeatmapRequest(
        dataset = "sales",
        columns = listOf("revenue", "customers", "marketing_spend"),
        title = "Correlation Heatmap",
        colormap = "coolwarm",
        annotate = true,
        format = ChartFormat.PNG
    )

    val heatmapResponse: ChartResponse = try {
        client.post("http://localhost:8080/visualize/heatmap") {
            contentType(ContentType.Application.Json)
            setBody(heatmapRequest)
        }.body()
    } catch (e: Exception) {
        println("Note: Heatmap generation requires actual dataset")
        println()
        return
    }

    println("Heatmap generated!")
    println("  URL: ${heatmapResponse.chartUrl}")

    println()
}

/**
 * Demo 10: Real-time streaming analytics
 */
private suspend fun demoStreamingAnalytics(client: HttpClient) {
    printSection("Demo 10: Real-time Streaming Analytics")

    println("Connecting to WebSocket stream...")

    try {
        client.webSocket(method = HttpMethod.Get, host = "localhost", port = 8080, path = "/stream/analytics") {
            println("Connected to analytics stream!")

            // Subscribe to metrics
            val subscription = StreamSubscription(
                action = StreamAction.SUBSCRIBE,
                dataset = "sales",
                metrics = listOf("revenue", "customers"),
                windowSize = 100,
                updateInterval = 1000
            )

            send(Frame.Text(Json.encodeToString(subscription)))
            println("Subscribed to metrics: revenue, customers")
            println()

            // Receive updates for 10 seconds
            println("Receiving live updates...")
            var updateCount = 0

            launch {
                delay(10000)
                close()
            }

            for (frame in incoming) {
                if (frame is Frame.Text) {
                    val message = frame.readText()
                    updateCount++

                    println("Update #$updateCount:")
                    println(message.take(200) + "...")
                    println()

                    if (updateCount >= 5) {
                        println("Received 5 updates, closing connection...")
                        break
                    }
                }
            }

            println("Stream demo completed")
        }
    } catch (e: Exception) {
        println("WebSocket demo failed (server may not be running)")
        println("Error: ${e.message}")
    }

    println()
}

/**
 * Print section header.
 */
private fun printSection(title: String) {
    println()
    println("-" .repeat(80))
    println(title)
    println("-" .repeat(80))
    println()
}
