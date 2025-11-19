package dev.elide.workflow.cli

import dev.elide.workflow.models.*
import dev.elide.workflow.database.*
import dev.elide.workflow.execution.*
import dev.elide.workflow.credentials.*
import dev.elide.workflow.nodes.*
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.*
import kotlinx.serialization.encodeToString
import java.io.File

/**
 * Command-line interface for workflow management
 */
class WorkflowCLI {
    private val databaseManager = DatabaseManager()
    private val workflowRepository = WorkflowRepository()
    private val executionRepository = ExecutionRepositoryImpl()
    private val credentialManager = CredentialManager()
    private val workflowExecutor = WorkflowExecutor(credentialManager, executionRepository)

    init {
        initializeNodes()
    }

    fun run(args: Array<String>) {
        if (args.isEmpty()) {
            printHelp()
            return
        }

        val command = args[0]
        val commandArgs = args.drop(1).toTypedArray()

        runBlocking {
            when (command) {
                "list", "ls" -> listWorkflows()
                "create" -> createWorkflow(commandArgs)
                "execute", "exec" -> executeWorkflow(commandArgs)
                "activate" -> activateWorkflow(commandArgs)
                "deactivate" -> deactivateWorkflow(commandArgs)
                "delete", "rm" -> deleteWorkflow(commandArgs)
                "export" -> exportWorkflow(commandArgs)
                "import" -> importWorkflow(commandArgs)
                "executions" -> listExecutions(commandArgs)
                "credentials" -> manageCredentials(commandArgs)
                "nodes" -> listNodes()
                "help" -> printHelp()
                else -> {
                    println("Unknown command: $command")
                    printHelp()
                }
            }
        }

        databaseManager.close()
    }

    private suspend fun listWorkflows() {
        val workflows = workflowRepository.getAll()
        println("\n┌─────────────────────────────────────┬──────────────────────────┬────────┬───────┐")
        println("│ ID                                  │ Name                     │ Active │ Nodes │")
        println("├─────────────────────────────────────┼──────────────────────────┼────────┼───────┤")

        workflows.forEach { workflow ->
            val id = workflow.id.take(36).padEnd(36)
            val name = workflow.name.take(24).padEnd(24)
            val active = (if (workflow.active) "✓" else "✗").padEnd(6)
            val nodes = workflow.nodes.size.toString().padStart(5)

            println("│ $id │ $name │ $active │ $nodes │")
        }

        println("└─────────────────────────────────────┴──────────────────────────┴────────┴───────┘")
        println("\nTotal: ${workflows.size} workflows")
    }

    private suspend fun createWorkflow(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: create <name> [description]")
            return
        }

        val name = args[0]
        val description = if (args.size > 1) args.drop(1).joinToString(" ") else ""

        val workflow = Workflow(
            name = name,
            description = description,
            nodes = listOf(
                WorkflowNode(
                    name = "Start",
                    type = "manual",
                    position = Position(250.0, 300.0)
                )
            )
        )

