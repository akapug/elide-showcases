# Java Spark Jobs + TypeScript Orchestration

**Enterprise Pattern**: Java Spark jobs orchestrated via TypeScript.

## 🎯 Use Case

Big data processing with Spark, orchestrated via modern TypeScript API.

## 💡 Solution

```typescript
import { SparkOrchestrator } from "./SparkOrchestrator.java";
const execution = spark.submitJob("word_count", config);
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/java-spark-jobs
elide serve server.ts
```

## 📡 Examples

### Submit Spark Job
```bash
curl -X POST http://localhost:3000/api/jobs/submit \
  -H "Content-Type: application/json" \
  -d '{"jobName": "word_count", "config": {"input": "data.txt"}}'
```

### Get Job Status
```bash
curl http://localhost:3000/api/jobs/EXECUTION_ID
```

Perfect for big data processing!
