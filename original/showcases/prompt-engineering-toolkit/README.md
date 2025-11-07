# Prompt Engineering Toolkit

A comprehensive toolkit for managing, testing, and optimizing prompts for LLM applications. Built with Elide for high-performance prompt experimentation and production deployment.

## Overview

This showcase implements a production-ready prompt engineering platform that provides:

- **Template Management** - Create, version, and organize prompts
- **Variable Injection** - Dynamic prompt rendering with variables
- **A/B Testing** - Compare prompt variants scientifically
- **Performance Metrics** - Track quality, latency, and cost
- **Optimization Analysis** - Get suggestions to improve prompts
- **Multi-Model Testing** - Test across different LLMs
- **Cost Tracking** - Monitor token usage and expenses

## Features

### Prompt Templates
- Create reusable prompt templates
- Variable placeholders with `{{variable}}` syntax
- Automatic variable extraction
- Template validation
- Example inputs and outputs

### Version Control
- Multiple versions per template
- Track changes over time
- Compare versions
- Rollback capabilities

### A/B Testing
- Multi-variant testing
- Weighted distribution
- Statistical metrics
- Winner selection

### Analytics
- Execution tracking
- Performance metrics
- Cost analysis
- Quality scores

### Optimization
- Prompt analysis
- Quality scoring
- Improvement suggestions
- Best practices validation

## Quick Start

### Prerequisites
- Elide CLI installed
- Basic understanding of prompt engineering

### Running the Service

```bash
# Start the service
elide run server.ts

# Service will start on http://localhost:8084
```

### Basic Usage

```bash
# Health check
curl http://localhost:8084/health

# List templates
curl http://localhost:8084/v1/templates

# Create a template
curl -X POST http://localhost:8084/v1/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Writer",
    "template": "Write a {{tone}} email about {{topic}} to {{recipient}}.",
    "metadata": {
      "description": "Generates professional emails",
      "category": "communication"
    }
  }'

# Execute a template
curl -X POST http://localhost:8084/v1/templates/email_writer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "tone": "professional",
      "topic": "project update",
      "recipient": "team"
    },
    "temperature": 0.7
  }'

# Analyze a prompt
curl -X POST http://localhost:8084/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "template": "Write something about stuff"
  }'
```

## API Reference

### Template Management

#### POST /v1/templates

Create a new prompt template.

**Request:**
```json
{
  "name": "Code Generator",
  "version": "1.0.0",
  "template": "Generate {{language}} code that does:\n\n{{task}}\n\nRequirements:\n{{requirements}}",
  "metadata": {
    "description": "Generates code based on requirements",
    "category": "development",
    "tags": ["code", "generation"],
    "author": "Alice"
  },
  "examples": [
    {
      "input": {
        "language": "Python",
        "task": "Read a CSV file",
        "requirements": "Use pandas library"
      },
      "expectedOutput": "import pandas as pd\ndf = pd.read_csv('file.csv')"
    }
  ]
}
```

