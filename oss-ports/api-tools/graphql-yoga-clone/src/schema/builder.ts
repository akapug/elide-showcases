/**
 * Schema Builder - Create Executable GraphQL Schemas
 *
 * Provides utilities to build executable GraphQL schemas from SDL and resolvers.
 */

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  GraphQLField,
  GraphQLInputField,
  GraphQLArgument,
  GraphQLFieldMap
} from '../graphql/core'

export interface SchemaBuilderOptions {
  typeDefs: string | string[]
  resolvers: ResolverMap
  schemaDirectives?: Record<string, any>
  inheritResolversFromInterfaces?: boolean
  resolverValidationOptions?: ResolverValidationOptions
}

export interface ResolverMap {
  [typeName: string]: {
    [fieldName: string]: FieldResolver | ResolverOptions
  }
}

export interface FieldResolver {
  (parent: any, args: any, context: any, info: any): any
}

export interface ResolverOptions {
  resolve?: FieldResolver
  subscribe?: FieldResolver
  [key: string]: any
}

export interface ResolverValidationOptions {
  requireResolversForArgs?: boolean
  requireResolversForNonScalar?: boolean
  requireResolversForAllFields?: boolean
  requireResolversToMatchSchema?: boolean
  allowResolversNotInSchema?: boolean
}

/**
 * Create an executable GraphQL schema
 */
export function makeExecutableSchema(
  options: SchemaBuilderOptions
): GraphQLSchema {
  const { typeDefs, resolvers, schemaDirectives } = options

  // Parse type definitions
  const schema = buildSchemaFromTypeDefs(typeDefs)

  // Add resolvers
  addResolversToSchema(schema, resolvers)

  // Add schema directives
  if (schemaDirectives) {
    addSchemaDirectives(schema, schemaDirectives)
  }

  return schema
}

/**
 * Build schema from type definitions
 */
function buildSchemaFromTypeDefs(typeDefs: string | string[]): GraphQLSchema {
  const typeDefString = Array.isArray(typeDefs) ? typeDefs.join('\n') : typeDefs

  // Parse SDL
  const ast = parseTypeDefs(typeDefString)

  // Build schema from AST
  const typeMap = new Map<string, any>()
  const directiveMap = new Map<string, any>()

  // First pass: collect all type definitions
  for (const def of ast.definitions) {
    if (def.kind === 'ObjectTypeDefinition') {
      typeMap.set(def.name.value, buildObjectType(def, typeMap))
    } else if (def.kind === 'InterfaceTypeDefinition') {
      typeMap.set(def.name.value, buildInterfaceType(def, typeMap))
    } else if (def.kind === 'UnionTypeDefinition') {
      typeMap.set(def.name.value, buildUnionType(def, typeMap))
    } else if (def.kind === 'EnumTypeDefinition') {
      typeMap.set(def.name.value, buildEnumType(def))
    } else if (def.kind === 'InputObjectTypeDefinition') {
      typeMap.set(def.name.value, buildInputObjectType(def, typeMap))
    } else if (def.kind === 'ScalarTypeDefinition') {
      typeMap.set(def.name.value, buildScalarType(def))
    } else if (def.kind === 'DirectiveDefinition') {
      directiveMap.set(def.name.value, buildDirective(def))
    }
  }

  // Get root types
  const queryType = typeMap.get('Query')
  const mutationType = typeMap.get('Mutation')
  const subscriptionType = typeMap.get('Subscription')

  if (!queryType) {
    throw new Error('Query type must be defined')
  }

  return new GraphQLSchema({
    query: queryType,
    mutation: mutationType,
    subscription: subscriptionType,
    types: Array.from(typeMap.values()),
    directives: Array.from(directiveMap.values())
  })
}

/**
 * Parse type definitions
 */
