# React Native Vector Icons - Elide Polyglot Showcase

> **One icon library for ALL languages** - TypeScript, Python, Ruby, and Java

Customizable icons for React Native with support for multiple icon sets.

## Features

- 3000+ icons from multiple sets (FontAwesome, Ionicons, Material, etc.)
- Customizable size and color
- Icon button components
- Tab bar integration
- Custom icon fonts
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { FontAwesome, Ionicons, MaterialIcons } from './elide-react-native-vector-icons.ts';

const homeIcon = new FontAwesome({ name: 'home', size: 24, color: '#007AFF' });
const searchIcon = new Ionicons({ name: 'search', size: 24, color: '#000' });
const favIcon = new MaterialIcons({ name: 'favorite', size: 24, color: '#F44336' });

console.log(homeIcon.render());
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-vector-icons.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-vector-icons)
- [Icon Directory](https://oblador.github.io/react-native-vector-icons/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
