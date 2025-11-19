package dev.elide.showcases.ktor.analytics.services

import dev.elide.showcases.ktor.analytics.DatasetNotFoundException
import dev.elide.showcases.ktor.analytics.PythonExecutionException
import dev.elide.showcases.ktor.analytics.models.*
import io.github.oshai.kotlinlogging.KotlinLogging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import kotlin.time.Duration.Companion.minutes

private val logger = KotlinLogging.logger {}

/**
 * Service for loading and managing datasets using Python pandas.
 *
 * This service provides:
 * - Dataset loading from various formats (CSV, Parquet, JSON, Excel, SQL)
 * - Dataset caching and management
 * - Column information and metadata extraction
 * - Data sampling and preview
 * - Data quality checks
 *
 * Python integration:
 * - Uses pandas for all data operations
 * - Supports multiple file formats
 * - Efficient memory management
 * - Lazy loading where possible
 *
 * Example usage:
 * ```kotlin
 * val dataService = DataService()
 * val dataset = dataService.loadDataset("sales_data.csv", "sales")
 * val preview = dataService.getDatasetPreview("sales", limit = 10)
 * ```
 */
class DataService {
    // @ts-ignore
    @JsModule("python:pandas")
    @JsNonModule
    external object pandas {
        fun read_csv(filepath: String, nrows: Int? = definedExternally): dynamic
        fun read_parquet(filepath: String): dynamic
        fun read_json(filepath: String): dynamic
        fun read_excel(filepath: String): dynamic
        fun read_sql(sql: String, con: dynamic): dynamic
    }

    // @ts-ignore
    @JsModule("python:numpy")
    @JsNonModule
    external object numpy {
        fun array(data: dynamic): dynamic
        fun mean(arr: dynamic): Double
        fun std(arr: dynamic): Double
        fun min(arr: dynamic): Double
        fun max(arr: dynamic): Double
    }

    /**
     * Cache for loaded datasets.
     * Key: dataset ID, Value: cached data frame and metadata
     */
    private val datasetCache = ConcurrentHashMap<String, CachedDataFrame>()

    /**
     * Dataset metadata registry.
     * Key: dataset ID, Value: dataset metadata
     */
    private val datasetRegistry = ConcurrentHashMap<String, Dataset>()

    /**
     * Default cache TTL (time to live).
     */
    private val cacheTTL = 30.minutes

    /**
     * Load a dataset from file.
     *
     * Supports multiple formats:
     * - CSV: Comma-separated values
     * - Parquet: Apache Parquet columnar format
     * - JSON: JSON records or lines
     * - Excel: Excel spreadsheets
     * - SQL: SQL database queries
     *
     * @param filepath Path to the dataset file
     * @param datasetId Unique identifier for the dataset
     * @param format Dataset format (auto-detected if not specified)
     * @param options Additional loading options
     * @return Dataset metadata
     */
    suspend fun loadDataset(
        filepath: String,
        datasetId: String,
        format: DatasetFormat? = null,
        options: Map<String, Any> = emptyMap()
    ): Dataset = withContext(Dispatchers.IO) {
        logger.info { "Loading dataset: $datasetId from $filepath" }

        try {
            val file = File(filepath)
            if (!file.exists()) {
                throw DatasetNotFoundException("File not found: $filepath")
            }

            val detectedFormat = format ?: detectFormat(filepath)
            val dataFrame = loadDataFrame(filepath, detectedFormat, options)

            // Extract metadata from DataFrame
            val rows = dataFrame.shape[0] as Long
            val columns = extractColumnInfo(dataFrame)
            val size = file.length()

            val dataset = Dataset(
                id = datasetId,
                name = file.nameWithoutExtension,
                path = filepath,
                rows = rows,
                columns = columns,
                createdAt = Clock.System.now(),
                updatedAt = Clock.System.now(),
                format = detectedFormat,
                size = size
            )

            // Cache the DataFrame
            datasetCache[datasetId] = CachedDataFrame(
                dataFrame = dataFrame,
                expiresAt = Clock.System.now() + cacheTTL
            )

            // Register the dataset
            datasetRegistry[datasetId] = dataset

            logger.info { "Dataset loaded: $datasetId ($rows rows, ${columns.size} columns)" }
            dataset

        } catch (e: Exception) {
            logger.error(e) { "Failed to load dataset: $filepath" }
            throw PythonExecutionException("Failed to load dataset: ${e.message}", e)
        }
    }

