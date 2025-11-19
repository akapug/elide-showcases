/**
 * Code Generator - Generate Client Code from OpenAPI Spec
 *
 * Supports TypeScript, JavaScript, Python, Java, Go, and cURL.
 */

import { OpenAPISpec, OperationObject, ParameterObject, getAllOperations } from '../parser/openapi-parser'

export interface TypeScriptOptions {
  moduleName: string
  includeTypes: boolean
  axios?: boolean
}

export interface PythonOptions {
  className: string
  includeTyping: boolean
}

export interface CurlOptions {
  operationId: string
  parameters?: Record<string, any>
  body?: any
}

/**
 * Code Generator class
 */
export class CodeGenerator {
  constructor(private spec: OpenAPISpec) {}

  /**
   * Generate TypeScript client
   */
  generateTypeScript(options: TypeScriptOptions): string {
    const { moduleName, includeTypes, axios } = options
    let code = ''

    // Imports
    code += `${axios ? "import axios from 'axios';\n" : ''}
${includeTypes ? `
// Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
` : ''}

export class ${moduleName} {
  private baseURL: string;
  private headers: Record<string, string> = {};

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  setAuthToken(token: string): void {
    this.headers['Authorization'] = \`Bearer \${token}\`;
  }

`

    // Generate methods for each operation
    const operations = getAllOperations(this.spec)

    for (const { path, method, operation } of operations) {
      code += this.generateTypeScriptMethod(path, method, operation, axios || false)
    }

    code += '}\n'

    return code
  }

  /**
   * Generate TypeScript method
   */
  private generateTypeScriptMethod(path: string, method: string, operation: OperationObject, useAxios: boolean): string {
    const methodName = operation.operationId || `${method.toLowerCase()}${this.pathToMethodName(path)}`
    const params = (operation.parameters || []) as ParameterObject[]

    let code = `  async ${methodName}(`

    // Parameters
    const pathParams = params.filter(p => p.in === 'path')
    const queryParams = params.filter(p => p.in === 'query')
    const headerParams = params.filter(p => p.in === 'header')

    const allParams: string[] = []

    if (pathParams.length > 0) {
      allParams.push(...pathParams.map(p => `${p.name}: ${this.getTypeScriptType(p)}`))
    }

    if (queryParams.length > 0) {
      allParams.push(`query?: { ${queryParams.map(p => `${p.name}?: ${this.getTypeScriptType(p)}`).join('; ')} }`)
    }

    if (operation.requestBody) {
      allParams.push('body?: any')
    }

    code += allParams.join(', ')
    code += `): Promise<any> {\n`

    // Build URL
    let urlPath = path
    for (const param of pathParams) {
      urlPath = urlPath.replace(`{${param.name}}`, `\${${param.name}}`)
    }

    code += `    let url = \`\${this.baseURL}${urlPath}\`;\n`

    if (queryParams.length > 0) {
      code += `    if (query) {\n`
      code += `      const params = new URLSearchParams();\n`
      for (const param of queryParams) {
        code += `      if (query.${param.name} !== undefined) params.append('${param.name}', String(query.${param.name}));\n`
      }
      code += `      url += '?' + params.toString();\n`
      code += `    }\n`
    }

    // Request
    if (useAxios) {
      code += `    const response = await axios({ method: '${method}', url, headers: this.headers${operation.requestBody ? ', data: body' : ''} });\n`
      code += `    return response.data;\n`
    } else {
      code += `    const response = await fetch(url, {\n`
      code += `      method: '${method}',\n`
      code += `      headers: { ...this.headers, 'Content-Type': 'application/json' }${operation.requestBody ? `,\n      body: JSON.stringify(body)` : ''}\n`
      code += `    });\n`
      code += `    if (!response.ok) throw new Error(response.statusText);\n`
      code += `    return await response.json();\n`
    }

    code += `  }\n\n`

    return code
  }

  /**
   * Generate Python client
   */
  generatePython(options: PythonOptions): string {
    const { className, includeTyping } = options
    let code = ''

    // Imports
    code += `import requests
${includeTyping ? 'from typing import Any, Dict, Optional\n' : ''}

class ${className}:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.headers = {}

    def set_header(self, key: str, value: str):
        self.headers[key] = value

    def set_auth_token(self, token: str):
        self.headers['Authorization'] = f'Bearer {token}'

`

    // Generate methods
    const operations = getAllOperations(this.spec)

    for (const { path, method, operation } of operations) {
      code += this.generatePythonMethod(path, method, operation, includeTyping)
    }

    return code
  }

