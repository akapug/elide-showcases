/**
 * Request/Response Transformation Plugin for API Gateway
 * Provides comprehensive data transformation capabilities:
 * - Header manipulation
 * - Body transformation (JSON, XML, protobuf)
 * - Query parameter manipulation
 * - Path rewriting
 * - Content negotiation
 * - Data filtering and masking
 * - Schema validation and transformation
 */

import { createHash } from "crypto";

interface TransformConfig {
  request?: RequestTransformConfig;
  response?: ResponseTransformConfig;
}

interface RequestTransformConfig {
  headers?: HeaderTransform;
  body?: BodyTransform;
  query?: QueryTransform;
  path?: PathTransform;
}

interface ResponseTransformConfig {
  headers?: HeaderTransform;
  body?: BodyTransform;
  status?: StatusTransform;
}

interface HeaderTransform {
  add?: Record<string, string>;
  remove?: string[];
  rename?: Record<string, string>;
  override?: Record<string, string>;
}

interface BodyTransform {
  jsonPath?: Array<{ path: string; operation: string; value?: any }>;
  template?: string;
  mask?: string[];
  filter?: string[];
  convert?: { from: string; to: string };
}

interface QueryTransform {
  add?: Record<string, string>;
  remove?: string[];
  rename?: Record<string, string>;
}

interface PathTransform {
  rewrite?: Array<{ pattern: RegExp; replacement: string }>;
  prefix?: string;
  suffix?: string;
}

interface StatusTransform {
  map?: Record<number, number>;
}

/**
 * Header Transformer
 * Manipulates HTTP headers
 */
export class HeaderTransformer {
  transform(
    headers: Record<string, string>,
    config: HeaderTransform,
  ): Record<string, string> {
    const result = { ...headers };

    // Remove headers
    if (config.remove) {
      for (const key of config.remove) {
        delete result[key.toLowerCase()];
      }
    }

    // Rename headers
    if (config.rename) {
      for (const [oldKey, newKey] of Object.entries(config.rename)) {
        const value = result[oldKey.toLowerCase()];
        if (value !== undefined) {
          delete result[oldKey.toLowerCase()];
          result[newKey.toLowerCase()] = value;
        }
      }
    }

    // Add headers (if not exists)
    if (config.add) {
      for (const [key, value] of Object.entries(config.add)) {
        if (result[key.toLowerCase()] === undefined) {
          result[key.toLowerCase()] = value;
        }
      }
    }

    // Override headers
    if (config.override) {
      for (const [key, value] of Object.entries(config.override)) {
        result[key.toLowerCase()] = value;
      }
    }

    return result;
  }

  /**
   * Add security headers
   */
  addSecurityHeaders(headers: Record<string, string>): Record<string, string> {
    return this.transform(headers, {
      add: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
      },
    });
  }

  /**
   * Remove sensitive headers
   */
  removeSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    return this.transform(headers, {
      remove: [
        "Authorization",
        "Cookie",
        "Set-Cookie",
        "X-API-Key",
        "X-Auth-Token",
      ],
    });
  }

  /**
   * Add CORS headers
   */
  addCORSHeaders(
    headers: Record<string, string>,
    config: {
      origin?: string;
      methods?: string[];
      allowedHeaders?: string[];
      credentials?: boolean;
    },
  ): Record<string, string> {
    return this.transform(headers, {
      add: {
        "Access-Control-Allow-Origin": config.origin || "*",
        "Access-Control-Allow-Methods": (
          config.methods || ["GET", "POST", "PUT", "DELETE"]
        ).join(", "),
        "Access-Control-Allow-Headers": (
          config.allowedHeaders || ["Content-Type", "Authorization"]
        ).join(", "),
        "Access-Control-Allow-Credentials": config.credentials ? "true" : "false",
      },
    });
  }
}

/**
 * Body Transformer
 * Transforms request and response bodies
 */
