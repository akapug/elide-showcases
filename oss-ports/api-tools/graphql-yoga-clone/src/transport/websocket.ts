/**
 * WebSocket Transport - GraphQL Subscriptions over WebSocket
 *
 * Implements the GraphQL over WebSocket protocol for real-time subscriptions.
 */

import { GraphQLSchema, subscribe, parse, validate } from '../graphql/core'
import { PubSub } from '../pubsub/pubsub'
import { formatError } from '../errors/formatter'

// WebSocket Protocol Messages
export enum MessageType {
  CONNECTION_INIT = 'connection_init',
  CONNECTION_ACK = 'connection_ack',
  CONNECTION_ERROR = 'connection_error',
  CONNECTION_KEEP_ALIVE = 'ka',
  START = 'start',
  STOP = 'stop',
  CONNECTION_TERMINATE = 'connection_terminate',
  DATA = 'data',
  ERROR = 'error',
  COMPLETE = 'complete'
}

export interface ConnectionInitMessage {
  type: MessageType.CONNECTION_INIT
  payload?: Record<string, any>
}

export interface StartMessage {
  id: string
  type: MessageType.START
  payload: {
    query: string
    variables?: Record<string, any>
    operationName?: string
  }
}

export interface StopMessage {
  id: string
  type: MessageType.STOP
}

export interface DataMessage {
  id: string
  type: MessageType.DATA
  payload: any
}

export interface ErrorMessage {
  id: string
  type: MessageType.ERROR
  payload: any
}

export interface CompleteMessage {
  id: string
  type: MessageType.COMPLETE
}

export type Message =
  | ConnectionInitMessage
  | StartMessage
  | StopMessage
  | DataMessage
  | ErrorMessage
  | CompleteMessage

export interface WebSocketServerOptions {
  schema: GraphQLSchema
  context?: (params: any) => Promise<any> | any
  pubsub?: PubSub
  onConnect?: (connectionParams: any) => Promise<any> | any
  onDisconnect?: () => void
  keepAlive?: number
}

/**
 * WebSocket server for GraphQL subscriptions
 */
export class WebSocketServer {
  private schema: GraphQLSchema
  private contextFactory?: (params: any) => Promise<any> | any
  private pubsub?: PubSub
  private onConnect?: (connectionParams: any) => Promise<any> | any
  private onDisconnect?: () => void
  private keepAlive?: number
  private connections: Map<WebSocket, Connection>

  constructor(options: WebSocketServerOptions) {
    this.schema = options.schema
    this.contextFactory = options.context
    this.pubsub = options.pubsub
    this.onConnect = options.onConnect
    this.onDisconnect = options.onDisconnect
    this.keepAlive = options.keepAlive
    this.connections = new Map()
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: WebSocket, request: Request): void {
    const connection = new Connection(socket, {
      schema: this.schema,
      contextFactory: this.contextFactory,
      pubsub: this.pubsub,
      onConnect: this.onConnect,
      onDisconnect: this.onDisconnect,
      keepAlive: this.keepAlive
    })

    this.connections.set(socket, connection)

    socket.addEventListener('close', () => {
      this.connections.delete(socket)
      connection.close()
    })
  }

  /**
   * Close all connections
   */
  close(): void {
    for (const connection of this.connections.values()) {
      connection.close()
    }

    this.connections.clear()
  }
}

/**
 * Individual WebSocket connection
 */
class Connection {
  private socket: WebSocket
  private schema: GraphQLSchema
  private contextFactory?: (params: any) => Promise<any> | any
  private pubsub?: PubSub
  private onConnect?: (connectionParams: any) => Promise<any> | any
  private onDisconnect?: () => void
  private keepAlive?: number
  private subscriptions: Map<string, AsyncIterator<any>>
  private context: any
  private keepAliveTimer?: any
  private initialized: boolean

  constructor(
    socket: WebSocket,
    options: {
      schema: GraphQLSchema
      contextFactory?: (params: any) => Promise<any> | any
      pubsub?: PubSub
      onConnect?: (connectionParams: any) => Promise<any> | any
      onDisconnect?: () => void
      keepAlive?: number
    }
  ) {
    this.socket = socket
    this.schema = options.schema
    this.contextFactory = options.contextFactory
    this.pubsub = options.pubsub
    this.onConnect = options.onConnect
    this.onDisconnect = options.onDisconnect
    this.keepAlive = options.keepAlive
    this.subscriptions = new Map()
    this.initialized = false

    this.setupMessageHandler()
    this.startKeepAlive()
  }

