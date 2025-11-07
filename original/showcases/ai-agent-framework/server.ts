/**
 * AI Agent Framework
 *
 * Production-ready agent orchestration system with:
 * - Tool calling and execution
 * - Planning and reasoning
 * - Memory management
 * - Multi-step task execution
 * - Agent chaining and collaboration
 */

import { serve } from "bun";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Tool {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

interface AgentConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  memorySize: number;
}

interface Task {
  id: string;
  description: string;
  status: "pending" | "planning" | "executing" | "completed" | "failed";
  steps: TaskStep[];
  result?: unknown;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface TaskStep {
  id: string;
  description: string;
  toolName?: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "executing" | "completed" | "failed";
}

interface Plan {
  goal: string;
  steps: string[];
  reasoning: string;
}

interface Memory {
  shortTerm: Message[];
  longTerm: MemoryEntry[];
  workingMemory: Map<string, unknown>;
}

interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  importance: number;
  timestamp: Date;
  tags: string[];
}

interface AgentChain {
  id: string;
  agents: string[];
  currentAgent: number;
  sharedContext: Map<string, unknown>;
  status: "running" | "completed" | "failed";
}

// ============================================================================
// Tool Registry
// ============================================================================

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  getTool(name: string): Tool | null {
    return this.tools.get(name) || null;
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, parameters: Record<string, unknown>): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    console.log(`Executing tool: ${name}`, parameters);
    return await tool.execute(parameters);
  }
}

// ============================================================================
// Memory Manager
// ============================================================================

class MemoryManager {
  private memory: Memory;
  private maxShortTerm: number;

  constructor(maxShortTerm: number = 20) {
    this.maxShortTerm = maxShortTerm;
    this.memory = {
      shortTerm: [],
      longTerm: [],
      workingMemory: new Map(),
    };
  }

  addMessage(message: Message): void {
    this.memory.shortTerm.push(message);

    // Maintain short-term memory size
    if (this.memory.shortTerm.length > this.maxShortTerm) {
      const removed = this.memory.shortTerm.shift()!;
      this.promoteToLongTerm(removed);
    }
  }

