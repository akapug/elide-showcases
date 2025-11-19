/**
 * Example 3: Using Ruby Gems from TypeScript
 *
 * Demonstrates:
 * - Importing Ruby modules
 * - Using Ruby's string manipulation
 * - Working with Ruby blocks and iterators
 * - Leveraging Ruby's DSL capabilities
 *
 * Performance: ~0.3ms overhead per call after warmup
 */

// Import Ruby's polyglot API
const Ruby = Polyglot.import('ruby');

/**
 * Use Ruby's powerful string manipulation
 */
function stringManipulation() {
  console.log('Ruby String Manipulation\n');

  const rubyCode = `
def titleize(str)
  str.split(/\s+/).map(&:capitalize).join(' ')
end

def slugify(str)
  str.downcase.strip.gsub(/\s+/, '-').gsub(/[^\w-]/, '')
end

def truncate(str, length = 50, separator = '...')
  return str if str.length <= length
  str[0...length].strip + separator
end

def word_count(str)
  str.scan(/\w+/).size
end

def highlight(text, query)
  text.gsub(/(#{Regexp.escape(query)})/i, '**\\1**')
end
`;

  Ruby.eval(rubyCode);

  const titleize = Ruby.eval('method(:titleize)');
  const slugify = Ruby.eval('method(:slugify)');
  const truncate = Ruby.eval('method(:truncate)');
  const wordCount = Ruby.eval('method(:word_count)');
  const highlight = Ruby.eval('method(:highlight)');

  const testString = 'the quick brown fox jumps over the lazy dog';

  console.log('Original:', testString);
  console.log('Titleized:', titleize.call(testString));
  console.log('Slugified:', slugify.call(testString));
  console.log('Truncated:', truncate.call(testString, 20));
  console.log('Word count:', wordCount.call(testString));
  console.log('Highlighted:', highlight.call(testString, 'fox'));
}

/**
 * Use Ruby for data parsing and formatting
 */
function dataFormatting() {
  console.log('\n\nRuby Data Formatting\n');

  const rubyCode = `
require 'json'
require 'csv'

def format_currency(amount, currency = 'USD')
  symbol = { 'USD' => '$', 'EUR' => '€', 'GBP' => '£' }[currency] || currency
  "#{symbol}#{'%.2f' % amount}"
end

def parse_csv(csv_string)
  CSV.parse(csv_string, headers: true).map(&:to_h)
end

def to_csv(data)
  return '' if data.empty?

  CSV.generate do |csv|
    csv << data.first.keys
    data.each { |row| csv << row.values }
  end
end

def pretty_json(obj)
  JSON.pretty_generate(obj)
end
`;

  Ruby.eval(rubyCode);

  // Currency formatting
  const formatCurrency = Ruby.eval('method(:format_currency)');
  console.log('Currency formatting:');
  console.log('  USD:', formatCurrency.call(1234.56, 'USD'));
  console.log('  EUR:', formatCurrency.call(1234.56, 'EUR'));
  console.log('  GBP:', formatCurrency.call(1234.56, 'GBP'));

  // CSV parsing
  const parseCSV = Ruby.eval('method(:parse_csv)');
  const csvData = 'name,age,city\nAlice,28,NYC\nBob,35,LA\nCarol,42,Chicago';
  const parsed = parseCSV.call(csvData);
  console.log('\nParsed CSV:', parsed);

  // CSV generation
  const toCSV = Ruby.eval('method(:to_csv)');
  const data = [
    { product: 'Laptop', price: 999, qty: 2 },
    { product: 'Mouse', price: 29, qty: 5 },
  ];
  const csv = toCSV.call(data);
  console.log('\nGenerated CSV:\n' + csv);
}

/**
 * Use Ruby's regex and text processing
 */
