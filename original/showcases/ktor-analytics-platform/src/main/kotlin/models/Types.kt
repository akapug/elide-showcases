package dev.elide.showcases.ktor.analytics.models

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

/**
 * Data models for the Ktor Analytics Platform.
 *
 * This file contains all serializable data types used for:
 * - Request/response payloads
 * - Internal data structures
 * - Analytics results
 * - Time series data
 * - Visualization specifications
 */

// ========================================
// Dataset Models
// ========================================

/**
 * Represents a dataset with metadata.
 *
 * @property id Unique dataset identifier
 * @property name Human-readable dataset name
 * @property path File path or URL to the dataset
 * @property rows Number of rows in the dataset
 * @property columns List of column information
 * @property createdAt Dataset creation timestamp
 * @property updatedAt Last update timestamp
 * @property format Dataset format (csv, parquet, json, etc.)
 * @property size Dataset size in bytes
 */
@Serializable
data class Dataset(
    val id: String,
    val name: String,
    val path: String,
    val rows: Long,
    val columns: List<ColumnInfo>,
    val createdAt: Instant,
    val updatedAt: Instant,
    val format: DatasetFormat = DatasetFormat.CSV,
    val size: Long = 0
)

/**
 * Supported dataset formats.
 */
@Serializable
enum class DatasetFormat {
    CSV,
    PARQUET,
    JSON,
    EXCEL,
    SQL
}

/**
 * Information about a dataset column.
 *
 * @property name Column name
 * @property dtype Data type (int64, float64, object, datetime64, etc.)
 * @property nullCount Number of null values
 * @property unique Number of unique values
 * @property sample Sample values from the column
 */
@Serializable
data class ColumnInfo(
    val name: String,
    val dtype: String,
    val nullCount: Long = 0,
    val unique: Long = 0,
    val sample: List<String> = emptyList()
)

// ========================================
// Statistics Models
// ========================================

/**
 * Request for descriptive statistics.
 *
 * @property dataset Dataset identifier
 * @property columns Specific columns to analyze (null = all columns)
 * @property includePercentiles Include percentile calculations
 * @property percentiles Custom percentiles to compute (e.g., [25, 50, 75])
 */
@Serializable
data class DescribeRequest(
    val dataset: String,
    val columns: List<String>? = null,
    val includePercentiles: Boolean = true,
    val percentiles: List<Int> = listOf(25, 50, 75)
)

/**
 * Response with descriptive statistics.
 *
 * @property dataset Dataset identifier
 * @property rows Number of rows analyzed
 * @property columns Number of columns analyzed
 * @property statistics Statistics for each column
 * @property computedAt Timestamp when statistics were computed
 */
@Serializable
data class DescribeResponse(
    val dataset: String,
    val rows: Long,
    val columns: Int,
    val statistics: Map<String, StatisticsResult>,
    val computedAt: Instant
)

/**
 * Statistical measures for a single column.
 *
 * @property count Number of non-null values
 * @property mean Average value
 * @property std Standard deviation
 * @property min Minimum value
 * @property max Maximum value
 * @property percentiles Percentile values (e.g., 25th, 50th, 75th)
 * @property median Median value (50th percentile)
 * @property mode Most frequent value
 * @property variance Variance
 * @property skewness Skewness (measure of asymmetry)
 * @property kurtosis Kurtosis (measure of tailedness)
 */
@Serializable
data class StatisticsResult(
    val count: Long,
    val mean: Double,
    val std: Double,
    val min: Double,
    val max: Double,
    val percentiles: Map<Int, Double>,
    val median: Double? = null,
    val mode: Double? = null,
    val variance: Double? = null,
    val skewness: Double? = null,
    val kurtosis: Double? = null
)

/**
 * Request for correlation analysis.
 *
 * @property dataset Dataset identifier
 * @property columns Columns to include in correlation matrix
 * @property method Correlation method (pearson, spearman, kendall)
 * @property minPeriods Minimum number of observations required
 */
@Serializable
data class CorrelationRequest(
    val dataset: String,
    val columns: List<String>? = null,
    val method: CorrelationMethod = CorrelationMethod.PEARSON,
    val minPeriods: Int? = null
)

/**
 * Correlation methods.
 */
@Serializable
enum class CorrelationMethod {
    PEARSON,
    SPEARMAN,
    KENDALL
}

/**
 * Response with correlation matrix.
 *
 * @property correlationMatrix 2D correlation matrix
 * @property columns Column names (order matches matrix)
 * @property method Correlation method used
 * @property significantPairs Pairs with significant correlations
 */
@Serializable
data class CorrelationResponse(
    val correlationMatrix: List<List<Double>>,
    val columns: List<String>,
    val method: CorrelationMethod,
    val significantPairs: List<CorrelationPair> = emptyList()
)

