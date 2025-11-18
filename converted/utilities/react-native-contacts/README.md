# React Native Contacts - Elide Polyglot Showcase

> **One contacts library for ALL languages** - TypeScript, Python, Ruby, and Java

Access device contacts in React Native.

## Features

- Get all contacts
- Search contacts
- Add/update/delete
- Phone numbers, emails
- Photos
- **~150K downloads/week on npm**

## Quick Start

```typescript
import { getAll, addContact } from './elide-react-native-contacts.ts';

const contacts = await getAll();
console.log(contacts);

const newContact = await addContact({
  givenName: 'John',
  familyName: 'Doe',
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-contacts.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-contacts)

---

**Built with ❤️ for the Elide Polyglot Runtime**