    /**
     * Load a DataFrame using pandas based on format.
     *
     * @param filepath Path to the file
     * @param format Data format
     * @param options Loading options
     * @return Dynamic pandas DataFrame
     */
    private fun loadDataFrame(
        filepath: String,
        format: DatasetFormat,
        options: Map<String, Any>
    ): dynamic {
        return when (format) {
            DatasetFormat.CSV -> {
                val nrows = options["nrows"] as? Int
                pandas.read_csv(filepath, nrows)
            }
            DatasetFormat.PARQUET -> {
                pandas.read_parquet(filepath)
            }
            DatasetFormat.JSON -> {
                pandas.read_json(filepath)
            }
            DatasetFormat.EXCEL -> {
                pandas.read_excel(filepath)
            }
            DatasetFormat.SQL -> {
                val sql = options["query"] as? String
                    ?: throw IllegalArgumentException("SQL query required in options")
                val connection = options["connection"]
                    ?: throw IllegalArgumentException("Database connection required in options")
                pandas.read_sql(sql, connection)
            }
        }
    }

    /**
     * Detect dataset format from file extension.
     *
     * @param filepath Path to the file
     * @return Detected format
     */
    private fun detectFormat(filepath: String): DatasetFormat {
        return when (filepath.substringAfterLast('.').lowercase()) {
            "csv" -> DatasetFormat.CSV
            "parquet", "pq" -> DatasetFormat.PARQUET
            "json", "jsonl" -> DatasetFormat.JSON
            "xls", "xlsx" -> DatasetFormat.EXCEL
            else -> DatasetFormat.CSV // Default to CSV
        }
    }

    /**
     * Extract column information from DataFrame.
     *
     * @param df pandas DataFrame
     * @return List of column information
     */
    private fun extractColumnInfo(df: dynamic): List<ColumnInfo> {
        val columns = mutableListOf<ColumnInfo>()

        // Get column names
        val columnNames = df.columns.tolist() as List<String>

        for (colName in columnNames) {
            val series = df[colName]
            val dtype = series.dtype.toString() as String
            val nullCount = series.isnull().sum() as Long
            val unique = try {
                series.nunique() as Long
            } catch (e: Exception) {
                0L
            }

            // Get sample values
            val sample = try {
                val sampleValues = series.head(5).tolist() as List<Any>
                sampleValues.map { it.toString() }
            } catch (e: Exception) {
                emptyList()
            }

            columns.add(
                ColumnInfo(
                    name = colName,
                    dtype = dtype,
                    nullCount = nullCount,
                    unique = unique,
                    sample = sample
                )
            )
        }

        return columns
    }

    /**
     * Get a cached DataFrame.
     *
     * @param datasetId Dataset identifier
     * @return pandas DataFrame
     * @throws DatasetNotFoundException if dataset not found or expired
     */
    suspend fun getDataFrame(datasetId: String): dynamic = withContext(Dispatchers.IO) {
        val cached = datasetCache[datasetId]
            ?: throw DatasetNotFoundException("Dataset not found: $datasetId")

        if (cached.isExpired()) {
            datasetCache.remove(datasetId)
            throw DatasetNotFoundException("Dataset cache expired: $datasetId")
        }

        cached.dataFrame
    }

    /**
     * Get dataset metadata.
     *
     * @param datasetId Dataset identifier
     * @return Dataset metadata
     * @throws DatasetNotFoundException if dataset not found
     */
    fun getDataset(datasetId: String): Dataset {
        return datasetRegistry[datasetId]
            ?: throw DatasetNotFoundException("Dataset not found: $datasetId")
    }

