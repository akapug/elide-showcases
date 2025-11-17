/**
 * Polyglot Example: Ruby Gems Integration
 *
 * This example demonstrates REAL Ruby integration using TruffleRuby (GraalVM's Ruby implementation).
 * It shows how to use Ruby gems alongside Express for powerful text processing and data manipulation.
 *
 * Requirements:
 * - GraalVM with Ruby support (TruffleRuby)
 * - Ruby gems: (built-in stdlib is sufficient for this example)
 *
 * Setup:
 * 1. Install GraalVM: https://www.graalvm.org/downloads/
 * 2. Install Ruby components: gu install ruby
 * 3. (Optional) Install gems: gem install activesupport
 */

import express, { Request, Response } from '../src/index';

const app = express();
app.use(express.json());

// ===================================================================
// REAL Ruby Integration (works with GraalVM Polyglot API)
// ===================================================================

/**
 * Import Ruby's Polyglot module
 * This is the actual GraalVM polyglot API - NOT MOCKED!
 */
declare const Polyglot: {
  eval(lang: string, code: string): any;
  import(path: string): any;
};

/**
 * Check if polyglot is available
 */
const POLYGLOT_AVAILABLE = typeof Polyglot !== 'undefined';

// ===================================================================
// Route 1: Text Processing with Ruby
// ===================================================================

