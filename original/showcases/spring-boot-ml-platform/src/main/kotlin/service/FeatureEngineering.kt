package com.example.mlplatform.service

import com.example.mlplatform.types.*
import elide.runtime.gvm.annotations.Polyglot
import mu.KotlinLogging
import org.springframework.stereotype.Service
import java.time.Instant
import javax.annotation.PostConstruct

private val logger = KotlinLogging.logger {}

/**
 * Feature Engineering Service - Powered by pandas in Kotlin!
 *
 * This service demonstrates advanced feature engineering using pandas
 * directly in Kotlin via Elide's polyglot runtime. No need for separate
 * Python microservices - all data transformations happen in-process!
 *
 * Features:
 * - Temporal feature extraction
 * - Statistical aggregations
 * - Categorical encoding
 * - Numerical transformations
 * - Feature scaling/normalization
 * - Rolling window calculations
 * - Interaction features
 */
@Service
class FeatureEngineering {

    // Python imports - available via Elide polyglot
    @Polyglot
    private val pandas = importPython("pandas")

    @Polyglot
    private val numpy = importPython("numpy")

    @Polyglot
    private val sklearn_preprocessing = importPython("sklearn.preprocessing")

    @Polyglot
    private val sklearn_feature_selection = importPython("sklearn.feature_selection")

    @PostConstruct
    fun initialize() {
        logger.info { "Initializing FeatureEngineering service" }
        logger.info { "  - pandas version: ${pandas.__version__}" }
        logger.info { "  - numpy version: ${numpy.__version__}" }
    }

    /**
     * Main feature engineering pipeline
     */
    @Polyglot
    fun engineerFeatures(rawData: DataFrame): DataFrame {
        logger.debug { "Engineering features for ${rawData.rows} rows" }

        var df = pandas.DataFrame(rawData.toMap())

        // Apply all feature engineering steps
        df = addTemporalFeatures(df)
        df = addStatisticalFeatures(df)
        df = encodeCategoricalFeatures(df)
        df = addNumericalTransformations(df)
        df = addInteractionFeatures(df)
        df = addRollingWindowFeatures(df)
        df = removeCorrelatedFeatures(df)

        logger.debug { "Feature engineering complete: ${df.shape[1]} features" }

        return df.toDataFrame()
    }

    /**
     * Transform features for a single prediction
     */
    @Polyglot
    fun transformFeatures(features: Map<String, Any>): Map<String, Any> {
        val df = pandas.DataFrame(listOf(features))

        // Apply same transformations as training
        var transformed = df
        transformed = addTemporalFeatures(transformed)
        transformed = addNumericalTransformations(transformed)
        transformed = encodeCategoricalFeatures(transformed)

        // Convert back to map
        return transformed.iloc[0].to_dict() as Map<String, Any>
    }

    /**
     * Extract temporal features from timestamp columns
     */
    @Polyglot
    private fun addTemporalFeatures(df: dynamic): dynamic {
        logger.debug { "Adding temporal features" }

        // Detect timestamp columns
        val timestampCols = detectTimestampColumns(df)

        timestampCols.forEach { col ->
            val dt = pandas.to_datetime(df[col])

            // Extract time components
            df["${col}_year"] = dt.dt.year
            df["${col}_month"] = dt.dt.month
            df["${col}_day"] = dt.dt.day
            df["${col}_hour"] = dt.dt.hour
            df["${col}_minute"] = dt.dt.minute
            df["${col}_dayofweek"] = dt.dt.dayofweek
            df["${col}_dayofyear"] = dt.dt.dayofyear
            df["${col}_weekofyear"] = dt.dt.isocalendar().week
            df["${col}_quarter"] = dt.dt.quarter

            // Boolean features
            df["${col}_is_weekend"] = dt.dt.dayofweek.isin(listOf(5, 6))
            df["${col}_is_month_start"] = dt.dt.is_month_start
            df["${col}_is_month_end"] = dt.dt.is_month_end
            df["${col}_is_quarter_start"] = dt.dt.is_quarter_start
            df["${col}_is_quarter_end"] = dt.dt.is_quarter_end

            // Cyclical encoding for time features
            df["${col}_hour_sin"] = numpy.sin(2 * numpy.pi * dt.dt.hour / 24)
            df["${col}_hour_cos"] = numpy.cos(2 * numpy.pi * dt.dt.hour / 24)
            df["${col}_month_sin"] = numpy.sin(2 * numpy.pi * dt.dt.month / 12)
            df["${col}_month_cos"] = numpy.cos(2 * numpy.pi * dt.dt.month / 12)
            df["${col}_dayofweek_sin"] = numpy.sin(2 * numpy.pi * dt.dt.dayofweek / 7)
            df["${col}_dayofweek_cos"] = numpy.cos(2 * numpy.pi * dt.dt.dayofweek / 7)
        }

        return df
    }

