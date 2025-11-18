# formik - Elide Polyglot Showcase

> **Form library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Form state management with validation
- Field-level and form-level validation
- Touched/dirty field tracking
- Async validation support
- **~1M+ downloads/week on npm**

## Quick Start

```typescript
import { createFormik } from './elide-formik.ts';

const form = createFormik({
  initialValues: { email: '', password: '' },
  validate: (values) => {
    const errors: any = {};
    if (!values.email) errors.email = 'Required';
    return errors;
  },
  onSubmit: async (values) => console.log('Submitted:', values),
});

form.setFieldValue('email', 'test@example.com');
form.handleSubmit();
```

## Links

- [Original npm package](https://www.npmjs.com/package/formik)

---

**Built with ❤️ for the Elide Polyglot Runtime**
