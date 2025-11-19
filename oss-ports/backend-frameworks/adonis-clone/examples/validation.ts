/**
 * Validation Example for Adonis Clone
 *
 * Demonstrates comprehensive validation with custom rules, error messages, and sanitization
 */

import { application } from '../src/adonis.ts';

const app = application();

// ==================== CONFIGURATION ====================

app.config.set('app.name', 'Adonis Validation Demo');
app.config.set('app.port', 3500);

// ==================== VALIDATION RULES ====================

class Validator {
  static rules = {
    required: (value: any) => {
      if (value === undefined || value === null || value === '') {
        return 'This field is required';
      }
      return null;
    },

    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please provide a valid email address';
      }
      return null;
    },

    min: (length: number) => (value: string | any[]) => {
      if (value.length < length) {
        return `Must be at least ${length} characters`;
      }
      return null;
    },

    max: (length: number) => (value: string | any[]) => {
      if (value.length > length) {
        return `Must be at most ${length} characters`;
      }
      return null;
    },

    minValue: (min: number) => (value: number) => {
      if (value < min) {
        return `Must be at least ${min}`;
      }
      return null;
    },

    maxValue: (max: number) => (value: number) => {
      if (value > max) {
        return `Must be at most ${max}`;
      }
      return null;
    },

    alpha: (value: string) => {
      if (!/^[a-zA-Z]+$/.test(value)) {
        return 'Must contain only letters';
      }
      return null;
    },

    alphaNumeric: (value: string) => {
      if (!/^[a-zA-Z0-9]+$/.test(value)) {
        return 'Must contain only letters and numbers';
      }
      return null;
    },

    url: (value: string) => {
      try {
        new URL(value);
        return null;
      } catch {
        return 'Please provide a valid URL';
      }
    },

    in: (...options: any[]) => (value: any) => {
      if (!options.includes(value)) {
        return `Must be one of: ${options.join(', ')}`;
      }
      return null;
    },

    confirmed: (field: string) => (value: any, data: any) => {
      if (value !== data[field]) {
        return `Must match ${field}`;
      }
      return null;
    },

    unique: (table: string, column: string) => async (value: any) => {
      // Simulate database check
      const existingValues = ['admin@example.com', 'admin', 'taken-username'];

      if (existingValues.includes(value)) {
        return `This ${column} is already taken`;
      }

      return null;
    },

    regex: (pattern: RegExp) => (value: string) => {
      if (!pattern.test(value)) {
        return 'Invalid format';
      }
      return null;
    },

    date: (value: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Please provide a valid date';
      }
      return null;
    },

    before: (targetDate: string) => (value: string) => {
      const date = new Date(value);
      const target = new Date(targetDate);

      if (date >= target) {
        return `Date must be before ${targetDate}`;
      }
      return null;
    },

    after: (targetDate: string) => (value: string) => {
      const date = new Date(value);
      const target = new Date(targetDate);

      if (date <= target) {
        return `Date must be after ${targetDate}`;
      }
      return null;
    }
  };

  static async validate(data: any, schema: any): Promise<{ passes: boolean; errors: any; data: any }> {
    const errors: any = {};
    const validated: any = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldRules = Array.isArray(rules) ? rules : [rules];

      for (const rule of fieldRules) {
        const error = typeof rule === 'function' ? await rule(value, data) : null;

        if (error) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(error);
          break; // Stop on first error
        }
      }

      if (!errors[field]) {
        validated[field] = value;
      }
    }

    return {
      passes: Object.keys(errors).length === 0,
      errors,
      data: validated
    };
  }
}

// ==================== VALIDATORS ====================

const registerValidator = {
  email: [
    Validator.rules.required,
    Validator.rules.email,
    Validator.rules.unique('users', 'email')
  ],
  username: [
    Validator.rules.required,
    Validator.rules.min(3),
    Validator.rules.max(20),
    Validator.rules.alphaNumeric,
    Validator.rules.unique('users', 'username')
  ],
  password: [
    Validator.rules.required,
    Validator.rules.min(8),
    Validator.rules.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  ],
  passwordConfirmation: [
    Validator.rules.required,
    Validator.rules.confirmed('password')
  ],
  fullName: [
    Validator.rules.required,
    Validator.rules.min(2),
    Validator.rules.max(100)
  ],
  age: [
    Validator.rules.required,
    Validator.rules.minValue(13),
    Validator.rules.maxValue(120)
  ]
};

