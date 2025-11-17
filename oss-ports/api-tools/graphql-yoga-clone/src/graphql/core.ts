/**
 * GraphQL Core - Type System and Execution Engine
 *
 * Provides the core GraphQL functionality including:
 * - Type system (Object, Interface, Union, Enum, Scalar, Input types)
 * - Query execution
 * - Validation
 * - Parsing
 */

// ============================================================================
// Type System
// ============================================================================

export abstract class GraphQLType {
  abstract readonly name: string
}

export class GraphQLScalarType extends GraphQLType {
  readonly name: string
  serialize: (value: any) => any
  parseValue: (value: any) => any
  parseLiteral: (ast: any) => any

  constructor(config: {
    name: string
    serialize?: (value: any) => any
    parseValue?: (value: any) => any
    parseLiteral?: (ast: any) => any
  }) {
    super()
    this.name = config.name
    this.serialize = config.serialize || ((v) => v)
    this.parseValue = config.parseValue || ((v) => v)
    this.parseLiteral = config.parseLiteral || ((ast) => ast.value)
  }
}

export class GraphQLObjectType extends GraphQLType {
  readonly name: string
  private _fields: GraphQLFieldMap<any, any> | (() => GraphQLFieldMap<any, any>)
  private _interfaces: GraphQLInterfaceType[] | (() => GraphQLInterfaceType[])
  private _fieldsCache: GraphQLFieldMap<any, any> | null = null

  constructor(config: {
    name: string
    fields: GraphQLFieldMap<any, any> | (() => GraphQLFieldMap<any, any>)
    interfaces?: GraphQLInterfaceType[] | (() => GraphQLInterfaceType[])
  }) {
    super()
    this.name = config.name
    this._fields = config.fields
    this._interfaces = config.interfaces || []
  }

  getFields(): GraphQLFieldMap<any, any> {
    if (!this._fieldsCache) {
      this._fieldsCache = typeof this._fields === 'function' ? this._fields() : this._fields
    }
    return this._fieldsCache
  }

  getInterfaces(): GraphQLInterfaceType[] {
    return typeof this._interfaces === 'function' ? this._interfaces() : this._interfaces
  }
}

export class GraphQLInterfaceType extends GraphQLType {
  readonly name: string
  private _fields: GraphQLFieldMap<any, any> | (() => GraphQLFieldMap<any, any>)
  private _fieldsCache: GraphQLFieldMap<any, any> | null = null
  resolveType?: (value: any, context: any, info: any) => string | null

  constructor(config: {
    name: string
    fields: GraphQLFieldMap<any, any> | (() => GraphQLFieldMap<any, any>)
    resolveType?: (value: any, context: any, info: any) => string | null
  }) {
    super()
    this.name = config.name
    this._fields = config.fields
    this.resolveType = config.resolveType
  }

  getFields(): GraphQLFieldMap<any, any> {
    if (!this._fieldsCache) {
      this._fieldsCache = typeof this._fields === 'function' ? this._fields() : this._fields
    }
    return this._fieldsCache
  }
}

export class GraphQLUnionType extends GraphQLType {
  readonly name: string
  private _types: GraphQLObjectType[] | (() => GraphQLObjectType[])
  resolveType?: (value: any, context: any, info: any) => string | null

  constructor(config: {
    name: string
    types: GraphQLObjectType[] | (() => GraphQLObjectType[])
    resolveType?: (value: any, context: any, info: any) => string | null
  }) {
    super()
    this.name = config.name
    this._types = config.types
    this.resolveType = config.resolveType
  }

  getTypes(): GraphQLObjectType[] {
    return typeof this._types === 'function' ? this._types() : this._types
  }
}

export class GraphQLEnumType extends GraphQLType {
  readonly name: string
  private _values: Record<string, GraphQLEnumValue>

  constructor(config: {
    name: string
    values: Record<string, GraphQLEnumValueConfig | string>
  }) {
    super()
    this.name = config.name
    this._values = {}

    for (const [key, value] of Object.entries(config.values)) {
      if (typeof value === 'string') {
        this._values[key] = { value }
      } else {
        this._values[key] = value
      }
    }
  }

  getValues(): GraphQLEnumValue[] {
    return Object.entries(this._values).map(([name, config]) => ({
      name,
      value: config.value,
      description: config.description
    }))
  }

  getValue(name: string): GraphQLEnumValue | undefined {
    return this._values[name]
  }

