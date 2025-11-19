"""
Python Celery Tasks + TypeScript API
Asynchronous task processing with Celery, exposed via TypeScript API
"""

import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import uuid

class TaskStatus:
    """Task status constants"""
    PENDING = 'pending'
    RUNNING = 'running'
    SUCCESS = 'success'
    FAILURE = 'failure'
    RETRY = 'retry'

class Task:
    """Represents a Celery-like task"""

    def __init__(self, task_id: str, name: str, args: List[Any], kwargs: Dict[str, Any]):
        self.task_id = task_id
        self.name = name
        self.args = args
        self.kwargs = kwargs
        self.status = TaskStatus.PENDING
        self.result = None
        self.error = None
        self.created_at = datetime.now().isoformat()
        self.started_at = None
        self.completed_at = None
        self.retries = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary"""
        return {
            'task_id': self.task_id,
            'name': self.name,
            'args': self.args,
            'kwargs': self.kwargs,
            'status': self.status,
            'result': self.result,
            'error': self.error,
            'created_at': self.created_at,
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'retries': self.retries
        }

class CeleryWorker:
    """Simulated Celery worker"""

    def __init__(self):
        self.tasks = {}
        self.task_handlers = {
            'send_email': self._send_email,
            'process_data': self._process_data,
            'generate_report': self._generate_report,
            'cleanup': self._cleanup
        }

    def apply_async(self, task_name: str, args: List[Any] = None, kwargs: Dict[str, Any] = None) -> str:
        """Submit a task for async execution"""
        task_id = str(uuid.uuid4())
        task = Task(task_id, task_name, args or [], kwargs or {})
        self.tasks[task_id] = task

        # Simulate async execution (in real Celery, this would be queued)
        self._execute_task(task)

        return task_id

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status and result"""
        task = self.tasks.get(task_id)
        return task.to_dict() if task else None

    def get_all_tasks(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all tasks, optionally filtered by status"""
        tasks = list(self.tasks.values())

        if status:
            tasks = [t for t in tasks if t.status == status]

        return [t.to_dict() for t in tasks]

    def retry_task(self, task_id: str) -> bool:
        """Retry a failed task"""
        task = self.tasks.get(task_id)

        if not task:
            return False

        if task.status != TaskStatus.FAILURE:
            return False

        task.status = TaskStatus.PENDING
        task.error = None
        task.retries += 1
        self._execute_task(task)

        return True

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending task"""
        task = self.tasks.get(task_id)

        if not task or task.status != TaskStatus.PENDING:
            return False

        task.status = TaskStatus.FAILURE
        task.error = "Task cancelled by user"
        task.completed_at = datetime.now().isoformat()

        return True

    def get_stats(self) -> Dict[str, Any]:
        """Get worker statistics"""
        total = len(self.tasks)
        pending = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING)
        running = sum(1 for t in self.tasks.values() if t.status == TaskStatus.RUNNING)
        success = sum(1 for t in self.tasks.values() if t.status == TaskStatus.SUCCESS)
        failure = sum(1 for t in self.tasks.values() if t.status == TaskStatus.FAILURE)

        return {
            'total_tasks': total,
            'pending': pending,
            'running': running,
            'success': success,
            'failure': failure,
            'active_handlers': list(self.task_handlers.keys())
        }

    def _execute_task(self, task: Task):
        """Execute a task"""
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now().isoformat()

        try:
            handler = self.task_handlers.get(task.name)

            if not handler:
                raise ValueError(f"Unknown task: {task.name}")

            # Execute the task handler
            result = handler(*task.args, **task.kwargs)

            task.status = TaskStatus.SUCCESS
            task.result = result
            task.completed_at = datetime.now().isoformat()

        except Exception as e:
            task.status = TaskStatus.FAILURE
            task.error = str(e)
            task.completed_at = datetime.now().isoformat()

    # Task handlers
    def _send_email(self, to: str, subject: str, body: str) -> Dict[str, Any]:
        """Simulate sending email"""
        time.sleep(0.1)  # Simulate work

        return {
            'sent': True,
            'to': to,
            'subject': subject,
            'message_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        }

    def _process_data(self, data: Dict[str, Any], operation: str = 'transform') -> Dict[str, Any]:
        """Simulate data processing"""
        time.sleep(0.2)  # Simulate work

        processed = {
            'original_size': len(str(data)),
            'operation': operation,
            'processed_at': datetime.now().isoformat()
        }

        if operation == 'transform':
            processed['result'] = str(data).upper()
        elif operation == 'validate':
            processed['valid'] = isinstance(data, dict)

        return processed

    def _generate_report(self, report_type: str, date_range: str) -> Dict[str, Any]:
        """Simulate report generation"""
        time.sleep(0.3)  # Simulate work

        return {
            'report_type': report_type,
            'date_range': date_range,
            'generated_at': datetime.now().isoformat(),
            'file_path': f'/reports/{report_type}_{datetime.now().strftime("%Y%m%d")}.pdf',
            'size_bytes': 1024 * 512  # 512KB
        }

    def _cleanup(self, resource: str, older_than_days: int = 7) -> Dict[str, Any]:
        """Simulate cleanup operation"""
        time.sleep(0.15)  # Simulate work

        cutoff_date = datetime.now() - timedelta(days=older_than_days)

        return {
            'resource': resource,
            'cutoff_date': cutoff_date.isoformat(),
            'items_removed': 42,
            'space_freed_mb': 256
        }

# Export worker instance
worker = CeleryWorker()
