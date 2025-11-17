/**
 * Form Validation Examples
 * Real-world form validation scenarios
 */

import * as yup from '../src/yup';

// User Registration Form
const registrationSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),

  email: yup.string().email('Invalid email address').required('Email is required'),

  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),

  age: yup
    .number()
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age')
    .integer('Age must be a whole number')
    .required('Age is required'),

  terms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required(),
});

async function validateRegistrationForm() {
  console.log('=== User Registration Form ===\n');

  const validForm = {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    age: 25,
    terms: true,
  };

  try {
    const result = await registrationSchema.validate(validForm);
    console.log('✓ Valid registration:', result);
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }

  // Test with errors
  const invalidForm = {
    username: 'ab',
    email: 'invalid-email',
    password: 'weak',
    confirmPassword: 'different',
    age: 15,
    terms: false,
  };

  try {
    await registrationSchema.validate(invalidForm, { abortEarly: false });
  } catch (err: any) {
    console.log('\n✗ Validation errors:');
    err.inner.forEach((error: any) => {
      console.log(`  - ${error.path}: ${error.message}`);
    });
  }
}

// Contact Form
const contactSchema = yup.object({
  name: yup.string().min(2).max(100).required('Name is required'),
  email: yup.string().email().required('Email is required'),
  phone: yup
    .string()
    .matches(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .optional(),
  subject: yup.string().min(5).max(200).required('Subject is required'),
  message: yup.string().min(20).max(5000).required('Message is required'),
  priority: yup.string().oneOf(['low', 'medium', 'high']).default('medium'),
});

async function validateContactForm() {
  console.log('\n\n=== Contact Form ===\n');

  const formData = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1-555-0123',
    subject: 'Question about services',
    message: 'I would like to know more about your services and pricing.',
  };

  try {
    const result = await contactSchema.validate(formData);
    console.log('✓ Valid contact form:', result);
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }
}

// Profile Update Form
const profileSchema = yup.object({
  bio: yup.string().max(500, 'Bio must be at most 500 characters').optional(),
  website: yup.string().url('Must be a valid URL').optional(),
  location: yup.string().max(100).optional(),
  birthdate: yup
    .date()
    .max(new Date(), 'Birthdate cannot be in the future')
    .optional(),
  social: yup.object({
    twitter: yup.string().matches(/^@?[a-zA-Z0-9_]+$/, 'Invalid Twitter handle').optional(),
    github: yup.string().matches(/^[a-zA-Z0-9-]+$/, 'Invalid GitHub username').optional(),
    linkedin: yup.string().url('Must be a valid LinkedIn URL').optional(),
  }),
  preferences: yup.object({
    newsletter: yup.boolean().default(false),
    notifications: yup.boolean().default(true),
    theme: yup.string().oneOf(['light', 'dark', 'auto']).default('auto'),
  }),
});

async function validateProfileUpdate() {
  console.log('\n\n=== Profile Update Form ===\n');

  const profileData = {
    bio: 'Full-stack developer passionate about web technologies',
    website: 'https://johndoe.dev',
    location: 'San Francisco, CA',
    birthdate: new Date('1990-01-01'),
    social: {
      twitter: '@johndoe',
      github: 'johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
    },
    preferences: {
      newsletter: true,
      notifications: true,
      theme: 'dark',
    },
  };

  try {
    const result = await profileSchema.validate(profileData);
    console.log('✓ Valid profile update:', result);
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }
}

// Payment Form
const paymentSchema = yup.object({
  cardNumber: yup
    .string()
    .matches(/^\d{16}$/, 'Card number must be 16 digits')
    .required('Card number is required'),
  cardHolder: yup
    .string()
    .matches(/^[a-zA-Z\s]+$/, 'Card holder name can only contain letters')
    .required('Card holder name is required'),
  expiryMonth: yup
    .number()
    .min(1)
    .max(12)
    .integer()
    .required('Expiry month is required'),
  expiryYear: yup
    .number()
    .min(new Date().getFullYear())
    .integer()
    .required('Expiry year is required'),
  cvv: yup
    .string()
    .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
    .required('CVV is required'),
  billingAddress: yup.object({
    street: yup.string().required(),
    city: yup.string().required(),
    state: yup.string().required(),
    zip: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').required(),
    country: yup.string().required(),
  }),
  amount: yup.number().positive().required('Amount is required'),
});

async function validatePaymentForm() {
  console.log('\n\n=== Payment Form ===\n');

  const paymentData = {
    cardNumber: '4532123456789012',
    cardHolder: 'John Doe',
    expiryMonth: 12,
    expiryYear: 2025,
    cvv: '123',
    billingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    amount: 99.99,
  };

  try {
    const result = await paymentSchema.validate(paymentData);
    console.log('✓ Valid payment form');
    console.log(`  Amount: $${result.amount}`);
    console.log(`  Card: ****${result.cardNumber.slice(-4)}`);
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }
}

// Search Form with Filters
const searchSchema = yup.object({
  query: yup.string().min(1).max(200).required('Search query is required'),
  filters: yup.object({
    category: yup.string().oneOf(['all', 'articles', 'videos', 'images']).default('all'),
    dateRange: yup.object({
      from: yup.date().optional(),
      to: yup.date().min(yup.ref('from'), 'End date must be after start date').optional(),
    }),
    sortBy: yup.string().oneOf(['relevance', 'date', 'popularity']).default('relevance'),
    tags: yup.array(yup.string()).max(10, 'Maximum 10 tags allowed').optional(),
  }),
  page: yup.number().positive().integer().default(1),
  limit: yup.number().positive().integer().min(10).max(100).default(20),
});

async function validateSearchForm() {
  console.log('\n\n=== Search Form ===\n');

  const searchData = {
    query: 'javascript validation',
    filters: {
      category: 'articles',
      dateRange: {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      },
      sortBy: 'relevance',
      tags: ['javascript', 'validation', 'yup'],
    },
    page: 1,
    limit: 20,
  };

  try {
    const result = await searchSchema.validate(searchData);
    console.log('✓ Valid search form:', result);
  } catch (err: any) {
    console.error('✗ Validation error:', err.message);
  }
}

// Run all examples
async function main() {
  console.log('=== Form Validation Examples ===\n');

  await validateRegistrationForm();
  await validateContactForm();
  await validateProfileUpdate();
  await validatePaymentForm();
  await validateSearchForm();

  console.log('\n\n=== Examples Complete ===');
}

main().catch(console.error);
