# React Native Firebase - Elide Polyglot Showcase

> **One Firebase SDK for ALL languages** - TypeScript, Python, Ruby, and Java

Official React Native library for Firebase.

## Features

- Authentication
- Firestore database
- Cloud messaging
- Analytics
- Storage
- **~1M downloads/week on npm**

## Quick Start

```typescript
import { Auth, Firestore } from './elide-react-native-firebase.ts';

const auth = new Auth();
await auth.signInWithEmailAndPassword('user@example.com', 'password');

const firestore = new Firestore();
firestore.collection('users').doc('123').set({ name: 'John' });
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-firebase.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@react-native-firebase/app)

---

**Built with ❤️ for the Elide Polyglot Runtime**
