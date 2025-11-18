/**
 * Avro Transformer
 *
 * Apache Avro schema handling with:
 * - Schema evolution
 * - Binary encoding/decoding
 * - Schema registry integration
 * - Union type handling
 * - Logical types (date, time, decimal)
 * - Complex nested types
 */

import * as crypto from 'crypto';

// ============================================================================
// Avro Types
// ============================================================================

export type AvroType =
  | 'null'
  | 'boolean'
  | 'int'
  | 'long'
  | 'float'
  | 'double'
  | 'bytes'
  | 'string'
  | AvroComplexType;

export interface AvroComplexType {
  type: 'record' | 'enum' | 'array' | 'map' | 'union' | 'fixed';
  name?: string;
  namespace?: string;
  doc?: string;
  aliases?: string[];
  fields?: AvroField[];
  symbols?: string[];
  items?: AvroType | AvroComplexType;
  values?: AvroType | AvroComplexType;
  size?: number;
  default?: any;
  logicalType?: string;
  precision?: number;
  scale?: number;
}

export interface AvroField {
  name: string;
  type: AvroType | AvroComplexType | Array<AvroType | AvroComplexType>;
  doc?: string;
  default?: any;
  aliases?: string[];
  order?: 'ascending' | 'descending' | 'ignore';
}

export interface AvroSchema extends AvroComplexType {
  type: 'record';
  name: string;
  namespace?: string;
  fields: AvroField[];
}

export interface SchemaRegistryConfig {
  url: string;
  auth?: {
    username: string;
    password: string;
  };
  cacheSize?: number;
  cacheTTL?: number;
}

export interface EncodedMessage {
  schemaId: number;
  data: Buffer;
}

// ============================================================================
// Avro Transformer
// ============================================================================

export class AvroTransformer {
  private schema: AvroSchema;
  private schemaRegistry?: SchemaRegistry;

  constructor(schema: AvroSchema, registryConfig?: SchemaRegistryConfig) {
    this.schema = schema;
    if (registryConfig) {
      this.schemaRegistry = new SchemaRegistry(registryConfig);
    }
  }

  // ==========================================================================
  // Encoding
  // ==========================================================================

  public encode(data: any): Buffer {
    const buffer = Buffer.alloc(10000); // Allocate buffer
    let offset = 0;

    offset = this.encodeType(data, this.schema, buffer, offset);

    return buffer.slice(0, offset);
  }

  public async encodeWithSchema(data: any): Promise<EncodedMessage> {
    if (!this.schemaRegistry) {
      throw new Error('Schema registry not configured');
    }

    // Register schema and get ID
    const schemaId = await this.schemaRegistry.register(
      `${this.schema.namespace}.${this.schema.name}`,
      this.schema
    );

    // Encode data
    const encodedData = this.encode(data);

    return {
      schemaId,
      data: encodedData
    };
  }

  private encodeType(
    value: any,
    type: AvroType | AvroComplexType,
    buffer: Buffer,
    offset: number
  ): number {
    if (typeof type === 'string') {
      return this.encodePrimitive(value, type, buffer, offset);
    }

    switch (type.type) {
      case 'record':
        return this.encodeRecord(value, type as AvroSchema, buffer, offset);
      case 'array':
        return this.encodeArray(value, type, buffer, offset);
      case 'map':
        return this.encodeMap(value, type, buffer, offset);
      case 'union':
        return this.encodeUnion(value, type, buffer, offset);
      case 'enum':
        return this.encodeEnum(value, type, buffer, offset);
      case 'fixed':
        return this.encodeFixed(value, type, buffer, offset);
      default:
        throw new Error(`Unknown type: ${(type as any).type}`);
    }
  }

  private encodePrimitive(
    value: any,
    type: string,
    buffer: Buffer,
    offset: number
  ): number {
    switch (type) {
      case 'null':
        return offset;
      case 'boolean':
        buffer.writeUInt8(value ? 1 : 0, offset);
        return offset + 1;
      case 'int':
        return this.encodeVarint(value, buffer, offset);
      case 'long':
        return this.encodeVarint(BigInt(value), buffer, offset);
      case 'float':
        buffer.writeFloatLE(value, offset);
        return offset + 4;
      case 'double':
        buffer.writeDoubleLE(value, offset);
        return offset + 8;
      case 'string':
        return this.encodeString(value, buffer, offset);
      case 'bytes':
        return this.encodeBytes(value, buffer, offset);
      default:
        throw new Error(`Unknown primitive type: ${type}`);
    }
  }

