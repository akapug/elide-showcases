/**
 * Transformer Tests
 *
 * Test suite for data transformers.
 */

import { DataValidator, ValidationSchema, CommonSchemas } from '../transformers/validator';
import { DataEnricher, CommonEnrichments } from '../transformers/enricher';

/**
 * Test: Data validation
 */
async function testDataValidation(): Promise<void> {
  console.log('Test: Data validation');

  const validator = new DataValidator();

  const schema: ValidationSchema = {
    email: [
      { type: 'required' },
      { type: 'email' }
    ],
    age: [
      { type: 'type', dataType: 'number' },
      { type: 'min', value: 0 },
      { type: 'max', value: 150 }
    ],
    name: [
      { type: 'required' },
      { type: 'minLength', value: 2 }
    ]
  };

  const validData = [
    { email: 'test@example.com', age: 25, name: 'John Doe' },
    { email: 'jane@example.com', age: 30, name: 'Jane Smith' }
  ];

  const invalidData = [
    { email: 'invalid-email', age: 25, name: 'J' }, // Invalid email, short name
    { email: 'test@example.com', age: -5, name: 'Test' } // Negative age
  ];

  const context: any = { runId: 'test-run-1', pipelineId: 'test', startTime: new Date(), config: {}, metadata: {} };

  // Test valid data
  const validResult = await validator.transform(
    validData,
    { schema, removeInvalid: false },
    context
  );

  if (validResult.length === 2) {
    console.log('✓ Valid data test passed');
  } else {
    console.error('✗ Valid data test failed');
  }

  // Test invalid data with strict mode off
  const invalidResult = await validator.transform(
    invalidData,
    { schema, removeInvalid: true },
    context
  );

  if (invalidResult.length === 0) {
    console.log('✓ Invalid data removal test passed');
  } else {
    console.error('✗ Invalid data removal test failed');
  }

  // Test validation stats
  const stats = validator.getValidationStats(invalidData, schema);

  if (stats.invalidRecords === 2) {
    console.log('✓ Validation stats test passed');
  } else {
    console.error('✗ Validation stats test failed');
  }
}

/**
 * Test: Common validation schemas
 */
async function testCommonSchemas(): Promise<void> {
  console.log('\nTest: Common schemas');

  const validator = new DataValidator();

  const userData = [
    { id: '1', email: 'user@example.com', name: 'Test User', age: 25 }
  ];

  const context: any = { runId: 'test-run-2', pipelineId: 'test', startTime: new Date(), config: {}, metadata: {} };

  const result = await validator.transform(
    userData,
    { schema: CommonSchemas.user },
    context
  );

  if (result.length === 1) {
    console.log('✓ Common schemas test passed');
  } else {
    console.error('✗ Common schemas test failed');
  }
}

/**
 * Test: Data enrichment
 */
async function testDataEnrichment(): Promise<void> {
  console.log('\nTest: Data enrichment');

  const enricher = new DataEnricher();

  const data = [
    { firstName: 'John', lastName: 'Doe', price: 100, quantity: 2 },
    { firstName: 'Jane', lastName: 'Smith', price: 50, quantity: 3 }
  ];

  const context: any = { runId: 'test-run-3', pipelineId: 'test', startTime: new Date(), config: {}, metadata: {} };

  const result = await enricher.transform(
    data,
    {
      computedFields: {
        fullName: CommonEnrichments.fullName,
        total: CommonEnrichments.total
      }
    },
    context
  );

  if (
    result[0].fullName === 'John Doe' &&
    result[0].total === 200 &&
    result[1].fullName === 'Jane Smith' &&
    result[1].total === 150
  ) {
    console.log('✓ Data enrichment test passed');
  } else {
    console.error('✗ Data enrichment test failed');
    console.log('Result:', result);
  }
}

/**
 * Test: Lookups
 */
async function testLookups(): Promise<void> {
  console.log('\nTest: Lookups');

  const enricher = new DataEnricher();

  const data = [
    { productId: 'P001', quantity: 2 },
    { productId: 'P002', quantity: 1 },
    { productId: 'P999', quantity: 5 } // Unknown product
  ];

  const productLookup = {
    'P001': { name: 'Widget', price: 10 },
    'P002': { name: 'Gadget', price: 20 }
  };

  const context: any = { runId: 'test-run-4', pipelineId: 'test', startTime: new Date(), config: {}, metadata: {} };

  const result = await enricher.transform(
    data,
    {
      lookups: [
        {
          targetField: 'productInfo',
          lookupField: 'productId',
          lookupTable: productLookup,
          defaultValue: { name: 'Unknown', price: 0 }
        }
      ]
    },
    context
  );

  if (
    result[0].productInfo.name === 'Widget' &&
    result[2].productInfo.name === 'Unknown'
  ) {
    console.log('✓ Lookups test passed');
  } else {
    console.error('✗ Lookups test failed');
    console.log('Result:', result);
  }
}

/**
 * Test: Aggregations
 */
async function testAggregations(): Promise<void> {
  console.log('\nTest: Aggregations');

  const enricher = new DataEnricher();

  const data = [
    { category: 'A', value: 10 },
    { category: 'A', value: 20 },
    { category: 'B', value: 30 },
    { category: 'B', value: 40 }
  ];

  const context: any = { runId: 'test-run-5', pipelineId: 'test', startTime: new Date(), config: {}, metadata: {} };

  const result = await enricher.transform(
    data,
    {
      aggregations: [
        {
          groupBy: ['category'],
          aggregates: [
            {
              field: 'value',
              operation: 'sum',
              outputField: 'totalValue'
            },
            {
              field: 'value',
              operation: 'avg',
              outputField: 'avgValue'
            }
          ]
        }
      ]
    },
    context
  );

  const categoryA = result.find((r: any) => r.category === 'A');
  const categoryB = result.find((r: any) => r.category === 'B');

  if (
    categoryA?.totalValue === 30 &&
    categoryA?.avgValue === 15 &&
    categoryB?.totalValue === 70 &&
    categoryB?.avgValue === 35
  ) {
    console.log('✓ Aggregations test passed');
  } else {
    console.error('✗ Aggregations test failed');
    console.log('Result:', result);
  }
}

/**
 * Test: Custom validation rules
 */
async function testCustomValidation(): Promise<void> {
  console.log('\nTest: Custom validation');

  const validator = new DataValidator();

  const schema: ValidationSchema = {
    password: [
      {
        type: 'custom',
        validator: (value: string) => value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value),
        message: 'Password must be at least 8 characters with uppercase and number'
      }
    ]
  };

  const data = [
    { password: 'Weak1' }, // Too short
    { password: 'StrongPass123' } // Valid
  ];

  const context: any = { runId: 'test-run-6', pipelineId: 'test', startTime: new Date(), config: {}, metadata: {} };

  const result = await validator.transform(
    data,
    { schema, removeInvalid: true },
    context
  );

  if (result.length === 1 && result[0].password === 'StrongPass123') {
    console.log('✓ Custom validation test passed');
  } else {
    console.error('✗ Custom validation test failed');
    console.log('Result:', result);
  }
}

/**
 * Run all transformer tests
 */
async function runTests(): Promise<void> {
  console.log('=== Transformer Tests ===\n');

  await testDataValidation();
  await testCommonSchemas();
  await testDataEnrichment();
  await testLookups();
  await testAggregations();
  await testCustomValidation();

  console.log('\n=== Tests Complete ===');
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export {
  testDataValidation,
  testCommonSchemas,
  testDataEnrichment,
  testLookups,
  testAggregations,
  testCustomValidation,
  runTests
};
