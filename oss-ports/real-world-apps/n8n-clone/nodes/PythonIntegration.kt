package dev.elide.workflow.nodes.python

import dev.elide.workflow.models.*
import dev.elide.workflow.nodes.*
import kotlinx.serialization.json.*
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Python node for executing Python scripts
 * Demonstrates Elide's polyglot capabilities
 */
class PythonNode : NodeBase() {
    override val description = NodeDescription(
        name = "python",
        displayName = "Python",
        description = "Execute Python code for data science operations",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Python",
            color = "#3776AB"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "mode",
                displayName = "Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("code"),
                options = listOf(
                    PropertyOption("Execute Code", "code"),
                    PropertyOption("Execute Script File", "file")
                )
            ),
            NodeProperty(
                name = "code",
                displayName = "Python Code",
                type = PropertyType.CODE,
                default = JsonPrimitive("# Python code here\nimport json\nresult = {\"success\": True}\nprint(json.dumps(result))"),
                displayOptions = DisplayOptions(
                    show = mapOf("mode" to listOf(JsonPrimitive("code")))
                )
            ),
            NodeProperty(
                name = "scriptPath",
                displayName = "Script Path",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                displayOptions = DisplayOptions(
                    show = mapOf("mode" to listOf(JsonPrimitive("file")))
                )
            ),
            NodeProperty(
                name = "packages",
                displayName = "Required Packages",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "Comma-separated list of packages (e.g., pandas,numpy,scikit-learn)",
                placeholder = "pandas,numpy,matplotlib"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val mode = getNodeParameterString(context, "mode", "code")
        val packages = getNodeParameterString(context, "packages", "")
            .split(",")
            .filter { it.isNotBlank() }
            .map { it.trim() }

        // Install required packages if needed
        if (packages.isNotEmpty()) {
            installPackages(packages)
        }

        val results = mutableListOf<NodeExecutionData>()

        for (item in context.inputData) {
            try {
                val result = when (mode) {
                    "code" -> {
                        val code = getNodeParameterString(context, "code")
                        executePythonCode(code, item.json)
                    }
                    "file" -> {
                        val scriptPath = getNodeParameterString(context, "scriptPath")
                        executePythonScript(scriptPath, item.json)
                    }
                    else -> return createErrorResult("Unknown mode: $mode")
                }

                results.add(createOutputData(result))

            } catch (e: Exception) {
                return createErrorResult("Python execution failed: ${e.message}")
            }
        }

        return NodeExecutionResult(data = results)
    }

    private fun executePythonCode(code: String, inputData: JsonObject): JsonObject {
        // Create temporary Python script
        val tempFile = File.createTempFile("elide_workflow_", ".py")
        tempFile.deleteOnExit()

        // Prepare script with input data
        val scriptContent = """
import json
import sys

# Input data from workflow
input_data = ${inputData.toString()}

# User code
${code}

# Output result (expecting 'result' variable)
if 'result' in locals():
    print(json.dumps(result))
else:
    print(json.dumps({"error": "No 'result' variable defined"}))
        """.trimIndent()

        tempFile.writeText(scriptContent)

        // Execute Python script
        return executePythonFile(tempFile.absolutePath)
    }

    private fun executePythonScript(scriptPath: String, inputData: JsonObject): JsonObject {
        val scriptFile = File(scriptPath)
        if (!scriptFile.exists()) {
            throw Exception("Script file not found: $scriptPath")
        }

        // Create wrapper script that provides input data
        val wrapperFile = File.createTempFile("elide_workflow_wrapper_", ".py")
        wrapperFile.deleteOnExit()

        val wrapperContent = """
import json
import sys

# Add script directory to path
sys.path.insert(0, '${scriptFile.parent}')

# Input data
input_data = ${inputData.toString()}

# Execute user script
exec(open('${scriptFile.absolutePath}').read())

# Output result
if 'result' in locals():
    print(json.dumps(result))
else:
    print(json.dumps({"error": "No 'result' variable defined"}))
        """.trimIndent()

        wrapperFile.writeText(wrapperContent)

        return executePythonFile(wrapperFile.absolutePath)
    }

