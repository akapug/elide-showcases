# Hello World - Ruby Example
#
# Simple edge function that returns a greeting.

require 'time'

def handler(event, context)
  puts "Request received: #{event['path']}"

  name = event.dig('query', 'name') || 'World'

  {
    message: "Hello, #{name}!",
    timestamp: Time.now.iso8601,
    function: context['function_name'],
    requestId: context['request_id']
  }
end
