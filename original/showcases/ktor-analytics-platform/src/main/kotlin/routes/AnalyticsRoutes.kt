package dev.elide.showcases.ktor.analytics.routes

import dev.elide.showcases.ktor.analytics.AnalyticsServices
import dev.elide.showcases.ktor.analytics.ValidationException
import dev.elide.showcases.ktor.analytics.models.*
import io.github.oshai.kotlinlogging.KotlinLogging
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

private val logger = KotlinLogging.logger {}

/**
 * Configure analytics API routes.
 *
 * Provides comprehensive REST API for analytics operations:
 * - Statistical analysis endpoints
 * - Time series analysis endpoints
 * - Visualization endpoints
 * - Dataset management endpoints
 *
 * All endpoints support JSON request/response format and include
 * proper error handling with structured error responses.
 *
 * @param services Analytics services container
 */
fun Route.configureAnalyticsRoutes(services: AnalyticsServices) {
    route("/analytics") {
        configureStatisticsRoutes(services)
    }

    route("/timeseries") {
        configureTimeSeriesRoutes(services)
    }

    route("/visualize") {
        configureVisualizationRoutes(services)
    }

    route("/datasets") {
        configureDatasetRoutes(services)
    }
}

/**
 * Configure statistics analysis routes.
 */
private fun Route.configureStatisticsRoutes(services: AnalyticsServices) {
    /**
     * GET /analytics/describe
     *
     * Get descriptive statistics for dataset columns.
     *
     * Query parameters:
     * - dataset: Dataset identifier (required)
     * - columns: Comma-separated column names (optional)
     * - percentiles: Comma-separated percentile values (optional)
     *
     * Returns: DescribeResponse with statistics for each column
     */
    get("/describe") {
        val dataset = call.parameters["dataset"]
            ?: throw ValidationException("Dataset parameter required")

        val columns = call.parameters["columns"]?.split(",")?.map { it.trim() }

        val percentiles = call.parameters["percentiles"]?.split(",")
            ?.mapNotNull { it.trim().toIntOrNull() }
            ?: listOf(25, 50, 75)

        val request = DescribeRequest(
            dataset = dataset,
            columns = columns,
            includePercentiles = true,
            percentiles = percentiles
        )

        logger.info { "Computing statistics for dataset: $dataset" }
        val response = services.statisticsService.describeDataset(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /analytics/correlate
     *
     * Compute correlation matrix for dataset columns.
     *
     * Request body: CorrelationRequest
     *
     * Returns: CorrelationResponse with correlation matrix
     */
    post("/correlate") {
        val request = call.receive<CorrelationRequest>()

        logger.info { "Computing correlation matrix for dataset: ${request.dataset}" }
        val response = services.statisticsService.correlationMatrix(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /analytics/regression
     *
     * Perform regression analysis.
     *
     * Request body: RegressionRequest
     *
     * Returns: RegressionResponse with model results
     */
    post("/regression") {
        val request = call.receive<RegressionRequest>()

        logger.info { "Performing ${request.model} regression on dataset: ${request.dataset}" }
        val response = services.statisticsService.performRegression(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * GET /analytics/outliers
     *
     * Detect outliers in dataset column.
     *
     * Query parameters:
     * - dataset: Dataset identifier (required)
     * - column: Column name (required)
     * - method: Detection method (zscore, iqr, isolation_forest)
     * - threshold: Method-specific threshold
     *
     * Returns: List of outlier indices
     */
    get("/outliers") {
        val dataset = call.parameters["dataset"]
            ?: throw ValidationException("Dataset parameter required")

        val column = call.parameters["column"]
            ?: throw ValidationException("Column parameter required")

        val method = call.parameters["method"] ?: "zscore"
        val threshold = call.parameters["threshold"]?.toDoubleOrNull() ?: 3.0

        logger.info { "Detecting outliers in $column using $method" }
        val outliers = services.statisticsService.detectOutliers(
            services.dataService,
            dataset,
            column,
            method,
            threshold
        )

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "dataset" to dataset,
                "column" to column,
                "method" to method,
                "outliers" to outliers,
                "count" to outliers.size
            )
        )
    }

    /**
     * GET /analytics/normality
     *
     * Test for normal distribution.
     *
     * Query parameters:
     * - dataset: Dataset identifier (required)
     * - column: Column name (required)
     *
     * Returns: Test statistic and p-value
     */
    get("/normality") {
        val dataset = call.parameters["dataset"]
            ?: throw ValidationException("Dataset parameter required")

        val column = call.parameters["column"]
            ?: throw ValidationException("Column parameter required")

        logger.info { "Testing normality for $column" }
        val (statistic, pValue) = services.statisticsService.testNormality(
            services.dataService,
            dataset,
            column
        )

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "dataset" to dataset,
                "column" to column,
                "statistic" to statistic,
                "pValue" to pValue,
                "isNormal" to (pValue > 0.05)
            )
        )
    }

    /**
     * POST /analytics/ttest
     *
     * Perform t-test between two groups.
     *
     * Request body: { dataset, column1, column2 }
     *
     * Returns: Test statistic and p-value
     */
    post("/ttest") {
        val body = call.receive<Map<String, String>>()
        val dataset = body["dataset"]
            ?: throw ValidationException("Dataset required")
        val column1 = body["column1"]
            ?: throw ValidationException("column1 required")
        val column2 = body["column2"]
            ?: throw ValidationException("column2 required")

        logger.info { "Performing t-test between $column1 and $column2" }
        val (statistic, pValue) = services.statisticsService.performTTest(
            services.dataService,
            dataset,
            column1,
            column2
        )

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "dataset" to dataset,
                "groups" to listOf(column1, column2),
                "statistic" to statistic,
                "pValue" to pValue,
                "significant" to (pValue < 0.05)
            )
        )
    }
}

