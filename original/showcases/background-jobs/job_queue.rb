#!/usr/bin/env ruby
# frozen_string_literal: true

# Background Jobs - Ruby Sidekiq Patterns

require 'json'
require 'time'

module JobQueue
  class Job
    attr_reader :id, :type, :payload, :status, :created_at, :completed_at

    def initialize(type, payload)
      @id = SecureRandom.uuid
      @type = type
      @payload = payload
      @status = 'pending'
      @created_at = Time.now
      @completed_at = nil
    end

    def execute
      @status = 'processing'
      sleep 0.1  # Simulate work
      @status = 'completed'
      @completed_at = Time.now
      { id: @id, status: @status, result: "Job #{@id} completed" }
    end

    def to_h
      {
        id: @id,
        type: @type,
        payload: @payload,
        status: @status,
        created_at: @created_at.iso8601,
        completed_at: @completed_at&.iso8601
      }
    end
  end

  class Queue
    def initialize
      @jobs = {}
      @pending = []
      @completed = []
    end

    def enqueue(type, payload)
      job = Job.new(type, payload)
      @jobs[job.id] = job
      @pending << job.id
      job.to_h
    end

    def process_next
      return nil if @pending.empty?

      job_id = @pending.shift
      job = @jobs[job_id]
      result = job.execute
      @completed << job_id
      result
    end

    def get_job(id)
      @jobs[id]&.to_h
    end

    def stats
      {
        total: @jobs.size,
        pending: @pending.size,
        completed: @completed.size,
        processing: @jobs.values.count { |j| j.status == 'processing' }
      }
    end
  end
end

$queue = JobQueue::Queue.new

def enqueue_job(type, payload)
  $queue.enqueue(type, payload)
end

def process_job
  $queue.process_next
end

def get_queue_stats
  $queue.stats
end

def get_job_status(id)
  $queue.get_job(id)
end
