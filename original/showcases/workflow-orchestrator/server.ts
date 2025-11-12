/**
 * Workflow Orchestrator with Elide
 *
 * Demonstrates workflow orchestration patterns including:
 * - DAG (Directed Acyclic Graph) execution
 * - Automatic step retries with backoff
 * - Parallel step execution
 * - State management and persistence
 * - Webhook callbacks for notifications
 */

interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'parallel' | 'decision';
  action?: string;
  params?: Record<string, any>;
  dependencies: string[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
  onSuccess?: string[];
  onFailure?: string[];
}

interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  webhooks?: {
    onComplete?: string;
    onFailure?: string;
    onStep?: string;
  };
}

interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: number;
  endTime?: number;
  currentSteps: string[];
  completedSteps: string[];
  failedSteps: string[];
  stepResults: Map<string, StepResult>;
  context: Record<string, any>;
  error?: string;
}

interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  attempts: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  result?: any;
  error?: string;
  logs: string[];
}

class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private stepExecutors: Map<string, (params: any, context: any) => Promise<any>> = new Map();

  constructor() {
    this.registerBuiltInExecutors();
}

  private registerBuiltInExecutors(): void {
    // HTTP Request executor
    this.stepExecutors.set('http.request', async (params, context) => {
      const response = await fetch(params.url, {
        method: params.method || 'GET',
        headers: params.headers || {},
        body: params.body ? JSON.stringify(params.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status}`);
      }

      return await response.json();
    });

    // Delay executor
    this.stepExecutors.set('delay', async (params) => {
      await new Promise(resolve => setTimeout(resolve, params.duration || 1000));
      return { delayed: params.duration };
    });

    // Transform executor
    this.stepExecutors.set('transform', async (params, context) => {
      const input = context[params.inputKey] || params.input;
      const transform = new Function('input', params.code);
      return transform(input);
    });

    // Conditional executor
    this.stepExecutors.set('condition', async (params, context) => {
      const condition = new Function('context', `return ${params.expression}`);
      return { result: condition(context), branch: condition(context) ? 'true' : 'false' };
    });

    // Webhook executor
    this.stepExecutors.set('webhook', async (params) => {
      const response = await fetch(params.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.payload)
      });
      return { status: response.status, sent: true };
    });
}

  registerWorkflow(workflow: WorkflowDefinition): void {
    // Validate DAG (no cycles)
    if (!this.isValidDAG(workflow.steps)) {
      throw new Error('Workflow contains cycles - must be a DAG');
    }

    this.workflows.set(workflow.id, workflow);
    console.log(`Workflow registered: ${workflow.name} (${workflow.id})`);
}

  private isValidDAG(steps: WorkflowStep[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const stepMap = new Map(steps.map(s => [s.id, s]));

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = stepMap.get(stepId);
      if (!step) return false;

      for (const depId of step.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) return false;
      }
    }

    return true;
}

  async startWorkflow(workflowId: string, initialContext: Record<string, any> = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = crypto.randomUUID();
    const execution: WorkflowExecution = {
      executionId,
      workflowId,
      status: 'running',
      startTime: Date.now(),
      currentSteps: [],
      completedSteps: [],
      failedSteps: [],
      stepResults: new Map(),
      context: { ...initialContext }
    };

    this.executions.set(executionId, execution);
    console.log(`Workflow execution started: ${executionId}`);

    // Start execution asynchronously
    this.executeWorkflow(executionId).catch(error => {
      console.error(`Workflow execution error: ${error.message}`);
      execution.status = 'failed';
      execution.error = error.message;
    });

    return executionId;
}

  private async executeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    try {
      // Get initial steps (no dependencies)
      let readySteps = workflow.steps.filter(s => s.dependencies.length === 0);

      while (readySteps.length > 0) {
        // Execute ready steps in parallel
        const stepPromises = readySteps.map(step => this.executeStep(executionId, step));
        await Promise.all(stepPromises);

        // Update completed steps
        for (const step of readySteps) {
          const result = execution.stepResults.get(step.id);
          if (result?.status === 'success') {
            execution.completedSteps.push(step.id);
          } else if (result?.status === 'failed') {
            execution.failedSteps.push(step.id);
          }
        }

        // Find next ready steps
        readySteps = workflow.steps.filter(step => {
          if (execution.completedSteps.includes(step.id)) return false;
          if (execution.failedSteps.includes(step.id)) return false;
          return step.dependencies.every(depId => execution.completedSteps.includes(depId));
        });

        // Break if we have failed steps and no more steps can proceed
        if (execution.failedSteps.length > 0 && readySteps.length === 0) {
          break;
        }
      }

      // Determine final status
      if (execution.failedSteps.length > 0) {
        execution.status = 'failed';
        if (workflow.webhooks?.onFailure) {
          await this.sendWebhook(workflow.webhooks.onFailure, {
            executionId,
            status: 'failed',
            failedSteps: execution.failedSteps
          });
        }
      } else {
        execution.status = 'completed';
        if (workflow.webhooks?.onComplete) {
          await this.sendWebhook(workflow.webhooks.onComplete, {
            executionId,
            status: 'completed',
            results: Object.fromEntries(execution.stepResults)
          });
        }
      }

      execution.endTime = Date.now();
      console.log(`Workflow execution ${execution.status}: ${executionId}`);
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      execution.endTime = Date.now();
    }
}

  private async executeStep(executionId: string, step: WorkflowStep): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const stepResult: StepResult = {
      stepId: step.id,
      status: 'running',
      attempts: 0,
      startTime: Date.now(),
      logs: []
    };

    execution.stepResults.set(step.id, stepResult);
    execution.currentSteps.push(step.id);

    const retryPolicy = step.retryPolicy || {
      maxAttempts: 1,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retryPolicy.maxAttempts; attempt++) {
      try {
        stepResult.attempts = attempt + 1;
        stepResult.logs.push(`Attempt ${attempt + 1} started`);

        // Execute step with timeout
        const result = await this.executeStepWithTimeout(step, execution.context, step.timeout || 60000);

        stepResult.status = 'success';
        stepResult.result = result;
        stepResult.endTime = Date.now();
        stepResult.duration = stepResult.endTime - stepResult.startTime;
        stepResult.logs.push(`Completed successfully`);

        // Update context with result
        execution.context[step.id] = result;

        // Send step webhook
        const workflow = this.workflows.get(execution.workflowId);
        if (workflow?.webhooks?.onStep) {
          await this.sendWebhook(workflow.webhooks.onStep, {
            executionId,
            stepId: step.id,
            status: 'success',
            result
          });
        }

        return;
      } catch (error) {
        lastError = error as Error;
        stepResult.logs.push(`Attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < retryPolicy.maxAttempts - 1) {
          // Calculate backoff delay
          const delay = Math.min(
            retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt),
            retryPolicy.maxDelay
          );

          stepResult.logs.push(`Retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    stepResult.status = 'failed';
    stepResult.error = lastError?.message || 'Unknown error';
    stepResult.endTime = Date.now();
    stepResult.duration = stepResult.endTime - stepResult.startTime;

    execution.currentSteps = execution.currentSteps.filter(id => id !== step.id);
}

  private async executeStepWithTimeout(
    step: WorkflowStep,
    context: Record<string, any>,
    timeout: number
  ): Promise<any> {
    const executor = this.stepExecutors.get(step.action || '');
    if (!executor) {
      throw new Error(`No executor found for action: ${step.action}`);
    }

    return Promise.race([
      executor(step.params || {}, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Step timeout after ${timeout}ms`)), timeout)
      )
    ]);
}

  private async sendWebhook(url: string, payload: any): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Webhook failed:', error);
    }
}

  getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
}

  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) || null;
}

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
}

  listExecutions(workflowId?: string): WorkflowExecution[] {
    let executions = Array.from(this.executions.values());
    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId);
    }
    return executions.sort((a, b) => b.startTime - a.startTime);
}

  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      console.log(`Execution paused: ${executionId}`);
    }
}

  getExecutionVisualization(executionId: string): any {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return null;

    return {
      executionId,
      workflowName: workflow.name,
      status: execution.status,
      duration: execution.endTime ? execution.endTime - execution.startTime : Date.now() - execution.startTime,
      steps: workflow.steps.map(step => {
        const result = execution.stepResults.get(step.id);
        return {
          id: step.id,
          name: step.name,
          status: result?.status || 'pending',
          attempts: result?.attempts || 0,
          duration: result?.duration,
          dependencies: step.dependencies,
          error: result?.error
        };
      })
    };
}
}

