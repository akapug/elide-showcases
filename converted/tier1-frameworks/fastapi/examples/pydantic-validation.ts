/**
 * Pydantic Validation Example
 *
 * Demonstrates Pydantic model validation in FastAPI on Elide.
 */

import FastAPI from '../src/fastapi';
import { createModel, Field } from '../src/models';

const app = new FastAPI({
  title: 'Validation API',
  description: 'API with Pydantic model validation',
  version: '1.0.0',
});

// Define User model with validation
const UserModel = createModel('User', {
  title: 'User',
  description: 'User model with validation',
  fields: {
    id: Field({
      type: 'number',
      description: 'User ID',
    }),
    username: Field({
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 50,
      description: 'Username (3-50 characters)',
    }),
    email: Field({
      type: 'string',
      required: true,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      description: 'Valid email address',
    }),
    age: Field({
      type: 'number',
      min: 0,
      max: 150,
      description: 'User age (0-150)',
    }),
    role: Field({
      type: 'string',
      enum: ['admin', 'user', 'guest'],
      default: 'user',
      description: 'User role',
    }),
  },
});

// Define Product model
const ProductModel = createModel('Product', {
  title: 'Product',
  fields: {
    name: Field({
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200,
      description: 'Product name',
    }),
    price: Field({
      type: 'number',
      required: true,
      min: 0,
      description: 'Product price (must be positive)',
    }),
    tags: Field({
      type: 'array',
      description: 'Product tags',
    }),
    in_stock: Field({
      type: 'boolean',
      default: true,
      description: 'Whether product is in stock',
    }),
  },
});

// In-memory storage
const users: any[] = [];
const products: any[] = [];

// Create user with validation
app.post('/users', async (req) => {
  try {
    const user = new UserModel({
      id: users.length + 1,
      ...req.body,
    });

    const userData = user.dict();
    users.push(userData);

    return userData;
  } catch (err: any) {
    throw {
      status_code: 422,
      detail: err.errors || [{ msg: err.message }],
    };
  }
}, {
  summary: 'Create user with validation',
  description: 'Creates a new user with Pydantic model validation',
  tags: ['Users'],
  status_code: 201,
  response_model: UserModel,
});

// Get all users
app.get('/users', async () => {
  return { users };
}, {
  summary: 'List all users',
  tags: ['Users'],
});

// Create product with validation
app.post('/products', async (req) => {
  try {
    const product = new ProductModel({
      ...req.body,
    });

    const productData = product.dict();
    products.push(productData);

    return productData;
  } catch (err: any) {
    throw {
      status_code: 422,
      detail: err.errors || [{ msg: err.message }],
    };
  }
}, {
  summary: 'Create product with validation',
  tags: ['Products'],
  status_code: 201,
  response_model: ProductModel,
});

// Get all products
app.get('/products', async () => {
  return { products };
}, {
  summary: 'List all products',
  tags: ['Products'],
});

// Validation example endpoint
app.post('/validate', async (req) => {
  // Test different validation scenarios
  const tests = [];

  // Valid user
  try {
    const validUser = new UserModel({
      username: 'johndoe',
      email: 'john@example.com',
      age: 30,
    });
    tests.push({
      test: 'valid_user',
      passed: true,
      data: validUser.dict(),
    });
  } catch (err: any) {
    tests.push({
      test: 'valid_user',
      passed: false,
      error: err.message,
    });
  }

  // Invalid email
  try {
    const invalidEmail = new UserModel({
      username: 'johndoe',
      email: 'invalid-email',
    });
    tests.push({
      test: 'invalid_email',
      passed: true,
      data: invalidEmail.dict(),
    });
  } catch (err: any) {
    tests.push({
      test: 'invalid_email',
      passed: false,
      error: err.message,
    });
  }

  return { tests };
}, {
  summary: 'Validation examples',
  tags: ['Testing'],
});

// Start server
if (require.main === module) {
  const PORT = 8001;
  app.listen(PORT, () => {
    console.log(`Validation API running at http://localhost:${PORT}`);
    console.log(`Try creating users with validation:`);
    console.log(`  curl -X POST http://localhost:${PORT}/users \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"username":"john","email":"john@example.com","age":30}'`);
    console.log();
    console.log(`API docs at http://localhost:${PORT}/docs`);
  });
}

export default app;