export class BodyTransformer {
  /**
   * Apply JSONPath operations
   */
  applyJSONPath(
    data: any,
    operations: Array<{ path: string; operation: string; value?: any }>,
  ): any {
    const result = JSON.parse(JSON.stringify(data));

    for (const op of operations) {
      const pathParts = op.path.split(".");

      switch (op.operation) {
        case "set":
          this.setValueAtPath(result, pathParts, op.value);
          break;
        case "delete":
          this.deleteValueAtPath(result, pathParts);
          break;
        case "append":
          this.appendValueAtPath(result, pathParts, op.value);
          break;
        case "rename":
          this.renameKeyAtPath(result, pathParts, op.value);
          break;
      }
    }

    return result;
  }

  private setValueAtPath(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  private deleteValueAtPath(obj: any, path: string[]): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        return;
      }
      current = current[path[i]];
    }
    delete current[path[path.length - 1]];
  }

  private appendValueAtPath(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    const key = path[path.length - 1];
    if (!Array.isArray(current[key])) {
      current[key] = [];
    }
    current[key].push(value);
  }

  private renameKeyAtPath(obj: any, path: string[], newKey: string): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        return;
      }
      current = current[path[i]];
    }
    const oldKey = path[path.length - 1];
    if (current[oldKey] !== undefined) {
      current[newKey] = current[oldKey];
      delete current[oldKey];
    }
  }

  /**
   * Mask sensitive fields
   */
  maskFields(data: any, fields: string[]): any {
    const result = JSON.parse(JSON.stringify(data));

    const maskValue = (value: any): string => {
      if (typeof value === "string") {
        return value.length > 4
          ? `${value.substring(0, 2)}${"*".repeat(value.length - 4)}${value.substring(value.length - 2)}`
          : "****";
      }
      return "****";
    };

    const traverse = (obj: any, path: string[] = []): void => {
      if (typeof obj !== "object" || obj === null) {
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key].join(".");

        if (fields.includes(currentPath) || fields.includes(key)) {
          obj[key] = maskValue(value);
        } else if (typeof value === "object" && value !== null) {
          traverse(value, [...path, key]);
        }
      }
    };

    traverse(result);
    return result;
  }

  /**
   * Filter fields (whitelist)
   */
  filterFields(data: any, allowedFields: string[]): any {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.filterFields(item, allowedFields));
    }

    const result: any = {};

    for (const field of allowedFields) {
      const parts = field.split(".");
      if (parts.length === 1) {
        if (data[field] !== undefined) {
          result[field] = data[field];
        }
      } else {
        // Nested field
        const [first, ...rest] = parts;
        if (data[first] !== undefined) {
          if (!result[first]) {
            result[first] = {};
          }
          const filtered = this.filterFields(data[first], [rest.join(".")]);
          Object.assign(result[first], filtered);
        }
      }
    }

    return result;
  }

  /**
   * Apply template transformation
   */
  applyTemplate(data: any, template: string): any {
    let result = template;

    // Replace {{field.path}} with actual values
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const path = match.slice(2, -2).trim();
        const value = this.getValueByPath(data, path.split("."));
        result = result.replace(match, JSON.stringify(value));
      }
    }

    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }

  private getValueByPath(obj: any, path: string[]): any {
    let current = obj;
    for (const part of path) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  /**
   * Convert between formats
   */
  async convert(
    data: any,
    from: string,
    to: string,
  ): Promise<any> {
    // JSON to XML
    if (from === "json" && to === "xml") {
      return this.jsonToXML(data);
    }

    // XML to JSON
    if (from === "xml" && to === "json") {
      return this.xmlToJSON(data);
    }

    // JSON to YAML
    if (from === "json" && to === "yaml") {
      return this.jsonToYAML(data);
    }

    return data;
  }

  private jsonToXML(obj: any, rootName: string = "root"): string {
    const buildXML = (data: any, name: string): string => {
      if (data === null || data === undefined) {
        return `<${name}/>`;
      }

      if (typeof data !== "object") {
        return `<${name}>${this.escapeXML(String(data))}</${name}>`;
      }

      if (Array.isArray(data)) {
        return data.map((item) => buildXML(item, name)).join("");
      }

      const children = Object.entries(data)
        .map(([key, value]) => buildXML(value, key))
        .join("");

      return `<${name}>${children}</${name}>`;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>${buildXML(obj, rootName)}`;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private xmlToJSON(xml: string): any {
    // Simplified XML to JSON conversion
    // In production, use a proper XML parser
    const result: any = {};
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    let match;

    while ((match = tagRegex.exec(xml)) !== null) {
      const [, tag, content] = match;
      if (content.includes("<")) {
        result[tag] = this.xmlToJSON(content);
      } else {
        result[tag] = content;
      }
    }

    return result;
  }

  private jsonToYAML(obj: any, indent: number = 0): string {
    const spaces = "  ".repeat(indent);

    if (obj === null || obj === undefined) {
      return "null";
    }

    if (typeof obj !== "object") {
      return typeof obj === "string" ? `"${obj}"` : String(obj);
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => `${spaces}- ${this.jsonToYAML(item, indent + 1)}`)
        .join("\n");
    }

    return Object.entries(obj)
      .map(
        ([key, value]) =>
          `${spaces}${key}: ${this.jsonToYAML(value, indent + 1)}`,
      )
      .join("\n");
  }
}

/**
 * Query Parameter Transformer
 */
export class QueryTransformer {
  transform(
    query: Record<string, string>,
    config: QueryTransform,
  ): Record<string, string> {
    const result = { ...query };

    // Remove parameters
    if (config.remove) {
      for (const key of config.remove) {
        delete result[key];
      }
    }

    // Rename parameters
    if (config.rename) {
      for (const [oldKey, newKey] of Object.entries(config.rename)) {
        if (result[oldKey] !== undefined) {
          result[newKey] = result[oldKey];
          delete result[oldKey];
        }
      }
    }

    // Add parameters
    if (config.add) {
      for (const [key, value] of Object.entries(config.add)) {
        if (result[key] === undefined) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Parse complex query parameters
   */
  parseComplex(query: Record<string, string>): any {
    const result: any = {};

    for (const [key, value] of Object.entries(query)) {
      // Handle array notation: param[]=value
      if (key.endsWith("[]")) {
        const arrayKey = key.slice(0, -2);
        if (!result[arrayKey]) {
          result[arrayKey] = [];
        }
        result[arrayKey].push(value);
      }
      // Handle nested notation: param[field]=value
      else if (key.includes("[") && key.includes("]")) {
        const match = key.match(/^([^\[]+)\[([^\]]+)\]$/);
        if (match) {
          const [, objectKey, field] = match;
          if (!result[objectKey]) {
            result[objectKey] = {};
          }
          result[objectKey][field] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Stringify complex query parameters
   */
  stringifyComplex(data: any): string {
    const params: string[] = [];

    const processValue = (key: string, value: any): void => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          params.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`);
        });
      } else if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([field, val]) => {
          params.push(
            `${encodeURIComponent(key)}[${encodeURIComponent(field)}]=${encodeURIComponent(String(val))}`,
          );
        });
      } else {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    };

    Object.entries(data).forEach(([key, value]) => processValue(key, value));

    return params.join("&");
  }
}

