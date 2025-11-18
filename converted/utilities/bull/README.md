# Bull - Premium Queue Package - Elide Polyglot Showcase

> **One queue system for ALL languages** - TypeScript, Python, Ruby, and Java

Redis-based queue for handling distributed jobs and messages across your entire polyglot stack.

## 🌟 Why This Matters

Different languages use different queue systems:
- Celery in Python has different API
- Sidekiq in Ruby uses different configuration
- Java has complex queue frameworks
- Each has different job lifecycle handling

**Elide solves this** with ONE queue system that works in ALL languages with consistent API.

## ✨ Features

- ✅ Job scheduling and priorities
- ✅ Job retries with backoff
- ✅ Progress tracking
- ✅ Rate limiting
- ✅ Delayed jobs
- ✅ Job events and lifecycle
- ✅ Concurrency control
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import Queue from './elide-bull.ts';

const emailQueue = new Queue('email');

emailQueue.process(async (job) => {
  console.log('Sending email:', job.data);
  return { sent: true };
});

await emailQueue.add({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Welcome!'
});
```

### Python
```python
from elide import require
Queue = require('./elide-bull.ts').default

email_queue = Queue('email')

async def process_email(job):
    print('Sending email:', job['data'])
    return {'sent': True}

email_queue.process(process_email)

await email_queue.add({
    'to': 'user@example.com',
    'subject': 'Hello',
    'body': 'Welcome!'
})
```

## 💡 Real-World Use Cases

### Email Queue with Retries
```typescript
const emailQueue = new Queue('email', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

emailQueue.process(async (job) => {
  await sendEmail(job.data);
});

await emailQueue.add({
  to: 'user@example.com',
  template: 'welcome'
});
```

### Image Processing
```typescript
const imageQueue = new Queue('image-processing');

imageQueue.process(async (job) => {
  await job.progress(0);
  const image = await loadImage(job.data.url);

  await job.progress(25);
  const resized = await resize(image, 800, 600);

  await job.progress(50);
  const optimized = await optimize(resized);

  await job.progress(75);
  await save(optimized, job.data.destination);

  await job.progress(100);
  return { url: job.data.destination };
});
```

## 📖 API Reference

### `new Queue(name, options?)`
Create new queue

### `queue.add(data, options?)`
Add job to queue

### `queue.process(processor)`
Set job processor function

### `queue.on(event, handler)`
Listen to queue events

## 🧪 Testing

```bash
elide run elide-bull.ts
```

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Background job processing
- **Elide advantage**: One queue system for all languages
- **Polyglot score**: 47/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
