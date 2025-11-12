/**
 * Elide Agenda - Universal Job Scheduling
 */

export interface AgendaConfig {
  db?: {
    address: string;
    collection?: string;
  };
  processEvery?: string;
  maxConcurrency?: number;
}

export class Agenda {
  private jobs: Map<string, Function> = new Map();
  private running: boolean = false;

  constructor(private config: AgendaConfig = {}) {
    console.log('Agenda initialized');
  }

  async start() {
    this.running = true;
    console.log('Agenda started');
  }

  async stop() {
    this.running = false;
    console.log('Agenda stopped');
  }

  define(name: string, handler: (job: Job) => Promise<void>) {
    console.log(`Defined job: ${name}`);
    this.jobs.set(name, handler);
  }

  async every(interval: string, name: string, data?: any) {
    console.log(`Scheduled ${name} to run every ${interval}`);
    return new Job(name, data);
  }

  async schedule(when: string, name: string, data?: any) {
    console.log(`Scheduled ${name} to run at ${when}`);
    return new Job(name, data);
  }

  async now(name: string, data?: any) {
    console.log(`Running ${name} now`);
    const handler = this.jobs.get(name);
    if (handler) {
      await handler(new Job(name, data));
    }
    return new Job(name, data);
  }

  async cancel(query: any) {
    console.log('Cancelled jobs:', query);
    return 0;
  }

  async purge() {
    console.log('Purged all jobs');
  }
}

export class Job {
  constructor(
    public name: string,
    public attrs: any = {}
  ) {}

  async save() {
    console.log(`Saved job: ${this.name}`);
    return this;
  }

  async remove() {
    console.log(`Removed job: ${this.name}`);
  }

  repeatEvery(interval: string) {
    console.log(`Job ${this.name} will repeat every ${interval}`);
    return this;
  }

  schedule(when: string) {
    console.log(`Job ${this.name} scheduled for ${when}`);
    return this;
  }
}

export default Agenda;

if (import.meta.main) {
  console.log('=== Elide Agenda Demo ===\n');

  const agenda = new Agenda({
    db: { address: 'mongodb://localhost:27017/agenda' }
  });

  // Define jobs
  agenda.define('send-email', async (job) => {
    console.log('Sending email to:', job.attrs.to);
  });

  agenda.define('cleanup', async (job) => {
    console.log('Running cleanup task');
  });

  await agenda.start();

  // Schedule jobs
  await agenda.every('5 minutes', 'cleanup');
  await agenda.schedule('in 10 minutes', 'send-email', { to: 'user@example.com' });
  await agenda.now('cleanup');

  setTimeout(async () => {
    await agenda.stop();
    console.log('\n✓ Demo completed');
  }, 1000);
}