  serialize(value: any): string {
    const enumValue = Object.entries(this._values).find(([, v]) => v.value === value)
    return enumValue ? enumValue[0] : value
  }

  parseValue(value: any): any {
    const enumValue = this._values[value]
    return enumValue ? enumValue.value : undefined
  }
}

export interface GraphQLEnumValueConfig {
  value: any
  description?: string
  deprecationReason?: string
}

export interface GraphQLEnumValue {
  name: string
  value: any
  description?: string
}

export class GraphQLInputObjectType extends GraphQLType {
  readonly name: string
  private _fields: Record<string, GraphQLInputField> | (() => Record<string, GraphQLInputField>)
  private _fieldsCache: Record<string, GraphQLInputField> | null = null

  constructor(config: {
    name: string
    fields: Record<string, GraphQLInputField> | (() => Record<string, GraphQLInputField>)
  }) {
    super()
    this.name = config.name
    this._fields = config.fields
  }

  getFields(): Record<string, GraphQLInputField> {
    if (!this._fieldsCache) {
      this._fieldsCache = typeof this._fields === 'function' ? this._fields() : this._fields
    }
    return this._fieldsCache
  }
}

export interface GraphQLField<TSource, TContext> {
  type: any
  args?: Record<string, GraphQLArgument>
  resolve?: GraphQLFieldResolver<TSource, TContext>
  subscribe?: GraphQLFieldResolver<TSource, TContext>
  description?: string
  deprecationReason?: string
}

export interface GraphQLInputField {
  type: any
  defaultValue?: any
  description?: string
}

export interface GraphQLArgument {
  type: any
  defaultValue?: any
  description?: string
}

export type GraphQLFieldMap<TSource, TContext> = Record<string, GraphQLField<TSource, TContext>>

export type GraphQLFieldResolver<TSource, TContext> = (
  source: TSource,
  args: Record<string, any>,
  context: TContext,
  info: GraphQLResolveInfo
) => any

export interface GraphQLResolveInfo {
  fieldName: string
  fieldNodes: any[]
  returnType: any
  parentType: any
  path: any
  schema: GraphQLSchema
  fragments: Record<string, any>
  rootValue: any
  operation: any
  variableValues: Record<string, any>
}

// ============================================================================
// Schema
// ============================================================================

export class GraphQLSchema {
  private _queryType: GraphQLObjectType
  private _mutationType?: GraphQLObjectType
  private _subscriptionType?: GraphQLObjectType
  private _typeMap: Map<string, GraphQLType>
  private _directives: any[]

  constructor(config: {
    query: GraphQLObjectType
    mutation?: GraphQLObjectType
    subscription?: GraphQLObjectType
    types?: GraphQLType[]
    directives?: any[]
  }) {
    this._queryType = config.query
    this._mutationType = config.mutation
    this._subscriptionType = config.subscription
    this._directives = config.directives || []
    this._typeMap = new Map()

    // Build type map
    this.collectTypes(this._queryType)
    if (this._mutationType) this.collectTypes(this._mutationType)
    if (this._subscriptionType) this.collectTypes(this._subscriptionType)
    if (config.types) {
      config.types.forEach(type => this._typeMap.set(type.name, type))
    }
  }

  getQueryType(): GraphQLObjectType {
    return this._queryType
  }

  getMutationType(): GraphQLObjectType | undefined {
    return this._mutationType
  }

  getSubscriptionType(): GraphQLObjectType | undefined {
    return this._subscriptionType
  }

  getType(name: string): GraphQLType | undefined {
    return this._typeMap.get(name)
  }

  getTypeMap(): Map<string, GraphQLType> {
    return this._typeMap
  }

  getDirectives(): any[] {
    return this._directives
  }

  private collectTypes(type: GraphQLType): void {
    if (this._typeMap.has(type.name)) return

    this._typeMap.set(type.name, type)

    if (type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType) {
      const fields = type.getFields()
      for (const field of Object.values(fields)) {
        this.collectFieldTypes(field)
      }
    }

    if (type instanceof GraphQLObjectType) {
      type.getInterfaces().forEach(iface => this.collectTypes(iface))
    }

    if (type instanceof GraphQLUnionType) {
      type.getTypes().forEach(t => this.collectTypes(t))
    }

    if (type instanceof GraphQLInputObjectType) {
      const fields = type.getFields()
      for (const field of Object.values(fields)) {
        this.collectFieldTypes(field)
      }
    }
  }

