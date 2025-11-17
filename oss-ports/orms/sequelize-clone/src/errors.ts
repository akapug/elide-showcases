/**
 * Error classes
 */

export class SequelizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SequelizeError';
  }
}

export class ValidationError extends SequelizeError {
  constructor(message: string, public errors: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends SequelizeError {
  constructor(message: string, public original: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends SequelizeError {
  constructor(message: string, public original: Error) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class ForeignKeyConstraintError extends DatabaseError {
  constructor(options: any) {
    super('Foreign key constraint error', options.parent);
    this.name = 'ForeignKeyConstraintError';
  }
}

export class UniqueConstraintError extends ValidationError {
  constructor(options: any) {
    super('Unique constraint error', options.errors);
    this.name = 'UniqueConstraintError';
  }
}
