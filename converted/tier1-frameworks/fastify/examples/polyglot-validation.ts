/**
 * Polyglot Schema Validation Example
 *
 * Demonstrates:
 * - Using Python for complex validation logic
 * - Using Ruby for data transformation
 * - Cross-language schema validation
 * - Mixing TypeScript, Python, and Ruby in a single API
 * - Real-world polyglot use cases
 *
 * Note: This example shows the API structure. To run with actual polyglot
 * support, enable Polyglot.eval() in your Elide runtime configuration.
 */

import { fastify } from '../src/fastify';
import { PolyglotSchemaValidator } from '../src/schemas';

const app = fastify({
  logger: true,
});

// Route using Python for ML-based validation
app.post('/validate/ml-prediction', {
  schema: {
    body: {
      type: 'object',
      required: ['features'],
      properties: {
        features: {
          type: 'array',
          items: { type: 'number' },
          minItems: 4,
          maxItems: 4,
        },
      },
    },
  },
}, async (request, reply) => {
  const { features } = request.body;

  // In production Elide runtime with polyglot support:
  /*
  const validator = Polyglot.eval('python', `
import numpy as np
from sklearn.preprocessing import StandardScaler

class MLValidator:
    def __init__(self):
        self.scaler = StandardScaler()
        # Pretrained mean and std
        self.scaler.mean_ = np.array([5.0, 3.5, 1.5, 0.5])
        self.scaler.scale_ = np.array([1.0, 0.5, 1.0, 0.5])

    def validate_and_predict(self, features):
        # Validate feature ranges
        features_array = np.array(features)
        if np.any(features_array < 0):
            return {"valid": False, "error": "Features must be non-negative"}

        # Normalize and predict
        normalized = self.scaler.transform([features_array])[0]
        prediction = "setosa" if normalized[0] < 0 else "versicolor"
        confidence = abs(normalized[0]) * 0.5 + 0.5

        return {
            "valid": True,
            "prediction": prediction,
            "confidence": float(confidence),
            "normalized_features": normalized.tolist()
        }

MLValidator()
  `);

  const result = validator.validate_and_predict(features);
  */

  // Mock response for demonstration
  const result = {
    valid: true,
    prediction: 'setosa',
    confidence: 0.89,
    normalized_features: features.map(f => f / 10),
  };

  if (!result.valid) {
    reply.code(400).send({
      error: 'Validation failed',
      message: result.error,
    });
    return;
  }

  return {
    input: features,
    ...result,
    note: 'Enable Polyglot.eval() in Elide runtime for actual Python execution',
  };
});

// Route using Ruby for text validation and transformation
app.post('/validate/text', {
  schema: {
    body: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', minLength: 1 },
        transform: {
          type: 'string',
          enum: ['titleize', 'camelize', 'underscore', 'dasherize'],
        },
      },
    },
  },
}, async (request, reply) => {
  const { text, transform } = request.body;

  // In production Elide runtime with polyglot support:
  /*
  const validator = Polyglot.eval('ruby', `
require 'active_support/core_ext/string'

class TextValidator
  def validate_and_transform(text, transform_type)
    # Validation rules
    return {valid: false, error: "Text contains profanity"} if contains_profanity?(text)
    return {valid: false, error: "Text too short"} if text.length < 3

    # Transform based on type
    transformed = case transform_type
    when 'titleize' then text.titleize
    when 'camelize' then text.camelize
    when 'underscore' then text.underscore
    when 'dasherize' then text.dasherize
    else text
    end

    {
      valid: true,
      original: text,
      transformed: transformed,
      word_count: text.split.length,
      char_count: text.length
    }
  end

  def contains_profanity?(text)
    # Simple profanity check
    profanity_list = ['badword1', 'badword2']
    profanity_list.any? { |word| text.downcase.include?(word) }
  end
end

TextValidator.new
  `);

  const result = validator.validate_and_transform(text, transform || 'titleize');
  */

  // Mock response for demonstration
  const transformations: Record<string, (s: string) => string> = {
    titleize: (s) => s.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    camelize: (s) => s.split(' ').map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(''),
    underscore: (s) => s.toLowerCase().replace(/\s+/g, '_'),
    dasherize: (s) => s.toLowerCase().replace(/\s+/g, '-'),
  };

  const transformFn = transformations[transform || 'titleize'] || ((s: string) => s);

  const result = {
    valid: true,
    original: text,
    transformed: transformFn(text),
    word_count: text.split(' ').length,
    char_count: text.length,
  };

  return {
    ...result,
    note: 'Enable Polyglot.eval() in Elide runtime for actual Ruby execution',
  };
});