function parseTypeDefs(typeDefs: string): any {
  // Simple SDL parser
  const definitions: any[] = []
  const lines = typeDefs.split('\n')
  let currentDef: any = null
  let currentFields: any[] = []

  for (let line of lines) {
    line = line.trim()

    if (!line || line.startsWith('#')) continue

    // Type definition
    if (line.startsWith('type ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/type\s+(\w+)(?:\s+implements\s+(.+?))?(?:\s*\{)?/)
      if (match) {
        currentDef = {
          kind: 'ObjectTypeDefinition',
          name: { value: match[1] },
          interfaces: match[2] ? match[2].split(/\s*&\s*/).map((n: string) => ({ name: { value: n.trim() } })) : []
        }
        currentFields = []
      }
    }
    // Interface definition
    else if (line.startsWith('interface ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/interface\s+(\w+)(?:\s*\{)?/)
      if (match) {
        currentDef = {
          kind: 'InterfaceTypeDefinition',
          name: { value: match[1] }
        }
        currentFields = []
      }
    }
    // Union definition
    else if (line.startsWith('union ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/union\s+(\w+)\s*=\s*(.+)/)
      if (match) {
        currentDef = {
          kind: 'UnionTypeDefinition',
          name: { value: match[1] },
          types: match[2].split(/\s*\|\s*/).map((t: string) => ({ name: { value: t.trim() } }))
        }
        currentFields = []
      }
    }
    // Enum definition
    else if (line.startsWith('enum ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/enum\s+(\w+)(?:\s*\{)?/)
      if (match) {
        currentDef = {
          kind: 'EnumTypeDefinition',
          name: { value: match[1] },
          values: []
        }
        currentFields = []
      }
    }
    // Input definition
    else if (line.startsWith('input ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/input\s+(\w+)(?:\s*\{)?/)
      if (match) {
        currentDef = {
          kind: 'InputObjectTypeDefinition',
          name: { value: match[1] }
        }
        currentFields = []
      }
    }
    // Scalar definition
    else if (line.startsWith('scalar ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/scalar\s+(\w+)/)
      if (match) {
        definitions.push({
          kind: 'ScalarTypeDefinition',
          name: { value: match[1] }
        })
      }
      currentDef = null
      currentFields = []
    }
    // Directive definition
    else if (line.startsWith('directive ')) {
      if (currentDef) {
        currentDef.fields = currentFields
        definitions.push(currentDef)
      }
      const match = line.match(/directive\s+@(\w+)/)
      if (match) {
        definitions.push({
          kind: 'DirectiveDefinition',
          name: { value: match[1] }
        })
      }
      currentDef = null
      currentFields = []
    }
    // Schema definition
    else if (line.startsWith('schema ')) {
      // Skip schema definitions
      continue
    }
    // Field definition
    else if (currentDef && line.includes(':') && !line.startsWith('}')) {
      const fieldMatch = line.match(/(\w+)(\([^)]*\))?:\s*(.+?)(?:\s*@.*)?$/)
      if (fieldMatch) {
        const [, name, argsStr, type] = fieldMatch
        const args: any[] = []

        if (argsStr) {
          const argsMatch = argsStr.slice(1, -1).split(',')
          for (const arg of argsMatch) {
            const argMatch = arg.trim().match(/(\w+):\s*(.+?)(?:=(.+))?$/)
            if (argMatch) {
              args.push({
                name: { value: argMatch[1] },
                type: parseTypeRef(argMatch[2]),
                defaultValue: argMatch[3] ? parseValue(argMatch[3].trim()) : undefined
              })
            }
          }
        }

        if (currentDef.kind === 'EnumTypeDefinition') {
          currentDef.values.push({ name: { value: name } })
        } else {
          currentFields.push({
            name: { value: name },
            type: parseTypeRef(type.trim()),
            arguments: args
          })
        }
      }
    }
    // End of definition
    else if (line === '}') {
      if (currentDef) {
        if (currentDef.kind !== 'UnionTypeDefinition' && currentDef.kind !== 'ScalarTypeDefinition') {
          if (currentDef.kind === 'EnumTypeDefinition') {
            // Values already added
          } else {
            currentDef.fields = currentFields
          }
        }
        definitions.push(currentDef)
        currentDef = null
        currentFields = []
      }
    }
  }

  if (currentDef) {
    if (currentDef.kind === 'EnumTypeDefinition') {
      // Values already added
    } else {
      currentDef.fields = currentFields
    }
    definitions.push(currentDef)
  }

  return { definitions }
}

/**
 * Parse type reference
 */
function parseTypeRef(typeStr: string): any {
  typeStr = typeStr.trim()

  // Non-null type
  if (typeStr.endsWith('!')) {
    return {
      kind: 'NonNullType',
      type: parseTypeRef(typeStr.slice(0, -1))
    }
  }

  // List type
  if (typeStr.startsWith('[') && typeStr.endsWith(']')) {
    return {
      kind: 'ListType',
      type: parseTypeRef(typeStr.slice(1, -1))
    }
  }

  // Named type
  return {
    kind: 'NamedType',
    name: { value: typeStr }
  }
}

/**
 * Parse value
 */
function parseValue(valueStr: string): any {
  if (valueStr === 'null') return { kind: 'NullValue' }
  if (valueStr === 'true' || valueStr === 'false') {
    return { kind: 'BooleanValue', value: valueStr === 'true' }
  }
  if (valueStr.match(/^-?\d+$/)) {
    return { kind: 'IntValue', value: parseInt(valueStr) }
  }
  if (valueStr.match(/^-?\d+\.\d+$/)) {
    return { kind: 'FloatValue', value: parseFloat(valueStr) }
  }
  if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
    return { kind: 'StringValue', value: valueStr.slice(1, -1) }
  }
  return { kind: 'EnumValue', value: valueStr }
}

/**
 * Build object type
 */
function buildObjectType(def: any, typeMap: Map<string, any>): GraphQLObjectType {
  return new GraphQLObjectType({
    name: def.name.value,
    fields: () => buildFields(def.fields, typeMap),
    interfaces: () => def.interfaces?.map((i: any) => typeMap.get(i.name.value)) || []
  })
}

/**
 * Build interface type
 */
function buildInterfaceType(def: any, typeMap: Map<string, any>): GraphQLInterfaceType {
  return new GraphQLInterfaceType({
    name: def.name.value,
    fields: () => buildFields(def.fields, typeMap)
  })
}

/**
 * Build union type
 */
function buildUnionType(def: any, typeMap: Map<string, any>): GraphQLUnionType {
  return new GraphQLUnionType({
    name: def.name.value,
    types: () => def.types.map((t: any) => typeMap.get(t.name.value))
  })
}

/**
 * Build enum type
 */
function buildEnumType(def: any): GraphQLEnumType {
  const values: Record<string, any> = {}
  for (const value of def.values) {
    values[value.name.value] = { value: value.name.value }
  }

  return new GraphQLEnumType({
    name: def.name.value,
    values
  })
}

/**
 * Build input object type
 */
function buildInputObjectType(def: any, typeMap: Map<string, any>): GraphQLInputObjectType {
  return new GraphQLInputObjectType({
    name: def.name.value,
    fields: () => buildInputFields(def.fields, typeMap)
  })
}

/**
 * Build scalar type
 */
function buildScalarType(def: any): GraphQLScalarType {
  return new GraphQLScalarType({
    name: def.name.value
  })
}

/**
 * Build directive
 */
function buildDirective(def: any): any {
  return {
    name: def.name.value,
    locations: []
  }
}

/**
 * Build fields
 */
function buildFields(fields: any[], typeMap: Map<string, any>): GraphQLFieldMap<any, any> {
  const fieldMap: GraphQLFieldMap<any, any> = {}

  for (const field of fields) {
    fieldMap[field.name.value] = {
      type: resolveTypeRef(field.type, typeMap),
      args: buildArguments(field.arguments, typeMap)
    }
  }

  return fieldMap
}

/**
 * Build input fields
 */
function buildInputFields(fields: any[], typeMap: Map<string, any>): Record<string, GraphQLInputField> {
  const fieldMap: Record<string, GraphQLInputField> = {}

  for (const field of fields) {
    fieldMap[field.name.value] = {
      type: resolveTypeRef(field.type, typeMap),
      defaultValue: field.defaultValue
    }
  }

  return fieldMap
}

/**
 * Build arguments
 */
function buildArguments(args: any[], typeMap: Map<string, any>): Record<string, GraphQLArgument> {
  const argMap: Record<string, GraphQLArgument> = {}

  for (const arg of args) {
    argMap[arg.name.value] = {
      type: resolveTypeRef(arg.type, typeMap),
      defaultValue: arg.defaultValue
    }
  }

  return argMap
}

/**
 * Resolve type reference
 */
function resolveTypeRef(typeRef: any, typeMap: Map<string, any>): any {
  if (typeRef.kind === 'NonNullType') {
    return { kind: 'NonNull', ofType: resolveTypeRef(typeRef.type, typeMap) }
  }

  if (typeRef.kind === 'ListType') {
    return { kind: 'List', ofType: resolveTypeRef(typeRef.type, typeMap) }
  }

  const typeName = typeRef.name.value
  return typeMap.get(typeName) || { kind: 'Named', name: typeName }
}

/**
 * Add resolvers to schema
 */
function addResolversToSchema(schema: GraphQLSchema, resolvers: ResolverMap): void {
  for (const [typeName, fieldResolvers] of Object.entries(resolvers)) {
    const type = schema.getType(typeName)

    if (!type) {
      console.warn(`Type "${typeName}" not found in schema`)
      continue
    }

    if (type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType) {
      const fields = type.getFields()

      for (const [fieldName, resolver] of Object.entries(fieldResolvers)) {
        const field = fields[fieldName]

        if (!field) {
          console.warn(`Field "${fieldName}" not found on type "${typeName}"`)
          continue
        }

        if (typeof resolver === 'function') {
          field.resolve = resolver
        } else if (typeof resolver === 'object') {
          if (resolver.resolve) field.resolve = resolver.resolve
          if (resolver.subscribe) field.subscribe = resolver.subscribe
        }
      }
    } else if (type instanceof GraphQLEnumType) {
      // Handle enum resolvers
      const values = type.getValues()
      for (const [valueName, valueResolver] of Object.entries(fieldResolvers)) {
        const value = values.find(v => v.name === valueName)
        if (value && typeof valueResolver === 'string') {
          value.value = valueResolver
        }
      }
    } else if (type instanceof GraphQLScalarType) {
      // Handle scalar resolvers
      if (typeof fieldResolvers === 'object') {
        if (fieldResolvers.serialize) type.serialize = fieldResolvers.serialize
        if (fieldResolvers.parseValue) type.parseValue = fieldResolvers.parseValue
        if (fieldResolvers.parseLiteral) type.parseLiteral = fieldResolvers.parseLiteral
      }
    }
  }
}

/**
 * Add schema directives
 */
function addSchemaDirectives(schema: GraphQLSchema, directives: Record<string, any>): void {
  // Implementation for schema directives
  for (const [directiveName, directiveImpl] of Object.entries(directives)) {
    // Apply directive implementation to schema
    console.log(`Applying directive: ${directiveName}`)
  }
}

/**
 * Merge schemas
 */
export function mergeSchemas(schemas: GraphQLSchema[]): GraphQLSchema {
  const typeDefsArray: string[] = []
  const resolversArray: ResolverMap[] = []

  for (const schema of schemas) {
    // Extract type defs and resolvers from each schema
    // This is a simplified implementation
  }

  return makeExecutableSchema({
    typeDefs: typeDefsArray,
    resolvers: Object.assign({}, ...resolversArray)
  })
}
