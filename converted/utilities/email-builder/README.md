# Email Builder - HTML Email Builder

Build responsive HTML emails easily.

Based on https://www.npmjs.com/package/email-builder (~20K+ downloads/week)

## Quick Start

```typescript
import EmailBuilder from './elide-email-builder.ts';

const email = new EmailBuilder()
  .setSubject('Welcome!')
  .setFrom('noreply@example.com')
  .addRecipient('user@example.com')
  .setHtml('<h1>Welcome</h1>')
  .build();
```
