# React Native Permissions - Elide Polyglot Showcase

> **One permissions library for ALL languages** - TypeScript, Python, Ruby, and Java

Unified permissions API for React Native.

## Features

- Camera, location, microphone permissions
- Cross-platform API
- Permission status checking
- Request permissions
- Open settings
- **~800K downloads/week on npm**

## Quick Start

```typescript
import { check, request, PERMISSIONS, RESULTS } from './elide-react-native-permissions.ts';

const status = await check(PERMISSIONS.IOS_CAMERA);
if (status !== RESULTS.GRANTED) {
  await request(PERMISSIONS.IOS_CAMERA);
}
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-permissions.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-permissions)

---

**Built with ❤️ for the Elide Polyglot Runtime**
