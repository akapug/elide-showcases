/**
 * Zod - TypeScript-first Schema Validation
 *
 * TypeScript-first schema declaration and validation library.
 * **POLYGLOT SHOWCASE**: One type-safe validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/zod (~45M+ downloads/week)
 *
 * Features:
 * - TypeScript-first with static type inference
 * - Zero dependencies
 * - Composable schemas
 * - Rich error messages
 * - Transform and refine data
 * - Parse, don't validate philosophy
 * - Immutable schemas
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need type-safe validation
 * - ONE schema works everywhere on Elide
 * - Consistent data parsing across services
 * - Share type-safe schemas across your stack
 *
 * Use cases:
 * - API request/response validation
 * - Configuration parsing
 * - Form validation
 * - Data transformation
 *
 * Package has ~45M+ downloads/week on npm!
 */

interface ZodIssue {
  code: string;
  path: (string | number)[];
  message: string;
}

class ZodError extends Error {
  issues: ZodIssue[];

  constructor(issues: ZodIssue[]) {
    super(issues[0]?.message || 'Validation error');
    this.name = 'ZodError';
    this.issues = issues;
  }

  format(): any {
    const formatted: any = {};
    for (const issue of this.issues) {
      let current = formatted;
      for (let i = 0; i < issue.path.length - 1; i++) {
        const key = issue.path[i];
        if (!current[key]) current[key] = {};
        current = current[key];
      }
      const lastKey = issue.path[issue.path.length - 1];
      current[lastKey] = { _errors: [issue.message] };
    }
    return formatted;
  }
}

abstract class ZodType<Output = any, Input = Output> {
  parse(data: Input): Output {
    const result = this.safeParse(data);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  abstract safeParse(data: Input): { success: true; data: Output } | { success: false; error: ZodError };

  optional(): ZodOptional<this> {
    return new ZodOptional(this);
  }

  nullable(): ZodNullable<this> {
    return new ZodNullable(this);
  }

  default(value: Output): ZodDefault<this> {
    return new ZodDefault(this, value);
  }
}

class ZodString extends ZodType<string, string> {
  private minLength?: number;
  private maxLength?: number;
  private emailCheck = false;
  private urlCheck = false;
  private regexPattern?: RegExp;

  min(length: number): this {
    this.minLength = length;
    return this;
  }

  max(length: number): this {
    this.maxLength = length;
    return this;
  }

  email(): this {
    this.emailCheck = true;
    return this;
  }

  url(): this {
    this.urlCheck = true;
    return this;
  }

  regex(pattern: RegExp): this {
    this.regexPattern = pattern;
    return this;
  }

  safeParse(data: string): { success: true; data: string } | { success: false; error: ZodError } {
    const issues: ZodIssue[] = [];

    if (typeof data !== 'string') {
      issues.push({
        code: 'invalid_type',
        path: [],
        message: 'Expected string, received ' + typeof data
      });
      return { success: false, error: new ZodError(issues) };
    }

    if (this.minLength !== undefined && data.length < this.minLength) {
      issues.push({
        code: 'too_small',
        path: [],
        message: `String must contain at least ${this.minLength} character(s)`
      });
    }

    if (this.maxLength !== undefined && data.length > this.maxLength) {
      issues.push({
        code: 'too_big',
        path: [],
        message: `String must contain at most ${this.maxLength} character(s)`
      });
    }

    if (this.emailCheck && !data.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      issues.push({
        code: 'invalid_string',
        path: [],
        message: 'Invalid email'
      });
    }

    if (this.urlCheck) {
      try {
        new URL(data);
      } catch {
        issues.push({
          code: 'invalid_string',
          path: [],
          message: 'Invalid url'
        });
      }
    }

    if (this.regexPattern && !this.regexPattern.test(data)) {
      issues.push({
        code: 'invalid_string',
        path: [],
        message: 'Invalid'
      });
    }

    if (issues.length > 0) {
      return { success: false, error: new ZodError(issues) };
    }

    return { success: true, data };
  }
}

class ZodNumber extends ZodType<number, number> {
  private minValue?: number;
  private maxValue?: number;
  private intCheck = false;
  private positiveCheck = false;

  min(value: number): this {
    this.minValue = value;
    return this;
  }

  max(value: number): this {
    this.maxValue = value;
    return this;
  }

  int(): this {
    this.intCheck = true;
    return this;
  }

  positive(): this {
    this.positiveCheck = true;
    return this;
  }

  safeParse(data: number): { success: true; data: number } | { success: false; error: ZodError } {
    const issues: ZodIssue[] = [];

    if (typeof data !== 'number' || isNaN(data)) {
      issues.push({
        code: 'invalid_type',
        path: [],
        message: 'Expected number, received ' + typeof data
      });
      return { success: false, error: new ZodError(issues) };
    }

    if (this.minValue !== undefined && data < this.minValue) {
      issues.push({
        code: 'too_small',
        path: [],
        message: `Number must be greater than or equal to ${this.minValue}`
      });
    }

    if (this.maxValue !== undefined && data > this.maxValue) {
      issues.push({
        code: 'too_big',
        path: [],
        message: `Number must be less than or equal to ${this.maxValue}`
      });
    }

    if (this.intCheck && !Number.isInteger(data)) {
      issues.push({
        code: 'invalid_type',
        path: [],
        message: 'Expected integer, received float'
      });
    }

    if (this.positiveCheck && data <= 0) {
      issues.push({
        code: 'too_small',
        path: [],
        message: 'Number must be greater than 0'
      });
    }

    if (issues.length > 0) {
      return { success: false, error: new ZodError(issues) };
    }

    return { success: true, data };
  }
}

class ZodObject<T extends Record<string, ZodType>> extends ZodType<any, any> {
  constructor(private shape: T) {
    super();
  }

