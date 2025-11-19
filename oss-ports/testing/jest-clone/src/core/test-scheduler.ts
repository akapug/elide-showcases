/**
 * Jest Clone - Test Scheduler
 * Manages parallel test execution and resource allocation
 */

import type { TestResult } from '../types';

export interface Task {
  id: string;
  testPath: string;
  priority: number;
  dependencies: string[];
  execute: () => Promise<TestResult>;
}

export class TestScheduler {
  private maxWorkers: number;
  private activeWorkers = 0;
  private queue: Task[] = [];
  private results: Map<string, TestResult> = new Map();
  private completed: Set<string> = new Set();

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
  }

  async schedule(tasks: Task[]): Promise<Map<string, TestResult>> {
    // Sort tasks by priority
    this.queue = tasks.sort((a, b) => b.priority - a.priority);

    // Process tasks
    while (this.queue.length > 0 || this.activeWorkers > 0) {
      await this.processNextTask();
    }

    return this.results;
  }

  private async processNextTask(): Promise<void> {
    // Find tasks that can be executed
    const executableTasks = this.queue.filter(task =>
      task.dependencies.every(dep => this.completed.has(dep))
    );

    if (executableTasks.length === 0 && this.activeWorkers === 0) {
      // No more tasks to execute
      return;
    }

    // Execute tasks in parallel up to maxWorkers
    const availableSlots = this.maxWorkers - this.activeWorkers;
    const tasksToRun = executableTasks.slice(0, availableSlots);

    for (const task of tasksToRun) {
      this.executeTask(task);
    }

    // Wait for at least one task to complete
    if (this.activeWorkers >= this.maxWorkers) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async executeTask(task: Task): Promise<void> {
    // Remove from queue
    const index = this.queue.indexOf(task);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    this.activeWorkers++;

    try {
      const result = await task.execute();
      this.results.set(task.id, result);
      this.completed.add(task.id);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    } finally {
      this.activeWorkers--;
    }
  }

  getProgress(): { total: number; completed: number; active: number } {
    return {
      total: this.queue.length + this.completed.size + this.activeWorkers,
      completed: this.completed.size,
      active: this.activeWorkers
    };
  }
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{ task: Task; resolve: Function; reject: Function }> = [];

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(i);
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  async execute(task: Task): Promise<TestResult> {
    return new Promise((resolve, reject) => {
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.pop()!;
        this.runTask(worker, task, resolve, reject);
      } else {
        this.taskQueue.push({ task, resolve, reject });
      }
    });
  }

  private async runTask(
    worker: Worker,
    task: Task,
    resolve: Function,
    reject: Function
  ): Promise<void> {
    try {
      const result = await worker.run(task);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      // Return worker to pool
      this.availableWorkers.push(worker);

      // Process next task if available
      if (this.taskQueue.length > 0) {
        const next = this.taskQueue.shift()!;
        this.runTask(worker, next.task, next.resolve, next.reject);
      }
    }
  }

  async terminate(): Promise<void> {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
    this.availableWorkers = [];
  }
}

export class Worker {
  private id: number;
  private busy = false;

  constructor(id: number) {
    this.id = id;
  }

  async run(task: Task): Promise<TestResult> {
    this.busy = true;

    try {
      return await task.execute();
    } finally {
      this.busy = false;
    }
  }

  isBusy(): boolean {
    return this.busy;
  }

  async terminate(): Promise<void> {
    // Cleanup worker
  }
}

export class DependencyGraph {
  private nodes: Map<string, Set<string>> = new Map();

  addDependency(task: string, dependency: string): void {
    if (!this.nodes.has(task)) {
      this.nodes.set(task, new Set());
    }
    this.nodes.get(task)!.add(dependency);
  }

  getDependencies(task: string): string[] {
    return Array.from(this.nodes.get(task) || []);
  }

  getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (task: string) => {
      if (visited.has(task)) return;
      visited.add(task);

      const deps = this.nodes.get(task) || new Set();
      for (const dep of deps) {
        visit(dep);
      }

      order.push(task);
    };

    for (const task of this.nodes.keys()) {
      visit(task);
    }

    return order;
  }

  hasCycle(): boolean {
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (task: string): boolean => {
      if (visited.has(task)) return false;
      if (visiting.has(task)) return true;

      visiting.add(task);

      const deps = this.nodes.get(task) || new Set();
      for (const dep of deps) {
        if (visit(dep)) return true;
      }

      visiting.delete(task);
      visited.add(task);
      return false;
    };

    for (const task of this.nodes.keys()) {
      if (visit(task)) return true;
    }

    return false;
  }
}

export class ResourceManager {
  private resources: Map<string, Resource> = new Map();
  private locks: Map<string, string> = new Map();

  async acquire(resourceId: string, taskId: string): Promise<Resource> {
    // Wait for resource to be available
    while (this.locks.has(resourceId)) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Lock resource
    this.locks.set(resourceId, taskId);

    // Return or create resource
    let resource = this.resources.get(resourceId);
    if (!resource) {
      resource = new Resource(resourceId);
      this.resources.set(resourceId, resource);
    }

    return resource;
  }

  release(resourceId: string, taskId: string): void {
    const lockOwner = this.locks.get(resourceId);
    if (lockOwner === taskId) {
      this.locks.delete(resourceId);
    }
  }

  cleanup(): void {
    for (const resource of this.resources.values()) {
      resource.dispose();
    }
    this.resources.clear();
    this.locks.clear();
  }
}

export class Resource {
  private id: string;
  private data: any = {};

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  set(key: string, value: any): void {
    this.data[key] = value;
  }

  get(key: string): any {
    return this.data[key];
  }

  dispose(): void {
    this.data = {};
  }
}