    private fun executePythonFile(filePath: String): JsonObject {
        val process = ProcessBuilder("python3", filePath)
            .redirectErrorStream(true)
            .start()

        val output = process.inputStream.bufferedReader().readText()
        val exitCode = process.waitFor(30, TimeUnit.SECONDS)

        if (!exitCode) {
            process.destroy()
            throw Exception("Python execution timeout")
        }

        if (process.exitValue() != 0) {
            throw Exception("Python execution failed: $output")
        }

        // Parse JSON output
        return try {
            Json.parseToJsonElement(output.trim()).jsonObject
        } catch (e: Exception) {
            buildJsonObject {
                put("output", JsonPrimitive(output.trim()))
                put("raw", JsonPrimitive(true))
            }
        }
    }

    private fun installPackages(packages: List<String>) {
        packages.forEach { pkg ->
            try {
                val process = ProcessBuilder("pip3", "install", pkg)
                    .redirectErrorStream(true)
                    .start()

                process.waitFor(60, TimeUnit.SECONDS)
            } catch (e: Exception) {
                println("Warning: Failed to install package $pkg: ${e.message}")
            }
        }
    }
}

/**
 * Pandas DataFrame node for data manipulation
 */
class PandasNode : NodeBase() {
    override val description = NodeDescription(
        name = "pandas",
        displayName = "Pandas DataFrame",
        description = "Process data using Pandas DataFrame operations",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Pandas",
            color = "#150458"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("query"),
                options = listOf(
                    PropertyOption("Query", "query"),
                    PropertyOption("Group By", "groupBy"),
                    PropertyOption("Aggregate", "aggregate"),
                    PropertyOption("Merge", "merge"),
                    PropertyOption("Pivot", "pivot"),
                    PropertyOption("Custom", "custom")
                )
            ),
            NodeProperty(
                name = "query",
                displayName = "Query Expression",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "Pandas query expression (e.g., age > 25 and city == 'NYC')",
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("query")))
                )
            ),
            NodeProperty(
                name = "groupByColumns",
                displayName = "Group By Columns",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "Comma-separated column names",
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("groupBy")))
                )
            ),
            NodeProperty(
                name = "aggregateFunction",
                displayName = "Aggregate Function",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("sum"),
                options = listOf(
                    PropertyOption("Sum", "sum"),
                    PropertyOption("Mean", "mean"),
                    PropertyOption("Count", "count"),
                    PropertyOption("Min", "min"),
                    PropertyOption("Max", "max"),
                    PropertyOption("Std", "std")
                ),
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("aggregate"), JsonPrimitive("groupBy")))
                )
            ),
            NodeProperty(
                name = "customCode",
                displayName = "Custom Pandas Code",
                type = PropertyType.CODE,
                default = JsonPrimitive("# df is the DataFrame\nresult = df"),
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("custom")))
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // Convert input data to DataFrame
        val dataJson = buildJsonArray {
            context.inputData.forEach { item ->
                add(item.json)
            }
        }

        val operation = getNodeParameterString(context, "operation", "query")

        val pythonCode = when (operation) {
            "query" -> {
                val query = getNodeParameterString(context, "query")
                """
import pandas as pd
import json

data = $dataJson
df = pd.DataFrame(data)
result_df = df.query('$query')
result = result_df.to_dict('records')
print(json.dumps(result))
                """.trimIndent()
            }

            "groupBy" -> {
                val columns = getNodeParameterString(context, "groupByColumns")
                    .split(",").map { it.trim() }
                val aggFunc = getNodeParameterString(context, "aggregateFunction", "sum")

                """
import pandas as pd
import json

data = $dataJson
df = pd.DataFrame(data)
result_df = df.groupby(${columns.toString()}).${aggFunc}()
result = result_df.reset_index().to_dict('records')
print(json.dumps(result))
                """.trimIndent()
            }

            "aggregate" -> {
                val aggFunc = getNodeParameterString(context, "aggregateFunction", "sum")

                """
import pandas as pd
import json

data = $dataJson
df = pd.DataFrame(data)
result_dict = df.${aggFunc}().to_dict()
result = [result_dict]
print(json.dumps(result))
                """.trimIndent()
            }

            "custom" -> {
                val customCode = getNodeParameterString(context, "customCode")

                """
import pandas as pd
import json

data = $dataJson
df = pd.DataFrame(data)

# User code
$customCode

# Convert result to JSON
if isinstance(result, pd.DataFrame):
    output = result.to_dict('records')
elif isinstance(result, pd.Series):
    output = result.to_dict()
else:
    output = result

print(json.dumps(output))
                """.trimIndent()
            }

            else -> return createErrorResult("Unknown operation: $operation")
        }

        // Execute Python code
        val tempFile = File.createTempFile("pandas_", ".py")
        tempFile.deleteOnExit()
        tempFile.writeText(pythonCode)

        try {
            val process = ProcessBuilder("python3", tempFile.absolutePath)
                .redirectErrorStream(true)
                .start()

            val output = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor(30, TimeUnit.SECONDS)

            if (!exitCode) {
                process.destroy()
                return createErrorResult("Pandas execution timeout")
            }

            if (process.exitValue() != 0) {
                return createErrorResult("Pandas execution failed: $output")
            }

            // Parse result
            val resultArray = Json.parseToJsonElement(output.trim()).jsonArray
            val results = resultArray.map { element ->
                createOutputData(element.jsonObject)
            }

            return NodeExecutionResult(data = results)

        } catch (e: Exception) {
            return createErrorResult("Pandas operation failed: ${e.message}")
        }
    }
}

