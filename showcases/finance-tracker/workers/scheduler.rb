#!/usr/bin/env ruby

##
# Task Scheduler
#
# Manages recurring transactions, reminders, and automated tasks.
##

require 'json'
require 'date'
require 'time'

class TaskScheduler
  attr_reader :data_path

  def initialize(data_path = 'data/finance-data.json')
    @data_path = data_path
    @data = load_data
  end

  ##
  # Load financial data from JSON file
  ##
  def load_data
    if File.exist?(@data_path)
      JSON.parse(File.read(@data_path))
    else
      {
        'accounts' => [],
        'transactions' => [],
        'budgets' => [],
        'categories' => [],
        'recurring_rules' => [],
        'metadata' => {
          'version' => '1.0.0',
          'lastModified' => Time.now.iso8601
        }
      }
    end
  rescue JSON::ParserError => e
    puts "Error parsing data file: #{e.message}"
    {}
  end

  ##
  # Save data back to file
  ##
  def save_data
    @data['metadata']['lastModified'] = Time.now.iso8601
    File.write(@data_path, JSON.pretty_generate(@data))
    puts "✅ Data saved to #{@data_path}"
  end

  ##
  # Process recurring transactions
  ##
  def process_recurring_transactions
    puts "\n🔄 Processing recurring transactions..."

    recurring_rules = @data['recurring_rules'] || []
    created_count = 0

    recurring_rules.each do |rule|
      next unless rule['active']

      if should_create_transaction?(rule)
        transaction = create_transaction_from_rule(rule)
        @data['transactions'] << transaction
        created_count += 1

        puts "  ✅ Created: #{transaction['description']} - $#{transaction['amount']}"

        # Update last run
        rule['lastRun'] = Time.now.iso8601
      end
    end

    if created_count > 0
      save_data
      puts "✅ Created #{created_count} recurring transaction(s)"
    else
      puts "ℹ️  No recurring transactions due"
    end
  end

  ##
  # Check if transaction should be created based on rule
  ##
  def should_create_transaction?(rule)
    last_run = rule['lastRun'] ? Time.parse(rule['lastRun']) : nil
    frequency = rule['frequency'] # 'daily', 'weekly', 'monthly', 'yearly'
    next_run = calculate_next_run(last_run, frequency)

    Time.now >= next_run
  end

  ##
  # Calculate next run time based on frequency
  ##
  def calculate_next_run(last_run, frequency)
    base_time = last_run || Time.now

    case frequency
    when 'daily'
      base_time + (24 * 60 * 60)
    when 'weekly'
      base_time + (7 * 24 * 60 * 60)
    when 'monthly'
      base_time + (30 * 24 * 60 * 60)
    when 'yearly'
      base_time + (365 * 24 * 60 * 60)
    else
      base_time + (30 * 24 * 60 * 60) # Default to monthly
    end
  end

  ##
  # Create transaction from recurring rule
  ##
  def create_transaction_from_rule(rule)
    {
      'id' => generate_id,
      'accountId' => rule['accountId'],
      'type' => rule['type'],
      'amount' => rule['amount'],
      'currency' => rule['currency'] || 'USD',
      'categoryId' => rule['categoryId'],
      'payee' => rule['payee'],
      'description' => rule['description'],
      'date' => Time.now.iso8601,
      'status' => 'pending',
      'tags' => rule['tags'] || [],
      'isRecurring' => true,
      'recurringId' => rule['id'],
      'createdAt' => Time.now.iso8601,
      'updatedAt' => Time.now.iso8601
    }
  end

  ##
  # Send budget alerts
  ##
  def send_budget_alerts
    puts "\n🔔 Checking budget alerts..."

    budgets = @data['budgets'] || []
    transactions = @data['transactions'] || []
    alerts = []

    budgets.each do |budget|
      next unless budget['status'] == 'active'

      spent = calculate_budget_spent(budget, transactions)
      budget_amount = budget['amount'].to_f
      percentage = (spent / budget_amount * 100).round(1)

      threshold = budget['alertThreshold'] || 85

      if percentage >= threshold
        alert = {
          'type' => 'budget_alert',
          'budgetId' => budget['id'],
          'budgetName' => budget['name'],
          'spent' => spent,
          'budget' => budget_amount,
          'percentage' => percentage,
          'severity' => percentage >= 100 ? 'critical' : 'warning'
        }

        alerts << alert
        puts "  ⚠️  #{budget['name']}: #{percentage}% used ($#{spent.round(2)} of $#{budget_amount})"
      end
    end

    if alerts.empty?
      puts "✅ All budgets within limits"
    else
      puts "⚠️  #{alerts.length} budget alert(s) generated"
    end

    alerts
  end

  ##
  # Calculate amount spent for a budget
  ##
  def calculate_budget_spent(budget, transactions)
    category_ids = budget['categoryIds'] || []
    current_month = Time.now.strftime('%Y-%m')

    spent = 0.0

    transactions.each do |transaction|
      next unless transaction['type'] == 'expense'
      next unless category_ids.include?(transaction['categoryId'])
      next if transaction['status'] == 'void'

      transaction_date = Time.parse(transaction['date'])
      if transaction_date.strftime('%Y-%m') == current_month
        spent += transaction['amount'].to_f
      end
    end

    spent
  end

  ##
  # Clean up old data
  ##
  def cleanup_old_data(days_to_keep = 365)
    puts "\n🧹 Cleaning up old data..."

    cutoff_date = Time.now - (days_to_keep * 24 * 60 * 60)
    original_count = @data['transactions'].length

    # Keep only transactions newer than cutoff or reconciled
    @data['transactions'].select! do |transaction|
      transaction_date = Time.parse(transaction['date'])
      transaction_date >= cutoff_date || transaction['status'] == 'reconciled'
    end

    deleted_count = original_count - @data['transactions'].length

    if deleted_count > 0
      save_data
      puts "✅ Deleted #{deleted_count} old transaction(s)"
    else
      puts "ℹ️  No old data to clean up"
    end
  end

  ##
  # Generate random ID (simplified)
  ##
  def generate_id
    Time.now.to_i.to_s(36) + rand(36**6).to_s(36)
  end

  ##
  # Run all scheduled tasks
  ##
  def run_all_tasks
    puts "=" * 60
    puts "FINANCE TRACKER - SCHEDULED TASKS"
    puts "=" * 60
    puts "Started at: #{Time.now}"

    process_recurring_transactions
    send_budget_alerts
    cleanup_old_data

    puts "\n" + "=" * 60
    puts "✅ All scheduled tasks completed"
    puts "=" * 60
  end
end

# Run scheduler if executed directly
if __FILE__ == $0
  scheduler = TaskScheduler.new
  scheduler.run_all_tasks
end
