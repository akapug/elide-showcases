/**
 * Validation Example for Oak Clone
 *
 * Demonstrates request validation, sanitization, and custom validators
 */

import { Application, Router, Context } from '../src/oak.ts';

const app = new Application();
const router = new Router();

// ==================== VALIDATION LIBRARY ====================

class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

class Validator {
  private errors: string[] = [];

  static schema(rules: any) {
    return async (ctx: Context, next: () => Promise<void>) => {
      const body = await ctx.request.body();
      const validator = new Validator();
      const validated = validator.validate(body.value, rules);

      if (validator.hasErrors()) {
        ctx.response.status = 422;
        ctx.response.body = {
          error: 'Validation failed',
          errors: validator.getErrors()
        };
        return;
      }

      ctx.state.validated = validated;
      await next();
    };
  }

  validate(data: any, rules: any): any {
    const validated: any = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];
      const ruleList = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

      for (const rule of ruleList) {
        const error = this.applyRule(field, value, rule, data);

        if (error) {
          this.errors.push(error);
          break;
        }
      }

      if (!this.hasError(field)) {
        validated[field] = value;
      }
    }

    return validated;
  }

  private applyRule(field: string, value: any, rule: any, data: any): string | null {
    if (typeof rule === 'function') {
      return rule(value, data);
    }

    if (rule === 'required') {
      if (value === undefined || value === null || value === '') {
        return `${field} is required`;
      }
    }

    if (rule === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `${field} must be a valid email`;
      }
    }

    if (rule === 'url') {
      try {
        new URL(value);
      } catch {
        return `${field} must be a valid URL`;
      }
    }

    if (typeof rule === 'object') {
      if (rule.min !== undefined) {
        if (typeof value === 'string' && value.length < rule.min) {
          return `${field} must be at least ${rule.min} characters`;
        }
        if (typeof value === 'number' && value < rule.min) {
          return `${field} must be at least ${rule.min}`;
        }
      }

      if (rule.max !== undefined) {
        if (typeof value === 'string' && value.length > rule.max) {
          return `${field} must be at most ${rule.max} characters`;
        }
        if (typeof value === 'number' && value > rule.max) {
          return `${field} must be at most ${rule.max}`;
        }
      }

      if (rule.pattern !== undefined) {
        if (!rule.pattern.test(value)) {
          return `${field} has invalid format`;
        }
      }

      if (rule.enum !== undefined) {
        if (!rule.enum.includes(value)) {
          return `${field} must be one of: ${rule.enum.join(', ')}`;
        }
      }

      if (rule.type !== undefined) {
        if (typeof value !== rule.type) {
          return `${field} must be ${rule.type}`;
        }
      }
    }

    return null;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  hasError(field: string): boolean {
    return this.errors.some(err => err.startsWith(field));
  }

  getErrors(): string[] {
    return this.errors;
  }
}

// ==================== VALIDATION RULES ====================

const registerRules = {
  email: ['required', 'email'],
  username: ['required', { min: 3, max: 20, pattern: /^[a-zA-Z0-9_]+$/ }],
  password: ['required', { min: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ }],
  fullName: [{ min: 2, max: 100 }],
  age: [{ type: 'number', min: 13, max: 120 }]
};

const createPostRules = {
  title: ['required', { min: 3, max: 200 }],
  content: ['required', { min: 10 }],
  category: [{ enum: ['technology', 'business', 'lifestyle', 'entertainment'] }],
  tags: [(value: any) => {
    if (!Array.isArray(value)) {
      return 'tags must be an array';
    }
    if (value.length === 0) {
      return 'At least one tag is required';
    }
    return null;
  }]
};

const updateProfileRules = {
  fullName: [{ min: 2, max: 100 }],
  bio: [{ max: 500 }],
  website: ['url'],
  location: [{ max: 100 }]
};

const contactFormRules = {
  name: ['required', { min: 2, max: 100 }],
  email: ['required', 'email'],
  subject: ['required', { enum: ['support', 'sales', 'feedback', 'other'] }],
  message: ['required', { min: 20, max: 1000 }],
  phone: [{ pattern: /^\+?[1-9]\d{1,14}$/ }]
};

// ==================== SANITIZATION ====================

function sanitize(data: any): any {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }

  return data;
}

