# Java Hadoop MapReduce + TypeScript UI

**Enterprise Pattern**: Hadoop MapReduce jobs with TypeScript UI.

## 🎯 Use Case

Big data batch processing with Hadoop, UI in TypeScript.

## 💡 Solution

```typescript
import { HadoopMapReduce } from "./HadoopMapReduce.java";
const job = hadoop.submitJob("word_count", "/input", "/output");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/java-hadoop-mapreduce
elide serve server.ts
```

Perfect for batch processing!
