# Elide Quiz Scorer

Simple scoring tool for the Elide Expert Quiz. Works locally and deploys to Vercel.

## Local Usage

### Score a file

```bash
cd scorer
npm install
node score.js ../my-answers.txt
```

### Answer file format

One answer per line, question number followed by answer:

```
1. B
2. A,C,D
3. export default async function fetch(req: Request): Promise<Response>
4. elide serve server.ts
...
```

### Example output

```
============================================================
ELIDE EXPERT QUIZ - RESULTS
============================================================

Total Questions: 260
Correct: 220
Incorrect: 30
Missing: 10

Score: 440/520 points
Percentage: 84.62%
Grade: Expert

------------------------------------------------------------
BY TOPIC:
------------------------------------------------------------
Runtime              85/100 (85.0%)
CLI                  70/80 (87.5%)
HTTP                 65/80 (81.3%)

============================================================
```

## Vercel Deployment

### Deploy

```bash
cd scorer
npm install -g vercel
vercel deploy
```

### API Usage

```bash
curl -X POST https://your-deployment.vercel.app/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": "B",
      "2": "A,C,D",
      "3": "export default async function fetch(req: Request): Promise<Response>"
    }
  }'
```

### Response

```json
{
  "success": true,
  "results": {
    "totalQuestions": 260,
    "correct": 220,
    "incorrect": 30,
    "missing": 10,
    "earnedPoints": 440,
    "totalPoints": 520,
    "percentage": "84.62",
    "grade": "Expert",
    "byTopic": {
      "Runtime": { "correct": 85, "total": 100, "points": 170, "maxPoints": 200 },
      "CLI": { "correct": 70, "total": 80, "points": 140, "maxPoints": 160 },
      "HTTP": { "correct": 65, "total": 80, "points": 130, "maxPoints": 160 }
    }
  }
}
```

## Grading Scale

- **Master**: 95%+ (855/900 points)
- **Expert**: 85%+ (765/900 points)
- **Pass**: 70%+ (630/900 points)
- **Fail**: <70%

## Answer Key

The answer key is embedded in `score.js`. Currently includes first 260 questions. To add more:

1. Edit `score.js`
2. Add entries to `ANSWER_KEY` object
3. Format: `questionNum: { answer: 'B', points: 1, topic: 'TopicName' }`
4. For short answers, add `fuzzy: true` and `keywords: ['key', 'words']`

Example:

```javascript
const ANSWER_KEY = {
  1: { answer: 'B', points: 1, topic: 'Runtime' },
  2: { answer: 'A,C,D', points: 1, topic: 'Runtime' },
  211: { 
    answer: 'export default async function fetch',
    points: 2,
    topic: 'HTTP',
    fuzzy: true,
    keywords: ['export', 'default', 'async', 'function', 'fetch']
  }
};
```

## Testing

```bash
# Create sample answers file
cat > test-answers.txt << EOF
1. B
2. A,C,D
3. B
EOF

# Score it
node score.js test-answers.txt
```

## Architecture

- **score.js**: Core scoring logic (CLI + export for API)
- **api/score.js**: Vercel serverless function wrapper
- **vercel.json**: Vercel deployment config
- **package.json**: Dependencies (none for core, just Node.js)

## Extending

To add more questions to the answer key:

1. Open `score.js`
2. Find `const ANSWER_KEY = {`
3. Add new entries following the pattern
4. Update total points calculation if needed

## License

CC-BY-4.0 - Free to use, modify, and share with attribution.

