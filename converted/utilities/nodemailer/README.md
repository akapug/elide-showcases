# Nodemailer - Email Sending Library - Elide Polyglot Showcase

> **One email sender for ALL languages** - TypeScript, Python, Ruby, and Java

Popular email sending library with support for SMTP and multiple transport methods across your entire polyglot stack.

## 🌟 Why This Matters

Different languages use different email libraries with inconsistent APIs:
- `smtplib` in Python has different API than nodemailer
- `mail` in Ruby requires different configuration
- `JavaMail` in Java is complex and ceremonial
- Each language has its own SMTP handling patterns

**Elide solves this** with ONE email library that works in ALL languages with a consistent API.

## ✨ Features

- ✅ Multiple transport methods (SMTP, sendmail)
- ✅ HTML and plain text emails
- ✅ Attachments support
- ✅ Embedded images
- ✅ CC/BCC support
- ✅ Custom headers
- ✅ Template support
- ✅ Unicode support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { createTransport } from './elide-nodemailer.ts';

const transporter = createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password'
  }
});

await transporter.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from Elide!',
  text: 'This is a test email',
  html: '<h1>Hello!</h1><p>This is a test email</p>'
});
```

### Python
```python
from elide import require
nodemailer = require('./elide-nodemailer.ts')

transporter = nodemailer.createTransport({
    'host': 'smtp.gmail.com',
    'port': 587,
    'auth': {
        'user': 'your-email@gmail.com',
        'pass': 'your-password'
    }
})

await transporter.sendMail({
    'from': 'sender@example.com',
    'to': 'recipient@example.com',
    'subject': 'Hello from Elide!',
    'text': 'This is a test email'
})
```

### Ruby
```ruby
nodemailer = Elide.require('./elide-nodemailer.ts')

transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password'
  }
})

transporter.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from Elide!',
  text: 'This is a test email'
}).await
```

### Java
```java
Value nodemailer = context.eval("js", "require('./elide-nodemailer.ts')");

Value transporter = nodemailer.invokeMember("createTransport", Map.of(
    "host", "smtp.gmail.com",
    "port", 587,
    "auth", Map.of("user", "your-email@gmail.com", "pass", "your-password")
));

Map<String, Object> mailOptions = Map.of(
    "from", "sender@example.com",
    "to", "recipient@example.com",
    "subject", "Hello from Elide!",
    "text", "This is a test email"
);

transporter.invokeMember("sendMail", mailOptions);
```

## 💡 Real-World Use Cases

### Password Reset Email
```typescript
await transporter.sendMail({
  from: 'noreply@example.com',
  to: user.email,
  subject: 'Password Reset Request',
  html: `
    <h1>Password Reset</h1>
    <p>Click the link below to reset your password:</p>
    <a href="https://example.com/reset/${token}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `
});
```

### Welcome Email
```typescript
await transporter.sendMail({
  from: 'welcome@example.com',
  to: newUser.email,
  subject: 'Welcome to Our Platform!',
  html: `
    <div style="font-family: Arial; padding: 20px;">
      <h1>Welcome ${newUser.name}!</h1>
      <p>Thank you for joining us.</p>
      <a href="https://example.com/dashboard" style="background: #4CAF50; color: white; padding: 10px 20px;">
        Get Started
      </a>
    </div>
  `
});
```

### Multiple Recipients
```typescript
await transporter.sendMail({
  from: 'notifications@example.com',
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@example.com',
  bcc: 'archive@example.com',
  subject: 'Weekly Report',
  text: 'Here is your weekly report...'
});
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different email libraries

```
Node.js: nodemailer, sendmail
Python: smtplib, yagmail
Ruby: mail, pony
Java: JavaMail, Apache Commons Email

Result:
❌ Different APIs to learn
❌ Inconsistent SMTP handling
❌ Multiple email configurations
❌ Duplicated email templates
```

### The Solution
**After**: One Elide email sender for all languages

```
┌────────────────────────────────┐
│  Elide Nodemailer (TypeScript)│
│  elide-nodemailer.ts          │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ One email library
✅ One API to learn
✅ Consistent everywhere
```

## 📖 API Reference

### `createTransport(options)`
Create email transporter with SMTP configuration

### `transporter.sendMail(mailOptions)`
Send email with specified options

### `transporter.verify()`
Verify SMTP connection

## 🧪 Testing

```bash
elide run elide-nodemailer.ts
```

## 📂 Files

- `elide-nodemailer.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm nodemailer package](https://www.npmjs.com/package/nodemailer)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~30M/week
- **Use case**: Email sending via SMTP
- **Elide advantage**: One email library for all languages
- **Polyglot score**: 46/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One email sender to rule them all.*