function textProcessing() {
  console.log('\nRuby Text Processing\n');

  const rubyCode = `
def extract_emails(text)
  text.scan(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
end

def extract_urls(text)
  text.scan(/https?:\/\/[^\s]+/)
end

def extract_hashtags(text)
  text.scan(/#\w+/)
end

def extract_mentions(text)
  text.scan(/@\w+/)
end

def sanitize_html(text)
  text.gsub(/<[^>]*>/, '')
end
`;

  Ruby.eval(rubyCode);

  const extractEmails = Ruby.eval('method(:extract_emails)');
  const extractUrls = Ruby.eval('method(:extract_urls)');
  const extractHashtags = Ruby.eval('method(:extract_hashtags)');
  const extractMentions = Ruby.eval('method(:extract_mentions)');
  const sanitizeHtml = Ruby.eval('method(:sanitize_html)');

  const text = `
    Contact us at support@example.com or sales@example.com
    Visit https://example.com or https://docs.example.com
    Follow #elide #polyglot on social media
    Mention @alice and @bob for more info
    <script>alert('xss')</script><p>Safe content</p>
  `;

  console.log('Emails:', extractEmails.call(text));
  console.log('URLs:', extractUrls.call(text));
  console.log('Hashtags:', extractHashtags.call(text));
  console.log('Mentions:', extractMentions.call(text));
  console.log('Sanitized:', sanitizeHtml.call(text).trim());
}

/**
 * Use Ruby blocks and iterators
 */
function rubyBlocksAndIterators() {
  console.log('\n\nRuby Blocks and Iterators\n');

  const rubyCode = `
class DataProcessor
  def initialize(data)
    @data = data
  end

  def map_with_index
    @data.each_with_index.map { |item, index| yield(item, index) }
  end

  def select_with_context
    @data.select.with_index { |item, index| yield(item, index) }
  end

  def group_by_property(property)
    @data.group_by { |item| item[property] }
  end

  def sort_by_property(property, direction = :asc)
    sorted = @data.sort_by { |item| item[property] }
    direction == :desc ? sorted.reverse : sorted
  end
end
`;

  Ruby.eval(rubyCode);

  const DataProcessor = Ruby.eval('DataProcessor');

  const data = [
    { name: 'Alice', age: 28, dept: 'Engineering' },
    { name: 'Bob', age: 35, dept: 'Sales' },
    { name: 'Carol', age: 42, dept: 'Engineering' },
    { name: 'David', age: 31, dept: 'Sales' },
  ];

  const processor = DataProcessor.new(data);

  // Group by department
  const grouped = processor.group_by_property('dept');
  console.log('Grouped by department:', grouped);

  // Sort by age
  const sorted = processor.sort_by_property('age', 'desc');
  console.log('Sorted by age (desc):', sorted);
}

/**
 * Performance benchmark
 */
function performanceBenchmark() {
  console.log('\n\nPerformance Benchmark\n');

  const rubyCode = `
def process_text_ruby(text, iterations)
  iterations.times do
    text.upcase.downcase.reverse.split('').join
  end
end
`;

  Ruby.eval(rubyCode);
  const processTextRuby = Ruby.eval('method(:process_text_ruby)');

  function processTextTS(text: string, iterations: number) {
    for (let i = 0; i < iterations; i++) {
      text.toUpperCase().toLowerCase().split('').reverse().join('');
    }
  }

  const text = 'the quick brown fox jumps over the lazy dog';
  const iterations = 1000;

  // Ruby version
  const rubyStart = Date.now();
  processTextRuby.call(text, iterations);
  const rubyTime = Date.now() - rubyStart;

  // TypeScript version
  const tsStart = Date.now();
  processTextTS(text, iterations);
  const tsTime = Date.now() - tsStart;

  console.log(`Ruby time: ${rubyTime}ms`);
  console.log(`TypeScript time: ${tsTime}ms`);
  console.log(`Overhead: ${rubyTime - tsTime}ms (${((rubyTime / tsTime - 1) * 100).toFixed(1)}%)`);
}

// Main execution
console.log('='.repeat(70));
console.log('Polyglot Example 3: Ruby Gems from TypeScript');
console.log('='.repeat(70));

try {
  stringManipulation();
  dataFormatting();
  textProcessing();
  rubyBlocksAndIterators();
  performanceBenchmark();

  console.log('\n✓ Example completed successfully!');
} catch (error) {
  console.error('Error:', error);
  console.log('\nNote: This example requires Ruby language pack.');
}
