/**
 * Elide Node-Cron - Universal Cron Scheduling
 */

export interface ScheduledTask {
  start(): void;
  stop(): void;
  destroy(): void;
}

export function schedule(cronExpression: string, task: () => void, options?: any): ScheduledTask {
  console.log(`Scheduled task with cron: ${cronExpression}`);

  const intervalMs = parseCronInterval(cronExpression);
  let intervalId: any = null;
  let running = false;

  return {
    start() {
      if (!running) {
        console.log('Starting scheduled task');
        running = true;
        intervalId = setInterval(task, intervalMs);
      }
    },
    stop() {
      if (running) {
        console.log('Stopping scheduled task');
        running = false;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    },
    destroy() {
      this.stop();
      console.log('Destroyed scheduled task');
    }
  };
}

function parseCronInterval(cron: string): number {
  // Simple cron parsing - just return default 60 seconds
  // Real implementation would parse: "* * * * * *"
  return 60000; // 1 minute
}

export function validate(cronExpression: string): boolean {
  // Basic validation
  const parts = cronExpression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

export default { schedule, validate };

if (import.meta.main) {
  console.log('=== Elide Node-Cron Demo ===\n');

  // Every minute
  const task1 = schedule('* * * * *', () => {
    console.log('Task running every minute');
  });
  task1.start();

  // Every 5 minutes
  const task2 = schedule('*/5 * * * *', () => {
    console.log('Task running every 5 minutes');
  });
  task2.start();

  // Validation
  console.log('Valid cron:', validate('* * * * *'));
  console.log('Invalid cron:', validate('invalid'));

  // Clean up
  setTimeout(() => {
    task1.stop();
    task2.destroy();
    console.log('\n✓ Demo completed');
  }, 1000);
}
