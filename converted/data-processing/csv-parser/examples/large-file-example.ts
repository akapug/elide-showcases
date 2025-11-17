/**
 * Large File Processing Examples
 *
 * Demonstrates efficient processing of large CSV files with Elide
 */

import csv from '../index';
import { createReadStream, createWriteStream, writeFileSync } from 'node:fs';
import { pipeline, Transform } from 'node:stream';
import { promisify } from 'node:util';

const pipelineAsync = promisify(pipeline);

/**
 * Generate a large test CSV file
 */
function generateLargeCSV(filename: string, rows: number = 1000000) {
  console.log(`Generating ${rows.toLocaleString()} row CSV file...`);
  const start = Date.now();

  // Write header
  let csv = 'id,name,email,age,city,salary,department,join_date,active\n';

  // Generate rows in batches to avoid memory issues
  const batchSize = 10000;
  const cities = ['New York', 'San Francisco', 'Boston', 'Seattle', 'Austin', 'Chicago'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'Support', 'Finance'];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

  for (let i = 0; i < rows; i++) {
    const name = names[i % names.length];
    const id = i + 1;
    const email = `${name.toLowerCase()}${id}@example.com`;
    const age = 22 + (i % 40);
    const city = cities[i % cities.length];
    const salary = 50000 + (i % 100000);
    const department = departments[i % departments.length];
    const joinDate = new Date(2015 + (i % 10), (i % 12), (i % 28) + 1).toISOString().split('T')[0];
    const active = i % 10 !== 0 ? 'true' : 'false';

    csv += `${id},${name},${email},${age},${city},${salary},${department},${joinDate},${active}\n`;

    // Write in batches
    if (i > 0 && i % batchSize === 0) {
      writeFileSync(filename, csv, { flag: i === batchSize ? 'w' : 'a' });
      csv = '';
    }
  }

  // Write remaining
  if (csv) {
    writeFileSync(filename, csv, { flag: 'a' });
  }

  const duration = Date.now() - start;
  console.log(`✓ Generated in ${duration}ms\n`);
}

/**
 * Example 1: Stream large file with minimal memory
 */
