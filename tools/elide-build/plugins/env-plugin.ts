/**
 * Environment Plugin
 *
 * Inject environment variables into bundle
 */

import { Plugin } from "./index";

export interface EnvPluginOptions {
  env?: Record<string, string>;
  prefix?: string;
}

export function envPlugin(options: EnvPluginOptions = {}): Plugin {
  return {
    name: "env-plugin",

    async setup(build) {
      build.onTransform({ filter: /\.(js|ts|jsx|tsx)$/ }, async (args) => {
        let code = args.code;

        const env = options.env || process.env;
        const prefix = options.prefix || "ELIDE_";

        for (const [key, value] of Object.entries(env)) {
          if (key.startsWith(prefix)) {
            const placeholder = `process.env.${key}`;
            code = code.replace(new RegExp(placeholder, "g"), JSON.stringify(value));
          }
        }

        return code !== args.code ? { code } : null;
      });
    },
  };
}