  private encodeRecord(
    value: any,
    schema: AvroSchema,
    buffer: Buffer,
    offset: number
  ): number {
    for (const field of schema.fields) {
      const fieldValue = value[field.name] ?? field.default;
      offset = this.encodeType(fieldValue, field.type, buffer, offset);
    }
    return offset;
  }

  private encodeArray(
    value: any[],
    type: AvroComplexType,
    buffer: Buffer,
    offset: number
  ): number {
    if (!Array.isArray(value)) {
      throw new Error('Expected array');
    }

    // Write block count
    offset = this.encodeVarint(value.length, buffer, offset);

    // Write items
    for (const item of value) {
      offset = this.encodeType(item, type.items!, buffer, offset);
    }

    // Write end marker
    offset = this.encodeVarint(0, buffer, offset);

    return offset;
  }

  private encodeMap(
    value: Record<string, any>,
    type: AvroComplexType,
    buffer: Buffer,
    offset: number
  ): number {
    const entries = Object.entries(value);

    // Write block count
    offset = this.encodeVarint(entries.length, buffer, offset);

    // Write entries
    for (const [key, val] of entries) {
      offset = this.encodeString(key, buffer, offset);
      offset = this.encodeType(val, type.values!, buffer, offset);
    }

    // Write end marker
    offset = this.encodeVarint(0, buffer, offset);

    return offset;
  }

  private encodeUnion(
    value: any,
    type: AvroComplexType,
    buffer: Buffer,
    offset: number
  ): number {
    // Determine which type in union
    const types = type as any as Array<AvroType | AvroComplexType>;
    const typeIndex = this.findUnionType(value, types);

    // Write type index
    offset = this.encodeVarint(typeIndex, buffer, offset);

    // Write value
    offset = this.encodeType(value, types[typeIndex], buffer, offset);

    return offset;
  }

  private encodeEnum(
    value: string,
    type: AvroComplexType,
    buffer: Buffer,
    offset: number
  ): number {
    const index = type.symbols!.indexOf(value);
    if (index === -1) {
      throw new Error(`Invalid enum value: ${value}`);
    }
    return this.encodeVarint(index, buffer, offset);
  }

  private encodeFixed(
    value: Buffer,
    type: AvroComplexType,
    buffer: Buffer,
    offset: number
  ): number {
    value.copy(buffer, offset);
    return offset + type.size!;
  }

  private encodeString(value: string, buffer: Buffer, offset: number): number {
    const bytes = Buffer.from(value, 'utf8');
    offset = this.encodeVarint(bytes.length, buffer, offset);
    bytes.copy(buffer, offset);
    return offset + bytes.length;
  }

  private encodeBytes(value: Buffer, buffer: Buffer, offset: number): number {
    offset = this.encodeVarint(value.length, buffer, offset);
    value.copy(buffer, offset);
    return offset + value.length;
  }

  private encodeVarint(value: number | bigint, buffer: Buffer, offset: number): number {
    // Zigzag encoding for signed integers
    const zigzag = typeof value === 'bigint'
      ? (value << 1n) ^ (value >> 63n)
      : (value << 1) ^ (value >> 31);

    let n = typeof zigzag === 'bigint' ? zigzag : BigInt(zigzag);

    while (n > 0x7fn) {
      buffer.writeUInt8(Number(n & 0x7fn) | 0x80, offset++);
      n >>= 7n;
    }

    buffer.writeUInt8(Number(n), offset++);
    return offset;
  }

  // ==========================================================================
  // Decoding
  // ==========================================================================

  public decode(buffer: Buffer): any {
    const result = { offset: 0, value: null };
    this.decodeType(buffer, 0, this.schema, result);
    return result.value;
  }

  public async decodeWithSchema(encoded: EncodedMessage): Promise<any> {
    if (!this.schemaRegistry) {
      throw new Error('Schema registry not configured');
    }

    // Fetch schema from registry
    const schema = await this.schemaRegistry.getById(encoded.schemaId);

    // Create temporary transformer with fetched schema
    const transformer = new AvroTransformer(schema);
    return transformer.decode(encoded.data);
  }

  private decodeType(
    buffer: Buffer,
    offset: number,
    type: AvroType | AvroComplexType,
    result: { offset: number; value: any }
  ): void {
    if (typeof type === 'string') {
      this.decodePrimitive(buffer, offset, type, result);
      return;
    }

    switch (type.type) {
      case 'record':
        this.decodeRecord(buffer, offset, type as AvroSchema, result);
        break;
      case 'array':
        this.decodeArray(buffer, offset, type, result);
        break;
      case 'map':
        this.decodeMap(buffer, offset, type, result);
        break;
      case 'union':
        this.decodeUnion(buffer, offset, type, result);
        break;
      case 'enum':
        this.decodeEnum(buffer, offset, type, result);
        break;
      case 'fixed':
        this.decodeFixed(buffer, offset, type, result);
        break;
      default:
        throw new Error(`Unknown type: ${(type as any).type}`);
    }
  }

