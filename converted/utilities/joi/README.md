# Joi for Elide

Object schema description language and validator.

**Downloads**: ~12M/week on npm

## Quick Start

```typescript
import Joi from './joi.ts';

const schema = Joi.string().required().min(3).max(30);
const result = schema.validate('hello');

if (result.error) {
  console.error(result.error);
}
```

## Resources

- Original: https://www.npmjs.com/package/joi