// Route using Python for advanced data validation
app.post('/validate/data-quality', {
  schema: {
    body: {
      type: 'object',
      required: ['dataset'],
      properties: {
        dataset: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              label: { type: 'string' },
            },
          },
        },
      },
    },
  },
}, async (request, reply) => {
  const { dataset } = request.body;

  // In production Elide runtime:
  /*
  const validator = Polyglot.eval('python', `
import numpy as np
from scipy import stats

class DataQualityValidator:
    def validate(self, dataset):
        values = [item['value'] for item in dataset]

        if len(values) < 3:
            return {"valid": False, "error": "Need at least 3 data points"}

        # Statistical validation
        mean = np.mean(values)
        std = np.std(values)
        outliers = []

        for i, v in enumerate(values):
            z_score = abs((v - mean) / std) if std > 0 else 0
            if z_score > 3:
                outliers.append({"index": i, "value": v, "z_score": float(z_score)})

        return {
            "valid": True,
            "statistics": {
                "mean": float(mean),
                "std": float(std),
                "min": float(np.min(values)),
                "max": float(np.max(values)),
                "median": float(np.median(values))
            },
            "outliers": outliers,
            "quality_score": 1.0 - (len(outliers) / len(values))
        }

DataQualityValidator()
  `);

  const result = validator.validate(dataset);
  */

  // Mock response
  const values = dataset.map((item: any) => item.value);
  const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((a: number, v: number) => a + Math.pow(v - mean, 2), 0) / values.length
  );

  const result = {
    valid: true,
    statistics: {
      mean,
      std,
      min: Math.min(...values),
      max: Math.max(...values),
      median: values.sort((a: number, b: number) => a - b)[Math.floor(values.length / 2)],
    },
    outliers: [],
    quality_score: 0.95,
  };

  return {
    input_size: dataset.length,
    ...result,
    note: 'Enable Polyglot.eval() in Elide runtime for actual Python/SciPy execution',
  };
});

// Route demonstrating TypeScript → Python → Ruby pipeline
app.post('/validate/pipeline', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
  },
}, async (request, reply) => {
  const { email, password } = request.body;

  const pipeline = [];

  // Step 1: TypeScript validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  pipeline.push({
    stage: 'TypeScript',
    step: 'Email format validation',
    result: emailValid ? 'valid' : 'invalid',
  });

  if (!emailValid) {
    reply.code(400).send({
      error: 'Validation failed',
      pipeline,
    });
    return;
  }

  // Step 2: Python password strength check (mock)
  /*
  const pythonValidator = Polyglot.eval('python', `
import re

def check_password_strength(password):
    score = 0
    if len(password) >= 12: score += 2
    elif len(password) >= 8: score += 1
    if re.search(r'[A-Z]', password): score += 1
    if re.search(r'[a-z]', password): score += 1
    if re.search(r'[0-9]', password): score += 1
    if re.search(r'[!@#$%^&*]', password): score += 1

    strength = "weak" if score < 3 else "medium" if score < 5 else "strong"
    return {"score": score, "strength": strength}

check_password_strength
  `);

  const passwordStrength = pythonValidator(password);
  */

  const passwordStrength = {
    score: 5,
    strength: 'medium',
  };

  pipeline.push({
    stage: 'Python',
    step: 'Password strength analysis',
    result: passwordStrength,
  });

  // Step 3: Ruby email normalization (mock)
  /*
  const rubyNormalizer = Polyglot.eval('ruby', `
lambda { |email|
  normalized = email.downcase.strip
  domain = normalized.split('@').last

  {
    normalized: normalized,
    domain: domain,
    is_corporate: !['gmail.com', 'yahoo.com', 'hotmail.com'].include?(domain)
  }
}
  `);

  const emailInfo = rubyNormalizer.call(email);
  */

  const emailInfo = {
    normalized: email.toLowerCase().trim(),
    domain: email.split('@')[1],
    is_corporate: !['gmail.com', 'yahoo.com', 'hotmail.com'].includes(email.split('@')[1]),
  };

  pipeline.push({
    stage: 'Ruby',
    step: 'Email normalization',
    result: emailInfo,
  });

  // Step 4: Final TypeScript decision
  const approved = passwordStrength.strength !== 'weak';
  pipeline.push({
    stage: 'TypeScript',
    step: 'Final validation',
    result: approved ? 'approved' : 'rejected',
  });

  return {
    email: emailInfo.normalized,
    password_strength: passwordStrength.strength,
    approved,
    pipeline,
    note: 'This demonstrates a TypeScript → Python → Ruby → TypeScript validation pipeline',
  };
});

// Start server
const start = async () => {
  try {
    const address = await app.listen(3004);
    console.log(`Polyglot validation server listening on ${address}`);
    console.log('\nThis example demonstrates cross-language validation:');
    console.log('\n🐍 Python ML validation:');
    console.log('  curl -X POST http://localhost:3004/validate/ml-prediction -H "Content-Type: application/json" -d \'{"features":[5.1,3.5,1.4,0.2]}\'');
    console.log('\n💎 Ruby text transformation:');
    console.log('  curl -X POST http://localhost:3004/validate/text -H "Content-Type: application/json" -d \'{"text":"hello world","transform":"titleize"}\'');
    console.log('\n📊 Python data quality:');
    console.log('  curl -X POST http://localhost:3004/validate/data-quality -H "Content-Type: application/json" -d \'{"dataset":[{"value":10,"label":"a"},{"value":12,"label":"b"},{"value":11,"label":"c"}]}\'');
    console.log('\n🔗 Multi-language pipeline:');
    console.log('  curl -X POST http://localhost:3004/validate/pipeline -H "Content-Type: application/json" -d \'{"email":"user@example.com","password":"SecurePass123!"}\'');
    console.log('\n💡 Enable Polyglot.eval() in your Elide runtime for actual cross-language execution!');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
