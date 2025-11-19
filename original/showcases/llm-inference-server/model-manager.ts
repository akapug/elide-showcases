/**
 * Model Manager - Dynamic Model Loading and Management
 *
 * Handles dynamic loading/unloading of LLM models, model versioning,
 * memory management, and A/B testing between different models.
 */

export interface ModelMetadata {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "llama" | "custom";
  version: string;
  maxTokens: number;
  contextWindow: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  supportedFeatures: string[];
  memoryRequirement: number; // MB
}

export interface LoadedModel {
  metadata: ModelMetadata;
  loaded: boolean;
  loadedAt?: Date;
  lastUsedAt?: Date;
  requestCount: number;
  totalTokensProcessed: number;
  averageLatency: number;
  errorCount: number;
  priority: number; // For memory management
}

export interface ABTestConfig {
  id: string;
  name: string;
  enabled: boolean;
  modelA: string;
  modelB: string;
  trafficSplit: number; // 0-100, percentage to model A
  metrics: {
    modelA: ABTestMetrics;
    modelB: ABTestMetrics;
  };
}

export interface ABTestMetrics {
  requests: number;
  avgLatency: number;
  avgTokens: number;
  errorRate: number;
  userSatisfaction: number;
}

export class ModelManager {
  private models: Map<string, LoadedModel> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private maxMemoryMB: number;
  private currentMemoryUsage: number = 0;

  constructor(maxMemoryMB: number = 16384) {
    this.maxMemoryMB = maxMemoryMB;
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    // GPT Models
    this.registerModel({
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      version: "2024-01",
      maxTokens: 4096,
      contextWindow: 128000,
      costPerInputToken: 0.00001,
      costPerOutputToken: 0.00003,
      supportedFeatures: ["chat", "functions", "vision", "json_mode"],
      memoryRequirement: 2048,
    });

    this.registerModel({
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
      version: "2024-01",
      maxTokens: 4096,
      contextWindow: 16384,
      costPerInputToken: 0.000001,
      costPerOutputToken: 0.000002,
      supportedFeatures: ["chat", "functions", "json_mode"],
      memoryRequirement: 1024,
    });

    // Claude Models
    this.registerModel({
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "anthropic",
      version: "2024-01",
      maxTokens: 4096,
      contextWindow: 200000,
      costPerInputToken: 0.000015,
      costPerOutputToken: 0.000075,
      supportedFeatures: ["chat", "vision", "long_context"],
      memoryRequirement: 3072,
    });

    this.registerModel({
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "anthropic",
      version: "2024-01",
      maxTokens: 4096,
      contextWindow: 200000,
      costPerInputToken: 0.000003,
      costPerOutputToken: 0.000015,
      supportedFeatures: ["chat", "vision", "long_context"],
      memoryRequirement: 2048,
    });

    // Llama Models
    this.registerModel({
      id: "llama-3-70b",
      name: "Llama 3 70B",
      provider: "llama",
      version: "3.0",
      maxTokens: 8192,
      contextWindow: 8192,
      costPerInputToken: 0.0000006,
      costPerOutputToken: 0.0000006,
      supportedFeatures: ["chat", "instruct"],
      memoryRequirement: 4096,
    });

    this.registerModel({
      id: "llama-3-8b",
      name: "Llama 3 8B",
      provider: "llama",
      version: "3.0",
      maxTokens: 8192,
      contextWindow: 8192,
      costPerInputToken: 0.00000015,
      costPerOutputToken: 0.00000015,
      supportedFeatures: ["chat", "instruct"],
      memoryRequirement: 512,
    });

    // Mistral Models
    this.registerModel({
      id: "mistral-large",
      name: "Mistral Large",
      provider: "custom",
      version: "1.0",
      maxTokens: 8192,
      contextWindow: 32768,
      costPerInputToken: 0.000004,
      costPerOutputToken: 0.000012,
      supportedFeatures: ["chat", "functions"],
      memoryRequirement: 2560,
    });

    // Auto-load most efficient models
    this.loadModel("gpt-3.5-turbo");
    this.loadModel("claude-3-sonnet");
    this.loadModel("llama-3-8b");
  }

  registerModel(metadata: ModelMetadata): void {
    const model: LoadedModel = {
      metadata,
      loaded: false,
      requestCount: 0,
      totalTokensProcessed: 0,
      averageLatency: 0,
      errorCount: 0,
      priority: 5, // Default priority
    };
    this.models.set(metadata.id, model);
  }

  async loadModel(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model) {
      console.error(`Model ${modelId} not found in registry`);
      return false;
    }

    if (model.loaded) {
      console.log(`Model ${modelId} already loaded`);
      return true;
    }

    // Check memory availability
    const requiredMemory = model.metadata.memoryRequirement;
    if (this.currentMemoryUsage + requiredMemory > this.maxMemoryMB) {
      console.log(`Insufficient memory for ${modelId}, attempting to free space...`);
      const freed = await this.freeMemory(requiredMemory);
      if (!freed) {
        console.error(`Cannot free enough memory for ${modelId}`);
        return false;
      }
    }

    // Simulate model loading (in production, this would load actual weights)
    console.log(`Loading model ${modelId} (${requiredMemory}MB)...`);
    await this.simulateModelLoad(modelId);

    model.loaded = true;
    model.loadedAt = new Date();
    model.lastUsedAt = new Date();
    this.currentMemoryUsage += requiredMemory;

