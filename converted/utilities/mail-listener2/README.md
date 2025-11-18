# Mail Listener2 - IMAP Email Listener

Listen for new emails via IMAP.

Based on https://www.npmjs.com/package/mail-listener2 (~50K+ downloads/week)

## Quick Start

```typescript
import MailListener from './elide-mail-listener2.ts';

const listener = new MailListener({
  username: "user@example.com",
  password: "password",
  host: "imap.example.com"
});

listener.start();
listener.on('mail', (mail) => console.log(mail));
```
