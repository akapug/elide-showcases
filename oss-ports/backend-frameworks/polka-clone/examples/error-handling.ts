/**
 * Error Handling Example for Polka Clone
 *
 * Demonstrates error handling, custom error types, and error middleware
 */

import polka from '../src/polka.ts';

const app = polka();

// ==================== CUSTOM ERROR TYPES ====================

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(message: string, public errors: any[] = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

// ==================== ERROR MIDDLEWARE ====================

function errorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    console.error('[Error]', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';

    res.statusCode = statusCode;
    res.json({
      error: {
        code,
        message: err.message,
        ...(err.errors && { errors: err.errors }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      }
    });
  };
}

// ==================== VALIDATION HELPERS ====================

function validateRequired(value: any, field: string) {
  if (!value) {
    throw new ValidationError(`${field} is required`);
  }
}

function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Polka Error Handling Demo',
    endpoints: [
      'GET  /error - Trigger generic error',
      'GET  /not-found - Trigger 404 error',
      'GET  /unauthorized - Trigger 401 error',
      'GET  /forbidden - Trigger 403 error',
      'POST /validate - Trigger validation error',
      'GET  /async-error - Async error',
      'GET  /safe - Safe endpoint'
    ]
  });
});

// Generic error
app.get('/error', (req, res) => {
  throw new AppError('Something went wrong!', 500);
});

// Not found error
app.get('/not-found', (req, res) => {
  throw new NotFoundError('User not found');
});

// Unauthorized error
app.get('/unauthorized', (req, res) => {
  throw new UnauthorizedError('Invalid credentials');
});

// Forbidden error
app.get('/forbidden', (req, res) => {
  throw new ForbiddenError('Insufficient permissions');
});

// Validation error
app.post('/validate', (req, res) => {
  const { email, username, password } = req.body || {};

  const errors: string[] = [];

  if (!email) errors.push('email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('invalid email format');
  }

  if (!username) errors.push('username is required');
  else if (username.length < 3) {
    errors.push('username must be at least 3 characters');
  }

  if (!password) errors.push('password is required');
  else if (password.length < 8) {
    errors.push('password must be at least 8 characters');
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  res.json({
    message: 'Validation passed',
    data: { email, username }
  });
});

// Async error
app.get('/async-error', async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new AppError('Async operation failed', 500);
});

// Safe endpoint
app.get('/safe', (req, res) => {
  res.json({
    message: 'This endpoint works perfectly!',
    timestamp: new Date().toISOString()
  });
});

// Try-catch example
app.get('/try-catch', (req, res) => {
  try {
    const result = JSON.parse('invalid json');
    res.json({ result });
  } catch (error: any) {
    throw new AppError('Failed to parse JSON', 400, 'PARSE_ERROR');
  }
});

// Database simulation with error
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  // Simulate database lookup
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  const user = users.find(u => u.id === parseInt(id));

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }

  res.json({ user });
});

// Apply error handler
app.use(errorHandler());

// ==================== START SERVER ====================

app.listen(3700, () => {
  console.log('\n⚠️  Polka Error Handling Demo listening on port 3700\n');
  console.log('Error Types:');
  console.log('  • AppError - Generic application error');
  console.log('  • ValidationError - Validation failures');
  console.log('  • NotFoundError - Resource not found (404)');
  console.log('  • UnauthorizedError - Authentication required (401)');
  console.log('  • ForbiddenError - Insufficient permissions (403)\n');
  console.log('Examples:');
  console.log('  curl http://localhost:3700/error');
  console.log('  curl http://localhost:3700/not-found');
  console.log('  curl -X POST http://localhost:3700/validate -d "{\\"email\\":\\"invalid\\"}"');
  console.log('  curl http://localhost:3700/users/999\n');
});