  /**
   * Setup message handler
   */
  private setupMessageHandler(): void {
    this.socket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data) as Message
        await this.handleMessage(message)
      } catch (error) {
        this.sendError(null, error)
      }
    })
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: Message): Promise<void> {
    switch (message.type) {
      case MessageType.CONNECTION_INIT:
        await this.handleConnectionInit(message)
        break

      case MessageType.START:
        await this.handleStart(message)
        break

      case MessageType.STOP:
        await this.handleStop(message)
        break

      case MessageType.CONNECTION_TERMINATE:
        this.close()
        break

      default:
        this.sendError(null, new Error(`Unknown message type: ${(message as any).type}`))
    }
  }

  /**
   * Handle connection initialization
   */
  private async handleConnectionInit(message: ConnectionInitMessage): Promise<void> {
    try {
      // Call onConnect callback
      if (this.onConnect) {
        const result = await this.onConnect(message.payload || {})

        if (result === false) {
          this.send({
            type: MessageType.CONNECTION_ERROR,
            payload: { message: 'Connection rejected' }
          })
          this.socket.close()
          return
        }
      }

      // Create context
      if (this.contextFactory) {
        this.context = await this.contextFactory({
          connectionParams: message.payload,
          pubsub: this.pubsub
        })
      } else {
        this.context = { pubsub: this.pubsub }
      }

      // Send acknowledgment
      this.send({
        type: MessageType.CONNECTION_ACK
      })

      this.initialized = true
    } catch (error) {
      this.send({
        type: MessageType.CONNECTION_ERROR,
        payload: { message: error instanceof Error ? error.message : 'Connection failed' }
      })
      this.socket.close()
    }
  }

  /**
   * Handle subscription start
   */
  private async handleStart(message: StartMessage): Promise<void> {
    if (!this.initialized) {
      this.sendError(message.id, new Error('Connection not initialized'))
      return
    }

    const { id, payload } = message
    const { query, variables, operationName } = payload

    try {
      // Parse query
      const document = parse(query)

      // Validate query
      const validationErrors = validate(this.schema, document)

      if (validationErrors.length > 0) {
        this.sendError(id, validationErrors[0])
        return
      }

      // Subscribe
      const iterator = await subscribe({
        schema: this.schema,
        document,
        contextValue: this.context,
        variableValues: variables,
        operationName
      })

      this.subscriptions.set(id, iterator)

      // Process results
      this.processSubscription(id, iterator)
    } catch (error) {
      this.sendError(id, error)
    }
  }

  /**
   * Process subscription results
   */
  private async processSubscription(id: string, iterator: AsyncIterator<any>): Promise<void> {
    try {
      for await (const result of iterator as any) {
        if (!this.subscriptions.has(id)) {
          break
        }

        this.send({
          id,
          type: MessageType.DATA,
          payload: result
        })
      }

      this.send({
        id,
        type: MessageType.COMPLETE
      })
    } catch (error) {
      this.sendError(id, error)
    } finally {
      this.subscriptions.delete(id)
    }
  }

  /**
   * Handle subscription stop
   */
  private async handleStop(message: StopMessage): Promise<void> {
    const { id } = message
    const iterator = this.subscriptions.get(id)

    if (iterator) {
      if (iterator.return) {
        await iterator.return()
      }

      this.subscriptions.delete(id)
    }
  }

  /**
   * Start keep-alive timer
   */
  private startKeepAlive(): void {
    if (this.keepAlive) {
      this.keepAliveTimer = setInterval(() => {
        this.send({
          type: MessageType.CONNECTION_KEEP_ALIVE
        })
      }, this.keepAlive)
    }
  }

  /**
   * Send message to client
   */
  private send(message: any): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  /**
   * Send error to client
   */
  private sendError(id: string | null, error: any): void {
    const formattedError = formatError(error)

    if (id) {
      this.send({
        id,
        type: MessageType.ERROR,
        payload: formattedError
      })
    } else {
      this.send({
        type: MessageType.CONNECTION_ERROR,
        payload: formattedError
      })
    }
  }

  /**
   * Close connection
   */
  close(): void {
    // Stop keep-alive
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
    }

    // Close all subscriptions
    for (const [id, iterator] of this.subscriptions) {
      if (iterator.return) {
        iterator.return()
      }
    }

    this.subscriptions.clear()

    // Call onDisconnect callback
    if (this.onDisconnect) {
      this.onDisconnect()
    }

    // Close socket
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close()
    }
  }
}

/**
 * Create WebSocket server
 */
export function createWebSocketServer(options: WebSocketServerOptions): WebSocketServer {
  return new WebSocketServer(options)
}
