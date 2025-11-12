"""
Python Prefect Flows + TypeScript API
"""

from datetime import datetime
from typing import Dict, List
import time

class PrefectFlow:
    def __init__(self, name: str):
        self.name = name
        self.tasks = []
        self.runs = []

    def add_task(self, task_name: str):
        self.tasks.append({'name': task_name, 'status': 'pending'})

    def run(self):
        run_id = f"{self.name}_{int(time.time())}"
        run = {
            'run_id': run_id,
            'flow': self.name,
            'status': 'running',
            'started_at': datetime.now().isoformat()
        }

        # Execute tasks
        for task in self.tasks:
            task['status'] = 'running'
            time.sleep(0.05)
            task['status'] = 'completed'

        run['status'] = 'completed'
        run['completed_at'] = datetime.now().isoformat()
        self.runs.append(run)

        return run

    def get_info(self):
        return {
            'name': self.name,
            'task_count': len(self.tasks),
            'run_count': len(self.runs)
        }

class PrefectManager:
    def __init__(self):
        self.flows = {}
        self._init_default()

    def _init_default(self):
        flow = self.create_flow('data_pipeline')
        flow.add_task('extract')
        flow.add_task('transform')
        flow.add_task('load')

    def create_flow(self, name: str):
        flow = PrefectFlow(name)
        self.flows[name] = flow
        return flow

    def run_flow(self, name: str):
        flow = self.flows.get(name)
        if not flow:
            return {'error': 'Flow not found'}
        return flow.run()

    def list_flows(self):
        return [f.get_info() for f in self.flows.values()]

    def get_flow_runs(self, name: str):
        flow = self.flows.get(name)
        if not flow:
            return {'error': 'Flow not found'}
        return flow.runs

manager = PrefectManager()
