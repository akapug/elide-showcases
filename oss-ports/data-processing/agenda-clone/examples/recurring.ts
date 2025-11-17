/**
 * Recurring Jobs Example
 */

import Agenda from '../src';

async function main() {
  const agenda = new Agenda({
    processEvery: '10 seconds',
  });

  // Define jobs
  agenda.define('send-newsletter', async (job) => {
    const { subscribers } = job.attrs.data;
    console.log(`\n[${new Date().toISOString()}] Sending newsletter to ${subscribers} subscribers`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Newsletter sent successfully');
  });

  agenda.define('backup-database', {
    priority: 'high',
    concurrency: 1,
  }, async (job) => {
    console.log(`\n[${new Date().toISOString()}] Starting database backup...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Database backup completed');
  });

  agenda.define('cleanup-logs', async (job) => {
    const { olderThan } = job.attrs.data;
    console.log(`\n[${new Date().toISOString()}] Cleaning up logs older than ${olderThan} days`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const deleted = Math.floor(Math.random() * 1000);
    console.log(`Deleted ${deleted} log entries`);
  });

  agenda.define('health-check', async (job) => {
    console.log(`\n[${new Date().toISOString()}] Running health check...`);
    const services = ['database', 'cache', 'api'];
    const results: Record<string, string> = {};

    for (const service of services) {
      results[service] = Math.random() > 0.1 ? 'healthy' : 'degraded';
    }

    console.log('Health check results:', results);
  });

  agenda.define('generate-report', {
    priority: 'high',
  }, async (job) => {
    const { reportType } = job.attrs.data;
    console.log(`\n[${new Date().toISOString()}] Generating ${reportType} report...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`${reportType} report generated`);
  });

  // Event listeners
  agenda.on('start', (job) => {
    console.log(`Job "${job.attrs.name}" starting...`);
  });

  agenda.on('complete', (job) => {
    console.log(`Job "${job.attrs.name}" completed`);
  });

  agenda.on('success', (job) => {
    console.log(`Job "${job.attrs.name}" succeeded`);
  });

  agenda.on('fail', (error, job) => {
    console.error(`Job "${job.attrs.name}" failed:`, error.message);
  });

  // Start agenda
  await agenda.start();
  console.log('Agenda started\n');

  // Schedule recurring jobs
  console.log('Scheduling recurring jobs...\n');

  // Every 30 seconds
  await agenda.every('30 seconds', 'health-check');

  // Every minute
  await agenda.every('1 minute', 'cleanup-logs', {
    olderThan: 7,
  });

  // Every 5 minutes
  await agenda.every('5 minutes', 'send-newsletter', {
    subscribers: 1000,
  });

  // Every 15 minutes
  await agenda.every('15 minutes', 'generate-report', {
    reportType: 'analytics',
  });

  // Daily at midnight (simulated with cron)
  await agenda.every('0 0 * * *', 'backup-database');

  // Get all jobs
  const jobs = await agenda.jobs();
  console.log(`\nScheduled ${jobs.length} jobs\n`);

  jobs.forEach(job => {
    console.log(`- ${job.attrs.name}: Next run at ${job.attrs.nextRunAt}`);
  });

  // Run for 5 minutes then stop
  console.log('\nRunning for 5 minutes...\n');

  setTimeout(async () => {
    console.log('\nStopping agenda...');

    const finalJobs = await agenda.jobs();
    console.log(`\nTotal jobs: ${finalJobs.length}`);

    await agenda.stop();
    console.log('Agenda stopped');
    process.exit(0);
  }, 300000);

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await agenda.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully');
    await agenda.stop();
    process.exit(0);
  });
}

main().catch(console.error);
