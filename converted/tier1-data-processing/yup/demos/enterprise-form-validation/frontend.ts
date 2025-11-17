/**
 * Frontend Form Validation (TypeScript)
 * Client-side validation using Yup schemas
 */

import { orderSchema, productSchema, userProfileSchema } from './schema';

// Simulate frontend form submission
class FormValidator {
  /**
   * Validate user profile form
   */
  static async validateUserProfile(formData: any) {
    console.log('=== Frontend: User Profile Form ===\n');

    try {
      const validated = await userProfileSchema.validate(formData, {
        abortEarly: false,
      });

      console.log('✓ Profile validation passed');
      console.log('  User:', validated.username);
      console.log('  Email:', validated.email);

      return { success: true, data: validated };
    } catch (err: any) {
      console.log('✗ Profile validation failed:');
      err.inner.forEach((error: any) => {
        console.log(`  - ${error.path}: ${error.message}`);
      });

      return {
        success: false,
        errors: err.inner.map((e: any) => ({
          field: e.path,
          message: e.message,
        })),
      };
    }
  }

  /**
   * Validate product form (e.g., seller dashboard)
   */
  static async validateProduct(formData: any) {
    console.log('\n=== Frontend: Product Form ===\n');

    try {
      const validated = await productSchema.validate(formData, {
        abortEarly: false,
      });

      console.log('✓ Product validation passed');
      console.log('  Product:', validated.name);
      console.log('  Price:', `$${validated.price}`);
      console.log('  Stock:', validated.stock);

      return { success: true, data: validated };
    } catch (err: any) {
      console.log('✗ Product validation failed:');
      err.inner.forEach((error: any) => {
        console.log(`  - ${error.path}: ${error.message}`);
      });

      return {
        success: false,
        errors: err.inner.map((e: any) => ({
          field: e.path,
          message: e.message,
        })),
      };
    }
  }

  /**
   * Validate checkout form
   */
  static async validateCheckout(formData: any) {
    console.log('\n=== Frontend: Checkout Form ===\n');

    try {
      const validated = await orderSchema.validate(formData, {
        abortEarly: false,
      });

      console.log('✓ Checkout validation passed');
      console.log('  Order ID:', validated.id);
      console.log('  Items:', validated.items.length);
      console.log('  Total:', `$${validated.payment.total}`);

      return { success: true, data: validated };
    } catch (err: any) {
      console.log('✗ Checkout validation failed:');
      err.inner.forEach((error: any) => {
        console.log(`  - ${error.path}: ${error.message}`);
      });

      return {
        success: false,
        errors: err.inner.map((e: any) => ({
          field: e.path,
          message: e.message,
        })),
      };
    }
  }

  /**
   * Real-time field validation (for instant feedback)
   */
  static async validateField(schema: any, fieldName: string, value: any) {
    try {
      await schema.validateAt(fieldName, { [fieldName]: value });
      return { valid: true, error: null };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }
}

// Demo: Validate forms
async function demoFrontendValidation() {
  // User profile validation
  const profileData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'johndoe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Full-stack developer passionate about web technologies',
  };

  await FormValidator.validateUserProfile(profileData);

  // Product validation
  const productData = {
    id: 'PROD-001',
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    price: 299.99,
    currency: 'USD',
    stock: 50,
    category: 'Electronics',
    tags: ['audio', 'wireless', 'electronics'],
    images: ['https://example.com/images/headphones-1.jpg'],
    active: true,
  };

  await FormValidator.validateProduct(productData);

  // Checkout validation
  const orderData = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [
      {
        productId: 'PROD-001',
        productName: 'Wireless Headphones',
        quantity: 1,
        price: 299.99,
        subtotal: 299.99,
      },
    ],
    billing: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
      },
    },
    shipping: {
      sameAsBilling: true,
      address: {},
      method: 'standard',
    },
    payment: {
      method: 'credit_card',
      total: 319.99,
      tax: 20.00,
      shipping: 0,
      discount: 0,
    },
    status: 'pending',
  };

  await FormValidator.validateCheckout(orderData);

  // Real-time field validation demo
  console.log('\n=== Real-time Field Validation ===\n');

  const emailValidation = await FormValidator.validateField(
    userProfileSchema,
    'email',
    'john@example.com'
  );
  console.log('Email validation:', emailValidation.valid ? '✓ Valid' : `✗ ${emailValidation.error}`);

  const invalidEmail = await FormValidator.validateField(
    userProfileSchema,
    'email',
    'invalid-email'
  );
  console.log('Invalid email:', invalidEmail.valid ? '✓ Valid' : `✗ ${invalidEmail.error}`);
}

// Run demo
demoFrontendValidation().catch(console.error);
