# React Native Biometrics - Elide Polyglot Showcase

> **One biometrics library for ALL languages** - TypeScript, Python, Ruby, and Java

Biometric authentication for React Native.

## Features

- Fingerprint authentication
- Face ID support
- TouchID support
- Biometric availability check
- Secure authentication
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { ReactNativeBiometrics } from './elide-react-native-biometrics.ts';

const biometrics = new ReactNativeBiometrics();
const result = await biometrics.simplePrompt({
  promptMessage: 'Authenticate',
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-biometrics.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-biometrics)

---

**Built with ❤️ for the Elide Polyglot Runtime**