async function example1_streamLargeFile() {
  console.log('Example 1: Stream Large File Processing\n');

  const filename = '/tmp/large-data.csv';
  generateLargeCSV(filename, 100000); // 100K rows

  console.log('Processing large file...');
  const start = Date.now();

  let rowCount = 0;
  let totalSalary = 0;

  await pipelineAsync(
    createReadStream(filename, { highWaterMark: 64 * 1024 }), // 64KB chunks
    csv({
      mapValues: ({ value, header }) => {
        if (header === 'salary' || header === 'age') return parseInt(value);
        if (header === 'active') return value === 'true';
        return value;
      },
    }),
    new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        rowCount++;
        totalSalary += row.salary;
        callback();
      },
    })
  );

  const duration = Date.now() - start;
  const avgSalary = totalSalary / rowCount;

  console.log(`✓ Processed ${rowCount.toLocaleString()} rows in ${duration}ms`);
  console.log(`  Throughput: ${Math.round(rowCount / (duration / 1000)).toLocaleString()} rows/second`);
  console.log(`  Average salary: $${Math.round(avgSalary).toLocaleString()}`);
  console.log(`  Memory used: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);
}

/**
 * Example 2: Filter large dataset
 */
async function example2_filterLargeDataset() {
  console.log('Example 2: Filter Large Dataset\n');

  const filename = '/tmp/large-data.csv';
  const outputFile = '/tmp/filtered-data.jsonl';

  console.log('Filtering high-salary engineering employees...');
  const start = Date.now();

  let totalRows = 0;
  let filteredRows = 0;

  await pipelineAsync(
    createReadStream(filename),
    csv({
      mapValues: ({ value, header }) => {
        if (header === 'salary' || header === 'age') return parseInt(value);
        if (header === 'active') return value === 'true';
        return value;
      },
    }),
    new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        totalRows++;

        // Filter: Engineering + Salary > 80000 + Active
        if (row.department === 'Engineering' && row.salary > 80000 && row.active) {
          filteredRows++;
          this.push(JSON.stringify(row) + '\n');
        }

        callback();
      },
    }),
    createWriteStream(outputFile)
  );

  const duration = Date.now() - start;

  console.log(`✓ Processed ${totalRows.toLocaleString()} rows in ${duration}ms`);
  console.log(`  Filtered to ${filteredRows.toLocaleString()} rows (${((filteredRows / totalRows) * 100).toFixed(1)}%)`);
  console.log(`  Output written to: ${outputFile}\n`);
}

/**
 * Example 3: Aggregate large dataset
 */
async function example3_aggregateLargeDataset() {
  console.log('Example 3: Aggregate Large Dataset\n');

  const filename = '/tmp/large-data.csv';

  console.log('Aggregating by department...');
  const start = Date.now();

  const departmentStats = new Map<
    string,
    {
      count: number;
      totalSalary: number;
      totalAge: number;
      activeCount: number;
    }
  >();

  let totalRows = 0;

  await pipelineAsync(
    createReadStream(filename),
    csv({
      mapValues: ({ value, header }) => {
        if (header === 'salary' || header === 'age') return parseInt(value);
        if (header === 'active') return value === 'true';
        return value;
      },
    }),
    new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        totalRows++;

        const dept = row.department;
        const stats = departmentStats.get(dept) || {
          count: 0,
          totalSalary: 0,
          totalAge: 0,
          activeCount: 0,
        };

        stats.count++;
        stats.totalSalary += row.salary;
        stats.totalAge += row.age;
        if (row.active) stats.activeCount++;

        departmentStats.set(dept, stats);
        callback();
      },
    })
  );

  const duration = Date.now() - start;

  console.log(`✓ Processed ${totalRows.toLocaleString()} rows in ${duration}ms`);
  console.log('\nDepartment Statistics:');

  for (const [dept, stats] of departmentStats) {
    const avgSalary = Math.round(stats.totalSalary / stats.count);
    const avgAge = Math.round(stats.totalAge / stats.count);
    const activePercent = ((stats.activeCount / stats.count) * 100).toFixed(1);

    console.log(`\n  ${dept}:`);
    console.log(`    Employees: ${stats.count.toLocaleString()}`);
    console.log(`    Avg Salary: $${avgSalary.toLocaleString()}`);
    console.log(`    Avg Age: ${avgAge}`);
    console.log(`    Active: ${activePercent}%`);
  }
}

/**
 * Example 4: Transform large file format
 */
async function example4_transformFormat() {
  console.log('\nExample 4: Transform Large File Format\n');

  const filename = '/tmp/large-data.csv';
  const outputFile = '/tmp/transformed-data.csv';

  console.log('Transforming CSV format...');
  const start = Date.now();

  let rowCount = 0;
  let headerWritten = false;

  await pipelineAsync(
    createReadStream(filename),
    csv({
      mapValues: ({ value, header }) => {
        if (header === 'salary' || header === 'age') return parseInt(value);
        if (header === 'active') return value === 'true';
        return value;
      },
    }),
    new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        rowCount++;

        // Write header on first row
        if (!headerWritten) {
          this.push('employee_id|full_name|email_address|annual_salary|location\n');
          headerWritten = true;
        }

        // Transform format: CSV to pipe-delimited with selected fields
        const line = [row.id, row.name, row.email, row.salary, row.city].join('|') + '\n';
        this.push(line);

        callback();
      },
    }),
    createWriteStream(outputFile)
  );

  const duration = Date.now() - start;

  console.log(`✓ Transformed ${rowCount.toLocaleString()} rows in ${duration}ms`);
  console.log(`  Throughput: ${Math.round(rowCount / (duration / 1000)).toLocaleString()} rows/second`);
  console.log(`  Output: ${outputFile}\n`);
}

/**
 * Example 5: Chunked processing with progress
 */
async function example5_chunkedWithProgress() {
  console.log('Example 5: Chunked Processing with Progress\n');

  const filename = '/tmp/large-data.csv';
  generateLargeCSV(filename, 500000); // 500K rows

  console.log('Processing with progress updates...\n');
  const start = Date.now();

  let rowCount = 0;
  const reportInterval = 50000;
  let lastReport = 0;

  await pipelineAsync(
    createReadStream(filename, { highWaterMark: 128 * 1024 }),
    csv({
      mapValues: ({ value, header }) => {
        if (header === 'salary' || header === 'age') return parseInt(value);
        return value;
      },
    }),
    new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        rowCount++;

        // Report progress
        if (rowCount - lastReport >= reportInterval) {
          const elapsed = Date.now() - start;
          const rate = Math.round(rowCount / (elapsed / 1000));
          console.log(`  Progress: ${rowCount.toLocaleString()} rows (${rate.toLocaleString()} rows/sec)`);
          lastReport = rowCount;
        }

        callback();
      },
    })
  );

  const duration = Date.now() - start;

  console.log(`\n✓ Completed ${rowCount.toLocaleString()} rows in ${duration}ms`);
  console.log(`  Average throughput: ${Math.round(rowCount / (duration / 1000)).toLocaleString()} rows/second`);
  console.log(`  Peak memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_streamLargeFile();
    await example2_filterLargeDataset();
    await example3_aggregateLargeDataset();
    await example4_transformFormat();
    await example5_chunkedWithProgress();

    console.log('\n✓ All large file examples completed successfully!');
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
  generateLargeCSV,
  example1_streamLargeFile,
  example2_filterLargeDataset,
  example3_aggregateLargeDataset,
  example4_transformFormat,
  example5_chunkedWithProgress,
};
