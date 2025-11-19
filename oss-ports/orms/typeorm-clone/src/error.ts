/**
 * Error classes
 */

export class TypeORMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TypeORMError';
  }
}

export class EntityNotFoundError extends TypeORMError {
  constructor(entityName: string, criteria: any) {
    super(`Could not find any entity of type "${entityName}" matching: ${JSON.stringify(criteria)}`);
    this.name = 'EntityNotFoundError';
  }
}

export class QueryFailedError extends TypeORMError {
  constructor(query: string, parameters: any[], error: Error) {
    super(`Query failed: ${query}\nParameters: ${JSON.stringify(parameters)}\nError: ${error.message}`);
    this.name = 'QueryFailedError';
  }
}

export class RepositoryNotFoundError extends TypeORMError {
  constructor(entityName: string) {
    super(`No repository for "${entityName}" was found`);
    this.name = 'RepositoryNotFoundError';
  }
}

export class ConnectionNotFoundError extends TypeORMError {
  constructor(name: string) {
    super(`Connection "${name}" was not found`);
    this.name = 'ConnectionNotFoundError';
  }
}
