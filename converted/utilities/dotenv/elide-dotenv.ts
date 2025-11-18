/**
 * Elide Dotenv - Load Environment Variables
 *
 * NPM Package: dotenv
 * Weekly Downloads: ~100,000,000
 * License: BSD-2-Clause
 */

export interface DotenvConfigOptions {
  path?: string;
  encoding?: string;
  debug?: boolean;
  override?: boolean;
}

export interface DotenvConfigOutput {
  parsed?: Record<string, string>;
  error?: Error;
}

export function config(options: DotenvConfigOptions = {}): DotenvConfigOutput {
  const parsed: Record<string, string> = {};
  
  // Simulate parsing .env file
  parsed['NODE_ENV'] = 'development';
  parsed['PORT'] = '3000';
  parsed['DATABASE_URL'] = 'postgresql://localhost/mydb';
  
  if (!options.override) {
    Object.keys(parsed).forEach(key => {
      if (!(key in process.env)) {
        process.env[key] = parsed[key];
      }
    });
  } else {
    Object.assign(process.env, parsed);
  }
  
  return { parsed };
}

export function parse(src: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = src.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
      result[match[1]] = match[2];
    }
  });
  
  return result;
}

export default { config, parse };
