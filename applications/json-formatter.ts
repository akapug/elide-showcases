#!/usr/bin/env elide
/**
 * JSON Formatter & Validator
 * Features: Pretty print, validate, minify
 */

interface FormatOptions {
  indent?: number;
  sortKeys?: boolean;
}

function formatJSON(input: string, options: FormatOptions = {}): string {
  const { indent = 2, sortKeys = false } = options;
  
  try {
    let obj = JSON.parse(input);
    
    if (sortKeys) {
      obj = sortObjectKeys(obj);
    }
    
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
}

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
      }, {} as any);
  }
  return obj;
}

function minifyJSON(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

function validateJSON(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

// Demo
if (import.meta.url.includes("json-formatter.ts")) {
  console.log("🔧 JSON Formatter & Validator\n");
  
  const messy = '{"name":"Elide","features":["fast","typescript","polyglot"],"version":1}';
  
  console.log("Minified:");
  console.log(messy);
  
  console.log("\nPretty:");
  console.log(formatJSON(messy));
  
  console.log("\nSorted Keys:");
  console.log(formatJSON(messy, { sortKeys: true }));
  
  console.log("\nValidation:");
  console.log("✅", validateJSON(messy));
  console.log("❌", validateJSON("{invalid}"));
}

export { formatJSON, minifyJSON, validateJSON };
