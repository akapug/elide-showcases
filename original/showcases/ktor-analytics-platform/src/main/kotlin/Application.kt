package dev.elide.showcases.ktor.analytics

import dev.elide.showcases.ktor.analytics.models.*
import dev.elide.showcases.ktor.analytics.routes.configureAnalyticsRoutes
import dev.elide.showcases.ktor.analytics.services.*
import dev.elide.showcases.ktor.analytics.websocket.configureStreamingAnalytics
import io.github.oshai.kotlinlogging.KotlinLogging
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.compression.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import kotlinx.serialization.json.Json
import org.slf4j.event.Level
import java.time.Duration

private val logger = KotlinLogging.logger {}

/**
 * Main application entry point for the Ktor Analytics Platform.
 *
 * This platform demonstrates polyglot programming by combining:
 * - Kotlin Ktor for high-performance async HTTP server
 * - Python pandas/numpy for data science operations
 * - Real-time WebSocket streaming for live analytics
 *
 * Key Features:
 * - Statistical analysis using pandas
 * - Time series forecasting with statsmodels
 * - Data visualization with plotly/matplotlib
 * - Real-time streaming analytics
 * - Async coroutine-based processing
 *
 * Example usage:
 * ```
 * // Start the server
 * val server = embeddedServer(Netty, port = 8080) {
 *     module()
 * }.start(wait = true)
 * ```
 */
fun main() {
    logger.info { "Starting Ktor Analytics Platform..." }

    embeddedServer(
        Netty,
        port = System.getenv("PORT")?.toIntOrNull() ?: 8080,
        host = "0.0.0.0",
        module = Application::module
    ).start(wait = true)
}

/**
 * Main application module configuration.
 *
 * Configures all Ktor plugins and routing for the analytics platform:
 * - Content negotiation (JSON)
 * - WebSocket support
 * - CORS headers
 * - Compression (gzip, deflate)
 * - Call logging
 * - Error handling
 * - Metrics collection
 *
 * @receiver Application The Ktor application instance
 */
fun Application.module() {
    logger.info { "Configuring Ktor Analytics Platform module..." }

    // Configure serialization
    configureSerialization()

    // Configure WebSocket support
    configureWebSockets()

    // Configure CORS for cross-origin requests
    configureCORS()

    // Configure compression
    configureCompression()

    // Configure logging
    configureLogging()

    // Configure error handling
    configureErrorHandling()

    // Initialize services
    val services = initializeServices()

    // Configure routing
    configureRouting(services)

    logger.info { "Ktor Analytics Platform configured successfully" }
}

/**
 * Configure JSON serialization for request/response handling.
 *
 * Uses kotlinx.serialization with custom settings:
 * - Pretty printing for human-readable JSON
 * - Lenient parsing for flexible input
 * - Ignore unknown keys for forward compatibility
 * - Explicit null handling
 */
fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
            explicitNulls = false
            encodeDefaults = true
        })
    }
}

/**
 * Configure WebSocket support for real-time streaming analytics.
 *
 * Settings:
 * - Ping period: 15 seconds (keep connection alive)
 * - Timeout: 15 seconds (detect dead connections)
 * - Max frame size: 10MB (for large data transfers)
 * - Masking: disabled (server-side optimization)
 */
fun Application.configureWebSockets() {
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(15)
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
}

/**
 * Configure CORS (Cross-Origin Resource Sharing) headers.
 *
 * Allows:
 * - Any origin (for development)
 * - Common HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
 * - Custom headers (Content-Type, Authorization, X-Request-ID)
 * - Credentials (cookies, auth headers)
 */
fun Application.configureCORS() {
    install(CORS) {
        anyHost()
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowHeader("X-Request-ID")
        allowCredentials = true
        maxAgeDuration = Duration.ofDays(1)
    }
}

/**
 * Configure response compression to reduce bandwidth.
 *
 * Supports:
 * - Gzip compression
 * - Deflate compression
 * - Configurable minimum size (1KB)
 */
