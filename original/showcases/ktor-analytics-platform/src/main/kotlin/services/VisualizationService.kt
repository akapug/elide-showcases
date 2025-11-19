package dev.elide.showcases.ktor.analytics.services

import dev.elide.showcases.ktor.analytics.PythonExecutionException
import dev.elide.showcases.ktor.analytics.ValidationException
import dev.elide.showcases.ktor.analytics.models.*
import io.github.oshai.kotlinlogging.KotlinLogging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

private val logger = KotlinLogging.logger {}

/**
 * Service for data visualization using Python matplotlib, plotly, and seaborn.
 *
 * Provides comprehensive visualization capabilities:
 * - Line charts, bar charts, scatter plots
 * - Heatmaps and correlation matrices
 * - Distribution plots (histograms, KDE, box plots)
 * - Time series visualizations
 * - Interactive plotly charts
 * - Statistical plots
 *
 * Python integration:
 * - matplotlib for static plots
 * - plotly for interactive visualizations
 * - seaborn for statistical graphics
 * - pandas for data preparation
 *
 * Example usage:
 * ```kotlin
 * val vizService = VisualizationService()
 * val chart = vizService.generateChart(dataService, chartRequest)
 * val heatmap = vizService.generateHeatmap(dataService, heatmapRequest)
 * ```
 */
class VisualizationService {
    // @ts-ignore
    @JsModule("python:matplotlib.pyplot")
    @JsNonModule
    external object matplotlib_pyplot {
        fun figure(figsize: Pair<Int, Int>? = definedExternally): dynamic
        fun plot(x: dynamic, y: dynamic, label: String? = definedExternally, marker: String? = definedExternally): dynamic
        fun bar(x: dynamic, height: dynamic, label: String? = definedExternally): dynamic
        fun scatter(x: dynamic, y: dynamic, c: dynamic? = definedExternally, s: dynamic? = definedExternally): dynamic
        fun hist(x: dynamic, bins: Int = definedExternally, alpha: Double = definedExternally): dynamic
        fun boxplot(x: dynamic): dynamic
        fun title(label: String): dynamic
        fun xlabel(label: String): dynamic
        fun ylabel(label: String): dynamic
        fun legend(): dynamic
        fun grid(visible: Boolean = definedExternally): dynamic
        fun tight_layout(): dynamic
        fun savefig(filename: String, dpi: Int = definedExternally, bbox_inches: String = definedExternally): dynamic
        fun close(): dynamic
        fun clf(): dynamic
    }

    // @ts-ignore
    @JsModule("python:seaborn")
    @JsNonModule
    external object seaborn {
        fun set_style(style: String): dynamic
        fun heatmap(
            data: dynamic,
            annot: Boolean = definedExternally,
            fmt: String = definedExternally,
            cmap: String = definedExternally,
            cbar: Boolean = definedExternally
        ): dynamic
        fun lineplot(data: dynamic, x: String, y: String, hue: String? = definedExternally): dynamic
        fun barplot(data: dynamic, x: String, y: String, hue: String? = definedExternally): dynamic
        fun scatterplot(data: dynamic, x: String, y: String, hue: String? = definedExternally): dynamic
        fun boxplot(data: dynamic, x: String? = definedExternally, y: String? = definedExternally): dynamic
        fun violinplot(data: dynamic, x: String? = definedExternally, y: String? = definedExternally): dynamic
        fun histplot(data: dynamic, x: String, kde: Boolean = definedExternally, bins: Int = definedExternally): dynamic
        fun kdeplot(data: dynamic, x: String): dynamic
    }

    // @ts-ignore
    @JsModule("python:plotly.graph_objects")
    @JsNonModule
    external object plotly_go {
        fun Figure(data: List<dynamic>? = definedExternally): dynamic
        fun Scatter(
            x: dynamic,
            y: dynamic,
            mode: String = definedExternally,
            name: String? = definedExternally,
            marker: dynamic? = definedExternally
        ): dynamic
        fun Bar(
            x: dynamic,
            y: dynamic,
            name: String? = definedExternally
        ): dynamic
        fun Heatmap(
            z: dynamic,
            x: dynamic? = definedExternally,
            y: dynamic? = definedExternally,
            colorscale: String? = definedExternally
        ): dynamic
        fun Box(
            y: dynamic,
            name: String? = definedExternally
        ): dynamic
        fun Histogram(
            x: dynamic,
            nbins: Int? = definedExternally
        ): dynamic
    }

