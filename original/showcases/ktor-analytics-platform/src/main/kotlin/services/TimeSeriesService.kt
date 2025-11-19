package dev.elide.showcases.ktor.analytics.services

import dev.elide.showcases.ktor.analytics.PythonExecutionException
import dev.elide.showcases.ktor.analytics.ValidationException
import dev.elide.showcases.ktor.analytics.models.*
import io.github.oshai.kotlinlogging.KotlinLogging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.sqrt

private val logger = KotlinLogging.logger {}

/**
 * Service for time series analysis and forecasting using Python statsmodels and prophet.
 *
 * Provides comprehensive time series capabilities:
 * - Trend analysis and detection
 * - Seasonality decomposition
 * - Forecasting (ARIMA, SARIMA, Prophet, Exponential Smoothing)
 * - Anomaly detection in time series
 * - Rolling statistics and moving averages
 * - Change point detection
 *
 * Python integration:
 * - pandas for time series data handling
 * - statsmodels for statistical time series models
 * - prophet for forecasting with seasonality
 * - numpy for numerical computations
 * - scipy for signal processing
 *
 * Example usage:
 * ```kotlin
 * val tsService = TimeSeriesService()
 * val forecast = tsService.forecastTimeSeries(dataService, request)
 * val trends = tsService.analyzeTrends(dataService, request)
 * ```
 */
class TimeSeriesService {
    // @ts-ignore
    @JsModule("python:pandas")
    @JsNonModule
    external object pandas {
        fun to_datetime(arg: dynamic): dynamic
        fun date_range(start: String, periods: Int, freq: String): dynamic
    }

    // @ts-ignore
    @JsModule("python:numpy")
    @JsNonModule
    external object numpy {
        fun array(data: dynamic): dynamic
        fun mean(arr: dynamic): Double
        fun std(arr: dynamic): Double
        fun diff(arr: dynamic): dynamic
        fun polyfit(x: dynamic, y: dynamic, deg: Int): dynamic
        fun polyval(p: dynamic, x: dynamic): dynamic
        fun linspace(start: Double, stop: Double, num: Int): dynamic
        fun arange(start: Int, stop: Int): dynamic
    }

    // @ts-ignore
    @JsModule("python:statsmodels.tsa.seasonal")
    @JsNonModule
    external object statsmodels_seasonal {
        fun seasonal_decompose(
            x: dynamic,
            model: String = definedExternally,
            period: Int = definedExternally
        ): dynamic
    }

    // @ts-ignore
    @JsModule("python:statsmodels.tsa.arima.model")
    @JsNonModule
    external object statsmodels_arima {
        fun ARIMA(endog: dynamic, order: List<Int>): dynamic
    }

    // @ts-ignore
    @JsModule("python:statsmodels.tsa.statespace.sarimax")
    @JsNonModule
    external object statsmodels_sarimax {
        fun SARIMAX(
            endog: dynamic,
            order: List<Int>,
            seasonal_order: List<Int> = definedExternally
        ): dynamic
    }

    // @ts-ignore
    @JsModule("python:statsmodels.tsa.holtwinters")
    @JsNonModule
    external object statsmodels_holtwinters {
        fun ExponentialSmoothing(
            endog: dynamic,
            trend: String? = definedExternally,
            seasonal: String? = definedExternally,
            seasonal_periods: Int? = definedExternally
        ): dynamic
    }

    // @ts-ignore
    @JsModule("python:scipy.signal")
    @JsNonModule
    external object scipy_signal {
        fun find_peaks(x: dynamic, height: Double? = definedExternally): dynamic
        fun savgol_filter(x: dynamic, window_length: Int, polyorder: Int): dynamic
    }

