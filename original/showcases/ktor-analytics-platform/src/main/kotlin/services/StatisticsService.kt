package dev.elide.showcases.ktor.analytics.services

import dev.elide.showcases.ktor.analytics.PythonExecutionException
import dev.elide.showcases.ktor.analytics.ValidationException
import dev.elide.showcases.ktor.analytics.models.*
import io.github.oshai.kotlinlogging.KotlinLogging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock
import java.util.concurrent.atomic.AtomicLong

private val logger = KotlinLogging.logger {}

/**
 * Service for statistical analysis using Python pandas, numpy, and scipy.
 *
 * Provides comprehensive statistical functions:
 * - Descriptive statistics (mean, std, percentiles)
 * - Correlation analysis (pearson, spearman, kendall)
 * - Hypothesis testing (t-tests, ANOVA, chi-square)
 * - Distribution analysis (normality, skewness, kurtosis)
 * - Regression analysis (linear, ridge, lasso, random forest)
 * - Outlier detection (IQR, Z-score, isolation forest)
 *
 * Python integration:
 * - pandas for data frame operations
 * - numpy for numerical computations
 * - scipy for statistical tests
 * - scikit-learn for machine learning models
 * - statsmodels for advanced statistics
 *
 * Example usage:
 * ```kotlin
 * val statsService = StatisticsService()
 * val stats = statsService.describeDataset(dataService, "sales", listOf("revenue"))
 * val corr = statsService.correlationMatrix(dataService, "sales", listOf("revenue", "cost"))
 * ```
 */
class StatisticsService {
    // @ts-ignore
    @JsModule("python:pandas")
    @JsNonModule
    external object pandas {
        fun DataFrame(data: dynamic): dynamic
        fun concat(dfs: List<dynamic>, ignore_index: Boolean = definedExternally): dynamic
    }

    // @ts-ignore
    @JsModule("python:numpy")
    @JsNonModule
    external object numpy {
        fun array(data: dynamic): dynamic
        fun mean(arr: dynamic): Double
        fun std(arr: dynamic): Double
        fun median(arr: dynamic): Double
        fun min(arr: dynamic): Double
        fun max(arr: dynamic): Double
        fun percentile(arr: dynamic, q: dynamic): dynamic
        fun var(arr: dynamic): Double
        fun corrcoef(x: dynamic, y: dynamic): dynamic
    }

    // @ts-ignore
    @JsModule("python:scipy.stats")
    @JsNonModule
    external object scipy_stats {
        fun pearsonr(x: dynamic, y: dynamic): dynamic
        fun spearmanr(x: dynamic, y: dynamic): dynamic
        fun kendalltau(x: dynamic, y: dynamic): dynamic
        fun ttest_ind(x: dynamic, y: dynamic): dynamic
        fun chi2_contingency(observed: dynamic): dynamic
        fun normaltest(x: dynamic): dynamic
        fun skew(x: dynamic): Double
        fun kurtosis(x: dynamic): Double
        fun zscore(x: dynamic): dynamic
    }

    // @ts-ignore
    @JsModule("python:sklearn.linear_model")
    @JsNonModule
    external object sklearn_linear_model {
        fun LinearRegression(): dynamic
        fun Ridge(alpha: Double = definedExternally): dynamic
        fun Lasso(alpha: Double = definedExternally): dynamic
        fun ElasticNet(alpha: Double = definedExternally, l1_ratio: Double = definedExternally): dynamic
    }

    // @ts-ignore
    @JsModule("python:sklearn.ensemble")
    @JsNonModule
    external object sklearn_ensemble {
        fun RandomForestRegressor(n_estimators: Int = definedExternally): dynamic
        fun GradientBoostingRegressor(n_estimators: Int = definedExternally): dynamic
        fun IsolationForest(contamination: Double = definedExternally): dynamic
    }

    // @ts-ignore
    @JsModule("python:sklearn.model_selection")
    @JsNonModule
    external object sklearn_model_selection {
        fun train_test_split(
            X: dynamic,
            y: dynamic,
            test_size: Double = definedExternally,
            random_state: Int? = definedExternally
        ): dynamic
    }

    // @ts-ignore
    @JsModule("python:sklearn.metrics")
    @JsNonModule
    external object sklearn_metrics {
        fun r2_score(y_true: dynamic, y_pred: dynamic): Double
        fun mean_squared_error(y_true: dynamic, y_pred: dynamic): Double
        fun mean_absolute_error(y_true: dynamic, y_pred: dynamic): Double
    }

