# SendGrid - Email Delivery Service Client - Elide Polyglot Showcase

> **One SendGrid client for ALL languages** - TypeScript, Python, Ruby, and Java

Official SendGrid client for sending transactional and marketing emails across your entire polyglot stack.

## 🌟 Why This Matters

Different languages use different SendGrid SDKs with inconsistent APIs:
- `sendgrid-python` has different API than Node.js version
- `sendgrid-ruby` requires different configuration
- Java SendGrid SDK is verbose and ceremonial
- Each language has its own template handling

**Elide solves this** with ONE SendGrid client that works in ALL languages with a consistent API.

## ✨ Features

- ✅ REST API integration
- ✅ Transactional emails
- ✅ Dynamic template support
- ✅ Multiple recipients
- ✅ Attachments support
- ✅ Categories and custom args
- ✅ Send time optimization
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { setApiKey, send } from './elide-sendgrid.ts';

setApiKey('SG.your-api-key-here');

await send({
  to: 'recipient@example.com',
  from: 'sender@example.com',
  subject: 'Hello from SendGrid!',
  text: 'This is a test email',
  html: '<h1>Hello!</h1>'
});
```

### Python
```python
from elide import require
sendgrid = require('./elide-sendgrid.ts')

sendgrid.setApiKey('SG.your-api-key-here')

await sendgrid.send({
    'to': 'recipient@example.com',
    'from': 'sender@example.com',
    'subject': 'Hello from SendGrid!',
    'text': 'This is a test email'
})
```

### Ruby
```ruby
sendgrid = Elide.require('./elide-sendgrid.ts')

sendgrid.setApiKey('SG.your-api-key-here')

sendgrid.send({
  to: 'recipient@example.com',
  from: 'sender@example.com',
  subject: 'Hello from SendGrid!',
  text: 'This is a test email'
}).await
```

### Java
```java
Value sendgrid = context.eval("js", "require('./elide-sendgrid.ts')");

sendgrid.invokeMember("setApiKey", "SG.your-api-key-here");

Map<String, Object> mailData = Map.of(
    "to", "recipient@example.com",
    "from", "sender@example.com",
    "subject", "Hello from SendGrid!",
    "text", "This is a test email"
);

sendgrid.invokeMember("send", mailData);
```

## 💡 Real-World Use Cases

### Dynamic Templates
```typescript
await send({
  to: 'user@example.com',
  from: 'noreply@example.com',
  templateId: 'd-1234567890abcdef',
  dynamicTemplateData: {
    name: 'John Doe',
    verificationUrl: 'https://example.com/verify/abc123',
    expiresIn: '24 hours'
  }
});
```

### Bulk Email
```typescript
await send([
  {
    to: 'user1@example.com',
    from: 'newsletter@example.com',
    subject: 'Newsletter #1',
    html: '<h1>Newsletter</h1>'
  },
  {
    to: 'user2@example.com',
    from: 'newsletter@example.com',
    subject: 'Newsletter #1',
    html: '<h1>Newsletter</h1>'
  }
]);
```

## 📖 API Reference

### `setApiKey(apiKey: string)`
Set SendGrid API key

### `send(mailData: MailData)`
Send email via SendGrid

### `SendGridClient.send(mailData)`
Send email using client instance

## 🧪 Testing

```bash
elide run elide-sendgrid.ts
```

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Email delivery via SendGrid API
- **Elide advantage**: One SendGrid client for all languages
- **Polyglot score**: 45/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