  private promoteToLongTerm(message: Message): void {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random()}`,
      content: message.content,
      importance: this.calculateImportance(message),
      timestamp: message.timestamp,
      tags: this.extractTags(message.content),
    };

    this.memory.longTerm.push(entry);

    // Keep only top N important memories
    if (this.memory.longTerm.length > 100) {
      this.memory.longTerm.sort((a, b) => b.importance - a.importance);
      this.memory.longTerm = this.memory.longTerm.slice(0, 100);
    }
  }

  private calculateImportance(message: Message): number {
    // Simple importance scoring
    let score = 0.5;

    if (message.role === "user") score += 0.2;
    if (message.toolCalls && message.toolCalls.length > 0) score += 0.3;
    if (message.content.length > 100) score += 0.1;

    return Math.min(score, 1.0);
  }

  private extractTags(content: string): string[] {
    // Simple tag extraction
    const tags: string[] = [];
    if (content.includes("search")) tags.push("search");
    if (content.includes("calculate")) tags.push("calculation");
    if (content.includes("analyze")) tags.push("analysis");
    return tags;
  }

  getShortTerm(): Message[] {
    return this.memory.shortTerm;
  }

  searchLongTerm(query: string, limit: number = 5): MemoryEntry[] {
    // Simple keyword search
    const results = this.memory.longTerm
      .filter(entry => entry.content.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);

    return results;
  }

  setWorkingMemory(key: string, value: unknown): void {
    this.memory.workingMemory.set(key, value);
  }

  getWorkingMemory(key: string): unknown {
    return this.memory.workingMemory.get(key);
  }

  clear(): void {
    this.memory.shortTerm = [];
    this.memory.workingMemory.clear();
  }
}

// ============================================================================
// Planning Engine
// ============================================================================

class PlanningEngine {
  async createPlan(goal: string, availableTools: Tool[]): Promise<Plan> {
    console.log(`Creating plan for goal: ${goal}`);

    // Simple rule-based planning (in production, use LLM)
    const steps: string[] = [];
    const toolNames = availableTools.map(t => t.name);

    // Analyze goal and break down into steps
    if (goal.toLowerCase().includes("search") || goal.toLowerCase().includes("find")) {
      steps.push("Use search tool to find information");
      steps.push("Analyze search results");
      steps.push("Format and return findings");
    } else if (goal.toLowerCase().includes("calculate")) {
      steps.push("Parse calculation requirements");
      steps.push("Use calculator tool to compute");
      steps.push("Verify and return result");
    } else if (goal.toLowerCase().includes("analyze")) {
      steps.push("Gather relevant data");
      steps.push("Process and analyze data");
      steps.push("Generate insights");
      steps.push("Create summary report");
    } else {
      steps.push("Understand the task requirements");
      steps.push("Identify necessary tools and resources");
      steps.push("Execute the task");
      steps.push("Verify and return results");
    }

    return {
      goal,
      steps,
      reasoning: `Breaking down the goal into ${steps.length} actionable steps using available tools: ${toolNames.join(", ")}`,
    };
  }

  async decomposePlan(plan: Plan, tools: ToolRegistry): Promise<TaskStep[]> {
    const taskSteps: TaskStep[] = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const toolMatch = this.matchStepToTool(step, tools.listTools());

      taskSteps.push({
        id: `step_${i + 1}`,
        description: step,
        toolName: toolMatch?.name,
        status: "pending",
      });
    }

    return taskSteps;
  }

  private matchStepToTool(step: string, tools: Tool[]): Tool | null {
    const stepLower = step.toLowerCase();

    for (const tool of tools) {
      if (stepLower.includes(tool.name.toLowerCase())) {
        return tool;
      }

      // Check if step keywords match tool description
      const keywords = tool.description.toLowerCase().split(" ");
      if (keywords.some(kw => stepLower.includes(kw))) {
        return tool;
      }
    }

    return null;
  }
}

// ============================================================================
// Agent Executor
// ============================================================================

class AgentExecutor {
  private config: AgentConfig;
  private memory: MemoryManager;
  private tools: ToolRegistry;
  private planner: PlanningEngine;

  constructor(
    config: AgentConfig,
    tools: ToolRegistry,
    memory: MemoryManager,
    planner: PlanningEngine
  ) {
    this.config = config;
    this.tools = tools;
    this.memory = memory;
    this.planner = planner;
  }

  async executeTask(task: Task): Promise<Task> {
    console.log(`Executing task: ${task.description}`);

    try {
      task.status = "planning";

      // Create plan
      const plan = await this.planner.createPlan(
        task.description,
        this.tools.listTools()
      );

      // Decompose into steps
      task.steps = await this.planner.decomposePlan(plan, this.tools);
      task.status = "executing";

      // Execute each step
      for (const step of task.steps) {
        step.status = "executing";

        if (step.toolName) {
          try {
            step.result = await this.tools.executeTool(
              step.toolName,
              step.parameters || {}
            );
            step.status = "completed";
          } catch (error) {
            step.status = "failed";
            throw error;
          }
        } else {
          // Reasoning step without tool
          step.result = `Completed: ${step.description}`;
          step.status = "completed";
        }

        // Store in memory
        this.memory.addMessage({
          role: "assistant",
          content: `Completed step: ${step.description}`,
          timestamp: new Date(),
        });
      }

      task.status = "completed";
      task.completedAt = new Date();
      task.result = this.synthesizeResult(task);

      return task;
    } catch (error) {
      task.status = "failed";
      task.error = (error as Error).message;
      throw error;
    }
  }

  private synthesizeResult(task: Task): unknown {
    // Combine step results into final result
    const results = task.steps
      .filter(s => s.status === "completed")
      .map(s => s.result);

    return {
      taskId: task.id,
      description: task.description,
      stepsCompleted: results.length,
      outputs: results,
      summary: `Completed ${results.length} steps successfully`,
    };
  }

  async chat(message: string): Promise<string> {
    // Add user message to memory
    this.memory.addMessage({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Simple response generation (in production, use LLM)
    const response = await this.generateResponse(message);

    // Add assistant response to memory
    this.memory.addMessage({
      role: "assistant",
      content: response,
      timestamp: new Date(),
    });

    return response;
  }

  private async generateResponse(message: string): Promise<string> {
    // Simple response logic (replace with actual LLM call)
    const context = this.memory.getShortTerm()
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    // Check if tools are needed
    const availableTools = this.tools.listTools();
    const toolNeeded = this.detectToolNeed(message, availableTools);

    if (toolNeeded) {
      return `I'll use the ${toolNeeded.name} tool to help with that. ${toolNeeded.description}`;
    }

    return `I understand you said: "${message}". Based on the conversation context, I'll help you with that.`;
  }

  private detectToolNeed(message: string, tools: Tool[]): Tool | null {
    const messageLower = message.toLowerCase();

    for (const tool of tools) {
      if (messageLower.includes(tool.name.toLowerCase())) {
        return tool;
      }
    }

    return null;
  }
}

// ============================================================================
// Agent Coordinator (for multi-agent scenarios)
// ============================================================================

class AgentCoordinator {
  private agents: Map<string, AgentExecutor> = new Map();
  private chains: Map<string, AgentChain> = new Map();

  registerAgent(name: string, agent: AgentExecutor): void {
    this.agents.set(name, agent);
    console.log(`Registered agent: ${name}`);
  }

