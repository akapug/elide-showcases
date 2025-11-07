# AI Agent Framework

Production-ready AI agent orchestration system with planning, reasoning, tool calling, and memory management capabilities.

## Features

### Agent Capabilities
- **Tool Calling**: Execute external tools and functions
- **Planning**: Break down complex goals into actionable steps
- **Reasoning**: Multi-step logical reasoning
- **Memory Management**: Short-term and long-term memory
- **Task Execution**: Automated task decomposition and execution

### Tool System
- **Dynamic Registration**: Register tools at runtime
- **Parameter Validation**: Type-safe tool parameters
- **Async Execution**: Non-blocking tool execution
- **Error Handling**: Robust error handling for tool failures

### Memory System
- **Short-term Memory**: Recent conversation context
- **Long-term Memory**: Important information retention
- **Working Memory**: Temporary task-specific data
- **Memory Search**: Query past conversations and context

### Multi-Agent Support
- **Agent Coordination**: Orchestrate multiple specialized agents
- **Agent Chaining**: Sequential task delegation
- **Shared Context**: Information sharing between agents
- **Parallel Execution**: Run agents concurrently (future)

## API Endpoints

### GET /tools
List all available tools with their descriptions and parameters.

**Response:**
```json
{
  "tools": [
    {
      "name": "search",
      "description": "Search for information on the internet",
      "parameters": [
        {
          "name": "query",
          "type": "string",
          "description": "Search query",
          "required": true
        }
      ]
    }
  ]
}
```

### POST /tasks
Create and execute a new task.

**Request:**
```json
{
  "description": "Search for the latest AI news and summarize the findings"
}
```

**Response:**
```json
{
  "id": "task_1699363200000",
  "description": "Search for the latest AI news and summarize",
  "status": "pending",
  "steps": [],
  "createdAt": "2025-11-07T10:00:00.000Z"
}
```

### GET /tasks/:id
Get the status and results of a task.

**Response:**
```json
{
  "id": "task_1699363200000",
  "description": "Search for the latest AI news",
  "status": "completed",
  "steps": [
    {
      "id": "step_1",
      "description": "Use search tool to find information",
      "toolName": "search",
      "status": "completed",
      "result": {
        "results": [...]
      }
    }
  ],
  "result": {
    "taskId": "task_1699363200000",
    "stepsCompleted": 3,
    "summary": "Completed 3 steps successfully"
  },
  "completedAt": "2025-11-07T10:01:30.000Z"
}
```

### POST /chat
Interactive chat with the agent.

**Request:**
```json
{
  "message": "What's the weather like in San Francisco?"
}
```

**Response:**
```json
{
  "response": "I'll use the get_weather tool to help with that. Get current weather information for a location"
}
```

### GET /memory
View the agent's conversation memory.

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the weather?",
      "timestamp": "2025-11-07T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "I'll check that for you",
      "timestamp": "2025-11-07T10:00:01.000Z"
    }
  ]
}
```

## Installation

```bash
bun install
```

## Usage

### Starting the Server

```bash
bun run server.ts
```

The server will start on `http://localhost:3002`.

### Creating Tasks

```bash
curl -X POST http://localhost:3002/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Calculate 25 * 4 and then search for that number"
  }'
```

### Checking Task Status

```bash
curl http://localhost:3002/tasks/task_1699363200000
```

### Chatting with Agent

```bash
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 15 + 27?"
  }'
```

## Architecture

### Core Components

1. **ToolRegistry**: Manages available tools and their execution
2. **MemoryManager**: Handles short-term and long-term memory
3. **PlanningEngine**: Creates execution plans from goals
4. **AgentExecutor**: Executes tasks using planning and tools
5. **AgentCoordinator**: Orchestrates multiple agents

### Execution Flow

```
User Request → Planning → Task Decomposition → Tool Execution → Result Synthesis
                    ↓
              Memory Storage
```

## Built-in Tools

### Search Tool
Search for information on the internet.

```typescript
{
  name: "search",
  parameters: { query: "string" }
}
```

### Calculator Tool
Perform mathematical calculations.

```typescript
{
  name: "calculator",
  parameters: { expression: "string" }
}
```

### Weather Tool
Get weather information for a location.

```typescript
{
  name: "get_weather",
  parameters: { location: "string" }
}
```

## Custom Tool Development

### Creating a New Tool

```typescript
const customTool: Tool = {
  name: "database_query",
  description: "Query the database for information",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "SQL query to execute",
      required: true
    },
    {
      name: "limit",
      type: "number",
      description: "Maximum number of results",
      required: false
    }
  ],
  execute: async (params) => {
    const query = params.query as string;
    const limit = (params.limit as number) || 10;

    // Execute database query
    const results = await db.query(query, { limit });

    return {
      query,
      rowCount: results.length,
      data: results
    };
  }
};

// Register the tool
toolRegistry.registerTool(customTool);
```

## Memory Management

### Short-term Memory
Stores recent conversation context (default: 20 messages).

```typescript
// Automatically managed
memoryManager.addMessage({
  role: "user",
  content: "Hello",
  timestamp: new Date()
});
```

