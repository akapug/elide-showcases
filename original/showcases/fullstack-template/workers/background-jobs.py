"""
Background Jobs Worker (Python)
Demonstrates polyglot capabilities - Python worker for background tasks
"""

import time
import json
from datetime import datetime
from typing import Dict, List, Optional


class BackgroundJobProcessor:
    """Process background jobs asynchronously"""

    def __init__(self):
        self.job_queue: List[Dict] = []
        self.processed_jobs: List[Dict] = []
        self.running = False

    def add_job(self, job_type: str, data: Dict, priority: int = 0) -> str:
        """Add a job to the queue"""
        job = {
            "id": f"job_{int(time.time() * 1000)}",
            "type": job_type,
            "data": data,
            "priority": priority,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "processed_at": None,
        }

        self.job_queue.append(job)
        # Sort by priority (higher priority first)
        self.job_queue.sort(key=lambda x: x["priority"], reverse=True)

        print(f"✓ Added job {job['id']} ({job_type}) to queue")
        return job["id"]

    def process_user_registration(self, data: Dict) -> Dict:
        """Process user registration job"""
        print(f"📧 Sending welcome email to {data.get('email')}...")
        time.sleep(0.5)  # Simulate email sending

        print(f"👤 Creating user profile for {data.get('username')}...")
        time.sleep(0.3)  # Simulate profile creation

        return {
            "email_sent": True,
            "profile_created": True,
            "user_id": data.get("user_id"),
        }

    def process_data_export(self, data: Dict) -> Dict:
        """Process data export job"""
        user_id = data.get("user_id")
        export_format = data.get("format", "json")

        print(f"📦 Exporting data for user {user_id} in {export_format} format...")
        time.sleep(1.0)  # Simulate data export

        export_file = f"exports/user_{user_id}_{int(time.time())}.{export_format}"

        return {
            "export_file": export_file,
            "size_bytes": 12345,
            "records_exported": 42,
        }

    def process_analytics(self, data: Dict) -> Dict:
        """Process analytics job"""
        metric_type = data.get("metric_type")

        print(f"📊 Calculating {metric_type} analytics...")
        time.sleep(0.8)  # Simulate analytics calculation

        return {
            "metric_type": metric_type,
            "value": 123.45,
            "period": data.get("period", "daily"),
            "calculated_at": datetime.now().isoformat(),
        }

    def process_job(self, job: Dict) -> Dict:
        """Process a single job based on its type"""
        job_type = job["type"]
        data = job["data"]

        processors = {
            "user_registration": self.process_user_registration,
            "data_export": self.process_data_export,
            "analytics": self.process_analytics,
        }

        processor = processors.get(job_type)

        if not processor:
            raise ValueError(f"Unknown job type: {job_type}")

        result = processor(data)

        return result

    def run(self, max_jobs: Optional[int] = None):
        """Process jobs from the queue"""
        self.running = True
        processed_count = 0

        print("\n🔄 Background job processor started\n")

        while self.running and self.job_queue:
            if max_jobs and processed_count >= max_jobs:
                break

            job = self.job_queue.pop(0)
            job["status"] = "processing"

            try:
                print(f"⚙️  Processing job {job['id']} ({job['type']})...")

                result = self.process_job(job)

                job["status"] = "completed"
                job["result"] = result
                job["processed_at"] = datetime.now().isoformat()

                print(f"✅ Job {job['id']} completed successfully\n")

            except Exception as e:
                job["status"] = "failed"
                job["error"] = str(e)
                job["processed_at"] = datetime.now().isoformat()

                print(f"❌ Job {job['id']} failed: {e}\n")

            self.processed_jobs.append(job)
            processed_count += 1

        print(f"✓ Processed {processed_count} jobs")
        self.running = False

    def get_stats(self) -> Dict:
        """Get statistics about job processing"""
        total = len(self.processed_jobs)
        completed = sum(1 for j in self.processed_jobs if j["status"] == "completed")
        failed = sum(1 for j in self.processed_jobs if j["status"] == "failed")

        return {
            "total_processed": total,
            "completed": completed,
            "failed": failed,
            "pending": len(self.job_queue),
        }


def main():
    """Main entry point for demonstration"""
    processor = BackgroundJobProcessor()

    # Add some demo jobs
    processor.add_job(
        "user_registration",
        {"user_id": "usr_123", "username": "alice", "email": "alice@example.com"},
        priority=10,
    )

    processor.add_job(
        "data_export",
        {"user_id": "usr_456", "format": "json"},
        priority=5,
    )

    processor.add_job(
        "analytics",
        {"metric_type": "daily_active_users", "period": "daily"},
        priority=3,
    )

    processor.add_job(
        "user_registration",
        {"user_id": "usr_789", "username": "bob", "email": "bob@example.com"},
        priority=10,
    )

    # Process all jobs
    processor.run()

    # Print statistics
    stats = processor.get_stats()
    print(f"\n📈 Statistics:")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
