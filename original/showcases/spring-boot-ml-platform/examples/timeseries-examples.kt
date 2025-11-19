package com.example.mlplatform.examples.timeseries

import elide.runtime.gvm.annotations.Polyglot

/**
 * Time Series Examples - Forecasting and Analysis
 *
 * Comprehensive time series analysis and forecasting examples
 * using Python libraries in Kotlin via Elide's polyglot runtime.
 *
 * Topics covered:
 * - ARIMA modeling
 * - Prophet forecasting
 * - LSTM neural networks
 * - Seasonal decomposition
 * - Anomaly detection
 * - Multiple time series forecasting
 */

// ============================================================================
// Example 1: Sales Forecasting with Prophet
// ============================================================================

@Polyglot
fun salesForecastingWithProphet() {
    println("=== Sales Forecasting with Prophet ===\n")

    val prophet = importPython("prophet")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")
    val matplotlib = importPython("matplotlib.pyplot")

    // Generate synthetic sales data
    println("Generating synthetic sales data...")

    val nDays = 730 // 2 years
    val dates = pandas.date_range("2022-01-01", periods = nDays, freq = "D")

    // Trend + seasonality + noise
    val trend = numpy.linspace(1000, 2000, nDays)
    val yearly_seasonal = 300 * numpy.sin(numpy.arange(nDays) * 2 * numpy.pi / 365)
    val weekly_seasonal = 100 * numpy.sin(numpy.arange(nDays) * 2 * numpy.pi / 7)
    val noise = numpy.random.randn(nDays) * 50

    val sales = trend + yearly_seasonal + weekly_seasonal + noise

    val df = pandas.DataFrame(mapOf(
        "ds" to dates,
        "y" to sales
    ))

    println("  Generated $nDays days of sales data")
    println("  Date range: ${df["ds"].min()} to ${df["ds"].max()}\n")

    // Train Prophet model
    println("Training Prophet model...")

    val model = prophet.Prophet(
        yearly_seasonality = true,
        weekly_seasonality = true,
        daily_seasonality = false,
        seasonality_mode = "additive"
    )

    // Add custom seasonality (monthly)
    model.add_seasonality(
        name = "monthly",
        period = 30.5,
        fourier_order = 5
    )

    // Add holidays (example)
    val holidays = pandas.DataFrame(mapOf(
        "holiday" to listOf("Black Friday", "Christmas", "New Year"),
        "ds" to pandas.to_datetime(listOf(
            "2022-11-25", "2022-12-25", "2023-01-01"
        ))
    ))

    model.holidays = holidays

    model.fit(df)

    println("  Model trained successfully\n")

    // Make future predictions
    println("Generating forecast for next 90 days...")

    val future = model.make_future_dataframe(periods = 90)
    val forecast = model.predict(future)

    // Display forecast results
    println("\nForecast Sample (next 10 days):")
    println("-" * 80)

    val forecastTail = forecast[listOf("ds", "yhat", "yhat_lower", "yhat_upper")].tail(10)
    println(forecastTail)

    // Forecast statistics
    val forecastValues = forecast["yhat"].tail(90).values
    val avgForecast = forecastValues.mean()
    val minForecast = forecastValues.min()
    val maxForecast = forecastValues.max()

    println("\nForecast Statistics (90 days):")
    println("  Average: ${String.format("%.2f", avgForecast)}")
    println("  Minimum: ${String.format("%.2f", minForecast)}")
    println("  Maximum: ${String.format("%.2f", maxForecast)}")

    // Component analysis
    println("\nSeasonal Components:")

    val components = model.predict(df)

    val trendComponent = components["trend"].mean()
    val yearlyComponent = components["yearly"].mean() if "yearly" in components.columns else 0
    val weeklyComponent = components["weekly"].mean() if "weekly" in components.columns else 0

    println("  Trend: ${String.format("%.2f", trendComponent)}")
    println("  Yearly: ${String.format("%.2f", yearlyComponent)}")
    println("  Weekly: ${String.format("%.2f", weeklyComponent)}")
}

// ============================================================================
// Example 2: ARIMA Time Series Modeling
// ============================================================================

