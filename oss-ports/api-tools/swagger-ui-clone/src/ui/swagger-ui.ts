/**
 * Swagger UI - Interactive API Documentation UI
 *
 * Provides interactive UI for exploring and testing APIs.
 */

import { OpenAPISpec, OperationObject, ParameterObject, getAllOperations, generateExample } from '../parser/openapi-parser'

export interface SwaggerUIOptions {
  spec: OpenAPISpec
  domId: string
  deepLinking?: boolean
  displayRequestDuration?: boolean
  tryItOutEnabled?: boolean
  requestInterceptor?: (request: Request) => Request | Promise<Request>
  responseInterceptor?: (response: Response) => Response | Promise<Response>
  onComplete?: () => void
  persistAuthorization?: boolean
  layout?: 'BaseLayout' | 'StandaloneLayout'
  plugins?: any[]
  presets?: any[]
}

export interface AuthConfig {
  oauth2?: {
    clientId: string
    clientSecret?: string
    scopes?: string[]
  }
  apiKey?: {
    name: string
    value: string
    in?: 'header' | 'query'
  }
  basic?: {
    username: string
    password: string
  }
  bearer?: {
    token: string
  }
}

/**
 * Swagger UI class
 */
export class SwaggerUI {
  private spec: OpenAPISpec
  private options: SwaggerUIOptions
  private container: HTMLElement | null = null
  private auth: AuthConfig = {}
  private expandedOperations: Set<string> = new Set()

  constructor(options: SwaggerUIOptions) {
    this.spec = options.spec
    this.options = {
      tryItOutEnabled: true,
      displayRequestDuration: true,
      deepLinking: false,
      persistAuthorization: false,
      layout: 'StandaloneLayout',
      ...options
    }
  }

  /**
   * Render the UI
   */
  render(): void {
    this.container = document.querySelector(this.options.domId)

    if (!this.container) {
      throw new Error(`Element ${this.options.domId} not found`)
    }

    // Clear container
    this.container.innerHTML = ''

    // Create UI structure
    const wrapper = document.createElement('div')
    wrapper.className = 'swagger-ui'

    // Render info
    wrapper.appendChild(this.renderInfo())

    // Render servers
    if (this.spec.servers && this.spec.servers.length > 0) {
      wrapper.appendChild(this.renderServers())
    }

    // Render operations by tag
    const operations = getAllOperations(this.spec)
    const byTag = this.groupByTag(operations)

    for (const [tag, ops] of Object.entries(byTag)) {
      wrapper.appendChild(this.renderTag(tag, ops))
    }

    // Render security schemes
    if (this.spec.components?.securitySchemes) {
      wrapper.appendChild(this.renderSecuritySchemes())
    }

    this.container.appendChild(wrapper)

    if (this.options.onComplete) {
      this.options.onComplete()
    }
  }

  /**
   * Render info section
   */
  private renderInfo(): HTMLElement {
    const info = document.createElement('div')
    info.className = 'info'

    const title = document.createElement('h1')
    title.textContent = this.spec.info.title

    const version = document.createElement('span')
    version.className = 'version'
    version.textContent = `v${this.spec.info.version}`

    title.appendChild(version)
    info.appendChild(title)

    if (this.spec.info.description) {
      const desc = document.createElement('div')
      desc.className = 'description'
      desc.innerHTML = this.spec.info.description
      info.appendChild(desc)
    }

    if (this.spec.info.contact) {
      const contact = document.createElement('div')
      contact.className = 'contact'

      if (this.spec.info.contact.name) {
        contact.textContent = `Contact: ${this.spec.info.contact.name}`
      }

      if (this.spec.info.contact.email) {
        const email = document.createElement('a')
        email.href = `mailto:${this.spec.info.contact.email}`
        email.textContent = this.spec.info.contact.email
        contact.appendChild(document.createTextNode(' - '))
        contact.appendChild(email)
      }

      info.appendChild(contact)
    }

    return info
  }