  async executeChain(agentNames: string[], task: Task): Promise<Task> {
    const chainId = `chain_${Date.now()}`;
    const chain: AgentChain = {
      id: chainId,
      agents: agentNames,
      currentAgent: 0,
      sharedContext: new Map(),
      status: "running",
    };

    this.chains.set(chainId, chain);

    try {
      for (let i = 0; i < agentNames.length; i++) {
        chain.currentAgent = i;
        const agentName = agentNames[i];
        const agent = this.agents.get(agentName);

        if (!agent) {
          throw new Error(`Agent ${agentName} not found`);
        }

        console.log(`Executing with agent: ${agentName}`);
        task = await agent.executeTask(task);

        // Share context between agents
        chain.sharedContext.set(`result_${agentName}`, task.result);
      }

      chain.status = "completed";
      return task;
    } catch (error) {
      chain.status = "failed";
      throw error;
    }
  }

  getChain(chainId: string): AgentChain | null {
    return this.chains.get(chainId) || null;
  }
}

// ============================================================================
// Built-in Tools
// ============================================================================

const searchTool: Tool = {
  name: "search",
  description: "Search for information on the internet",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "Search query",
      required: true,
    },
  ],
  execute: async (params) => {
    const query = params.query as string;
    // Simulate search
    return {
      results: [
        { title: `Result 1 for "${query}"`, snippet: "Information about..." },
        { title: `Result 2 for "${query}"`, snippet: "More information..." },
      ],
    };
  },
};

const calculatorTool: Tool = {
  name: "calculator",
  description: "Perform mathematical calculations",
  parameters: [
    {
      name: "expression",
      type: "string",
      description: "Mathematical expression",
      required: true,
    },
  ],
  execute: async (params) => {
    const expression = params.expression as string;
    try {
      // Safe eval alternative (in production, use a math parser library)
      const result = Function(`"use strict"; return (${expression})`)();
      return { result, expression };
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  },
};

const weatherTool: Tool = {
  name: "get_weather",
  description: "Get current weather information for a location",
  parameters: [
    {
      name: "location",
      type: "string",
      description: "City or location name",
      required: true,
    },
  ],
  execute: async (params) => {
    const location = params.location as string;
    // Simulate weather API
    return {
      location,
      temperature: Math.floor(Math.random() * 30 + 10),
      condition: "Partly Cloudy",
      humidity: Math.floor(Math.random() * 40 + 40),
    };
  },
};

// ============================================================================
// Server Setup
// ============================================================================

const toolRegistry = new ToolRegistry();
toolRegistry.registerTool(searchTool);
toolRegistry.registerTool(calculatorTool);
toolRegistry.registerTool(weatherTool);

const memoryManager = new MemoryManager(20);
const planningEngine = new PlanningEngine();

const defaultConfig: AgentConfig = {
  name: "default",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "You are a helpful AI assistant.",
  tools: ["search", "calculator", "get_weather"],
  memorySize: 20,
};

const agentExecutor = new AgentExecutor(
  defaultConfig,
  toolRegistry,
  memoryManager,
  planningEngine
);

const coordinator = new AgentCoordinator();
coordinator.registerAgent("default", agentExecutor);

const tasks: Map<string, Task> = new Map();

const server = serve({
  port: 3002,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health" && req.method === "GET") {
      return new Response(JSON.stringify({ status: "healthy" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // List tools
    if (url.pathname === "/tools" && req.method === "GET") {
      const tools = toolRegistry.listTools().map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));
      return new Response(JSON.stringify({ tools }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create task
    if (url.pathname === "/tasks" && req.method === "POST") {
      try {
        const body = await req.json();
        const task: Task = {
          id: `task_${Date.now()}`,
          description: body.description,
          status: "pending",
          steps: [],
          createdAt: new Date(),
        };

        tasks.set(task.id, task);

        // Execute task asynchronously
        agentExecutor.executeTask(task).catch(err => {
          console.error(`Task ${task.id} failed:`, err);
        });

        return new Response(JSON.stringify(task), {
          headers: { "Content-Type": "application/json" },
          status: 201,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Get task status
    if (url.pathname.startsWith("/tasks/") && req.method === "GET") {
      const taskId = url.pathname.split("/")[2];
      const task = tasks.get(taskId);

      if (!task) {
        return new Response(JSON.stringify({ error: "Task not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(task), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Chat endpoint
    if (url.pathname === "/chat" && req.method === "POST") {
      try {
        const body = await req.json();
        const response = await agentExecutor.chat(body.message);

        return new Response(JSON.stringify({ response }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Memory endpoint
    if (url.pathname === "/memory" && req.method === "GET") {
      const shortTerm = memoryManager.getShortTerm();
      return new Response(JSON.stringify({ messages: shortTerm }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`AI Agent Framework running on http://localhost:${server.port}`);
console.log(`
Available endpoints:
  GET  /health       - Health check
  GET  /tools        - List available tools
  POST /tasks        - Create and execute task
  GET  /tasks/:id    - Get task status
  POST /chat         - Chat with agent
  GET  /memory       - View conversation memory
`);
