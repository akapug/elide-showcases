# Expo - Elide Polyglot Showcase

> **One mobile development platform for ALL languages** - TypeScript, Python, Ruby, and Java

A framework and platform for universal React applications.

## Features

- Managed workflow for React Native
- Over-the-air updates
- Native APIs (Camera, Location, etc.)
- Development tools (DevTools, hot reload)
- Cross-platform (iOS, Android, Web)
- Built-in UI components
- **~5M downloads/week on npm**

## Quick Start

```typescript
import { Constants, FileSystem, Location } from './elide-expo.ts';

console.log('Expo version:', Constants.expoVersion);

// File operations
await FileSystem.writeAsStringAsync(
  FileSystem.documentDirectory + 'test.txt',
  'Hello, Expo!'
);

// Location
const position = await Location.getCurrentPositionAsync();
console.log('Location:', position.coords);
```

## Polyglot Examples

```python
# Python usage (via Elide)
from elide_expo import Constants, FileSystem

print(f"Expo version: {Constants.expoVersion}")
FileSystem.writeAsStringAsync(
  FileSystem.documentDirectory + "test.txt",
  "Hello from Python!"
)
```

```ruby
# Ruby usage (via Elide)
require 'elide_expo'

puts "Expo version: #{Constants.expoVersion}"
```

## Documentation

Run the demo:

```bash
elide run elide-expo.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/expo)
- [Expo Docs](https://docs.expo.dev/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
