# React Native - Elide Polyglot Showcase

> **One mobile framework for ALL languages** - TypeScript, Python, Ruby, and Java

Build native mobile apps using JavaScript and React.

## Features

- Native mobile components (View, Text, Image, etc.)
- Cross-platform (iOS & Android)
- Hot reloading
- Native module integration
- Flexbox layout
- Touch handling
- **~10M downloads/week on npm**

## Quick Start

```typescript
import { View, Text, StyleSheet, TouchableOpacity } from './elide-react-native.ts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

const view = new View({ style: styles.container });
const text = new Text({ children: 'Hello, React Native!' });
```

## Polyglot Examples

```python
# Python usage (via Elide)
from elide_react_native import View, Text, StyleSheet

view = View(style={"flex": 1})
text = Text(children="Hello from Python!")
```

```ruby
# Ruby usage (via Elide)
require 'elide_react_native'

view = View.new(style: { flex: 1 })
text = Text.new(children: "Hello from Ruby!")
```

## Documentation

Run the demo:

```bash
elide run elide-react-native.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native)
- [React Native Docs](https://reactnative.dev/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
