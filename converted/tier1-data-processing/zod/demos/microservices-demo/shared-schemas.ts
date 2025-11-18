/**
 * SHARED SCHEMAS - THE KILLER FEATURE!
 *
 * Define your validation schemas ONCE in TypeScript.
 * Use them in TypeScript, Python, Ruby, AND Java services.
 *
 * This is IMPOSSIBLE with Node.js, Deno, or Bun!
 * Only Elide's polyglot runtime makes this possible.
 */

import { z } from "../../src/zod.ts";
import { exportForPython } from "../../bridges/python-bridge.ts";
import { exportForRuby } from "../../bridges/ruby-bridge.ts";
import { exportForJava } from "../../bridges/java-bridge.ts";

// ============================================================================
// SHARED SCHEMAS - ONE SOURCE OF TRUTH FOR ALL SERVICES
// ============================================================================

/**
 * User Schema
 * Used by: API Gateway (TypeScript), User Service (Python)
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Product Schema
 * Used by: Inventory Service (Java), API Gateway (TypeScript)
 */
export const ProductSchema = z.object({
  sku: z.string().min(3).max(20),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Order Schema
 * Used by: Payment Service (Ruby), API Gateway (TypeScript)
 */
export const OrderSchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productSku: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative(),
  total: z.number().positive(),
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
  paymentMethod: z.enum(["credit_card", "debit_card", "paypal", "crypto"]),
  createdAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Payment Request Schema
 * Used by: Payment Service (Ruby), API Gateway (TypeScript)
 */
export const PaymentRequestSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3), // ISO 4217
  method: z.enum(["credit_card", "debit_card", "paypal", "crypto"]),
  cardDetails: z.object({
    number: z.string().regex(/^\d{16}$/),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
  }).optional(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

/**
 * Payment Response Schema
 * Used by: Payment Service (Ruby), API Gateway (TypeScript)
 */
export const PaymentResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    transactionId: z.string(),
    amount: z.number(),
    timestamp: z.date(),
  }),
  z.object({
    status: z.literal("failed"),
    errorCode: z.string(),
    errorMessage: z.string(),
    timestamp: z.date(),
  }),
]);

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

/**
 * Inventory Update Schema
 * Used by: Inventory Service (Java), API Gateway (TypeScript)
 */
export const InventoryUpdateSchema = z.object({
  sku: z.string(),
  quantityChange: z.number().int(),
  reason: z.enum(["sale", "restock", "return", "adjustment"]),
  timestamp: z.date(),
});

export type InventoryUpdate = z.infer<typeof InventoryUpdateSchema>;

/**
 * API Response Schema
 * Used by: ALL services for consistent response format
 */
export const ApiResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.unknown(),
    timestamp: z.date(),
  }),
  z.object({
    status: z.literal("error"),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
    timestamp: z.date(),
  }),
]);

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// ============================================================================
// EXPORT SCHEMAS FOR OTHER LANGUAGES
// ============================================================================

console.log("Generating schemas for all languages...\n");

// Generate Python code for User Service
console.log("📝 Generating Python code for User Service...");
const pythonUserCode = exportForPython("User", UserSchema);
console.log("✓ Python User schema generated");

// Generate Ruby code for Payment Service
console.log("📝 Generating Ruby code for Payment Service...");
const rubyOrderCode = exportForRuby("Order", OrderSchema);
const rubyPaymentRequestCode = exportForRuby("PaymentRequest", PaymentRequestSchema);
const rubyPaymentResponseCode = exportForRuby("PaymentResponse", PaymentResponseSchema);
console.log("✓ Ruby Payment schemas generated");

// Generate Java code for Inventory Service
console.log("📝 Generating Java code for Inventory Service...");
const javaProductCode = exportForJava("Product", ProductSchema);
const javaInventoryUpdateCode = exportForJava("InventoryUpdate", InventoryUpdateSchema);
console.log("✓ Java Inventory schemas generated");

// Generate API Response for all services
console.log("📝 Generating API Response schema for all services...");
const pythonApiResponseCode = exportForPython("ApiResponse", ApiResponseSchema);
const rubyApiResponseCode = exportForRuby("ApiResponse", ApiResponseSchema);
const javaApiResponseCode = exportForJava("ApiResponse", ApiResponseSchema);
console.log("✓ API Response schemas generated for all languages");

console.log("\n✨ SUCCESS! Schemas are now available in:");
console.log("   - TypeScript (native)");
console.log("   - Python (User Service)");
console.log("   - Ruby (Payment Service)");
console.log("   - Java (Inventory Service)");
console.log("\n🎯 ONE SCHEMA, ALL LANGUAGES - Zero duplication!");
console.log("💡 This is the power of Elide's polyglot runtime!");

// ============================================================================
// DEMONSTRATION: Using schemas in TypeScript
// ============================================================================

console.log("\n=== Demonstrating Schema Usage ===\n");

// Example 1: Validate a user
console.log("1. Validating User:");
try {
  const user: User = UserSchema.parse({
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "john@example.com",
    name: "John Doe",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("✓ Valid user:", user.name, user.email);
} catch (error) {
  console.error("✗ Invalid user:", error);
}

// Example 2: Validate a product
console.log("\n2. Validating Product:");
try {
  const product: Product = ProductSchema.parse({
    sku: "PROD-001",
    name: "Awesome Widget",
    description: "A really cool widget",
    price: 29.99,
    stock: 100,
    category: "electronics",
    tags: ["new", "featured"],
    isActive: true,
  });
  console.log("✓ Valid product:", product.name, `$${product.price}`);
} catch (error) {
  console.error("✗ Invalid product:", error);
}

// Example 3: Validate an order
console.log("\n3. Validating Order:");
try {
  const order: Order = OrderSchema.parse({
    orderId: "123e4567-e89b-12d3-a456-426614174000",
    customerId: "987e6543-e21b-98d7-a654-321098765432",
    items: [
      {
        productSku: "PROD-001",
        quantity: 2,
        unitPrice: 29.99,
      },
    ],
    subtotal: 59.98,
    tax: 5.40,
    total: 65.38,
    status: "pending",
    paymentMethod: "credit_card",
    createdAt: new Date(),
  });
  console.log("✓ Valid order:", order.orderId, `$${order.total}`);
} catch (error) {
  console.error("✗ Invalid order:", error);
}

// Example 4: Validate payment response (discriminated union)
console.log("\n4. Validating Payment Response:");
try {
  const successResponse: PaymentResponse = PaymentResponseSchema.parse({
    status: "success",
    transactionId: "TXN-123456",
    amount: 65.38,
    timestamp: new Date(),
  });
  console.log("✓ Payment successful:", successResponse.transactionId);
} catch (error) {
  console.error("✗ Invalid payment response:", error);
}

console.log("\n=== Schema Validation Complete ===");
console.log("\n💡 Key Benefits:");
console.log("   ✓ Type-safe validation across all services");
console.log("   ✓ Consistent error messages");
console.log("   ✓ No schema duplication");
console.log("   ✓ Single source of truth");
console.log("   ✓ Works across TypeScript, Python, Ruby, and Java!");