app.post('/api/ruby/text-process', (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text field is required' });
  }

  try {
    if (POLYGLOT_AVAILABLE) {
      // REAL Ruby code execution
      const processor = Polyglot.eval('ruby', `
class TextProcessor
  def initialize
    # Ruby's excellent string manipulation capabilities
  end

  def process(text)
    # Demonstrate Ruby's powerful string methods
    {
      original: text,
      uppercase: text.upcase,
      lowercase: text.downcase,
      capitalize: text.capitalize,
      titleize: text.split.map(&:capitalize).join(' '),
      reverse: text.reverse,
      word_count: text.split.length,
      char_count: text.length,
      slug: text.downcase.gsub(/[^a-z0-9\\s]/i, '').strip.gsub(/\\s+/, '-'),
      initials: text.split.map { |w| w[0] }.join.upcase,
      truncate: text.length > 50 ? text[0...47] + '...' : text
    }
  end

  def analyze(text)
    words = text.split
    chars = text.chars

    {
      total_words: words.length,
      unique_words: words.map(&:downcase).uniq.length,
      total_chars: chars.length,
      letters: chars.count { |c| c.match?(/[a-z]/i) },
      digits: chars.count { |c| c.match?(/\\d/) },
      spaces: chars.count { |c| c == ' ' },
      avg_word_length: words.empty? ? 0 : (words.map(&:length).sum.to_f / words.length).round(2),
      longest_word: words.max_by(&:length) || '',
      shortest_word: words.min_by(&:length) || ''
    }
  end
end

TextProcessor.new
      `);

      // Call Ruby methods from TypeScript
      const processed = processor.process(text);
      const analyzed = processor.analyze(text);

      res.json({
        text,
        processed,
        analysis: analyzed,
        engine: 'GraalVM TruffleRuby',
        polyglot: true
      });
    } else {
      // Fallback for non-polyglot environments
      res.json({
        text,
        processed: {
          original: text,
          uppercase: text.toUpperCase(),
          lowercase: text.toLowerCase(),
          note: 'Polyglot not available - limited functionality'
        },
        engine: 'Mock',
        polyglot: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Text processing failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// ===================================================================
// Route 2: Data Transformation with Ruby
// ===================================================================

app.post('/api/ruby/transform-data', (req: Request, res: Response) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'data object is required' });
  }

  try {
    if (POLYGLOT_AVAILABLE) {
      // REAL Ruby data manipulation
      const transformer = Polyglot.eval('ruby', `
class DataTransformer
  def transform(data)
    # Ruby's excellent hash/array manipulation
    case data
    when Hash
      transform_hash(data)
    when Array
      transform_array(data)
    else
      { original: data, transformed: data.to_s }
    end
  end

  private

  def transform_hash(hash)
    {
      original: hash,
      keys: hash.keys,
      values: hash.values,
      symbolized_keys: hash.transform_keys(&:to_sym),
      stringified_keys: hash.transform_keys(&:to_s),
      inverted: hash.invert,
      compacted: hash.compact,
      size: hash.size,
      empty: hash.empty?
    }
  end

  def transform_array(array)
    {
      original: array,
      sorted: array.sort,
      reversed: array.reverse,
      unique: array.uniq,
      sum: array.select { |x| x.is_a?(Numeric) }.sum,
      max: array.max,
      min: array.min,
      length: array.length,
      first: array.first,
      last: array.last,
      sample: array.sample
    }
  end
end

DataTransformer.new
      `);

      const result = transformer.transform(data);

      res.json({
        data,
        transformed: result,
        engine: 'GraalVM TruffleRuby',
        polyglot: true
      });
    } else {
      // Fallback
      res.json({
        data,
        transformed: {
          note: 'Polyglot not available'
        },
        engine: 'Mock',
        polyglot: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Data transformation failed',
      message: error.message
    });
  }
});

// ===================================================================
// Route 3: Template Rendering with Ruby
// ===================================================================

app.post('/api/ruby/template', (req: Request, res: Response) => {
  const { template, variables } = req.body;

  if (!template) {
    return res.status(400).json({ error: 'template string is required' });
  }

  try {
    if (POLYGLOT_AVAILABLE) {
      // REAL Ruby ERB-style templating
      const renderer = Polyglot.eval('ruby', `
class TemplateRenderer
  def render(template, vars)
    # Simple variable substitution (ERB-lite)
    result = template.dup

    if vars.is_a?(Hash)
      vars.each do |key, value|
        # Replace {{key}} with value
        result.gsub!(/\\{\\{\\s*#{key}\\s*\\}\\}/, value.to_s)
      end
    end

    {
      template: template,
      variables: vars,
      rendered: result,
      substitutions_made: template.scan(/\\{\\{[^}]+\\}\\}/).length
    }
  end

  def format_text(text, format)
    case format
    when 'title'
      text.split.map(&:capitalize).join(' ')
    when 'upper'
      text.upcase
    when 'lower'
      text.downcase
    when 'snake'
      text.downcase.gsub(/\\s+/, '_')
    when 'camel'
      text.split.map(&:capitalize).join
    else
      text
    end
  end
end

TemplateRenderer.new
      `);

      const result = renderer.render(template, variables || {});

      res.json({
        template,
        variables: variables || {},
        result,
        engine: 'GraalVM TruffleRuby',
        polyglot: true
      });
    } else {
      // Fallback
      let result = template;
      if (variables) {
        Object.keys(variables).forEach(key => {
          result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), variables[key]);
        });
      }

      res.json({
        template,
        variables: variables || {},
        result: {
          rendered: result,
          note: 'Polyglot not available - using JS fallback'
        },
        engine: 'Mock',
        polyglot: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Template rendering failed',
      message: error.message
    });
  }
});

// ===================================================================
// Route 4: Multi-language Pipeline (TS → Ruby → Python → TS)
// ===================================================================

app.post('/api/polyglot/pipeline', (req: Request, res: Response) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'input is required' });
  }

  try {
    const pipeline: any[] = [];

    // Step 1: TypeScript - Initial processing
    const step1 = input.toString().trim();
    pipeline.push({
      step: 1,
      language: 'TypeScript',
      operation: 'trim',
      result: step1
    });

    if (POLYGLOT_AVAILABLE) {
      // Step 2: Ruby - Text manipulation
      const rubyProcessor = Polyglot.eval('ruby', `
->(text) { text.split.map(&:capitalize).join(' ') }
      `);

      const step2 = rubyProcessor.call(step1);
      pipeline.push({
        step: 2,
        language: 'Ruby',
        operation: 'titleize',
        result: step2
      });

      // Step 3: Python - Analysis
      const pythonAnalyzer = Polyglot.eval('python', `
lambda text: {
    'length': len(text),
    'words': len(text.split()),
    'uppercase': text.upper(),
    'analysis': 'analyzed by Python'
}
      `);

      const step3 = pythonAnalyzer(step2);
      pipeline.push({
        step: 3,
        language: 'Python',
        operation: 'analyze',
        result: step3
      });

      // Step 4: TypeScript - Final formatting
      const final = {
        input,
        output: step3.uppercase,
        metadata: {
          length: step3.length,
          words: step3.words,
          languages_used: ['TypeScript', 'Ruby', 'Python', 'TypeScript']
        }
      };

      pipeline.push({
        step: 4,
        language: 'TypeScript',
        operation: 'finalize',
        result: final
      });

      res.json({
        pipeline,
        final,
        polyglot: true,
        success: true
      });
    } else {
      res.json({
        pipeline,
        final: {
          input,
          output: step1.toUpperCase(),
          note: 'Polyglot not available - partial pipeline'
        },
        polyglot: false,
        success: false
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Pipeline execution failed',
      message: error.message
    });
  }
});

