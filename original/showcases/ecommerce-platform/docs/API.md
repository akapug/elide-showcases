# E-Commerce Platform API Documentation

Complete API reference for the e-commerce platform showcasing Elide's polyglot capabilities.

## Table of Contents

- [Authentication](#authentication)
- [Product Management](#product-management)
- [Shopping Cart](#shopping-cart)
- [Orders](#orders)
- [Payment Processing](#payment-processing)
- [Inventory](#inventory)
- [Analytics](#analytics)
- [Recommendations](#recommendations)
- [Fraud Detection](#fraud-detection)

---

## Authentication

### POST /api/auth/login

Authenticate a user and receive session token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_abc123",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/logout

Logout and invalidate session.

**Headers:**
- `Session-Id`: Current session ID

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Product Management

### GET /api/products

List all products with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `category` (string) - Filter by category
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `inStock` (boolean) - Only show in-stock items
- `sortBy` (string) - Sort field: `name`, `price`, `stock`
- `sortOrder` (string) - Sort order: `asc`, `desc`

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "category": "Electronics",
      "stock": 50,
      "sku": "PROD-123",
      "images": ["url1", "url2"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### GET /api/products/:id

Get detailed information about a specific product.

**Response:**
```json
{
  "product": {
    "id": "prod_123",
    "name": "Product Name",
    "description": "Detailed product description",
    "price": 99.99,
    "category": "Electronics",
    "stock": 50,
    "sku": "PROD-123",
    "images": ["url1", "url2"],
    "specifications": {
      "weight": "1.5kg",
      "dimensions": "30x20x10cm"
    }
  },
  "inventory": {
    "available": 50,
    "reserved": 5,
    "inStock": true
  },
  "recommendations": [
    {
      "product_id": "prod_456",
      "score": 0.85,
      "reasons": ["similar_category", "frequently_bought_together"]
    }
  ]
}
```

### POST /api/products

Create a new product (admin only).

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 149.99,
  "category": "Electronics",
  "stock": 100,
  "sku": "NEW-PROD-001"
}
```

**Response:**
```json
{
  "product": { /* created product */ },
  "message": "Product created successfully"
}
```

### PUT /api/products/:id

Update an existing product (admin only).

**Request Body:**
```json
{
  "price": 129.99,
  "stock": 75
}
```

**Response:**
```json
{
  "product": { /* updated product */ },
  "message": "Product updated successfully"
}
```

### DELETE /api/products/:id

Delete a product (admin only).

**Response:**
```json
{
  "message": "Product deleted successfully",
  "deletedId": "prod_123"
}
```

---

## Shopping Cart

### GET /api/cart

Get current shopping cart.

**Headers:**
- `Session-Id`: Session identifier

**Response:**
```json
{
  "sessionId": "session_abc",
  "items": [
    {
      "id": "item_1",
      "productId": "prod_123",
      "name": "Product Name",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98
    }
  ],
  "summary": {
    "itemCount": 3,
    "uniqueItems": 2,
    "subtotal": 299.97,
    "estimatedTax": 25.50,
    "estimatedShipping": 5.99,
    "estimatedTotal": 331.46
  }
}
```

### POST /api/cart/items

Add item to cart.

**Request Body:**
```json
{
  "productId": "prod_123",
  "quantity": 2
}
```

**Response:**
```json
{
  "cart": { /* updated cart */ },
  "message": "Item added to cart"
}
```

### PUT /api/cart/items/:itemId

Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response:**
```json
{
  "cart": { /* updated cart */ },
  "message": "Cart item updated"
}
```

### DELETE /api/cart/items/:itemId

Remove item from cart.

**Response:**
```json
{
  "cart": { /* updated cart */ },
  "message": "Item removed from cart"
}
```

### POST /api/cart/validate

Validate cart before checkout.

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Price changed for Product A: $99.99 → $89.99"],
  "unavailableItems": [],
  "priceChanges": [
    {
      "productId": "prod_123",
      "oldPrice": 99.99,
      "newPrice": 89.99
    }
  ]
}
```

### POST /api/cart/wishlist

Add item to wishlist.

**Request Body:**
```json
{
  "productId": "prod_123",
  "notes": "For later",
  "priority": "high"
}
```

**Response:**
```json
{
  "item": {
    "id": "wish_1",
    "productId": "prod_123",
    "addedAt": "2024-01-01T12:00:00Z",
    "priority": "high"
  }
}
```

---

## Orders

### POST /api/orders

Create a new order (complete checkout).

**Request Body:**
```json
{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "US",
    "phone": "+1-415-555-0123"
  },
  "billingAddress": {
    "sameAsShipping": true
  },
  "shippingMethod": "standard",
  "paymentMethod": {
    "type": "credit_card",
    "cardNumber": "4532015112830366",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123"
  }
}
```

**Response:**
```json
{
  "order": {
    "orderId": "order_xyz",
    "status": "completed",
    "items": [ /* order items */ ],
    "subtotal": 299.97,
    "tax": 25.50,
    "shipping": 5.99,
    "total": 331.46,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/orders/:id

Get order details.

**Response:**
```json
{
  "order": {
    "orderId": "order_xyz",
    "customerId": "user_123",
    "status": "completed",
    "items": [
      {
        "productId": "prod_123",
        "name": "Product Name",
        "quantity": 2,
        "price": 99.99,
        "subtotal": 199.98
      }
    ],
    "subtotal": 299.97,
    "tax": 25.50,
    "shipping": 5.99,
    "total": 331.46,
    "shippingAddress": { /* address */ },
    "createdAt": "2024-01-01T12:00:00Z",
    "tracking": {
      "carrier": "USPS",
      "trackingNumber": "1Z999AA10123456784"
    }
  }
}
```

### GET /api/orders

List all orders for current user.

**Query Parameters:**
- `status` (string) - Filter by status
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:**
```json
{
  "orders": [ /* array of orders */ ],
  "pagination": { /* pagination info */ }
}
```

### PUT /api/orders/:id/status

Update order status (admin only).

**Request Body:**
```json
{
  "status": "processing"
}
```

**Response:**
```json
{
  "order": { /* updated order */ },
  "message": "Order status updated"
}
```

---

## Payment Processing

### POST /api/payments/process

Process a payment.

**Request Body:**
```json
{
  "provider": "stripe",
  "amount": 331.46,
  "currency": "USD",
  "orderId": "order_xyz",
  "paymentMethod": {
    "cardNumber": "4532015112830366",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "txn_abc123",
  "provider": "stripe",
  "status": "succeeded",
  "amount": 331.46,
  "currency": "USD"
}
```

### POST /api/payments/refund

Process a refund.

**Request Body:**
```json
{
  "transactionId": "txn_abc123",
  "amount": 100.00,
  "reason": "requested_by_customer"
}
```

**Response:**
```json
{
  "success": true,
  "refundId": "ref_xyz789",
  "amount": 100.00,
  "status": "completed"
}
```

---

## Inventory

### GET /api/inventory/products/:productId

Get inventory details for a product.

**Response:**
```json
{
  "productId": "prod_123",
  "totalStock": 150,
  "available": 140,
  "reserved": 10,
  "warehouses": [
    {
      "warehouseId": "wh_1",
      "name": "Main Distribution Center",
      "quantity": 100,
      "available": 95
    }
  ]
}
```

### POST /api/inventory/reserve

Reserve inventory for an order.

**Request Body:**
```json
{
  "productId": "prod_123",
  "quantity": 5,
  "orderId": "order_xyz"
}
```

**Response:**
```json
{
  "reservationId": "res_abc",
  "productId": "prod_123",
  "quantity": 5,
  "expiresAt": "2024-01-01T12:30:00Z"
}
```

### GET /api/inventory/alerts

Get low stock alerts (admin only).

**Response:**
```json
{
  "alerts": [
    {
      "productId": "prod_123",
      "warehouseId": "wh_1",
      "currentStock": 5,
      "reorderPoint": 10,
      "suggestedReorder": 50,
      "priority": "high"
    }
  ]
}
```

---

## Analytics

### GET /api/analytics/sales

Get sales metrics.

**Query Parameters:**
- `startDate` (ISO date string)
- `endDate` (ISO date string)

**Response:**
```json
{
  "totalRevenue": 125000.00,
  "totalOrders": 450,
  "averageOrderValue": 277.78,
  "medianOrderValue": 250.00,
  "uniqueCustomers": 320,
  "newCustomers": 85,
  "returningCustomers": 235,
  "conversionRate": 0.045
}
```

### GET /api/analytics/trends

Get sales trends over time.

**Query Parameters:**
- `period` (string) - `daily`, `weekly`, `monthly`

**Response:**
```json
{
  "trends": [
    {
      "period": "2024-01",
      "totalRevenue": 45000.00,
      "totalOrders": 180,
      "averageOrderValue": 250.00
    }
  ]
}
```

### GET /api/analytics/forecast

Get revenue forecast.

**Query Parameters:**
- `daysAhead` (number, default: 30)

**Response:**
```json
{
  "forecast": 48500.00,
  "averageDaily": 1616.67,
  "daysAhead": 30,
  "confidence": "medium",
  "method": "linear_regression"
}
```

### GET /api/analytics/customers/:customerId/ltv

Get customer lifetime value.

**Response:**
```json
{
  "customerId": "user_123",
  "lifetimeValue": 2450.00,
  "totalOrders": 15,
  "totalSpent": 1850.00,
  "averageOrderValue": 123.33,
  "purchaseFrequency": 0.5,
  "churnRisk": 0.2
}
```

---

## Recommendations

### GET /api/recommendations/products

Get personalized product recommendations.

**Query Parameters:**
- `userId` (string) - User identifier
- `count` (number, default: 10)
- `strategy` (string) - `hybrid`, `collaborative`, `content`, `trending`

**Response:**
```json
{
  "recommendations": [
    {
      "productId": "prod_456",
      "score": 0.85,
      "reasons": ["user-based-cf", "content-based"]
    }
  ]
}
```

### GET /api/recommendations/similar/:productId

Get similar products.

**Query Parameters:**
- `count` (number, default: 5)

**Response:**
```json
{
  "similar": [
    {
      "productId": "prod_789",
      "score": 0.92,
      "reasons": ["content-based", "collaborative-similar"]
    }
  ]
}
```

### POST /api/recommendations/cross-sell

Get cross-sell recommendations for cart.

**Request Body:**
```json
{
  "cartItems": ["prod_123", "prod_456"],
  "count": 5
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "productId": "prod_789",
      "score": 0.78,
      "reasons": ["cross-sell"]
    }
  ]
}
```

---

## Fraud Detection

### POST /api/fraud/check

Check transaction for fraud.

**Request Body:**
```json
{
  "transactionId": "txn_abc",
  "userId": "user_123",
  "amount": 500.00,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "billingAddress": { /* address */ },
  "shippingAddress": { /* address */ },
  "ipAddress": "192.168.1.1",
  "deviceFingerprint": "device_abc"
}
```

**Response:**
```json
{
  "transactionId": "txn_abc",
  "riskScore": 0.35,
  "riskLevel": "medium",
  "decision": "approve",
  "flags": ["unusual_amount"],
  "details": {
    "amount": 0.4,
    "velocity": 0.2,
    "location": 0.3,
    "device": 0.1
  }
}
```

### POST /api/fraud/report

Report fraudulent transaction.

**Request Body:**
```json
{
  "transactionId": "txn_abc",
  "userId": "user_123",
  "reason": "unauthorized_purchase"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Fraud reported and user flagged for review"
}
```

---

## Error Responses

All endpoints may return the following error format:

```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional error details",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

API requests are rate limited:
- **General API**: 100 requests per minute per IP
- **Payment API**: 10 requests per minute per user
- **Analytics API**: 20 requests per minute per user

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Webhooks

Subscribe to events:

### Order Events
- `order.created`
- `order.updated`
- `order.completed`
- `order.cancelled`

### Payment Events
- `payment.succeeded`
- `payment.failed`
- `refund.processed`

### Inventory Events
- `inventory.low_stock`
- `inventory.out_of_stock`

Webhook payload example:
```json
{
  "event": "order.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "orderId": "order_xyz",
    "customerId": "user_123",
    "total": 331.46
  }
}
```

---

## SDK Examples

### TypeScript
```typescript
import { EcommerceAPI } from '@elide/ecommerce-sdk';

const api = new EcommerceAPI({ apiKey: 'your-api-key' });

// Get products
const products = await api.products.list({ category: 'Electronics' });

// Add to cart
await api.cart.addItem('prod_123', 2);

// Place order
const order = await api.orders.create({
  shippingAddress,
  paymentMethod
});
```

### Python
```python
from elide_ecommerce import EcommerceAPI

api = EcommerceAPI(api_key='your-api-key')

# Get recommendations
recommendations = api.recommendations.get_personalized(
    user_id='user_123',
    count=10
)

# Check fraud
fraud_check = api.fraud.check_transaction({
    'transaction_id': 'txn_abc',
    'amount': 500.00,
    # ... other fields
})
```

---

For more information, see the [GitHub repository](https://github.com/elide-dev/elide-showcases).
