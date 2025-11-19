"""
Python Airflow DAGs + TypeScript Monitoring
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

class Task:
    def __init__(self, task_id: str, dag_id: str):
        self.task_id = task_id
        self.dag_id = dag_id
        self.status = 'pending'
        self.start_time = None
        self.end_time = None

    def execute(self):
        self.status = 'running'
        self.start_time = datetime.now().isoformat()
        # Simulate task execution
        self.status = 'success'
        self.end_time = datetime.now().isoformat()

    def to_dict(self):
        return {
            'task_id': self.task_id,
            'dag_id': self.dag_id,
            'status': self.status,
            'start_time': self.start_time,
            'end_time': self.end_time
        }

class DAG:
    def __init__(self, dag_id: str, schedule: str):
        self.dag_id = dag_id
        self.schedule = schedule
        self.tasks = []
        self.runs = []

    def add_task(self, task_id: str):
        task = Task(task_id, self.dag_id)
        self.tasks.append(task)
        return task

    def run(self):
        run_id = f"{self.dag_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        run = {
            'run_id': run_id,
            'dag_id': self.dag_id,
            'status': 'running',
            'start_time': datetime.now().isoformat()
        }

        # Execute all tasks
        for task in self.tasks:
            task.execute()

        run['status'] = 'success'
        run['end_time'] = datetime.now().isoformat()
        self.runs.append(run)
        return run

    def get_info(self):
        return {
            'dag_id': self.dag_id,
            'schedule': self.schedule,
            'task_count': len(self.tasks),
            'run_count': len(self.runs)
        }

class AirflowMonitor:
    def __init__(self):
        self.dags = {}
        self._initialize_default_dags()

    def _initialize_default_dags(self):
        dag = self.create_dag('etl_pipeline', '@daily')
        dag.add_task('extract')
        dag.add_task('transform')
        dag.add_task('load')

    def create_dag(self, dag_id: str, schedule: str):
        dag = DAG(dag_id, schedule)
        self.dags[dag_id] = dag
        return dag

    def trigger_dag(self, dag_id: str):
        dag = self.dags.get(dag_id)
        if not dag:
            return {'error': 'DAG not found'}
        return dag.run()

    def get_dag_info(self, dag_id: str):
        dag = self.dags.get(dag_id)
        if not dag:
            return {'error': 'DAG not found'}
        return dag.get_info()

    def list_dags(self):
        return [dag.get_info() for dag in self.dags.values()]

    def get_dag_runs(self, dag_id: str):
        dag = self.dags.get(dag_id)
        if not dag:
            return {'error': 'DAG not found'}
        return dag.runs

monitor = AirflowMonitor()
