# frozen_string_literal: true

##
# CMS Platform - Notification Worker
#
# Ruby-based background worker for handling email notifications.
# Processes notification jobs from queue and sends emails for:
# - Publishing workflow changes
# - Comment moderation
# - User mentions
# - System notifications

require 'json'
require 'time'

##
# Email template for notifications
class EmailTemplate
  attr_reader :subject, :body, :to, :from

  def initialize(subject:, body:, to:, from: 'noreply@cms.local')
    @subject = subject
    @body = body
    @to = to
    @from = from
  end

  def to_h
    {
      subject: @subject,
      body: @body,
      to: @to,
      from: @from
    }
  end
end

##
# Notification job
class NotificationJob
  attr_reader :id, :type, :data, :created_at, :status, :retries

  def initialize(id:, type:, data:, created_at: Time.now)
    @id = id
    @type = type
    @data = data
    @created_at = created_at
    @status = 'pending'
    @retries = 0
  end

  def mark_processing
    @status = 'processing'
  end

  def mark_completed
    @status = 'completed'
  end

  def mark_failed
    @status = 'failed'
    @retries += 1
  end

  def max_retries_reached?
    @retries >= 3
  end

  def to_h
    {
      id: @id,
      type: @type,
      data: @data,
      created_at: @created_at.iso8601,
      status: @status,
      retries: @retries
    }
  end
end

