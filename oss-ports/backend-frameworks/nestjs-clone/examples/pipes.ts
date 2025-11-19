/**
 * Pipes Example for NestJS Clone
 *
 * Demonstrates validation, transformation, and sanitization pipes
 */

import {
  Controller,
  Get,
  Post,
  UsePipes,
  Injectable,
  createNestApplication
} from '../src/nestjs.ts';

// ==================== PIPES ====================

@Injectable()
class ValidationPipe {
  async transform(value: any, metadata: any): Promise<any> {
    if (!metadata.schema) {
      return value;
    }

    const errors = this.validate(value, metadata.schema);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return value;
  }

  private validate(value: any, schema: any): string[] {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const fieldValue = value[field];
      const fieldRules = rules as any;

      if (fieldRules.required && (fieldValue === undefined || fieldValue === null)) {
        errors.push(`${field} is required`);
        continue;
      }

      if (fieldValue !== undefined && fieldValue !== null) {
        if (fieldRules.type && typeof fieldValue !== fieldRules.type) {
          errors.push(`${field} must be ${fieldRules.type}`);
        }

        if (fieldRules.min && fieldValue < fieldRules.min) {
          errors.push(`${field} must be at least ${fieldRules.min}`);
        }

        if (fieldRules.max && fieldValue > fieldRules.max) {
          errors.push(`${field} must be at most ${fieldRules.max}`);
        }

        if (fieldRules.minLength && fieldValue.length < fieldRules.minLength) {
          errors.push(`${field} must be at least ${fieldRules.minLength} characters`);
        }

        if (fieldRules.maxLength && fieldValue.length > fieldRules.maxLength) {
          errors.push(`${field} must be at most ${fieldRules.maxLength} characters`);
        }

        if (fieldRules.pattern && !fieldRules.pattern.test(fieldValue)) {
          errors.push(`${field} format is invalid`);
        }

        if (fieldRules.enum && !fieldRules.enum.includes(fieldValue)) {
          errors.push(`${field} must be one of: ${fieldRules.enum.join(', ')}`);
        }
      }
    }

    return errors;
  }
}

@Injectable()
class ParseIntPipe {
  async transform(value: any, metadata: any): Promise<number> {
    const parsed = parseInt(value);

    if (isNaN(parsed)) {
      throw new Error(`${metadata.field || 'Value'} must be a valid integer`);
    }

    return parsed;
  }
}

@Injectable()
class ParseBoolPipe {
  async transform(value: any, metadata: any): Promise<boolean> {
    if (value === 'true' || value === '1' || value === true) {
      return true;
    }

    if (value === 'false' || value === '0' || value === false) {
      return false;
    }

    throw new Error(`${metadata.field || 'Value'} must be a valid boolean`);
  }
}

@Injectable()
class TrimPipe {
  async transform(value: any, metadata: any): Promise<any> {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object' && value !== null) {
      const trimmed: any = {};

      for (const [key, val] of Object.entries(value)) {
        trimmed[key] = typeof val === 'string' ? (val as string).trim() : val;
      }

      return trimmed;
    }

    return value;
  }
}

@Injectable()
class SanitizePipe {
  async transform(value: any, metadata: any): Promise<any> {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};

      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = typeof val === 'string' ? this.sanitizeString(val) : val;
      }

      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

@Injectable()
class DefaultValuePipe {
  constructor(private defaultValue: any) {}

  async transform(value: any, metadata: any): Promise<any> {
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }

    return value;
  }
}

@Injectable()
class TransformPipe {
  async transform(value: any, metadata: any): Promise<any> {
    if (metadata.transforms) {
      for (const transformer of metadata.transforms) {
        value = transformer(value);
      }
    }

    return value;
  }
}

@Injectable()
class FileSizePipe {
  private maxSize = 5 * 1024 * 1024; // 5MB

  async transform(value: any, metadata: any): Promise<any> {
    if (!value || !value.size) {
      throw new Error('Invalid file');
    }

    if (value.size > this.maxSize) {
      throw new Error(`File size exceeds maximum of ${this.maxSize / 1024 / 1024}MB`);
    }

    return value;
  }
}

@Injectable()
class EmailPipe {
  async transform(value: any, metadata: any): Promise<string> {
    if (typeof value !== 'string') {
      throw new Error('Email must be a string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    return value.toLowerCase().trim();
  }
}

// ==================== DTOs & SCHEMAS ====================

const createUserSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  age: {
    type: 'number',
    min: 13,
    max: 120
  },
  role: {
    type: 'string',
    enum: ['user', 'admin', 'moderator']
  }
};

const updatePostSchema = {
  title: {
    type: 'string',
    minLength: 3,
    maxLength: 200
  },
  content: {
    type: 'string',
    minLength: 10
  },
  status: {
    type: 'string',
    enum: ['draft', 'published', 'archived']
  }
};

// ==================== SERVICES ====================

@Injectable()
class UserService {
  create(userData: any) {
    return {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };
  }

