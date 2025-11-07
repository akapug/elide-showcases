# Sentiment Analysis API

Production-ready sentiment analysis service with advanced NLP capabilities including emotion detection, entity analysis, and multi-language support.

## Reality Check

**Status:** Educational / Reference Implementation

**What This Is:**
- Complete sentiment analysis API with batch processing and analytics
- Production-ready structure showing emotion detection, entity extraction, and confidence scoring
- Demonstrates rule-based NLP with negation handling and intensifier detection
- Shows proper API patterns for text analysis services with multi-language support

**What This Isn't:**
- Uses keyword-based sentiment analysis, not deep learning models
- Entity extraction is pattern-based, not trained NER (Named Entity Recognition)
- Requires ML models (BERT, RoBERTa) for production-grade accuracy

**To Make It Production-Ready:**
1. Integrate transformer models like distilbert-base-uncased-finetuned-sst-2-english
2. Add proper NER models (spaCy, Hugging Face NER) for entity extraction
3. Use emotion classification models instead of keyword matching
4. Add language-specific models for accurate multi-language support

**Value:** Shows the complete API architecture for text analysis services including batch processing, analytics tracking, multi-language handling, and the response structures used by production sentiment APIs. The rule-based logic provides a solid baseline for testing and can be easily swapped with ML models.

## Features

### Core Analysis
- **Sentiment Classification**: Positive, negative, or neutral classification
- **Confidence Scores**: Detailed confidence metrics for predictions
- **Score Breakdown**: Individual scores for each sentiment class
- **Context-Aware**: Handles negation and intensifiers

### Advanced Features
- **Emotion Detection**: Detect joy, sadness, anger, fear, surprise, disgust, trust
- **Entity Extraction**: Extract and analyze sentiment of named entities
- **Batch Processing**: Process multiple texts efficiently
- **Multi-Language**: Support for English, Spanish, French, German, Italian, Portuguese

### Analytics & Monitoring
- **Usage Analytics**: Track sentiment distribution and trends
- **Performance Metrics**: Monitor processing times
- **Language Distribution**: Track language usage
- **Emotion Trends**: Monitor emotional patterns

## API Endpoints

### POST /analyze
Analyze sentiment of a single text.

**Request:**
```json
{
  "text": "I absolutely love this product! It exceeded my expectations.",
  "language": "en",
  "includeEmotions": true,
  "includeEntities": true
}
```

**Response:**
```json
{
  "text": "I absolutely love this product! It exceeded my expectations.",
  "sentiment": "positive",
  "confidence": 0.89,
  "scores": {
    "positive": 0.92,
    "negative": 0.03,
    "neutral": 0.05
  },
  "emotions": {
    "joy": 0.65,
    "sadness": 0.02,
    "anger": 0.01,
    "fear": 0.01,
    "surprise": 0.25,
    "disgust": 0.01,
    "trust": 0.05
  },
  "entities": [
    {
      "text": "Product",
      "type": "product",
      "sentiment": "positive",
      "confidence": 0.87,
      "startIndex": 22,
      "endIndex": 29
    }
  ],
  "language": "en",
  "processingTime": 12
}
```

**Parameters:**
- `text` (required): Text to analyze
- `language` (optional): Language code (auto-detected if not provided)
- `includeEmotions` (optional): Include emotion detection
- `includeEntities` (optional): Include entity extraction

### POST /analyze/batch
Analyze sentiment of multiple texts in batch.

**Request:**
```json
{
  "texts": [
    "This is great!",
    "This is terrible.",
    "This is okay."
  ],
  "language": "en",
  "includeEmotions": false,
  "includeEntities": false
}
```

**Response:**
```json
{
  "results": [
    {
      "text": "This is great!",
      "sentiment": "positive",
      "confidence": 0.85,
      "scores": {
        "positive": 0.9,
        "negative": 0.05,
        "neutral": 0.05
      },
      "language": "en",
      "processingTime": 8
    },
    {
      "text": "This is terrible.",
      "sentiment": "negative",
      "confidence": 0.87,
      "scores": {
        "positive": 0.02,
        "negative": 0.95,
        "neutral": 0.03
      },
      "language": "en",
      "processingTime": 7
    }
  ],
  "totalProcessed": 3,
  "averageProcessingTime": 7.5
}
```

### GET /languages
List supported languages.

**Response:**
```json
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "supported": true
    },
    {
      "code": "es",
      "name": "Spanish",
      "supported": true
    },
    {
      "code": "fr",
      "name": "French",
      "supported": true
    }
  ]
}
```

### GET /analytics
Get usage analytics and statistics.

