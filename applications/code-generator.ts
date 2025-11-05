#!/usr/bin/env elide
/**
 * TypeScript Interface Generator from JSON
 * Real-world code generation tool
 */

function jsonToInterface(json: string, interfaceName: string = "Generated"): string {
  const obj = JSON.parse(json);
  return objectToInterface(obj, interfaceName);
}

function objectToInterface(obj: any, name: string): string {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Expected an object');
  }
  
  let result = `interface ${name} {\n`;
  
  for (const [key, value] of Object.entries(obj)) {
    const type = inferType(value);
    result += `  ${key}: ${type};\n`;
  }
  
  result += '}';
  return result;
}

function inferType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    const itemType = inferType(value[0]);
    return `${itemType}[]`;
  }
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'any';
}

// Demo
if (import.meta.url.includes("code-generator.ts")) {
  console.log("⚙️  TypeScript Interface Generator\n");
  
  const sample = {
    name: "Elide",
    version: 1,
    features: ["TypeScript", "Polyglot", "Fast"],
    config: {
      enabled: true,
      timeout: 5000
    }
  };
  
  console.log("Input JSON:");
  console.log(JSON.stringify(sample, null, 2));
  
  console.log("\nGenerated TypeScript Interface:");
  console.log(jsonToInterface(JSON.stringify(sample), "ElideConfig"));
}

export { jsonToInterface, objectToInterface };