  private collectFieldTypes(field: any): void {
    let fieldType = field.type

    while (fieldType) {
      if (fieldType.kind === 'NonNull' || fieldType.kind === 'List') {
        fieldType = fieldType.ofType
      } else if (fieldType instanceof GraphQLType) {
        this.collectTypes(fieldType)
        break
      } else {
        break
      }
    }

    if (field.args) {
      for (const arg of Object.values(field.args)) {
        this.collectFieldTypes(arg)
      }
    }
  }
}

// ============================================================================
// Execution
// ============================================================================

export interface ExecutionArgs {
  schema: GraphQLSchema
  document: any
  rootValue?: any
  contextValue?: any
  variableValues?: Record<string, any>
  operationName?: string
}

export interface ExecutionResult {
  data?: any
  errors?: readonly GraphQLError[]
}

export async function execute(args: ExecutionArgs): Promise<ExecutionResult> {
  const {
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName
  } = args

  // Find operation
  const operation = getOperation(document, operationName)
  if (!operation) {
    return { errors: [new GraphQLError('Operation not found')] }
  }

  // Get root type
  let rootType: GraphQLObjectType | undefined
  if (operation.operation === 'query') {
    rootType = schema.getQueryType()
  } else if (operation.operation === 'mutation') {
    rootType = schema.getMutationType()
  } else if (operation.operation === 'subscription') {
    rootType = schema.getSubscriptionType()
  }

  if (!rootType) {
    return { errors: [new GraphQLError(`Schema does not define ${operation.operation} type`)] }
  }

  // Execute selection set
  try {
    const data = await executeSelectionSet(
      operation.selectionSet,
      rootType,
      rootValue,
      contextValue,
      variableValues || {},
      schema,
      document
    )

    return { data }
  } catch (error) {
    return { errors: [error instanceof GraphQLError ? error : new GraphQLError(String(error))] }
  }
}

function getOperation(document: any, operationName?: string): any {
  const operations = document.definitions.filter(
    (def: any) => def.kind === 'OperationDefinition'
  )

  if (operationName) {
    return operations.find((op: any) => op.name?.value === operationName)
  }

  return operations.length === 1 ? operations[0] : null
}

async function executeSelectionSet(
  selectionSet: any,
  objectType: GraphQLObjectType,
  objectValue: any,
  contextValue: any,
  variableValues: Record<string, any>,
  schema: GraphQLSchema,
  document: any
): Promise<any> {
  const fields = collectFields(objectType, selectionSet, variableValues, document)
  const result: Record<string, any> = {}

  for (const [responseName, fieldNodes] of Object.entries(fields)) {
    const fieldNode = (fieldNodes as any[])[0]
    const fieldName = fieldNode.name.value
    const fieldDef = objectType.getFields()[fieldName]

    if (!fieldDef) continue

    const args = getArgumentValues(fieldDef, fieldNode, variableValues)

    const info: GraphQLResolveInfo = {
      fieldName,
      fieldNodes: fieldNodes as any[],
      returnType: fieldDef.type,
      parentType: objectType,
      path: { prev: null, key: responseName },
      schema,
      fragments: {},
      rootValue: objectValue,
      operation: null,
      variableValues
    }

    const resolved = await resolveField(
      fieldDef,
      objectValue,
      args,
      contextValue,
      info
    )

    result[responseName] = await completeValue(
      fieldDef.type,
      resolved,
      fieldNode,
      contextValue,
      variableValues,
      schema,
      document
    )
  }

  return result
}

function collectFields(
  objectType: GraphQLObjectType,
  selectionSet: any,
  variableValues: Record<string, any>,
  document: any
): Record<string, any[]> {
  const fields: Record<string, any[]> = {}

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      const responseName = selection.alias?.value || selection.name.value

      if (!fields[responseName]) {
        fields[responseName] = []
      }

      fields[responseName].push(selection)
    } else if (selection.kind === 'InlineFragment') {
      // Handle inline fragments
      const fragmentFields = collectFields(
        objectType,
        selection.selectionSet,
        variableValues,
        document
      )

      for (const [name, fieldNodes] of Object.entries(fragmentFields)) {
        if (!fields[name]) {
          fields[name] = []
        }
        fields[name].push(...fieldNodes)
      }
    } else if (selection.kind === 'FragmentSpread') {
      // Handle fragment spreads
      const fragmentName = selection.name.value
      const fragment = document.definitions.find(
        (def: any) => def.kind === 'FragmentDefinition' && def.name.value === fragmentName
      )

      if (fragment) {
        const fragmentFields = collectFields(
          objectType,
          fragment.selectionSet,
          variableValues,
          document
        )

        for (const [name, fieldNodes] of Object.entries(fragmentFields)) {
          if (!fields[name]) {
            fields[name] = []
          }
          fields[name].push(...fieldNodes)
        }
      }
    }
  }

  return fields
}

