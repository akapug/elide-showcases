/**
 * Example: E-commerce Platform
 * Product catalog, orders, and cart management
 */

import { createServer } from '../src/index.js';

async function setupEcommerce() {
  console.log('Setting up e-commerce platform...\n');

  const server = await createServer({
    port: 8091,
    dbPath: './examples/ecommerce-data.db',
    storagePath: './examples/ecommerce-storage',
  });

  const { collections } = server;

  try {
    // Create categories collection
    await collections.createCollection({
      name: 'categories',
      type: 'base',
      schema: [
        { id: 'name', name: 'name', type: 'text', required: true },
        { id: 'slug', name: 'slug', type: 'text', required: true, unique: true },
        { id: 'description', name: 'description', type: 'text' },
        { id: 'image', name: 'image', type: 'file', options: { mimeTypes: ['image/*'] } },
      ],
      listRule: '',
      viewRule: '',
    });

    // Create products collection
    await collections.createCollection({
      name: 'products',
      type: 'base',
      schema: [
        { id: 'name', name: 'name', type: 'text', required: true },
        { id: 'slug', name: 'slug', type: 'text', required: true, unique: true },
        { id: 'description', name: 'description', type: 'text', required: true },
        { id: 'price', name: 'price', type: 'number', required: true, options: { min: 0 } },
        { id: 'comparePrice', name: 'comparePrice', type: 'number', options: { min: 0 } },
        { id: 'cost', name: 'cost', type: 'number', options: { min: 0 } },
        {
          id: 'category',
          name: 'category',
          type: 'relation',
          required: true,
          options: { collectionId: 'categories', maxSelect: 1 },
        },
        {
          id: 'images',
          name: 'images',
          type: 'file',
          options: {
            maxSelect: 5,
            mimeTypes: ['image/*'],
            thumbs: ['200x200', '400x400', '800x800'],
          },
        },
        { id: 'sku', name: 'sku', type: 'text', unique: true },
        { id: 'barcode', name: 'barcode', type: 'text' },
        { id: 'stock', name: 'stock', type: 'number', required: true, options: { onlyInt: true, min: 0 } },
        { id: 'trackInventory', name: 'trackInventory', type: 'bool' },
        { id: 'weight', name: 'weight', type: 'number', options: { min: 0 } },
        { id: 'dimensions', name: 'dimensions', type: 'json' },
        {
          id: 'tags',
          name: 'tags',
          type: 'select',
          options: {
            values: ['New', 'Sale', 'Featured', 'Bestseller'],
            maxSelect: 3,
          },
        },
        { id: 'published', name: 'published', type: 'bool' },
        { id: 'featured', name: 'featured', type: 'bool' },
      ],
      indexes: ['category', 'published', 'featured', 'slug'],
      listRule: 'published = true',
      viewRule: 'published = true',
    });

    // Create customers collection
    await collections.createCollection({
      name: 'customers',
      type: 'auth',
      options: {
        allowEmailAuth: true,
        minPasswordLength: 8,
      },
      schema: [
        { id: 'firstName', name: 'firstName', type: 'text', required: true },
        { id: 'lastName', name: 'lastName', type: 'text', required: true },
        { id: 'phone', name: 'phone', type: 'text' },
        { id: 'addresses', name: 'addresses', type: 'json' },
        { id: 'defaultAddress', name: 'defaultAddress', type: 'json' },
      ],
    });

    // Create orders collection
    await collections.createCollection({
      name: 'orders',
      type: 'base',
      schema: [
        {
          id: 'customer',
          name: 'customer',
          type: 'relation',
          required: true,
          options: { collectionId: 'customers', maxSelect: 1 },
        },
        { id: 'orderNumber', name: 'orderNumber', type: 'text', required: true, unique: true },
        { id: 'items', name: 'items', type: 'json', required: true },
        { id: 'subtotal', name: 'subtotal', type: 'number', required: true },
        { id: 'tax', name: 'tax', type: 'number' },
        { id: 'shipping', name: 'shipping', type: 'number' },
        { id: 'total', name: 'total', type: 'number', required: true },
        {
          id: 'status',
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            maxSelect: 1,
          },
        },
        { id: 'shippingAddress', name: 'shippingAddress', type: 'json', required: true },
        { id: 'billingAddress', name: 'billingAddress', type: 'json', required: true },
        { id: 'paymentMethod', name: 'paymentMethod', type: 'text' },
        { id: 'paymentStatus', name: 'paymentStatus', type: 'text' },
        { id: 'trackingNumber', name: 'trackingNumber', type: 'text' },
        { id: 'notes', name: 'notes', type: 'text' },
        { id: 'fulfilledAt', name: 'fulfilledAt', type: 'date' },
      ],
      indexes: ['customer', 'status', 'orderNumber'],
      listRule: 'customer = auth.id',
      viewRule: 'customer = auth.id',
      createRule: 'auth.id != null',
    });

    // Create reviews collection
    await collections.createCollection({
      name: 'reviews',
      type: 'base',
      schema: [
        {
          id: 'product',
          name: 'product',
          type: 'relation',
          required: true,
          options: { collectionId: 'products', maxSelect: 1, cascadeDelete: true },
        },
        {
          id: 'customer',
          name: 'customer',
          type: 'relation',
          required: true,
          options: { collectionId: 'customers', maxSelect: 1 },
        },
        { id: 'rating', name: 'rating', type: 'number', required: true, options: { onlyInt: true, min: 1, max: 5 } },
        { id: 'title', name: 'title', type: 'text', required: true },
        { id: 'content', name: 'content', type: 'text', required: true },
        { id: 'verified', name: 'verified', type: 'bool' },
        { id: 'helpful', name: 'helpful', type: 'number', options: { onlyInt: true, min: 0 } },
      ],
      indexes: ['product', 'customer', 'rating'],
      listRule: '',
      viewRule: '',
      createRule: 'auth.id != null && customer = auth.id',
      updateRule: 'customer = auth.id',
      deleteRule: 'customer = auth.id',
    });

    // Create cart collection
    await collections.createCollection({
      name: 'cart_items',
      type: 'base',
      schema: [
        {
          id: 'customer',
          name: 'customer',
          type: 'relation',
          required: true,
          options: { collectionId: 'customers', maxSelect: 1 },
        },
        {
          id: 'product',
          name: 'product',
          type: 'relation',
          required: true,
          options: { collectionId: 'products', maxSelect: 1 },
        },
        { id: 'quantity', name: 'quantity', type: 'number', required: true, options: { onlyInt: true, min: 1 } },
        { id: 'variant', name: 'variant', type: 'json' },
      ],
      indexes: ['customer', 'product'],
      listRule: 'customer = auth.id',
      viewRule: 'customer = auth.id',
      createRule: 'auth.id != null && customer = auth.id',
      updateRule: 'customer = auth.id',
      deleteRule: 'customer = auth.id',
    });

    console.log('\n✓ E-commerce platform setup complete!');
    console.log('\nCollections created:');
    console.log('  - categories');
    console.log('  - products');
    console.log('  - customers (auth)');
    console.log('  - orders');
    console.log('  - reviews');
    console.log('  - cart_items');

    console.log('\nExample Workflows:');
    console.log('\n1. Browse Products:');
    console.log('   GET /api/records/products?filter=published=true&page=1&perPage=20');

    console.log('\n2. Product Details:');
    console.log('   GET /api/records/products/PRODUCT_ID?expand=category');

    console.log('\n3. Add to Cart:');
    console.log('   POST /api/records/cart_items');
    console.log('   Body: { customer, product, quantity }');

    console.log('\n4. Create Order:');
    console.log('   POST /api/records/orders');
    console.log('   Body: { customer, items, total, shippingAddress, billingAddress }');

    console.log('\n5. Leave Review:');
    console.log('   POST /api/records/reviews');
    console.log('   Body: { product, customer, rating, title, content }');

    console.log('\nServer running at http://localhost:8091');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('\n✓ Collections already exist, server ready!');
      console.log('Server running at http://localhost:8091');
    } else {
      throw error;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupEcommerce().catch(console.error);
}

export { setupEcommerce };
