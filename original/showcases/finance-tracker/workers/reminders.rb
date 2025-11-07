#!/usr/bin/env ruby

##
# Reminder System
#
# Send reminders for bills, budgets, and financial goals
##

require 'json'
require 'date'
require 'time'

class ReminderSystem
  attr_reader :data_path

  def initialize(data_path = 'data/finance-data.json')
    @data_path = data_path
    @data = load_data
  end

  def load_data
    if File.exist?(@data_path)
      JSON.parse(File.read(@data_path))
    else
      { 'transactions' => [], 'budgets' => [], 'accounts' => [] }
    end
  rescue JSON::ParserError
    {}
  end

  ##
  # Check for upcoming bills
  ##
  def check_upcoming_bills(days_ahead = 7)
    puts "\n📅 Checking upcoming bills (next #{days_ahead} days)..."

    recurring_rules = @data['recurring_rules'] || []
    upcoming = []

    recurring_rules.each do |rule|
      next unless rule['active']
      next unless rule['type'] == 'expense'

      last_run = rule['lastRun'] ? Time.parse(rule['lastRun']) : Time.now
      next_run = calculate_next_run(last_run, rule['frequency'])
      days_until = ((next_run - Time.now) / (24 * 60 * 60)).to_i

      if days_until >= 0 && days_until <= days_ahead
        upcoming << {
          'description' => rule['description'],
          'amount' => rule['amount'],
          'payee' => rule['payee'],
          'days_until' => days_until,
          'due_date' => next_run
        }

        puts "  💸 #{rule['description']} - $#{rule['amount']} due in #{days_until} day(s)"
      end
    end

    if upcoming.empty?
      puts "✅ No bills due in the next #{days_ahead} days"
    else
      puts "ℹ️  #{upcoming.length} bill(s) upcoming"
    end

    upcoming
  end

  ##
  # Calculate next run time
  ##
  def calculate_next_run(last_run, frequency)
    case frequency
    when 'daily'
      last_run + (24 * 60 * 60)
    when 'weekly'
      last_run + (7 * 24 * 60 * 60)
    when 'monthly'
      last_run + (30 * 24 * 60 * 60)
    when 'yearly'
      last_run + (365 * 24 * 60 * 60)
    else
      last_run + (30 * 24 * 60 * 60)
    end
  end

  ##
  # Check budget status
  ##
  def check_budget_status
    puts "\n💰 Checking budget status..."

    budgets = @data['budgets'] || []
    transactions = @data['transactions'] || []
    warnings = []

    budgets.each do |budget|
      next unless budget['status'] == 'active'

      spent = calculate_spent(budget, transactions)
      amount = budget['amount'].to_f
      percentage = (spent / amount * 100).round(1)

      status = if percentage >= 100
                 '🔴 Exceeded'
               elsif percentage >= 90
                 '🟡 Warning'
               elsif percentage >= 75
                 '🟢 On Track'
               else
                 '✅ Good'
               end

      puts "  #{status} #{budget['name']}: #{percentage}% ($#{spent.round(2)}/$#{amount})"

      if percentage >= 90
        warnings << {
          'budget_name' => budget['name'],
          'percentage' => percentage,
          'spent' => spent,
          'amount' => amount
        }
      end
    end

    warnings
  end

  ##
  # Calculate spent amount for budget
  ##
  def calculate_spent(budget, transactions)
    category_ids = budget['categoryIds'] || []
    current_month = Time.now.strftime('%Y-%m')

    spent = 0.0

    transactions.each do |transaction|
      next unless transaction['type'] == 'expense'
      next unless category_ids.include?(transaction['categoryId'])
      next if transaction['status'] == 'void'

      date = Time.parse(transaction['date'])
      spent += transaction['amount'].to_f if date.strftime('%Y-%m') == current_month
    end

    spent
  end

  ##
  # Check account balances
  ##
  def check_low_balances(threshold = 100)
    puts "\n🏦 Checking account balances..."

    accounts = @data['accounts'] || []
    low_balance = []

    accounts.each do |account|
      next unless account['status'] == 'active'

      balance = account['balance'].to_f

      if balance > 0 && balance < threshold
        low_balance << {
          'account_name' => account['name'],
          'balance' => balance,
          'type' => account['type']
        }

        puts "  ⚠️  #{account['name']}: Low balance $#{balance.round(2)}"
      elsif balance < 0 && account['type'] != 'credit_card'
        puts "  🔴 #{account['name']}: Negative balance $#{balance.round(2)}"
      end
    end

    if low_balance.empty?
      puts "✅ All accounts have sufficient balance"
    end

    low_balance
  end

  ##
  # Generate reminder summary
  ##
  def generate_summary
    puts "\n" + "=" * 60
    puts "REMINDER SUMMARY"
    puts "=" * 60

    upcoming_bills = check_upcoming_bills(7)
    budget_warnings = check_budget_status
    low_balances = check_low_balances(100)

    puts "\n" + "=" * 60
    puts "📊 Summary"
    puts "  Upcoming bills: #{upcoming_bills.length}"
    puts "  Budget warnings: #{budget_warnings.length}"
    puts "  Low balance accounts: #{low_balances.length}"
    puts "=" * 60

    {
      'upcoming_bills' => upcoming_bills,
      'budget_warnings' => budget_warnings,
      'low_balances' => low_balances,
      'generated_at' => Time.now.iso8601
    }
  end

  ##
  # Send daily summary
  ##
  def send_daily_summary
    puts "\n📧 Generating daily summary..."
    summary = generate_summary

    # In a real system, this would send an email or push notification
    # For this demo, we'll just print it

    total_items = summary['upcoming_bills'].length +
                  summary['budget_warnings'].length +
                  summary['low_balances'].length

    if total_items > 0
      puts "\n✉️  Daily summary: #{total_items} item(s) require attention"
    else
      puts "\n✅ No items require attention today"
    end

    summary
  end
end

# Run if executed directly
if __FILE__ == $0
  reminder = ReminderSystem.new
  reminder.send_daily_summary
end