/**
 * A pair of correlated variables.
 *
 * @property column1 First column name
 * @property column2 Second column name
 * @property correlation Correlation coefficient
 * @property pValue P-value for significance test
 */
@Serializable
data class CorrelationPair(
    val column1: String,
    val column2: String,
    val correlation: Double,
    val pValue: Double? = null
)

/**
 * Request for regression analysis.
 *
 * @property dataset Dataset identifier
 * @property target Target variable (dependent variable)
 * @property features Feature variables (independent variables)
 * @property model Regression model type
 * @property testSize Fraction of data to use for testing
 * @property randomState Random seed for reproducibility
 */
@Serializable
data class RegressionRequest(
    val dataset: String,
    val target: String,
    val features: List<String>,
    val model: RegressionModel = RegressionModel.LINEAR,
    val testSize: Double = 0.2,
    val randomState: Int? = 42
)

/**
 * Regression model types.
 */
@Serializable
enum class RegressionModel {
    LINEAR,
    RIDGE,
    LASSO,
    ELASTIC_NET,
    POLYNOMIAL,
    RANDOM_FOREST,
    GRADIENT_BOOSTING
}

/**
 * Response with regression results.
 *
 * @property modelType Model type used
 * @property coefficients Feature coefficients
 * @property intercept Model intercept
 * @property r2Score R-squared score (coefficient of determination)
 * @property mse Mean squared error
 * @property mae Mean absolute error
 * @property rmse Root mean squared error
 * @property predictions Sample predictions
 * @property featureImportance Feature importance scores
 */
@Serializable
data class RegressionResponse(
    val modelType: RegressionModel,
    val coefficients: Map<String, Double>,
    val intercept: Double,
    val r2Score: Double,
    val mse: Double,
    val mae: Double,
    val rmse: Double,
    val predictions: List<Double> = emptyList(),
    val featureImportance: Map<String, Double>? = null
)

// ========================================
// Time Series Models
// ========================================

/**
 * Request for trend analysis.
 *
 * @property dataset Dataset identifier
 * @property column Column containing time series data
 * @property dateColumn Column containing timestamps
 * @property window Rolling window size for smoothing
 * @property method Trend detection method
 */
@Serializable
data class TrendAnalysisRequest(
    val dataset: String,
    val column: String,
    val dateColumn: String = "date",
    val window: Int = 7,
    val method: TrendMethod = TrendMethod.MOVING_AVERAGE
)

/**
 * Trend detection methods.
 */
@Serializable
enum class TrendMethod {
    MOVING_AVERAGE,
    EXPONENTIAL_SMOOTHING,
    LINEAR_REGRESSION,
    POLYNOMIAL_REGRESSION
}

/**
 * Response with trend analysis.
 *
 * @property dataset Dataset identifier
 * @property column Column analyzed
 * @property trend Trend direction (upward, downward, stable)
 * @property trendStrength Strength of trend (0-1)
 * @property movingAverage Moving average values
 * @property seasonality Seasonality detection results
 * @property changePoints Detected change points in the trend
 */
@Serializable
data class TrendAnalysisResponse(
    val dataset: String,
    val column: String,
    val trend: TrendDirection,
    val trendStrength: Double,
    val movingAverage: List<Double>,
    val seasonality: SeasonalityInfo? = null,
    val changePoints: List<Int> = emptyList()
)

/**
 * Trend directions.
 */
@Serializable
enum class TrendDirection {
    UPWARD,
    DOWNWARD,
    STABLE,
    VOLATILE
}

/**
 * Seasonality information.
 *
 * @property detected Whether seasonality was detected
 * @property period Seasonal period (e.g., 7 for weekly)
 * @property strength Seasonality strength (0-1)
 * @property pattern Seasonal pattern values
 */
@Serializable
data class SeasonalityInfo(
    val detected: Boolean,
    val period: Int,
    val strength: Double,
    val pattern: List<Double> = emptyList()
)

/**
 * Request for time series forecasting.
 *
 * @property dataset Dataset identifier
 * @property column Column to forecast
 * @property dateColumn Column containing timestamps
 * @property periods Number of periods to forecast
 * @property model Forecasting model
 * @property confidence Confidence level for intervals (0-1)
 * @property seasonalPeriod Seasonal period for models that require it
 */
@Serializable
data class ForecastRequest(
    val dataset: String,
    val column: String,
    val dateColumn: String = "date",
    val periods: Int = 30,
    val model: ForecastModel = ForecastModel.ARIMA,
    val confidence: Double = 0.95,
    val seasonalPeriod: Int? = null
)

