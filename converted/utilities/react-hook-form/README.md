# react-hook-form - Elide Polyglot Showcase

> **High-performance form hooks for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Minimal re-renders with efficient validation
- Built-in validation rules
- Schema-based validation support
- Tiny size with zero dependencies
- **~2M+ downloads/week on npm**

## Quick Start

```typescript
import { useForm } from './elide-react-hook-form.ts';

const form = useForm({ defaultValues: { email: '', password: '' } });
const emailReg = form.register('email', { required: true });

emailReg.onChange({ target: { value: 'test@example.com' } });
console.log(form.getValues());
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-hook-form)

---

**Built with ❤️ for the Elide Polyglot Runtime**
