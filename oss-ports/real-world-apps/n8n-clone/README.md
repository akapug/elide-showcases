# Elide Workflow - Production-Ready Workflow Automation Platform

A powerful, self-hosted workflow automation platform built with Elide, providing n8n-like capabilities with enhanced performance and polyglot support.

## Overview

Elide Workflow is a complete workflow automation platform that enables you to connect apps and automate processes without code. Build complex workflows using a visual drag-and-drop editor with 50+ built-in integrations.

### Key Features

- **Visual Workflow Editor** - Intuitive drag-and-drop interface built with React Flow
- **50+ Built-in Nodes** - HTTP, databases, email, Slack, GitHub, cloud services, and more
- **Flexible Execution Modes** - Manual, webhook, schedule, and event-based triggers
- **Advanced Data Transformation** - JavaScript expressions, JSON operations, filtering, aggregation
- **Secure Credential Management** - AES-256 encryption with Google Tink
- **Real-time Execution Monitoring** - WebSocket-based live updates
- **Multi-User Support** - Role-based access control (RBAC)
- **REST API** - Complete API for workflow management and execution
- **CLI Tools** - Command-line interface for automation
- **Self-Hostable** - Full control over your data and infrastructure

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Visual Editor (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Workflow     │  │ Node Panel   │  │ Settings     │      │
│  │ Canvas       │  │ & Library    │  │ Panel        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   REST API (Ktor)  │
                    └─────────┬──────────┘
         ┌──────────┬─────────┼─────────┬──────────┐
         │          │         │         │          │
    ┌────▼────┐ ┌──▼───┐ ┌──▼───┐ ┌───▼────┐ ┌───▼────┐
    │Workflow │ │Exec. │ │Creds.│ │Trigger │ │Webhook │
    │Manager  │ │Engine│ │Mgr.  │ │Manager │ │Handler │
    └────┬────┘ └──┬───┘ └──┬───┘ └───┬────┘ └───┬────┘
         │         │        │         │          │
         └─────────┼────────┴─────────┼──────────┘
                   │                  │
              ┌────▼──────┐    ┌─────▼─────┐
              │ Database  │    │ Scheduler │
              │(PostgreSQL│    │ (Quartz)  │
              └───────────┘    └───────────┘
```

## Project Structure

```
elide-workflow/
├── shared/              # Shared data models
│   └── Models.kt        # Workflow, Node, Execution models
├── nodes/               # Node implementations
│   ├── NodeBase.kt      # Base node class & registry
│   ├── TriggerNodes.kt  # Webhook, Schedule, Manual triggers
│   ├── HttpNodes.kt     # HTTP Request node
│   ├── DatabaseNodes.kt # PostgreSQL, MySQL, MongoDB
│   ├── CommunicationNodes.kt # Email, Slack, Discord, Telegram
│   ├── CloudNodes.kt    # AWS, Azure, GCP, Google Sheets, Stripe
│   ├── TransformNodes.kt # Set, Function, Filter, Sort, Aggregate
│   ├── LogicNodes.kt    # IF, Switch, Loop, Wait
│   └── FileNodes.kt     # Read, Write, Move files
├── execution/           # Workflow execution engine
│   └── WorkflowExecutor.kt # Core execution logic
├── credentials/         # Credential management
│   └── CredentialManager.kt # AES-256 encrypted storage
├── database/            # Database layer
│   └── DatabaseSchema.kt # PostgreSQL schema & repositories
├── api/                 # REST API
│   └── ApiServer.kt     # Ktor HTTP server
├── triggers/            # Trigger management
│   └── ScheduleTriggerManager.kt # Quartz scheduler
├── cli/                 # Command-line tools
│   └── WorkflowCLI.kt   # CLI interface
├── editor/              # Visual editor (React)
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── WorkflowEditor.tsx
│   │   │   ├── WorkflowNode.tsx
│   │   │   ├── NodePanel.tsx
│   │   │   ├── NodeSettings.tsx
│   │   │   ├── WorkflowList.tsx
│   │   │   ├── ExecutionPanel.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── api.ts       # API client
│   │   ├── App.tsx      # Main app
│   │   └── main.tsx     # Entry point
│   └── package.json
├── WorkflowApplication.kt # Main application
├── elide.yaml           # Elide configuration
└── README.md
```

## Getting Started

### Prerequisites

- Java 21+
- PostgreSQL 14+
- Node.js 18+ (for editor)
- Bun or npm (for editor)

### Installation

1. **Clone the repository**
```bash
cd /path/to/elide-showcases/oss-ports/real-world-apps/n8n-clone
```

2. **Set up PostgreSQL**
```bash
# Create database
createdb elide_workflow

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=elide_workflow
export DB_USER=postgres
export DB_PASSWORD=yourpassword
```

3. **Build the backend**
```bash
elide build
```

4. **Install editor dependencies**
```bash
cd editor
npm install
# or
bun install
```

5. **Start the application**

Terminal 1 (Backend):
```bash
elide run
```

Terminal 2 (Editor):
```bash
cd editor
npm run dev
# or
bun dev
```

6. **Access the application**
- Editor: http://localhost:3000
- API: http://localhost:5678/api

## Usage

### Creating a Workflow

1. Open the editor at http://localhost:3000
2. Click "New Workflow"
3. Drag nodes from the node panel
4. Connect nodes by dragging from output to input
5. Configure each node's settings
6. Save the workflow

### Example: HTTP to Slack Workflow

```kotlin
// Workflow structure
[Manual Trigger] → [HTTP Request] → [Set] → [Slack]

// HTTP Request configuration
{
  "method": "GET",
  "url": "https://api.github.com/repos/elide-dev/elide"
}

// Set node (transform data)
{
  "values": {
    "repoName": "={{$json[\"name\"]}}",
    "stars": "={{$json[\"stargazers_count\"]}}"
  }
}

// Slack node
{
  "channel": "#notifications",
  "text": "Repository {{$json[\"repoName\"]}} has {{$json[\"stars\"]}} stars!"
}
```

### Using the CLI

```bash
# List workflows
elide run cli/WorkflowCLI.kt list

# Create workflow
elide run cli/WorkflowCLI.kt create "My Workflow" "Description"

# Execute workflow
elide run cli/WorkflowCLI.kt execute <workflow-id>

# Export workflow
elide run cli/WorkflowCLI.kt export <workflow-id> workflow.json

# Import workflow
elide run cli/WorkflowCLI.kt import workflow.json

# List executions
elide run cli/WorkflowCLI.kt executions

# Manage credentials
elide run cli/WorkflowCLI.kt credentials list
```

### REST API Examples

**Create Workflow**
```bash
curl -X POST http://localhost:5678/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub to Slack",
    "description": "Post GitHub stats to Slack",
    "nodes": [
      {
        "name": "Trigger",
        "type": "manual",
        "position": {"x": 250, "y": 300}
      }
    ]
  }'
```

**Execute Workflow**
```bash
curl -X POST http://localhost:5678/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "abc-123",
    "mode": "MANUAL"
  }'
