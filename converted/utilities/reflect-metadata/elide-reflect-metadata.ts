/**
 * Reflect Metadata - Metadata Reflection API
 *
 * Polyfill for Metadata Reflection API (Stage 2 proposal).
 * **POLYGLOT SHOWCASE**: Metadata reflection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/reflect-metadata (~5M+ downloads/week)
 *
 * Features:
 * - Metadata definition
 * - Metadata queries
 * - Decorator metadata
 * - Design-time type information
 * - Property decorators
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need metadata
 * - ONE implementation works everywhere on Elide
 * - Decorator patterns across languages
 * - Share metadata schemas
 *
 * Use cases:
 * - Dependency injection
 * - Validation frameworks
 * - ORM systems
 * - Serialization
 *
 * Package has ~5M+ downloads/week on npm - essential for decorators!
 */

const metadataMap = new WeakMap<any, Map<string | symbol, Map<any, any>>>();

/**
 * Define metadata
 */
function defineMetadata(
  metadataKey: any,
  metadataValue: any,
  target: Object,
  propertyKey?: string | symbol
): void {
  const targetKey = propertyKey !== undefined ? propertyKey : '__metadata__';

  if (!metadataMap.has(target)) {
    metadataMap.set(target, new Map());
  }

  const targetMetadata = metadataMap.get(target)!;

  if (!targetMetadata.has(targetKey)) {
    targetMetadata.set(targetKey, new Map());
  }

  targetMetadata.get(targetKey)!.set(metadataKey, metadataValue);
}

/**
 * Get metadata
 */
function getMetadata(
  metadataKey: any,
  target: Object,
  propertyKey?: string | symbol
): any {
  const targetKey = propertyKey !== undefined ? propertyKey : '__metadata__';
  const targetMetadata = metadataMap.get(target);

  if (!targetMetadata) {
    return undefined;
  }

  const propertyMetadata = targetMetadata.get(targetKey);
  return propertyMetadata?.get(metadataKey);
}

/**
 * Get own metadata
 */
function getOwnMetadata(
  metadataKey: any,
  target: Object,
  propertyKey?: string | symbol
): any {
  return getMetadata(metadataKey, target, propertyKey);
}

/**
 * Has metadata
 */
function hasMetadata(
  metadataKey: any,
  target: Object,
  propertyKey?: string | symbol
): boolean {
  return getMetadata(metadataKey, target, propertyKey) !== undefined;
}

/**
 * Has own metadata
 */
function hasOwnMetadata(
  metadataKey: any,
  target: Object,
  propertyKey?: string | symbol
): boolean {
  return getOwnMetadata(metadataKey, target, propertyKey) !== undefined;
}

/**
 * Get metadata keys
 */
function getMetadataKeys(target: Object, propertyKey?: string | symbol): any[] {
  const targetKey = propertyKey !== undefined ? propertyKey : '__metadata__';
  const targetMetadata = metadataMap.get(target);

  if (!targetMetadata) {
    return [];
  }

  const propertyMetadata = targetMetadata.get(targetKey);
  return propertyMetadata ? Array.from(propertyMetadata.keys()) : [];
}

/**
 * Get own metadata keys
 */
function getOwnMetadataKeys(target: Object, propertyKey?: string | symbol): any[] {
  return getMetadataKeys(target, propertyKey);
}

/**
 * Delete metadata
 */
function deleteMetadata(
  metadataKey: any,
  target: Object,
  propertyKey?: string | symbol
): boolean {
  const targetKey = propertyKey !== undefined ? propertyKey : '__metadata__';
  const targetMetadata = metadataMap.get(target);

  if (!targetMetadata) {
    return false;
  }

  const propertyMetadata = targetMetadata.get(targetKey);
  return propertyMetadata ? propertyMetadata.delete(metadataKey) : false;
}

/**
 * Metadata decorator factory
 */
function metadata(metadataKey: any, metadataValue: any) {
  return function(target: Object, propertyKey?: string | symbol) {
    defineMetadata(metadataKey, metadataValue, target, propertyKey);
  };
}

// Export Reflect with metadata functions
export const Reflect = {
  defineMetadata,
  getMetadata,
  getOwnMetadata,
  hasMetadata,
  hasOwnMetadata,
  getMetadataKeys,
  getOwnMetadataKeys,
  deleteMetadata,
  metadata
};

export {
  defineMetadata,
  getMetadata,
  getOwnMetadata,
  hasMetadata,
  hasOwnMetadata,
  getMetadataKeys,
  getOwnMetadataKeys,
  deleteMetadata,
  metadata
};

