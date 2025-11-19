/**
 * Sentiment Analysis Demo
 * Demonstrates sentiment analysis capabilities with Elide polyglot
 */

import { SentimentAnalyzer, SentimentUtils } from '../src/analysis/sentiment-analyzer';

/**
 * Basic sentiment analysis example
 */
async function basicSentimentAnalysis() {
  console.log('=== Basic Sentiment Analysis ===\n');

  const analyzer = new SentimentAnalyzer();

  const texts = [
    "I absolutely love this product! Best purchase ever!",
    "This is terrible. Complete waste of money.",
    "It's okay, nothing special really.",
    "Amazing quality and fast shipping! Highly recommend!",
    "Very disappointed with the customer service."
  ];

  for (const text of texts) {
    const result = await analyzer.analyze(text);
    console.log(`Text: "${text}"`);
    console.log(`Sentiment: ${SentimentUtils.format(result)}\n`);
  }
}

/**
 * Batch sentiment analysis
 */
async function batchSentimentAnalysis() {
  console.log('\n=== Batch Sentiment Analysis ===\n');

  const analyzer = new SentimentAnalyzer();

  const reviews = [
    "Great product, works as expected!",
    "Not worth the price",
    "Exceeded my expectations",
    "Poor quality, broke after a week",
    "Perfect for my needs",
    "Would not recommend",
    "Best in class!",
    "Disappointing experience",
    "Good value for money",
    "Fantastic customer support"
  ];

  console.log(`Analyzing ${reviews.length} reviews...\n`);

  const results = await analyzer.analyzeBatch(reviews, {
    batchSize: 4,
    showProgress: true
  });

  // Aggregate statistics
  const stats = analyzer.aggregateStats(results);

  console.log('\n=== Aggregate Statistics ===');
  console.log(`Positive: ${(stats.positive * 100).toFixed(1)}%`);
  console.log(`Negative: ${(stats.negative * 100).toFixed(1)}%`);
  console.log(`Neutral: ${(stats.neutral * 100).toFixed(1)}%`);
  console.log(`Average Score: ${stats.averageScore.toFixed(3)}`);
  console.log(`Dominant Sentiment: ${stats.dominantSentiment}`);
}

/**
 * Aspect-based sentiment analysis
 */
async function aspectBasedSentiment() {
  console.log('\n=== Aspect-Based Sentiment Analysis ===\n');

  const analyzer = new SentimentAnalyzer();

  const review = `
    The phone has an amazing camera and the display is gorgeous.
    However, the battery life is disappointing and it charges slowly.
    The build quality feels premium but the price is too high.
    Customer service was helpful when I had questions.
  `;

  const aspects = ['camera', 'display', 'battery', 'price', 'service'];

  console.log('Analyzing review by aspects...\n');

  const aspectResults = await analyzer.analyzeByAspect(review, aspects);

  for (const result of aspectResults) {
    console.log(`Aspect: ${result.aspect}`);
    console.log(`Sentiment: ${result.sentiment} (${(result.score * 100).toFixed(1)}%)`);
    console.log(`Mention: "${result.snippet}"`);
    console.log();
  }
}

/**
 * Sentiment comparison
 */
async function sentimentComparison() {
  console.log('\n=== Sentiment Comparison ===\n');

  const analyzer = new SentimentAnalyzer();

  const text1 = "This product is absolutely fantastic! I love everything about it.";
  const text2 = "The product is okay, does what it's supposed to do.";

  const comparison = await analyzer.compare(text1, text2);

  console.log('Text 1:', text1);
  console.log(`Sentiment: ${comparison.text1.label} (${(comparison.text1.score * 100).toFixed(1)}%)\n`);

  console.log('Text 2:', text2);
  console.log(`Sentiment: ${comparison.text2.label} (${(comparison.text2.score * 100).toFixed(1)}%)\n`);

  console.log(`Difference: ${(comparison.difference * 100).toFixed(1)}%`);
  console.log(`More Positive: ${comparison.morePositive}`);
}

/**
 * Time series sentiment analysis
 */