function sanitizeMiddleware() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const body = await ctx.request.body();

    if (body.value) {
      ctx.state.sanitized = sanitize(body.value);
    }

    await next();
  };
}

// ==================== ROUTES ====================

router.get('/', (ctx) => {
  ctx.response.body = {
    message: 'Oak Validation Demo',
    endpoints: [
      'POST /register - Register user',
      'POST /posts - Create post',
      'PUT  /profile - Update profile',
      'POST /contact - Contact form',
      'POST /sanitize - Test sanitization'
    ]
  };
});

router.post('/register', Validator.schema(registerRules), (ctx) => {
  const data = ctx.state.validated;

  const user = {
    id: Date.now(),
    ...data,
    password: '***HASHED***',
    createdAt: new Date().toISOString()
  };

  ctx.response.status = 201;
  ctx.response.body = {
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName
    }
  };
});

router.post('/posts', Validator.schema(createPostRules), (ctx) => {
  const data = ctx.state.validated;

  const post = {
    id: Date.now(),
    ...data,
    slug: data.title.toLowerCase().replace(/\s+/g, '-'),
    status: 'draft',
    viewCount: 0,
    createdAt: new Date().toISOString()
  };

  ctx.response.status = 201;
  ctx.response.body = {
    message: 'Post created successfully',
    post
  };
});

router.put('/profile', Validator.schema(updateProfileRules), (ctx) => {
  const data = ctx.state.validated;

  const profile = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  ctx.response.body = {
    message: 'Profile updated successfully',
    profile
  };
});

router.post('/contact', Validator.schema(contactFormRules), (ctx) => {
  const data = ctx.state.validated;

  ctx.response.body = {
    message: 'Contact form submitted successfully',
    data
  };
});

router.post('/sanitize', sanitizeMiddleware(), async (ctx) => {
  const body = await ctx.request.body();

  ctx.response.body = {
    message: 'Input sanitized',
    original: body.value,
    sanitized: ctx.state.sanitized
  };
});

// Custom validation endpoint
router.post('/custom-validation', async (ctx) => {
  const body = await ctx.request.body();
  const validator = new Validator();

  const customRules = {
    username: [
      'required',
      { min: 3 },
      (value: string) => {
        if (value === 'admin' || value === 'root') {
          return 'username is reserved';
        }
        return null;
      }
    ],
    confirmPassword: [
      (value: any, data: any) => {
        if (value !== data.password) {
          return 'Passwords do not match';
        }
        return null;
      }
    ]
  };

  const validated = validator.validate(body.value, customRules);

  if (validator.hasErrors()) {
    ctx.response.status = 422;
    ctx.response.body = {
      error: 'Validation failed',
      errors: validator.getErrors()
    };
    return;
  }

  ctx.response.body = {
    message: 'Custom validation passed',
    data: validated
  };
});

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as Error;

    ctx.response.status = 500;
    ctx.response.body = {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// Apply routes
app.use(router.routes());
app.use(router.allowedMethods());

// ==================== START SERVER ====================

await app.listen({ port: 3800 });

console.log('\n✅ Oak Validation Demo listening on port 3800\n');
console.log('Validation Features:');
console.log('  • Required fields');
console.log('  • Email validation');
console.log('  • URL validation');
console.log('  • Min/max length and value');
console.log('  • Pattern matching (regex)');
console.log('  • Enum validation');
console.log('  • Type checking');
console.log('  • Custom validators');
console.log('  • Input sanitization\n');
console.log('Endpoints:');
console.log('  POST /register - Register with validation');
console.log('  POST /posts - Create post with validation');
console.log('  PUT  /profile - Update profile');
console.log('  POST /contact - Contact form');
console.log('  POST /sanitize - Test sanitization');
console.log('  POST /custom-validation - Custom validators\n');
console.log('Examples:\n');
console.log('  # Valid registration');
console.log('  curl -X POST http://localhost:3800/register \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"user@example.com","username":"newuser","password":"SecurePass123","age":25}\'');
console.log('');
console.log('  # Invalid registration (will show validation errors)');
console.log('  curl -X POST http://localhost:3800/register \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"invalid","username":"ab","password":"weak"}\'');
console.log('');
console.log('  # Test sanitization');
console.log('  curl -X POST http://localhost:3800/sanitize \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"content":"<script>alert(\\'xss\\')</script>Hello"}\'');
console.log('');
