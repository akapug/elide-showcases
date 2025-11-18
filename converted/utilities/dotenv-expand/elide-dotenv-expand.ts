/**
 * Elide dotenv-expand - Expand Environment Variables
 * NPM Package: dotenv-expand | Weekly Downloads: ~15,000,000 | License: BSD-2-Clause
 */

export interface DotenvExpandOptions {
  parsed?: Record<string, string>;
  ignoreProcessEnv?: boolean;
}

export function expand(options: DotenvExpandOptions): DotenvExpandOptions {
  const parsed = options.parsed || {};
  
  Object.keys(parsed).forEach(key => {
    let value = parsed[key];
    
    // Expand variables like ${${VAR}}
    value = value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
      return parsed[varName] || process.env[varName] || '';
    });
    
    parsed[key] = value;
    
    if (!options.ignoreProcessEnv) {
      process.env[key] = value;
    }
  });
  
  return { ...options, parsed };
}

export default expand;