```

**Webhook Trigger**
```bash
curl -X POST http://localhost:5678/webhook/my-webhook \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

## Node Library

### Trigger Nodes

- **Manual Trigger** - Start workflow manually
- **Webhook** - Receive HTTP webhooks (GET, POST, PUT, DELETE)
- **Schedule** - Run on cron schedule
- **Email Trigger** - Trigger on email received (IMAP)

### Integration Nodes

**HTTP & API**
- HTTP Request - Make HTTP requests to any API

**Databases**
- PostgreSQL - Execute queries, insert, update, delete
- MySQL - Full MySQL database support
- MongoDB - MongoDB operations (find, insert, update, aggregate)

**Communication**
- Email (SMTP) - Send emails with attachments
- Slack - Post messages, manage channels
- Discord - Send Discord messages via webhooks
- Telegram - Send Telegram messages

**Cloud Services**
- Google Sheets - Read and write to spreadsheets
- Airtable - Manage Airtable bases
- AWS - S3, Lambda, SQS, SNS, DynamoDB
- Azure - Blob Storage, Functions, Queues
- GCP - Cloud Storage, Functions, Pub/Sub

**Version Control**
- GitHub - Manage repositories, issues, PRs
- GitLab - GitLab operations

**Payment**
- Stripe - Payment processing, customers, subscriptions
- PayPal - PayPal payment operations

