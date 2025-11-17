/**
 * Basic through2 Usage Examples
 */

import through2, { map, filter, batch } from '../index';
import { Readable } from 'node:stream';

async function example1_basicTransform() {
  console.log('Example 1: Basic Transform\n');

  const input = ['hello', 'world', 'foo', 'bar'];
  const stream = Readable.from(input);

  for await (const item of stream.pipe(
    through2.obj(function (str, enc, callback) {
      this.push(str.toUpperCase());
      callback();
    })
  )) {
    console.log(item);
  }
}

async function example2_mapHelper() {
  console.log('\nExample 2: Map Helper\n');

  const numbers = [1, 2, 3, 4, 5];
  const stream = Readable.from(numbers);

  for await (const squared of stream.pipe(map((n) => n * n))) {
    console.log(`Squared: ${squared}`);
  }
}

async function example3_filterHelper() {
  console.log('\nExample 3: Filter Helper\n');

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const stream = Readable.from(numbers);

  console.log('Even numbers:');
  for await (const even of stream.pipe(filter((n) => n % 2 === 0))) {
    console.log(even);
  }
}

async function example4_batchHelper() {
  console.log('\nExample 4: Batch Helper\n');

  const items = [1, 2, 3, 4, 5, 6, 7];
  const stream = Readable.from(items);

  let batchNum = 0;
  for await (const batch of stream.pipe(batch(3))) {
    console.log(`Batch ${++batchNum}:`, batch);
  }
}

async function example5_withFlush() {
  console.log('\nExample 5: With Flush Function\n');

  const numbers = [1, 2, 3];
  const stream = Readable.from(numbers);

  for await (const item of stream.pipe(
    through2.obj(
      function (num, enc, callback) {
        this.push(num);
        callback();
      },
      function (callback) {
        console.log('Flushing...');
        this.push('END');
        callback();
      }
    )
  )) {
    console.log(item);
  }
}

async function example6_objectTransform() {
  console.log('\nExample 6: Object Transform\n');

  const users = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 },
  ];

  const stream = Readable.from(users);

  for await (const user of stream.pipe(
    through2.obj(function (user, enc, callback) {
      user.canVote = user.age >= 18;
      user.ageGroup = user.age < 30 ? 'young' : 'adult';
      this.push(user);
      callback();
    })
  )) {
    console.log(`${user.name}: ${user.ageGroup}, can vote: ${user.canVote}`);
  }
}

async function runAllExamples() {
  try {
    await example1_basicTransform();
    await example2_mapHelper();
    await example3_filterHelper();
    await example4_batchHelper();
    await example5_withFlush();
    await example6_objectTransform();

    console.log('\n✓ All examples completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllExamples();
}
