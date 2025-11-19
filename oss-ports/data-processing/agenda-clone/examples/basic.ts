/**
 * Basic Agenda Example
 */

import Agenda from '../src';

async function main() {
  const agenda = new Agenda({
    processEvery: '5 seconds',
  });

  // Define jobs
  agenda.define('greet', async (job) => {
    const { name } = job.attrs.data;
    console.log(`Hello, ${name}!`);
  });

  agenda.define('log time', async () => {
    console.log('Current time:', new Date().toISOString());
  });

  // Start processing
  await agenda.start();

  // Schedule jobs
  await agenda.now('greet', { name: 'Alice' });
  await agenda.schedule('in 10 seconds', 'greet', { name: 'Bob' });
  await agenda.every('30 seconds', 'log time');

  console.log('Agenda started');
}

main().catch(console.error);
