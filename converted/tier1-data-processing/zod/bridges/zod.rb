# Zod for Ruby (via Elide)
#
# This is a Ruby implementation of Zod's validation API that works seamlessly
# with TypeScript Zod schemas. This demonstrates Elide's unique polyglot capabilities:
#
# - Define schemas once in TypeScript
# - Use the SAME schemas in Ruby
# - Share validation logic across services
# - Impossible with Node.js, Deno, or Bun!
#
# Example:
#   # Import schema defined in TypeScript
#   require './schemas'
#
#   # Use it in Ruby!
#   user = UserSchema.parse({ email: "test@example.com", age: 25 })

require 'json'
require 'date'

class ZodError < StandardError
  attr_reader :issues

  def initialize(issues)
    @issues = issues
    message = issues.map do |i|
      path = i[:path].empty? ? '' : "#{i[:path].join('.')}: "
      "#{path}#{i[:message]}"
    end.join('; ')
    super(message)
  end

  def format
    formatted = {}
    @issues.each do |issue|
      current = formatted
      issue[:path][0...-1].each do |key|
        current[key] ||= {}
        current = current[key]
      end

      last_key = issue[:path].empty? ? :_errors : issue[:path].last
      current[last_key] ||= []
      current[last_key] << issue[:message]
    end
    formatted
  end
end

class ZodType
  def parse(value)
    _parse(value)
  rescue ZodError
    raise
  rescue StandardError => e
    raise ZodError.new([{
      code: 'custom',
      message: e.message,
      path: []
    }])
  end

  def safe_parse(value)
    { success: true, data: _parse(value) }
  rescue ZodError => e
    { success: false, error: e }
  end

  def _parse(value)
    raise NotImplementedError
  end

  def optional
    ZodOptional.new(self)
  end

  def nullable
    ZodNullable.new(self)
  end

  def refine(message = 'Invalid value', &block)
    ZodRefinement.new(self, block, message)
  end
end

class ZodString < ZodType
  def initialize
    @checks = []
  end

  def _parse(value)
    unless value.is_a?(String)
      raise ZodError.new([{
        code: 'invalid_type',
        message: "Expected string, received #{value.class}",
        path: []
      }])
    end

    @checks.each do |check|
      case check[:kind]
      when 'min'
        if value.length < check[:value]
          raise ZodError.new([{
            code: 'too_small',
            message: "String must be at least #{check[:value]} characters",
            path: []
          }])
        end
      when 'max'
        if value.length > check[:value]
          raise ZodError.new([{
            code: 'too_big',
            message: "String must be at most #{check[:value]} characters",
            path: []
          }])
        end
      when 'email'
        unless value =~ /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          raise ZodError.new([{
            code: 'invalid_string',
            message: 'Invalid email',
            path: []
          }])
        end
      when 'url'
        unless value.start_with?('http://', 'https://')
          raise ZodError.new([{
            code: 'invalid_string',
            message: 'Invalid url',
            path: []
          }])
        end
      end
    end

    value
  end

  def min(value, message = nil)
    new_schema = ZodString.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'min', value: value, message: message }])
    new_schema
  end

  def max(value, message = nil)
    new_schema = ZodString.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'max', value: value, message: message }])
    new_schema
  end

  def email(message = nil)
    new_schema = ZodString.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'email', message: message }])
    new_schema
  end

  def url(message = nil)
    new_schema = ZodString.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'url', message: message }])
    new_schema
  end
end

class ZodNumber < ZodType
  def initialize
    @checks = []
  end

  def _parse(value)
    unless value.is_a?(Numeric)
      raise ZodError.new([{
        code: 'invalid_type',
        message: "Expected number, received #{value.class}",
        path: []
      }])
    end

    @checks.each do |check|
      case check[:kind]
      when 'min'
        if value < check[:value]
          raise ZodError.new([{
            code: 'too_small',
            message: "Number must be at least #{check[:value]}",
            path: []
          }])
        end
      when 'max'
        if value > check[:value]
          raise ZodError.new([{
            code: 'too_big',
            message: "Number must be at most #{check[:value]}",
            path: []
          }])
        end
      when 'int'
        unless value.is_a?(Integer)
          raise ZodError.new([{
            code: 'invalid_type',
            message: 'Expected integer, received float',
            path: []
          }])
        end
      end
    end

    value
  end

  def min(value, message = nil)
    new_schema = ZodNumber.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'min', value: value, message: message }])
    new_schema
  end

  def max(value, message = nil)
    new_schema = ZodNumber.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'max', value: value, message: message }])
    new_schema
  end

  def int(message = nil)
    new_schema = ZodNumber.new
    new_schema.instance_variable_set(:@checks, @checks + [{ kind: 'int', message: message }])
    new_schema
  end

  def positive(message = nil)
    min(0, message)
  end
end

class ZodBoolean < ZodType
  def _parse(value)
    unless value.is_a?(TrueClass) || value.is_a?(FalseClass)
      raise ZodError.new([{
        code: 'invalid_type',
        message: "Expected boolean, received #{value.class}",
        path: []
      }])
    end
    value
  end
end

