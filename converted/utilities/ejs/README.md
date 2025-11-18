# EJS - Embedded JavaScript Templates - Elide Polyglot Showcase

> **One template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Simple templating language that lets you generate HTML with plain JavaScript across your entire polyglot stack.

## 🌟 Why This Matters

Different languages use different template engines with different syntax:
- Jinja2 in Python uses {{ }}
- ERB in Ruby uses <% %>
- JSP in Java is verbose
- Each has different expression handling

**Elide solves this** with ONE template engine using familiar <%= %> syntax.

## ✨ Features

- ✅ Fast compilation and rendering
- ✅ Simple <%= %> syntax
- ✅ JavaScript expressions in templates
- ✅ Loops and conditionals
- ✅ Escaped and unescaped output
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { render } from './elide-ejs.ts';

const html = render('<h1>Hello <%= name %>!</h1>', { name: 'World' });
console.log(html); // <h1>Hello World!</h1>
```

### Python
```python
from elide import require
ejs = require('./elide-ejs.ts')

html = ejs.render('<h1>Hello <%= name %>!</h1>', {'name': 'World'})
print(html)
```

## 💡 Real-World Use Cases

### Email Template
```typescript
const template = `
<!DOCTYPE html>
<html>
<body>
  <h1>Hello <%= user.name %>!</h1>
  <p><%= message %></p>
  <% if (items.length > 0) { %>
    <ul>
    <% items.forEach(item => { %>
      <li><%= item %></li>
    <% }); %>
    </ul>
  <% } %>
</body>
</html>
`;

const html = render(template, {
  user: { name: 'John' },
  message: 'Welcome!',
  items: ['Feature 1', 'Feature 2']
});
```

## 📖 API Reference

### `render(template: string, data?: any, options?: Options): string`
Render template with data

### `compile(template: string, options?: Options): TemplateFunction`
Compile template to function

## 🧪 Testing

```bash
elide run elide-ejs.ts
```

## 📝 Package Stats

- **npm downloads**: ~30M/week
- **Use case**: Server-side template rendering
- **Elide advantage**: One template engine for all languages
- **Polyglot score**: 47/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