/**
 * Path Transformer
 */
export class PathTransformer {
  transform(path: string, config: PathTransform): string {
    let result = path;

    // Apply prefix
    if (config.prefix) {
      result = `${config.prefix}${result}`;
    }

    // Apply suffix
    if (config.suffix) {
      result = `${result}${config.suffix}`;
    }

    // Apply rewrites
    if (config.rewrite) {
      for (const rule of config.rewrite) {
        result = result.replace(rule.pattern, rule.replacement);
      }
    }

    return result;
  }

  /**
   * Extract path parameters
   */
  extractParams(path: string, pattern: string): Record<string, string> | null {
    const paramNames: string[] = [];
    const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    });

    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);

    if (!match) {
      return null;
    }

    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return params;
  }
}

/**
 * Content Negotiation
 */
export class ContentNegotiator {
  private supportedFormats = new Map<string, string[]>([
    ["json", ["application/json", "application/vnd.api+json"]],
    ["xml", ["application/xml", "text/xml"]],
    ["yaml", ["application/yaml", "text/yaml"]],
    ["html", ["text/html"]],
    ["text", ["text/plain"]],
  ]);

  negotiate(acceptHeader: string): string | null {
    const accepts = this.parseAcceptHeader(acceptHeader);

    for (const accept of accepts) {
      for (const [format, mimeTypes] of this.supportedFormats.entries()) {
        if (mimeTypes.some((mime) => this.matchMimeType(accept.type, mime))) {
          return format;
        }
      }
    }

    return null;
  }