**Response:**
```json
{
  "id": "code_generator",
  "name": "Code Generator",
  "version": "1.0.0",
  "template": "Generate {{language}} code...",
  "variables": ["language", "task", "requirements"],
  "metadata": {...},
  "examples": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### GET /v1/templates

List all templates (latest versions).

**Response:**
```json
{
  "templates": [
    {
      "id": "code_generator",
      "name": "Code Generator",
      "version": "1.0.0",
      ...
    }
  ],
  "count": 1
}
```

#### GET /v1/templates/{id}

Get a specific template.

**Query Parameters:**
- `version` (optional): Specific version to retrieve

**Response:**
```json
{
  "id": "code_generator",
  "name": "Code Generator",
  "version": "1.0.0",
  "template": "Generate {{language}} code...",
  "variables": ["language", "task", "requirements"],
  ...
}
```

#### GET /v1/templates/{id}/versions

List all versions of a template.

**Response:**
```json
{
  "versions": [
    {
      "id": "code_generator",
      "version": "2.0.0",
      "updatedAt": "2024-01-20T10:30:00Z"
    },
    {
      "id": "code_generator",
      "version": "1.0.0",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 2
}
```

### Execution

#### POST /v1/templates/{id}/execute

Execute a template with variables.

**Request:**
```json
{
  "variables": {
    "language": "Python",
    "task": "Sort a list",
    "requirements": "Use built-in sorted function"
  },
  "version": "1.0.0",
  "model": "gpt-4",
  "temperature": 0.7,
  "score": 8.5
}
```

**Response:**
```json
{
  "executionId": "exec_1234567890_abc123",
  "response": "Here's the Python code:\n\nnumbers = [3, 1, 4, 1, 5]\nsorted_numbers = sorted(numbers)",
  "tokensUsed": 145,
  "latency": 234,
  "cost": 0.00435
}
```

### Analytics

#### GET /v1/templates/{id}/metrics

Get performance metrics for a template.

**Query Parameters:**
- `version` (optional): Specific version

**Response:**
```json
{
  "totalExecutions": 1247,
  "averageScore": 8.3,
  "averageLatency": 245.5,
  "averageCost": 0.00428,
  "averageTokens": 142
}
```

### Optimization

#### POST /v1/analyze

Analyze a prompt and get optimization suggestions.

**Request:**
```json
{
  "template": "Write something about stuff and whatever"
}
```

**Response:**
```json
{
  "score": 40,
  "suggestions": [
    {
      "type": "specificity",
      "severity": "high",
      "message": "Prompt contains vague language",
      "suggestion": "Replace vague terms with specific instructions and requirements"
    },
    {
      "type": "clarity",
      "severity": "low",
      "message": "No role definition found",
      "suggestion": "Start with role definition like 'You are an expert...'"
    },
    {
      "type": "examples",
      "severity": "low",
      "message": "No examples provided",
      "suggestion": "Add few-shot examples to improve output quality"
    }
  ]
}
```

### A/B Testing

#### POST /v1/tests

Create an A/B test.

**Request:**
```json
{
  "name": "Email Tone Test",
  "variants": [
    {
      "id": "variant_a",
      "templateId": "email_writer",
      "templateVersion": "1.0.0",
      "weight": 50
    },
    {
      "id": "variant_b",
      "templateId": "email_writer",
      "templateVersion": "2.0.0",
      "weight": 50
    }
  ]
}
```

**Response:**
```json
{
  "id": "test_1234567890_abc123",
  "name": "Email Tone Test",
  "variants": [...],
  "status": "draft",
  "metrics": []
}
```

#### POST /v1/tests/{id}/start

Start an A/B test.

**Response:**
```json
{
  "success": true
}
```

#### POST /v1/tests/{id}/complete

Complete an A/B test and get final results.

**Response:**
```json
{
  "id": "test_1234567890_abc123",
  "name": "Email Tone Test",
  "status": "completed",
  "metrics": [
    {
      "variant": "variant_a",
      "executions": 512,
      "averageScore": 7.8,
      "averageLatency": 234,
      "averageCost": 0.0042
    },
    {
      "variant": "variant_b",
      "executions": 488,
      "averageScore": 8.5,
      "averageLatency": 245,
      "averageCost": 0.0045
    }
  ],
  "startedAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-20T10:00:00Z"
}
```

## Usage Examples

### Creating a Code Review Template

```bash
curl -X POST http://localhost:8084/v1/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Reviewer",
    "template": "You are an expert code reviewer.\n\nReview this {{language}} code:\n\n```\n{{code}}\n```\n\nProvide:\n1. Code quality assessment\n2. Potential bugs\n3. Security concerns\n4. Performance suggestions",
    "metadata": {
      "category": "development",
      "tags": ["code", "review"]
    }
  }'
```

### Executing with Variables

```bash
curl -X POST http://localhost:8084/v1/templates/code_reviewer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "language": "JavaScript",
      "code": "function add(a, b) { return a + b; }"
    },
    "temperature": 0.3,
    "model": "gpt-4"
  }'
