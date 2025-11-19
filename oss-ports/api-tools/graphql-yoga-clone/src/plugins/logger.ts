/**
 * Logger Plugin
 *
 * Provides logging middleware for GraphQL Yoga.
 */

import { Plugin } from '../server/yoga'

export interface LoggerPluginOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  logFn?: (message: string, ...args: any[]) => void
  logRequests?: boolean
  logOperations?: boolean
  logErrors?: boolean
  logPerformance?: boolean
}

/**
 * Logger plugin
 */
export function useLogger(options: LoggerPluginOptions = {}): Plugin {
  const {
    level = 'info',
    logFn = console.log,
    logRequests = true,
    logOperations = true,
    logErrors = true,
    logPerformance = true
  } = options

  const timings = new Map<string, number>()

  return {
    name: 'logger',

    async onRequest(request: Request) {
      if (logRequests) {
        logFn(`[GraphQL] ${request.method} ${request.url}`)
      }
    },

    onParse(params) {
      if (logOperations) {
        const operationId = Math.random().toString(36).substring(7)
        timings.set(operationId, Date.now())
        logFn(`[GraphQL] Parsing operation: ${params.operationName || 'anonymous'}`)
      }
    },

    onValidate(params) {
      if (logOperations) {
        logFn(`[GraphQL] Validating schema`)
      }
    },

    onExecute(params) {
      if (logOperations) {
        const operationId = Math.random().toString(36).substring(7)
        timings.set(operationId, Date.now())
        logFn(
          `[GraphQL] Executing ${params.operationName || 'anonymous'} operation`
        )
      }
    },

    onResponse(response) {
      if (logPerformance) {
        const duration = Date.now() - (timings.values().next().value || Date.now())
        logFn(`[GraphQL] Response sent in ${duration}ms`)
        timings.clear()
      }
    }
  }
}

/**
 * Performance monitoring plugin
 */
export function usePerformanceMonitoring(): Plugin {
  return {
    name: 'performance-monitoring',

    onExecute(params) {
      const startTime = Date.now()

      return {
        onExecuteDone({ result }: any) {
          const duration = Date.now() - startTime

          if (!result.extensions) {
            result.extensions = {}
          }

          result.extensions.timing = {
            duration,
            startTime
          }
        }
      }
    }
  }
}
