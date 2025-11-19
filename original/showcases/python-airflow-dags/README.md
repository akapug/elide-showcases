# Python Airflow DAGs + TypeScript Monitoring

**Enterprise Pattern**: Python Airflow workflows with TypeScript monitoring API.

## 🎯 Use Case

Workflow orchestration with Airflow DAGs, monitored via TypeScript.

## 💡 Solution

```typescript
import { monitor } from "./airflow_dags.py";
const run = monitor.trigger_dag("etl_pipeline");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/python-airflow-dags
elide serve server.ts
```

## 📡 Examples

### List DAGs
```bash
curl http://localhost:3000/api/dags
```

### Trigger DAG
```bash
curl -X POST http://localhost:3000/api/dags/etl_pipeline/trigger
```

### Get DAG Runs
```bash
curl http://localhost:3000/api/dags/etl_pipeline/runs
```

Perfect for workflow orchestration!
