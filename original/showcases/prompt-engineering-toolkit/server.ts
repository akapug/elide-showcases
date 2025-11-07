/**
 * Prompt Engineering Toolkit
 *
 * A comprehensive toolkit for managing, testing, and optimizing prompts for LLM applications.
 * Built with Elide for high-performance prompt experimentation and production deployment.
 *
 * Features:
 * - Prompt template management with variable injection
 * - Version control for prompts
 * - A/B testing framework
 * - Performance metrics and analytics
 * - Prompt optimization suggestions
 * - Multi-model testing
 * - Chain-of-thought and few-shot examples
 * - Cost tracking
 */

import { serve } from "elide/http/server";

// Types
interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  template: string;
  variables: string[];
  metadata: {
    description?: string;
    category?: string;
    tags?: string[];
    author?: string;
  };
  examples?: Array<{
    input: Record<string, any>;
    expectedOutput: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptExecution {
  id: string;
  templateId: string;
  templateVersion: string;
  variables: Record<string, any>;
  renderedPrompt: string;
  response: string;
  model: string;
  temperature: number;
  tokensUsed: number;
  latency: number;
  cost: number;
  score?: number;
  timestamp: Date;
}

interface ABTest {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    templateId: string;
    templateVersion: string;
    weight: number;
  }>;
  status: "draft" | "running" | "completed";
  metrics: {
    variant: string;
    executions: number;
    averageScore: number;
    averageLatency: number;
    averageCost: number;
  }[];
  startedAt?: Date;
  completedAt?: Date;
}

interface OptimizationSuggestion {
  type: "clarity" | "specificity" | "structure" | "length" | "examples";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion: string;
}

// Prompt Template Manager
class PromptTemplateManager {
  private templates: Map<string, Map<string, PromptTemplate>> = new Map();

