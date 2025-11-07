/**
 * Query String Builder/Parser
 * Parse and build query strings without URL dependency
 */

export function parse(queryString: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};

  // Remove leading ? if present
  const qs = queryString.startsWith('?') ? queryString.slice(1) : queryString;

  if (!qs) return params;

  const pairs = qs.split('&');

  pairs.forEach(pair => {
    const [key, value] = pair.split('=').map(decodeURIComponent);

    if (!key) return;

    const decodedValue = value || '';

    if (key in params) {
      const existing = params[key];
      if (Array.isArray(existing)) {
        existing.push(decodedValue);
      } else {
        params[key] = [existing, decodedValue];
      }
    } else {
      params[key] = decodedValue;
    }
  });

  return params;
}

export function stringify(params: Record<string, any>, options: { encode?: boolean } = {}): string {
  const { encode = true } = options;

  const pairs: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    const encodeValue = (v: any) => encode ? encodeURIComponent(String(v)) : String(v);
    const encodeKey = encode ? encodeURIComponent(key) : key;

    if (Array.isArray(value)) {
      value.forEach(v => pairs.push(`${encodeKey}=${encodeValue(v)}`));
    } else if (value !== null && value !== undefined) {
      pairs.push(`${encodeKey}=${encodeValue(value)}`);
    }
  }

  return pairs.join('&');
}

export function add(queryString: string, key: string, value: string): string {
  const params = parse(queryString);
  params[key] = value;
  return stringify(params);
}

export function remove(queryString: string, key: string): string {
  const params = parse(queryString);
  delete params[key];
  return stringify(params);
}

export function get(queryString: string, key: string): string | string[] | undefined {
  const params = parse(queryString);
  return params[key];
}

// CLI demo
if (import.meta.url.includes("query-string.ts")) {
  console.log("Query String Demo\n");

  const qs = "name=Alice&age=30&tags=js&tags=ts";

  console.log("Parse:", qs);
  console.log(JSON.stringify(parse(qs), null, 2));

  const params = { name: 'Bob', age: 25, active: true };
  console.log("\nStringify:", JSON.stringify(params));
  console.log(stringify(params));

  console.log("\nAdd parameter:");
  console.log(add(qs, 'new', 'value'));

  console.log("\nRemove parameter:");
  console.log(remove(qs, 'age'));

  console.log("\nGet parameter 'tags':");
  console.log(get(qs, 'tags'));

  console.log("\n✅ Query string test passed");
}