    // @ts-ignore
    @JsModule("python:plotly.express")
    @JsNonModule
    external object plotly_express {
        fun line(data: dynamic, x: String, y: String, color: String? = definedExternally, title: String? = definedExternally): dynamic
        fun bar(data: dynamic, x: String, y: String, color: String? = definedExternally, title: String? = definedExternally): dynamic
        fun scatter(data: dynamic, x: String, y: String, color: String? = definedExternally, size: String? = definedExternally, title: String? = definedExternally): dynamic
        fun histogram(data: dynamic, x: String, nbins: Int? = definedExternally, title: String? = definedExternally): dynamic
        fun box(data: dynamic, y: String, title: String? = definedExternally): dynamic
    }

    /**
     * Output directory for generated charts.
     */
    private val outputDir = File("charts").apply {
        if (!exists()) mkdirs()
    }

    /**
     * Generate chart based on request.
     *
     * @param dataService Data service instance
     * @param request Chart generation request
     * @return Chart response with URL/path to generated chart
     */
    suspend fun generateChart(
        dataService: DataService,
        request: ChartRequest
    ): ChartResponse = withContext(Dispatchers.IO) {
        logger.info { "Generating ${request.chartType} chart for dataset ${request.dataset}" }

        try {
            val df = dataService.getDataFrame(request.dataset)

            // Validate columns
            validateColumns(df, listOf(request.x, request.y) + listOfNotNull(request.groupBy))

            // Generate chart based on type and format
            val chartPath = when (request.format) {
                ChartFormat.PNG, ChartFormat.SVG -> generateStaticChart(df, request)
                ChartFormat.HTML -> generateInteractiveChart(df, request)
                ChartFormat.JSON -> generateChartJson(df, request)
            }

            ChartResponse(
                chartUrl = "/charts/${chartPath.name}",
                chartType = request.chartType,
                width = request.width,
                height = request.height,
                format = request.format,
                data = if (request.format == ChartFormat.JSON) chartPath.readText() else null
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to generate chart" }
            throw PythonExecutionException("Chart generation failed: ${e.message}", e)
        }
    }

    /**
     * Generate static chart using matplotlib/seaborn.
     */
    private fun generateStaticChart(df: dynamic, request: ChartRequest): File {
        // Set seaborn style
        seaborn.set_style("whitegrid")

        // Create figure
        val figsize = Pair(request.width / 100, request.height / 100)
        matplotlib_pyplot.figure(figsize)

        // Generate chart based on type
        when (request.chartType) {
            ChartType.LINE -> {
                if (request.groupBy != null) {
                    seaborn.lineplot(df, x = request.x, y = request.y, hue = request.groupBy)
                } else {
                    matplotlib_pyplot.plot(df[request.x].values, df[request.y].values)
                }
            }
            ChartType.BAR -> {
                if (request.groupBy != null) {
                    seaborn.barplot(df, x = request.x, y = request.y, hue = request.groupBy)
                } else {
                    matplotlib_pyplot.bar(df[request.x].values, df[request.y].values)
                }
            }
            ChartType.SCATTER -> {
                if (request.groupBy != null) {
                    seaborn.scatterplot(df, x = request.x, y = request.y, hue = request.groupBy)
                } else {
                    matplotlib_pyplot.scatter(df[request.x].values, df[request.y].values)
                }
            }
            ChartType.AREA -> {
                matplotlib_pyplot.fill_between(
                    df[request.x].values,
                    df[request.y].values,
                    alpha = 0.5
                )
            }
            ChartType.BOX -> {
                seaborn.boxplot(df, x = request.x, y = request.y)
            }
            ChartType.VIOLIN -> {
                seaborn.violinplot(df, x = request.x, y = request.y)
            }
            ChartType.HISTOGRAM -> {
                seaborn.histplot(df, x = request.x, kde = true, bins = 30)
            }
        }

        // Set labels and title
        matplotlib_pyplot.xlabel(request.xLabel ?: request.x)
        matplotlib_pyplot.ylabel(request.yLabel ?: request.y)
        if (request.title != null) {
            matplotlib_pyplot.title(request.title)
        }
        matplotlib_pyplot.legend()
        matplotlib_pyplot.tight_layout()

        // Save chart
        val extension = if (request.format == ChartFormat.SVG) "svg" else "png"
        val filename = "${UUID.randomUUID()}.$extension"
        val outputFile = File(outputDir, filename)

        matplotlib_pyplot.savefig(
            outputFile.absolutePath,
            dpi = 100,
            bbox_inches = "tight"
        )
        matplotlib_pyplot.close()

        return outputFile
    }

    /**
     * Generate interactive chart using plotly.
     */
    private fun generateInteractiveChart(df: dynamic, request: ChartRequest): File {
        val fig = when (request.chartType) {
            ChartType.LINE -> {
                plotly_express.line(
                    df,
                    x = request.x,
                    y = request.y,
                    color = request.groupBy,
                    title = request.title
                )
            }
            ChartType.BAR -> {
                plotly_express.bar(
                    df,
                    x = request.x,
                    y = request.y,
                    color = request.groupBy,
                    title = request.title
                )
            }
            ChartType.SCATTER -> {
                plotly_express.scatter(
                    df,
                    x = request.x,
                    y = request.y,
                    color = request.groupBy,
                    title = request.title
                )
            }
            ChartType.BOX -> {
                plotly_express.box(
                    df,
                    y = request.y,
                    title = request.title
                )
            }
            ChartType.HISTOGRAM -> {
                plotly_express.histogram(
                    df,
                    x = request.x,
                    nbins = 30,
                    title = request.title
                )
            }
            else -> {
                // Default to scatter for unsupported types
                plotly_express.scatter(df, x = request.x, y = request.y, title = request.title)
            }
        }

        // Update layout
        fig.update_layout(
            width = request.width,
            height = request.height,
            xaxis_title = request.xLabel ?: request.x,
            yaxis_title = request.yLabel ?: request.y
        )

        // Save to HTML
        val filename = "${UUID.randomUUID()}.html"
        val outputFile = File(outputDir, filename)
        fig.write_html(outputFile.absolutePath)

        return outputFile
    }

    /**
     * Generate chart data as JSON.
     */
    private fun generateChartJson(df: dynamic, request: ChartRequest): File {
        val xData = df[request.x].tolist()
        val yData = df[request.y].tolist()

        val chartData = mapOf(
            "type" to request.chartType.toString(),
            "x" to xData,
            "y" to yData,
            "xLabel" to (request.xLabel ?: request.x),
            "yLabel" to (request.yLabel ?: request.y),
            "title" to request.title
        )

        val json = kotlinx.serialization.json.Json.encodeToString(
            kotlinx.serialization.serializer(),
            chartData
        )

        val filename = "${UUID.randomUUID()}.json"
        val outputFile = File(outputDir, filename)
        outputFile.writeText(json)

        return outputFile
    }

    /**
     * Generate heatmap.
     *
     * @param dataService Data service instance
     * @param request Heatmap generation request
     * @return Chart response
     */
    suspend fun generateHeatmap(
        dataService: DataService,
        request: HeatmapRequest
    ): ChartResponse = withContext(Dispatchers.IO) {
        logger.info { "Generating heatmap for dataset ${request.dataset}" }

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

            val selectedDf = df[columns]

            // Compute correlation matrix
            val corrMatrix = selectedDf.corr()

            // Generate heatmap
            val chartPath = when (request.format) {
                ChartFormat.PNG, ChartFormat.SVG -> generateStaticHeatmap(corrMatrix, request)
                ChartFormat.HTML -> generateInteractiveHeatmap(corrMatrix, request)
                ChartFormat.JSON -> generateHeatmapJson(corrMatrix, columns)
            }

            ChartResponse(
                chartUrl = "/charts/${chartPath.name}",
                chartType = ChartType.SCATTER, // Using SCATTER as placeholder
                width = 800,
                height = 600,
                format = request.format,
                data = if (request.format == ChartFormat.JSON) chartPath.readText() else null
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to generate heatmap" }
            throw PythonExecutionException("Heatmap generation failed: ${e.message}", e)
        }
    }

    /**
     * Generate static heatmap using seaborn.
     */
    private fun generateStaticHeatmap(corrMatrix: dynamic, request: HeatmapRequest): File {
        matplotlib_pyplot.figure(Pair(10, 8))

        seaborn.heatmap(
            corrMatrix,
            annot = request.annotate,
            fmt = ".2f",
            cmap = request.colormap,
            cbar = true
        )

        if (request.title != null) {
            matplotlib_pyplot.title(request.title)
        }
        matplotlib_pyplot.tight_layout()

        val extension = if (request.format == ChartFormat.SVG) "svg" else "png"
        val filename = "${UUID.randomUUID()}.$extension"
        val outputFile = File(outputDir, filename)

        matplotlib_pyplot.savefig(outputFile.absolutePath, dpi = 100, bbox_inches = "tight")
        matplotlib_pyplot.close()

        return outputFile
    }

    /**
     * Generate interactive heatmap using plotly.
     */
    private fun generateInteractiveHeatmap(corrMatrix: dynamic, request: HeatmapRequest): File {
        val heatmap = plotly_go.Heatmap(
            z = corrMatrix.values,
            x = corrMatrix.columns.tolist(),
            y = corrMatrix.index.tolist(),
            colorscale = request.colormap
        )

        val fig = plotly_go.Figure(listOf(heatmap))

        fig.update_layout(
            title = request.title ?: "Correlation Heatmap",
            width = 800,
            height = 600
        )

        val filename = "${UUID.randomUUID()}.html"
        val outputFile = File(outputDir, filename)
        fig.write_html(outputFile.absolutePath)

        return outputFile
    }

    /**
     * Generate heatmap data as JSON.
     */
    private fun generateHeatmapJson(corrMatrix: dynamic, columns: List<String>): File {
        val values = corrMatrix.values.tolist()

        val heatmapData = mapOf(
            "type" to "heatmap",
            "data" to values,
            "labels" to columns
        )

        val json = kotlinx.serialization.json.Json.encodeToString(
            kotlinx.serialization.serializer(),
            heatmapData
        )

        val filename = "${UUID.randomUUID()}.json"
        val outputFile = File(outputDir, filename)
        outputFile.writeText(json)

        return outputFile
    }

    /**
     * Generate distribution visualization.
     *
     * @param dataService Data service instance
     * @param request Distribution request
     * @return Chart response
     */
    suspend fun generateDistribution(
        dataService: DataService,
        request: DistributionRequest
    ): ChartResponse = withContext(Dispatchers.IO) {
        logger.info { "Generating ${request.chartType} distribution for ${request.column}" }

        try {
            val df = dataService.getDataFrame(request.dataset)
            validateColumns(df, listOf(request.column))

            val chartPath = when (request.format) {
                ChartFormat.PNG, ChartFormat.SVG -> generateStaticDistribution(df, request)
                ChartFormat.HTML -> generateInteractiveDistribution(df, request)
                ChartFormat.JSON -> generateDistributionJson(df, request)
            }

            ChartResponse(
                chartUrl = "/charts/${chartPath.name}",
                chartType = ChartType.HISTOGRAM,
                width = 800,
                height = 600,
                format = request.format,
                data = if (request.format == ChartFormat.JSON) chartPath.readText() else null
            )

        } catch (e: Exception) {
            logger.error(e) { "Failed to generate distribution" }
            throw PythonExecutionException("Distribution generation failed: ${e.message}", e)
        }
    }

    /**
     * Generate static distribution plot.
     */
    private fun generateStaticDistribution(df: dynamic, request: DistributionRequest): File {
        matplotlib_pyplot.figure(Pair(10, 6))

        when (request.chartType) {
            DistributionChart.HISTOGRAM -> {
                seaborn.histplot(df, x = request.column, kde = request.kde, bins = request.bins)
            }
            DistributionChart.BOX -> {
                seaborn.boxplot(df, y = request.column)
            }
            DistributionChart.VIOLIN -> {
                seaborn.violinplot(df, y = request.column)
            }
            DistributionChart.KDE -> {
                seaborn.kdeplot(df, x = request.column)
            }
        }

        matplotlib_pyplot.xlabel(request.column)
        matplotlib_pyplot.title("Distribution of ${request.column}")
        matplotlib_pyplot.tight_layout()

        val extension = if (request.format == ChartFormat.SVG) "svg" else "png"
        val filename = "${UUID.randomUUID()}.$extension"
        val outputFile = File(outputDir, filename)

        matplotlib_pyplot.savefig(outputFile.absolutePath, dpi = 100, bbox_inches = "tight")
        matplotlib_pyplot.close()

        return outputFile
    }

    /**
     * Generate interactive distribution plot.
     */
    private fun generateInteractiveDistribution(df: dynamic, request: DistributionRequest): File {
        val fig = when (request.chartType) {
            DistributionChart.HISTOGRAM, DistributionChart.KDE -> {
                plotly_express.histogram(
                    df,
                    x = request.column,
                    nbins = request.bins,
                    title = "Distribution of ${request.column}"
                )
            }
            DistributionChart.BOX, DistributionChart.VIOLIN -> {
                plotly_express.box(
                    df,
                    y = request.column,
                    title = "Distribution of ${request.column}"
                )
            }
        }

        fig.update_layout(width = 800, height = 600)

        val filename = "${UUID.randomUUID()}.html"
        val outputFile = File(outputDir, filename)
        fig.write_html(outputFile.absolutePath)

        return outputFile
    }

    /**
     * Generate distribution data as JSON.
     */
    private fun generateDistributionJson(df: dynamic, request: DistributionRequest): File {
        val values = df[request.column].dropna().tolist()

        val distData = mapOf(
            "type" to request.chartType.toString(),
            "column" to request.column,
            "values" to values,
            "bins" to request.bins
        )

        val json = kotlinx.serialization.json.Json.encodeToString(
            kotlinx.serialization.serializer(),
            distData
        )

        val filename = "${UUID.randomUUID()}.json"
        val outputFile = File(outputDir, filename)
        outputFile.writeText(json)

        return outputFile
    }

    /**
     * Validate that columns exist in DataFrame.
     */
    private fun validateColumns(df: dynamic, columns: List<String>) {
        val dfColumns = df.columns.tolist() as List<String>
        val missing = columns.filter { it !in dfColumns }
        if (missing.isNotEmpty()) {
            throw ValidationException("Columns not found: ${missing.joinToString()}")
        }
    }

    /**
     * Clean up old chart files.
     */
    suspend fun cleanupOldCharts(maxAgeHours: Int = 24) = withContext(Dispatchers.IO) {
        val maxAgeMillis = maxAgeHours * 60 * 60 * 1000L
        val now = System.currentTimeMillis()

        outputDir.listFiles()?.forEach { file ->
            if (now - file.lastModified() > maxAgeMillis) {
                file.delete()
                logger.debug { "Deleted old chart: ${file.name}" }
            }
        }
    }

    /**
     * Check service health.
     */
    fun isHealthy(): Boolean {
        return try {
            outputDir.exists() && outputDir.canWrite()
        } catch (e: Exception) {
            logger.error(e) { "Health check failed" }
            false
        }
    }
}

/**
 * External matplotlib function.
 */
@JsName("fill_between")
external fun dynamic.fill_between(x: dynamic, y: dynamic, alpha: Double): dynamic