  createTemplate(template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">): PromptTemplate {
    const id = this.generateId(template.name);
    const versions = this.templates.get(id) || new Map();

    const newTemplate: PromptTemplate = {
      id,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    versions.set(template.version, newTemplate);
    this.templates.set(id, versions);

    return newTemplate;
  }

  getTemplate(id: string, version?: string): PromptTemplate | undefined {
    const versions = this.templates.get(id);
    if (!versions) return undefined;

    if (version) {
      return versions.get(version);
    }

    // Return latest version
    const sortedVersions = Array.from(versions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    return sortedVersions[0];
  }

  updateTemplate(
    id: string,
    version: string,
    updates: Partial<PromptTemplate>
  ): PromptTemplate | undefined {
    const template = this.getTemplate(id, version);
    if (!template) return undefined;

    const updatedTemplate = {
      ...template,
      ...updates,
      id: template.id,
      version: template.version,
      updatedAt: new Date(),
    };

    const versions = this.templates.get(id)!;
    versions.set(version, updatedTemplate);

    return updatedTemplate;
  }

  listTemplates(): PromptTemplate[] {
    const templates: PromptTemplate[] = [];
    for (const versions of this.templates.values()) {
      // Get latest version of each template
      const sortedVersions = Array.from(versions.values()).sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
      templates.push(sortedVersions[0]);
    }
    return templates;
  }

  listVersions(id: string): PromptTemplate[] {
    const versions = this.templates.get(id);
    if (!versions) return [];
    return Array.from(versions.values());
  }

  deleteTemplate(id: string, version?: string): boolean {
    if (version) {
      const versions = this.templates.get(id);
      if (!versions) return false;
      return versions.delete(version);
    } else {
      return this.templates.delete(id);
    }
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  }
}

// Prompt Renderer
class PromptRenderer {
  render(template: string, variables: Record<string, any>): string {
    let rendered = template;

    // Replace variables in format {{variable}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  extractVariables(template: string): string[] {
    const matches = template.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    return matches.map((m) => m.replace(/\{\{\s*|\s*\}\}/g, "")).filter((v, i, arr) => arr.indexOf(v) === i);
  }

  validate(template: string, variables: Record<string, any>): { valid: boolean; missing: string[] } {
    const required = this.extractVariables(template);
    const provided = Object.keys(variables);
    const missing = required.filter((v) => !provided.includes(v));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

// Execution Tracker
class ExecutionTracker {
  private executions: PromptExecution[] = [];
  private maxExecutions = 10000;

  recordExecution(execution: PromptExecution): void {
    this.executions.push(execution);

    // Keep only recent executions
    if (this.executions.length > this.maxExecutions) {
      this.executions = this.executions.slice(-this.maxExecutions);
    }
  }

  getExecutions(templateId?: string, limit: number = 100): PromptExecution[] {
    let filtered = this.executions;

    if (templateId) {
      filtered = filtered.filter((e) => e.templateId === templateId);
    }

    return filtered.slice(-limit);
  }

  getMetrics(templateId: string, version?: string): {
    totalExecutions: number;
    averageScore: number;
    averageLatency: number;
    averageCost: number;
    averageTokens: number;
  } {
    const executions = this.executions.filter(
      (e) => e.templateId === templateId && (!version || e.templateVersion === version)
    );

    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        averageScore: 0,
        averageLatency: 0,
        averageCost: 0,
        averageTokens: 0,
      };
    }

    const sum = executions.reduce(
      (acc, e) => ({
        score: acc.score + (e.score || 0),
        latency: acc.latency + e.latency,
        cost: acc.cost + e.cost,
        tokens: acc.tokens + e.tokensUsed,
      }),
      { score: 0, latency: 0, cost: 0, tokens: 0 }
    );

    return {
      totalExecutions: executions.length,
      averageScore: sum.score / executions.length,
      averageLatency: sum.latency / executions.length,
      averageCost: sum.cost / executions.length,
      averageTokens: sum.tokens / executions.length,
    };
  }
}

// A/B Test Manager
class ABTestManager {
  private tests: Map<string, ABTest> = new Map();
  private tracker: ExecutionTracker;

  constructor(tracker: ExecutionTracker) {
    this.tracker = tracker;
  }

  createTest(test: Omit<ABTest, "id" | "metrics" | "startedAt" | "completedAt">): ABTest {
    const id = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newTest: ABTest = {
      id,
      ...test,
      metrics: [],
    };

    this.tests.set(id, newTest);
    return newTest;
  }

  getTest(id: string): ABTest | undefined {
    return this.tests.get(id);
  }

  listTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  startTest(id: string): boolean {
    const test = this.tests.get(id);
    if (!test || test.status !== "draft") return false;

    test.status = "running";
    test.startedAt = new Date();
    return true;
  }

  completeTest(id: string): boolean {
    const test = this.tests.get(id);
    if (!test || test.status !== "running") return false;

    test.status = "completed";
    test.completedAt = new Date();

    // Calculate final metrics
    test.metrics = test.variants.map((variant) => {
      const metrics = this.tracker.getMetrics(variant.templateId, variant.templateVersion);
      return {
        variant: variant.id,
        executions: metrics.totalExecutions,
        averageScore: metrics.averageScore,
        averageLatency: metrics.averageLatency,
        averageCost: metrics.averageCost,
      };
    });

    return true;
  }

  selectVariant(testId: string): string | undefined {
    const test = this.tests.get(testId);
    if (!test || test.status !== "running") return undefined;

    // Weighted random selection
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of test.variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant.id;
      }
    }

    return test.variants[0].id;
  }
}

// Prompt Optimizer
class PromptOptimizer {
  analyzePrompt(template: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check length
    if (template.length < 50) {
      suggestions.push({
        type: "length",
        severity: "medium",
        message: "Prompt is very short",
        suggestion: "Consider adding more context and instructions for better results",
      });
    }

    // Check for instructions
    if (!template.toLowerCase().includes("you are") && !template.toLowerCase().includes("act as")) {
      suggestions.push({
        type: "clarity",
        severity: "low",
        message: "No role definition found",
        suggestion: 'Start with role definition like "You are an expert..." or "Act as..."',
      });
    }

    // Check for examples
    if (!template.includes("Example:") && !template.includes("For example")) {
      suggestions.push({
        type: "examples",
        severity: "low",
        message: "No examples provided",
        suggestion: "Add few-shot examples to improve output quality",
      });
    }

    // Check for structure
    if (!template.includes("\n\n") && template.length > 100) {
      suggestions.push({
        type: "structure",
        severity: "low",
        message: "Prompt lacks clear structure",
        suggestion: "Use line breaks and sections to organize the prompt",
      });
    }

    // Check for specificity
    const vagueTerms = ["something", "stuff", "thing", "whatever", "etc"];
    const hasVagueTerms = vagueTerms.some((term) => template.toLowerCase().includes(term));
    if (hasVagueTerms) {
      suggestions.push({
        type: "specificity",
        severity: "high",
        message: "Prompt contains vague language",
        suggestion: "Replace vague terms with specific instructions and requirements",
      });
    }

    return suggestions;
  }