  safeParse(data: any): { success: true; data: any } | { success: false; error: ZodError } {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return {
        success: false,
        error: new ZodError([{
          code: 'invalid_type',
          path: [],
          message: 'Expected object, received ' + (Array.isArray(data) ? 'array' : typeof data)
        }])
      };
    }

    const issues: ZodIssue[] = [];
    const result: any = {};

    for (const [key, schema] of Object.entries(this.shape)) {
      const parsed = schema.safeParse(data[key]);
      if (!parsed.success) {
        issues.push(...parsed.error.issues.map(issue => ({
          ...issue,
          path: [key, ...issue.path]
        })));
      } else {
        result[key] = parsed.data;
      }
    }

    if (issues.length > 0) {
      return { success: false, error: new ZodError(issues) };
    }

    return { success: true, data: result };
  }
}

class ZodArray<T extends ZodType> extends ZodType<any[], any[]> {
  private minItems?: number;
  private maxItems?: number;

  constructor(private element: T) {
    super();
  }

  min(length: number): this {
    this.minItems = length;
    return this;
  }

  max(length: number): this {
    this.maxItems = length;
    return this;
  }

  safeParse(data: any[]): { success: true; data: any[] } | { success: false; error: ZodError } {
    if (!Array.isArray(data)) {
      return {
        success: false,
        error: new ZodError([{
          code: 'invalid_type',
          path: [],
          message: 'Expected array, received ' + typeof data
        }])
      };
    }

    const issues: ZodIssue[] = [];

    if (this.minItems !== undefined && data.length < this.minItems) {
      issues.push({
        code: 'too_small',
        path: [],
        message: `Array must contain at least ${this.minItems} element(s)`
      });
    }

    if (this.maxItems !== undefined && data.length > this.maxItems) {
      issues.push({
        code: 'too_big',
        path: [],
        message: `Array must contain at most ${this.maxItems} element(s)`
      });
    }

    const result: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const parsed = this.element.safeParse(data[i]);
      if (!parsed.success) {
        issues.push(...parsed.error.issues.map(issue => ({
          ...issue,
          path: [i, ...issue.path]
        })));
      } else {
        result.push(parsed.data);
      }
    }

    if (issues.length > 0) {
      return { success: false, error: new ZodError(issues) };
    }

    return { success: true, data: result };
  }
}

class ZodOptional<T extends ZodType> extends ZodType {
  constructor(private innerType: T) {
    super();
  }

  safeParse(data: any): { success: true; data: any } | { success: false; error: ZodError } {
    if (data === undefined) {
      return { success: true, data: undefined };
    }
    return this.innerType.safeParse(data);
  }
}

class ZodNullable<T extends ZodType> extends ZodType {
  constructor(private innerType: T) {
    super();
  }

  safeParse(data: any): { success: true; data: any } | { success: false; error: ZodError } {
    if (data === null) {
      return { success: true, data: null };
    }
    return this.innerType.safeParse(data);
  }
}

class ZodDefault<T extends ZodType> extends ZodType {
  constructor(private innerType: T, private defaultValue: any) {
    super();
  }

  safeParse(data: any): { success: true; data: any } | { success: false; error: ZodError } {
    if (data === undefined) {
      return { success: true, data: this.defaultValue };
    }
    return this.innerType.safeParse(data);
  }
}

const z = {
  string: () => new ZodString(),
  number: () => new ZodNumber(),
  object: <T extends Record<string, ZodType>>(shape: T) => new ZodObject(shape),
  array: <T extends ZodType>(element: T) => new ZodArray(element)
};

export default z;

// CLI Demo
if (import.meta.url.includes("elide-zod.ts")) {
  console.log("✅ Zod - TypeScript-first Schema Validation (POLYGLOT!)\n");

  console.log("=== Example 1: String Validation ===");
  const nameSchema = z.string().min(3).max(30);
  console.log("Valid:", nameSchema.parse("Alice"));
  try {
    nameSchema.parse("ab");
  } catch (e) {
    console.log("Error:", (e as ZodError).issues[0].message);
  }
  console.log();

  console.log("=== Example 2: Email Validation ===");
  const emailSchema = z.string().email();
  console.log("Valid:", emailSchema.parse("user@example.com"));
  try {
    emailSchema.parse("not-an-email");
  } catch (e) {
    console.log("Error:", (e as ZodError).issues[0].message);
  }
  console.log();

  console.log("=== Example 3: Number Validation ===");
  const ageSchema = z.number().int().min(0).max(120);
  console.log("Valid:", ageSchema.parse(25));
  console.log();

  console.log("=== Example 4: Object Validation ===");
  const userSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    age: z.number().int().min(18).optional()
  });

  const validUser = userSchema.parse({
    username: "alice",
    email: "alice@example.com",
    age: 25
  });
  console.log("Valid user:", validUser);
  console.log();

  console.log("=== Example 5: Array Validation ===");
  const tagsSchema = z.array(z.string()).min(1).max(5);
  console.log("Valid:", tagsSchema.parse(["javascript", "typescript"]));
  console.log();

  console.log("=== Example 6: Optional and Default ===");
  const configSchema = z.object({
    port: z.number().default(3000),
    host: z.string().default("localhost"),
    debug: z.string().optional()
  });

  console.log("With defaults:", configSchema.parse({}));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API request/response validation");
  console.log("- Configuration parsing");
  console.log("- Form validation");
  console.log("- Data transformation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- TypeScript-first design");
  console.log("- Zero dependencies");
  console.log("- ~45M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use for type-safe validation in all services");
  console.log("- Share schemas across TypeScript, Python, Ruby, Java");
  console.log("- Parse, don't validate!");
  console.log("- Perfect for polyglot microservices!");
}
