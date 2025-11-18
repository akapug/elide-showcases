/**
 * Basic split2 Usage Examples
 *
 * Demonstrates common use cases for line splitting with Elide
 */

import split2 from '../index';
import { Readable } from 'node:stream';

/**
 * Example 1: Basic line splitting
 */
async function example1_basicSplitting() {
  console.log('Example 1: Basic Line Splitting\n');

  const text = `Line 1
Line 2
Line 3
Line 4`;

  const stream = Readable.from([text]);
  const lines: string[] = [];

  for await (const line of stream.pipe(split2())) {
    lines.push(line);
    console.log(`Got line: "${line}"`);
  }

  console.log(`\nTotal lines: ${lines.length}`);
}

/**
 * Example 2: Custom delimiter
 */
async function example2_customDelimiter() {
  console.log('\nExample 2: Custom Delimiter\n');

  const text = 'field1|field2|field3|field4';

  const stream = Readable.from([text]);

  console.log('Splitting by "|":');
  for await (const part of stream.pipe(split2('|'))) {
    console.log(`  - ${part}`);
  }
}

/**
 * Example 3: Regex delimiter
 */
async function example3_regexDelimiter() {
  console.log('\nExample 3: Regex Delimiter\n');

  const text = `Line 1\r\nLine 2\nLine 3\r\nLine 4`;

  const stream = Readable.from([text]);

  console.log('Splitting by /\\r?\\n/ (handles both \\n and \\r\\n):');
  for await (const line of stream.pipe(split2(/\r?\n/))) {
    console.log(`  - "${line}"`);
  }
}

/**
 * Example 4: With mapper function (JSON parsing)
 */
async function example4_withMapper() {
  console.log('\nExample 4: With Mapper Function (JSON Parsing)\n');

  const jsonl = `{"id":1,"name":"Alice"}
{"id":2,"name":"Bob"}
{"id":3,"name":"Charlie"}`;

  const stream = Readable.from([jsonl]);

  console.log('Parsing JSONL:');
  for await (const obj of stream.pipe(split2(JSON.parse))) {
    console.log(`  ID ${obj.id}: ${obj.name}`);
  }
}

/**
 * Example 5: Skip empty lines
 */
async function example5_skipEmpty() {
  console.log('\nExample 5: Skip Empty Lines\n');

  const text = `Line 1

Line 2


Line 3`;

  const stream = Readable.from([text]);

  console.log('Without skipEmpty:');
  for await (const line of stream.pipe(split2())) {
    console.log(`  "${line}"`);
  }

  const stream2 = Readable.from([text]);

  console.log('\nWith skipEmpty:');
  for await (const line of stream2.pipe(split2({ skipEmpty: true }))) {
    console.log(`  "${line}"`);
  }
}

/**
 * Example 6: Max line length
 */
async function example6_maxLength() {
  console.log('\nExample 6: Max Line Length\n');

  const text = `Short line
${'x'.repeat(100)}
Another short line`;

  const stream = Readable.from([text]);

  console.log('With maxLength: 50');
  stream
    .pipe(split2({ maxLength: 50 }))
    .on('data', (line) => {
      console.log(`  Got line (${line.length} chars): ${line.substring(0, 20)}...`);
    })
    .on('error', (err) => {
      console.error(`  Error: ${err.message}`);
    })
    .on('end', () => {
      console.log('  Done');
    });
}

/**
 * Example 7: Transform lines
 */
async function example7_transform() {
  console.log('\nExample 7: Transform Lines\n');

  const text = `hello
world
foo
bar`;

  const stream = Readable.from([text]);

  console.log('Transforming to uppercase:');
  for await (const line of stream.pipe(split2((line) => line.toUpperCase()))) {
    console.log(`  ${line}`);
  }
}

/**
 * Example 8: Parse CSV-like data
 */
async function example8_parseCSV() {
  console.log('\nExample 8: Parse CSV-like Data\n');

  const csv = `Alice,30,Engineer
Bob,25,Designer
Charlie,35,Manager`;

  const stream = Readable.from([csv]);

  console.log('Parsing CSV:');
  for await (const row of stream.pipe(
    split2((line) => {
      const [name, age, role] = line.split(',');
      return { name, age: parseInt(age), role };
    })
  )) {
    console.log(`  ${row.name} (${row.age}): ${row.role}`);
  }
}

/**
 * Example 9: Filter lines
 */
async function example9_filterLines() {
  console.log('\nExample 9: Filter Lines\n');

  const text = `# Comment 1
Data line 1
# Comment 2
Data line 2
Data line 3
# Comment 3`;

  const stream = Readable.from([text]);

  console.log('Filtering out comments:');
  for await (const line of stream.pipe(split2())) {
    if (!line.startsWith('#')) {
      console.log(`  ${line}`);
    }
  }
}

/**
 * Example 10: Count lines
 */
async function example10_countLines() {
  console.log('\nExample 10: Count Lines\n');

  const text = `Line 1
Line 2
Line 3
Line 4
Line 5`;

  const stream = Readable.from([text]);
  const splitter = split2();

  let count = 0;
  for await (const line of stream.pipe(splitter)) {
    count++;
  }

  console.log(`Total lines: ${count}`);
  console.log(`Line count from splitter: ${splitter.getLineCount()}`);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_basicSplitting();
    await example2_customDelimiter();
    await example3_regexDelimiter();
    await example4_withMapper();
    await example5_skipEmpty();

    // Wait for async example to complete
    await new Promise((resolve) => {
      example6_maxLength().then(resolve);
      setTimeout(resolve, 100);
    });

    await example7_transform();
    await example8_parseCSV();
    await example9_filterLines();
    await example10_countLines();

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
  example1_basicSplitting,
  example2_customDelimiter,
  example3_regexDelimiter,
  example4_withMapper,
  example5_skipEmpty,
  example6_maxLength,
  example7_transform,
  example8_parseCSV,
  example9_filterLines,
  example10_countLines,
};
