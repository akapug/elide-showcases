# concat-stream - Concatenate Stream Data

Writable stream that concatenates all data and calls callback with result.

Based on [concat-stream](https://www.npmjs.com/package/concat-stream) (~3M+ downloads/week)

## Quick Start

\`\`\`typescript
import concatStream from './elide-concat-stream.ts';

const stream = concatStream((data) => {
  console.log(new TextDecoder().decode(data));
});
stream.write(new TextEncoder().encode("Hello"));
stream.end();
\`\`\`