##
# Email notification builder
class NotificationBuilder
  def self.build_article_published(article:, author:)
    EmailTemplate.new(
      subject: "Your article '#{article[:title]}' has been published",
      to: author[:email],
      body: <<~EMAIL
        Hello #{author[:username]},

        Great news! Your article has been published on the CMS Platform.

        Article: #{article[:title]}
        Published at: #{article[:published_at]}
        URL: #{article[:url]}

        Your article is now live and visible to all readers.

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_article_review_request(article:, author:, reviewer:)
    EmailTemplate.new(
      subject: "Article ready for review: '#{article[:title]}'",
      to: reviewer[:email],
      body: <<~EMAIL
        Hello #{reviewer[:username]},

        A new article is ready for your review.

        Article: #{article[:title]}
        Author: #{author[:username]}
        Submitted at: #{article[:updated_at]}

        Please review the article at your earliest convenience.

        Review URL: #{article[:review_url]}

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_article_approved(article:, reviewer:, author:)
    EmailTemplate.new(
      subject: "Your article '#{article[:title]}' has been approved",
      to: author[:email],
      body: <<~EMAIL
        Hello #{author[:username]},

        Good news! Your article has been approved for publication.

        Article: #{article[:title]}
        Reviewed by: #{reviewer[:username]}
        Approved at: #{Time.now}

        Your article will be published shortly.

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_article_rejected(article:, reviewer:, author:, notes:)
    EmailTemplate.new(
      subject: "Your article '#{article[:title]}' needs revision",
      to: author[:email],
      body: <<~EMAIL
        Hello #{author[:username]},

        Your article requires some revisions before it can be published.

        Article: #{article[:title]}
        Reviewed by: #{reviewer[:username]}

        Reviewer notes:
        #{notes}

        Please make the necessary changes and resubmit for review.

        Edit URL: #{article[:edit_url]}

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_comment_notification(comment:, article:, author:)
    EmailTemplate.new(
      subject: "New comment on '#{article[:title]}'",
      to: author[:email],
      body: <<~EMAIL
        Hello #{author[:username]},

        Someone commented on your article.

        Article: #{article[:title]}
        Comment by: #{comment[:author]}
        Posted at: #{comment[:created_at]}

        Comment:
        #{comment[:content]}

        View and respond: #{article[:url]}#comment-#{comment[:id]}

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_comment_approved(comment:, article:)
    EmailTemplate.new(
      subject: "Your comment has been approved",
      to: comment[:email],
      body: <<~EMAIL
        Hello #{comment[:author]},

        Your comment on '#{article[:title]}' has been approved and is now visible.

        Your comment:
        #{comment[:content]}

        View it here: #{article[:url]}#comment-#{comment[:id]}

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_mention_notification(mentioned_user:, article:, author:)
    EmailTemplate.new(
      subject: "You were mentioned in '#{article[:title]}'",
      to: mentioned_user[:email],
      body: <<~EMAIL
        Hello #{mentioned_user[:username]},

        #{author[:username]} mentioned you in their article.

        Article: #{article[:title]}
        URL: #{article[:url]}

        Check it out to see what they said about you!

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_user_welcome(user:)
    EmailTemplate.new(
      subject: 'Welcome to CMS Platform',
      to: user[:email],
      body: <<~EMAIL
        Hello #{user[:username]},

        Welcome to CMS Platform! We're excited to have you join our community.

        Your account has been created with the role: #{user[:role]}

        Get started:
        - Log in to your dashboard: #{user[:dashboard_url]}
        - Create your first article: #{user[:new_article_url]}
        - Explore our documentation: #{user[:docs_url]}

        If you have any questions, feel free to reach out to our support team.

        Best regards,
        The CMS Team
      EMAIL
    )
  end

  def self.build_digest(user:, articles:, period:)
    article_list = articles.map do |article|
      "- #{article[:title]} (#{article[:views]} views)\n  #{article[:url]}"
    end.join("\n\n")

    EmailTemplate.new(
      subject: "Your #{period} digest from CMS Platform",
      to: user[:email],
      body: <<~EMAIL
        Hello #{user[:username]},

        Here's your #{period} digest of activity on CMS Platform.

        Top Articles:
        #{article_list}

        Stay productive and keep creating great content!

        Best regards,
        The CMS Team
      EMAIL
    )
  end
end

##
# Email sender (simulated)
class EmailSender
  def self.send_email(template)
    # In a real implementation, this would use an email service
    # like SendGrid, Mailgun, or AWS SES
    puts "Sending email to: #{template.to}"
    puts "Subject: #{template.subject}"
    puts "From: #{template.from}"
    puts "Body preview: #{template.body[0..100]}..."
    puts '-' * 80

    # Simulate network delay
    sleep(0.1)

    { success: true, message_id: generate_message_id }
  end

  def self.generate_message_id
    "msg_#{Time.now.to_i}_#{rand(1000..9999)}"
  end
end

##
# Main notification worker
class NotificationWorker
  attr_reader :queue, :stats

  def initialize
    @queue = []
    @stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0
    }
    @running = false
  end

  def enqueue(job)
    @queue << job
    puts "Job #{job.id} (#{job.type}) enqueued. Queue size: #{@queue.size}"
  end

  def start
    @running = true
    puts 'Notification worker started'

    loop do
      break unless @running

      if @queue.empty?
        sleep(1)
        next
      end

      job = @queue.shift
      process_job(job)
    end
  end

  def stop
    @running = false
    puts 'Notification worker stopped'
  end

  def process_job(job)
    puts "Processing job #{job.id} (#{job.type})..."
    job.mark_processing

    begin
      template = build_template(job)

      if template
        result = EmailSender.send_email(template)

        if result[:success]
          job.mark_completed
          @stats[:succeeded] += 1
          puts "Job #{job.id} completed successfully"
        else
          raise "Email sending failed: #{result[:error]}"
        end
      else
        raise "Unknown job type: #{job.type}"
      end
    rescue StandardError => e
      puts "Job #{job.id} failed: #{e.message}"
      job.mark_failed
      @stats[:failed] += 1

      # Retry if not max retries
      unless job.max_retries_reached?
        @queue << job
        @stats[:retried] += 1
        puts "Job #{job.id} requeued for retry (attempt #{job.retries})"
      else
        puts "Job #{job.id} exceeded max retries, giving up"
      end
    ensure
      @stats[:processed] += 1
    end
  end

  def build_template(job)
    case job.type
    when 'article_published'
      NotificationBuilder.build_article_published(
        article: job.data[:article],
        author: job.data[:author]
      )

    when 'article_review_request'
      NotificationBuilder.build_article_review_request(
        article: job.data[:article],
        author: job.data[:author],
        reviewer: job.data[:reviewer]
      )

    when 'article_approved'
      NotificationBuilder.build_article_approved(
        article: job.data[:article],
        reviewer: job.data[:reviewer],
        author: job.data[:author]
      )

    when 'article_rejected'
      NotificationBuilder.build_article_rejected(
        article: job.data[:article],
        reviewer: job.data[:reviewer],
        author: job.data[:author],
        notes: job.data[:notes]
      )

    when 'comment_notification'
      NotificationBuilder.build_comment_notification(
        comment: job.data[:comment],
        article: job.data[:article],
        author: job.data[:author]
      )

    when 'comment_approved'
      NotificationBuilder.build_comment_approved(
        comment: job.data[:comment],
        article: job.data[:article]
      )

    when 'mention_notification'
      NotificationBuilder.build_mention_notification(
        mentioned_user: job.data[:mentioned_user],
        article: job.data[:article],
        author: job.data[:author]
      )

    when 'user_welcome'
      NotificationBuilder.build_user_welcome(
        user: job.data[:user]
      )

    when 'digest'
      NotificationBuilder.build_digest(
        user: job.data[:user],
        articles: job.data[:articles],
        period: job.data[:period]
      )

    else
      nil
    end
  end

  def get_stats
    @stats.merge(
      queue_size: @queue.size,
      running: @running
    )
  end
end

# Example usage
if __FILE__ == $PROGRAM_NAME
  worker = NotificationWorker.new

  # Create sample notification jobs
  jobs = [
    NotificationJob.new(
      id: 'job_1',
      type: 'article_published',
      data: {
        article: {
          title: 'Getting Started with Ruby',
          published_at: Time.now,
          url: 'https://cms.local/articles/getting-started-ruby'
        },
        author: {
          username: 'john_doe',
          email: 'john@example.com'
        }
      }
    ),
    NotificationJob.new(
      id: 'job_2',
      type: 'comment_notification',
      data: {
        comment: {
          id: 'comment_123',
          author: 'Jane Smith',
          content: 'Great article! Very helpful.',
          created_at: Time.now
        },
        article: {
          title: 'Getting Started with Ruby',
          url: 'https://cms.local/articles/getting-started-ruby'
        },
        author: {
          username: 'john_doe',
          email: 'john@example.com'
        }
      }
    ),
    NotificationJob.new(
      id: 'job_3',
      type: 'user_welcome',
      data: {
        user: {
          username: 'new_user',
          email: 'newuser@example.com',
          role: 'author',
          dashboard_url: 'https://cms.local/dashboard',
          new_article_url: 'https://cms.local/articles/new',
          docs_url: 'https://cms.local/docs'
        }
      }
    )
  ]

  # Enqueue jobs
  jobs.each { |job| worker.enqueue(job) }

  # Process jobs (run for a short time for demo)
  Thread.new { worker.start }
  sleep(2)
  worker.stop

  # Print statistics
  puts "\nWorker Statistics:"
  puts JSON.pretty_generate(worker.get_stats)
end
