/**
 * Cron Tests
 */

import cron, { validate } from '../src';

describe('Cron', () => {
  afterEach(() => {
    const tasks = cron.getTasks();
    for (const task of tasks.values()) {
      task.destroy();
    }
  });

  test('should validate cron expressions', () => {
    expect(validate('* * * * *')).toBe(true);
    expect(validate('0 0 * * *')).toBe(true);
    expect(validate('invalid')).toBe(false);
  });

  test('should schedule tasks', (done) => {
    let executed = false;

    const task = cron.schedule('* * * * * *', () => {
      executed = true;
      task.destroy();
      expect(executed).toBe(true);
      done();
    });
  });

  test('should start and stop tasks', () => {
    const task = cron.schedule('* * * * *', () => {});

    expect(task.getStatus()).toBe('running');

    task.stop();
    expect(task.getStatus()).toBe('stopped');

    task.start();
    expect(task.getStatus()).toBe('running');

    task.destroy();
  });
});