  /**
   * Generate Python method
   */
  private generatePythonMethod(path: string, method: string, operation: OperationObject, includeTyping: boolean): string {
    const methodName = operation.operationId || `${method.toLowerCase()}_${this.pathToMethodName(path)}`
    const params = (operation.parameters || []) as ParameterObject[]

    let code = `    def ${methodName}(self`

    const pathParams = params.filter(p => p.in === 'path')
    const queryParams = params.filter(p => p.in === 'query')

    for (const param of pathParams) {
      code += `, ${param.name}`
    }

    if (queryParams.length > 0) {
      code += `, query${includeTyping ? ': Optional[Dict[str, Any]]' : ''} = None`
    }

    if (operation.requestBody) {
      code += `, body${includeTyping ? ': Optional[Dict[str, Any]]' : ''} = None`
    }

    code += `)${includeTyping ? ' -> Any' : ''}:\n`

    // Build URL
    let urlPath = path
    for (const param of pathParams) {
      urlPath = urlPath.replace(`{${param.name}}`, `{${param.name}}`)
    }

    code += `        url = f"{self.base_url}${urlPath}"\n`

    // Query params
    if (queryParams.length > 0) {
      code += `        params = query if query else {}\n`
    }

    // Request
    code += `        response = requests.${method.toLowerCase()}(url, headers=self.headers`
    if (queryParams.length > 0) {
      code += `, params=params`
    }
    if (operation.requestBody) {
      code += `, json=body`
    }
    code += `)\n`
    code += `        response.raise_for_status()\n`
    code += `        return response.json()\n\n`

    return code
  }

  /**
   * Generate cURL command
   */
  generateCurl(options: CurlOptions): string {
    const operations = getAllOperations(this.spec)
    const op = operations.find(o => o.operation.operationId === options.operationId)

    if (!op) {
      throw new Error(`Operation ${options.operationId} not found`)
    }

    const server = this.spec.servers?.[0]?.url || 'http://localhost'
    let url = `${server}${op.path}`

    // Replace path parameters
    if (options.parameters) {
      for (const [key, value] of Object.entries(options.parameters)) {
        url = url.replace(`{${key}}`, String(value))
      }
    }

    let curl = `curl -X ${op.method} "${url}"`

    // Headers
    curl += ` -H "Content-Type: application/json"`

    // Body
    if (options.body) {
      curl += ` -d '${JSON.stringify(options.body)}'`
    }

    return curl
  }

  /**
   * Generate Java client
   */
  generateJava(options: { className: string }): string {
    const { className } = options

    return `
import java.net.http.*;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ${className} {
    private String baseURL;
    private HttpClient client;
    private ObjectMapper mapper;

    public ${className}(String baseURL) {
        this.baseURL = baseURL;
        this.client = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
    }

    // Methods generated here...
}
`
  }

  /**
   * Generate Go client
   */
  generateGo(options: { packageName: string }): string {
    const { packageName } = options

    return `
package ${packageName}

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type Client struct {
    BaseURL string
    Headers map[string]string
}

func NewClient(baseURL string) *Client {
    return &Client{
        BaseURL: baseURL,
        Headers: make(map[string]string),
    }
}

// Methods generated here...
`
  }

  /**
   * Helper: Convert path to method name
   */
  private pathToMethodName(path: string): string {
    return path
      .replace(/\//g, '_')
      .replace(/\{|\}/g, '')
      .replace(/_(.)/g, (_, char) => char.toUpperCase())
      .replace(/^_/, '')
  }

  /**
   * Helper: Get TypeScript type from parameter
   */
  private getTypeScriptType(param: ParameterObject): string {
    const schema = param.schema as any

    if (!schema) return 'any'

    switch (schema.type) {
      case 'string':
        return 'string'
      case 'number':
      case 'integer':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'array':
        return 'any[]'
      case 'object':
        return 'Record<string, any>'
      default:
        return 'any'
    }
  }
}
