/**
 * CSV Stream Pipeline Examples
 *
 * Demonstrates advanced streaming patterns with CSV parsing
 */

import csv from '../index';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline, Transform } from 'node:stream';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';

const pipelineAsync = promisify(pipeline);

/**
 * Example 1: CSV to JSON Lines conversion
 */
async function example1_csvToJSONL() {
  console.log('Example 1: CSV to JSON Lines Pipeline\n');

  const csvData = `name,age,city
Alice,30,New York
Bob,25,San Francisco
Charlie,35,Boston`;

  const input = Readable.from([csvData]);

  // Transform to JSON Lines format
  const jsonlTransform = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      this.push(JSON.stringify(row) + '\n');
      callback();
    },
  });

  let output = '';
  const writeToString = new Transform({
    transform(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  await pipelineAsync(input, csv(), jsonlTransform, writeToString);

  console.log('Output (JSONL format):');
  console.log(output);
}

/**
 * Example 2: Filter and transform pipeline
 */
async function example2_filterTransform() {
  console.log('\nExample 2: Filter and Transform Pipeline\n');

  const csvData = `name,age,salary,department
Alice,30,75000,Engineering
Bob,25,45000,Sales
Charlie,35,95000,Engineering
Diana,28,55000,Marketing
Eve,32,85000,Engineering`;

  const input = Readable.from([csvData]);

  // Filter: Only engineering department
  const filterEngineering = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      if (row.department === 'Engineering') {
        this.push(row);
      }
      callback();
    },
  });

  // Transform: Calculate annual bonus (10% of salary)
  const calculateBonus = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      row.salary = parseFloat(row.salary);
      row.bonus = row.salary * 0.1;
      row.total_compensation = row.salary + row.bonus;
      this.push(row);
      callback();
    },
  });

  // Collect results
  const results: any[] = [];
  const collector = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      results.push(row);
      callback();
    },
  });

  await pipelineAsync(input, csv(), filterEngineering, calculateBonus, collector);

  console.log('Engineering Department Compensation:');
  results.forEach((emp) => {
    console.log(
      `  ${emp.name}: $${emp.salary.toLocaleString()} + $${emp.bonus.toLocaleString()} bonus = $${emp.total_compensation.toLocaleString()}`
    );
  });
}

/**
 * Example 3: Aggregation pipeline
 */
async function example3_aggregation() {
  console.log('\nExample 3: Aggregation Pipeline\n');

  const csvData = `product,category,sales,quarter
Widget,Electronics,25000,Q1
Gadget,Electronics,30000,Q1
Doohickey,Home,15000,Q1
Widget,Electronics,28000,Q2
Gadget,Electronics,35000,Q2
Doohickey,Home,18000,Q2`;

  const input = Readable.from([csvData]);

  // Aggregate by category
  const aggregateByCategory = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      row.sales = parseFloat(row.sales);
      this.push(row);
      callback();
    },
  });

  const categoryTotals = new Map<string, number>();
  const collector = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      const current = categoryTotals.get(row.category) || 0;
      categoryTotals.set(row.category, current + row.sales);
      callback();
    },
  });

  await pipelineAsync(input, csv(), aggregateByCategory, collector);

  console.log('Sales by Category:');
  for (const [category, total] of categoryTotals) {
    console.log(`  ${category}: $${total.toLocaleString()}`);
  }
}

/**
 * Example 4: Multi-stage transformation
 */
