/**
 * Entity subscribers
 */

export interface EntitySubscriberInterface<Entity = any> {
  listenTo?(): Function;
  beforeInsert?(event: InsertEvent<Entity>): Promise<void> | void;
  afterInsert?(event: InsertEvent<Entity>): Promise<void> | void;
  beforeUpdate?(event: UpdateEvent<Entity>): Promise<void> | void;
  afterUpdate?(event: UpdateEvent<Entity>): Promise<void> | void;
  beforeRemove?(event: RemoveEvent<Entity>): Promise<void> | void;
  afterRemove?(event: RemoveEvent<Entity>): Promise<void> | void;
  afterLoad?(entity: Entity): Promise<void> | void;
}

export interface InsertEvent<Entity> {
  entity: Entity;
  metadata: any;
}

export interface UpdateEvent<Entity> {
  entity: Entity;
  metadata: any;
  databaseEntity?: Entity;
  updatedColumns: any[];
  updatedRelations: any[];
}

export interface RemoveEvent<Entity> {
  entity?: Entity;
  entityId?: any;
  metadata: any;
  databaseEntity?: Entity;
}

export function EventSubscriber(): ClassDecorator {
  return function (target: Function) {
    // Register subscriber
  };
}
