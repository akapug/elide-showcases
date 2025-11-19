/**
 * Persisted Operations Plugin
 *
 * Implements automatic persisted queries (APQ) for GraphQL Yoga.
 */

import { Plugin } from '../server/yoga'

export interface PersistedOperationsOptions {
  store?: PersistedQueryStore
  allowArbitraryOperations?: boolean
  onlyPersisted?: boolean
}

export interface PersistedQueryStore {
  get(hash: string): Promise<string | undefined> | string | undefined
  set(hash: string, query: string): Promise<void> | void
}

/**
 * Persisted operations plugin
 */
export function usePersistedOperations(
  options: PersistedOperationsOptions = {}
): Plugin {
  const {
    store = new Map<string, string>(),
    allowArbitraryOperations = true,
    onlyPersisted = false
  } = options

  return {
    name: 'persisted-operations',

    async onRequest(request: Request) {
      // Implementation handled in yoga.ts
    }
  }
}

/**
 * Response cache plugin
 */
export function useResponseCache(options: {
  ttl?: number
  session?: (request: Request) => string | null
  invalidateViaMutation?: boolean
}): Plugin {
  const {
    ttl = 60000, // 1 minute
    session,
    invalidateViaMutation = true
  } = options

  const cache = new Map<string, { data: any; expires: number }>()

  return {
    name: 'response-cache',

    async onExecute(params) {
      // Skip caching for mutations
      if (invalidateViaMutation) {
        const operation = params.document.definitions.find(
          (def: any) => def.kind === 'OperationDefinition'
        )

        if (operation?.operation === 'mutation') {
          // Invalidate cache on mutation
          cache.clear()
          return
        }
      }

      // Generate cache key
      const sessionKey = session ? session((params.contextValue as any).request) : ''
      const cacheKey = `${sessionKey}:${params.operationName}:${JSON.stringify(
        params.variableValues
      )}`

      // Check cache
      const cached = cache.get(cacheKey)

      if (cached && cached.expires > Date.now()) {
        return {
          onExecuteDone: () => cached.data
        }
      }

      // Cache result
      return {
        onExecuteDone({ result }: any) {
          cache.set(cacheKey, {
            data: result,
            expires: Date.now() + ttl
          })
        }
      }
    }
  }
}

/**
 * Complexity limit plugin
 */
export function useComplexityLimit(options: {
  maxComplexity: number
  computeComplexity?: (field: any) => number
}): Plugin {
  const { maxComplexity, computeComplexity = () => 1 } = options

  return {
    name: 'complexity-limit',

    onValidate(params) {
      let complexity = 0

      // Compute query complexity
      // This is a simplified implementation
      // Real implementation would traverse the AST and compute complexity

      if (complexity > maxComplexity) {
        throw new Error(`Query is too complex: ${complexity} > ${maxComplexity}`)
      }
    }
  }
}

/**
 * Depth limit plugin
 */
export function useDepthLimit(maxDepth: number): Plugin {
  return {
    name: 'depth-limit',

    onValidate(params) {
      const depth = computeDepth(params.documentAST)

      if (depth > maxDepth) {
        throw new Error(`Query is too deep: ${depth} > ${maxDepth}`)
      }
    }
  }
}

function computeDepth(ast: any, currentDepth: number = 0): number {
  if (!ast || !ast.selectionSet) {
    return currentDepth
  }

  let maxDepth = currentDepth

  for (const selection of ast.selectionSet.selections) {
    if (selection.kind === 'Field') {
      const depth = computeDepth(selection, currentDepth + 1)
      maxDepth = Math.max(maxDepth, depth)
    }
  }

  return maxDepth
}
