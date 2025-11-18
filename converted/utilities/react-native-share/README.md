# React Native Share - Elide Polyglot Showcase

> **One share API for ALL languages** - TypeScript, Python, Ruby, and Java

React Native Share for sharing content across apps.

## Features

- Share text, URLs, files
- Social media sharing
- Email and SMS
- Custom dialogs
- Cross-platform
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { open, shareSingle, Social } from './elide-react-native-share.ts';

await open({
  message: 'Check this out!',
  url: 'https://example.com',
});

await shareSingle({
  social: Social.FACEBOOK,
  url: 'https://example.com',
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-share.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-share)

---

**Built with ❤️ for the Elide Polyglot Runtime**
