/**
 * Prisma Namespace - contains all Prisma types and utilities
 */

export namespace Prisma {
  export const prismaVersion: PrismaVersion = {
    client: '1.0.0',
    engine: '1.0.0'
  };

  export interface PrismaVersion {
    client: string;
    engine: string;
  }

  export type PrismaPromise<T> = Promise<T> & {
    [Symbol.toStringTag]: 'PrismaPromise';
  };

  export class Decimal {
    private value: number;

    constructor(value: string | number) {
      this.value = typeof value === 'string' ? parseFloat(value) : value;
    }

    toString(): string {
      return this.value.toString();
    }

    toNumber(): number {
      return this.value;
    }

    toFixed(decimals: number = 2): string {
      return this.value.toFixed(decimals);
    }
  }

  export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
  export interface JsonObject {
    [key: string]: JsonValue;
  }
  export interface JsonArray extends Array<JsonValue> {}

  export const ModelName = {
    User: 'User',
    Post: 'Post',
    Profile: 'Profile',
    Tag: 'Tag'
  } as const;

  export type ModelName = typeof ModelName[keyof typeof ModelName];
}