```

### Running an A/B Test

```bash
# Create test
TEST_ID=$(curl -X POST http://localhost:8084/v1/tests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prompt Style Test",
    "variants": [
      {"id": "formal", "templateId": "email_writer", "templateVersion": "1.0.0", "weight": 50},
      {"id": "casual", "templateId": "email_writer", "templateVersion": "2.0.0", "weight": 50}
    ]
  }' | jq -r '.id')

# Start test
curl -X POST http://localhost:8084/v1/tests/$TEST_ID/start

# Run executions... (execute templates multiple times)

# Complete test
curl -X POST http://localhost:8084/v1/tests/$TEST_ID/complete
```

### Analyzing Prompt Quality

```bash
curl -X POST http://localhost:8084/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "template": "You are a helpful assistant. Write something about the topic."
  }'
```

## Integration Examples

### Python Client

```python
import requests

class PromptToolkit:
    def __init__(self, base_url="http://localhost:8084"):
        self.base_url = base_url

    def create_template(self, name, template, metadata=None):
        response = requests.post(
            f"{self.base_url}/v1/templates",
            json={
                "name": name,
                "template": template,
                "metadata": metadata or {}
            }
        )
        return response.json()

    def execute(self, template_id, variables, temperature=0.7, model="gpt-3.5-turbo"):
        response = requests.post(
            f"{self.base_url}/v1/templates/{template_id}/execute",
            json={
                "variables": variables,
                "temperature": temperature,
                "model": model
            }
        )
        return response.json()

    def analyze(self, template):
        response = requests.post(
            f"{self.base_url}/v1/analyze",
            json={"template": template}
        )
        return response.json()

    def get_metrics(self, template_id, version=None):
        params = {"version": version} if version else {}
        response = requests.get(
            f"{self.base_url}/v1/templates/{template_id}/metrics",
            params=params
        )
        return response.json()

# Usage
toolkit = PromptToolkit()

# Create template
template = toolkit.create_template(
    "summarizer",
    "Summarize this in {{length}} sentences:\n\n{{text}}",
    {"category": "content"}
)

# Execute
result = toolkit.execute(
    "summarizer",
    {"text": "Long article...", "length": "3"},
    temperature=0.5
)

print(f"Response: {result['response']}")
print(f"Cost: ${result['cost']:.4f}")

# Get metrics
metrics = toolkit.get_metrics("summarizer")
print(f"Average score: {metrics['averageScore']}")
```

### TypeScript Client

```typescript
class PromptToolkit {
  constructor(private baseUrl = "http://localhost:8084") {}

