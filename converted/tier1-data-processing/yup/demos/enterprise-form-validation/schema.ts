/**
 * Enterprise Form Validation Demo
 * Shared validation schemas across TypeScript, Python, and Ruby services
 */

import * as yup from '../../src/yup';

// User Profile Schema
export const userProfileSchema = yup.object({
  id: yup.string().uuid().required(),
  username: yup.string().min(3).max(20).required(),
  email: yup.string().email().required(),
  firstName: yup.string().min(2).max(50).required(),
  lastName: yup.string().min(2).max(50).required(),
  avatar: yup.string().url().optional(),
  bio: yup.string().max(500).optional(),
  birthdate: yup.date().max(new Date()).optional(),
});

// Product Schema
export const productSchema = yup.object({
  id: yup.string().required(),
  name: yup.string().min(3).max(200).required(),
  description: yup.string().min(10).max(2000).required(),
  price: yup.number().positive().required(),
  currency: yup.string().oneOf(['USD', 'EUR', 'GBP']).default('USD'),
  stock: yup.number().min(0).integer().required(),
  category: yup.string().required(),
  tags: yup.array(yup.string()).max(10).optional(),
  images: yup.array(yup.string().url()).min(1).max(10).required(),
  active: yup.boolean().default(true),
});

// Order Schema
export const orderSchema = yup.object({
  id: yup.string().uuid().required(),
  userId: yup.string().uuid().required(),
  items: yup.array(
    yup.object({
      productId: yup.string().required(),
      productName: yup.string().required(),
      quantity: yup.number().positive().integer().required(),
      price: yup.number().positive().required(),
      subtotal: yup.number().positive().required(),
    })
  ).min(1).required(),

  billing: yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    email: yup.string().email().required(),
    phone: yup.string().matches(/^\+?[\d\s-()]+$/).required(),
    address: yup.object({
      street: yup.string().required(),
      city: yup.string().required(),
      state: yup.string().required(),
      zip: yup.string().required(),
      country: yup.string().required(),
    }),
  }),

  shipping: yup.object({
    sameAsBilling: yup.boolean().default(false),
    address: yup.object({
      street: yup.string().when('sameAsBilling', {
        is: false,
        then: (schema) => schema.required(),
      }),
      city: yup.string().when('sameAsBilling', {
        is: false,
        then: (schema) => schema.required(),
      }),
      state: yup.string().when('sameAsBilling', {
        is: false,
        then: (schema) => schema.required(),
      }),
      zip: yup.string().when('sameAsBilling', {
        is: false,
        then: (schema) => schema.required(),
      }),
      country: yup.string().when('sameAsBilling', {
        is: false,
        then: (schema) => schema.required(),
      }),
    }),
    method: yup.string().oneOf(['standard', 'express', 'overnight']).default('standard'),
  }),

  payment: yup.object({
    method: yup.string().oneOf(['credit_card', 'paypal', 'bank_transfer']).required(),
    total: yup.number().positive().required(),
    tax: yup.number().min(0).required(),
    shipping: yup.number().min(0).required(),
    discount: yup.number().min(0).default(0),
  }),

  status: yup.string()
    .oneOf(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .default('pending'),

  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date()),
});

// Invoice Schema
export const invoiceSchema = yup.object({
  id: yup.string().uuid().required(),
  orderId: yup.string().uuid().required(),
  invoiceNumber: yup.string().matches(/^INV-\d{6}$/).required(),
  issueDate: yup.date().required(),
  dueDate: yup.date().min(yup.ref('issueDate')).required(),

  customer: yup.object({
    name: yup.string().required(),
    email: yup.string().email().required(),
    address: yup.string().required(),
    taxId: yup.string().optional(),
  }),

  items: yup.array(
    yup.object({
      description: yup.string().required(),
      quantity: yup.number().positive().integer().required(),
      unitPrice: yup.number().positive().required(),
      amount: yup.number().positive().required(),
    })
  ).min(1).required(),

  subtotal: yup.number().positive().required(),
  tax: yup.number().min(0).required(),
  total: yup.number().positive().required(),

  status: yup.string().oneOf(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),

  notes: yup.string().max(1000).optional(),
});

// API Key Schema
export const apiKeySchema = yup.object({
  name: yup.string().min(3).max(50).required(),
  key: yup.string().matches(/^sk_[a-zA-Z0-9]{32}$/).required(),
  permissions: yup.array(
    yup.string().oneOf(['read', 'write', 'delete', 'admin'])
  ).min(1).required(),
  rateLimit: yup.number().positive().integer().max(10000).default(1000),
  expiresAt: yup.date().min(new Date()).optional(),
  active: yup.boolean().default(true),
});

// Webhook Schema
export const webhookSchema = yup.object({
  url: yup.string().url().required(),
  events: yup.array(
    yup.string().oneOf([
      'order.created',
      'order.updated',
      'order.cancelled',
      'payment.succeeded',
      'payment.failed',
      'invoice.created',
      'invoice.paid',
    ])
  ).min(1).required(),
  secret: yup.string().min(32).required(),
  active: yup.boolean().default(true),
  retryAttempts: yup.number().min(0).max(10).default(3),
});

// Analytics Event Schema
export const analyticsEventSchema = yup.object({
  eventType: yup.string().oneOf([
    'page_view',
    'click',
    'form_submit',
    'purchase',
    'signup',
    'login',
  ]).required(),
  userId: yup.string().uuid().optional(),
  sessionId: yup.string().uuid().required(),
  timestamp: yup.date().default(() => new Date()),
  properties: yup.object().optional(),
  metadata: yup.object({
    userAgent: yup.string().optional(),
    ipAddress: yup.string().matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/).optional(),
    referrer: yup.string().url().optional(),
  }),
});

// Export all schemas
export const schemas = {
  userProfile: userProfileSchema,
  product: productSchema,
  order: orderSchema,
  invoice: invoiceSchema,
  apiKey: apiKeySchema,
  webhook: webhookSchema,
  analyticsEvent: analyticsEventSchema,
};