/**
 * Forecasting models.
 */
@Serializable
enum class ForecastModel {
    ARIMA,
    SARIMA,
    PROPHET,
    EXPONENTIAL_SMOOTHING,
    HOLTS_WINTER,
    LSTM
}

/**
 * Response with forecast results.
 *
 * @property model Model used for forecasting
 * @property periods Number of periods forecasted
 * @property forecast Forecasted values
 * @property confidenceIntervals Confidence intervals for forecast
 * @property metrics Forecast accuracy metrics
 * @property modelParams Model parameters used
 */
@Serializable
data class ForecastResponse(
    val model: ForecastModel,
    val periods: Int,
    val forecast: List<Double>,
    val confidenceIntervals: ConfidenceInterval,
    val metrics: ForecastMetrics,
    val modelParams: Map<String, String> = emptyMap()
)

/**
 * Confidence intervals for forecast.
 *
 * @property lower Lower bound values
 * @property upper Upper bound values
 * @property level Confidence level (e.g., 0.95)
 */
@Serializable
data class ConfidenceInterval(
    val lower: List<Double>,
    val upper: List<Double>,
    val level: Double
)

/**
 * Forecast accuracy metrics.
 *
 * @property mae Mean Absolute Error
 * @property rmse Root Mean Squared Error
 * @property mape Mean Absolute Percentage Error
 * @property mase Mean Absolute Scaled Error
 */
@Serializable
data class ForecastMetrics(
    val mae: Double,
    val rmse: Double,
    val mape: Double,
    val mase: Double? = null
)

/**
 * Request for time series decomposition.
 *
 * @property dataset Dataset identifier
 * @property column Column to decompose
 * @property dateColumn Column containing timestamps
 * @property model Decomposition model (additive or multiplicative)
 * @property period Seasonal period
 */
@Serializable
data class DecomposeRequest(
    val dataset: String,
    val column: String,
    val dateColumn: String = "date",
    val model: DecompositionModel = DecompositionModel.ADDITIVE,
    val period: Int = 7
)

/**
 * Decomposition models.
 */
@Serializable
enum class DecompositionModel {
    ADDITIVE,
    MULTIPLICATIVE
}

/**
 * Response with decomposition results.
 *
 * @property trend Trend component
 * @property seasonal Seasonal component
 * @property residual Residual component
 * @property originalSeries Original time series
 * @property period Seasonal period used
 */
@Serializable
data class DecomposeResponse(
    val trend: List<Double?>,
    val seasonal: List<Double>,
    val residual: List<Double?>,
    val originalSeries: List<Double>,
    val period: Int
)

/**
 * Request for anomaly detection.
 *
 * @property dataset Dataset identifier
 * @property column Column to check for anomalies
 * @property dateColumn Column containing timestamps
 * @property method Anomaly detection method
 * @property threshold Anomaly threshold (method-specific)
 * @property window Window size for rolling statistics
 */
@Serializable
data class AnomalyDetectionRequest(
    val dataset: String,
    val column: String,
    val dateColumn: String = "date",
    val method: AnomalyMethod = AnomalyMethod.ZSCORE,
    val threshold: Double = 3.0,
    val window: Int? = null
)

/**
 * Anomaly detection methods.
 */
@Serializable
enum class AnomalyMethod {
    ZSCORE,
    IQR,
    ISOLATION_FOREST,
    LOF,
    DBSCAN
}

/**
 * Response with detected anomalies.
 *
 * @property anomalies List of detected anomalies
 * @property totalAnomalies Total number of anomalies
 * @property anomalyRate Percentage of anomalies
 * @property method Method used for detection
 */
@Serializable
data class AnomalyDetectionResponse(
    val anomalies: List<Anomaly>,
    val totalAnomalies: Int,
    val anomalyRate: Double,
    val method: AnomalyMethod
)

/**
 * Represents a detected anomaly.
 *
 * @property timestamp Timestamp of anomaly
 * @property value Actual value
 * @property score Anomaly score (method-specific)
 * @property expected Expected value (if applicable)
 * @property deviation Deviation from expected
 */
@Serializable
data class Anomaly(
    val timestamp: String,
    val value: Double,
    val score: Double,
    val expected: Double? = null,
    val deviation: Double? = null
)

// ========================================
// Visualization Models
// ========================================

/**
 * Request for chart generation.
 *
 * @property dataset Dataset identifier
 * @property chartType Type of chart to generate
 * @property x X-axis column
 * @property y Y-axis column(s)
 * @property groupBy Column to group by (for multi-series)
 * @property title Chart title
 * @property xLabel X-axis label
 * @property yLabel Y-axis label
 * @property format Output format (png, svg, html)
 * @property width Chart width in pixels
 * @property height Chart height in pixels
 */