function getArgumentValues(
  fieldDef: GraphQLField<any, any>,
  fieldNode: any,
  variableValues: Record<string, any>
): Record<string, any> {
  const args: Record<string, any> = {}

  if (!fieldNode.arguments || fieldNode.arguments.length === 0) {
    return args
  }

  for (const arg of fieldNode.arguments) {
    const argName = arg.name.value
    const argValue = getValueFromAST(arg.value, variableValues)
    args[argName] = argValue
  }

  return args
}

function getValueFromAST(valueNode: any, variableValues: Record<string, any>): any {
  if (valueNode.kind === 'Variable') {
    return variableValues[valueNode.name.value]
  }

  if (valueNode.kind === 'IntValue') return parseInt(valueNode.value)
  if (valueNode.kind === 'FloatValue') return parseFloat(valueNode.value)
  if (valueNode.kind === 'StringValue') return valueNode.value
  if (valueNode.kind === 'BooleanValue') return valueNode.value
  if (valueNode.kind === 'NullValue') return null
  if (valueNode.kind === 'EnumValue') return valueNode.value

  if (valueNode.kind === 'ListValue') {
    return valueNode.values.map((v: any) => getValueFromAST(v, variableValues))
  }

  if (valueNode.kind === 'ObjectValue') {
    const obj: Record<string, any> = {}
    for (const field of valueNode.fields) {
      obj[field.name.value] = getValueFromAST(field.value, variableValues)
    }
    return obj
  }

  return undefined
}

async function resolveField(
  fieldDef: GraphQLField<any, any>,
  source: any,
  args: Record<string, any>,
  context: any,
  info: GraphQLResolveInfo
): Promise<any> {
  const resolve = fieldDef.resolve || defaultFieldResolver

  try {
    return await resolve(source, args, context, info)
  } catch (error) {
    throw error instanceof GraphQLError ? error : new GraphQLError(String(error))
  }
}

function defaultFieldResolver(source: any, args: any, context: any, info: GraphQLResolveInfo): any {
  if (source == null) return null

  const fieldName = info.fieldName
  const value = source[fieldName]

  if (typeof value === 'function') {
    return value.call(source, args, context, info)
  }

  return value
}

async function completeValue(
  returnType: any,
  result: any,
  fieldNode: any,
  contextValue: any,
  variableValues: Record<string, any>,
  schema: GraphQLSchema,
  document: any
): Promise<any> {
  // Handle non-null types
  if (returnType.kind === 'NonNull') {
    const completed = await completeValue(
      returnType.ofType,
      result,
      fieldNode,
      contextValue,
      variableValues,
      schema,
      document
    )

    if (completed === null) {
      throw new GraphQLError('Cannot return null for non-nullable field')
    }

    return completed
  }

  if (result === null || result === undefined) {
    return null
  }

  // Handle list types
  if (returnType.kind === 'List') {
    if (!Array.isArray(result)) {
      throw new GraphQLError('Expected array')
    }

    return Promise.all(
      result.map(item =>
        completeValue(
          returnType.ofType,
          item,
          fieldNode,
          contextValue,
          variableValues,
          schema,
          document
        )
      )
    )
  }

  // Handle scalar and enum types
  if (returnType instanceof GraphQLScalarType) {
    return returnType.serialize(result)
  }

  if (returnType instanceof GraphQLEnumType) {
    return returnType.serialize(result)
  }

  // Handle object types
  if (returnType instanceof GraphQLObjectType) {
    if (!fieldNode.selectionSet) {
      throw new GraphQLError('Must select fields for object type')
    }

    return executeSelectionSet(
      fieldNode.selectionSet,
      returnType,
      result,
      contextValue,
      variableValues,
      schema,
      document
    )
  }

  return result
}

// ============================================================================
// Validation
// ============================================================================

export function validate(schema: GraphQLSchema, document: any): readonly GraphQLError[] {
  const errors: GraphQLError[] = []

  // Validate operations
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition') {
      validateOperation(schema, definition, document, errors)
    }
  }

  return errors
}