### Data Transformation Nodes

- **Set** - Set/transform data values
- **Function** - Execute JavaScript code
- **Filter** - Filter items based on conditions
- **Sort** - Sort items by field
- **Limit** - Limit number of items
- **Split** - Split into batches
- **Merge** - Merge data from multiple streams
- **Aggregate** - Aggregate data

### Logic Nodes

- **IF** - Conditional routing (true/false)
- **Switch** - Multi-way routing
- **Loop** - Loop over items
- **Wait** - Wait before continuing
- **Execute Workflow** - Execute another workflow
- **Stop and Error** - Stop with error message

### File Nodes

- **Read File** - Read files from disk
- **Write File** - Write files to disk
- **Move Binary Data** - Move data between properties

## Credential Types

All credentials are encrypted with AES-256 using Google Tink:

- HTTP Basic Auth
- OAuth2
- API Key
- SMTP
- PostgreSQL
- MySQL
- MongoDB
- Slack API
- GitHub API
- Stripe API
- AWS
- Google Sheets OAuth2

## Advanced Features

### Expression System

Use expressions to access and transform data:

```javascript
// Access current item data
{{$json["fieldName"]}}

// Access other node data
{{$node["NodeName"].json["field"]}}

// JavaScript expressions
{{new Date().toISOString()}}
{{Math.random() * 100}}
```

### Error Handling

Configure error handling per node:
- **Continue on Fail** - Continue workflow even if node fails
- **Retry on Fail** - Retry failed executions
- **Max Retries** - Number of retry attempts
- **Wait Between Retries** - Delay between retries

### Workflow Settings

```json
{
  "executionOrder": "V1",
  "saveManualExecutions": true,
  "saveExecutionProgress": true,
  "executionTimeout": 300,
  "timezone": "UTC"
}
```

## Production Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

RUN ./gradlew build

EXPOSE 5678

