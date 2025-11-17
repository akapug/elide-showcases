/**
 * Agenda Tests
 */

import Agenda from '../src';

describe('Agenda', () => {
  let agenda: Agenda;

  beforeEach(() => {
    agenda = new Agenda();
  });

  afterEach(async () => {
    await agenda.close();
  });

  test('should define and run jobs', async () => {
    let executed = false;

    agenda.define('test job', async () => {
      executed = true;
    });

    await agenda.start();
    await agenda.now('test job');

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(executed).toBe(true);
  });

  test('should schedule jobs', async () => {
    const job = agenda.create('test', { value: 123 });
    await job.save();

    const jobs = await agenda.jobs({ name: 'test' });

    expect(jobs.length).toBe(1);
    expect(jobs[0].attrs.data.value).toBe(123);
  });
});