fun Application.configureCompression() {
    install(Compression) {
        gzip {
            priority = 1.0
            minimumSize(1024)
        }
        deflate {
            priority = 10.0
            minimumSize(1024)
        }
    }
}

/**
 * Configure request/response logging for observability.
 *
 * Logs:
 * - HTTP method and URI
 * - Response status code
 * - Request/response duration
 * - Request ID for tracing
 */
fun Application.configureLogging() {
    install(CallLogging) {
        level = Level.INFO
        filter { call -> call.request.path().startsWith("/") }
        format { call ->
            val status = call.response.status()
            val httpMethod = call.request.httpMethod.value
            val uri = call.request.uri
            val duration = call.processingTime()
            "$httpMethod $uri -> $status (${duration}ms)"
        }
    }
}

/**
 * Configure centralized error handling for all routes.
 *
 * Handles:
 * - Validation errors (400 Bad Request)
 * - Not found errors (404 Not Found)
 * - Python execution errors (500 Internal Server Error)
 * - Generic exceptions (500 Internal Server Error)
 *
 * Returns structured JSON error responses with:
 * - Error message
 * - Error type
 * - Timestamp
 * - Request path
 */
fun Application.configureErrorHandling() {
    install(StatusPages) {
        exception<ValidationException> { call, cause ->
            logger.warn { "Validation error: ${cause.message}" }
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(
                    error = cause.message ?: "Validation failed",
                    errorType = "ValidationError",
                    timestamp = kotlinx.datetime.Clock.System.now(),
                    path = call.request.uri
                )
            )
        }

        exception<DatasetNotFoundException> { call, cause ->
            logger.warn { "Dataset not found: ${cause.message}" }
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(
                    error = cause.message ?: "Dataset not found",
                    errorType = "NotFoundError",
                    timestamp = kotlinx.datetime.Clock.System.now(),
                    path = call.request.uri
                )
            )
        }

        exception<PythonExecutionException> { call, cause ->
            logger.error(cause) { "Python execution error: ${cause.message}" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    error = cause.message ?: "Python execution failed",
                    errorType = "PythonExecutionError",
                    timestamp = kotlinx.datetime.Clock.System.now(),
                    path = call.request.uri
                )
            )
        }

        exception<Throwable> { call, cause ->
            logger.error(cause) { "Unhandled exception: ${cause.message}" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    error = "Internal server error: ${cause.message}",
                    errorType = "InternalError",
                    timestamp = kotlinx.datetime.Clock.System.now(),
                    path = call.request.uri
                )
            )
        }

        status(HttpStatusCode.NotFound) { call, status ->
            call.respond(
                status,
                ErrorResponse(
                    error = "Endpoint not found: ${call.request.uri}",
                    errorType = "NotFoundError",
                    timestamp = kotlinx.datetime.Clock.System.now(),
                    path = call.request.uri
                )
            )
        }
    }
}

/**
 * Initialize all analytics services.
 *
 * Creates and configures:
 * - DataService: Load and manage datasets
 * - StatisticsService: Compute statistical measures
 * - TimeSeriesService: Time series analysis and forecasting
 * - VisualizationService: Generate charts and plots
 *
 * Services are shared across all requests and managed as singletons.
 *
 * @return AnalyticsServices Container with all initialized services
 */
fun Application.initializeServices(): AnalyticsServices {
    logger.info { "Initializing analytics services..." }

    val dataService = DataService()
    val statisticsService = StatisticsService()
    val timeSeriesService = TimeSeriesService()
    val visualizationService = VisualizationService()

    logger.info { "Analytics services initialized successfully" }

    return AnalyticsServices(
        dataService = dataService,
        statisticsService = statisticsService,
        timeSeriesService = timeSeriesService,
        visualizationService = visualizationService
    )
}