class ZodObject < ZodType
  attr_reader :shape

  def initialize(shape)
    @shape = shape
  end

  def _parse(value)
    unless value.is_a?(Hash)
      raise ZodError.new([{
        code: 'invalid_type',
        message: "Expected object, received #{value.class}",
        path: []
      }])
    end

    result = {}
    issues = []

    @shape.each do |key, schema|
      begin
        result[key] = schema._parse(value[key] || value[key.to_s])
      rescue ZodError => e
        e.issues.each do |issue|
          issue[:path] = [key] + issue[:path]
          issues << issue
        end
      end
    end

    raise ZodError.new(issues) unless issues.empty?

    result
  end
end

class ZodArray < ZodType
  attr_reader :element_type
  attr_accessor :min_length, :max_length

  def initialize(element_type)
    @element_type = element_type
    @min_length = nil
    @max_length = nil
  end

  def _parse(value)
    unless value.is_a?(Array)
      raise ZodError.new([{
        code: 'invalid_type',
        message: "Expected array, received #{value.class}",
        path: []
      }])
    end

    if @min_length && value.length < @min_length
      raise ZodError.new([{
        code: 'too_small',
        message: "Array must have at least #{@min_length} elements",
        path: []
      }])
    end

    if @max_length && value.length > @max_length
      raise ZodError.new([{
        code: 'too_big',
        message: "Array must have at most #{@max_length} elements",
        path: []
      }])
    end

    result = []
    issues = []

    value.each_with_index do |item, i|
      begin
        result << @element_type._parse(item)
      rescue ZodError => e
        e.issues.each do |issue|
          issue[:path] = [i] + issue[:path]
          issues << issue
        end
      end
    end

    raise ZodError.new(issues) unless issues.empty?

    result
  end

  def min(value, message = nil)
    new_schema = ZodArray.new(@element_type)
    new_schema.min_length = value
    new_schema.max_length = @max_length
    new_schema
  end

  def max(value, message = nil)
    new_schema = ZodArray.new(@element_type)
    new_schema.min_length = @min_length
    new_schema.max_length = value
    new_schema
  end
end

class ZodEnum < ZodType
  attr_reader :values

  def initialize(values)
    @values = values
  end

  def _parse(value)
    unless @values.include?(value)
      raise ZodError.new([{
        code: 'invalid_enum_value',
        message: "Expected one of [#{@values.join(', ')}], received #{value}",
        path: []
      }])
    end
    value
  end
end

class ZodUnion < ZodType
  attr_reader :options

  def initialize(options)
    @options = options
  end

  def _parse(value)
    errors = []

    @options.each do |option|
      begin
        return option._parse(value)
      rescue ZodError => e
        errors << e
      end
    end

    raise ZodError.new([{
      code: 'invalid_union',
      message: "Invalid union value. Tried #{@options.length} options, all failed.",
      path: []
    }])
  end
end

class ZodOptional < ZodType
  def initialize(inner_type)
    @inner_type = inner_type
  end

  def _parse(value)
    return nil if value.nil?
    @inner_type._parse(value)
  end
end

class ZodNullable < ZodType
  def initialize(inner_type)
    @inner_type = inner_type
  end

  def _parse(value)
    return nil if value.nil?
    @inner_type._parse(value)
  end
end

class ZodRefinement < ZodType
  def initialize(inner_type, check, message)
    @inner_type = inner_type
    @check = check
    @message = message
  end

  def _parse(value)
    result = @inner_type._parse(value)
    unless @check.call(result)
      raise ZodError.new([{
        code: 'custom',
        message: @message,
        path: []
      }])
    end
    result
  end
end

# Main API module (mimics TypeScript's 'z')
module Z
  def self.string
    ZodString.new
  end

  def self.number
    ZodNumber.new
  end

  def self.boolean
    ZodBoolean.new
  end

  def self.object(shape)
    ZodObject.new(shape)
  end

  def self.array(element_type)
    ZodArray.new(element_type)
  end

  def self.enum(values)
    ZodEnum.new(values)
  end

  def self.union(options)
    ZodUnion.new(options)
  end
end

def validate_with_schema(data, schema_def)
  # Validate data using a serialized schema definition.
  # This allows TypeScript schemas to be used in Ruby!
  schema = deserialize_schema(schema_def)
  schema.parse(data)
end

def deserialize_schema(schema_def)
  # Convert a serialized schema back into a ZodType
  schema_type = schema_def['type']

  case schema_type
  when 'ZodString'
    schema = ZodString.new
    schema.instance_variable_set(:@checks, schema_def['checks'] || [])
    schema
  when 'ZodNumber'
    schema = ZodNumber.new
    schema.instance_variable_set(:@checks, schema_def['checks'] || [])
    schema
  when 'ZodBoolean'
    ZodBoolean.new
  when 'ZodObject'
    shape = {}
    schema_def['shape'].each do |key, field_def|
      shape[key.to_sym] = deserialize_schema(field_def)
    end
    ZodObject.new(shape)
  when 'ZodArray'
    element = deserialize_schema(schema_def['element'])
    schema = ZodArray.new(element)
    schema.min_length = schema_def['minLength']&.fetch('value', nil)
    schema.max_length = schema_def['maxLength']&.fetch('value', nil)
    schema
  when 'ZodEnum'
    ZodEnum.new(schema_def['values'])
  when 'ZodUnion'
    options = schema_def['options'].map { |opt| deserialize_schema(opt) }
    ZodUnion.new(options)
  when 'ZodOptional'
    ZodOptional.new(deserialize_schema(schema_def['inner']))
  when 'ZodNullable'
    ZodNullable.new(deserialize_schema(schema_def['inner']))
  else
    raise "Unknown schema type: #{schema_type}"
  end
end
