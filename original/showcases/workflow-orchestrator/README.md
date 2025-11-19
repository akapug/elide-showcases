# Workflow Orchestrator

A production-ready workflow orchestration system for executing complex business processes using Elide.

## Features

- **DAG Execution**: Directed Acyclic Graph workflow definitions
- **Step Retries**: Automatic retry with exponential backoff
- **Parallel Execution**: Execute independent steps concurrently
- **State Management**: Track workflow execution state and progress
- **Webhook Callbacks**: Notifications for workflow events
- **Error Handling**: Graceful failure handling and recovery

## Architecture

Workflows are defined as DAGs where:

```
Step A (Extract)
    ↓
    ├─→ Step B (Transform Users) ─┐
    │                              ↓
    └─→ Step C (Transform Orders) → Step D (Load)
```

Each step can:
- Have dependencies on other steps
- Execute in parallel with independent steps
- Retry on failure with backoff
- Transform data and pass to next steps
- Trigger webhooks on completion

## Core Concepts

### Workflow Definition
Blueprint describing steps and their relationships.

### Workflow Execution
Runtime instance of a workflow with state tracking.

### Step
Individual unit of work within a workflow.

### Context
Shared data passed between workflow steps.

### DAG
Directed Acyclic Graph - ensures no circular dependencies.

## API Endpoints

### Workflow Management

#### POST /workflows
Register a new workflow definition.

```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "order-processing",
    "name": "Order Processing Workflow",
    "description": "Process customer orders end-to-end",
    "steps": [
      {
        "id": "validate-order",
        "name": "Validate Order",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://validation-service/validate",
          "method": "POST"
        },
        "dependencies": [],
        "retryPolicy": {
          "maxAttempts": 3,
          "backoffMultiplier": 2,
          "initialDelay": 1000,
          "maxDelay": 10000
        }
      },
      {
        "id": "charge-payment",
        "name": "Charge Payment",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://payment-service/charge",
          "method": "POST"
        },
        "dependencies": ["validate-order"],
        "retryPolicy": {
          "maxAttempts": 5,
          "backoffMultiplier": 2,
          "initialDelay": 2000,
          "maxDelay": 30000
        }
      },
      {
        "id": "fulfill-order",
        "name": "Fulfill Order",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://fulfillment-service/fulfill",
          "method": "POST"
        },
        "dependencies": ["charge-payment"]
      }
    ],
    "webhooks": {
      "onComplete": "http://notifications/order-complete",
      "onFailure": "http://notifications/order-failed"
    }
  }'
```

#### GET /workflows
List all registered workflows.

```bash
curl http://localhost:3000/workflows
```

#### GET /workflows/{workflowId}
Get workflow definition.

```bash
curl http://localhost:3000/workflows/order-processing
```

### Workflow Execution

#### POST /executions/start
Start a workflow execution.

```bash
curl -X POST http://localhost:3000/executions/start \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "order-processing",
    "context": {
      "orderId": "order-123",
      "customerId": "customer-456",
      "amount": 99.99
    }
  }'
```

Response:
```json
{
  "executionId": "exec-abc-123"
}
```

#### GET /executions
List all workflow executions.

```bash
# All executions
curl http://localhost:3000/executions

# Filter by workflow
curl "http://localhost:3000/executions?workflowId=order-processing"
```

#### GET /executions/{executionId}
Get execution details.

```bash
curl http://localhost:3000/executions/exec-abc-123
```

Response:
```json
{
  "executionId": "exec-abc-123",
  "workflowId": "order-processing",
  "status": "running",
  "startTime": 1234567890,
  "currentSteps": ["charge-payment"],
  "completedSteps": ["validate-order"],
  "failedSteps": [],
  "stepResults": {
    "validate-order": {
      "stepId": "validate-order",
      "status": "success",
      "attempts": 1,
      "duration": 234,
      "result": {
        "valid": true
      }
    },
    "charge-payment": {
      "stepId": "charge-payment",
      "status": "running",
      "attempts": 1
    }
  },
  "context": {
    "orderId": "order-123",
    "validate-order": {
      "valid": true
    }
  }
}
```

#### GET /executions/{executionId}/visualize
Get execution visualization.

```bash
curl http://localhost:3000/executions/exec-abc-123/visualize
```

