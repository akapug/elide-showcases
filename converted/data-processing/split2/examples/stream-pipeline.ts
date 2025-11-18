/**
 * split2 Stream Pipeline Examples
 */

import split2 from '../index';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

async function example1_logProcessing() {
  console.log('Example 1: Log File Processing\n');

  const logs = `2024-01-15 10:30:00 INFO Server started
2024-01-15 10:30:01 ERROR Failed to connect
2024-01-15 10:30:02 INFO Request received
2024-01-15 10:30:03 ERROR Database timeout`;

  const input = Readable.from([logs]);

  await pipeline(
    input,
    split2(),
    new Transform({
      objectMode: true,
      transform(line, enc, callback) {
        const [date, time, level, ...msg] = line.split(' ');
        if (level === 'ERROR') {
          console.log(`[ERROR] ${date} ${time}: ${msg.join(' ')}`);
        }
        callback();
      },
    })
  );
}

async function example2_jsonlPipeline() {
  console.log('\nExample 2: JSONL Pipeline\n');

  const jsonl = `{"id":1,"value":100}
{"id":2,"value":200}
{"id":3,"value":150}`;

  const input = Readable.from([jsonl]);
  let total = 0;

  await pipeline(
    input,
    split2(JSON.parse),
    new Transform({
      objectMode: true,
      transform(obj, enc, callback) {
        total += obj.value;
        callback();
      },
    })
  );

  console.log(`Total value: ${total}`);
}

async function runAllExamples() {
  try {
    await example1_logProcessing();
    await example2_jsonlPipeline();
    console.log('\n✓ All examples completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllExamples();
}