  findById(id: number) {
    return {
      id,
      email: `user${id}@example.com`,
      username: `user${id}`,
      age: 25,
      role: 'user'
    };
  }
}

@Injectable()
class PostService {
  update(id: number, postData: any) {
    return {
      id,
      ...postData,
      updatedAt: new Date().toISOString()
    };
  }
}

// ==================== CONTROLLERS ====================

@Controller('/api')
class ApiController {
  constructor(
    private userService: UserService,
    private postService: PostService
  ) {}

  @Post('/users')
  @UsePipes(new ValidationPipe(), new TrimPipe(), new SanitizePipe())
  createUser(context: any) {
    const body = context.request.body;
    const metadata = { schema: createUserSchema };

    // Pipes would be applied automatically
    const validatedData = body; // Assume pipes already processed

    return this.userService.create(validatedData);
  }

  @Get('/users/:id')
  @UsePipes(ParseIntPipe)
  getUser(context: any) {
    const id = context.request.params.id; // Would be parsed to int by pipe
    return this.userService.findById(parseInt(id));
  }

  @Post('/posts/:id')
  @UsePipes(new ValidationPipe(), new SanitizePipe())
  updatePost(context: any) {
    const id = parseInt(context.request.params.id);
    const body = context.request.body;
    const metadata = { schema: updatePostSchema };

    return this.postService.update(id, body);
  }

  @Get('/search')
  getSearch(context: any) {
    const query = context.request.query;

    return {
      query,
      results: [
        { id: 1, title: 'Result 1' },
        { id: 2, title: 'Result 2' }
      ]
    };
  }

  @Post('/sanitize')
  @UsePipes(SanitizePipe)
  testSanitize(context: any) {
    const body = context.request.body;

    return {
      message: 'Input sanitized',
      original: context.request.rawBody,
      sanitized: body
    };
  }

  @Post('/transform')
  @UsePipes(TrimPipe, TransformPipe)
  testTransform(context: any) {
    const body = context.request.body;

    return {
      message: 'Input transformed',
      result: body
    };
  }

  @Post('/email')
  @UsePipes(EmailPipe)
  validateEmail(context: any) {
    const email = context.request.body.email;

    return {
      message: 'Email validated',
      email
    };
  }

  @Get('/bool/:value')
  @UsePipes(ParseBoolPipe)
  parseBoolean(context: any) {
    const value = context.request.params.value;

    return {
      message: 'Boolean parsed',
      value,
      type: typeof value
    };
  }
}

// ==================== MODULE ====================

const app = createNestApplication({
  controllers: [ApiController],
  providers: [
    UserService,
    PostService,
    ValidationPipe,
    ParseIntPipe,
    ParseBoolPipe,
    TrimPipe,
    SanitizePipe,
    TransformPipe,
    FileSizePipe,
    EmailPipe
  ]
});

// ==================== START APPLICATION ====================

console.log('\n🔧 NestJS Pipes Demo\n');
console.log('Pipes Available:');
console.log('  • ValidationPipe - Validates against schemas');
console.log('  • ParseIntPipe - Parses strings to integers');
console.log('  • ParseBoolPipe - Parses strings to booleans');
console.log('  • TrimPipe - Trims whitespace from strings');
console.log('  • SanitizePipe - Removes HTML/XSS attempts');
console.log('  • TransformPipe - Custom transformations');
console.log('  • FileSizePipe - Validates file sizes');
console.log('  • EmailPipe - Validates and normalizes emails\n');
console.log('Endpoints:');
console.log('  POST /api/users - Create user (validation + trim + sanitize)');
console.log('  GET  /api/users/:id - Get user (parse int)');
console.log('  POST /api/posts/:id - Update post (validation + sanitize)');
console.log('  GET  /api/search - Search (query params)');
console.log('  POST /api/sanitize - Test sanitization');
console.log('  POST /api/transform - Test transformation');
console.log('  POST /api/email - Validate email');
console.log('  GET  /api/bool/:value - Parse boolean\n');
console.log('Usage:');
console.log('  # Create user with validation');
console.log('  curl -X POST http://localhost:3300/api/users \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"user@example.com","username":"alice","age":25,"role":"user"}\'');
console.log('');
console.log('  # Test sanitization');
console.log('  curl -X POST http://localhost:3300/api/sanitize \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"content":"<script>alert(\\'xss\\')</script>Hello"}\'');
console.log('');
console.log('  # Parse boolean');
console.log('  curl http://localhost:3300/api/bool/true\n');

app.listen(3300);