    /**
     * Get preview of dataset (first N rows).
     *
     * @param datasetId Dataset identifier
     * @param limit Number of rows to return
     * @return List of rows as maps
     */
    suspend fun getDatasetPreview(
        datasetId: String,
        limit: Int = 10
    ): List<Map<String, Any?>> = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val preview = df.head(limit)

        // Convert to list of maps
        val records = preview.to_dict("records") as List<Map<String, Any?>>
        records
    }

    /**
     * Get specific columns from dataset.
     *
     * @param datasetId Dataset identifier
     * @param columns Column names to retrieve
     * @return DataFrame with selected columns
     */
    suspend fun selectColumns(
        datasetId: String,
        columns: List<String>
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        df[columns]
    }

    /**
     * Filter dataset by condition.
     *
     * @param datasetId Dataset identifier
     * @param column Column to filter on
     * @param operator Comparison operator (>, <, ==, !=, >=, <=)
     * @param value Value to compare against
     * @return Filtered DataFrame
     */
    suspend fun filterDataFrame(
        datasetId: String,
        column: String,
        operator: String,
        value: Any
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val col = df[column]

        val filtered = when (operator) {
            ">" -> df[col > value]
            "<" -> df[col < value]
            "==" -> df[col == value]
            "!=" -> df[col != value]
            ">=" -> df[col >= value]
            "<=" -> df[col <= value]
            else -> throw IllegalArgumentException("Invalid operator: $operator")
        }

        filtered
    }

    /**
     * Group dataset by column and aggregate.
     *
     * @param datasetId Dataset identifier
     * @param groupBy Column to group by
     * @param aggregations Map of column to aggregation function
     * @return Aggregated DataFrame
     */
    suspend fun groupAndAggregate(
        datasetId: String,
        groupBy: String,
        aggregations: Map<String, String>
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val grouped = df.groupby(groupBy)
        grouped.agg(aggregations)
    }

    /**
     * Sort dataset by column.
     *
     * @param datasetId Dataset identifier
     * @param column Column to sort by
     * @param ascending Sort in ascending order
     * @return Sorted DataFrame
     */
    suspend fun sortDataFrame(
        datasetId: String,
        column: String,
        ascending: Boolean = true
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        df.sort_values(column, ascending = ascending)
    }

    /**
     * Get unique values in a column.
     *
     * @param datasetId Dataset identifier
     * @param column Column name
     * @return List of unique values
     */
    suspend fun getUniqueValues(
        datasetId: String,
        column: String
    ): List<Any> = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val unique = df[column].unique()
        unique.tolist() as List<Any>
    }

    /**
     * Get value counts for a column.
     *
     * @param datasetId Dataset identifier
     * @param column Column name
     * @param normalize Return proportions instead of counts
     * @return Map of value to count/proportion
     */
    suspend fun getValueCounts(
        datasetId: String,
        column: String,
        normalize: Boolean = false
    ): Map<String, Double> = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val counts = df[column].value_counts(normalize = normalize)
        val countDict = counts.to_dict() as Map<String, Double>
        countDict
    }

    /**
     * Calculate correlation between two columns.
     *
     * @param datasetId Dataset identifier
     * @param column1 First column
     * @param column2 Second column
     * @param method Correlation method (pearson, spearman, kendall)
     * @return Correlation coefficient
     */
    suspend fun calculateCorrelation(
        datasetId: String,
        column1: String,
        column2: String,
        method: String = "pearson"
    ): Double = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val correlation = df[column1].corr(df[column2], method = method)
        correlation as Double
    }

    /**
     * Drop missing values from DataFrame.
     *
     * @param datasetId Dataset identifier
     * @param columns Specific columns to check (null = all)
     * @param how How to drop ('any' or 'all')
     * @return Cleaned DataFrame
     */
    suspend fun dropMissingValues(
        datasetId: String,
        columns: List<String>? = null,
        how: String = "any"
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        df.dropna(subset = columns, how = how)
    }

    /**
     * Fill missing values in DataFrame.
     *
     * @param datasetId Dataset identifier
     * @param value Value to fill or method ('mean', 'median', 'mode', 'forward', 'backward')
     * @param columns Specific columns to fill (null = all)
     * @return DataFrame with filled values
     */
    suspend fun fillMissingValues(
        datasetId: String,
        value: Any,
        columns: List<String>? = null
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)

        if (columns != null) {
            val filled = df.copy()
            for (col in columns) {
                when (value) {
                    "mean" -> filled[col] = df[col].fillna(df[col].mean())
                    "median" -> filled[col] = df[col].fillna(df[col].median())
                    "mode" -> filled[col] = df[col].fillna(df[col].mode()[0])
                    "forward", "ffill" -> filled[col] = df[col].fillna(method = "ffill")
                    "backward", "bfill" -> filled[col] = df[col].fillna(method = "bfill")
                    else -> filled[col] = df[col].fillna(value)
                }
            }
            filled
        } else {
            df.fillna(value)
        }
    }

    /**
     * Merge two datasets.
     *
     * @param leftId Left dataset ID
     * @param rightId Right dataset ID
     * @param on Column(s) to join on
     * @param how Join type (inner, outer, left, right)
     * @return Merged DataFrame
     */
    suspend fun mergeDatasets(
        leftId: String,
        rightId: String,
        on: List<String>,
        how: String = "inner"
    ): dynamic = withContext(Dispatchers.IO) {
        val left = getDataFrame(leftId)
        val right = getDataFrame(rightId)
        left.merge(right, on = on, how = how)
    }

    /**
     * Concatenate datasets vertically.
     *
     * @param datasetIds List of dataset IDs to concatenate
     * @param ignoreIndex Reset index in result
     * @return Concatenated DataFrame
     */
    suspend fun concatenateDatasets(
        datasetIds: List<String>,
        ignoreIndex: Boolean = true
    ): dynamic = withContext(Dispatchers.IO) {
        val dataFrames = datasetIds.map { getDataFrame(it) }
        pandas.concat(dataFrames, ignore_index = ignoreIndex)
    }

    /**
     * Apply function to column.
     *
     * @param datasetId Dataset identifier
     * @param column Column name
     * @param function Python function to apply
     * @return Series with applied function
     */
    suspend fun applyFunction(
        datasetId: String,
        column: String,
        function: dynamic
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        df[column].apply(function)
    }

    /**
     * Create pivot table.
     *
     * @param datasetId Dataset identifier
     * @param values Column to aggregate
     * @param index Row index column(s)
     * @param columns Column index column(s)
     * @param aggFunc Aggregation function
     * @return Pivot table DataFrame
     */
    suspend fun createPivotTable(
        datasetId: String,
        values: String,
        index: List<String>,
        columns: List<String>,
        aggFunc: String = "mean"
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        df.pivot_table(
            values = values,
            index = index,
            columns = columns,
            aggfunc = aggFunc
        )
    }

    /**
     * Resample time series data.
     *
     * @param datasetId Dataset identifier
     * @param rule Resampling frequency (e.g., 'D' for daily, 'W' for weekly)
     * @param aggFunc Aggregation function
     * @param dateColumn Column containing timestamps
     * @return Resampled DataFrame
     */
    suspend fun resampleTimeSeries(
        datasetId: String,
        rule: String,
        aggFunc: String = "mean",
        dateColumn: String = "date"
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val indexed = df.set_index(dateColumn)
        indexed.resample(rule).agg(aggFunc)
    }

    /**
     * Calculate rolling statistics.
     *
     * @param datasetId Dataset identifier
     * @param column Column to calculate on
     * @param window Window size
     * @param aggFunc Aggregation function
     * @return Series with rolling statistics
     */
    suspend fun calculateRollingStatistics(
        datasetId: String,
        column: String,
        window: Int,
        aggFunc: String = "mean"
    ): dynamic = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val rolling = df[column].rolling(window = window)

        when (aggFunc) {
            "mean" -> rolling.mean()
            "sum" -> rolling.sum()
            "min" -> rolling.min()
            "max" -> rolling.max()
            "std" -> rolling.std()
            "var" -> rolling.var()
            else -> rolling.apply(aggFunc)
        }
    }

    /**
     * Get data quality report.
     *
     * @param datasetId Dataset identifier
     * @return Data quality metrics
     */
    suspend fun getDataQualityReport(datasetId: String): Map<String, Any> = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)
        val dataset = getDataset(datasetId)

        val totalRows = df.shape[0] as Long
        val totalCols = df.shape[1] as Int
        val missingValues = df.isnull().sum().sum() as Long
        val duplicateRows = df.duplicated().sum() as Long

        val qualityMetrics = mutableMapOf<String, Any>(
            "total_rows" to totalRows,
            "total_columns" to totalCols,
            "missing_values" to missingValues,
            "missing_percentage" to (missingValues.toDouble() / (totalRows * totalCols) * 100),
            "duplicate_rows" to duplicateRows,
            "duplicate_percentage" to (duplicateRows.toDouble() / totalRows * 100)
        )

        // Add per-column quality metrics
        val columnMetrics = mutableMapOf<String, Map<String, Any>>()
        for (col in dataset.columns) {
            val series = df[col.name]
            columnMetrics[col.name] = mapOf(
                "null_count" to col.nullCount,
                "null_percentage" to (col.nullCount.toDouble() / totalRows * 100),
                "unique_count" to col.unique,
                "cardinality" to (col.unique.toDouble() / totalRows),
                "dtype" to col.dtype
            )
        }

        qualityMetrics["columns"] = columnMetrics
        qualityMetrics
    }

    /**
     * Export DataFrame to file.
     *
     * @param datasetId Dataset identifier
     * @param filepath Output file path
     * @param format Output format
     */
    suspend fun exportDataset(
        datasetId: String,
        filepath: String,
        format: DatasetFormat = DatasetFormat.CSV
    ) = withContext(Dispatchers.IO) {
        val df = getDataFrame(datasetId)

        when (format) {
            DatasetFormat.CSV -> df.to_csv(filepath, index = false)
            DatasetFormat.PARQUET -> df.to_parquet(filepath)
            DatasetFormat.JSON -> df.to_json(filepath)
            DatasetFormat.EXCEL -> df.to_excel(filepath, index = false)
            else -> throw IllegalArgumentException("Unsupported export format: $format")
        }

        logger.info { "Dataset exported: $datasetId to $filepath" }
    }

    /**
     * Clear dataset from cache.
     *
     * @param datasetId Dataset identifier
     */
    fun clearDataset(datasetId: String) {
        datasetCache.remove(datasetId)
        datasetRegistry.remove(datasetId)
        logger.info { "Dataset cleared from cache: $datasetId" }
    }

    /**
     * Clear all datasets from cache.
     */
    fun clearAllDatasets() {
        datasetCache.clear()
        datasetRegistry.clear()
        logger.info { "All datasets cleared from cache" }
    }

    /**
     * List all loaded datasets.
     *
     * @return List of dataset metadata
     */
    fun listDatasets(): List<Dataset> {
        return datasetRegistry.values.toList()
    }

    /**
     * Check if Python runtime is available.
     */
    fun checkPythonRuntime() {
        try {
            // Try to create a simple DataFrame
            val testData = mapOf("a" to listOf(1, 2, 3))
            pandas.DataFrame(testData)
            logger.info { "Python runtime check passed" }
        } catch (e: Exception) {
            logger.error(e) { "Python runtime check failed" }
            throw PythonExecutionException("Python runtime not available", e)
        }
    }

    /**
     * Check service health.
     *
     * @return true if service is healthy
     */
    fun isHealthy(): Boolean {
        return try {
            checkPythonRuntime()
            true
        } catch (e: Exception) {
            false
        }
    }
}

/**
 * Cached DataFrame with expiration.
 *
 * @property dataFrame The pandas DataFrame
 * @property expiresAt Expiration timestamp
 */
private data class CachedDataFrame(
    val dataFrame: dynamic,
    val expiresAt: Instant
) {
    fun isExpired(): Boolean = Clock.System.now() > expiresAt
}
