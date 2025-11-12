/**
 * Hot Module Replacement (HMR)
 *
 * Implements HMR for instant feedback during development:
 * - Module hot swapping
 * - State preservation
 * - Dependency tracking
 * - Update propagation
 * - Error recovery
 */

export interface HMROptions {
  enabled?: boolean;
  port?: number;
  host?: string;
  overlay?: boolean;
  reload?: boolean;
  preserveState?: boolean;
}

export interface HMRUpdate {
  type: "update" | "dispose" | "accept" | "decline";
  moduleId: string;
  timestamp: number;
  dependencies?: string[];
  code?: string;
  error?: any;
}

export interface HMRRuntime {
  data: any;
  accept(deps?: string | string[], callback?: Function): void;
  decline(deps?: string | string[]): void;
  dispose(callback: (data: any) => void): void;
  invalidate(): void;
  status(): string;
}

export class HMRManager {
  private options: Required<HMROptions>;
  private modules: Map<string, any> = new Map();
  private acceptHandlers: Map<string, Set<Function>> = new Map();
  private disposeHandlers: Map<string, Function> = new Map();
  private hotData: Map<string, any> = new Map();
  private declinedModules: Set<string> = new Set();
  private status: "idle" | "check" | "prepare" | "ready" | "dispose" | "apply" | "abort" | "fail" = "idle";
  private updateQueue: HMRUpdate[] = [];