    /**
     * Analyze trends in time series data.
     *
     * Detects:
     * - Overall trend direction (upward, downward, stable)
     * - Trend strength
     * - Seasonality patterns
     * - Change points
     *
     * @param dataService Data service instance
     * @param request Trend analysis request
     * @return Trend analysis results
     */
    suspend fun analyzeTrends(
        dataService: DataService,
        request: TrendAnalysisRequest
    ): TrendAnalysisResponse = withContext(Dispatchers.Default) {
        logger.info { "Analyzing trends for ${request.column} in dataset ${request.dataset}" }

        try {
            val df = dataService.getDataFrame(request.dataset)

            // Ensure date column is datetime
            val dateSeries = pandas.to_datetime(df[request.dateColumn])
            val dfSorted = df.copy()
            dfSorted[request.dateColumn] = dateSeries
            dfSorted.sort_values(request.dateColumn, inplace = true)

            val series = dfSorted[request.column].dropna()
            val values = series.values

            // Calculate moving average
            val movingAverage = when (request.method) {
                TrendMethod.MOVING_AVERAGE -> {
                    val ma = series.rolling(window = request.window).mean()
                    ma.dropna().values.tolist() as List<Double>
                }
                TrendMethod.EXPONENTIAL_SMOOTHING -> {
                    val alpha = 2.0 / (request.window + 1)
                    val ema = series.ewm(alpha = alpha).mean()
                    ema.values.tolist() as List<Double>
                }
                TrendMethod.LINEAR_REGRESSION -> {
                    val x = numpy.arange(0, len(series))
                    val coeffs = numpy.polyfit(x, values, 1)
                    val trend = numpy.polyval(coeffs, x)
                    trend.tolist() as List<Double>
                }
                TrendMethod.POLYNOMIAL_REGRESSION -> {
                    val x = numpy.arange(0, len(series))
                    val coeffs = numpy.polyfit(x, values, 2)
                    val trend = numpy.polyval(coeffs, x)
                    trend.tolist() as List<Double>
                }
            }

            // Determine trend direction
            val firstValue = movingAverage.first()
            val lastValue = movingAverage.last()
            val percentChange = ((lastValue - firstValue) / firstValue) * 100

            val trendDirection = when {
                percentChange > 10 -> TrendDirection.UPWARD
                percentChange < -10 -> TrendDirection.DOWNWARD
                abs(percentChange) > 20 -> TrendDirection.VOLATILE
                else -> TrendDirection.STABLE
            }

            // Calculate trend strength (R-squared)
            val x = numpy.arange(0, movingAverage.size)
            val y = numpy.array(movingAverage)
            val coeffs = numpy.polyfit(x, y, 1)
            val yFit = numpy.polyval(coeffs, x)
            val yMean = numpy.mean(y)

            val ssTot = numpy.sum((y - yMean).pow(2))
            val ssRes = numpy.sum((y - yFit).pow(2))
            val trendStrength = 1.0 - (ssRes / ssTot)

            // Detect seasonality
            val seasonality = detectSeasonality(series, request.window)

            // Detect change points
            val changePoints = detectChangePoints(movingAverage)

            TrendAnalysisResponse(
                dataset = request.dataset,
                column = request.column,
                trend = trendDirection,
                trendStrength = trendStrength.coerceIn(0.0, 1.0),
                movingAverage = movingAverage,
                seasonality = seasonality,
                changePoints = changePoints
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to analyze trends" }
            throw PythonExecutionException("Trend analysis failed: ${e.message}", e)
        }
    }

    /**
     * Detect seasonality in time series.
     *
     * @param series Time series data
     * @param period Expected seasonal period
     * @return Seasonality information
     */
    private fun detectSeasonality(series: dynamic, period: Int): SeasonalityInfo? {
        return try {
            if (len(series) < 2 * period) {
                return null
            }

            val decomposition = statsmodels_seasonal.seasonal_decompose(
                series,
                model = "additive",
                period = period
            )

            val seasonal = decomposition.seasonal.values
            val seasonalStrength = calculateSeasonalStrength(series.values, seasonal)

            SeasonalityInfo(
                detected = seasonalStrength > 0.3,
                period = period,
                strength = seasonalStrength,
                pattern = seasonal.tolist() as List<Double>
            )

        } catch (e: Exception) {
            logger.warn { "Failed to detect seasonality: ${e.message}" }
            null
        }
    }

    /**
     * Calculate seasonal strength.
     */
    private fun calculateSeasonalStrength(original: dynamic, seasonal: dynamic): Double {
        val remainder = original - seasonal
        val varOriginal = numpy.var(original)
        val varRemainder = numpy.var(remainder)
        return 1.0 - (varRemainder / varOriginal).coerceIn(0.0, 1.0)
    }

    /**
     * Detect change points in time series.
     *
     * @param data Time series data
     * @return List of change point indices
     */
    private fun detectChangePoints(data: List<Double>): List<Int> {
        val changePoints = mutableListOf<Int>()

        if (data.size < 10) return changePoints

        // Calculate differences
        val diffs = data.zipWithNext { a, b -> abs(b - a) }
        val meanDiff = diffs.average()
        val stdDiff = calculateStd(diffs)

        // Find points where change exceeds threshold
        diffs.forEachIndexed { index, diff ->
            if (diff > meanDiff + 2 * stdDiff) {
                changePoints.add(index + 1)
            }
        }

        return changePoints
    }

    /**
     * Forecast time series using various models.
     *
     * Supports:
     * - ARIMA: AutoRegressive Integrated Moving Average
     * - SARIMA: Seasonal ARIMA
     * - Prophet: Facebook's forecasting tool
     * - Exponential Smoothing
     * - Holt's Winter
     *
     * @param dataService Data service instance
     * @param request Forecast request
     * @return Forecast results
     */
    suspend fun forecastTimeSeries(
        dataService: DataService,
        request: ForecastRequest
    ): ForecastResponse = withContext(Dispatchers.Default) {
        logger.info { "Forecasting ${request.periods} periods using ${request.model}" }

        try {
            val df = dataService.getDataFrame(request.dataset)

            // Prepare time series
            val dateSeries = pandas.to_datetime(df[request.dateColumn])
            val dfSorted = df.copy()
            dfSorted[request.dateColumn] = dateSeries
            dfSorted.sort_values(request.dateColumn, inplace = true)

            val series = dfSorted[request.column].dropna()

            // Generate forecast based on model
            val result = when (request.model) {
                ForecastModel.ARIMA -> forecastARIMA(series, request.periods)
                ForecastModel.SARIMA -> forecastSARIMA(series, request.periods, request.seasonalPeriod ?: 7)
                ForecastModel.EXPONENTIAL_SMOOTHING -> forecastExpSmoothing(series, request.periods)
                ForecastModel.HOLTS_WINTER -> forecastHoltsWinter(series, request.periods, request.seasonalPeriod ?: 7)
                ForecastModel.PROPHET -> forecastProphet(dfSorted, request.dateColumn, request.column, request.periods)
                ForecastModel.LSTM -> throw ValidationException("LSTM forecasting not yet implemented")
            }

            // Calculate forecast metrics
            val metrics = calculateForecastMetrics(series, result.forecast)

            ForecastResponse(
                model = request.model,
                periods = request.periods,
                forecast = result.forecast,
                confidenceIntervals = result.confidenceIntervals,
                metrics = metrics,
                modelParams = result.params
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to forecast time series" }
            throw PythonExecutionException("Forecasting failed: ${e.message}", e)
        }
    }

    /**
     * Forecast using ARIMA model.
     */
    private fun forecastARIMA(series: dynamic, periods: Int): ForecastResult {
        // Auto-select ARIMA order (simplified - use (1,1,1) as default)
        val order = listOf(1, 1, 1)

        val model = statsmodels_arima.ARIMA(series, order)
        val fitted = model.fit()

        val forecast = fitted.forecast(steps = periods)
        val forecastValues = forecast.tolist() as List<Double>

        // Calculate confidence intervals (simplified)
        val stderr = fitted.bse.mean() as Double
        val zScore = 1.96 // 95% confidence

        val lower = forecastValues.map { it - zScore * stderr }
        val upper = forecastValues.map { it + zScore * stderr }

        return ForecastResult(
            forecast = forecastValues,
            confidenceIntervals = ConfidenceInterval(lower, upper, 0.95),
            params = mapOf("order" to order.toString())
        )
    }

    /**
     * Forecast using SARIMA model.
     */
    private fun forecastSARIMA(series: dynamic, periods: Int, seasonalPeriod: Int): ForecastResult {
        val order = listOf(1, 1, 1)
        val seasonalOrder = listOf(1, 1, 1, seasonalPeriod)

        val model = statsmodels_sarimax.SARIMAX(series, order, seasonal_order = seasonalOrder)
        val fitted = model.fit(disp = false)

        val forecast = fitted.forecast(steps = periods)
        val forecastValues = forecast.tolist() as List<Double>

        val stderr = fitted.bse.mean() as Double
        val zScore = 1.96

        val lower = forecastValues.map { it - zScore * stderr }
        val upper = forecastValues.map { it + zScore * stderr }

        return ForecastResult(
            forecast = forecastValues,
            confidenceIntervals = ConfidenceInterval(lower, upper, 0.95),
            params = mapOf(
                "order" to order.toString(),
                "seasonal_order" to seasonalOrder.toString()
            )
        )
    }

    /**
     * Forecast using Exponential Smoothing.
     */
    private fun forecastExpSmoothing(series: dynamic, periods: Int): ForecastResult {
        val model = statsmodels_holtwinters.ExponentialSmoothing(
            series,
            trend = "add",
            seasonal = null
        )
        val fitted = model.fit()

        val forecast = fitted.forecast(steps = periods)
        val forecastValues = forecast.tolist() as List<Double>

        // Simplified confidence intervals
        val stderr = numpy.std(fitted.resid) as Double
        val zScore = 1.96

        val lower = forecastValues.map { it - zScore * stderr }
        val upper = forecastValues.map { it + zScore * stderr }

        return ForecastResult(
            forecast = forecastValues,
            confidenceIntervals = ConfidenceInterval(lower, upper, 0.95),
            params = mapOf("trend" to "add")
        )
    }

    /**
     * Forecast using Holt's Winter method.
     */
    private fun forecastHoltsWinter(series: dynamic, periods: Int, seasonalPeriod: Int): ForecastResult {
        val model = statsmodels_holtwinters.ExponentialSmoothing(
            series,
            trend = "add",
            seasonal = "add",
            seasonal_periods = seasonalPeriod
        )
        val fitted = model.fit()

        val forecast = fitted.forecast(steps = periods)
        val forecastValues = forecast.tolist() as List<Double>

        val stderr = numpy.std(fitted.resid) as Double
        val zScore = 1.96

        val lower = forecastValues.map { it - zScore * stderr }
        val upper = forecastValues.map { it + zScore * stderr }

        return ForecastResult(
            forecast = forecastValues,
            confidenceIntervals = ConfidenceInterval(lower, upper, 0.95),
            params = mapOf(
                "trend" to "add",
                "seasonal" to "add",
                "seasonal_periods" to seasonalPeriod.toString()
            )
        )
    }

    /**
     * Forecast using Facebook Prophet.
     */
    private fun forecastProphet(df: dynamic, dateCol: String, valueCol: String, periods: Int): ForecastResult {
        // Prophet requires specific column names
        val prophetDf = pandas.DataFrame(mapOf(
            "ds" to df[dateCol].values,
            "y" to df[valueCol].values
        ))

        val prophet = Prophet()
        prophet.fit(prophetDf)

        // Create future dataframe
        val future = prophet.make_future_dataframe(periods = periods)
        val forecast = prophet.predict(future)

        // Extract forecasted values
        val yhat = forecast["yhat"].tail(periods)
        val yhatLower = forecast["yhat_lower"].tail(periods)
        val yhatUpper = forecast["yhat_upper"].tail(periods)

        val forecastValues = yhat.tolist() as List<Double>
        val lower = yhatLower.tolist() as List<Double>
        val upper = yhatUpper.tolist() as List<Double>

        return ForecastResult(
            forecast = forecastValues,
            confidenceIntervals = ConfidenceInterval(lower, upper, 0.95),
            params = mapOf("changepoint_prior_scale" to "0.05")
        )
    }

    /**
     * Calculate forecast accuracy metrics.
     */
    private fun calculateForecastMetrics(actual: dynamic, forecast: List<Double>): ForecastMetrics {
        // Use last N values from actual for comparison
        val n = minOf(forecast.size, len(actual))
        val actualValues = actual.tail(n).tolist() as List<Double>
        val forecastValues = forecast.take(n)

        // MAE: Mean Absolute Error
        val mae = actualValues.zip(forecastValues).map { (a, f) ->
            abs(a - f)
        }.average()

        // RMSE: Root Mean Squared Error
        val mse = actualValues.zip(forecastValues).map { (a, f) ->
            (a - f).pow(2)
        }.average()
        val rmse = sqrt(mse)

        // MAPE: Mean Absolute Percentage Error
        val mape = actualValues.zip(forecastValues).filter { (a, _) -> a != 0.0 }.map { (a, f) ->
            abs((a - f) / a) * 100
        }.average()

        return ForecastMetrics(
            mae = mae,
            rmse = rmse,
            mape = mape,
            mase = null
        )
    }

    /**
     * Decompose time series into components.
     *
     * @param dataService Data service instance
     * @param request Decomposition request
     * @return Decomposition results
     */
    suspend fun decomposeTimeSeries(
        dataService: DataService,
        request: DecomposeRequest
    ): DecomposeResponse = withContext(Dispatchers.Default) {
        logger.info { "Decomposing time series for ${request.column}" }

        try {
            val df = dataService.getDataFrame(request.dataset)
            val series = df[request.column].dropna()

            if (len(series) < 2 * request.period) {
                throw ValidationException("Time series too short for decomposition (need at least ${2 * request.period} points)")
            }

            val modelType = when (request.model) {
                DecompositionModel.ADDITIVE -> "additive"
                DecompositionModel.MULTIPLICATIVE -> "multiplicative"
            }

            val decomposition = statsmodels_seasonal.seasonal_decompose(
                series,
                model = modelType,
                period = request.period
            )

            val trend = decomposition.trend.tolist() as List<Double?>
            val seasonal = decomposition.seasonal.tolist() as List<Double>
            val residual = decomposition.resid.tolist() as List<Double?>
            val original = series.tolist() as List<Double>

            DecomposeResponse(
                trend = trend,
                seasonal = seasonal,
                residual = residual,
                originalSeries = original,
                period = request.period
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to decompose time series" }
            throw PythonExecutionException("Decomposition failed: ${e.message}", e)
        }
    }

    /**
     * Detect anomalies in time series.
     *
     * @param dataService Data service instance
     * @param request Anomaly detection request
     * @return Detected anomalies
     */
    suspend fun detectAnomalies(
        dataService: DataService,
        request: AnomalyDetectionRequest
    ): AnomalyDetectionResponse = withContext(Dispatchers.Default) {
        logger.info { "Detecting anomalies in ${request.column} using ${request.method}" }

        try {
            val df = dataService.getDataFrame(request.dataset)
            val dateSeries = df[request.dateColumn].astype(str)
            val series = df[request.column].dropna()

            val anomalies = when (request.method) {
                AnomalyMethod.ZSCORE -> detectAnomaliesZScore(series, dateSeries, request.threshold)
                AnomalyMethod.IQR -> detectAnomaliesIQR(series, dateSeries, request.threshold)
                AnomalyMethod.ISOLATION_FOREST -> detectAnomaliesIsolationForest(series, dateSeries, request.threshold)
                AnomalyMethod.LOF -> detectAnomaliesLOF(series, dateSeries, request.threshold)
                AnomalyMethod.DBSCAN -> detectAnomaliesDBSCAN(series, dateSeries, request.threshold)
            }

            val totalAnomalies = anomalies.size
            val anomalyRate = totalAnomalies.toDouble() / len(series)

            AnomalyDetectionResponse(
                anomalies = anomalies,
                totalAnomalies = totalAnomalies,
                anomalyRate = anomalyRate,
                method = request.method
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to detect anomalies" }
            throw PythonExecutionException("Anomaly detection failed: ${e.message}", e)
        }
    }

    /**
     * Detect anomalies using Z-score method.
     */
    private fun detectAnomaliesZScore(
        series: dynamic,
        dates: dynamic,
        threshold: Double
    ): List<Anomaly> {
        val mean = numpy.mean(series.values)
        val std = numpy.std(series.values)

        val anomalies = mutableListOf<Anomaly>()
        val values = series.tolist() as List<Double>
        val timestamps = dates.tolist() as List<String>

        values.forEachIndexed { index, value ->
            val zScore = abs((value - mean) / std)
            if (zScore > threshold) {
                anomalies.add(
                    Anomaly(
                        timestamp = timestamps[index],
                        value = value,
                        score = zScore,
                        expected = mean,
                        deviation = value - mean
                    )
                )
            }
        }

        return anomalies
    }

    /**
     * Detect anomalies using IQR method.
     */
    private fun detectAnomaliesIQR(
        series: dynamic,
        dates: dynamic,
        threshold: Double
    ): List<Anomaly> {
        val q1 = series.quantile(0.25) as Double
        val q3 = series.quantile(0.75) as Double
        val iqr = q3 - q1
        val lowerBound = q1 - threshold * iqr
        val upperBound = q3 + threshold * iqr

        val anomalies = mutableListOf<Anomaly>()
        val values = series.tolist() as List<Double>
        val timestamps = dates.tolist() as List<String>

        values.forEachIndexed { index, value ->
            if (value < lowerBound || value > upperBound) {
                val expected = (q1 + q3) / 2
                anomalies.add(
                    Anomaly(
                        timestamp = timestamps[index],
                        value = value,
                        score = if (value < lowerBound) (lowerBound - value) / iqr else (value - upperBound) / iqr,
                        expected = expected,
                        deviation = value - expected
                    )
                )
            }
        }

        return anomalies
    }

    /**
     * Detect anomalies using Isolation Forest.
     */
    private fun detectAnomaliesIsolationForest(
        series: dynamic,
        dates: dynamic,
        threshold: Double
    ): List<Anomaly> {
        val values = series.values.reshape(-1, 1)
        val isoForest = sklearn_ensemble.IsolationForest(contamination = threshold / 100.0)
        val predictions = isoForest.fit_predict(values)
        val scores = isoForest.score_samples(values)

        val anomalies = mutableListOf<Anomaly>()
        val valuesList = series.tolist() as List<Double>
        val timestamps = dates.tolist() as List<String>
        val predsList = predictions.tolist() as List<Int>
        val scoresList = scores.tolist() as List<Double>

        valuesList.forEachIndexed { index, value ->
            if (predsList[index] == -1) {
                anomalies.add(
                    Anomaly(
                        timestamp = timestamps[index],
                        value = value,
                        score = abs(scoresList[index]),
                        expected = null,
                        deviation = null
                    )
                )
            }
        }

        return anomalies
    }

    /**
     * Detect anomalies using Local Outlier Factor.
     */
    private fun detectAnomaliesLOF(
        series: dynamic,
        dates: dynamic,
        threshold: Double
    ): List<Anomaly> {
        // Simplified LOF detection using rolling mean/std
        val window = 10
        val rollingMean = series.rolling(window = window).mean()
        val rollingStd = series.rolling(window = window).std()

        val anomalies = mutableListOf<Anomaly>()
        val values = series.tolist() as List<Double>
        val timestamps = dates.tolist() as List<String>
        val means = rollingMean.tolist() as List<Double?>
        val stds = rollingStd.tolist() as List<Double?>

        values.forEachIndexed { index, value ->
            val mean = means.getOrNull(index)
            val std = stds.getOrNull(index)
            if (mean != null && std != null && std > 0) {
                val score = abs((value - mean) / std)
                if (score > threshold) {
                    anomalies.add(
                        Anomaly(
                            timestamp = timestamps[index],
                            value = value,
                            score = score,
                            expected = mean,
                            deviation = value - mean
                        )
                    )
                }
            }
        }

        return anomalies
    }

    /**
     * Detect anomalies using DBSCAN.
     */
    private fun detectAnomaliesDBSCAN(
        series: dynamic,
        dates: dynamic,
        threshold: Double
    ): List<Anomaly> {
        // Use simplified threshold-based detection
        return detectAnomaliesZScore(series, dates, threshold)
    }

    /**
     * Calculate standard deviation for a list.
     */
    private fun calculateStd(values: List<Double>): Double {
        val mean = values.average()
        val variance = values.map { (it - mean).pow(2) }.average()
        return sqrt(variance)
    }

    /**
     * Check service health.
     */
    fun isHealthy(): Boolean {
        return try {
            val testSeries = numpy.array(listOf(1, 2, 3, 4, 5))
            val mean = numpy.mean(testSeries)
            mean > 0
        } catch (e: Exception) {
            logger.error(e) { "Health check failed" }
            false
        }
    }
}

/**
 * Internal forecast result.
 */
private data class ForecastResult(
    val forecast: List<Double>,
    val confidenceIntervals: ConfidenceInterval,
    val params: Map<String, String>
)

/**
 * External Python functions.
 */
@JsName("len")
external fun len(obj: dynamic): Int

@JsName("Prophet")
external fun Prophet(): dynamic

@JsName("minOf")
external fun minOf(a: Int, b: Int): Int

/**
 * External imports for sklearn.
 */
// @ts-ignore
@JsModule("python:sklearn.ensemble")
@JsNonModule
external object sklearn_ensemble {
    fun IsolationForest(contamination: Double): dynamic
}

/**
 * Extension for dynamic pow operation.
 */
private fun dynamic.pow(n: Int): dynamic {
    @Suppress("UNUSED_VARIABLE")
    val result = this
    return js("Math.pow(result, n)")
}

/**
 * Extension for dynamic sum operation.
 */
@JsName("sum")
external fun dynamic.sum(): Double
