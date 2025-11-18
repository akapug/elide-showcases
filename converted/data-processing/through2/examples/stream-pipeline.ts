/**
 * through2 Stream Pipeline Examples
 */

import through2, { map, filter } from '../index';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

async function example1_dataProcessing() {
  console.log('Example 1: Data Processing Pipeline\n');

  const data = [
    { id: 1, value: 100, type: 'A' },
    { id: 2, value: 50, type: 'B' },
    { id: 3, value: 200, type: 'A' },
    { id: 4, value: 75, type: 'B' },
  ];

  const input = Readable.from(data);
  const results: any[] = [];

  await pipeline(
    input,
    filter((item) => item.type === 'A'),
    map((item) => ({ ...item, doubled: item.value * 2 })),
    through2.obj(function (item, enc, callback) {
      results.push(item);
      callback();
    })
  );

  console.log('Results:', results);
}

async function example2_validation() {
  console.log('\nExample 2: Validation Pipeline\n');

  const records = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: -5 },
    { name: 'Charlie', age: 150 },
    { name: 'Diana', age: 25 },
  ];

  const input = Readable.from(records);
  const valid: any[] = [];
  const invalid: any[] = [];

  await pipeline(
    input,
    through2.obj(function (record, enc, callback) {
      if (record.age >= 0 && record.age <= 120) {
        valid.push(record);
      } else {
        invalid.push(record);
      }
      callback();
    })
  );

  console.log('Valid:', valid);
  console.log('Invalid:', invalid);
}

async function runAllExamples() {
  try {
    await example1_dataProcessing();
    await example2_validation();
    console.log('\n✓ All examples completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllExamples();
}