  /**
   * Render servers
   */
  private renderServers(): HTMLElement {
    const servers = document.createElement('div')
    servers.className = 'servers'

    const label = document.createElement('label')
    label.textContent = 'Servers:'

    const select = document.createElement('select')

    for (const server of this.spec.servers!) {
      const option = document.createElement('option')
      option.value = server.url
      option.textContent = server.description || server.url
      select.appendChild(option)
    }

    servers.appendChild(label)
    servers.appendChild(select)

    return servers
  }

  /**
   * Render tag section
   */
  private renderTag(tag: string, operations: any[]): HTMLElement {
    const section = document.createElement('div')
    section.className = 'tag-section'

    const header = document.createElement('h2')
    header.className = 'tag-header'
    header.textContent = tag
    header.onclick = () => {
      section.classList.toggle('expanded')
    }

    section.appendChild(header)

    const opsContainer = document.createElement('div')
    opsContainer.className = 'operations'

    for (const op of operations) {
      opsContainer.appendChild(this.renderOperation(op.path, op.method, op.operation))
    }

    section.appendChild(opsContainer)

    return section
  }

  /**
   * Render operation
   */
  private renderOperation(path: string, method: string, operation: OperationObject): HTMLElement {
    const opId = operation.operationId || `${method}_${path}`
    const opElement = document.createElement('div')
    opElement.className = `operation ${method.toLowerCase()}`

    // Header
    const header = document.createElement('div')
    header.className = 'operation-header'

    const methodBadge = document.createElement('span')
    methodBadge.className = `method ${method.toLowerCase()}`
    methodBadge.textContent = method

    const pathSpan = document.createElement('span')
    pathSpan.className = 'path'
    pathSpan.textContent = path

    const summary = document.createElement('span')
    summary.className = 'summary'
    summary.textContent = operation.summary || ''

    header.appendChild(methodBadge)
    header.appendChild(pathSpan)
    header.appendChild(summary)

    header.onclick = () => {
      if (this.expandedOperations.has(opId)) {
        this.expandedOperations.delete(opId)
        opElement.classList.remove('expanded')
      } else {
        this.expandedOperations.add(opId)
        opElement.classList.add('expanded')
      }
    }

    opElement.appendChild(header)

    // Details
    const details = document.createElement('div')
    details.className = 'operation-details'

    if (operation.description) {
      const desc = document.createElement('div')
      desc.className = 'description'
      desc.innerHTML = operation.description
      details.appendChild(desc)
    }

    // Parameters
    if (operation.parameters && operation.parameters.length > 0) {
      details.appendChild(this.renderParameters(operation.parameters as ParameterObject[]))
    }

    // Request body
    if (operation.requestBody) {
      details.appendChild(this.renderRequestBody(operation.requestBody))
    }

    // Responses
    details.appendChild(this.renderResponses(operation.responses))

    // Try it out
    if (this.options.tryItOutEnabled) {
      details.appendChild(this.renderTryItOut(path, method, operation))
    }

    opElement.appendChild(details)

    return opElement
  }

  /**
   * Render parameters
   */
  private renderParameters(parameters: ParameterObject[]): HTMLElement {
    const section = document.createElement('div')
    section.className = 'parameters'

    const title = document.createElement('h4')
    title.textContent = 'Parameters'
    section.appendChild(title)

    const table = document.createElement('table')

    for (const param of parameters) {
      const row = table.insertRow()

      const nameCell = row.insertCell()
      nameCell.textContent = param.name
      if (param.required) {
        nameCell.classList.add('required')
      }

      const inCell = row.insertCell()
      inCell.textContent = param.in

      const typeCell = row.insertCell()
      typeCell.textContent = (param.schema as any)?.type || 'unknown'

      const descCell = row.insertCell()
      descCell.textContent = param.description || ''
    }

    section.appendChild(table)

    return section
  }

  /**
   * Render request body
   */
  private renderRequestBody(requestBody: any): HTMLElement {
    const section = document.createElement('div')
    section.className = 'request-body'

    const title = document.createElement('h4')
    title.textContent = 'Request Body'
    section.appendChild(title)

    const pre = document.createElement('pre')
    pre.textContent = JSON.stringify(requestBody, null, 2)
    section.appendChild(pre)

    return section
  }

