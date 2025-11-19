# Hibernate/JPA to Modern ORM Migration

This guide shows how to migrate from Hibernate/JPA to modern TypeScript ORMs like TypeORM, Prisma, or Drizzle.

## Original Hibernate/JPA Setup

### Entity Definition

```java
// Product.java
package com.example.shop.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<Review> reviews;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters...
}
```

### Repository

```java
// ProductRepository.java
package com.example.shop.repository;

import com.example.shop.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategory_Id(Long categoryId);

    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);

    @Query("SELECT p FROM Product p WHERE p.stock < :threshold")
    List<Product> findLowStockProducts(@Param("threshold") Integer threshold);

    @Query("SELECT p FROM Product p JOIN FETCH p.category WHERE p.id = :id")
    Product findByIdWithCategory(@Param("id") Long id);
}
```

### Service with Transactions

```java
// ProductService.java
package com.example.shop.service;

import com.example.shop.model.Product;
import com.example.shop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Product getProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product updateStock(Long id, Integer quantity) {
        Product product = getProduct(id);
        product.setStock(product.getStock() + quantity);
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Product> searchProducts(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }
}
```

## Migration Options

## Option 1: TypeORM (Most JPA-like)

TypeORM is the closest to JPA/Hibernate in philosophy and features.

### Entity Definition

```typescript
// models/Product.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category';
import { Review } from './Review';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  stock: number;

  @ManyToOne(() => Category, category => category.products, { lazy: true })
  @JoinColumn({ name: 'category_id' })
  category: Promise<Category>;

  @OneToMany(() => Review, review => review.product, { cascade: true })
  reviews: Promise<Review[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Repository

```typescript
// repositories/ProductRepository.ts
import { AppDataSource } from '../database';
import { Product } from '../models/Product';
import { Between, LessThan } from 'typeorm';

export const ProductRepository = AppDataSource.getRepository(Product).extend({
  // Custom repository methods
  findByCategory(categoryId: number): Promise<Product[]> {
    return this.createQueryBuilder('product')
      .where('product.category_id = :categoryId', { categoryId })
      .getMany();
  },

  findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.find({
      where: {
        price: Between(minPrice, maxPrice),
      },
    });
  },

  findLowStockProducts(threshold: number): Promise<Product[]> {
    return this.find({
      where: {
        stock: LessThan(threshold),
      },
    });
  },

  findByIdWithCategory(id: number): Promise<Product | null> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.id = :id', { id })
      .getOne();
  },
});
```

### Service with Transactions

```typescript
// services/ProductService.ts
import { AppDataSource } from '../database';
import { Product } from '../models/Product';
import { ProductRepository } from '../repositories/ProductRepository';

export class ProductService {
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const product = ProductRepository.create(productData);
    return ProductRepository.save(product);
  }

  async getProduct(id: number): Promise<Product> {
    const product = await ProductRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    return AppDataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id } });
      if (!product) {
        throw new Error('Product not found');
      }

      product.stock += quantity;
      return manager.save(Product, product);
    });
  }

  async deleteProduct(id: number): Promise<void> {
    await ProductRepository.delete(id);
  }

  async searchProducts(minPrice: number, maxPrice: number): Promise<Product[]> {
    return ProductRepository.findByPriceRange(minPrice, maxPrice);
  }
}
```

### Database Configuration

```typescript
// database.ts
import { DataSource } from 'typeorm';
import { Product } from './models/Product';
import { Category } from './models/Category';
import { Review } from './models/Review';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'shop',
  entities: [Product, Category, Review],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});
```

## Option 2: Prisma (Modern, Type-Safe)

Prisma takes a schema-first approach with excellent TypeScript support.

### Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          Int       @id @default(autoincrement())
  name        String    @db.VarChar(200)
  description String?   @db.Text
  price       Decimal   @db.Decimal(10, 2)
  stock       Int       @default(0)
  categoryId  Int?      @map("category_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  category    Category? @relation(fields: [categoryId], references: [id])
  reviews     Review[]

  @@map("products")
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String    @db.VarChar(100)
  products Product[]

  @@map("categories")
}

model Review {
  id        Int      @id @default(autoincrement())
  productId Int      @map("product_id")
  rating    Int
  comment   String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  product   Product  @relation(fields: [productId], references: [id])

  @@map("reviews")
}
```

### Service Implementation

```typescript
// services/ProductService.ts
import { PrismaClient, Product } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductService {
  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    categoryId?: number;
  }): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  async getProduct(id: number): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });

      if (!product) {
        throw new Error('Product not found');
      }

      return tx.product.update({
        where: { id },
        data: {
          stock: product.stock + quantity,
        },
      });
    });
  }

  async deleteProduct(id: number): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }

  async searchProducts(minPrice: number, maxPrice: number): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      include: {
        category: true,
      },
    });
  }

  async findLowStockProducts(threshold: number): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        stock: {
          lt: threshold,
        },
      },
    });
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        categoryId,
      },
    });
  }
}
```

## Option 3: Drizzle ORM (Lightweight, SQL-like)

Drizzle is a lightweight ORM with a SQL-like API.

### Schema Definition

```typescript
// schema/product.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './category';
import { reviews } from './review';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
  categoryId: integer('category_id').references(() => categories.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

### Service Implementation

```typescript
// services/ProductService.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, between, lt } from 'drizzle-orm';
import { Pool } from 'pg';
import { products } from '../schema/product';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = drizzle(pool);

export class ProductService {
  async createProduct(data: {
    name: string;
    description?: string;
    price: string;
    stock?: number;
    categoryId?: number;
  }) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async getProduct(id: number) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async updateStock(id: number, quantity: number) {
    return db.transaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!product) {
        throw new Error('Product not found');
      }

      const [updated] = await tx
        .update(products)
        .set({ stock: product.stock + quantity })
        .where(eq(products.id, id))
        .returning();

      return updated;
    });
  }

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(minPrice: string, maxPrice: string) {
    return db
      .select()
      .from(products)
      .where(between(products.price, minPrice, maxPrice));
  }

  async findLowStockProducts(threshold: number) {
    return db
      .select()
      .from(products)
      .where(lt(products.stock, threshold));
  }
}
```

## Comparison Table

| Feature | Hibernate/JPA | TypeORM | Prisma | Drizzle |
|---------|---------------|---------|--------|---------|
| Learning Curve | Medium | Medium | Low | Low |
| TypeScript Support | N/A | Good | Excellent | Excellent |
| Active Record | Yes | Yes | No | No |
| Schema Migrations | Yes | Yes | Yes | Yes |
| Relationships | Complex | Complex | Simple | Simple |
| Performance | Good | Good | Excellent | Excellent |
| SQL Control | Limited | Good | Limited | Excellent |
| Community | Huge | Large | Growing | Growing |

## Migration Recommendations

1. **Choose TypeORM if:**
   - You want minimal conceptual changes from JPA
   - You need decorator-based entity definitions
   - You have complex entity relationships

2. **Choose Prisma if:**
   - You want the best TypeScript experience
   - You prefer schema-first development
   - You need excellent tooling and migrations

3. **Choose Drizzle if:**
   - You want lightweight and fast ORM
   - You prefer SQL-like queries
   - You need maximum performance

## General Migration Steps

1. **Export your data** from existing database
2. **Choose your ORM** based on needs
3. **Define schemas** in new ORM
4. **Run migrations** to create tables
5. **Import data** to new schema
6. **Update services** to use new ORM
7. **Test thoroughly** - compare query results
8. **Monitor performance** - benchmark before/after