  scorePrompt(template: string): number {
    const suggestions = this.analyzePrompt(template);

    let score = 100;
    for (const suggestion of suggestions) {
      switch (suggestion.severity) {
        case "high":
          score -= 20;
          break;
        case "medium":
          score -= 10;
          break;
        case "low":
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }
}

// Mock LLM for demonstration
class MockLLM {
  async generate(prompt: string, temperature: number = 0.7): Promise<{
    response: string;
    tokensUsed: number;
    latency: number;
  }> {
    const startTime = Date.now();

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));

    const response = `This is a simulated response to your prompt. In production, this would be replaced with actual LLM API calls to OpenAI, Anthropic, or local models. The prompt was: "${prompt.substring(0, 100)}..."`;

    const tokensUsed = Math.ceil((prompt.length + response.length) / 4);
    const latency = Date.now() - startTime;

    return { response, tokensUsed, latency };
  }

  calculateCost(tokensUsed: number, model: string = "gpt-3.5-turbo"): number {
    // Simplified cost calculation (per 1K tokens)
    const costs: Record<string, number> = {
      "gpt-3.5-turbo": 0.002,
      "gpt-4": 0.03,
      "claude-3-sonnet": 0.003,
      "claude-3-opus": 0.015,
    };

    const costPer1k = costs[model] || 0.002;
    return (tokensUsed / 1000) * costPer1k;
  }
}

// Server Implementation
const templateManager = new PromptTemplateManager();
const renderer = new PromptRenderer();
const tracker = new ExecutionTracker();
const testManager = new ABTestManager(tracker);
const optimizer = new PromptOptimizer();
const llm = new MockLLM();

// Create some example templates
templateManager.createTemplate({
  name: "Code Review",
  version: "1.0.0",
  template: `You are an expert code reviewer. Review the following code and provide feedback.

Code:
{{code}}

Language: {{language}}

Provide:
1. Overall assessment
2. Potential bugs or issues
3. Suggestions for improvement
4. Security concerns`,
  variables: ["code", "language"],
  metadata: {
    description: "Reviews code for quality and potential issues",
    category: "development",
    tags: ["code", "review", "analysis"],
  },
});

templateManager.createTemplate({
  name: "Content Summarizer",
  version: "1.0.0",
  template: `Summarize the following text in {{length}} sentences:

{{text}}`,
  variables: ["text", "length"],
  metadata: {
    description: "Generates concise summaries of text",
    category: "content",
    tags: ["summary", "nlp"],
  },
});