  private parseAcceptHeader(header: string): Array<{ type: string; quality: number }> {
    return header
      .split(",")
      .map((part) => {
        const [type, ...params] = part.trim().split(";");
        const quality = params
          .find((p) => p.trim().startsWith("q="))
          ?.split("=")[1];
        return {
          type: type.trim(),
          quality: quality ? parseFloat(quality) : 1.0,
        };
      })
      .sort((a, b) => b.quality - a.quality);
  }

  private matchMimeType(pattern: string, mimeType: string): boolean {
    const patternParts = pattern.split("/");
    const mimeTypeParts = mimeType.split("/");

    if (patternParts[0] === "*" || patternParts[0] === mimeTypeParts[0]) {
      if (patternParts[1] === "*" || patternParts[1] === mimeTypeParts[1]) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Main Transform Plugin
 */
export class TransformPlugin {
  private headerTransformer = new HeaderTransformer();
  private bodyTransformer = new BodyTransformer();
  private queryTransformer = new QueryTransformer();
  private pathTransformer = new PathTransformer();
  private contentNegotiator = new ContentNegotiator();

  async transformRequest(
    request: {
      headers: Record<string, string>;
      body?: any;
      query?: Record<string, string>;
      path: string;
    },
    config: RequestTransformConfig,
  ): Promise<any> {
    const result = { ...request };

    // Transform headers
    if (config.headers) {
      result.headers = this.headerTransformer.transform(
        result.headers,
        config.headers,
      );
    }

    // Transform body
    if (config.body && result.body) {
      if (config.body.jsonPath) {
        result.body = this.bodyTransformer.applyJSONPath(
          result.body,
          config.body.jsonPath,
        );
      }

      if (config.body.mask) {
        result.body = this.bodyTransformer.maskFields(result.body, config.body.mask);
      }

      if (config.body.filter) {
        result.body = this.bodyTransformer.filterFields(
          result.body,
          config.body.filter,
        );
      }

      if (config.body.template) {
        result.body = this.bodyTransformer.applyTemplate(
          result.body,
          config.body.template,
        );
      }

      if (config.body.convert) {
        result.body = await this.bodyTransformer.convert(
          result.body,
          config.body.convert.from,
          config.body.convert.to,
        );
      }
    }

    // Transform query
    if (config.query && result.query) {
      result.query = this.queryTransformer.transform(result.query, config.query);
    }

    // Transform path
    if (config.path) {
      result.path = this.pathTransformer.transform(result.path, config.path);
    }

    return result;
  }

  async transformResponse(
    response: {
      headers: Record<string, string>;
      body?: any;
      status: number;
    },
    config: ResponseTransformConfig,
  ): Promise<any> {
    const result = { ...response };

    // Transform status
    if (config.status?.map && result.status) {
      result.status = config.status.map[result.status] || result.status;
    }

    // Transform headers
    if (config.headers) {
      result.headers = this.headerTransformer.transform(
        result.headers,
        config.headers,
      );
    }

    // Transform body
    if (config.body && result.body) {
      if (config.body.jsonPath) {
        result.body = this.bodyTransformer.applyJSONPath(
          result.body,
          config.body.jsonPath,
        );
      }

      if (config.body.mask) {
        result.body = this.bodyTransformer.maskFields(result.body, config.body.mask);
      }

      if (config.body.filter) {
        result.body = this.bodyTransformer.filterFields(
          result.body,
          config.body.filter,
        );
      }

      if (config.body.template) {
        result.body = this.bodyTransformer.applyTemplate(
          result.body,
          config.body.template,
        );
      }

      if (config.body.convert) {
        result.body = await this.bodyTransformer.convert(
          result.body,
          config.body.convert.from,
          config.body.convert.to,
        );
      }
    }

    return result;
  }
}

export default TransformPlugin;
