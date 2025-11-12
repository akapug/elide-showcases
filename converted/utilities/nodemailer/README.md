# Nodemailer - Elide Polyglot Showcase

> **One email library for ALL languages**

## Quick Start

```typescript
import { createTransport } from './elide-nodemailer.ts';

const transporter = createTransport({
  host: 'smtp.example.com',
  port: 587,
  auth: { user: 'user@example.com', pass: 'pass' }
});

await transporter.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  text: 'Hello world!'
});
```

## Package Stats

- **npm downloads**: ~6M/week
- **Polyglot score**: 40/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
