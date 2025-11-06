#!/usr/bin/env ruby

# ElideBase - Ruby Hooks
#
# Ruby hooks for background job processing, email sending, and scheduled tasks.
# These hooks are executed by ElideBase when database events occur.
#
# Example use cases:
# - Background job processing
# - Email notifications
# - Webhook delivery
# - Report generation
# - Data synchronization

require 'json'
require 'time'
require 'digest'

# Base class for ElideBase Ruby hooks
class Hook
  attr_reader :event, :collection, :record, :action

  def initialize(event)
    @event = event
    @collection = event['collection']
    @record = event['record']
    @action = event['action'] # create, update, delete
  end

  def execute
    raise NotImplementedError, 'Subclass must implement execute method'
  end
end

# Email Notification Hook
# Sends email notifications for various events
class EmailNotificationHook < Hook
  def execute
    case @collection
    when 'users'
      handle_user_event
    when 'posts'
      handle_post_event
    when 'comments'
      handle_comment_event
    else
      { success: true }
    end
  end

  private

  def handle_user_event
    if @action == 'create'
      send_welcome_email
    elsif @action == 'update' && @record['verified']
      send_verification_email
    else
      { success: true }
    end
  end

  def handle_post_event
    if @action == 'create'
      notify_followers
    else
      { success: true }
    end
  end

  def handle_comment_event
    if @action == 'create'
      notify_post_author
    else
      { success: true }
    end
  end

  def send_welcome_email
    email = @record['email']

    # Mock email sending
    log_email(
      to: email,
      subject: 'Welcome to ElideBase!',
      template: 'welcome',
      data: { username: @record['username'] }
    )

    {
      success: true,
      email_sent: true,
      email_id: generate_id
    }
  end

  def send_verification_email
    email = @record['email']

    log_email(
      to: email,
      subject: 'Verify your email',
      template: 'verification',
      data: {
        username: @record['username'],
        verification_link: "https://app.com/verify/#{generate_token}"
      }
    )

    {
      success: true,
      email_sent: true,
      email_id: generate_id
    }
  end

  def notify_followers
    log_email(
      to: 'followers@example.com',
      subject: 'New post from user',
      template: 'new_post',
      data: {
        post_title: @record['title'],
        post_url: "https://app.com/posts/#{@record['id']}"
      }
    )

    {
      success: true,
      notifications_sent: 1
    }
  end

  def notify_post_author
    log_email(
      to: 'author@example.com',
      subject: 'New comment on your post',
      template: 'new_comment',
      data: { comment: @record['content'] }
    )

    {
      success: true,
      email_sent: true
    }
  end

  def log_email(params)
    puts "[EMAIL] To: #{params[:to]}, Subject: #{params[:subject]}"
  end

  def generate_id
    Digest::SHA256.hexdigest(Time.now.to_s + rand.to_s)[0..16]
  end

  def generate_token
    Digest::SHA256.hexdigest(Time.now.to_s + rand.to_s + @record['email'].to_s)
  end
end

# Background Job Hook
# Processes background jobs asynchronously
class BackgroundJobHook < Hook
  def execute
    job_type = determine_job_type

    case job_type
    when :export
      schedule_export_job
    when :import
      schedule_import_job
    when :cleanup
      schedule_cleanup_job
    when :sync
      schedule_sync_job
    else
      { success: true }
    end
  end

  private

  def determine_job_type
    return :export if @record['type'] == 'export'
    return :import if @record['type'] == 'import'
    return :cleanup if @action == 'delete'
    return :sync if @record['sync_required']

    nil
  end

  def schedule_export_job
    job_id = enqueue_job('ExportJob', @record)

    {
      success: true,
      job_scheduled: true,
      job_id: job_id,
      job_type: 'export'
    }
  end

  def schedule_import_job
    job_id = enqueue_job('ImportJob', @record)

    {
      success: true,
      job_scheduled: true,
      job_id: job_id,
      job_type: 'import'
    }
  end

  def schedule_cleanup_job
    job_id = enqueue_job('CleanupJob', {
      collection: @collection,
      record_id: @record['id']
    })

    {
      success: true,
      job_scheduled: true,
      job_id: job_id,
      job_type: 'cleanup'
    }
  end

  def schedule_sync_job
    job_id = enqueue_job('SyncJob', @record)

    {
      success: true,
      job_scheduled: true,
      job_id: job_id,
      job_type: 'sync'
    }
  end

  def enqueue_job(job_class, params)
    job_id = generate_id

    puts "[JOB] Enqueued: #{job_class}, ID: #{job_id}"
    puts "[JOB] Params: #{params.to_json}"

    job_id
  end

  def generate_id
    Digest::SHA256.hexdigest(Time.now.to_s + rand.to_s)[0..16]
  end