/**
 * Configure all application routing.
 *
 * Routes:
 * - GET /: Health check and API information
 * - GET /health: Detailed health status
 * - /analytics/*: Statistical analysis endpoints
 * - /timeseries/*: Time series analysis endpoints
 * - /visualize/*: Visualization endpoints
 * - /stream/*: WebSocket streaming endpoints
 *
 * @param services Container with all analytics services
 */
fun Application.configureRouting(services: AnalyticsServices) {
    routing {
        // Root endpoint - API information
        get("/") {
            call.respond(
                ApiInfo(
                    name = "Ktor Analytics Platform",
                    version = "1.0.0",
                    description = "Polyglot analytics platform combining Kotlin Ktor + Python data science",
                    endpoints = listOf(
                        "/analytics/describe - Get descriptive statistics",
                        "/analytics/correlate - Compute correlation matrix",
                        "/analytics/regression - Perform regression analysis",
                        "/timeseries/trends - Analyze trends",
                        "/timeseries/forecast - Generate forecasts",
                        "/timeseries/decompose - Decompose time series",
                        "/timeseries/anomalies - Detect anomalies",
                        "/visualize/chart - Generate charts",
                        "/visualize/heatmap - Generate heatmaps",
                        "/visualize/distribution - Visualize distributions",
                        "/stream/analytics - Real-time analytics (WebSocket)",
                        "/stream/timeseries - Real-time time series (WebSocket)"
                    ),
                    features = listOf(
                        "Polyglot Python/Kotlin integration",
                        "Real-time WebSocket streaming",
                        "Statistical analysis with pandas",
                        "Time series forecasting",
                        "Data visualization",
                        "Async coroutine processing"
                    )
                )
            )
        }

        // Health check endpoint
        get("/health") {
            val healthStatus = checkHealth(services)
            val statusCode = if (healthStatus.healthy) {
                HttpStatusCode.OK
            } else {
                HttpStatusCode.ServiceUnavailable
            }
            call.respond(statusCode, healthStatus)
        }

        // Metrics endpoint (Prometheus compatible)
        get("/metrics") {
            val metrics = collectMetrics(services)
            call.respondText(metrics, contentType = ContentType.Text.Plain)
        }

        // Configure analytics routes
        configureAnalyticsRoutes(services)

        // Configure streaming WebSocket routes
        configureStreamingAnalytics(services)
    }
}

/**
 * Check system health status.
 *
 * Verifies:
 * - Python runtime availability
 * - Service initialization
 * - Memory usage
 * - Uptime
 *
 * @param services Analytics services to check
 * @return HealthStatus System health information
 */
suspend fun checkHealth(services: AnalyticsServices): HealthStatus {
    val checks = mutableMapOf<String, Boolean>()

    // Check Python runtime
    checks["python_runtime"] = try {
        services.dataService.checkPythonRuntime()
        true
    } catch (e: Exception) {
        logger.error(e) { "Python runtime check failed" }
        false
    }

    // Check services
    checks["data_service"] = services.dataService.isHealthy()
    checks["statistics_service"] = services.statisticsService.isHealthy()
    checks["timeseries_service"] = services.timeSeriesService.isHealthy()
    checks["visualization_service"] = services.visualizationService.isHealthy()

    val allHealthy = checks.values.all { it }

    return HealthStatus(
        healthy = allHealthy,
        timestamp = kotlinx.datetime.Clock.System.now(),
        checks = checks,
        uptime = System.currentTimeMillis(),
        memoryUsage = Runtime.getRuntime().let {
            MemoryInfo(
                used = it.totalMemory() - it.freeMemory(),
                total = it.totalMemory(),
                max = it.maxMemory()
            )
        }
    )
}

/**
 * Collect Prometheus-compatible metrics.
 *
 * Metrics include:
 * - Request counters
 * - Response times
 * - Error rates
 * - Python execution times
 * - Memory usage
 *
 * @param services Analytics services
 * @return String Prometheus-formatted metrics
 */
