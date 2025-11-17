/**
 * Schema Utilities - Helper Functions for GraphQL Schemas
 *
 * Provides utility functions for working with GraphQL schemas.
 */

import { GraphQLSchema, GraphQLObjectType, GraphQLField } from '../graphql/core'

/**
 * Extract all types from schema
 */
export function extractTypes(schema: GraphQLSchema): Map<string, any> {
  return schema.getTypeMap()
}

/**
 * Get all queries from schema
 */
export function getQueries(schema: GraphQLSchema): Record<string, GraphQLField<any, any>> {
  const queryType = schema.getQueryType()
  return queryType ? queryType.getFields() : {}
}

/**
 * Get all mutations from schema
 */
export function getMutations(schema: GraphQLSchema): Record<string, GraphQLField<any, any>> | null {
  const mutationType = schema.getMutationType()
  return mutationType ? mutationType.getFields() : null
}

/**
 * Get all subscriptions from schema
 */
export function getSubscriptions(schema: GraphQLSchema): Record<string, GraphQLField<any, any>> | null {
  const subscriptionType = schema.getSubscriptionType()
  return subscriptionType ? subscriptionType.getFields() : null
}

/**
 * Print schema as SDL
 */
export function printSchema(schema: GraphQLSchema): string {
  let sdl = ''

  // Print query type
  const queryType = schema.getQueryType()
  if (queryType) {
    sdl += printObjectType(queryType)
  }

  // Print mutation type
  const mutationType = schema.getMutationType()
  if (mutationType) {
    sdl += printObjectType(mutationType)
  }

  // Print subscription type
  const subscriptionType = schema.getSubscriptionType()
  if (subscriptionType) {
    sdl += printObjectType(subscriptionType)
  }

  return sdl
}

/**
 * Print object type as SDL
 */
function printObjectType(type: GraphQLObjectType): string {
  let sdl = `type ${type.name} {\n`

  const fields = type.getFields()
  for (const [fieldName, field] of Object.entries(fields)) {
    sdl += `  ${fieldName}: ${printType(field.type)}\n`
  }

  sdl += '}\n\n'
  return sdl
}

/**
 * Print type reference
 */
function printType(type: any): string {
  if (type.kind === 'NonNull') {
    return `${printType(type.ofType)}!`
  }

  if (type.kind === 'List') {
    return `[${printType(type.ofType)}]`
  }

  return type.name || 'Unknown'
}

/**
 * Validate schema
 */
export function validateSchema(schema: GraphQLSchema): string[] {
  const errors: string[] = []

  // Check for query type
  if (!schema.getQueryType()) {
    errors.push('Schema must have a Query type')
  }

  return errors
}

/**
 * Introspect schema
 */
export function introspectSchema(schema: GraphQLSchema): any {
  return {
    types: Array.from(schema.getTypeMap().values()).map(type => ({
      name: type.name,
      kind: type.constructor.name
    })),
    queryType: schema.getQueryType()?.name,
    mutationType: schema.getMutationType()?.name,
    subscriptionType: schema.getSubscriptionType()?.name
  }
}