async function example4_multiStage() {
  console.log('\nExample 4: Multi-Stage Transformation Pipeline\n');

  const csvData = `date,product,quantity,unit_price
2024-01-01,Widget,10,19.99
2024-01-01,Gadget,5,29.99
2024-01-02,Widget,15,19.99
2024-01-02,Doohickey,20,9.99
2024-01-03,Gadget,8,29.99`;

  const input = Readable.from([csvData]);

  // Stage 1: Parse numbers and calculate total
  const parseAndCalculate = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      row.quantity = parseInt(row.quantity);
      row.unit_price = parseFloat(row.unit_price);
      row.total = row.quantity * row.unit_price;
      this.push(row);
      callback();
    },
  });

  // Stage 2: Add computed fields
  const addMetadata = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      row.date_obj = new Date(row.date);
      row.day_of_week = row.date_obj.toLocaleDateString('en-US', { weekday: 'long' });
      this.push(row);
      callback();
    },
  });

  // Stage 3: Format output
  const formatOutput = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      const line = `${row.day_of_week}, ${row.date}: ${row.quantity}× ${row.product} = $${row.total.toFixed(2)}\n`;
      this.push(line);
      callback();
    },
  });

  let output = '';
  const stringCollector = new Transform({
    transform(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  await pipelineAsync(input, csv(), parseAndCalculate, addMetadata, formatOutput, stringCollector);

  console.log('Formatted Output:');
  console.log(output);
}

/**
 * Example 5: Validation pipeline
 */
async function example5_validation() {
  console.log('\nExample 5: Validation Pipeline\n');

  const csvData = `email,age,phone
alice@example.com,30,555-1234
invalid-email,25,555-5678
bob@example.com,150,555-9012
charlie@example.com,35,555-3456`;

  const input = Readable.from([csvData]);

  const validRecords: any[] = [];
  const invalidRecords: any[] = [];

  // Validation transform
  const validate = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      const errors: string[] = [];

      // Validate email
      if (!row.email.includes('@')) {
        errors.push('Invalid email format');
      }

      // Validate age
      const age = parseInt(row.age);
      if (isNaN(age) || age < 0 || age > 120) {
        errors.push('Invalid age');
      }

      // Validate phone
      if (!/^\d{3}-\d{4}$/.test(row.phone)) {
        errors.push('Invalid phone format');
      }

      if (errors.length > 0) {
        invalidRecords.push({ ...row, errors });
      } else {
        validRecords.push(row);
      }

      callback();
    },
  });

  await pipelineAsync(input, csv(), validate);

  console.log(`Valid records: ${validRecords.length}`);
  validRecords.forEach((record) => {
    console.log(`  ✓ ${record.email}`);
  });

  console.log(`\nInvalid records: ${invalidRecords.length}`);
  invalidRecords.forEach((record) => {
    console.log(`  ✗ ${record.email}: ${record.errors.join(', ')}`);
  });
}

/**
 * Example 6: Batch processing pipeline
 */
async function example6_batchProcessing() {
  console.log('\nExample 6: Batch Processing Pipeline\n');

  const csvData = `id,value
1,100
2,200
3,300
4,400
5,500
6,600
7,700
8,800`;

  const input = Readable.from([csvData]);

  // Batch records in groups of 3
  const batcher = new Transform({
    objectMode: true,
    transform(row, encoding, callback) {
      if (!this.batch) this.batch = [];
      this.batch.push(row);

      if (this.batch.length >= 3) {
        this.push([...this.batch]);
        this.batch = [];
      }
      callback();
    },
    flush(callback) {
      // Flush remaining items
      if (this.batch && this.batch.length > 0) {
        this.push(this.batch);
      }
      callback();
    },
  });

  let batchNumber = 0;
  const processBatch = new Transform({
    objectMode: true,
    transform(batch, encoding, callback) {
      batchNumber++;
      console.log(`\nBatch ${batchNumber}:`);
      const sum = batch.reduce((acc: number, row: any) => acc + parseInt(row.value), 0);
      console.log(`  Records: ${batch.map((r: any) => r.id).join(', ')}`);
      console.log(`  Sum: ${sum}`);
      callback();
    },
  });

  await pipelineAsync(input, csv(), batcher, processBatch);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_csvToJSONL();
    await new Promise((resolve) => setTimeout(resolve, 100));

    await example2_filterTransform();
    await new Promise((resolve) => setTimeout(resolve, 100));

    await example3_aggregation();
    await new Promise((resolve) => setTimeout(resolve, 100));

    await example4_multiStage();
    await new Promise((resolve) => setTimeout(resolve, 100));

    await example5_validation();
    await new Promise((resolve) => setTimeout(resolve, 100));

    await example6_batchProcessing();

    console.log('\n✓ All pipeline examples completed successfully!');
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
  example1_csvToJSONL,
  example2_filterTransform,
  example3_aggregation,
  example4_multiStage,
  example5_validation,
  example6_batchProcessing,
};
