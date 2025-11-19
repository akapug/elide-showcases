# frozen_string_literal: true

##
# RSpec Bridge for Polyglot Testing Framework
#
# Integrates RSpec with the unified testing framework, providing
# cross-language test execution, assertions, and reporting.

require 'json'
require 'net/http'
require 'uri'

module PolyglotTesting
  ##
  # Custom assertion error with detailed information
  class AssertionError < StandardError
    attr_reader :actual, :expected, :operator

    def initialize(message, actual = nil, expected = nil, operator = '')
      super(message)
      @actual = actual
      @expected = expected
      @operator = operator
    end
  end

  ##
  # Unified assertion library for Ruby
  class Assertion
    attr_reader :actual

    def initialize(actual, negated: false)
      @actual = actual
      @negated = negated
    end

    def not
      self.class.new(@actual, negated: !@negated)
    end

    def to_be(expected)
      passed = @actual.equal?(expected)

      raise_assertion_error('to_be', expected) if should_fail?(passed)
    end

    def to_equal(expected)
      passed = @actual == expected

      raise_assertion_error('to_equal', expected) if should_fail?(passed)
    end

    def to_be_truthy
      passed = !!@actual

      raise_assertion_error('to_be_truthy', 'truthy value') if should_fail?(passed)
    end

    def to_be_falsy
      passed = !@actual

      raise_assertion_error('to_be_falsy', 'falsy value') if should_fail?(passed)
    end

    def to_be_nil
      passed = @actual.nil?

      raise_assertion_error('to_be_nil', nil) if should_fail?(passed)
    end

    def to_be_greater_than(expected)
      raise TypeError, 'to_be_greater_than can only be used with numbers' unless @actual.is_a?(Numeric)

      passed = @actual > expected

      raise_assertion_error('to_be_greater_than', expected) if should_fail?(passed)
    end

    def to_be_less_than(expected)
      raise TypeError, 'to_be_less_than can only be used with numbers' unless @actual.is_a?(Numeric)

      passed = @actual < expected

      raise_assertion_error('to_be_less_than', expected) if should_fail?(passed)
    end

    def to_contain(item)
      passed = case @actual
               when String, Array
                 @actual.include?(item)
               when Set
                 @actual.member?(item)
               else
                 raise TypeError, 'to_contain can only be used with strings, arrays, or sets'
               end

      raise_assertion_error('to_contain', item) if should_fail?(passed)
    end

    def to_have_length(length)
      raise TypeError, 'to_have_length can only be used with objects that respond to length' unless @actual.respond_to?(:length)

      passed = @actual.length == length

      if should_fail?(passed)
        raise AssertionError.new(
          "Expected length #{@actual.length} to be #{length}",
          @actual.length,
          length,
          'to_have_length'
        )
      end
    end

    def to_have_key(key, value = nil)
      raise TypeError, 'to_have_key can only be used with hashes' unless @actual.is_a?(Hash)

      has_key = @actual.key?(key)

      raise_assertion_error('to_have_key', key) if should_fail?(has_key) && value.nil?

      if has_key && !value.nil?
        actual_value = @actual[key]
        passed = actual_value == value

        if should_fail?(passed)
          raise AssertionError.new(
            "Expected key '#{key}' to have value #{value}, got #{actual_value}",
            actual_value,
            value,
            'to_have_key'
          )
        end
      end
    end

    def to_match(pattern)
      raise TypeError, 'to_match can only be used with strings' unless @actual.is_a?(String)

      regex = pattern.is_a?(Regexp) ? pattern : Regexp.new(pattern)
      passed = regex.match?(@actual)

      raise_assertion_error('to_match', pattern) if should_fail?(passed)
    end

    def to_raise_error(expected_error = nil)
      raise TypeError, 'to_raise_error can only be used with procs' unless @actual.is_a?(Proc)

      raised = false
      error = nil

      begin
        @actual.call
      rescue StandardError => e
        raised = true
        error = e
      end

      raise_assertion_error('to_raise_error', 'exception') if !raised && !@negated

      if raised && expected_error && !error.is_a?(expected_error)
        raise AssertionError.new(
          "Expected #{expected_error.name}, got #{error.class.name}",
          error.class.name,
          expected_error.name,
          'to_raise_error'
        )
      end
    end

    def to_be_instance_of(klass)
      passed = @actual.is_a?(klass)

      if should_fail?(passed)
        raise AssertionError.new(
          "Expected #{@actual} to be instance of #{klass.name}",
          @actual.class.name,
          klass.name,
          'to_be_instance_of'
        )
      end
    end

    def to_respond_to(method)
      passed = @actual.respond_to?(method)

      raise_assertion_error('to_respond_to', method) if should_fail?(passed)
    end

    private

    def should_fail?(passed)
      @negated ? passed : !passed
    end

    def raise_assertion_error(matcher, expected)
      message = @negated ? "not.#{matcher}" : matcher
      raise AssertionError.new(
        "Expected #{@actual.inspect} #{message} #{expected.inspect}",
        @actual,
        expected,
        matcher
      )
    end
  end

  ##
  # Test case representation
  class TestCase
    attr_reader :name, :block, :suite, :file, :line, :tags

    def initialize(name:, block:, suite:, file:, line:, tags: [])
      @name = name
      @block = block
      @suite = suite
      @file = file
      @line = line
      @tags = tags
    end
  end

  ##
  # Test result representation
  class TestResult
    attr_accessor :suite, :test, :language, :status, :duration, :error,
                  :stdout, :stderr, :start_time, :end_time

    def initialize
      @language = 'ruby'
      @status = 'running'
      @duration = 0
      @start_time = Time.now.to_f
      @end_time = 0
    end

    def to_h
      {
        suite: @suite,
        test: @test,
        language: @language,
        status: @status,
        duration: @duration,
        error: @error,
        stdout: @stdout,
        stderr: @stderr,
        start_time: @start_time,
        end_time: @end_time
      }
    end
  end

  ##
  # RSpec Bridge
  class Bridge
    attr_reader :test_suites, :results

    def initialize(config = {})
      @config = config
      @test_suites = []
      @current_suite = nil
      @results = []
      @bridge_url = config[:bridge_url] || 'http://localhost:9876'
    end

    def describe(name, &block)
      suite = {
        name: name,
        tests: [],
        before_all: [],
        after_all: [],
        before_each: [],
        after_each: []
      }

      previous_suite = @current_suite
      @current_suite = suite

      block.call

      @current_suite = previous_suite
      @test_suites << suite
    end

    def it(name, &block)
      raise 'it() can only be used inside describe()' unless @current_suite

      file, line = block.source_location

      test_case = TestCase.new(
        name: name,
        block: block,
        suite: @current_suite[:name],
        file: file,
        line: line
      )

      @current_suite[:tests] << test_case
    end

    def before_all(&block)
      raise 'before_all() can only be used inside describe()' unless @current_suite

      @current_suite[:before_all] << block
    end

    def after_all(&block)
      raise 'after_all() can only be used inside describe()' unless @current_suite

      @current_suite[:after_all] << block
    end

    def before_each(&block)
      raise 'before_each() can only be used inside describe()' unless @current_suite

      @current_suite[:before_each] << block
    end

    def after_each(&block)
      raise 'after_each() can only be used inside describe()' unless @current_suite

      @current_suite[:after_each] << block
    end

    def run_test(test)
      result = TestResult.new
      result.suite = test.suite
      result.test = test.name

      begin
        # Run before_each hooks
        @current_suite[:before_each].each(&:call)

        # Run test
        test.block.call

        result.status = 'passed'
      rescue AssertionError => e
        result.status = 'failed'
        result.error = {
          message: e.message,
          actual: e.actual,
          expected: e.expected,
          operator: e.operator,
          backtrace: e.backtrace
        }
      rescue StandardError => e
        result.status = 'failed'
        result.error = {
          message: e.message,
          backtrace: e.backtrace
        }
      ensure
        # Run after_each hooks
        @current_suite[:after_each].each do |hook|
          hook.call
        rescue StandardError => e
          puts "Error in after_each hook: #{e.message}"
        end
      end

      result.end_time = Time.now.to_f
      result.duration = result.end_time - result.start_time

      result
    end

    def run_suite(suite)
      @current_suite = suite
      results = []

      # Run before_all hooks
      suite[:before_all].each(&:call)

      # Run tests
      suite[:tests].each do |test|
        result = run_test(test)
        results << result
      end

      # Run after_all hooks
      suite[:after_all].each(&:call)

      results
    end

    def run_all
      all_results = []

      @test_suites.each do |suite|
        results = run_suite(suite)
        all_results.concat(results)
      end

      @results = all_results
      all_results
    end

    def report_to_bridge(results)
      uri = URI.parse("#{@bridge_url}/results")
      http = Net::HTTP.new(uri.host, uri.port)

      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request.body = {
        language: 'ruby',
        results: results.map(&:to_h)
      }.to_json

      response = http.request(request)

      puts "Failed to report results: #{response.body}" unless response.code == '200'
    rescue StandardError => e
      puts "Failed to connect to bridge: #{e.message}"
    end

    def summary
      passed = @results.count { |r| r.status == 'passed' }
      failed = @results.count { |r| r.status == 'failed' }
      skipped = @results.count { |r| r.status == 'skipped' }

      {
        total: @results.length,
        passed: passed,
        failed: failed,
        skipped: skipped,
        duration: @results.sum(&:duration)
      }
    end

    def print_summary
      sum = summary

      puts "\n=== Test Results ==="
      puts "Total: #{sum[:total]}"
      puts "Passed: #{sum[:passed]}"
      puts "Failed: #{sum[:failed]}"
      puts "Skipped: #{sum[:skipped]}"
      puts "Duration: #{sum[:duration].round(2)}s"
    end
  end

  ##
  # Module methods
  module_function

  def expect(actual)
    Assertion.new(actual)
  end

  # Global bridge instance
  @bridge = Bridge.new

  def describe(name, &block)
    @bridge.describe(name, &block)
  end

  def it(name, &block)
    @bridge.it(name, &block)
  end

  def before_all(&block)
    @bridge.before_all(&block)
  end

  def after_all(&block)
    @bridge.after_all(&block)
  end

  def before_each(&block)
    @bridge.before_each(&block)
  end

  def after_each(&block)
    @bridge.after_each(&block)
  end

  def run_tests
    results = @bridge.run_all
    @bridge.print_summary
    @bridge.report_to_bridge(results)

    summary = @bridge.summary
    summary[:failed].zero?
  end

  # Allow module to be included
  def self.included(base)
    base.extend(self)
  end
end

# Make methods available at top level
include PolyglotTesting

# Run tests if this is the main file
if __FILE__ == $PROGRAM_NAME
  success = PolyglotTesting.run_tests
  exit(success ? 0 : 1)
end
