# Ruby Gem Integration
# Demonstrates using Ruby gems from TypeScript via Elide

require 'json'
require 'digest'
require 'time'

module GemIntegration
  # Text processing using Ruby's string capabilities
  class TextProcessor
    def initialize
      @processed_count = 0
    end

    def process(text)
      @processed_count += 1
      {
        'original' => text,
        'upcase' => text.upcase,
        'downcase' => text.downcase,
        'reversed' => text.reverse,
        'length' => text.length,
        'word_count' => text.split.length,
        'processed_at' => Time.now.iso8601
      }
    end

    def stats
      {
        'total_processed' => @processed_count,
        'service' => 'ruby-text-processor'
      }
    end
  end

  # Cryptographic operations using Ruby's Digest
  class CryptoService
    ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512']

    def hash(data, algorithm = 'sha256')
      unless ALGORITHMS.include?(algorithm)
        raise ArgumentError, "Unsupported algorithm: #{algorithm}"
      end

      digest_class = case algorithm
                     when 'md5' then Digest::MD5
                     when 'sha1' then Digest::SHA1
                     when 'sha256' then Digest::SHA256
                     when 'sha512' then Digest::SHA512
                     end

      {
        'algorithm' => algorithm,
        'hash' => digest_class.hexdigest(data),
        'input_length' => data.length,
        'generated_at' => Time.now.iso8601
      }
    end

    def batch_hash(data_array, algorithm = 'sha256')
      data_array.map { |data| hash(data, algorithm) }
    end

    def compare_hash(data, expected_hash, algorithm = 'sha256')
      result = hash(data, algorithm)
      {
        'match' => result['hash'] == expected_hash,
        'computed' => result['hash'],
        'expected' => expected_hash,
        'algorithm' => algorithm
      }
    end
  end

  # Data transformation using Ruby's powerful data structures
  class DataTransformer
    def transform(data)
      case data
      when Hash
        transform_hash(data)
      when Array
        transform_array(data)
      when String
        transform_string(data)
      else
        { 'error' => 'Unsupported data type' }
      end
    end

    private

    def transform_hash(hash)
      {
        'type' => 'hash',
        'keys' => hash.keys,
        'values' => hash.values,
        'size' => hash.size,
        'json' => hash.to_json,
        'transformed' => hash.transform_keys(&:to_sym)
      }
    end

    def transform_array(array)
      {
        'type' => 'array',
        'size' => array.size,
        'first' => array.first,
        'last' => array.last,
        'sum' => array.select { |x| x.is_a?(Numeric) }.sum,
        'sorted' => array.sort
      }
    end

    def transform_string(string)
      {
        'type' => 'string',
        'length' => string.length,
        'words' => string.split,
        'capitalize' => string.capitalize,
        'snake_case' => string.gsub(/\s+/, '_').downcase
      }
    end
  end

  # Gem wrapper facade
  class GemWrapper
    attr_reader :text_processor, :crypto_service, :data_transformer

    def initialize
      @text_processor = TextProcessor.new
      @crypto_service = CryptoService.new
      @data_transformer = DataTransformer.new
    end

    def info
      {
        'service' => 'Ruby Gem Integration',
        'ruby_version' => RUBY_VERSION,
        'capabilities' => [
          'text-processing',
          'cryptography',
          'data-transformation'
        ],
        'gems' => ['json', 'digest', 'time']
      }
    end

    def health_check
      {
        'status' => 'healthy',
        'ruby_runtime' => 'active',
        'processors' => {
          'text' => @text_processor.class.name,
          'crypto' => @crypto_service.class.name,
          'data' => @data_transformer.class.name
        }
      }
    end
  end
end

# Export wrapper instance
$gem_wrapper = GemIntegration::GemWrapper.new