    /**
     * Add statistical features (aggregations, distributions)
     */
    @Polyglot
    private fun addStatisticalFeatures(df: dynamic): dynamic {
        logger.debug { "Adding statistical features" }

        val numericalCols = df.select_dtypes(include = listOf("number")).columns.tolist() as List<String>

        numericalCols.forEach { col ->
            if (col != "target") {
                val values = df[col]

                // Basic statistics
                df["${col}_log"] = numpy.log1p(values)
                df["${col}_sqrt"] = numpy.sqrt(numpy.abs(values))
                df["${col}_squared"] = values.pow(2)
                df["${col}_cubed"] = values.pow(3)

                // Binning
                df["${col}_binned"] = pandas.cut(values, bins = 10, labels = false)

                // Z-score
                val mean = values.mean()
                val std = values.std()
                df["${col}_zscore"] = (values - mean) / std

                // Percentile rank
                df["${col}_percentile"] = values.rank(pct = true)
            }
        }

        return df
    }

    /**
     * Encode categorical features
     */
    @Polyglot
    private fun encodeCategoricalFeatures(df: dynamic): dynamic {
        logger.debug { "Encoding categorical features" }

        val categoricalCols = df.select_dtypes(include = listOf("object", "category"))
            .columns.tolist() as List<String>

        categoricalCols.forEach { col ->
            // Label encoding for ordinal features
            val labelEncoder = sklearn_preprocessing.LabelEncoder()
            df["${col}_encoded"] = labelEncoder.fit_transform(df[col])

            // Frequency encoding
            val freqMap = df[col].value_counts(normalize = true).to_dict()
            df["${col}_frequency"] = df[col].map(freqMap)

            // One-hot encoding for low cardinality features
            val uniqueValues = df[col].nunique() as Int
            if (uniqueValues <= 10) {
                val dummies = pandas.get_dummies(df[col], prefix = col)
                df = pandas.concat(listOf(df, dummies), axis = 1)
            }
        }

        return df
    }

    /**
     * Add numerical transformations
     */
    @Polyglot
    private fun addNumericalTransformations(df: dynamic): dynamic {
        logger.debug { "Adding numerical transformations" }

        val numericalCols = df.select_dtypes(include = listOf("number")).columns.tolist() as List<String>

        // Box-Cox transformation for normality
        numericalCols.forEach { col ->
            if (col != "target") {
                try {
                    val values = df[col]
                    if ((values.min() as Double) > 0) {
                        val scipy_stats = importPython("scipy.stats")
                        val transformed = scipy_stats.boxcox(values)[0]
                        df["${col}_boxcox"] = transformed
                    }
                } catch (e: Exception) {
                    logger.debug { "Box-Cox transformation skipped for $col" }
                }
            }
        }

        // Yeo-Johnson transformation (handles negative values)
        val powerTransformer = sklearn_preprocessing.PowerTransformer(method = "yeo-johnson")
        val numericalData = df[numericalCols.filter { it != "target" }]
        val transformed = powerTransformer.fit_transform(numericalData)

        numericalCols.filter { it != "target" }.forEachIndexed { index, col ->
            df["${col}_yeojohnson"] = transformed["[:,${index}]"]
        }

        return df
    }