**Response:**
```json
{
  "totalRequests": 1547,
  "sentimentDistribution": {
    "positive": 678,
    "negative": 234,
    "neutral": 635
  },
  "averageConfidence": 0.82,
  "languageDistribution": {
    "en": 1200,
    "es": 234,
    "fr": 113
  },
  "emotionDistribution": {
    "joy": 456,
    "anger": 123,
    "sadness": 89
  }
}
```

### POST /analytics/reset
Reset analytics data.

**Response:**
```json
{
  "success": true
}
```

## Installation

```bash
bun install
```

## Usage

### Starting the Server

```bash
bun run server.ts
```

The server will start on `http://localhost:3004`.

### Basic Analysis

```bash
curl -X POST http://localhost:3004/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This movie was absolutely fantastic! Best film I have seen this year."
  }'
```

### Analysis with Emotions

```bash
curl -X POST http://localhost:3004/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am so disappointed with this purchase.",
    "includeEmotions": true
  }'
```

### Batch Analysis

```bash
curl -X POST http://localhost:3004/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "Great service!",
      "Terrible experience.",
      "It was okay."
    ]
  }'
```

## Sentiment Classification

### Sentiment Labels

**Positive:**
- Expresses favorable opinion or emotion
- Contains positive keywords (great, love, excellent)
- Confidence increases with intensifiers (very, extremely)

**Negative:**
- Expresses unfavorable opinion or emotion
- Contains negative keywords (bad, hate, terrible)
- Handles negation (not good = negative)

**Neutral:**
- Lacks clear positive or negative sentiment
- Factual or objective statements
- Balanced positive and negative elements

### Confidence Scores

Confidence ranges from 0 to 1:
- **0.8-1.0**: High confidence, clear sentiment
- **0.6-0.8**: Medium confidence, reasonable certainty
- **0.4-0.6**: Low confidence, ambiguous sentiment
- **0.0-0.4**: Very low confidence, neutral or mixed

## Emotion Detection

### Supported Emotions

1. **Joy**: Happiness, delight, satisfaction
2. **Sadness**: Unhappiness, disappointment, sorrow
3. **Anger**: Frustration, irritation, rage
4. **Fear**: Worry, anxiety, nervousness
5. **Surprise**: Shock, amazement, unexpectedness
6. **Disgust**: Revulsion, distaste, aversion
7. **Trust**: Confidence, reliability, faith

### Emotion Scores

- Scores are normalized (sum to 1.0)
- Multiple emotions can be present simultaneously
- Dominant emotion typically has score > 0.3

## Entity Extraction

### Entity Types

- **Person**: Names of people
- **Organization**: Companies, institutions
- **Location**: Places, cities, countries
- **Product**: Product names and brands
- **Other**: Other named entities

### Entity Sentiment

Each entity includes:
- Sentiment classification (positive/negative/neutral)
- Confidence score
- Position in text (start/end indices)

Example:
```json
{
  "text": "Apple",
  "type": "organization",
  "sentiment": "positive",
  "confidence": 0.85,
  "startIndex": 10,
  "endIndex": 15
}
```

## Language Support

### Fully Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)

### Language Detection
If language is not specified, the API automatically detects:
- Character-based detection for CJK languages
- Default to English for Western languages

## Advanced Features

### Negation Handling

The API detects negation words and inverts sentiment:

```json
// "not good" is analyzed as negative
{
  "text": "This is not good",
  "sentiment": "negative"
}
```

Negation words: not, never, no, n't, hardly, barely

### Intensifier Detection

Intensifiers strengthen sentiment:

```json
// "very good" has higher positive score than "good"
{
  "text": "This is very good",
  "sentiment": "positive",
  "confidence": 0.95
}
```

Intensifiers: very, really, extremely, absolutely, totally

### Context Analysis

Entity sentiment is determined by surrounding context:

```json
{
  "text": "John is an excellent developer",
  "entities": [
    {
      "text": "John",
      "sentiment": "positive",  // Based on "excellent" context
      "confidence": 0.88
    }
  ]
}
```

## Use Cases

### Customer Feedback Analysis

```typescript
// Analyze product reviews
const reviews = [
  "Great product, highly recommend!",
  "Poor quality, not worth the price",
  "Average, nothing special"
];

const result = await fetch("http://localhost:3004/analyze/batch", {
  method: "POST",
  body: JSON.stringify({ texts: reviews })
});

const data = await result.json();
// Group by sentiment for insights
```

### Social Media Monitoring

```typescript
// Monitor brand mentions
const tweets = fetchTweets("#brandname");

const analysis = await fetch("http://localhost:3004/analyze/batch", {
  method: "POST",
  body: JSON.stringify({
    texts: tweets,
    includeEmotions: true,
    includeEntities: true
  })
});

// Track sentiment trends and influential entities
```

### Support Ticket Prioritization

