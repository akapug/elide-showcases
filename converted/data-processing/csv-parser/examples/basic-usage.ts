/**
 * Basic CSV Parser Usage Examples
 *
 * Demonstrates common use cases for parsing CSV files with Elide
 */

import csv from '../index';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

/**
 * Example 1: Basic CSV parsing from file
 */
async function example1_basicParsing() {
  console.log('Example 1: Basic CSV Parsing\n');

  const csvData = `name,age,city
Alice,30,New York
Bob,25,San Francisco
Charlie,35,Boston`;

  // Create a readable stream from string
  const stream = Readable.from([csvData]);

  stream
    .pipe(csv())
    .on('data', (row) => {
      console.log('Row:', row);
    })
    .on('end', () => {
      console.log('\nParsing complete!');
    });
}

/**
 * Example 2: Custom separator and headers
 */
async function example2_customOptions() {
  console.log('\nExample 2: Custom Separator (TSV)\n');

  const tsvData = `Alice\t30\tNew York
Bob\t25\tSan Francisco
Charlie\t35\tBoston`;

  const stream = Readable.from([tsvData]);

  stream
    .pipe(
      csv({
        separator: '\t',
        headers: ['name', 'age', 'city'],
      })
    )
    .on('data', (row) => {
      console.log(`${row.name} is ${row.age} years old and lives in ${row.city}`);
    });
}

/**
 * Example 3: Skip lines and transform data
 */
async function example3_skipAndTransform() {
  console.log('\nExample 3: Skip Lines and Transform Data\n');

  const csvData = `CSV Export - User Data
Generated: 2024-01-15
name,age,active
Alice,30,true
Bob,25,false
Charlie,35,true`;

  const stream = Readable.from([csvData]);

  stream
    .pipe(
      csv({
        skipLines: 2, // Skip header comments
        mapValues: ({ value, header }) => {
          // Transform values based on header
          if (header === 'age') return parseInt(value);
          if (header === 'active') return value === 'true';
          return value;
        },
      })
    )
    .on('data', (row) => {
      console.log('Parsed row:', row);
      console.log(`  - name is type: ${typeof row.name}`);
      console.log(`  - age is type: ${typeof row.age}`);
      console.log(`  - active is type: ${typeof row.active}`);
    });
}

/**
 * Example 4: Handle errors gracefully
 */
async function example4_errorHandling() {
  console.log('\nExample 4: Error Handling\n');

  const malformedCSV = `name,age,city
Alice,30,New York
Bob,invalid_age,San Francisco
Charlie,35,Boston`;

  const stream = Readable.from([malformedCSV]);

  stream
    .pipe(
      csv({
        strict: false, // Continue on errors
        mapValues: ({ value, header }) => {
          if (header === 'age') {
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
          }
          return value;
        },
      })
    )
    .on('data', (row) => {
      console.log('Row:', row);
    })
    .on('error', (error) => {
      console.error('Parse error:', error.message);
    });
}

/**
 * Example 5: Transform headers
 */
async function example5_headerTransform() {
  console.log('\nExample 5: Transform Header Names\n');

  const csvData = `First Name,Last Name,Email Address
Alice,Smith,alice@example.com
Bob,Jones,bob@example.com`;

  const stream = Readable.from([csvData]);

  stream
    .pipe(
      csv({
        mapHeaders: ({ header }) => {
          // Convert to snake_case
          return header.toLowerCase().replace(/\s+/g, '_');
        },
      })
    )
    .on('headers', (headers) => {
      console.log('Transformed headers:', headers);
    })
    .on('data', (row) => {
      console.log('Row:', row);
    });
}

/**
 * Example 6: Async iteration (modern approach)
 */
async function example6_asyncIteration() {
  console.log('\nExample 6: Async Iteration\n');

  const csvData = `product,price,quantity
Widget,19.99,100
Gadget,29.99,50
Doohickey,9.99,200`;

  const stream = Readable.from([csvData]);
  const parser = csv({
    mapValues: ({ value, header }) => {
      if (header === 'price' || header === 'quantity') {
        return parseFloat(value);
      }
      return value;
    },
  });

  let totalValue = 0;

  for await (const row of stream.pipe(parser)) {
    const lineValue = row.price * row.quantity;
    console.log(`${row.product}: $${row.price} × ${row.quantity} = $${lineValue.toFixed(2)}`);
    totalValue += lineValue;
  }

  console.log(`\nTotal inventory value: $${totalValue.toFixed(2)}`);
}

/**
 * Example 7: Filter and collect results
 */
async function example7_filterAndCollect() {
  console.log('\nExample 7: Filter and Collect Results\n');

  const csvData = `name,age,department
Alice,30,Engineering
Bob,25,Sales
Charlie,35,Engineering
Diana,28,Marketing
Eve,32,Engineering`;

  const stream = Readable.from([csvData]);
  const parser = csv();

  const engineers: any[] = [];

  for await (const row of stream.pipe(parser)) {
    if (row.department === 'Engineering') {
      engineers.push(row);
    }
  }

  console.log(`Found ${engineers.length} engineers:`);
  engineers.forEach((eng) => {
    console.log(`  - ${eng.name}, age ${eng.age}`);
  });
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_basicParsing();

    // Wait a bit between examples for readability
    await new Promise((resolve) => setTimeout(resolve, 100));
    await example2_customOptions();

    await new Promise((resolve) => setTimeout(resolve, 100));
    await example3_skipAndTransform();

    await new Promise((resolve) => setTimeout(resolve, 100));
    await example4_errorHandling();

    await new Promise((resolve) => setTimeout(resolve, 100));
    await example5_headerTransform();

    await new Promise((resolve) => setTimeout(resolve, 100));
    await example6_asyncIteration();

    await new Promise((resolve) => setTimeout(resolve, 100));
    await example7_filterAndCollect();

    console.log('\n✓ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_basicParsing,
  example2_customOptions,
  example3_skipAndTransform,
  example4_errorHandling,
  example5_headerTransform,
  example6_asyncIteration,
  example7_filterAndCollect,
};
