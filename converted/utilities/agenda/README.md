# Agenda - Elide Polyglot Showcase

> **One job scheduler for ALL languages**

## Quick Start

```typescript
import Agenda from './elide-agenda.ts';

const agenda = new Agenda({
  db: { address: 'mongodb://localhost:27017/agenda' }
});

// Define job
agenda.define('send-email', async (job) => {
  console.log('Sending email to:', job.attrs.to);
});

await agenda.start();

// Schedule jobs
await agenda.every('5 minutes', 'send-email', { to: 'user@example.com' });
await agenda.schedule('in 10 minutes', 'cleanup');
await agenda.now('send-email', { to: 'admin@example.com' });
```

## Package Stats

- **npm downloads**: ~200K/week
- **Polyglot score**: 39/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