    /**
     * Add interaction features
     */
    @Polyglot
    private fun addInteractionFeatures(df: dynamic): dynamic {
        logger.debug { "Adding interaction features" }

        val numericalCols = df.select_dtypes(include = listOf("number"))
            .columns.tolist() as List<String>
            .filter { it != "target" }
            .take(10) // Limit to prevent feature explosion

        // Pairwise interactions
        for (i in 0 until numericalCols.size) {
            for (j in (i + 1) until numericalCols.size) {
                val col1 = numericalCols[i]
                val col2 = numericalCols[j]

                // Multiplication
                df["${col1}_x_${col2}"] = df[col1] * df[col2]

                // Division (avoid division by zero)
                df["${col1}_div_${col2}"] = df[col1] / (df[col2] + 1e-5)

                // Addition
                df["${col1}_plus_${col2}"] = df[col1] + df[col2]

                // Subtraction
                df["${col1}_minus_${col2}"] = df[col1] - df[col2]
            }
        }

        // Polynomial features
        val polyFeatures = sklearn_preprocessing.PolynomialFeatures(
            degree = 2,
            include_bias = false,
            interaction_only = true
        )

        val numericalData = df[numericalCols.take(5)]
        val polyTransformed = polyFeatures.fit_transform(numericalData)

        // Add polynomial features
        val polyNames = polyFeatures.get_feature_names_out(numericalCols.take(5))
        polyNames.forEachIndexed { index, name ->
            df["poly_$name"] = polyTransformed["[:,${index}]"]
        }

        return df
    }

    /**
     * Add rolling window features
     */
    @Polyglot
    private fun addRollingWindowFeatures(df: dynamic): dynamic {
        logger.debug { "Adding rolling window features" }

        // Check if we have a time-based index or sort column
        val sortColumn = detectSortColumn(df)

        if (sortColumn != null) {
            // Sort by time column
            df = df.sort_values(by = sortColumn)

            val numericalCols = df.select_dtypes(include = listOf("number"))
                .columns.tolist() as List<String>
                .filter { it != "target" }

            // Rolling window sizes
            val windows = listOf(3, 7, 14, 30)

            numericalCols.take(10).forEach { col ->
                windows.forEach { window ->
                    // Rolling mean
                    df["${col}_rolling_mean_${window}"] = df[col].rolling(window = window).mean()

                    // Rolling std
                    df["${col}_rolling_std_${window}"] = df[col].rolling(window = window).std()

                    // Rolling min/max
                    df["${col}_rolling_min_${window}"] = df[col].rolling(window = window).min()
                    df["${col}_rolling_max_${window}"] = df[col].rolling(window = window).max()

                    // Rolling median
                    df["${col}_rolling_median_${window}"] = df[col].rolling(window = window).median()

                    // Rolling sum
                    df["${col}_rolling_sum_${window}"] = df[col].rolling(window = window).sum()
                }

                // Exponential weighted moving average
                df["${col}_ewm_mean"] = df[col].ewm(span = 7).mean()
                df["${col}_ewm_std"] = df[col].ewm(span = 7).std()

                // Lag features
                listOf(1, 7, 14, 30).forEach { lag ->
                    df["${col}_lag_${lag}"] = df[col].shift(lag)
                }

                // Diff features
                listOf(1, 7).forEach { period ->
                    df["${col}_diff_${period}"] = df[col].diff(period)
                }
            }

            // Fill NaN values created by rolling/lag operations
            df = df.fillna(method = "bfill").fillna(0)
        }

        return df
    }