// Initialize engine
const workflowEngine = new WorkflowEngine();

// Register sample workflows
workflowEngine.registerWorkflow({
  id: 'data-processing-pipeline',
  name: 'Data Processing Pipeline',
  description: 'ETL workflow with parallel processing',
  steps: [
    {
      id: 'extract',
      name: 'Extract Data',
      type: 'task',
      action: 'http.request',
      params: {
        url: 'http://api.example.com/data',
        method: 'GET'
      },
      dependencies: [],
      retryPolicy: { maxAttempts: 3, backoffMultiplier: 2, initialDelay: 1000, maxDelay: 10000 }
    },
    {
      id: 'transform-users',
      name: 'Transform User Data',
      type: 'task',
      action: 'transform',
      params: {
        inputKey: 'extract',
        code: 'return input.users.map(u => ({ ...u, processed: true }))'
      },
      dependencies: ['extract']
    },
    {
      id: 'transform-orders',
      name: 'Transform Order Data',
      type: 'task',
      action: 'transform',
      params: {
        inputKey: 'extract',
        code: 'return input.orders.map(o => ({ ...o, processed: true }))'
      },
      dependencies: ['extract']
    },
    {
      id: 'load',
      name: 'Load to Database',
      type: 'task',
      action: 'http.request',
      params: {
        url: 'http://database.example.com/load',
        method: 'POST'
      },
      dependencies: ['transform-users', 'transform-orders'],
      retryPolicy: { maxAttempts: 5, backoffMultiplier: 2, initialDelay: 2000, maxDelay: 30000 }
    }
  ],
  webhooks: {
    onComplete: 'http://notifications.example.com/workflow-complete',
    onFailure: 'http://notifications.example.com/workflow-failed'
}


/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 * Run with: elide serve --port 3000 server.ts
 */
export default async function fetch(request: Request): Promise<Response> {


  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Register workflow
    if (url.pathname === '/workflows' && request.method === 'POST') {
      try {
        const workflow = await request.json() as WorkflowDefinition;
        workflowEngine.registerWorkflow(workflow);
        return new Response(JSON.stringify({ success: true, workflowId: workflow.id }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // List workflows
    if (url.pathname === '/workflows' && request.method === 'GET') {
      const workflows = workflowEngine.listWorkflows();
      return new Response(JSON.stringify(workflows, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get workflow
    if (url.pathname.startsWith('/workflows/') && request.method === 'GET') {
      const workflowId = url.pathname.split('/')[2];
      const workflow = workflowEngine.getWorkflow(workflowId);

      if (!workflow) {
        return new Response(JSON.stringify({ error: 'Workflow not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(workflow, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Start execution
    if (url.pathname === '/executions/start' && request.method === 'POST') {
      try {
        const { workflowId, context } = await request.json();
        const executionId = await workflowEngine.startWorkflow(workflowId, context || {});
        return new Response(JSON.stringify({ executionId }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // List executions
    if (url.pathname === '/executions' && request.method === 'GET') {
      const workflowId = url.searchParams.get('workflowId') || undefined;
      const executions = workflowEngine.listExecutions(workflowId);
      return new Response(JSON.stringify(executions, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get execution
    if (url.pathname.startsWith('/executions/') && request.method === 'GET') {
      const parts = url.pathname.split('/');
      const executionId = parts[2];

      if (parts[3] === 'visualize') {
        const viz = workflowEngine.getExecutionVisualization(executionId);
        if (!viz) {
          return new Response(JSON.stringify({ error: 'Execution not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(viz, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const execution = workflowEngine.getExecution(executionId);
      if (!execution) {
        return new Response(JSON.stringify({ error: 'Execution not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Convert Map to object for JSON serialization
      const serializable = {
        ...execution,
        stepResults: Object.fromEntries(execution.stepResults)
      };

      return new Response(JSON.stringify(serializable, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Workflow Orchestrator', { status: 200 });
}



if (import.meta.url.includes("server.ts")) {
  console.log('🔄 Workflow Orchestrator ready on port 3000');
  console.log('Execute complex workflows with DAG support');
}
