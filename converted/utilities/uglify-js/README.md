# UglifyJS - Elide Polyglot Showcase

> **One JS minifier for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript parser, minifier, and compressor toolkit.

## Features

- JavaScript minification
- Variable name mangling
- Dead code elimination
- **~15M downloads/week on npm**

## Quick Start

```typescript
import UglifyJS from './elide-uglify-js.ts';

const uglify = new UglifyJS();
const result = uglify.minify('function test() { console.log("hi"); }');
console.log(result.code);
```

## Links

- [Original npm package](https://www.npmjs.com/package/uglify-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