        workflowRepository.save(workflow)
        println("Created workflow: ${workflow.id}")
        println("Name: ${workflow.name}")
        println("Description: ${workflow.description}")
    }

    private suspend fun executeWorkflow(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: execute <workflow-id>")
            return
        }

        val workflowId = args[0]
        val workflow = workflowRepository.getById(workflowId)

        if (workflow == null) {
            println("Workflow not found: $workflowId")
            return
        }

        println("Executing workflow: ${workflow.name}")
        println("Please wait...")

        val execution = workflowExecutor.execute(workflow, ExecutionMode.CLI)

        println("\n✓ Execution completed")
        println("Execution ID: ${execution.id}")
        println("Status: ${execution.status}")
        println("Started: ${execution.startedAt}")
        println("Stopped: ${execution.stoppedAt}")

        if (execution.error != null) {
            println("Error: ${execution.error}")
        }

        println("\nResults:")
        execution.data.resultData.forEach { (nodeId, data) ->
            val node = workflow.nodes.find { it.id == nodeId }
            println("  ${node?.name ?: nodeId}: ${data.size} items")
        }
    }

    private suspend fun activateWorkflow(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: activate <workflow-id>")
            return
        }

        val workflowId = args[0]
        val workflow = workflowRepository.getById(workflowId)

        if (workflow == null) {
            println("Workflow not found: $workflowId")
            return
        }

        val updated = workflow.copy(active = true)
        workflowRepository.save(updated)

        println("Activated workflow: ${workflow.name}")
    }

    private suspend fun deactivateWorkflow(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: deactivate <workflow-id>")
            return
        }

        val workflowId = args[0]
        val workflow = workflowRepository.getById(workflowId)

        if (workflow == null) {
            println("Workflow not found: $workflowId")
            return
        }

        val updated = workflow.copy(active = false)
        workflowRepository.save(updated)

        println("Deactivated workflow: ${workflow.name}")
    }

    private suspend fun deleteWorkflow(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: delete <workflow-id>")
            return
        }

        val workflowId = args[0]
        workflowRepository.delete(workflowId)

        println("Deleted workflow: $workflowId")
    }

    private suspend fun exportWorkflow(args: Array<String>) {
        if (args.size < 2) {
            println("Usage: export <workflow-id> <file>")
            return
        }

        val workflowId = args[0]
        val filename = args[1]
        val workflow = workflowRepository.getById(workflowId)

        if (workflow == null) {
            println("Workflow not found: $workflowId")
            return
        }

        val json = Json { prettyPrint = true }
        val jsonString = json.encodeToString(workflow)

        File(filename).writeText(jsonString)
        println("Exported workflow to: $filename")
    }

    private suspend fun importWorkflow(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: import <file>")
            return
        }

        val filename = args[0]
        val file = File(filename)

        if (!file.exists()) {
            println("File not found: $filename")
            return
        }

        val json = Json { ignoreUnknownKeys = true }
        val workflow = json.decodeFromString<Workflow>(file.readText())

        workflowRepository.save(workflow)
        println("Imported workflow: ${workflow.id}")
        println("Name: ${workflow.name}")
    }

    private suspend fun listExecutions(args: Array<String>) {
        val workflowId = args.getOrNull(0)
        val limit = args.getOrNull(1)?.toIntOrNull() ?: 20

        val executions = executionRepository.getExecutions(workflowId, null, limit)

        println("\n┌─────────────────────────────────────┬──────────┬───────────────────────┐")
        println("│ ID                                  │ Status   │ Started               │")
        println("├─────────────────────────────────────┼──────────┼───────────────────────┤")

        executions.forEach { execution ->
            val id = execution.id.take(36).padEnd(36)
            val status = execution.status.name.take(8).padEnd(8)
            val started = execution.startedAt.toString().take(21).padEnd(21)

            println("│ $id │ $status │ $started │")
        }

        println("└─────────────────────────────────────┴──────────┴───────────────────────┘")
        println("\nTotal: ${executions.size} executions")
    }

    private suspend fun manageCredentials(args: Array<String>) {
        if (args.isEmpty()) {
            println("Usage: credentials <list|create|delete>")
            return
        }

        when (args[0]) {
            "list" -> {
                val credentials = credentialManager.getAllCredentials()
                println("\n┌─────────────────────────────────────┬──────────────────────────┬─────────────────┐")
                println("│ ID                                  │ Name                     │ Type            │")
                println("├─────────────────────────────────────┼──────────────────────────┼─────────────────┤")

                credentials.forEach { credential ->
                    val id = credential.id.take(36).padEnd(36)
                    val name = credential.name.take(24).padEnd(24)
                    val type = credential.type.take(15).padEnd(15)

                    println("│ $id │ $name │ $type │")
                }

                println("└─────────────────────────────────────┴──────────────────────────┴─────────────────┘")
                println("\nTotal: ${credentials.size} credentials")
            }

            "delete" -> {
                if (args.size < 2) {
                    println("Usage: credentials delete <id>")
                    return
                }

                credentialManager.deleteCredential(args[1])
                println("Deleted credential: ${args[1]}")
            }
        }
    }

    private fun listNodes() {
        val nodeTypes = NodeRegistry.getAllNodeTypes()

        println("\n┌─────────────────────────────────────┬──────────────────────────────────────────────┐")
        println("│ Type                                │ Display Name                                 │")
        println("├─────────────────────────────────────┼──────────────────────────────────────────────┤")

        nodeTypes.sortedBy { it.group.name }.forEach { nodeType ->
            val type = nodeType.name.take(35).padEnd(35)
            val displayName = nodeType.displayName.take(44).padEnd(44)

            println("│ $type │ $displayName │")
        }

        println("└─────────────────────────────────────┴──────────────────────────────────────────────┘")
        println("\nTotal: ${nodeTypes.size} node types")

        // Group by category
        println("\nBy Category:")
        nodeTypes.groupBy { it.group }.forEach { (group, nodes) ->
            println("  ${group.name}: ${nodes.size} nodes")
        }
    }

    private fun printHelp() {
        println("""
        Elide Workflow CLI

        Usage: workflow-cli <command> [args...]

        Commands:
          list, ls                    List all workflows
          create <name> [desc]        Create a new workflow
          execute <id>                Execute a workflow
          activate <id>               Activate a workflow
          deactivate <id>             Deactivate a workflow
          delete <id>                 Delete a workflow
          export <id> <file>          Export workflow to JSON file
          import <file>               Import workflow from JSON file
          executions [workflow-id]    List executions
          credentials <list|delete>   Manage credentials
          nodes                       List available node types
          help                        Show this help message

        Examples:
          workflow-cli list
          workflow-cli create "My Workflow" "Description"
          workflow-cli execute abc-123
          workflow-cli export abc-123 workflow.json
          workflow-cli import workflow.json
        """.trimIndent())
    }
}

/**
 * Main entry point
 */
fun main(args: Array<String>) {
    val cli = WorkflowCLI()
    cli.run(args)
}