  /**
   * Render responses
   */
  private renderResponses(responses: any): HTMLElement {
    const section = document.createElement('div')
    section.className = 'responses'

    const title = document.createElement('h4')
    title.textContent = 'Responses'
    section.appendChild(title)

    for (const [code, response] of Object.entries(responses)) {
      const respDiv = document.createElement('div')
      respDiv.className = 'response'

      const codeSpan = document.createElement('span')
      codeSpan.className = 'status-code'
      codeSpan.textContent = code

      const descSpan = document.createElement('span')
      descSpan.textContent = (response as any).description || ''

      respDiv.appendChild(codeSpan)
      respDiv.appendChild(descSpan)

      section.appendChild(respDiv)
    }

    return section
  }

  /**
   * Render try it out section
   */
  private renderTryItOut(path: string, method: string, operation: OperationObject): HTMLElement {
    const section = document.createElement('div')
    section.className = 'try-it-out'

    const button = document.createElement('button')
    button.textContent = 'Try it out'
    button.onclick = async () => {
      const result = await this.executeOperation(path, method, operation)
      this.displayResponse(section, result)
    }

    section.appendChild(button)

    return section
  }

  /**
   * Execute operation
   */
  async executeOperation(path: string, method: string, operation: OperationObject): Promise<Response> {
    const server = this.spec.servers?.[0]?.url || ''
    const url = `${server}${path}`

    let request = new Request(url, {
      method,
      headers: this.buildHeaders()
    })

    if (this.options.requestInterceptor) {
      request = await this.options.requestInterceptor(request)
    }

    const startTime = Date.now()
    let response = await fetch(request)

    if (this.options.responseInterceptor) {
      response = await this.options.responseInterceptor(response)
    }

    const duration = Date.now() - startTime

    if (this.options.displayRequestDuration) {
      console.log(`Request completed in ${duration}ms`)
    }

    return response
  }

  /**
   * Build headers from auth
   */
  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.auth.bearer) {
      headers['Authorization'] = `Bearer ${this.auth.bearer.token}`
    } else if (this.auth.apiKey) {
      if (this.auth.apiKey.in === 'header') {
        headers[this.auth.apiKey.name] = this.auth.apiKey.value
      }
    } else if (this.auth.basic) {
      const encoded = btoa(`${this.auth.basic.username}:${this.auth.basic.password}`)
      headers['Authorization'] = `Basic ${encoded}`
    }

    return headers
  }

  /**
   * Display response
   */
  private displayResponse(container: HTMLElement, response: Response): void {
    const resultDiv = document.createElement('div')
    resultDiv.className = 'response-result'

    const statusDiv = document.createElement('div')
    statusDiv.textContent = `Status: ${response.status} ${response.statusText}`
    resultDiv.appendChild(statusDiv)

    container.appendChild(resultDiv)
  }

  /**
   * Render security schemes
   */
  private renderSecuritySchemes(): HTMLElement {
    const section = document.createElement('div')
    section.className = 'security-schemes'

    const title = document.createElement('h3')
    title.textContent = 'Authentication'
    section.appendChild(title)

    return section
  }

  /**
   * Group operations by tag
   */
  private groupByTag(operations: any[]): Record<string, any[]> {
    const byTag: Record<string, any[]> = {}

    for (const op of operations) {
      const tags = op.operation.tags || ['default']

      for (const tag of tags) {
        if (!byTag[tag]) {
          byTag[tag] = []
        }

        byTag[tag].push(op)
      }
    }

    return byTag
  }

  /**
   * Authorize with credentials
   */
  authorize(auth: AuthConfig): void {
    this.auth = auth

    if (this.options.persistAuthorization) {
      localStorage.setItem('swagger-ui-auth', JSON.stringify(auth))
    }
  }

  /**
   * Set new spec
   */
  setSpec(spec: OpenAPISpec): void {
    this.spec = spec
    this.render()
  }
}

/**
 * Create Swagger UI instance
 */
export function createSwaggerUI(options: SwaggerUIOptions): SwaggerUI {
  return new SwaggerUI(options)
}