    console.log(`Model ${modelId} loaded successfully`);
    return true;
  }

  async unloadModel(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model || !model.loaded) {
      return false;
    }

    console.log(`Unloading model ${modelId}...`);
    model.loaded = false;
    model.loadedAt = undefined;
    this.currentMemoryUsage -= model.metadata.memoryRequirement;

    console.log(`Model ${modelId} unloaded successfully`);
    return true;
  }

  private async freeMemory(requiredMB: number): Promise<boolean> {
    // Find least recently used, lowest priority models to unload
    const loadedModels = Array.from(this.models.values())
      .filter((m) => m.loaded)
      .sort((a, b) => {
        // Sort by priority (lower first), then by last used time (oldest first)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        const timeA = a.lastUsedAt?.getTime() || 0;
        const timeB = b.lastUsedAt?.getTime() || 0;
        return timeA - timeB;
      });

    let freedMemory = 0;
    for (const model of loadedModels) {
      if (freedMemory >= requiredMB) {
        break;
      }
      await this.unloadModel(model.metadata.id);
      freedMemory += model.metadata.memoryRequirement;
    }

    return freedMemory >= requiredMB;
  }

  private async simulateModelLoad(modelId: string): Promise<void> {
    // Simulate loading delay (in production, this would be actual model loading)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  getModel(modelId: string): LoadedModel | undefined {
    return this.models.get(modelId);
  }

  listModels(): LoadedModel[] {
    return Array.from(this.models.values());
  }

  listLoadedModels(): LoadedModel[] {
    return Array.from(this.models.values()).filter((m) => m.loaded);
  }

  updateModelStats(
    modelId: string,
    tokens: number,
    latencyMs: number,
    error: boolean = false
  ): void {
    const model = this.models.get(modelId);
    if (!model) return;

    model.requestCount++;
    model.totalTokensProcessed += tokens;
    model.lastUsedAt = new Date();

    // Update rolling average latency
    model.averageLatency =
      (model.averageLatency * (model.requestCount - 1) + latencyMs) /
      model.requestCount;

    if (error) {
      model.errorCount++;
    }
  }

  setModelPriority(modelId: string, priority: number): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;
    model.priority = Math.max(1, Math.min(10, priority)); // Clamp to 1-10
    return true;
  }

  // A/B Testing functionality
  createABTest(
    id: string,
    name: string,
    modelA: string,
    modelB: string,
    trafficSplit: number = 50
  ): boolean {
    if (!this.models.has(modelA) || !this.models.has(modelB)) {
      return false;
    }

    this.abTests.set(id, {
      id,
      name,
      enabled: true,
      modelA,
      modelB,
      trafficSplit: Math.max(0, Math.min(100, trafficSplit)),
      metrics: {
        modelA: this.createEmptyMetrics(),
        modelB: this.createEmptyMetrics(),
      },
    });

    return true;
  }

  private createEmptyMetrics(): ABTestMetrics {
    return {
      requests: 0,
      avgLatency: 0,
      avgTokens: 0,
      errorRate: 0,
      userSatisfaction: 0,
    };
  }

  getABTestModel(testId: string, userId?: string): string | null {
    const test = this.abTests.get(testId);
    if (!test || !test.enabled) return null;

    // Deterministic selection based on userId (if provided)
    if (userId) {
      const hash = this.simpleHash(userId);
      return hash % 100 < test.trafficSplit ? test.modelA : test.modelB;
    }

    // Random selection
    return Math.random() * 100 < test.trafficSplit ? test.modelA : test.modelB;
  }

  updateABTestMetrics(
    testId: string,
    modelId: string,
    latency: number,
    tokens: number,
    error: boolean
  ): void {
    const test = this.abTests.get(testId);
    if (!test) return;

    const metrics =
      modelId === test.modelA ? test.metrics.modelA : test.metrics.modelB;

    metrics.requests++;
    metrics.avgLatency =
      (metrics.avgLatency * (metrics.requests - 1) + latency) / metrics.requests;
    metrics.avgTokens =
      (metrics.avgTokens * (metrics.requests - 1) + tokens) / metrics.requests;

    if (error) {
      metrics.errorRate =
        (metrics.errorRate * (metrics.requests - 1) + 1) / metrics.requests;
    } else {
      metrics.errorRate =
        (metrics.errorRate * (metrics.requests - 1)) / metrics.requests;
    }
  }

  getABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  getABTest(testId: string): ABTestConfig | undefined {
    return this.abTests.get(testId);
  }

  disableABTest(testId: string): boolean {
    const test = this.abTests.get(testId);
    if (!test) return false;
    test.enabled = false;
    return true;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getMemoryStats(): { used: number; total: number; available: number } {
    return {
      used: this.currentMemoryUsage,
      total: this.maxMemoryMB,
      available: this.maxMemoryMB - this.currentMemoryUsage,
    };
  }

  // Model recommendation based on requirements
  recommendModel(requirements: {
    maxCost?: number;
    minContextWindow?: number;
    features?: string[];
    provider?: string;
  }): string | null {
    const candidates = Array.from(this.models.values()).filter((model) => {
      if (requirements.maxCost) {
        const avgCost =
          (model.metadata.costPerInputToken + model.metadata.costPerOutputToken) / 2;
        if (avgCost > requirements.maxCost) return false;
      }
      if (requirements.minContextWindow) {
        if (model.metadata.contextWindow < requirements.minContextWindow)
          return false;
      }
      if (requirements.features) {
        const hasAllFeatures = requirements.features.every((f) =>
          model.metadata.supportedFeatures.includes(f)
        );
        if (!hasAllFeatures) return false;
      }
      if (requirements.provider) {
        if (model.metadata.provider !== requirements.provider) return false;
      }
      return true;
    });

    if (candidates.length === 0) return null;

    // Return the most cost-effective model
    candidates.sort((a, b) => {
      const costA =
        (a.metadata.costPerInputToken + a.metadata.costPerOutputToken) / 2;
      const costB =
        (b.metadata.costPerInputToken + b.metadata.costPerOutputToken) / 2;
      return costA - costB;
    });

    return candidates[0].metadata.id;
  }
}
