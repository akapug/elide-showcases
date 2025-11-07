# API Proxy Example - Ruby
#
# Proxies requests to external APIs with caching and rate limiting.

require 'json'
require 'net/http'
require 'uri'

# Simple cache
$cache = {}
$rate_limit = {}

def handler(event, context)
  action = event.dig('query', 'action') || 'proxy'

  case action
  when 'proxy'
    proxy_request(event, context)
  when 'cache-stats'
    cache_stats(event, context)
  else
    {
      statusCode: 400,
      error: "Unknown action: #{action}"
    }
  end
end

def proxy_request(event, context)
  url = event.dig('query', 'url')

  unless url
    return {
      statusCode: 400,
      error: 'URL parameter is required'
    }
  end

  # Check rate limit
  ip = event.dig('headers', 'x-forwarded-for') || 'unknown'
  if rate_limited?(ip)
    return {
      statusCode: 429,
      error: 'Rate limit exceeded',
      retryAfter: 60
    }
  end

  # Check cache
  cache_key = "proxy:#{url}"
  if $cache.key?(cache_key)
    cached = $cache[cache_key]

    if cached[:expires_at] > Time.now
      puts "Cache hit: #{cache_key}"
      return {
        statusCode: 200,
        data: cached[:data],
        cached: true,
        cachedAt: cached[:cached_at].iso8601
      }
    else
      # Expired, remove from cache
      $cache.delete(cache_key)
    end
  end

  # Make request
  begin
    puts "Fetching: #{url}"

    uri = URI.parse(url)
    response = Net::HTTP.get_response(uri)

    if response.is_a?(Net::HTTPSuccess)
      data = JSON.parse(response.body)

      # Cache response
      $cache[cache_key] = {
        data: data,
        cached_at: Time.now,
        expires_at: Time.now + 300 # 5 minutes
      }

      # Track rate limit
      track_request(ip)

      {
        statusCode: 200,
        data: data,
        cached: false,
        fetchedAt: Time.now.iso8601
      }
    else
      {
        statusCode: response.code.to_i,
        error: "Upstream error: #{response.message}"
      }
    end
  rescue => e
    puts "Error fetching URL: #{e.message}"
    {
      statusCode: 500,
      error: e.message
    }
  end
end

def cache_stats(event, context)
  {
    statusCode: 200,
    data: {
      size: $cache.size,
      entries: $cache.keys,
      rateLimits: $rate_limit.transform_values { |v| v[:count] }
    }
  }
end

def rate_limited?(ip)
  return false unless $rate_limit.key?(ip)

  limit_data = $rate_limit[ip]

  # Reset if window expired
  if limit_data[:window_start] + 60 < Time.now.to_i
    $rate_limit.delete(ip)
    return false
  end

  # Check limit
  limit_data[:count] >= 10 # 10 requests per minute
end

def track_request(ip)
  now = Time.now.to_i

  if $rate_limit.key?(ip)
    limit_data = $rate_limit[ip]

    # Reset if new window
    if limit_data[:window_start] + 60 < now
      $rate_limit[ip] = {
        count: 1,
        window_start: now
      }
    else
      limit_data[:count] += 1
    end
  else
    $rate_limit[ip] = {
      count: 1,
      window_start: now
    }
  end
end