    /**
     * Remove highly correlated features
     */
    @Polyglot
    private fun removeCorrelatedFeatures(df: dynamic, threshold: Double = 0.95): dynamic {
        logger.debug { "Removing correlated features (threshold: $threshold)" }

        val numericalCols = df.select_dtypes(include = listOf("number"))
            .columns.tolist() as List<String>
            .filter { it != "target" }

        if (numericalCols.isEmpty()) {
            return df
        }

        // Calculate correlation matrix
        val corrMatrix = df[numericalCols].corr().abs()

        // Find highly correlated pairs
        val toRemove = mutableSetOf<String>()

        for (i in 0 until numericalCols.size) {
            for (j in (i + 1) until numericalCols.size) {
                val col1 = numericalCols[i]
                val col2 = numericalCols[j]
                val correlation = corrMatrix.loc[col1, col2] as Double

                if (correlation > threshold && !toRemove.contains(col1)) {
                    toRemove.add(col2)
                }
            }
        }

        if (toRemove.isNotEmpty()) {
            logger.debug { "Removing ${toRemove.size} correlated features" }
            df = df.drop(columns = toRemove.toList())
        }

        return df
    }

    /**
     * Normalize/scale features
     */
    @Polyglot
    fun normalizeFeatures(df: DataFrame, method: NormalizationMethod): DataFrame {
        logger.debug { "Normalizing features with method: $method" }

        val pdDf = pandas.DataFrame(df.toMap())

        val scaler = when (method) {
            NormalizationMethod.STANDARD -> sklearn_preprocessing.StandardScaler()
            NormalizationMethod.MINMAX -> sklearn_preprocessing.MinMaxScaler()
            NormalizationMethod.ROBUST -> sklearn_preprocessing.RobustScaler()
            NormalizationMethod.MAXABS -> sklearn_preprocessing.MaxAbsScaler()
        }

        val numericalCols = pdDf.select_dtypes(include = listOf("number"))
            .columns.tolist() as List<String>
            .filter { it != "target" }

        if (numericalCols.isNotEmpty()) {
            pdDf[numericalCols] = scaler.fit_transform(pdDf[numericalCols])
        }

        return pdDf.toDataFrame()
    }

    /**
     * Select top K features using statistical tests
     */
    @Polyglot
    fun selectTopFeatures(df: DataFrame, k: Int = 50): DataFrame {
        logger.debug { "Selecting top $k features" }

        val pdDf = pandas.DataFrame(df.toMap())

        val X = pdDf.drop(columns = listOf("target"))
        val y = pdDf["target"]

        // Use SelectKBest with f_classif
        val selector = sklearn_feature_selection.SelectKBest(
            score_func = sklearn_feature_selection.f_classif,
            k = k
        )

        val XNew = selector.fit_transform(X, y)

        // Get selected feature names
        val selectedFeatures = selector.get_support(indices = true)
            .map { (X.columns as List<String>)[it as Int] }

        logger.debug { "Selected features: ${selectedFeatures.joinToString(", ")}" }

        // Create new DataFrame with selected features
        val result = pandas.DataFrame(XNew, columns = selectedFeatures)
        result["target"] = y.values

        return result.toDataFrame()
    }

    /**
     * Handle missing values
     */
    @Polyglot
    fun handleMissingValues(df: DataFrame, strategy: ImputationStrategy): DataFrame {
        logger.debug { "Handling missing values with strategy: $strategy" }

        val pdDf = pandas.DataFrame(df.toMap())

        when (strategy) {
            ImputationStrategy.MEAN -> {
                val numericalCols = pdDf.select_dtypes(include = listOf("number"))
                    .columns.tolist() as List<String>
                numericalCols.forEach { col ->
                    pdDf[col] = pdDf[col].fillna(pdDf[col].mean())
                }
            }
            ImputationStrategy.MEDIAN -> {
                val numericalCols = pdDf.select_dtypes(include = listOf("number"))
                    .columns.tolist() as List<String>
                numericalCols.forEach { col ->
                    pdDf[col] = pdDf[col].fillna(pdDf[col].median())
                }
            }
            ImputationStrategy.MODE -> {
                pdDf.columns.forEach { col ->
                    pdDf[col] = pdDf[col].fillna(pdDf[col].mode()[0])
                }
            }
            ImputationStrategy.FORWARD_FILL -> {
                pdDf = pdDf.fillna(method = "ffill")
            }
            ImputationStrategy.BACKWARD_FILL -> {
                pdDf = pdDf.fillna(method = "bfill")
            }
            ImputationStrategy.INTERPOLATE -> {
                val numericalCols = pdDf.select_dtypes(include = listOf("number"))
                    .columns.tolist() as List<String>
                numericalCols.forEach { col ->
                    pdDf[col] = pdDf[col].interpolate()
                }
            }
        }

        // Fill any remaining NaNs with 0
        pdDf = pdDf.fillna(0)

        return pdDf.toDataFrame()
    }

