/**
 * Zod schemas for TypeScript-side validation
 * Mirrors Python Pydantic models for dual validation
 */

import { z } from 'zod';

// User record schema
export const UserRecordSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
  created_at: z.string().datetime().or(z.date()),
  is_active: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type UserRecord = z.infer<typeof UserRecordSchema>;

// Transaction record schema
export const TransactionSchema = z.object({
  transaction_id: z.string().uuid(),
  user_id: z.number().int().positive(),
  amount: z.number().min(0),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY']),
  timestamp: z.string().datetime().or(z.date()),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  payment_method: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Product record schema
export const ProductSchema = z.object({
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string(),
  in_stock: z.boolean(),
  quantity: z.number().int().min(0),
  tags: z.array(z.string()),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
    weight: z.number().positive(),
  }).optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// ETL Job configuration
export const ETLJobConfigSchema = z.object({
  job_id: z.string(),
  source_type: z.enum(['csv', 'json', 'parquet', 'api']),
  source_path: z.string(),
  target_type: z.enum(['csv', 'json', 'parquet', 'database']),
  target_path: z.string(),
  schema_name: z.enum(['user', 'transaction', 'product', 'custom']),
  transformations: z.array(z.enum(['normalize', 'deduplicate', 'enrich', 'aggregate'])),
  validation_mode: z.enum(['strict', 'lenient', 'skip']),
  batch_size: z.number().int().positive().default(1000),
  enable_zero_copy: z.boolean().default(true),
});

export type ETLJobConfig = z.infer<typeof ETLJobConfigSchema>;

// Validation result
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  total_records: z.number().int(),
  valid_records: z.number().int(),
  invalid_records: z.number().int(),
  errors: z.array(z.object({
    record_index: z.number().int(),
    field: z.string(),
    error: z.string(),
    value: z.unknown(),
  })),
  duration_ms: z.number(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ETL Pipeline result
export const ETLResultSchema = z.object({
  job_id: z.string(),
  status: z.enum(['success', 'partial', 'failed']),
  records_processed: z.number().int(),
  records_succeeded: z.number().int(),
  records_failed: z.number().int(),
  duration_ms: z.number(),
  validation: ValidationResultSchema,
  transformations_applied: z.array(z.string()),
  output_path: z.string().optional(),
  errors: z.array(z.string()),
});

export type ETLResult = z.infer<typeof ETLResultSchema>;

// Helper function to get schema by name
export function getSchemaByName(schemaName: string): z.ZodSchema {
  const schemas: Record<string, z.ZodSchema> = {
    user: UserRecordSchema,
    transaction: TransactionSchema,
    product: ProductSchema,
  };

  return schemas[schemaName] || z.object({});
}

// Batch validation with detailed errors
export function validateBatch<T>(
  data: unknown[],
  schema: z.ZodSchema<T>
): ValidationResult {
  const start = Date.now();
  const errors: ValidationResult['errors'] = [];
  let validCount = 0;

  data.forEach((record, index) => {
    const result = schema.safeParse(record);
    if (result.success) {
      validCount++;
    } else {
      result.error.issues.forEach(issue => {
        errors.push({
          record_index: index,
          field: issue.path.join('.'),
          error: issue.message,
          value: issue.path.reduce((obj: any, key) => obj?.[key], record),
        });
      });
    }
  });

  return {
    valid: errors.length === 0,
    total_records: data.length,
    valid_records: validCount,
    invalid_records: data.length - validCount,
    errors,
    duration_ms: Date.now() - start,
  };
}