async function timeSeriesSentiment() {
  console.log('\n=== Time Series Sentiment Analysis ===\n');

  const analyzer = new SentimentAnalyzer();

  const tweets = [
    { text: "Excited about the new product launch!", timestamp: new Date('2024-01-01') },
    { text: "Still waiting for delivery, getting frustrated", timestamp: new Date('2024-01-02') },
    { text: "Finally arrived! Quality is amazing!", timestamp: new Date('2024-01-03') },
    { text: "Had some issues but support was quick to help", timestamp: new Date('2024-01-04') },
    { text: "Overall very satisfied with my purchase", timestamp: new Date('2024-01-05') }
  ];

  console.log('Analyzing sentiment over time...\n');

  const timeSeries = await analyzer.analyzeTimeSeries(tweets);

  for (const entry of timeSeries) {
    console.log(`Date: ${entry.timestamp.toLocaleDateString()}`);
    console.log(`Text: "${entry.sentiment.text}"`);
    console.log(`Sentiment: ${entry.sentiment.label} (${(entry.sentiment.score * 100).toFixed(1)}%)`);
    console.log();
  }
}

/**
 * Multi-lingual sentiment analysis
 */
async function multilingualSentiment() {
  console.log('\n=== Multi-lingual Sentiment Analysis ===\n');

  // Note: This would require a multilingual model
  // Using the default model for demonstration
  const analyzer = new SentimentAnalyzer();

  const texts = [
    { text: "I love this product!", lang: "en" },
    { text: "Wonderful experience!", lang: "en" },
    { text: "Not good at all", lang: "en" }
  ];

  console.log('Analyzing multi-lingual reviews...\n');

  for (const item of texts) {
    const result = await analyzer.analyze(item.text);
    console.log(`[${item.lang.toUpperCase()}] ${item.text}`);
    console.log(`Sentiment: ${result.label} (${(result.score * 100).toFixed(1)}%)`);
    console.log();
  }
}

/**
 * Real-time sentiment monitoring
 */
async function realTimeSentimentMonitoring() {
  console.log('\n=== Real-Time Sentiment Monitoring ===\n');

  const analyzer = new SentimentAnalyzer();

  // Simulate streaming data
  const stream = [
    "Just bought the new phone, can't wait!",
    "Setup was so easy, impressed!",
    "Camera quality blew me away!",
    "Battery died quickly, not happy",
    "Called support, very helpful",
    "Overall a great purchase!"
  ];

  console.log('Monitoring sentiment stream...\n');

  const sentiments = { positive: 0, negative: 0, neutral: 0 };
  let totalScore = 0;

  for (let i = 0; i < stream.length; i++) {
    const text = stream[i];
    const result = await analyzer.analyze(text);

    // Update counters
    sentiments[result.label.toLowerCase() as keyof typeof sentiments]++;
    totalScore += result.score * (result.label === 'POSITIVE' ? 1 : -1);

    console.log(`[${i + 1}/${stream.length}] ${text}`);
    console.log(`  → ${result.label} ${SentimentUtils.getEmoji(result)}`);

    // Show running statistics
    const total = i + 1;
    console.log(`  Running stats: +${sentiments.positive} =${sentiments.neutral} -${sentiments.negative}`);
    console.log(`  Average sentiment: ${(totalScore / total).toFixed(2)}\n`);
  }
}

/**
 * Sentiment distribution analysis
 */
async function sentimentDistribution() {
  console.log('\n=== Sentiment Distribution Analysis ===\n');

  const analyzer = new SentimentAnalyzer();

  const text = "The product is generally good, but has some issues.";

  console.log(`Analyzing: "${text}"\n`);

  const distribution = await analyzer.getSentimentDistribution(text);

  console.log('Sentiment Distribution:');
  for (const [label, score] of Object.entries(distribution)) {
    const percentage = (score * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(score * 50));
    console.log(`${label.padEnd(10)}: ${bar} ${percentage}%`);
  }
}

/**
 * Main demo function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Sentiment Analysis Demo - Elide NLP  ║');
  console.log('║   Powered by Elide Polyglot            ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await basicSentimentAnalysis();
    await batchSentimentAnalysis();
    await aspectBasedSentiment();
    await sentimentComparison();
    await timeSeriesSentiment();
    await multilingualSentiment();
    await realTimeSentimentMonitoring();
    await sentimentDistribution();

    console.log('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  main();
}

export {
  basicSentimentAnalysis,
  batchSentimentAnalysis,
  aspectBasedSentiment,
  sentimentComparison,
  timeSeriesSentiment,
  multilingualSentiment,
  realTimeSentimentMonitoring,
  sentimentDistribution
};