    /**
     * Detect outliers using IQR method
     */
    @Polyglot
    fun detectOutliers(df: DataFrame, threshold: Double = 1.5): Map<String, List<Int>> {
        logger.debug { "Detecting outliers with IQR threshold: $threshold" }

        val pdDf = pandas.DataFrame(df.toMap())
        val outliers = mutableMapOf<String, List<Int>>()

        val numericalCols = pdDf.select_dtypes(include = listOf("number"))
            .columns.tolist() as List<String>

        numericalCols.forEach { col ->
            val Q1 = pdDf[col].quantile(0.25) as Double
            val Q3 = pdDf[col].quantile(0.75) as Double
            val IQR = Q3 - Q1

            val lowerBound = Q1 - threshold * IQR
            val upperBound = Q3 + threshold * IQR

            val outlierIndices = pdDf[
                (pdDf[col] < lowerBound) or (pdDf[col] > upperBound)
            ].index.tolist() as List<Int>

            if (outlierIndices.isNotEmpty()) {
                outliers[col] = outlierIndices
                logger.debug { "Found ${outlierIndices.size} outliers in $col" }
            }
        }

        return outliers
    }

    /**
     * Create aggregation features by group
     */
    @Polyglot
    fun createGroupAggregations(
        df: DataFrame,
        groupByColumns: List<String>,
        aggColumns: List<String>
    ): DataFrame {
        logger.debug { "Creating group aggregations: groupBy=$groupByColumns, agg=$aggColumns" }

        val pdDf = pandas.DataFrame(df.toMap())

        // Aggregation functions
        val aggFunctions = listOf("mean", "median", "std", "min", "max", "sum", "count")

        val grouped = pdDf.groupBy(groupByColumns)

        aggColumns.forEach { col ->
            aggFunctions.forEach { func ->
                val aggName = "${col}_${groupByColumns.joinToString("_")}_${func}"
                pdDf[aggName] = grouped[col].transform(func)
            }
        }

        return pdDf.toDataFrame()
    }

    // Helper methods

    @Polyglot
    private fun detectTimestampColumns(df: dynamic): List<String> {
        val columns = df.columns.tolist() as List<String>
        return columns.filter { col ->
            col.contains("time", ignoreCase = true) ||
                    col.contains("date", ignoreCase = true) ||
                    col.contains("timestamp", ignoreCase = true)
        }
    }

    @Polyglot
    private fun detectSortColumn(df: dynamic): String? {
        val columns = df.columns.tolist() as List<String>
        return columns.firstOrNull { col ->
            col.contains("time", ignoreCase = true) ||
                    col.contains("date", ignoreCase = true) ||
                    col == "index" ||
                    col == "id"
        }
    }

    @Polyglot
    private fun importPython(module: String): dynamic {
        return js("require('python:$module')")
    }
}

/**
 * Normalization methods
 */
enum class NormalizationMethod {
    STANDARD,  // Zero mean, unit variance
    MINMAX,    // Scale to [0, 1]
    ROBUST,    // Use median and IQR (robust to outliers)
    MAXABS     // Scale to [-1, 1]
}

/**
 * Imputation strategies for missing values
 */
enum class ImputationStrategy {
    MEAN,
    MEDIAN,
    MODE,
    FORWARD_FILL,
    BACKWARD_FILL,
    INTERPOLATE
}
