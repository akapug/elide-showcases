# React Native Keychain - Elide Polyglot Showcase

> **One secure storage for ALL languages** - TypeScript, Python, Ruby, and Java

Keychain Access for React Native.

## Features

- Secure credential storage
- Biometric authentication
- Keychain access
- Encryption
- Cross-platform
- **~300K downloads/week on npm**

## Quick Start

```typescript
import { setGenericPassword, getGenericPassword } from './elide-react-native-keychain.ts';

await setGenericPassword('user@example.com', 'password123');
const credentials = await getGenericPassword();
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-keychain.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-keychain)

---

**Built with ❤️ for the Elide Polyglot Runtime**