export default Reflect;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 Reflect Metadata - Metadata API for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Metadata ===");
  class User {
    name!: string;
  }

  Reflect.defineMetadata('role', 'admin', User);
  const role = Reflect.getMetadata('role', User);
  console.log("User role:", role);
  console.log();

  console.log("=== Example 2: Property Metadata ===");
  class Product {
    name!: string;
    price!: number;
  }

  Reflect.defineMetadata('required', true, Product.prototype, 'name');
  Reflect.defineMetadata('min', 0, Product.prototype, 'price');

  const isRequired = Reflect.getMetadata('required', Product.prototype, 'name');
  const minPrice = Reflect.getMetadata('min', Product.prototype, 'price');

  console.log("Name is required:", isRequired);
  console.log("Min price:", minPrice);
  console.log();

  console.log("=== Example 3: Validation Metadata ===");
  interface ValidationRule {
    type: string;
    message: string;
  }

  class Account {
    email!: string;
    age!: number;
  }

  const emailRule: ValidationRule = {
    type: 'email',
    message: 'Invalid email format'
  };

  const ageRule: ValidationRule = {
    type: 'min',
    message: 'Must be 18 or older'
  };

  Reflect.defineMetadata('validation', emailRule, Account.prototype, 'email');
  Reflect.defineMetadata('validation', ageRule, Account.prototype, 'age');

  const emailValidation = Reflect.getMetadata('validation', Account.prototype, 'email');
  console.log("Email validation:", emailValidation);
  console.log();

  console.log("=== Example 4: Has Metadata ===");
  console.log("Has role metadata:", Reflect.hasMetadata('role', User));
  console.log("Has missing metadata:", Reflect.hasMetadata('missing', User));
  console.log();

  console.log("=== Example 5: Get Metadata Keys ===");
  class Config {
    apiUrl!: string;
  }

  Reflect.defineMetadata('env', 'production', Config);
  Reflect.defineMetadata('version', '1.0.0', Config);
  Reflect.defineMetadata('debug', false, Config);

  const keys = Reflect.getMetadataKeys(Config);
  console.log("Metadata keys:", keys);
  console.log();

  console.log("=== Example 6: Decorator Pattern ===");
  function Required() {
    return Reflect.metadata('required', true);
  }

  function MinLength(length: number) {
    return Reflect.metadata('minLength', length);
  }

  class Form {
    @Required()
    @MinLength(3)
    username!: string;
  }

  const isUsernameRequired = Reflect.getMetadata('required', Form.prototype, 'username');
  const minLength = Reflect.getMetadata('minLength', Form.prototype, 'username');

  console.log("Username required:", isUsernameRequired);
  console.log("Min length:", minLength);
  console.log();

  console.log("=== Example 7: Delete Metadata ===");
  Reflect.defineMetadata('temp', 'value', User);
  console.log("Before delete:", Reflect.getMetadata('temp', User));
  Reflect.deleteMetadata('temp', User);
  console.log("After delete:", Reflect.getMetadata('temp', User));
  console.log();

  console.log("=== Example 8: DI Metadata ===");
  const INJECT_METADATA = 'inject:tokens';

  class Database {
    query() { return 'result'; }
  }

  class Service {
    constructor(private db: Database) {}
  }

  Reflect.defineMetadata(INJECT_METADATA, [Database], Service);

  const dependencies = Reflect.getMetadata(INJECT_METADATA, Service);
  console.log("Service dependencies:", dependencies);
  console.log();

  console.log("=== Example 9: Serialization Metadata ===");
  class ApiModel {
    @Reflect.metadata('serialize', 'id')
    userId!: number;

    @Reflect.metadata('serialize', 'name')
    userName!: string;
  }

  const userIdMeta = Reflect.getMetadata('serialize', ApiModel.prototype, 'userId');
  const userNameMeta = Reflect.getMetadata('serialize', ApiModel.prototype, 'userName');

  console.log("UserId serializes as:", userIdMeta);
  console.log("UserName serializes as:", userNameMeta);
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same Reflect Metadata works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Decorator metadata everywhere");
  console.log("  ✓ Validation schemas");
  console.log("  ✓ DI container metadata");
  console.log("  ✓ ORM field definitions");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Dependency injection systems");
  console.log("- Validation frameworks");
  console.log("- ORM/database mapping");
  console.log("- Serialization libraries");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- WeakMap-based storage");
  console.log("- ~5M+ downloads/week on npm!");
}