```typescript
// Prioritize negative feedback
const ticket = {
  text: "I'm very frustrated with this issue!",
  includeEmotions: true
};

const analysis = await analyzeSentiment(ticket);

if (analysis.sentiment === "negative" &&
    analysis.emotions.anger > 0.5) {
  prioritizeTicket("HIGH");
}
```

### Content Moderation

```typescript
// Detect toxic content
const comment = "This is absolutely terrible and I hate it!";
const analysis = await analyzeSentiment(comment);

if (analysis.sentiment === "negative" &&
    analysis.confidence > 0.8 &&
    analysis.emotions.anger > 0.6) {
  flagForReview(comment);
}
```

## Performance Optimization

### Batch Processing

Process multiple texts efficiently:

```bash
# Process 1000 texts in batches of 100
for batch in batches:
  curl -X POST /analyze/batch -d '{"texts": batch}'
```

### Caching Strategy

Implement caching for repeated queries:

```typescript
const cache = new Map();

async function analyzeWithCache(text: string) {
  if (cache.has(text)) {
    return cache.get(text);
  }

  const result = await analyze(text);
  cache.set(text, result);
  return result;
}
```

### Async Processing

For large volumes, use async processing:

```typescript
const queue = texts.map(text =>
  fetch("/analyze", {
    method: "POST",
    body: JSON.stringify({ text })
  })
);

const results = await Promise.all(queue);
```

## Error Handling

### Common Errors

**Empty Text:**
```json
{
  "error": "Text is required"
}
```

**Unsupported Language:**
```json
{
  "error": "Language ja is not supported",
  "supportedLanguages": [...]
}
```

### Retry Logic

```typescript
async function analyzeWithRetry(text: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await analyze(text);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
}
```

## Analytics & Monitoring

### Track Sentiment Trends

```bash
# Get current analytics
curl http://localhost:3004/analytics

# Calculate sentiment ratio
positive_rate = positive / total_requests
```

### Monitor Performance

```typescript
// Track processing times
const times = results.map(r => r.processingTime);
const avgTime = times.reduce((a, b) => a + b) / times.length;

console.log(`Average processing time: ${avgTime}ms`);
```

### A/B Testing

```typescript
// Compare sentiment across groups
const groupA = await analyzeBatch(textsA);
const groupB = await analyzeBatch(textsB);

const sentimentDiff =
  groupA.positive_rate - groupB.positive_rate;
```

## Integration Examples

### Python Client

```python
import requests

def analyze_sentiment(text, include_emotions=False):
    response = requests.post(
        "http://localhost:3004/analyze",
        json={
            "text": text,
            "includeEmotions": include_emotions
        }
    )
    return response.json()

result = analyze_sentiment("I love this product!")
print(f"Sentiment: {result['sentiment']}")
print(f"Confidence: {result['confidence']}")
```

### JavaScript Client

```javascript
async function analyzeSentiment(text) {
  const response = await fetch("http://localhost:3004/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  return await response.json();
}

const result = await analyzeSentiment("This is amazing!");
console.log(result.sentiment); // "positive"
```

### Stream Processing

```typescript
import { Readable } from "stream";

async function processStream(textStream: Readable) {
  const batch = [];

  for await (const text of textStream) {
    batch.push(text);

    if (batch.length >= 100) {
      await analyzeBatch(batch);
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await analyzeBatch(batch);
  }
}
```

## Production Deployment

### Environment Variables

```bash
PORT=3004
MAX_BATCH_SIZE=1000
ENABLE_ANALYTICS=true
LOG_LEVEL=info
RATE_LIMIT=1000
CACHE_SIZE=10000
```

### Docker Deployment

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json .
RUN bun install
COPY . .
EXPOSE 3004
CMD ["bun", "run", "server.ts"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sentiment-analysis-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sentiment-api
  template:
    metadata:
      labels:
        app: sentiment-api
    spec:
      containers:
      - name: api
        image: sentiment-api:latest
        ports:
        - containerPort: 3004
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Best Practices

1. **Batch Processing**: Use batch endpoints for multiple texts
2. **Caching**: Cache results for frequently analyzed texts
3. **Rate Limiting**: Implement rate limits to prevent abuse
4. **Error Handling**: Always handle errors gracefully
5. **Monitoring**: Track analytics for insights
6. **Language Detection**: Let API auto-detect language when possible
7. **Context Window**: Provide sufficient context for accurate analysis

## Limitations

- Simple rule-based analysis (production systems should use ML models)
- Entity extraction is pattern-based (use NER models in production)
- Language detection is basic (use dedicated libraries for accuracy)
- Emotion detection uses keyword matching (use emotion classification models)

## Future Enhancements

- Deep learning models (BERT, RoBERTa)
- Advanced NER with transformers
- Aspect-based sentiment analysis
- Sarcasm detection
- Multi-modal sentiment (text + images)
- Real-time streaming analysis
- Custom model training

## License

MIT
