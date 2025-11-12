# Ruby Redis Queue (Resque-like) + TypeScript

require 'json'
require 'time'

module RedisQueue
  class Queue
    def initialize(name)
      @name = name
      @jobs = []
      @processed = []
    end

    def push(job_class, args)
      job = {
        'id' => SecureRandom.uuid,
        'class' => job_class,
        'args' => args,
        'enqueued_at' => Time.now.iso8601,
        'status' => 'queued'
      }
      @jobs.push(job)
      job['id']
    end

    def pop
      job = @jobs.shift
      if job
        job['status'] = 'processing'
        job['started_at'] = Time.now.iso8601
      end
      job
    end

    def size
      @jobs.size
    end

    def complete_job(job_id, result)
      job = @jobs.find { |j| j['id'] == job_id }
      if job
        job['status'] = 'completed'
        job['completed_at'] = Time.now.iso8601
        job['result'] = result
        @processed.push(job)
        @jobs.delete(job)
      end
    end

    def stats
      {
        'name' => @name,
        'queued' => @jobs.size,
        'processed' => @processed.size
      }
    end
  end

  class Worker
    def initialize
      @queues = {}
    end

    def get_queue(name)
      @queues[name] ||= Queue.new(name)
    end

    def enqueue(queue_name, job_class, args)
      queue = get_queue(queue_name)
      queue.push(job_class, args)
    end

    def process_next(queue_name)
      queue = get_queue(queue_name)
      job = queue.pop
      return nil unless job

      # Process job
      result = perform_job(job)
      queue.complete_job(job['id'], result)

      job
    end

    def stats
      @queues.transform_values(&:stats)
    end

    private

    def perform_job(job)
      # Simulate job execution
      sleep 0.1
      { 'success' => true, 'processed_at' => Time.now.iso8601 }
    end
  end
end

$redis_worker = RedisQueue::Worker.new
