/**
 * Polyglot Form Validation
 * Cross-language validation using TypeScript, Python, and Ruby
 *
 * This example demonstrates Yup's killer feature on Elide:
 * Define validation schemas once in TypeScript, use them from Python and Ruby!
 */

import * as yup from '../src/yup';

// Define a shared user validation schema
const userSchema = yup.object({
  username: yup.string().min(3).max(20).required(),
  email: yup.string().email().required(),
  age: yup.number().positive().integer().min(18),
});

// TypeScript: Frontend form validation
async function validateInTypeScript() {
  console.log('=== TypeScript Validation (Frontend) ===\n');

  const formData = {
    username: 'johndoe',
    email: 'john@example.com',
    age: 25,
  };

  try {
    const result = await userSchema.validate(formData);
    console.log('✓ TypeScript: Valid user data');
    console.log('  Username:', result.username);
    console.log('  Email:', result.email);
    console.log('  Age:', result.age);
  } catch (err: any) {
    console.error('✗ TypeScript validation error:', err.message);
  }
}

// Python bridge example (pseudo-code showing how it would work)
const pythonValidationExample = `
# Python: Backend API validation
from yup import object, string, number

# Same validation schema in Python!
user_schema = object({
    'username': string().min(3).max(20).required(),
    'email': string().email().required(),
    'age': number().positive().integer().min(18)
})

# Validate request data
def validate_user_registration(data):
    try:
        result = user_schema.validate_sync(data)
        print(f"✓ Python: Valid user - {result['username']}")
        return result
    except Exception as err:
        print(f"✗ Python validation error: {err}")
        raise

# Example usage
data = {
    'username': 'johndoe',
    'email': 'john@example.com',
    'age': 25
}
validate_user_registration(data)
`;

// Ruby bridge example (pseudo-code showing how it would work)
const rubyValidationExample = `
# Ruby: Admin panel validation
require 'yup'

# Same validation schema in Ruby!
user_schema = Yup.object({
  username: Yup.string.min(3).max(20).required,
  email: Yup.string.email.required,
  age: Yup.number.positive.integer.min(18)
})

# Validate admin form submission
def validate_user(data)
  begin
    result = user_schema.validate_sync(data)
    puts "✓ Ruby: Valid user - #{result[:username]}"
    result
  rescue => err
    puts "✗ Ruby validation error: #{err.message}"
    raise
  end
end

# Example usage
data = {
  username: 'johndoe',
  email: 'john@example.com',
  age: 25
}
validate_user(data)
`;

// Multi-language form validation scenario
const multiLanguageFormSchema = yup.object({
  // User info (validated in all languages)
  user: yup.object({
    firstName: yup.string().min(2).required(),
    lastName: yup.string().min(2).required(),
    email: yup.string().email().required(),
    phone: yup.string().matches(/^\+?[\d\s-()]+$/).required(),
  }),

  // Billing info (validated in Python backend)
  billing: yup.object({
    cardNumber: yup.string().matches(/^\d{16}$/).required(),
    expiryDate: yup.string().matches(/^\d{2}\/\d{2}$/).required(),
    cvv: yup.string().matches(/^\d{3,4}$/).required(),
  }),

  // Shipping info (validated in Ruby admin)
  shipping: yup.object({
    address: yup.string().required(),
    city: yup.string().required(),
    state: yup.string().required(),
    zip: yup.string().required(),
    country: yup.string().required(),
  }),

  // Order items (validated across all services)
  items: yup.array(
    yup.object({
      productId: yup.string().required(),
      quantity: yup.number().positive().integer().required(),
      price: yup.number().positive().required(),
    })
  ).min(1),
});

async function demonstratePolyglotValidation() {
  console.log('\n=== Polyglot Form Validation ===\n');

  const orderData = {
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
    },
    billing: {
      cardNumber: '4532123456789012',
      expiryDate: '12/25',
      cvv: '123',
    },
    shipping: {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    items: [
      { productId: 'PROD-001', quantity: 2, price: 29.99 },
      { productId: 'PROD-002', quantity: 1, price: 49.99 },
    ],
  };

  try {
    const result = await multiLanguageFormSchema.validate(orderData);
    console.log('✓ Order validated across all services');
    console.log('  Customer:', result.user.firstName, result.user.lastName);
    console.log('  Items:', result.items.length);
    console.log('  Shipping to:', result.shipping.city, result.shipping.state);
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }
}

// API validation schema shared between services
const apiRequestSchema = yup.object({
  method: yup.string().oneOf(['GET', 'POST', 'PUT', 'DELETE']).required(),
  endpoint: yup.string().matches(/^\/[a-z0-9\/-]*$/).required(),
  headers: yup.object({
    'Content-Type': yup.string().required(),
    Authorization: yup.string().matches(/^Bearer .+$/).optional(),
  }),
  body: yup.mixed().optional(),
  query: yup.object().optional(),
});

async function validateApiRequest() {
  console.log('\n=== API Request Validation (Polyglot) ===\n');

  const request = {
    method: 'POST',
    endpoint: '/api/users',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    body: {
      username: 'johndoe',
      email: 'john@example.com',
    },
  };

  try {
    await apiRequestSchema.validate(request);
    console.log('✓ API request valid in TypeScript');
    console.log('  (Can also validate in Python API gateway)');
    console.log('  (Can also validate in Ruby microservice)');
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }
}

// Configuration validation shared across deployment tools
const configSchema = yup.object({
  app: yup.object({
    name: yup.string().required(),
    version: yup.string().matches(/^\d+\.\d+\.\d+$/).required(),
    environment: yup.string().oneOf(['development', 'staging', 'production']).required(),
  }),
  database: yup.object({
    host: yup.string().required(),
    port: yup.number().positive().integer().required(),
    name: yup.string().required(),
    ssl: yup.boolean().default(false),
  }),
  redis: yup.object({
    url: yup.string().url().required(),
    ttl: yup.number().positive().integer().default(3600),
  }),
  features: yup.object({
    analytics: yup.boolean().default(true),
    logging: yup.string().oneOf(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

async function validateConfig() {
  console.log('\n=== Configuration Validation (Polyglot) ===\n');

  const config = {
    app: {
      name: 'my-app',
      version: '1.2.3',
      environment: 'production',
    },
    database: {
      host: 'db.example.com',
      port: 5432,
      name: 'myapp_prod',
      ssl: true,
    },
    redis: {
      url: 'redis://redis.example.com:6379',
      ttl: 7200,
    },
    features: {
      analytics: true,
      logging: 'info',
    },
  };

  try {
    const result = await configSchema.validate(config);
    console.log('✓ Configuration valid');
    console.log('  App:', result.app.name, result.app.version);
    console.log('  Environment:', result.app.environment);
    console.log('  Database:', result.database.host);
  } catch (err: any) {
    console.error('✗ Configuration error:', err.message);
  }
}

async function main() {
  console.log('=====================================');
  console.log('  POLYGLOT VALIDATION WITH YUP');
  console.log('  One Schema, Three Languages!');
  console.log('=====================================\n');

  await validateInTypeScript();
  console.log('\n--- Python Example ---');
  console.log(pythonValidationExample);
  console.log('\n--- Ruby Example ---');
  console.log(rubyValidationExample);

  await demonstratePolyglotValidation();
  await validateApiRequest();
  await validateConfig();

  console.log('\n=====================================');
  console.log('  KEY BENEFITS:');
  console.log('  • Share validation logic across services');
  console.log('  • Consistent validation in all languages');
  console.log('  • Single source of truth for data schemas');
  console.log('  • No duplication, no synchronization issues');
  console.log('=====================================\n');
}

main().catch(console.error);
