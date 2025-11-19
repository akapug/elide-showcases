/**
 * JSON:API Resource - Resource Definition and Management
 *
 * Provides resource definition, CRUD operations, and relationship handling.
 */

import { QueryParams } from '../query/parser'

export interface ResourceDefinition {
  type: string
  attributes: string[]
  relationships?: Record<string, RelationshipDefinition>
  filters?: Record<string, FilterFunction | Record<string, FilterFunction>>
  sortable?: string[]
  pagination?: PaginationConfig
  findAll: (query: QueryParams) => Promise<any[]> | any[]
  findOne: (id: string) => Promise<any> | any
  create?: (data: any, relationships?: any) => Promise<any> | any
  update?: (id: string, data: any) => Promise<any> | any
  delete?: (id: string) => Promise<boolean> | boolean
  findRelated?: (id: string, relationship: string, query: QueryParams) => Promise<any> | any
  findRelationship?: (id: string, relationship: string) => Promise<any> | any
  updateRelationship?: (id: string, relationship: string, data: any) => Promise<void> | void
  addToRelationship?: (id: string, relationship: string, data: any) => Promise<void> | void
  removeFromRelationship?: (id: string, relationship: string, data: any) => Promise<void> | void
}

export interface RelationshipDefinition {
  type: string
  many: boolean
  inverse?: string
}

export interface FilterFunction {
  (query: any, value: any): any
}

export interface PaginationConfig {
  type: 'offset' | 'cursor'
  defaultSize: number
  maxSize: number
}

/**
 * Resource class
 */
export class Resource {
  public readonly definition: ResourceDefinition

  constructor(definition: ResourceDefinition) {
    this.definition = definition
  }

  /**
   * Find all resources
   */
  async findAll(query: QueryParams): Promise<any[]> {
    let data = await this.definition.findAll(query)

    // Apply filters
    if (query.filter && this.definition.filters) {
      data = this.applyFilters(data, query.filter)
    }

    return data
  }

  /**
   * Find one resource
   */
  async findOne(id: string): Promise<any> {
    return this.definition.findOne(id)
  }

  /**
   * Create resource
   */
  async create(attributes: any, relationships?: any): Promise<any> {
    if (!this.definition.create) {
      throw new Error(`Create not supported for ${this.definition.type}`)
    }

    return this.definition.create(attributes, relationships)
  }

  /**
   * Update resource
   */
  async update(id: string, attributes: any): Promise<any> {
    if (!this.definition.update) {
      throw new Error(`Update not supported for ${this.definition.type}`)
    }

    return this.definition.update(id, attributes)
  }

  /**
   * Delete resource
   */
  async delete(id: string): Promise<boolean> {
    if (!this.definition.delete) {
      throw new Error(`Delete not supported for ${this.definition.type}`)
    }

    return this.definition.delete(id)
  }

  /**
   * Find related resources
   */
  async findRelated(id: string, relationship: string, query: QueryParams): Promise<any> {
    if (!this.definition.findRelated) {
      throw new Error(`findRelated not supported for ${this.definition.type}`)
    }

    return this.definition.findRelated(id, relationship, query)
  }

  /**
   * Find relationship
   */
  async findRelationship(id: string, relationship: string): Promise<any> {
    if (!this.definition.findRelationship) {
      throw new Error(`findRelationship not supported for ${this.definition.type}`)
    }

    return this.definition.findRelationship(id, relationship)
  }

  /**
   * Update relationship
   */
  async updateRelationship(id: string, relationship: string, data: any): Promise<void> {
    if (!this.definition.updateRelationship) {
      throw new Error(`updateRelationship not supported for ${this.definition.type}`)
    }

    return this.definition.updateRelationship(id, relationship, data)
  }

  /**
   * Add to relationship
   */
  async addToRelationship(id: string, relationship: string, data: any): Promise<void> {
    if (!this.definition.addToRelationship) {
      throw new Error(`addToRelationship not supported for ${this.definition.type}`)
    }

    return this.definition.addToRelationship(id, relationship, data)
  }

  /**
   * Remove from relationship
   */
  async removeFromRelationship(id: string, relationship: string, data: any): Promise<void> {
    if (!this.definition.removeFromRelationship) {
      throw new Error(`removeFromRelationship not supported for ${this.definition.type}`)
    }

    return this.definition.removeFromRelationship(id, relationship, data)
  }

  /**
   * Apply filters
   */
  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    if (!this.definition.filters) return data

    let filtered = data

    for (const [field, value] of Object.entries(filters)) {
      const filter = this.definition.filters[field]

      if (!filter) continue

      if (typeof filter === 'function') {
        filtered = filtered.filter((item) => this.testFilter(item, field, value, filter))
      } else if (typeof filter === 'object') {
        for (const [operator, fn] of Object.entries(value)) {
          const filterFn = filter[operator]
          if (filterFn) {
            filtered = filtered.filter((item) => this.testFilter(item, field, value[operator], filterFn))
          }
        }
      }
    }

    return filtered
  }

  /**
   * Test single filter
   */
  private testFilter(item: any, field: string, value: any, filter: FilterFunction): boolean {
    // Simple implementation - real version would be more sophisticated
    return item[field] === value
  }
}

/**
 * Define a resource
 */
export function defineResource(definition: ResourceDefinition): ResourceDefinition {
  return definition
}