@Serializable
data class ChartRequest(
    val dataset: String,
    val chartType: ChartType,
    val x: String,
    val y: String,
    val groupBy: String? = null,
    val title: String? = null,
    val xLabel: String? = null,
    val yLabel: String? = null,
    val format: ChartFormat = ChartFormat.PNG,
    val width: Int = 800,
    val height: Int = 600
)

/**
 * Chart types.
 */
@Serializable
enum class ChartType {
    LINE,
    BAR,
    SCATTER,
    AREA,
    BOX,
    VIOLIN,
    HISTOGRAM
}

/**
 * Chart output formats.
 */
@Serializable
enum class ChartFormat {
    PNG,
    SVG,
    HTML,
    JSON
}

/**
 * Response with generated chart.
 *
 * @property chartUrl URL or path to generated chart
 * @property chartType Type of chart generated
 * @property width Chart width
 * @property height Chart height
 * @property format Output format
 * @property data Chart data (for JSON format)
 */
@Serializable
data class ChartResponse(
    val chartUrl: String,
    val chartType: ChartType,
    val width: Int,
    val height: Int,
    val format: ChartFormat,
    val data: String? = null
)

/**
 * Request for heatmap generation.
 *
 * @property dataset Dataset identifier
 * @property columns Columns to include
 * @property title Heatmap title
 * @property colormap Color scheme (e.g., coolwarm, viridis)
 * @property annotate Show values in cells
 * @property format Output format
 */
@Serializable
data class HeatmapRequest(
    val dataset: String,
    val columns: List<String>? = null,
    val title: String? = null,
    val colormap: String = "coolwarm",
    val annotate: Boolean = true,
    val format: ChartFormat = ChartFormat.PNG
)

/**
 * Request for distribution visualization.
 *
 * @property dataset Dataset identifier
 * @property column Column to visualize
 * @property chartType Distribution chart type
 * @property bins Number of bins for histogram
 * @property kde Show kernel density estimate
 * @property format Output format
 */
@Serializable
data class DistributionRequest(
    val dataset: String,
    val column: String,
    val chartType: DistributionChart = DistributionChart.HISTOGRAM,
    val bins: Int = 30,
    val kde: Boolean = true,
    val format: ChartFormat = ChartFormat.PNG
)

/**
 * Distribution chart types.
 */
@Serializable
enum class DistributionChart {
    HISTOGRAM,
    BOX,
    VIOLIN,
    KDE
}

// ========================================
// Streaming Models
// ========================================

/**
 * WebSocket subscription request.
 *
 * @property action Subscription action (subscribe, unsubscribe)
 * @property dataset Dataset to stream
 * @property metrics Metrics to include
 * @property windowSize Rolling window size for statistics
 * @property updateInterval Update interval in milliseconds
 */
@Serializable
data class StreamSubscription(
    val action: StreamAction,
    val dataset: String,
    val metrics: List<String>,
    val windowSize: Int = 100,
    val updateInterval: Long = 1000
)

/**
 * Stream actions.
 */
@Serializable
enum class StreamAction {
    SUBSCRIBE,
    UNSUBSCRIBE,
    PAUSE,
    RESUME
}

/**
 * Analytics update message.
 *
 * @property type Message type
 * @property timestamp Update timestamp
 * @property metrics Updated metrics
 */
@Serializable
data class AnalyticsUpdate(
    val type: String,
    val timestamp: Instant,
    val metrics: Map<String, MetricValue>
)

/**
 * Single metric value with statistics.
 *
 * @property current Current value
 * @property mean Rolling mean
 * @property std Rolling standard deviation
 * @property min Rolling minimum
 * @property max Rolling maximum
 * @property trend Trend direction
 */
@Serializable
data class MetricValue(
    val current: Double,
    val mean: Double,
    val std: Double,
    val min: Double,
    val max: Double,
    val trend: TrendDirection
)

/**
 * Analytics event for streaming.
 *
 * @property timestamp Event timestamp
 * @property metric Metric name
 * @property value Metric value
 * @property metadata Additional metadata
 */
@Serializable
data class AnalyticsEvent(
    val timestamp: Instant,
    val metric: String,
    val value: Double,
    val metadata: Map<String, String> = emptyMap()
)

// ========================================
// Error Models
// ========================================

/**
 * Error response.
 *
 * @property error Error message
 * @property errorType Error type/category
 * @property timestamp Error timestamp
 * @property path Request path that caused error
 * @property details Additional error details
 */
@Serializable
data class ErrorResponse(
    val error: String,
    val errorType: String,
    val timestamp: Instant,
    val path: String,
    val details: Map<String, String>? = null
)
