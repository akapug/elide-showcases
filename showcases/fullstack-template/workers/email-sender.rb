#!/usr/bin/env ruby
# frozen_string_literal: true

##
# Email Sender Worker (Ruby)
# Demonstrates polyglot capabilities - Ruby worker for email notifications
#

require 'json'
require 'time'

##
# EmailTemplate represents an email template
class EmailTemplate
  attr_reader :name, :subject, :body

  def initialize(name, subject, body)
    @name = name
    @subject = subject
    @body = body
  end

  def render(variables)
    rendered_subject = @subject.dup
    rendered_body = @body.dup

    variables.each do |key, value|
      rendered_subject.gsub!("{{#{key}}}", value.to_s)
      rendered_body.gsub!("{{#{key}}}", value.to_s)
    end

    { subject: rendered_subject, body: rendered_body }
  end
end

##
# EmailSender handles sending emails (simulated)
class EmailSender
  def initialize
    @templates = {}
    @sent_emails = []
    @failed_emails = []
    load_templates
  end

  def load_templates
    @templates['welcome'] = EmailTemplate.new(
      'welcome',
      'Welcome to {{app_name}}!',
      <<~EMAIL
        Hello {{username}},

        Welcome to {{app_name}}! We're excited to have you on board.

        Your account has been successfully created with the email: {{email}}

        Get started by exploring our features and customizing your profile.

        Best regards,
        The {{app_name}} Team
      EMAIL
    )

    @templates['password_reset'] = EmailTemplate.new(
      'password_reset',
      'Reset Your Password',
      <<~EMAIL
        Hello {{username}},

        We received a request to reset your password for {{app_name}}.

        Reset token: {{reset_token}}

        If you didn't request this, please ignore this email.

        Best regards,
        The {{app_name}} Team
      EMAIL
    )

    @templates['notification'] = EmailTemplate.new(
      'notification',
      '{{notification_type}} - {{app_name}}',
      <<~EMAIL
        Hello {{username}},

        {{message}}

        Best regards,
        The {{app_name}} Team
      EMAIL
    )
  end

  def send_email(to, template_name, variables = {})
    template = @templates[template_name]

    unless template
      error_msg = "Template '#{template_name}' not found"
      puts "❌ #{error_msg}"
      @failed_emails << {
        to: to,
        template: template_name,
        error: error_msg,
        timestamp: Time.now.iso8601
      }
      return false
    end

    # Render template
    rendered = template.render(variables)

    # Simulate email sending
    puts "📧 Sending email to #{to}..."
    puts "   Subject: #{rendered[:subject]}"
    sleep(0.3) # Simulate network delay

    # Record sent email
    email_record = {
      to: to,
      template: template_name,
      subject: rendered[:subject],
      body: rendered[:body],
      variables: variables,
      timestamp: Time.now.iso8601,
      status: 'sent'
    }

    @sent_emails << email_record
    puts "✅ Email sent successfully!\n"

    true
  rescue StandardError => e
    error_msg = "Failed to send email: #{e.message}"
    puts "❌ #{error_msg}"
    @failed_emails << {
      to: to,
      template: template_name,
      error: error_msg,
      timestamp: Time.now.iso8601
    }
    false
  end

  def send_welcome_email(user)
    send_email(
      user[:email],
      'welcome',
      username: user[:username],
      email: user[:email],
      app_name: 'Elide Full-Stack Template'
    )
  end

  def send_password_reset_email(user, reset_token)
    send_email(
      user[:email],
      'password_reset',
      username: user[:username],
      reset_token: reset_token,
      app_name: 'Elide Full-Stack Template'
    )
  end

  def send_notification_email(user, notification_type, message)
    send_email(
      user[:email],
      'notification',
      username: user[:username],
      notification_type: notification_type,
      message: message,
      app_name: 'Elide Full-Stack Template'
    )
  end

  def statistics
    {
      total_sent: @sent_emails.length,
      total_failed: @failed_emails.length,
      success_rate: calculate_success_rate,
      templates_available: @templates.keys
    }
  end

  private

  def calculate_success_rate
    total = @sent_emails.length + @failed_emails.length
    return 0.0 if total.zero?

    (@sent_emails.length.to_f / total * 100).round(2)
  end
end

##
# Main execution
def main
  sender = EmailSender.new

  puts "🚀 Email Sender Worker Started\n\n"

  # Example: Send welcome emails
  users = [
    { username: 'alice', email: 'alice@example.com' },
    { username: 'bob', email: 'bob@example.com' },
    { username: 'charlie', email: 'charlie@example.com' }
  ]

  users.each do |user|
    sender.send_welcome_email(user)
  end

  # Example: Send password reset
  sender.send_password_reset_email(
    { username: 'alice', email: 'alice@example.com' },
    'abc123xyz789'
  )

  # Example: Send notification
  sender.send_notification_email(
    { username: 'bob', email: 'bob@example.com' },
    'New Feature',
    'Check out our new dashboard feature!'
  )

  # Print statistics
  stats = sender.statistics
  puts "\n📊 Statistics:"
  puts JSON.pretty_generate(stats)
end

# Run if executed directly
main if __FILE__ == $PROGRAM_NAME