/**
 * Configure time series analysis routes.
 */
private fun Route.configureTimeSeriesRoutes(services: AnalyticsServices) {
    /**
     * POST /timeseries/trends
     *
     * Analyze trends in time series data.
     *
     * Request body: TrendAnalysisRequest
     *
     * Returns: TrendAnalysisResponse
     */
    post("/trends") {
        val request = call.receive<TrendAnalysisRequest>()

        logger.info { "Analyzing trends for ${request.column} in dataset ${request.dataset}" }
        val response = services.timeSeriesService.analyzeTrends(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * GET /timeseries/trends
     *
     * Analyze trends (GET variant with query params).
     */
    get("/trends") {
        val dataset = call.parameters["dataset"]
            ?: throw ValidationException("Dataset parameter required")

        val column = call.parameters["column"]
            ?: throw ValidationException("Column parameter required")

        val dateColumn = call.parameters["dateColumn"] ?: "date"
        val window = call.parameters["window"]?.toIntOrNull() ?: 7

        val request = TrendAnalysisRequest(
            dataset = dataset,
            column = column,
            dateColumn = dateColumn,
            window = window
        )

        val response = services.timeSeriesService.analyzeTrends(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /timeseries/forecast
     *
     * Generate time series forecast.
     *
     * Request body: ForecastRequest
     *
     * Returns: ForecastResponse
     */
    post("/forecast") {
        val request = call.receive<ForecastRequest>()

        logger.info { "Forecasting ${request.periods} periods for ${request.column}" }
        val response = services.timeSeriesService.forecastTimeSeries(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /timeseries/decompose
     *
     * Decompose time series into components.
     *
     * Request body: DecomposeRequest
     *
     * Returns: DecomposeResponse
     */
    post("/decompose") {
        val request = call.receive<DecomposeRequest>()

        logger.info { "Decomposing time series for ${request.column}" }
        val response = services.timeSeriesService.decomposeTimeSeries(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /timeseries/anomalies
     *
     * Detect anomalies in time series.
     *
     * Request body: AnomalyDetectionRequest
     *
     * Returns: AnomalyDetectionResponse
     */
    post("/anomalies") {
        val request = call.receive<AnomalyDetectionRequest>()

        logger.info { "Detecting anomalies in ${request.column} using ${request.method}" }
        val response = services.timeSeriesService.detectAnomalies(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * GET /timeseries/anomalies
     *
     * Detect anomalies (GET variant).
     */
    get("/anomalies") {
        val dataset = call.parameters["dataset"]
            ?: throw ValidationException("Dataset parameter required")

        val column = call.parameters["column"]
            ?: throw ValidationException("Column parameter required")

        val method = call.parameters["method"]?.let {
            AnomalyMethod.valueOf(it.uppercase())
        } ?: AnomalyMethod.ZSCORE

        val threshold = call.parameters["threshold"]?.toDoubleOrNull() ?: 3.0

        val request = AnomalyDetectionRequest(
            dataset = dataset,
            column = column,
            method = method,
            threshold = threshold
        )

        val response = services.timeSeriesService.detectAnomalies(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }
}

/**
 * Configure visualization routes.
 */
private fun Route.configureVisualizationRoutes(services: AnalyticsServices) {
    /**
     * POST /visualize/chart
     *
     * Generate various chart types.
     *
     * Request body: ChartRequest
     *
     * Returns: ChartResponse with URL to generated chart
     */
    post("/chart") {
        val request = call.receive<ChartRequest>()

        logger.info { "Generating ${request.chartType} chart for dataset ${request.dataset}" }
        val response = services.visualizationService.generateChart(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /visualize/heatmap
     *
     * Generate correlation heatmap.
     *
     * Request body: HeatmapRequest
     *
     * Returns: ChartResponse
     */
    post("/heatmap") {
        val request = call.receive<HeatmapRequest>()

        logger.info { "Generating heatmap for dataset ${request.dataset}" }
        val response = services.visualizationService.generateHeatmap(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * POST /visualize/distribution
     *
     * Visualize data distribution.
     *
     * Request body: DistributionRequest
     *
     * Returns: ChartResponse
     */
    post("/distribution") {
        val request = call.receive<DistributionRequest>()

        logger.info { "Generating ${request.chartType} distribution for ${request.column}" }
        val response = services.visualizationService.generateDistribution(services.dataService, request)

        call.respond(HttpStatusCode.OK, response)
    }

    /**
     * GET /visualize/cleanup
     *
     * Clean up old chart files.
     *
     * Query parameters:
     * - maxAgeHours: Maximum age in hours (default: 24)
     *
     * Returns: Success message
     */
    get("/cleanup") {
        val maxAgeHours = call.parameters["maxAgeHours"]?.toIntOrNull() ?: 24

        logger.info { "Cleaning up chart files older than $maxAgeHours hours" }
        services.visualizationService.cleanupOldCharts(maxAgeHours)

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "message" to "Cleanup completed",
                "maxAgeHours" to maxAgeHours
            )
        )
    }
}

/**
 * Configure dataset management routes.
 */
private fun Route.configureDatasetRoutes(services: AnalyticsServices) {
    /**
     * POST /datasets/load
     *
     * Load a dataset from file.
     *
     * Request body: { filepath, datasetId, format }
     *
     * Returns: Dataset metadata
     */
    post("/load") {
        val body = call.receive<Map<String, String>>()

        val filepath = body["filepath"]
            ?: throw ValidationException("filepath required")

        val datasetId = body["datasetId"]
            ?: throw ValidationException("datasetId required")

        val format = body["format"]?.let { DatasetFormat.valueOf(it.uppercase()) }

        logger.info { "Loading dataset: $datasetId from $filepath" }
        val dataset = services.dataService.loadDataset(filepath, datasetId, format)

        call.respond(HttpStatusCode.OK, dataset)
    }

    /**
     * GET /datasets/list
     *
     * List all loaded datasets.
     *
     * Returns: List of dataset metadata
     */
    get("/list") {
        val datasets = services.dataService.listDatasets()

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "datasets" to datasets,
                "count" to datasets.size
            )
        )
    }

    /**
     * GET /datasets/{id}
     *
     * Get dataset metadata.
     *
     * Path parameter: id - Dataset identifier
     *
     * Returns: Dataset metadata
     */
    get("/{id}") {
        val datasetId = call.parameters["id"]
            ?: throw ValidationException("Dataset ID required")

        val dataset = services.dataService.getDataset(datasetId)

        call.respond(HttpStatusCode.OK, dataset)
    }

    /**
     * GET /datasets/{id}/preview
     *
     * Get dataset preview (first N rows).
     *
     * Path parameter: id - Dataset identifier
     * Query parameter: limit - Number of rows (default: 10)
     *
     * Returns: List of rows
     */
    get("/{id}/preview") {
        val datasetId = call.parameters["id"]
            ?: throw ValidationException("Dataset ID required")

        val limit = call.parameters["limit"]?.toIntOrNull() ?: 10

        val preview = services.dataService.getDatasetPreview(datasetId, limit)

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "dataset" to datasetId,
                "limit" to limit,
                "rows" to preview
            )
        )
    }

    /**
     * GET /datasets/{id}/quality
     *
     * Get data quality report.
     *
     * Path parameter: id - Dataset identifier
     *
     * Returns: Data quality metrics
     */
    get("/{id}/quality") {
        val datasetId = call.parameters["id"]
            ?: throw ValidationException("Dataset ID required")

        logger.info { "Generating data quality report for $datasetId" }
        val qualityReport = services.dataService.getDataQualityReport(datasetId)

        call.respond(HttpStatusCode.OK, qualityReport)
    }

    /**
     * DELETE /datasets/{id}
     *
     * Clear dataset from cache.
     *
     * Path parameter: id - Dataset identifier
     *
     * Returns: Success message
     */
    delete("/{id}") {
        val datasetId = call.parameters["id"]
            ?: throw ValidationException("Dataset ID required")

        logger.info { "Clearing dataset: $datasetId" }
        services.dataService.clearDataset(datasetId)

        call.respond(
            HttpStatusCode.OK,
            mapOf("message" to "Dataset cleared: $datasetId")
        )
    }

    /**
     * GET /datasets/{id}/columns/{column}/unique
     *
     * Get unique values in a column.
     *
     * Path parameters:
     * - id: Dataset identifier
     * - column: Column name
     *
     * Returns: List of unique values
     */
    get("/{id}/columns/{column}/unique") {
        val datasetId = call.parameters["id"]
            ?: throw ValidationException("Dataset ID required")

        val column = call.parameters["column"]
            ?: throw ValidationException("Column required")

        val uniqueValues = services.dataService.getUniqueValues(datasetId, column)

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "dataset" to datasetId,
                "column" to column,
                "unique" to uniqueValues,
                "count" to uniqueValues.size
            )
        )
    }

    /**
     * GET /datasets/{id}/columns/{column}/counts
     *
     * Get value counts for a column.
     *
     * Path parameters:
     * - id: Dataset identifier
     * - column: Column name
     *
     * Query parameter:
     * - normalize: Return proportions instead of counts (default: false)
     *
     * Returns: Map of value to count/proportion
     */
    get("/{id}/columns/{column}/counts") {
        val datasetId = call.parameters["id"]
            ?: throw ValidationException("Dataset ID required")

        val column = call.parameters["column"]
            ?: throw ValidationException("Column required")

        val normalize = call.parameters["normalize"]?.toBoolean() ?: false

        val counts = services.dataService.getValueCounts(datasetId, column, normalize)

        call.respond(
            HttpStatusCode.OK,
            mapOf(
                "dataset" to datasetId,
                "column" to column,
                "counts" to counts,
                "normalized" to normalize
            )
        )
    }
}