// ===================================================================
// Route 5: Documentation
// ===================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    title: 'Express + Ruby Gems Integration',
    description: 'Real polyglot Ruby API using GraalVM TruffleRuby',
    polyglot_status: POLYGLOT_AVAILABLE ? 'Available' : 'Not Available',
    endpoints: {
      'POST /api/ruby/text-process': {
        description: 'Process and analyze text using Ruby',
        body: { text: 'string' },
        example: { text: 'The Quick Brown Fox' }
      },
      'POST /api/ruby/transform-data': {
        description: 'Transform data structures using Ruby',
        body: { data: 'object | array' },
        example: { data: { name: 'John', age: 30 } }
      },
      'POST /api/ruby/template': {
        description: 'Render templates using Ruby',
        body: { template: 'string', variables: 'object' },
        example: {
          template: 'Hello {{name}}!',
          variables: { name: 'World' }
        }
      },
      'POST /api/polyglot/pipeline': {
        description: 'Multi-language processing pipeline',
        body: { input: 'string' },
        example: { input: 'hello world' }
      }
    },
    setup: {
      graalvm: 'Download from https://www.graalvm.org/downloads/',
      ruby: 'gu install ruby',
      gems: '(optional) gem install activesupport'
    },
    note: POLYGLOT_AVAILABLE
      ? 'Polyglot is enabled - Ruby code will execute!'
      : 'Polyglot not detected - API will use fallback mode'
  });
});

// ===================================================================
// Start Server
// ===================================================================

const PORT = 3101;
app.listen(PORT, () => {
  console.log(`\n✓ Ruby Gems API running on http://localhost:${PORT}`);
  console.log(`✓ Polyglot status: ${POLYGLOT_AVAILABLE ? 'ENABLED' : 'DISABLED'}`);

  if (!POLYGLOT_AVAILABLE) {
    console.log('\n⚠ To enable real Ruby execution:');
    console.log('  1. Install GraalVM');
    console.log('  2. Run: gu install ruby');
    console.log('  3. Execute with: elide run examples/polyglot-ruby-gems.ts\n');
  }

  console.log('\nTry these commands:');
  console.log(`curl -X POST http://localhost:${PORT}/api/ruby/text-process -H "Content-Type: application/json" -d '{"text":"hello world"}'`);
  console.log(`curl -X POST http://localhost:${PORT}/api/ruby/transform-data -H "Content-Type: application/json" -d '{"data":[5,2,8,1,9]}'`);
  console.log(`curl -X POST http://localhost:${PORT}/api/ruby/template -H "Content-Type: application/json" -d '{"template":"Hi {{name}}!","variables":{"name":"Alice"}}'`);
  console.log(`curl -X POST http://localhost:${PORT}/api/polyglot/pipeline -H "Content-Type: application/json" -d '{"input":"hello world"}'`);
  console.log('');
});