Response:
```json
{
  "executionId": "exec-abc-123",
  "workflowName": "Order Processing Workflow",
  "status": "running",
  "duration": 5432,
  "steps": [
    {
      "id": "validate-order",
      "name": "Validate Order",
      "status": "success",
      "attempts": 1,
      "duration": 234,
      "dependencies": []
    },
    {
      "id": "charge-payment",
      "name": "Charge Payment",
      "status": "running",
      "attempts": 2,
      "dependencies": ["validate-order"]
    }
  ]
}
```

## Built-in Step Executors

### http.request
Make HTTP requests to external services.

```json
{
  "action": "http.request",
  "params": {
    "url": "http://api.example.com/endpoint",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer token"
    },
    "body": {
      "key": "value"
    }
  }
}
```

### delay
Add delays between steps.

```json
{
  "action": "delay",
  "params": {
    "duration": 5000
  }
}
```

### transform
Transform data using JavaScript.

```json
{
  "action": "transform",
  "params": {
    "inputKey": "previous-step",
    "code": "return input.map(item => ({ ...item, processed: true }))"
  }
}
```

### condition
Conditional branching.

```json
{
  "action": "condition",
  "params": {
    "expression": "context.amount > 100"
  }
}
```

### webhook
Send webhook notifications.

```json
{
  "action": "webhook",
  "params": {
    "url": "http://notifications.example.com/notify",
    "payload": {
      "event": "step-complete"
    }
  }
}
```

## Retry Policies

Configure automatic retries with exponential backoff:

```json
{
  "retryPolicy": {
    "maxAttempts": 5,
    "backoffMultiplier": 2,
    "initialDelay": 1000,
    "maxDelay": 30000
  }
}
```

This will retry:
- Attempt 1: Immediate
- Attempt 2: After 1s
- Attempt 3: After 2s
- Attempt 4: After 4s
- Attempt 5: After 8s

## Example Workflows

### 1. Data Processing Pipeline

```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "etl-pipeline",
    "name": "ETL Pipeline",
    "steps": [
      {
        "id": "extract",
        "name": "Extract Data",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://source-system/data",
          "method": "GET"
        },
        "dependencies": []
      },
      {
        "id": "transform-users",
        "name": "Transform Users",
        "type": "task",
        "action": "transform",
        "params": {
          "inputKey": "extract",
          "code": "return input.users.map(u => ({ id: u.id, name: u.name }))"
        },
        "dependencies": ["extract"]
      },
      {
        "id": "transform-orders",
        "name": "Transform Orders",
        "type": "task",
        "action": "transform",
        "params": {
          "inputKey": "extract",
          "code": "return input.orders.filter(o => o.status === '\''active'\'')"
        },
        "dependencies": ["extract"]
      },
      {
        "id": "load",
        "name": "Load to Database",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://target-system/load",
          "method": "POST"
        },
        "dependencies": ["transform-users", "transform-orders"]
      }
    ]
  }'

# Start execution
curl -X POST http://localhost:3000/executions/start \
  -H "Content-Type: application/json" \
  -d '{"workflowId":"etl-pipeline","context":{}}'
```

### 2. E-commerce Order Flow

```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "order-flow",
    "name": "E-commerce Order Flow",
    "steps": [
      {
        "id": "validate",
        "name": "Validate Order",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://validation/validate",
          "method": "POST"
        },
        "dependencies": [],
        "retryPolicy": {
          "maxAttempts": 3,
          "backoffMultiplier": 2,
          "initialDelay": 1000,
          "maxDelay": 5000
        }
      },
      {
        "id": "check-inventory",
        "name": "Check Inventory",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://inventory/check",
          "method": "POST"
        },
        "dependencies": ["validate"]
      },
      {
        "id": "charge-payment",
        "name": "Charge Payment",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://payment/charge",
          "method": "POST"
        },
        "dependencies": ["check-inventory"],
        "retryPolicy": {
          "maxAttempts": 5,
          "backoffMultiplier": 2,
          "initialDelay": 2000,
          "maxDelay": 30000
        }
      },
      {
        "id": "ship-order",
        "name": "Ship Order",
        "type": "task",
        "action": "http.request",
        "params": {
          "url": "http://shipping/ship",
          "method": "POST"
        },
        "dependencies": ["charge-payment"]
      },
      {
        "id": "send-confirmation",
        "name": "Send Confirmation",
        "type": "task",
        "action": "webhook",
        "params": {
          "url": "http://notifications/email",
          "payload": {
            "type": "order-confirmation"
          }
        },
        "dependencies": ["ship-order"]
      }
    ],
    "webhooks": {
      "onComplete": "http://analytics/order-complete",
      "onFailure": "http://support/order-failed"
    }
  }'
```