  async createTemplate(name: string, template: string, metadata?: any) {
    const response = await fetch(`${this.baseUrl}/v1/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, template, metadata })
    });
    return response.json();
  }

  async execute(
    templateId: string,
    variables: Record<string, any>,
    options: { temperature?: number; model?: string } = {}
  ) {
    const response = await fetch(
      `${this.baseUrl}/v1/templates/${templateId}/execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variables,
          temperature: options.temperature || 0.7,
          model: options.model || "gpt-3.5-turbo"
        })
      }
    );
    return response.json();
  }

  async analyze(template: string) {
    const response = await fetch(`${this.baseUrl}/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template })
    });
    return response.json();
  }

  async getMetrics(templateId: string, version?: string) {
    const params = new URLSearchParams();
    if (version) params.set("version", version);

    const response = await fetch(
      `${this.baseUrl}/v1/templates/${templateId}/metrics?${params}`
    );
    return response.json();
  }
}

// Usage
const toolkit = new PromptToolkit();

const template = await toolkit.createTemplate(
  "translator",
  "Translate to {{language}}:\n\n{{text}}",
  { category: "translation" }
);

const result = await toolkit.execute("translator", {
  language: "Spanish",
  text: "Hello, world!"
});

console.log("Translation:", result.response);
console.log("Cost:", result.cost);
```

## Best Practices

### Template Design

1. **Be Specific**: Clearly define the task and desired output
2. **Add Context**: Provide role and background information
3. **Use Examples**: Include few-shot examples for complex tasks
4. **Structure Well**: Use formatting and sections
5. **Version Control**: Track changes and improvements

### Variable Naming

- Use descriptive names: `{{user_question}}` not `{{q}}`
- Use snake_case or camelCase consistently
- Document expected format in metadata

### Testing Strategy

1. **Start Simple**: Test basic functionality first
2. **Iterate**: Refine based on results
3. **A/B Test**: Compare variants scientifically
4. **Monitor Metrics**: Track quality, cost, and latency
5. **Collect Feedback**: Get user ratings

### Cost Optimization

- Use cheaper models for simple tasks
- Reduce prompt length where possible
- Cache common results
- Set appropriate max_tokens limits
- Monitor cost per execution

## Prompt Engineering Patterns

### Chain of Thought

```json
{
  "template": "Solve this step by step:\n\nProblem: {{problem}}\n\nLet's break it down:\n1. First, identify...\n2. Then, calculate...\n3. Finally, conclude..."
}
```

### Few-Shot Learning

```json
{
  "template": "Classify the sentiment:\n\nExample 1:\nText: 'I love this!'\nSentiment: Positive\n\nExample 2:\nText: 'This is terrible'\nSentiment: Negative\n\nNow classify:\nText: '{{text}}'\nSentiment:"
}
```

### Role Playing

```json
{
  "template": "You are {{role}}, an expert in {{domain}}.\n\nA client asks: {{question}}\n\nRespond professionally with your expertise."
}
```

### Constrained Output

```json
{
  "template": "Answer in exactly {{format}}:\n\nQuestion: {{question}}\n\nFormat: {{format}}\n\nAnswer:"
}
```

## Production Considerations

### LLM Integration

Replace the mock LLM with real integrations:

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

class ProductionLLM {
  private openai: OpenAI;
  private anthropic: Anthropic;

  async generate(prompt: string, model: string, temperature: number) {
    if (model.startsWith('gpt')) {
      return this.openaiGenerate(prompt, model, temperature);
    } else if (model.startsWith('claude')) {
      return this.anthropicGenerate(prompt, model, temperature);
    }
  }

  private async openaiGenerate(prompt: string, model: string, temperature: number) {
    const response = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature
    });
    // Extract tokens, calculate cost, etc.
  }
}
```

### Persistence

Add database storage for templates and executions:

```typescript
// Use SQLite, PostgreSQL, or MongoDB
import Database from 'better-sqlite3';

class TemplateStore {
  private db: Database.Database;

  saveTemplate(template: PromptTemplate) {
    this.db.prepare(`
      INSERT INTO templates (id, name, version, template, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(template.id, template.name, template.version, template.template, JSON.stringify(template.metadata));
  }
}
```

### Security

- Validate all inputs
- Sanitize template variables
- Implement rate limiting
- Add authentication
- Audit logging

## Use Cases

1. **Product Development**: Iterate on product prompts
2. **Content Generation**: Manage content templates
3. **Customer Support**: Optimize support responses
4. **Research**: Test prompt hypotheses
5. **Education**: Teach prompt engineering
6. **Quality Assurance**: Monitor prompt performance

## Why Elide?

This showcase demonstrates Elide's advantages for prompt engineering:

1. **Fast Iteration**: Quick startup for rapid experimentation
2. **Performance**: Low latency for high-throughput testing
3. **Integration**: Easy to connect with LLM APIs
4. **Scalability**: Handle many concurrent tests
5. **Deployment**: Simple production deployment

## License

MIT License - See LICENSE file for details

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)
