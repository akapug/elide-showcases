#!/usr/bin/env ruby

# Ruby Integration Example for elide-cron-parser

puts "=== Ruby Calling TypeScript Cron Parser ===\n"

# cron = Elide.require('./elide-cron-parser.ts')
# next_run = cron.getNextExecution("0 12 * * *")
# puts "Next run: #{next_run}"

puts "Real-world use case:"
puts "- Sidekiq worker needs cron scheduling"
puts "- Uses same implementation as Node.js scheduler"
puts "- Identical job timing across services"
puts ""

puts "Ruby Integration (when ready):"
puts "  cron = Elide.require('./elide-cron-parser.ts')"
puts "  next_run = cron.getNextExecution('0 */6 * * *')"
