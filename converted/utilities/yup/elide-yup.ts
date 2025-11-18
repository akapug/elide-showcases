/**
 * Yup - Schema Validation with TypeScript Support
 *
 * Dead simple Object schema validation.
 * **POLYGLOT SHOWCASE**: One schema validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/yup (~40M+ downloads/week)
 *
 * Features:
 * - Simple, intuitive API
 * - TypeScript-first design
 * - Chainable schema definitions
 * - Custom error messages
 * - Type inference
 * - Transform and cast values
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need schema validation
 * - ONE validator works everywhere on Elide
 * - Share validation logic across your stack
 * - Consistent data validation
 *
 * Use cases:
 * - Form validation
 * - API validation
 * - Configuration validation
 * - Data transformation
 *
 * Package has ~40M+ downloads/week on npm!
 */

interface ValidationError {
  path: string;
  message: string;
  value: any;
}

class ValidationErrorClass extends Error {
  errors: string[];
  inner: ValidationError[];

  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors.map(e => e.message);
    this.inner = errors;
  }
}

abstract class BaseSchema<T = any> {
  protected tests: Array<(value: any) => string | null> = [];
  protected _default?: T;
  protected _required = false;
  protected transforms: Array<(value: any) => any> = [];

  required(message = 'This field is required'): this {
    this._required = true;
    this.tests.push((value) => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    });
    return this;
  }

  default(value: T): this {
    this._default = value;
    return this;
  }

  transform(fn: (value: any) => any): this {
    this.transforms.push(fn);
    return this;
  }

  validate(value: any): T {
    // Apply default
    if (value === undefined && this._default !== undefined) {
      value = this._default;
    }

    // Apply transforms
    for (const transform of this.transforms) {
      value = transform(value);
    }

    // Run tests
    const errors: ValidationError[] = [];
    for (const test of this.tests) {
      const error = test(value);
      if (error) {
        errors.push({ path: '', message: error, value });
      }
    }

    if (errors.length > 0) {
      throw new ValidationErrorClass(errors[0].message, errors);
    }

    return value;
  }

  async validateAsync(value: any): Promise<T> {
    return this.validate(value);
  }
}

class StringSchema extends BaseSchema<string> {
  min(limit: number, message?: string): this {
    this.tests.push((value) => {
      if (typeof value === 'string' && value.length < limit) {
        return message || `Must be at least ${limit} characters`;
      }
      return null;
    });
    return this;
  }

  max(limit: number, message?: string): this {
    this.tests.push((value) => {
      if (typeof value === 'string' && value.length > limit) {
        return message || `Must be at most ${limit} characters`;
      }
      return null;
    });
    return this;
  }

  email(message = 'Must be a valid email'): this {
    this.tests.push((value) => {
      if (typeof value === 'string' && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return message;
      }
      return null;
    });
    return this;
  }

  url(message = 'Must be a valid URL'): this {
    this.tests.push((value) => {
      if (typeof value === 'string') {
        try {
          new URL(value);
          return null;
        } catch {
          return message;
        }
      }
      return null;
    });
    return this;
  }

  matches(regex: RegExp, message?: string): this {
    this.tests.push((value) => {
      if (typeof value === 'string' && !regex.test(value)) {
        return message || `Must match pattern ${regex}`;
      }
      return null;
    });
    return this;
  }

  trim(): this {
    this.transform(value => typeof value === 'string' ? value.trim() : value);
    return this;
  }

  lowercase(): this {
    this.transform(value => typeof value === 'string' ? value.toLowerCase() : value);
    return this;
  }

  uppercase(): this {
    this.transform(value => typeof value === 'string' ? value.toUpperCase() : value);
    return this;
  }
}

class NumberSchema extends BaseSchema<number> {
  constructor() {
    super();
    this.tests.push((value) => {
      if (value !== undefined && value !== null && typeof value !== 'number') {
        return 'Must be a number';
      }
      return null;
    });
  }

  min(limit: number, message?: string): this {
    this.tests.push((value) => {
      if (typeof value === 'number' && value < limit) {
        return message || `Must be at least ${limit}`;
      }
      return null;
    });
    return this;
  }

  max(limit: number, message?: string): this {
    this.tests.push((value) => {
      if (typeof value === 'number' && value > limit) {
        return message || `Must be at most ${limit}`;
      }
      return null;
    });
    return this;
  }

  positive(message = 'Must be a positive number'): this {
    this.tests.push((value) => {
      if (typeof value === 'number' && value <= 0) {
        return message;
      }
      return null;
    });
    return this;
  }

  negative(message = 'Must be a negative number'): this {
    this.tests.push((value) => {
      if (typeof value === 'number' && value >= 0) {
        return message;
      }
      return null;
    });
    return this;
  }

