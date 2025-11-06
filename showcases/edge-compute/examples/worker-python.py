"""
Background Worker Example - Python

Processes background jobs with retry logic.
"""

import json
import time
from datetime import datetime

# Job queue (in production, use a real queue)
job_queue = []
completed_jobs = {}

def handler(event, context):
    """Handle job processing"""
    action = event.get('body', {}).get('action', 'status')

    if action == 'enqueue':
        return enqueue_job(event)
    elif action == 'process':
        return process_jobs(event)
    elif action == 'status':
        return get_status(event)
    else:
        return {
            'statusCode': 400,
            'error': f'Unknown action: {action}'
        }

def enqueue_job(event):
    """Add a job to the queue"""
    job_data = event.get('body', {}).get('job')

    if not job_data:
        return {
            'statusCode': 400,
            'error': 'Job data is required'
        }

    job_id = f"job-{int(time.time() * 1000)}"
    job = {
        'id': job_id,
        'data': job_data,
        'status': 'pending',
        'retries': 0,
        'createdAt': datetime.now().isoformat(),
    }

    job_queue.append(job)

    print(f"Job enqueued: {job_id}")

    return {
        'statusCode': 201,
        'data': {
            'jobId': job_id,
            'status': 'pending',
            'queuePosition': len(job_queue)
        }
    }

def process_jobs(event):
    """Process pending jobs"""
    max_jobs = event.get('body', {}).get('maxJobs', 10)
    processed = []

    for _ in range(min(max_jobs, len(job_queue))):
        if not job_queue:
            break

        job = job_queue.pop(0)

        try:
            # Simulate job processing
            result = process_job(job['data'])

            job['status'] = 'completed'
            job['result'] = result
            job['completedAt'] = datetime.now().isoformat()

            completed_jobs[job['id']] = job
            processed.append(job['id'])

            print(f"Job completed: {job['id']}")
        except Exception as e:
            job['retries'] += 1

            if job['retries'] < 3:
                # Requeue for retry
                job['status'] = 'retrying'
                job_queue.append(job)
                print(f"Job failed, retrying: {job['id']}")
            else:
                # Max retries reached
                job['status'] = 'failed'
                job['error'] = str(e)
                job['failedAt'] = datetime.now().isoformat()
                completed_jobs[job['id']] = job
                print(f"Job failed permanently: {job['id']}")

    return {
        'statusCode': 200,
        'data': {
            'processed': len(processed),
            'jobIds': processed,
            'remaining': len(job_queue)
        }
    }

def process_job(data):
    """Process a single job"""
    # Simulate work
    time.sleep(0.1)

    # Return result
    return {
        'processed': True,
        'timestamp': datetime.now().isoformat(),
        'data': data
    }

def get_status(event):
    """Get job status"""
    job_id = event.get('query', {}).get('jobId')

    if job_id:
        # Get specific job
        if job_id in completed_jobs:
            return {
                'statusCode': 200,
                'data': completed_jobs[job_id]
            }

        for job in job_queue:
            if job['id'] == job_id:
                return {
                    'statusCode': 200,
                    'data': job
                }

        return {
            'statusCode': 404,
            'error': 'Job not found'
        }

    # Get overall status
    return {
        'statusCode': 200,
        'data': {
            'pending': len(job_queue),
            'completed': len([j for j in completed_jobs.values() if j['status'] == 'completed']),
            'failed': len([j for j in completed_jobs.values() if j['status'] == 'failed']),
            'total': len(job_queue) + len(completed_jobs)
        }
    }