@Polyglot
fun arimaModeling() {
    println("\n=== ARIMA Time Series Modeling ===\n")

    val statsmodels = importPython("statsmodels.api")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    // Generate time series data
    println("Generating time series data...")

    val nObs = 200
    val dates = pandas.date_range("2023-01-01", periods = nObs, freq = "D")

    // AR(1) process
    val ar = numpy.array(listOf(1.0, -0.7))
    val ma = numpy.array(listOf(1.0))
    val armaProcess = statsmodels.tsa.arima_process.ArmaProcess(ar, ma)

    val y = armaProcess.generate_sample(nObs) + 100

    val df = pandas.DataFrame(mapOf(
        "date" to dates,
        "value" to y
    ))

    df.set_index("date", inplace = true)

    println("  Generated $nObs observations\n")

    // Test for stationarity
    println("Testing for stationarity (ADF test)...")

    val adfTest = statsmodels.tsa.stattools.adfuller(df["value"])
    val adfStatistic = adfTest[0]
    val pValue = adfTest[1]

    println("  ADF Statistic: ${String.format("%.4f", adfStatistic)}")
    println("  p-value: ${String.format("%.4f", pValue)}")
    println("  Series is ${if (pValue < 0.05) "stationary" else "non-stationary"}\n")

    // Fit ARIMA model
    println("Fitting ARIMA(1,0,1) model...")

    val model = statsmodels.tsa.arima.model.ARIMA(
        df["value"],
        order = Triple(1, 0, 1)
    )

    val results = model.fit()

    println("\nModel Summary:")
    println(results.summary())

    // Make predictions
    println("\nForecasting next 30 days...")

    val forecast = results.forecast(steps = 30)

    println("\nForecast (first 10 days):")
    forecast["[:10]"].forEach { value ->
        println("  ${String.format("%.2f", value as Double)}")
    }

    // Model diagnostics
    println("\nModel Diagnostics:")

    val residuals = results.resid
    val residMean = residuals.mean()
    val residStd = residuals.std()

    println("  Residual mean: ${String.format("%.4f", residMean)}")
    println("  Residual std: ${String.format("%.4f", residStd)}")

    // Ljung-Box test for autocorrelation
    val lbTest = statsmodels.stats.diagnostic.acorr_ljungbox(residuals, lags = 10)
    println("  Ljung-Box test p-values: ${lbTest["lb_pvalue"].values}")
}

// ============================================================================
// Example 3: LSTM for Time Series Forecasting
// ============================================================================