  constructor(options: HMROptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      port: options.port || 3000,
      host: options.host || "localhost",
      overlay: options.overlay ?? true,
      reload: options.reload ?? true,
      preserveState: options.preserveState ?? true,
    };
  }

  /**
   * Create HMR runtime for a module
   */
  createRuntime(moduleId: string): HMRRuntime {
    const self = this;

    return {
      data: this.hotData.get(moduleId) || {},

      accept(deps?: string | string[], callback?: Function): void {
        if (!deps) {
          // Self-accepting module
          if (!self.acceptHandlers.has(moduleId)) {
            self.acceptHandlers.set(moduleId, new Set());
          }
          if (callback) {
            self.acceptHandlers.get(moduleId)!.add(callback);
          }
        } else {
          // Accept specific dependencies
          const depList = typeof deps === "string" ? [deps] : deps;
          for (const dep of depList) {
            if (!self.acceptHandlers.has(dep)) {
              self.acceptHandlers.set(dep, new Set());
            }
            if (callback) {
              self.acceptHandlers.get(dep)!.add(callback);
            }
          }
        }
      },

      decline(deps?: string | string[]): void {
        if (!deps) {
          // Decline the module itself
          self.declinedModules.add(moduleId);
        } else {
          // Decline specific dependencies
          const depList = typeof deps === "string" ? [deps] : deps;
          for (const dep of depList) {
            self.declinedModules.add(dep);
          }
        }
      },

      dispose(callback: (data: any) => void): void {
        self.disposeHandlers.set(moduleId, callback);
      },

      invalidate(): void {
        self.invalidateModule(moduleId);
      },

      status(): string {
        return self.status;
      },
    };
  }

  /**
   * Check for updates
   */
  async check(): Promise<HMRUpdate[]> {
    if (this.status !== "idle") {
      throw new Error(`Cannot check for updates while status is ${this.status}`);
    }

    this.status = "check";

    try {
      // In a real implementation, this would fetch updates from the server
      const updates = [...this.updateQueue];
      this.updateQueue = [];

      this.status = "idle";
      return updates;
    } catch (error) {
      this.status = "fail";
      throw error;
    }
  }

  /**
   * Apply updates
   */
  async apply(updates: HMRUpdate[]): Promise<void> {
    if (this.status !== "idle") {
      throw new Error(`Cannot apply updates while status is ${this.status}`);
    }

    this.status = "prepare";

    try {
      // Dispose old modules
      this.status = "dispose";
      for (const update of updates) {
        await this.disposeModule(update.moduleId);
      }

      // Apply new modules
      this.status = "apply";
      for (const update of updates) {
        await this.applyUpdate(update);
      }

      this.status = "idle";
    } catch (error) {
      this.status = "fail";
      throw error;
    }
  }

  /**
   * Dispose a module
   */
  private async disposeModule(moduleId: string): Promise<void> {
    const disposeHandler = this.disposeHandlers.get(moduleId);

    if (disposeHandler) {
      // Create data object to preserve state
      const data = {};

      if (this.options.preserveState) {
        // Call dispose handler to save state
        try {
          disposeHandler(data);
          this.hotData.set(moduleId, data);
        } catch (error) {
          console.error(`Error in dispose handler for ${moduleId}:`, error);
        }
      }
    }

    // Remove the module
    this.modules.delete(moduleId);
  }

  /**
   * Apply an update
   */
  private async applyUpdate(update: HMRUpdate): Promise<void> {
    const { moduleId, code, dependencies } = update;

    // Check if module is declined
    if (this.declinedModules.has(moduleId)) {
      console.log(`Module ${moduleId} declined update, full reload required`);

      if (this.options.reload) {
        this.fullReload();
      }

      return;
    }

    try {
      // Execute new module code
      if (code) {
        const moduleExports = this.executeModule(moduleId, code);
        this.modules.set(moduleId, moduleExports);
      }

      // Call accept handlers
      const handlers = this.acceptHandlers.get(moduleId);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler();
          } catch (error) {
            console.error(`Error in accept handler for ${moduleId}:`, error);

            if (this.options.overlay) {
              this.showErrorOverlay(error);
            }

            throw error;
          }
        }
      }

      // Update dependencies
      if (dependencies) {
        for (const dep of dependencies) {
          const depHandlers = this.acceptHandlers.get(dep);
          if (depHandlers) {
            for (const handler of depHandlers) {
              await handler();
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to apply update for ${moduleId}:`, error);

      if (this.options.reload) {
        this.fullReload();
      }

      throw error;
    }
  }

  /**
   * Execute module code
   */
  private executeModule(moduleId: string, code: string): any {
    // Create module context
    const module = { exports: {} };
    const exports = module.exports;

    // Create require function
    const require = (id: string) => {
      return this.modules.get(id);
    };

    // Create HMR runtime
    const hot = this.createRuntime(moduleId);

    try {
      // Execute module code
      const moduleFunction = new Function("module", "exports", "require", "module.hot", code);
      moduleFunction(module, exports, require, hot);

      return module.exports;
    } catch (error) {
      console.error(`Error executing module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate a module
   */
  invalidateModule(moduleId: string): void {
    this.modules.delete(moduleId);
    this.acceptHandlers.delete(moduleId);
    this.disposeHandlers.delete(moduleId);
    this.hotData.delete(moduleId);
    this.declinedModules.delete(moduleId);
  }

  /**
   * Queue an update
   */
  queueUpdate(update: HMRUpdate): void {
    this.updateQueue.push(update);
  }

  /**
   * Full reload
   */
  private fullReload(): void {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      console.log("Full reload triggered");
    }
  }

  /**
   * Show error overlay
   */
  private showErrorOverlay(error: any): void {
    if (typeof window === "undefined") return;

    const overlay = document.createElement("div");
    overlay.id = "hmr-error-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 999999;
      padding: 40px;
      overflow: auto;
      font-family: monospace;
      color: #fff;
    `;

    overlay.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #f87171; margin-top: 0;">HMR Error</h2>
        <pre style="background: #2d2d2d; padding: 20px; border-radius: 4px; overflow-x: auto; color: #f87171;">${
          error.message || error
        }</pre>
        ${error.stack ? `<pre style="background: #2d2d2d; padding: 20px; border-radius: 4px; overflow-x: auto; margin-top: 20px;">${error.stack}</pre>` : ""}
        <button onclick="document.getElementById('hmr-error-overlay').remove()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Generate HMR runtime code
   */
  generateRuntimeCode(): string {
    return `
// HMR Runtime
(function() {
  const moduleCache = {};
  const acceptHandlers = {};
  const disposeHandlers = {};
  const hotData = {};

  // Create module.hot API
  function createHotContext(moduleId) {
    return {
      data: hotData[moduleId] || {},

      accept: function(deps, callback) {
        if (!deps) {
          // Self-accepting
          acceptHandlers[moduleId] = acceptHandlers[moduleId] || [];
          if (callback) acceptHandlers[moduleId].push(callback);
        } else {
          // Accept dependencies
          const depList = typeof deps === 'string' ? [deps] : deps;
          for (const dep of depList) {
            acceptHandlers[dep] = acceptHandlers[dep] || [];
            if (callback) acceptHandlers[dep].push(callback);
          }
        }
      },

      decline: function() {
        console.log('[HMR] Module declined:', moduleId);
      },

      dispose: function(callback) {
        disposeHandlers[moduleId] = callback;
      },

      invalidate: function() {
        delete moduleCache[moduleId];
      }
    };
  }

  // WebSocket connection for HMR
  const ws = new WebSocket('ws://${this.options.host}:${this.options.port}/__hmr');

  ws.onopen = function() {
    console.log('[HMR] Connected');
  };

  ws.onmessage = async function(event) {
    const update = JSON.parse(event.data);
    console.log('[HMR] Update received:', update);

    try {
      // Call dispose handlers
      if (disposeHandlers[update.moduleId]) {
        const data = {};
        disposeHandlers[update.moduleId](data);
        hotData[update.moduleId] = data;
      }

      // Apply update
      if (update.code) {
        const module = { exports: {} };
        const hot = createHotContext(update.moduleId);
        const fn = new Function('module', 'exports', 'module.hot', update.code);
        fn(module, module.exports, hot);
        moduleCache[update.moduleId] = module.exports;
      }

      // Call accept handlers
      if (acceptHandlers[update.moduleId]) {
        for (const handler of acceptHandlers[update.moduleId]) {
          await handler();
        }
      }

      console.log('[HMR] Update applied');
    } catch (error) {
      console.error('[HMR] Update failed:', error);
      ${this.options.reload ? "window.location.reload();" : ""}
    }
  };

  ws.onerror = function(error) {
    console.error('[HMR] WebSocket error:', error);
  };

  ws.onclose = function() {
    console.log('[HMR] Disconnected');
  };

  // Export for use
  if (typeof window !== 'undefined') {
    window.__HMR__ = {
      moduleCache,
      acceptHandlers,
      disposeHandlers,
      hotData,
    };
  }
})();
    `.trim();
  }

  /**
   * Get current status
   */
  getStatus(): string {
    return this.status;
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.modules.clear();
    this.acceptHandlers.clear();
    this.disposeHandlers.clear();
    this.hotData.clear();
    this.declinedModules.clear();
    this.updateQueue = [];
    this.status = "idle";
  }
}