    // @ts-ignore
    @JsModule("python:sklearn.preprocessing")
    @JsNonModule
    external object sklearn_preprocessing {
        fun PolynomialFeatures(degree: Int = definedExternally): dynamic
    }

    /**
     * Request counter for metrics.
     */
    private val requestCounter = AtomicLong(0)

    /**
     * Error counter for metrics.
     */
    private val errorCounter = AtomicLong(0)

    /**
     * Get descriptive statistics for dataset.
     *
     * Computes:
     * - Count of non-null values
     * - Mean, standard deviation
     * - Min, max values
     * - Percentiles (25th, 50th, 75th by default)
     * - Variance, skewness, kurtosis (if requested)
     *
     * @param dataService Data service instance
     * @param request Describe request parameters
     * @return Descriptive statistics response
     */
    suspend fun describeDataset(
        dataService: DataService,
        request: DescribeRequest
    ): DescribeResponse = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()
        logger.info { "Computing descriptive statistics for dataset: ${request.dataset}" }

        try {
            val df = dataService.getDataFrame(request.dataset)

            // Select specific columns or all numeric columns
            val columns = request.columns ?: run {
                val allColumns = df.columns.tolist() as List<String>
                allColumns.filter { col ->
                    val dtype = df[col].dtype.toString()
                    dtype.contains("int") || dtype.contains("float")
                }
            }

            if (columns.isEmpty()) {
                throw ValidationException("No numeric columns found in dataset")
            }

            val statistics = mutableMapOf<String, StatisticsResult>()

            for (column in columns) {
                val series = df[column]

                // Basic statistics
                val count = series.count() as Long
                val mean = series.mean() as Double
                val std = series.std() as Double
                val min = series.min() as Double
                val max = series.max() as Double

                // Percentiles
                val percentiles = mutableMapOf<Int, Double>()
                if (request.includePercentiles) {
                    for (p in request.percentiles) {
                        val value = series.quantile(p / 100.0) as Double
                        percentiles[p] = value
                    }
                }

                // Additional statistics
                val median = series.median() as Double
                val mode = try {
                    series.mode()[0] as Double
                } catch (e: Exception) {
                    null
                }
                val variance = series.var() as Double
                val skewness = scipy_stats.skew(series.dropna().values)
                val kurtosis = scipy_stats.kurtosis(series.dropna().values)

                statistics[column] = StatisticsResult(
                    count = count,
                    mean = mean,
                    std = std,
                    min = min,
                    max = max,
                    percentiles = percentiles,
                    median = median,
                    mode = mode,
                    variance = variance,
                    skewness = skewness,
                    kurtosis = kurtosis
                )
            }

            val rows = df.shape[0] as Long

            DescribeResponse(
                dataset = request.dataset,
                rows = rows,
                columns = columns.size,
                statistics = statistics,
                computedAt = Clock.System.now()
            )

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            logger.error(e) { "Failed to compute statistics" }
            throw PythonExecutionException("Statistics computation failed: ${e.message}", e)
        }
    }

    /**
     * Compute correlation matrix for dataset columns.
     *
     * Supports three correlation methods:
     * - Pearson: Linear correlation
     * - Spearman: Rank-based correlation
     * - Kendall: Tau correlation
     *
     * @param dataService Data service instance
     * @param request Correlation request parameters
     * @return Correlation matrix response
     */
    suspend fun correlationMatrix(
        dataService: DataService,
        request: CorrelationRequest
    ): CorrelationResponse = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()
        logger.info { "Computing correlation matrix for dataset: ${request.dataset}" }

        try {
            val df = dataService.getDataFrame(request.dataset)

            // Select columns
            val columns = request.columns ?: run {
                val allColumns = df.columns.tolist() as List<String>
                allColumns.filter { col ->
                    val dtype = df[col].dtype.toString()
                    dtype.contains("int") || dtype.contains("float")
                }
            }

            if (columns.size < 2) {
                throw ValidationException("At least 2 columns required for correlation")
            }

            val selectedDf = df[columns]

            // Compute correlation matrix
            val methodStr = when (request.method) {
                CorrelationMethod.PEARSON -> "pearson"
                CorrelationMethod.SPEARMAN -> "spearman"
                CorrelationMethod.KENDALL -> "kendall"
            }

            val corrMatrix = selectedDf.corr(method = methodStr)

            // Convert to 2D list
            val matrixValues = corrMatrix.values.tolist() as List<List<Double>>

            // Find significant correlations
            val significantPairs = mutableListOf<CorrelationPair>()
            for (i in columns.indices) {
                for (j in (i + 1) until columns.size) {
                    val correlation = matrixValues[i][j]
                    if (kotlin.math.abs(correlation) > 0.7) { // Threshold for significance
                        // Compute p-value
                        val pValue = try {
                            val x = df[columns[i]].dropna()
                            val y = df[columns[j]].dropna()
                            val result = when (request.method) {
                                CorrelationMethod.PEARSON -> scipy_stats.pearsonr(x, y)
                                CorrelationMethod.SPEARMAN -> scipy_stats.spearmanr(x, y)
                                CorrelationMethod.KENDALL -> scipy_stats.kendalltau(x, y)
                            }
                            result[1] as Double
                        } catch (e: Exception) {
                            null
                        }

                        significantPairs.add(
                            CorrelationPair(
                                column1 = columns[i],
                                column2 = columns[j],
                                correlation = correlation,
                                pValue = pValue
                            )
                        )
                    }
                }
            }

            CorrelationResponse(
                correlationMatrix = matrixValues,
                columns = columns,
                method = request.method,
                significantPairs = significantPairs
            )

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            logger.error(e) { "Failed to compute correlation matrix" }
            throw PythonExecutionException("Correlation computation failed: ${e.message}", e)
        }
    }

    /**
     * Perform regression analysis.
     *
     * Supports multiple regression models:
     * - Linear regression
     * - Ridge regression (L2 regularization)
     * - Lasso regression (L1 regularization)
     * - Elastic Net (L1 + L2 regularization)
     * - Polynomial regression
     * - Random Forest regression
     * - Gradient Boosting regression
     *
     * @param dataService Data service instance
     * @param request Regression request parameters
     * @return Regression results
     */
    suspend fun performRegression(
        dataService: DataService,
        request: RegressionRequest
    ): RegressionResponse = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()
        logger.info { "Performing ${request.model} regression on dataset: ${request.dataset}" }

        try {
            val df = dataService.getDataFrame(request.dataset)

            // Prepare features and target
            val X = df[request.features].values
            val y = df[request.target].values

            // Split train/test
            val splitResult = sklearn_model_selection.train_test_split(
                X, y,
                test_size = request.testSize,
                random_state = request.randomState
            )

            val XTrain = splitResult[0]
            val XTest = splitResult[1]
            val yTrain = splitResult[2]
            val yTest = splitResult[3]

            // Create and train model
            val model = when (request.model) {
                RegressionModel.LINEAR -> sklearn_linear_model.LinearRegression()
                RegressionModel.RIDGE -> sklearn_linear_model.Ridge(alpha = 1.0)
                RegressionModel.LASSO -> sklearn_linear_model.Lasso(alpha = 1.0)
                RegressionModel.ELASTIC_NET -> sklearn_linear_model.ElasticNet(alpha = 1.0, l1_ratio = 0.5)
                RegressionModel.POLYNOMIAL -> {
                    // Transform features to polynomial
                    val poly = sklearn_preprocessing.PolynomialFeatures(degree = 2)
                    val XTrainPoly = poly.fit_transform(XTrain)
                    val XTestPoly = poly.transform(XTest)
                    val linearModel = sklearn_linear_model.LinearRegression()
                    linearModel.fit(XTrainPoly, yTrain)
                    // Update test data for predictions
                    return@withContext performPolynomialRegression(
                        linearModel, XTestPoly, yTest, request.features
                    )
                }
                RegressionModel.RANDOM_FOREST -> sklearn_ensemble.RandomForestRegressor(n_estimators = 100)
                RegressionModel.GRADIENT_BOOSTING -> sklearn_ensemble.GradientBoostingRegressor(n_estimators = 100)
            }

            model.fit(XTrain, yTrain)

            // Make predictions
            val yPred = model.predict(XTest)

            // Calculate metrics
            val r2 = sklearn_metrics.r2_score(yTest, yPred)
            val mse = sklearn_metrics.mean_squared_error(yTest, yPred)
            val mae = sklearn_metrics.mean_absolute_error(yTest, yPred)
            val rmse = kotlin.math.sqrt(mse)

            // Extract coefficients (for linear models)
            val coefficients = mutableMapOf<String, Double>()
            val intercept: Double
            val featureImportance: Map<String, Double>?

            when (request.model) {
                RegressionModel.LINEAR, RegressionModel.RIDGE,
                RegressionModel.LASSO, RegressionModel.ELASTIC_NET -> {
                    val coefs = model.coef_ as List<Double>
                    request.features.forEachIndexed { index, feature ->
                        coefficients[feature] = coefs[index]
                    }
                    intercept = model.intercept_ as Double
                    featureImportance = null
                }
                RegressionModel.RANDOM_FOREST, RegressionModel.GRADIENT_BOOSTING -> {
                    intercept = 0.0
                    val importance = model.feature_importances_ as List<Double>
                    featureImportance = request.features.mapIndexed { index, feature ->
                        feature to importance[index]
                    }.toMap()
                }
                else -> {
                    intercept = 0.0
                    featureImportance = null
                }
            }

            // Convert predictions to list
            val predictions = (yPred.tolist() as List<Double>).take(10)

            RegressionResponse(
                modelType = request.model,
                coefficients = coefficients,
                intercept = intercept,
                r2Score = r2,
                mse = mse,
                mae = mae,
                rmse = rmse,
                predictions = predictions,
                featureImportance = featureImportance
            )

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            logger.error(e) { "Failed to perform regression" }
            throw PythonExecutionException("Regression failed: ${e.message}", e)
        }
    }

    /**
     * Helper for polynomial regression.
     */
    private fun performPolynomialRegression(
        model: dynamic,
        XTest: dynamic,
        yTest: dynamic,
        features: List<String>
    ): RegressionResponse {
        val yPred = model.predict(XTest)

        val r2 = sklearn_metrics.r2_score(yTest, yPred)
        val mse = sklearn_metrics.mean_squared_error(yTest, yPred)
        val mae = sklearn_metrics.mean_absolute_error(yTest, yPred)
        val rmse = kotlin.math.sqrt(mse)

        val coefs = model.coef_ as List<Double>
        val coefficients = features.take(coefs.size).mapIndexed { index, feature ->
            feature to coefs[index]
        }.toMap()

        val predictions = (yPred.tolist() as List<Double>).take(10)

        return RegressionResponse(
            modelType = RegressionModel.POLYNOMIAL,
            coefficients = coefficients,
            intercept = model.intercept_ as Double,
            r2Score = r2,
            mse = mse,
            mae = mae,
            rmse = rmse,
            predictions = predictions,
            featureImportance = null
        )
    }

    /**
     * Detect outliers in dataset column.
     *
     * Methods:
     * - Z-Score: Values beyond threshold standard deviations
     * - IQR: Values outside interquartile range
     * - Isolation Forest: ML-based anomaly detection
     *
     * @param dataService Data service instance
     * @param datasetId Dataset identifier
     * @param column Column to check
     * @param method Detection method
     * @param threshold Method-specific threshold
     * @return List of outlier indices
     */
    suspend fun detectOutliers(
        dataService: DataService,
        datasetId: String,
        column: String,
        method: String = "zscore",
        threshold: Double = 3.0
    ): List<Int> = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()
        logger.info { "Detecting outliers in $column using $method" }

        try {
            val df = dataService.getDataFrame(datasetId)
            val series = df[column].dropna()

            val outliers = when (method.lowercase()) {
                "zscore" -> {
                    val zScores = scipy_stats.zscore(series.values)
                    val outlierMask = numpy.abs(zScores) > threshold
                    val indices = numpy.where(outlierMask)[0]
                    indices.tolist() as List<Int>
                }
                "iqr" -> {
                    val q1 = series.quantile(0.25) as Double
                    val q3 = series.quantile(0.75) as Double
                    val iqr = q3 - q1
                    val lowerBound = q1 - threshold * iqr
                    val upperBound = q3 + threshold * iqr

                    val outlierMask = (series < lowerBound) or (series > upperBound)
                    val indices = numpy.where(outlierMask)[0]
                    indices.tolist() as List<Int>
                }
                "isolation_forest" -> {
                    val values = series.values.reshape(-1, 1)
                    val isoForest = sklearn_ensemble.IsolationForest(contamination = threshold / 100.0)
                    val predictions = isoForest.fit_predict(values)
                    val indices = numpy.where(predictions == -1)[0]
                    indices.tolist() as List<Int>
                }
                else -> throw ValidationException("Unsupported outlier detection method: $method")
            }

            logger.info { "Found ${outliers.size} outliers in $column" }
            outliers

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            logger.error(e) { "Failed to detect outliers" }
            throw PythonExecutionException("Outlier detection failed: ${e.message}", e)
        }
    }

    /**
     * Test for normal distribution.
     *
     * Uses D'Agostino and Pearson's test.
     *
     * @param dataService Data service instance
     * @param datasetId Dataset identifier
     * @param column Column to test
     * @return Tuple of (statistic, p-value)
     */
    suspend fun testNormality(
        dataService: DataService,
        datasetId: String,
        column: String
    ): Pair<Double, Double> = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()

        try {
            val df = dataService.getDataFrame(datasetId)
            val series = df[column].dropna()

            val result = scipy_stats.normaltest(series.values)
            val statistic = result[0] as Double
            val pValue = result[1] as Double

            logger.info { "Normality test for $column: statistic=$statistic, p-value=$pValue" }

            statistic to pValue

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            throw PythonExecutionException("Normality test failed: ${e.message}", e)
        }
    }

    /**
     * Perform t-test between two groups.
     *
     * @param dataService Data service instance
     * @param datasetId Dataset identifier
     * @param column1 First group column
     * @param column2 Second group column
     * @return Tuple of (statistic, p-value)
     */
    suspend fun performTTest(
        dataService: DataService,
        datasetId: String,
        column1: String,
        column2: String
    ): Pair<Double, Double> = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()

        try {
            val df = dataService.getDataFrame(datasetId)
            val group1 = df[column1].dropna()
            val group2 = df[column2].dropna()

            val result = scipy_stats.ttest_ind(group1.values, group2.values)
            val statistic = result[0] as Double
            val pValue = result[1] as Double

            logger.info { "T-test between $column1 and $column2: statistic=$statistic, p-value=$pValue" }

            statistic to pValue

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            throw PythonExecutionException("T-test failed: ${e.message}", e)
        }
    }

    /**
     * Calculate confidence interval for mean.
     *
     * @param dataService Data service instance
     * @param datasetId Dataset identifier
     * @param column Column name
     * @param confidence Confidence level (0-1)
     * @return Tuple of (lower, upper) bounds
     */
    suspend fun calculateConfidenceInterval(
        dataService: DataService,
        datasetId: String,
        column: String,
        confidence: Double = 0.95
    ): Pair<Double, Double> = withContext(Dispatchers.Default) {
        requestCounter.incrementAndGet()

        try {
            val df = dataService.getDataFrame(datasetId)
            val series = df[column].dropna()

            val mean = series.mean() as Double
            val sem = series.sem() as Double
            val ci = scipy_stats.t.interval(
                confidence,
                len(series) - 1,
                loc = mean,
                scale = sem
            )

            val lower = ci[0] as Double
            val upper = ci[1] as Double

            logger.info { "Confidence interval for $column: [$lower, $upper]" }

            lower to upper

        } catch (e: Exception) {
            errorCounter.incrementAndGet()
            throw PythonExecutionException("Confidence interval calculation failed: ${e.message}", e)
        }
    }

    /**
     * Get request count for metrics.
     */
    fun getRequestCount(): Long = requestCounter.get()

    /**
     * Get error count for metrics.
     */
    fun getErrorCount(): Long = errorCounter.get()

    /**
     * Check service health.
     */
    fun isHealthy(): Boolean {
        return try {
            // Simple health check
            val testArray = numpy.array(listOf(1, 2, 3, 4, 5))
            val mean = numpy.mean(testArray)
            mean > 0
        } catch (e: Exception) {
            logger.error(e) { "Health check failed" }
            false
        }
    }
}

/**
 * External functions for numpy operations.
 */
@JsName("abs")
external fun abs(x: dynamic): dynamic

@JsName("where")
external fun where(condition: dynamic): dynamic

@JsName("len")
external fun len(obj: dynamic): Int

@JsName("or")
external infix fun dynamic.or(other: dynamic): dynamic
