/**
 * PostgreSQL core types and builders
 */

export function pgTable(name: string, columns: any) {
  return { name, columns, type: 'pg' };
}

export function serial(name: string) {
  return new SerialBuilder(name);
}

export function integer(name: string) {
  return new IntegerBuilder(name);
}

export function text(name: string) {
  return new TextBuilder(name);
}

export function varchar(name: string, length?: number) {
  return new VarcharBuilder(name, length);
}

export function boolean(name: string) {
  return new BooleanBuilder(name);
}

export function timestamp(name: string) {
  return new TimestampBuilder(name);
}

export function date(name: string) {
  return new DateBuilder(name);
}

export function json(name: string) {
  return new JsonBuilder(name);
}

export function jsonb(name: string) {
  return new JsonbBuilder(name);
}

export function uuid(name: string) {
  return new UuidBuilder(name);
}

export function real(name: string) {
  return new RealBuilder(name);
}

export function doublePrecision(name: string) {
  return new DoublePrecisionBuilder(name);
}

class ColumnBuilder {
  protected config: any = {};

  constructor(protected name: string, protected type: string) {}

  notNull() {
    this.config.notNull = true;
    return this;
  }

  default(value: any) {
    this.config.default = value;
    return this;
  }

  defaultNow() {
    this.config.default = 'now()';
    return this;
  }

  unique() {
    this.config.unique = true;
    return this;
  }

  primaryKey() {
    this.config.primaryKey = true;
    return this;
  }

  references(fn: () => any) {
    this.config.references = fn;
    return this;
  }
}

class SerialBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'serial');
  }
}

class IntegerBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'integer');
  }
}

class TextBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'text');
  }
}

class VarcharBuilder extends ColumnBuilder {
  constructor(name: string, length?: number) {
    super(name, 'varchar');
    this.config.length = length;
  }
}

class BooleanBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'boolean');
  }
}

class TimestampBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'timestamp');
  }
}

class DateBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'date');
  }
}

class JsonBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'json');
  }
}

class JsonbBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'jsonb');
  }
}

class UuidBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'uuid');
  }
}

class RealBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'real');
  }
}

class DoublePrecisionBuilder extends ColumnBuilder {
  constructor(name: string) {
    super(name, 'double precision');
  }
}