function validateOperation(
  schema: GraphQLSchema,
  operation: any,
  document: any,
  errors: GraphQLError[]
): void {
  // Get root type
  let rootType: GraphQLObjectType | undefined

  if (operation.operation === 'query') {
    rootType = schema.getQueryType()
  } else if (operation.operation === 'mutation') {
    rootType = schema.getMutationType()
  } else if (operation.operation === 'subscription') {
    rootType = schema.getSubscriptionType()
  }

  if (!rootType) {
    errors.push(new GraphQLError(`Schema does not define ${operation.operation} type`))
    return
  }

  validateSelectionSet(rootType, operation.selectionSet, schema, document, errors)
}

function validateSelectionSet(
  objectType: GraphQLObjectType,
  selectionSet: any,
  schema: GraphQLSchema,
  document: any,
  errors: GraphQLError[]
): void {
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      const fieldName = selection.name.value
      const fieldDef = objectType.getFields()[fieldName]

      if (!fieldDef) {
        errors.push(new GraphQLError(`Field "${fieldName}" not found on type "${objectType.name}"`))
        continue
      }

      if (selection.selectionSet) {
        let fieldType = fieldDef.type

        while (fieldType.kind === 'NonNull' || fieldType.kind === 'List') {
          fieldType = fieldType.ofType
        }

        if (fieldType instanceof GraphQLObjectType) {
          validateSelectionSet(fieldType, selection.selectionSet, schema, document, errors)
        }
      }
    }
  }
}

// ============================================================================
// Parsing
// ============================================================================

export function parse(source: string): any {
  // This is a simplified parser - real implementation would be more complex
  return {
    kind: 'Document',
    definitions: []
  }
}

// ============================================================================
// Subscriptions
// ============================================================================

export async function subscribe(args: ExecutionArgs): Promise<AsyncIterator<ExecutionResult>> {
  const { schema, document, contextValue, variableValues, operationName } = args

  const operation = getOperation(document, operationName)

  if (!operation || operation.operation !== 'subscription') {
    throw new GraphQLError('Must provide subscription operation')
  }

  const subscriptionType = schema.getSubscriptionType()

  if (!subscriptionType) {
    throw new GraphQLError('Schema does not define subscription type')
  }

  // Create async iterator
  return createSourceEventStream(
    schema,
    document,
    subscriptionType,
    contextValue,
    variableValues,
    operation
  )
}

async function createSourceEventStream(
  schema: GraphQLSchema,
  document: any,
  subscriptionType: GraphQLObjectType,
  contextValue: any,
  variableValues: Record<string, any>,
  operation: any
): Promise<AsyncIterator<ExecutionResult>> {
  const fields = collectFields(subscriptionType, operation.selectionSet, variableValues, document)
  const fieldEntry = Object.entries(fields)[0]

  if (!fieldEntry) {
    throw new GraphQLError('Subscription must have exactly one root field')
  }

  const [responseName, fieldNodes] = fieldEntry
  const fieldNode = fieldNodes[0]
  const fieldName = fieldNode.name.value
  const fieldDef = subscriptionType.getFields()[fieldName]

  if (!fieldDef || !fieldDef.subscribe) {
    throw new GraphQLError(`Subscription field "${fieldName}" does not have subscribe function`)
  }

  const args = getArgumentValues(fieldDef, fieldNode, variableValues)

  const info: GraphQLResolveInfo = {
    fieldName,
    fieldNodes,
    returnType: fieldDef.type,
    parentType: subscriptionType,
    path: { prev: null, key: responseName },
    schema,
    fragments: {},
    rootValue: undefined,
    operation,
    variableValues
  }

  return fieldDef.subscribe(undefined, args, contextValue, info)
}

// ============================================================================
// Errors
// ============================================================================

export class GraphQLError extends Error {
  extensions?: Record<string, any>
  locations?: any[]
  path?: any[]
  source?: any
  positions?: number[]
  nodes?: any[]
  originalError?: Error

  constructor(
    message: string,
    options?: {
      nodes?: any[]
      source?: any
      positions?: number[]
      path?: any[]
      originalError?: Error
      extensions?: Record<string, any>
    }
  ) {
    super(message)
    this.name = 'GraphQLError'

    if (options) {
      this.nodes = options.nodes
      this.source = options.source
      this.positions = options.positions
      this.path = options.path
      this.originalError = options.originalError
      this.extensions = options.extensions
    }
  }
}