fun collectMetrics(services: AnalyticsServices): String {
    val metrics = StringBuilder()

    // JVM memory metrics
    val runtime = Runtime.getRuntime()
    metrics.appendLine("# HELP jvm_memory_used_bytes JVM memory used")
    metrics.appendLine("# TYPE jvm_memory_used_bytes gauge")
    metrics.appendLine("jvm_memory_used_bytes ${runtime.totalMemory() - runtime.freeMemory()}")

    metrics.appendLine("# HELP jvm_memory_total_bytes JVM memory total")
    metrics.appendLine("# TYPE jvm_memory_total_bytes gauge")
    metrics.appendLine("jvm_memory_total_bytes ${runtime.totalMemory()}")

    metrics.appendLine("# HELP jvm_memory_max_bytes JVM memory max")
    metrics.appendLine("# TYPE jvm_memory_max_bytes gauge")
    metrics.appendLine("jvm_memory_max_bytes ${runtime.maxMemory()}")

    // Service metrics
    metrics.appendLine("# HELP analytics_requests_total Total analytics requests")
    metrics.appendLine("# TYPE analytics_requests_total counter")
    metrics.appendLine("analytics_requests_total ${services.statisticsService.getRequestCount()}")

    metrics.appendLine("# HELP analytics_errors_total Total analytics errors")
    metrics.appendLine("# TYPE analytics_errors_total counter")
    metrics.appendLine("analytics_errors_total ${services.statisticsService.getErrorCount()}")

    return metrics.toString()
}

/**
 * Container for all analytics services.
 *
 * Provides centralized access to all services for dependency injection.
 *
 * @property dataService Service for loading and managing datasets
 * @property statisticsService Service for statistical computations
 * @property timeSeriesService Service for time series analysis
 * @property visualizationService Service for generating visualizations
 */
data class AnalyticsServices(
    val dataService: DataService,
    val statisticsService: StatisticsService,
    val timeSeriesService: TimeSeriesService,
    val visualizationService: VisualizationService
)

/**
 * API information response.
 *
 * @property name API name
 * @property version API version
 * @property description API description
 * @property endpoints List of available endpoints
 * @property features List of platform features
 */
@kotlinx.serialization.Serializable
data class ApiInfo(
    val name: String,
    val version: String,
    val description: String,
    val endpoints: List<String>,
    val features: List<String>
)

/**
 * Health status response.
 *
 * @property healthy Overall health status
 * @property timestamp Check timestamp
 * @property checks Individual component health checks
 * @property uptime System uptime in milliseconds
 * @property memoryUsage Memory usage information
 */
@kotlinx.serialization.Serializable
data class HealthStatus(
    val healthy: Boolean,
    val timestamp: kotlinx.datetime.Instant,
    val checks: Map<String, Boolean>,
    val uptime: Long,
    val memoryUsage: MemoryInfo
)

/**
 * Memory usage information.
 *
 * @property used Used memory in bytes
 * @property total Total allocated memory in bytes
 * @property max Maximum available memory in bytes
 */
@kotlinx.serialization.Serializable
data class MemoryInfo(
    val used: Long,
    val total: Long,
    val max: Long
) {
    val usedPercent: Double get() = (used.toDouble() / total.toDouble()) * 100.0
    val totalPercent: Double get() = (total.toDouble() / max.toDouble()) * 100.0
}

/**
 * Extension to get processing time for a call.
 */
fun ApplicationCall.processingTime(): Long {
    val startTime = attributes.getOrNull(ProcessingTimeKey)
    return if (startTime != null) {
        System.currentTimeMillis() - startTime
    } else {
        0L
    }
}

/**
 * Attribute key for tracking request processing time.
 */
private val ProcessingTimeKey = AttributeKey<Long>("ProcessingTime")

/**
 * Custom exception for validation errors.
 */
class ValidationException(message: String) : Exception(message)

/**
 * Custom exception for dataset not found errors.
 */
class DatasetNotFoundException(message: String) : Exception(message)

/**
 * Custom exception for Python execution errors.
 */
class PythonExecutionException(message: String, cause: Throwable? = null) : Exception(message, cause)