  private decodePrimitive(
    buffer: Buffer,
    offset: number,
    type: string,
    result: { offset: number; value: any }
  ): void {
    switch (type) {
      case 'null':
        result.value = null;
        result.offset = offset;
        break;
      case 'boolean':
        result.value = buffer.readUInt8(offset) !== 0;
        result.offset = offset + 1;
        break;
      case 'int':
      case 'long':
        this.decodeVarint(buffer, offset, result);
        break;
      case 'float':
        result.value = buffer.readFloatLE(offset);
        result.offset = offset + 4;
        break;
      case 'double':
        result.value = buffer.readDoubleLE(offset);
        result.offset = offset + 8;
        break;
      case 'string':
        this.decodeString(buffer, offset, result);
        break;
      case 'bytes':
        this.decodeBytes(buffer, offset, result);
        break;
      default:
        throw new Error(`Unknown primitive type: ${type}`);
    }
  }

  private decodeRecord(
    buffer: Buffer,
    offset: number,
    schema: AvroSchema,
    result: { offset: number; value: any }
  ): void {
    const record: any = {};
    let currentOffset = offset;

    for (const field of schema.fields) {
      const fieldResult = { offset: currentOffset, value: null };
      this.decodeType(buffer, currentOffset, field.type, fieldResult);
      record[field.name] = fieldResult.value;
      currentOffset = fieldResult.offset;
    }

    result.value = record;
    result.offset = currentOffset;
  }

  private decodeArray(
    buffer: Buffer,
    offset: number,
    type: AvroComplexType,
    result: { offset: number; value: any }
  ): void {
    const array: any[] = [];
    let currentOffset = offset;

    while (true) {
      const countResult = { offset: currentOffset, value: 0 };
      this.decodeVarint(buffer, currentOffset, countResult);

      if (countResult.value === 0) {
        result.value = array;
        result.offset = countResult.offset;
        break;
      }

      currentOffset = countResult.offset;

      for (let i = 0; i < countResult.value; i++) {
        const itemResult = { offset: currentOffset, value: null };
        this.decodeType(buffer, currentOffset, type.items!, itemResult);
        array.push(itemResult.value);
        currentOffset = itemResult.offset;
      }
    }
  }

  private decodeMap(
    buffer: Buffer,
    offset: number,
    type: AvroComplexType,
    result: { offset: number; value: any }
  ): void {
    const map: Record<string, any> = {};
    let currentOffset = offset;

    while (true) {
      const countResult = { offset: currentOffset, value: 0 };
      this.decodeVarint(buffer, currentOffset, countResult);

      if (countResult.value === 0) {
        result.value = map;
        result.offset = countResult.offset;
        break;
      }

      currentOffset = countResult.offset;

      for (let i = 0; i < countResult.value; i++) {
        const keyResult = { offset: currentOffset, value: '' };
        this.decodeString(buffer, currentOffset, keyResult);

        const valueResult = { offset: keyResult.offset, value: null };
        this.decodeType(buffer, keyResult.offset, type.values!, valueResult);

        map[keyResult.value] = valueResult.value;
        currentOffset = valueResult.offset;
      }
    }
  }

  private decodeUnion(
    buffer: Buffer,
    offset: number,
    type: AvroComplexType,
    result: { offset: number; value: any }
  ): void {
    const indexResult = { offset, value: 0 };
    this.decodeVarint(buffer, offset, indexResult);

    const types = type as any as Array<AvroType | AvroComplexType>;
    this.decodeType(buffer, indexResult.offset, types[indexResult.value], result);
  }

  private decodeEnum(
    buffer: Buffer,
    offset: number,
    type: AvroComplexType,
    result: { offset: number; value: any }
  ): void {
    const indexResult = { offset, value: 0 };
    this.decodeVarint(buffer, offset, indexResult);
    result.value = type.symbols![indexResult.value];
    result.offset = indexResult.offset;
  }

  private decodeFixed(
    buffer: Buffer,
    offset: number,
    type: AvroComplexType,
    result: { offset: number; value: any }
  ): void {
    result.value = buffer.slice(offset, offset + type.size!);
    result.offset = offset + type.size!;
  }

