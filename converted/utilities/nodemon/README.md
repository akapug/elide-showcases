# Elide Nodemon

Development auto-reloader with file watching.

## Usage

```typescript
import { Nodemon } from './elide-nodemon.ts';

const nodemon = new Nodemon({
  script: './server.ts',
  watch: ['src'],
  ext: 'ts,js'
});
nodemon.start();
```

## NPM: nodemon | 30M/week | MIT