const createPostValidator = {
  title: [
    Validator.rules.required,
    Validator.rules.min(3),
    Validator.rules.max(200)
  ],
  content: [
    Validator.rules.required,
    Validator.rules.min(10)
  ],
  category: [
    Validator.rules.required,
    Validator.rules.in('technology', 'business', 'lifestyle', 'entertainment')
  ],
  publishedAt: [
    Validator.rules.date,
    Validator.rules.after('2020-01-01')
  ],
  tags: [
    Validator.rules.required
  ]
};

const updateProfileValidator = {
  fullName: [
    Validator.rules.min(2),
    Validator.rules.max(100)
  ],
  bio: [
    Validator.rules.max(500)
  ],
  website: [
    Validator.rules.url
  ],
  location: [
    Validator.rules.max(100)
  ]
};

// ==================== CONTROLLERS ====================

class AuthController {
  async register(ctx: any) {
    const body = ctx.request.body;

    const validation = await Validator.validate(body, registerValidator);

    if (!validation.passes) {
      return ctx.response.status(422).json({
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    // Create user
    const user = {
      id: Date.now(),
      ...validation.data,
      password: '***HASHED***',
      createdAt: new Date().toISOString()
    };

    return ctx.response.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName
      }
    });
  }
}

class PostController {
  async create(ctx: any) {
    const body = ctx.request.body;

    const validation = await Validator.validate(body, createPostValidator);

    if (!validation.passes) {
      return ctx.response.status(422).json({
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    const post = {
      id: Date.now(),
      userId: ctx.auth?.user?.id || 1,
      ...validation.data,
      slug: validation.data.title.toLowerCase().replace(/\s+/g, '-'),
      viewCount: 0,
      createdAt: new Date().toISOString()
    };

    return ctx.response.status(201).json({
      message: 'Post created successfully',
      post
    });
  }
}

class ProfileController {
  async update(ctx: any) {
    const body = ctx.request.body;

    const validation = await Validator.validate(body, updateProfileValidator);

    if (!validation.passes) {
      return ctx.response.status(422).json({
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    const profile = {
      id: ctx.auth?.user?.id || 1,
      ...validation.data,
      updatedAt: new Date().toISOString()
    };

    return ctx.response.json({
      message: 'Profile updated successfully',
      profile
    });
  }
}

// ==================== CUSTOM VALIDATION EXAMPLE ====================

class ContactFormController {
  async submit(ctx: any) {
    const customValidator = {
      name: [
        Validator.rules.required,
        Validator.rules.min(2),
        Validator.rules.max(100)
      ],
      email: [
        Validator.rules.required,
        Validator.rules.email
      ],
      subject: [
        Validator.rules.required,
        Validator.rules.in('support', 'sales', 'feedback', 'other')
      ],
      message: [
        Validator.rules.required,
        Validator.rules.min(20),
        Validator.rules.max(1000)
      ],
      phone: [
        Validator.rules.regex(/^\+?[1-9]\d{1,14}$/)
      ]
    };

    const validation = await Validator.validate(ctx.request.body, customValidator);

    if (!validation.passes) {
      return ctx.response.status(422).json({
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    return ctx.response.json({
      message: 'Contact form submitted successfully',
      data: validation.data
    });
  }
}

// ==================== START APPLICATION ====================

console.log('\n✅ Adonis Validation Demo\n');
console.log('Available Validation Rules:');
console.log('  • required - Field must not be empty');
console.log('  • email - Must be valid email');
console.log('  • min/max - String/array length');
console.log('  • minValue/maxValue - Number range');
console.log('  • alpha - Letters only');
console.log('  • alphaNumeric - Letters and numbers');
console.log('  • url - Valid URL');
console.log('  • in - Value from allowed list');
console.log('  • confirmed - Match another field');
console.log('  • unique - Check database uniqueness');
console.log('  • regex - Pattern matching');
console.log('  • date - Valid date');
console.log('  • before/after - Date comparison\n');
console.log('Endpoints:');
console.log('  POST /auth/register - Register user');
console.log('  POST /posts - Create post');
console.log('  PUT  /profile - Update profile');
console.log('  POST /contact - Submit contact form\n');
console.log('Examples:');
console.log('  # Valid registration');
console.log('  curl -X POST http://localhost:3500/auth/register \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"user@example.com","username":"newuser","password":"SecurePass123","passwordConfirmation":"SecurePass123","fullName":"New User","age":25}\'');
console.log('');
console.log('  # Invalid registration (validation errors)');
console.log('  curl -X POST http://localhost:3500/auth/register \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"invalid","username":"ab","password":"weak"}\'');
console.log('');
console.log('  # Create post');
console.log('  curl -X POST http://localhost:3500/posts \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"title":"My Post","content":"This is my post content","category":"technology","publishedAt":"2024-01-20","tags":["elide","framework"]}\'');
console.log('');

await app.start();