### 3. CI/CD Pipeline

```json
{
  "id": "cicd-pipeline",
  "name": "CI/CD Pipeline",
  "steps": [
    {
      "id": "checkout",
      "name": "Checkout Code",
      "dependencies": []
    },
    {
      "id": "test",
      "name": "Run Tests",
      "dependencies": ["checkout"]
    },
    {
      "id": "build",
      "name": "Build Application",
      "dependencies": ["test"]
    },
    {
      "id": "deploy-staging",
      "name": "Deploy to Staging",
      "dependencies": ["build"]
    },
    {
      "id": "integration-tests",
      "name": "Integration Tests",
      "dependencies": ["deploy-staging"]
    },
    {
      "id": "deploy-production",
      "name": "Deploy to Production",
      "dependencies": ["integration-tests"]
    }
  ]
}
```

## Parallel Execution

Steps with no dependency relationship execute in parallel:

```
Step A ─┐
        ├─→ Step C
Step B ─┘
```

Both Step A and Step B run concurrently, then Step C runs after both complete.

## Error Handling

### Step Failures
- Steps retry according to retry policy
- Failed steps prevent dependent steps from executing
- Workflow status becomes "failed" if any critical step fails

### Workflow Webhooks
- `onComplete`: Called when workflow completes successfully
- `onFailure`: Called when workflow fails
- `onStep`: Called after each step completion

## Running the Orchestrator

```bash
elide serve server.ts
```

The workflow orchestrator will start on `http://localhost:3000`.

## Complete Example

```bash
# 1. Register workflow
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d @workflow-definition.json

# 2. Start execution
EXEC_ID=$(curl -s -X POST http://localhost:3000/executions/start \
  -H "Content-Type: application/json" \
  -d '{"workflowId":"order-flow","context":{"orderId":"123"}}' \
  | jq -r '.executionId')

# 3. Monitor execution
watch -n 1 "curl -s http://localhost:3000/executions/$EXEC_ID | jq '.status'"

# 4. View visualization
curl http://localhost:3000/executions/$EXEC_ID/visualize | jq

# 5. List all executions
curl http://localhost:3000/executions | jq
```

## Enterprise Use Cases

- **ETL Pipelines**: Extract, transform, and load data workflows
- **Order Processing**: E-commerce order fulfillment orchestration
- **CI/CD**: Automated deployment pipelines
- **Data Science**: ML training and deployment workflows
- **Business Processes**: Multi-step approval and processing flows
- **Integration**: Coordinate actions across multiple systems

## Production Considerations

- **Persistence**: Store workflow state in database (PostgreSQL, MongoDB)
- **Queue**: Use message queues for step execution (SQS, RabbitMQ)
- **Monitoring**: Integrate with observability tools (Datadog, New Relic)
- **Scaling**: Run multiple orchestrator instances with shared state
- **Recovery**: Implement workflow recovery from checkpoints
- **Versioning**: Support workflow definition versioning
- **Authentication**: Add API authentication and authorization

## Comparison to Tools

This implementation demonstrates concepts similar to:

- **Apache Airflow**: Python-based workflow orchestration
- **Temporal**: Durable workflow execution platform
- **AWS Step Functions**: Serverless workflow orchestration
- **Argo Workflows**: Kubernetes-native workflow engine
- **Netflix Conductor**: Microservices orchestration engine

## Why Elide?

This showcase demonstrates Elide's orchestration capabilities:

- **Performance**: Fast workflow execution with minimal overhead
- **Type Safety**: TypeScript for reliable workflow definitions
- **Simplicity**: Easy to understand and extend
- **Standards**: Web-standard APIs throughout
- **Production Ready**: Suitable for real-world workflow orchestration

## Advanced Features

### Custom Executors

Register custom step executors:

```typescript
workflowEngine.registerExecutor('custom-action', async (params, context) => {
  // Your custom logic
  return result;
});
```

### Dynamic Workflows

Generate workflow definitions programmatically:

```typescript
const workflow = generateWorkflowForOrder(order);
workflowEngine.registerWorkflow(workflow);
```

### Step Conditions

Conditional step execution based on previous results:

```json
{
  "id": "conditional-step",
  "action": "condition",
  "params": {
    "expression": "context.previousStep.result > 100"
  }
}
```

## Further Reading

- Workflow Patterns (workflowpatterns.com)
- Microservices Orchestration vs Choreography
- Building Scalable Workflow Engines
- Temporal.io Documentation