/**
 * NumPy node for numerical operations
 */
class NumPyNode : NodeBase() {
    override val description = NodeDescription(
        name = "numpy",
        displayName = "NumPy",
        description = "Perform numerical computations with NumPy",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "NumPy",
            color = "#013243"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("mean"),
                options = listOf(
                    PropertyOption("Mean", "mean"),
                    PropertyOption("Median", "median"),
                    PropertyOption("Standard Deviation", "std"),
                    PropertyOption("Min", "min"),
                    PropertyOption("Max", "max"),
                    PropertyOption("Sum", "sum"),
                    PropertyOption("Product", "prod"),
                    PropertyOption("Custom", "custom")
                )
            ),
            NodeProperty(
                name = "arrayField",
                displayName = "Array Field",
                type = PropertyType.STRING,
                default = JsonPrimitive("values"),
                description = "Field containing the array of numbers"
            ),
            NodeProperty(
                name = "customCode",
                displayName = "Custom NumPy Code",
                type = PropertyType.CODE,
                default = JsonPrimitive("# arr is the NumPy array\nresult = arr"),
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("custom")))
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val operation = getNodeParameterString(context, "operation", "mean")
        val arrayField = getNodeParameterString(context, "arrayField", "values")

        val results = mutableListOf<NodeExecutionData>()

        for (item in context.inputData) {
            try {
                val arrayData = item.json[arrayField]
                    ?: return createErrorResult("Array field not found: $arrayField")

                val pythonCode = when (operation) {
                    "custom" -> {
                        val customCode = getNodeParameterString(context, "customCode")
                        """
import numpy as np
import json

data = $arrayData
arr = np.array(data)

# User code
$customCode

# Output
print(json.dumps({"result": result.tolist() if hasattr(result, 'tolist') else result}))
                        """.trimIndent()
                    }

                    else -> """
import numpy as np
import json

data = $arrayData
arr = np.array(data)
result = np.$operation(arr)

print(json.dumps({"result": result.tolist() if hasattr(result, 'tolist') else float(result)}))
                    """.trimIndent()
                }

                // Execute
                val tempFile = File.createTempFile("numpy_", ".py")
                tempFile.deleteOnExit()
                tempFile.writeText(pythonCode)

                val process = ProcessBuilder("python3", tempFile.absolutePath)
                    .redirectErrorStream(true)
                    .start()

                val output = process.inputStream.bufferedReader().readText()
                val exitCode = process.waitFor(30, TimeUnit.SECONDS)

                if (!exitCode) {
                    process.destroy()
                    return createErrorResult("NumPy execution timeout")
                }

                if (process.exitValue() != 0) {
                    return createErrorResult("NumPy execution failed: $output")
                }

                val resultJson = Json.parseToJsonElement(output.trim()).jsonObject
                results.add(createOutputData(resultJson))

            } catch (e: Exception) {
                return createErrorResult("NumPy operation failed: ${e.message}")
            }
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Scikit-learn node for machine learning operations
 */
class ScikitLearnNode : NodeBase() {
    override val description = NodeDescription(
        name = "sklearn",
        displayName = "Scikit-Learn",
        description = "Machine learning with scikit-learn",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Scikit-Learn",
            color = "#F7931E"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("predict"),
                options = listOf(
                    PropertyOption("Train Model", "train"),
                    PropertyOption("Predict", "predict"),
                    PropertyOption("Evaluate", "evaluate"),
                    PropertyOption("Clustering", "clustering")
                )
            ),
            NodeProperty(
                name = "modelType",
                displayName = "Model Type",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("linear_regression"),
                options = listOf(
                    PropertyOption("Linear Regression", "linear_regression"),
                    PropertyOption("Logistic Regression", "logistic_regression"),
                    PropertyOption("Random Forest", "random_forest"),
                    PropertyOption("SVM", "svm"),
                    PropertyOption("KMeans", "kmeans")
                )
            ),
            NodeProperty(
                name = "featuresField",
                displayName = "Features Field",
                type = PropertyType.STRING,
                default = JsonPrimitive("features"),
                description = "Field containing feature array"
            ),
            NodeProperty(
                name = "targetField",
                displayName = "Target Field",
                type = PropertyType.STRING,
                default = JsonPrimitive("target"),
                description = "Field containing target values"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val operation = getNodeParameterString(context, "operation", "predict")
        val modelType = getNodeParameterString(context, "modelType", "linear_regression")
        val featuresField = getNodeParameterString(context, "featuresField", "features")
        val targetField = getNodeParameterString(context, "targetField", "target")

        // Prepare data
        val dataJson = buildJsonArray {
            context.inputData.forEach { item ->
                add(item.json)
            }
        }

        val pythonCode = """
import json
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error

data = $dataJson

# Extract features and targets
X = [item['$featuresField'] for item in data]
y = [item.get('$targetField') for item in data] if '$targetField' in data[0] else None

X = np.array(X)
if y:
    y = np.array(y)

# Select model
if '$modelType' == 'linear_regression':
    model = LinearRegression()
elif '$modelType' == 'logistic_regression':
    model = LogisticRegression()
elif '$modelType' == 'random_forest':
    model = RandomForestClassifier()
elif '$modelType' == 'svm':
    model = SVC()
elif '$modelType' == 'kmeans':
    model = KMeans(n_clusters=3)

# Perform operation
if '$operation' == 'train':
    model.fit(X, y)
    result = {"status": "trained", "model_type": "$modelType"}

elif '$operation' == 'predict':
    # Assume model is pre-trained (in production, load from storage)
    if y is not None:
        model.fit(X, y)
    predictions = model.predict(X).tolist()
    result = {"predictions": predictions}

elif '$operation' == 'evaluate':
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    if '$modelType' in ['linear_regression']:
        score = mean_squared_error(y_test, y_pred)
        metric = "mse"
    else:
        score = accuracy_score(y_test, y_pred)
        metric = "accuracy"

    result = {"metric": metric, "score": float(score)}

elif '$operation' == 'clustering':
    labels = model.fit_predict(X).tolist()
    result = {"labels": labels}

print(json.dumps(result))
        """.trimIndent()

        try {
            val tempFile = File.createTempFile("sklearn_", ".py")
            tempFile.deleteOnExit()
            tempFile.writeText(pythonCode)

            val process = ProcessBuilder("python3", tempFile.absolutePath)
                .redirectErrorStream(true)
                .start()

            val output = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor(60, TimeUnit.SECONDS)

            if (!exitCode) {
                process.destroy()
                return createErrorResult("Scikit-learn execution timeout")
            }

            if (process.exitValue() != 0) {
                return createErrorResult("Scikit-learn execution failed: $output")
            }

            val resultJson = Json.parseToJsonElement(output.trim()).jsonObject
            return NodeExecutionResult(data = listOf(createOutputData(resultJson)))

        } catch (e: Exception) {
            return createErrorResult("Scikit-learn operation failed: ${e.message}")
        }
    }
}