### Long-term Memory
Important information is automatically promoted from short-term memory based on importance scoring.

```typescript
// Search long-term memory
const memories = memoryManager.searchLongTerm("weather", 5);
```

### Working Memory
Temporary storage for task-specific data.

```typescript
// Store temporary data
memoryManager.setWorkingMemory("currentTask", taskData);

// Retrieve data
const task = memoryManager.getWorkingMemory("currentTask");
```

## Planning System

### Automatic Planning
The agent automatically creates plans based on the goal:

```typescript
const plan = await planner.createPlan(
  "Find the weather in NYC and calculate temperature in Celsius",
  availableTools
);

// Returns:
// {
//   goal: "...",
//   steps: [
//     "Use get_weather tool for NYC",
//     "Use calculator tool for conversion",
//     "Format and return result"
//   ],
//   reasoning: "..."
// }
```

### Task Decomposition
Plans are automatically decomposed into executable steps:

```typescript
const steps = await planner.decomposePlan(plan, toolRegistry);

// Each step can be executed independently
for (const step of steps) {
  await executeStep(step);
}
```

## Multi-Agent Coordination

### Agent Chaining
Execute tasks across multiple specialized agents:

```typescript
// Register specialized agents
coordinator.registerAgent("researcher", researchAgent);
coordinator.registerAgent("writer", writerAgent);
coordinator.registerAgent("reviewer", reviewAgent);

// Execute chain
const task = {
  id: "task_1",
  description: "Research AI trends and write a report",
  status: "pending",
  steps: []
};

await coordinator.executeChain(
  ["researcher", "writer", "reviewer"],
  task
);
```

### Shared Context
Agents share context through the chain:

```typescript
// Agent 1 result is available to Agent 2
const chain = coordinator.getChain(chainId);
const researchResults = chain.sharedContext.get("result_researcher");
```

## Use Cases

### Research Assistant
```typescript
POST /tasks
{
  "description": "Research the latest developments in quantum computing and summarize key findings"
}
```

### Data Analysis
```typescript
POST /tasks
{
  "description": "Calculate the average, min, and max of [45, 67, 23, 89, 12] and compare to last month's data"
}
```

### Information Gathering
```typescript
POST /tasks
{
  "description": "Get weather for San Francisco, New York, and London, then compare temperatures"
}
```

### Complex Workflows
```typescript
POST /tasks
{
  "description": "Search for AI conferences in 2025, calculate total attendance capacity, and recommend top 3 to attend"
}
```

## Error Handling

### Tool Errors
```typescript
try {
  await toolRegistry.executeTool("calculator", {
    expression: "invalid"
  });
} catch (error) {
  // Error is caught and logged
  // Task status set to "failed"
  // Error message included in response
}
```

### Task Failures
```json
{
  "id": "task_123",
  "status": "failed",
  "error": "Tool execution failed: Invalid expression",
  "steps": [
    {
      "id": "step_1",
      "status": "failed",
      "description": "Calculate result"
    }
  ]
}
```

## Configuration

### Agent Configuration

```typescript
const config: AgentConfig = {
  name: "research-agent",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "You are a research assistant specialized in AI.",
  tools: ["search", "calculator"],
  memorySize: 50
};
```

### Environment Variables

```bash
PORT=3002
MAX_MEMORY_SIZE=100
ENABLE_LOGGING=true
TOOL_TIMEOUT=30000
MAX_STEPS=10
```

## Performance Optimization

### Parallel Tool Execution
Execute independent tools in parallel:

```typescript
// Future feature
const results = await Promise.all([
  toolRegistry.executeTool("search", { query: "AI" }),
  toolRegistry.executeTool("get_weather", { location: "NYC" })
]);
```

### Memory Optimization
- Automatic promotion to long-term memory
- Importance-based retention
- LRU eviction for working memory

### Caching
- Cache tool results for repeated queries
- Cache plans for similar goals

## Best Practices

1. **Clear Tool Descriptions**: Write detailed tool descriptions for better planning
2. **Parameter Validation**: Validate tool parameters before execution
3. **Error Recovery**: Implement retry logic for transient failures
4. **Memory Management**: Clear working memory after task completion
5. **Logging**: Log all tool executions and decisions for debugging

## Production Deployment

### Docker
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json .
RUN bun install
COPY . .
EXPOSE 3002
CMD ["bun", "run", "server.ts"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent-framework
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-agent
  template:
    metadata:
      labels:
        app: ai-agent
    spec:
      containers:
      - name: agent
        image: ai-agent:latest
        ports:
        - containerPort: 3002
        env:
        - name: MAX_MEMORY_SIZE
          value: "100"
```

## Testing

### Unit Tests
```typescript
import { describe, test, expect } from "bun:test";

describe("ToolRegistry", () => {
  test("should register and execute tool", async () => {
    const registry = new ToolRegistry();
    registry.registerTool(testTool);

    const result = await registry.executeTool("test", { param: "value" });
    expect(result).toBeDefined();
  });
});
```

### Integration Tests
```bash
bun test
```

## License

MIT
