# JSON Web Token for Elide

Implementation of JSON Web Tokens.

**Downloads**: ~11M/week on npm

## Quick Start

```typescript
import jwt from './jsonwebtoken.ts';

const token = jwt.sign({ userId: 123 }, 'secret');
const decoded = jwt.verify(token, 'secret');
```

## Resources

- Original: https://www.npmjs.com/package/jsonwebtoken
