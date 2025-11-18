# email-addresses - Elide Polyglot Showcase

> **One email parsing implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and validate email addresses with full RFC 5322 support - all in one polyglot implementation.

## 🌟 Why This Matters

In polyglot architectures, having **different email parsing implementations** in each language creates:
- ❌ Inconsistent email handling across services
- ❌ Multiple libraries to maintain
- ❌ Different parsing rules
- ❌ Integration headaches

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ RFC 5322 compliant parsing
- ✅ Extract email components (local, domain, name)
- ✅ Handle display names
- ✅ Parse email lists
- ✅ Format addresses
- ✅ Extract from text
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript

```typescript
import { parseOneAddress, parseAddressList } from './elide-email-addresses.ts';

// Parse single email
const addr = parseOneAddress('"John Doe" <john@example.com>');
// { local: 'john', domain: 'example.com', name: 'John Doe', address: 'john@example.com' }

// Parse multiple emails
const addrs = parseAddressList('alice@example.com, bob@test.org');
```

### Python

```python
from elide import require
email_addresses = require('./elide-email-addresses.ts')

# Parse email
addr = email_addresses.parseOneAddress('"John Doe" <john@example.com>')
print(addr.name, addr.address)
```

### Ruby

```ruby
email_addresses = Elide.require('./elide-email-addresses.ts')

# Parse email
addr = email_addresses.parseOneAddress('"John Doe" <john@example.com>')
puts "#{addr.name} <#{addr.address}>"
```

### Java

```java
Value module = context.eval("js", "require('./elide-email-addresses.ts')");
Value addr = module.getMember("parseOneAddress")
  .execute("\"John Doe\" <john@example.com>");
```

## 💡 Use Cases

### Email Client Development

```typescript
// Parse email headers
const from = parseOneAddress(headers.from);
const to = parseAddressList(headers.to);
const cc = parseAddressList(headers.cc);
```

### Contact List Processing

```typescript
// Extract and parse emails from contact list
const contacts = parseAddressList(contactString);
contacts.forEach(c => {
  console.log(`${c.name}: ${c.address}`);
});
```

## 📂 Files in This Showcase

- `elide-email-addresses.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

```bash
elide run elide-email-addresses.ts
```

## 📝 Package Stats

- **npm downloads**: 100K+/week
- **Use case**: Email parsing, contact management, mail systems
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One email parser to rule them all.*