@Polyglot
fun lstmForecasting() {
    println("\n=== LSTM Time Series Forecasting ===\n")

    val tensorflow = importPython("tensorflow")
    val numpy = importPython("numpy")
    val sklearn = importPython("sklearn")

    // Generate complex time series
    println("Generating complex time series data...")

    val nPoints = 1000
    val time = numpy.arange(nPoints)

    // Multiple seasonal patterns
    val signal = (
        50 +
        10 * numpy.sin(time * 2 * numpy.pi / 50) +
        20 * numpy.sin(time * 2 * numpy.pi / 200) +
        numpy.random.randn(nPoints) * 3
    )

    println("  Generated $nPoints data points\n")

    // Prepare data for LSTM
    println("Preparing data for LSTM...")

    val sequenceLength = 50

    val X = mutableListOf<List<Double>>()
    val y = mutableListOf<Double>()

    for (i in 0 until (nPoints - sequenceLength)) {
        X.add(signal["$i:${i + sequenceLength}"].tolist() as List<Double>)
        y.add(signal[i + sequenceLength] as Double)
    }

    val XArray = numpy.array(X)
    val yArray = numpy.array(y)

    // Normalize data
    val scaler = sklearn.preprocessing.MinMaxScaler()
    val XScaled = scaler.fit_transform(XArray.reshape(-1, 1))
        .reshape(XArray.shape[0], sequenceLength, 1)
    val yScaled = scaler.transform(yArray.reshape(-1, 1))

    // Train/test split
    val trainSize = (XScaled.shape[0] * 0.8).toInt()

    val XTrain = XScaled[":$trainSize"]
    val yTrain = yScaled[":$trainSize"]
    val XTest = XScaled["$trainSize:"]
    val yTest = yScaled["$trainSize:"]

    println("  Train set: ${XTrain.shape[0]} sequences")
    println("  Test set: ${XTest.shape[0]} sequences\n")

    // Build LSTM model
    println("Building LSTM model...")

    val model = tensorflow.keras.Sequential(listOf(
        tensorflow.keras.layers.LSTM(
            50,
            activation = "relu",
            input_shape = listOf(sequenceLength, 1),
            return_sequences = true
        ),
        tensorflow.keras.layers.Dropout(0.2),
        tensorflow.keras.layers.LSTM(50, activation = "relu"),
        tensorflow.keras.layers.Dropout(0.2),
        tensorflow.keras.layers.Dense(25, activation = "relu"),
        tensorflow.keras.layers.Dense(1)
    ))

    model.compile(
        optimizer = tensorflow.keras.optimizers.Adam(learning_rate = 0.001),
        loss = "mse",
        metrics = listOf("mae")
    )

    println(model.summary())

    // Train model
    println("\nTraining LSTM model...")

    val history = model.fit(
        XTrain, yTrain,
        epochs = 50,
        batch_size = 32,
        validation_split = 0.2,
        callbacks = listOf(
            tensorflow.keras.callbacks.EarlyStopping(
                monitor = "val_loss",
                patience = 10,
                restore_best_weights = true
            )
        ),
        verbose = 1
    )

    // Evaluate
    println("\nEvaluating model...")

    val testLoss = model.evaluate(XTest, yTest, verbose = 0)
    println("  Test Loss (MSE): ${String.format("%.4f", testLoss[0])}")
    println("  Test MAE: ${String.format("%.4f", testLoss[1])}")

    // Make predictions
    println("\nGenerating predictions...")

    val predictions = model.predict(XTest)
    val predictionsOriginal = scaler.inverse_transform(predictions)
    val yTestOriginal = scaler.inverse_transform(yTest)

    // Calculate metrics
    val mse = sklearn.metrics.mean_squared_error(yTestOriginal, predictionsOriginal)
    val mae = sklearn.metrics.mean_absolute_error(yTestOriginal, predictionsOriginal)
    val r2 = sklearn.metrics.r2_score(yTestOriginal, predictionsOriginal)

    println("\nPrediction Metrics:")
    println("  MSE: ${String.format("%.4f", mse)}")
    println("  MAE: ${String.format("%.4f", mae)}")
    println("  R²: ${String.format("%.4f", r2)}")
}

// ============================================================================
// Example 4: Seasonal Decomposition
// ============================================================================

@Polyglot
fun seasonalDecomposition() {
    println("\n=== Seasonal Decomposition ===\n")

    val statsmodels = importPython("statsmodels.api")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    // Generate time series with clear seasonal pattern
    println("Generating time series with seasonal pattern...")

    val nYears = 3
    val nObs = nYears * 365

    val dates = pandas.date_range("2021-01-01", periods = nObs, freq = "D")
    val time = numpy.arange(nObs)

    // Trend + Seasonal + Random
    val trend = 100 + time * 0.1
    val seasonal = 30 * numpy.sin(time * 2 * numpy.pi / 365)
    val noise = numpy.random.randn(nObs) * 5

    val y = trend + seasonal + noise

    val df = pandas.DataFrame(mapOf(
        "value" to y
    ), index = dates)

    println("  Generated $nObs observations over $nYears years\n")

    // Perform seasonal decomposition
    println("Performing seasonal decomposition...")

    val decomposition = statsmodels.tsa.seasonal.seasonal_decompose(
        df["value"],
        model = "additive",
        period = 365
    )

    println("  Decomposition complete\n")

    // Extract components
    val observed = decomposition.observed
    val trend_component = decomposition.trend
    val seasonal_component = decomposition.seasonal
    val residual = decomposition.resid

    println("Component Statistics:")
    println("-" * 80)

    println("\nTrend:")
    println("  Mean: ${String.format("%.2f", trend_component.mean())}")
    println("  Std: ${String.format("%.2f", trend_component.std())}")

    println("\nSeasonal:")
    println("  Mean: ${String.format("%.2f", seasonal_component.mean())}")
    println("  Amplitude: ${String.format("%.2f", seasonal_component.max() - seasonal_component.min())}")

    println("\nResidual:")
    println("  Mean: ${String.format("%.2f", residual.mean())}")
    println("  Std: ${String.format("%.2f", residual.std())}")

    // Variance decomposition
    val totalVar = observed.var()
    val trendVar = trend_component.var()
    val seasonalVar = seasonal_component.var()
    val residualVar = residual.var()

    println("\nVariance Decomposition:")
    println("  Total variance: ${String.format("%.2f", totalVar)}")
    println("  Trend variance: ${String.format("%.2f", trendVar)} " +
            "(${String.format("%.1f", trendVar / totalVar * 100)}%)")
    println("  Seasonal variance: ${String.format("%.2f", seasonalVar)} " +
            "(${String.format("%.1f", seasonalVar / totalVar * 100)}%)")
    println("  Residual variance: ${String.format("%.2f", residualVar)} " +
            "(${String.format("%.1f", residualVar / totalVar * 100)}%)")
}

