/**
 * Elide Build Configuration
 *
 * Configuration system with:
 * - TypeScript configuration file support
 * - Framework presets
 * - Configuration merging
 * - Environment-specific configs
 */

import * as fs from "fs";
import * as path from "path";
import { BundlerOptions } from "../bundler/index";
import { DevServerOptions } from "../dev-server/index";
import { ProductionOptions } from "../production/index";

export interface ElideConfig {
  bundle?: BundlerOptions;
  dev?: DevServerOptions;
  production?: ProductionOptions;
  extends?: string;
}

export class ConfigLoader {
  private configCache: Map<string, ElideConfig> = new Map();

  /**
   * Load configuration from file
   */
  async load(configPath?: string): Promise<ElideConfig> {
    const path = configPath || this.findConfig();

    if (!path) {
      return {};
    }

    // Check cache
    if (this.configCache.has(path)) {
      return this.configCache.get(path)!;
    }

    let config: ElideConfig = {};

    // Load config file
    if (path.endsWith(".ts")) {
      config = await this.loadTypeScript(path);
    } else if (path.endsWith(".js")) {
      config = await this.loadJavaScript(path);
    } else if (path.endsWith(".json")) {
      config = await this.loadJSON(path);
    }

    // Handle extends
    if (config.extends) {
      const baseConfig = await this.load(config.extends);
      config = this.mergeConfig(baseConfig, config);
    }

    this.configCache.set(path, config);

    return config;
  }

  /**
   * Find config file in current directory
   */
  private findConfig(): string | null {
    const configFiles = [
      "elide.config.ts",
      "elide.config.js",
      "elide.config.json",
      ".eliderc.ts",
      ".eliderc.js",
      ".eliderc.json",
    ];

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        return file;
      }
    }

    return null;
  }

  /**
   * Load TypeScript config
   */
  private async loadTypeScript(path: string): Promise<ElideConfig> {
    // In production, use ts-node or similar to load TypeScript
    // For now, treat as JavaScript
    return this.loadJavaScript(path);
  }

  /**
   * Load JavaScript config
   */
  private async loadJavaScript(path: string): Promise<ElideConfig> {
    const config = require(path);
    return config.default || config;
  }

  /**
   * Load JSON config
   */
  private async loadJSON(path: string): Promise<ElideConfig> {
    const content = fs.readFileSync(path, "utf-8");
    return JSON.parse(content);
  }

  /**
   * Merge configurations
   */
  private mergeConfig(base: ElideConfig, override: ElideConfig): ElideConfig {
    return {
      bundle: { ...base.bundle, ...override.bundle },
      dev: { ...base.dev, ...override.dev },
      production: { ...base.production, ...override.production },
    };
  }

  /**
   * Get preset configuration
   */
  getPreset(name: string): ElideConfig {
    const presets: Record<string, ElideConfig> = {
      react: {
        bundle: {
          format: "esm",
          target: "es2020",
          jsx: "react-jsx",
          jsxImportSource: "react",
        },
        dev: {
          port: 3000,
          hmr: true,
          open: true,
        },
        production: {
          minify: true,
          sourcemap: true,
          splitting: true,
          treeshake: true,
        },
      },

      vue: {
        bundle: {
          format: "esm",
          target: "es2020",
        },
        dev: {
          port: 5173,
          hmr: true,
        },
        production: {
          minify: true,
          splitting: true,
        },
      },

      node: {
        bundle: {
          format: "cjs",
          target: "node",
          external: ["*"],
        },
        production: {
          minify: false,
          sourcemap: "external",
        },
      },

      library: {
        bundle: {
          format: "esm",
          target: "es2020",
        },
        production: {
          minify: true,
          sourcemap: true,
          targets: [
            { name: "esm", outDir: "dist/esm", format: "esm" },
            { name: "cjs", outDir: "dist/cjs", format: "cjs" },
            { name: "umd", outDir: "dist/umd", format: "umd" },
          ],
        },
      },
    };

    return presets[name] || {};
  }

  /**
   * Create example config file
   */
  createExampleConfig(preset?: string): string {
    const config = preset ? this.getPreset(preset) : {};

    return `
import { defineConfig } from '@elide/build';

export default defineConfig({
  bundle: {
    entry: 'src/index.ts',
    outDir: 'dist',
    format: 'esm',
    target: 'es2020',
    minify: false,
    sourcemap: true,
    splitting: true,
    treeshake: true,
  },

  dev: {
    port: 3000,
    hmr: true,
    open: true,
    cors: true,
  },

  production: {
    minify: true,
    sourcemap: true,
    analyze: true,
    contentHash: true,
  },
});
    `.trim();
  }
}

/**
 * Helper to define config with TypeScript support
 */
export function defineConfig(config: ElideConfig): ElideConfig {
  return config;
}