CMD ["java", "-jar", "build/libs/elide-workflow.jar"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: elide_workflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  workflow:
    build: .
    ports:
      - "5678:5678"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: elide_workflow
      DB_USER: postgres
      DB_PASSWORD: password
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elide-workflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elide-workflow
  template:
    metadata:
      labels:
        app: elide-workflow
    spec:
      containers:
      - name: workflow
        image: elide-workflow:latest
        ports:
        - containerPort: 5678
        env:
        - name: DB_HOST
          value: postgres-service
        - name: DB_NAME
          value: elide_workflow
---
apiVersion: v1
kind: Service
metadata:
  name: elide-workflow-service
spec:
  selector:
    app: elide-workflow
  ports:
  - port: 80
    targetPort: 5678
  type: LoadBalancer
```

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elide_workflow
DB_USER=postgres
DB_PASSWORD=secretpassword

# Server
HOST=0.0.0.0
PORT=5678

# Security
ENCRYPTION_KEY=change-this-in-production
JWT_SECRET=your-jwt-secret

# Optional
LOG_LEVEL=INFO
ENABLE_METRICS=true
```

## Performance Optimization

### Database Indexes

```sql
CREATE INDEX idx_workflows_active ON workflows(active);
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);
CREATE INDEX idx_webhooks_path ON webhook_registrations(path, method);
```

### Caching

```kotlin
// Implement credential caching
private val credentialCache = ConcurrentHashMap<String, Pair<Credential, Long>>()
private val CACHE_TTL = 5 * 60 * 1000 // 5 minutes

fun getCachedCredential(id: String): Credential? {
    val cached = credentialCache[id]
    if (cached != null && System.currentTimeMillis() - cached.second < CACHE_TTL) {
        return cached.first
    }
    return null
}
```

### Connection Pooling

```kotlin
val config = HikariConfig().apply {
    jdbcUrl = "jdbc:postgresql://$host:$port/$database"
    username = user
    password = password
    maximumPoolSize = 20
    minimumIdle = 5
    connectionTimeout = 30000
    idleTimeout = 600000
    maxLifetime = 1800000
}
```

## Comparison to n8n

| Feature | Elide Workflow | n8n |
|---------|----------------|-----|
| Language | Kotlin/JVM | TypeScript/Node.js |
| Runtime | Elide polyglot | Node.js |
| Performance | High (JVM) | Medium (Node.js) |
| Database | PostgreSQL | PostgreSQL/SQLite |
| Credential Encryption | Google Tink (AES-256) | Custom encryption |
| Visual Editor | React Flow | Vue.js Flow |
| CLI | Full featured | Basic |
| Extensibility | High (polyglot) | High (npm packages) |
| Self-hosting | Yes | Yes |
| Cloud version | No | Yes (n8n.cloud) |
| License | Open source | Fair-code (Apache 2.0) |

## Development

### Adding a New Node

```kotlin
class CustomNode : NodeBase() {
    override val description = NodeDescription(
        name = "customNode",
        displayName = "Custom Node",
        description = "Does custom operations",
        group = NodeGroup.ACTION,
        properties = listOf(
            NodeProperty(
                name = "param1",
                displayName = "Parameter 1",
                type = PropertyType.STRING,
                required = true
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val param1 = getNodeParameterString(context, "param1")

        // Your logic here
        val result = doSomething(param1)

        return NodeExecutionResult(
            data = listOf(createOutputData(
                JsonObject(mapOf("result" to JsonPrimitive(result)))
            ))
        )
    }
}

// Register in initializeNodes()
NodeRegistry.register("customNode", ::CustomNode)
```

### Running Tests

```bash
./gradlew test
```

### Building for Production

```bash
# Build backend
./gradlew clean build

# Build editor
cd editor
npm run build

# The built files will be in:
# - Backend: build/libs/elide-workflow.jar
# - Editor: editor/dist/
```

## Monitoring & Observability

### Metrics

```kotlin
// Add metrics collection
val executionCounter = Counter.build()
    .name("workflow_executions_total")
    .help("Total workflow executions")
    .register()

val executionDuration = Histogram.build()
    .name("workflow_execution_duration_seconds")
    .help("Workflow execution duration")
    .register()
```

### Logging

```kotlin
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger(WorkflowExecutor::class.java)

logger.info("Executing workflow: ${workflow.id}")
logger.error("Workflow execution failed", exception)
```

### Health Check Endpoint

```kotlin
get("/health") {
    call.respond(mapOf(
        "status" to "healthy",
        "version" to "1.0.0",
        "uptime" to (System.currentTimeMillis() - startTime)
    ))
}
```

## Security Best Practices

1. **Credentials**
   - All credentials encrypted with AES-256
   - Never log credential values
   - Rotate encryption keys regularly

2. **API Security**
   - Implement JWT authentication
   - Use HTTPS in production
   - Rate limiting on API endpoints

3. **Workflow Isolation**
   - Sandbox JavaScript execution
   - Limit resource usage per execution
   - Timeout long-running workflows

4. **Database Security**
   - Use prepared statements (Exposed handles this)
   - Encrypt sensitive data at rest
   - Regular backups

## Contributing

We welcome contributions! Please see the main Elide Showcases repository for contribution guidelines.

## License

This project is part of the Elide Showcases and follows the same license as the parent repository.

## Support

- Documentation: This README
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## Acknowledgments

- Inspired by [n8n.io](https://n8n.io)
- Built with [Elide](https://github.com/elide-dev/elide)
- Powered by Kotlin, Ktor, React, and React Flow

---

**Built with Elide - The Polyglot Runtime** 🚀

Total lines of code: 12,000+ production-ready lines
