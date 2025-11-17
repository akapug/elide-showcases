/**
 * Lifecycle hooks
 */

export interface Hook {
  before?: (params: any) => Promise<any>;
  after?: (result: any, params: any) => Promise<any>;
}

export class HookManager {
  private hooks: Map<string, Hook[]> = new Map();

  register(event: string, hook: Hook): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(hook);
  }

  async runBefore(event: string, params: any): Promise<any> {
    const hooks = this.hooks.get(event) || [];
    let result = params;

    for (const hook of hooks) {
      if (hook.before) {
        result = await hook.before(result);
      }
    }

    return result;
  }

  async runAfter(event: string, result: any, params: any): Promise<any> {
    const hooks = this.hooks.get(event) || [];
    let finalResult = result;

    for (const hook of hooks) {
      if (hook.after) {
        finalResult = await hook.after(finalResult, params);
      }
    }

    return finalResult;
  }
}