// ============================================================================
// Example 5: Anomaly Detection in Time Series
// ============================================================================

@Polyglot
fun anomalyDetection() {
    println("\n=== Time Series Anomaly Detection ===\n")

    val pandas = importPython("pandas")
    val numpy = importPython("numpy")
    val sklearn = importPython("sklearn")

    // Generate normal time series with anomalies
    println("Generating time series with anomalies...")

    val nObs = 500
    val dates = pandas.date_range("2024-01-01", periods = nObs, freq = "H")

    // Normal pattern
    val normal = 100 + 20 * numpy.sin(numpy.arange(nObs) * 2 * numpy.pi / 24) +
                numpy.random.randn(nObs) * 3

    // Inject anomalies
    val anomalyIndices = numpy.random.choice(nObs, 20, replace = false)
    val y = normal.copy()

    anomalyIndices.forEach { idx ->
        y[idx] = y[idx] + numpy.random.choice(listOf(-1, 1)) * numpy.random.uniform(50, 100)
    }

    val df = pandas.DataFrame(mapOf(
        "timestamp" to dates,
        "value" to y
    ))

    println("  Generated $nObs observations with ${anomalyIndices.size} anomalies\n")

    // Method 1: Statistical approach (Z-score)
    println("Method 1: Z-score based detection...")

    val mean = df["value"].mean()
    val std = df["value"].std()
    val zScores = (df["value"] - mean) / std

    val threshold = 3.0
    val anomaliesZScore = (numpy.abs(zScores) > threshold)

    val nDetectedZScore = anomaliesZScore.sum()
    println("  Detected $nDetectedZScore anomalies (threshold: $threshold)\n")

    // Method 2: Isolation Forest
    println("Method 2: Isolation Forest...")

    val isoForest = sklearn.ensemble.IsolationForest(
        contamination = 0.05,
        random_state = 42
    )

    val values = df["value"].values.reshape(-1, 1)
    val predictions = isoForest.fit_predict(values)

    val anomaliesIsoForest = (predictions == -1)
    val nDetectedIsoForest = anomaliesIsoForest.sum()

    println("  Detected $nDetectedIsoForest anomalies\n")

    // Method 3: Moving average with residuals
    println("Method 3: Moving average residuals...")

    val windowSize = 24
    val movingAvg = df["value"].rolling(window = windowSize).mean()
    val residuals = df["value"] - movingAvg

    val residualThreshold = residuals.std() * 3
    val anomaliesResidual = (numpy.abs(residuals) > residualThreshold)

    val nDetectedResidual = anomaliesResidual.sum()
    println("  Detected $nDetectedResidual anomalies\n")

    // Compare methods
    println("Detection Comparison:")
    println("-" * 80)

    println("\nTrue anomalies: ${anomalyIndices.size}")
    println("Z-score detected: $nDetectedZScore")
    println("Isolation Forest detected: $nDetectedIsoForest")
    println("Moving average detected: $nDetectedResidual")

    // Calculate precision for Z-score method
    val trueAnomalies = numpy.isin(numpy.arange(nObs), anomalyIndices)
    val tp = (anomaliesZScore & trueAnomalies).sum()
    val fp = (anomaliesZScore & ~trueAnomalies).sum()

    val precision = if (nDetectedZScore > 0) {
        tp.toDouble() / nDetectedZScore
    } else 0.0

    val recall = tp.toDouble() / anomalyIndices.size

    println("\nZ-score Method Performance:")
    println("  True Positives: $tp")
    println("  False Positives: $fp")
    println("  Precision: ${String.format("%.2f", precision * 100)}%")
    println("  Recall: ${String.format("%.2f", recall * 100)}%")
}