end

# Webhook Delivery Hook
# Delivers webhooks to external services
class WebhookDeliveryHook < Hook
  def execute
    webhooks = find_webhooks
    results = []

    webhooks.each do |webhook|
      result = deliver_webhook(webhook)
      results << result
    end

    {
      success: true,
      webhooks_delivered: results.length,
      results: results
    }
  end

  private

  def find_webhooks
    # Mock webhook discovery
    # In real implementation, query database for registered webhooks
    [
      {
        url: 'https://api.example.com/webhooks',
        event: "#{@collection}.#{@action}",
        secret: 'webhook_secret_123'
      }
    ]
  end

  def deliver_webhook(webhook)
    payload = {
      event: webhook[:event],
      collection: @collection,
      action: @action,
      record: @record,
      timestamp: Time.now.iso8601
    }

    signature = generate_signature(payload.to_json, webhook[:secret])

    # Mock webhook delivery
    puts "[WEBHOOK] Delivering to: #{webhook[:url]}"
    puts "[WEBHOOK] Event: #{webhook[:event]}"
    puts "[WEBHOOK] Signature: #{signature}"

    {
      url: webhook[:url],
      status: 200,
      delivered_at: Time.now.iso8601
    }
  end

  def generate_signature(payload, secret)
    Digest::SHA256.hexdigest("#{secret}:#{payload}")
  end
end

# Report Generation Hook
# Generates reports and exports
class ReportGenerationHook < Hook
  def execute
    report_type = @record['report_type'] || 'summary'

    case report_type
    when 'summary'
      generate_summary_report
    when 'detailed'
      generate_detailed_report
    when 'analytics'
      generate_analytics_report
    else
      { success: false, error: "Unknown report type: #{report_type}" }
    end
  end

  private

  def generate_summary_report
    report_data = {
      title: 'Summary Report',
      generated_at: Time.now.iso8601,
      metrics: calculate_metrics,
      format: 'pdf'
    }

    puts "[REPORT] Generating summary report..."

    {
      success: true,
      report_generated: true,
      report_data: report_data,
      download_url: "https://app.com/reports/#{generate_id}.pdf"
    }
  end

  def generate_detailed_report
    report_data = {
      title: 'Detailed Report',
      generated_at: Time.now.iso8601,
      data: fetch_detailed_data,
      format: 'csv'
    }

    puts "[REPORT] Generating detailed report..."

    {
      success: true,
      report_generated: true,
      report_data: report_data,
      download_url: "https://app.com/reports/#{generate_id}.csv"
    }
  end

  def generate_analytics_report
    report_data = {
      title: 'Analytics Report',
      generated_at: Time.now.iso8601,
      analytics: {
        page_views: 10543,
        unique_visitors: 2341,
        conversion_rate: 3.2
      },
      format: 'json'
    }

    puts "[REPORT] Generating analytics report..."

    {
      success: true,
      report_generated: true,
      report_data: report_data
    }
  end

  def calculate_metrics
    {
      total_users: 156,
      active_users: 89,
      total_posts: 423,
      total_comments: 1234
    }
  end

  def fetch_detailed_data
    [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 }
    ]
  end

  def generate_id
    Digest::SHA256.hexdigest(Time.now.to_s + rand.to_s)[0..16]
  end
end

# Hook registry
HOOKS = {
  'email_notification' => EmailNotificationHook,
  'background_job' => BackgroundJobHook,
  'webhook_delivery' => WebhookDeliveryHook,
  'report_generation' => ReportGenerationHook
}

# Main entry point
def main
  begin
    # Read event from stdin
    event_json = STDIN.read
    event = JSON.parse(event_json)

    # Get hook name
    hook_name = event['hook'] || 'email_notification'

    # Get hook class
    hook_class = HOOKS[hook_name]

    if hook_class.nil?
      result = {
        success: false,
        error: "Unknown hook: #{hook_name}"
      }
    else
      # Execute hook
      hook = hook_class.new(event)
      result = hook.execute
    end

    # Return result as JSON
    puts result.to_json

  rescue => e
    # Return error
    error_result = {
      success: false,
      error: e.message,
      backtrace: e.backtrace[0..5]
    }
    puts error_result.to_json
    exit 1
  end
end

# Run if executed directly
main if __FILE__ == $0
