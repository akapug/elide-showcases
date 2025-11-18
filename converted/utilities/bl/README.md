# bl - Buffer List

Efficient buffer list management with lazy concatenation.

Based on [bl](https://www.npmjs.com/package/bl) (~3M+ downloads/week)

## Quick Start

\`\`\`typescript
import BufferList from './elide-bl.ts';

const bl = new BufferList();
bl.append(new Uint8Array([1, 2, 3]));
bl.append(new Uint8Array([4, 5, 6]));
console.log(bl.toBuffer());
\`\`\`