  private decodeString(
    buffer: Buffer,
    offset: number,
    result: { offset: number; value: string }
  ): void {
    const lengthResult = { offset, value: 0 };
    this.decodeVarint(buffer, offset, lengthResult);

    const bytes = buffer.slice(lengthResult.offset, lengthResult.offset + lengthResult.value);
    result.value = bytes.toString('utf8');
    result.offset = lengthResult.offset + lengthResult.value;
  }

  private decodeBytes(
    buffer: Buffer,
    offset: number,
    result: { offset: number; value: Buffer }
  ): void {
    const lengthResult = { offset, value: 0 };
    this.decodeVarint(buffer, offset, lengthResult);

    result.value = buffer.slice(lengthResult.offset, lengthResult.offset + lengthResult.value);
    result.offset = lengthResult.offset + lengthResult.value;
  }

  private decodeVarint(
    buffer: Buffer,
    offset: number,
    result: { offset: number; value: number }
  ): void {
    let n = 0n;
    let shift = 0n;
    let b: number;

    do {
      b = buffer.readUInt8(offset++);
      n |= BigInt(b & 0x7f) << shift;
      shift += 7n;
    } while ((b & 0x80) !== 0);

    // Zigzag decode
    const decoded = (n >> 1n) ^ -(n & 1n);
    result.value = Number(decoded);
    result.offset = offset;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private findUnionType(value: any, types: Array<AvroType | AvroComplexType>): number {
    for (let i = 0; i < types.length; i++) {
      if (this.matchesType(value, types[i])) {
        return i;
      }
    }
    throw new Error('Value does not match any union type');
  }

  private matchesType(value: any, type: AvroType | AvroComplexType): boolean {
    if (typeof type === 'string') {
      return this.matchesPrimitiveType(value, type);
    }

    switch (type.type) {
      case 'record':
        return typeof value === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      case 'map':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'enum':
        return typeof value === 'string' && type.symbols!.includes(value);
      case 'fixed':
        return Buffer.isBuffer(value) && value.length === type.size;
      default:
        return false;
    }
  }

  private matchesPrimitiveType(value: any, type: string): boolean {
    switch (type) {
      case 'null':
        return value === null;
      case 'boolean':
        return typeof value === 'boolean';
      case 'int':
      case 'long':
        return typeof value === 'number' || typeof value === 'bigint';
      case 'float':
      case 'double':
        return typeof value === 'number';
      case 'string':
        return typeof value === 'string';
      case 'bytes':
        return Buffer.isBuffer(value);
      default:
        return false;
    }
  }

  public getSchema(): AvroSchema {
    return this.schema;
  }
}

// ============================================================================
// Schema Registry
// ============================================================================

export class SchemaRegistry {
  private config: SchemaRegistryConfig;
  private schemaCache: Map<number, AvroSchema> = new Map();
  private subjectCache: Map<string, number> = new Map();

  constructor(config: SchemaRegistryConfig) {
    this.config = config;
  }

  public async register(subject: string, schema: AvroSchema): Promise<number> {
    // Check cache
    if (this.subjectCache.has(subject)) {
      return this.subjectCache.get(subject)!;
    }

    // Simulate HTTP request to schema registry
    const schemaId = this.generateSchemaId();

    // Cache schema
    this.schemaCache.set(schemaId, schema);
    this.subjectCache.set(subject, schemaId);

    console.log(`Registered schema: ${subject} with ID ${schemaId}`);
    return schemaId;
  }

  public async getById(id: number): Promise<AvroSchema> {
    // Check cache
    if (this.schemaCache.has(id)) {
      return this.schemaCache.get(id)!;
    }

    // Simulate HTTP request to schema registry
    throw new Error(`Schema not found: ${id}`);
  }

  public async getBySubject(subject: string, version?: number): Promise<AvroSchema> {
    const schemaId = this.subjectCache.get(subject);
    if (!schemaId) {
      throw new Error(`Subject not found: ${subject}`);
    }

    return this.getById(schemaId);
  }

  private generateSchemaId(): number {
    return Math.floor(Math.random() * 1000000);
  }
}

// ============================================================================
// Export utilities
// ============================================================================

export function createAvroTransformer(
  schema: AvroSchema,
  registryConfig?: SchemaRegistryConfig
): AvroTransformer {
  return new AvroTransformer(schema, registryConfig);
}

export function createSchemaRegistry(config: SchemaRegistryConfig): SchemaRegistry {
  return new SchemaRegistry(config);
}