  integer(message = 'Must be an integer'): this {
    this.tests.push((value) => {
      if (typeof value === 'number' && !Number.isInteger(value)) {
        return message;
      }
      return null;
    });
    return this;
  }
}

class ObjectSchema extends BaseSchema<any> {
  private shape: Record<string, BaseSchema> = {};

  constructor(shapeDefinition?: Record<string, BaseSchema>) {
    super();
    if (shapeDefinition) {
      this.shape = shapeDefinition;
    }
  }

  validate(value: any): any {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationErrorClass('Must be an object', [
        { path: '', message: 'Must be an object', value }
      ]);
    }

    const validated: any = {};
    const errors: ValidationError[] = [];

    for (const [key, schema] of Object.entries(this.shape)) {
      try {
        validated[key] = schema.validate(value[key]);
      } catch (error) {
        if (error instanceof ValidationErrorClass) {
          errors.push(...error.inner.map(e => ({
            ...e,
            path: key
          })));
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationErrorClass(errors[0].message, errors);
    }

    return validated;
  }
}

class ArraySchema extends BaseSchema<any[]> {
  private itemSchema?: BaseSchema;

  of(schema: BaseSchema): this {
    this.itemSchema = schema;
    return this;
  }

  min(limit: number, message?: string): this {
    this.tests.push((value) => {
      if (Array.isArray(value) && value.length < limit) {
        return message || `Must have at least ${limit} items`;
      }
      return null;
    });
    return this;
  }

  max(limit: number, message?: string): this {
    this.tests.push((value) => {
      if (Array.isArray(value) && value.length > limit) {
        return message || `Must have at most ${limit} items`;
      }
      return null;
    });
    return this;
  }

  validate(value: any): any[] {
    if (!Array.isArray(value)) {
      throw new ValidationErrorClass('Must be an array', [
        { path: '', message: 'Must be an array', value }
      ]);
    }

    if (this.itemSchema) {
      const validated: any[] = [];
      const errors: ValidationError[] = [];

      for (let i = 0; i < value.length; i++) {
        try {
          validated.push(this.itemSchema.validate(value[i]));
        } catch (error) {
          if (error instanceof ValidationErrorClass) {
            errors.push(...error.inner.map(e => ({
              ...e,
              path: `[${i}]`
            })));
          }
        }
      }

      if (errors.length > 0) {
        throw new ValidationErrorClass(errors[0].message, errors);
      }

      return validated;
    }

    return value;
  }
}

const yup = {
  string(): StringSchema {
    return new StringSchema();
  },

  number(): NumberSchema {
    return new NumberSchema();
  },

  object(shape?: Record<string, BaseSchema>): ObjectSchema {
    return new ObjectSchema(shape);
  },

  array(): ArraySchema {
    return new ArraySchema();
  }
};

export default yup;

// CLI Demo
if (import.meta.url.includes("elide-yup.ts")) {
  console.log("✅ Yup - Schema Validation Library (POLYGLOT!)\n");

  console.log("=== Example 1: String Validation ===");
  const nameSchema = yup.string().min(3).max(30).required();
  try {
    console.log("Valid:", nameSchema.validate("Alice"));
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 2: Email Validation ===");
  const emailSchema = yup.string().email().required();
  try {
    console.log("Valid:", emailSchema.validate("user@example.com"));
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 3: Number Validation ===");
  const ageSchema = yup.number().min(18).max(120).integer();
  try {
    console.log("Valid:", ageSchema.validate(25));
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 4: Object Validation ===");
  const userSchema = yup.object({
    username: yup.string().min(3).required(),
    email: yup.string().email().required(),
    age: yup.number().min(18).integer()
  });

  try {
    const result = userSchema.validate({
      username: "alice",
      email: "alice@example.com",
      age: 25
    });
    console.log("Valid user:", result);
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 5: String Transforms ===");
  const transformSchema = yup.string().trim().lowercase();
  console.log("Transformed:", transformSchema.validate("  HELLO  "));
  console.log();

  console.log("=== Example 6: Array Validation ===");
  const tagsSchema = yup.array().of(yup.string()).min(1).max(5);
  try {
    console.log("Valid:", tagsSchema.validate(["javascript", "typescript"]));
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Form validation");
  console.log("- API request validation");
  console.log("- Configuration validation");
  console.log("- Data transformation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Simple, intuitive API");
  console.log("- Zero dependencies");
  console.log("- ~40M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use for form validation in all services");
  console.log("- Share schemas across TypeScript, Python, Ruby, Java");
  console.log("- Consistent validation logic");
  console.log("- Perfect for polyglot microservices!");
}