// ============================================================================
// Example 6: Multiple Time Series Forecasting
// ============================================================================

@Polyglot
fun multipleTimeSeriesForecasting() {
    println("\n=== Multiple Time Series Forecasting ===\n")

    val sklearn = importPython("sklearn")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    // Generate multiple related time series
    println("Generating multiple related time series...")

    val nObs = 200
    val nSeries = 5

    val dates = pandas.date_range("2023-01-01", periods = nObs, freq = "D")

    // Base trend
    val baseTrend = numpy.linspace(100, 200, nObs)

    // Generate correlated series
    val series = (0 until nSeries).map { i ->
        val seasonal = 20 * numpy.sin(numpy.arange(nObs) * 2 * numpy.pi / 30 + i)
        val noise = numpy.random.randn(nObs) * 5
        baseTrend + seasonal + noise + i * 10
    }

    val df = pandas.DataFrame(
        numpy.column_stack(series),
        columns = (0 until nSeries).map { "series_$it" },
        index = dates
    )

    println("  Generated $nSeries time series with $nObs observations each\n")

    // Vector Autoregression (VAR)
    println("Fitting Vector Autoregression model...")

    val statsmodels = importPython("statsmodels.api")

    val varModel = statsmodels.tsa.vector_ar.var_model.VAR(df)
    val results = varModel.fit(maxlags = 10, ic = "aic")

    println("  Model fitted with lag order: ${results.k_ar}\n")

    // Make forecasts
    println("Forecasting next 30 days...")

    val forecast = results.forecast(df.values["-${results.k_ar}:"], steps = 30)

    println("\nForecast Summary (first 5 days):")
    println("-" * 80)

    (0 until 5).forEach { day ->
        println("\nDay ${day + 1}:")
        (0 until nSeries).forEach { series ->
            println("  Series $series: ${String.format("%.2f", forecast[day][series])}")
        }
    }

    // Cross-correlation analysis
    println("\n\nCross-Correlation Analysis:")
    println("-" * 80)

    val correlations = df.corr()

    println("\nCorrelation Matrix:")
    (0 until nSeries).forEach { i ->
        print("Series $i: ")
        (0 until nSeries).forEach { j ->
            print("${String.format("%.2f", correlations.iloc[i, j])} ")
        }
        println()
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

@Polyglot
private fun importPython(module: String): dynamic {
    return js("require('python:$module')")
}

private operator fun String.times(count: Int): String = this.repeat(count)

// ============================================================================
// Main Demo
// ============================================================================

fun main() {
    println("╔══════════════════════════════════════════════════════════╗")
    println("║       Time Series Analysis with Elide Polyglot           ║")
    println("║           Python + Kotlin in Spring Boot                 ║")
    println("╚══════════════════════════════════════════════════════════╝")
    println()

    try {
        salesForecastingWithProphet()
        arimaModeling()
        lstmForecasting()
        seasonalDecomposition()
        anomalyDetection()
        multipleTimeSeriesForecasting()

        println("\n" + "=".repeat(60))
        println("All time series examples completed successfully!")
        println("=".repeat(60))

    } catch (e: Exception) {
        println("\nError: ${e.message}")
        e.printStackTrace()
    }
}