serve({
  port: 8084,
  fetch: async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/health" || path === "/") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "Prompt Engineering Toolkit",
            uptime: process.uptime(),
            templates: templateManager.listTemplates().length,
            executions: tracker.getExecutions().length,
            tests: testManager.listTests().length,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // List templates
      if (path === "/v1/templates" && req.method === "GET") {
        const templates = templateManager.listTemplates();
        return new Response(
          JSON.stringify({ templates, count: templates.length }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create template
      if (path === "/v1/templates" && req.method === "POST") {
        const body = await req.json();

        if (!body.name || !body.template) {
          return new Response(
            JSON.stringify({ error: "Name and template required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const variables = renderer.extractVariables(body.template);
        const template = templateManager.createTemplate({
          ...body,
          version: body.version || "1.0.0",
          variables,
          metadata: body.metadata || {},
        });

        return new Response(JSON.stringify(template), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get template
      if (path.match(/^\/v1\/templates\/[^/]+$/) && req.method === "GET") {
        const id = path.split("/")[3];
        const version = url.searchParams.get("version") || undefined;
        const template = templateManager.getTemplate(id, version);

        if (!template) {
          return new Response(
            JSON.stringify({ error: "Template not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(template), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List template versions
      if (path.match(/^\/v1\/templates\/[^/]+\/versions$/) && req.method === "GET") {
        const id = path.split("/")[3];
        const versions = templateManager.listVersions(id);

        return new Response(
          JSON.stringify({ versions, count: versions.length }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Execute template
      if (path.match(/^\/v1\/templates\/[^/]+\/execute$/) && req.method === "POST") {
        const id = path.split("/")[3];
        const body = await req.json();

        const version = body.version || undefined;
        const template = templateManager.getTemplate(id, version);

        if (!template) {
          return new Response(
            JSON.stringify({ error: "Template not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Validate variables
        const validation = renderer.validate(template.template, body.variables || {});
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              error: "Missing variables",
              missing: validation.missing,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Render prompt
        const renderedPrompt = renderer.render(template.template, body.variables);

        // Execute with LLM
        const result = await llm.generate(renderedPrompt, body.temperature || 0.7);
        const cost = llm.calculateCost(result.tokensUsed, body.model || "gpt-3.5-turbo");

        // Record execution
        const execution: PromptExecution = {
          id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          templateId: template.id,
          templateVersion: template.version,
          variables: body.variables,
          renderedPrompt,
          response: result.response,
          model: body.model || "gpt-3.5-turbo",
          temperature: body.temperature || 0.7,
          tokensUsed: result.tokensUsed,
          latency: result.latency,
          cost,
          score: body.score,
          timestamp: new Date(),
        };

        tracker.recordExecution(execution);

        return new Response(
          JSON.stringify({
            executionId: execution.id,
            response: result.response,
            tokensUsed: result.tokensUsed,
            latency: result.latency,
            cost,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Analyze prompt
      if (path === "/v1/analyze" && req.method === "POST") {
        const body = await req.json();

        if (!body.template) {
          return new Response(
            JSON.stringify({ error: "Template required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const suggestions = optimizer.analyzePrompt(body.template);
        const score = optimizer.scorePrompt(body.template);

        return new Response(
          JSON.stringify({ score, suggestions }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get metrics
      if (path.match(/^\/v1\/templates\/[^/]+\/metrics$/) && req.method === "GET") {
        const id = path.split("/")[3];
        const version = url.searchParams.get("version") || undefined;
        const metrics = tracker.getMetrics(id, version);

        return new Response(JSON.stringify(metrics), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create A/B test
      if (path === "/v1/tests" && req.method === "POST") {
        const body = await req.json();

        if (!body.name || !body.variants || body.variants.length < 2) {
          return new Response(
            JSON.stringify({ error: "Name and at least 2 variants required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const test = testManager.createTest({
          name: body.name,
          variants: body.variants,
          status: "draft",
          metrics: [],
        });

        return new Response(JSON.stringify(test), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List A/B tests
      if (path === "/v1/tests" && req.method === "GET") {
        const tests = testManager.listTests();
        return new Response(
          JSON.stringify({ tests, count: tests.length }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get A/B test
      if (path.match(/^\/v1\/tests\/[^/]+$/) && req.method === "GET") {
        const id = path.split("/")[3];
        const test = testManager.getTest(id);

        if (!test) {
          return new Response(
            JSON.stringify({ error: "Test not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(test), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Start A/B test
      if (path.match(/^\/v1\/tests\/[^/]+\/start$/) && req.method === "POST") {
        const id = path.split("/")[3];
        const success = testManager.startTest(id);

        if (!success) {
          return new Response(
            JSON.stringify({ error: "Cannot start test" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Complete A/B test
      if (path.match(/^\/v1\/tests\/[^/]+\/complete$/) && req.method === "POST") {
        const id = path.split("/")[3];
        const success = testManager.completeTest(id);

        if (!success) {
          return new Response(
            JSON.stringify({ error: "Cannot complete test" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const test = testManager.getTest(id);
        return new Response(JSON.stringify(test), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Not found
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : "Internal server error",
            type: "server_error",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
});

console.log("Prompt Engineering Toolkit running on http://localhost:8084");
console.log("Endpoints:");
console.log("  GET    /v1/templates - List templates");
console.log("  POST   /v1/templates - Create template");
console.log("  GET    /v1/templates/{id} - Get template");
console.log("  GET    /v1/templates/{id}/versions - List versions");
console.log("  POST   /v1/templates/{id}/execute - Execute template");
console.log("  GET    /v1/templates/{id}/metrics - Get metrics");
console.log("  POST   /v1/analyze - Analyze prompt");
console.log("  GET    /v1/tests - List A/B tests");
console.log("  POST   /v1/tests - Create A/B test");
console.log("  GET    /v1/tests/{id} - Get A/B test");
console.log("  POST   /v1/tests/{id}/start - Start A/B test");
console.log("  POST   /v1/tests/{id}/complete - Complete A/B test");
console.log("  GET    /health - Health check");
