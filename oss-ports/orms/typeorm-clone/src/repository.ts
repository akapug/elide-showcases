/**
 * Repository implementation
 */

import { EntityManager } from './entity-manager';
import { SelectQueryBuilder } from './query-builder';
import { FindManyOptions, FindOneOptions, FindOptionsWhere, SaveOptions, RemoveOptions } from './types';

export class Repository<Entity> {
  constructor(
    protected target: Function,
    protected manager: EntityManager
  ) {}

  get metadata() {
    return this.manager.getMetadata(this.target);
  }

  create(entityOrEntities?: any): Entity | Entity[] {
    if (Array.isArray(entityOrEntities)) {
      return entityOrEntities.map(entity => this.create(entity)) as Entity[];
    }

    const newEntity = new (this.target as any)();
    if (entityOrEntities) {
      Object.assign(newEntity, entityOrEntities);
    }
    return newEntity as Entity;
  }

  async save(entities: Entity | Entity[], options?: SaveOptions): Promise<Entity | Entity[]> {
    return this.manager.save(this.target, entities, options);
  }

  async remove(entities: Entity | Entity[], options?: RemoveOptions): Promise<Entity | Entity[]> {
    return this.manager.remove(this.target, entities, options);
  }

  async softRemove(entities: Entity | Entity[], options?: SaveOptions): Promise<Entity | Entity[]> {
    return this.manager.softRemove(this.target, entities, options);
  }

  async recover(entities: Entity | Entity[], options?: SaveOptions): Promise<Entity | Entity[]> {
    return this.manager.recover(this.target, entities, options);
  }

  async insert(entity: any): Promise<any> {
    return this.manager.insert(this.target, entity);
  }

  async update(criteria: any, partialEntity: any): Promise<any> {
    return this.manager.update(this.target, criteria, partialEntity);
  }

  async delete(criteria: any): Promise<any> {
    return this.manager.delete(this.target, criteria);
  }

  async softDelete(criteria: any): Promise<any> {
    return this.manager.softDelete(this.target, criteria);
  }

  async restore(criteria: any): Promise<any> {
    return this.manager.restore(this.target, criteria);
  }

  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return this.manager.count(this.target, options);
  }

  async countBy(where: FindOptionsWhere<Entity>): Promise<number> {
    return this.count({ where });
  }

  async find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.manager.find(this.target, options);
  }

  async findBy(where: FindOptionsWhere<Entity>): Promise<Entity[]> {
    return this.find({ where });
  }

  async findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    return this.manager.findAndCount(this.target, options);
  }

  async findAndCountBy(where: FindOptionsWhere<Entity>): Promise<[Entity[], number]> {
    return this.findAndCount({ where });
  }

  async findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.manager.findOne(this.target, options);
  }

  async findOneBy(where: FindOptionsWhere<Entity>): Promise<Entity | null> {
    return this.findOne({ where });
  }

  async findOneOrFail(options: FindOneOptions<Entity>): Promise<Entity> {
    const entity = await this.findOne(options);
    if (!entity) {
      throw new Error(`Entity not found`);
    }
    return entity;
  }

  async findOneByOrFail(where: FindOptionsWhere<Entity>): Promise<Entity> {
    return this.findOneOrFail({ where });
  }

  createQueryBuilder(alias?: string): SelectQueryBuilder<Entity> {
    return new SelectQueryBuilder(this.manager.connection)
      .select(alias || this.metadata.tableName)
      .from(this.target, alias || this.metadata.tableName);
  }

  async query(query: string, parameters?: any[]): Promise<any> {
    return this.manager.query(query, parameters);
  }

  async clear(): Promise<void> {
    return this.manager.clear(this.target);
  }

  async increment(conditions: any, propertyPath: string, value: number): Promise<any> {
    return this.manager.increment(this.target, conditions, propertyPath, value);
  }

  async decrement(conditions: any, propertyPath: string, value: number): Promise<any> {
    return this.manager.decrement(this.target, conditions, propertyPath, value);
  }

  async exist(options?: FindManyOptions<Entity>): Promise<boolean> {
    const count = await this.count(options);
    return count > 0;
  }

  async existBy(where: FindOptionsWhere<Entity>): Promise<boolean> {
    return this.exist({ where });
  }
}

export class TreeRepository<Entity> extends Repository<Entity> {
  async findTrees(): Promise<Entity[]> {
    // Implementation for tree structures
    return [];
  }

  async findRoots(): Promise<Entity[]> {
    // Implementation for finding root nodes
    return [];
  }

  async findDescendants(entity: Entity): Promise<Entity[]> {
    // Implementation for finding descendants
    return [];
  }

  async findDescendantsTree(entity: Entity): Promise<Entity> {
    // Implementation for finding descendants tree
    return entity;
  }

  async findAncestors(entity: Entity): Promise<Entity[]> {
    // Implementation for finding ancestors
    return [];
  }

  async findAncestorsTree(entity: Entity): Promise<Entity> {
    // Implementation for finding ancestors tree
    return entity;
  }

  async countDescendants(entity: Entity): Promise<number> {
    // Implementation for counting descendants
    return 0;
  }

  async countAncestors(entity: Entity): Promise<number> {
    // Implementation for counting ancestors
    return 0;
  }
}

export class MongoRepository<Entity> extends Repository<Entity> {
  async findByIds(ids: any[]): Promise<Entity[]> {
    // MongoDB specific implementation
    return [];
  }

  async findOneById(id: any): Promise<Entity | null> {
    // MongoDB specific implementation
    return null;
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    // MongoDB aggregation pipeline
    return [];
  }

  async createCursor(query?: any): Promise<any> {
    // Create MongoDB cursor
    return null;
  }
}
