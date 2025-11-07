/**
 * Product Routes
 *
 * Handles all product-related API endpoints:
 * - List products with filtering and pagination
 * - Get single product
 * - Create product (admin)
 * - Update product (admin)
 * - Delete product (admin)
 * - Search products
 */

import { RequestContext, Response } from '../server.ts';
import { Database, Product } from '../db/database.ts';
import { isEmail } from '../../shared/validator.ts';

export class ProductRoutes {
  constructor(private db: Database) {}

  /**
   * Handle product routes
   */
  async handle(ctx: RequestContext): Promise<Response> {
    const { method, path } = ctx;

    // GET /api/products - List products
    if (path === '/api/products' && method === 'GET') {
      return this.listProducts(ctx);
    }

    // GET /api/products/:id - Get single product
    if (path.match(/^\/api\/products\/[^/]+$/) && method === 'GET') {
      const id = path.split('/')[3];
      return this.getProduct(id);
    }

    // POST /api/products - Create product
    if (path === '/api/products' && method === 'POST') {
      return this.createProduct(ctx);
    }

    // PUT /api/products/:id - Update product
    if (path.match(/^\/api\/products\/[^/]+$/) && method === 'PUT') {
      const id = path.split('/')[3];
      return this.updateProduct(id, ctx);
    }

    // DELETE /api/products/:id - Delete product
    if (path.match(/^\/api\/products\/[^/]+$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      return this.deleteProduct(id);
    }

    // GET /api/products/search - Search products
    if (path === '/api/products/search' && method === 'GET') {
      return this.searchProducts(ctx);
    }

    return this.errorResponse(404, 'Product endpoint not found');
  }

  /**
   * List products with filtering and pagination
   */
  private listProducts(ctx: RequestContext): Response {
    const {
      page = '1',
      limit = '20',
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc',
    } = ctx.query;

    try {
      let products = this.db.getProducts();

      // Apply filters
      if (category) {
        products = products.filter(p => p.category === category);
      }

      if (minPrice) {
        const min = parseFloat(minPrice);
        products = products.filter(p => p.price >= min);
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice);
        products = products.filter(p => p.price <= max);
      }

      if (inStock === 'true') {
        products = products.filter(p => p.stock > 0);
      }

      // Sort products
      products = this.sortProducts(products, sortBy, sortOrder);

      // Pagination
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedProducts = products.slice(startIndex, endIndex);

      return this.jsonResponse(200, {
        products: paginatedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: products.length,
          totalPages: Math.ceil(products.length / limitNum),
          hasMore: endIndex < products.length,
        },
        filters: {
          category,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          inStock: inStock === 'true',
        },
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to list products', error);
    }
  }

  /**
   * Get single product by ID
   */
  private getProduct(id: string): Response {
    const product = this.db.getProduct(id);

    if (!product) {
      return this.errorResponse(404, 'Product not found');
    }

    // Get inventory info
    const inventory = this.db.getInventoryForProduct(id);

    return this.jsonResponse(200, {
      product,
      inventory: inventory ? {
        available: inventory.available,
        reserved: inventory.reserved,
        inStock: inventory.available > 0,
      } : undefined,
    });
  }

  /**
   * Create new product
   */
  private createProduct(ctx: RequestContext): Response {
    const { name, description, price, category, stock, sku } = ctx.body || {};

    // Validation
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.length < 3) {
      errors.push('Name must be at least 3 characters');
    }

    if (!description || typeof description !== 'string') {
      errors.push('Description is required');
    }

    if (!price || typeof price !== 'number' || price <= 0) {
      errors.push('Price must be a positive number');
    }

    if (!category || typeof category !== 'string') {
      errors.push('Category is required');
    }

    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      errors.push('Stock must be a non-negative number');
    }

    if (!sku || typeof sku !== 'string') {
      errors.push('SKU is required');
    }

    if (errors.length > 0) {
      return this.errorResponse(400, 'Validation failed', errors);
    }

    try {
      const product = this.db.createProduct({
        name,
        description,
        price,
        category,
        stock,
        sku,
      });

      return this.jsonResponse(201, {
        product,
        message: 'Product created successfully',
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to create product', error);
    }
  }

  /**
   * Update existing product
   */
  private updateProduct(id: string, ctx: RequestContext): Response {
    const existing = this.db.getProduct(id);
    if (!existing) {
      return this.errorResponse(404, 'Product not found');
    }

    const updates = ctx.body || {};

    // Validate updates
    if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price <= 0)) {
      return this.errorResponse(400, 'Price must be a positive number');
    }

    if (updates.stock !== undefined && (typeof updates.stock !== 'number' || updates.stock < 0)) {
      return this.errorResponse(400, 'Stock must be a non-negative number');
    }

    try {
      const product = this.db.updateProduct(id, updates);

      return this.jsonResponse(200, {
        product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to update product', error);
    }
  }

  /**
   * Delete product
   */
  private deleteProduct(id: string): Response {
    const existing = this.db.getProduct(id);
    if (!existing) {
      return this.errorResponse(404, 'Product not found');
    }

    try {
      const deleted = this.db.deleteProduct(id);

      if (deleted) {
        return this.jsonResponse(200, {
          message: 'Product deleted successfully',
          deletedId: id,
        });
      } else {
        return this.errorResponse(500, 'Failed to delete product');
      }
    } catch (error) {
      return this.errorResponse(500, 'Failed to delete product', error);
    }
  }

  /**
   * Search products
   */
  private searchProducts(ctx: RequestContext): Response {
    const { q } = ctx.query;

    if (!q || typeof q !== 'string') {
      return this.errorResponse(400, 'Search query (q) is required');
    }

    try {
      const products = this.db.searchProducts(q);

      return this.jsonResponse(200, {
        products,
        query: q,
        count: products.length,
      });
    } catch (error) {
      return this.errorResponse(500, 'Search failed', error);
    }
  }

  /**
   * Sort products
   */
  private sortProducts(products: Product[], sortBy: string, sortOrder: string): Product[] {
    const order = sortOrder.toLowerCase() === 'desc' ? -1 : 1;

    return products.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        case 'name':
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
      }

      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
  }

  /**
   * Helper: Create JSON response
   */
  private jsonResponse(status: number, body: any): Response {
    return {
      status,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  }

  /**
   * Helper: Create error response
   */
  private errorResponse(status: number, message: string, details?: any): Response {
    return this.jsonResponse(status, {
      error: message,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
